import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SignUploadDto, Permissions } from '@ecommerce/contracts';
import { MediaService } from './media.service.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../common/guards/permissions.guard.js';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator.js';

@ApiTags('Media')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('sign')
  @RequirePermissions(Permissions.PRODUCT_CREATE)
  @ApiOperation({ summary: 'Generate pre-signed direct upload URL for product or CMS images' })
  async signUpload(@Body() dto: SignUploadDto) {
    return this.mediaService.createPresignedUploadUrl(dto);
  }
}
