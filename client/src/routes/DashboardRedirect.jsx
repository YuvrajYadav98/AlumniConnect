import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getDashboardPathForRole } from "../utils/roleRoutes";

/**
 * Mounted at /dashboard. Immediately redirects to the correct
 * role-specific dashboard (/admin/dashboard, /alumni/dashboard, or
 * /student/dashboard). Kept as a stable "go to my dashboard" target
 * so other parts of the app don't need to know the current user's role.
 */
export default function DashboardRedirect() {
  const { user } = useAuth();
  return <Navigate to={getDashboardPathForRole(user?.role)} replace />;
}
