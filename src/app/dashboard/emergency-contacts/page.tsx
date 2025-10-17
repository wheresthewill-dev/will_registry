"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Plus,
  AlertCircle,
  CheckCircle,
  Clock,
  Search,
  SlidersHorizontal,
  X,
  Mail,
  Phone,
  Calendar,
  User,
} from "lucide-react";
import { ViewToggle, ViewMode } from "@/components/ui/view-toggle";
import { useUserEmergencyContacts } from "@/app/utils/repo_services/hooks/user_emergency_contact";
import {
  UserEmergencyContact,
  isEmergencyContactPending,
  isInviteExpired,
} from "@/app/utils/repo_services/interfaces/user_emergency_contact";
import { useSubscriptionLimits } from "@/app/utils/repo_services/hooks/subscription-limits";
import DeleteContactModal from "./modals/DeleteContactModal";
import AddContactModal from "./modals/AddContactModal";
import ResendEmergencyContactInvitation from "./modals/ResendContactInvitation";
import { getInvitationStatus } from "@/app/utils/invitationStatus";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import PersonCard, { InfoItem } from "@/components/ui/person-card";
import { ICON_SIZES } from "@/app/constants/icons";
import { cn } from "@/lib/utils";
import { VARIANT_STYLES } from "@/app/constants/ui-variants";
import EmergencyContactListView from "@/components/emergency-contacts/EmergencyContactListView";
import { formatDate } from "@/utils/formatDate";

// Type definitions
type StatusFilterType = "all" | "active" | "pending" | "expired";

interface StatusFilter {
  value: StatusFilterType;
  label: string;
  badgeColor?: string;
}

