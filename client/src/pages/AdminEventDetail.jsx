import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Users, ArrowLeft, ImagePlus } from "lucide-react";
import {
  getEventById,
  updateEvent,
  deleteEvent,
  publishEvent,
  cancelEvent,
  uploadEventImage,
} from "../services/eventService";
import { getErrorMessage } from "../utils/getErrorMessage";
import EventForm from "../components/EventForm";
import Button from "../components/Button";

export default function AdminEventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [acting, setActing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const fetchEvent = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getEventById(id);
      setEvent(data.event);
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

  const runAction = async (fn) => {
    setActing(true);
    setActionError("");
    try {
      await fn();
      await fetchEvent();
    } catch (err) {
      setActionError(getErrorMessage(err));
    } finally {
      setActing(false);
    }
  };

  const handleUpdate = async (payload) => {
    setActionError("");
    try {
      await updateEvent(id, payload);
      await fetchEvent();
    } catch (err) {
      setActionError(getErrorMessage(err));
    }
  };

  const handleDelete = async () => {
    setActing(true);
    try {
      await deleteEvent(id);
      navigate("/admin/events", { replace: true });
    } catch (err) {
      setActionError(getErrorMessage(err));
      setActing(false);
    }
  };

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setActing(true);
    setActionError("");
    try {
      await uploadEventImage(id, file);
      await fetchEvent();
    } catch (err) {
      setActionError(getErrorMessage(err));
    } finally {
      setActing(false);
    }
  };

  if (loading) return <p className="text-center text-slate-500 py-16">Loading...</p>;
  if (error) {
    return (
      <div className="max-w-2xl mx-auto rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
        {error}
      </div>
    );
  }

  return (
    <section className="max-w-2xl mx-auto">
      <Link
        to="/admin/events"
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 mb-4"
      >
        <ArrowLeft size={14} /> Back to events
      </Link>

      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-semibold text-slate-800">{event.title}</h1>
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center text-xs font-medium rounded-full px-2.5 py-0.5 ring-1 ${
              event.isPublished
                ? "bg-green-50 text-green-700 ring-green-200"
                : "bg-amber-50 text-amber-700 ring-amber-200"
            }`}
          >
            {event.isPublished ? "Published" : "Draft"}
          </span>
          {event.status === "cancelled" && (
            <span className="inline-flex items-center text-xs font-medium rounded-full px-2.5 py-0.5 ring-1 bg-red-50 text-red-700 ring-red-200">
              Cancelled
            </span>
          )}
        </div>
      </div>
      <p className="text-sm text-slate-500 mb-6">
        {event.isPublished ? "Published" : "Draft — not visible to alumni/students yet"}
        {event.status === "cancelled" && " · Cancelled"}
      </p>

      {actionError && (
        <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
          {actionError}
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-lg p-5 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-20 w-32 rounded-md bg-slate-100 overflow-hidden flex items-center justify-center shrink-0">
            {event.image ? (
              <img loading="lazy" decoding="async" src={event.image} alt="" className="w-full h-full object-cover" />
            ) : (
              <ImagePlus size={20} className="text-slate-300" />
            )}
          </div>
          <label className="text-sm font-medium text-slate-700 border border-slate-300 rounded-md px-3 py-1.5 cursor-pointer hover:bg-slate-50">
            {event.image ? "Replace Image" : "Upload Image"}
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
              disabled={acting}
            />
          </label>
        </div>

        <div className="flex flex-wrap gap-2">
          {!event.isPublished && (
            <Button
              onClick={() => runAction(() => publishEvent(id))}
              disabled={acting}
            >
              Publish Event
            </Button>
          )}
          {event.status !== "cancelled" && (
            <Button
              onClick={() => runAction(() => cancelEvent(id))}
              disabled={acting}
              className="bg-amber-600 hover:bg-amber-500"
            >
              Cancel Event
            </Button>
          )}
          <Link to={`/admin/events/${id}/participants`}>
            <Button
              disabled={acting}
              className="bg-white text-slate-700 border border-slate-300 hover:bg-slate-50"
            >
              <span className="inline-flex items-center gap-1.5">
                <Users size={14} /> View Participants
              </span>
            </Button>
          </Link>

          {!confirmDelete ? (
            <Button
              onClick={() => setConfirmDelete(true)}
              disabled={acting}
              className="bg-white text-red-600 border border-red-200 hover:bg-red-50 ml-auto"
            >
              Delete Event
            </Button>
          ) : (
            <div className="ml-auto flex items-center gap-2">
              <span className="text-sm text-slate-500">Delete permanently?</span>
              <Button onClick={handleDelete} disabled={acting} className="bg-red-600 hover:bg-red-500">
                Confirm
              </Button>
              <Button
                onClick={() => setConfirmDelete(false)}
                className="bg-white text-slate-700 border border-slate-300 hover:bg-slate-50"
              >
                Cancel
              </Button>
            </div>
          )}
        </div>
      </div>

      <EventForm initialValues={event} onSubmit={handleUpdate} submitLabel="Save Changes" />
    </section>
  );
}
