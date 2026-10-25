export default function DashboardHeader({ title, subtitle }) {
  return (
    <div className="mb-8">
      <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">{title}</h1>
      {subtitle && <p className="text-slate-500 mt-1">{subtitle}</p>}
    </div>
  );
}
