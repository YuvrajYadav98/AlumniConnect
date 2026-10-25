require("dotenv").config();

console.log("MONGO_URI:", process.env.MONGO_URI);
console.log("PORT:", process.env.PORT);
console.log("NODE_ENV:", process.env.NODE_ENV);

const http = require("http");
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const connectDB = require("./config/db");
const { initSocket } = require("./socket");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");
const healthRoutes = require("./routes/healthRoutes");
const authRoutes = require("./routes/authRoutes");
const alumniProfileRoutes = require("./routes/alumniProfileRoutes");
const adminRoutes = require("./routes/adminRoutes");
const adminAlumniRoutes = require("./routes/adminAlumniRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const userRoutes = require("./routes/userRoutes");
const connectionRoutes = require("./routes/connectionRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const mentorRoutes = require("./routes/mentorRoutes");
const mentorshipRequestRoutes = require("./routes/mentorshipRequestRoutes");
const eventRoutes = require("./routes/eventRoutes");
const jobRoutes = require("./routes/jobRoutes");
const adminJobRoutes = require("./routes/adminJobRoutes");
const messageRoutes = require("./routes/messageRoutes");
const achievementRoutes = require("./routes/achievementRoutes");
const adminAchievementRoutes = require("./routes/adminAchievementRoutes");
const announcementRoutes = require("./routes/announcementRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");

const app = express();
// Socket.IO needs to attach to the raw HTTP server, not the Express app
// directly - express.listen() normally creates one of these implicitly,
// so from here on we create and listen on it ourselves instead.
const httpServer = http.createServer(app);

// Core middleware
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true, // allow the auth cookie to be sent/received
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Routes
app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/alumni-profiles", alumniProfileRoutes);
// More specific path mounted before the generic "/api/admin" router,
// so alumni-verification requests are handled directly here instead of
// first falling through the generic admin router's middleware.
app.use("/api/admin/alumni", adminAlumniRoutes);
app.use("/api/admin/jobs", adminJobRoutes);
app.use("/api/admin/achievements", adminAchievementRoutes);
app.use("/api/admin/analytics", analyticsRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/users", userRoutes);
app.use("/api/connections", connectionRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/mentors", mentorRoutes);
app.use("/api/mentorship-requests", mentorshipRequestRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/achievements", achievementRoutes);
app.use("/api/announcements", announcementRoutes);

// Fallback / error handling
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    if (process.env.MONGO_URI) {
      await connectDB();
    } else {
      console.warn(
        "MONGO_URI not set - starting server without a database connection."
      );
    }

    // Attach Socket.IO to the same HTTP server the REST API runs on,
    // sharing one port instead of running a second server process.
    initSocket(httpServer);

    httpServer.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log("Socket.IO ready for real-time connections");
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();

module.exports = app;
