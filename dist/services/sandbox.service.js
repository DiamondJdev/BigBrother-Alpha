"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createContainer = createContainer;
exports.startContainer = startContainer;
exports.copyFileToContainer = copyFileToContainer;
exports.execInContainer = execInContainer;
exports.getContainerStats = getContainerStats;
exports.getContainerDiff = getContainerDiff;
exports.stopAndRemoveContainer = stopAndRemoveContainer;
const docker_1 = require("../lib/docker");
const logger_1 = require("../lib/logger");
const config_1 = require("../config");
const errors_1 = require("../errors");
/**
 * Create a new sandbox container for a test run
 */
async function createContainer(options) {
    const { testRunId, memoryLimitBytes = 2 * 1024 * 1024 * 1024, cpuCount = 2 } = options;
    try {
        const container = await docker_1.docker.createContainer({
            Image: config_1.config.SANDBOX_IMAGE_NAME,
            name: `bigbrother-${testRunId}`,
            Tty: false,
            HostConfig: {
                Memory: memoryLimitBytes,
                NanoCpus: cpuCount * 1e9,
                NetworkMode: 'bridge', // Allow network so we can detect outbound traffic
                SecurityOpt: ['no-new-privileges'],
                AutoRemove: false, // We manage removal ourselves
            },
            Labels: {
                'bigbrother.test-run-id': testRunId,
                'bigbrother.managed': 'true',
            },
        });
        logger_1.logger.info({ testRunId, containerId: container.id }, 'Sandbox container created');
        return container;
    }
    catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        throw new errors_1.SandboxError(`Failed to create sandbox container: ${msg}`);
    }
}
/**
 * Start a sandbox container
 */
async function startContainer(container) {
    try {
        await container.start();
        logger_1.logger.info({ containerId: container.id }, 'Sandbox container started');
    }
    catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        throw new errors_1.SandboxError(`Failed to start sandbox container: ${msg}`);
    }
}
/**
 * Copy a file into the container as a tar archive
 */
async function copyFileToContainer(container, tarStream, destPath) {
    try {
        await container.putArchive(tarStream, { path: destPath });
        logger_1.logger.debug({ containerId: container.id, destPath }, 'File copied to container');
    }
    catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        throw new errors_1.SandboxError(`Failed to copy file to container: ${msg}`);
    }
}
/**
 * Execute a command inside the container and return stdout/stderr
 */
async function execInContainer(container, cmd) {
    try {
        const exec = await container.exec({
            Cmd: cmd,
            AttachStdout: true,
            AttachStderr: true,
            Tty: false,
        });
        const stream = await exec.start({ Detach: false, Tty: false });
        return { stream, exec };
    }
    catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        throw new errors_1.SandboxError(`Failed to exec in container: ${msg}`);
    }
}
/**
 * Get a single point-in-time stats snapshot from the container
 */
async function getContainerStats(container) {
    try {
        const stats = await container.stats({ stream: false });
        return stats;
    }
    catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        throw new errors_1.SandboxError(`Failed to get container stats: ${msg}`);
    }
}
/**
 * Get filesystem changes since container creation (docker diff)
 */
async function getContainerDiff(container) {
    try {
        // docker diff is available on the container but not in @types/dockerode
        const changes = await container.diff();
        return changes || [];
    }
    catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        throw new errors_1.SandboxError(`Failed to get container diff: ${msg}`);
    }
}
/**
 * Stop and remove a container (best-effort, never throws)
 */
async function stopAndRemoveContainer(container) {
    const containerId = container.id;
    try {
        await container.stop({ t: 5 }).catch(() => {
            // Container may already be stopped
        });
        await container.remove({ force: true, v: true });
        logger_1.logger.info({ containerId }, 'Sandbox container removed');
    }
    catch (error) {
        logger_1.logger.warn({ containerId, error }, 'Failed to clean up sandbox container');
    }
}
//# sourceMappingURL=sandbox.service.js.map