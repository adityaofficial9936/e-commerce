import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';
import { SignUploadDto } from '@ecommerce/contracts';

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);
  private s3Client: S3Client;
  private bucket: string;
  private endpoint: string;

  constructor(private readonly configService: ConfigService) {
    this.bucket = this.configService.get<string>('S3_BUCKET', 'ecommerce-media');
    this.endpoint = this.configService.get<string>('S3_ENDPOINT', 'http://localhost:9000');
    const region = this.configService.get<string>('S3_REGION', 'us-east-1');
    const accessKeyId = this.configService.get<string>('S3_ACCESS_KEY', 'minioadmin');
    const secretAccessKey = this.configService.get<string>('S3_SECRET_KEY', 'minioadmin');

    this.s3Client = new S3Client({
      region,
      endpoint: this.endpoint,
      forcePathStyle: true, // Needed for local MinIO compatibility
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }

  async createPresignedUploadUrl(dto: SignUploadDto) {
    const ext = dto.filename.split('.').pop() || 'jpg';
    const key = `${dto.folder}/${Date.now()}-${randomUUID().slice(0, 8)}.${ext}`;

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: dto.contentType,
    });

    // 15 minutes TTL for upload window
    const uploadUrl = await getSignedUrl(this.s3Client, command, {
      expiresIn: 900,
    });

    const publicUrl = `${this.endpoint}/${this.bucket}/${key}`;

    return {
      uploadUrl,
      publicUrl,
      key,
      expiresInSeconds: 900,
    };
  }
}
