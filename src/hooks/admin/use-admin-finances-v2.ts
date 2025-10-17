"use client";

import { useState, useCallback } from 'react';
import { supabase } from '@/app/utils/supabase/client';

// Define individual data structures for each finances section
export interface SummaryStats {
  totalRevenue: number;
  transactionCount: number;
  avgTransactionValue: number;
  activeSubscriptionPlans: number;
  successfulTransactions: number;
  failedTransactions: number;
  pendingTransactions: number;
  currentMonthRevenue: number;
  previousMonthRevenue: number;
  revenueGrowth: number;
}

export interface RevenueByMonthData {
  labels: string[];
  data: number[];
}

export interface PlanDistribution {
  labels: string[];
  data: number[];
  percentages: number[];
  revenue: number[];
}

export interface PaymentStatusData {
  labels: string[];
  data: number[];
  percentages: number[];
}

export interface SubscriptionPlan {
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
}

export interface Transaction {
  id: number;
  userId: number;
  userEmail?: string;
  transactionId: string;
  paymentMethod: string;
  amount: number;
  currency: string;
  subscriptionLevel: string;
  paymentStatus: string;
  processedAt: string;
  createdAt: string;
}

// Individual loading states for each data section
interface LoadingStates {
  summary: boolean;
  revenueByMonth: boolean;
  planDistribution: boolean;
  paymentStatus: boolean;
  subscriptionPlans: boolean;
  recentTransactions: boolean;
}

// Individual error states for each data section
interface ErrorStates {
  summary: string | null;
  revenueByMonth: string | null;
  planDistribution: string | null;
  paymentStatus: string | null;
  subscriptionPlans: string | null;
  recentTransactions: string | null;
}

