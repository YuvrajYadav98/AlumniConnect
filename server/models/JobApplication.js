const mongoose = require("mongoose");

/**
 * JobApplication records that a user clicked "Apply" on a job. The
 * actual application itself happens externally (via applyLink or
 * applyEmail) - this collection just tracks interest/engagement so the
 * "Apply" action is idempotent and the poster can see who applied.
 */
const jobApplicationSchema = new mongoose.Schema(
  {
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
      index: true,
    },
    applicant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    appliedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// A user can only apply to a given job once.
jobApplicationSchema.index({ job: 1, applicant: 1 }, { unique: true });

module.exports = mongoose.model("JobApplication", jobApplicationSchema);
