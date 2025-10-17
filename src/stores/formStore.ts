import { create } from "zustand";
import { persist } from "zustand/middleware";
import { PersonalDetailsFormType } from "@/app/schemas/validation/registration-schema";
import { StepId } from "@/app/(auth)/register/components/steps";
import { SubscriptionLevel } from "@/app/utils/repo_services/interfaces/user_subscription";

interface RegistrationState {
  currentStep: StepId;
  subscriptionPlan: SubscriptionLevel | null;
  userProfile: PersonalDetailsFormType;
  setCurrentStep: (step: StepId) => void;
  setSubscriptionPlan: (plan: SubscriptionLevel) => void;
  setUserProfile: (data: PersonalDetailsFormType) => void;
  updateUserProfileField: (
    field: keyof PersonalDetailsFormType,
    value: any
  ) => void;
  resetRegistration: () => void;
}

const initialUserProfile: PersonalDetailsFormType = {
  firstName: "",
  middleName: "",
  lastName: "",
  birthDate: "",
  birthTown: "",
  birthCountry: "",
  addressLine: "",
  addressCountry: "",
  addressState: "",
  addressTown: "",
  addressPostcode: "",
  homePhone: "",
  mobilePhone: "",
  workPhone: "",
  email: "",
  username: "",
  password: "",
  confirmPassword: "",
  privacyPolicy: "" as any,
  declaration: false,
};

const initialState = {
  currentStep: "profile" as StepId,
  subscriptionPlan: null,
  userProfile: initialUserProfile,
};

export const useRegistrationStore = create<RegistrationState>()(
  persist(
    (set, get) => ({
      ...initialState,
      setCurrentStep: (step: StepId) => set({ currentStep: step }),
      setSubscriptionPlan: (plan: SubscriptionLevel) =>
        set({ subscriptionPlan: plan }),
      setUserProfile: (data: PersonalDetailsFormType) =>
        set({ userProfile: { ...data } }),
      updateUserProfileField: (field, value) => {
        set({
          userProfile: {
            ...get().userProfile,
            [field]: value,
          },
        });
      },
      resetRegistration: () => set({ ...initialState }),
    }),
    { name: "registration-store" }
  )
);
