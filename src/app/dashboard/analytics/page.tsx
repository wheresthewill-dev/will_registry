"use client";

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUserSession } from "@/app/utils/repo_services/hooks/useUserSession";
import { useRouter } from 'next/navigation';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend 
} from 'chart.js';
import { Button } from '@/components/ui/button';
import { 
  CalendarIcon, 
  Download, 
  ArrowDownUp, 
  Users, 
  Landmark, 
  FileText, 
  Bell, 
  Contact, 
  UserCheck, 
  RefreshCw,
  Clock,
  Activity,
  AlertCircle
} from 'lucide-react';
import { useAdminAnalyticsV2 } from '@/hooks/admin/use-admin-analytics-v2';
import { Alert, AlertDescription } from "@/components/ui/alert";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

// Skeleton for stats cards
const StatCardSkeleton = () => (
  <Card>
    <CardContent className="p-6">
      <div className="flex justify-between items-center">
        <div className="flex-1">
          <Skeleton className="h-4 w-28 mb-2" />
          <Skeleton className="h-8 w-20" />
        </div>
        <Skeleton className="h-10 w-10 rounded-full" />
      </div>
      <div className="mt-4">
        <Skeleton className="h-3 w-32" />
      </div>
    </CardContent>
  </Card>
);

// Skeleton for chart cards
const ChartCardSkeleton = ({ title, description }: { title: string; description: string }) => (
  <Card>
    <CardHeader>
      <CardTitle>{title}</CardTitle>
      <CardDescription>{description}</CardDescription>
    </CardHeader>
    <CardContent>
      <Skeleton className="h-80 w-full" />
    </CardContent>
    <CardFooter>
      <Skeleton className="h-4 w-56" />
    </CardFooter>
  </Card>
);

// Error display for failed data loads
const ErrorDisplay = ({ error, onRetry }: { error: string; onRetry: () => void }) => (
  <Alert variant="destructive">
    <AlertCircle className="h-4 w-4" />
    <AlertDescription className="flex items-center justify-between">
      <span>{error}</span>
      <Button variant="outline" size="sm" onClick={onRetry}>
        <RefreshCw className="h-3 w-3 mr-1" />
        Retry
      </Button>
    </AlertDescription>
  </Alert>
);

