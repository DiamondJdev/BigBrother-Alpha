/**
 * Base application error with HTTP status code
 */
export declare class AppError extends Error {
    readonly statusCode: number;
    readonly code: string;
    constructor(message: string, statusCode: number, code: string);
}
/**
 * Docker sandbox-related errors
 */
export declare class SandboxError extends AppError {
    constructor(message: string);
}
/**
 * Metrics collection errors
 */
export declare class MetricsError extends AppError {
    constructor(message: string);
}
/**
 * File upload validation errors
 */
export declare class UploadError extends AppError {
    constructor(message: string);
}
/**
 * Resource not found
 */
export declare class NotFoundError extends AppError {
    constructor(resource: string, id: string);
}
/**
 * Idempotency conflict — resource already exists
 */
export declare class ConflictError extends AppError {
    constructor(message: string);
}
/**
 * Timeout during sandbox execution
 */
export declare class TimeoutError extends AppError {
    constructor(message: string);
}
//# sourceMappingURL=index.d.ts.map