const mongoose = require("mongoose");

const JOB_TYPES = ["full-time", "part-time", "internship", "contract", "freelance"];
const JOB_STATUSES = ["open", "closed"];
// Moderation workflow status - separate from `status` above, which is
// about whether the *poster* is still accepting applications.
// approvalStatus tracks the admin review workflow: a job is only
// visible to students/alumni once it's "approved".
const APPROVAL_STATUSES = ["pending", "approved", "rejected"];

const jobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Job title is required"],
      trim: true,
      maxlength: [150, "Title cannot exceed 150 characters"],
      index: true,
    },
    description: {
      type: String,
      required: [true, "Job description is required"],
      maxlength: [5000, "Description cannot exceed 5000 characters"],
    },
    company: {
      type: String,
      required: [true, "Company name is required"],
      trim: true,
      index: true,
    },
    location: {
      type: String,
      trim: true,
      index: true,
    },
    jobType: {
      type: String,
      enum: { values: JOB_TYPES, message: "Invalid job type" },
      required: true,
      index: true,
    },
    // Free-text experience requirement (e.g. "Fresher", "2-4 years",
    // "5+ years") rather than a structured min/max - job posts in the
    // wild describe this too inconsistently for a strict numeric range.
    experienceRequired: {
      type: String,
      trim: true,
      maxlength: [50, "Experience requirement cannot exceed 50 characters"],
      default: "",
    },
    applyLink: {
      type: String,
      trim: true,
    },
    applyEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },
    skillsRequired: {
      type: [String],
      default: [],
      index: true,
    },
    salaryRange: {
      min: { type: Number, min: 0 },
      max: { type: Number, min: 0 },
      currency: { type: String, default: "USD" },
    },
    postedBy: {
      // typically an alumni user sharing an opportunity
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    status: {
      // whether the poster is still accepting applications
      type: String,
      enum: { values: JOB_STATUSES, message: "Invalid job status" },
      default: "open",
      index: true,
    },
    approvalStatus: {
      // admin moderation status - jobs are only publicly listed once approved
      type: String,
      enum: { values: APPROVAL_STATUSES, message: "Invalid approval status" },
      default: "pending",
      index: true,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    rejectionReason: {
      type: String,
      trim: true,
      maxlength: [500, "Rejection reason cannot exceed 500 characters"],
      default: "",
    },
    applicationDeadline: {
      type: Date,
      required: [true, "Application deadline is required"],
      index: true,
    },
  },
  { timestamps: true }
);

// A job must give applicants at least one way to apply.
jobSchema.pre("validate", function () {
  if (!this.applyLink && !this.applyEmail) {
    this.invalidate(
      "applyLink",
      "Provide an application URL or an application email"
    );
  }
});

// ---------- Indexes ----------
jobSchema.index({ jobType: 1, status: 1 });
jobSchema.index({ approvalStatus: 1, applicationDeadline: 1 });
jobSchema.index({
  title: "text",
  description: "text",
  company: "text",
  skillsRequired: "text",
});

module.exports = mongoose.model("Job", jobSchema);
