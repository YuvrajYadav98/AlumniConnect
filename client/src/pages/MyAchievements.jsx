import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Plus, Trash2, Award } from "lucide-react";
import { listMyAchievements, deleteMyAchievement } from "../services/achievementService";
import { getErrorMessage } from "../utils/getErrorMessage";
import AchievementCard from "../components/AchievementCard";
import Button from "../components/Button";

export default function MyAchievements() {
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  const fetchAchievements = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await listMyAchievements({ limit: 50 });
      setAchievements(data.achievements);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAchievements();
  }, [fetchAchievements]);

  const handleDelete = async (e, id) => {
    // Stop the click from bubbling up to the wrapping <Link> and
    // navigating to the details page instead of deleting.
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm("Delete this achievement?")) return;
    setDeletingId(id);
    try {
      await deleteMyAchievement(id);
      setAchievements((prev) => prev.filter((a) => a._id !== id));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800 flex items-center gap-2">
            <Award size={22} /> My Achievements
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {loading
              ? "Loading..."
              : `${achievements.length} achievement${achievements.length === 1 ? "" : "s"}`}
          </p>
        </div>
        <Link to="/achievements/submit">
          <Button>
            <span className="inline-flex items-center gap-1.5">
              <Plus size={14} /> Submit Achievement
            </span>
          </Button>
        </Link>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-slate-500">Loading...</p>
      ) : achievements.length === 0 ? (
        <p className="text-slate-500 py-8 text-center">
          You haven't submitted any achievements yet.
        </p>
      ) : (
        <div className="space-y-3">
          {achievements.map((a) => (
            <div key={a._id} className="relative">
              <AchievementCard
                achievement={a}
                linkTo={`/achievements/${a._id}`}
                showStatus
              />
              <button
                onClick={(e) => handleDelete(e, a._id)}
                disabled={deletingId === a._id}
                className="absolute top-3 right-3 text-slate-400 hover:text-red-600 p-1 disabled:opacity-50"
                title="Delete"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
