"use client";

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  CreditCard,
  Edit,
  MoreHorizontal, 
  CheckCircle,
  AlertCircle,
  History,
  Calendar,
  Banknote
} from "lucide-react";
import { useUserSession } from "@/app/utils/repo_services/hooks/useUserSession";
import { supabase } from "@/app/utils/supabase/client";
import { useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from 'date-fns';
import { toast } from "sonner";

interface Subscription {
  id: string;
  user_id: string;
  subscription_level: string;
  start_date: string;
  end_date: string;
  status: string;
  payment_status: string;
  payment_amount: number;
  payment_method: string;
  user_email?: string;
  user_name?: string;
}

export default function SubscriptionManagementPage() {
  const { isAdmin } = useUserSession();
  const router = useRouter();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [levelFilter, setLevelFilter] = useState('all');
  
  // Check for admin access
  useEffect(() => {
    if (!isAdmin) {
      router.push('/dashboard');
    }
  }, [isAdmin, router]);

  // Fetch subscriptions
  useEffect(() => {
    const fetchSubscriptions = async () => {
      setIsLoading(true);
      try {
        // Fetch subscriptions with user information
        const { data, error } = await supabase
          .from('user_subscription')
          .select(`
            *,
            users:user_id (
              email,
              firstname,
              lastname
            )
          `)
          .order('created_at', { ascending: false });

        if (error) {
          throw error;
        }

        // Process the data to include user email and name
        const processedSubscriptions = data?.map(subscription => ({
          ...subscription,
          user_email: subscription.users?.email || 'Unknown',
          user_name: subscription.users?.firstname && subscription.users?.lastname 
            ? `${subscription.users.firstname} ${subscription.users.lastname}`
            : 'Unknown User'
        }));

        setSubscriptions(processedSubscriptions || []);
      } catch (error) {
        console.error('Error fetching subscriptions:', error);
        toast.error('Failed to load subscriptions');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubscriptions();
  }, []);

  // Filter subscriptions based on search term and filters
  const filteredSubscriptions = subscriptions.filter(subscription => {
    const matchesSearch = 
      searchTerm === '' || 
      subscription.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subscription.user_name?.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesStatus = statusFilter === 'all' || subscription.status === statusFilter;
    const matchesLevel = levelFilter === 'all' || subscription.subscription_level === levelFilter;
    
    return matchesSearch && matchesStatus && matchesLevel;
  });

  // Format date
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return format(new Date(dateString), 'MMM d, yyyy');
  };

  // Get status badge variant
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500">Active</Badge>;
      case 'expired':
        return <Badge variant="destructive">Expired</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="border-amber-500 text-amber-500">Cancelled</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  // Get subscription level badge
  const getLevelBadge = (level: string) => {
    switch (level) {
      case 'bronze':
        return <Badge className="bg-amber-600">Bronze</Badge>;
      case 'silver':
        return <Badge className="bg-gray-400">Silver</Badge>;
      case 'gold':
        return <Badge className="bg-yellow-500">Gold</Badge>;
      default:
        return <Badge variant="outline">{level}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Subscription Management</h1>
        
        <Button className="ml-auto">
          <CreditCard className="mr-2 h-4 w-4" />
          Add Manual Subscription
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Subscriptions</CardTitle>
          <CardDescription>
            Manage and track user subscriptions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search subscribers..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <Select 
              value={statusFilter} 
              onValueChange={setStatusFilter}
            >
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Status</SelectLabel>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
            
            <Select 
              value={levelFilter} 
              onValueChange={setLevelFilter}
            >
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Level</SelectLabel>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="bronze">Bronze</SelectItem>
                  <SelectItem value="silver">Silver</SelectItem>
                  <SelectItem value="gold">Gold</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="flex items-center space-x-2">
                <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-primary"></div>
                <div>Loading subscriptions...</div>
              </div>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubscriptions.length > 0 ? (
                    filteredSubscriptions.map((subscription) => (
                      <TableRow key={subscription.id}>
                        <TableCell>
                          <div className="font-medium">
                            {subscription.user_name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {subscription.user_email}
                          </div>
                        </TableCell>
                        <TableCell>
                          {getLevelBadge(subscription.subscription_level)}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(subscription.status)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">
                              {formatDate(subscription.start_date)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">
                              {formatDate(subscription.end_date)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Banknote className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">
                              ${subscription.payment_amount?.toFixed(2) || '0.00'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Actions</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Subscription
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <History className="mr-2 h-4 w-4" />
                                View History
                              </DropdownMenuItem>
                              {subscription.status !== 'active' && (
                                <DropdownMenuItem>
                                  <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                                  Activate
                                </DropdownMenuItem>
                              )}
                              {subscription.status === 'active' && (
                                <DropdownMenuItem>
                                  <AlertCircle className="mr-2 h-4 w-4 text-amber-600" />
                                  Cancel
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center">
                        No subscriptions found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
