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
exports.registerArtifactRoutes = registerArtifactRoutes;
const artifactService = __importStar(require("../services/artifact.service"));
async function registerArtifactRoutes(app) {
    /**
     * GET /api/v1/artifacts/:id
     * Get artifact metadata
     */
    app.get('/artifacts/:id', async (request, reply) => {
        const { id } = request.params;
        const artifact = await artifactService.getArtifact(id);
        return reply.send({
            id: artifact.id,
            test_run_id: artifact.testRunId,
            artifact_type: artifact.artifactType,
            object_key: artifact.objectKey,
            content_hash: artifact.contentHash,
            installer_byte_size: artifact.installerByteSize,
            storage_class: artifact.storageClass,
            created_at: artifact.createdAt.toISOString(),
        });
    });
    /**
     * GET /api/v1/artifacts/:id/download
     * Stream-download the artifact file
     */
    app.get('/artifacts/:id/download', async (request, reply) => {
        const { id } = request.params;
        const { stream, filename, size } = await artifactService.streamArtifact(id);
        reply.header('Content-Disposition', `attachment; filename="${filename}"`);
        reply.header('Content-Type', 'application/octet-stream');
        reply.header('Content-Length', size);
        return reply.send(stream);
    });
}
//# sourceMappingURL=artifacts.routes.js.map