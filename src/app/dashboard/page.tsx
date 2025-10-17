"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import {
  FileText,
  Users,
  AlertTriangle,
  ChevronRight,
  Calendar,
  Package,
} from "lucide-react";
import { useUsers } from "../utils/repo_services/hooks/user";
import { useRecentActivities } from "../utils/repo_services/hooks/recent_activity";
import {
  getActivityIcon,
  RecentActivity,
} from "../utils/repo_services/interfaces/recent_activity";
import { useUserAuthorizedRepresentatives } from "../utils/repo_services/hooks/user_authorized_representative";
import { useUserEmergencyContacts } from "../utils/repo_services/hooks/user_emergency_contact";
import { useDocumentLocations } from "../utils/repo_services/hooks/document_location";
import { useUserSubscription } from "../utils/repo_services/hooks/user_subscription";
import { formatDate } from "@/utils/formatDate";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from "next/link";
import { VARIANT_STYLES } from "../constants/ui-variants";
import { ROUTES } from "../constants/routes";
import { ICON_SIZES, SIDEBAR_ICONS } from "../constants/icons";
import { StatCard } from "@/components/custom/statcard";
import {
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  Table,
} from "@/components/ui/table";
import { getRepresentativeFullName } from "../utils/repo_services/interfaces/user_authorized_representative";
import StatusBadge from "@/components/ui/status-badge";
import { getInvitationStatus } from "../utils/invitationStatus";
import { UserAvatar } from "@/components/custom/user-avatar";
import { RESPONSIBILITY_ROLES } from "../constants/userRoles";
import { useUserSession } from "../utils/repo_services/hooks/useUserSession";
import PlanBadge from "@/components/custom/plan-badge";
import EmptyState from "@/components/representatives/EmptyState";

