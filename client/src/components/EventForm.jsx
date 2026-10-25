import { useForm } from "react-hook-form";
import FormInput from "./FormInput";
import FormSelect from "./FormSelect";
import FormTextarea from "./FormTextarea";
import Button from "./Button";

const EVENT_TYPES = ["webinar", "reunion", "workshop", "networking", "seminar", "other"];

const toDateInputValue = (value) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
};

export default function EventForm({ initialValues, onSubmit, submitLabel = "Save" }) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      title: initialValues?.title || "",
      description: initialValues?.description || "",
      eventType: initialValues?.eventType || "other",
      date: toDateInputValue(initialValues?.date),
      startTime: initialValues?.startTime || "",
      endTime: initialValues?.endTime || "",
      registrationDeadline: toDateInputValue(initialValues?.registrationDeadline),
      mode: initialValues?.mode || "offline",
      location: initialValues?.location || "",
      meetingLink: initialValues?.meetingLink || "",
      maxParticipants: initialValues?.maxParticipants || "",
    },
  });

  const mode = watch("mode");

  const submit = (formData) => {
    onSubmit({
      ...formData,
      maxParticipants: formData.maxParticipants ? Number(formData.maxParticipants) : null,
    });
  };

  return (
    <form onSubmit={handleSubmit(submit)} noValidate className="space-y-6">
      <fieldset className="bg-white p-6 rounded-lg border border-slate-200">
        <legend className="text-base font-semibold text-slate-800 px-1">Event Details</legend>
        <FormInput
          label="Title"
          error={errors.title}
          registration={register("title", { required: "Title is required" })}
        />
        <FormTextarea
          label="Description"
          error={errors.description}
          registration={register("description", { required: "Description is required" })}
        />
        <FormSelect label="Event Type" registration={register("eventType")}>
          {EVENT_TYPES.map((t) => (
            <option key={t} value={t} className="capitalize">
              {t}
            </option>
          ))}
        </FormSelect>
      </fieldset>

      <fieldset className="bg-white p-6 rounded-lg border border-slate-200">
        <legend className="text-base font-semibold text-slate-800 px-1">Date &amp; Time</legend>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4">
          <FormInput
            label="Event Date"
            type="date"
            error={errors.date}
            registration={register("date", { required: "Date is required" })}
          />
          <FormInput
            label="Start Time"
            type="time"
            error={errors.startTime}
            registration={register("startTime", { required: "Start time is required" })}
          />
          <FormInput
            label="End Time"
            type="time"
            error={errors.endTime}
            registration={register("endTime", { required: "End time is required" })}
          />
        </div>
        <FormInput
          label="Registration Deadline"
          type="date"
          error={errors.registrationDeadline}
          registration={register("registrationDeadline", {
            required: "Registration deadline is required",
          })}
        />
      </fieldset>

      <fieldset className="bg-white p-6 rounded-lg border border-slate-200">
        <legend className="text-base font-semibold text-slate-800 px-1">Location</legend>
        <FormSelect label="Mode" registration={register("mode")}>
          <option value="offline">Offline</option>
          <option value="online">Online</option>
          <option value="hybrid">Hybrid</option>
        </FormSelect>

        {(mode === "offline" || mode === "hybrid") && (
          <FormInput
            label="Location"
            placeholder="Main Auditorium, Campus Block A"
            error={errors.location}
            registration={register("location", {
              required: mode !== "online" ? "Location is required for this mode" : false,
            })}
          />
        )}

        {(mode === "online" || mode === "hybrid") && (
          <FormInput
            label="Meeting Link"
            placeholder="https://zoom.us/j/..."
            error={errors.meetingLink}
            registration={register("meetingLink", {
              required: mode !== "offline" ? "Meeting link is required for this mode" : false,
            })}
          />
        )}
      </fieldset>

      <fieldset className="bg-white p-6 rounded-lg border border-slate-200">
        <legend className="text-base font-semibold text-slate-800 px-1">Capacity</legend>
        <FormInput
          label="Maximum Participants (leave blank for unlimited)"
          type="number"
          min="1"
          registration={register("maxParticipants")}
        />
      </fieldset>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Saving..." : submitLabel}
      </Button>
    </form>
  );
}
