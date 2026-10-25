import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { createJob } from "../services/jobService";
import { getErrorMessage } from "../utils/getErrorMessage";
import JobForm from "../components/JobForm";

export default function PostJob() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");

  const handleSubmit = async (payload) => {
    setError("");
    try {
      const data = await createJob(payload);
      navigate(`/jobs/${data.job._id}`, { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  if (user?.verificationStatus !== "approved") {
    return (
      <section className="max-w-md mx-auto bg-white p-8 rounded-lg border border-slate-200 text-center">
        <h1 className="text-xl font-semibold text-slate-800 mb-2">
          Verification required
        </h1>
        <p className="text-sm text-slate-500">
          Only verified alumni can post jobs and internships. Your account is
          still pending admin review — check back once it's approved.
        </p>
      </section>
    );
  }

  return (
    <section className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold text-slate-800 mb-1">Post a Job or Internship</h1>
      <p className="text-sm text-slate-500 mb-6">
        Your listing will be reviewed by an admin before it's visible to
        students and alumni.
      </p>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <JobForm onSubmit={handleSubmit} submitLabel="Submit for Review" />
    </section>
  );
}
