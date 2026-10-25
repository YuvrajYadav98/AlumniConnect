const mongoose = require("mongoose");

const ANNOUNCEMENT_AUDIENCES = ["all", "alumni", "student", "admin"];

const announcementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Announcement title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    content: {
      type: String,
      required: [true, "Announcement content is required"],
      maxlength: [5000, "Content cannot exceed 5000 characters"],
    },
    postedBy: {
      // typically an admin
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    audience: {
      // who should see this announcement
      type: String,
      enum: { values: ANNOUNCEMENT_AUDIENCES, message: "Invalid audience" },
      default: "all",
      index: true,
    },
    attachment: {
      type: String, // Cloudinary URL (optional image/PDF)
      default: "",
    },
    isPinned: {
      type: Boolean,
      default: false,
      index: true,
    },
    expiresAt: {
      // optional - after this date, stop showing the announcement
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// ---------- Indexes ----------
announcementSchema.index({ audience: 1, isPinned: -1, createdAt: -1 });
announcementSchema.index({ title: "text", content: "text" });

module.exports = mongoose.model("Announcement", announcementSchema);
