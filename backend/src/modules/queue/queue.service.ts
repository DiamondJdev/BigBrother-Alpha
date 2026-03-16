import { Injectable, Inject, Logger } from '@nestjs/common';
import { Redis } from '@upstash/redis';

@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);

  constructor(
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
  ) {}

  async enqueue(queueName: string, job: Record<string, unknown>, correlationId?: string): Promise<void> {
    const jobWithId = { ...job, correlationId };
    await this.redis.lpush(queueName, JSON.stringify(jobWithId));
    this.logger.log(`Enqueued job to ${queueName}`, QueueService.name);
  }

  async dequeue(queueName: string): Promise<Record<string, unknown> | null> {
    const result = await this.redis.rpop<string>(queueName);
    if (result) {
      const job = JSON.parse(result) as Record<string, unknown>;
      this.logger.log(`Dequeued job from ${queueName}`, QueueService.name);
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
