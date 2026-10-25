import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  getMyProfile,
  createMyProfile,
  updateMyProfile,
} from "../services/alumniService";
import { getErrorMessage } from "../utils/getErrorMessage";
import FormInput from "../components/FormInput";
import FormSelect from "../components/FormSelect";
import FormTextarea from "../components/FormTextarea";
import Button from "../components/Button";
import AvatarUploader from "../components/AvatarUploader";
import ProgressBar from "../components/dashboard/ProgressBar";
import { MENTORSHIP_CATEGORIES } from "../utils/mentorshipCategories";

const arrayToCsv = (arr) => (Array.isArray(arr) ? arr.join(", ") : "");
const csvToArray = (str) =>
  str
    ? str.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

const toDateInputValue = (value) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
};

export default function EditProfile() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState("loading"); // "loading" | "create" | "update"
  const [profileImage, setProfileImage] = useState(user?.profileImage || "");
  const [completion, setCompletion] = useState(0);
  const [serverError, setServerError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm();

  const isAvailableForMentorship = watch("isAvailableForMentorship");

  useEffect(() => {
    (async () => {
      try {
        const data = await getMyProfile();
        setMode("update");
        setCompletion(data.profileCompletion ?? 0);
        reset({
          phone: data.profile.phone,
          gender: data.profile.gender || "",
          dateOfBirth: toDateInputValue(data.profile.dateOfBirth),
          address: data.profile.address,
          city: data.profile.city,
          state: data.profile.state,
          country: data.profile.country,
          college: data.profile.college,
          degree: data.profile.degree,
          branch: data.profile.branch,
          batch: data.profile.batch,
          admissionYear: data.profile.admissionYear,
          graduationYear: data.profile.graduationYear,
          rollNumber: data.profile.rollNumber,
          currentCompany: data.profile.currentCompany,
          jobTitle: data.profile.jobTitle,
          industry: data.profile.industry,
          experienceYears: data.profile.experienceYears,
          skills: arrayToCsv(data.profile.skills),
          linkedin: data.profile.socialLinks?.linkedin,
          github: data.profile.socialLinks?.github,
          portfolio: data.profile.socialLinks?.portfolio,
          bio: data.profile.bio,
          achievements: arrayToCsv(data.profile.achievements),
          certifications: arrayToCsv(data.profile.certifications),
          interests: arrayToCsv(data.profile.interests),
          isPublic: data.profile.isPublic ?? true,
          isAvailableForMentorship: data.profile.isAvailableForMentorship ?? false,
          mentorshipCategories: data.profile.mentorshipCategories || [],
          mentorshipAvailability: data.profile.mentorshipAvailability || "",
          showPhone: data.profile.privacy?.showPhone ?? false,
          showEmail: data.profile.privacy?.showEmail ?? false,
          showDateOfBirth: data.profile.privacy?.showDateOfBirth ?? false,
          showAddress: data.profile.privacy?.showAddress ?? false,
        });
      } catch {
        // 404 just means the alumni hasn't created a profile yet
        setMode("create");
      }
    })();
  }, [reset]);

  const buildPayload = (formData) => ({
    phone: formData.phone,
    gender: formData.gender || undefined,
    dateOfBirth: formData.dateOfBirth || undefined,
    address: formData.address,
    city: formData.city,
    state: formData.state,
    country: formData.country,
    college: formData.college,
    degree: formData.degree,
    branch: formData.branch,
    batch: formData.batch,
    admissionYear: formData.admissionYear ? Number(formData.admissionYear) : undefined,
    graduationYear: Number(formData.graduationYear),
    rollNumber: formData.rollNumber,
    currentCompany: formData.currentCompany,
    jobTitle: formData.jobTitle,
    industry: formData.industry,
    experienceYears:
      formData.experienceYears !== "" ? Number(formData.experienceYears) : undefined,
    skills: csvToArray(formData.skills),
    socialLinks: {
      linkedin: formData.linkedin || "",
      github: formData.github || "",
      portfolio: formData.portfolio || "",
    },
    bio: formData.bio,
    achievements: csvToArray(formData.achievements),
    certifications: csvToArray(formData.certifications),
    interests: csvToArray(formData.interests),
    isPublic: !!formData.isPublic,
    isAvailableForMentorship: !!formData.isAvailableForMentorship,
    mentorshipCategories: formData.isAvailableForMentorship
      ? [].concat(formData.mentorshipCategories || [])
      : [],
    mentorshipAvailability: formData.mentorshipAvailability || "",
    privacy: {
      showPhone: !!formData.showPhone,
      showEmail: !!formData.showEmail,
      showDateOfBirth: !!formData.showDateOfBirth,
      showAddress: !!formData.showAddress,
    },
  });

  const onSubmit = async (formData) => {
    setServerError("");
    setSuccessMsg("");
    try {
      const payload = buildPayload(formData);
      const data =
        mode === "create" ? await createMyProfile(payload) : await updateMyProfile(payload);
      setMode("update");
      setCompletion(data.profileCompletion ?? 0);
      setSuccessMsg("Profile saved successfully.");
    } catch (err) {
      setServerError(getErrorMessage(err));
    }
  };

  const handleAvatarUploaded = (url) => {
    setProfileImage(url);
    setUser?.((prev) => (prev ? { ...prev, profileImage: url } : prev));
  };

  if (user?.role !== "alumni") {
    return (
      <section className="max-w-md mx-auto bg-white p-8 rounded-lg border border-slate-200 text-center">
        <p className="text-slate-600">
          Alumni profiles are only available for alumni accounts.
        </p>
      </section>
    );
  }

  if (mode === "loading") {
    return <p className="text-center text-slate-500 py-16">Loading profile...</p>;
  }

  return (
    <section className="max-w-3xl mx-auto">
      <div className="bg-white p-8 rounded-lg border border-slate-200 mb-6">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <AvatarUploader
            currentImage={profileImage}
            name={user?.name}
            onUploaded={handleAvatarUploaded}
          />
          <div className="flex-1 w-full">
            <h1 className="text-2xl font-semibold text-slate-800">
              {mode === "create" ? "Create Your Alumni Profile" : "Edit Your Alumni Profile"}
            </h1>
            <p className="text-sm text-slate-500 mt-1">{user?.name} &middot; {user?.email}</p>
            <div className="mt-4">
              <ProgressBar
                percent={completion}
                colorClass={
                  completion >= 80 ? "bg-green-600" : completion >= 40 ? "bg-amber-500" : "bg-rose-500"
                }
              />
            </div>
          </div>
        </div>
      </div>

      {serverError && (
        <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
          {serverError}
        </div>
      )}
      {successMsg && (
        <div className="mb-4 rounded-md bg-green-50 border border-green-200 px-3 py-2 text-sm text-green-700">
          {successMsg}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
        {/* Personal Information */}
        <fieldset className="bg-white p-6 rounded-lg border border-slate-200">
          <legend className="text-base font-semibold text-slate-800 px-1">
            Personal Information
          </legend>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 mt-2">
            <FormInput label="Phone" registration={register("phone")} />
            <FormSelect label="Gender" registration={register("gender")}>
              <option value="">Prefer not to specify</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
              <option value="prefer_not_to_say">Prefer not to say</option>
            </FormSelect>
            <FormInput label="Date of Birth" type="date" registration={register("dateOfBirth")} />
            <FormInput label="Address" registration={register("address")} />
            <FormInput label="City" registration={register("city")} />
            <FormInput label="State" registration={register("state")} />
            <FormInput label="Country" registration={register("country")} />
          </div>
        </fieldset>

        {/* Academic Information */}
        <fieldset className="bg-white p-6 rounded-lg border border-slate-200">
          <legend className="text-base font-semibold text-slate-800 px-1">
            Academic Information
          </legend>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 mt-2">
            <FormInput label="College" registration={register("college")} />
            <FormInput label="Degree" registration={register("degree")} />
            <FormInput
              label="Branch / Department *"
              error={errors.branch}
              registration={register("branch", { required: "Branch is required" })}
            />
            <FormInput label="Batch (e.g. 2016-2020)" registration={register("batch")} />
            <FormInput label="Admission Year" type="number" registration={register("admissionYear")} />
            <FormInput
              label="Graduation Year *"
              type="number"
              error={errors.graduationYear}
              registration={register("graduationYear", {
                required: "Graduation year is required",
              })}
            />
            <FormInput label="Roll Number" registration={register("rollNumber")} />
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Roll number is always kept private and only visible to you and admins.
          </p>
        </fieldset>

        {/* Career Information */}
        <fieldset className="bg-white p-6 rounded-lg border border-slate-200">
          <legend className="text-base font-semibold text-slate-800 px-1">
            Career Information
          </legend>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 mt-2">
            <FormInput label="Current Company" registration={register("currentCompany")} />
            <FormInput label="Job Title" registration={register("jobTitle")} />
            <FormInput label="Industry" registration={register("industry")} />
            <FormInput
              label="Experience (years)"
              type="number"
              step="0.5"
              registration={register("experienceYears")}
            />
            <FormInput
              label="Skills (comma separated)"
              placeholder="React, Node.js, Leadership"
              registration={register("skills")}
              className="sm:col-span-2"
            />
            <FormInput label="LinkedIn URL" registration={register("linkedin")} />
            <FormInput label="GitHub URL" registration={register("github")} />
            <FormInput label="Portfolio URL" registration={register("portfolio")} />
          </div>
        </fieldset>

        {/* Additional */}
        <fieldset className="bg-white p-6 rounded-lg border border-slate-200">
          <legend className="text-base font-semibold text-slate-800 px-1">Additional</legend>
          <FormTextarea label="Bio" registration={register("bio")} />
          <FormInput
            label="Achievements (comma separated)"
            placeholder="Won XYZ Hackathon, Employee of the Year 2022"
            registration={register("achievements")}
          />
          <FormInput
            label="Certifications (comma separated)"
            placeholder="AWS Certified Solutions Architect"
            registration={register("certifications")}
          />
          <FormInput
            label="Interests (comma separated)"
            placeholder="Chess, Photography, Open Source"
            registration={register("interests")}
          />
        </fieldset>

        {/* Visibility & Privacy */}
        <fieldset className="bg-white p-6 rounded-lg border border-slate-200">
          <legend className="text-base font-semibold text-slate-800 px-1">
            Visibility &amp; Privacy
          </legend>
          <div className="space-y-3 mt-2 text-sm text-slate-700">
            <label className="flex items-center gap-2">
              <input type="checkbox" {...register("isPublic")} />
              List my profile in the public Alumni Directory
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" {...register("isAvailableForMentorship")} />
              I'm available to mentor students
            </label>

            {isAvailableForMentorship && (
              <div className="ml-6 pl-4 border-l-2 border-slate-100 space-y-3">
                {user?.verificationStatus !== "approved" && (
                  <p className="text-xs text-amber-600 bg-amber-50 rounded-md px-3 py-2">
                    Your account isn't verified yet, so you won't appear in mentor
                    search until an admin approves it. You can still set up your
                    mentor profile now.
                  </p>
                )}

                <div>
                  <p className="text-xs font-medium text-slate-500 mb-2">
                    Areas of mentorship
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {MENTORSHIP_CATEGORIES.map((cat) => (
                      <label key={cat} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          value={cat}
                          {...register("mentorshipCategories")}
                        />
                        {cat}
                      </label>
                    ))}
                  </div>
                </div>

                <FormInput
                  label="Availability"
                  placeholder="e.g. Weekday evenings, ~2 hrs/week"
                  registration={register("mentorshipAvailability")}
                />
              </div>
            )}
            <div className="border-t border-slate-100 pt-3 mt-3">
              <p className="text-xs text-slate-400 mb-2">
                Even when your profile is public, these fields stay private unless you
                choose to show them:
              </p>
              <label className="flex items-center gap-2">
                <input type="checkbox" {...register("showPhone")} />
                Show my phone number
              </label>
              <label className="flex items-center gap-2 mt-2">
                <input type="checkbox" {...register("showEmail")} />
                Show my email address
              </label>
              <label className="flex items-center gap-2 mt-2">
                <input type="checkbox" {...register("showDateOfBirth")} />
                Show my date of birth
              </label>
              <label className="flex items-center gap-2 mt-2">
                <input type="checkbox" {...register("showAddress")} />
                Show my address
              </label>
            </div>
          </div>
        </fieldset>

        <div className="flex gap-3">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : mode === "create" ? "Create Profile" : "Save Changes"}
          </Button>
          {mode === "update" && (
            <Button
              type="button"
              onClick={() => navigate("/profile")}
              className="bg-white text-slate-700 border border-slate-300 hover:bg-slate-50"
            >
              View Profile
            </Button>
          )}
        </div>
      </form>
    </section>
  );
}
