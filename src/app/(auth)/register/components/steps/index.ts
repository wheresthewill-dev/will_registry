// Export all step components
import { SubscriptionLevel } from "@/app/utils/repo_services/interfaces/user_subscription";
import Step1Subscription from "./Step1Subscription";
import Step2UserProfile from "./Step2UserProfile";
import Step3Payment from "./Step3Payment";
import Step4Confirmation from "./Step4Confirmation";

// Define step IDs for type safety
export type StepId = "profile" | "subscription" | "payment" | "confirmation";

// Define the default step order
export const STEP_ORDER: StepId[] = [
  "profile",
  "subscription",
  "payment",
  "confirmation",
];

// Map step IDs to their components
export const STEP_COMPONENTS = {
  profile: Step2UserProfile,
  subscription: Step1Subscription,
  payment: Step3Payment,
  confirmation: Step4Confirmation,
};

// Helper function to get the next step with conditional logic for payment step
export function getNextStep(
  currentStep: StepId,
  plan?: SubscriptionLevel
): StepId | undefined {
  const currentIndex = STEP_ORDER.indexOf(currentStep);

  // If the current step is subscription and the plan is bronze, skip payment and go to confirmation
  if (currentStep === "subscription" && plan === "bronze") {
    return "confirmation";
  }

  // Otherwise, return the next step in order
  return STEP_ORDER[currentIndex + 1];
}

// Helper function to get the previous step with conditional logic for payment step
export function getPreviousStep(
  currentStep: StepId,
  plan?: SubscriptionLevel
): StepId | undefined {
  const currentIndex = STEP_ORDER.indexOf(currentStep);

  // If the current step is confirmation and the plan is bronze, go back to subscription
  if (currentStep === "confirmation" && plan === "bronze") {
    return "subscription";
  }

  // Otherwise, return the previous step in order
  return currentIndex > 0 ? STEP_ORDER[currentIndex - 1] : undefined;
}
