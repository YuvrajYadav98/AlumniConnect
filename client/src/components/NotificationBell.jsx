import { useEffect, useRef, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";
import {
  listNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "../services/notificationService";
import {
  NOTIFICATION_TYPE_ICON,
  resolveNotificationPath,
  timeAgo,
} from "../utils/notificationHelpers";

const POLL_INTERVAL_MS = 30000;

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef(null);
  const navigate = useNavigate();

  const refreshUnreadCount = useCallback(async () => {
    try {
      const data = await getUnreadCount();
      setUnreadCount(data.unreadCount);
    } catch {
      // silent - a failed badge refresh isn't worth surfacing to the user
    }
  }, []);

  // Poll for new notifications periodically so a request/accept from
  // another user shows up without requiring a manual page refresh.
  useEffect(() => {
    refreshUnreadCount();
    const interval = setInterval(refreshUnreadCount, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [refreshUnreadCount]);

  // Close the dropdown when clicking outside it.
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const openDropdown = async () => {
    setOpen((v) => !v);
    if (!open) {
      setLoading(true);
      try {
        const data = await listNotifications({ limit: 8 });
        setNotifications(data.notifications);
      } catch {
        // ignore - dropdown will just show an empty state
      } finally {
        setLoading(false);
      }
    }
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      try {
        await markNotificationAsRead(notification._id);
        setNotifications((prev) =>
          prev.map((n) => (n._id === notification._id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch {
        // non-fatal
      }
    }
    setOpen(false);
    const path = resolveNotificationPath(notification);
    if (path) navigate(path);
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      // non-fatal
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={openDropdown}
        className="relative p-2 rounded-full text-slate-600 hover:bg-slate-100 transition-colors"
        aria-label="Notifications"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-medium">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-lg z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <span className="text-sm font-semibold text-slate-800">Notifications</span>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-slate-500 hover:text-slate-800"
              >
                Mark all read
              </button>
            )}
          </div>

          {loading ? (
            <p className="text-sm text-slate-400 text-center py-8">Loading...</p>
          ) : notifications.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">No notifications yet.</p>
          ) : (
            <div className="divide-y divide-slate-50">
              {notifications.map((n) => {
                const Icon = NOTIFICATION_TYPE_ICON[n.type] || Bell;
                return (
                  <button
                    key={n._id}
                    onClick={() => handleNotificationClick(n)}
                    className={`w-full text-left flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors ${
                      !n.isRead ? "bg-slate-50/70" : ""
                    }`}
                  >
                    <span
                      className={`mt-0.5 shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${
                        !n.isRead ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-400"
                      }`}
                    >
                      <Icon size={13} />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm text-slate-800 leading-snug">
                        {n.title}
                      </span>
                      {n.message && (
                        <span className="block text-xs text-slate-500 mt-0.5 leading-snug">
                          {n.message}
                        </span>
                      )}
                      <span className="block text-[11px] text-slate-400 mt-1">
                        {timeAgo(n.createdAt)}
                      </span>
                    </span>
                    {!n.isRead && (
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          )}

          <div className="border-t border-slate-100 px-4 py-2 text-center">
            <Link
              to="/notifications"
              onClick={() => setOpen(false)}
              className="text-xs font-medium text-slate-500 hover:text-slate-800"
            >
              View all notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
