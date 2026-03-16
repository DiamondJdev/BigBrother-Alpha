import { Injectable, Inject, Logger, NotFoundException } from '@nestjs/common';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadBucketCommand } from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ObjectStorageService {
  private readonly logger = new Logger(ObjectStorageService.name);
  private readonly bucket: string;

  constructor(
    @Inject('S3_CLIENT') private readonly s3: S3Client,
    configService: ConfigService,
  ) {
    this.bucket = configService.getOrThrow<string>('S3_BUCKET');
  }

  async upload(key: string, body: Buffer, contentType?: string): Promise<void> {
    await this.s3.send(new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    }));
    this.logger.log(`Uploaded file to ${key}`);
  }

  async download(key: string): Promise<Buffer> {
    const result = await this.s3.send(new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    }));
    if (!result.Body) {
      throw new NotFoundException(`Object not found: ${key}`);
    }
    const buffer = Buffer.from(await result.Body.transformToByteArray());
    this.logger.log(`Downloaded file from ${key}`);
    return buffer;
  }

  async delete(key: string): Promise<void> {
    await this.s3.send(new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    }));
    this.logger.log(`Deleted file at ${key}`);
  }

  async ping(): Promise<boolean> {
    try {
      await this.s3.send(new HeadBucketCommand({ Bucket: this.bucket }));
      return true;
    } catch (error) {
      this.logger.warn(`Object storage ping failed: ${(error as Error).message}`);
      return false;
    }
  }
}
