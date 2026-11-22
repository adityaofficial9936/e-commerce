import { AuthService } from './auth.service.js';
import { PrismaService } from '../../core/prisma/prisma.service.js';
import { RedisService } from '../../core/redis/redis.service.js';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { HashUtil } from '../../common/utils/hash.js';

describe('AuthService', () => {
  let service: AuthService;
  let mockPrisma: any;
  let mockRedis: any;
  let mockJwt: any;
  let mockConfig: any;

  beforeEach(() => {
    mockPrisma = {
      user: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      role: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      refreshToken: {
        create: jest.fn(),
        findFirst: jest.fn(),
        delete: jest.fn(),
        deleteMany: jest.fn(),
      },
    };

    mockRedis = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    };

    mockJwt = {
      sign: jest.fn().mockReturnValue('mock-jwt-token'),
      verify: jest.fn(),
    };

    mockConfig = {
      get: jest.fn().mockReturnValue('mock-secret-key-min-16-chars'),
    };

    service = new AuthService(
      mockPrisma as PrismaService,
      mockRedis as RedisService,
      mockJwt as JwtService,
      mockConfig as ConfigService
    );
  });

  describe('register', () => {
    it('should throw ConflictException if email is already taken', async () => {
      mockPrisma.user.findFirst.mockResolvedValue({
        id: '1',
        email: 'test@example.com',
      });

      await expect(
        service.register({
          email: 'test@example.com',
          password: 'password123',
          name: 'Test User',
        })
      ).rejects.toThrow(ConflictException);
    });

    it('should successfully register a customer and return tokens', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);
      mockPrisma.role.findUnique.mockResolvedValue({ id: 'role-1', name: 'Customer' });
      mockPrisma.user.create.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        phone: null,
        roles: [{ role: { name: 'Customer' } }],
      });

      const result = await service.register({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      });

      expect(result.user.email).toBe('test@example.com');
      expect(result.accessToken).toBe('mock-jwt-token');
      expect(result.refreshToken).toBe('mock-jwt-token');
      expect(mockPrisma.refreshToken.create).toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should throw UnauthorizedException if user does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.login({
          email: 'notfound@example.com',
          password: 'password123',
        })
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password hash does not match', async () => {
      const wrongHash = await HashUtil.hash('different-password');
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        passwordHash: wrongHash,
        roles: [],
      });

      await expect(
        service.login({
          email: 'test@example.com',
          password: 'password123',
        })
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should successfully authenticate user with matching password', async () => {
      const validHash = await HashUtil.hash('correct-password');
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        passwordHash: validHash,
        roles: [{ role: { name: 'Customer' } }],
      });

      const result = await service.login({
        email: 'test@example.com',
        password: 'correct-password',
      });

      expect(result.user.email).toBe('test@example.com');
      expect(result.accessToken).toBe('mock-jwt-token');
    });
  });

  describe('logout', () => {
    it('should delete user refresh tokens and clear redis permission cache', async () => {
      await service.logout('user-1');

      expect(mockPrisma.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
      });
      expect(mockRedis.del).toHaveBeenCalledWith('perm:user-1');
    });
  });
});
