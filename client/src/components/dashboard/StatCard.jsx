const COLOR_STYLES = {
  slate: "bg-slate-50 text-slate-700 ring-slate-200",
  blue: "bg-blue-50 text-blue-700 ring-blue-200",
  green: "bg-green-50 text-green-700 ring-green-200",
  amber: "bg-amber-50 text-amber-700 ring-amber-200",
  purple: "bg-purple-50 text-purple-700 ring-purple-200",
  rose: "bg-rose-50 text-rose-700 ring-rose-200",
  indigo: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  teal: "bg-teal-50 text-teal-700 ring-teal-200",
};

/**
 * A single stat tile used across all role dashboards.
 * `icon` is a lucide-react component reference, e.g. Users.
 */
export default function StatCard({ label, value, icon: Icon, color = "slate", loading }) {
  const colorClass = COLOR_STYLES[color] || COLOR_STYLES.slate;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
      <div className={`shrink-0 rounded-lg p-3 ring-1 ${colorClass}`}>
        {Icon && <Icon size={22} strokeWidth={2} />}
      </div>
      <div className="min-w-0">
        <p className="text-sm text-slate-500 truncate">{label}</p>
        {loading ? (
          <div className="h-7 w-16 mt-1 rounded bg-slate-200 animate-pulse" />
        ) : (
          <p className="text-2xl font-semibold text-slate-800">{value}</p>
        )}
      </div>
    </div>
  );
}
