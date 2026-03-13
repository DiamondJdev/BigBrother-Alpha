import { Module } from '@nestjs/common';
import { HealthController } from './health/controller/health.controller';
import { DbModule } from '../db/db.module';
import { LoggerService } from './logging/services/logger.service';
import { LoggingInterceptor } from './logging/interceptors/logging.interceptors';
import { MetricsService } from './metrics/metrics.service';

@Module({
    imports: [DbModule],
    controllers: [HealthController],
    providers: [LoggerService, LoggingInterceptor, MetricsService],
    exports: [LoggerService, LoggingInterceptor, MetricsService],
})
export class CommonModule {}
