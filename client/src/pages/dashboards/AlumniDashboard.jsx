import { Users, CalendarDays, Briefcase, Bell, UserCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getAlumniDashboardStats } from "../../services/dashboardService";
import { useDashboardData } from "../../hooks/useDashboardData";
import DashboardHeader from "../../components/dashboard/DashboardHeader";
import StatGrid from "../../components/dashboard/StatGrid";
import StatCard from "../../components/dashboard/StatCard";
import DashboardSection from "../../components/dashboard/DashboardSection";
import ProgressBar from "../../components/dashboard/ProgressBar";
import Button from "../../components/Button";

export default function AlumniDashboard() {
  const { user } = useAuth();
  const { data, loading, error } = useDashboardData(getAlumniDashboardStats);
  const stats = data?.stats;
  const notifications = data?.recentNotifications || [];

  return (
    <div>
      <DashboardHeader
        title={`Welcome back, ${user?.name?.split(" ")[0]}`}
        subtitle="Stay connected with your alma mater and fellow alumni."
      />

      {error && (
        <div className="mb-6 rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <StatGrid>
        <StatCard label="Connections" value={stats?.connectionsCount ?? 0} icon={Users} color="blue" loading={loading} />
        <StatCard label="Upcoming Events" value={stats?.upcomingEventsCount ?? 0} icon={CalendarDays} color="green" loading={loading} />
        <StatCard label="Available Jobs" value={stats?.availableJobsCount ?? 0} icon={Briefcase} color="amber" loading={loading} />
        <StatCard label="Unread Notifications" value={stats?.unreadNotificationsCount ?? 0} icon={Bell} color="rose" loading={loading} />
      </StatGrid>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DashboardSection
          title="Profile Completion"
          action={
            <Link to="/profile/edit">
              <Button className="text-xs px-3 py-1.5 flex items-center gap-1">
                <UserCircle size={14} /> Edit Profile
              </Button>
            </Link>
          }
        >
          {loading ? (
            <div className="h-2 w-full rounded-full bg-slate-100 animate-pulse" />
          ) : (
            <>
              <ProgressBar
                percent={stats?.profileCompletion ?? 0}
                colorClass={
                  (stats?.profileCompletion ?? 0) >= 80
                    ? "bg-green-600"
                    : (stats?.profileCompletion ?? 0) >= 40
                    ? "bg-amber-500"
                    : "bg-rose-500"
                }
              />
              {!stats?.hasProfile && (
                <p className="text-xs text-slate-400 mt-3">
                  You haven't created your alumni profile yet — add your details so
                  other alumni and students can find you.
                </p>
              )}
            </>
          )}
        </DashboardSection>

        <DashboardSection title="Recent Notifications">
          {loading ? (
            <p className="text-sm text-slate-400">Loading...</p>
          ) : notifications.length === 0 ? (
            <p className="text-sm text-slate-400">You're all caught up.</p>
          ) : (
            <ul className="space-y-3">
              {notifications.map((n) => (
                <li key={n._id} className="text-sm">
                  <p className="text-slate-700 font-medium">{n.title}</p>
                  {n.message && <p className="text-slate-500 text-xs">{n.message}</p>}
                </li>
              ))}
            </ul>
          )}
        </DashboardSection>
      </div>
    </div>
  );
}
