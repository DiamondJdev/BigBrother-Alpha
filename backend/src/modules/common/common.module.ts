import { Module } from '@nestjs/common';
import { HealthController } from './health/controller/health.controller';
import { DbModule } from '../db/db.module';
import { LoggerService } from './logging/services/logger.service';
import { LoggingInterceptor } from './logging/interceptors/logging.interceptor';
import { MetricsService } from './metrics/metrics.service';
import { QueueModule } from '../queue/queue.module';
import { ObjectStorageModule } from '../object-storage/object-storage.module';

@Module({
    imports: [DbModule, QueueModule, ObjectStorageModule],
    controllers: [HealthController],
    providers: [LoggerService, LoggingInterceptor, MetricsService],
    exports: [LoggerService, LoggingInterceptor, MetricsService],
})
export class CommonModule {}
