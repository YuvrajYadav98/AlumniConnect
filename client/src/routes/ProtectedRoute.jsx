import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * Wrap private routes with this. Usage in AppRoutes:
 *
 *   <Route element={<ProtectedRoute />}>
 *     <Route path="/dashboard" element={<Dashboard />} />
 *   </Route>
 *
 * Pass `allowedRoles` to additionally restrict by role:
 *
 *   <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
 *     <Route path="/admin" element={<AdminPanel />} />
 *   </Route>
 */
export default function ProtectedRoute({ allowedRoles }) {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  // Wait for the initial "who am I" check to finish before deciding
  // anything - otherwise a logged-in user gets bounced on refresh.
  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-500">
        Checking session...
      </div>
    );
  }

  if (!isAuthenticated) {
    // Remember where the user was headed so we can send them back
    // after a successful login.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}
