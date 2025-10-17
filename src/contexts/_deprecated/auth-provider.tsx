"use client";

import { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/app/utils/supabase/client';

// Define the User type
type User = {
  id: string;
  email: string;
  role?: string;
  [key: string]: any;
};

// Define the context type
type AuthContextType = {
  user: User | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
};

// Create the context
const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  error: null,
  isAuthenticated: false,
  signOut: async () => {},
  refreshSession: async () => {},
});

// Provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Use the existing Supabase client instead of creating a new one
  // This prevents the duplicate GoTrueClient warning

  // Function to refresh the session
  const refreshSession = async () => {
    // Set a timeout to prevent infinite loading states
    const timeoutId = setTimeout(() => {
      setLoading(false);
      console.log('Session refresh timed out, resetting loading state');
    }, 5000); // 5-second safety timeout
    
    // Only set loading true during initial authentication, not for refreshes
    // This prevents loading states when switching tabs
    if (!user) {
      console.log('No user, setting loading state for initial authentication');
      setLoading(true);
    } else {
      console.log('User exists, skipping loading state for session refresh');
    }
    
    try {
      setError(null);
      
      // Force refresh the auth session
      const { data, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Session error during refresh:', sessionError);
        setError(sessionError.message);
        setUser(null);
        return;
      }
      
      if (data.session) {
        const { data: userData, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
          console.error('User data error during refresh:', userError);
          setError(userError.message);
          setUser(null);
          return;
        }
        
        // Get additional user data if needed
        if (userData.user) {
          try {
            // You can fetch additional user data from your tables here
            const { data: profileData } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', userData.user.id)
              .single();
              
            setUser({
              id: userData.user.id,
              email: userData.user.email!,
              // Merge any additional profile data
              ...(profileData || {}),
            });
            
            console.log('Session refreshed successfully');
          } catch (profileError) {
            // Still set the user even if profile fetch fails
            console.error('Profile data error:', profileError);
            setUser({
              id: userData.user.id,
              email: userData.user.email!,
            });
          }
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error('Error refreshing session:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setUser(null);
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  };

  // Sign out function
  const signOut = async () => {
    try {
      setLoading(true);
      await supabase.auth.signOut();
      setUser(null);
      router.push('/login');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // Effect to handle auth state changes
  useEffect(() => {
    // Initial session check
    refreshSession();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN') {
          console.log('Auth state changed in AuthProvider: SIGNED_IN', session?.user?.email);
          // Instead of a full refresh, just set the user directly to avoid loading state conflicts
          if (session?.user) {
            setUser({
              id: session.user.id,
              email: session.user.email!
            });
            setLoading(false); // Ensure loading is false after setting user
          }
        } else if (event === 'TOKEN_REFRESHED') {
          console.log('Token refreshed in AuthProvider, maintaining current state');
          // Skip refresh for token refreshes to avoid unnecessary loading states
        }
        
        if (event === 'SIGNED_OUT') {
          setUser(null);
        }
      }
    );
    
    // Handle browser tab visibility changes
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('Tab is now visible in AuthProvider, explicitly not refreshing');
        // Do nothing - we want to maintain the current state without any refreshes
      } else if (document.visibilityState === 'hidden') {
        console.log('Tab hidden in AuthProvider');
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup subscriptions on unmount
    return () => {
      subscription.unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Context value
  const value = {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    signOut,
    refreshSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
