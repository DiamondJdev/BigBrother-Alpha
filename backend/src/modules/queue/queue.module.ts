import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { QueueService } from './queue.service';
import { QueueController } from './queue.controller';
import { Redis } from '@upstash/redis';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [ConfigModule, forwardRef(() => CommonModule)],
  controllers: [QueueController],
  providers: [
    {
      provide: 'REDIS_CLIENT',
      useFactory: (configService: ConfigService) => {
        const url = configService.getOrThrow<string>('UPSTASH_REDIS_REST_URL');
        const token = configService.getOrThrow<string>('UPSTASH_REDIS_REST_TOKEN');
        return new Redis({ url, token });
      },
      inject: [ConfigService],
    },
    QueueService,
  ],
  exports: [QueueService],
})
export class QueueModule {}