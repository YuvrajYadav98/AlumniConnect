const Connection = require("../models/Connection");

/**
 * Returns true if userA and userB have an accepted connection between
 * them (in either direction). This is the single source of truth for
 * "only connected users can message each other" - used by both the
 * REST message controller and the Socket.IO message handlers, so the
 * rule can never be enforced in one place but not the other.
 */
const areUsersConnected = async (userAId, userBId) => {
  if (String(userAId) === String(userBId)) return false;

  const connection = await Connection.findOne({
    status: "accepted",
    $or: [
      { requester: userAId, recipient: userBId },
      { requester: userBId, recipient: userAId },
    ],
  }).select("_id");

  return !!connection;
};

/**
 * Returns the set of user ids that `userId` has an accepted connection
 * with. Used once at socket-connect time so per-event checks (typing,
 * sending) are a cheap in-memory Set lookup instead of a DB query.
 */
const getConnectedUserIds = async (userId) => {
  const connections = await Connection.find({
    status: "accepted",
    $or: [{ requester: userId }, { recipient: userId }],
  }).select("requester recipient");

  const ids = connections.map((c) =>
    String(c.requester) === String(userId) ? String(c.recipient) : String(c.requester)
  );

  return new Set(ids);
};

module.exports = { areUsersConnected, getConnectedUserIds };
