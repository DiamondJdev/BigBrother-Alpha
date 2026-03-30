"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
exports.disconnectPrisma = disconnectPrisma;
const client_1 = require("@prisma/client");
const config_1 = require("../config");
exports.prisma = new client_1.PrismaClient({
    log: config_1.config.LOG_LEVEL === 'debug' || config_1.config.LOG_LEVEL === 'trace'
        ? ['query', 'info', 'warn', 'error']
        : ['warn', 'error'],
});
/**
 * Gracefully disconnect Prisma on shutdown
 */
async function disconnectPrisma() {
    await exports.prisma.$disconnect();
}
//# sourceMappingURL=prisma.js.map