import { useEffect, useState, useCallback } from "react";
import { listMyRegisteredEvents, cancelEventRegistration } from "../services/eventService";
import { getErrorMessage } from "../utils/getErrorMessage";
import EventCard from "../components/EventCard";

export default function MyRegisteredEvents() {
  const [when, setWhen] = useState("upcoming");
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancellingId, setCancellingId] = useState(null);

  const fetchRegistrations = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await listMyRegisteredEvents({ when, limit: 50 });
      setRegistrations(data.registrations);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [when]);

  useEffect(() => {
    fetchRegistrations();
  }, [fetchRegistrations]);

  const handleCancel = async (eventId) => {
    setCancellingId(eventId);
    try {
      await cancelEventRegistration(eventId);
      setRegistrations((prev) => prev.filter((r) => r.event._id !== eventId));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <section>
      <h1 className="text-2xl font-semibold text-slate-800 mb-1">My Registered Events</h1>
      <p className="text-sm text-slate-500 mb-6">
        {loading ? "Loading..." : `${registrations.length} event${registrations.length === 1 ? "" : "s"}`}
      </p>

      <div className="flex gap-2 mb-6">
        {["upcoming", "past"].map((w) => (
          <button
            key={w}
            onClick={() => setWhen(w)}
            className={`text-sm px-4 py-1.5 rounded-full border capitalize transition-colors ${
              when === w
                ? "bg-slate-800 text-white border-slate-800"
                : "bg-white text-slate-600 border-slate-300 hover:bg-slate-50"
            }`}
          >
            {w}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-slate-500">Loading...</p>
      ) : registrations.length === 0 ? (
        <p className="text-slate-500 py-8 text-center">
          You haven't registered for any {when} events.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {registrations.map((r) => (
            <div key={r._id} className="relative">
              <EventCard event={r.event} />
              {when === "upcoming" && (
                <button
                  onClick={() => handleCancel(r.event._id)}
                  disabled={cancellingId === r.event._id}
                  className="absolute top-3 right-3 text-xs font-medium bg-white/95 text-red-600 border border-red-200 rounded-md px-2 py-1 hover:bg-red-50 disabled:opacity-50"
                >
                  {cancellingId === r.event._id ? "Cancelling..." : "Cancel"}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
