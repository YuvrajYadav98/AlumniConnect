import { useEffect, useState } from "react";
import { Megaphone, Pin } from "lucide-react";
import { listAnnouncements } from "../services/announcementService";
import { getErrorMessage } from "../utils/getErrorMessage";

function formatDate(d) {
  return new Date(d).toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default function Announcements() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError("");
      try {
        const data = await listAnnouncements({ limit: 50 });
        setAnnouncements(data.announcements);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <section className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold text-slate-800 mb-1 flex items-center gap-2">
        <Megaphone size={22} /> Announcements
      </h1>
      <p className="text-sm text-slate-500 mb-6">
        {loading ? "Loading..." : `${announcements.length} announcement${announcements.length === 1 ? "" : "s"}`}
      </p>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-slate-500 text-center py-16">Loading...</p>
      ) : announcements.length === 0 ? (
        <p className="text-slate-500 text-center py-16">No announcements right now.</p>
      ) : (
        <div className="space-y-3">
          {announcements.map((a) => (
            <div key={a._id} className="bg-white border border-slate-200 rounded-lg p-5">
              <div className="flex items-start justify-between gap-2 mb-1">
                <h2 className="font-semibold text-slate-800">{a.title}</h2>
                {a.isPinned && (
                  <span className="shrink-0 flex items-center gap-1 text-xs text-amber-700 bg-amber-50 rounded-full px-2 py-0.5">
                    <Pin size={11} /> Pinned
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mb-3">
                {a.postedBy?.name && `${a.postedBy.name} · `}
                {formatDate(a.createdAt)}
              </p>
              <p className="text-sm text-slate-600 whitespace-pre-wrap">{a.content}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
