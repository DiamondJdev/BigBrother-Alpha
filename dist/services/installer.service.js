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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateExecutable = validateExecutable;
exports.createTarArchive = createTarArchive;
exports.copyInstallerToContainer = copyInstallerToContainer;
exports.executeInstaller = executeInstaller;
const tar_stream_1 = __importDefault(require("tar-stream"));
const errors_1 = require("../errors");
const logger_1 = require("../lib/logger");
const config_1 = require("../config");
const sandboxService = __importStar(require("./sandbox.service"));
const stream_1 = require("../utils/stream");
const PE_MAGIC_BYTES = Buffer.from([0x4d, 0x5a]); // "MZ" — PE executable header
/**
 * Validate that a buffer looks like a PE (.exe) file
 */
function validateExecutable(buffer, filename) {
    if (buffer.length < 2) {
        throw new errors_1.UploadError('File is too small to be a valid executable');
    }
    if (buffer[0] !== PE_MAGIC_BYTES[0] || buffer[1] !== PE_MAGIC_BYTES[1]) {
        throw new errors_1.UploadError(`File "${filename}" does not appear to be a valid PE executable (missing MZ header)`);
    }
}
/**
 * Create a tar archive containing the .exe file.
 * Docker's putArchive API requires tar format.
 */
function createTarArchive(buffer, filename) {
    const pack = tar_stream_1.default.pack();
    pack.entry({ name: filename }, buffer);
    pack.finalize();
    return pack;
}
/**
 * Copy the .exe installer into the container
 */
async function copyInstallerToContainer(container, installerBuffer) {
    const tarStream = createTarArchive(installerBuffer, 'installer.exe');
    await sandboxService.copyFileToContainer(container, tarStream, '/sandbox');
    logger_1.logger.info({ containerId: container.id }, 'Installer copied to container');
}
/**
 * Execute the installer inside the container via Wine
 * Returns stdout, stderr, and exit code
 */
async function executeInstaller(container, timeoutMs) {
    const timeout = timeoutMs ?? config_1.config.SANDBOX_TIMEOUT_MS;
    const { stream, exec } = await sandboxService.execInContainer(container, [
        'bash',
        '-c',
        'Xvfb :99 -screen 0 1024x768x16 & sleep 1 && wine /sandbox/installer.exe 2>&1; echo "EXIT_CODE:$?"',
    ]);
    // Race between execution and timeout
    const executionPromise = (0, stream_1.demuxDockerStream)(stream);
    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new errors_1.TimeoutError(`Installer execution timed out after ${timeout}ms`)), timeout));
    const { stdout, stderr } = await Promise.race([executionPromise, timeoutPromise]);
    // Extract exit code from output
    const exitCodeMatch = stdout.match(/EXIT_CODE:(\d+)/);
    const exitCode = exitCodeMatch ? parseInt(exitCodeMatch[1], 10) : -1;
    // Clean the exit code marker from stdout
    const cleanStdout = stdout.replace(/EXIT_CODE:\d+\n?/, '').trim();
    // Get the exec's inspect to get the real exit code if available
    let realExitCode = exitCode;
    try {
        const inspectData = await exec.inspect();
        if (inspectData.ExitCode !== null && inspectData.ExitCode !== undefined) {
            realExitCode = inspectData.ExitCode;
        }
    }
    catch {
        // Use parsed exit code as fallback
    }
    logger_1.logger.info({ containerId: container.id, exitCode: realExitCode }, 'Installer execution completed');
    return {
        exitCode: realExitCode,
        stdout: cleanStdout,
        stderr: stderr.trim(),
    };
}
//# sourceMappingURL=installer.service.js.map