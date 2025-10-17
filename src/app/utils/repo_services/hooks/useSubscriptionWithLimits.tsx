import { useEffect, useState } from "react";
import {
  UserSubscription,
  SubscriptionLevel,
  canAddNewItem,
  getOverLimitViolations,
  hasOverLimitViolations,
  getTierConfig,
  isSubscriptionActive,
} from "../interfaces/user_subscription";
import { useUserSession } from "./useUserSession";
import { supabase } from "../../supabase/client";



interface UsageData {
  emergencyContacts: number;
  representatives: number;
  documents: number;
  storageGB: number;
}

interface SubscriptionWithLimits {
  subscription: UserSubscription | null;
  usage: UsageData | null;
  loading: boolean;
  error: string | null;

  // Convenience getters
  currentPlan: SubscriptionLevel;
  isActive: boolean;
  isOverLimit: boolean;
  violations: Array<{
    type: string;
    current: number;
    limit: number;
    violation: string;
  }>;

  // Limit checking functions
  canAddEmergencyContact: () => boolean;
  canAddRepresentative: () => boolean;
  canAddDocument: () => boolean;

  // Refresh functions
  refreshSubscription: () => Promise<void>;
  refreshUsage: () => Promise<void>;
  refresh: () => Promise<void>;
}

export function useSubscriptionWithLimits(): SubscriptionWithLimits {
  const { userId, userLoading } = useUserSession();
  const [subscription, setSubscription] = useState<UserSubscription | null>(
    null
  );
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch current subscription
  const fetchSubscription = async () => {
    if (!userId) {
      setSubscription(null);
      return;
    }

    try {
      const { data, error: subError } = await supabase
        .from("user_subscription")
        .select("*")
        .eq("user_id", userId)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (subError && subError.code !== "PGRST116") {
        throw subError;
      }

      // If no subscription found, default to bronze
      if (!data) {
        setSubscription({
          id: "default-bronze",
          user_id: Number(userId),
          subscription_level: "bronze",
          subscription_start_date: new Date().toISOString(),
          subscription_end_date: null,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      } else {
        setSubscription(data);
      }
    } catch (err) {
      console.error("Error fetching subscription:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch subscription"
      );
    }
  };

  // Fetch current usage
  const fetchUsage = async () => {
    if (!userId) {
      setUsage(null);
      return;
    }

    try {
      // Get emergency contacts count
      const { data: emergencyContacts, error: ecError } = await supabase
        .from("user_emergency_contacts")
        .select("id", { count: "exact" })
        .eq("user_id", userId);

      if (ecError) throw ecError;

      // Get authorised representatives count
      const { data: representatives, error: repError } = await supabase
        .from("user_authorized_representatives")
        .select("id", { count: "exact" })
        .eq("user_id", userId);

      if (repError) throw repError;

      // Get documents count (if table exists)
      let documentsCount = 0;
      try {
        const { data: documents, error: docsError } = await supabase
          .from("document_locations")
          .select("id", { count: "exact" })
          .eq("user_id", userId);

        if (!docsError) {
          documentsCount = documents?.length || 0;
        }
      } catch {
        // Documents table might not exist yet
        documentsCount = 0;
      }

      setUsage({
        emergencyContacts: emergencyContacts?.length || 0,
        representatives: representatives?.length || 0,
        documents: documentsCount,
        storageGB: 0, // TODO: Calculate actual storage usage
      });
    } catch (err) {
      console.error("Error fetching usage:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch usage data"
      );
    }
  };

  // Fetch both subscription and usage
  const fetchAll = async () => {
    if (userLoading || !userId) return;

    setLoading(true);
    setError(null);

    await Promise.all([fetchSubscription(), fetchUsage()]);

    setLoading(false);
  };

  // Initial load and refresh when userId changes
  useEffect(() => {
    fetchAll();
  }, [userId, userLoading]);

  // Convenience getters
  const currentPlan: SubscriptionLevel =
    subscription?.subscription_level || "bronze";
  const isActive = subscription ? isSubscriptionActive(subscription) : false;

  const violations = usage ? getOverLimitViolations(currentPlan, usage) : [];
  const isOverLimit = violations.length > 0;

  // Limit checking functions
  const canAddEmergencyContact = () => {
    if (!usage) return false;
    return canAddNewItem(
      currentPlan,
      "emergencyContacts",
      usage.emergencyContacts
    );
  };

  const canAddRepresentative = () => {
    if (!usage) return false;
    return canAddNewItem(currentPlan, "representatives", usage.representatives);
  };

  const canAddDocument = () => {
    if (!usage) return false;
    return canAddNewItem(currentPlan, "documentsCount", usage.documents);
  };

  return {
    subscription,
    usage,
    loading: loading || userLoading,
    error,

    // Convenience getters
    currentPlan,
    isActive,
    isOverLimit,
    violations,

    // Limit checking functions
    canAddEmergencyContact,
    canAddRepresentative,
    canAddDocument,

    // Refresh functions
    refreshSubscription: fetchSubscription,
    refreshUsage: fetchUsage,
    refresh: fetchAll,
  };
}
