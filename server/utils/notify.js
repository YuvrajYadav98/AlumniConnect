const Notification = require("../models/Notification");

/**
 * Creates one notification. Non-fatal by design: a failed notification
 * should never abort the action that triggered it (e.g. a connection
 * request should still succeed even if the notification insert fails),
 * so every caller across the app uses this instead of calling
 * Notification.create() directly and risking an unhandled rejection.
 */
const notifyUser = async (payload) => {
  try {
    await Notification.create(payload);
  } catch {
    // intentionally swallowed
  }
};

/**
 * Creates the same notification for many recipients in a single DB
 * round trip (insertMany) - used for broadcast-style triggers like "new
 * event published" or "admin announcement" where looping N individual
 * creates would mean N awaited queries instead of one.
 */
const notifyUsers = async (recipientIds, payloadWithoutRecipient) => {
  if (!recipientIds || recipientIds.length === 0) return;
  try {
    const docs = recipientIds.map((recipient) => ({
      ...payloadWithoutRecipient,
      recipient,
    }));
    await Notification.insertMany(docs, { ordered: false });
  } catch {
    // intentionally swallowed - same reasoning as notifyUser
  }
};

module.exports = { notifyUser, notifyUsers };
