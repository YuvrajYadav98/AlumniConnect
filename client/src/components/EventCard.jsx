import { memo } from "react";
import { Link } from "react-router-dom";
import { Calendar, Clock, MapPin, Video, Users } from "lucide-react";

const formatDate = (d) =>
  new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });

function EventCard({ event }) {
  const isPast = new Date(event.date) < new Date();

  return (
    <Link
      to={`/events/${event._id}`}
      className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:shadow-md hover:border-slate-300 transition-shadow flex flex-col"
    >
      <div className="h-36 bg-slate-100 flex items-center justify-center overflow-hidden">
        {event.image ? (
          <img loading="lazy" decoding="async" src={event.image} alt={event.title} className="w-full h-full object-cover" />
        ) : (
          <Calendar size={32} className="text-slate-300" />
        )}
      </div>

      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-center gap-2 mb-2">
          {event.status === "cancelled" && (
            <span className="text-xs font-medium bg-red-50 text-red-700 rounded-full px-2 py-0.5">
              Cancelled
            </span>
          )}
          {isPast && event.status !== "cancelled" && (
            <span className="text-xs font-medium bg-slate-100 text-slate-500 rounded-full px-2 py-0.5">
              Past event
            </span>
          )}
          <span className="text-xs font-medium bg-indigo-50 text-indigo-700 rounded-full px-2 py-0.5 capitalize">
            {event.eventType}
          </span>
        </div>

        <h3 className="font-semibold text-slate-800 line-clamp-2">{event.title}</h3>

        <div className="mt-2 space-y-1 text-xs text-slate-500">
          <p className="flex items-center gap-1.5">
            <Calendar size={12} className="shrink-0" /> {formatDate(event.date)}
          </p>
          <p className="flex items-center gap-1.5">
            <Clock size={12} className="shrink-0" /> {event.startTime} - {event.endTime}
          </p>
          <p className="flex items-center gap-1.5">
            {event.mode === "online" ? (
              <Video size={12} className="shrink-0" />
            ) : (
              <MapPin size={12} className="shrink-0" />
            )}
            {event.mode === "online" ? "Online" : event.mode === "hybrid" ? "Hybrid" : event.location}
          </p>
        </div>

        {event.maxParticipants && (
          <p className="mt-3 text-xs text-slate-400 flex items-center gap-1.5">
            <Users size={12} /> Max {event.maxParticipants} participants
          </p>
        )}
      </div>
    </Link>
  );
}

export default memo(EventCard);
