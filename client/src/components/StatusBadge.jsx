const STYLES = {
  pending: "bg-amber-50 text-amber-700 ring-amber-200",
  approved: "bg-green-50 text-green-700 ring-green-200",
  accepted: "bg-green-50 text-green-700 ring-green-200",
  completed: "bg-blue-50 text-blue-700 ring-blue-200",
  rejected: "bg-red-50 text-red-700 ring-red-200",
};

export default function StatusBadge({ status }) {
  const style = STYLES[status] || STYLES.pending;
  return (
    <span
      className={`inline-flex items-center text-xs font-medium rounded-full px-2.5 py-0.5 ring-1 capitalize ${style}`}
    >
      {status}
    </span>
  );
}
