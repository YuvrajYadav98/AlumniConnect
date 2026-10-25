import { useEffect, useState } from "react";
import { listApprovedAchievementsForUser } from "../../services/achievementService";
import AchievementCard from "../AchievementCard";

/**
 * Renders the alumni's *verified* (admin-approved) achievements from
 * the Achievement collection - distinct from the free-text
 * "achievements" tag list on AlumniProfile itself, which is
 * self-reported and unmoderated. Fetches on its own so
 * ProfileDetailView doesn't need to know about this workflow.
 */
export default function AlumniAchievementsSection({ userId }) {
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    let isMounted = true;
    setLoading(true);
    (async () => {
      try {
        const data = await listApprovedAchievementsForUser(userId);
        if (isMounted) setAchievements(data.achievements);
      } catch {
        if (isMounted) setAchievements([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [userId]);

  if (loading) {
    return <div className="h-16 rounded-md bg-slate-100 animate-pulse" />;
  }

  if (achievements.length === 0) {
    return <p className="text-sm text-slate-400">No verified achievements yet.</p>;
  }

  return (
    <div className="space-y-2">
      {achievements.map((a) => (
        <AchievementCard key={a._id} achievement={a} />
      ))}
    </div>
  );
}