export default function AnalyticsPageV2() {
  const { isAdmin, userLoading: loading } = useUserSession();
  const router = useRouter();
  const { 
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
    loading: loadingStates,
    errors,
    lastRefreshed,
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
    getChartData,
    getMonthlyComparisonData,
    getDistributionData,
  } = useAdminAnalyticsV2();
  
  // Pagination state for recent activities
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(5);
  
  // Calculate pagination values
  const totalActivities = recentActivities.length;
  const totalPages = Math.max(1, Math.ceil(totalActivities / itemsPerPage));
  
  // Reset page if we exceed the max pages after data update
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [recentActivities, totalPages, currentPage]);
  
  // Get current activities for the selected page
  const paginatedActivities = recentActivities.slice(
    (currentPage - 1) * itemsPerPage, 
    currentPage * itemsPerPage
  );
  
  // Check for admin access
  useEffect(() => {
    if (!loading && !isAdmin) {
      router.push('/dashboard');
    }
  }, [isAdmin, router, loading]); 

  // Fetch analytics data on mount
  useEffect(() => {
    fetchAllAnalytics();
  }, []);

  // Format the last refresh time
  const getFormattedRefreshTime = () => {
    if (!lastRefreshed) return 'Never';
    return lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Generate array of page numbers for pagination
  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1 flex items-center">
            <Clock className="h-3.5 w-3.5 mr-1" />
            Last updated: {getFormattedRefreshTime()}
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => fetchAllAnalytics()}
            disabled={loadingStates.summary}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${loadingStates.summary ? 'animate-spin' : ''}`} />
            Refresh Data
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Summary error display */}
      {errors.summary && (
        <ErrorDisplay error={errors.summary} onRetry={fetchSummary} />
      )}

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {loadingStates.summary ? (
          // Show skeletons while loading
          <>
            {[...Array(7)].map((_, i) => (
              <StatCardSkeleton key={i} />
            ))}
          </>
        ) : (
          <>
            <Card>
              <CardContent className="p-6">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Users</p>
                    <p className="text-3xl font-bold">{summaryStats.totalUsers}</p>
                  </div>
                  <div className="p-2 rounded-full bg-blue-100">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <div className="flex items-center mt-4 text-xs text-muted-foreground">
                  <ArrowDownUp className="h-3 w-3 mr-1" />
                  <span>{summaryStats.recentlyCreatedUsers} new in last week</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-muted-foreground">Active Subscriptions</p>
                    <p className="text-3xl font-bold">{summaryStats.activeSubscriptions}</p>
                  </div>
                  <div className="p-2 rounded-full bg-green-100">
                    <Landmark className="h-6 w-6 text-green-600" />
                  </div>
                </div>
                <div className="flex items-center mt-4 text-xs text-muted-foreground">
                  <ArrowDownUp className="h-3 w-3 mr-1" />
                  <span>
                    {summaryStats.totalUsers > 0 
                      ? (summaryStats.activeSubscriptions / summaryStats.totalUsers * 100).toFixed(1) 
                      : 0}% subscription rate
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Documents</p>
                    <p className="text-3xl font-bold">{summaryStats.totalDocuments}</p>
                  </div>
                  <div className="p-2 rounded-full bg-yellow-100">
                    <FileText className="h-6 w-6 text-yellow-600" />
                  </div>
                </div>
                <div className="flex items-center mt-4 text-xs text-muted-foreground">
                  <ArrowDownUp className="h-3 w-3 mr-1" />
                  <span>~{summaryStats.averageDocumentsPerUser.toFixed(1)} docs per user</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-muted-foreground">Emergency Contacts</p>
                    <p className="text-3xl font-bold">{summaryStats.totalEmergencyContacts}</p>
                  </div>
                  <div className="p-2 rounded-full bg-purple-100">
                    <Contact className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
                <div className="flex items-center mt-4 text-xs text-muted-foreground">
                  <CalendarIcon className="h-3 w-3 mr-1" />
                  <span>
                    {loadingStates.emergencyContacts ? (
                      <Skeleton className="h-3 w-16 inline-block" />
                    ) : (
                      `~${emergencyContactsDistribution.average.toFixed(1)} per user`
                    )}
                  </span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-muted-foreground">Representatives</p>
                    <p className="text-3xl font-bold">{summaryStats.totalRepresentatives}</p>
                  </div>
                  <div className="p-2 rounded-full bg-orange-100">
                    <UserCheck className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
                <div className="flex items-center mt-4 text-xs text-muted-foreground">
                  <CalendarIcon className="h-3 w-3 mr-1" />
                  <span>
                    {loadingStates.representatives ? (
                      <Skeleton className="h-3 w-16 inline-block" />
                    ) : (
                      `~${representativesDistribution.average.toFixed(1)} per user`
                    )}
                  </span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-muted-foreground">Recent Logins (24h)</p>
                    <p className="text-3xl font-bold">{summaryStats.recentLogins}</p>
                  </div>
                  <div className="p-2 rounded-full bg-blue-100">
                    <Bell className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <div className="flex items-center mt-4 text-xs text-muted-foreground">
                  <CalendarIcon className="h-3 w-3 mr-1" />
                  <span>Last 24 hours</span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-muted-foreground">Monthly Activities</p>
                    <p className="text-3xl font-bold">{summaryStats.recentActivities}</p>
                  </div>
                  <div className="p-2 rounded-full bg-green-100">
                    <Activity className="h-6 w-6 text-green-600" />
                  </div>
                </div>
                <div className="flex items-center mt-4 text-xs text-muted-foreground">
                  <CalendarIcon className="h-3 w-3 mr-1" />
                  <span>Last 30 days</span>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Charts */}
      <Tabs defaultValue="growth">
        <TabsList className="grid w-full grid-cols-4 mb-4">
          <TabsTrigger value="growth">User Growth</TabsTrigger>
          <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>
        
        <TabsContent value="growth">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {errors.userGrowth && (
              <div className="col-span-full">
                <ErrorDisplay error={errors.userGrowth} onRetry={fetchUserGrowth} />
              </div>
            )}
            {errors.userRoles && (
              <div className="col-span-full">
                <ErrorDisplay error={errors.userRoles} onRetry={fetchUserRoles} />
              </div>
            )}
            
            {loadingStates.userGrowth ? (
              <ChartCardSkeleton 
                title="User Growth" 
                description="New user registrations over time" 
              />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>User Growth</CardTitle>
                  <CardDescription>New user registrations over time</CardDescription>
                </CardHeader>
                <CardContent className="px-2">
                  <div className="h-80 w-full">
                    <Line 
                      data={getChartData('userGrowth')}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                      }}
                    />
                  </div>
                </CardContent>
                <CardFooter className="text-sm text-muted-foreground">
                  {lastRefreshed ? `Last updated: ${lastRefreshed.toLocaleString()}` : 'Refreshing data...'}
                </CardFooter>
              </Card>
            )}
            
            {loadingStates.userRoles ? (
              <ChartCardSkeleton 
                title="User Roles Distribution" 
                description="Breakdown of users by role" 
              />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>User Roles Distribution</CardTitle>
                  <CardDescription>Breakdown of users by role</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80 w-full flex items-center justify-center">
                    <div className="h-64 w-64">
                      <Doughnut 
                        data={getChartData('roles')}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                        }}
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="text-sm text-muted-foreground">
                  {lastRefreshed ? `Last updated: ${lastRefreshed.toLocaleString()}` : 'Refreshing data...'}
                </CardFooter>
              </Card>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="subscriptions">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {errors.subscriptions && (
              <div className="col-span-full">
                <ErrorDisplay error={errors.subscriptions} onRetry={fetchSubscriptions} />
              </div>
            )}
            {errors.monthlyStats && (
              <div className="col-span-full">
                <ErrorDisplay error={errors.monthlyStats} onRetry={fetchMonthlyStats} />
              </div>
            )}
            
            {loadingStates.subscriptions ? (
              <ChartCardSkeleton 
                title="Subscription Distribution" 
                description="Breakdown of active subscription tiers" 
              />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Subscription Distribution</CardTitle>
                  <CardDescription>Breakdown of active subscription tiers</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80 w-full flex items-center justify-center">
                    <div className="h-64 w-64">
                      <Doughnut 
                        data={getChartData('subscriptions')}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                        }}
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="text-sm text-muted-foreground">
                  {lastRefreshed ? `Last updated: ${lastRefreshed.toLocaleString()}` : 'Refreshing data...'}
                </CardFooter>
              </Card>
            )}
            
            {loadingStates.monthlyStats ? (
              <ChartCardSkeleton 
                title="Monthly Comparison" 
                description="New entities over recent months" 
              />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Comparison</CardTitle>
                  <CardDescription>New entities over recent months</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80 w-full">
                    <Bar 
                      data={getMonthlyComparisonData()}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                      }}
                    />
                  </div>
                </CardContent>
                <CardFooter className="text-sm text-muted-foreground">
                  {lastRefreshed ? `Last updated: ${lastRefreshed.toLocaleString()}` : 'Refreshing data...'}
                </CardFooter>
              </Card>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="activity">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {errors.activity && (
              <div className="col-span-full">
                <ErrorDisplay error={errors.activity} onRetry={fetchActivity} />
              </div>
            )}
            {errors.emergencyContacts && (
              <div className="col-span-full">
                <ErrorDisplay error={errors.emergencyContacts} onRetry={fetchEmergencyContacts} />
              </div>
            )}
            
            {loadingStates.activity ? (
              <ChartCardSkeleton 
                title="Activity by Day of Week" 
                description="User activity distribution across weekdays" 
              />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Activity by Day of Week</CardTitle>
                  <CardDescription>User activity distribution across weekdays</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80 w-full">
                    <Bar 
                      data={getChartData('activity')}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                      }}
                    />
                  </div>
                </CardContent>
                <CardFooter className="text-sm text-muted-foreground">
                  {lastRefreshed ? `Last updated: ${lastRefreshed.toLocaleString()}` : 'Refreshing data...'}
                </CardFooter>
              </Card>
            )}
            
            {loadingStates.emergencyContacts ? (
              <ChartCardSkeleton 
                title="Contact Distribution" 
                description="Number of contacts per user" 
              />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Contact Distribution</CardTitle>
                  <CardDescription>Number of contacts per user</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80 w-full">
                    <Bar 
                      data={getDistributionData('contacts')}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        indexAxis: 'y',
                      }}
                    />
                  </div>
                </CardContent>
                <CardFooter className="text-sm text-muted-foreground">
                  {lastRefreshed ? `Last updated: ${lastRefreshed.toLocaleString()}` : 'Refreshing data...'}
                </CardFooter>
              </Card>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="documents">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {errors.documentTypes && (
              <div className="col-span-full">
                <ErrorDisplay error={errors.documentTypes} onRetry={fetchDocumentTypes} />
              </div>
            )}
            {errors.representatives && (
              <div className="col-span-full">
                <ErrorDisplay error={errors.representatives} onRetry={fetchRepresentatives} />
              </div>
            )}
            
            {loadingStates.documentTypes ? (
              <ChartCardSkeleton 
                title="Document Types" 
                description="Distribution of document file types" 
              />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Document Types</CardTitle>
                  <CardDescription>Distribution of document file types</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80 w-full flex items-center justify-center">
                    <div className="h-64 w-full">
                      <Bar 
                        data={getChartData('documentTypes')}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                        }}
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="text-sm text-muted-foreground">
                  {lastRefreshed ? `Last updated: ${lastRefreshed.toLocaleString()}` : 'Refreshing data...'}
                </CardFooter>
              </Card>
            )}
            
            {loadingStates.representatives ? (
              <ChartCardSkeleton 
                title="Representatives Distribution" 
                description="Number of representatives per user" 
              />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Representatives Distribution</CardTitle>
                  <CardDescription>Number of representatives per user</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80 w-full">
                    <Bar 
                      data={getDistributionData('representatives')}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        indexAxis: 'y',
                      }}
                    />
                  </div>
                </CardContent>
                <CardFooter className="text-sm text-muted-foreground">
                  {lastRefreshed ? `Last updated: ${lastRefreshed.toLocaleString()}` : 'Refreshing data...'}
                </CardFooter>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Recent Activities with Pagination */}
      <Card className="mt-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Activities</CardTitle>
            <CardDescription>
              Activities in the system
              {totalActivities > 0 && ` (${totalActivities} total)`}
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <select
              className="p-2 text-sm border rounded-md"
              value={itemsPerPage}
              onChange={(e) => {
                const newItemsPerPage = Number(e.target.value);
                setItemsPerPage(newItemsPerPage);
                setCurrentPage(1);
              }}
            >
              <option value="5">5 per page</option>
              <option value="10">10 per page</option>
              <option value="20">20 per page</option>
              <option value="50">50 per page</option>
            </select>
          </div>
        </CardHeader>
        <CardContent>
          {errors.recentActivities && (
            <div className="mb-4">
              <ErrorDisplay error={errors.recentActivities} onRetry={fetchRecentActivities} />
            </div>
          )}
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2 w-1/6">Type</th>
                  <th className="text-left p-2 w-1/2">Description</th>
                  <th className="text-left p-2 w-1/3">Date</th>
                </tr>
              </thead>
              <tbody>
                {loadingStates.recentActivities ? (
                  [...Array(itemsPerPage)].map((_, i) => (
                    <tr key={i} className="border-b">
                      <td className="p-2"><Skeleton className="h-6 w-16 rounded-full" /></td>
                      <td className="p-2"><Skeleton className="h-4 w-full" /></td>
                      <td className="p-2"><Skeleton className="h-4 w-32" /></td>
                    </tr>
                  ))
                ) : paginatedActivities.length > 0 ? (
                  paginatedActivities.map((activity) => (
                    <tr key={activity.id} className="border-b hover:bg-muted/50">
                      <td className="p-2">
                        <span className={`inline-block px-2 py-1 rounded-full text-xs ${
                          activity.type === 'create' ? 'bg-green-100 text-green-800' :
                          activity.type === 'update' ? 'bg-blue-100 text-blue-800' :
                          activity.type === 'delete' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {activity.type}
                        </span>
                      </td>
                      <td className="p-2">{activity.description}</td>
                      <td className="p-2 text-muted-foreground">
                        {new Date(activity.timestamp).toLocaleString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="text-center py-8 text-muted-foreground">
                      No recent activities found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination Controls */}
          {!loadingStates.recentActivities && recentActivities.length > 0 && (
            <div className="flex flex-col md:flex-row md:items-center justify-between mt-4 space-y-2 md:space-y-0">
              <div className="text-sm text-muted-foreground">
                Showing {totalActivities === 0 ? 0 : currentPage * itemsPerPage - itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, totalActivities)} of {totalActivities} activities
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                  disabled={currentPage === 1}
                  className="h-8"
                >
                  Previous
                </Button>
                
                {totalPages <= 5 ? (
                  pageNumbers.map((number) => (
                    <Button
                      key={number}
                      variant={currentPage === number ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(number)}
                      className="h-8 w-8 p-0 hidden sm:inline-flex"
                    >
                      {number}
                    </Button>
                  ))
                ) : (
                  <>
                    <Button
                      variant={currentPage === 1 ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(1)}
                      className="h-8 w-8 p-0 hidden sm:inline-flex"
                    >
                      1
                    </Button>
                    
                    {currentPage > 3 && (
                      <span className="mx-1 hidden sm:inline-flex">...</span>
                    )}
                    
                    {pageNumbers
                      .filter((num) => num !== 1 && num !== totalPages && 
                        (Math.abs(num - currentPage) <= 1 || 
                         (currentPage <= 3 && num <= 4) || 
                         (currentPage >= totalPages - 2 && num >= totalPages - 3)))
                      .map((number) => (
                        <Button
                          key={number}
                          variant={currentPage === number ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(number)}
                          className="h-8 w-8 p-0 hidden sm:inline-flex"
                        >
                          {number}
                        </Button>
                      ))
                    }
                    
                    {currentPage < totalPages - 2 && (
                      <span className="mx-1 hidden sm:inline-flex">...</span>
                    )}
                    
                    <Button
                      variant={currentPage === totalPages ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(totalPages)}
                      className="h-8 w-8 p-0 hidden sm:inline-flex"
                    >
                      {totalPages}
                    </Button>
                  </>
                )}
                
                <span className="text-sm text-muted-foreground sm:hidden">
                  Page {currentPage} of {totalPages}
                </span>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                  disabled={currentPage === totalPages}
                  className="h-8"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
