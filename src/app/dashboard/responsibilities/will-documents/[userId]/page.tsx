"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  SelectGroup,
  SelectLabel,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { FileDown, AlertCircle, Search, CalendarIcon, X } from "lucide-react";
import {
  DocumentLocation,
  getDocumentDisplayName,
} from "@/app/utils/repo_services/interfaces/document_location";
import { useDocumentLocations } from "@/app/utils/repo_services/hooks/document_location";
import { useUsers } from "@/app/utils/repo_services/hooks/user";
import ViewWillModal from "@/app/dashboard/wills/modals/ViewWillModal";
import WillsTable from "@/components/custom/wills-table";

export default function UserEstatePage() {
  const params = useParams();
  const router = useRouter();
  const { getDocumentsForUser } = useDocumentLocations();
  const { getUserById } = useUsers();
  const [viewModalDocument, setViewModalDocument] =
    useState<DocumentLocation | null>(null);

  // Stabilize userId to prevent re-renders
  const userId = React.useMemo(() => {
    return params?.userId ? parseInt(params.userId as string) : null;
  }, [params?.userId]);

  const [documents, setDocuments] = useState<any[]>([]);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasLoadedRef = useRef(false);

  // Table filters
  const [searchTerm, setSearchTerm] = useState("");
  const [filterYear, setFilterYear] = useState("all");

  // Load documents function - defined outside useEffect to be accessible elsewhere
  const loadDocuments = async () => {
    // Prevent multiple calls
    if (hasLoadedRef.current && !loading) {
      return;
    }

    if (!userId || isNaN(userId)) {
      setError("Invalid user ID");
      setLoading(false);
      return;
    }

    hasLoadedRef.current = true;
    console.log(`🔄 Loading documents for user ID: ${userId}`);

    try {
      setLoading(true);

      // Fetch user information using hook
      const userResult = await getUserById(userId);
      if (userResult.success) {
        setUserInfo(userResult.user);
        console.log(`✅ User info loaded:`, userResult.user);
      } else {
        console.warn(`⚠️ Failed to load user info:`, userResult.error);
      }

      // Use the hook method to get documents
      const result = await getDocumentsForUser(userId);

      console.log(`📊 Document fetch result:`, result);

      if (result.success) {
        setDocuments(result.documents || []);
        setError(null);
        console.log(
          `✅ Successfully loaded ${result.documents?.length || 0} documents`
        );
      } else {
        setError(result.error || "Failed to load documents");
        setDocuments([]);
        console.error(`❌ Failed to load documents:`, result.error);
      }
    } catch (err) {
      console.error("💥 Unexpected error loading documents:", err);
      setError("An unexpected error occurred");
      setDocuments([]);
      hasLoadedRef.current = false; // Reset on error to allow retry
    } finally {
      setLoading(false);
    }
  };

  // Load documents and user info on component mount
  useEffect(() => {
    loadDocuments();
  }, [userId, getDocumentsForUser, getUserById]); // Include dependencies

  // Helper function to get user display name
  const getUserDisplayName = () => {
    if (!userInfo) return `User ${userId}`;
    const firstName = userInfo.firstname || "";
    const lastName = userInfo.lastname || "";
    const fullName = `${firstName} ${lastName}`.trim();
    return fullName || userInfo.email || `User ${userId}`;
  };

  // Available years for filtering
  const availableYears = Array.from(
    new Set(
      documents.map((doc) =>
        new Date(doc.last_updated || doc.created_at).getFullYear().toString()
      )
    )
  ).sort((a, b) => b.localeCompare(a));

  // Apply filters
  const filteredDocuments = documents.filter((doc) => {
    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesTitle = getDocumentDisplayName(doc)
        .toLowerCase()
        .includes(searchLower);
      const matchesDescription = doc.description
        ?.toLowerCase()
        .includes(searchLower);
      if (!matchesTitle && !matchesDescription) return false;
    }

    // Year filter
    if (filterYear && filterYear !== "all") {
      const docYear = new Date(doc.last_updated || doc.created_at)
        .getFullYear()
        .toString();
      if (docYear !== filterYear) return false;
    }

    return true;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-40" />
          </div>
        </div>

        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-72" />
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Controls skeleton */}
            <div className="flex flex-col md:flex-row gap-4">
              <Skeleton className="h-10 md:w-1/2" />
              <Skeleton className="h-10 w-40" />
              <div className="ml-auto">
                <Skeleton className="h-10 w-48" />
              </div>
            </div>

            <Skeleton className="h-8 w-full" />

            {/* Table skeleton */}
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card className="border-destructive/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-2xl">
              <AlertCircle className="h-6 w-6 text-destructive" />
              Unable to Load Estate Documents
            </CardTitle>
            <CardDescription>
              There was a problem retrieving {getUserDisplayName()}'s estate
              documents
            </CardDescription>
          </CardHeader>

          <CardContent className="flex flex-col items-center pt-6 pb-8">
            <div className="rounded-full bg-destructive/10 p-6 mb-6">
              <AlertCircle className="h-12 w-12 text-destructive" />
            </div>
            <p className="text-muted-foreground mb-6 text-center max-w-md">
              {error}
            </p>
            <div className="flex gap-4">
              <Button
                variant="outline"
                onClick={() => {
                  hasLoadedRef.current = false;
                  setLoading(true);
                  loadDocuments();
                }}
              >
                Try Again
              </Button>
              <Button onClick={() => router.back()} variant="default">
                Return to Responsibilities
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header with user context */}
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {getUserDisplayName()}'s Documents
          </h1>
        </div>
      </div>

      {/* Main content card */}
      <Card className="border shadow-sm">
        <CardHeader className="bg-card/50 border-b">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                Will Documents
              </CardTitle>
              <CardDescription>
                Viewing documents of {getUserDisplayName()} • You have
                representative access
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="">
          {/* User context alert */}
          <Alert className="mb-6 border-amber-200 bg-amber-50">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertTitle className="text-amber-800">
              Representative Access
            </AlertTitle>
            <AlertDescription className="text-amber-700">
              You are currently viewing {getUserDisplayName()}'s will documents,
              not your own.
            </AlertDescription>
          </Alert>

          {/* Active filters display */}
          {(searchTerm || filterYear !== "all") && (
            <div className="flex flex-wrap gap-2 mb-4">
              <div className="text-sm text-muted-foreground py-1">
                Active filters:
              </div>
              {searchTerm && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Search className="h-3 w-3" />
                  {searchTerm}
                  <button
                    onClick={() => setSearchTerm("")}
                    className="ml-1 rounded-full hover:bg-muted p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {filterYear !== "all" && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <CalendarIcon className="h-3 w-3" />
                  Year: {filterYear}
                  <button
                    onClick={() => setFilterYear("all")}
                    className="ml-1 rounded-full hover:bg-muted p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
            </div>
          )}

          {/* Search and filter controls */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder={`Search ${getUserDisplayName()}'s documents...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="flex gap-3">
              <Select value={filterYear} onValueChange={setFilterYear}>
                <SelectTrigger className="w-[140px]">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                    <SelectValue placeholder="Filter by Year" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Year</SelectLabel>
                    <SelectItem value="all">All Years</SelectItem>
                    {availableYears.length > 0 ? (
                      availableYears.map((year) => (
                        <SelectItem key={year} value={year}>
                          {year}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="px-3 py-2 text-sm text-muted-foreground">
                        No years available
                      </div>
                    )}
                  </SelectGroup>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="icon"
                disabled={documents.length === 0}
                title={`Export ${getUserDisplayName()}'s Documents`}
                className="hidden sm:flex"
              >
                <FileDown className="h-4 w-4" />
                <span className="sr-only">Export Documents</span>
              </Button>
            </div>
          </div>

          {/* Documents table */}
          <WillsTable
            documents={filteredDocuments}
            filterTerm={filterYear !== "all" ? filterYear : ""}
            onView={(document) => setViewModalDocument(document)}
            emptyStateMessage={`No estate documents found for ${getUserDisplayName()}.`}
            tableCaption={`${filteredDocuments.length} of ${documents.length} documents`}
            renderActions={(document) => <ViewWillModal document={document} />}
          />
        </CardContent>
      </Card>
    </div>
  );
}
