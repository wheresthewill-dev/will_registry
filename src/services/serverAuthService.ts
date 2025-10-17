/**
 * Server-side registration service
 * Calls the server-side registration API route and handles login
 */

import { supabase } from "@/app/utils/supabase/client";

// Registration form data interface
export interface RegistrationData {
  email: string;
  password: string;
  username: string;
  firstname: string;
  lastname: string;
  middlename?: string;
  contacts: {
    type: string;
    value: string;
  }[];
  birthInfo: {
    country: string;
    town: string;
    birthDate: string; // ISO date string
  };
  address: {
    type: string;
    address_line: string;
    country: string;
    post_code?: string;
    state?: string;
    town?: string;
  };
  // subscriptionPlan: string;
}

interface RegistrationResult {
  success: boolean;
  userId?: string;
  authUserId?: string;
  loginUrl?: string;
  error?: string;
  message?: string;
  skipAutoLogin?: boolean;
}

// Register user with option to skip auto-login
export async function registerUserServerSide(
  data: RegistrationData,
  options?: { skipAutoLogin?: boolean }
): Promise<RegistrationResult> {
  try {
    console.log("🔄 Client: Starting server-side registration...");
    console.log("Skip auto-login:", options?.skipAutoLogin);

    // Call the server-side registration API
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("❌ Server-side registration failed:", result.error);
      return {
        success: false,
        error: result.error || "Registration failed",
      };
    }

    if (!result.success) {
      console.error("❌ Registration not successful:", result.error);
      return {
        success: false,
        error: result.error || "Registration failed",
      };
    }

    console.log("✅ Server-side registration completed successfully");
    console.log("📋 User ID:", result.userId);

    // If skipAutoLogin is true, return successful registration without login
    if (options?.skipAutoLogin) {
      console.log("🔐 Auto-login skipped as requested");
      return {
        success: true,
        userId: result.userId,
        authUserId: result.authUserId,
        message: "Registration successful, login skipped",
        skipAutoLogin: true,
      };
    }

    // Now log in the user using the credentials
    console.log("🔐 Logging in the newly registered user...");
    const { data: authData, error: loginError } =
      await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

    if (loginError) {
      console.error("❌ Auto-login failed after registration:", loginError);
      return {
        success: true, // Registration was successful
        userId: result.userId,
        authUserId: result.authUserId,
        error: `Registration successful but auto-login failed: ${loginError.message}`,
        message: "Registration completed. Please log in manually.",
      };
    }

    if (!authData.user) {
      console.error("❌ No user data returned from login");
      return {
        success: true, // Registration was successful
        userId: result.userId,
        authUserId: result.authUserId,
        error:
          "Registration successful but auto-login failed: No user data returned",
        message: "Registration completed. Please log in manually.",
      };
    }

    console.log("✅ User logged in successfully after registration");
    console.log("🎉 Registration and auto-login completed!");

    return {
      success: true,
      userId: result.userId,
      authUserId: result.authUserId,
      message: "Registration and login successful",
    };
  } catch (error) {
    console.error("❌ Client-side registration error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Unknown registration error",
    };
  }
}

/**
 * Complete the registration by logging in after payment is complete
 */
export async function completeRegistrationLogin(
  email: string,
  password: string
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log("🔄 Completing registration by logging in user...");
    const { data: authData, error: loginError } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (loginError) {
      console.error("❌ Login failed after payment:", loginError);
      return {
        success: false,
        error: loginError.message,
      };
    }

    if (!authData.user) {
      return {
        success: false,
        error: "No user data returned from login",
      };
    }

    console.log("✅ User logged in successfully after payment");
    return { success: true };
  } catch (error) {
    console.error("❌ Login error after payment:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown login error",
    };
  }
}

/**
 * Legacy client-side registration function (kept for backward compatibility)
 * @deprecated Use registerUserServerSide instead
 */
export async function registerUser(data: RegistrationData) {
  console.warn(
    "⚠️ Using deprecated client-side registration. Consider using registerUserServerSide instead."
  );

  try {
    // 1. Register the user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
    });

    if (authError || !authData.user) {
      throw new Error(
        `Authentication error: ${authError?.message || "Failed to create user"}`
      );
    }

    // Note: The rest of the client-side logic would go here
    // but it's not recommended due to security concerns

    return { success: true, userId: authData.user.id };
  } catch (error) {
    console.error("Registration error:", error);
    throw error;
  }
}

/**
 * Validates user registration data on the server before proceeding with registration
 * This allows us to check for duplicate emails, usernames, etc.
 */
export async function validateUserData(
  data: RegistrationData
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch("/api/auth/validate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();
    return result;
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to validate user data",
    };
  }
}
