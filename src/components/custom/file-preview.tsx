"use client";

import { useState, ReactNode } from "react";
import {
  File as FileIcon,
  FileText,
  Image as ImageIcon,
  ExternalLink,
  Download,
  Table,
  Archive,
} from "lucide-react";
import { downloadFiles } from "@/utils/fileUtils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";

// Types for file information
interface FileInfo {
  extension: string;
  type: FileType;
  isPreviewable: boolean;
}

// File type enumeration
enum FileType {
  Image = "image",
  PDF = "pdf",
  Document = "document",
  Spreadsheet = "spreadsheet",
  Text = "text",
  Archive = "archive",
  Unknown = "unknown",
}

// Component props
interface FilePreviewProps {
  url: string;
  fileName: string;
  showPreview?: boolean;
  className?: string;
}

// Icon configuration type
interface FileIconConfig {
  icon: ReactNode;
  bgColor: string;
  textColor: string;
  label: string;
}

// Helper function to get file information from filename
const getFileInfo = (fileName: string): FileInfo => {
  const extension = fileName.split(".").pop()?.toLowerCase() || "";

  if (/\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(fileName)) {
    return { extension, type: FileType.Image, isPreviewable: true };
  }
  if (/\.pdf$/i.test(fileName)) {
    return { extension, type: FileType.PDF, isPreviewable: true };
  }
  if (/\.(doc|docx)$/i.test(fileName)) {
    return { extension, type: FileType.Document, isPreviewable: false };
  }
  if (/\.(xls|xlsx|csv)$/i.test(fileName)) {
    return { extension, type: FileType.Spreadsheet, isPreviewable: false };
  }
  if (/\.(txt|rtf|md)$/i.test(fileName)) {
    return { extension, type: FileType.Text, isPreviewable: false };
  }
  if (/\.(zip|rar|tar|gz|7z)$/i.test(fileName)) {
    return { extension, type: FileType.Archive, isPreviewable: false };
  }

  return { extension, type: FileType.Unknown, isPreviewable: false };
};

// File icon configuration by file type
const FILE_ICON_CONFIG: Record<FileType, FileIconConfig> = {
  [FileType.Image]: {
    icon: <ImageIcon className="w-full h-full p-2.5 text-blue-600" />,
    bgColor: "bg-blue-50",
    textColor: "text-blue-600",
    label: "Image",
  },
  [FileType.PDF]: {
    icon: <FileText className="w-full h-full p-2.5 text-red-600" />,
    bgColor: "bg-red-50",
    textColor: "text-red-600",
    label: "PDF Document",
  },
  [FileType.Document]: {
    icon: <FileText className="w-full h-full p-2.5 text-indigo-600" />,
    bgColor: "bg-indigo-50",
    textColor: "text-indigo-600",
    label: "Document",
  },
  [FileType.Spreadsheet]: {
    icon: <Table className="w-full h-full p-2.5 text-green-600" />,
    bgColor: "bg-green-50",
    textColor: "text-green-600",
    label: "Spreadsheet",
  },
  [FileType.Text]: {
    icon: <FileText className="w-full h-full p-2.5 text-gray-600" />,
    bgColor: "bg-gray-50",
    textColor: "text-gray-600",
    label: "Text File",
  },
  [FileType.Archive]: {
    icon: <Archive className="w-full h-full p-2.5 text-amber-600" />,
    bgColor: "bg-amber-50",
    textColor: "text-amber-600",
    label: "Archive",
  },
  [FileType.Unknown]: {
    icon: <FileIcon className="w-full h-full p-2.5 text-gray-600" />,
    bgColor: "bg-gray-50",
    textColor: "text-gray-600",
    label: "File",
  },
};

// Reusable file action button component
const FileActionButton = ({
  icon,
  onClick,
  href,
  external = false,
  title,
}: {
  icon: ReactNode;
  onClick?: () => void;
  href?: string;
  external?: boolean;
  title: string;
}) => {
  return (
    <Tooltip>
      <TooltipTrigger>
        {href ? (
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 rounded-full hover:bg-gray-100"
            asChild
          >
            <a
              href={href}
              target={external ? "_blank" : undefined}
              rel={external ? "noopener noreferrer" : undefined}
            >
              {icon}
            </a>
          </Button>
        ) : (
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 rounded-full hover:bg-gray-100"
            onClick={onClick}
          >
            {icon}
          </Button>
        )}
      </TooltipTrigger>
      <TooltipContent>{title}</TooltipContent>
    </Tooltip>
  );
};

