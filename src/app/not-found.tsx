import { ErrorPage } from "@/components/error-pages/ErrorPage";

export default function NotFound() {
  return (
    <ErrorPage
      title="Page not found"
      description="Sorry, we couldn't find the page you're looking for. The page might have been removed, had its name changed, or is temporarily unavailable."
      illustrationType="notFound"
    />
  );
}
