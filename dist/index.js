"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_1 = __importDefault(require("fastify"));
const multipart_1 = __importDefault(require("@fastify/multipart"));
const cors_1 = __importDefault(require("@fastify/cors"));
const config_1 = require("./config");
const prisma_1 = require("./lib/prisma");
const docker_1 = require("./lib/docker");
const errors_1 = require("./errors");
const routes_1 = require("./routes");
async function main() {
    const app = (0, fastify_1.default)({
        logger: {
            level: config_1.config.LOG_LEVEL,
        },
    });
    // --- Plugins ---
    await app.register(cors_1.default, { origin: true });
    await app.register(multipart_1.default, {
        limits: {
            fileSize: config_1.config.MAX_UPLOAD_SIZE_MB * 1024 * 1024,
        },
    });
    // --- Global error handler ---
    app.setErrorHandler((error, _request, reply) => {
        if (error instanceof errors_1.AppError) {
            return reply.status(error.statusCode).send({
                error: error.code,
                message: error.message,
            });
        }
        // Fastify validation error
        if (error.validation) {
            return reply.status(400).send({
                error: 'VALIDATION_ERROR',
                message: error.message,
            });
        }
        // Unexpected error — don't leak internals
        app.log.error({ error: error.message, stack: error.stack }, 'Unhandled error');
        return reply.status(500).send({
            error: 'INTERNAL_ERROR',
            message: 'An unexpected error occurred',
        });
    });
    // --- Routes ---
    await (0, routes_1.registerRoutes)(app);
    // --- Startup checks ---
    try {
        await prisma_1.prisma.$connect();
        app.log.info('Database connected');
    }
    catch (err) {
        app.log.error({ err }, 'Failed to connect to database');
        process.exit(1);
    }
    try {
        await (0, docker_1.verifyDockerConnection)();
        app.log.info('Docker daemon connected');
    }
    catch (err) {
        app.log.warn({ err }, 'Docker daemon not available — sandbox features will fail');
    }
    // --- Graceful shutdown ---
    const shutdown = async (signal) => {
        app.log.info(`Received ${signal}, shutting down gracefully...`);
        await app.close();
        await (0, prisma_1.disconnectPrisma)();
        process.exit(0);
    };
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
    // --- Start server ---
    try {
        await app.listen({ port: config_1.config.PORT, host: '0.0.0.0' });
        app.log.info(`BigBrother API running on port ${config_1.config.PORT}`);
    }
    catch (err) {
        app.log.error(err);
        process.exit(1);
    }
}
main();
//# sourceMappingURL=index.js.map