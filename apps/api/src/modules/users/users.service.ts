import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import {
  UpdateProfileDto,
  CreateAddressDto,
  UpdateAddressDto,
} from '@ecommerce/contracts';
import { PrismaService } from '../../core/prisma/prisma.service.js';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
        addresses: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User profile not found');
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      isEmailVerified: user.isEmailVerified,
      roles: user.roles.map((r) => r.role.name),
      addresses: user.addresses,
      createdAt: user.createdAt,
    };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.name ? { name: dto.name } : {}),
        ...(dto.phone ? { phone: dto.phone } : {}),
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        updatedAt: true,
      },
    });

    return user;
  }

  async getAddresses(userId: string) {
    return this.prisma.address.findMany({
      where: {
        userId,
        deletedAt: null,
      },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async createAddress(userId: string, dto: CreateAddressDto) {
    // If set as default, remove default flag from other addresses
    if (dto.isDefault) {
      await this.prisma.address.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }

    return this.prisma.address.create({
      data: {
        userId,
        name: dto.name,
        phone: dto.phone,
        street: dto.street,
        city: dto.city,
        state: dto.state,
        pincode: dto.pincode,
        country: dto.country || 'India',
        isDefault: dto.isDefault || false,
      },
    });
  }

  async updateAddress(userId: string, addressId: string, dto: UpdateAddressDto) {
    // Strict ownership validation
    const address = await this.prisma.address.findFirst({
      where: { id: addressId, userId, deletedAt: null },
    });

    if (!address) {
      throw new NotFoundException('Address not found');
    }

    if (dto.isDefault) {
      await this.prisma.address.updateMany({
        where: { userId, NOT: { id: addressId } },
        data: { isDefault: false },
      });
    }

    return this.prisma.address.update({
      where: { id: addressId },
      data: dto,
    });
  }

  async deleteAddress(userId: string, addressId: string) {
    // Strict ownership validation
    const address = await this.prisma.address.findFirst({
      where: { id: addressId, userId, deletedAt: null },
    });

    if (!address) {
      throw new NotFoundException('Address not found');
    }

    // Soft delete
    await this.prisma.address.update({
      where: { id: addressId },
      data: { deletedAt: new Date() },
    });

    return { message: 'Address removed successfully' };
  }
}
