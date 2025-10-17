import { ROUTES } from "@/app/constants/routes";
import { create } from "zustand";

// Auth store for managing logout state
interface AuthState {
  isLoggingOut: boolean;
  logoutError: string | null;
  setLogoutState: (isLoggingOut: boolean, error?: string | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isLoggingOut: false,
  logoutError: null,
  setLogoutState: (isLoggingOut, error = null) =>
    set({ isLoggingOut, logoutError: error }),
}));

export const handleLogOut = async () => {
  // Get the state setter from the store
  const { setLogoutState } = useAuthStore.getState();

  try {
    // Set logout state to true
    setLogoutState(true);

    // Call the signout endpoint
    await fetch("/api/auth/signout", {
      method: "POST",
    });

    // If successful, redirect to login page
    window.location.href = ROUTES.login;
  } catch (error) {
    // If there's an error, update state with error message
    setLogoutState(false, "Failed to sign out. Please try again.");
    console.error("Sign out error:", error);
  }
};
