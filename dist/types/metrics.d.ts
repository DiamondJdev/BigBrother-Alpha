/**
 * Normalized metrics snapshot — one point-in-time capture
 */
export interface MetricsSnapshot {
    cpuUsagePercent: number;
    memoryUsageBytes: number;
    memoryLimitBytes: number;
    networkRxBytes: number;
    networkTxBytes: number;
    networkRxPackets: number;
    networkTxPackets: number;
    blockReadBytes: number;
    blockWriteBytes: number;
    pidCount: number;
    capturedAt: Date;
}
/**
 * Delta between two snapshots (after - before)
 */
export interface MetricsDelta {
    cpuUsagePercentChange: number;
    memoryUsageBytesChange: number;
    networkRxBytesChange: number;
    networkTxBytesChange: number;
    networkRxPacketsChange: number;
    networkTxPacketsChange: number;
    blockReadBytesChange: number;
    blockWriteBytesChange: number;
    pidCountChange: number;
    durationMs: number;
}
/**
 * Complete metrics report: before, after, and delta
 */
export interface MetricsReport {
    before: MetricsSnapshot;
    after: MetricsSnapshot;
    delta: MetricsDelta;
}
//# sourceMappingURL=metrics.d.ts.map