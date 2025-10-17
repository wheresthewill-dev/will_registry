"use client";

import { useSupabaseData } from "../supabase_data";
import { AppConfig, AppConfigResponse } from "../interfaces/app_config";
import { useState, useEffect } from "react";
import { supabase } from "@/app/utils/supabase/client";

/**
 * Hook for interacting with the app_config table
 * Provides functions to fetch and update application configuration
 * 
 * Note: Since AppConfig uses number as id type but useSupabaseData expects string,
 * we're implementing this with a direct Supabase call instead.
 */
export function useAppConfig() {
    const [data, setData] = useState<AppConfig | null>();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchConfig = async () => {
        setLoading(true);
        setError(null);

        try {
            const { data: configData, error: queryError } = await supabase
                .from('app_config')
                .select('*')
                .limit(1)
                .single();

            if (queryError) {
                setError(queryError.message);
                setData(null);
            } else {
                setData(configData as AppConfig);
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            setError(errorMessage);
            setData(null);
        } finally {
            setLoading(false);
        }
    };

    // Initial fetch
    useEffect(() => {
        console.log("Setting up app_config subscription");
        fetchConfig();
        console.log("App config subscription set up");
        console.log("Initial app config data:", data);

        // // Set up realtime subscription
        // const channel = supabase
        //     .channel('app_config_changes')
        //     .on('postgres_changes',
        //         { event: '*', schema: 'public', table: 'app_config' },
        //         () => {
        //             fetchConfig();
        //         }
        //     )
        //     .subscribe();


        // return () => {
        //     supabase.removeChannel(channel);
        // };
    }, []);

    // Get the current app configuration (should only be one row)
    const getConfig = (): AppConfig | null => {
        return data ?? null;
    };

    // Update app configuration
    const updateConfig = async (updates: Partial<Omit<AppConfig, 'id'>>): Promise<boolean> => {
        setLoading(true);
        setError(null);

        try {
            const currentConfig = getConfig();

            if (currentConfig) {
                // Update existing config
                const { error: updateError } = await supabase
                    .from('app_config')
                    .update(updates)
                    .eq('id', currentConfig.id);

                if (updateError) {
                    setError(updateError.message);
                    return false;
                }

                await fetchConfig(); // Refresh data
                return true;
            } else {
                // Create initial config if it doesn't exist
                const { data: newConfig, error: insertError } = await supabase
                    .from('app_config')
                    .insert({
                        business_address: updates.business_address || null,
                        business_contact: updates.business_contact || null,
                        customer_support_email: updates.customer_support_email || null,
                        paypal_enabled: updates.paypal_enabled ?? false,
                        paypal_key: updates.paypal_key || null,
                        paypal_secret: updates.paypal_secret || null
                    })
                    .select()
                    .single();

                if (insertError) {
                    setError(insertError.message);
                    return false;
                }

                await fetchConfig(); // Refresh data
                return true;
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            setError(errorMessage);
            return false;
        } finally {
            setLoading(false);
        }
    };

    return {
        data,
        loading,
        error,
        isLoading: loading,
        appConfig: getConfig(),
        getConfig,
        updateConfig,
        refresh: fetchConfig
    };
}
