"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimeoutError = exports.ConflictError = exports.NotFoundError = exports.UploadError = exports.MetricsError = exports.SandboxError = exports.AppError = void 0;
/**
 * Base application error with HTTP status code
 */
class AppError extends Error {
    statusCode;
    code;
    constructor(message, statusCode, code) {
        super(message);
        this.name = this.constructor.name;
        this.statusCode = statusCode;
        this.code = code;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
/**
 * Docker sandbox-related errors
 */
class SandboxError extends AppError {
    constructor(message) {
        super(message, 503, 'SANDBOX_ERROR');
    }
}
exports.SandboxError = SandboxError;
/**
 * Metrics collection errors
 */
class MetricsError extends AppError {
    constructor(message) {
        super(message, 500, 'METRICS_ERROR');
    }
}
exports.MetricsError = MetricsError;
/**
 * File upload validation errors
 */
class UploadError extends AppError {
    constructor(message) {
        super(message, 400, 'UPLOAD_ERROR');
    }
}
exports.UploadError = UploadError;
/**
 * Resource not found
 */
class NotFoundError extends AppError {
    constructor(resource, id) {
        super(`${resource} with id '${id}' not found`, 404, 'NOT_FOUND');
    }
}
exports.NotFoundError = NotFoundError;
/**
 * Idempotency conflict — resource already exists
 */
class ConflictError extends AppError {
    constructor(message) {
        super(message, 409, 'CONFLICT');
    }
}
exports.ConflictError = ConflictError;
/**
 * Timeout during sandbox execution
 */
class TimeoutError extends AppError {
    constructor(message) {
        super(message, 504, 'TIMEOUT');
    }
}
exports.TimeoutError = TimeoutError;
//# sourceMappingURL=index.js.map