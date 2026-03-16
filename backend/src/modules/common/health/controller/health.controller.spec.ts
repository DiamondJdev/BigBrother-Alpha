import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { DbService } from '../../../db/db.service';
import { CacheService } from '../../../cache/cache.service';
import { QueueService } from '../../../queue/queue.service';
import { ObjectStorageService } from '../../../object-storage/object-storage.service';
import { LoggerService } from '../../logging/services/logger.service';

describe('HealthController', () => {
  let controller: HealthController;

  const mockDbService = { healthCheck: jest.fn().mockResolvedValue(true) };
  const mockCacheService = { ping: jest.fn().mockResolvedValue(true) };
  const mockQueueService = { ping: jest.fn().mockResolvedValue(true) };
  const mockObjectStorageService = { ping: jest.fn().mockResolvedValue(true) };
  const mockLoggerService = { log: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        { provide: DbService, useValue: mockDbService },
        { provide: CacheService, useValue: mockCacheService },
        { provide: QueueService, useValue: mockQueueService },
        { provide: ObjectStorageService, useValue: mockObjectStorageService },
        { provide: LoggerService, useValue: mockLoggerService },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return healthy cache status when ping succeeds', async () => {
    mockCacheService.ping.mockResolvedValue(true);
    const result = await controller.getHealth();
    expect(result.cache.status).toBe('healthy');
  });

  it('should return unhealthy cache status when ping fails', async () => {
    mockCacheService.ping.mockResolvedValue(false);
    const result = await controller.getHealth();
    expect(result.cache.status).toBe('unhealthy');
    // Reset for other tests
    mockCacheService.ping.mockResolvedValue(true);
  });
});
