import { z } from "zod";

export const loginValidationSchema = z.object({
  email: z
    .string()
    .min(1, "Please enter your email")
    .email("Please enter a valid email")
    .refine((val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), {
      message: "Please enter a valid email address",
    }),
  password: z.string().min(1, "Please enter your password"),
});

export type LoginFormValues = z.infer<typeof loginValidationSchema>;
