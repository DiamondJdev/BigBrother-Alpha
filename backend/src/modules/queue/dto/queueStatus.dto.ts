import { IsString, IsNotEmpty } from 'class-validator';

export class QueueStatusDto {
  @IsString()
  @IsNotEmpty()
  queueName!: string;
}