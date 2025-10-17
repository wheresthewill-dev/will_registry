"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import RepresentativesLoading from "./loading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertCircle,
  Calendar,
  Clock,
  Info,
  Mail,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { useUserAuthorizedRepresentatives } from "@/app/utils/repo_services/hooks/user_authorized_representative";
import {
  getRepresentativeDisplayName,
  getRepresentativeFullName,
} from "@/app/utils/repo_services/interfaces/user_authorized_representative";
import { useSubscriptionLimits } from "@/app/utils/repo_services/hooks/subscription-limits";
import AddRepresentativeModal from "./modals/AddRepresentativeModal";
import { getInvitationStatus } from "@/app/utils/invitationStatus";
import DeleteRepresentativeModal from "./modals/DeleteRepresentativeModal";
import { Separator } from "@/components/ui/separator";
import { UnderstandingRepresentatives } from "@/components/representatives";
import PersonCard, { InfoItem } from "@/components/ui/person-card";
import { ICON_SIZES } from "@/app/constants/icons";
import { formatDate } from "@/utils/formatDate";
import { getUserInitials } from "@/utils/getUserInitials";
import { RESPONSIBILITY_ROLES } from "@/app/constants/userRoles";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

// Type definitions
type StatusFilterType = "all" | "active" | "pending" | "expired";

interface StatusFilter {
  value: StatusFilterType;
  label: string;
  badgeColor?: string;
}

// Use the existing UserAuthorizedRepresentative type instead of creating a new one
import { UserAuthorizedRepresentative } from "@/app/utils/repo_services/interfaces/user_authorized_representative";
import { EmptyState } from "@/components/representatives/EmptyState";
import { VARIANT_STYLES } from "@/app/constants/ui-variants";
import { ViewToggle, ViewMode } from "@/components/ui/view-toggle";
import RepresentativesListView from "@/components/representatives/RepresentativesListView";
import ResendRepresentativeInvitation from "./modals/ResendRepresentativeInvitation";

// For code clarity, create an alias for the type we'll use throughout this component
type Representative = UserAuthorizedRepresentative;

// Status config with labels and metadata
const STATUS_FILTERS: StatusFilter[] = [
  { value: "all", label: "All Representatives" },
  {
    value: "active",
    label: "Active",
  },
  {
    value: "pending",
    label: "Pending",
  },
  { value: "expired", label: "Expired" },
];

