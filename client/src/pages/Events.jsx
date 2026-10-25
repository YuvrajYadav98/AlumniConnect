import { useEffect, useState, useCallback, useRef } from "react";
import { Search } from "lucide-react";
import { listEvents } from "../services/eventService";
import { getErrorMessage } from "../utils/getErrorMessage";
import EventCard from "../components/EventCard";
import Pagination from "../components/Pagination";

function useDebouncedValue(value, delayMs) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
}

export default function Events() {
  const [search, setSearch] = useState("");
  const [when, setWhen] = useState("upcoming");
  const [page, setPage] = useState(1);

  const [events, setEvents] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const debouncedSearch = useDebouncedValue(search, 400);
  const isFirstRun = useRef(true);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await listEvents({
        page,
        limit: 9,
        when,
        ...(debouncedSearch ? { search: debouncedSearch } : {}),
      });
      setEvents(data.events);
      setTotalPages(data.totalPages);
      setTotal(data.total);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [page, when, debouncedSearch]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }
    setPage(1);
  }, [debouncedSearch, when]);

  return (
    <section>
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Events</h1>
          <p className="text-sm text-slate-500 mt-1">
            {loading ? "Loading..." : `${total} event${total === 1 ? "" : "s"}`}
          </p>
        </div>

        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search events..."
            className="w-64 rounded-md border border-slate-300 pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-400"
          />
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        {["upcoming", "past"].map((w) => (
          <button
            key={w}
            onClick={() => setWhen(w)}
            className={`text-sm px-4 py-1.5 rounded-full border capitalize transition-colors ${
              when === w
                ? "bg-slate-800 text-white border-slate-800"
                : "bg-white text-slate-600 border-slate-300 hover:bg-slate-50"
            }`}
          >
            {w}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-64 bg-white border border-slate-200 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <p className="text-slate-500 text-center py-16">No {when} events found.</p>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {events.map((e) => (
              <EventCard key={e._id} event={e} />
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}
    </section>
  );
}
