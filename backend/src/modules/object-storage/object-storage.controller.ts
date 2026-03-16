import { Controller, Post, Body, Get, Param, UseGuards } from '@nestjs/common';
import { ObjectStorageService } from './object-storage.service';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { BodyRequiredGuard } from '../auth/guard/body-required.guard';

@Controller('storage')
@UseGuards(JwtAuthGuard)
export class ObjectStorageController {
  constructor(private readonly storageService: ObjectStorageService) {}

  @Post('upload')
  @UseGuards(BodyRequiredGuard)
  async upload(@Body() body: { key: string; data: string }) {
    const buffer = Buffer.from(body.data, 'base64');
    await this.storageService.upload(body.key, buffer);
    return { message: 'File uploaded' };
  }

  @Get('download/:key')
  @UseGuards(BodyRequiredGuard)
  async download(@Param('key') key: string) {
    const buffer = await this.storageService.download(key);
    return { data: buffer.toString('base64') };
  }
}