export default function RepresentativesPage() {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<StatusFilterType>("all");
  const [showUnderstanding, setShowUnderstanding] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  const {
    data: representatives,
    loading,
    getActiveRepresentatives,
    getPendingRepresentatives,
    getExpiredInvitations,
    getMyAuthorizedRepresentatives,
  } = useUserAuthorizedRepresentatives();

  // Subscription limits
  const { canAddRepresentative, usageCount } = useSubscriptionLimits();

  // Get all representatives
  const allRepresentatives = getMyAuthorizedRepresentatives();

  // Filter representatives based on search query and status
  const getFilteredRepresentatives = (): Representative[] => {
    // Apply status filter first
    let statusFilteredReps: Representative[];
    switch (statusFilter) {
      case "active":
        statusFilteredReps = getActiveRepresentatives();
        break;
      case "pending":
        statusFilteredReps = getPendingRepresentatives();
        break;
      case "expired":
        statusFilteredReps = getExpiredInvitations();
        break;
      default:
        statusFilteredReps = allRepresentatives;
    }

    // Then apply search filter if there's a query
    if (!searchQuery.trim()) return statusFilteredReps;

    return statusFilteredReps.filter((rep) => {
      const fullName = getRepresentativeFullName(rep).toLowerCase();
      const email = (rep.email || "").toLowerCase();
      const searchLower = searchQuery.toLowerCase();

      return fullName.includes(searchLower) || email.includes(searchLower);
    });
  };
  const filteredRepresentatives = getFilteredRepresentatives();

  // Count representatives by status
  const countByStatus = {
    active: getActiveRepresentatives().length,
    pending: getPendingRepresentatives().length,
    expired: getExpiredInvitations().length,
    all: allRepresentatives.length,
  };

  // Show loading state while fetching data

  if (loading) {
    // Use the skeleton loading component for a better user experience
    return <RepresentativesLoading />;
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold sm:text-3xl">
            My {RESPONSIBILITY_ROLES.representative.title}
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage who can act on your behalf for legal matters, send
            invitations to new representatives, and track acceptance status
          </p>
        </div>

        <div className="flex items-center gap-3">
          <AddRepresentativeModal />
        </div>
      </div>

      {/* Understanding representatives */}
      <div className="mt-6">
        <UnderstandingRepresentatives
          showContent={showUnderstanding}
          setShowContent={setShowUnderstanding}
        />
      </div>

      {/* Filter and Search Section */}
      <Card className="shadow-sm border">
        <CardHeader className="px-6 md:px-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle className="text-xl font-semibold flex">
              {RESPONSIBILITY_ROLES.representative.title}
              <Badge
                variant="outline"
                className={`ml-2 font-normal ${
                  countByStatus.all === canAddRepresentative().limit
                    ? VARIANT_STYLES.WARNING
                    : "bg-muted"
                }`}
              >
                {countByStatus.all === canAddRepresentative().limit
                  ? "Limit reached"
                  : `${canAddRepresentative().limit - countByStatus.all} of ${canAddRepresentative().limit} slots left`}
              </Badge>
            </CardTitle>
            <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
              {/* Status filter dropdown */}
              <Select
                value={statusFilter}
                onValueChange={(value: StatusFilterType) =>
                  setStatusFilter(value)
                }
              >
                <SelectTrigger className="md:w-[200px]">
                  <SlidersHorizontal className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_FILTERS.map((filter) => (
                    <SelectItem key={filter.value} value={filter.value}>
                      <div className="flex items-center justify-between w-full">
                        <span>{filter.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Search box */}
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search by name or email"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-8"
                  aria-label="Search for representatives"
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
              <ViewToggle viewMode={viewMode} onViewChange={setViewMode} />
            </div>
          </div>
        </CardHeader>
        <Separator />

        {/* Grid View */}
        <CardContent className="px-6 md:px-10 py-6">
          {getFilteredRepresentatives().length > 0 ? (
            viewMode === "grid" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {getFilteredRepresentatives().map((representative) => {
                  const invitationStatus = getInvitationStatus(
                    representative.status || "",
                    representative.invite_expires || undefined
                  );
                  const isActive =
                    invitationStatus === "active" || "registered";
                  const isPending = invitationStatus === "pending";
                  const isExpired = invitationStatus === "expired";

                  return (
                    <PersonCard
                      key={representative.id}
                      name={getRepresentativeFullName(representative)}
                      initials={getUserInitials(
                        representative.firstname,
                        representative.lastname
                      )}
                      status={invitationStatus}
                      footerContent={
                        <div className="grid w-full gap-2">
                          <ResendRepresentativeInvitation
                            representativeId={representative.id}
                            representativeName={getRepresentativeDisplayName(
                              representative
                            )}
                            representativeEmail={representative.email}
                            inviteExpires={representative.invite_expires || ""}
                            invitationStatus={
                              representative.status || "pending"
                            }
                          />
                          <DeleteRepresentativeModal
                            representativeId={representative.id}
                            representativeName={getRepresentativeDisplayName(
                              representative
                            )}
                            triggerText="Remove Representative"
                            className={VARIANT_STYLES.DESTRUCTIVE}
                          />
                        </div>
                      }
                    >
                      <InfoItem icon={<Mail className={ICON_SIZES.sm} />}>
                        {representative.email}
                      </InfoItem>
                      <InfoItem
                        icon={<Calendar className={ICON_SIZES.sm} />}
                        textColorClass="text-muted-foreground"
                      >
                        {isActive ? "Request accepted" : "Added"} on{" "}
                        {formatDate(
                          isActive && representative.registered_at
                            ? representative.registered_at
                            : representative.created_at
                        )}
                      </InfoItem>
                      {(isPending || isExpired) &&
                        representative.invite_expires && (
                          <>
                            {(() => {
                              const expiryDate = new Date(
                                representative.invite_expires
                              );
                              const now = new Date();
                              const diffTime =
                                expiryDate.getTime() - now.getTime();
                              const diffDays = Math.ceil(
                                diffTime / (1000 * 60 * 60 * 24)
                              );

                              if (isExpired) {
                                return (
                                  <InfoItem
                                    icon={
                                      <AlertCircle className="h-3.5 w-3.5 text-destructive" />
                                    }
                                    textColorClass="text-destructive font-medium"
                                  >
                                    Invitation expired on{" "}
                                    {formatDate(
                                      expiryDate.toLocaleDateString()
                                    )}
                                  </InfoItem>
                                );
                              } else if (diffDays === 1) {
                                return (
                                  <InfoItem
                                    icon={
                                      <Clock className="h-3.5 w-3.5 text-amber-600" />
                                    }
                                    textColorClass="text-amber-600 font-medium"
                                  >
                                    Invitation expires tomorrow
                                  </InfoItem>
                                );
                              } else {
                                return (
                                  <InfoItem
                                    icon={
                                      <Clock className="h-3.5 w-3.5 text-amber-600" />
                                    }
                                    textColorClass="text-amber-600 font-medium"
                                  >
                                    Invitation expires in {diffDays} days
                                  </InfoItem>
                                );
                              }
                            })()}
                          </>
                        )}
                      {representative.status === "registered" && (
                        <InfoItem
                          icon={<Info className="h-3.5 w-3.5" />}
                          textColorClass="text-muted-foreground"
                        >
                          Access to will documents granted
                        </InfoItem>
                      )}
                    </PersonCard>
                  );
                })}
              </div>
            ) : (
              // List view
              <RepresentativesListView
                representatives={filteredRepresentatives}
                onResendInvitation={(representative) => {
                  return (
                    <ResendRepresentativeInvitation
                      representativeId={representative.id}
                      representativeName={getRepresentativeDisplayName(
                        representative
                      )}
                      representativeEmail={representative.email}
                      inviteExpires={representative.invite_expires}
                      invitationStatus={representative.status}
                      triggerId={`resend-${representative.id}`}
                      triggerVariant="ghost"
                      triggerSize="default"
                      iconOnly
                      className="hover:bg-primary/10"
                    />
                  );
                }}
                onDeleteContact={(representative) => (
                  <DeleteRepresentativeModal
                    representativeId={representative.id}
                    representativeName={getRepresentativeDisplayName(
                      representative
                    )}
                    iconOnly
                    variant="ghost"
                    className="hover:bg-destructive/10"
                  />
                )}
              />
            )
          ) : (
            <EmptyState
              tabValue={statusFilter}
              searchQuery={searchQuery}
              onClearSearch={() => setSearchQuery("")}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
