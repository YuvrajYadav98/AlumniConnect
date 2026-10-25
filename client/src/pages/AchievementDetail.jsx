import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Calendar, Award } from "lucide-react";
import { getAchievementById } from "../services/achievementService";
import { getErrorMessage } from "../utils/getErrorMessage";
import { ACHIEVEMENT_CATEGORY_LABELS } from "../utils/achievementCategories";
import StatusBadge from "../components/StatusBadge";

function formatDate(d) {
  return new Date(d).toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default function AchievementDetail() {
  const { id } = useParams();
  const [achievement, setAchievement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError("");
      try {
        const data = await getAchievementById(id);
        setAchievement(data.achievement);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) return <p className="text-center text-slate-500 py-16">Loading...</p>;

  return (
    <section className="max-w-2xl mx-auto">
      <Link
        to="/achievements"
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 mb-4"
      >
        <ArrowLeft size={14} /> Back to achievements
      </Link>

      {error ? (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg p-6">
          {achievement.image && (
            <img loading="lazy" decoding="async"
              src={achievement.image}
              alt=""
              className="w-full h-48 object-cover rounded-md mb-5"
            />
          )}

          <div className="flex items-start justify-between gap-3 mb-2">
            <h1 className="text-2xl font-semibold text-slate-800">{achievement.title}</h1>
            <StatusBadge status={achievement.status} />
          </div>

          <div className="flex items-center gap-4 text-sm text-slate-500 mb-5">
            <span className="flex items-center gap-1.5">
              <Award size={14} />
              {ACHIEVEMENT_CATEGORY_LABELS[achievement.category] || achievement.category}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar size={14} />
              {formatDate(achievement.dateAchieved)}
            </span>
          </div>

          {achievement.user?.name && (
            <p className="text-sm text-slate-500 mb-5">
              By{" "}
              <Link
                to={`/alumni/${achievement.user._id}`}
                className="text-slate-800 font-medium hover:underline"
              >
                {achievement.user.name}
              </Link>
            </p>
          )}

          {achievement.description ? (
            <p className="text-sm text-slate-600 whitespace-pre-wrap">
              {achievement.description}
            </p>
          ) : (
            <p className="text-sm text-slate-400 italic">No additional description.</p>
          )}
        </div>
      )}
    </section>
  );
}
