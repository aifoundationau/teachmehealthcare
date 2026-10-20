"use client";

import { useEffect } from "react";

/**
 * Shown in place of the page when something on it throws, instead of a blank
 * "Application error" screen. "Try again" re-renders the page without a reload.
 */
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Page error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#070b11] p-4 text-gray-200 font-sans">
      <div role="alert" className="w-full max-w-md rounded-xl border border-[#1b2636] bg-[#101722] p-6 text-center shadow-xl">
        <h1 className="text-base font-bold text-white">Something went wrong</h1>
        <p className="mt-2 text-xs leading-relaxed text-gray-400">
          Teach Me Healthcare hit an unexpected problem. Try again, or reload the page if it keeps happening.
        </p>
        <div className="mt-5 flex justify-center gap-2">
          <button
            type="button"
            onClick={reset}
            className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition-colors"
          >
            Try again
          </button>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-4 py-1.5 rounded-lg bg-[#182332] hover:bg-[#223145] text-gray-300 hover:text-white border border-[#223145] text-xs font-medium transition-colors"
          >
            Reload page
          </button>
        </div>
      </div>
    </div>
  );
}
