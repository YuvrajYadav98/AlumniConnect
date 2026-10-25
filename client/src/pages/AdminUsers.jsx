import { useEffect, useState } from "react";
import { listPendingUsers, approveUser, rejectUser } from "../services/adminService";
import { getErrorMessage } from "../utils/getErrorMessage";
import Button from "../components/Button";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actioningId, setActioningId] = useState(null);

  const fetchPending = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await listPendingUsers();
      setUsers(data.users);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleApprove = async (id) => {
    setActioningId(id);
    try {
      await approveUser(id);
      setUsers((prev) => prev.filter((u) => u._id !== id));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActioningId(null);
    }
  };

  const handleReject = async (id) => {
    setActioningId(id);
    try {
      await rejectUser(id);
      setUsers((prev) => prev.filter((u) => u._id !== id));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActioningId(null);
    }
  };

  return (
    <section>
      <h1 className="text-2xl font-semibold text-slate-800 mb-6">
        Pending Account Approvals
      </h1>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-slate-500">Loading...</p>
      ) : users.length === 0 ? (
        <p className="text-slate-500">No accounts are waiting for approval.</p>
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg divide-y divide-slate-100">
          {users.map((u) => (
            <div
              key={u._id}
              className="flex items-center justify-between px-5 py-4"
            >
              <div>
                <p className="font-medium text-slate-800">{u.name}</p>
                <p className="text-sm text-slate-500">
                  {u.email} · <span className="capitalize">{u.role}</span>
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => handleApprove(u._id)}
                  disabled={actioningId === u._id}
                  className="bg-green-600 hover:bg-green-500"
                >
                  Approve
                </Button>
                <Button
                  onClick={() => handleReject(u._id)}
                  disabled={actioningId === u._id}
                  className="bg-red-600 hover:bg-red-500"
                >
                  Reject
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
