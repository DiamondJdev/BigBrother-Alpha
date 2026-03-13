import { Injectable, Inject, Logger } from '@nestjs/common';
import { Redis } from '@upstash/redis';
import { LoggerService } from '../common/logging/services/logger.service';

@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);

  constructor(
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
    private readonly loggerService: LoggerService,
  ) {}

  async enqueue(queueName: string, job: any, correlationId?: string): Promise<void> {
    const jobWithId = { ...job, correlationId };
    await this.redis.lpush(queueName, JSON.stringify(jobWithId));
    this.loggerService.log(`Enqueued job to ${queueName}`, 'QueueService', { correlationId });
  }

  async dequeue(queueName: string): Promise<any | null> {
    const result = await this.redis.brpop(queueName, 0);
    if (result) {
      const job = JSON.parse(result[1]);
      this.loggerService.log(`Dequeued job from ${queueName}`, 'QueueService', { correlationId: job.correlationId });
      return job;
    }
    return null;
  }

  async getQueueLength(queueName: string): Promise<number> {
    return await this.redis.llen(queueName);
  }

  async ping(): Promise<boolean> {
    try {
      await this.redis.ping();
      return true;
    } catch (error) {
      this.logger.warn(`Queue ping failed: ${(error as Error).message}`);
      return false;
    }
  }
}