/**
 * Note: These mirror the Prisma enums but are defined here for use
 * outside of Prisma contexts (e.g., service logic, API validation).
 */
export declare enum TestRunStatus {
    PENDING = "PENDING",
    PROVISIONING = "PROVISIONING",
    PRE_METRICS = "PRE_METRICS",
    INSTALLING = "INSTALLING",
    POST_METRICS = "POST_METRICS",
    ANALYZING = "ANALYZING",
    COMPLETED = "COMPLETED",
    FAILED = "FAILED",
    TIMED_OUT = "TIMED_OUT"
}
export declare enum ArtifactType {
    INSTALLER = "INSTALLER",
    METRICS_REPORT = "METRICS_REPORT",
    FILE_DIFF_REPORT = "FILE_DIFF_REPORT",
    STDOUT_LOG = "STDOUT_LOG",
    STDERR_LOG = "STDERR_LOG"
}
export declare enum SandboxType {
    WINE_LINUX = "WINE_LINUX"
}
export declare enum StorageClass {
    LOCAL = "LOCAL"
}
//# sourceMappingURL=enums.d.ts.map