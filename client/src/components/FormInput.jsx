export default function FormInput({ label, error, type = "text", registration, ...props }) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-slate-700 mb-1">
        {label}
      </label>
      <input
        type={type}
        className={`w-full rounded-md border px-3 py-2 text-sm outline-none transition-colors focus:ring-2 focus:ring-slate-400 ${
          error ? "border-red-400" : "border-slate-300"
        }`}
        {...registration}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-600">{error.message}</p>}
    </div>
  );
}
