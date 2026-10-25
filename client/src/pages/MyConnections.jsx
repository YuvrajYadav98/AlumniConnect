import { useEffect, useState } from "react";
import { UserMinus } from "lucide-react";
import { listConnections, deleteConnection } from "../services/connectionService";
import { getErrorMessage } from "../utils/getErrorMessage";
import ConnectionListItem from "../components/ConnectionListItem";

function profileSubtitle(profile) {
  if (!profile) return null;
  const parts = [profile.jobTitle, profile.currentCompany && `at ${profile.currentCompany}`]
    .filter(Boolean)
    .join(" ");
  return parts || profile.branch || null;
}

export default function MyConnections() {
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [removingId, setRemovingId] = useState(null);

  const fetchConnections = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await listConnections();
      setConnections(data.connections);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConnections();
  }, []);

  const handleRemove = async (connectionId) => {
    setRemovingId(connectionId);
    try {
      await deleteConnection(connectionId);
      setConnections((prev) => prev.filter((c) => c.connectionId !== connectionId));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <section>
      <h1 className="text-2xl font-semibold text-slate-800 mb-1">My Connections</h1>
      <p className="text-sm text-slate-500 mb-6">
        {loading ? "Loading..." : `${connections.length} connection${connections.length === 1 ? "" : "s"}`}
      </p>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-slate-500">Loading...</p>
      ) : connections.length === 0 ? (
        <p className="text-slate-500 py-8 text-center">
          You haven't connected with anyone yet. Browse the{" "}
          <a href="/alumni" className="text-slate-800 underline">
            alumni directory
          </a>{" "}
          to get started.
        </p>
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg divide-y divide-slate-100">
          {connections.map((c) => (
            <ConnectionListItem
              key={c.connectionId}
              user={c.user}
              subtitle={profileSubtitle(c.profile)}
            >
              <button
                onClick={() => handleRemove(c.connectionId)}
                disabled={removingId === c.connectionId}
                className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-red-600 disabled:opacity-50"
              >
                <UserMinus size={14} /> Remove
              </button>
            </ConnectionListItem>
          ))}
        </div>
      )}
    </section>
  );
}
