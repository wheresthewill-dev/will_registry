import { useRouter } from "next/navigation";
import {
  StepId,
  getNextStep,
  getPreviousStep,
} from "@/app/(auth)/register/components/steps";
import { useRegistrationStore } from "@/stores/formStore";
import { personalDetailsValidatorSchema } from "@/app/schemas/validation/registration-schema";

export const useRegistrationStep = () => {
  const router = useRouter();
  const { currentStep, subscriptionPlan, setCurrentStep, userProfile } =
    useRegistrationStore();

  // Check if current step is completed
  const isStepCompleted = (step: StepId): boolean => {
    switch (step) {
      case "subscription":
        return !!subscriptionPlan;
      case "profile":
        // Validate the userProfile object using the Zod schema
        const validationResult =
          personalDetailsValidatorSchema.safeParse(userProfile);
        return validationResult.success;
      case "payment":
        // Skip payment if bronze plan
        if (subscriptionPlan === "bronze") {
          return true;
        }
      case "confirmation":
        return true; // Confirmation step is always considered complete
      default:
        return false;
    }
  };

  // Navigate to next step
  const goToNextStep = () => {
    if (isStepCompleted(currentStep)) {
      const nextStep = getNextStep(currentStep, subscriptionPlan || undefined);
      if (nextStep) {
        setCurrentStep(nextStep);
      }
    }
  };

  // Navigate to previous step
  const goToPreviousStep = () => {
    const prevStep = getPreviousStep(
      currentStep,
      subscriptionPlan || undefined
    );
    if (prevStep) {
      setCurrentStep(prevStep);
    }
  };

  return {
    currentStep,
    goToNextStep,
    goToPreviousStep,
    isStepCompleted,
  };
};
