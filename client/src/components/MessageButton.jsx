import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MessageCircle } from "lucide-react";
import { getConnectionStatus } from "../services/connectionService";

/**
 * Only renders a "Message" link when the viewer and this profile's
 * owner are an accepted connection - mirrors the backend rule that
 * only connected users can message each other, so the button never
 * appears for a relationship that would just get rejected server-side.
 */
export default function MessageButton({ userId }) {
  const [canMessage, setCanMessage] = useState(false);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const data = await getConnectionStatus(userId);
        if (isMounted) setCanMessage(data.status === "accepted");
      } catch {
        if (isMounted) setCanMessage(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [userId]);

  if (!canMessage) return null;

  return (
    <Link
      to={`/messages/${userId}`}
      className="inline-flex items-center gap-1.5 text-sm font-medium rounded-md px-3 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors"
    >
      <MessageCircle size={14} /> Message
    </Link>
  );
}
