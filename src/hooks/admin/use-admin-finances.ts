"use client";

import { useState } from 'react';
import { supabase } from '@/app/utils/supabase/client';

// Define the finances data structure
export interface AdminFinancesData {
  // Summary statistics
  summary: {
    totalRevenue: number;
    transactionCount: number;
    avgTransactionValue: number;
    activeSubscriptionPlans: number;
    successfulTransactions: number;
    failedTransactions: number;
    pendingTransactions: number;
    currentMonthRevenue: number;
    previousMonthRevenue: number;
    revenueGrowth: number; // percentage
  };
  
  // Revenue over time
  revenueByMonth: {
    labels: string[];
    data: number[];
  };
  
  // Subscription plan distribution
  planDistribution: {
    labels: string[];
    data: number[];
    percentages: number[];
    revenue: number[];
  };
  
  // Payment status distribution
  paymentStatus: {
    labels: string[];
    data: number[];
    percentages: number[];
  };
  
  // Subscription plans detail
  subscriptionPlans: Array<{
    id: number;
    planLevel: string;
    name: string;
    description: string | null;
    price: number;
    currency: string;
    billingInterval: string;
    intervalCount: number;
    totalCycles: number;
    isRecurring: boolean;
    commitmentYears: number;
  }>;

  // Recent transactions
  recentTransactions: Array<{
    id: number;
    userId: number;
    transactionId: string;
    paymentMethod: string;
    amount: number;
    currency: string;
    subscriptionLevel: string;
    paymentStatus: string;
    processedAt: string;
    createdAt: string;
  }>;

  // Loading and error states
  loading: boolean;
  error: string | null;
  lastRefreshed: Date | null;
}

export const useAdminFinances = () => {
  const [financesData, setFinancesData] = useState<AdminFinancesData>({
    summary: {
      totalRevenue: 0,
      transactionCount: 0,
      avgTransactionValue: 0,
      activeSubscriptionPlans: 0,
      successfulTransactions: 0,
      failedTransactions: 0,
      pendingTransactions: 0,
      currentMonthRevenue: 0,
      previousMonthRevenue: 0,
      revenueGrowth: 0
    },
    revenueByMonth: {
      labels: [],
      data: []
    },
    planDistribution: {
      labels: [],
      data: [],
      percentages: [],
      revenue: []
    },
    paymentStatus: {
      labels: [],
      data: [],
      percentages: []
    },
    subscriptionPlans: [],
    recentTransactions: [],
    loading: true,
    error: null,
    lastRefreshed: null
  });

  // Fetch all finances data from the server API endpoint
  const fetchFinances = async () => {
    setFinancesData(prev => ({ ...prev, loading: true, error: null }));
    try {
      // Get the user's session for auth token
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Authentication required');
      }
      
      console.log('Fetching finances data with token:', session.access_token.substring(0, 10) + '...');
      
      // Call the server-side API with the user's token for authentication
      const response = await fetch('/api/admin/finances', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('API error response:', errorData);
        throw new Error(errorData.error || `Failed to fetch finances data: ${response.status} ${response.statusText}`);
      }
      
      const { data, lastRefreshed } = await response.json();
      
      // Update the finances data state with response from the server
      setFinancesData({
        ...data,
        loading: false,
        error: null,
        lastRefreshed: new Date(lastRefreshed)
      });
    } catch (error) {
      console.error('Error fetching finances data:', error);
      setFinancesData(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred'
      }));
    }
  };

  // Generate chart data objects for Chart.js
  const getChartData = (type: 'revenue' | 'plans' | 'paymentStatus') => {
    switch (type) {
      case 'revenue':
        return {
          labels: financesData.revenueByMonth.labels,
          datasets: [
            {
              label: 'Monthly Revenue',
              data: financesData.revenueByMonth.data,
              fill: false,
              borderColor: 'rgb(75, 192, 192)',
              backgroundColor: 'rgba(75, 192, 192, 0.2)',
              tension: 0.1
            }
          ]
        };
        
      case 'plans':
        return {
          labels: financesData.planDistribution.labels,
          datasets: [
            {
              label: 'Subscription Plans Distribution',
              data: financesData.planDistribution.data,
              backgroundColor: [
                'rgb(255, 205, 86)', // Bronze
                'rgb(201, 203, 207)', // Silver
                'rgb(255, 159, 64)', // Gold
                'rgb(153, 102, 255)' // Platinum
              ]
            }
          ]
        };
        
      case 'paymentStatus':
        return {
          labels: financesData.paymentStatus.labels,
          datasets: [
            {
              label: 'Payment Status Distribution',
              data: financesData.paymentStatus.data,
              backgroundColor: [
                'rgba(75, 192, 192, 0.6)', // Completed
                'rgba(255, 99, 132, 0.6)', // Failed
                'rgba(255, 206, 86, 0.6)' // Pending
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

  // Generate revenue by plan chart data
  const getRevenueByPlanData = () => {
    return {
      labels: financesData.planDistribution.labels,
      datasets: [
        {
          label: 'Revenue by Plan',
          data: financesData.planDistribution.revenue,
          backgroundColor: [
            'rgba(255, 205, 86, 0.6)', // Bronze
            'rgba(201, 203, 207, 0.6)', // Silver
            'rgba(255, 159, 64, 0.6)', // Gold
            'rgba(153, 102, 255, 0.6)' // Platinum
          ],
          borderColor: [
            'rgb(255, 205, 86)',
            'rgb(201, 203, 207)',
            'rgb(255, 159, 64)',
            'rgb(153, 102, 255)'
          ],
          borderWidth: 1
        }
      ]
    };
  };

  return {
    financesData,
    fetchFinances,
    getChartData,
    getRevenueByPlanData,
    isLoading: financesData.loading,
    error: financesData.error,
    lastRefreshed: financesData.lastRefreshed
  };
};
