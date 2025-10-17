"use client";

import { useState, useCallback } from 'react';
import { supabase } from '@/app/utils/supabase/client';

// Define individual data structures for each analytics section
export interface SummaryStats {
  totalUsers: number;
  activeSubscriptions: number;
  totalDocuments: number;
  totalEmergencyContacts: number;
  totalRepresentatives: number;
  recentLogins: number;
  recentlyCreatedUsers: number;
  recentActivities: number;
  averageDocumentsPerUser: number;
}

export interface UserGrowthData {
  labels: string[];
  data: number[];
}

export interface SubscriptionDistribution {
  labels: string[];
  data: number[];
  percentages: number[];
}

export interface ActivityByDayData {
  labels: string[];
  data: number[];
}

export interface DocumentTypesData {
  labels: string[];
  data: number[];
}

export interface UserRolesData {
  labels: string[];
  data: number[];
  percentages: number[];
}

export interface DistributionData {
  average: number;
  distribution: {
    labels: string[];
    data: number[];
  };
}

export interface MonthlyStatsData {
  labels: string[];
  newUsers: number[];
  newDocuments: number[];
  newEmergencyContacts: number[];
  newRepresentatives: number[];
}

export interface RecentActivity {
  id: string;
  description: string;
  timestamp: string;
  type: string;
  tableName: string;
}

// Individual loading states for each data section
interface LoadingStates {
  summary: boolean;
  userGrowth: boolean;
  subscriptions: boolean;
  activity: boolean;
  documentTypes: boolean;
  userRoles: boolean;
  emergencyContacts: boolean;
  representatives: boolean;
  monthlyStats: boolean;
  recentActivities: boolean;
}

// Individual error states for each data section
interface ErrorStates {
  summary: string | null;
  userGrowth: string | null;
  subscriptions: string | null;
  activity: string | null;
  documentTypes: string | null;
  userRoles: string | null;
  emergencyContacts: string | null;
  representatives: string | null;
  monthlyStats: string | null;
  recentActivities: string | null;
}

