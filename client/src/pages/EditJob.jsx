import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { getJobById, updateJob } from "../services/jobService";
import { getErrorMessage } from "../utils/getErrorMessage";
import JobForm from "../components/JobForm";

export default function EditJob() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError("");
      try {
        const data = await getJobById(id);
        setJob(data.job);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleSubmit = async (payload) => {
    setError("");
    try {
      await updateJob(id, payload);
      navigate(`/jobs/${id}`, { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  if (loading) return <p className="text-center text-slate-500 py-16">Loading...</p>;

  return (
    <section className="max-w-2xl mx-auto">
      <Link
        to={`/jobs/${id}`}
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 mb-4"
      >
        <ArrowLeft size={14} /> Back to job
      </Link>

      <h1 className="text-2xl font-semibold text-slate-800 mb-1">Edit Job Posting</h1>
      <p className="text-sm text-slate-500 mb-6">
        Saving changes resubmits this listing for admin review.
      </p>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {job && <JobForm initialValues={job} onSubmit={handleSubmit} submitLabel="Save Changes" />}
    </section>
  );
}
