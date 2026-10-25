import {
  UserPlus,
  UserCheck,
  Info,
  Calendar,
  Briefcase,
  Megaphone,
  Award,
  MessageCircle,
  GraduationCap,
  CheckCircle2,
  XCircle,
} from "lucide-react";

export const NOTIFICATION_TYPE_ICON = {
  connection_request: UserPlus,
  connection_accepted: UserCheck,
  message: MessageCircle,
  event: Calendar,
  job: Briefcase,
  announcement: Megaphone,
  mentorship_request: GraduationCap,
  mentorship_accepted: CheckCircle2,
  mentorship_rejected: XCircle,
  mentorship_completed: CheckCircle2,
  achievement_approved: Award,
  system: Info,
};

// Where clicking a notification of a given relatedEntityType should go.
// Falls back to no navigation (just marks read) if unmapped.
export const resolveNotificationPath = (notification) => {
  switch (notification.relatedEntityType) {
    case "Connection":
      return "/connections/requests";
    case "MentorshipRequest":
      return "/mentorship-requests";
    case "Event":
      return `/events/${notification.relatedEntity}`;
    case "Job":
      return `/jobs/${notification.relatedEntity}`;
    case "Achievement":
      return "/profile";
    case "Announcement":
      return "/announcements";
    case "Message":
      return notification.sender?._id ? `/messages/${notification.sender._id}` : null;
    default:
      return null;
  }
};

export function timeAgo(dateStr) {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