export const useAdminAnalyticsV2 = () => {
  // Individual state for each data section
  const [summaryStats, setSummaryStats] = useState<SummaryStats>({
    totalUsers: 0,
    activeSubscriptions: 0,
    totalDocuments: 0,
    totalEmergencyContacts: 0,
    totalRepresentatives: 0,
    recentLogins: 0,
    recentlyCreatedUsers: 0,
    recentActivities: 0,
    averageDocumentsPerUser: 0
  });

  const [userGrowth, setUserGrowth] = useState<UserGrowthData>({
    labels: [],
    data: []
  });

  const [subscriptionDistribution, setSubscriptionDistribution] = useState<SubscriptionDistribution>({
    labels: [],
    data: [],
    percentages: []
  });

  const [activityByDay, setActivityByDay] = useState<ActivityByDayData>({
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    data: [0, 0, 0, 0, 0, 0, 0]
  });

  const [documentTypes, setDocumentTypes] = useState<DocumentTypesData>({
    labels: [],
    data: []
  });

  const [userRoles, setUserRoles] = useState<UserRolesData>({
    labels: [],
    data: [],
    percentages: []
  });

  const [emergencyContactsDistribution, setEmergencyContactsDistribution] = useState<DistributionData>({
    average: 0,
    distribution: {
      labels: ['0', '1', '2', '3', '4', '5+'],
      data: [0, 0, 0, 0, 0, 0]
    }
  });

  const [representativesDistribution, setRepresentativesDistribution] = useState<DistributionData>({
    average: 0,
    distribution: {
      labels: ['0', '1', '2', '3', '4', '5+'],
      data: [0, 0, 0, 0, 0, 0]
    }
  });

  const [monthlyStats, setMonthlyStats] = useState<MonthlyStatsData>({
    labels: [],
    newUsers: [],
    newDocuments: [],
    newEmergencyContacts: [],
    newRepresentatives: []
  });

  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);

  // Loading states
  const [loading, setLoading] = useState<LoadingStates>({
    summary: false,
    userGrowth: false,
    subscriptions: false,
    activity: false,
    documentTypes: false,
    userRoles: false,
    emergencyContacts: false,
    representatives: false,
    monthlyStats: false,
    recentActivities: false
  });

  // Error states
  const [errors, setErrors] = useState<ErrorStates>({
    summary: null,
    userGrowth: null,
    subscriptions: null,
    activity: null,
    documentTypes: null,
    userRoles: null,
    emergencyContacts: null,
    representatives: null,
    monthlyStats: null,
    recentActivities: null
  });

  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  // Helper to get auth token
  const getAuthToken = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('Authentication required');
    }
    return session.access_token;
  };

  // Helper to make authenticated API calls
  const fetchFromAPI = async (endpoint: string) => {
    const token = await getAuthToken();
    const response = await fetch(`/api/admin/analytics/${endpoint}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Failed to fetch ${endpoint}`);
    }

    return response.json();
  };

  // Fetch summary statistics
  const fetchSummary = useCallback(async () => {
    setLoading(prev => ({ ...prev, summary: true }));
    setErrors(prev => ({ ...prev, summary: null }));
    try {
      const data = await fetchFromAPI('summary');
      setSummaryStats(data);
      setLastRefreshed(new Date());
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch summary';
      setErrors(prev => ({ ...prev, summary: errorMessage }));
      console.error('Error fetching summary:', error);
    } finally {
      setLoading(prev => ({ ...prev, summary: false }));
    }
  }, []);

  // Fetch user growth data
  const fetchUserGrowth = useCallback(async () => {
    setLoading(prev => ({ ...prev, userGrowth: true }));
    setErrors(prev => ({ ...prev, userGrowth: null }));
    try {
      const data = await fetchFromAPI('user-growth');
      setUserGrowth(data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch user growth';
      setErrors(prev => ({ ...prev, userGrowth: errorMessage }));
      console.error('Error fetching user growth:', error);
    } finally {
      setLoading(prev => ({ ...prev, userGrowth: false }));
    }
  }, []);

  // Fetch subscription distribution
  const fetchSubscriptions = useCallback(async () => {
    setLoading(prev => ({ ...prev, subscriptions: true }));
    setErrors(prev => ({ ...prev, subscriptions: null }));
    try {
      const data = await fetchFromAPI('subscriptions');
      setSubscriptionDistribution(data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch subscriptions';
      setErrors(prev => ({ ...prev, subscriptions: errorMessage }));
      console.error('Error fetching subscriptions:', error);
    } finally {
      setLoading(prev => ({ ...prev, subscriptions: false }));
    }
  }, []);

  // Fetch activity by day
  const fetchActivity = useCallback(async () => {
    setLoading(prev => ({ ...prev, activity: true }));
    setErrors(prev => ({ ...prev, activity: null }));
    try {
      const data = await fetchFromAPI('activity');
      setActivityByDay(data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch activity';
      setErrors(prev => ({ ...prev, activity: errorMessage }));
      console.error('Error fetching activity:', error);
    } finally {
      setLoading(prev => ({ ...prev, activity: false }));
    }
  }, []);

  // Fetch document types
  const fetchDocumentTypes = useCallback(async () => {
    setLoading(prev => ({ ...prev, documentTypes: true }));
    setErrors(prev => ({ ...prev, documentTypes: null }));
    try {
      const data = await fetchFromAPI('document-types');
      setDocumentTypes(data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch document types';
      setErrors(prev => ({ ...prev, documentTypes: errorMessage }));
      console.error('Error fetching document types:', error);
    } finally {
      setLoading(prev => ({ ...prev, documentTypes: false }));
    }
  }, []);

  // Fetch user roles
  const fetchUserRoles = useCallback(async () => {
    setLoading(prev => ({ ...prev, userRoles: true }));
    setErrors(prev => ({ ...prev, userRoles: null }));
    try {
      const data = await fetchFromAPI('user-roles');
      setUserRoles(data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch user roles';
      setErrors(prev => ({ ...prev, userRoles: errorMessage }));
      console.error('Error fetching user roles:', error);
    } finally {
      setLoading(prev => ({ ...prev, userRoles: false }));
    }
  }, []);

  // Fetch emergency contacts distribution
  const fetchEmergencyContacts = useCallback(async () => {
    setLoading(prev => ({ ...prev, emergencyContacts: true }));
    setErrors(prev => ({ ...prev, emergencyContacts: null }));
    try {
      const data = await fetchFromAPI('emergency-contacts');
      setEmergencyContactsDistribution(data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch emergency contacts';
      setErrors(prev => ({ ...prev, emergencyContacts: errorMessage }));
      console.error('Error fetching emergency contacts:', error);
    } finally {
      setLoading(prev => ({ ...prev, emergencyContacts: false }));
    }
  }, []);

  // Fetch representatives distribution
  const fetchRepresentatives = useCallback(async () => {
    setLoading(prev => ({ ...prev, representatives: true }));
    setErrors(prev => ({ ...prev, representatives: null }));
    try {
      const data = await fetchFromAPI('representatives');
      setRepresentativesDistribution(data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch representatives';
      setErrors(prev => ({ ...prev, representatives: errorMessage }));
      console.error('Error fetching representatives:', error);
    } finally {
      setLoading(prev => ({ ...prev, representatives: false }));
    }
  }, []);

  // Fetch monthly statistics
  const fetchMonthlyStats = useCallback(async () => {
    setLoading(prev => ({ ...prev, monthlyStats: true }));
    setErrors(prev => ({ ...prev, monthlyStats: null }));
    try {
      const data = await fetchFromAPI('monthly-stats');
      setMonthlyStats(data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch monthly stats';
      setErrors(prev => ({ ...prev, monthlyStats: errorMessage }));
      console.error('Error fetching monthly stats:', error);
    } finally {
      setLoading(prev => ({ ...prev, monthlyStats: false }));
    }
  }, []);

  // Fetch recent activities
  const fetchRecentActivities = useCallback(async () => {
    setLoading(prev => ({ ...prev, recentActivities: true }));
    setErrors(prev => ({ ...prev, recentActivities: null }));
    try {
      const data = await fetchFromAPI('recent-activities');
      setRecentActivities(data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch recent activities';
      setErrors(prev => ({ ...prev, recentActivities: errorMessage }));
      console.error('Error fetching recent activities:', error);
    } finally {
      setLoading(prev => ({ ...prev, recentActivities: false }));
    }
  }, []);

  // Fetch all analytics data
  const fetchAllAnalytics = useCallback(async () => {
    // Fetch all data in parallel for better performance
    await Promise.all([
      fetchSummary(),
      fetchUserGrowth(),
      fetchSubscriptions(),
      fetchActivity(),
      fetchDocumentTypes(),
      fetchUserRoles(),
      fetchEmergencyContacts(),
      fetchRepresentatives(),
      fetchMonthlyStats(),
      fetchRecentActivities()
    ]);
  }, [
    fetchSummary,
    fetchUserGrowth,
    fetchSubscriptions,
    fetchActivity,
    fetchDocumentTypes,
    fetchUserRoles,
    fetchEmergencyContacts,
    fetchRepresentatives,
    fetchMonthlyStats,
    fetchRecentActivities
  ]);

  // Generate chart data objects for Chart.js
  const getChartData = (type: 'userGrowth' | 'subscriptions' | 'activity' | 'documentTypes' | 'roles') => {
    switch (type) {
      case 'userGrowth':
        return {
          labels: userGrowth.labels,
          datasets: [
            {
              label: 'New Users',
              data: userGrowth.data,
              fill: false,
              borderColor: 'rgb(75, 192, 192)',
              backgroundColor: 'rgba(75, 192, 192, 0.2)',
              tension: 0.1
            }
          ]
        };
        
      case 'subscriptions':
        return {
          labels: subscriptionDistribution.labels,
          datasets: [
            {
              label: 'Subscription Distribution',
              data: subscriptionDistribution.data,
              backgroundColor: [
                'rgb(255, 205, 86)', // Bronze
                'rgb(201, 203, 207)', // Silver
                'rgb(255, 159, 64)', // Gold
                'rgb(153, 102, 255)' // Platinum
              ]
            }
          ]
        };
        
      case 'activity':
        return {
          labels: activityByDay.labels,
          datasets: [
            {
              label: 'Activities by Day of Week',
              data: activityByDay.data,
              backgroundColor: 'rgba(54, 162, 235, 0.5)'
            }
          ]
        };
        
      case 'documentTypes':
        return {
          labels: documentTypes.labels,
          datasets: [
            {
              label: 'Document Types',
              data: documentTypes.data,
              backgroundColor: [
                'rgba(255, 99, 132, 0.6)',
                'rgba(54, 162, 235, 0.6)',
                'rgba(255, 206, 86, 0.6)',
                'rgba(75, 192, 192, 0.6)',
                'rgba(153, 102, 255, 0.6)',
                'rgba(255, 159, 64, 0.6)',
                'rgba(199, 199, 199, 0.6)'
              ]
            }
          ]
        };
        
      case 'roles':
        return {
          labels: userRoles.labels,
          datasets: [
            {
              label: 'User Roles',
              data: userRoles.data,
              backgroundColor: [
                'rgba(54, 162, 235, 0.6)',
                'rgba(255, 99, 132, 0.6)',
                'rgba(255, 206, 86, 0.6)',
                'rgba(75, 192, 192, 0.6)'
              ]
            }
          ]
        };
        
      default:
        return {
          labels: [],
          datasets: []
        };
    }
  };

  // Generate monthly comparison chart data
  const getMonthlyComparisonData = () => {
    return {
      labels: monthlyStats.labels,
      datasets: [
        {
          label: 'New Users',
          data: monthlyStats.newUsers,
          backgroundColor: 'rgba(54, 162, 235, 0.5)',
          borderColor: 'rgb(54, 162, 235)',
          borderWidth: 1
        },
        {
          label: 'New Documents',
          data: monthlyStats.newDocuments,
          backgroundColor: 'rgba(255, 99, 132, 0.5)',
          borderColor: 'rgb(255, 99, 132)',
          borderWidth: 1
        },
        {
          label: 'New Emergency Contacts',
          data: monthlyStats.newEmergencyContacts,
          backgroundColor: 'rgba(255, 206, 86, 0.5)',
          borderColor: 'rgb(255, 206, 86)',
          borderWidth: 1
        },
        {
          label: 'New Representatives',
          data: monthlyStats.newRepresentatives,
          backgroundColor: 'rgba(75, 192, 192, 0.5)',
          borderColor: 'rgb(75, 192, 192)',
          borderWidth: 1
        }
      ]
    };
  };

  // Generate contacts/representatives distribution data
  const getDistributionData = (type: 'contacts' | 'representatives') => {
    const data = type === 'contacts' 
      ? emergencyContactsDistribution.distribution
      : representativesDistribution.distribution;
      
    return {
      labels: data.labels,
      datasets: [
        {
          label: type === 'contacts' ? 'Emergency Contacts per User' : 'Representatives per User',
          data: data.data,
          backgroundColor: type === 'contacts' 
            ? 'rgba(255, 159, 64, 0.5)'
            : 'rgba(153, 102, 255, 0.5)',
          borderColor: type === 'contacts'
            ? 'rgb(255, 159, 64)'
            : 'rgb(153, 102, 255)',
          borderWidth: 1
        }
      ]
    };
  };

  return {
    // Data
    summaryStats,
    userGrowth,
    subscriptionDistribution,
    activityByDay,
    documentTypes,
    userRoles,
    emergencyContactsDistribution,
    representativesDistribution,
    monthlyStats,
    recentActivities,
    
    // Loading states
    loading,
    
    // Error states
    errors,
    
    // Metadata
    lastRefreshed,
    
    // Fetch functions
    fetchSummary,
    fetchUserGrowth,
    fetchSubscriptions,
    fetchActivity,
    fetchDocumentTypes,
    fetchUserRoles,
    fetchEmergencyContacts,
    fetchRepresentatives,
    fetchMonthlyStats,
    fetchRecentActivities,
    fetchAllAnalytics,
    
    // Chart helpers
    getChartData,
    getMonthlyComparisonData,
    getDistributionData,
    
    // Computed states
    isAnyLoading: Object.values(loading).some(l => l),
    hasAnyError: Object.values(errors).some(e => e !== null)
  };
};
