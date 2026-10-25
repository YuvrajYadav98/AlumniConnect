const mongoose = require("mongoose");

const CONNECTION_STATUSES = ["pending", "accepted", "rejected", "blocked"];

/**
 * Connection models a directed "connection request" between two users
 * (similar to a LinkedIn connection). requester sends the request,
 * recipient accepts/rejects it.
 */
const connectionSchema = new mongoose.Schema(
  {
    requester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
      validate: {
        validator: function (value) {
          return !this.requester || !value.equals(this.requester);
        },
        message: "A user cannot connect with themselves",
      },
    },
    status: {
      type: String,
      enum: { values: CONNECTION_STATUSES, message: "Invalid connection status" },
      default: "pending",
      index: true,
    },
    // Who initiated a block, when status === "blocked". Needed because
    // requester/recipient reflect the *original* connection request
    // direction, which may be the opposite of who did the blocking
    // (e.g. the recipient of a pending request blocks the requester).
    blockedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    respondedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// ---------- Indexes ----------
// Prevent duplicate connection requests between the same pair of users
connectionSchema.index({ requester: 1, recipient: 1 }, { unique: true });
// Fast lookup of all connections involving a given user, filtered by status
connectionSchema.index({ recipient: 1, status: 1 });
connectionSchema.index({ requester: 1, status: 1 });

module.exports = mongoose.model("Connection", connectionSchema);
