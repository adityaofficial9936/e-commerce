import { PermissionsGuard } from './permissions.guard.js';
import { Reflector } from '@nestjs/core';
import { ForbiddenException, ExecutionContext } from '@nestjs/common';
import { RedisService } from '../../core/redis/redis.service.js';
import { PrismaService } from '../../core/prisma/prisma.service.js';

describe('PermissionsGuard', () => {
  let guard: PermissionsGuard;
  let mockReflector: Partial<Reflector>;
  let mockRedis: Partial<RedisService>;
  let mockPrisma: any;

  beforeEach(() => {
    mockReflector = {
      getAllAndOverride: jest.fn(),
    };
    mockRedis = {
      get: jest.fn(),
      set: jest.fn(),
    };
    mockPrisma = {
      user: {
        findUnique: jest.fn(),
      },
    };

    guard = new PermissionsGuard(
      mockReflector as Reflector,
      mockRedis as RedisService,
      mockPrisma as PrismaService
    );
  });

  const createMockContext = (user: any): ExecutionContext =>
    ({
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    } as any);

  it('should allow access if no permissions are required', async () => {
    (mockReflector.getAllAndOverride as jest.Mock).mockReturnValue(undefined);

    const context = createMockContext({ id: 'user-1' });
    const result = await guard.canActivate(context);

    expect(result).toBe(true);
  });

  it('should bypass permission check for Super Admin', async () => {
    (mockReflector.getAllAndOverride as jest.Mock).mockReturnValue(['product:create']);

    const context = createMockContext({ id: 'admin-1', roles: ['Super Admin'] });
    const result = await guard.canActivate(context);

    expect(result).toBe(true);
  });

  it('should grant access when user has the required permission cached in Redis', async () => {
    (mockReflector.getAllAndOverride as jest.Mock).mockReturnValue(['order:read']);
    (mockRedis.get as jest.Mock).mockResolvedValue(JSON.stringify(['order:read', 'order:update']));

    const context = createMockContext({ id: 'staff-1', roles: ['Order Manager'] });
    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
  });

  it('should deny access when user lacks the required permission', async () => {
    (mockReflector.getAllAndOverride as jest.Mock).mockReturnValue(['product:delete']);
    (mockRedis.get as jest.Mock).mockResolvedValue(JSON.stringify(['order:read']));

    const context = createMockContext({ id: 'staff-1', roles: ['Order Manager'] });

    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
  });
});
