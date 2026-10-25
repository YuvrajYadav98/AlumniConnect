import { memo } from "react";
import { Link } from "react-router-dom";
import { Briefcase, MapPin, Clock, DollarSign } from "lucide-react";

const formatDeadline = (d) =>
  new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });

const formatSalary = (range) => {
  if (!range || (!range.min && !range.max)) return null;
  const currency = range.currency || "USD";
  if (range.min && range.max) return `${currency} ${range.min.toLocaleString()} - ${range.max.toLocaleString()}`;
  if (range.min) return `${currency} ${range.min.toLocaleString()}+`;
  return `Up to ${currency} ${range.max.toLocaleString()}`;
};

function JobCard({ job }) {
  const salary = formatSalary(job.salaryRange);

  return (
    <Link
      to={`/jobs/${job._id}`}
      className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md hover:border-slate-300 transition-shadow flex flex-col"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="font-semibold text-slate-800 line-clamp-2">{job.title}</h3>
        <span className="shrink-0 text-xs font-medium bg-indigo-50 text-indigo-700 rounded-full px-2 py-0.5 capitalize">
          {job.jobType}
        </span>
      </div>

      <p className="text-sm text-slate-600 mb-3">{job.company}</p>

      <div className="space-y-1 text-xs text-slate-500 mb-3">
        {job.location && (
          <p className="flex items-center gap-1.5">
            <MapPin size={12} className="shrink-0" /> {job.location}
          </p>
        )}
        {job.experienceRequired && (
          <p className="flex items-center gap-1.5">
            <Briefcase size={12} className="shrink-0" /> {job.experienceRequired}
          </p>
        )}
        {salary && (
          <p className="flex items-center gap-1.5">
            <DollarSign size={12} className="shrink-0" /> {salary}
          </p>
        )}
        <p className="flex items-center gap-1.5">
          <Clock size={12} className="shrink-0" /> Apply by {formatDeadline(job.applicationDeadline)}
        </p>
      </div>

      {job.skillsRequired?.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-auto pt-2">
          {job.skillsRequired.slice(0, 4).map((skill) => (
            <span
              key={skill}
              className="text-xs bg-slate-100 text-slate-600 rounded-full px-2 py-0.5"
            >
              {skill}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}

export default memo(JobCard);
