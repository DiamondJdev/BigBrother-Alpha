/**
 * Main orchestration pipeline.
 * Runs asynchronously — the API returns immediately after calling this.
 *
 * Pipeline:
 *   PENDING → PROVISIONING → PRE_METRICS → INSTALLING → POST_METRICS → ANALYZING → COMPLETED
 *   Any failure → FAILED / TIMED_OUT
 *   Always → clean up container
 */
export declare function orchestrate(testRunId: string, tenantId: string, installerBuffer: Buffer): Promise<void>;
//# sourceMappingURL=orchestrator.service.d.ts.map