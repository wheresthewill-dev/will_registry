import { z } from "zod";

// Step 2 – Personal and Login Details
export const personalDetailsValidatorSchema = z
  .object({
    firstName: z.string().min(1, "Please enter your first name"),
    middleName: z.string().optional(),
    lastName: z.string().min(1, "Please enter your last name"),
    birthDate: z
      .string({
        required_error: "Please enter your date of birth",
      })
      .refine((val) => !isNaN(Date.parse(val)), {
        message: "Please enter your date of birth",
      })
      .refine((val) => {
        const date = new Date(val);
        return date <= new Date();
      }, {
        message: "Birthdate cannot be in the future",
      })
      .refine((val) => {
        const date = new Date(val);
        const today = new Date();
        let age = today.getFullYear() - date.getFullYear();
        const m = today.getMonth() - date.getMonth();
        const d = today.getDate() - date.getDate();
        if (m < 0 || (m === 0 && d < 0)) age--;
        return age >= 18;
      }, {
        message: "You must be at least 18 years old",
      }),
    birthTown: z.string().min(1, "Please enter your suburb or town of birth"),
    birthCountry: z.string().min(1, "Please select your country of birth"),
    addressLine: z.string().optional(),
    addressState: z.string().optional(),
    addressTown: z.string().optional(),
    addressPostcode: z.string().optional(),
    addressCountry: z.string().optional(),
    homePhone: z.string().optional(),
    mobilePhone: z.string().optional(),
    workPhone: z.string().optional(),
    email: z.string().email("Enter a valid email address."),
    username: z
      .string()
      .nonempty("Please enter a username.")
      .min(6, "Username must be at least 6 characters long.")
      .max(20, "Username must not exceed 20 characters.")
      .regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, "Username must start with a letter and can only contain letters, numbers, and underscores."),
    password: z
      .string()
      .min(6, "Password must be at least 6 characters.")
      .regex(/[A-Z]/, "Include at least one capital letter (A-Z).")
      .regex(
        /[@$!%*?&#]/,
        "Include at least one special character (e.g., @, #, &)."
      ),
    confirmPassword: z.string().min(6, "Please confirm your password."),
    privacyPolicy: z.boolean({
      required_error: "You must agree to the privacy policy.",
      /// TODO: Investigate the type mismatch error
      invalid_type_error: "You must agree to the privacy policy"
    }),
    declaration: z
      .boolean()
      .refine((val) => val === true, {
        message: "You must agree to the declaration.",
      }),
  })
  .refine((data) => data.homePhone || data.mobilePhone || data.workPhone, {
    message: "Add at least one phone number so we can contact you if needed.",
    path: ["homePhone"],
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

// Exported types for form validation schemas
export type PersonalDetailsFormType = z.infer<typeof personalDetailsValidatorSchema>;