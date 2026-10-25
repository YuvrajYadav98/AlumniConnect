import { useEffect, useState, useCallback } from "react";
import { Check, X, XCircle } from "lucide-react";
import {
  listPendingRequests,
  acceptConnectionRequest,
  rejectConnectionRequest,
  deleteConnection,
} from "../services/connectionService";
import { getErrorMessage } from "../utils/getErrorMessage";
import ConnectionListItem from "../components/ConnectionListItem";

function profileSubtitle(profile) {
  if (!profile) return null;
  const parts = [profile.jobTitle, profile.currentCompany && `at ${profile.currentCompany}`]
    .filter(Boolean)
    .join(" ");
  return parts || profile.branch || null;
}

export default function PendingRequests() {
  const [tab, setTab] = useState("received"); // "received" | "sent"
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actioningId, setActioningId] = useState(null);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await listPendingRequests(tab);
      setRequests(data.requests);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleAccept = async (connectionId) => {
    setActioningId(connectionId);
    try {
      await acceptConnectionRequest(connectionId);
      setRequests((prev) => prev.filter((r) => r.connectionId !== connectionId));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActioningId(null);
    }
  };

  const handleReject = async (connectionId) => {
    setActioningId(connectionId);
    try {
      await rejectConnectionRequest(connectionId);
      setRequests((prev) => prev.filter((r) => r.connectionId !== connectionId));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActioningId(null);
    }
  };

  const handleCancel = async (connectionId) => {
    setActioningId(connectionId);
    try {
      await deleteConnection(connectionId);
      setRequests((prev) => prev.filter((r) => r.connectionId !== connectionId));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActioningId(null);
    }
  };

  return (
    <section>
      <h1 className="text-2xl font-semibold text-slate-800 mb-6">Connection Requests</h1>

      <div className="flex gap-2 mb-6">
        <TabButton active={tab === "received"} onClick={() => setTab("received")}>
          Received
        </TabButton>
        <TabButton active={tab === "sent"} onClick={() => setTab("sent")}>
          Sent
        </TabButton>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-slate-500">Loading...</p>
      ) : requests.length === 0 ? (
        <p className="text-slate-500 py-8 text-center">
          {tab === "received"
            ? "No pending requests to review."
            : "You haven't sent any pending requests."}
        </p>
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg divide-y divide-slate-100">
          {requests.map((r) => (
            <ConnectionListItem
              key={r.connectionId}
              user={r.user}
              subtitle={profileSubtitle(r.profile)}
            >
              {tab === "received" ? (
                <>
                  <button
                    onClick={() => handleAccept(r.connectionId)}
                    disabled={actioningId === r.connectionId}
                    className="flex items-center gap-1.5 text-sm font-medium bg-slate-800 text-white rounded-md px-3 py-1.5 hover:bg-slate-700 disabled:opacity-50"
                  >
                    <Check size={14} /> Accept
                  </button>
                  <button
                    onClick={() => handleReject(r.connectionId)}
                    disabled={actioningId === r.connectionId}
                    className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-red-600 disabled:opacity-50"
                  >
                    <X size={14} /> Reject
                  </button>
                </>
              ) : (
                <button
                  onClick={() => handleCancel(r.connectionId)}
                  disabled={actioningId === r.connectionId}
                  className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-red-600 disabled:opacity-50"
                >
                  <XCircle size={14} /> Cancel
                </button>
              )}
            </ConnectionListItem>
          ))}
        </div>
      )}
    </section>
  );
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`text-sm px-4 py-1.5 rounded-full border transition-colors ${
        active
          ? "bg-slate-800 text-white border-slate-800"
          : "bg-white text-slate-600 border-slate-300 hover:bg-slate-50"
      }`}
    >
      {children}
    </button>
  );
}
