import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { DbService } from '../../../db/db.service';
import { CacheService } from '../../../cache/cache.service';
import { QueueService } from '../../../queue/queue.service';
import { ObjectStorageService } from '../../../object-storage/object-storage.service';
import { LoggerService } from '../../logging/services/logger.service';

@Controller()
export class HealthController {	constructor(
		private readonly dbService: DbService,
		private readonly cacheService: CacheService,
		private readonly queueService: QueueService,
		private readonly objectStorageService: ObjectStorageService,
		private readonly logger: LoggerService,
	) {}
	
	/**
	* Root endpoint for API health check
	* Checks the status of database and backend services
	*/
	@Get('/health')
	@HttpCode(HttpStatus.OK)
	async getHealth() {
		// Overall Status, default to unhealthy
		let backendStatus = 'unhealthy';
		// PostgreSQL database status
		let databaseStatus = 'unhealthy';
		let dbLatency = null as number | null;
		// Upstash Redis status
		let cacheStatus = 'unhealthy';
		let cacheLatency = null as number | null;
		// Queue status
		let queueStatus = 'unhealthy';
		let queueLatency = null as number | null;
		// Object storage status
		let storageStatus = 'unhealthy';
		let storageLatency = null as number | null;

		const start = Date.now();
		this.logger.debug(`Performing health check...`, "HealthController");

		// TODO: Add more service checks
		try {
			const dbHealth = await this.dbService.healthCheck();
			dbLatency = Date.now() - start;
			databaseStatus = dbLatency < 1000 && dbHealth ? 'healthy' : 'unhealthy';
			backendStatus = 'healthy';
		} catch {
			backendStatus = 'unhealthy';
		}

		const cacheStart = Date.now();
		const cacheAlive = await this.cacheService.ping();
		cacheLatency = Date.now() - cacheStart;
		cacheStatus = cacheAlive && cacheLatency < 1000 ? 'healthy' : 'unhealthy';

		const queueStart = Date.now();
		const queueAlive = await this.queueService.ping();
		queueLatency = Date.now() - queueStart;
		queueStatus = queueAlive && queueLatency < 1000 ? 'healthy' : 'unhealthy';

		const storageStart = Date.now();
		const storageAlive = await this.objectStorageService.ping();
		storageLatency = Date.now() - storageStart;
		storageStatus = storageAlive && storageLatency < 1000 ? 'healthy' : 'unhealthy';
		
		// TODO: Move response formatting to DTO and use DTO in logging and return 
		return {
			message: "BigBrother API is up and running!",
			version: "0.0.1", // TODO: Dynamically pull version from package.json
			database: {
				status: databaseStatus,
				latency: dbLatency + ' ms',
			},
			cache: {
				status: cacheStatus,
				latency: cacheLatency + ' ms',
			},
			queue: {
				status: queueStatus,
				latency: queueLatency + ' ms',
			},
			storage: {
				status: storageStatus,
				latency: storageLatency + ' ms',
			},
			backend: {
				status: backendStatus,
				uptime: Math.floor(process.uptime()) + ' seconds',
			},
			timestamp: new Date().toISOString(),
			mode: process.env.NODE_ENV || 'mode not set',
		};
	}
}

