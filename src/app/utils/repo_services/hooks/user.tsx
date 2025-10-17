import { useUserSession } from "./useUserSession";
import { User } from "../interfaces/user";
import { useSupabaseData } from "../supabase_data";
import { useUserAuthorizedRepresentatives } from "./user_authorized_representative";

export function useUsers() {
  const { user, userProfile, userLoading: loading } = useUserSession();
  const { getResponsibilities } = useUserAuthorizedRepresentatives();

  const result = useSupabaseData<User>({
    table: "users",
    realtime: false,
    // customFilter: {
    //     column: 'auth_uid',
    //     value: user?.id || '',
    //     operator: 'eq'
    // },
  });

  const getUsersIAmResponsibleFor = () => {
    const responsibilities = getResponsibilities();
    const responsibleUserIds = responsibilities.map((rep) =>
      rep.user_id?.toString()
    );

    const responsibleUsers = result.data.filter((user) => {
      const userId = user.id.toString(); // Convert to string for comparison
      const isIncluded = responsibleUserIds.includes(userId);
      return isIncluded;
    });

    return responsibleUsers;
  };

  const getDeceasedUsersIAmResponsibleFor = () => {
    return getUsersIAmResponsibleFor().filter((user) => user.is_deceased === true);
  };

  const getActiveUsersIAmResponsibleFor = () => {
    return getUsersIAmResponsibleFor().filter((user) => user.is_deceased !== true);
  };

  const getUser = () => {
    console.log("Current users:", result.data);
    return result.data;
  };

  const updateUser = async (
    userId: string,
    updates: Partial<Omit<User, "id">>
  ) => {
    return await result.update(userId, updates);
  };

  const createUser = async (newUser: Omit<User, "id">) => {
    return await result.create(newUser);
  };

  const deleteUser = async (userId: string) => {
    return await result.remove(userId);
  };

  const getCurrentUser = () => {
    console.log('🔍 getCurrentUser Debug:', user?.id);
    return result.data.find((userTable) => userTable.id === user?.id);
  };
 
  const getUserById = async (userId: number) => {
    try {
      const response = await fetch("/api/users/by-id", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ user_id: userId }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to fetch user");
      }

      return {
        success: true,
        user: result.user,
      };
    } catch (error) {
      console.error("Error fetching user by ID:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  };

  const uploadProfilePicture = async (file: File) => {
    try {
      const currentUser = getCurrentUser();
      if (!currentUser) {
        throw new Error("User not authenticated");
      }
      
      console.log("Current user for upload:", currentUser);

      // Create form data
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', String(currentUser.id)); // Ensure userId is a string
      
      // Send request to upload profile picture - no auth token needed
      // as the endpoint will use SERVICE_ROLE_KEY
      console.log("Sending profile picture upload request with file:", file.name, file.type, file.size);
      
      const response = await fetch("/api/users/upload-profile-picture", {
        method: "POST",
        body: formData,
      });

      console.log("Upload response status:", response.status);
      
      const responseText = await response.text();
      console.log("Response text:", responseText);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}, response: ${responseText}`);
      }

      // Parse the response text as JSON
      const result = JSON.parse(responseText);

      if (!result.success) {
        throw new Error(result.error || "Failed to upload profile picture");
      }

      // Update local user data with new profile image URL
      if (currentUser && result.imageUrl) {
        await updateUser(currentUser.id, { profile_img_url: result.imageUrl });
        // Refresh user data
        await refresh();
      }

      return {
        success: true,
        imageUrl: result.imageUrl,
      };
    } catch (error) {
      console.error("Error uploading profile picture:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  };

  // Add an explicit refresh method
  const refresh = async () => {
    console.log("🔄 Explicitly refreshing users data");
    await result.refresh();
    console.log("✅ Users data refreshed");
    return true;
  };

  return {
    ...result,
    getUser,
    updateUser,
    createUser,
    deleteUser,
    getCurrentUser,
    getUsersIAmResponsibleFor,
    getDeceasedUsersIAmResponsibleFor,
    getActiveUsersIAmResponsibleFor,
    getUserById,
    uploadProfilePicture,
    refresh, // Add the new refresh method
  };
}
