import { memo } from "react";
import { Link } from "react-router-dom";
import { Briefcase, Clock, Award } from "lucide-react";

function MentorCard({ mentor, onRequestClick }) {
  const userId = mentor.user?._id;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md hover:border-slate-300 transition-shadow flex flex-col">
      <Link to={`/alumni/${userId}`} className="flex items-start gap-3 mb-3">
        <div className="w-14 h-14 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center shrink-0 ring-2 ring-white shadow-sm">
          {mentor.user?.profileImage ? (
            <img loading="lazy" decoding="async"
              src={mentor.user.profileImage}
              alt={mentor.user.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-lg font-semibold text-slate-500">
              {mentor.user?.name?.[0]?.toUpperCase()}
            </span>
          )}
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-slate-800 truncate">{mentor.user?.name}</p>
          <p className="text-sm text-slate-500 truncate flex items-center gap-1">
            <Briefcase size={13} className="shrink-0" />
            {mentor.jobTitle || "—"}
            {mentor.currentCompany && ` at ${mentor.currentCompany}`}
          </p>
          {typeof mentor.experienceYears === "number" && (
            <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
              <Award size={12} /> {mentor.experienceYears} yrs experience
            </p>
          )}
        </div>
      </Link>

      {mentor.bio && (
        <p className="text-sm text-slate-600 line-clamp-2 mb-3">{mentor.bio}</p>
      )}

      {mentor.mentorshipCategories?.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {mentor.mentorshipCategories.map((cat) => (
            <span
              key={cat}
              className="text-xs bg-indigo-50 text-indigo-700 rounded-full px-2 py-0.5"
            >
              {cat}
            </span>
          ))}
        </div>
      )}

      {mentor.mentorshipAvailability && (
        <p className="text-xs text-slate-500 flex items-center gap-1 mb-4">
          <Clock size={12} className="shrink-0" /> {mentor.mentorshipAvailability}
        </p>
      )}

      <div className="mt-auto flex gap-2 pt-2">
        <Link
          to={`/alumni/${userId}`}
          className="flex-1 text-center text-sm font-medium rounded-md border border-slate-300 text-slate-700 px-3 py-1.5 hover:bg-slate-50 transition-colors"
        >
          View Profile
        </Link>
        <button
          onClick={() => onRequestClick(mentor)}
          className="flex-1 text-sm font-medium rounded-md px-3 py-1.5 bg-slate-800 text-white hover:bg-slate-700 transition-colors"
        >
          Request Mentorship
        </button>
      </div>
    </div>
  );
}

export default memo(MentorCard);
