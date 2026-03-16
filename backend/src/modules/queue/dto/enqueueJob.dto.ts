import { IsString, IsNotEmpty, IsObject } from 'class-validator';

export class EnqueueJobDto {
  @IsString()
  @IsNotEmpty()
  queueName!: string;

  @IsObject()
  @IsNotEmpty()
  job!: Record<string, unknown>;
}
