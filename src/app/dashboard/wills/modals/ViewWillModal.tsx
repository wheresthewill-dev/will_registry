"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Eye,
  ExternalLink,
  X,
  FileText,
  Clock,
  Info,
  FileUp,
} from "lucide-react";
import FilePreview from "@/components/custom/file-preview";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getDocumentDisplayName,
  getFormattedLastUpdated,
  hasDocumentFile,
  getDocumentFileUrls,
  getDocumentFileCount,
  getDocumentFileNames,
  DocumentLocation,
} from "@/app/utils/repo_services/interfaces/document_location";
import MultiFileDownload from "@/components/custom/multi-file-download";

interface ViewWillModalProps {
  document: DocumentLocation;
  iconOnly?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
}

export default function ViewWillModal({
  document,
  iconOnly = false,
  isOpen,
  onClose,
}: ViewWillModalProps) {
  // If controlled mode (isOpen and onClose provided), use controlled Dialog
  if (isOpen !== undefined && onClose) {
    return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-3xl sm:max-w-4xl">
          <DialogHeader className="px-1">
            <div className="flex justify-between items-start">
              <div>
                <DialogTitle className="text-xl font-semibold tracking-tight">
                  {getDocumentDisplayName(document)}
                </DialogTitle>
                <DialogDescription>
                  View document details and attached files
                </DialogDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="rounded-full h-8 w-8 absolute right-4 top-4"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </Button>
            </div>
          </DialogHeader>

          <Separator className="my-2" />

          <div className="overflow-hidden">
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="w-full justify-start mb-4">
                <TabsTrigger
                  value="details"
                  className="flex items-center gap-1.5"
                >
                  <Info className="h-4 w-4" />
                  <span>Document Details</span>
                </TabsTrigger>
                <TabsTrigger
                  value="files"
                  className="flex items-center gap-1.5"
                >
                  <FileUp className="h-4 w-4" />
                  <span>Attached Files</span>
                  {hasDocumentFile(document) && (
                    <Badge
                      variant="secondary"
                      className="ml-1 bg-primary/10 text-primary border-primary/20 text-xs"
                    >
                      {getDocumentFileCount(document)}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <DialogFooter className="mt-6 pt-4 border-t gap-2 sm:gap-0">
            <Button variant="outline" onClick={onClose} className="px-4">
              Close
            </Button>
            {hasDocumentFile(document) && (
              <Button
                variant="default"
                className="gap-2 px-4"
                onClick={() => {
                  const url = getDocumentFileUrls(document)[0];
                  if (url) window.open(url, "_blank", "noopener,noreferrer");
                }}
              >
                <ExternalLink className="h-4 w-4" />
                View Files
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // Default trigger-based mode
  return (
    <Dialog>
      <DialogTrigger asChild>
        {iconOnly ? (
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <Eye className="h-4 w-4" />
            <span className="sr-only">View details</span>
          </Button>
        ) : (
          <Button variant="outline" size="sm" className="gap-1.5">
            <Eye className="h-4 w-4" />
            View Details
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-3xl sm:max-w-4xl">
        <DialogHeader className="px-1">
          <div className="flex justify-between items-start">
            <div>
              <DialogTitle className="text-xl font-semibold tracking-tight mb-2">
                {getDocumentDisplayName(document)}
              </DialogTitle>
              <DialogDescription>
                View details and attached files
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Separator className="my-3" />

        <div className="overflow-hidden">
          <Tabs defaultValue="details" className="w-full">
            <div className="px-1">
              <TabsList className="w-full justify-start mb-6 bg-muted/50 p-1 rounded-lg">
                <TabsTrigger
                  value="details"
                  className="flex items-center gap-2 px-4 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                  <Info className="h-4 w-4" />
                  <span>Document Details</span>
                </TabsTrigger>
                <TabsTrigger
                  value="files"
                  className="flex items-center gap-2 px-4 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                  <FileUp className="h-4 w-4" />
                  <span>Attached Files</span>
                  {hasDocumentFile(document) && (
                    <Badge
                      variant="secondary"
                      className="ml-1 bg-primary/10 text-primary border-primary/20 text-xs"
                    >
                      {getDocumentFileCount(document)}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>
            </div>

            <ScrollArea className="h-[60vh] px-1 pr-4">
              <TabsContent value="details" className="mt-0">
                <div className="space-y-6">
                  {/* Document Title Section */}
                  <div className="p-5 bg-card rounded-lg border border-border/30 shadow-sm">
                    <div className="flex items-center mb-3">
                      <h3 className="font-medium text-lg tracking-tight">
                        Document Details
                      </h3>
                    </div>

                    <div className="space-y-5">
                      {/* Title Field */}
                      <div className="space-y-2">
                        <div className="flex items-center">
                          <span className="text-sm font-medium text-muted-foreground mr-1">
                            Title
                          </span>
                          <Separator className="flex-1 ml-3" />
                        </div>
                        <div className="p-4 bg-muted/20 rounded-md border border-border/30">
                          <h4 className="text-base font-medium">
                            {getDocumentDisplayName(document)}
                          </h4>
                        </div>
                      </div>

                      {/* Description Field */}
                      <div className="space-y-2">
                        <div className="flex items-center">
                          <span className="text-sm font-medium text-muted-foreground mr-1">
                            Description/Location
                          </span>
                          <Separator className="flex-1 ml-3" />
                        </div>
                        <div className="p-4 bg-muted/20 rounded-md border border-border/30 min-h-[120px]">
                          {document.description ? (
                            <p className="text-sm whitespace-pre-wrap leading-relaxed">
                              {document.description}
                            </p>
                          ) : (
                            <div className="flex items-center justify-center h-full py-8">
                              <p className="text-sm text-muted-foreground italic">
                                No description provided
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Last Updated Field */}
                      <div className="space-y-2">
                        <div className="flex items-center">
                          <span className="text-sm font-medium text-muted-foreground mr-1">
                            Last Updated
                          </span>
                          <Separator className="flex-1 ml-3" />
                        </div>
                        <div className="p-4 bg-muted/20 rounded-md border border-border/30">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {getFormattedLastUpdated(document)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="files" className="mt-0">
                <div className="space-y-6">
                  <div className="p-5 bg-card rounded-lg border border-border/30 shadow-sm">
                    <div className="flex items-center mb-4">
                      <h3 className="font-medium text-lg tracking-tight">
                        Attached Files
                      </h3>
                    </div>

                    <div className="space-y-5">
                      {hasDocumentFile(document) ? (
                        <>
                          <div className="flex items-center justify-between mb-3">
                            <Badge
                              variant="outline"
                              className="bg-primary/5 px-2 py-1"
                            >
                              {getDocumentFileCount(document)} file
                              {getDocumentFileCount(document) !== 1
                                ? "s"
                                : ""}{" "}
                              attached
                            </Badge>
                            <MultiFileDownload
                              files={getDocumentFileUrls(document).map(
                                (url, index) => ({
                                  url,
                                  fileName:
                                    getDocumentFileNames(document)[index] ||
                                    `Document ${index + 1}`,
                                })
                              )}
                              zipFileName={
                                getDocumentDisplayName(document) +
                                " - Will Files"
                              }
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {getDocumentFileUrls(document).map((url, index) => {
                              const fileNames = getDocumentFileNames(document);
                              const fileName =
                                fileNames[index] || `Document ${index + 1}`;
                              return (
                                <FilePreview
                                  key={url}
                                  url={url}
                                  fileName={fileName}
                                  className="shadow-sm hover:shadow-md transition-shadow"
                                />
                              );
                            })}
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-12 px-6 border border-dashed rounded-lg text-center bg-muted/10">
                          <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                            <FileText className="h-7 w-7 text-muted-foreground" />
                          </div>
                          <h3 className="text-lg font-medium mb-2">
                            No files attached
                          </h3>
                          <p className="text-sm text-muted-foreground max-w-md">
                            This document doesn't have any files attached to it.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
