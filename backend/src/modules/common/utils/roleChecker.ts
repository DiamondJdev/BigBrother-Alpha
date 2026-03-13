import { UserRole, roleHierarchy } from "./userRole.enum";


export function hasPermission(userRoles: UserRole[], requiredRoles: UserRole[]): boolean {
    // If any of the user's roles grants access to any required role, permission is granted.
    return requiredRoles.some((requiredRole) =>
        userRoles.some((userRole) => roleHierarchy[userRole]?.includes(requiredRole)),
    );
}
    
export function getAllowedRoles(userRoles: UserRole[]): UserRole[] {
    // Union all allowed roles for each of the given user roles.
    const allowed = new Set<UserRole>();

    userRoles.forEach((userRole) => {
        const roles = roleHierarchy[userRole];
        if (roles) {
            roles.forEach((r) => allowed.add(r));
        }
    });

    return Array.from(allowed);
}
    
export function isValidRoles(roles: UserRole[]): boolean {
    return roles.every((role) =>
        Object.values(UserRole).includes(role),
    );
}