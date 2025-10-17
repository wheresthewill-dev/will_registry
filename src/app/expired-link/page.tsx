import { ErrorPage } from "@/components/error-pages/ErrorPage";

export default function ExpiredLink() {
  return (
    <ErrorPage
      title="Link Expired"
      description="The link you followed has expired or is no longer valid. Please request a new link or contact support if you need assistance."
      illustrationType="expired"
      actionText="Go to Home"
      secondaryActionText="Contact Support"
      secondaryActionHref="/contact"
    />
  );
}
