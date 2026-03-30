import Docker from 'dockerode';
import { DockerStatsResponse } from '../types/docker-stats';
export interface CreateSandboxOptions {
    testRunId: string;
    memoryLimitBytes?: number;
    cpuCount?: number;
}
/**
 * Create a new sandbox container for a test run
 */
export declare function createContainer(options: CreateSandboxOptions): Promise<Docker.Container>;
/**
 * Start a sandbox container
 */
export declare function startContainer(container: Docker.Container): Promise<void>;
/**
 * Copy a file into the container as a tar archive
 */
export declare function copyFileToContainer(container: Docker.Container, tarStream: NodeJS.ReadableStream, destPath: string): Promise<void>;
/**
 * Execute a command inside the container and return stdout/stderr
 */
export declare function execInContainer(container: Docker.Container, cmd: string[]): Promise<{
    stream: NodeJS.ReadableStream;
    exec: Docker.Exec;
}>;
/**
 * Get a single point-in-time stats snapshot from the container
 */
export declare function getContainerStats(container: Docker.Container): Promise<DockerStatsResponse>;
/**
 * Get filesystem changes since container creation (docker diff)
 */
export declare function getContainerDiff(container: Docker.Container): Promise<Array<{
    Kind: number;
    Path: string;
}>>;
/**
 * Stop and remove a container (best-effort, never throws)
 */
export declare function stopAndRemoveContainer(container: Docker.Container): Promise<void>;
//# sourceMappingURL=sandbox.service.d.ts.map