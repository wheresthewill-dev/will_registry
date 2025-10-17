import { RecentActivity } from "../interfaces/recent_activity";
import { useSupabaseData } from "../supabase_data";
import { useUserSession } from "./useUserSession";

export function useRecentActivities() {
    const { userId, userLoading } = useUserSession();

    console.log('🔍 Recent Activities Debug:', {
        userId,
        userLoading
    });

    const result = useSupabaseData<RecentActivity>({
        table: 'recent_activities',
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
        realtime: false, // Enable real-time updates for activity feed
        orderBy: { column: 'created_at', ascending: false },
        enabled: userId !== null && !userLoading // Only fetch when we have a userId and not loading
    });

    console.log('📊 Supabase Data Result:', {
        data: result.data,
        loading: result.loading,
        error: result.error,
        dataLength: result.data?.length
    });

    // Transform the data to ensure IDs are strings
    const transformedData = result.data.map(activity => ({
        ...activity,
        id: activity.id.toString()
    }));

    // Helper functions
    const getActivitiesByType = (activityType: 'create' | 'update' | 'delete') => {
        return transformedData.filter(activity => activity.activity_type === activityType);
    };

    const getActivitiesByTable = (tableName: string) => {
        return transformedData.filter(activity => activity.table_name === tableName);
    };

    const getDocumentActivities = () => {
        return getActivitiesByTable('document_locations');
    };

    const getRepresentativeActivities = () => {
        return getActivitiesByTable('user_authorized_representatives');
    };

    const getRecentActivities = (limit?: number) => {
        return limit ? transformedData.slice(0, limit) : transformedData;
    };

    const getActivitiesFromDate = (fromDate: Date) => {
        return transformedData.filter(activity => 
            new Date(activity.created_at) >= fromDate
        );
    };

    const getTodaysActivities = () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return getActivitiesFromDate(today);
    };

    const getThisWeeksActivities = () => {
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        weekStart.setHours(0, 0, 0, 0);
        return getActivitiesFromDate(weekStart);
    };

    const searchActivities = (query: string) => {
        const lowercaseQuery = query.toLowerCase();
        return transformedData.filter(activity => 
            activity.description.toLowerCase().includes(lowercaseQuery) ||
            activity.table_name.toLowerCase().includes(lowercaseQuery)
        );
    };

    const getActivityById = (id: string): RecentActivity | undefined => {
        return transformedData.find(activity => activity.id === id);
    };

    // Statistics
    const getActivityStats = () => {
        const stats = {
            total: transformedData.length,
            today: getTodaysActivities().length,
            thisWeek: getThisWeeksActivities().length,
            byType: {
                create: getActivitiesByType('create').length,
                update: getActivitiesByType('update').length,
                delete: getActivitiesByType('delete').length,
            },
            byTable: {
                documents: getDocumentActivities().length,
                representatives: getRepresentativeActivities().length,
            }
        };
        return stats;
    };

    return {
        ...result,
        // Override data to return empty array when no user
        data: userId ? transformedData : [],
        // Override loading state to include user loading
        loading: result.loading || userLoading || !userId,
        // Override error to include user errors
        error: result.error || undefined,
        // Helper functions
        getActivitiesByType,
        getActivitiesByTable,
        getDocumentActivities,
        getRepresentativeActivities,
        getRecentActivities,
        getActivitiesFromDate,
        getTodaysActivities,
        getThisWeeksActivities,
        searchActivities,
        getActivityById,
        getActivityStats,
    };
}