// Status config with labels and metadata
const STATUS_FILTERS: StatusFilter[] = [
  { value: "all", label: "All Contacts" },
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

// Extracted reusable components
interface ContactCardProps {
  contact: UserEmergencyContact;
  formatDate: (dateString: string) => string;
  view: ViewMode;
}

function ContactCard({ contact, formatDate, view }: ContactCardProps) {
  const contactName = `${contact.firstname} ${contact.lastname}`;
  const invitationStatus = getInvitationStatus(
    contact.status,
    contact.invite_expires ?? undefined
  );

  const initials =
    `${contact.firstname?.[0] || ""}${contact.lastname?.[0] || ""}`.toUpperCase();

  // For grid view, use PersonCard component
  if (view === "grid") {
    return (
      <PersonCard
        key={contact.id}
        name={contactName}
        initials={initials}
        status={invitationStatus}
        footerContent={
          <div className="grid w-full gap-2">
            <ResendEmergencyContactInvitation
              contactId={contact.id}
              contactName={contactName}
              contactEmail={contact.email || ""}
              contactRelationship={contact.relationship || ""}
              inviteExpires={contact.invite_expires || ""}
              invitationStatus={contact.status}
              triggerVariant="outline"
            />
            <DeleteContactModal
              contactId={contact.id}
              contactName={contactName}
              triggerText="Remove Contact"
              variant="ghost"
              className={VARIANT_STYLES.DESTRUCTIVE}
            />
          </div>
        }
      >
        <InfoItem icon={<User className={ICON_SIZES.sm} />}>
          {contact.relationship
            ? contact.relationship.charAt(0).toUpperCase() +
              contact.relationship.slice(1)
            : ""}
        </InfoItem>
        <InfoItem icon={<Mail className={ICON_SIZES.sm} />}>
          {contact.email || "No email provided"}
        </InfoItem>
        {contact.contact_number && (
          <InfoItem icon={<Phone className={ICON_SIZES.sm} />}>
            {contact.contact_number}
          </InfoItem>
        )}
        <InfoItem
          icon={<Calendar className={ICON_SIZES.sm} />}
          textColorClass="text-muted-foreground"
        >
          {invitationStatus === "active" ? "Registered" : "Added"} on{" "}
          {formatDate(
            invitationStatus === "active" && contact.registered_at
              ? contact.registered_at
              : contact.created_at
          )}
        </InfoItem>
        {isEmergencyContactPending(contact) && contact.invite_expires && (
          <>
            {(() => {
              const expiryDate = new Date(contact.invite_expires);
              const now = new Date();
              const diffTime = expiryDate.getTime() - now.getTime();
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

              if (isInviteExpired(contact)) {
                return (
                  <InfoItem
                    icon={
                      <AlertCircle className="h-3.5 w-3.5 text-destructive" />
                    }
                    textColorClass="text-destructive font-medium"
                  >
                    Invitation expired on{" "}
                    {formatDate(expiryDate.toLocaleDateString())}
                  </InfoItem>
                );
              } else if (diffDays === 1) {
                return (
                  <InfoItem
                    icon={<Clock className="h-3.5 w-3.5 text-amber-600" />}
                    textColorClass="text-amber-600 font-medium"
                  >
                    Invitation expires tomorrow
                  </InfoItem>
                );
              } else {
                return (
                  <InfoItem
                    icon={<Clock className="h-3.5 w-3.5 text-amber-600" />}
                    textColorClass="text-amber-600 font-medium"
                  >
                    Invitation expires in {diffDays} days
                  </InfoItem>
                );
              }
            })()}
          </>
        )}
      </PersonCard>
    );
  }
  return null;
}

// Reusable skeleton component for contact cards
function ContactCardSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center gap-3 mb-4">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-1.5">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-3.5 w-24" />
        </div>
      </div>
      <div className="space-y-3 mb-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-40" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-28" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-36" />
        </div>
      </div>
      <div className="pt-3 border-t space-y-2">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" /> {/* Page title */}
          <Skeleton className="h-4 w-80" /> {/* Page description */}
        </div>
        <Skeleton className="h-10 w-40" /> {/* Add contact button */}
      </div>

      <Card className="shadow-sm border">
        <CardHeader className="px-6 md:px-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Skeleton className="h-7 w-48" /> {/* Card title */}
              <Skeleton className="h-5 w-24" /> {/* Badge */}
            </div>
            <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
              <Skeleton className="h-10 w-[200px]" /> {/* Status filter */}
              <Skeleton className="h-10 w-64" /> {/* Search box */}
              <Skeleton className="h-10 w-20" /> {/* View toggle */}
            </div>
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="px-6 md:px-10 py-6">
          {/* Contact cards grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }, (_, i) => (
              <ContactCardSkeleton key={i} />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface ErrorStateProps {
  error: string;
}

function ErrorState({ error }: ErrorStateProps) {
  return (
    <div className="space-y-6">
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            Error Loading Emergency Contacts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-destructive mb-4">
              There was a problem loading your emergency contacts
            </p>
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button variant="outline" className="mt-4">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface EmptyStateProps {
  searchQuery?: string;
  onClearSearch?: () => void;
  statusFilter?: StatusFilterType;
}

function EmptyState({
  searchQuery,
  onClearSearch,
  statusFilter,
}: EmptyStateProps) {
  // If there's a search query, show a "no results" message
  if (searchQuery) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
          <Search className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium mb-2">No contacts found</h3>
        <p className="text-muted-foreground mb-4">
          No emergency contacts match "{searchQuery}"
        </p>
        <Button variant="outline" onClick={onClearSearch}>
          <X className="mr-2 h-4 w-4" /> Clear Search
        </Button>
      </div>
    );
  }

  // If there's a status filter other than "all", show an appropriate message
  if (statusFilter && statusFilter !== "all") {
    const messages = {
      active: "You don't have any active emergency contacts",
      pending: "You don't have any pending invitations",
      expired: "You don't have any expired invitations",
    };

    const icons = {
      active: <CheckCircle className="h-8 w-8 text-muted-foreground" />,
      pending: <Clock className="h-8 w-8 text-muted-foreground" />,
      expired: <AlertCircle className="h-8 w-8 text-muted-foreground" />,
    };

    return (
      <div className="text-center py-12">
        <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
          {icons[statusFilter]}
        </div>
        <h3 className="text-lg font-medium mb-2">No {statusFilter} contacts</h3>
        <p className="text-muted-foreground mb-4">{messages[statusFilter]}</p>
        {statusFilter === "active" && (
          <AddContactModal
            triggerVariant="default"
            triggerText="Add New Contact"
            showIcon={true}
          />
        )}
      </div>
    );
  }

  // Default empty state
  return (
    <div className="text-center py-12">
      <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
        <Plus className="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-medium mb-2">No emergency contacts yet</h3>
      <p className="text-muted-foreground mb-4">
        Add emergency contacts who will notify your representatives in case of
        emergency
      </p>
      <AddContactModal
        triggerVariant="default"
        triggerText="Add Your First Contact"
        showIcon={true}
      />
    </div>
  );
}

// Custom hooks for data and operations
function useEmergencyContactOperations() {
  const {
    loading,
    error,
    getActiveContacts,
    getPendingContacts,
    getExpiredInvitations,
    getMyEmergencyContacts,
    getEmergencyContactResponsibilities,
  } = useUserEmergencyContacts();

  return {
    loading,
    error,
    contacts: {
      all: getMyEmergencyContacts(),
      active: getActiveContacts(),
      pending: getPendingContacts(),
      expired: getExpiredInvitations(),
      responsibilities: getEmergencyContactResponsibilities(),
    },
  };
}

// Main component
export default function EmergencyContactsPage() {
  // State for filters and view mode
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<StatusFilterType>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  // Hooks
  const { loading, error, contacts } = useEmergencyContactOperations();
  const { canAddEmergencyContact, userTier, usageCount } =
    useSubscriptionLimits();

  // Early returns for loading and error states
  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return <ErrorState error={error} />;
  }

  // Filter contacts based on search query and status
  const getFilteredContacts = () => {
    // Apply status filter first
    let statusFilteredContacts;
    switch (statusFilter) {
      case "active":
        statusFilteredContacts = contacts.active;
        break;
      case "pending":
        statusFilteredContacts = contacts.pending;
        break;
      case "expired":
        statusFilteredContacts = contacts.expired;
        break;
      default:
        statusFilteredContacts = contacts.all;
    }

    // Then apply search filter if there's a query
    if (!searchQuery.trim()) return statusFilteredContacts;

    return statusFilteredContacts.filter((contact) => {
      const fullName = `${contact.firstname} ${contact.lastname}`.toLowerCase();
      const email = (contact.email || "").toLowerCase();
      const phone = (contact.contact_number || "").toLowerCase();
      const relationship = (contact.relationship || "").toLowerCase();
      const searchLower = searchQuery.toLowerCase();

      return (
        fullName.includes(searchLower) ||
        email.includes(searchLower) ||
        phone.includes(searchLower) ||
        relationship.includes(searchLower)
      );
    });
  };

  // Count contacts by status
  const countByStatus = {
    active: contacts.active.length,
    pending: contacts.pending.length,
    expired: contacts.expired.length,
    all: contacts.all.length,
  };

  const limitCheck = canAddEmergencyContact();
  const filteredContacts = getFilteredContacts();

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold sm:text-3xl">
            Emergency Contacts
          </h1>
          {/* TODO: Change EC description */}
          <p className="text-muted-foreground mt-2">
            People who will be notified in case of emergency and can access your
            important documents
          </p>
        </div>

        <div className="flex items-center gap-3">
          <AddContactModal
            triggerVariant="default"
            triggerSize="default"
            showIcon={true}
          />
        </div>
      </div>

      <Card className="shadow-sm border">
        <CardHeader className="px-6 md:px-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle className="text-xl font-semibold flex items-center">
              Emergency Contacts
              <Badge
                variant="outline"
                className={cn(
                  "ml-2 font-normal",
                  countByStatus.all === limitCheck.limit
                    ? VARIANT_STYLES.WARNING
                    : "bg-muted"
                )}
              >
                {countByStatus.all === limitCheck.limit
                  ? "Limit reached"
                  : `${limitCheck.limit - countByStatus.all} of ${limitCheck.limit} slots left`}
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
                  aria-label="Search for contacts"
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

              {/* View toggle */}
              <ViewToggle viewMode={viewMode} onViewChange={setViewMode} />
            </div>
          </div>
        </CardHeader>
        <Separator />

        <CardContent className="px-6 md:px-10 py-6">
          {filteredContacts.length > 0 ? (
            <div className="space-y-4">
              {/* Contacts Grid/List View */}
              {viewMode === "grid" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredContacts.map((contact) => (
                    <ContactCard
                      key={contact.id}
                      contact={contact}
                      formatDate={formatDate}
                      view={viewMode}
                    />
                  ))}
                </div>
              ) : (
                <EmergencyContactListView
                  contacts={filteredContacts}
                  onResendInvitation={(contact) => (
                    <ResendEmergencyContactInvitation
                      contactId={contact.id}
                      contactName={`${contact.firstname} ${contact.lastname}`}
                      contactEmail={contact.email}
                      contactRelationship={contact.relationship}
                      inviteExpires={contact.invite_expires}
                      invitationStatus={contact.status}
                      iconOnly={true}
                      triggerVariant="ghost"
                    />
                  )}
                  onDeleteContact={(contact) => {
                    const contactName = `${contact.firstname} ${contact.lastname}`;
                    return (
                      <DeleteContactModal
                        contactId={contact.id}
                        contactName={contactName}
                        triggerText="Remove Contact"
                        iconOnly={true}
                        variant="ghost"
                        className="hover:bg-destructive/10"
                      />
                    );
                  }}
                />
              )}
            </div>
          ) : (
            <EmptyState
              searchQuery={searchQuery}
              onClearSearch={() => setSearchQuery("")}
              statusFilter={statusFilter}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
