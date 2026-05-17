export type UserRole = 'admin' | 'manager' | 'recruiter';

const ROLE_HIERARCHY: Record<UserRole, number> = {
  admin: 3,
  manager: 2,
  recruiter: 1,
};

export function hasMinRole(
  userRole: UserRole,
  requiredRole: UserRole,
): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

export function canManageUsers(role: UserRole): boolean {
  return role === 'admin';
}

export function canCreateTests(role: UserRole): boolean {
  return hasMinRole(role, 'manager');
}

export function canSendInvitations(role: UserRole): boolean {
  return hasMinRole(role, 'recruiter');
}

export function canViewResults(role: UserRole): boolean {
  return hasMinRole(role, 'recruiter');
}

export function canGradeSubmissions(role: UserRole): boolean {
  return hasMinRole(role, 'manager');
}
