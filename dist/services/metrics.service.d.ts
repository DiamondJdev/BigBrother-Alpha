import Docker from 'dockerode';
import { DockerStatsResponse } from '../types/docker-stats';
import { MetricsSnapshot, MetricsDelta, MetricsReport } from '../types/metrics';
/**
 * Normalize raw Docker stats into our MetricsSnapshot interface
 */
export declare function normalizeStats(raw: DockerStatsResponse): MetricsSnapshot;
/**
 * Compute the delta between two metrics snapshots
 */
export declare function computeDelta(before: MetricsSnapshot, after: MetricsSnapshot): MetricsDelta;
/**
 * Capture a metrics snapshot from a running container
 */
export declare function captureSnapshot(container: Docker.Container): Promise<MetricsSnapshot>;
/**
 * Capture before and after snapshots and compute the full report.
 * This is a convenience method — the orchestrator typically calls
 * captureSnapshot() separately with the install in between.
 */
export declare function buildReport(before: MetricsSnapshot, after: MetricsSnapshot): MetricsReport;
//# sourceMappingURL=metrics.service.d.ts.map