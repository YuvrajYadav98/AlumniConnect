import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import ProtectedRoute from "./ProtectedRoute";
import DashboardRedirect from "./DashboardRedirect";
import PageLoader from "../components/PageLoader";

// Every page is code-split with React.lazy so the initial bundle only
// contains the app shell (layout, routing, auth) - a page's JS (and
// anything it imports, e.g. Recharts for analytics or Socket.IO for
// messaging) is only fetched the first time someone actually visits
// that route, instead of shipping ~940KB up front to every visitor.
const Home = lazy(() => import("../pages/Home"));
const Login = lazy(() => import("../pages/Login"));
const Register = lazy(() => import("../pages/Register"));
const AdminDashboard = lazy(() => import("../pages/dashboards/AdminDashboard"));
const AlumniDashboard = lazy(() => import("../pages/dashboards/AlumniDashboard"));
const StudentDashboard = lazy(() => import("../pages/dashboards/StudentDashboard"));
const EditProfile = lazy(() => import("../pages/EditProfile"));
const MyProfile = lazy(() => import("../pages/MyProfile"));
const PublicProfile = lazy(() => import("../pages/PublicProfile"));
const AlumniDirectory = lazy(() => import("../pages/AlumniDirectory"));
const MyConnections = lazy(() => import("../pages/MyConnections"));
const PendingRequests = lazy(() => import("../pages/PendingRequests"));
const FindMentors = lazy(() => import("../pages/FindMentors"));
const MyMentorships = lazy(() => import("../pages/MyMentorships"));
const Events = lazy(() => import("../pages/Events"));
const EventDetail = lazy(() => import("../pages/EventDetail"));
const MyRegisteredEvents = lazy(() => import("../pages/MyRegisteredEvents"));
const AdminEvents = lazy(() => import("../pages/AdminEvents"));
const AdminEventCreate = lazy(() => import("../pages/AdminEventCreate"));
const AdminEventDetail = lazy(() => import("../pages/AdminEventDetail"));
const AdminEventParticipants = lazy(() => import("../pages/AdminEventParticipants"));
const Jobs = lazy(() => import("../pages/Jobs"));
const JobDetail = lazy(() => import("../pages/JobDetail"));
const PostJob = lazy(() => import("../pages/PostJob"));
const EditJob = lazy(() => import("../pages/EditJob"));
const MyPostedJobs = lazy(() => import("../pages/MyPostedJobs"));
const SavedJobs = lazy(() => import("../pages/SavedJobs"));
const AdminJobs = lazy(() => import("../pages/AdminJobs"));
const Messages = lazy(() => import("../pages/Messages"));
const Notifications = lazy(() => import("../pages/Notifications"));
const Announcements = lazy(() => import("../pages/Announcements"));
const AdminAnnouncements = lazy(() => import("../pages/AdminAnnouncements"));
const AdminAnalytics = lazy(() => import("../pages/AdminAnalytics"));
const SubmitAchievement = lazy(() => import("../pages/SubmitAchievement"));
const MyAchievements = lazy(() => import("../pages/MyAchievements"));
const AchievementDetail = lazy(() => import("../pages/AchievementDetail"));
const AdminAchievements = lazy(() => import("../pages/AdminAchievements"));
const AdminUsers = lazy(() => import("../pages/AdminUsers"));
const AdminAlumni = lazy(() => import("../pages/AdminAlumni"));
const AdminAlumniDetail = lazy(() => import("../pages/AdminAlumniDetail"));
const Unauthorized = lazy(() => import("../pages/Unauthorized"));
const NotFound = lazy(() => import("../pages/NotFound"));

export default function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Home />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route path="unauthorized" element={<Unauthorized />} />

          {/* Any authenticated user (admin, alumni, or student) */}
          <Route element={<ProtectedRoute />}>
            {/* Stable entry point that forwards to the role-specific dashboard */}
            <Route path="dashboard" element={<DashboardRedirect />} />
            <Route path="alumni" element={<AlumniDirectory />} />
            <Route path="alumni/:userId" element={<PublicProfile />} />
            <Route path="connections" element={<MyConnections />} />
            <Route path="connections/requests" element={<PendingRequests />} />
            <Route path="events" element={<Events />} />
            <Route path="events/:id" element={<EventDetail />} />
            <Route path="my-events" element={<MyRegisteredEvents />} />
            <Route path="jobs" element={<Jobs />} />
            <Route path="jobs/:id" element={<JobDetail />} />
            <Route path="saved-jobs" element={<SavedJobs />} />
            <Route path="messages" element={<Messages />} />
            <Route path="messages/:userId" element={<Messages />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="announcements" element={<Announcements />} />
            <Route path="achievements/:id" element={<AchievementDetail />} />
          </Route>

          {/* Role-specific dashboards */}
          <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
            <Route path="admin/dashboard" element={<AdminDashboard />} />
            <Route path="admin/analytics" element={<AdminAnalytics />} />
            <Route path="admin/users" element={<AdminUsers />} />
            <Route path="admin/alumni" element={<AdminAlumni />} />
            <Route path="admin/alumni/:id" element={<AdminAlumniDetail />} />
            <Route path="admin/events" element={<AdminEvents />} />
            <Route path="admin/events/create" element={<AdminEventCreate />} />
            <Route path="admin/events/:id" element={<AdminEventDetail />} />
            <Route path="admin/events/:id/participants" element={<AdminEventParticipants />} />
            <Route path="admin/jobs" element={<AdminJobs />} />
            <Route path="admin/announcements" element={<AdminAnnouncements />} />
            <Route path="admin/achievements" element={<AdminAchievements />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={["alumni"]} />}>
            <Route path="alumni/dashboard" element={<AlumniDashboard />} />
            <Route path="profile" element={<MyProfile />} />
            <Route path="profile/edit" element={<EditProfile />} />
            <Route path="jobs/post" element={<PostJob />} />
            <Route path="jobs/:id/edit" element={<EditJob />} />
            <Route path="my-jobs" element={<MyPostedJobs />} />
            <Route path="achievements" element={<MyAchievements />} />
            <Route path="achievements/submit" element={<SubmitAchievement />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={["student"]} />}>
            <Route path="student/dashboard" element={<StudentDashboard />} />
            <Route path="mentors" element={<FindMentors />} />
          </Route>

          {/* Mentorship request inbox/outbox - relevant to both students
              (who send requests) and alumni (who receive them as mentors) */}
          <Route element={<ProtectedRoute allowedRoles={["alumni", "student"]} />}>
            <Route path="mentorship-requests" element={<MyMentorships />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
