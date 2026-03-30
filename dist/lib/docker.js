"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.docker = void 0;
exports.verifyDockerConnection = verifyDockerConnection;
const dockerode_1 = __importDefault(require("dockerode"));
exports.docker = new dockerode_1.default();
/**
 * Verify Docker daemon is reachable
 */
async function verifyDockerConnection() {
    try {
        await exports.docker.ping();
    }
    catch (error) {
        throw new Error(`Cannot connect to Docker daemon. Is Docker running? ${error instanceof Error ? error.message : error}`);
    }
}
//# sourceMappingURL=docker.js.map