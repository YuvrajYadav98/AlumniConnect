const mongoose = require("mongoose");

const EVENT_TYPES = ["webinar", "reunion", "workshop", "networking", "seminar", "other"];
const EVENT_MODES = ["online", "offline", "hybrid"];
const EVENT_STATUSES = ["upcoming", "ongoing", "completed", "cancelled"];

// 24-hour "HH:MM" format - chosen (over free text or 12-hour AM/PM) so
// endTime > startTime can be validated with a simple, reliable string
// comparison (zero-padded 24hr strings sort lexicographically in
// chronological order), without needing a time-parsing library.
const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Event title is required"],
      trim: true,
      maxlength: [150, "Title cannot exceed 150 characters"],
    },
    description: {
      type: String,
      required: [true, "Event description is required"],
      maxlength: [3000, "Description cannot exceed 3000 characters"],
    },
    image: {
      type: String, // Cloudinary URL
      default: "",
    },
    eventType: {
      type: String,
      enum: { values: EVENT_TYPES, message: "Invalid event type" },
      default: "other",
      index: true,
    },

    // ---------- Date & time ----------
    date: {
      type: Date,
      required: [true, "Event date is required"],
      index: true,
    },
    startTime: {
      type: String,
      required: [true, "Start time is required"],
      match: [TIME_REGEX, "Start time must be in HH:MM (24-hour) format"],
    },
    endTime: {
      type: String,
      required: [true, "End time is required"],
      match: [TIME_REGEX, "End time must be in HH:MM (24-hour) format"],
      validate: {
        validator: function (value) {
          // Zero-padded "HH:MM" strings compare correctly as plain strings.
          return !this.startTime || value > this.startTime;
        },
        message: "End time must be after start time",
      },
    },
    registrationDeadline: {
      type: Date,
      required: [true, "Registration deadline is required"],
      validate: {
        validator: function (value) {
          return !this.date || value <= this.date;
        },
        message: "Registration deadline must be on or before the event date",
      },
    },

    // ---------- Location ----------
    mode: {
      type: String,
      enum: { values: EVENT_MODES, message: "Invalid event mode" },
      required: [true, "Event mode (online/offline/hybrid) is required"],
    },
    location: {
      // physical venue - required for offline/hybrid events
      type: String,
      trim: true,
      default: "",
    },
    meetingLink: {
      // video call URL - required for online/hybrid events
      type: String,
      trim: true,
      default: "",
    },

    // ---------- Capacity ----------
    maxParticipants: {
      type: Number, // null/undefined = unlimited
      min: [1, "Maximum participants must be at least 1"],
      default: null,
    },

    // ---------- Organizer & lifecycle ----------
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    // Draft vs published - controls whether alumni/students can see the
    // event at all. Separate from `status` below, which tracks the
    // event's lifecycle once it *is* visible.
    isPublished: {
      type: Boolean,
      default: false,
      index: true,
    },
    status: {
      type: String,
      enum: { values: EVENT_STATUSES, message: "Invalid event status" },
      default: "upcoming",
      index: true,
    },
  },
  { timestamps: true }
);

// A location is required for offline/hybrid events, and a meeting link
// for online/hybrid events - enforced here rather than as a plain
// `required` on each field, since the requirement is conditional on `mode`.
// Mongoose 9 dropped legacy callback-style `(next)` middleware, so this
// is a plain synchronous function (no `next` argument/call).
eventSchema.pre("validate", function () {
  if ((this.mode === "offline" || this.mode === "hybrid") && !this.location) {
    this.invalidate("location", "Location is required for offline/hybrid events");
  }
  if ((this.mode === "online" || this.mode === "hybrid") && !this.meetingLink) {
    this.invalidate("meetingLink", "Meeting link is required for online/hybrid events");
  }
});

// ---------- Indexes ----------
eventSchema.index({ date: 1, status: 1 });
eventSchema.index({ isPublished: 1, date: 1 });
eventSchema.index({ title: "text", description: "text" });

module.exports = mongoose.model("Event", eventSchema);
