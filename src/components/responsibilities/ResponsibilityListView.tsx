"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { getInvitationStatus } from "@/app/utils/invitationStatus";
import { StatusBadge } from "@/components/ui/status-badge";
import AcceptInvitationModal from "../../app/dashboard/responsibilities/modals/AcceptInvitationModal";
import { getUserInitials } from "@/utils/getUserInitials";
import { ROUTES } from "@/app/constants/routes";
import {
  DataTable,
  TableColumn,
  TableHelpers,
} from "@/components/ui/data-table";
import { isUserDeceased } from "@/app/utils/repo_services/interfaces/user";
import RepresentativeNotified from "../custom/representative-notified";
import { Eye } from "lucide-react";

interface ResponsibilityListViewProps {
  responsibilities: any[];
  getUserDetails: (userId: number) => any;
  isAccepting: string | null;
  handleAcceptRepresentativeInvitation: (responsibility: any) => void;
  handleAcceptEmergencyContactInvitation: (responsibility: any) => void;
  handleViewWill: (userId: number, userName: string) => void;
}

export function ResponsibilityListView({
  responsibilities,
  getUserDetails,
  isAccepting,
  handleAcceptRepresentativeInvitation,
  handleAcceptEmergencyContactInvitation,
  handleViewWill,
}: ResponsibilityListViewProps) {
  const router = useRouter();

  // Create a memoized cache of row contexts to avoid redundant calculations
  const rowContextsMap = React.useMemo(() => {
    const contextMap = new Map();

    responsibilities.forEach((row) => {
      const userDetails = getUserDetails(row.user_id);
      if (!userDetails) return;

      contextMap.set(row.id, {
        userDetails,
        invitationStatus: getInvitationStatus(row.status, row.invite_expires),
        isRepresentative: "ar_user_id" in row,
        userIsDeceased: isUserDeceased(userDetails),
        willOwnerFirstname: userDetails.firstname,
        willOwnerLastname: userDetails.lastname,
        willOwnerFullname: `${userDetails.firstname} ${userDetails.lastname}`,
        willOwnerEmail: userDetails.email,
      });
    });

    return contextMap;
  }, [responsibilities, getUserDetails]);

  // Helper function that efficiently retrieves context from the cache
  const getRowContext = React.useCallback(
    (row: any) => {
      return rowContextsMap.get(row.id);
    },
    [rowContextsMap]
  );

  // Handle navigation to emergency contact management page
  const handleViewEmergencyContactDetails = (responsibility: any) => {
    router.push(`${ROUTES.emergencyDetails}/${responsibility.id}`);
  };
  // Define columns for the data table
  const columns: TableColumn[] = [
    {
      id: "requestor",
      header: "Will Owner (Requestor)",
      width: "30%",
      cell: (row, helpers) => {
        const context = getRowContext(row);
        if (!context) return null;

        return (
          <div className="flex items-center gap-4">
            <Avatar className="h-9 w-9 border border-muted shadow-sm">
              <AvatarFallback
                className={cn("text-primary-foreground", "bg-primary/90")}
              >
                {getUserInitials(
                  context.willOwnerFirstname,
                  context.willOwnerLastname
                )}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-foreground">
                {context.willOwnerFullname}
              </p>
              <p className="text-sm text-muted-foreground truncate max-w-[180px]">
                {context.willOwnerEmail}
              </p>
            </div>
          </div>
        );
      },
    },
    {
      id: "role",
      header: "My Role",
      width: "20%",
      cell: (row) => (
        <div className="flex items-center gap-2.5">
          <span className="text-foreground/80 capitalize">
            {"ar_user_id" in row
              ? "Authorised Representative"
              : `Emergency Contact (${row.relationship})`}
          </span>
        </div>
      ),
    },
    {
      id: "status",
      header: "Status",
      width: "15%",
      cell: (row) => {
        const context = getRowContext(row);
        if (!context) return null;

        const isActive = row.status === "registered";
        return (
          <StatusBadge
            status={
              context.userIsDeceased
                ? "deceased"
                : isActive
                  ? "active"
                  : context.invitationStatus === "expired"
                    ? "expired"
                    : "pending"
            }
          />
        );
      },
    },
    {
      id: "date",
      header: "Date Received",
      width: "15%",
      cell: (row, helpers: TableHelpers) => (
        <div className="flex items-center gap-2.5">
          <span className="text-foreground/80">
            {helpers.formatDate(row.created_at)}
          </span>
        </div>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      width: "20%",
      align: "center",
      cell: (row) => {
        const context = getRowContext(row);
        if (!context) return null;
        const willOwnerFullname = `${context.userDetails.firstname} ${context.userDetails.lastname}`;
        return (
          <div className="flex justify-center gap-2">
            {context.userIsDeceased ? (
              context.isRepresentative ? (
                <Button
                  size={"sm"}
                  onClick={() => handleViewWill(row.user_id, willOwnerFullname)}
                >
                  View Will Documents
                </Button>
              ) : (
                <RepresentativeNotified
                  willOwnerFirstname={context.willOwnerFirstname}
                />
              )
            ) : context.invitationStatus === "expired" ? (
              <span className="text-sm text-muted-foreground italic">
                Invitation expired
              </span>
            ) : row.status === "pending" ? (
              <AcceptInvitationModal
                responsibility={row}
                userDetails={context.userDetails}
                onAccept={
                  context.isRepresentative
                    ? handleAcceptRepresentativeInvitation
                    : handleAcceptEmergencyContactInvitation
                }
                isAccepting={isAccepting === row.id}
                type={
                  context.isRepresentative
                    ? "representative"
                    : "emergency-contact"
                }
              />
            ) : context.isRepresentative ? (
              <Button
                variant={"ghost"}
                size={"icon"}
                onClick={() =>
                  handleViewWill(
                    row.user_id,
                    `${context.userDetails.firstname} ${context.userDetails.lastname}`
                  )
                }
              >
                <Eye />
              </Button>
            ) : (
              <>
                <Button
                  variant={"ghost"}
                  size={"icon"}
                  onClick={() => handleViewEmergencyContactDetails(row)}
                >
                  <Eye />
                </Button>
              </>
            )}
          </div>
        );
      },
    },
  ];

  // Filter rows to only those that have context available in our map
  const filteredResponsibilities = React.useMemo(() => {
    return responsibilities.filter((r) => rowContextsMap.has(r.id));
  }, [responsibilities, rowContextsMap]);

  return (
    <DataTable
      data={filteredResponsibilities}
      columns={columns}
      keyField="id"
      emptyMessage="No responsibilities found"
    />
  );
}

export default ResponsibilityListView;
