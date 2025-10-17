"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {supabase} from "@/app/utils/supabase/client";

interface BaseEntity {
    id: string;
    [key: string]: any;
}

interface FilterCondition {
    column: string;
    value: any;
    operator?: 'eq' | 'neq' | 'gt' | 'lt' | 'in' | 'gte' | 'lte' | 'like' | 'ilike';
}

interface UseSupabaseDataOptions {
    table: string;
    select?: string;
    orderBy?: { column: string; ascending?: boolean };
    userFiltered?: boolean;
    realtime?: false;
    customFilter?: FilterCondition | FilterCondition[];
    enabled?: boolean;
}

export function useSupabaseData<T extends BaseEntity>(
    options: UseSupabaseDataOptions
) {
    
    const [data, setData] = useState<T[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fetchingRef = useRef(false);

    // Memoize the filter to prevent unnecessary recreations
    const memoizedFilter = useMemo(() => {
        if (!options.customFilter) return [];
        
        const filters = Array.isArray(options.customFilter) 
            ? options.customFilter 
            : [options.customFilter];
        
        return filters;
    }, [
        // Create a stable dependency for the filter
        options.customFilter ? JSON.stringify(options.customFilter) : null
    ]);

    // Memoize the orderBy to prevent unnecessary recreations
    const memoizedOrderBy = useMemo(() => {
        return options.orderBy || null;
    }, [
        options.orderBy?.column,
        options.orderBy?.ascending
    ]);

    const fetchData = useCallback(async () => {
        if (!options.table || options.enabled === false || fetchingRef.current) {
            return;
        }
        
        fetchingRef.current = true;
        setLoading(true);
        setError(null);

        try {
            // Start building the query
            let query = supabase
                .from(options.table)
                .select(options.select || '*');

            // Apply custom filters
            if (memoizedFilter.length > 0) {
                memoizedFilter.forEach((filter) => {
                    const { column, operator = 'eq', value } = filter;
                    switch (operator) {
                        case 'eq':
                            query = query.eq(column, value);
                            break;
                        case 'neq':
                            query = query.neq(column, value);
                            break;
                        case 'gt':
                            query = query.gt(column, value);
                            break;
                        case 'gte':
                            query = query.gte(column, value);
                            break;
                        case 'lt':
                            query = query.lt(column, value);
                            break;
                        case 'lte':
                            query = query.lte(column, value);
                            break;
                        case 'in':
                            query = query.in(column, value);
                            break;
                        case 'like':
                            query = query.like(column, value);
                            break;
                        case 'ilike':
                            query = query.ilike(column, value);
                            break;
                        default:
                            query = query.eq(column, value);
                    }
                });
            }

            // Apply ordering
            if (memoizedOrderBy) {
                query = query.order(memoizedOrderBy.column, { 
                    ascending: memoizedOrderBy.ascending !== false 
                });
            }

            // Execute the query
            const { data: result, error: queryError } = await query;

            if (queryError) {
                setError(queryError.message);
                setData([]);
            } else {
                setData((result || []) as unknown as T[]);
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            setError(errorMessage);
            setData([]);
        } finally {
            setLoading(false);
            fetchingRef.current = false;
        }
    }, [
        options.table,
        options.select,
        options.enabled,
        memoizedOrderBy,
        memoizedFilter
        // Removed supabase from dependencies as it's a stable import
    ]);

    const create = useCallback(async (newItem: Omit<T, 'id'>): Promise<T | null> => {
        setError(null);
        
        try {
            const { data: result, error: createError } = await supabase
                .from(options.table)
                .insert(newItem)
                .select()
                .single();

            if (createError) {
                setError(createError.message);
                return null;
            }

            if (result) {
                setData(prev => [result as T, ...prev]);
                return result as T;
            }

            return null;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            setError(errorMessage);
            return null;
        }
    }, [options.table]);

    const update = useCallback(async (
        id: string, 
        updates: Partial<Omit<T, 'id'>>
    ): Promise<boolean> => {
        setError(null);
        
        try {
            const { data: result, error: updateError } = await supabase
                .from(options.table)
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (updateError) {
                setError(updateError.message);
                return false;
            }

            if (result) {
                setData(prev => prev.map(item => 
                    item.id === id ? { ...item, ...result } : item
                ));
            }

            return true;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            setError(errorMessage);
            return false;
        }
    }, [options.table]);

    const remove = useCallback(async (id: string): Promise<boolean> => {
        setError(null);
        
        try {
            const { error: deleteError } = await supabase
                .from(options.table)
                .delete()
                .eq('id', id);

            if (deleteError) {
                setError(deleteError.message);
                return false;
            }

            setData(prev => prev.filter(item => item.id !== id));
            return true;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            setError(errorMessage);
            return false;
        }
    }, [options.table]);

    const filter = useCallback((predicate: (item: T) => boolean): T[] => {
        return data.filter(predicate);
    }, [data]);

    // Only fetch when enabled and dependencies change
    useEffect(() => {
        if (options.enabled !== false) {
            fetchData();
        }
    }, [fetchData, options.enabled]);

    // Set up realtime subscription if enabled
    useEffect(() => {
        if (!options.realtime || !options.table) return;

        const channel = supabase
            .channel(`${options.table}_changes`)
            .on('postgres_changes', 
                { event: '*', schema: 'public', table: options.table },
                (payload) => {
                    // Only refresh if not currently fetching to avoid conflicts
                    if (!fetchingRef.current) {
                        fetchData();
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [options.realtime, options.table, fetchData]);

    return {
        data,
        loading,
        error,
        create,
        update,
        remove,
        refresh: fetchData,
        filter,
    };
}