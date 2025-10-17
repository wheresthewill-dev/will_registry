// Subscription Limits Hook
// Manages subscription limits and provides real-time limit checking

import { useState, useEffect, useCallback } from 'react';
import { useUserSession } from './useUserSession';
import { useUserSubscription } from './user_subscription';
import { useUserAuthorizedRepresentatives } from './user_authorized_representative';
import { useUserEmergencyContacts } from './user_emergency_contact';
import { useDocumentLocations } from './document_location';
import { 
  LimitCheckResult, 
  LimitType, 
  UpgradePrompt,
  checkSubscriptionLimit,
  generateUpgradePrompt,
  formatLimitDisplay,
  getLimitStatusColor 
} from '../config/subscription-limits';
import { SubscriptionLevel } from '../interfaces/user_subscription';

export function useSubscriptionLimits() {
  const { userProfile, userLoading } = useUserSession();
  const { 
    getSubscriptionLevel, 
    loading: subscriptionLoading, 
    error: subscriptionError,
    isDataLoaded 
  } = useUserSubscription();
  
  // Get actual usage data from hooks
  const { 
    getMyAuthorizedRepresentatives, 
    loading: representativesLoading 
  } = useUserAuthorizedRepresentatives();
  
  const { 
    getMyEmergencyContacts, 
    loading: emergencyContactsLoading 
  } = useUserEmergencyContacts();
  
  const { 
    data: documents, 
    loading: documentsLoading 
  } = useDocumentLocations();

  // Get current user tier from subscription
  const userTier = getSubscriptionLevel() || 'bronze';
  const loading = userLoading || subscriptionLoading || !isDataLoaded() || 
                  representativesLoading || emergencyContactsLoading || documentsLoading;
  const error = subscriptionError;

  // Calculate actual usage counts from hooks
  const usageCount = {
    representatives: getMyAuthorizedRepresentatives?.()?.length || 0,
    emergencyContacts: getMyEmergencyContacts?.()?.length || 0,
    documents: documents?.length || 0,
    storageGB: 0 // TODO: Calculate actual storage usage when needed
  };

  // Refresh usage counts (for manual refresh if needed)
  const refreshUsageCounts = useCallback(async () => {
    // Since we're using live data from hooks, this is mainly for compatibility
    // The actual refresh happens when the underlying hooks refresh their data
    console.log('Current usage counts:', usageCount);
  }, [usageCount]);

  // Check if user can perform an action
  const canPerformAction = useCallback((
    limitType: LimitType,
    additionalCount: number = 1
  ): LimitCheckResult => {
    const currentUsage = usageCount[limitType === 'documentsCount' ? 'documents' : limitType];
    return checkSubscriptionLimit(userTier, limitType, currentUsage + additionalCount - 1);
  }, [userTier, usageCount]);

  // Check specific limits
  const canAddRepresentative = useCallback((): LimitCheckResult => {
    return canPerformAction('representatives');
  }, [canPerformAction]);

  const canAddEmergencyContact = useCallback((): LimitCheckResult => {
    return canPerformAction('emergencyContacts');
  }, [canPerformAction]);

  const canAddDocument = useCallback((): LimitCheckResult => {
    return canPerformAction('documentsCount');
  }, [canPerformAction]);

  // Generate upgrade prompts
  const getUpgradePrompt = useCallback((limitType: LimitType): UpgradePrompt => {
    const currentUsage = usageCount[limitType === 'documentsCount' ? 'documents' : limitType];
    return generateUpgradePrompt(userTier, limitType, currentUsage);
  }, [userTier, usageCount]);

  // Format limit displays
  const formatRepresentativeLimit = useCallback((): string => {
    const result = canAddRepresentative();
    return formatLimitDisplay(result.current, result.limit);
  }, [canAddRepresentative]);

  const formatEmergencyContactLimit = useCallback((): string => {
    const result = canAddEmergencyContact();
    return formatLimitDisplay(result.current, result.limit);
  }, [canAddEmergencyContact]);

  // Get limit status colors
  const getRepresentativeLimitColor = useCallback(() => {
    const result = canAddRepresentative();
    return getLimitStatusColor(result.current, result.limit);
  }, [canAddRepresentative]);

  const getEmergencyContactLimitColor = useCallback(() => {
    const result = canAddEmergencyContact();
    return getLimitStatusColor(result.current, result.limit);
  }, [canAddEmergencyContact]);

  // Update usage count for a specific type
  // Note: Since we're using live data, these functions are mainly for compatibility
  // The actual counts will update automatically when the underlying data changes
  const updateUsageCount = useCallback((limitType: LimitType, newCount: number) => {
    console.log(`Manual usage count update requested for ${limitType}: ${newCount}`);
    console.log('Note: Using live data, so this will be overridden on next render');
  }, []);

  // Increment usage count (when adding items)
  const incrementUsage = useCallback((limitType: LimitType, increment: number = 1) => {
    console.log(`Usage increment requested for ${limitType}: +${increment}`);
    console.log('Note: Using live data, counts will update automatically');
  }, []);

  // Decrement usage count (when removing items)
  const decrementUsage = useCallback((limitType: LimitType, decrement: number = 1) => {
    console.log(`Usage decrement requested for ${limitType}: -${decrement}`);
    console.log('Note: Using live data, counts will update automatically');
  }, []);

  return {
    // State
    userTier: userTier,
    loading: loading,
    error: error,
    usageCount,

    // Actions
    refreshUsageCounts,
    updateUsageCount,
    incrementUsage,
    decrementUsage,

    // Limit checking
    canPerformAction,
    canAddRepresentative,
    canAddEmergencyContact,
    canAddDocument,

    // UI helpers
    getUpgradePrompt,
    formatRepresentativeLimit,
    formatEmergencyContactLimit,
    getRepresentativeLimitColor,
    getEmergencyContactLimitColor
  };
}
