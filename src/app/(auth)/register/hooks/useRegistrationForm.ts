import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  PersonalDetailsFormType,
  personalDetailsValidatorSchema,
} from "@/app/schemas/validation/registration-schema";
import { useRegistrationStore } from "@/stores/formStore";

export const usePersonalDetailsForm = () => {
  // Accessing the personal details data from the form store.
  const personalDetailsValues = useRegistrationStore(
    (state) => state.userProfile
  );

  // Returning the useForm hook with the Zod resolver and default values from the store.
  return useForm<PersonalDetailsFormType>({
    resolver: zodResolver(personalDetailsValidatorSchema),
    defaultValues: personalDetailsValues,
    mode: "onChange", // Validation mode
  });
};
