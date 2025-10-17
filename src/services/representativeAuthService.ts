/**
 * Representative Auth Service
 * Handles creation of Supabase auth accounts for authorised representatives
 */

import { supabase } from "@/app/utils/supabase/client";
import { v4 as uuidv4 } from "uuid";

interface CreateRepresentativeAuthData {
  email: string;
  password: string;
  firstname: string;
  lastname: string;
  middlename?: string;
}

interface CreateRepresentativeResult {
  success: boolean;
  userId?: string;
  authId?: string;
  error?: string;
}

class RepresentativeAuthService {
  /**
   * Create a new auth account and user record for a representative
   * Uses server-side API to avoid client session disruption
   */
  async createRepresentativeAuth(
    data: CreateRepresentativeAuthData
  ): Promise<CreateRepresentativeResult> {
    try {
      console.log(
        "🔄 Client: Calling server API for representative auth creation..."
      );

      // Call server-side API to create auth account without affecting client session
      const response = await fetch("/api/auth/create-representative", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          firstname: data.firstname,
          lastname: data.lastname,
          middlename: data.middlename,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        console.error("❌ Client: Server API failed:", result.error);

        // If it's a configuration error, fall back to user-only creation
        if (result.error === "Server configuration error") {
          console.log("🔄 Client: Falling back to user-only creation...");
          return await this.createRepresentativeUserOnly(data);
        }

        return {
          success: false,
          error:
            result.error || "Failed to create representative authentication",
        };
      }

      console.log(
        "✅ Client: Representative auth created successfully via server API"
      );
      return {
        success: true,
        userId: result.userId,
        authId: result.authId,
      };
    } catch (error) {
      console.error("❌ Client: Representative auth creation error:", error);
      // Fall back to user-only creation
      console.log(
        "🔄 Client: Error occurred, falling back to user-only creation..."
      );
      return await this.createRepresentativeUserOnly(data);
    }
  }

  /**
   * Fallback method: Create user record only (no auth account)
   * Auth account will be created when representative accepts invitation
   */
  async createRepresentativeUserOnly(
    data: CreateRepresentativeAuthData
  ): Promise<CreateRepresentativeResult> {
    try {
      console.log("🔄 Client: Creating user record only (fallback method)...");

      const response = await fetch("/api/auth/create-representative-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: data.email,
          firstname: data.firstname,
          lastname: data.lastname,
          middlename: data.middlename,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        console.error("❌ Client: Fallback API failed:", result.error);
        return {
          success: false,
          error: result.error || "Failed to create representative user record",
        };
      }

      console.log(
        "✅ Client: Representative user created successfully (auth pending)"
      );
      return {
        success: true,
        userId: result.userId,
        authId: undefined, // No auth account created yet
      };
    } catch (error) {
      console.error("❌ Client: Fallback method failed:", error);
      return {
        success: false,
        error: `Unexpected error: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
  }

  /**
   * Delete a representative's user record
   * Note: Auth account deletion requires admin privileges and should be handled server-side
   */
  async deleteRepresentativeAuth(
    authId: string,
    userId: string
  ): Promise<boolean> {
    try {
      // 1. Delete the user record
      const { error: userError } = await supabase
        .from("users")
        .delete()
        .eq("id", userId);

      if (userError) {
        console.error("Failed to delete user record:", userError);
        return false;
      }

      // Note: We can't delete auth users from client side
      // This should be handled by a server-side function or Edge Function
      console.warn(
        `Auth user ${authId} should be deleted server-side for complete cleanup`
      );

      return true;
    } catch (error) {
      console.error("Failed to delete representative auth:", error);
      return false;
    }
  }

  /**
   * Generate a secure temporary password
   */
  generateTemporaryPassword(): string {
    const length = 12;
    const charset =
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  }

  /**
   * Generate a unique invite token
   */
  generateInviteToken(): string {
    return uuidv4();
  }
}

export const representativeAuthService = new RepresentativeAuthService();
export type { CreateRepresentativeAuthData, CreateRepresentativeResult };
