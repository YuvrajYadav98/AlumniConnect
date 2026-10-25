const mongoose = require("mongoose");
const { ACHIEVEMENT_CATEGORIES } = require("../utils/achievementCategories");

const ACHIEVEMENT_STATUSES = ["pending", "approved", "rejected"];

const achievementSchema = new mongoose.Schema(
  {
    user: {
      // the alumni this achievement belongs to
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, "Achievement title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    description: {
      type: String,
      maxlength: [2000, "Description cannot exceed 2000 characters"],
      default: "",
    },
    category: {
      type: String,
      enum: { values: ACHIEVEMENT_CATEGORIES, message: "Invalid achievement category" },
      default: "other",
      index: true,
    },
    dateAchieved: {
      type: Date,
      required: [true, "Date achieved is required"],
    },
    image: {
      type: String, // Cloudinary URL
      default: "",
    },
    // Achievements are shown on public profiles / news feed only after
    // an admin moderates them, keeping displayed content trustworthy.
    status: {
      type: String,
      enum: { values: ACHIEVEMENT_STATUSES, message: "Invalid status" },
      default: "pending",
      index: true,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

// ---------- Indexes ----------
achievementSchema.index({ user: 1, status: 1 });
achievementSchema.index({ title: "text", description: "text" });

module.exports = mongoose.model("Achievement", achievementSchema);
