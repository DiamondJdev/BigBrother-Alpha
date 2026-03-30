/**
 * Check if a test run with the given idempotency key already exists.
 * Returns the existing run if found, null otherwise.
 */
export declare function checkIdempotency(idempotencyKey: string): Promise<({
    artifacts: {
        id: string;
        tenantId: string;
        createdAt: Date;
        testRunId: string;
        artifactType: import(".prisma/client").$Enums.ArtifactType;
        objectKey: string;
        contentHash: string;
        installerByteSize: number | null;
        storageClass: import(".prisma/client").$Enums.StorageClass;
    }[];
} & {
    id: string;
    idempotencyKey: string | null;
    tenantId: string;
    softwareId: string;
    status: import(".prisma/client").$Enums.TestRunStatus;
    sandboxType: import(".prisma/client").$Enums.SandboxType;
    runReason: string | null;
    attemptNumber: number;
    startedAt: Date | null;
    completedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}) | null>;
//# sourceMappingURL=idempotency.d.ts.map