export default function DashboardSection({ title, action, children, className = "" }) {
  return (
    <div className={`bg-white rounded-xl border border-slate-200 p-5 shadow-sm ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between mb-4">
          {title && <h2 className="text-base font-semibold text-slate-800">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </div>
  );
}
