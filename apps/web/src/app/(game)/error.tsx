"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import Link from "next/link";

export default function GameError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error, { tags: { boundary: "game" } });
  }, [error]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-20 text-center">
      <div className="rounded-full bg-[var(--destructive)]/10 p-4 mb-6">
        <svg
          className="h-10 w-10 text-[var(--destructive)]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M14.25 9.75 16.5 12l-2.25 2.25m-4.5 0L7.5 12l2.25-2.25M6 20.25h12A2.25 2.25 0 0 0 20.25 18V6A2.25 2.25 0 0 0 18 3.75H6A2.25 2.25 0 0 0 3.75 6v12A2.25 2.25 0 0 0 6 20.25Z"
          />
        </svg>
      </div>

      <h1 className="text-2xl font-bold mb-3">Your game session hit a snag</h1>
      <p className="text-[var(--muted-foreground)] mb-8 max-w-sm">
        Something went wrong during the challenge. Don&apos;t worry — your
        previous progress has been saved.
      </p>

      <div className="flex flex-wrap gap-3 justify-center">
        <button
          onClick={reset}
          className="inline-flex items-center justify-center rounded-md bg-[var(--primary)] px-5 py-2.5 text-sm font-medium text-white hover:opacity-90 transition-opacity min-h-[44px]"
        >
          Retry challenge
        </button>
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-md border border-[var(--border)] bg-[var(--background)] px-5 py-2.5 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors min-h-[44px]"
        >
          Browse challenges
        </Link>
      </div>

      {error.digest && (
        <p className="mt-6 text-xs text-[var(--muted-foreground)]">
          Error ID: {error.digest}
        </p>
      )}
    </div>
  );
}
