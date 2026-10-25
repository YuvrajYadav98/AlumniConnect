const ROLE_DASHBOARD_PATHS = {
  admin: "/admin/dashboard",
  alumni: "/alumni/dashboard",
  student: "/student/dashboard",
};

export function getDashboardPathForRole(role) {
  return ROLE_DASHBOARD_PATHS[role] || "/";
}
