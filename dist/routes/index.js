"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerRoutes = registerRoutes;
const test_runs_routes_1 = require("./test-runs.routes");
const artifacts_routes_1 = require("./artifacts.routes");
const prisma_1 = require("../lib/prisma");
const docker_1 = require("../lib/docker");
async function registerRoutes(app) {
    // Health check with Docker + DB connectivity
    app.get('/api/v1/health', async (_request, reply) => {
        let dbStatus = 'disconnected';
        let dockerStatus = 'disconnected';
        // Check database
        try {
            await prisma_1.prisma.$queryRaw `SELECT 1`;
            dbStatus = 'connected';
        }
        catch {
            dbStatus = 'disconnected';
        }
        // Check Docker daemon
        try {
            await docker_1.docker.ping();
            dockerStatus = 'connected';
        }
        catch {
            dockerStatus = 'disconnected';
        }
        const isHealthy = dbStatus === 'connected' && dockerStatus === 'connected';
        return reply.status(isHealthy ? 200 : 503).send({
            status: isHealthy ? 'healthy' : 'degraded',
            database: dbStatus,
            docker: dockerStatus,
            uptime_seconds: Math.round(process.uptime()),
            timestamp: new Date().toISOString(),
        });
    });
    // API routes
    await app.register(test_runs_routes_1.registerTestRunRoutes, { prefix: '/api/v1' });
    await app.register(artifacts_routes_1.registerArtifactRoutes, { prefix: '/api/v1' });
}
//# sourceMappingURL=index.js.map