// File extension badge component
const FileExtensionBadge = ({ extension }: { extension: string }) => (
  <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">
    {extension.toUpperCase()}
  </span>
);

export default function FilePreview({
  url,
  fileName,
  showPreview = true,
  className = "",
}: FilePreviewProps) {
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [previewError, setPreviewError] = useState<string | null>(null);

  // Get file information using our helper functions
  const fileInfo = getFileInfo(fileName);
  const { extension, type, isPreviewable } = fileInfo;
  const iconConfig = FILE_ICON_CONFIG[type];

  // Common handlers
  const handleImageLoaded = () => setIsLoading(false);
  const handleImageError = () => {
    setIsLoading(false);
    setPreviewError("Unable to load image preview");
  };
  const handleDownload = () => downloadFiles({ url, fileName });
  const handleOpenPreview = () => setIsPreviewDialogOpen(true);

  // Render file icon with consistent styling
  const renderFileIcon = () => {
    const iconWrapperClasses =
      "flex items-center justify-center w-full h-full rounded-full";
    return (
      <div className={`${iconWrapperClasses} ${iconConfig.bgColor}`}>
        {iconConfig.icon}
      </div>
    );
  };

  const GenericFilePreview = () => (
    <div className="flex flex-col items-center justify-center p-4">
      <div className="w-16 h-16 mb-3">{renderFileIcon()}</div>
      <span className="text-sm text-gray-600 text-center mb-1">
        {iconConfig.label}
      </span>
    </div>
  );

  const DialogPreviewContent = () => {
    if (type === FileType.Image) {
      return (
        <div className="w-full h-full flex items-center justify-center p-4">
          <img
            src={url}
            alt={fileName}
            className="max-w-full max-h-full object-contain shadow-sm"
          />
        </div>
      );
    }

    if (type === FileType.PDF) {
      return (
        <iframe
          src={`${url}#view=FitH`}
          className="w-full h-full"
          title={fileName}
        />
      );
    }

    return (
      <div className="text-center p-10">
        <div className="p-4 bg-gray-100 rounded-full inline-block mb-5">
          <FileIcon className="w-16 h-16 mx-auto text-gray-500" />
        </div>
        <p className="text-lg mb-2">Preview not available for this file type</p>
        <p className="text-gray-500 mb-6">
          This file format cannot be previewed directly in the browser
        </p>
        <Button
          variant="outline"
          size="lg"
          className="mt-4"
          onClick={handleDownload}
        >
          <Download className="w-4 h-4 mr-2" />
          Download File
        </Button>
      </div>
    );
  };

  return (
    <div
      className={`relative rounded-lg overflow-hidden border border-gray-200 bg-white hover:shadow-md transition-shadow ${className}`}
    >
      <div className="flex flex-col h-full">
        {/* File Preview Area */}
        <div className="flex-1 min-h-[140px] flex items-center justify-center relative bg-gray-50 p-4">
          <GenericFilePreview />
        </div>

        {/* File Info Area */}
        <TooltipProvider>
          <div className="p-3 px-4 border-t border-gray-200">
            <div className="flex justify-between items-start gap-2">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate mb-1">
                  {fileName}
                </div>
                <div className="flex items-center gap-2">
                  <FileExtensionBadge extension={extension} />
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <FileActionButton
                  icon={<Download className="w-4 h-4 text-gray-600" />}
                  onClick={handleDownload}
                  title={"Download File"}
                />

                <FileActionButton
                  icon={<ExternalLink className="w-4 h-4 text-gray-600" />}
                  href={url}
                  external={true}
                  title={"Open in new tab"}
                />
              </div>
            </div>
          </div>
        </TooltipProvider>
      </div>

      {/* Full Preview Dialog */}
      <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto flex flex-col p-6">
          <DialogHeader className="pb-4">
            <div className="flex items-start justify-between">
              <div>
                <DialogTitle className="text-xl">{fileName}</DialogTitle>
                <DialogDescription className="mt-1.5 flex items-center gap-2">
                  <FileExtensionBadge extension={extension} />
                  <span>File preview</span>
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="mt-6 h-[calc(100vh-260px)] bg-gray-50 rounded-lg overflow-auto flex items-center justify-center border border-gray-200">
            <DialogPreviewContent />
          </div>

          <div className="flex justify-between mt-6 pt-4 border-t border-gray-200">
            <Button
              variant="outline"
              size="lg"
              onClick={() => setIsPreviewDialogOpen(false)}
            >
              Close
            </Button>
            <Button variant="default" size="lg" onClick={handleDownload}>
              <Download />
              Download File
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
