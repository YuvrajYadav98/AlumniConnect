export default function ProgressBar({ percent = 0, colorClass = "bg-slate-800" }) {
  const clamped = Math.min(100, Math.max(0, percent));

  return (
    <div className="w-full">
      <div className="flex justify-between text-xs text-slate-500 mb-1">
        <span>Completion</span>
        <span>{clamped}%</span>
      </div>
      <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
        <div
          className={`h-full rounded-full ${colorClass} transition-all duration-500`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
