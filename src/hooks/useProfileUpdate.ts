import { useState, useEffect } from "react";
import { supabase } from "@/app/utils/supabase/client";
import { useAccountSettingsContext } from "@/contexts/AccountSettingsContext";

type ProfileField = "email" | "password" | "username";

interface UseProfileUpdateProps {
  onSuccess?: (field: ProfileField) => void;
  onError?: (field: ProfileField, error: string) => void;
  userId?: string;
}

export function useProfileUpdate({
  onSuccess,
  onError,
  userId: providedUserId,
}: UseProfileUpdateProps = {}) {
  const [isUpdating, setIsUpdating] = useState<ProfileField | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(providedUserId || null);

  // Get context functions
  const accountSettings = useAccountSettingsContext();

  // Fetch user ID if not provided
  useEffect(() => {
    if (!userId) {
      const fetchUserId = async () => {
        console.log("🔍 Fetching current user ID from session...");
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session?.user?.id) {
          console.log("✅ User ID found:", session.user.id);
          setUserId(session.user.id);
        } else {
          console.error("❌ No user ID found in session");
          setError("Not authenticated");
          onError?.("email", "Not authenticated");
        }
      };

      fetchUserId();
    }
  }, [userId, onError]);

  async function updateProfile(field: ProfileField, value: string) {
    if (!value.trim()) {
      setError(`${field} cannot be empty`);
      onError?.(field, `${field} cannot be empty`);
      return false;
    }

    setIsUpdating(field);
    setError(null);

    try {
      const response = await fetch("/api/users/update-profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ field, value }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || `Failed to update ${field}`);
        onError?.(field, result.error || `Failed to update ${field}`);
        return false;
      }

      onSuccess?.(field);
      return true;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "An unexpected error occurred";
      setError(errorMessage);
      onError?.(field, errorMessage);
      return false;
    } finally {
      setIsUpdating(null);
    }
  }

  /**
   * Update email address
   * This will trigger a verification email to the new address
   */
  const updateEmail = async (email: string, currentPassword: string) => {
    console.log("📧 Attempting to update email address to:", email);

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.error("❌ Email validation failed:", email);
      setError("Please enter a valid email address");
      onError?.("email", "Please enter a valid email address");
      return false;
    }

    if (!currentPassword) {
      console.error("❌ Current password not provided for email update");
      setError("Current password is required");
      onError?.("email", "Current password is required");
      return false;
    }

    console.log("✅ Email validation passed, proceeding with update request");
    setIsUpdating("email");
    setError(null);

    try {
      if (!userId) {
        console.error("❌ No user ID available for email update");
        throw new Error("Not authenticated");
      }

      console.log("🔄 Sending email update request to API...");
      const response = await fetch("/api/users/update-profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          field: "email",
          value: email,
          currentPassword,
          userId,
        }),
      });

      const result = await response.json();
      console.log("📥 API response received:", {
        status: response.status,
        ok: response.ok,
      });

      if (!response.ok) {
        console.error(
          "❌ Email update failed:",
          result.error || "Unknown error"
        );
        setError(result.error || "Failed to update email");
        onError?.("email", result.error || "Failed to update email");
        return false;
      }

      console.log("✅ Email update successful");

      // Refresh user data after successful update
      try {
        await accountSettings.refreshCurrentUser();
        console.log("✅ User data refreshed after email update");
      } catch (refreshError) {
        console.warn("⚠️ Could not refresh user data:", refreshError);
      }

      onSuccess?.("email");
      return true;
    } catch (error) {
      console.error("💥 Exception during email update:", error);
      const errorMessage =
        error instanceof Error ? error.message : "An unexpected error occurred";
      setError(errorMessage);
      onError?.("email", errorMessage);
      return false;
    } finally {
      setIsUpdating(null);
      console.log("🏁 Email update operation completed");
    }
  };

  /**
   * Update password
   */
  const updatePassword = async (
    newPassword: string,
    currentPassword: string
  ) => {
    console.log("🔐 Attempting to update password");

    // Basic password validation
    if (newPassword.length < 8) {
      console.error("❌ Password validation failed: too short");
      setError("Password must be at least 8 characters long");
      onError?.("password", "Password must be at least 8 characters long");
      return false;
    }

    if (!currentPassword) {
      console.error("❌ Current password not provided for password update");
      setError("Current password is required");
      onError?.("password", "Current password is required");
      return false;
    }

    console.log(
      "✅ Password validation passed, proceeding with update request"
    );
    setIsUpdating("password");
    setError(null);

    try {
      if (!userId) {
        console.error("❌ No user ID available for password update");
        throw new Error("Not authenticated");
      }

      console.log("🔄 Sending password update request to API...");
      const response = await fetch("/api/users/update-profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          field: "password",
          value: newPassword,
          currentPassword,
          userId,
        }),
      });

      const result = await response.json();
      console.log("📥 API response received:", {
        status: response.status,
        ok: response.ok,
      });

      if (!response.ok) {
        console.error(
          "❌ Password update failed:",
          result.error || "Unknown error"
        );
        setError(result.error || "Failed to update password");
        onError?.("password", result.error || "Failed to update password");
        return false;
      }

      console.log("✅ Password updated successfully");

      // Refresh user data after successful update
      try {
        await accountSettings.refreshCurrentUser();
        console.log("✅ User data refreshed after password update");
      } catch (refreshError) {
        console.warn("⚠️ Could not refresh user data:", refreshError);
      }

      onSuccess?.("password");
      return true;
    } catch (error) {
      console.error("💥 Exception during password update:", error);
      const errorMessage =
        error instanceof Error ? error.message : "An unexpected error occurred";
      setError(errorMessage);
      onError?.("password", errorMessage);
      return false;
    } finally {
      setIsUpdating(null);
      console.log("🏁 Password update operation completed");
    }
  };

  /**
   * Update username
   */
  const updateUsername = async (username: string, currentPassword: string) => {
    console.log("👤 Attempting to update username to:", username);

    // Username validation - alphanumeric and underscores only
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      console.error("❌ Username validation failed:", username);
      setError("Username can only contain letters, numbers, and underscores");
      onError?.(
        "username",
        "Username can only contain letters, numbers, and underscores"
      );
      return false;
    }

    if (!currentPassword) {
      console.error("❌ Current password not provided for username update");
      setError("Current password is required");
      onError?.("username", "Current password is required");
      return false;
    }

    console.log(
      "✅ Username validation passed, proceeding with update request"
    );
    setIsUpdating("username");
    setError(null);

    try {
      if (!userId) {
        console.error("❌ No user ID available for username update");
        throw new Error("Not authenticated");
      }

      console.log(
        "🔄 Sending username update request to API with userId:",
        userId
      );
      const response = await fetch("/api/users/update-profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          field: "username",
          value: username,
          currentPassword,
          userId,
        }),
      });

      const result = await response.json();
      console.log("📥 API response received:", {
        status: response.status,
        ok: response.ok,
        result,
      });

      if (!response.ok) {
        console.error(
          "❌ Username update failed:",
          result.error || "Unknown error"
        );
        setError(result.error || "Failed to update username");
        onError?.("username", result.error || "Failed to update username");
        return false;
      }

      console.log("✅ Username updated successfully to:", username);

      // Refresh user data after successful update
      try {
        await accountSettings.refreshCurrentUser();
        console.log("✅ User data refreshed after username update");
      } catch (refreshError) {
        console.warn("⚠️ Could not refresh user data:", refreshError);
      }

      onSuccess?.("username");
      return true;
    } catch (error) {
      console.error("💥 Exception during username update:", error);
      const errorMessage =
        error instanceof Error ? error.message : "An unexpected error occurred";
      setError(errorMessage);
      onError?.("username", errorMessage);
      return false;
    } finally {
      setIsUpdating(null);
      console.log("🏁 Username update operation completed");
    }
  };

  return {
    isUpdating,
    error,
    updateEmail,
    updatePassword,
    updateUsername,
  };
}
