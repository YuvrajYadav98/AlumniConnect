import { useState } from "react";
import { useForm } from "react-hook-form";
import { X } from "lucide-react";

import { sendMentorshipRequest } from "../services/mentorshipRequestService";
import { getErrorMessage } from "../utils/getErrorMessage";

import FormSelect from "./FormSelect";
import FormInput from "./FormInput";
import FormTextarea from "./FormTextarea";
import Button from "./Button";

export default function MentorshipRequestModal({
  mentor,
  onClose,
  onSuccess,
}) {
  const [serverError, setServerError] = useState("");
  const [serverInfo, setServerInfo] = useState("");

  // Safely get categories
  const categories = Array.isArray(mentor?.mentorshipCategories)
    ? mentor.mentorshipCategories
    : [];

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      category: categories[0] || "",
    },
  });

  const onSubmit = async (formData) => {
    setServerError("");
    setServerInfo("");

    try {
      if (!mentor?.user?._id) {
        setServerError("Mentor information is missing. Please try again.");
        return;
      }

      const data = await sendMentorshipRequest(
        mentor.user._id,
        formData
      );

      if (data?.message?.includes("already have")) {
        setServerInfo(data.message);
        return;
      }

      onSuccess?.();
    } catch (err) {
      setServerError(getErrorMessage(err));
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-lg bg-white p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 transition-colors hover:text-slate-700"
          aria-label="Close"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <h2 className="mb-1 pr-8 text-lg font-semibold text-slate-800">
          Request mentorship from {mentor?.user?.name || "Mentor"}
        </h2>

        <p className="mb-5 text-sm text-slate-500">
          {mentor?.jobTitle || "Mentor"}
          {mentor?.currentCompany
            ? ` at ${mentor.currentCompany}`
            : ""}
        </p>

        {/* Server Error */}
        {serverError && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {serverError}
          </div>
        )}

        {/* Server Info */}
        {serverInfo && (
          <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
            {serverInfo}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          {/* Mentorship Category */}
          <FormSelect
            label="Mentorship category"
            error={errors.category}
            registration={register("category", {
              required: "Please choose a category",
            })}
          >
            <option value="">Select a category</option>

            {categories.length > 0 ? (
              categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))
            ) : (
              <option value="" disabled>
                No mentorship categories available
              </option>
            )}
          </FormSelect>

          {/* Topic */}
          <FormInput
            label="Topic"
            placeholder="e.g. Resume review for SWE roles"
            error={errors.topic}
            registration={register("topic", {
              required: "Topic is required",
            })}
          />

          {/* Message */}
          <FormTextarea
            label="Message"
            placeholder="Tell them what you'd like help with..."
            error={errors.message}
            registration={register("message", {
              required: "A message is required",
              maxLength: {
                value: 1500,
                message: "Message is too long",
              },
            })}
          />

          {/* Submit */}
          <Button
            type="submit"
            disabled={isSubmitting || categories.length === 0}
            className="mt-2 w-full"
          >
            {isSubmitting ? "Sending..." : "Send Request"}
          </Button>
        </form>
      </div>
    </div>
  );
}
