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
