"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] flex flex-col">
      <header className="border-b border-[var(--border)] px-6 h-16 flex items-center">
        <Link
          href="/"
          className="font-extrabold text-xl text-[var(--primary)]"
          aria-label="BrandBlitz home"
        >
          BrandBlitz
        </Link>
      </header>

      <main
        role="main"
        className="flex flex-1 flex-col items-center justify-center px-6 py-20 text-center"
      >
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
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
            />
          </svg>
        </div>

        <h1 className="text-2xl font-bold mb-3">Something went wrong</h1>
        <p className="text-[var(--muted-foreground)] mb-8 max-w-sm">
          An unexpected error occurred. Our team has been notified and is looking
          into it.
        </p>

        <div className="flex flex-wrap gap-3 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center rounded-md bg-[var(--primary)] px-5 py-2.5 text-sm font-medium text-white hover:opacity-90 transition-opacity min-h-[44px]"
          >
            Try again
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-[var(--border)] bg-[var(--background)] px-5 py-2.5 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors min-h-[44px]"
          >
            Back to home
          </Link>
        </div>

        {error.digest && (
          <p className="mt-6 text-xs text-[var(--muted-foreground)]">
            Error ID: {error.digest}
          </p>
        )}
      </main>
    </div>
  );
}
