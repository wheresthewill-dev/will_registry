import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ErrorPage } from "./ErrorPage";

const ERROR_PAGES = [
  {
    id: "404",
    title: "Page not found",
    description:
      "Sorry, we couldn't find the page you're looking for. The page might have been removed, had its name changed, or is temporarily unavailable.",
    illustrationType: "notFound" as const,
    actionText: "Go to Home",
    actionHref: "/",
  },
  {
    id: "500",
    title: "Something went wrong",
    description:
      "An unexpected error occurred. Our team has been notified and is working to fix the issue.",
    illustrationType: "serverError" as const,
    actionText: "Try again",
    actionHref: "#",
    secondaryActionText: "Go to Home",
    secondaryActionHref: "/",
  },
  {
    id: "expired",
    title: "Link Expired",
    description:
      "The link you followed has expired or is no longer valid. Please request a new link or contact support if you need assistance.",
    illustrationType: "expired" as const,
    actionText: "Go to Home",
    secondaryActionText: "Contact Support",
    secondaryActionHref: "/contact",
  },
  {
    id: "unauthorized",
    title: "Access Denied",
    description:
      "You don't have permission to access this page. Please sign in with an authorised account or contact your administrator.",
    illustrationType: "unauthorized" as const,
    actionText: "Sign In",
    actionHref: "/login",
    secondaryActionText: "Go to Home",
    secondaryActionHref: "/",
  },
];

export default function ErrorPagesDebug() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
        <h1 className="text-2xl font-bold mb-2">Error Pages Debug Mode</h1>
        <p>
          This page displays all error pages for debugging and design purposes.
        </p>
      </div>

      <Tabs defaultValue="404">
        <TabsList className="mb-6">
          {ERROR_PAGES.map((page) => (
            <TabsTrigger key={page.id} value={page.id}>
              {page.id} - {page.title}
            </TabsTrigger>
          ))}
        </TabsList>

        {ERROR_PAGES.map((page) => (
          <TabsContent key={page.id} value={page.id} className="border-0 p-0">
            <ErrorPage {...page} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
