import Docker from 'dockerode';
import { FileAnalysisResult } from '../types/api';
/**
 * Analyze the filesystem changes in a container after installer execution.
 * Uses `docker diff` and optionally `du` for disk footprint.
 */
export declare function analyzeFilesystem(container: Docker.Container): Promise<FileAnalysisResult>;
//# sourceMappingURL=file-analysis.service.d.ts.map