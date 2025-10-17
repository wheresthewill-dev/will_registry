import { ErrorPage } from "@/components/error-pages/ErrorPage";

export default function Unauthorized() {
  return (
    <ErrorPage
      title="Access Denied"
      description="You don't have permission to access this page. Please sign in with an authorised account or contact your administrator."
      illustrationType="unauthorized"
      actionText="Sign In"
      actionHref="/login"
      secondaryActionText="Go to Home"
      secondaryActionHref="/"
    />
  );
}
