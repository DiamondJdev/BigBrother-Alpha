"use strict";
/**
 * Note: These mirror the Prisma enums but are defined here for use
 * outside of Prisma contexts (e.g., service logic, API validation).
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorageClass = exports.SandboxType = exports.ArtifactType = exports.TestRunStatus = void 0;
var TestRunStatus;
(function (TestRunStatus) {
    TestRunStatus["PENDING"] = "PENDING";
    TestRunStatus["PROVISIONING"] = "PROVISIONING";
    TestRunStatus["PRE_METRICS"] = "PRE_METRICS";
    TestRunStatus["INSTALLING"] = "INSTALLING";
    TestRunStatus["POST_METRICS"] = "POST_METRICS";
    TestRunStatus["ANALYZING"] = "ANALYZING";
    TestRunStatus["COMPLETED"] = "COMPLETED";
    TestRunStatus["FAILED"] = "FAILED";
    TestRunStatus["TIMED_OUT"] = "TIMED_OUT";
})(TestRunStatus || (exports.TestRunStatus = TestRunStatus = {}));
var ArtifactType;
(function (ArtifactType) {
    ArtifactType["INSTALLER"] = "INSTALLER";
    ArtifactType["METRICS_REPORT"] = "METRICS_REPORT";
    ArtifactType["FILE_DIFF_REPORT"] = "FILE_DIFF_REPORT";
    ArtifactType["STDOUT_LOG"] = "STDOUT_LOG";
    ArtifactType["STDERR_LOG"] = "STDERR_LOG";
})(ArtifactType || (exports.ArtifactType = ArtifactType = {}));
var SandboxType;
(function (SandboxType) {
    SandboxType["WINE_LINUX"] = "WINE_LINUX";
})(SandboxType || (exports.SandboxType = SandboxType = {}));
var StorageClass;
(function (StorageClass) {
    StorageClass["LOCAL"] = "LOCAL";
})(StorageClass || (exports.StorageClass = StorageClass = {}));
//# sourceMappingURL=enums.js.map