const mongoose = require("mongoose");

/**
 * SavedJob is a junction collection modeling the many-to-many
 * "bookmark" relationship between User and Job (a user's saved-jobs list).
 */
const savedJobSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

// A user can only save a given job once.
savedJobSchema.index({ user: 1, job: 1 }, { unique: true });

module.exports = mongoose.model("SavedJob", savedJobSchema);
