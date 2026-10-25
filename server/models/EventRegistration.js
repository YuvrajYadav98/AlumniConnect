const mongoose = require("mongoose");

const REGISTRATION_STATUSES = ["registered", "attended", "cancelled", "waitlisted"];

/**
 * EventRegistration is a join/junction collection modeling the
 * many-to-many relationship between User and Event.
 */
const eventRegistrationSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: { values: REGISTRATION_STATUSES, message: "Invalid registration status" },
      default: "registered",
      index: true,
    },
    registeredAt: {
      type: Date,
      default: Date.now,
    },
    feedback: {
      rating: {
        type: Number,
        min: [1, "Rating must be between 1 and 5"],
        max: [5, "Rating must be between 1 and 5"],
      },
      comment: {
        type: String,
        maxlength: [500, "Feedback comment cannot exceed 500 characters"],
      },
    },
  },
  { timestamps: true }
);

// ---------- Indexes ----------
// A user can only register once per event
eventRegistrationSchema.index({ event: 1, user: 1 }, { unique: true });
// Supports "my registered events" (filter by user, sort by registeredAt)
// and "event participants" (filter by event, sort by registeredAt)
// without an extra in-memory sort step on top of the index scan.
eventRegistrationSchema.index({ user: 1, registeredAt: -1 });
eventRegistrationSchema.index({ event: 1, registeredAt: 1 });

module.exports = mongoose.model("EventRegistration", eventRegistrationSchema);
