"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerTestRunRoutes = registerTestRunRoutes;
const prisma_1 = require("../lib/prisma");
const logger_1 = require("../lib/logger");
const errors_1 = require("../errors");
const idempotency_1 = require("../utils/idempotency");
const stream_1 = require("../utils/stream");
const installerService = __importStar(require("../services/installer.service"));
const orchestratorService = __importStar(require("../services/orchestrator.service"));
async function registerTestRunRoutes(app) {
    /**
     * POST /api/v1/test-runs
     * Upload a .exe and start a sandboxed test run
     */
    app.post('/test-runs', async (request, reply) => {
        const data = await request.file();
        if (!data) {
            throw new errors_1.UploadError('No file uploaded. Send a multipart form with a "file" field.');
        }
        // Extract form fields
        const fields = data.fields;
        const tenantId = fields.tenant_id?.value;
        const softwareId = fields.software_id?.value;
        const sandboxType = fields.sandbox_type?.value || 'WINE_LINUX';
        const runReason = fields.run_reason?.value;
        const idempotencyKey = fields.idempotency_key?.value;
        // Validate required fields
        if (!tenantId) {
            throw new errors_1.UploadError('Missing required field: tenant_id');
        }
        if (!softwareId) {
            throw new errors_1.UploadError('Missing required field: software_id');
        }
        // Check idempotency
        if (idempotencyKey) {
            const existing = await (0, idempotency_1.checkIdempotency)(idempotencyKey);
            if (existing) {
                return reply.status(409).send({
                    id: existing.id,
                    status: existing.status,
                    created_at: existing.createdAt.toISOString(),
                    poll_url: `/api/v1/test-runs/${existing.id}`,
                    message: 'Test run already exists for this idempotency key',
                });
            }
        }
        // Read file into buffer
        const fileBuffer = await (0, stream_1.streamToBuffer)(data.file);
        // Validate it's a PE executable
        installerService.validateExecutable(fileBuffer, data.filename);
        // Create the test run record
        const testRun = await prisma_1.prisma.testRun.create({
            data: {
                tenantId,
                softwareId,
                sandboxType: sandboxType,
                runReason: runReason || null,
                idempotencyKey: idempotencyKey || null,
            },
        });
        logger_1.logger.info({ testRunId: testRun.id, tenantId, softwareId, fileSize: fileBuffer.length }, 'Test run created, starting orchestration');
        // Fire-and-forget: start the orchestration pipeline asynchronously
        orchestratorService
            .orchestrate(testRun.id, tenantId, fileBuffer)
            .catch((err) => {
            logger_1.logger.error({ testRunId: testRun.id, err }, 'Orchestration failed unexpectedly');
        });
        // Return immediately with 202 Accepted
        return reply.status(202).send({
            id: testRun.id,
            status: testRun.status,
            created_at: testRun.createdAt.toISOString(),
            poll_url: `/api/v1/test-runs/${testRun.id}`,
        });
    });
    /**
     * GET /api/v1/test-runs
     * List test runs with pagination and filtering
     */
    app.get('/test-runs', async (request, reply) => {
        const query = request.query;
        const page = Math.max(1, parseInt(query.page || '1', 10));
        const limit = Math.min(100, Math.max(1, parseInt(query.limit || '20', 10)));
        const skip = (page - 1) * limit;
        // Build where clause from filters
        const where = {};
        if (query.tenant_id)
            where.tenantId = query.tenant_id;
        if (query.software_id)
            where.softwareId = query.software_id;
        if (query.status)
            where.status = query.status;
        const [total, runs] = await Promise.all([
            prisma_1.prisma.testRun.count({ where }),
            prisma_1.prisma.testRun.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: { artifacts: true },
            }),
        ]);
        return reply.send({
            data: runs.map(formatTestRun),
            pagination: { page, limit, total },
        });
    });
    /**
     * GET /api/v1/test-runs/:id
     * Get full details of a test run including metrics and artifacts
     */
    app.get('/test-runs/:id', async (request, reply) => {
        const { id } = request.params;
        const testRun = await prisma_1.prisma.testRun.findUnique({
            where: { id },
            include: { artifacts: true },
        });
        if (!testRun) {
            throw new errors_1.NotFoundError('TestRun', id);
        }
        // If completed, try to load the metrics and file analysis from artifacts
        let metrics = null;
        let fileAnalysis = null;
        if (testRun.status === 'COMPLETED') {
            const metricsArtifact = testRun.artifacts.find((a) => a.artifactType === 'METRICS_REPORT');
            const fileArtifact = testRun.artifacts.find((a) => a.artifactType === 'FILE_DIFF_REPORT');
            if (metricsArtifact) {
                try {
                    const fs = await Promise.resolve().then(() => __importStar(require('node:fs/promises')));
                    const path = await Promise.resolve().then(() => __importStar(require('node:path')));
                    const { config } = await Promise.resolve().then(() => __importStar(require('../config')));
                    const filePath = path.join(config.ARTIFACT_STORAGE_PATH, metricsArtifact.objectKey);
                    const content = await fs.readFile(filePath, 'utf-8');
                    metrics = JSON.parse(content);
                }
                catch {
                    // Metrics file not available
                }
            }
            if (fileArtifact) {
                try {
                    const fs = await Promise.resolve().then(() => __importStar(require('node:fs/promises')));
                    const path = await Promise.resolve().then(() => __importStar(require('node:path')));
                    const { config } = await Promise.resolve().then(() => __importStar(require('../config')));
                    const filePath = path.join(config.ARTIFACT_STORAGE_PATH, fileArtifact.objectKey);
                    const content = await fs.readFile(filePath, 'utf-8');
                    fileAnalysis = JSON.parse(content);
                }
                catch {
                    // File analysis not available
                }
            }
        }
        return reply.send({
            ...formatTestRun(testRun),
            metrics,
            file_analysis: fileAnalysis,
        });
    });
}
/**
 * Format a test run for API response
 */
function formatTestRun(run) {
    return {
        id: run.id,
        tenant_id: run.tenantId,
        software_id: run.softwareId,
        status: run.status,
        sandbox_type: run.sandboxType,
        run_reason: run.runReason,
        attempt_number: run.attemptNumber,
        idempotency_key: run.idempotencyKey,
        started_at: run.startedAt?.toISOString() || null,
        completed_at: run.completedAt?.toISOString() || null,
        created_at: run.createdAt.toISOString(),
        artifacts: run.artifacts?.map((a) => ({
            id: a.id,
            artifact_type: a.artifactType,
            object_key: a.objectKey,
            content_hash: a.contentHash,
            installer_byte_size: a.installerByteSize,
            storage_class: a.storageClass,
            created_at: a.createdAt.toISOString(),
        })),
    };
}
//# sourceMappingURL=test-runs.routes.js.map