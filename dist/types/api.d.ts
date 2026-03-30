import { MetricsReport } from './metrics';
/**
 * File change from docker diff
 */
export interface FileChange {
    kind: 'Added' | 'Changed' | 'Deleted';
    path: string;
}
/**
 * Result of file system analysis
 */
export interface FileAnalysisResult {
    totalFilesAdded: number;
    totalFilesChanged: number;
    totalFilesDeleted: number;
    directoriesTouched: string[];
    bannedDirectoryViolations: string[];
    estimatedDiskFootprintBytes: number;
    changes: FileChange[];
}
/**
 * Request body for creating a test run (multipart fields)
 */
export interface CreateTestRunFields {
    tenant_id: string;
    software_id: string;
    sandbox_type?: string;
    run_reason?: string;
    idempotency_key?: string;
}
/**
 * Response for a single test run
 */
export interface TestRunResponse {
    id: string;
    tenant_id: string;
    software_id: string;
    status: string;
    sandbox_type: string;
    run_reason: string | null;
    attempt_number: number;
    idempotency_key: string | null;
    started_at: string | null;
    completed_at: string | null;
    created_at: string;
    metrics?: MetricsReport | null;
    file_analysis?: FileAnalysisResult | null;
    artifacts?: ArtifactResponse[];
}
/**
 * Response when creating a test run (202)
 */
export interface CreateTestRunResponse {
    id: string;
    status: string;
    created_at: string;
    poll_url: string;
}
/**
 * Paginated list response
 */
export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
    };
}
/**
 * Artifact metadata response
 */
export interface ArtifactResponse {
    id: string;
    test_run_id: string;
    artifact_type: string;
    object_key: string;
    content_hash: string;
    installer_byte_size: number | null;
    storage_class: string;
    created_at: string;
}
/**
 * Installer execution result
 */
export interface InstallerResult {
    exitCode: number;
    stdout: string;
    stderr: string;
}
//# sourceMappingURL=api.d.ts.map