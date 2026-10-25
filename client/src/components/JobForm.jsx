import { useForm } from "react-hook-form";
import FormInput from "./FormInput";
import FormSelect from "./FormSelect";
import FormTextarea from "./FormTextarea";
import Button from "./Button";

const JOB_TYPES = ["full-time", "part-time", "internship", "contract", "freelance"];

const toDateInputValue = (value) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
};

const csvToArray = (str) =>
  str ? str.split(",").map((s) => s.trim()).filter(Boolean) : [];
const arrayToCsv = (arr) => (Array.isArray(arr) ? arr.join(", ") : "");

export default function JobForm({ initialValues, onSubmit, submitLabel = "Post Job" }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      title: initialValues?.title || "",
      company: initialValues?.company || "",
      description: initialValues?.description || "",
      location: initialValues?.location || "",
      jobType: initialValues?.jobType || "full-time",
      experienceRequired: initialValues?.experienceRequired || "",
      salaryMin: initialValues?.salaryRange?.min ?? "",
      salaryMax: initialValues?.salaryRange?.max ?? "",
      salaryCurrency: initialValues?.salaryRange?.currency || "USD",
      skillsRequired: arrayToCsv(initialValues?.skillsRequired),
      applyLink: initialValues?.applyLink || "",
      applyEmail: initialValues?.applyEmail || "",
      applicationDeadline: toDateInputValue(initialValues?.applicationDeadline),
    },
  });

  const submit = (formData) => {
    onSubmit({
      title: formData.title,
      company: formData.company,
      description: formData.description,
      location: formData.location,
      jobType: formData.jobType,
      experienceRequired: formData.experienceRequired,
      salaryRange: {
        min: formData.salaryMin !== "" ? Number(formData.salaryMin) : undefined,
        max: formData.salaryMax !== "" ? Number(formData.salaryMax) : undefined,
        currency: formData.salaryCurrency || "USD",
      },
      skillsRequired: csvToArray(formData.skillsRequired),
      applyLink: formData.applyLink,
      applyEmail: formData.applyEmail,
      applicationDeadline: formData.applicationDeadline,
    });
  };

  return (
    <form onSubmit={handleSubmit(submit)} noValidate className="space-y-6">
      <fieldset className="bg-white p-6 rounded-lg border border-slate-200">
        <legend className="text-base font-semibold text-slate-800 px-1">Job Details</legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
          <FormInput
            label="Job Title"
            error={errors.title}
            registration={register("title", { required: "Job title is required" })}
          />
          <FormInput
            label="Company"
            error={errors.company}
            registration={register("company", { required: "Company is required" })}
          />
        </div>
        <FormTextarea
          label="Description"
          error={errors.description}
          registration={register("description", { required: "Description is required" })}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
          <FormInput label="Location" registration={register("location")} />
          <FormSelect label="Employment Type" registration={register("jobType")}>
            {JOB_TYPES.map((t) => (
              <option key={t} value={t} className="capitalize">
                {t}
              </option>
            ))}
          </FormSelect>
        </div>
        <FormInput
          label="Experience Required"
          placeholder="e.g. Fresher, 2-4 years, 5+ years"
          registration={register("experienceRequired")}
        />
        <FormInput
          label="Skills Required (comma separated)"
          placeholder="React, Node.js, SQL"
          registration={register("skillsRequired")}
        />
      </fieldset>

      <fieldset className="bg-white p-6 rounded-lg border border-slate-200">
        <legend className="text-base font-semibold text-slate-800 px-1">Salary</legend>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4">
          <FormInput label="Min" type="number" registration={register("salaryMin")} />
          <FormInput label="Max" type="number" registration={register("salaryMax")} />
          <FormInput label="Currency" placeholder="USD" registration={register("salaryCurrency")} />
        </div>
      </fieldset>

      <fieldset className="bg-white p-6 rounded-lg border border-slate-200">
        <legend className="text-base font-semibold text-slate-800 px-1">
          Application
        </legend>
        <FormInput
          label="Application URL"
          placeholder="https://company.com/careers/apply"
          registration={register("applyLink")}
        />
        <FormInput
          label="Application Email (alternative to URL)"
          type="email"
          placeholder="hr@company.com"
          registration={register("applyEmail")}
        />
        <p className="text-xs text-slate-400 -mt-2 mb-3">
          Provide at least one way for applicants to apply.
        </p>
        <FormInput
          label="Application Deadline"
          type="date"
          error={errors.applicationDeadline}
          registration={register("applicationDeadline", {
            required: "Application deadline is required",
          })}
        />
      </fieldset>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Saving..." : submitLabel}
      </Button>
    </form>
  );
}
