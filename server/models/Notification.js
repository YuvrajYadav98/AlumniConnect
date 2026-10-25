const mongoose = require("mongoose");

const NOTIFICATION_TYPES = [
  "connection_request",
  "connection_accepted",
  "message",
  "event",
  "job",
  "announcement",
  "mentorship_request",
  "mentorship_accepted",
  "mentorship_rejected",
  "mentorship_completed",
  "achievement_approved",
  "system",
];

/**
 * Generic notification model. `relatedEntity` + `relatedEntityType` form
 * a polymorphic reference so a single collection can point at whichever
 * document triggered the notification (an Event, Job, Message, etc.)
 * without needing a separate notification collection per feature.
 */
const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    sender: {
      // who/what triggered it; null for system-generated notifications
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    type: {
      type: String,
      enum: { values: NOTIFICATION_TYPES, message: "Invalid notification type" },
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, "Notification title is required"],
      trim: true,
      maxlength: [150, "Title cannot exceed 150 characters"],
    },
    message: {
      type: String,
      trim: true,
      maxlength: [500, "Message cannot exceed 500 characters"],
      default: "",
    },
    relatedEntity: {
      // polymorphic reference - the _id of the related document
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    relatedEntityType: {
      // which collection relatedEntity points to
      type: String,
      enum: [
        "Event",
        "Job",
        "Message",
        "Connection",
        "Announcement",
        "MentorshipRequest",
        "Achievement",
        null,
      ],
      default: null,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true }
);

// ---------- Indexes ----------
// Fetch a user's unread notifications, most recent first
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);
