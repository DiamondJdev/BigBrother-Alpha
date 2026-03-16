import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { QueueService } from './queue.service';
import { QueueStatusDto } from './dto/queueStatus.dto';
import { enqueueJobDto } from './dto/enqueueJob.dto';
import { BodyRequiredGuard } from '../auth/guard/body-required.guard';

@Controller('queue')
@UseGuards(JwtAuthGuard)
export class QueueController {
  constructor(private readonly queueService: QueueService) {}

  @Post('enqueue')
  @UseGuards(BodyRequiredGuard)
  async enqueue(@Body() body: enqueueJobDto) {
    await this.queueService.enqueue(body.queueName, body.job);
    return { message: 'Job enqueued' };
  }

  @Post('status')
  @UseGuards(BodyRequiredGuard)
  async status(@Body() body: QueueStatusDto) {
    const length = await this.queueService.getQueueLength(body.queueName);
    return { queueLength: length };
  }
}