export const useAdminFinancesV2 = () => {
  // Individual state for each data section
  const [summaryStats, setSummaryStats] = useState<SummaryStats>({
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
  });

  const [revenueByMonth, setRevenueByMonth] = useState<RevenueByMonthData>({
    labels: [],
    data: []
  });

  const [planDistribution, setPlanDistribution] = useState<PlanDistribution>({
    labels: [],
    data: [],
    percentages: [],
    revenue: []
  });

  const [paymentStatus, setPaymentStatus] = useState<PaymentStatusData>({
    labels: [],
    data: [],
    percentages: []
  });

  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);

  // Loading states
  const [loading, setLoading] = useState<LoadingStates>({
    summary: false,
    revenueByMonth: false,
    planDistribution: false,
    paymentStatus: false,
    subscriptionPlans: false,
    recentTransactions: false
  });

  // Error states
  const [errors, setErrors] = useState<ErrorStates>({
    summary: null,
    revenueByMonth: null,
    planDistribution: null,
    paymentStatus: null,
    subscriptionPlans: null,
    recentTransactions: null
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
    const response = await fetch(`/api/admin/finances/${endpoint}`, {
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

  // Fetch revenue by month
  const fetchRevenueByMonth = useCallback(async () => {
    setLoading(prev => ({ ...prev, revenueByMonth: true }));
    setErrors(prev => ({ ...prev, revenueByMonth: null }));
    try {
      const data = await fetchFromAPI('revenue-by-month');
      setRevenueByMonth(data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch revenue';
      setErrors(prev => ({ ...prev, revenueByMonth: errorMessage }));
      console.error('Error fetching revenue by month:', error);
    } finally {
      setLoading(prev => ({ ...prev, revenueByMonth: false }));
    }
  }, []);

  // Fetch plan distribution
  const fetchPlanDistribution = useCallback(async () => {
    setLoading(prev => ({ ...prev, planDistribution: true }));
    setErrors(prev => ({ ...prev, planDistribution: null }));
    try {
      const data = await fetchFromAPI('plan-distribution');
      setPlanDistribution(data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch plan distribution';
      setErrors(prev => ({ ...prev, planDistribution: errorMessage }));
      console.error('Error fetching plan distribution:', error);
    } finally {
      setLoading(prev => ({ ...prev, planDistribution: false }));
    }
  }, []);

  // Fetch payment status
  const fetchPaymentStatus = useCallback(async () => {
    setLoading(prev => ({ ...prev, paymentStatus: true }));
    setErrors(prev => ({ ...prev, paymentStatus: null }));
    try {
      const data = await fetchFromAPI('payment-status');
      setPaymentStatus(data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch payment status';
      setErrors(prev => ({ ...prev, paymentStatus: errorMessage }));
      console.error('Error fetching payment status:', error);
    } finally {
      setLoading(prev => ({ ...prev, paymentStatus: false }));
    }
  }, []);

  // Fetch subscription plans
  const fetchSubscriptionPlans = useCallback(async () => {
    setLoading(prev => ({ ...prev, subscriptionPlans: true }));
    setErrors(prev => ({ ...prev, subscriptionPlans: null }));
    try {
      const data = await fetchFromAPI('subscription-plans');
      setSubscriptionPlans(data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch subscription plans';
      setErrors(prev => ({ ...prev, subscriptionPlans: errorMessage }));
      console.error('Error fetching subscription plans:', error);
    } finally {
      setLoading(prev => ({ ...prev, subscriptionPlans: false }));
    }
  }, []);

  // Fetch recent transactions
  const fetchRecentTransactions = useCallback(async () => {
    setLoading(prev => ({ ...prev, recentTransactions: true }));
    setErrors(prev => ({ ...prev, recentTransactions: null }));
    try {
      const data = await fetchFromAPI('recent-transactions');
      setRecentTransactions(data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch recent transactions';
      setErrors(prev => ({ ...prev, recentTransactions: errorMessage }));
      console.error('Error fetching recent transactions:', error);
    } finally {
      setLoading(prev => ({ ...prev, recentTransactions: false }));
    }
  }, []);

  // Fetch all finances data
  const fetchAllFinances = useCallback(async () => {
    // Fetch all data in parallel for better performance
    await Promise.all([
      fetchSummary(),
      fetchRevenueByMonth(),
      fetchPlanDistribution(),
      fetchPaymentStatus(),
      fetchSubscriptionPlans(),
      fetchRecentTransactions()
    ]);
  }, [
    fetchSummary,
    fetchRevenueByMonth,
    fetchPlanDistribution,
    fetchPaymentStatus,
    fetchSubscriptionPlans,
    fetchRecentTransactions
  ]);

  // Generate chart data objects for Chart.js
  const getChartData = (type: 'revenue' | 'plans' | 'paymentStatus') => {
    switch (type) {
      case 'revenue':
        return {
          labels: revenueByMonth.labels,
          datasets: [
            {
              label: 'Monthly Revenue',
              data: revenueByMonth.data,
              fill: false,
              borderColor: 'rgb(75, 192, 192)',
              backgroundColor: 'rgba(75, 192, 192, 0.2)',
              tension: 0.1
            }
          ]
        };
        
      case 'plans':
        return {
          labels: planDistribution.labels,
          datasets: [
            {
              label: 'Subscription Plans Distribution',
              data: planDistribution.data,
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
          labels: paymentStatus.labels,
          datasets: [
            {
              label: 'Payment Status Distribution',
              data: paymentStatus.data,
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
      labels: planDistribution.labels,
      datasets: [
        {
          label: 'Revenue by Plan',
          data: planDistribution.revenue,
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
    // Data
    summaryStats,
    revenueByMonth,
    planDistribution,
    paymentStatus,
    subscriptionPlans,
    recentTransactions,
    
    // Loading states
    loading,
    
    // Error states
    errors,
    
    // Metadata
    lastRefreshed,
    
    // Fetch functions
    fetchSummary,
    fetchRevenueByMonth,
    fetchPlanDistribution,
    fetchPaymentStatus,
    fetchSubscriptionPlans,
    fetchRecentTransactions,
    fetchAllFinances,
    
    // Chart helpers
    getChartData,
    getRevenueByPlanData,
    
    // Computed states
    isAnyLoading: Object.values(loading).some(l => l),
    hasAnyError: Object.values(errors).some(e => e !== null)
  };
};
