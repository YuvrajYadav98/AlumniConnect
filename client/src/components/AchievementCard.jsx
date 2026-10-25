import { Link } from "react-router-dom";
import { Award, Calendar } from "lucide-react";
import { ACHIEVEMENT_CATEGORY_LABELS } from "../utils/achievementCategories";
import StatusBadge from "./StatusBadge";

function formatDate(d) {
  return new Date(d).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * `linkTo` is optional - the admin queue and public profile use this
 * card without a details link, while "My Achievements" links through
 * to /achievements/:id.
 */
export default function AchievementCard({ achievement, linkTo, showStatus = false }) {
  const content = (
    <div className="bg-white border border-slate-200 rounded-lg p-4 flex gap-3">
      <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 overflow-hidden">
        {achievement.image ? (
          <img loading="lazy" decoding="async" src={achievement.image} alt="" className="w-full h-full object-cover" />
        ) : (
          <Award size={18} />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="font-medium text-slate-800 truncate">{achievement.title}</p>
          {showStatus && <StatusBadge status={achievement.status} />}
        </div>
        <p className="text-xs text-slate-400 flex items-center gap-3 mt-1">
          <span className="bg-slate-100 text-slate-600 rounded-full px-2 py-0.5">
            {ACHIEVEMENT_CATEGORY_LABELS[achievement.category] || achievement.category}
          </span>
          <span className="flex items-center gap-1">
            <Calendar size={11} /> {formatDate(achievement.dateAchieved)}
          </span>
        </p>
        {achievement.description && (
          <p className="text-sm text-slate-500 mt-2 line-clamp-2">{achievement.description}</p>
        )}
      </div>
    </div>
  );

  if (linkTo) {
    return (
      <Link to={linkTo} className="block hover:shadow-md transition-shadow rounded-lg">
        {content}
      </Link>
    );
  }

  return content;
}
