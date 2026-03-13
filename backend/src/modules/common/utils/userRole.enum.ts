export enum UserRole {
    ADMIN = 'admin',
    USER = 'user',
    LEGAL = 'legal',
    SECURITY = 'security',
    IT = 'it',
}

export const roleHierarchy = {
    [UserRole.ADMIN]: [UserRole.ADMIN, UserRole.USER, UserRole.LEGAL, UserRole.SECURITY, UserRole.IT],
    [UserRole.USER]: [UserRole.USER],
    [UserRole.LEGAL]: [UserRole.LEGAL],
    [UserRole.SECURITY]: [UserRole.SECURITY],
    [UserRole.IT]: [UserRole.IT],
};