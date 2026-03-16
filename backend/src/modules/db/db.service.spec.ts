import { Test, TestingModule } from "@nestjs/testing";
import { DbService } from "./db.service";
import { CacheService } from "../cache/cache.service";

describe("DbService", () => {
  let service: DbService;

  beforeEach(async () => {
    const mockUserRepository = {
      query: jest.fn().mockResolvedValue([]),
      find: jest.fn().mockResolvedValue([]),
      findOneBy: jest.fn().mockResolvedValue(null),
      findOne: jest.fn().mockResolvedValue(null),
      save: jest.fn(),
      update: jest.fn().mockResolvedValue({ affected: 1 }),
      delete: jest.fn().mockResolvedValue({ affected: 1 }),
    };
    const mockCacheService = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue(undefined),
      del: jest.fn().mockResolvedValue(undefined),
      ping: jest.fn().mockResolvedValue(true),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DbService,
        { provide: "UserRepository", useValue: mockUserRepository },
        { provide: CacheService, useValue: mockCacheService },
      ],
    }).compile();

    service = module.get<DbService>(DbService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
