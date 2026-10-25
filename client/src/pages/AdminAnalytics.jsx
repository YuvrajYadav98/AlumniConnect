import { useEffect, useState, useCallback } from "react";
import {
  Users,
  GraduationCap,
  UserSquare2,
  Briefcase,
  CalendarDays,
  Award,
  Link2,
  BarChart3,
} from "lucide-react";
import {
  getAnalyticsOverview,
  getAlumniByBatch,
  getAlumniByBranch,
  getAlumniByCity,
  getAlumniByIndustry,
  getJobsByCategory,
  getEventRegistrations,
  getMonthlyRegistrations,
} from "../services/analyticsService";
import { getErrorMessage } from "../utils/getErrorMessage";
import DashboardHeader from "../components/dashboard/DashboardHeader";
import StatGrid from "../components/dashboard/StatGrid";
import StatCard from "../components/dashboard/StatCard";
import DashboardSection from "../components/dashboard/DashboardSection";
import DateRangeFilter from "../components/dashboard/DateRangeFilter";
import SimpleBarChart from "../components/dashboard/SimpleBarChart";
import SimplePieChart from "../components/dashboard/SimplePieChart";
import MonthlyRegistrationsChart from "../components/dashboard/MonthlyRegistrationsChart";

const STAT_CARDS = [
  { key: "totalUsers", label: "Total Users", icon: Users, color: "slate" },
  { key: "totalAlumni", label: "Total Alumni", icon: GraduationCap, color: "blue" },
  { key: "totalStudents", label: "Total Students", icon: UserSquare2, color: "green" },
  { key: "totalMentors", label: "Total Mentors", icon: Award, color: "purple" },
  { key: "totalEvents", label: "Total Events", icon: CalendarDays, color: "amber" },
  { key: "totalJobs", label: "Total Jobs", icon: Briefcase, color: "indigo" },
  { key: "totalAchievements", label: "Total Achievements", icon: BarChart3, color: "rose" },
  { key: "totalConnections", label: "Total Connections", icon: Link2, color: "teal" },
];

export default function AdminAnalytics() {
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState("");

  const [alumniByBatch, setAlumniByBatch] = useState([]);
  const [alumniByBranch, setAlumniByBranch] = useState([]);
  const [alumniByCity, setAlumniByCity] = useState([]);
  const [alumniByIndustry, setAlumniByIndustry] = useState([]);
  const [jobsByCategory, setJobsByCategory] = useState([]);
  const [chartsLoading, setChartsLoading] = useState(true);

  // Date range applies to the two time-sensitive charts (event
  // registrations scoped to the event's own date, and monthly
  // registrations) - the categorical breakdowns above are always a
  // current-state snapshot, so a date filter wouldn't mean much there.
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [eventRegistrations, setEventRegistrations] = useState([]);
  const [monthlyRegistrations, setMonthlyRegistrations] = useState([]);
  const [timeChartsLoading, setTimeChartsLoading] = useState(true);

  const fetchOverviewAndBreakdowns = useCallback(async () => {
    setStatsLoading(true);
    setChartsLoading(true);
    setError("");
    try {
      const [overview, batch, branch, city, industry, jobs] = await Promise.all([
        getAnalyticsOverview(),
        getAlumniByBatch(),
        getAlumniByBranch(),
        getAlumniByCity(),
        getAlumniByIndustry(),
        getJobsByCategory(),
      ]);
      setStats(overview.stats);
      setAlumniByBatch(batch.data);
      setAlumniByBranch(branch.data);
      setAlumniByCity(city.data);
      setAlumniByIndustry(industry.data);
      setJobsByCategory(jobs.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setStatsLoading(false);
      setChartsLoading(false);
    }
  }, []);

  const fetchTimeCharts = useCallback(async () => {
    setTimeChartsLoading(true);
    try {
      const dateFilter = { ...(from ? { from } : {}), ...(to ? { to } : {}) };
      const [events, monthly] = await Promise.all([
        getEventRegistrations(dateFilter),
        getMonthlyRegistrations(dateFilter),
      ]);
      setEventRegistrations(events.data);
      setMonthlyRegistrations(monthly.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setTimeChartsLoading(false);
    }
  }, [from, to]);

  useEffect(() => {
    fetchOverviewAndBreakdowns();
  }, [fetchOverviewAndBreakdowns]);

  useEffect(() => {
    fetchTimeCharts();
  }, [fetchTimeCharts]);

  return (
    <section>
      <DashboardHeader
        title="Analytics"
        subtitle="Platform-wide statistics across alumni, students, events, and jobs"
      />

      {error && (
        <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <StatGrid>
        {STAT_CARDS.map((card) => (
          <StatCard
            key={card.key}
            label={card.label}
            value={stats?.[card.key] ?? 0}
            icon={card.icon}
            color={card.color}
            loading={statsLoading}
          />
        ))}
      </StatGrid>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
        <DashboardSection title="Alumni by Batch">
          <SimpleBarChart data={alumniByBatch} loading={chartsLoading} color="#3b82f6" />
        </DashboardSection>

        <DashboardSection title="Alumni by Branch">
          <SimpleBarChart data={alumniByBranch} loading={chartsLoading} color="#10b981" />
        </DashboardSection>

        <DashboardSection title="Alumni by City">
          <SimplePieChart data={alumniByCity} loading={chartsLoading} />
        </DashboardSection>

        <DashboardSection title="Alumni by Industry">
          <SimplePieChart data={alumniByIndustry} loading={chartsLoading} />
        </DashboardSection>

        <DashboardSection title="Jobs by Category" className="lg:col-span-2">
          <SimpleBarChart data={jobsByCategory} loading={chartsLoading} color="#8b5cf6" />
        </DashboardSection>

        <DashboardSection
          title="Event Registrations"
          className="lg:col-span-2"
          action={
            <DateRangeFilter
              from={from}
              to={to}
              onFromChange={setFrom}
              onToChange={setTo}
              onClear={() => {
                setFrom("");
                setTo("");
              }}
            />
          }
        >
          <p className="text-xs text-slate-400 mb-2">
            Top events by registration count, scoped to the event's own date
          </p>
          <SimpleBarChart
            data={eventRegistrations}
            loading={timeChartsLoading}
            color="#f59e0b"
          />
        </DashboardSection>

        <DashboardSection title="Monthly User Registrations" className="lg:col-span-2">
          <MonthlyRegistrationsChart
            data={monthlyRegistrations}
            loading={timeChartsLoading}
          />
        </DashboardSection>
      </div>
    </section>
  );
}
