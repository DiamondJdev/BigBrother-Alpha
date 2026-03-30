"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveArtifact = saveArtifact;
exports.getArtifactFilePath = getArtifactFilePath;
exports.streamArtifact = streamArtifact;
exports.getArtifact = getArtifact;
const promises_1 = __importDefault(require("node:fs/promises"));
const node_fs_1 = require("node:fs");
const node_path_1 = __importDefault(require("node:path"));
const prisma_1 = require("../lib/prisma");
const config_1 = require("../config");
const logger_1 = require("../lib/logger");
const errors_1 = require("../errors");
const hash_1 = require("../utils/hash");
const enums_1 = require("../types/enums");
/**
 * Generate the filesystem path for an artifact
 */
function getArtifactDir(tenantId, testRunId) {
    return node_path_1.default.join(config_1.config.ARTIFACT_STORAGE_PATH, tenantId, testRunId);
}
/**
 * Generate the object key (relative path) for an artifact
 */
function generateObjectKey(tenantId, testRunId, artifactType, extension = '') {
    const filename = `${artifactType.toLowerCase()}${extension}`;
    return `${tenantId}/${testRunId}/${filename}`;
}
/**
 * Map artifact types to file extensions
 */
function getExtension(artifactType) {
    switch (artifactType) {
        case enums_1.ArtifactType.INSTALLER:
            return '.exe';
        case enums_1.ArtifactType.METRICS_REPORT:
            return '.json';
        case enums_1.ArtifactType.FILE_DIFF_REPORT:
            return '.json';
        case enums_1.ArtifactType.STDOUT_LOG:
            return '.log';
        case enums_1.ArtifactType.STDERR_LOG:
            return '.log';
        default:
            return '.bin';
    }
}
/**
 * Save an artifact to local filesystem and create a DB record
 */
async function saveArtifact(tenantId, testRunId, artifactType, data) {
    const extension = getExtension(artifactType);
    const objectKey = generateObjectKey(tenantId, testRunId, artifactType, extension);
    const dir = getArtifactDir(tenantId, testRunId);
    const filePath = node_path_1.default.join(config_1.config.ARTIFACT_STORAGE_PATH, objectKey);
    // Ensure directory exists
    await promises_1.default.mkdir(dir, { recursive: true });
    // Write file
    await promises_1.default.writeFile(filePath, data);
    // Compute hash
    const contentHash = (0, hash_1.computeSha256Prefixed)(data);
    // Create DB record
    const artifact = await prisma_1.prisma.testArtifact.create({
        data: {
            tenantId,
            testRunId,
            artifactType: artifactType, // Prisma enum
            objectKey,
            contentHash,
            installerByteSize: data.length,
            storageClass: enums_1.StorageClass.LOCAL, // Prisma enum
        },
    });
    logger_1.logger.info({ artifactId: artifact.id, testRunId, artifactType, objectKey, sizeBytes: data.length }, 'Artifact saved');
    return artifact.id;
}
/**
 * Get the full filesystem path for an artifact by its object key
 */
function getArtifactFilePath(objectKey) {
    return node_path_1.default.join(config_1.config.ARTIFACT_STORAGE_PATH, objectKey);
}
/**
 * Create a readable stream for downloading an artifact
 */
async function streamArtifact(artifactId) {
    const artifact = await prisma_1.prisma.testArtifact.findUnique({
        where: { id: artifactId },
    });
    if (!artifact) {
        throw new errors_1.NotFoundError('Artifact', artifactId);
    }
    const filePath = getArtifactFilePath(artifact.objectKey);
    try {
        const stat = await promises_1.default.stat(filePath);
        const stream = (0, node_fs_1.createReadStream)(filePath);
        const filename = node_path_1.default.basename(artifact.objectKey);
        return { stream, filename, size: stat.size };
    }
    catch (error) {
        throw new errors_1.NotFoundError('Artifact file', artifact.objectKey);
    }
}
/**
 * Get artifact metadata by ID
 */
async function getArtifact(artifactId) {
    const artifact = await prisma_1.prisma.testArtifact.findUnique({
        where: { id: artifactId },
    });
    if (!artifact) {
        throw new errors_1.NotFoundError('Artifact', artifactId);
    }
    return artifact;
}
//# sourceMappingURL=artifact.service.js.map