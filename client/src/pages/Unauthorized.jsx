import { Link } from "react-router-dom";

export default function Unauthorized() {
  return (
    <section className="text-center py-24">
      <h1 className="text-3xl font-bold text-slate-800 mb-2">403</h1>
      <p className="text-slate-600 mb-6">
        You don't have permission to access this page.
      </p>
      <Link to="/" className="text-blue-600 hover:underline">
        Go back home
      </Link>
    </section>
  );
}
