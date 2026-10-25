import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

const PALETTE = [
  "#334155",
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#8b5cf6",
  "#ef4444",
  "#06b6d4",
  "#ec4899",
  "#84cc16",
  "#94a3b8",
];

/**
 * Generic donut chart for { label, count } shaped data - used for
 * categorical breakdowns with a long tail (city, industry), where a
 * bar chart would need too many bars to stay readable.
 */
export default function SimplePieChart({ data, loading, height = 260 }) {
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
      <PieChart>
        <Pie
          data={data}
          dataKey="count"
          nameKey="label"
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={85}
          paddingAngle={1}
        >
          {data.map((entry, index) => (
            <Cell
              key={entry.label}
              fill={entry.label === "Other" ? "#cbd5e1" : PALETTE[index % PALETTE.length]}
            />
          ))}
        </Pie>
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: "#e2e8f0" }} />
        <Legend
          wrapperStyle={{ fontSize: 11 }}
          formatter={(value) => <span className="text-slate-600">{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
