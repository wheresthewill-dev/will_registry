import { useSupabaseData } from "../supabase_data";
import { UserConfig, CreateUserConfig, UpdateUserConfig } from "../interfaces/user_config";
import { useUserSession } from "./useUserSession";
import { get } from "http";

// Hook for user_config table
export function useUserConfig() {
    const { userId, userLoading } = useUserSession();

    // Fetch config for a specific user
    const result = useSupabaseData<UserConfig>({
        table: "user_config",
        customFilter: { column: "user_id", value: userId, operator: "eq" },
        realtime: false,
        enabled: userId !== null && !userLoading,
    });

    // Get the config (should be at most one row per user)
    const getConfig = () => (result.data && result.data.length > 0 ? result.data[0] : null);

    // Update config
    const updateConfig = async (id: any, updates: UpdateUserConfig) => {
        const updated = await result.update(String(id), updates);
        
        return updated;
    };

    // Create config
    const createConfig = async (newConfig: CreateUserConfig) => {
        return await result.create(newConfig);
    };

    return {
        ...result,
        getConfig,
        updateConfig,
        createConfig,
    };
}
