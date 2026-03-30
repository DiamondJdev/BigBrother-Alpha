"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkIdempotency = checkIdempotency;
const prisma_1 = require("../lib/prisma");
/**
 * Check if a test run with the given idempotency key already exists.
 * Returns the existing run if found, null otherwise.
 */
async function checkIdempotency(idempotencyKey) {
    if (!idempotencyKey)
        return null;
    const existingRun = await prisma_1.prisma.testRun.findUnique({
        where: { idempotencyKey },
        include: { artifacts: true },
    });
    return existingRun;
}
//# sourceMappingURL=idempotency.js.map