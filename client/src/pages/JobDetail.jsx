import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  ArrowLeft,
  MapPin,
  Briefcase,
  DollarSign,
  Clock,
  Bookmark,
  BookmarkCheck,
  ExternalLink,
  Pencil,
} from "lucide-react";
import { getJobById, saveJob, unsaveJob, applyToJob } from "../services/jobService";
import { getErrorMessage } from "../utils/getErrorMessage";
import Button from "../components/Button";

const formatDate = (d) =>
  new Date(d).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });

const formatSalary = (range) => {
  if (!range || (!range.min && !range.max)) return null;
  const currency = range.currency || "USD";
  if (range.min && range.max)
    return `${currency} ${range.min.toLocaleString()} - ${range.max.toLocaleString()}`;
  if (range.min) return `${currency} ${range.min.toLocaleString()}+`;
  return `Up to ${currency} ${range.max.toLocaleString()}`;
};

export default function JobDetail() {
  const { id } = useParams();
  const { user } = useAuth();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [acting, setActing] = useState(false);
  const [applyResult, setApplyResult] = useState(null);

  const fetchJob = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await getJobById(id);
      setData(result);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJob();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleToggleSave = async () => {
    setActing(true);
    setActionError("");
    try {
      if (data.isSaved) {
        await unsaveJob(id);
      } else {
        await saveJob(id);
      }
      await fetchJob();
    } catch (err) {
      setActionError(getErrorMessage(err));
    } finally {
      setActing(false);
    }
  };

  const handleApply = async () => {
    setActing(true);
    setActionError("");
    try {
      const result = await applyToJob(id);
      setApplyResult(result);
      await fetchJob();
    } catch (err) {
      setActionError(getErrorMessage(err));
    } finally {
      setActing(false);
    }
  };

  if (loading) return <p className="text-center text-slate-500 py-16">Loading job...</p>;
  if (error) {
    return (
      <div className="max-w-2xl mx-auto rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
        {error}
      </div>
    );
  }

  const { job, isSaved, hasApplied } = data;
  const isOwner = job.postedBy?._id === user?.id || job.postedBy?._id === user?._id;
  const salary = formatSalary(job.salaryRange);
  const isExpired = new Date() > new Date(job.applicationDeadline);
  const isClosed = job.status !== "open";

  return (
    <section className="max-w-3xl mx-auto">
      <Link
        to="/jobs"
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 mb-4"
      >
        <ArrowLeft size={14} /> Back to jobs
      </Link>

      <div className="flex items-start justify-between gap-3 mb-1">
        <h1 className="text-2xl font-semibold text-slate-800">{job.title}</h1>
        <span className="shrink-0 text-xs font-medium bg-indigo-50 text-indigo-700 rounded-full px-2 py-0.5 capitalize">
          {job.jobType}
        </span>
      </div>
      <p className="text-sm text-slate-500 mb-1">{job.company}</p>
      <p className="text-xs text-slate-400 mb-6">
        Posted by {job.postedBy?.name || "an alumni"}
      </p>

      {(isClosed || isExpired) && (
        <div className="mb-4 rounded-md bg-slate-100 border border-slate-200 px-3 py-2 text-sm text-slate-600">
          {isClosed ? "This job is no longer accepting applications." : "The application deadline has passed."}
        </div>
      )}

      {isOwner && job.approvalStatus !== "approved" && (
        <div className="mb-4 rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-sm text-amber-700 flex items-center justify-between">
          <span>
            Status: <span className="capitalize font-medium">{job.approvalStatus}</span>
            {job.rejectionReason && ` — ${job.rejectionReason}`}
          </span>
          <Link
            to={`/jobs/${id}/edit`}
            className="inline-flex items-center gap-1 font-medium text-amber-800 hover:underline shrink-0 ml-3"
          >
            <Pencil size={12} /> Edit
          </Link>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-lg p-5 mb-6 space-y-3 text-sm">
        {job.location && (
          <p className="flex items-center gap-2 text-slate-700">
            <MapPin size={16} className="text-slate-400 shrink-0" /> {job.location}
          </p>
        )}
        {job.experienceRequired && (
          <p className="flex items-center gap-2 text-slate-700">
            <Briefcase size={16} className="text-slate-400 shrink-0" /> {job.experienceRequired}
          </p>
        )}
        {salary && (
          <p className="flex items-center gap-2 text-slate-700">
            <DollarSign size={16} className="text-slate-400 shrink-0" /> {salary}
          </p>
        )}
        <p className="flex items-center gap-2 text-slate-700">
          <Clock size={16} className="text-slate-400 shrink-0" /> Apply by{" "}
          {formatDate(job.applicationDeadline)}
        </p>
      </div>

      <div className="mb-6">
        <h2 className="text-base font-semibold text-slate-800 mb-2">Description</h2>
        <p className="text-sm text-slate-600 whitespace-pre-wrap">{job.description}</p>
      </div>

      {job.skillsRequired?.length > 0 && (
        <div className="mb-6">
          <h2 className="text-base font-semibold text-slate-800 mb-2">Skills</h2>
          <div className="flex flex-wrap gap-1.5">
            {job.skillsRequired.map((skill) => (
              <span
                key={skill}
                className="text-xs bg-slate-100 text-slate-600 rounded-full px-2 py-0.5"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {actionError && (
        <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
          {actionError}
        </div>
      )}

      {(applyResult?.applyLink || applyResult?.applyEmail) && (
        <div className="mb-4 rounded-md bg-green-50 border border-green-200 px-3 py-2 text-sm text-green-700">
          Application recorded! Complete your application at{" "}
          {applyResult.applyLink ? (
            <a
              href={applyResult.applyLink}
              target="_blank"
              rel="noreferrer"
              className="underline break-all"
            >
              {applyResult.applyLink}
            </a>
          ) : (
            <a href={`mailto:${applyResult.applyEmail}`} className="underline">
              {applyResult.applyEmail}
            </a>
          )}
          .
        </div>
      )}

      {!isOwner && (
        <div className="flex gap-2">
          <Button onClick={handleApply} disabled={acting || hasApplied || isExpired || isClosed}>
            {hasApplied ? "Applied" : acting ? "Applying..." : "Apply Now"}
          </Button>
          <Button
            onClick={handleToggleSave}
            disabled={acting}
            className="bg-white text-slate-700 border border-slate-300 hover:bg-slate-50"
          >
            <span className="inline-flex items-center gap-1.5">
              {isSaved ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
              {isSaved ? "Saved" : "Save"}
            </span>
          </Button>
          {job.applyLink && (
            <a href={job.applyLink} target="_blank" rel="noreferrer">
              <Button className="bg-white text-slate-700 border border-slate-300 hover:bg-slate-50">
                <span className="inline-flex items-center gap-1.5">
                  <ExternalLink size={14} /> Visit Listing
                </span>
              </Button>
            </a>
          )}
        </div>
      )}
    </section>
  );
}
