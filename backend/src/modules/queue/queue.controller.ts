import { Controller, Post, Body } from '@nestjs/common';
import { QueueService } from './queue.service';

@Controller('queue')
export class QueueController {
  constructor(private readonly queueService: QueueService) {}

  @Post('enqueue')
  async enqueue(@Body() body: { queueName: string; job: any }) {
    await this.queueService.enqueue(body.queueName, body.job);
    return { message: 'Job enqueued' };
  }

  @Post('status')
  async status(@Body() body: { queueName: string }) {
    const length = await this.queueService.getQueueLength(body.queueName);
    return { queueLength: length };
  }
}