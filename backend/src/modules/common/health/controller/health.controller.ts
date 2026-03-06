import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { DbService } from '../../../db/db.service';

@Controller()
export class HealthController {
	constructor(private readonly dbService: DbService) {}
	
	/**
	* Root endpoint for API health check
	* Checks the status of database and backend services
	*/
	@Get('/health')
	@HttpCode(HttpStatus.OK)
	async getHealth() {
		// Default to unhealthy, prove otherwise
		let databaseStatus = 'unhealthy';
		let dbLatency = null as number | null;
		let backendStatus = 'unhealthy';

		// TODO: Add logging - Log health check initiated
		const start = Date.now();

		// TODO: Add more service checks
		try {
			const dbHealth = await this.dbService.healthCheck();
			dbLatency = Date.now() - start;
			databaseStatus = dbLatency < 1000 && dbHealth ? 'healthy' : 'unhealthy';
			backendStatus = 'healthy';
		} catch {
			backendStatus = 'unhealthy';
		}
		
		// TODO: Move response formatting to DTO and use DTO in logging and return 
		return {
			message: "BigBrother API is up and running!",
			version: "0.0.1", // TODO: Dynamically pull version from package.json
			database: {
				status: databaseStatus,
				latency: dbLatency + ' ms',
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

