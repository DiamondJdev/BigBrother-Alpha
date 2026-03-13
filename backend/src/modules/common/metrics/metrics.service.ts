import { Injectable } from '@nestjs/common';

@Injectable()
export class MetricsService {
  private queueDepth = 0;
  private jobFailures = 0;
  private jobDurations: number[] = [];

  incrementQueueDepth() {
    this.queueDepth++;
  }

  decrementQueueDepth() {
    this.queueDepth = Math.max(0, this.queueDepth - 1);
  }

  incrementJobFailures() {
    this.jobFailures++;
  }

  recordJobDuration(duration: number) {
    this.jobDurations.push(duration);
    if (this.jobDurations.length > 100) {
      this.jobDurations.shift(); // keep last 100
    }
  }

  getMetrics() {
    const avgDuration = this.jobDurations.length > 0
      ? this.jobDurations.reduce((a, b) => a + b, 0) / this.jobDurations.length
      : 0;
    return {
      queueDepth: this.queueDepth,
      jobFailures: this.jobFailures,
      averageJobDuration: avgDuration,
    };
  }
}