export default function PageLoader() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-[60vh] w-full flex-col items-center justify-center p-6 text-center"
    >
      <div className="relative flex h-14 w-14 items-center justify-center">
        <div className="absolute h-full w-full animate-ping rounded-full bg-[#008dd2]/20 duration-1000" />
        <div className="h-10 w-10 animate-spin rounded-full border-3 border-slate-200 border-t-[#008dd2]" />
      </div>
      <p className="mt-4 text-xs font-bold uppercase tracking-wider text-slate-400">
        Loading...
      </p>
    </div>
  );
}
