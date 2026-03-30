/**
 * Raw Docker Stats API response interfaces
 * See: https://docs.docker.com/engine/api/v1.43/#tag/Container/operation/ContainerStats
 */
export interface DockerCpuUsage {
    total_usage: number;
    usage_in_kernelmode: number;
    usage_in_usermode: number;
    percpu_usage?: number[];
}
export interface DockerCpuStats {
    cpu_usage: DockerCpuUsage;
    system_cpu_usage: number;
    online_cpus?: number;
    throttling_data: {
        periods: number;
        throttled_periods: number;
        throttled_time: number;
    };
}
export interface DockerMemoryStats {
    usage: number;
    max_usage: number;
    limit: number;
    stats?: {
        inactive_file?: number;
        active_file?: number;
        cache?: number;
        [key: string]: number | undefined;
    };
}
export interface DockerNetworkInterface {
    rx_bytes: number;
    rx_packets: number;
    rx_errors: number;
    rx_dropped: number;
    tx_bytes: number;
    tx_packets: number;
    tx_errors: number;
    tx_dropped: number;
}
export interface DockerBlkioEntry {
    major: number;
    minor: number;
    op: string;
    value: number;
}
export interface DockerBlkioStats {
    io_service_bytes_recursive: DockerBlkioEntry[] | null;
    io_serviced_recursive: DockerBlkioEntry[] | null;
}
export interface DockerPidsStats {
    current?: number;
    limit?: number;
}
export interface DockerStatsResponse {
    read: string;
    preread: string;
    cpu_stats: DockerCpuStats;
    precpu_stats: DockerCpuStats;
    memory_stats: DockerMemoryStats;
    networks?: Record<string, DockerNetworkInterface>;
    blkio_stats: DockerBlkioStats;
    pids_stats: DockerPidsStats;
    num_procs: number;
    storage_stats: Record<string, unknown>;
}
//# sourceMappingURL=docker-stats.d.ts.map