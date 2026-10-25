import { GraduationCap, UserCheck, Briefcase, CalendarDays, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getStudentDashboardStats } from "../../services/dashboardService";
import { useDashboardData } from "../../hooks/useDashboardData";
import DashboardHeader from "../../components/dashboard/DashboardHeader";
import StatGrid from "../../components/dashboard/StatGrid";
import StatCard from "../../components/dashboard/StatCard";
import DashboardSection from "../../components/dashboard/DashboardSection";
import Button from "../../components/Button";

export default function StudentDashboard() {
  const { user } = useAuth();
  const { data, loading, error } = useDashboardData(getStudentDashboardStats);
  const stats = data?.stats;

  return (
    <div>
      <DashboardHeader
        title={`Welcome back, ${user?.name?.split(" ")[0]}`}
        subtitle="Explore the alumni network, find mentors, and discover opportunities."
      />

      {error && (
        <div className="mb-6 rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <StatGrid>
        <StatCard label="Alumni Network" value={stats?.alumniCount ?? 0} icon={GraduationCap} color="blue" loading={loading} />
        <StatCard label="Available Mentors" value={stats?.availableMentorsCount ?? 0} icon={UserCheck} color="purple" loading={loading} />
        <StatCard label="Open Jobs" value={stats?.jobsCount ?? 0} icon={Briefcase} color="amber" loading={loading} />
        <StatCard label="Upcoming Events" value={stats?.eventsCount ?? 0} icon={CalendarDays} color="green" loading={loading} />
        <StatCard label="Your Connections" value={stats?.connectionsCount ?? 0} icon={Users} color="rose" loading={loading} />
      </StatGrid>

      <div className="mt-8">
        <DashboardSection
          title="Find a Mentor"
          action={
            <Link to="/alumni">
              <Button className="text-xs px-3 py-1.5">Browse Alumni Directory</Button>
            </Link>
          }
        >
          <p className="text-sm text-slate-500">
            {loading
              ? "Loading..."
              : `${stats?.availableMentorsCount ?? 0} alumni are currently open to mentoring students. Browse the directory to find someone in your field of interest.`}
          </p>
        </DashboardSection>
      </div>
    </div>
  );
}
