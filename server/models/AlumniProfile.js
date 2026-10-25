const mongoose = require("mongoose");
const { MENTORSHIP_CATEGORIES } = require("../utils/mentorshipCategories");

/**
 * AlumniProfile stores all extended, alumni-specific profile data.
 * Kept separate from User (which handles only auth/identity: name,
 * email, password, role, profileImage) so that:
 *  - The User collection stays small and fast for auth lookups
 *  - Students/admins don't carry unused alumni-only fields
 *  - This schema can grow independently as the profile module evolves
 */

const GENDER_VALUES = ["male", "female", "other", "prefer_not_to_say"];

const workExperienceSchema = new mongoose.Schema(
  {
    company: { type: String, required: true, trim: true },
    designation: { type: String, required: true, trim: true },
    location: { type: String, trim: true },
    startDate: { type: Date },
    endDate: { type: Date }, // null/undefined => currently working here
    isCurrent: { type: Boolean, default: false },
  },
  { _id: false }
);

const alumniProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // one profile per user
      index: true,
    },

    // ---------- Personal Information ----------
    // (name, email, profileImage already live on the User model)
    phone: {
      type: String,
      trim: true,
      match: [/^[0-9+\-\s()]{7,20}$/, "Please provide a valid phone number"],
      default: "",
    },
    gender: {
      type: String,
      enum: { values: GENDER_VALUES, message: "Invalid gender value" },
      default: undefined,
    },
    dateOfBirth: {
      type: Date,
      validate: {
        validator: (value) => !value || value < new Date(),
        message: "Date of birth cannot be in the future",
      },
    },
    address: { type: String, trim: true, maxlength: 250, default: "" },
    city: { type: String, trim: true, index: true, default: "" },
    state: { type: String, trim: true, index: true, default: "" },
    country: { type: String, trim: true, index: true, default: "" },

    // ---------- Academic Information ----------
    college: { type: String, trim: true, index: true, default: "" },
    degree: { type: String, trim: true, default: "" }, // e.g. "B.Tech", "M.Sc"
    branch: {
      type: String, // department / major, e.g. "Computer Science"
      required: [true, "Branch/Department is required"],
      trim: true,
      index: true,
    },
    batch: { type: String, trim: true, index: true, default: "" }, // e.g. "2016-2020"
    admissionYear: {
      type: Number,
      min: [1950, "Admission year seems invalid"],
      max: [2100, "Admission year seems invalid"],
    },
    graduationYear: {
      type: Number,
      required: [true, "Graduation year is required"],
      min: [1950, "Graduation year seems invalid"],
      max: [2100, "Graduation year seems invalid"],
      index: true,
      validate: {
        validator: function (value) {
          return !this.admissionYear || value >= this.admissionYear;
        },
        message: "Graduation year cannot be before admission year",
      },
    },
    rollNumber: { type: String, trim: true, default: "" },

    // ---------- Career Information ----------
    currentCompany: { type: String, trim: true, index: true, default: "" },
    jobTitle: { type: String, trim: true, index: true, default: "" },
    industry: { type: String, trim: true, index: true, default: "" },
    experienceYears: {
      type: Number,
      min: [0, "Experience cannot be negative"],
      max: [70, "Experience seems invalid"],
    },
    skills: { type: [String], default: [], index: true },
    socialLinks: {
      linkedin: { type: String, trim: true, default: "" },
      github: { type: String, trim: true, default: "" },
      portfolio: { type: String, trim: true, default: "" },
    },
    workExperience: { type: [workExperienceSchema], default: [] },

    // ---------- Additional ----------
    bio: { type: String, maxlength: [1000, "Bio cannot exceed 1000 characters"], default: "" },
    achievements: { type: [String], default: [] },
    certifications: { type: [String], default: [] },
    interests: { type: [String], default: [] },

    // ---------- Visibility / Privacy ----------
    // Whole-profile visibility: whether it's discoverable in the directory at all
    isPublic: { type: Boolean, default: true, index: true },
    // Fine-grained visibility for sensitive personal fields. Even on a
    // public profile, these stay hidden from non-owners unless enabled.
    privacy: {
      showPhone: { type: Boolean, default: false },
      showEmail: { type: Boolean, default: false },
      showDateOfBirth: { type: Boolean, default: false },
      showAddress: { type: Boolean, default: false },
    },

    isAvailableForMentorship: { type: Boolean, default: false, index: true },
    // "Areas of mentorship" - what topics this alumni is willing to mentor
    // on. Restricted to a fixed set of categories (rather than free text)
    // so the mentor search page can offer reliable category filters.
    mentorshipCategories: {
      type: [String],
      enum: {
        values: MENTORSHIP_CATEGORIES,
        message: "'{VALUE}' is not a supported mentorship category",
      },
      default: [],
      index: true,
    },
    // Free-text description of when/how often the mentor is available
    // (e.g. "Weekday evenings, ~2 hrs/week") - intentionally not a
    // structured schedule, to keep the mentor-onboarding form simple.
    mentorshipAvailability: {
      type: String,
      trim: true,
      maxlength: [200, "Availability description cannot exceed 200 characters"],
      default: "",
    },
  },
  { timestamps: true }
);

// ---------- Indexes ----------
// Compound index for the most common alumni search/filter pattern
alumniProfileSchema.index({ graduationYear: 1, branch: 1 });
alumniProfileSchema.index({ industry: 1, city: 1, country: 1 });
// Directory listing always filters isPublic first, then commonly narrows
// by batch/branch - putting isPublic first lets Mongo use this index to
// satisfy the directory's core filter in a single index scan.
alumniProfileSchema.index({ isPublic: 1, batch: 1 });
alumniProfileSchema.index({ isPublic: 1, currentCompany: 1 });
// Mentor search always filters isAvailableForMentorship first, often
// narrowed further by category - putting the boolean first lets Mongo
// satisfy that filter with a single index scan before touching categories.
alumniProfileSchema.index({ isAvailableForMentorship: 1, mentorshipCategories: 1 });

// Text index to support free-text alumni search (name lives on User,
// so this covers company/title/skills/bio/college search)
alumniProfileSchema.index({
  currentCompany: "text",
  jobTitle: "text",
  bio: "text",
  skills: "text",
  college: "text",
});

module.exports = mongoose.model("AlumniProfile", alumniProfileSchema);
