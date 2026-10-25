import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Check, X, Award } from "lucide-react";
import {
  listPendingAchievementsAdmin,
  approveAchievementAdmin,
  rejectAchievementAdmin,
} from "../services/achievementService";
import { getErrorMessage } from "../utils/getErrorMessage";
import { ACHIEVEMENT_CATEGORY_LABELS } from "../utils/achievementCategories";

function formatDate(d) {
  return new Date(d).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function AdminAchievements() {
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actioningId, setActioningId] = useState(null);

  const fetchPending = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await listPendingAchievementsAdmin({ limit: 100 });
      setAchievements(data.achievements);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPending();
  }, [fetchPending]);

  const handleApprove = async (id) => {
    setActioningId(id);
    try {
      await approveAchievementAdmin(id);
      setAchievements((prev) => prev.filter((a) => a._id !== id));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActioningId(null);
    }
  };

  const handleReject = async (id) => {
    setActioningId(id);
    try {
      await rejectAchievementAdmin(id);
      setAchievements((prev) => prev.filter((a) => a._id !== id));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActioningId(null);
    }
  };

  return (
    <section>
      <h1 className="text-2xl font-semibold text-slate-800 mb-1 flex items-center gap-2">
        <Award size={22} /> Achievement Approvals
      </h1>
      <p className="text-sm text-slate-500 mb-6">
        {loading
          ? "Loading..."
          : `${achievements.length} pending achievement${achievements.length === 1 ? "" : "s"}`}
      </p>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-slate-500">Loading...</p>
      ) : achievements.length === 0 ? (
        <p className="text-slate-500 py-8 text-center">
          No achievements are waiting for review.
        </p>
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg divide-y divide-slate-100">
          {achievements.map((a) => (
            <div key={a._id} className="flex items-start justify-between gap-4 px-5 py-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                    {a.user?.profileImage ? (
                      <img loading="lazy" decoding="async"
                        src={a.user.profileImage}
                        alt={a.user.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-xs font-semibold text-slate-500">
                        {a.user?.name?.[0]?.toUpperCase()}
                      </span>
                    )}
                  </div>
                  <Link
                    to={`/alumni/${a.user?._id}`}
                    className="text-sm font-medium text-slate-800 hover:underline"
                  >
                    {a.user?.name}
                  </Link>
                </div>
                <p className="font-medium text-slate-800">{a.title}</p>
                <p className="text-xs text-slate-400 flex items-center gap-3 mt-1">
                  <span className="bg-slate-100 text-slate-600 rounded-full px-2 py-0.5">
                    {ACHIEVEMENT_CATEGORY_LABELS[a.category] || a.category}
                  </span>
                  <span>{formatDate(a.dateAchieved)}</span>
                </p>
                {a.description && (
                  <p className="text-sm text-slate-500 mt-2">{a.description}</p>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleApprove(a._id)}
                  disabled={actioningId === a._id}
                  className="flex items-center gap-1.5 text-sm font-medium bg-slate-800 text-white rounded-md px-3 py-1.5 hover:bg-slate-700 disabled:opacity-50"
                >
                  <Check size={14} /> Approve
                </button>
                <button
                  onClick={() => handleReject(a._id)}
                  disabled={actioningId === a._id}
                  className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-red-600 disabled:opacity-50"
                >
                  <X size={14} /> Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
