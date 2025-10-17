"use client";

import React, {
  createContext,
  useContext,
  ReactNode,
  useState,
  useEffect,
} from "react";
import { useUsers } from "@/app/utils/repo_services/hooks/user";
import { useUserSubscription } from "@/app/utils/repo_services/hooks/user_subscription";
import { useUserAddresses } from "@/app/utils/repo_services/hooks/user_address";
import { useUserContacts } from "@/app/utils/repo_services/hooks/user_contact";
import {
  AccountSettingsContextType,
  PaymentHistory,
  User,
} from "../app/dashboard/profile/sections/userProfileTypes";

const AccountSettingsContext = createContext<
  AccountSettingsContextType | undefined
>(undefined);

export function AccountSettingsProvider({ children }: { children: ReactNode }) {
  // Current date and time as specified
  const [currentDate] = useState<string>(
    new Date()
      .toLocaleDateString("en-GB") // European format: DD/MM/YYYY
      .replace(/\//g, "-") // Replace slashes with dashes to get DD-MM-YYYY
  );

  const [currentDateTime] = useState<string>(
    new Date()
      .toLocaleString("en-GB") // European format: DD/MM/YYYY, HH:mm:ss
      .replace(/\//g, "-") // Replace slashes with dashes to get DD-MM-YYYY
      .replace(",", "") // Remove the comma between date and time
  );

  // Use the existing hooks
  const { loading: userLoading, updateUser, getCurrentUser } = useUsers();

  const {
    data: userSubscriptions,
    loading: subscriptionLoading,
    getSubscriptionInfo,
    getCurrentSubscription,
  } = useUserSubscription();

  const {
    data: addresses,
    loading: addressLoading,
    getPrimaryAddress,
    updateAddress,
  } = useUserAddresses();

  const {
    data: contacts,
    loading: contactsLoading,
    updateContact,
    createContact,
    getContactByType,
  } = useUserContacts();

  // Combined loading and error states
  const isLoading =
    userLoading || subscriptionLoading || addressLoading || contactsLoading;

  // Get the user data from hooks
  const currentUser = getCurrentUser();
  const userSubscription = getSubscriptionInfo();
  const primaryAddress = getPrimaryAddress();

  // Construct the unified user data object
  const [userData, setUserDataState] = useState<User | null>(null);

  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([
    {
      date: "Aug 26, 2025",
      amount: "$29.99",
      paymentMethod: "•••• 4242",
      status: "Paid",
    },
    {
      date: "Jul 26, 2025",
      amount: "$29.99",
      paymentMethod: "•••• 4242",
      status: "Paid",
    },
    {
      date: "Jun 26, 2025",
      amount: "$29.99",
      paymentMethod: "•••• 4242",
      status: "Paid",
    },
  ]);

  const [profileImage, setProfileImage] = useState<string | null>(null);

  // Add this function to handle profile image updates
  const updateProfileImage = async (file: File | null): Promise<boolean> => {
    try {
      if (!file) {
        // TODO: Implement profile image deletion API
        // For now just update local state
        setUserDataState((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            profileImage: undefined,
          };
        });
        return true;
      }

      // Use the uploadProfilePicture hook to upload the image
      const { uploadProfilePicture } = useUsers();
      const result = await uploadProfilePicture(file);
      
      if (!result.success) {
        throw new Error(result.error || "Failed to upload profile image");
      }

      // Update local state with the returned image URL
      setUserDataState((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          profileImage: result.imageUrl,
        };
      });
      return true;
    } catch (error) {
      console.error("Failed to update profile image:", error);
      return false;
    }
  };

  // Initialize user data when the hooks finish loading
  useEffect(() => {
    if (!isLoading && currentUser) {
      setUserDataState({
        id: currentUser?.id,
        username: currentUser?.username || "",
        email: currentUser?.email || "",
        firstName: currentUser?.firstname || "",
        lastName: currentUser?.lastname || "",
        middleName: currentUser?.middlename || "",
        addressLine: primaryAddress?.address_line || "",
        addressCountry: primaryAddress?.country || "",
        addressState: primaryAddress?.state || "",
        addressTown: primaryAddress?.town || "",
        addressPostcode: primaryAddress?.post_code || "",
        homePhone: getContactByType("homePhone")?.value || "",
        workPhone: getContactByType("workPhone")?.value || "",
        mobilePhone: getContactByType("mobilePhone")?.value || "",
        currentPlan: userSubscription.name || "",
        profileImage: currentUser?.profile_img_url || "",
      });
    }
  }, [isLoading, currentUser, primaryAddress, userSubscription]);

  // Get subscription end date from the user's current subscription
  const getSubscriptionEndDate = (): string | null => {
    const currentSubscription = getCurrentSubscription();
    if (currentSubscription && currentSubscription.subscription_end_date) {
      return new Date(
        currentSubscription.subscription_end_date
      ).toLocaleDateString("en-GB", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    }
    return null;
  };

  // Refresh current user data from the database
  const refreshCurrentUser = async () => {
    console.log("🔄 Refreshing user data from database...");
    try {
      // Call the refresh method from the users hook
      await useUsers().refresh();

      // Get the latest user data after refresh
      const freshUser = getCurrentUser();

      if (freshUser) {
        console.log("✅ User data refreshed:", freshUser.email);

        // Update local state with fresh data
        setUserDataState((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            id: freshUser.id,
            email: freshUser.email || prev.email,
            username: freshUser.username || prev.username,
            firstName: freshUser.firstname || prev.firstName,
            lastName: freshUser.lastname || prev.lastName,
            middleName: freshUser.middlename || prev.middleName,
          };
        });

        return true;
      }
      return false;
    } catch (error) {
      console.error("❌ Failed to refresh user data:", error);
      return false;
    }
  };

  // Method to update user data
  const updateUserProfile = async (data: Partial<User>): Promise<boolean> => {
    if (!currentUser) return false;

    try {
      // Extract the data that should go to the user update
      const userUpdateData = {
        firstname: data.firstName,
        lastname: data.lastName,
        middlename: data.middleName,
        profile_img_url: data.profileImage,
      };
      
      // Remove undefined fields
      Object.keys(userUpdateData).forEach(key => {
        if (userUpdateData[key as keyof typeof userUpdateData] === undefined) {
          delete userUpdateData[key as keyof typeof userUpdateData];
        }
      });

      // Update the user through the hook
      await updateUser(currentUser.id, userUpdateData);

      // Refresh user data after update
      await refreshCurrentUser();

      // Update local state
      setUserDataState((prev) => (prev ? { ...prev, ...data } : null));
      return true;
    } catch (error) {
      console.error("Failed to update user profile:", error);
      return false;
    }
  };

  // Method to update user address
  const updateUserAddress = async (data: any): Promise<boolean> => {
    if (!primaryAddress) return false;

    try {
      const addressUpdateData = {
        address_line: data.addressLine,
        town: data.addressTown,
        state: data.addressState,
        post_code: data.addressPostcode,
        country: data.addressCountry,
      };

      await updateAddress(primaryAddress.id, addressUpdateData);

      // Update local state
      setUserDataState((prev) =>
        prev
          ? {
              ...prev,
              addressLine: data.addressLine,
              addressCountry: data.addressCountry,
              addressState: data.addressState,
              addressTown: data.addressTown,
              addressPostcode: data.addressPostcode,
            }
          : null
      );

      return true;
    } catch (error) {
      console.error("Failed to update address:", error);
      return false;
    }
  };

  // Method to update user contact
  const updateUserContact = async (
    type: string,
    value: string
  ): Promise<boolean> => {
    try {
      const contact = getContactByType(type);

      if (contact) {
        // Update existing contact
        await updateContact(contact.id, { value: value });
      } else if (value) {
        // Create new contact if value is provided
        await createContact({
          type: type,
          value: value,
          user_id: currentUser?.id ? Number(currentUser.id) : null,
        });
      }

      // Update local state
      setUserDataState((prev) => {
        if (!prev) return null;

        const update: any = { ...prev };
        if (type === "mobilePhone") update.mobilePhone = value;
        if (type === "homePhone") update.homePhone = value;
        if (type === "workPhone") update.workPhone = value;

        return update;
      });

      return true;
    } catch (error) {
      console.error(`Failed to update ${type} contact:`, error);
      return false;
    }
  };

  // Generic method to update user data (delegates to specific methods)
  const setUserData = async (data: Partial<User>): Promise<boolean> => {
    try {
      let success = true;

      // Update user profile if name fields are changed or profile image is updated
      if (
        data.firstName !== undefined ||
        data.lastName !== undefined ||
        data.middleName !== undefined ||
        data.profileImage !== undefined
      ) {
        const profileSuccess = await updateUserProfile(data);
        success = success && profileSuccess;
      }

      // Update address if address fields are changed
      if (
        data.addressLine !== undefined ||
        data.addressTown !== undefined ||
        data.addressState !== undefined ||
        data.addressPostcode !== undefined ||
        data.addressCountry !== undefined
      ) {
        const addressSuccess = await updateUserAddress(data);
        success = success && addressSuccess;
      }

      // Update phone contacts if changed
      if (
        data.mobilePhone !== undefined &&
        data.mobilePhone !== userData?.mobilePhone
      ) {
        const mobileSuccess = await updateUserContact(
          "mobilePhone",
          data.mobilePhone || ""
        );
        success = success && mobileSuccess;
      }

      if (
        data.homePhone !== undefined &&
        data.homePhone !== userData?.homePhone
      ) {
        const homeSuccess = await updateUserContact(
          "homePhone",
          data.homePhone || ""
        );
        success = success && homeSuccess;
      }

      if (
        data.workPhone !== undefined &&
        data.workPhone !== userData?.workPhone
      ) {
        const workSuccess = await updateUserContact(
          "workPhone",
          data.workPhone || ""
        );
        success = success && workSuccess;
      }

      return success;
    } catch (error) {
      console.error("Failed to update user data:", error);
      return false;
    }
  };

  const contextValue: AccountSettingsContextType = {
    isLoading,
    userData,
    setUserData,
    userSubscription,
    userAddress: primaryAddress,
    userContacts: contacts,
    getSubscriptionInfo,
    paymentHistory,
    currentDate,
    currentDateTime,
    subscriptionEndDate: getSubscriptionEndDate(),
    updateUserProfile,
    updateUserAddress,
    updateUserContact,
    getContactByType,
    updateProfileImage,
    refreshCurrentUser,
  };

  return (
    <AccountSettingsContext.Provider value={contextValue}>
      {children}
    </AccountSettingsContext.Provider>
  );
}

export function useAccountSettingsContext() {
  const context = useContext(AccountSettingsContext);
  if (context === undefined) {
    throw new Error(
      "useAccountSettingsContext must be used within an AccountSettingsProvider"
    );
  }
  return context;
}
