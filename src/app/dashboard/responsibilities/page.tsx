"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { NotificationBadge } from "@/components/ui/notification-badge";
import { Search, X } from "lucide-react";
import { getInvitationStatus } from "@/app/utils/invitationStatus";
import { useUserAuthorizedRepresentatives } from "@/app/utils/repo_services/hooks/user_authorized_representative";
import { useUserEmergencyContacts } from "@/app/utils/repo_services/hooks/user_emergency_contact";
import { useUsers } from "@/app/utils/repo_services/hooks/user";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import {
  EmptyState,
  getTabIcon,
  ResponsibilityGridView,
  ResponsibilityListView,
  TABS_CONFIG,
  UnderstandingResponsibilities,
} from "@/components/responsibilities";
import { ROUTES } from "@/app/constants/routes";
import ViewToggle from "@/components/ui/view-toggle";

export default function ResponsibilitiesPage() {
  const router = useRouter();
  const [isAccepting, setIsAccepting] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [tabValue, setTabValue] = useState<string>("pending");
  const [showResponsibilities, setShowResponsibilities] =
    useState<boolean>(false);
  const {
    getResponsibilities: getRepresentativeResponsibilities,
    approveRepresentative,
    loading: repLoading,
    error: repError,
  } = useUserAuthorizedRepresentatives();

  const {
    getEmergencyContactResponsibilities,
    approveContact,
    loading: ecLoading,
  } = useUserEmergencyContacts();

  const { getUser, loading: usersLoading } = useUsers();

  // Get all my responsibilities
  const representativeResponsibilities = getRepresentativeResponsibilities();
  const emergencyContactResponsibilities =
    getEmergencyContactResponsibilities();
  const allUsers = getUser();

  // Get user details for people user's responsible for
  const getUserDetails = (userId: number) => {
    return allUsers.find((user) => user.id.toString() === userId.toString());
  };

  // Accept invitation (handles both representative and emergency contact)
  const handleAcceptInvitation = async (
    responsibility: any,
    type: "representative" | "emergency-contact"
  ) => {
    setIsAccepting(responsibility.id);

    try {
      // Update the status to registered (this now handles email notification internally)
      const updateSuccess =
        type === "representative"
          ? await approveRepresentative(responsibility.id)
          : await approveContact(responsibility.id);

      if (updateSuccess) {
        toast.success(
          `${type === "representative" ? "Representative" : "Emergency contact"} invitation accepted successfully!`
        );
      } else {
        toast.error(
          `Failed to accept ${type === "representative" ? "representative" : "emergency contact"} invitation`
        );
      }
    } catch (error) {
      console.error(`Error accepting ${type} invitation:`, error);
      toast.error("An error occurred while accepting the invitation");
    } finally {
      setIsAccepting(null);
    }
  };

  const handleAcceptRepresentativeInvitation = (responsibility: any) =>
    handleAcceptInvitation(responsibility, "representative");

  const handleAcceptEmergencyContactInvitation = (responsibility: any) =>
    handleAcceptInvitation(responsibility, "emergency-contact");

  // Navigate to will documents
  const handleViewWill = (userId: number, userName: string) => {
    router.push(`${ROUTES.documents}/${userId}`);
  };

  // Filter responsibilities based on search query
  const filterResponsibilities = (responsibilities: any[], query: string) => {
    if (!query.trim()) return responsibilities;

    return responsibilities.filter((responsibility) => {
      const userDetails = getUserDetails(responsibility.user_id);
      if (!userDetails) return false;

      const fullName =
        `${userDetails.firstname || ""} ${userDetails.lastname || ""}`.toLowerCase();
      const email = (userDetails.email || "").toLowerCase();
      const relationship = (responsibility.relationship || "").toLowerCase();

      const searchLower = query.toLowerCase();

      return (
        fullName.includes(searchLower) ||
        email.includes(searchLower) ||
        relationship.includes(searchLower)
      );
    });
  };

  // Filter based on current tab and search query
  const filteredRepresentatives = filterResponsibilities(
    representativeResponsibilities,
    searchQuery
  );
  const filteredEmergencyContacts = filterResponsibilities(
    emergencyContactResponsibilities,
    searchQuery
  );

  // Get responsibilities based on active tab
  // Define filtering logic for each tab type
  const FILTER_HANDLERS = {
    pending: (responsibilities: any[]) =>
      responsibilities.filter((r) => {
        const status = getInvitationStatus(r.status, r.invite_expires);
        return status === "pending";
      }),
    active: (responsibilities: any[]) =>
      responsibilities.filter((r) => r.status === "registered"),
    expired: (responsibilities: any[]) =>
      responsibilities.filter((r) => {
        const status = getInvitationStatus(r.status, r.invite_expires);
        return status === "expired";
      }),
    representatives: () => filteredRepresentatives,
    "emergency-contacts": () => filteredEmergencyContacts,
    default: (responsibilities: any[]) => responsibilities,
  };

  const getFilteredResponsibilities = () => {
    const allResponsibilities = [
      ...filteredRepresentatives,
      ...filteredEmergencyContacts,
    ];

    // Use the appropriate filter handler based on tab value
    const handler =
      FILTER_HANDLERS[tabValue as keyof typeof FILTER_HANDLERS] ||
      FILTER_HANDLERS.default;
    return handler(allResponsibilities);
  };

  // Loading state
  if (repLoading || ecLoading || usersLoading) {
    return (
      <div className="space-y-8">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-100 rounded w-3/4 max-w-[400px] mb-3"></div>
          <div className="h-4 bg-slate-100 rounded w-2/3 max-w-[500px]"></div>
        </div>

        {/* Loading skeleton for content card */}
        <Card className="border shadow-sm">
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <div className="h-6 bg-slate-100 rounded w-48 animate-pulse"></div>
              <div className="h-8 bg-slate-100 rounded w-32 animate-pulse"></div>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {[1, 2, 3].map((j) => (
              <div key={j} className="p-4 border rounded-lg animate-pulse">
                <div className="flex items-center gap-4 mb-3">
                  <div className="h-10 w-10 bg-slate-100 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-5 bg-slate-100 rounded w-32 mb-2"></div>
                    <div className="h-3 bg-slate-100 rounded w-24"></div>
                  </div>
                </div>
                <div className="pl-14 space-y-2">
                  <div className="h-3 bg-slate-100 rounded w-full max-w-[300px]"></div>
                  <div className="h-3 bg-slate-100 rounded w-1/2 max-w-[150px]"></div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold sm:text-3xl">
            My Responsibilities
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage your role as an Authorised Representative or Emergency
            Contact, accept pending invitations, and view estate details
          </p>
        </div>
      </div>

      {/* Understanding roles */}
      <div className="mt-6">
        <UnderstandingResponsibilities
          showResponsibilities={showResponsibilities}
          setShowResponsibilities={setShowResponsibilities}
        />
      </div>

      {/* Tab Navigation */}
      <Tabs value={tabValue} onValueChange={setTabValue} className="w-full">
        <TabsList className="w-full py-5 mb-3">
          {TABS_CONFIG.map((tab) => {
            // Compute the count based on tab value
            let count;
            const allResponsibilities = [
              ...filteredRepresentatives,
              ...filteredEmergencyContacts,
            ];

            switch (tab.value) {
              case "pending":
                count = allResponsibilities.filter((r) => {
                  const status = getInvitationStatus(
                    r.status,
                    r.invite_expires
                  );
                  return status === "pending";
                }).length;
                break;
              case "active":
                count = allResponsibilities.filter(
                  (r) => r.status === "registered"
                ).length;
                break;
              case "expired":
                count = allResponsibilities.filter((r) => {
                  const status = getInvitationStatus(
                    r.status,
                    r.invite_expires
                  );
                  return status === "expired";
                }).length;
                break;
              case "all":
              default:
                count = allResponsibilities.length;
            }

            return (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="py-5 px-4 flex-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                aria-label={`${tab.label} tab${count > 0 ? ` (${count})` : ""}`}
              >
                <div className="flex items-center justify-center gap-2">
                  <tab.icon className="h-4 w-4" />
                  <span className="font-medium">{tab.label}</span>
                  {tab.value === "pending" && (
                    <NotificationBadge
                      count={count}
                      isActive={tabValue === tab.value}
                    />
                  )}
                </div>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {/* Tab Content Sections */}
        {TABS_CONFIG.map((tab) => (
          <TabsContent key={tab.value} value={tab.value}>
            <Card className="shadow-sm border">
              <CardHeader className="px-10 md:px-10">
                <CardTitle className="flex items-center text-2xl font-semibold mt-3">
                  <span className="h-5 w-5 mr-3 text-primary">
                    {getTabIcon(tab.value, "medium")}
                  </span>
                  {tab.label}
                </CardTitle>
                <div className="flex flex-col md:flex-row gap-4 my-2 relative">
                  <div className="relative md:w-1/2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Search by name or email"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                      aria-label="Search for people"
                    />
                    {searchQuery && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                        onClick={() => setSearchQuery("")}
                        aria-label="Clear search"
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                  {/* View Toggle */}
                  <div className="ml-auto">
                    <ViewToggle
                      viewMode={viewMode}
                      onViewChange={setViewMode}
                    />
                  </div>
                </div>
              </CardHeader>
              <Separator />
              <CardContent className="px-10">
                {getFilteredResponsibilities().length === 0 ? (
                  <EmptyState
                    tabValue={tabValue}
                    searchQuery={searchQuery}
                    onClearSearch={() => setSearchQuery("")}
                  />
                ) : viewMode === "grid" ? (
                  <ResponsibilityGridView
                    responsibilities={getFilteredResponsibilities()}
                    getUserDetails={getUserDetails}
                    isAccepting={isAccepting}
                    handleAcceptRepresentativeInvitation={
                      handleAcceptRepresentativeInvitation
                    }
                    handleAcceptEmergencyContactInvitation={
                      handleAcceptEmergencyContactInvitation
                    }
                    handleViewWill={handleViewWill}
                  />
                ) : (
                  <ResponsibilityListView
                    responsibilities={getFilteredResponsibilities()}
                    getUserDetails={getUserDetails}
                    isAccepting={isAccepting}
                    handleAcceptRepresentativeInvitation={
                      handleAcceptRepresentativeInvitation
                    }
                    handleAcceptEmergencyContactInvitation={
                      handleAcceptEmergencyContactInvitation
                    }
                    handleViewWill={handleViewWill}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
