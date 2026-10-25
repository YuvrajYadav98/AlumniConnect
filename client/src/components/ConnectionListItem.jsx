import { Link } from "react-router-dom";

export default function ConnectionListItem({ user, subtitle, children }) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-4">
      <Link to={`/alumni/${user._id}`} className="flex items-center gap-3 min-w-0">
        <div className="w-11 h-11 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center shrink-0">
          {user.profileImage ? (
            <img loading="lazy" decoding="async" src={user.profileImage} alt={user.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-sm font-semibold text-slate-500">
              {user.name?.[0]?.toUpperCase()}
            </span>
          )}
        </div>
        <div className="min-w-0">
          <p className="font-medium text-slate-800 truncate">{user.name}</p>
          {subtitle && <p className="text-xs text-slate-500 truncate">{subtitle}</p>}
        </div>
      </Link>
      <div className="flex items-center gap-2 shrink-0">{children}</div>
    </div>
  );
}
