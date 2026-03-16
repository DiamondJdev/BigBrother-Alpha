import { Controller, Post, Body, Get, Delete, Param, UseGuards } from '@nestjs/common';
import { ObjectStorageService } from './object-storage.service';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { BodyRequiredGuard } from '../auth/guard/body-required.guard';
import { UploadObjectDto } from './dto/uploadObject.dto';

@Controller('storage')
@UseGuards(JwtAuthGuard)
export class ObjectStorageController {
  constructor(private readonly storageService: ObjectStorageService) {}

  @Post('upload')
  @UseGuards(BodyRequiredGuard)
  async upload(@Body() body: UploadObjectDto) {
    const buffer = Buffer.from(body.data, 'base64');
    await this.storageService.upload(body.key, buffer);
    return { message: 'File uploaded' };
  }

  @Get('download/:key')
  async download(@Param('key') key: string) {
    const buffer = await this.storageService.download(key);
    return { data: buffer.toString('base64') };
  }

  @Delete('delete/:key')
  async delete(@Param('key') key: string) {
    await this.storageService.delete(key);
    return { message: 'File deleted' };
  }
}
