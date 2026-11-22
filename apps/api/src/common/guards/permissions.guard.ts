import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/require-permissions.decorator.js';
import { RedisService } from '../../core/redis/redis.service.js';
import { PrismaService } from '../../core/prisma/prisma.service.js';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private redisService: RedisService,
    private prisma: PrismaService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()]
    );

    // If no specific permissions are required on this endpoint, allow access
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user || !user.id) {
      throw new ForbiddenException('User context missing');
    }

    // Super Admin role bypasses granular permission checks
    if (user.roles && user.roles.includes('Super Admin')) {
      return true;
    }

    const cacheKey = `perm:${user.id}`;
    let userPermissions: string[] | null = null;

    try {
      const cached = await this.redisService.get(cacheKey);
      if (cached) {
        userPermissions = JSON.parse(cached);
      }
    } catch {
      // Continue to DB if Redis fails
    }

    if (!userPermissions) {
      // Query database for all permissions assigned across user's active roles
      const userWithRoles = await this.prisma.user.findUnique({
        where: { id: user.id },
        include: {
          roles: {
            include: {
              role: {
                include: {
                  permissions: {
                    include: {
                      permission: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!userWithRoles) {
        throw new ForbiddenException('User not found');
      }

      const permissionSet = new Set<string>();
      for (const ur of userWithRoles.roles) {
        for (const rp of ur.role.permissions) {
          permissionSet.add(rp.permission.name);
        }
      }

      userPermissions = Array.from(permissionSet);

      // Cache in Redis for 15 minutes (900 seconds)
      try {
        await this.redisService.set(cacheKey, JSON.stringify(userPermissions), 900);
      } catch {
        // Redis cache failure non-fatal
      }
    }

    // Verify user has ALL required permissions
    const hasAllPermissions = requiredPermissions.every((perm) =>
      userPermissions!.includes(perm)
    );

    if (!hasAllPermissions) {
      throw new ForbiddenException(
        `Insufficient permissions: missing ${requiredPermissions.filter((p) => !userPermissions!.includes(p)).join(', ')}`
      );
    }

    return true;
  }
}
