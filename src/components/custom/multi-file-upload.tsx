"use client";

import React, { useState, DragEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, X } from "lucide-react";
import { toast } from "sonner";
import FilePreview from "./file-preview";

interface FilePreview {
  file: File;
  id: string;
  preview?: string; // For image previews
}

interface MultiFileUploadProps {
  label?: string;
  description?: string;
  accept?: string;
  maxSizeMB?: number;
  maxFiles?: number;
  onFilesChange: (files: File[]) => void;
  initialFiles?: File[];
  existingUrls?: string[]; // For showing already uploaded files
  onExistingUrlsChange?: (urls: string[]) => void; // Callback when existing files are deleted
}

export default function MultiFileUpload({
  label = "Upload Files",
  description = "Drag & drop or click to select files",
  accept = ".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png",
  maxSizeMB = 10,
  maxFiles = 5,
  onFilesChange,
  initialFiles = [],
  existingUrls = [],
  onExistingUrlsChange,
}: MultiFileUploadProps) {
  const [selectedFiles, setSelectedFiles] = useState<FilePreview[]>(
    initialFiles.map((file) => ({
      file,
      id: `${file.name}-${file.size}-${Date.now()}`,
      preview: file.type.startsWith("image/")
        ? URL.createObjectURL(file)
        : undefined,
    }))
  );
  const [localExistingUrls, setLocalExistingUrls] =
    useState<string[]>(existingUrls);
  const [isDragging, setIsDragging] = useState(false);

  const validateFile = (file: File): string | null => {
    if (file.size > maxSizeMB * 1024 * 1024) {
      return `File size must not exceed ${maxSizeMB}MB`;
    }

    const fileExtension = file.name.split(".").pop()?.toLowerCase();
    const allowedExtensions = accept
      .split(",")
      .map((ext) => ext.trim().replace(".", ""));

    if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
      return `File type not allowed. Allowed types: ${allowedExtensions.join(", ")}`;
    }

    return null;
  };

  const addFiles = (newFiles: FileList | File[]) => {
    const fileArray = Array.from(newFiles);
    const validFiles: FilePreview[] = [];

    for (const file of fileArray) {
      // Check if we've reached max files
      if (selectedFiles.length + validFiles.length >= maxFiles) {
        toast.error(`Maximum ${maxFiles} files allowed`);
        break;
      }

      // Check if file already exists
      const isDuplicate = selectedFiles.some(
        (f) => f.file.name === file.name && f.file.size === file.size
      );

      if (isDuplicate) {
        toast.error(`File "${file.name}" already added`);
        continue;
      }

      // Validate file
      const error = validateFile(file);
      if (error) {
        toast.error(`${file.name}: ${error}`);
        continue;
      }

      // Create preview
      const filePreview: FilePreview = {
        file,
        id: `${file.name}-${file.size}-${Date.now()}-${Math.random()}`,
        preview: file.type.startsWith("image/")
          ? URL.createObjectURL(file)
          : undefined,
      };

      validFiles.push(filePreview);
    }

    if (validFiles.length > 0) {
      const newSelectedFiles = [...selectedFiles, ...validFiles];
      setSelectedFiles(newSelectedFiles);
      onFilesChange(newSelectedFiles.map((f) => f.file));

      if (validFiles.length === 1) {
        toast.success(`Added ${validFiles[0].file.name}`);
      } else {
        toast.success(`Added ${validFiles.length} files`);
      }
    }
  };

  const removeFile = (id: string) => {
    const newSelectedFiles = selectedFiles.filter((f) => f.id !== id);
    setSelectedFiles(newSelectedFiles);
    onFilesChange(newSelectedFiles.map((f) => f.file));

    // Clean up preview URL
    const removedFile = selectedFiles.find((f) => f.id === id);
    if (removedFile?.preview) {
      URL.revokeObjectURL(removedFile.preview);
    }
  };

  const removeExistingFile = (url: string) => {
    const newExistingUrls = localExistingUrls.filter((u) => u !== url);
    setLocalExistingUrls(newExistingUrls);

    // Notify parent component about change in existing urls
    if (onExistingUrlsChange) {
      onExistingUrlsChange(newExistingUrls);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    addFiles(e.dataTransfer.files);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addFiles(e.target.files);
    }
  };

  const canAddMoreFiles =
    selectedFiles.length + localExistingUrls.length < maxFiles;

  return (
    <div className="space-y-4">
      {/* Existing Files Display */}
      {localExistingUrls.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Existing Files</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {localExistingUrls.map((url, index) => {
              const fileName = url.split("/").pop() || `File ${index + 1}`;

              return (
                <div key={url} className="relative">
                  <FilePreview
                    url={url}
                    fileName={fileName}
                    className="border-green-200"
                  />
                  {/* Delete button overlay */}
                  {onExistingUrlsChange && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-1 right-1 w-7 h-7 p-0 bg-white bg-opacity-70 hover:bg-opacity-100 text-red-600 hover:text-red-700 rounded-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeExistingFile(url);
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* New Files Upload Area */}
      {canAddMoreFiles && (
        <Card className="border-dashed border-2 border-gray-300 hover:border-blue-400 transition-colors">
          <CardContent
            className={`flex flex-col items-center justify-center p-6 text-center rounded-md cursor-pointer ${
              isDragging ? "bg-blue-50 border-blue-400" : "bg-white"
            }`}
            onDrop={handleDrop}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onClick={() => document.getElementById("multi-file-input")?.click()}
          >
            <Upload className="w-8 h-8 mb-2 text-gray-400" />
            <p className="font-medium">{label}</p>
            <p className="text-sm text-gray-500">{description}</p>
            <p className="text-xs text-gray-400 mt-1">
              {accept.split(".").map((item) => item.toUpperCase() + " ")} | up
              to {maxSizeMB}MB each |{" "}
              {maxFiles - selectedFiles.length - existingUrls.length} slots
              remaining
            </p>
            <input
              id="multi-file-input"
              type="file"
              accept={accept}
              multiple
              className="hidden"
              onChange={handleInputChange}
            />
          </CardContent>
        </Card>
      )}

      {/* Selected Files Preview */}
      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">
            New Files to Upload ({selectedFiles.length})
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {selectedFiles.map((filePreview) => {
              // For local files, create a preview URL if not already created
              const previewUrl =
                filePreview.preview ||
                (filePreview.file.type.startsWith("image/")
                  ? URL.createObjectURL(filePreview.file)
                  : null);

              return (
                <div key={filePreview.id} className="relative">
                  <FilePreview
                    url={previewUrl || ""}
                    fileName={filePreview.file.name}
                    className="border-blue-200"
                    showPreview={!!previewUrl}
                  />
                  {/* Delete button overlay */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-1 right-1 w-7 h-7 p-0 bg-white bg-opacity-70 hover:bg-opacity-100 text-red-600 hover:text-red-700 rounded-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(filePreview.id);
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* File Count Summary */}
      <div className="text-xs text-gray-500 text-center">
        {localExistingUrls.length + selectedFiles.length} of {maxFiles} files
      </div>
    </div>
  );
}
