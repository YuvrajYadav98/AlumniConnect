import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";
import {
  listNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "../services/notificationService";
import { getErrorMessage } from "../utils/getErrorMessage";
import {
  NOTIFICATION_TYPE_ICON,
  resolveNotificationPath,
  timeAgo,
} from "../utils/notificationHelpers";
import Pagination from "../components/Pagination";

export default function Notifications() {
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await listNotifications({ page, limit: 20 });
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
      setTotalPages(data.totalPages);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleClick = async (notification) => {
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
    const path = resolveNotificationPath(notification);
    if (path) navigate(path);
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <section className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800 flex items-center gap-2">
            <Bell size={22} /> Notifications
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {loading ? "Loading..." : `${unreadCount} unread`}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            Mark all as read
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-slate-500 text-center py-16">Loading...</p>
      ) : notifications.length === 0 ? (
        <p className="text-slate-500 text-center py-16">You have no notifications yet.</p>
      ) : (
        <>
          <div className="bg-white border border-slate-200 rounded-lg divide-y divide-slate-100">
            {notifications.map((n) => {
              const Icon = NOTIFICATION_TYPE_ICON[n.type] || Bell;
              return (
                <button
                  key={n._id}
                  onClick={() => handleClick(n)}
                  className={`w-full text-left flex items-start gap-3 px-5 py-4 hover:bg-slate-50 transition-colors ${
                    !n.isRead ? "bg-slate-50/70" : ""
                  }`}
                >
                  <span
                    className={`mt-0.5 shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${
                      !n.isRead ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-400"
                    }`}
                  >
                    <Icon size={16} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span
                      className={`block text-sm leading-snug ${
                        !n.isRead ? "font-semibold text-slate-900" : "text-slate-700"
                      }`}
                    >
                      {n.title}
                    </span>
                    {n.message && (
                      <span className="block text-sm text-slate-500 mt-0.5 leading-snug">
                        {n.message}
                      </span>
                    )}
                    <span className="block text-xs text-slate-400 mt-1.5">
                      {timeAgo(n.createdAt)}
                    </span>
                  </span>
                  {!n.isRead && (
                    <span className="w-2 h-2 rounded-full bg-blue-500 mt-2 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}
    </section>
  );
}
