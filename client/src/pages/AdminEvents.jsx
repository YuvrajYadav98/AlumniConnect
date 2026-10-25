import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Plus, Calendar, Users } from "lucide-react";
import { listEvents, publishEvent, cancelEvent, deleteEvent } from "../services/eventService";
import { getErrorMessage } from "../utils/getErrorMessage";
import Button from "../components/Button";

const formatDate = (d) =>
  new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });

export default function AdminEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actioningId, setActioningId] = useState(null);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await listEvents({ includeUnpublished: true, limit: 50 });
      setEvents(data.events);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const runAction = async (id, fn) => {
    setActioningId(id);
    try {
      await fn(id);
      await fetchEvents();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActioningId(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Permanently delete this event and all its registrations?")) return;
    await runAction(id, deleteEvent);
  };

  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Manage Events</h1>
          <p className="text-sm text-slate-500 mt-1">
            {loading ? "Loading..." : `${events.length} event${events.length === 1 ? "" : "s"}`}
          </p>
        </div>
        <Link to="/admin/events/create">
          <Button>
            <span className="inline-flex items-center gap-1.5">
              <Plus size={14} /> Create Event
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
      ) : events.length === 0 ? (
        <p className="text-slate-500 py-8 text-center">
          No events yet. Create your first one to get started.
        </p>
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg divide-y divide-slate-100">
          {events.map((e) => (
            <div key={e._id} className="flex items-center justify-between gap-4 px-5 py-4">
              <Link to={`/admin/events/${e._id}`} className="min-w-0 flex-1">
                <p className="font-medium text-slate-800 truncate">{e.title}</p>
                <p className="text-xs text-slate-500 flex items-center gap-3 mt-1">
                  <span className="flex items-center gap-1">
                    <Calendar size={12} /> {formatDate(e.date)}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full ${
                      e.isPublished
                        ? "bg-green-50 text-green-700"
                        : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    {e.isPublished ? "Published" : "Draft"}
                  </span>
                  {e.status === "cancelled" && (
                    <span className="px-2 py-0.5 rounded-full bg-red-50 text-red-700">
                      Cancelled
                    </span>
                  )}
                </p>
              </Link>

              <div className="flex items-center gap-2 shrink-0">
                <Link
                  to={`/admin/events/${e._id}/participants`}
                  className="text-slate-400 hover:text-slate-700 p-1.5"
                  title="View participants"
                >
                  <Users size={16} />
                </Link>
                {!e.isPublished && (
                  <button
                    onClick={() => runAction(e._id, publishEvent)}
                    disabled={actioningId === e._id}
                    className="text-xs font-medium text-white bg-slate-800 hover:bg-slate-700 rounded-md px-2.5 py-1 disabled:opacity-50"
                  >
                    Publish
                  </button>
                )}
                {e.status !== "cancelled" && (
                  <button
                    onClick={() => runAction(e._id, cancelEvent)}
                    disabled={actioningId === e._id}
                    className="text-xs font-medium text-amber-700 border border-amber-200 hover:bg-amber-50 rounded-md px-2.5 py-1 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                )}
                <button
                  onClick={() => handleDelete(e._id)}
                  disabled={actioningId === e._id}
                  className="text-xs font-medium text-red-600 hover:bg-red-50 rounded-md px-2.5 py-1 disabled:opacity-50"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
