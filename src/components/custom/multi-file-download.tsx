"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { downloadFiles, DownloadableFile } from "@/utils/fileUtils";

interface MultiFileDownloadProps {
  files: DownloadableFile[];
  zipFileName?: string;
  variant?:
    | "default"
    | "outline"
    | "secondary"
    | "ghost"
    | "link"
    | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  children?: React.ReactNode;
}

export default function MultiFileDownload({
  files,
  zipFileName,
  variant = "default",
  size = "default",
  className = "",
  children,
}: MultiFileDownloadProps) {
  if (!files || files.length === 0) {
    return null;
  }

  const handleDownload = () => {
    downloadFiles(files, zipFileName || "download");
  };

  const buttonText =
    files.length === 1 ? "Download File" : `Download ${files.length} Files`;

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handleDownload}
    >
      <Download className="w-4 h-4 mr-2" />
      {children || buttonText}
    </Button>
  );
}
