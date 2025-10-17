"use client";

import React, { ReactNode } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/ui/status-badge";
import { DataTable, TableColumn } from "@/components/ui/data-table";
import { cn } from "@/lib/utils";
import { getUserInitials } from "@/utils/getUserInitials";

interface EmergencyContactListViewProps {
  contacts: any[];
  className?: string;
  onResendInvitation?: ((contact: any) => ReactNode) | ReactNode;
  onDeleteContact?: ((contact: any) => ReactNode) | ReactNode;
}

export function EmergencyContactListView({
  contacts,
  className,
  onResendInvitation,
  onDeleteContact,
}: EmergencyContactListViewProps) {
  const columns: TableColumn[] = [
    {
      id: "contact",
      header: "Contact Person",
      width: "30%",
      cell: (contact) => (
        <div className="flex items-center gap-4">
          <Avatar className="h-9 w-9 border border-muted shadow-sm">
            <AvatarFallback
              className={cn("text-primary-foreground", "bg-primary/90")}
            >
              {getUserInitials(contact.firstname, contact.lastname)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-foreground">
              {contact.firstname} {contact.lastname}
            </p>
            <p className="text-sm text-muted-foreground truncate max-w-[180px]">
              {contact.email}
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "relationship",
      header: "Relationship",
      width: "20%",
      cell: (contact) => (
        <div className="flex items-center gap-2.5">
          <span className="text-foreground/80">
            {contact.relationship
              ? contact.relationship.charAt(0).toUpperCase() +
                contact.relationship.slice(1)
              : ""}
          </span>
        </div>
      ),
    },
    {
      id: "phone",
      header: "Phone Number",
      width: "20%",
      cell: (contact) => (
        <div className="flex items-center gap-2.5">
          <span className="text-foreground/80">{contact.contact_number}</span>
        </div>
      ),
    },
    {
      id: "status",
      header: "Status",
      width: "15%",
      cell: (contact) => (
        <StatusBadge
          status={
            contact.status === "registered"
              ? "active"
              : contact.status || "pending"
          }
        />
      ),
    },
    {
      id: "dateAdded",
      header: "Date Added",
      width: "15%",
      cell: (contact, helpers) => (
        <div className="flex items-center gap-2.5">
          <span className="text-foreground/80">
            {helpers.formatDate(contact.created_at)}
          </span>
        </div>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      width: "20%",
      align: "center",
      cell: (contact) => (
        <div className="flex justify-center gap-2">
          {typeof onResendInvitation === "function"
            ? onResendInvitation(contact)
            : onResendInvitation}
          {typeof onDeleteContact === "function"
            ? onDeleteContact(contact)
            : onDeleteContact}
        </div>
      ),
    },
  ];

  return (
    <DataTable
      data={contacts}
      columns={columns}
      keyField="id"
      className={cn("w-full", className)}
      emptyMessage="No emergency contacts found"
    />
  );
}

export default EmergencyContactListView;
