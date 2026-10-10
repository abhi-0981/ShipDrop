import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-white via-slate-50 to-[#f6f8fb] px-4 py-16 text-center">
      <div className="mx-auto w-full max-w-lg rounded-3xl border border-slate-200/80 bg-white p-8 shadow-[0_12px_40px_rgba(15,23,42,0.06)] sm:p-10">
        <Link to="/" className="inline-block text-3xl font-extrabold tracking-tight text-[#008dd2]">
          Parcel<span className="text-slate-900">Drop</span>
        </Link>

        <div className="mt-6 flex justify-center">
          <span className="rounded-2xl bg-sky-50 px-4 py-2 text-4xl font-black text-[#008dd2] sm:text-5xl">
            404
          </span>
        </div>

        <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-800 sm:text-3xl">
          Page Not Found
        </h1>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            to="/"
            className="flex h-11 items-center justify-center rounded-xl bg-[#008dd2] px-6 text-sm font-bold text-white shadow-sm transition hover:bg-[#007fbd] hover:shadow-md"
          >
            Back to Home
          </Link>

          <Link
            to="/dashboard"
            className="flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-6 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
