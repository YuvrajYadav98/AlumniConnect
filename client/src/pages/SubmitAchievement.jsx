import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { submitAchievement } from "../services/achievementService";
import { getErrorMessage } from "../utils/getErrorMessage";
import {
  ACHIEVEMENT_CATEGORIES,
  ACHIEVEMENT_CATEGORY_LABELS,
} from "../utils/achievementCategories";
import FormInput from "../components/FormInput";
import FormSelect from "../components/FormSelect";
import FormTextarea from "../components/FormTextarea";
import Button from "../components/Button";

const todayIsoDate = () => new Date().toISOString().slice(0, 10);

export default function SubmitAchievement() {
  const navigate = useNavigate();
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: { category: "award", dateAchieved: todayIsoDate() },
  });

  const onSubmit = async (formData) => {
    setError("");
    try {
      await submitAchievement(formData);
      navigate("/achievements", { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <section className="max-w-xl mx-auto">
      <h1 className="text-2xl font-semibold text-slate-800 mb-1">
        Submit an Achievement
      </h1>
      <p className="text-sm text-slate-500 mb-6">
        Your submission will be reviewed by an admin before it appears on
        your public profile.
      </p>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="bg-white border border-slate-200 rounded-lg p-6"
      >
        <FormInput
          label="Title"
          placeholder="e.g. Winner, National Hackathon 2026"
          error={errors.title}
          registration={register("title", {
            required: "Title is required",
            maxLength: { value: 200, message: "Title is too long" },
          })}
        />

        <FormSelect label="Category" registration={register("category")}>
          {ACHIEVEMENT_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {ACHIEVEMENT_CATEGORY_LABELS[cat]}
            </option>
          ))}
        </FormSelect>

        <FormInput
          label="Date Achieved"
          type="date"
          error={errors.dateAchieved}
          registration={register("dateAchieved", {
            required: "Date achieved is required",
          })}
        />

        <FormTextarea
          label="Description (optional)"
          placeholder="Add any context - what it was for, who it was awarded by, etc."
          registration={register("description", {
            maxLength: { value: 2000, message: "Description is too long" },
          })}
          error={errors.description}
        />

        <FormInput
          label="Image URL (optional)"
          placeholder="https://..."
          registration={register("image")}
        />

        <Button type="submit" disabled={isSubmitting} className="w-full mt-2">
          {isSubmitting ? "Submitting..." : "Submit for Review"}
        </Button>
      </form>
    </section>
  );
}
