import { Users, GraduationCap, CalendarDays, Briefcase, UserCheck, BarChart3 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { getAdminDashboardStats } from "../../services/dashboardService";
import { useDashboardData } from "../../hooks/useDashboardData";
import DashboardHeader from "../../components/dashboard/DashboardHeader";
import StatGrid from "../../components/dashboard/StatGrid";
import StatCard from "../../components/dashboard/StatCard";
import DashboardSection from "../../components/dashboard/DashboardSection";
import { Link } from "react-router-dom";
import Button from "../../components/Button";

export default function AdminDashboard() {
  const { user } = useAuth();
  const { data, loading, error } = useDashboardData(getAdminDashboardStats);
  const stats = data?.stats;

  return (
    <div>
      <DashboardHeader
        title={`Welcome back, ${user?.name?.split(" ")[0]}`}
        subtitle="Here's what's happening across AlumniConnect."
      />

      {error && (
        <div className="mb-6 rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <StatGrid>
        <StatCard label="Total Alumni" value={stats?.totalAlumni ?? 0} icon={GraduationCap} color="blue" loading={loading} />
        <StatCard label="Total Students" value={stats?.totalStudents ?? 0} icon={Users} color="purple" loading={loading} />
        <StatCard label="Total Events" value={stats?.totalEvents ?? 0} icon={CalendarDays} color="green" loading={loading} />
        <StatCard label="Total Jobs" value={stats?.totalJobs ?? 0} icon={Briefcase} color="amber" loading={loading} />
        <StatCard label="Pending Approvals" value={stats?.pendingApprovals ?? 0} icon={UserCheck} color="rose" loading={loading} />
      </StatGrid>

      <div className="mt-8 space-y-4">
        <DashboardSection
          title="Platform Analytics"
          action={
            <Link to="/admin/analytics">
              <Button className="text-xs px-3 py-1.5">
                <span className="inline-flex items-center gap-1.5">
                  <BarChart3 size={13} /> View full dashboard
                </span>
              </Button>
            </Link>
          }
        >
          <p className="text-sm text-slate-500">
            Alumni distribution by batch, branch, city, and industry, job
            categories, event registrations, and monthly registration
            trends.
          </p>
        </DashboardSection>

        <DashboardSection
          title="Account Approvals"
          action={
            <Link to="/admin/alumni?status=pending">
              <Button className="text-xs px-3 py-1.5">Review approvals</Button>
            </Link>
          }
        >
          <p className="text-sm text-slate-500">
            {loading
              ? "Loading..."
              : stats?.pendingApprovals > 0
              ? `${stats.pendingApprovals} account${stats.pendingApprovals === 1 ? "" : "s"} waiting for approval.`
              : "No accounts are currently waiting for approval."}
          </p>
        </DashboardSection>
      </div>
    </div>
  );
}
