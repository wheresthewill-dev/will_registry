import { useEffect, useState, useRef } from "react";
import { globalUserStore, GlobalUserData } from "@/lib/global-user-store";

/**
 * Custom hook that provides optimized user session data for other hooks
 * This uses the global user store - NO multiple auth subscriptions!
 * All hooks that use this will share the SAME user data from middleware
 */
export function useUserSession() {
    const [userData, setUserData] = useState<GlobalUserData | null>(globalUserStore.getUser());
    const [userLoading, setUserLoading] = useState(!globalUserStore.getUser());
    const hasInitializedRef = useRef(false);
    
    // Fetch user on mount (only once per app lifecycle due to global store caching)
    useEffect(() => {
        if (hasInitializedRef.current) return;
        hasInitializedRef.current = true;
        
        console.log('[useUserSession] Initializing...');
        
        // Subscribe to global store changes
        const unsubscribe = globalUserStore.subscribe(() => {
            console.log('[useUserSession] Global store updated');
            const user = globalUserStore.getUser();
            setUserData(user);
            setUserLoading(false);
        });

        // If we don't have user data yet, fetch it
        if (!userData) {
            console.log('[useUserSession] Fetching user from global store...');
            globalUserStore.fetchUser().then((user) => {
                console.log('[useUserSession] User fetched:', user?.email || 'No user');
                setUserData(user);
                setUserLoading(false);
            }).catch((error) => {
                console.error('[useUserSession] Error fetching user:', error);
                setUserLoading(false);
            });
        } else {
            console.log('[useUserSession] User already available from cache');
            setUserLoading(false);
        }

        return unsubscribe;
    }, []);
    
    // Get userId from userData (not from global store to avoid re-renders)
    const userId = userData?.id ? parseInt(userData.id) : null;
    
    // Create user and userProfile objects for backward compatibility
    const user = userData ? {
        id: userData.id,
        email: userData.email,
    } : null;
    
    const userProfile = userData ? {
        id: userData.id,
        firstname: userData.firstname,
        lastname: userData.lastname,
        username: userData.email.split('@')[0],
        email: userData.email,
        role: userData.role,
    } : null;
    
    return {
        user,
        userProfile,
        userId,
        userLoading,
        // Also expose raw user data
        isAdmin: userData?.isAdmin || false,
        isSuperAdmin: userData?.isSuperAdmin || false,
        // Expose global store methods
        signOut: () => globalUserStore.signOut(),
        refreshUser: () => globalUserStore.refreshUser(),
    };
}
