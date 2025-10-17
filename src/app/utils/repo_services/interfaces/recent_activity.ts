export interface RecentActivity {
    id: string;
    user_id: number;
    activity_type: 'create' | 'update' | 'delete';
    table_name: string;
    record_id: string;
    description: string;
    old_data?: any;
    new_data?: any;
    created_at: string;
}

export const getActivityIcon = (activityType: string, tableName: string): string => {
    switch (activityType) {
        case 'create':
            return tableName === 'document_locations' ? '📄' : '👤';
        case 'update':
            return tableName === 'document_locations' ? '✏️' : '🔄';
        case 'delete':
            return tableName === 'document_locations' ? '🗑️' : '❌';
        default:
            return '📝';
    }
};

export const getActivityColor = (activityType: string): string => {
    switch (activityType) {
        case 'create':
            return 'text-green-600';
        case 'update':
            return 'text-blue-600';
        case 'delete':
            return 'text-red-600';
        default:
            return 'text-gray-600';
    }
};

export const getRelativeTime = (dateString: string): string => {
    const now = new Date();
    const activityDate = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - activityDate.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    
    return activityDate.toLocaleDateString();
};

export const getTableDisplayName = (tableName: string): string => {
    switch (tableName) {
        case 'document_locations':
            return 'Will Documents';
        case 'user_authorized_representatives':
            return 'Representatives';
        default:
            return tableName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
};