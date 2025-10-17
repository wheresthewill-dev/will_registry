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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Search, 
  FileText, 
  UserPlus,
  UserMinus,
  Edit,
  Trash2,
  MoreHorizontal,
  Download,
  Activity,
  Filter,
  UserCog
} from "lucide-react";
import { useUserSession } from "@/app/utils/repo_services/hooks/useUserSession";
import { supabase } from "@/app/utils/supabase/client";
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from "sonner";

interface ActivityLog {
  id: string;
  user_id: string;
  table_name: string;
  activity_type: string;
  description: string;
  created_at: string;
  user_email?: string;
  user_name?: string;
}

export default function ActivityLogsPage() {
  const { isAdmin } = useUserSession();
  const router = useRouter();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [tableFilter, setTableFilter] = useState('all');
  const [activityTypeFilter, setActivityTypeFilter] = useState('all');
  
  // Check for admin access
  useEffect(() => {
    if (!isAdmin) {
      router.push('/dashboard');
    }
  }, [isAdmin, router]);

  // Fetch activity logs
  useEffect(() => {
    const fetchLogs = async () => {
      setIsLoading(true);
      try {
        // Fetch all activity logs with user information
        const { data, error } = await supabase
          .from('recent_activities')
          .select(`
            *,
            users:user_id (
              email,
              firstname,
              lastname
            )
          `)
          .order('created_at', { ascending: false })
          .limit(100);

        if (error) {
          throw error;
        }

        // Process the data to include user email and name
        const processedLogs = data?.map(log => ({
          ...log,
          user_email: log.users?.email || 'Unknown',
          user_name: log.users?.firstname && log.users?.lastname 
            ? `${log.users.firstname} ${log.users.lastname}`
            : 'Unknown User'
        }));

        setLogs(processedLogs || []);
      } catch (error) {
        console.error('Error fetching activity logs:', error);
        toast.error('Failed to load activity logs');
      } finally {
        setIsLoading(false);
      }
    };

    fetchLogs();
  }, []);

  // Get unique table names and activity types for filtering
  const uniqueTables = ['all', ...new Set(logs.map(log => log.table_name))];
  const uniqueActivityTypes = ['all', ...new Set(logs.map(log => log.activity_type))];

  // Filter logs based on search term and selected filters
  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      searchTerm === '' || 
      log.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user_name?.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesTable = tableFilter === 'all' || log.table_name === tableFilter;
    const matchesActivityType = activityTypeFilter === 'all' || log.activity_type === activityTypeFilter;
    
    return matchesSearch && matchesTable && matchesActivityType;
  });

  // Get icon for activity type
  const getActivityIcon = (activity: ActivityLog) => {
    if (activity.table_name === 'document_locations') {
      switch (activity.activity_type) {
        case 'create': return <FileText className="h-4 w-4 text-blue-500" />;
        case 'update': return <Edit className="h-4 w-4 text-green-500" />;
        case 'delete': return <Trash2 className="h-4 w-4 text-red-500" />;
        default: return <Activity className="h-4 w-4 text-gray-500" />;
      }
    } else if (activity.table_name === 'user_authorized_representatives') {
      switch (activity.activity_type) {
        case 'create': return <UserPlus className="h-4 w-4 text-blue-500" />;
        case 'update': return <UserCog className="h-4 w-4 text-green-500" />;
        case 'delete': return <UserMinus className="h-4 w-4 text-red-500" />;
        default: return <Activity className="h-4 w-4 text-gray-500" />;
      }
    } else {
      return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  // Format the date
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM d, yyyy h:mm a');
  };

  // Format table name for display
  const formatTableName = (tableName: string) => {
    return tableName
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Format activity type for display
  const formatActivityType = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Activity Logs</h1>
        
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export Logs
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>System Activity</CardTitle>
          <CardDescription>
            Track and monitor all user and system activities.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search activities..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <Select 
              value={tableFilter}
              onValueChange={setTableFilter}
            >
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Table" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Tables</SelectLabel>
                  {uniqueTables.map(table => (
                    <SelectItem key={table} value={table}>
                      {table === 'all' ? 'All Tables' : formatTableName(table)}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            
            <Select 
              value={activityTypeFilter}
              onValueChange={setActivityTypeFilter}
            >
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Activity Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Activity Types</SelectLabel>
                  {uniqueActivityTypes.map(type => (
                    <SelectItem key={type} value={type}>
                      {type === 'all' ? 'All Types' : formatActivityType(type)}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="flex items-center space-x-2">
                <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-primary"></div>
                <div>Loading activity logs...</div>
              </div>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]"></TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Table</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.length > 0 ? (
                    filteredLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="py-2">
                          {getActivityIcon(log)}
                        </TableCell>
                        <TableCell className="py-2 max-w-[250px] truncate">
                          {log.description}
                        </TableCell>
                        <TableCell className="py-2">
                          {log.user_name}
                          <div className="text-xs text-muted-foreground">
                            {log.user_email}
                          </div>
                        </TableCell>
                        <TableCell className="py-2">
                          {formatTableName(log.table_name)}
                        </TableCell>
                        <TableCell className="py-2">
                          {formatActivityType(log.activity_type)}
                        </TableCell>
                        <TableCell className="py-2 whitespace-nowrap">
                          {formatDate(log.created_at)}
                        </TableCell>
                        <TableCell className="py-2 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem>View Details</DropdownMenuItem>
                              <DropdownMenuItem>View User Profile</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center">
                        No activity logs found.
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
