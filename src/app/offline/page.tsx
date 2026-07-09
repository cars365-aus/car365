"use client";

import { WifiOff } from "lucide-react";

/**
 * Offline fallback page displayed when network requests fail
 * and the service worker serves this page instead.
 *
 * @validates Requirements 10.3
 */
export default function OfflineFallback() {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center px-4 text-center">
      <div className="flex flex-col items-center gap-6 max-w-sm">
        {/* Offline icon */}
        <div className="flex items-center justify-center w-20 h-20 rounded-full bg-orange-100">
          <WifiOff className="h-10 w-10 text-orange-600" aria-hidden="true" />
        </div>

        {/* Heading */}
        <h1 className="text-2xl font-bold text-gray-900">
          You&apos;re offline
        </h1>

        {/* Message */}
        <p className="text-gray-600 text-base leading-relaxed">
          It looks like you&apos;ve lost your internet connection. Please check your
          connection and try again.
        </p>

        {/* Retry button */}
        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center justify-center rounded-lg bg-orange-600 px-6 py-3 text-base font-medium text-white hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors min-h-[44px]"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
