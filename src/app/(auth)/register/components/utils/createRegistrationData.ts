import { PersonalDetailsFormType } from "@/app/schemas/validation/registration-schema";
import { SubscriptionLevel } from "@/app/utils/repo_services/interfaces/user_subscription";
import { RegistrationData } from "@/services/serverAuthService";

/**
 * Creates a standardized RegistrationData object from user profile data.
 * This function can be reused for both validation and registration.
 */
export function createRegistrationData(
  userProfile: PersonalDetailsFormType
  // subscriptionPlan: SubscriptionLevel | null = null
): RegistrationData {
  return {
    firstname: userProfile.firstName,
    lastname: userProfile.lastName,
    email: userProfile.email,
    contacts: [
      { type: "email", value: userProfile.email },
      { type: "mobilePhone", value: userProfile.mobilePhone || "" },
      ...(userProfile.homePhone
        ? [{ type: "homePhone", value: userProfile.homePhone }]
        : []),
      ...(userProfile.workPhone
        ? [{ type: "workPhone", value: userProfile.workPhone }]
        : []),
    ],
    birthInfo: {
      birthDate: userProfile.birthDate,
      town: userProfile.birthTown,
      country: userProfile.birthCountry,
    },
    address: {
      type: "current",
      address_line: userProfile.addressLine || "",
      country: userProfile.addressCountry || "",
      post_code: userProfile.addressPostcode || "",
      state: userProfile.addressState || "",
      town: userProfile.addressTown || "",
    },
    username: userProfile.username,
    password: userProfile.password,
    // subscriptionPlan: subscriptionPlan || "",
  };
}
