import { PrismaClient } from '@prisma/client';
export declare const prisma: PrismaClient<{
    log: ("error" | "warn" | "info" | "query")[];
}, "error" | "warn" | "info" | "query", import("@prisma/client/runtime/client").DefaultArgs>;
/**
 * Gracefully disconnect Prisma on shutdown
 */
export declare function disconnectPrisma(): Promise<void>;
//# sourceMappingURL=prisma.d.ts.map