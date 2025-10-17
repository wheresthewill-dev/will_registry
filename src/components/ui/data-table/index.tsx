import React, { ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { formatDate as defaultFormatDate } from "@/utils/formatDate";

// Define column interface for better type safety
export interface TableColumn {
  id: string;
  header: string;
  width?: string;
  align?: "left" | "center" | "right";
  cell: (row: any, helpers: TableHelpers) => ReactNode;
}

// Define helpers interface to provide common utility functions
export interface TableHelpers {
  getStatusClass: (status: string) => string;
  formatDate: (date: string) => string;
  router: ReturnType<typeof useRouter>;
  classNames?: Record<string, string>;
  [key: string]: any; // Allow for custom helper functions
}

export interface DataTableProps {
  data: any[];
  columns: TableColumn[];
  keyField?: string;
  className?: string;
  emptyMessage?: string;
  helpers?: Partial<TableHelpers>;
  onRowClick?: ReactNode;
  rowClassName?: (item: any) => string | undefined;
  headerRowClassName?: string;
  headerCellClassName?: string;
  bodyCellClassName?: string;
  tableCellClassName?: (columnId: string) => string;
  emptyStateComponent?: ReactNode;
}

export function DataTable({
  data,
  columns,
  keyField = "id",
  className,
  emptyMessage = "No data available",
  helpers,
  onRowClick,
  rowClassName,
  headerRowClassName = "bg-muted/30 hover:bg-muted/30",
  headerCellClassName,
  bodyCellClassName = "py-4",
  tableCellClassName,
  emptyStateComponent,
}: DataTableProps) {
  const router = useRouter();

  // Default helper functions
  const tableHelpers: TableHelpers = {
    getStatusClass: (status: string) => {
      switch (status) {
        case "pending":
          return "border-l-4 border-l-blue-500/50";
        case "expired":
          return "border-l-4 border-l-gray-400/50";
        case "active":
          return "";
        default:
          return "";
      }
    },
    formatDate: (date: string) => defaultFormatDate(date),
    router,
    ...helpers,
  };

  return (
    <Table className={cn("w-full border rounded-lg shadow-sm", className)}>
      <TableHeader>
        <TableRow className={headerRowClassName}>
          {columns.map((column) => (
            <TableHead
              key={column.id}
              className={cn(
                "py-3.5",
                column.width && `w-[${column.width}]`,
                column.align === "center" && "text-center",
                column.align === "right" && "text-right",
                headerCellClassName
              )}
            >
              {column.header}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={columns.length}
              className="h-24 text-center text-muted-foreground"
            >
              {emptyStateComponent || emptyMessage}
            </TableCell>
          </TableRow>
        ) : (
          data.map((row) => (
            <TableRow
              key={row[keyField]}
              className={cn(
                "relative",
                rowClassName && rowClassName(row),
                onRowClick && "cursor-pointer"
              )}
            >
              {columns.map((column) => (
                <TableCell
                  key={`${row[keyField]}-${column.id}`}
                  className={cn(
                    bodyCellClassName,
                    column.align === "center" && "text-center",
                    column.align === "right" && "text-right",
                    tableCellClassName && tableCellClassName(column.id)
                  )}
                >
                  {column.cell(row, tableHelpers)}
                </TableCell>
              ))}
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
