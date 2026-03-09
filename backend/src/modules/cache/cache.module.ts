import { Global, Module } from '@nestjs/common';
import { CacheService } from './cache.service';

/**
 * Global cache module for Upstash Redis.
 *
 * Marked @Global so that any module that imports AppModule gains access to
 * CacheService without explicitly importing CacheModule again.
 *
 * CacheModule must be imported once in AppModule.
 */
@Global()
@Module({
  providers: [CacheService],
  exports: [CacheService],
})
export class CacheModule {}
