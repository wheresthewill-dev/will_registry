"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/app/utils/supabase/client';
import { toast } from 'sonner';
import { createAdminClient } from '@/app/utils/supabase/admin';

interface UserWithSubscription {
  id: string;
  firstname: string;
  lastname: string;
  email: string;
  role: string;
  created_at: string;
  last_login?: string;
  subscription?: {
    level: string;
    status: string;
    end_date: string;
  };
}

interface UserDetails {
  id: string;
  firstname: string;
  lastname: string;
  email: string;
  role: string;
  created_at: string;
  last_login?: string;
  username?: string;
  phone?: string;
  subscription?: {
    id: string;
    subscription_level: string;
    status: string;
    start_date: string;
    end_date: string;
    payment_amount: number;
    payment_method: string;
    payment_status: string;
  };
  profile?: {
    address_line1?: string;
    address_line2?: string;
    city?: string;
    state_province?: string;
    postal_code?: string;
    country?: string;
    dob?: string;
  };
  contacts?: Array<{
    id: string;
    name: string;
    email: string;
    phone: string;
    relationship: string;
  }>;
  documents?: Array<{
    id: string;
    name: string;
    type: string;
    created_at: string;
    size: number;
    location: string;
  }>;
}

interface UseUserManagementReturn {
  users: UserWithSubscription[];
  isLoading: boolean;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  roleFilter: string;
  setRoleFilter: (role: string) => void;
  filteredUsers: UserWithSubscription[];
  getUserDetails: (userId: string) => Promise<UserDetails | null>;
  refreshUsers: () => Promise<void>;
  updateUserRole: (userId: string, role: string) => Promise<boolean>;
  deleteUser: (userId: string) => Promise<boolean>;
}

// Create an admin Supabase client with service role key
// Note: This is safe in this context because:
// 1. The useUserManagement hook is only used in admin routes
// 2. We have server-side checks preventing non-admin users from accessing these routes
// 3. The entire hook focuses on admin-only operations
// 4. Next.js will not expose the environment variable to the client
const getAdminClient = async () => {
  // For non-admin operations or if we can't access the service role, fall back to regular client
  if (typeof window !== 'undefined' || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return supabase;
  }

  try {
    const adminClient = createAdminClient();
    return adminClient;
  } catch (error) {
    console.error('Failed to create admin client, falling back to regular client:', error);
    return supabase;
  }
};

