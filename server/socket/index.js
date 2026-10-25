const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Message = require("../models/Message");
const { areUsersConnected, getConnectedUserIds } = require("../utils/connectionHelpers");
const { parseCookieHeader } = require("../utils/parseCookieHeader");
const { notifyUser } = require("../utils/notify");

// ---------- Presence tracking ----------
// Maps a userId to the set of socket ids currently open for that user
// (a person can have the app open in multiple tabs/devices at once).
// A user counts as "online" as long as this set is non-empty.
const onlineUsers = new Map(); // userId (string) -> Set<socketId>

let ioInstance = null;

/**
 * Authenticates a Socket.IO connection using the exact same JWT that
 * secures the REST API - read from the httpOnly cookie sent with the
 * handshake, with a Bearer-style `auth.token` fallback for non-browser
 * clients. A connection is refused entirely if this fails, so every
 * further event on the socket is already known to belong to a real,
 * logged-in user - individual event handlers don't need to re-check auth.
 */
const authenticateSocket = async (socket, next) => {
  try {
    let token;

    const cookieHeader = socket.handshake.headers?.cookie;
    if (cookieHeader) {
      const cookies = parseCookieHeader(cookieHeader);
      token = cookies.token;
    }
    if (!token && socket.handshake.auth?.token) {
      token = socket.handshake.auth.token;
    }

    if (!token) {
      return next(new Error("Not authorized, no token provided"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) {
      return next(new Error("Not authorized, user no longer exists"));
    }

    socket.userId = String(user._id);
    socket.userName = user.name;
    next();
  } catch (error) {
    next(new Error("Not authorized, token is invalid or expired"));
  }
};

const initSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:5173",
      credentials: true,
    },
  });

  io.use(authenticateSocket);

  io.on("connection", async (socket) => {
    const userId = socket.userId;

    // Track this socket under the user's presence entry.
    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
    }
    onlineUsers.get(userId).add(socket.id);
    const isFirstConnectionForUser = onlineUsers.get(userId).size === 1;

    // A private room named after the user id - lets us push events to
    // "this user" (across all their open tabs/devices) without tracking
    // socket ids ourselves everywhere else in the code.
    socket.join(`user:${userId}`);

    // Cache this user's accepted-connection partner ids on the socket so
    // every message/typing event below is a Set lookup, not a fresh
    // DB query - both fast and impossible to bypass from the client.
    socket.connectedUserIds = await getConnectedUserIds(userId);

    // Tell the newly-connected user who (among people they're allowed to
    // message) is currently online, so their UI can show presence dots
    // immediately, before any individual "user_online" event arrives.
    const onlineConnectionIds = [...socket.connectedUserIds].filter((id) =>
      onlineUsers.has(id)
    );
    socket.emit("online_users", onlineConnectionIds);

    // Only notify this user's own connections that they've come online -
    // broadcasting presence to the entire app would leak who's active to
    // people who aren't even allowed to message them.
    if (isFirstConnectionForUser) {
      socket.connectedUserIds.forEach((peerId) => {
        io.to(`user:${peerId}`).emit("user_online", userId);
      });
    }

    // ---------- Send message ----------
    socket.on("send_message", async ({ recipientId, content }, callback) => {
      const ack = typeof callback === "function" ? callback : () => {};

      try {
        if (!recipientId || !content || !String(content).trim()) {
          return ack({ success: false, message: "Recipient and content are required" });
        }

        // The core security rule for this feature: only accepted
        // connections can message each other. Checked against the
        // cached set first (fast path); if the cache is stale (a
        // connection was accepted after this socket connected), fall
        // back to a real DB check rather than incorrectly rejecting it.
        let allowed = socket.connectedUserIds.has(String(recipientId));
        if (!allowed) {
          allowed = await areUsersConnected(userId, recipientId);
          if (allowed) socket.connectedUserIds.add(String(recipientId));
        }

        if (!allowed) {
          return ack({
            success: false,
            message: "You can only message users you're connected with",
          });
        }

        const message = await Message.create({
          sender: userId,
          recipient: recipientId,
          content: String(content).trim(),
        });

        const payload = {
          _id: message._id,
          sender: userId,
          recipient: recipientId,
          content: message.content,
          isRead: false,
          createdAt: message.createdAt,
        };

        // Deliver to every open tab/device of both the recipient and the
        // sender (so a sender with multiple tabs stays in sync too).
        io.to(`user:${recipientId}`).emit("receive_message", payload);
        socket.to(`user:${userId}`).emit("receive_message", payload);

        // Persist a notification too (not just the live socket event) -
        // this is what makes the message show up in the recipient's
        // notification bell/unread count even if they're offline or on
        // a different page when it arrives.
        await notifyUser({
          recipient: recipientId,
          sender: userId,
          type: "message",
          title: "New message",
          message: `${socket.userName}: ${message.content.slice(0, 100)}`,
          relatedEntity: message._id,
          relatedEntityType: "Message",
        });

        ack({ success: true, message: payload });
      } catch (error) {
        ack({ success: false, message: "Failed to send message" });
      }
    });

    // ---------- Typing indicator ----------
    socket.on("typing", ({ recipientId }) => {
      if (!recipientId || !socket.connectedUserIds.has(String(recipientId))) return;
      io.to(`user:${recipientId}`).emit("typing", { senderId: userId });
    });

    socket.on("stop_typing", ({ recipientId }) => {
      if (!recipientId || !socket.connectedUserIds.has(String(recipientId))) return;
      io.to(`user:${recipientId}`).emit("stop_typing", { senderId: userId });
    });

    // ---------- Read receipts ----------
    // Emitted when the user opens/focuses a conversation. Marks every
    // message *from* peerId *to* this user as read, then tells the peer
    // (if online) so their UI can flip to "read" in real time.
    socket.on("mark_read", async ({ peerId }) => {
      if (!peerId) return;
      try {
        const result = await Message.updateMany(
          { sender: peerId, recipient: userId, isRead: false },
          { isRead: true, readAt: new Date() }
        );
        if (result.modifiedCount > 0) {
          io.to(`user:${peerId}`).emit("messages_read", { readBy: userId });
        }
      } catch {
        // non-fatal - the read state will simply catch up next time
      }
    });

    // ---------- Disconnect / presence cleanup ----------
    socket.on("disconnect", () => {
      const sockets = onlineUsers.get(userId);
      if (!sockets) return;

      sockets.delete(socket.id);
      if (sockets.size === 0) {
        onlineUsers.delete(userId);
        // Only this user's connections need to know they went offline.
        socket.connectedUserIds.forEach((peerId) => {
          io.to(`user:${peerId}`).emit("user_offline", userId);
        });
      }
    });
  });

  ioInstance = io;
  return io;
};

const getIO = () => ioInstance;

const isUserOnline = (userId) => onlineUsers.has(String(userId));

module.exports = { initSocket, getIO, isUserOnline };
