import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  const goTo = (p) => {
    if (p < 1 || p > totalPages || p === page) return;
    onPageChange(p);
  };

  // Show a compact window of page numbers around the current page,
  // rather than every page (which gets unwieldy for large result sets).
  const windowSize = 1;
  const pages = [];
  for (let p = Math.max(1, page - windowSize); p <= Math.min(totalPages, page + windowSize); p++) {
    pages.push(p);
  }

  return (
    <nav className="flex items-center justify-center gap-1 mt-8" aria-label="Pagination">
      <button
        onClick={() => goTo(page - 1)}
        disabled={page === 1}
        className="p-2 rounded-md border border-slate-300 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
        aria-label="Previous page"
      >
        <ChevronLeft size={16} />
      </button>

      {pages[0] > 1 && (
        <>
          <PageButton p={1} active={page === 1} onClick={goTo} />
          {pages[0] > 2 && <span className="px-1 text-slate-400">…</span>}
        </>
      )}

      {pages.map((p) => (
        <PageButton key={p} p={p} active={p === page} onClick={goTo} />
      ))}

      {pages[pages.length - 1] < totalPages && (
        <>
          {pages[pages.length - 1] < totalPages - 1 && (
            <span className="px-1 text-slate-400">…</span>
          )}
          <PageButton p={totalPages} active={page === totalPages} onClick={goTo} />
        </>
      )}

      <button
        onClick={() => goTo(page + 1)}
        disabled={page === totalPages}
        className="p-2 rounded-md border border-slate-300 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
        aria-label="Next page"
      >
        <ChevronRight size={16} />
      </button>
    </nav>
  );
}

function PageButton({ p, active, onClick }) {
  return (
    <button
      onClick={() => onClick(p)}
      className={`min-w-[2.25rem] h-9 px-2 text-sm rounded-md border transition-colors ${
        active
          ? "bg-slate-800 text-white border-slate-800"
          : "bg-white text-slate-600 border-slate-300 hover:bg-slate-50"
      }`}
    >
      {p}
    </button>
  );
}
