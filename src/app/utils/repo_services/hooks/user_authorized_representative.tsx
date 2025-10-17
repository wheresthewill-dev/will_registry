import {
  UserAuthorizedRepresentative,
  isInviteExpired,
  isRepresentativeActive,
  isRepresentativePending,
} from "../interfaces/user_authorized_representative";
import { useSupabaseData } from "../supabase_data";
import { useUserSession } from "./useUserSession";
import { useSubscriptionWithLimits } from "./useSubscriptionWithLimits";
import { representativeAuthService } from "../../../../services/representativeAuthService";
import {
  emailService,
  RepresentativeInviteData,
} from "../../../../services/emailService";

interface CreateRepresentativeData {
  representativeEmail: string;
  representativeFirstName: string;
  representativeLastName: string;
  representativeMiddleName?: string;
}

interface CreateRepresentativeResult {
  success: boolean;
  representative?: UserAuthorizedRepresentative;
  error?: string;
}

export function useUserAuthorizedRepresentatives() {
  const { userId, userLoading, userProfile } =
    useUserSession();
  const subscriptionLimits = useSubscriptionWithLimits();

  const result = useSupabaseData<UserAuthorizedRepresentative>({
    table: "user_authorized_representatives",
    realtime: false,
    orderBy: { column: "created_at", ascending: false },
    enabled: userId !== null && !userLoading,
  });

  // Representative-specific helper functions
  const getRepresentativesByStatus = (status: "pending" | "registered") => {
    return result.data.filter((rep) => rep.status === status);
  };

  const getActiveRepresentatives = () => {
    const reps = getMyAuthorizedRepresentatives();
    return reps.filter((rep) => isRepresentativeActive(rep));
  };

  const getPendingRepresentatives = () => {
    return getMyAuthorizedRepresentatives().filter((rep) =>
      isRepresentativePending(rep)
    );
  };

  const getExpiredInvitations = () => {
    return getMyAuthorizedRepresentatives().filter(
      (rep) => rep.status === "pending" && isInviteExpired(rep)
    );
  };

  const getRepresentativeById = (
    id: string
  ): UserAuthorizedRepresentative | undefined => {
    return result.data.find((rep) => rep.id === id);
  };

  const getRepresentativeByArUserId = (
    arUserId: number
  ): UserAuthorizedRepresentative | undefined => {
    return result.data.find((rep) => rep.ar_user_id === arUserId);
  };

  // CRUD operations
  const createRepresentative = async (
    representativeData: CreateRepresentativeData
  ): Promise<CreateRepresentativeResult> => {
    try {
      // Check subscription limits before creating
      if (!subscriptionLimits.canAddRepresentative()) {
        const currentCount = getMyAuthorizedRepresentatives().length;
        const limits = subscriptionLimits.usage;

        return {
          success: false,
          error:
            `You've reached the limit for Authorised Representatives on your ${subscriptionLimits.currentPlan} plan. ` +
            `Current: ${currentCount}, Limit: ${limits?.representatives || "Unknown"}. ` +
            `Please upgrade your subscription or remove existing representatives to add new ones.`,
        };
      }

      // Get current user for owner information
      const currentUser = userProfile;
      if (!currentUser) {
        return {
          success: false,
          error: "No current user found",
        };
      }

      // console.log('🔄 Starting representative creation process...');

      // 1. Generate temporary password and optional invite token for tracking
      const temporaryPassword =
        representativeAuthService.generateTemporaryPassword();
      const inviteToken = representativeAuthService.generateInviteToken(); // Keep for database tracking
      const inviteExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

      // console.log('📝 Generated credentials and tokens');

      // 2. Create auth account and user record using the auth service (with session preservation)
      // console.log('🔄 Creating auth account and user record for representative...');
      const authResult =
        await representativeAuthService.createRepresentativeAuth({
          email: representativeData.representativeEmail,
          password: temporaryPassword,
          firstname: representativeData.representativeFirstName,
          lastname: representativeData.representativeLastName,
          middlename: representativeData.representativeMiddleName,
        });

      let representativeUserId: string;
      let isNewAccount = false;

      if (!authResult.success || !authResult.userId) {
        // console.log('⚠️ Auth creation failed, checking if user already exists...');

        // If auth failed, try to find existing user by email
        try {
          const response = await fetch("/api/users/by-email", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: representativeData.representativeEmail,
            }),
          });

          const result = await response.json();

          if (result.found && result.user) {
            // console.log('✅ Found existing user with email:', representativeData.representativeEmail);
            representativeUserId = result.user.id;
            isNewAccount = false; // Existing account found
          } else {
            console.error(
              "❌ Failed to create representative auth and no existing user found:",
              authResult.error
            );
            return {
              success: false,
              error:
                authResult.error ||
                "Failed to create representative authentication",
            };
          }
        } catch (error) {
          console.error("❌ Failed to query existing user:", error);
          return {
            success: false,
            error:
              "Failed to create representative and unable to check for existing user",
          };
        }
      } else {
        representativeUserId = authResult.userId;
        isNewAccount = true; // New account was created
      }

      // 3. Create the representative relationship record
      const representativeRecord = {
        user_id: parseInt(currentUser.id),
        ar_user_id: parseInt(representativeUserId),
        firstname: representativeData.representativeFirstName,
        lastname: representativeData.representativeLastName,
        email: representativeData.representativeEmail,
        status: "pending" as const,
        invite_token: inviteToken,
        invite_expires: inviteExpires.toISOString(),
        registered_at: null,
        created_at: new Date().toISOString(),
      };

      // console.log('🔄 Creating representative relationship record...');
      const createdRepresentative = await result.create(representativeRecord);

      if (!createdRepresentative) {
        console.error("❌ Failed to create representative record");
        // Note: Auth cleanup would need to be handled server-side
        console.warn(
          "⚠️ Auth user and user record may need manual cleanup for email:",
          representativeData.representativeEmail
        );
        return {
          success: false,
          error: "Failed to create representative relationship record",
        };
      }

      // console.log('✅ Representative record created successfully');

      // 4. Send invitation email
      // console.log('🔄 Creating email data for invitation...');
      const emailData: RepresentativeInviteData = {
        representativeName: `${representativeData.representativeFirstName} ${representativeData.representativeLastName}`,
        representativeEmail: representativeData.representativeEmail,
        ownerName: `${currentUser.firstname} ${currentUser.lastname}`,
        ownerEmail: currentUser.email || "No email provided",
        temporaryPassword: isNewAccount ? temporaryPassword : undefined, // Only include password for new accounts
        loginUrl: emailService.generateLoginUrl(),
        expiryDate: inviteExpires.toLocaleDateString(),
        isNewAccount, // Add the new account flag
      };

      // console.log('📧 About to send invitation email to:', emailData.representativeEmail);
      const emailSent =
        await emailService.sendRepresentativeInvitation(emailData);

      if (!emailSent) {
        console.warn(
          "⚠️ Representative created but email invitation failed to send"
        );
        // Note: We don't fail the entire operation if email fails
        // The representative can still be manually notified
      } else {
        // console.log('✅ Email invitation sent successfully');
      }

      return {
        success: true,
        representative: createdRepresentative,
      };
    } catch (error) {
      // console.error('❌ Failed to create representative:', error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  };

  // Refresh subscription limits after successful creation
  const createRepresentativeWithRefresh = async (
    data: CreateRepresentativeData
  ) => {
    const result = await createRepresentative(data);
    if (result.success) {
      subscriptionLimits.refreshUsage();
    }
    return result;
  };

  // Original simple create function for backward compatibility
  const createRepresentativeRecord = async (
    newRepresentative: Omit<UserAuthorizedRepresentative, "id">
  ) => {
    return await result.create(newRepresentative);
  };

  const updateRepresentative = async (
    representativeId: string,
    updates: Partial<Omit<UserAuthorizedRepresentative, "id">>
  ) => {
    return await result.update(representativeId, updates);
  };

  const deleteRepresentative = async (representativeId: string) => {
    return await result.remove(representativeId);
  };

  // Specialized update methods
  const approveRepresentative = async (representativeId: string) => {
    try {
      // Update the representative status to registered
      const updateSuccess = await updateRepresentative(representativeId, {
        status: "registered",
        registered_at: new Date().toISOString(),
      });

      if (updateSuccess) {
        // Get the representative details for notification
        const representative = getRepresentativeById(representativeId);
        const currentUser = userProfile; // This is the person accepting (the representative)

        if (representative && currentUser) {
          // Send notification email to the inviter (the owner who invited this representative)
          try {
            const response = await fetch("/api/notifications/acceptance", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                type: "representative",
                inviterUserId: representative.user_id, // The owner who sent the invitation
                acceptorName: `${currentUser.firstname} ${currentUser.lastname}`,
                acceptorEmail: currentUser.email,
              }),
            });

            if (!response.ok) {
              console.warn("Failed to send acceptance notification email");
            }
          } catch (error) {
            console.error("Error sending acceptance notification:", error);
          }
        }
      }

      return updateSuccess;
    } catch (error) {
      console.error("Error approving representative:", error);
      return false;
    }
  };

  const revokeRepresentative = async (representativeId: string) => {
    return await deleteRepresentative(representativeId);
  };

  const updateInviteToken = async (
    representativeId: string,
    token: string,
    expiresAt: Date
  ) => {
    return await updateRepresentative(representativeId, {
      invite_token: token,
      invite_expires: expiresAt.toISOString(),
    });
  };

  const resendInvitation = async (
    representativeId: string,
    newToken: string,
    newExpiryDate: Date
  ) => {
    try {
      console.log(
        "🔄 Resending invitation for representative:",
        representativeId
      );

      // Get the current user and representative data
      const currentUser = userProfile;
      if (!currentUser) {
        console.error("❌ No current user found for resend invitation");
        return false;
      }

      const representative = getRepresentativeById(representativeId);
      if (!representative) {
        console.error("❌ Representative not found for resend invitation");
        return false;
      }

      console.log("📝 Updating representative record with new token...");
      // Update the representative record with new token and expiry
      const updateSuccess = await updateRepresentative(representativeId, {
        invite_token: newToken,
        invite_expires: newExpiryDate.toISOString(),
        status: "pending",
      });

      if (!updateSuccess) {
        console.error("❌ Failed to update representative record");
        return false;
      }

      // Generate magic link using service role API for existing users
      console.log("🔍 Generating magic link for existing user via API...");
      let magicLinkData = null;
      try {
        const response = await fetch("/api/auth/magic-link", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: representative.email,
            invitationType: "representative_resend",
            invitedBy: currentUser.email,
          }),
        });

        const result = await response.json();

        if (result.success) {
          console.log("✅ Magic link generated successfully via API");
          magicLinkData = result;
        } else {
          console.error(
            "❌ Failed to generate magic link via API:",
            result.error
          );
        }
      } catch (error) {
        console.error("❌ Failed to call magic link API:", error);
        // Fallback: continue without magic link but log the issue
      }

      console.log(
        "📧 Preparing to resend invitation email to:",
        representative.email
      );
      // Send new invitation email with magic link or password
      const emailData: RepresentativeInviteData = {
        representativeName: `${representative.firstname} ${representative.lastname}`,
        representativeEmail: representative.email,
        ownerName: `${currentUser.firstname} ${currentUser.lastname}`,
        ownerEmail: currentUser.email || "No email provided",
        temporaryPassword: magicLinkData
          ? ""
          : emailService.generateTemporaryPassword(),
        magicLink: magicLinkData
          ? "A secure login link has been sent to your email"
          : "",
        loginUrl: emailService.generateLoginUrl(),
        expiryDate: newExpiryDate.toLocaleDateString(),
      };

      console.log("🚀 Calling email service for resend invitation...");
      const emailSent =
        await emailService.sendRepresentativeInvitation(emailData);

      if (!emailSent) {
        console.warn(
          "⚠️ Representative invitation updated but email failed to send"
        );
        // Don't fail the operation just because email failed
      } else {
        console.log("✅ Invitation email resent successfully");
      }

      return true;
    } catch (error) {
      console.error("❌ Failed to resend invitation:", error);
      return false;
    }
  };

  const getResponsibilities = () => {
    if (!userId) return [];
    const reps = result.data.filter(
      (rep) =>
        rep.ar_user_id === Number(userId) && rep.user_id !== Number(userId)
    );
    return reps;
  };

  const getMyAuthorizedRepresentatives = () => {
    if (!userId) return [];
    const reps = result.data.filter(
      (rep) =>
        rep.user_id === Number(userId) && rep.ar_user_id !== Number(userId)
    );
    console.log("🔍 My authorised representatives:", reps);
    return reps;
  };

  return {
    ...result,
    // Override data to return empty array when no user
    data: userId ? result.data : [],
    // Override loading state to include user loading
    loading: result.loading || userLoading || !userId,
    // Override error to include user errors
    error: result.error || undefined,
    // Subscription limits
    subscriptionLimits,
    canAddRepresentative: subscriptionLimits.canAddRepresentative,
    // Helper functions
    getRepresentativesByStatus,
    getActiveRepresentatives,
    getPendingRepresentatives,
    getExpiredInvitations,
    getRepresentativeById,
    getRepresentativeByArUserId,
    // CRUD operations
    createRepresentative: createRepresentativeWithRefresh,
    createRepresentativeRecord,
    updateRepresentative,
    deleteRepresentative,
    // Specialized operations
    approveRepresentative,
    revokeRepresentative,
    updateInviteToken,
    resendInvitation,
    getResponsibilities,
    getMyAuthorizedRepresentatives,
  };
}
