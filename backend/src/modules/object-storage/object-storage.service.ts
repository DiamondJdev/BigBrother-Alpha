import { Injectable, Inject, Logger } from '@nestjs/common';
import { S3Client, PutObjectCommand, GetObjectCommand, HeadBucketCommand } from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ObjectStorageService {
  private readonly logger = new Logger(ObjectStorageService.name);

  constructor(
    @Inject('S3_CLIENT') private readonly s3: S3Client,
    private readonly configService: ConfigService,
  ) {}

  async upload(key: string, body: Buffer, contentType?: string): Promise<void> {
    const bucket = this.configService.getOrThrow('S3_BUCKET');
    await this.s3.send(new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    }));
    this.logger.log(`Uploaded file to ${key}`);
  }

  async download(key: string): Promise<Buffer> {
    const bucket = this.configService.getOrThrow('S3_BUCKET');
    const result = await this.s3.send(new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    }));
    const buffer = Buffer.from(await result.Body.transformToByteArray());
    this.logger.log(`Downloaded file from ${key}`);
    return buffer;
  }

  async ping(): Promise<boolean> {
    try {
      const bucket = this.configService.getOrThrow('S3_BUCKET');
      await this.s3.send(new HeadBucketCommand({ Bucket: bucket }));
      return true;
    } catch (error) {
      this.logger.warn(`Object storage ping failed: ${(error as Error).message}`);
      return false;
    }
  }
}