export default function DashboardPage() {
  const { user, userProfile, userLoading: loading, isAdmin } = useUserSession();
  const router = useRouter();

  // Redirect admin users to analytics page immediately
  useEffect(() => {
    if (!loading && isAdmin) {
      router.push("/dashboard/analytics");
    }
  }, [isAdmin, loading, router]);

  // Early return - don't render dashboard for admins
  if (loading) {
    return (
      <div className="mx-auto space-y-8">
        {/* Welcome Card Skeleton */}
        <Card>
          <CardHeader>
            <div className="h-7 bg-gray-200 rounded w-48 mb-2 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-64 animate-pulse"></div>
          </CardHeader>
          <CardContent>
            <div className="flex">
              <div className="h-6 bg-gray-200 rounded w-24 animate-pulse"></div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-6 w-6 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-5 bg-gray-200 rounded w-20 animate-pulse"></div>
                  </div>
                  <div className="h-8 bg-gray-200 rounded w-12 animate-pulse"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
                  <div className="h-3 bg-gray-200 rounded w-28 animate-pulse"></div>
                </div>
                <div className="mt-4">
                  <div className="h-9 bg-gray-200 rounded w-full animate-pulse"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Activities Skeleton */}
        <Card>
          <CardHeader>
            <div className="h-6 bg-gray-200 rounded w-40 animate-pulse"></div>
          </CardHeader>
          <CardContent>
            <div className="divide-y border rounded-md">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="flex items-center justify-between gap-4 p-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded w-64 animate-pulse"></div>
                  </div>
                  <div className="h-3 bg-gray-200 rounded w-20 animate-pulse"></div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If admin, show minimal loading state while redirecting
  if (isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Redirecting to analytics dashboard...</p>
        </div>
      </div>
    );
  }

  // Only initialize data hooks when user context is fully loaded AND user is not admin
  const isUserContextReady = !loading && user && userProfile;

  const { data: users, loading: usersLoading } = useUsers();

  const { loading: activitiesLoading, getRecentActivities } =
    useRecentActivities();

  const {
    data: representatives,
    loading: representativesLoading,
    getActiveRepresentatives,
    getMyAuthorizedRepresentatives,
  } = useUserAuthorizedRepresentatives();

  // Get all representatives
  const allRepresentatives = getMyAuthorizedRepresentatives();

  const {
    data: emergencyContacts,
    loading: emergencyContactsLoading,
    getActiveContacts,
  } = useUserEmergencyContacts();

  const { data: documentLocations, loading: documentsLoading } =
    useDocumentLocations();

  const {
    getSubscriptionInfo,
    getCurrentSubscription,
    loading: subscriptionLoading,
  } = useUserSubscription();

  const subscriptionDetails = getSubscriptionInfo();
  const currentSubscription = getCurrentSubscription();

  // Get subscription end date from the user's current subscription
  const getSubscriptionEndDate = (): string | null => {
    if (currentSubscription && currentSubscription.subscription_end_date) {
      return formatDate(currentSubscription.subscription_end_date);
    }
    return null;
  };

  const subscriptionEndDate = getSubscriptionEndDate();

  const userName = userProfile
    ? userProfile.firstname
    : user?.email?.split("@")[0] || "User";

  // Get recent activities for display (limit to 5)
  const displayActivities = getRecentActivities(5);

  const { getResponsibilities: getRepresentativeResponsibilities } =
    useUserAuthorizedRepresentatives();

  const { getEmergencyContactResponsibilities } = useUserEmergencyContacts();

  // Get all my responsibilities
  const representativeResponsibilities = getRepresentativeResponsibilities();
  const emergencyContactResponsibilities =
    getEmergencyContactResponsibilities();

  const allResponsibilities = [
    ...representativeResponsibilities,
    ...emergencyContactResponsibilities,
  ];

  // Calculate counts for stat cards
  const activeRepresentatives = getActiveRepresentatives();
  const activeEmergencyContacts = getActiveContacts();
  const activeResponsibilities = allResponsibilities.filter(
    (resp) => resp.status === "registered"
  ).length;
  const totalDocuments = documentLocations.length;
  const totalRepresentatives = getMyAuthorizedRepresentatives().length;
  const totalEmergencyContacts = getActiveContacts().length;
  const totalResponsibilities =
    representativeResponsibilities.length +
    emergencyContactResponsibilities.length;
  const pendingAr = allRepresentatives.filter(
    (rep) => rep.status === "pending"
  ).length;
  const pendingEc = emergencyContacts.filter(
    (rep) => rep.status === "pending"
  ).length;

  const pendingResponsibilities = allResponsibilities.filter(
    (rep) => rep.status === "pending"
  ).length;

  const daysToExpiration = subscriptionEndDate
    ? Math.ceil(
        (new Date(subscriptionEndDate).getTime() - new Date().getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : 0;

  // Get the most recent update dates
  const getLastDocumentUpdate = () => {
    if (documentLocations.length === 0) return "No documents yet";
    const latest = documentLocations[0]; // Already sorted by last_updated desc
    return latest.last_updated
      ? formatDate(latest.last_updated)
      : "Unknown date";
  };

  if (
    !isUserContextReady ||
    (isUserContextReady &&
      (usersLoading ||
        activitiesLoading ||
        representativesLoading ||
        emergencyContactsLoading ||
        documentsLoading ||
        subscriptionLoading))
  ) {
    return (
      <div className="mx-auto space-y-8">
        {/* Welcome Card Skeleton */}
        <Card>
          <CardHeader>
            <div className="h-7 bg-gray-200 rounded w-48 mb-2 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-64 animate-pulse"></div>
          </CardHeader>
          <CardContent>
            <div className="flex">
              <div className="h-6 bg-gray-200 rounded w-24 animate-pulse"></div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-6 w-6 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-5 bg-gray-200 rounded w-20 animate-pulse"></div>
                  </div>
                  <div className="h-8 bg-gray-200 rounded w-12 animate-pulse"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
                  <div className="h-3 bg-gray-200 rounded w-28 animate-pulse"></div>
                </div>
                <div className="mt-4">
                  <div className="h-9 bg-gray-200 rounded w-full animate-pulse"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Activities Skeleton */}
        <Card>
          <CardHeader>
            <div className="h-6 bg-gray-200 rounded w-40 animate-pulse"></div>
          </CardHeader>
          <CardContent>
            <div className="divide-y border rounded-md">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="flex items-center justify-between gap-4 p-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded w-64 animate-pulse"></div>
                  </div>
                  <div className="h-3 bg-gray-200 rounded w-20 animate-pulse"></div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto space-y-8">
      {/* Header Section with greeting and quick actions */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome, {userName}!
          </h1>
          <p className="text-muted-foreground mt-1">
            Here's an overview of your estate planning information
          </p>
          {/* Plan badge */}
          <div className="mt-2">
            <PlanBadge
              variant={currentSubscription?.subscription_level || "bronze"}
            />
          </div>
        </div>
        <div className="flex gap-3 mt-4 lg:mt-0">
          <Button
            className="flex items-center gap-2"
            onClick={() => router.push(ROUTES.wills)}
          >
            <SIDEBAR_ICONS.wills className="h-4 w-4" />
            Manage Will
          </Button>
        </div>
      </div>

      {/* Alert banners */} 
      <div className="space-y-3 mb-8">
        {/* Pending invitations banner */}
        {pendingResponsibilities > 0 && (
          <Alert
            className={`${VARIANT_STYLES.WARNING} border-l-4 border-l-amber-500 flex gap-4`}
          >
            <div className="flex-shrink-0 bg-amber-100 p-2 rounded-full">
              <AlertTriangle className="text-amber-600" />
            </div>
            <div className="flex-1">
              <AlertTitle className="text-lg font-semibold text-amber-800">
                Action Required
              </AlertTitle>
              <AlertDescription className="text-amber-700">
                <div className="space-y-2">
                  <p>
                    You have{" "}
                    <span className="font-semibold">
                      {pendingResponsibilities}
                    </span>{" "}
                    pending invitation{pendingResponsibilities > 1 ? "s" : ""}{" "}
                    to serve as an authorized representative or emergency
                    contact. Please review and respond to{" "}
                    {pendingResponsibilities > 1
                      ? "these requests"
                      : "this request"}
                    .
                  </p>
                  <div className="flex items-center gap-2 mt-3">
                    <Button
                      variant="outline"
                      className="bg-white text-amber-800 border-amber-400 hover:text-white hover:bg-amber-600 hover:border-amber-700 transition-colors"
                      asChild
                    >
                      <Link href={ROUTES.responsibilities}>
                        Review invitations
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </AlertDescription>
            </div>
          </Alert>
        )}

        {/* Subscription Renewal banner */}
        {daysToExpiration <= 7 && subscriptionDetails.is_recurring && (
          <Alert className={VARIANT_STYLES.INFO}>
            <Calendar className={ICON_SIZES.sm} />
            <AlertTitle>Subscription Notice</AlertTitle>
            <AlertDescription>
              Your {subscriptionDetails.name} subscription will end in{" "}
              {daysToExpiration} days on {subscriptionEndDate}. Please consider
              renewing to avoid any disruption in service.
              <Link
                href={ROUTES.subscription}
                className="flex items-center mt-1 text-blue-700 font-medium hover:underline"
              >
                Manage subscription
                <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Registered Wills"
          value={totalDocuments}
          description={`Last updated: ${getLastDocumentUpdate()}`}
          icon={FileText}
        />
        <StatCard
          title={"Authorised Representatives"}
          value={totalRepresentatives}
          description={`${
            activeRepresentatives.length
          } Active · ${pendingAr} Pending`}
          icon={Users}
        />
        <StatCard
          title={"Emergency Contacts"}
          value={totalEmergencyContacts}
          description={`${
            activeEmergencyContacts.length
          } Active · ${pendingEc} Pending`}
          icon={Users}
        />
        <StatCard
          title="Responsibilities"
          value={totalResponsibilities}
          description={`${activeResponsibilities} Active · ${pendingResponsibilities} Pending`}
          icon={Package}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Representatives */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>{RESPONSIBILITY_ROLES.representative.title}</CardTitle>
              <CardDescription>
                People who can access your will documents and information when
                needed to execute your wishes
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {allRepresentatives.length === 0 ? (
              <div className="flex flex-col items-center justify-center">
                <EmptyState tabValue={"representatives"} />
                <div className="absolute mt-55">
                  <Button onClick={() => router.push(ROUTES.representatives)}>
                    Manage Representatives
                  </Button>
                </div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allRepresentatives.map((rep: any) => (
                    <TableRow key={rep.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <UserAvatar
                            user={{
                              firstname: rep.firstname,
                              lastname: rep.lastname,
                            }}
                          />
                          <div>
                            <p className="font-medium">
                              {getRepresentativeFullName(rep)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {rep.email}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge
                          status={getInvitationStatus(
                            rep.status || "",
                            rep.invite_expires || undefined
                          )}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="link"
                          size="sm"
                          onClick={() => router.push(ROUTES.representatives)}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Your latest actions and notifications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-0">
              {displayActivities.length > 0 ? (
                displayActivities.map((activity) => (
                  <ActivityItem key={activity.id} activity={activity} />
                ))
              ) : (
                <div className="p-4 text-center text-gray-500">
                  No recent activities found.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      {/* Subscription Section */}
    </div>
  );

  // Using the full RecentActivity object as a prop
  interface ActivityItemProps {
    activity: RecentActivity;
  }

  function ActivityItem({ activity }: ActivityItemProps) {
    const {
      activity_type: type,
      description,
      created_at: timestamp,
      table_name: tableName,
    } = activity;

    return (
      <div className="flex items-start gap-4 py-3 border-b last:border-0 last:pb-0">
        <div className="mt-0.5 p-1.5 rounded-full ">
          {getActivityIcon(type, tableName)}
        </div>
        <div className="space-y-2 flex-1 ">
          <p className="text-sm font-medium leading-none">{description}</p>
          <p className="text-xs text-muted-foreground">
            {formatDate(timestamp)} at{" "}
            {new Date(timestamp).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
      </div>
    );
  }
}
