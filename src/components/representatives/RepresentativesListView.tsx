"use client";

import React, { ReactNode } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/ui/status-badge";
import { DataTable, TableColumn } from "@/components/ui/data-table";
import { cn } from "@/lib/utils";
import { getUserInitials } from "@/utils/getUserInitials";
import { formatDate } from "@/utils/formatDate";
import { getInvitationStatus } from "@/app/utils/invitationStatus";

interface RepresentativesListProps {
  representatives: any[];
  className?: string;
  onResendInvitation?: (representative: any) => ReactNode | ReactNode;
  onDeleteContact?: (representative: any) => ReactNode | ReactNode;
}

export default function RepresentativesListView({
  representatives,
  className,
  onResendInvitation,
  onDeleteContact,
}: RepresentativesListProps) {
  const columns: TableColumn[] = [
    {
      id: "representative",
      header: "Representative",
      width: "30%",
      cell: (representative) => (
        <div className="flex items-center gap-4">
          <Avatar className="h-9 w-9 border border-muted shadow-sm">
            <AvatarFallback
              className={cn("text-primary-foreground", "bg-primary/90")}
            >
              {getUserInitials(
                representative.firstname,
                representative.lastname
              )}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-foreground">
              {representative.firstname} {representative.lastname}
            </p>
            <p className="text-sm text-muted-foreground max-w-[180px]">
              {representative.email}
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "status",
      header: "Status",
      width: "20%",
      cell: (representative) => {
        const invitationStatus = getInvitationStatus(
          representative.status,
          representative.invite_expires
        );
        return <StatusBadge status={invitationStatus} />;
      },
    },
    {
      id: "dateAdded",
      header: "Date Added",
      width: "20%",
      cell: (representative) => (
        <span>{formatDate(representative.created_at)}</span>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      width: "30%",
      align: "center",
      cell: (representative) => {
        return (
          <div>
            {typeof onResendInvitation === "function"
              ? onResendInvitation(representative)
              : onResendInvitation}
            {typeof onDeleteContact === "function"
              ? onDeleteContact(representative)
              : onDeleteContact}
          </div>
        );
      },
    },
  ];

  return (
    <DataTable
      data={representatives}
      columns={columns}
      className={cn("w-full", className)}
      keyField="id"
      emptyMessage="No authorised representatives found"
    />
  );
}
