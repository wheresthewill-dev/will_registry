"use client";

import { ErrorPage } from "@/components/error-pages/ErrorPage";
import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <ErrorPage
      title="Something went wrong"
      description="An unexpected error occurred. Our team has been notified and is working to fix the issue."
      illustrationType="serverError"
      actionText="Try again"
      actionHref="#"
      secondaryActionText="Go to Home"
      secondaryActionHref="/"
    >
      <button
        onClick={reset}
        className="mt-4 text-sm text-indigo-600 hover:text-indigo-500"
      >
        Click here to retry
      </button>
    </ErrorPage>
  );
}
