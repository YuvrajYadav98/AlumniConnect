const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { ROLE_VALUES, ROLES } = require("../utils/roles");

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [EMAIL_REGEX, "Please provide a valid email address"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false, // never returned by default in queries
    },
    role: {
      type: String,
      enum: {
        values: ROLE_VALUES,
        message: `Role must be one of: ${ROLE_VALUES.join(", ")}`,
      },
      default: ROLES.STUDENT,
      required: true,
      index: true,
    },
    profileImage: {
      type: String, // Cloudinary URL
      default: "",
    },
    isVerified: {
      type: Boolean, // email verification
      default: false,
    },
    isApproved: {
      type: Boolean, // admin approval (esp. required for alumni accounts)
      default: false,
      index: true,
    },
    // Tri-state verification status, primarily meaningful for alumni
    // accounts (students/admins are auto-approved). Kept alongside the
    // simpler `isApproved` boolean rather than replacing it, since
    // `isApproved` alone can't distinguish "never reviewed" (pending)
    // from "reviewed and rejected" - existing code that checks
    // `isApproved` keeps working, while new code can check this for
    // the full pending/approved/rejected picture.
    verificationStatus: {
      type: String,
      enum: {
        values: ["pending", "approved", "rejected"],
        message: "Invalid verification status",
      },
      default: "pending",
      index: true,
    },
  },
  { timestamps: true } // adds createdAt / updatedAt
);

// ---------- Indexes ----------
// Text index to support quick name/email search across the platform
userSchema.index({ name: "text", email: "text" });
// Compound index for the single hottest query in the app: "give me all
// approved alumni" - runs on every alumni directory request. Covers the
// filter directly instead of scanning the role index then filtering
// verificationStatus in memory.
userSchema.index({ role: 1, verificationStatus: 1 });

// ---------- Hooks ----------
// Mongoose 9 dropped legacy callback-style `(next)` middleware - async
// pre-hooks just return their promise, no `next` argument/call needed.
userSchema.pre("save", async function hashPassword() {
  if (!this.isModified("password")) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// ---------- Instance methods ----------
userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

// Never leak the password hash even if `select` is bypassed
userSchema.methods.toJSON = function toJSON() {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model("User", userSchema);
