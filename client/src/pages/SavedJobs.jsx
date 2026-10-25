import { useEffect, useState, useCallback } from "react";
import { listSavedJobs, unsaveJob } from "../services/jobService";
import { getErrorMessage } from "../utils/getErrorMessage";
import JobCard from "../components/JobCard";

export default function SavedJobs() {
  const [savedJobs, setSavedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [removingId, setRemovingId] = useState(null);

  const fetchSaved = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await listSavedJobs({ limit: 50 });
      setSavedJobs(data.savedJobs);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSaved();
  }, [fetchSaved]);

  const handleUnsave = async (jobId) => {
    setRemovingId(jobId);
    try {
      await unsaveJob(jobId);
      setSavedJobs((prev) => prev.filter((s) => s.job._id !== jobId));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <section>
      <h1 className="text-2xl font-semibold text-slate-800 mb-1">Saved Jobs</h1>
      <p className="text-sm text-slate-500 mb-6">
        {loading ? "Loading..." : `${savedJobs.length} saved`}
      </p>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-slate-500">Loading...</p>
      ) : savedJobs.length === 0 ? (
        <p className="text-slate-500 py-8 text-center">You haven't saved any jobs yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {savedJobs.map((s) => (
            <div key={s._id} className="relative">
              <JobCard job={s.job} />
              <button
                onClick={() => handleUnsave(s.job._id)}
                disabled={removingId === s.job._id}
                className="absolute top-3 right-3 text-xs font-medium bg-white/95 text-red-600 border border-red-200 rounded-md px-2 py-1 hover:bg-red-50 disabled:opacity-50"
              >
                {removingId === s.job._id ? "Removing..." : "Unsave"}
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
