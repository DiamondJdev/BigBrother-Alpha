import { Readable } from 'node:stream';
import { ArtifactType } from '../types/enums';
/**
 * Save an artifact to local filesystem and create a DB record
 */
export declare function saveArtifact(tenantId: string, testRunId: string, artifactType: ArtifactType, data: Buffer): Promise<string>;
/**
 * Get the full filesystem path for an artifact by its object key
 */
export declare function getArtifactFilePath(objectKey: string): string;
/**
 * Create a readable stream for downloading an artifact
 */
export declare function streamArtifact(artifactId: string): Promise<{
    stream: Readable;
    filename: string;
    size: number;
}>;
/**
 * Get artifact metadata by ID
 */
export declare function getArtifact(artifactId: string): Promise<{
    id: string;
    tenantId: string;
    createdAt: Date;
    testRunId: string;
    artifactType: import(".prisma/client").$Enums.ArtifactType;
    objectKey: string;
    contentHash: string;
    installerByteSize: number | null;
    storageClass: import(".prisma/client").$Enums.StorageClass;
}>;
//# sourceMappingURL=artifact.service.d.ts.map