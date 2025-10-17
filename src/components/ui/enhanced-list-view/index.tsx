"use client";

import React, { ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  TableColumn,
  TableHelpers,
  DataTable,
} from "@/components/ui/data-table";
import { formatDate } from "@/utils/formatDate";

export interface EnhancedListViewColumn extends Omit<TableColumn, "cell"> {
  id: string;
  header: string;
  width?: string;
  align?: "left" | "center" | "right";
  render: (row: any, helpers: EnhancedListViewHelpers) => ReactNode;
  getRawValue?: (row: any) => any;
}

export interface EnhancedListViewHelpers extends TableHelpers {
  formatValue: (value: any, type?: string) => string | ReactNode;
  getDisplayName: (firstName?: string, lastName?: string) => string;
  getCellClass: (type: string, value: any) => string;
  [key: string]: any; // For custom helpers
}

export interface EnhancedListViewProps {
  data: any[];
  columns: EnhancedListViewColumn[];
  keyField?: string;
  className?: string;
  emptyMessage?: string;
  emptyStateComponent?: ReactNode;
  onRowClick?: (item: any) => void;
  rowClassName?: (item: any) => string | undefined;
  additionalHelpers?: Partial<EnhancedListViewHelpers>;
}

export function EnhancedListView({
  data,
  columns,
  keyField = "id",
  className,
  emptyMessage = "No data available",
  emptyStateComponent,
  onRowClick,
  rowClassName,
  additionalHelpers,
}: EnhancedListViewProps) {
  const router = useRouter();

  // Convert enhanced columns to DataTable columns
  const tableColumns: TableColumn[] = columns.map((column) => ({
    id: column.id,
    header: column.header,
    width: column.width,
    align: column.align,
    cell: (row: any, helpers: TableHelpers) => {
      // Cast helpers to EnhancedListViewHelpers since we'll add the additional functions
      return column.render(row, helpers as EnhancedListViewHelpers);
    },
  }));

  // Define default helpers
  const defaultHelpers: Partial<EnhancedListViewHelpers> = {
    getStatusClass: (status: string) => {
      switch (status?.toLowerCase()) {
        case "pending":
          return "border-l-4 border-l-blue-500/50";
        case "expired":
          return "border-l-4 border-l-gray-400/50";
        case "active":
        case "registered":
          return "";
        default:
          return "";
      }
    },
    formatDate: (date: string) => formatDate(date),
    formatValue: (value: any, type?: string) => {
      if (value === null || value === undefined) return "";

      if (type === "date" && typeof value === "string") {
        return formatDate(value);
      }

      if (type === "name" && typeof value === "object") {
        return `${value.firstName || value.firstname || ""} ${value.lastName || value.lastname || ""}`.trim();
      }

      return String(value);
    },
    getDisplayName: (firstName?: string, lastName?: string) => {
      return `${firstName || ""} ${lastName || ""}`.trim();
    },
    getCellClass: (type: string, value: any) => {
      if (type === "status") {
        switch (String(value).toLowerCase()) {
          case "pending":
            return "text-amber-600";
          case "active":
          case "registered":
            return "text-green-600";
          case "expired":
            return "text-gray-500";
          default:
            return "";
        }
      }
      return "";
    },
  };

  return (
    <DataTable
      data={data}
      columns={tableColumns}
      keyField={keyField}
      className={className}
      emptyMessage={emptyMessage}
      emptyStateComponent={emptyStateComponent}
      rowClassName={rowClassName}
      helpers={{
        ...defaultHelpers,
        ...additionalHelpers,
        router,
      }}
    />
  );
}

export default EnhancedListView;
