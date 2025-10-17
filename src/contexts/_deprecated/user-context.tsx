"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/app/utils/supabase/client";

interface UserProfile {
  id: string;
  firstname: string;
  lastname: string;
  username: string;
  email: string;
  role?: string;
}

interface UserContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  isSuperAdmin: boolean;
}

const UserContext = createContext<UserContextType>({
  user: null,
  userProfile: null,
  loading: true,
  signOut: async () => { },
  isAdmin: false,
  isSuperAdmin: false,
});

export function UserProvider({ children }: { children: React.ReactNode }) {

  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  useEffect(() => {
    let mounted = true;

    // Create a function to get user with optional loading indicator
    const getUser = async (showLoading = true) => {
      let timeoutId: ReturnType<typeof setTimeout> | null = null;
      
      // Only show loading indicator if requested
      if (showLoading && mounted) {
        setLoading(true);
        
        // Timeout to prevent infinite loading
        timeoutId = setTimeout(() => {
          if (mounted) {
            console.log("Auth timeout reached, setting loading to false");
            setLoading(false);
          }
        }, 5000); // 5 seconds timeout for loading state
      }
      
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          if (mounted) {
            setUser(null);
            if (showLoading) setLoading(false);
          }
          return;
        }

        if (mounted) {
          setUser(user);
          console.log("User authenticated:", user?.email || "No user");
        }

        // Fetch user profile if user exists
        if (user && mounted) {
          try {
            const { data: profile, error: profileError } = await supabase
              .from("users")
              .select("id, firstname, lastname, username, email, role")
              .eq("email", user.email)
              .single();

            if (profileError) {
              console.log("No user profile found, continuing without it");
            } else if (mounted) {
              setUserProfile(profile);
              
              // Set admin status based on role
              const userRole = profile.role || 'user';
              setIsAdmin(userRole === 'admin' || userRole === 'super_admin');
              setIsSuperAdmin(userRole === 'super_admin');
              
              console.log("User profile loaded:", profile.firstname, profile.lastname, "Role:", userRole);
            }
          } catch (profileError) {
            console.log("Profile fetch failed, continuing without it");
          }
        }
      } catch (error) {
        console.error("Error in getUser:", error);
      } finally {
        if (mounted && showLoading && timeoutId) {
          clearTimeout(timeoutId);
          setLoading(false);
        }
      }
    };

    // Get initial user with loading indicator
    getUser(true);

    // Track when the tab becomes hidden
    let tabHiddenTime = 0;

    // Handle tab visibility changes
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const hiddenDuration = Date.now() - tabHiddenTime;
        console.log(`Tab became visible after ${hiddenDuration}ms, maintaining current state`);
        // No refresh, just maintain current state
      } else if (document.visibilityState === 'hidden') {
        tabHiddenTime = Date.now();
        console.log("Tab hidden, saving timestamp");
      }
    };
    
    // Add visibility change listener
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, session?.user?.email);
      
      // Handle different auth events appropriately
      switch(event) {
        case 'TOKEN_REFRESHED':
          // Explicitly do nothing for token refreshes to maintain current state
          console.log("Token refreshed, maintaining current state");
          return; // Exit early, don't even update profile
        case 'SIGNED_IN':
          console.log("User signed in, updating state");
          setUser(session?.user ?? null);
          break;
        case 'SIGNED_OUT':
          console.log("User signed out, clearing state");
          setUser(null);
          setUserProfile(null);
          setIsAdmin(false);
          setIsSuperAdmin(false);
          break;
        case 'USER_UPDATED':
          // Only update user data, don't change loading state
          console.log("User updated, maintaining current state");
          if (session?.user) {
            setUser(session.user);
          }
          break;
        default:
          // For other events, only update if we have a session
          if (session) {
            setUser(session.user);
          } else if (event !== 'INITIAL_SESSION') {
            // Don't clear user on initial session if null (wait for getUser to complete)
            setUser(null);
          }
      }
      
      // Refresh user profile when session changes (but only for relevant events)
      // Don't refresh profile for token refresh events (already handled by early return in switch case)
      if (session?.user && mounted) {
        try {
          const { data: profile, error: profileError } = await supabase
            .from("users")
            .select("id, firstname, lastname, username, email, role")
            .eq("email", session.user.email)
            .single();

          if (!profileError && mounted) {
            setUserProfile(profile);
            
            // Update admin status when profile changes
            const userRole = profile.role || 'user';
            setIsAdmin(userRole === 'admin' || userRole === 'super_admin');
            setIsSuperAdmin(userRole === 'super_admin');
            
            console.log("User profile refreshed after auth change:", profile.firstname, profile.lastname, "Role:", userRole);
          } else if (event === 'SIGNED_OUT') {
            // Only clear profile on explicit sign out
            setUserProfile(null);
            setIsAdmin(false);
            setIsSuperAdmin(false);
          }
        } catch (error) {
          console.log("Profile refresh failed after auth change:", error);
          // Don't clear profile on errors unless explicitly signed out
          if (event === 'SIGNED_OUT') {
            setUserProfile(null);
          }
        }
      } else if (!session && event === 'SIGNED_OUT') {
        setUserProfile(null);
      }
    });

    return () => {
      mounted = false;
      // No need to clear timeout here since timeoutId is managed within getUser
      subscription.unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setUserProfile(null);
      window.location.href = "/login";
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <UserContext.Provider value={{ user, userProfile, loading, signOut, isAdmin, isSuperAdmin }}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};
