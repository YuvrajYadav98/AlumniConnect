import { memo, useState } from "react";
import { Link } from "react-router-dom";
import { Briefcase, MapPin, GraduationCap, Check, Clock, UserPlus } from "lucide-react";
import { sendConnectionRequest } from "../services/connectionService";

// Maps a connection status to what the Connect button should show.
// Kept as a lookup so the render logic below stays a single line.
const CONNECT_BUTTON_STATE = {
  none: { label: "Connect", icon: UserPlus, disabled: false },
  pending_sent: { label: "Pending", icon: Clock, disabled: true },
  pending_received: { label: "Respond", icon: Clock, disabled: true },
  accepted: { label: "Connected", icon: Check, disabled: true },
  blocked: { label: "Connect", icon: UserPlus, disabled: true },
};

// Memoized since directory search results re-render the whole grid on
// every keystroke/filter change - memo skips re-rendering cards whose
// underlying profile object hasn't changed.
function AlumniCard({ profile }) {
  const [status, setStatus] = useState("none");
  const [sending, setSending] = useState(false);

  const userId = profile.user?._id;
  const buttonState = CONNECT_BUTTON_STATE[status] || CONNECT_BUTTON_STATE.none;
  const Icon = buttonState.icon;

  const handleConnect = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (sending || buttonState.disabled) return;

    setSending(true);
    try {
      const data = await sendConnectionRequest(userId);
      setStatus(data.status);
    } catch {
      // Silently keep the button in its current state on failure - the
      // person can just try again, no need for a disruptive card-level error.
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md hover:border-slate-300 transition-shadow flex flex-col">
      <Link to={`/alumni/${userId}`} className="flex items-start gap-3 mb-3">
        <div className="w-14 h-14 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center shrink-0 ring-2 ring-white shadow-sm">
          {profile.user?.profileImage ? (
            <img loading="lazy" decoding="async"
              src={profile.user.profileImage}
              alt={profile.user.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-lg font-semibold text-slate-500">
              {profile.user?.name?.[0]?.toUpperCase()}
            </span>
          )}
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-slate-800 truncate">{profile.user?.name}</p>
          <p className="text-sm text-slate-500 truncate flex items-center gap-1">
            <Briefcase size={13} className="shrink-0" />
            {profile.jobTitle || "—"}
            {profile.currentCompany && ` at ${profile.currentCompany}`}
          </p>
        </div>
      </Link>

      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500 mb-3">
        {profile.branch && (
          <span className="flex items-center gap-1">
            <GraduationCap size={12} /> {profile.branch}
            {profile.batch ? ` · ${profile.batch}` : profile.graduationYear ? ` · ${profile.graduationYear}` : ""}
          </span>
        )}
        {profile.city && (
          <span className="flex items-center gap-1">
            <MapPin size={12} /> {profile.city}
          </span>
        )}
      </div>

      {profile.skills?.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-4">
          {profile.skills.slice(0, 3).map((skill) => (
            <span
              key={skill}
              className="text-xs bg-slate-100 text-slate-600 rounded-full px-2 py-0.5"
            >
              {skill}
            </span>
          ))}
          {profile.skills.length > 3 && (
            <span className="text-xs text-slate-400 px-1 py-0.5">
              +{profile.skills.length - 3}
            </span>
          )}
        </div>
      )}

      <div className="mt-auto flex gap-2 pt-2">
        <Link
          to={`/alumni/${userId}`}
          className="flex-1 text-center text-sm font-medium rounded-md border border-slate-300 text-slate-700 px-3 py-1.5 hover:bg-slate-50 transition-colors"
        >
          View Profile
        </Link>
        <button
          onClick={handleConnect}
          disabled={sending || buttonState.disabled}
          className={`flex-1 flex items-center justify-center gap-1 text-sm font-medium rounded-md px-3 py-1.5 transition-colors ${
            status === "accepted"
              ? "bg-green-50 text-green-700 cursor-default"
              : buttonState.disabled
              ? "bg-slate-100 text-slate-400 cursor-default"
              : "bg-slate-800 text-white hover:bg-slate-700"
          }`}
        >
          <Icon size={14} />
          {sending ? "Sending..." : buttonState.label}
        </button>
      </div>
    </div>
  );
}

export default memo(AlumniCard);
