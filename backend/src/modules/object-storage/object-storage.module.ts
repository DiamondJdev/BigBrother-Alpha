import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ObjectStorageService } from './object-storage.service';
import { ObjectStorageController } from './object-storage.controller';
import { S3Client } from '@aws-sdk/client-s3';

@Module({
  imports: [ConfigModule],
  controllers: [ObjectStorageController],
  providers: [
    {
      provide: 'S3_CLIENT',
      useFactory: (configService: ConfigService) => {
        return new S3Client({
          region: configService.getOrThrow('AWS_REGION'),
          credentials: {
            accessKeyId: configService.getOrThrow('AWS_ACCESS_KEY_ID'),
            secretAccessKey: configService.getOrThrow('AWS_SECRET_ACCESS_KEY'),
          },
        });
      },
      inject: [ConfigService],
    },
    ObjectStorageService,
  ],
  exports: [ObjectStorageService],
})
export class ObjectStorageModule {}