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
exports.orchestrate = orchestrate;
const prisma_1 = require("../lib/prisma");
const logger_1 = require("../lib/logger");
const enums_1 = require("../types/enums");
const sandboxService = __importStar(require("./sandbox.service"));
const installerService = __importStar(require("./installer.service"));
const metricsService = __importStar(require("./metrics.service"));
const fileAnalysisService = __importStar(require("./file-analysis.service"));
const artifactService = __importStar(require("./artifact.service"));
const stream_1 = require("../utils/stream");
/**
 * Update a test run's status in the database
 */
async function updateStatus(testRunId, status, extra) {
    await prisma_1.prisma.testRun.update({
        where: { id: testRunId },
        data: {
            status: status,
            ...extra,
        },
    });
    logger_1.logger.info({ testRunId, status }, 'Test run status updated');
}
/**
 * Main orchestration pipeline.
 * Runs asynchronously — the API returns immediately after calling this.
 *
 * Pipeline:
 *   PENDING → PROVISIONING → PRE_METRICS → INSTALLING → POST_METRICS → ANALYZING → COMPLETED
 *   Any failure → FAILED / TIMED_OUT
 *   Always → clean up container
 */
async function orchestrate(testRunId, tenantId, installerBuffer) {
    let container = null;
    try {
        // ── PENDING → PROVISIONING ──────────────────────────────────
        await updateStatus(testRunId, enums_1.TestRunStatus.PROVISIONING, {
            startedAt: new Date(),
        });
        container = await sandboxService.createContainer({ testRunId });
        await sandboxService.startContainer(container);
        // Save the original installer as an artifact
        await artifactService.saveArtifact(tenantId, testRunId, enums_1.ArtifactType.INSTALLER, installerBuffer);
        // Copy the .exe into the container
        await installerService.copyInstallerToContainer(container, installerBuffer);
        // ── PROVISIONING → PRE_METRICS ──────────────────────────────
        await updateStatus(testRunId, enums_1.TestRunStatus.PRE_METRICS);
        // Brief pause to let container stabilize (Wine initialization)
        await (0, stream_1.sleep)(2000);
        const beforeSnapshot = await metricsService.captureSnapshot(container);
        // ── PRE_METRICS → INSTALLING ────────────────────────────────
        await updateStatus(testRunId, enums_1.TestRunStatus.INSTALLING);
        const installResult = await installerService.executeInstaller(container);
        // Save stdout/stderr as artifacts
        if (installResult.stdout) {
            await artifactService.saveArtifact(tenantId, testRunId, enums_1.ArtifactType.STDOUT_LOG, Buffer.from(installResult.stdout, 'utf-8'));
        }
        if (installResult.stderr) {
            await artifactService.saveArtifact(tenantId, testRunId, enums_1.ArtifactType.STDERR_LOG, Buffer.from(installResult.stderr, 'utf-8'));
        }
        logger_1.logger.info({ testRunId, exitCode: installResult.exitCode }, 'Installer execution finished');
        // ── INSTALLING → POST_METRICS ───────────────────────────────
        await updateStatus(testRunId, enums_1.TestRunStatus.POST_METRICS);
        const afterSnapshot = await metricsService.captureSnapshot(container);
        const metricsReport = metricsService.buildReport(beforeSnapshot, afterSnapshot);
        // Save metrics report artifact
        await artifactService.saveArtifact(tenantId, testRunId, enums_1.ArtifactType.METRICS_REPORT, Buffer.from(JSON.stringify(metricsReport, null, 2), 'utf-8'));
        // ── POST_METRICS → ANALYZING ────────────────────────────────
        await updateStatus(testRunId, enums_1.TestRunStatus.ANALYZING);
        const fileAnalysis = await fileAnalysisService.analyzeFilesystem(container);
        // Save file diff report artifact
        await artifactService.saveArtifact(tenantId, testRunId, enums_1.ArtifactType.FILE_DIFF_REPORT, Buffer.from(JSON.stringify(fileAnalysis, null, 2), 'utf-8'));
        // ── ANALYZING → COMPLETED ───────────────────────────────────
        await updateStatus(testRunId, enums_1.TestRunStatus.COMPLETED, {
            completedAt: new Date(),
        });
        logger_1.logger.info({ testRunId }, 'Test run completed successfully');
    }
    catch (error) {
        // ── ANY STATE → FAILED / TIMED_OUT ──────────────────────────
        const isTimeout = error instanceof Error && error.constructor.name === 'TimeoutError';
        const failStatus = isTimeout ? enums_1.TestRunStatus.TIMED_OUT : enums_1.TestRunStatus.FAILED;
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger_1.logger.error({ testRunId, error: errorMsg, isTimeout }, 'Orchestration failed');
        try {
            await updateStatus(testRunId, failStatus, {
                completedAt: new Date(),
            });
        }
        catch (dbErr) {
            logger_1.logger.error({ testRunId, dbErr }, 'Failed to update run status to FAILED');
        }
    }
    finally {
        // ── ALWAYS: Clean up the container ──────────────────────────
        if (container) {
            await sandboxService.stopAndRemoveContainer(container);
        }
    }
}
//# sourceMappingURL=orchestrator.service.js.map