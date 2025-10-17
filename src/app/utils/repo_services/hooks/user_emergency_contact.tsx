import {
  UserEmergencyContact,
  validateEmergencyContact,
  isInviteExpired,
  isEmergencyContactActive,
  isEmergencyContactPending,
} from "../interfaces/user_emergency_contact";
import { useSupabaseData } from "../supabase_data";
import { useUserSession } from "./useUserSession";
import { useSubscriptionWithLimits } from "./useSubscriptionWithLimits";
import { emergencyContactAuthService } from "../../../../services/emergencyContactAuthService";
import {
  emailService,
  EmergencyContactInviteData,
} from "../../../../services/emailService";
import { get } from "http";

interface CreateEmergencyContactData {
  contactEmail: string;
  contactFirstName: string;
  contactLastName: string;
  contactNumber: string;
  relationship: string;
}

interface CreateEmergencyContactResult {
  success: boolean;
  contact?: UserEmergencyContact;
  error?: string;
}

export function useUserEmergencyContacts() {
  const { userId, userLoading, userProfile } =
    useUserSession();
  
  const subscriptionLimits = useSubscriptionWithLimits();

  const result = useSupabaseData<UserEmergencyContact>({
    table: "user_emergency_contacts",
    realtime: false,
    orderBy: { column: "created_at", ascending: false },
    enabled: userId !== null && !userLoading,
  });

  // Emergency contact-specific helper functions
  const getContactsByStatus = (status: "pending" | "registered") => {
    return getMyEmergencyContacts().filter(
      (contact) => contact.status === status
    );
  };

  const getActiveContacts = () => {
    return getMyEmergencyContacts().filter((contact) =>
      isEmergencyContactActive(contact)
    );
  };

  const getPendingContacts = () => {
    return getMyEmergencyContacts().filter((contact) =>
      isEmergencyContactPending(contact)
    );
  };

  const getExpiredInvitations = () => {
    return getMyEmergencyContacts().filter(
      (contact) => contact.status === "pending" && isInviteExpired(contact)
    );
  };

  const getContactById = (id: string): UserEmergencyContact | undefined => {
    return result.data.find((contact) => contact.id === id);
  };

  const getContactByEcUserId = (
    ecUserId: number
  ): UserEmergencyContact | undefined => {
    return result.data.find((contact) => contact.ec_user_id === ecUserId);
  };

  const getContactsByRelationship = (relationship: string) => {
    return result.data.filter(
      (contact) =>
        contact.relationship?.toLowerCase() === relationship.toLowerCase()
    );
  };

  // CRUD operations
  const createEmergencyContact = async (
    contactData: CreateEmergencyContactData
  ): Promise<CreateEmergencyContactResult> => {
    try {
      // Check subscription limits before creating
      if (!subscriptionLimits.canAddEmergencyContact()) {
        const currentCount = getMyEmergencyContacts().length;
        const limits = subscriptionLimits.subscription?.subscription_level 
          ? subscriptionLimits.usage 
          : null;
        
        return {
          success: false,
          error: `You've reached the limit for Emergency Contacts on your ${subscriptionLimits.currentPlan} plan. ` +
                 `Current: ${currentCount}, Limit: ${limits?.emergencyContacts || 'Unknown'}. ` +
                 `Please upgrade your subscription or remove existing contacts to add new ones.`,
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

      console.log("🔄 Starting emergency contact creation process...");

      // Validate contact data
      const validationErrors = validateEmergencyContact({
        firstname: contactData.contactFirstName,
        lastname: contactData.contactLastName,
        email: contactData.contactEmail,
        contact_number: contactData.contactNumber,
        relationship: contactData.relationship,
      });

      if (validationErrors.length > 0) {
        return {
          success: false,
          error: `Validation failed: ${validationErrors.join(", ")}`,
        };
      }

      // 1. Generate temporary password and optional invite token for tracking
      const temporaryPassword =
        emergencyContactAuthService.generateTemporaryPassword();
      const inviteToken = emergencyContactAuthService.generateInviteToken(); // Keep for database tracking
      const inviteExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

      console.log("📝 Generated credentials and tokens");

      // 2. Create auth account and user record using the auth service (with session preservation)
      console.log(
        "🔄 Creating auth account and user record for emergency contact..."
      );
      const authResult =
        await emergencyContactAuthService.createEmergencyContactAuth({
          email: contactData.contactEmail,
          password: temporaryPassword,
          firstname: contactData.contactFirstName,
          lastname: contactData.contactLastName,
          relationship: contactData.relationship,
        });

      let contactUserId: string;
      let isNewAccount = false; // Track whether we created a new account

      if (!authResult.success || !authResult.userId) {
        console.log(
          "⚠️ Auth creation failed, checking if user already exists..."
        );

        // If auth failed, try to find existing user by email
        try {
          const response = await fetch("/api/users/by-email", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ email: contactData.contactEmail }),
          });

          const result = await response.json();

          if (result.found && result.user) {
            console.log(
              "✅ Found existing user with email:",
              contactData.contactEmail
            );
            contactUserId = result.user.id;
            isNewAccount = false; // Using existing account
          } else {
            console.error(
              "❌ Failed to create emergency contact auth and no existing user found:",
              authResult.error
            );
            return {
              success: false,
              error:
                authResult.error ||
                "Failed to create emergency contact authentication",
            };
          }
        } catch (error) {
          console.error("❌ Failed to query existing user:", error);
          return {
            success: false,
            error:
              "Failed to create emergency contact and unable to check for existing user",
          };
        }
      } else {
        contactUserId = authResult.userId;
        isNewAccount = true; // Successfully created new account
      }

      // 3. Create the emergency contact relationship record
      const contactRecord = {
        user_id: parseInt(currentUser.id),
        ec_user_id: parseInt(contactUserId),
        firstname: contactData.contactFirstName,
        lastname: contactData.contactLastName,
        email: contactData.contactEmail,
        contact_number: contactData.contactNumber,
        relationship: contactData.relationship,
        status: "pending" as const,
        invite_token: inviteToken,
        invite_expires: inviteExpires.toISOString(),
        registered_at: null,
        created_at: new Date().toISOString(),
      };

      console.log("🔄 Creating emergency contact relationship record...");
      const createdContact = await result.create(contactRecord);

      if (!createdContact) {
        console.error("❌ Failed to create emergency contact record");
        // Note: Auth cleanup would need to be handled server-side
        console.warn(
          "⚠️ Auth user and user record may need manual cleanup for email:",
          contactData.contactEmail
        );
        return {
          success: false,
          error:
            "This person is already registered as your emergency contact. Please check your contacts list or contact support if you believe this is an error.",
        };
      }

      console.log("✅ Emergency contact record created successfully");

      // Refresh subscription limits after creating contact
      subscriptionLimits.refreshUsage();

      // 4. Send invitation email
      console.log("🔄 Creating email data for invitation...");
      const emailData: EmergencyContactInviteData = {
        contactName: `${contactData.contactFirstName} ${contactData.contactLastName}`,
        contactEmail: contactData.contactEmail,
        ownerName: `${currentUser.firstname} ${currentUser.lastname}`,
        ownerEmail: currentUser.email || "No email provided",
        relationship: contactData.relationship,
        temporaryPassword: isNewAccount ? temporaryPassword : undefined, // Only include password for new accounts
        loginUrl: emailService.generateLoginUrl(),
        expiryDate: inviteExpires.toLocaleDateString(),
        isNewAccount: isNewAccount, // Pass the flag to determine email template
      };

      console.log(
        "📧 About to send invitation email to:",
        emailData.contactEmail
      );
      const emailSent =
        await emailService.sendEmergencyContactInvitation(emailData);

      if (!emailSent) {
        console.warn(
          "⚠️ Emergency contact created but email invitation failed to send"
        );
        // Note: We don't fail the entire operation if email fails
        // The contact can still be manually notified
      } else {
        console.log("✅ Email invitation sent successfully");
      }

      return {
        success: true,
        contact: createdContact,
      };
    } catch (error) {
      console.error("❌ Failed to create emergency contact:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  };

  // Original simple create function for backward compatibility
  const createContactRecord = async (
    newContact: Omit<UserEmergencyContact, "id">
  ) => {
    return await result.create(newContact);
  };

  const updateContact = async (
    contactId: string,
    updates: Partial<Omit<UserEmergencyContact, "id">>
  ) => {
    return await result.update(contactId, updates);
  };

  const deleteContact = async (contactId: string) => {
    return await result.remove(contactId);
  };

  // Specialized update methods
  const approveContact = async (contactId: string) => {
    try {
      // Update the emergency contact status to registered
      const updateSuccess = await updateContact(contactId, {
        status: "registered",
        registered_at: new Date().toISOString(),
      });

      if (updateSuccess) {
        // Get the contact details for notification
        const contact = getContactById(contactId);
        const currentUser = userProfile; // This is the person accepting (the emergency contact)

        if (contact && currentUser) {
          // Send notification email to the inviter (the owner who invited this emergency contact)
          try {
            const response = await fetch("/api/notifications/acceptance", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                type: "emergency_contact",
                inviterUserId: contact.user_id, // The owner who sent the invitation
                acceptorName: `${currentUser.firstname} ${currentUser.lastname}`,
                acceptorEmail: currentUser.email,
                relationship: contact.relationship,
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
      console.error("Error approving emergency contact:", error);
      return false;
    }
  };

  const removeContact = async (contactId: string) => {
    return await deleteContact(contactId);
  };

  const updateInviteToken = async (
    contactId: string,
    token: string,
    expiresAt: Date
  ) => {
    return await updateContact(contactId, {
      invite_token: token,
      invite_expires: expiresAt.toISOString(),
    });
  };

  const resendInvitation = async (
    contactId: string,
    newToken: string,
    newExpiryDate: Date
  ) => {
    try {
      console.log("🔄 Resending invitation for emergency contact:", contactId);

      // Get the current user and contact data
      const currentUser = userProfile;
      if (!currentUser) {
        console.error("❌ No current user found for resend invitation");
        return false;
      }

      const contact = getContactById(contactId);
      if (!contact) {
        console.error("❌ Emergency contact not found for resend invitation");
        return false;
      }

      console.log("📝 Updating contact record with new token...");
      // Update the contact record with new token and expiry
      const updateSuccess = await updateContact(contactId, {
        invite_token: newToken,
        invite_expires: newExpiryDate.toISOString(),
        status: "pending",
      });

      if (!updateSuccess) {
        console.error("❌ Failed to update contact record");
        return false;
      }

      // Generate magic link using service role API for existing users
      console.log("🔄 Generating magic link for existing user via API...");
      let magicLinkData = null;
      try {
        const response = await fetch("/api/auth/magic-link", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: contact.email!,
            invitationType: "emergency_contact_resend",
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

      console.log("📧 Preparing to resend invitation email to:", contact.email);
      // Send new invitation email for existing account (resend is always for existing accounts)
      const emailData: EmergencyContactInviteData = {
        contactName: `${contact.firstname} ${contact.lastname}`,
        contactEmail: contact.email!,
        ownerName: `${currentUser.firstname} ${currentUser.lastname}`,
        ownerEmail: currentUser.email || "No email provided",
        relationship: contact.relationship || "Emergency Contact",
        temporaryPassword: undefined, // No password for existing accounts on resend
        magicLink: magicLinkData
          ? "A secure login link has been sent to your email"
          : "",
        loginUrl: emailService.generateLoginUrl(),
        expiryDate: newExpiryDate.toLocaleDateString(),
        isNewAccount: false, // Resend is always for existing accounts
      };

      console.log("🚀 Calling email service for resend invitation...");
      const emailSent =
        await emailService.sendEmergencyContactInvitation(emailData);

      if (!emailSent) {
        console.warn(
          "⚠️ Emergency contact invitation updated but email failed to send"
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
  const getEmergencyContactResponsibilities = () => {
    if (!userId) return [];
    const reps = result.data.filter(
      (rep) =>
        rep.ec_user_id === Number(userId) && rep.user_id !== Number(userId)
    );
    return reps;
  };

  const getMyEmergencyContacts = () => {
    if (!userId) return [];
    const reps = result.data.filter(
      (rep) =>
        rep.user_id === Number(userId) && rep.ec_user_id !== Number(userId)
    );
    console.log("🔍 My emergency contacts:", reps);
    return reps;
  };

  // Handle notifying representatives when someone is deceased
  const notifyRepresentativesOfDeath = async (
    contactId: string,
    userId: string,
    emergencyContactName: string,
    emergencyContactRelationship: string
  ): Promise<{ success: boolean; error?: string; details?: any }> => {
    try {
      console.log("Notifying representatives for responsibility:", contactId);

      const requestBody = {
        contactId: contactId,
        userId: userId,
        emergencyContactName: emergencyContactName,
        emergencyContactRelationship: emergencyContactRelationship
      };

      console.log("Sending request to notify-deceased API:", requestBody);

      const response = await fetch("/api/responsibilities/notify-deceased", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.details || result.error || "Failed to notify representatives");
      }

      if (result.success) {
        console.log("✅ Representatives notified successfully:", result.details);
        return {
          success: true,
          details: result.details
        };
      } else {
        throw new Error(result.error || "Failed to notify representatives");
      }
    } catch (error) {
      console.error("Error notifying representatives:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to notify representatives. Please try again.";
      return {
        success: false,
        error: errorMessage
      };
    }
  };

  return {
    ...result,
    // Override loading state to include user loading
    loading: result.loading || userLoading || !userId,
    // Override error to include user errors
    error: result.error || undefined,
    // Subscription limits
    subscriptionLimits,
    canAddEmergencyContact: subscriptionLimits.canAddEmergencyContact,
    // Helper functions
    getContactsByStatus,
    getActiveContacts,
    getPendingContacts,
    getExpiredInvitations,
    getContactById,
    getContactByEcUserId,
    getContactsByRelationship,
    // CRUD operations
    createEmergencyContact,
    createContactRecord,
    updateContact,
    deleteContact,
    // Specialized operations
    approveContact,
    removeContact,
    updateInviteToken,
    resendInvitation,
    getEmergencyContactResponsibilities,
    getMyEmergencyContacts,
    // Death notification
    notifyRepresentativesOfDeath,
  };
}
