"use client";

export default function CustomerError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="p-8 text-center">
      <h2 className="text-lg font-bold text-slate-900">Something went wrong</h2>
      <p className="mt-2 text-sm text-slate-500">{error.message}</p>
      <button
        onClick={reset}
        className="mt-4 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
      >
        Try again
      </button>
    </div>
  );
}
