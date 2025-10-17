"use client";

import React, { useState, DragEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, File as FileIcon, X } from "lucide-react";
import { toast } from "sonner";

interface FileUploadProps {
  label?: string;
  description?: string;
  accept?: string;
  maxSizeMB?: number;
  onFileSelect: (file: File | null) => void;
  initialFile?: File | null;
}

export default function FileUpload({
  label = "Upload File",
  description = "Drag & drop or click to select a file",
  accept = ".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png",
  maxSizeMB = 10,
  onFileSelect,
  initialFile = null,
}: FileUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(initialFile);
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = (file: File) => {
    if (file.size > maxSizeMB * 1024 * 1024) {
      toast.error(`File size must not exceed to ${maxSizeMB}MB`);
      return;
    }
    setSelectedFile(file);
    onFileSelect(file);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const removeFile = () => {
    setSelectedFile(null);
    onFileSelect(null);
  };

  return (
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
        onClick={() => document.getElementById("file-input")?.click()}
      >
        {selectedFile ? (
          <div className="flex flex-col items-center gap-2">
            <FileIcon className="w-8 h-8 text-blue-600" />
            <p className="font-medium">{selectedFile.name}</p>
            <p className="text-xs text-gray-500">
              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                removeFile();
              }}
            >
              <X /> Remove
            </Button>
          </div>
        ) : (
          <>
            <Upload className="w-8 h-8 mb-2 text-gray-400" />
            <p className="font-medium">{label}</p>
            <p className="text-sm text-gray-500">{description}</p>
            <p className="text-xs text-gray-400 mt-1">
              {accept} | up to {maxSizeMB}MB
            </p>
          </>
        )}
        <input
          id="file-input"
          type="file"
          accept={accept}
          className="hidden"
          onChange={handleInputChange}
        />
      </CardContent>
    </Card>
  );
}
