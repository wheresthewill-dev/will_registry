"use client";

import { useState } from 'react';
import { supabase } from '@/app/utils/supabase/client';

// Define the analytics data structure
export interface AdminAnalyticsData {
  // Summary statistics
  summary: {
    totalUsers: number;
    activeSubscriptions: number;
    totalDocuments: number;
    totalEmergencyContacts: number;
    totalRepresentatives: number;
    recentLogins: number;
    recentlyCreatedUsers: number;
    recentActivities: number;
    averageDocumentsPerUser: number;
  };
  
  // Growth metrics over time
  userGrowth: {
    labels: string[];
    data: number[];
  };
  
  // Subscription distribution
  subscriptionDistribution: {
    labels: string[];
    data: number[];
    percentages: number[];
  };
  
  // Activity by day of week
  activityByDayOfWeek: {
    labels: string[];
    data: number[];
  };
  
  // Document types distribution
  documentTypes: {
    labels: string[];
    data: number[];
  };
  
  // User role distribution
  userRoles: {
    labels: string[];
    data: number[];
    percentages: number[];
  };

  // Emergency contacts per user
  emergencyContactsPerUser: {
    average: number;
    distribution: {
      labels: string[];
      data: number[];
    };
  };

  // Representatives per user
  representativesPerUser: {
    average: number;
    distribution: {
      labels: string[];
      data: number[];
    };
  };

  // Monthly statistics
  monthlyStats: {
    labels: string[];
    newUsers: number[];
    newDocuments: number[];
    newEmergencyContacts: number[];
    newRepresentatives: number[];
  };

  // Latest activities
  recentActivities: Array<{
    id: string;
    description: string;
    timestamp: string;
    type: string;
    tableName: string;
  }>;

  // Loading and error states
  loading: boolean;
  error: string | null;
  lastRefreshed: Date | null;
}

export const useAdminAnalytics = () => {
  const [analyticsData, setAnalyticsData] = useState<AdminAnalyticsData>({
    summary: {
      totalUsers: 0,
      activeSubscriptions: 0,
      totalDocuments: 0,
      totalEmergencyContacts: 0,
      totalRepresentatives: 0,
      recentLogins: 0,
      recentlyCreatedUsers: 0,
      recentActivities: 0,
      averageDocumentsPerUser: 0
    },
    userGrowth: {
      labels: [],
      data: []
    },
    subscriptionDistribution: {
      labels: [],
      data: [],
      percentages: []
    },
    activityByDayOfWeek: {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      data: [0, 0, 0, 0, 0, 0, 0]
    },
    documentTypes: {
      labels: [],
      data: []
    },
    userRoles: {
      labels: [],
      data: [],
      percentages: []
    },
    emergencyContactsPerUser: {
      average: 0,
      distribution: {
        labels: ['0', '1', '2', '3', '4', '5+'],
        data: [0, 0, 0, 0, 0, 0]
      }
    },
    representativesPerUser: {
      average: 0,
      distribution: {
        labels: ['0', '1', '2', '3', '4', '5+'],
        data: [0, 0, 0, 0, 0, 0]
      }
    },
    monthlyStats: {
      labels: [],
      newUsers: [],
      newDocuments: [],
      newEmergencyContacts: [],
      newRepresentatives: []
    },
    recentActivities: [],
    loading: true,
    error: null,
    lastRefreshed: null
  });

  // Fetch all analytics data from the server API endpoint
  const fetchAnalytics = async () => {
    setAnalyticsData(prev => ({ ...prev, loading: true, error: null }));
    try {
      // Get the user's session for auth token
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Authentication required');
      }
      
      console.log('Fetching analytics with token:', session.access_token.substring(0, 10) + '...');
      
      // Call the server-side API with the user's token for authentication
      const response = await fetch('/api/admin/analytics', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('API error response:', errorData);
        throw new Error(errorData.error || `Failed to fetch analytics data: ${response.status} ${response.statusText}`);
      }
      
      const { data, lastRefreshed } = await response.json();
      
      // Update the analytics data state with response from the server
      setAnalyticsData({
        ...data,
        loading: false,
        error: null,
        lastRefreshed: new Date(lastRefreshed)
      });
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      setAnalyticsData(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred'
      }));
    }
  };

  // Generate chart data objects for Chart.js
  const getChartData = (type: 'userGrowth' | 'subscriptions' | 'activity' | 'documentTypes' | 'roles') => {
    switch (type) {
      case 'userGrowth':
        return {
          labels: analyticsData.userGrowth.labels,
          datasets: [
            {
              label: 'New Users',
              data: analyticsData.userGrowth.data,
              fill: false,
              borderColor: 'rgb(75, 192, 192)',
              backgroundColor: 'rgba(75, 192, 192, 0.2)',
              tension: 0.1
            }
          ]
        };
        
      case 'subscriptions':
        return {
          labels: analyticsData.subscriptionDistribution.labels,
          datasets: [
            {
              label: 'Subscription Distribution',
              data: analyticsData.subscriptionDistribution.data,
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
          labels: analyticsData.activityByDayOfWeek.labels,
          datasets: [
            {
              label: 'Activities by Day of Week',
              data: analyticsData.activityByDayOfWeek.data,
              backgroundColor: 'rgba(54, 162, 235, 0.5)'
            }
          ]
        };
        
      case 'documentTypes':
        return {
          labels: analyticsData.documentTypes.labels,
          datasets: [
            {
              label: 'Document Types',
              data: analyticsData.documentTypes.data,
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
          labels: analyticsData.userRoles.labels,
          datasets: [
            {
              label: 'User Roles',
              data: analyticsData.userRoles.data,
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
      labels: analyticsData.monthlyStats.labels,
      datasets: [
        {
          label: 'New Users',
          data: analyticsData.monthlyStats.newUsers,
          backgroundColor: 'rgba(54, 162, 235, 0.5)',
          borderColor: 'rgb(54, 162, 235)',
          borderWidth: 1
        },
        {
          label: 'New Documents',
          data: analyticsData.monthlyStats.newDocuments,
          backgroundColor: 'rgba(255, 99, 132, 0.5)',
          borderColor: 'rgb(255, 99, 132)',
          borderWidth: 1
        },
        {
          label: 'New Emergency Contacts',
          data: analyticsData.monthlyStats.newEmergencyContacts,
          backgroundColor: 'rgba(255, 206, 86, 0.5)',
          borderColor: 'rgb(255, 206, 86)',
          borderWidth: 1
        },
        {
          label: 'New Representatives',
          data: analyticsData.monthlyStats.newRepresentatives,
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
      ? analyticsData.emergencyContactsPerUser.distribution
      : analyticsData.representativesPerUser.distribution;
      
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

  // Helper function to check database tables for debugging
  const checkDatabaseTables = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Authentication required');
      }
      
      const response = await fetch('/api/admin/analytics/check-tables', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Table check error:', errorData);
        return { error: errorData.error || 'Failed to check tables', data: null };
      }
      
      const data = await response.json();
      console.log('Database table check results:', data);
      return { error: null, data };
    } catch (error) {
      console.error('Error checking database tables:', error);
      return { 
        error: error instanceof Error ? error.message : 'An unexpected error occurred', 
        data: null 
      };
    }
  };

  return {
    analyticsData,
    fetchAnalytics,
    checkDatabaseTables, // Add the new function
    getChartData,
    getMonthlyComparisonData,
    getDistributionData,
    isLoading: analyticsData.loading,
    error: analyticsData.error,
    lastRefreshed: analyticsData.lastRefreshed
  };
};