export function useUserManagement(): UseUserManagementReturn {
  const [users, setUsers] = useState<UserWithSubscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  
  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      // Use the API endpoint to fetch users with their subscriptions
      const response = await fetch('/api/admin/users');
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch users');
      }
      
      const data = await response.json();
      
      if (!data.success || !data.users) {
        throw new Error('Invalid response from server');
      }
      
      setUsers(data.users);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
      
      // Fallback to direct Supabase query if API fails
      try {
        console.warn('API failed, falling back to direct query');
        await fetchUsersDirectQuery();
      } catch (fallbackError) {
        console.error('Fallback query also failed:', fallbackError);
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fallback: Direct query method if the API fails
  const fetchUsersDirectQuery = async () => {
    try {
      // Create admin client for privileged operations
      const adminClient = await getAdminClient();
      
      // Fetch users with their latest subscription
      const { data, error } = await adminClient
        .from('users')
        .select('*');

      if (error) {
        throw error;
      }

      // Define a default result in case the subscription query fails
      let usersWithSubscriptions = data?.map(user => ({
        ...user,
        subscription: undefined
      })) || [];

      try {
        // Get user subscription data - wrap in try/catch to handle schema issues
        const { data: subscriptionData, error: subscriptionError } = await adminClient
          .from('user_subscription')
          .select('*');
  
        if (!subscriptionError && subscriptionData) {
          // Map subscriptions to users
          usersWithSubscriptions = data?.map(user => {
            // Find the most recent subscription for this user
            const userSubscriptions = subscriptionData?.filter(sub => sub.user_id === user.id) || [];
            const latestSubscription = userSubscriptions.length > 0 
              ? userSubscriptions.sort((a, b) => 
                  new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                )[0]
              : null;
            
            return {
              ...user,
              subscription: latestSubscription ? {
                level: latestSubscription.subscription_level,
                status: latestSubscription.status,
                end_date: latestSubscription.end_date
              } : undefined
            };
          }) || [];
        }
      } catch (subscriptionError) {
        console.error('Error processing subscriptions:', subscriptionError);
        // Continue with users but without subscription data
      }

      setUsers(usersWithSubscriptions);
    } catch (error) {
      console.error('Error in fallback fetch users:', error);
      toast.error('Failed to load users');
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Filter users based on search and role
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      searchTerm === '' || 
      user.firstname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  // Get detailed user information via API
  const getUserDetails = async (userId: string): Promise<UserDetails | null> => {
    try {
      // Use API approach instead of direct client for security
      // This lets the server handle authentication and authorization
      const response = await fetch(`/api/admin/users/${userId}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch user details');
      }
      
      const data = await response.json();
      
      if (!data.success || !data.user) {
        throw new Error('Invalid response from server');
      }
      
      return {
        ...data.user,
        subscription: data.subscription,
        profile: data.profile,
        contacts: data.contacts || [],
        documents: data.documents || [],
        representatives: data.representatives || []
      };
    } catch (error) {
      console.error('Error fetching user details from API:', error);
      toast.error('Failed to load user details');
      
      // Fallback to direct Supabase query if API fails
      try {
        console.warn('API failed, falling back to direct query');
        return await getUserDetailsDirectQuery(userId);
      } catch (fallbackError) {
        console.error('Fallback query also failed:', fallbackError);
        return null;
      }
    }
  };
  
  // Fallback: Direct query method if the API fails
  const getUserDetailsDirectQuery = async (userId: string): Promise<UserDetails | null> => {
    try {
      // Create admin client for privileged operations
      const adminClient = await getAdminClient();
      
      // Fetch basic user information
      const { data: userData, error: userError } = await adminClient
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (userError) {
        throw userError;
      }

      // Fetch user subscription
      const { data: subscriptionData, error: subscriptionError } = await adminClient
        .from('user_subscription')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      // Fetch user profile if available
      const { data: profileData, error: profileError } = await adminClient
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      // Fetch user contacts
      const { data: contactsData, error: contactsError } = await adminClient
        .from('user_emergency_contacts')
        .select('*')
        .eq('user_id', userId);

      // Fetch user documents
      const { data: documentsData, error: documentsError } = await adminClient
        .from('document_locations')
        .select('*')
        .eq('user_id', userId);
        
      // Fetch user authorized representatives
      const { data: representativesData, error: representativesError } = await adminClient
        .from('user_authorized_representatives')
        .select('*')
        .eq('user_id', userId);

      console.log('Fetched user details via direct query:', {
        user: userData,
        subscription: subscriptionData,
        profile: profileData,
        contacts: contactsData,
        documents: documentsData,
        representatives: representativesData
      });
      
      return {
        ...userData,
        subscription: subscriptionError ? undefined : subscriptionData,
        profile: profileError ? undefined : profileData,
        contacts: contactsError ? [] : contactsData || [],
        documents: documentsError ? [] : documentsData || [],
        representatives: representativesError ? [] : representativesData || []
      };
    } catch (error) {
      console.error('Error fetching user details:', error);
      toast.error('Failed to load user details');
      return null;
    }
  };

  // Update user role
  const updateUserRole = async (userId: string, role: string): Promise<boolean> => {
    try {
      // Use the API endpoint to update user role
      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to update user role');
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error('Invalid response from server');
      }

      // Update user in local state
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId ? { ...user, role } : user
        )
      );

      toast.success('User role updated successfully');
      return true;
    } catch (error) {
      console.error('Error updating user role:', error);
      toast.error('Failed to update user role');
      
      // Fallback to direct Supabase query if API fails
      try {
        console.warn('API failed, falling back to direct query');
        return await updateUserRoleDirectQuery(userId, role);
      } catch (fallbackError) {
        console.error('Fallback query also failed:', fallbackError);
        return false;
      }
    }
  };
  
  // Fallback: Direct query method if the API fails
  const updateUserRoleDirectQuery = async (userId: string, role: string): Promise<boolean> => {
    try {
      // Create admin client for privileged operations
      const adminClient = await getAdminClient();
      
      const { error } = await adminClient
        .from('users')
        .update({ role })
        .eq('id', userId);

      if (error) {
        throw error;
      }

      // Update user in local state
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId ? { ...user, role } : user
        )
      );

      toast.success('User role updated successfully');
      return true;
    } catch (error) {
      console.error('Error in fallback update user role:', error);
      toast.error('Failed to update user role');
      return false;
    }
  };

  // Delete user
  const deleteUser = async (userId: string): Promise<boolean> => {
    try {
      // Use the API endpoint to delete user
      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to delete user');
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error('Invalid response from server');
      }

      // Remove user from local state
      setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));

      toast.success('User deleted successfully');
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
      
      // Fallback to direct Supabase query if API fails
      try {
        console.warn('API failed, falling back to direct query');
        return await deleteUserDirectQuery(userId);
      } catch (fallbackError) {
        console.error('Fallback query also failed:', fallbackError);
        return false;
      }
    }
  };
  
  // Fallback: Direct query method if the API fails
  const deleteUserDirectQuery = async (userId: string): Promise<boolean> => {
    try {
      // Create admin client for privileged operations
      const adminClient = await getAdminClient();
      
      const { error } = await adminClient
        .from('users')
        .delete()
        .eq('id', userId);

      if (error) {
        throw error;
      }

      // Remove user from local state
      setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));

      toast.success('User deleted successfully');
      return true;
    } catch (error) {
      console.error('Error in fallback delete user:', error);
      toast.error('Failed to delete user');
      return false;
    }
  };

  return {
    users,
    isLoading,
    searchTerm,
    setSearchTerm,
    roleFilter,
    setRoleFilter,
    filteredUsers,
    getUserDetails,
    refreshUsers: fetchUsers,
    updateUserRole,
    deleteUser
  };
}
