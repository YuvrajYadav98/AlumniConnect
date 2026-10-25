import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Check, X, Trash2 } from "lucide-react";
import {
  listPendingJobsAdmin,
  listAllJobsAdmin,
  approveJobAdmin,
  rejectJobAdmin,
  deleteExpiredJobsAdmin,
} from "../services/adminJobService";
import { getErrorMessage } from "../utils/getErrorMessage";
import StatusBadge from "../components/StatusBadge";
import Button from "../components/Button";

const TABS = ["pending", "approved", "rejected", "all"];

export default function AdminJobs() {
  const [tab, setTab] = useState("pending");
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [actioningId, setActioningId] = useState(null);
  const [cleaningExpired, setCleaningExpired] = useState(false);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data =
        tab === "pending"
          ? await listPendingJobsAdmin({ limit: 100 })
          : await listAllJobsAdmin(tab === "all" ? { limit: 100 } : { status: tab, limit: 100 });
      setJobs(data.jobs);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const handleApprove = async (id) => {
    setActioningId(id);
    try {
      await approveJobAdmin(id);
      setJobs((prev) => prev.filter((j) => j._id !== id));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActioningId(null);
    }
  };

  const handleReject = async (id) => {
    const reason = window.prompt("Reason for rejection (optional):") || "";
    setActioningId(id);
    try {
      await rejectJobAdmin(id, reason);
      setJobs((prev) => prev.filter((j) => j._id !== id));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActioningId(null);
    }
  };

  const handleDeleteExpired = async () => {
    if (!window.confirm("Permanently delete every job whose deadline has passed?")) return;
    setCleaningExpired(true);
    setInfo("");
    setError("");
    try {
      const data = await deleteExpiredJobsAdmin();
      setInfo(data.message);
      await fetchJobs();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setCleaningExpired(false);
    }
  };

  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Manage Jobs</h1>
          <p className="text-sm text-slate-500 mt-1">
            {loading ? "Loading..." : `${jobs.length} job${jobs.length === 1 ? "" : "s"}`}
          </p>
        </div>
        <Button
          onClick={handleDeleteExpired}
          disabled={cleaningExpired}
          className="bg-white text-red-600 border border-red-200 hover:bg-red-50"
        >
          <span className="inline-flex items-center gap-1.5">
            <Trash2 size={14} />
            {cleaningExpired ? "Cleaning up..." : "Delete Expired Jobs"}
          </span>
        </Button>
      </div>

      <div className="flex gap-2 mb-6">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`text-xs px-3 py-1.5 rounded-full border capitalize transition-colors ${
              tab === t
                ? "bg-slate-800 text-white border-slate-800"
                : "bg-white text-slate-600 border-slate-300 hover:bg-slate-50"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {info && (
        <div className="mb-4 rounded-md bg-green-50 border border-green-200 px-3 py-2 text-sm text-green-700">
          {info}
        </div>
      )}
      {error && (
        <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-slate-500">Loading...</p>
      ) : jobs.length === 0 ? (
        <p className="text-slate-500 py-8 text-center">No jobs in this view.</p>
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg divide-y divide-slate-100">
          {jobs.map((j) => (
            <div key={j._id} className="flex items-center justify-between gap-4 px-5 py-4">
              <Link to={`/jobs/${j._id}`} className="min-w-0 flex-1">
                <p className="font-medium text-slate-800 truncate">{j.title}</p>
                <p className="text-xs text-slate-500 mt-1">
                  {j.company} · Posted by {j.postedBy?.name}
                </p>
              </Link>
              <div className="flex items-center gap-2 shrink-0">
                <StatusBadge status={j.approvalStatus} />
                {j.approvalStatus === "pending" && (
                  <>
                    <button
                      onClick={() => handleApprove(j._id)}
                      disabled={actioningId === j._id}
                      className="flex items-center gap-1.5 text-xs font-medium bg-slate-800 text-white rounded-md px-2.5 py-1 hover:bg-slate-700 disabled:opacity-50"
                    >
                      <Check size={12} /> Approve
                    </button>
                    <button
                      onClick={() => handleReject(j._id)}
                      disabled={actioningId === j._id}
                      className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-red-600 disabled:opacity-50"
                    >
                      <X size={12} /> Reject
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
