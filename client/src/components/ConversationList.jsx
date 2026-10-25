import { Link } from "react-router-dom";
import { useSocket } from "../context/SocketContext";

function timeAgo(dateStr) {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return "now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

export default function ConversationList({ conversations, activeUserId }) {
  const { isUserOnline } = useSocket();

  if (conversations.length === 0) {
    return (
      <p className="text-sm text-slate-400 text-center py-10 px-4">
        No conversations yet. Message someone from their profile page to
        start one.
      </p>
    );
  }

  return (
    <div className="divide-y divide-slate-100">
      {conversations.map((c) => {
        const online = isUserOnline(c.user._id);
        const isActive = c.user._id === activeUserId;
        const isUnread = c.unreadCount > 0;

        return (
          <Link
            key={c.user._id}
            to={`/messages/${c.user._id}`}
            className={`flex items-center gap-3 px-4 py-3 transition-colors ${
              isActive ? "bg-slate-100" : "hover:bg-slate-50"
            }`}
          >
            <div className="relative shrink-0">
              <div className="w-11 h-11 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center">
                {c.user.profileImage ? (
                  <img loading="lazy" decoding="async"
                    src={c.user.profileImage}
                    alt={c.user.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-sm font-semibold text-slate-500">
                    {c.user.name?.[0]?.toUpperCase()}
                  </span>
                )}
              </div>
              {online && (
                <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 ring-2 ring-white" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p
                  className={`text-sm truncate ${
                    isUnread ? "font-semibold text-slate-900" : "font-medium text-slate-700"
                  }`}
                >
                  {c.user.name}
                </p>
                <span className="text-[11px] text-slate-400 shrink-0">
                  {timeAgo(c.lastMessage.createdAt)}
                </span>
              </div>
              <p
                className={`text-xs truncate ${
                  isUnread ? "text-slate-700 font-medium" : "text-slate-400"
                }`}
              >
                {c.lastMessage.content}
              </p>
            </div>

            {isUnread && (
              <span className="shrink-0 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-slate-800 text-white text-[10px] font-medium px-1">
                {c.unreadCount > 9 ? "9+" : c.unreadCount}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
