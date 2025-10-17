"use client";

import React from "react";

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { FileDown } from "lucide-react";
import { useState } from "react";
import { useDocumentLocations } from "@/app/utils/repo_services/hooks/document_location";
import { DocumentLocation } from "@/app/utils/repo_services/interfaces/document_location";
import AddWillModal from "./modals/AddWillModal";
import DeleteWillModal from "./modals/DeleteWillModal";
import EditWillModal from "./modals/EditWillModal";
import ViewWillModal from "./modals/ViewWillModal";
import WillsTable from "@/components/custom/wills-table";
export default function WillsPage() {
  // Table filters
  const [searchTerm, setSearchTerm] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [viewModalDocument, setViewModalDocument] =
    useState<DocumentLocation | null>(null);

  // Document fetching
  const {
    data: documents,
    loading,
    error,
    searchDocuments,
    refresh,
  } = useDocumentLocations();

  // Available years for filtering
  const availableYears = Array.from(
    new Set(
      documents.map((doc) =>
        new Date(doc.last_updated || doc.id).getFullYear().toString()
      )
    )
  ).sort((a, b) => b.localeCompare(a));

  // Apply filters
  const filteredDocuments = searchTerm
    ? searchDocuments(searchTerm)
    : documents;

  const finalFilteredDocuments = filteredDocuments.filter((doc) => {
    if (!filterYear) return true;
    const docYear = new Date(doc.last_updated || doc.id)
      .getFullYear()
      .toString();
    return docYear === filterYear;
  });

  if (loading) {
    return (
      <Card className="rounded-lg shadow-md">
        <CardHeader>
          <div className="h-8 bg-gray-200 rounded w-32 mb-2 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-80 animate-pulse"></div>
        </CardHeader>
        <CardContent>
          {/* Search and filter controls skeleton */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="h-10 bg-gray-200 rounded md:w-1/2 animate-pulse"></div>
            <div className="h-10 bg-gray-200 rounded md:w-40 animate-pulse"></div>
            <div className="flex gap-2 items-center ml-auto">
              <div className="h-10 bg-gray-200 rounded w-24 animate-pulse"></div>
              <div className="h-10 bg-gray-200 rounded w-20 animate-pulse"></div>
            </div>
          </div>

          {/* Table skeleton */}
          <div className="overflow-x-auto">
            <div className="w-full border rounded-lg shadow-sm">
              {/* Table header skeleton */}
              <div className="bg-gray-100 border-b">
                <div className="flex">
                  <div className="flex-1 p-4">
                    <div className="h-4 bg-gray-200 rounded w-12 animate-pulse"></div>
                  </div>
                  <div className="flex-1 p-4">
                    <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
                  </div>
                  <div className="flex-1 p-4">
                    <div className="h-4 bg-gray-200 rounded w-8 animate-pulse"></div>
                  </div>
                  <div className="flex-1 p-4">
                    <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                  </div>
                  <div className="flex-1 p-4">
                    <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
                  </div>
                </div>
              </div>

              {/* Table body skeleton */}
              <div className="divide-y">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex hover:bg-gray-50">
                    <div className="flex-1 p-4">
                      <div className="h-4 bg-gray-200 rounded w-36 animate-pulse"></div>
                    </div>
                    <div className="flex-1 p-4">
                      <div className="h-4 bg-gray-200 rounded w-48 animate-pulse"></div>
                    </div>
                    <div className="flex-1 p-4">
                      <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
                    </div>
                    <div className="flex-1 p-4">
                      <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                    </div>
                    <div className="flex-1 p-4">
                      <div className="flex gap-2">
                        <div className="h-8 bg-gray-200 rounded w-16 animate-pulse"></div>
                        <div className="h-8 bg-gray-200 rounded w-16 animate-pulse"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Table caption skeleton */}
              <div className="p-4 text-center">
                <div className="h-3 bg-gray-200 rounded w-48 mx-auto animate-pulse"></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8 text-destructive">
          Error loading documents: {error}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-lg shadow-md">
      <CardHeader>
        <CardTitle className="text-2xl font-semibold">My Wills</CardTitle>
        <CardDescription className="text-muted-foreground text-sm">
          View, manage, and update your existing wills.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Search and filter controls */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <Input
            type="text"
            placeholder="Search by title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="md:w-1/2"
          />
          <Select value={filterYear} onValueChange={setFilterYear}>
            <SelectTrigger className="md:w-40">
              <SelectValue placeholder="Filter by Year" />
            </SelectTrigger>
            <SelectContent>
              {availableYears.length > 0 ? (
                availableYears.map((year) => (
                  <SelectItem key={year} value={year}>
                    {year}
                  </SelectItem>
                ))
              ) : (
                <div className="px-3 py-2 text-sm text-gray-500">
                  No years available
                </div>
              )}
            </SelectContent>
          </Select>

          <div className="flex gap-2 items-center ml-auto">
            <Button variant="outline">
              <FileDown /> Export All
            </Button>
            <AddWillModal onSuccess={refresh} />
          </div>
        </div>

        {/* Wills table */}
        <WillsTable
          documents={finalFilteredDocuments}
          searchTerm={searchTerm}
          filterTerm={filterYear}
          onView={(document) => setViewModalDocument(document)}
          emptyStateMessage="No documents found. Add your first will above."
          tableCaption="You have reached the end of the list."
          renderActions={(document) => (
            <div
              className="flex gap-1 justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <ViewWillModal document={document} iconOnly={true} />
              <EditWillModal
                documentId={document.id}
                onSuccess={refresh}
                iconOnly={true}
              />
              <DeleteWillModal
                documentId={document.id}
                document={document}
                onSuccess={refresh}
                iconOnly={true}
              />
            </div>
          )}
        />
      </CardContent>
    </Card>
  );
}
