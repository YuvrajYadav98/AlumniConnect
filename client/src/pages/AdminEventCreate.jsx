import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createEvent } from "../services/eventService";
import { getErrorMessage } from "../utils/getErrorMessage";
import EventForm from "../components/EventForm";

export default function AdminEventCreate() {
  const navigate = useNavigate();
  const [error, setError] = useState("");

  const handleSubmit = async (payload) => {
    setError("");
    try {
      const data = await createEvent(payload);
      navigate(`/admin/events/${data.event._id}`, { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <section className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold text-slate-800 mb-1">Create Event</h1>
      <p className="text-sm text-slate-500 mb-6">
        New events start as an unpublished draft — publish it once you're ready
        for alumni and students to see it.
      </p>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <EventForm onSubmit={handleSubmit} submitLabel="Create Event" />
    </section>
  );
}
