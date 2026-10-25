export default function DateRangeFilter({ from, to, onFromChange, onToChange, onClear }) {
  const hasFilter = !!(from || to);

  return (
    <div className="flex items-center gap-2 text-sm">
      <label className="text-slate-500">From</label>
      <input
        type="date"
        value={from || ""}
        onChange={(e) => onFromChange(e.target.value)}
        className="rounded-md border border-slate-300 px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-slate-400"
      />
      <label className="text-slate-500">To</label>
      <input
        type="date"
        value={to || ""}
        onChange={(e) => onToChange(e.target.value)}
        className="rounded-md border border-slate-300 px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-slate-400"
      />
      {hasFilter && (
        <button onClick={onClear} className="text-xs text-slate-400 hover:text-slate-700">
          Clear
        </button>
      )}
    </div>
  );
}
