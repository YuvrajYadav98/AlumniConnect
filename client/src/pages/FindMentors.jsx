import { useEffect, useState, useCallback, useRef } from "react";
import { Search } from "lucide-react";
import { searchMentors } from "../services/mentorService";
import { getErrorMessage } from "../utils/getErrorMessage";
import { MENTORSHIP_CATEGORIES } from "../utils/mentorshipCategories";
import MentorCard from "../components/MentorCard";
import MentorshipRequestModal from "../components/MentorshipRequestModal";
import Pagination from "../components/Pagination";

function useDebouncedValue(value, delayMs) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
}

export default function FindMentors() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);

  const [mentors, setMentors] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [requestingMentor, setRequestingMentor] = useState(null);
  const [successMsg, setSuccessMsg] = useState("");

  const debouncedSearch = useDebouncedValue(search, 400);
  const isFirstRun = useRef(true);

  const fetchMentors = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await searchMentors({
        page,
        limit: 9,
        ...(debouncedSearch ? { search: debouncedSearch } : {}),
        ...(category ? { category } : {}),
      });
      setMentors(data.mentors);
      setTotalPages(data.totalPages);
      setTotal(data.total);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, category]);

  useEffect(() => {
    fetchMentors();
  }, [fetchMentors]);

  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }
    setPage(1);
  }, [debouncedSearch, category]);

  const handleRequestSuccess = () => {
    setRequestingMentor(null);
    setSuccessMsg("Mentorship request sent!");
    setTimeout(() => setSuccessMsg(""), 4000);
  };

  return (
    <section>
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Find a Mentor</h1>
          <p className="text-sm text-slate-500 mt-1">
            {loading ? "Searching..." : `${total} verified mentor${total === 1 ? "" : "s"} available`}
          </p>
        </div>

        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, company, or title..."
            className="w-64 rounded-md border border-slate-300 pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-400"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <CategoryChip
          label="All categories"
          active={category === ""}
          onClick={() => setCategory("")}
        />
        {MENTORSHIP_CATEGORIES.map((cat) => (
          <CategoryChip
            key={cat}
            label={cat}
            active={category === cat}
            onClick={() => setCategory(cat)}
          />
        ))}
      </div>

      {successMsg && (
        <div className="mb-4 rounded-md bg-green-50 border border-green-200 px-3 py-2 text-sm text-green-700">
          {successMsg}
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
            <div key={i} className="h-56 bg-white border border-slate-200 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : mentors.length === 0 ? (
        <p className="text-slate-500 text-center py-16">
          No mentors match this search yet. Try a different category.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {mentors.map((m) => (
              <MentorCard key={m._id} mentor={m} onRequestClick={setRequestingMentor} />
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}

      {requestingMentor && (
        <MentorshipRequestModal
          mentor={requestingMentor}
          onClose={() => setRequestingMentor(null)}
          onSuccess={handleRequestSuccess}
        />
      )}
    </section>
  );
}

function CategoryChip({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
        active
          ? "bg-slate-800 text-white border-slate-800"
          : "bg-white text-slate-600 border-slate-300 hover:bg-slate-50"
      }`}
    >
      {label}
    </button>
  );
}
