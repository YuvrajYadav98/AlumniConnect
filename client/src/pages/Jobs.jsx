import { useEffect, useState, useCallback, useRef } from "react";
import { Search } from "lucide-react";
import { listJobs } from "../services/jobService";
import { getErrorMessage } from "../utils/getErrorMessage";
import JobCard from "../components/JobCard";
import Pagination from "../components/Pagination";

const JOB_TYPES = ["full-time", "part-time", "internship", "contract", "freelance"];

function useDebouncedValue(value, delayMs) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
}

export default function Jobs() {
  const [search, setSearch] = useState("");
  const [jobType, setJobType] = useState("");
  const [location, setLocation] = useState("");
  const [skill, setSkill] = useState("");
  const [page, setPage] = useState(1);

  const [jobs, setJobs] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const debouncedSearch = useDebouncedValue(search, 400);
  const debouncedLocation = useDebouncedValue(location, 400);
  const debouncedSkill = useDebouncedValue(skill, 400);
  const isFirstRun = useRef(true);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await listJobs({
        page,
        limit: 9,
        ...(debouncedSearch ? { search: debouncedSearch } : {}),
        ...(jobType ? { jobType } : {}),
        ...(debouncedLocation ? { location: debouncedLocation } : {}),
        ...(debouncedSkill ? { skill: debouncedSkill } : {}),
      });
      setJobs(data.jobs);
      setTotalPages(data.totalPages);
      setTotal(data.total);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, jobType, debouncedLocation, debouncedSkill]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }
    setPage(1);
  }, [debouncedSearch, jobType, debouncedLocation, debouncedSkill]);

  return (
    <section>
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Jobs &amp; Internships</h1>
          <p className="text-sm text-slate-500 mt-1">
            {loading ? "Loading..." : `${total} opportunit${total === 1 ? "y" : "ies"}`}
          </p>
        </div>

        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search title, company..."
            className="w-64 rounded-md border border-slate-300 pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-400"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <select
          value={jobType}
          onChange={(e) => setJobType(e.target.value)}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-slate-400"
        >
          <option value="">All types</option>
          {JOB_TYPES.map((t) => (
            <option key={t} value={t} className="capitalize">
              {t}
            </option>
          ))}
        </select>
        <input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Location"
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-slate-400 w-32"
        />
        <input
          value={skill}
          onChange={(e) => setSkill(e.target.value)}
          placeholder="Skill"
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-slate-400 w-32"
        />
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-48 bg-white border border-slate-200 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <p className="text-slate-500 text-center py-16">
          No jobs match these filters right now.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {jobs.map((j) => (
              <JobCard key={j._id} job={j} />
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}
    </section>
  );
}
