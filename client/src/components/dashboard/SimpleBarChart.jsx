import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

/**
 * Generic vertical bar chart for { label, count } shaped data - used by
 * every "group by X, count" analytics endpoint (batch, branch, jobs by
 * category, event registrations).
 */
export default function SimpleBarChart({ data, loading, color = "#334155", height = 260 }) {
  if (loading) {
    return <div className="h-64 rounded-md bg-slate-100 animate-pulse" />;
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-sm text-slate-400">
        No data yet
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: "#64748b" }}
          angle={-25}
          textAnchor="end"
          interval={0}
          height={60}
        />
        <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#64748b" }} />
        <Tooltip
          contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: "#e2e8f0" }}
          cursor={{ fill: "#f8fafc" }}
        />
        <Bar dataKey="count" fill={color} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
