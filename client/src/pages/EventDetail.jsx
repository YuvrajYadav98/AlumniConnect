import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Calendar, Clock, MapPin, Video, Users, ArrowLeft } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import {
  getEventById,
  registerForEvent,
  cancelEventRegistration,
} from "../services/eventService";
import { getErrorMessage } from "../utils/getErrorMessage";
import Button from "../components/Button";

const formatDate = (d) =>
  new Date(d).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

export default function EventDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [acting, setActing] = useState(false);

  const fetchEvent = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await getEventById(id);
      setData(result);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleRegister = async () => {
    setActing(true);
    setActionError("");
    try {
      await registerForEvent(id);
      await fetchEvent();
    } catch (err) {
      setActionError(getErrorMessage(err));
    } finally {
      setActing(false);
    }
  };

  const handleCancel = async () => {
    setActing(true);
    setActionError("");
    try {
      await cancelEventRegistration(id);
      await fetchEvent();
    } catch (err) {
      setActionError(getErrorMessage(err));
    } finally {
      setActing(false);
    }
  };

  if (loading) {
    return <p className="text-center text-slate-500 py-16">Loading event...</p>;
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
        {error}
      </div>
    );
  }

  const { event, registeredCount, isFull, myRegistrationStatus } = data;
  const isRegistered = myRegistrationStatus && myRegistrationStatus !== "cancelled";
  const isPastDeadline = new Date() > new Date(event.registrationDeadline);
  const isCancelled = event.status === "cancelled";
  const canRegister = !isRegistered && !isFull && !isPastDeadline && !isCancelled;

  return (
    <section className="max-w-3xl mx-auto">
      <Link
        to="/events"
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 mb-4"
      >
        <ArrowLeft size={14} /> Back to events
      </Link>

      {event.image && (
        <div className="h-56 rounded-lg overflow-hidden mb-6 bg-slate-100">
          <img loading="lazy" decoding="async" src={event.image} alt={event.title} className="w-full h-full object-cover" />
        </div>
      )}

      <div className="flex items-center gap-2 mb-3">
        {isCancelled && (
          <span className="text-xs font-medium bg-red-50 text-red-700 rounded-full px-2 py-0.5">
            Cancelled
          </span>
        )}
        <span className="text-xs font-medium bg-indigo-50 text-indigo-700 rounded-full px-2 py-0.5 capitalize">
          {event.eventType}
        </span>
      </div>

      <h1 className="text-2xl font-semibold text-slate-800 mb-2">{event.title}</h1>
      <p className="text-sm text-slate-500 mb-6">
        Organized by {event.organizer?.name || "AlumniConnect"}
      </p>

      <div className="bg-white border border-slate-200 rounded-lg p-5 mb-6 space-y-3 text-sm">
        <p className="flex items-center gap-2 text-slate-700">
          <Calendar size={16} className="text-slate-400 shrink-0" /> {formatDate(event.date)}
        </p>
        <p className="flex items-center gap-2 text-slate-700">
          <Clock size={16} className="text-slate-400 shrink-0" />
          {event.startTime} - {event.endTime}
        </p>
        <p className="flex items-center gap-2 text-slate-700">
          {event.mode === "online" ? (
            <Video size={16} className="text-slate-400 shrink-0" />
          ) : (
            <MapPin size={16} className="text-slate-400 shrink-0" />
          )}
          {event.mode === "offline" && event.location}
          {event.mode === "online" && "Online event"}
          {event.mode === "hybrid" && `${event.location} + Online`}
        </p>
        {(event.mode === "online" || event.mode === "hybrid") &&
          event.meetingLink &&
          isRegistered && (
            <p className="flex items-center gap-2 text-slate-700">
              <Video size={16} className="text-slate-400 shrink-0" />
              <a
                href={event.meetingLink}
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 hover:underline break-all"
              >
                {event.meetingLink}
              </a>
            </p>
          )}
        <p className="flex items-center gap-2 text-slate-700">
          <Users size={16} className="text-slate-400 shrink-0" />
          {registeredCount} registered
          {event.maxParticipants && ` / ${event.maxParticipants} max`}
        </p>
      </div>

      <div className="mb-6">
        <h2 className="text-base font-semibold text-slate-800 mb-2">About this event</h2>
        <p className="text-sm text-slate-600 whitespace-pre-wrap">{event.description}</p>
      </div>

      {actionError && (
        <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
          {actionError}
        </div>
      )}

      {user?.role !== "admin" && (
        <div>
          {isRegistered ? (
            <Button
              onClick={handleCancel}
              disabled={acting}
              className="bg-white text-red-600 border border-red-200 hover:bg-red-50"
            >
              {acting ? "Cancelling..." : "Cancel Registration"}
            </Button>
          ) : (
            <Button onClick={handleRegister} disabled={!canRegister || acting}>
              {acting
                ? "Registering..."
                : isCancelled
                ? "Event Cancelled"
                : isFull
                ? "Event Full"
                : isPastDeadline
                ? "Registration Closed"
                : "Register"}
            </Button>
          )}
        </div>
      )}

      {user?.role === "admin" && (
        <Button
          onClick={() => navigate(`/admin/events/${id}/participants`)}
          className="bg-white text-slate-700 border border-slate-300 hover:bg-slate-50"
        >
          View Participants
        </Button>
      )}
    </section>
  );
}
