const mongoose = require("mongoose");
const { MENTORSHIP_CATEGORIES } = require("../utils/mentorshipCategories");

const MENTORSHIP_STATUSES = ["pending", "accepted", "rejected", "completed"];

/**
 * MentorshipRequest models a student requesting guidance from an alumni
 * who has opted in via AlumniProfile.isAvailableForMentorship.
 */
const mentorshipRequestSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    mentor: {
      // an alumni user
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    topic: {
      type: String,
      required: [true, "Mentorship topic is required"],
      trim: true,
      maxlength: [150, "Topic cannot exceed 150 characters"],
    },
    category: {
      type: String,
      enum: {
        values: MENTORSHIP_CATEGORIES,
        message: "'{VALUE}' is not a supported mentorship category",
      },
      required: [true, "Mentorship category is required"],
      index: true,
    },
    message: {
      type: String,
      required: [true, "A message describing what you need help with is required"],
      maxlength: [1500, "Message cannot exceed 1500 characters"],
    },
    status: {
      type: String,
      enum: { values: MENTORSHIP_STATUSES, message: "Invalid mentorship status" },
      default: "pending",
      index: true,
    },
    respondedAt: {
      type: Date,
      default: null,
    },
    mentorNote: {
      // optional note from the mentor when accepting/rejecting
      type: String,
      maxlength: [1000, "Note cannot exceed 1000 characters"],
      default: "",
    },
  },
  { timestamps: true }
);

// ---------- Indexes ----------
mentorshipRequestSchema.index({ mentor: 1, status: 1 });
mentorshipRequestSchema.index({ student: 1, status: 1 });

module.exports = mongoose.model("MentorshipRequest", mentorshipRequestSchema);
