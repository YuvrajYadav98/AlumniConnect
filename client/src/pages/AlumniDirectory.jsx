import { useEffect, useState, useCallback, useRef } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { searchAlumniDirectory } from "../services/alumniService";
import { getErrorMessage } from "../utils/getErrorMessage";
import AlumniCard from "../components/AlumniCard";
import Pagination from "../components/Pagination";

const SORT_OPTIONS = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "name_asc", label: "Name (A–Z)" },
  { value: "name_desc", label: "Name (Z–A)" },
  { value: "batch_asc", label: "Batch (oldest first)" },
  { value: "batch_desc", label: "Batch (newest first)" },
  { value: "company_asc", label: "Company (A–Z)" },
  { value: "company_desc", label: "Company (Z–A)" },
];

const EMPTY_FILTERS = {
  name: "",
  company: "",
  jobTitle: "",
  batch: "",
  branch: "",
  city: "",
  industry: "",
  skills: "",
};

// Debounce helper so every keystroke doesn't fire a request - only once
// typing pauses for a moment. Keeps the number of directory queries
// (already an optimized single aggregation) as low as possible client-side too.
function useDebouncedValue(value, delayMs) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
}

export default function AlumniDirectory() {
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [sort, setSort] = useState("newest");
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);

  const [profiles, setProfiles] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const debouncedSearch = useDebouncedValue(search, 400);
  const debouncedFilters = useDebouncedValue(filters, 400);
  const isFirstRun = useRef(true);

  const activeFilterCount = Object.values(debouncedFilters).filter(Boolean).length;

  const fetchProfiles = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = {
        page,
        limit: 12,
        sort,
        ...(debouncedSearch ? { search: debouncedSearch } : {}),
        ...Object.fromEntries(
          Object.entries(debouncedFilters).filter(([, v]) => v)
        ),
      };
      const data = await searchAlumniDirectory(params);
      setProfiles(data.profiles);
      setTotalPages(data.totalPages);
      setTotal(data.total);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [page, sort, debouncedSearch, debouncedFilters]);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  // Any change to search/filters/sort should reset back to page 1 -
  // otherwise a person filtering down to a small result set could land
  // on a now-nonexistent page.
  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }
    setPage(1);
  }, [debouncedSearch, debouncedFilters, sort]);

  const updateFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters(EMPTY_FILTERS);
    setSearch("");
  };

  return (
    <section>
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Alumni Directory</h1>
          <p className="text-sm text-slate-500 mt-1">
            {loading ? "Searching..." : `${total} verified alumni found`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, company, or title..."
              className="w-64 rounded-md border border-slate-300 pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-400"
            />
          </div>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-400"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <button
            onClick={() => setShowFilters((v) => !v)}
            className={`flex items-center gap-1.5 rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
              showFilters || activeFilterCount > 0
                ? "bg-slate-800 text-white border-slate-800"
                : "bg-white text-slate-600 border-slate-300 hover:bg-slate-50"
            }`}
          >
            <SlidersHorizontal size={14} />
            Filters
            {activeFilterCount > 0 && (
              <span className="bg-white/20 rounded-full px-1.5 text-xs">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="bg-white border border-slate-200 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <FilterInput
              label="Batch"
              value={filters.batch}
              onChange={(v) => updateFilter("batch", v)}
              placeholder="2016-2020"
            />
            <FilterInput
              label="Branch"
              value={filters.branch}
              onChange={(v) => updateFilter("branch", v)}
              placeholder="CSE"
            />
            <FilterInput
              label="City"
              value={filters.city}
              onChange={(v) => updateFilter("city", v)}
              placeholder="New York"
            />
            <FilterInput
              label="Industry"
              value={filters.industry}
              onChange={(v) => updateFilter("industry", v)}
              placeholder="Tech"
            />
            <FilterInput
              label="Company"
              value={filters.company}
              onChange={(v) => updateFilter("company", v)}
              placeholder="Google"
            />
            <FilterInput
              label="Job Title"
              value={filters.jobTitle}
              onChange={(v) => updateFilter("jobTitle", v)}
              placeholder="Engineer"
            />
            <FilterInput
              label="Skills (comma sep.)"
              value={filters.skills}
              onChange={(v) => updateFilter("skills", v)}
              placeholder="React, Go"
              className="col-span-2"
            />
          </div>

          {activeFilterCount > 0 && (
            <button
              onClick={clearFilters}
              className="mt-3 flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800"
            >
              <X size={12} /> Clear all filters
            </button>
          )}
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-44 bg-white border border-slate-200 rounded-xl animate-pulse"
            />
          ))}
        </div>
      ) : profiles.length === 0 ? (
        <p className="text-slate-500 text-center py-16">
          No alumni match these filters. Try broadening your search.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {profiles.map((p) => (
              <AlumniCard key={p._id} profile={p} />
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}
    </section>
  );
}

function FilterInput({ label, value, onChange, placeholder, className = "" }) {
  return (
    <div className={className}>
      <label className="block text-xs font-medium text-slate-500 mb-1">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-sm outline-none focus:ring-2 focus:ring-slate-400"
      />
    </div>
  );
}
