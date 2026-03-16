import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { ObjectStorageService } from './object-storage.service';

@Controller('storage')
export class ObjectStorageController {
  constructor(private readonly storageService: ObjectStorageService) {}

  @Post('upload')
  async upload(@Body() body: { key: string; data: string }) {
    const buffer = Buffer.from(body.data, 'base64');
    await this.storageService.upload(body.key, buffer);
    return { message: 'File uploaded' };
  }

  @Get('download/:key')
  async download(@Param('key') key: string) {
    const buffer = await this.storageService.download(key);
    return { data: buffer.toString('base64') };
  }
}