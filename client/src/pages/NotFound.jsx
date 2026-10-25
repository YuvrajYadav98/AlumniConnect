import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <section className="text-center py-24">
      <h1 className="text-3xl font-bold text-slate-800 mb-2">404</h1>
      <p className="text-slate-600 mb-6">Page not found.</p>
      <Link to="/" className="text-blue-600 hover:underline">
        Go back home
      </Link>
    </section>
  );
}
