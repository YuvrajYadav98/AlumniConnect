import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Plus, Pencil, Trash2, Lock, Unlock } from "lucide-react";
import {
  listMyPostedJobs,
  deleteJob,
  closeJob,
  reopenJob,
} from "../services/jobService";
import { getErrorMessage } from "../utils/getErrorMessage";
import StatusBadge from "../components/StatusBadge";
import Button from "../components/Button";

const APPROVAL_TO_BADGE = { pending: "pending", approved: "approved", rejected: "rejected" };

export default function MyPostedJobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actioningId, setActioningId] = useState(null);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await listMyPostedJobs({ limit: 50 });
      setJobs(data.jobs);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const runAction = async (id, fn) => {
    setActioningId(id);
    try {
      await fn(id);
      await fetchJobs();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActioningId(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this job posting permanently?")) return;
    await runAction(id, deleteJob);
  };

  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">My Job Postings</h1>
          <p className="text-sm text-slate-500 mt-1">
            {loading ? "Loading..." : `${jobs.length} posting${jobs.length === 1 ? "" : "s"}`}
          </p>
        </div>
        <Link to="/jobs/post">
          <Button>
            <span className="inline-flex items-center gap-1.5">
              <Plus size={14} /> Post a Job
            </span>
          </Button>
        </Link>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-slate-500">Loading...</p>
      ) : jobs.length === 0 ? (
        <p className="text-slate-500 py-8 text-center">You haven't posted any jobs yet.</p>
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg divide-y divide-slate-100">
          {jobs.map((j) => (
            <div key={j._id} className="flex items-center justify-between gap-4 px-5 py-4">
              <Link to={`/jobs/${j._id}`} className="min-w-0 flex-1">
                <p className="font-medium text-slate-800 truncate">{j.title}</p>
                <p className="text-xs text-slate-500 mt-1">{j.company}</p>
              </Link>

              <div className="flex items-center gap-3 shrink-0">
                <StatusBadge status={APPROVAL_TO_BADGE[j.approvalStatus]} />
                {j.approvalStatus === "approved" && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      j.status === "open"
                        ? "bg-slate-100 text-slate-600"
                        : "bg-slate-200 text-slate-500"
                    }`}
                  >
                    {j.status === "open" ? "Open" : "Closed"}
                  </span>
                )}

                {j.approvalStatus !== "approved" && (
                  <Link
                    to={`/jobs/${j._id}/edit`}
                    className="text-slate-400 hover:text-slate-700 p-1.5"
                    title="Edit"
                  >
                    <Pencil size={15} />
                  </Link>
                )}

                {j.approvalStatus === "approved" &&
                  (j.status === "open" ? (
                    <button
                      onClick={() => runAction(j._id, closeJob)}
                      disabled={actioningId === j._id}
                      className="text-slate-400 hover:text-slate-700 p-1.5"
                      title="Close to new applications"
                    >
                      <Lock size={15} />
                    </button>
                  ) : (
                    <button
                      onClick={() => runAction(j._id, reopenJob)}
                      disabled={actioningId === j._id}
                      className="text-slate-400 hover:text-slate-700 p-1.5"
                      title="Reopen"
                    >
                      <Unlock size={15} />
                    </button>
                  ))}

                <button
                  onClick={() => handleDelete(j._id)}
                  disabled={actioningId === j._id}
                  className="text-slate-400 hover:text-red-600 p-1.5"
                  title="Delete"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
