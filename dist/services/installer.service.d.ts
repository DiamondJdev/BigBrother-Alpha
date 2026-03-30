import Docker from 'dockerode';
import { InstallerResult } from '../types/api';
/**
 * Validate that a buffer looks like a PE (.exe) file
 */
export declare function validateExecutable(buffer: Buffer, filename: string): void;
/**
 * Create a tar archive containing the .exe file.
 * Docker's putArchive API requires tar format.
 */
export declare function createTarArchive(buffer: Buffer, filename: string): NodeJS.ReadableStream;
/**
 * Copy the .exe installer into the container
 */
export declare function copyInstallerToContainer(container: Docker.Container, installerBuffer: Buffer): Promise<void>;
/**
 * Execute the installer inside the container via Wine
 * Returns stdout, stderr, and exit code
 */
export declare function executeInstaller(container: Docker.Container, timeoutMs?: number): Promise<InstallerResult>;
//# sourceMappingURL=installer.service.d.ts.map