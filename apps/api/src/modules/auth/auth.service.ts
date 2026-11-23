import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'crypto';
import twilio from 'twilio';
import nodemailer from 'nodemailer';
import {
  RegisterDto,
  LoginDto,
  SendOtpDto,
  VerifyOtpDto,
} from '@ecommerce/contracts';
import { PrismaService } from '../../core/prisma/prisma.service.js';
import { RedisService } from '../../core/redis/redis.service.js';
import { HashUtil } from '../../common/utils/hash.js';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) {}

  /**
   * Register a new customer
   */
  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: dto.email.toLowerCase() },
          ...(dto.phone ? [{ phone: dto.phone }] : []),
        ],
      },
    });

    if (existing) {
      if (existing.email === dto.email.toLowerCase()) {
        throw new ConflictException('Email is already registered');
      }
      throw new ConflictException('Phone number is already registered');
    }

    const passwordHash = await HashUtil.hash(dto.password);

    // Fetch default Customer role
    let customerRole = await this.prisma.role.findUnique({
      where: { name: 'Customer' },
    });

    if (!customerRole) {
      customerRole = await this.prisma.role.create({
        data: {
          name: 'Customer',
          description: 'Registered customer',
        },
      });
    }

    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        name: dto.name,
        phone: dto.phone,
        passwordHash,
        roles: {
          create: {
            roleId: customerRole.id,
          },
        },
      },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    const roles = user.roles.map((r) => r.role.name);
    const tokens = await this.generateTokens(user.id, user.email, user.name, roles);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        roles,
      },
      ...tokens,
    };
  }

  /**
   * Login with email and password
   */
  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isValid = await HashUtil.verify(user.passwordHash, dto.password);
    if (!isValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const roles = user.roles.map((r) => r.role.name);
    const tokens = await this.generateTokens(user.id, user.email, user.name, roles);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        roles,
      },
      ...tokens,
    };
  }

  /**
   * Rotate refresh token and issue new access token
   */
  async refresh(refreshToken: string) {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is required');
    }

    let payload: { sub: string; email: string };
    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>(
          'JWT_REFRESH_SECRET',
          'development-jwt-refresh-secret-min-16-chars'
        ),
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const tokenHash = await HashUtil.hash(refreshToken);

    // Look up token in database
    const tokenRecord = await this.prisma.refreshToken.findFirst({
      where: {
        userId: payload.sub,
        expiresAt: { gt: new Date() },
      },
    });

    // Reuse detection: if token is not found or expired, revoke all tokens for this user
    if (!tokenRecord) {
      this.logger.warn(`Potential token reuse detected for user ${payload.sub}. Revoking all sessions.`);
      await this.prisma.refreshToken.deleteMany({
        where: { userId: payload.sub },
      });
      throw new UnauthorizedException('Invalid session. Please log in again.');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('User no longer exists');
    }

    // Delete used refresh token
    await this.prisma.refreshToken.delete({
      where: { id: tokenRecord.id },
    });

    const roles = user.roles.map((r) => r.role.name);
    const tokens = await this.generateTokens(user.id, user.email, user.name, roles);

    return tokens;
  }

  /**
   * Logout user and revoke refresh token
   */
  async logout(userId: string) {
    await this.prisma.refreshToken.deleteMany({
      where: { userId },
    });

    // Invalidate permission cache
    await this.redis.del(`perm:${userId}`);

    return { message: 'Logged out successfully' };
  }

  /**
   * Send 6-digit OTP code to phone or email
   */
  async sendOtp(dto: SendOtpDto) {
    const rateLimitKey = `otp:rate:${dto.identifier}`;
    const attempts = await this.redis.get(rateLimitKey);

    if (attempts && parseInt(attempts, 10) >= 5) {
      throw new BadRequestException('Too many OTP attempts. Please wait 15 minutes.');
    }

    // Generate random 6-digit code
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpKey = `otp:${dto.identifier}`;

    // Store in Redis with 5-minute TTL (300 seconds)
    await this.redis.set(otpKey, otp, 300);

    // Track rate limit (15-minute window)
    const currentCount = attempts ? parseInt(attempts, 10) + 1 : 1;
    await this.redis.set(rateLimitKey, currentCount.toString(), 900);

    this.logger.log(`[OTP] Generated OTP for ${dto.identifier}: ${otp}`);

    const isEmail = dto.identifier.includes('@');

    // 1. Dispatch Email OTP via Nodemailer
    if (isEmail) {
      const smtpUser = this.configService.get<string>('SMTP_USER');
      const smtpPass = this.configService.get<string>('SMTP_PASS');
      if (smtpUser && smtpPass) {
        try {
          const transporter = nodemailer.createTransport({
            host: this.configService.get<string>('SMTP_HOST', 'smtp.gmail.com'),
            port: Number(this.configService.get<number>('SMTP_PORT', 465)),
            secure: String(this.configService.get('SMTP_SECURE', 'true')) === 'true',
            auth: {
              user: smtpUser,
              pass: smtpPass.replace(/\s+/g, ''),
            },
          });

          await transporter.sendMail({
            from: this.configService.get<string>('EMAIL_FROM', `Moonlet Support <${smtpUser}>`),
            to: dto.identifier,
            subject: `${otp} is your Moonlet verification passcode`,
            html: `
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 28px; border: 1px solid #e0c8b0; border-radius: 16px; background-color: #faf9f5;">
                <h2 style="color: #1a1a1a; margin-top: 0; font-family: Georgia, serif; font-size: 22px;">Moonlet Verification</h2>
                <p style="color: #4a4a4a; font-size: 14px; line-height: 1.5;">Your one-time passcode to sign in or activate your Moonlet account is:</p>
                <div style="background-color: #ffffff; border: 1px solid #d4af37; border-radius: 12px; padding: 18px; text-align: center; margin: 20px 0;">
                  <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1a1a1a; font-family: monospace;">${otp}</span>
                </div>
                <p style="color: #7a7a7a; font-size: 12px; line-height: 1.4;">This passcode is valid for <strong>5 minutes</strong>. If you did not request this, please ignore this email.</p>
                <hr style="border: none; border-top: 1px solid #e0c8b0; margin: 20px 0;" />
                <p style="color: #999999; font-size: 11px; text-align: center;">© 2026 Moonlet Fine Jewelry. All rights reserved.</p>
              </div>
            `,
          });
          this.logger.log(`[Email OTP] Successfully dispatched OTP to ${dto.identifier}`);
        } catch (err: any) {
          this.logger.error(`[Email OTP] Failed to send email via SMTP: ${err?.message}`, err?.stack);
        }
      } else {
        this.logger.warn(`[Email OTP] SMTP credentials not set. Code: ${otp}`);
      }
    } else {
      // 2. Dispatch SMS OTP via Twilio
      const twilioSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
      const twilioAuth = this.configService.get<string>('TWILIO_AUTH_TOKEN');
      const twilioFrom = this.configService.get<string>('TWILIO_PHONE_NUMBER');

      if (twilioSid && twilioAuth && twilioFrom) {
        try {
          const client = twilio(twilioSid, twilioAuth);
          const rawPhone = dto.identifier.replace(/\D/g, '');
          const targetPhone = dto.identifier.startsWith('+')
            ? dto.identifier
            : rawPhone.length === 10
            ? `+91${rawPhone}`
            : `+${rawPhone}`;

          await client.messages.create({
            body: `Your Moonlet verification code is ${otp}. Valid for 5 minutes. Do not share this code.`,
            from: twilioFrom,
            to: targetPhone,
          });
          this.logger.log(`[Twilio SMS] Dispatched OTP SMS to ${targetPhone}`);
        } catch (err: any) {
          this.logger.error(`[Twilio SMS] Failed to send SMS via Twilio: ${err?.message}`, err?.stack);
        }
      } else {
        this.logger.warn(`[Twilio SMS] Twilio credentials not set. Code: ${otp}`);
      }
    }

    return {
      message: 'OTP sent successfully',
      expiresInSeconds: 300,
    };
  }

  /**
   * Verify OTP and log in / register customer
   */
  async verifyOtp(dto: VerifyOtpDto) {
    const otpKey = `otp:${dto.identifier}`;
    const storedOtp = await this.redis.get(otpKey);

    if (!storedOtp || storedOtp !== dto.otp) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    // Invalidate OTP immediately after use
    await this.redis.del(otpKey);

    const isEmail = dto.identifier.includes('@');
    let user = await this.prisma.user.findFirst({
      where: isEmail
        ? { email: dto.identifier.toLowerCase() }
        : { phone: dto.identifier },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    // If new user via OTP, create customer account
    if (!user) {
      let customerRole = await this.prisma.role.findUnique({
        where: { name: 'Customer' },
      });

      if (!customerRole) {
        customerRole = await this.prisma.role.create({
          data: { name: 'Customer' },
        });
      }

      user = await this.prisma.user.create({
        data: {
          email: isEmail ? dto.identifier.toLowerCase() : `user_${dto.identifier}@store.local`,
          name: 'Verified Customer',
          phone: !isEmail ? dto.identifier : null,
          isEmailVerified: isEmail,
          roles: {
            create: {
              roleId: customerRole.id,
            },
          },
        },
        include: {
          roles: {
            include: {
              role: true,
            },
          },
        },
      });
    }

    const roles = user.roles.map((r) => r.role.name);
    const tokens = await this.generateTokens(user.id, user.email, user.name, roles);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        roles,
      },
      ...tokens,
    };
  }

  /**
   * Helper to issue access and rotating refresh tokens
   */
  private async generateTokens(
    userId: string,
    email: string,
    name: string,
    roles: string[]
  ) {
    const accessSecret = this.configService.get<string>(
      'JWT_ACCESS_SECRET',
      'development-jwt-access-secret-min-16-chars'
    );
    const refreshSecret = this.configService.get<string>(
      'JWT_REFRESH_SECRET',
      'development-jwt-refresh-secret-min-16-chars'
    );

    const payload = { sub: userId, email, name, roles };

    const accessToken = this.jwtService.sign(payload, {
      secret: accessSecret,
      expiresIn: '15m',
    });

    const refreshToken = this.jwtService.sign(
      { sub: userId, email },
      {
        secret: refreshSecret,
        expiresIn: '7d',
      }
    );

    // Store hashed refresh token in PostgreSQL
    const tokenHash = await HashUtil.hash(refreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken,
    };
  }
}
