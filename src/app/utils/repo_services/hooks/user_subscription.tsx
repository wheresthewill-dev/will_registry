import { UserSubscription, SubscriptionLevel, validateSubscription, isSubscriptionActive, SUBSCRIPTION_TIERS } from "../interfaces/user_subscription";
import { useSupabaseData } from "../supabase_data";
import { useUserSession } from "./useUserSession";
import { useEffect, useRef } from "react";

interface UpdateSubscriptionData {
    subscription_level: SubscriptionLevel;
    subscription_end_date?: string | null;
}

interface UpdateSubscriptionResult {
    success: boolean;
    subscription?: UserSubscription;
    error?: string;
}

export function useUserSubscription() {
    const { user, userProfile, userLoading } = useUserSession();

    // Get userId from user profile - much more efficient than calling useUsers()
    const userId = userProfile?.id ? parseInt(userProfile.id) : null;
    const prevUserIdRef = useRef<number | null>(null);

    const result = useSupabaseData<UserSubscription>({
        table: 'user_subscription',
        customFilter: userId ? {
            column: 'user_id',
            value: userId,
            operator: 'eq'
        } : {
            // When no user is found, use an impossible filter to return no results
            column: 'user_id',
            value: -1, // No user will have ID -1
            operator: 'eq'
        },
        realtime: false, // Enable real-time updates for subscription changes
        orderBy: { column: 'created_at', ascending: false },
        enabled: userId !== undefined && !userLoading 
    });

    // Retry mechanism: Refresh data when userId becomes available
    useEffect(() => {
        // Check if userId changed from null to a valid value
        if (prevUserIdRef.current === null && userId !== null) {
            // console.log('[UserSubscription] userId became available, refreshing data...');
            result.refresh();
        }
        // Update the ref for next comparison
        prevUserIdRef.current = userId;
    }, [userId, result.refresh]);

    // Get current subscription (should only be one per user)
    const getCurrentSubscription = (): UserSubscription | null => {
        return result.data[0] || null;
    };

    // Check if user has active subscription
    const hasActiveSubscription = (): boolean => {
        // During loading, return false to avoid showing incorrect status
        if (result.loading || userLoading) {
            return false;
        }
        
        const subscription = getCurrentSubscription();
        return subscription ? isSubscriptionActive(subscription) : false;
    };

    // Get current subscription level
    const getSubscriptionLevel = (): SubscriptionLevel | null => {
        // During loading, return null to indicate no data available
        if (result.loading || userLoading) {
            return null;
        }
        
        const subscription = getCurrentSubscription();
        return subscription?.subscription_level || 'bronze';
    };

    // Check if user can access a feature based on subscription level
    const canAccessFeature = (requiredLevel: SubscriptionLevel): boolean => {
        const userLevel = getSubscriptionLevel();
        if (!userLevel) return false; // During loading or no subscription
        
        const levels: SubscriptionLevel[] = ['bronze', 'silver', 'gold', 'platinum'];
        const userIndex = levels.indexOf(userLevel);
        const requiredIndex = levels.indexOf(requiredLevel);
        return userIndex >= requiredIndex;
    };

    // Check usage limits
    const checkUsageLimit = (
        limitType: keyof typeof SUBSCRIPTION_TIERS.bronze.limits,
        currentUsage: number
    ): { allowed: boolean; limit: number | -1; remaining: number | -1 } => {
        const userLevel = getSubscriptionLevel();
        if (!userLevel) return { allowed: false, limit: 0, remaining: 0 }; // During loading
        
        const config = SUBSCRIPTION_TIERS[userLevel];
        const limit = config.limits[limitType];
        
        if (limit === -1) {
            return { allowed: true, limit: -1, remaining: -1 };
        }
        
        return {
            allowed: currentUsage < limit,
            limit,
            remaining: Math.max(0, limit - currentUsage)
        };
    };

    // Update subscription level
    const updateSubscription = async (data: UpdateSubscriptionData): Promise<UpdateSubscriptionResult> => {
        if (!userId) {
            return { success: false, error: 'No user found' };
        }

        // Validate subscription data
        const validation = validateSubscription({
            user_id: userId,
            ...data,
            subscription_start_date: new Date().toISOString()
        });

        if (!validation.isValid) {
            return { success: false, error: validation.errors.join(', ') };
        }

        try {
            const currentSubscription = getCurrentSubscription();
            
            if (currentSubscription) {
                // Update existing subscription
                const success = await result.update(currentSubscription.id, {
                    subscription_level: data.subscription_level,
                    subscription_start_date: new Date().toISOString(),
                    subscription_end_date: data.subscription_end_date || null,
                    is_active: true,
                    updated_at: new Date().toISOString()
                });

                if (success) {
                    const updatedSubscription = getCurrentSubscription();
                    return { success: true, subscription: updatedSubscription || undefined };
                } else {
                    return { success: false, error: result.error || 'Failed to update subscription' };
                }
            } else {
                // Create new subscription
                const newSubscription = await result.create({
                    user_id: userId,
                    subscription_level: data.subscription_level,
                    subscription_start_date: new Date().toISOString(),
                    subscription_end_date: data.subscription_end_date || null,
                    is_active: true,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                });

                if (newSubscription) {
                    return { success: true, subscription: newSubscription };
                } else {
                    return { success: false, error: result.error || 'Failed to create subscription' };
                }
            }
        } catch (error) {
            console.error('Error updating subscription:', error);
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    };

    // Cancel subscription (set to bronze)
    const cancelSubscription = async (): Promise<UpdateSubscriptionResult> => {
        return updateSubscription({
            subscription_level: 'bronze',
            subscription_end_date: null
        });
    };

    // Upgrade subscription
    const upgradeSubscription = async (
        newLevel: SubscriptionLevel,
        endDate?: string
    ): Promise<UpdateSubscriptionResult> => {
        return updateSubscription({
            subscription_level: newLevel,
            subscription_end_date: endDate
        });
    };

    // Get subscription tier information
    const getSubscriptionInfo = () => {
        const level = getSubscriptionLevel();
        if (!level) return SUBSCRIPTION_TIERS.bronze; // Fallback during loading
        return SUBSCRIPTION_TIERS[level];
    };

    // Check if subscription is expiring soon (within 7 days)
    const isExpiringSoon = (): boolean => {
        // During loading, return false
        if (result.loading || userLoading) {
            return false;
        }
        
        const subscription = getCurrentSubscription();
        if (!subscription || subscription.subscription_level === 'bronze') {
            return false;
        }

        if (!subscription.subscription_end_date) {
            return false;
        }

        const endDate = new Date(subscription.subscription_end_date);
        const now = new Date();
        const diffTime = endDate.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        return diffDays <= 7 && diffDays > 0;
    };

    return {
        // Data and state
        ...result,
        // Override data to return empty array when no user
        data: userId ? result.data : [],
        // Override loading state to include user loading
        loading: result.loading || userLoading,
        // Include user errors - user context doesn't expose errors directly
        error: result.error,

        // Subscription-specific methods
        getCurrentSubscription,
        hasActiveSubscription,
        getSubscriptionLevel,
        canAccessFeature,
        checkUsageLimit,
        updateSubscription,
        cancelSubscription,
        upgradeSubscription,
        getSubscriptionInfo,
        isExpiringSoon,

        // Utility methods
        isFreeTier: () => {
            const level = getSubscriptionLevel();
            return level === 'bronze';
        },
        isPaidTier: () => {
            const level = getSubscriptionLevel();
            return level !== null && level !== 'bronze';
        },
        isDataLoaded: () => {
            return !result.loading && !userLoading && getSubscriptionLevel() !== null;
        },
    };
}
