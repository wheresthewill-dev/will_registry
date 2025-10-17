import React from "react";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  TableCaption,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, Eye } from "lucide-react";
import {
  getDocumentDisplayName,
  getFormattedLastUpdated,
  hasDocumentFile,
  getDocumentFileCount,
  DocumentLocation,
} from "@/app/utils/repo_services/interfaces/document_location";

export interface WillsTableProps {
  documents: DocumentLocation[];
  onView?: (document: DocumentLocation) => void;
  onEdit?: (document: DocumentLocation) => void;
  onDelete?: (document: DocumentLocation) => void;
  emptyStateMessage?: string;
  searchTerm?: string;
  filterTerm?: string;
  maxHeight?: string;
  renderActions?: (document: DocumentLocation) => React.ReactNode;
  tableCaption?: string;
}

export const WillsTable: React.FC<WillsTableProps> = ({
  documents,
  onView,
  emptyStateMessage = "No documents found.",
  searchTerm = "",
  filterTerm = "",
  maxHeight = "70vh",
  renderActions,
  tableCaption,
}) => {
  // Use inline style for maxHeight to avoid template literal issues
  const scrollAreaStyle = {
    maxHeight: maxHeight,
    minHeight: "300px",
  };

  return (
    <div className="rounded-md border">
      <ScrollArea style={scrollAreaStyle}>
        <Table className="border-b">
          <TableCaption>
            {tableCaption
              ? tableCaption
              : documents.length > 0
                ? `${documents.length} document${documents.length !== 1 ? "s" : ""}`
                : "No documents found"}
          </TableCaption>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="font-medium">Document Title</TableHead>
              <TableHead className="font-medium">
                Description/Location
              </TableHead>
              <TableHead className="font-medium">Attachments</TableHead>
              <TableHead className="font-medium">Last Updated</TableHead>
              <TableHead className="font-medium w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {documents.map((document) => (
              <TableRow
                key={document.id}
                className="hover:bg-muted/40"
                onClick={() => onView && onView(document)}
              >
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    <span>{getDocumentDisplayName(document)}</span>
                  </div>
                </TableCell>
                <TableCell className="max-w-[12rem]">
                  <div className="truncate text-muted-foreground">
                    {document.description || "No description available"}
                  </div>
                </TableCell>
                <TableCell>
                  {hasDocumentFile(document) ? (
                    <Badge variant="secondary">
                      {getDocumentFileCount(document)} File
                      {getDocumentFileCount(document) !== 1 ? "s" : ""}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground">
                      No File
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {getFormattedLastUpdated(document)}
                </TableCell>
                <TableCell>
                  {renderActions ? (
                    renderActions(document)
                  ) : (
                    <div
                      className="flex justify-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {onView && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="hover:bg-primary/10 hover:text-primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            onView(document);
                          }}
                        >
                          <Eye className="h-3.5 w-3.5 mr-1" />
                          View
                        </Button>
                      )}
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {documents.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center h-[300px]">
                  <div className="flex flex-col items-center justify-center p-8">
                    <div className="rounded-full bg-muted/60 p-3 mb-4">
                      <FileText className="h-8 w-8 text-muted-foreground/70" />
                    </div>
                    <p className="text-lg font-medium mb-1">
                      No Documents Found
                    </p>
                    <p className="text-sm text-muted-foreground max-w-sm">
                      {searchTerm || filterTerm
                        ? `No documents match your search criteria.`
                        : emptyStateMessage}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </ScrollArea>
    </div>
  );
};

export default WillsTable;
