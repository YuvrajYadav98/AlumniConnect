import { useEffect, useState } from "react";
import { UserPlus, Check, X, Clock, UserMinus, ShieldOff } from "lucide-react";
import {
  getConnectionStatus,
  sendConnectionRequest,
  acceptConnectionRequest,
  rejectConnectionRequest,
  deleteConnection,
  blockUser,
} from "../services/connectionService";

/**
 * Full-featured connect/accept/reject/remove/block control for a single
 * profile page. Fetches the real relationship status on mount (a single
 * extra request is fine here, unlike the directory grid where doing
 * this per-card would mean N extra requests per page).
 */
export default function ConnectButton({ userId }) {
  const [status, setStatus] = useState(null); // null while loading
  const [connectionId, setConnectionId] = useState(null);
  const [acting, setActing] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const data = await getConnectionStatus(userId);
        if (isMounted) {
          setStatus(data.status);
          setConnectionId(data.connectionId || null);
        }
      } catch {
        if (isMounted) setStatus("none");
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [userId]);

  const runAction = async (fn) => {
    setActing(true);
    try {
      await fn();
      // Re-fetch rather than guess the new state locally - keeps this
      // component correct even as more relationship states are added later.
      const data = await getConnectionStatus(userId);
      setStatus(data.status);
      setConnectionId(data.connectionId || null);
    } catch {
      // Leave status as-is on failure - the buttons remain actionable to retry.
    } finally {
      setActing(false);
      setConfirmRemove(false);
    }
  };

  if (status === null) {
    return <div className="h-9 w-32 rounded-md bg-slate-100 animate-pulse" />;
  }

  if (status === "self") return null;

  if (status === "blocked") {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm text-slate-400 px-3 py-2">
        <ShieldOff size={14} /> Blocked
      </span>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {status === "none" && (
        <ActionButton
          icon={UserPlus}
          label="Connect"
          onClick={() => runAction(() => sendConnectionRequest(userId))}
          disabled={acting}
          primary
        />
      )}

      {status === "pending_sent" && (
        <ActionButton
          icon={Clock}
          label="Cancel Request"
          onClick={() => runAction(() => deleteConnection(connectionId))}
          disabled={acting}
        />
      )}

      {status === "pending_received" && (
        <>
          <ActionButton
            icon={Check}
            label="Accept"
            onClick={() => runAction(() => acceptConnectionRequest(connectionId))}
            disabled={acting}
            primary
          />
          <ActionButton
            icon={X}
            label="Reject"
            onClick={() => runAction(() => rejectConnectionRequest(connectionId))}
            disabled={acting}
          />
        </>
      )}

      {status === "accepted" && !confirmRemove && (
        <>
          <span className="inline-flex items-center gap-1.5 text-sm text-green-700 bg-green-50 rounded-md px-3 py-2">
            <Check size={14} /> Connected
          </span>
          <ActionButton
            icon={UserMinus}
            label="Remove"
            onClick={() => setConfirmRemove(true)}
            disabled={acting}
          />
        </>
      )}

      {status === "accepted" && confirmRemove && (
        <>
          <span className="text-sm text-slate-500">Remove this connection?</span>
          <ActionButton
            label="Confirm"
            onClick={() => runAction(() => deleteConnection(connectionId))}
            disabled={acting}
            danger
          />
          <ActionButton label="Cancel" onClick={() => setConfirmRemove(false)} />
        </>
      )}

      {status !== "accepted" && (
        <button
          onClick={() => runAction(() => blockUser(userId))}
          disabled={acting}
          className="text-xs text-slate-400 hover:text-red-600 ml-1"
          title="Block this user"
        >
          Block
        </button>
      )}
    </div>
  );
}

function ActionButton({ icon: Icon, label, onClick, disabled, primary, danger }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-1.5 text-sm font-medium rounded-md px-3 py-2 transition-colors disabled:opacity-60 ${
        primary
          ? "bg-slate-800 text-white hover:bg-slate-700"
          : danger
          ? "bg-red-600 text-white hover:bg-red-500"
          : "border border-slate-300 text-slate-700 hover:bg-slate-50"
      }`}
    >
      {Icon && <Icon size={14} />}
      {label}
    </button>
  );
}
