import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from '@upstash/redis';

/**
 * Thin wrapper around the Upstash Redis HTTP client.
 *
 * All methods swallow errors and log warnings rather than throwing — a cache
 * failure must never take down a request. The underlying DB call will proceed
 * as the fallback in every case.
 *
 * The Redis instance connects lazily on the first command; no connection pool
 * or lifecycle hooks are required with the HTTP-based Upstash client.
 */
@Injectable()
export class CacheService {
  private readonly redis: Redis;
  private readonly logger = new Logger(CacheService.name);

  constructor(private readonly configService: ConfigService) {
    const url = this.configService.getOrThrow<string>('UPSTASH_REDIS_REST_URL');
    const token = this.configService.getOrThrow<string>('UPSTASH_REDIS_REST_TOKEN');
    this.redis = new Redis({ url, token });
  }

  /**
   * Returns the cached value for `key`, or `null` on a miss or error.
   * Upstash automatically deserialises the stored JSON back to `T`.
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      return await this.redis.get<T>(key);
    } catch (error) {
      this.logger.warn(`Cache GET failed for key "${key}": ${(error as Error).message}`);
      return null;
    }
  }

  /**
   * Stores `value` under `key` with an absolute TTL in seconds.
   * Upstash serialises the value to JSON before writing.
   */
  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    try {
      await this.redis.set(key, value, { ex: ttlSeconds });
    } catch (error) {
      this.logger.warn(`Cache SET failed for key "${key}": ${(error as Error).message}`);
    }
  }

  /**
   * Deletes one or more keys atomically via a single Redis DEL command.
   * Safe to call with an empty list — returns immediately without hitting Redis.
   */
  async del(...keys: string[]): Promise<void> {
    if (keys.length === 0) return;
    try {
      await this.redis.del(...keys);
    } catch (error) {
      this.logger.warn(`Cache DEL failed for keys [${keys.join(', ')}]: ${(error as Error).message}`);
    }
  }
}
