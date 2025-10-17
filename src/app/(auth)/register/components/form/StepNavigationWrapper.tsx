import { Suspense } from "react";
import StepNavigation from "./StepNavigationProps";

// Loading fallback component for Suspense
function NavigationFallback() {
  return (
    <div className="flex justify-between mb-3">
      <div className="h-10 w-24 bg-gray-200 animate-pulse rounded"></div>
      <div className="h-10 w-32 bg-blue-200 animate-pulse rounded"></div>
    </div>
  );
}

interface StepNavigationWrapperProps {
  form?: any;
}

export default function StepNavigationWrapper({ form }: StepNavigationWrapperProps) {
  return (
    <Suspense fallback={<NavigationFallback />}>
      <StepNavigation form={form} />
    </Suspense>
  );
}
