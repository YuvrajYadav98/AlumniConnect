import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { getEventById, getEventParticipants } from "../services/eventService";
import { getErrorMessage } from "../utils/getErrorMessage";

export default function AdminEventParticipants() {
  const { id } = useParams();
  const [eventTitle, setEventTitle] = useState("");
  const [participants, setParticipants] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError("");
      try {
        const [eventData, participantsData] = await Promise.all([
          getEventById(id),
          getEventParticipants(id, { limit: 200 }),
        ]);
        setEventTitle(eventData.event.title);
        setParticipants(participantsData.participants);
        setTotal(participantsData.total);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  return (
    <section className="max-w-3xl mx-auto">
      <Link
        to={`/admin/events/${id}`}
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 mb-4"
      >
        <ArrowLeft size={14} /> Back to event
      </Link>

      <h1 className="text-2xl font-semibold text-slate-800 mb-1">
        Participants {eventTitle && `— ${eventTitle}`}
      </h1>
      <p className="text-sm text-slate-500 mb-6">
        {loading ? "Loading..." : `${total} registered participant${total === 1 ? "" : "s"}`}
      </p>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-slate-500">Loading...</p>
      ) : participants.length === 0 ? (
        <p className="text-slate-500 py-8 text-center">No one has registered yet.</p>
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg divide-y divide-slate-100">
          {participants.map((p) => (
            <div key={p._id} className="flex items-center justify-between px-5 py-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                  {p.user?.profileImage ? (
                    <img loading="lazy" decoding="async"
                      src={p.user.profileImage}
                      alt={p.user.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-xs font-semibold text-slate-500">
                      {p.user?.name?.[0]?.toUpperCase()}
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800">{p.user?.name}</p>
                  <p className="text-xs text-slate-400">{p.user?.email}</p>
                </div>
              </div>
              <span className="text-xs text-slate-500 capitalize">{p.user?.role}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
