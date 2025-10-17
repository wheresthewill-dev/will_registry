"use client";

import React, { useState, useRef } from "react";
import { Camera, Upload, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "../user-avatar";
import { useUsers } from "@/app/utils/repo_services/hooks/user";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface ProfileImageUploadProps {
  userName: string;
  userAvatar?: string;
  onImageUpload?: (imageUrl: string) => void;
}

export function ProfileImageUpload({
  userName,
  userAvatar,
  onImageUpload,
}: ProfileImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [alert, setAlert] = useState<{
    type: "success" | "error" | null;
    title: string;
    description: string;
  }>({ type: null, title: "", description: "" });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadProfilePicture } = useUsers();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setAlert({
        type: "error",
        title: "Invalid file type",
        description: "Please upload a JPG, PNG, GIF or WebP image.",
      });
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setAlert({
        type: "error",
        title: "File too large",
        description: "Image must be less than 5MB.",
      });
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload the file
    handleUpload(file);
  };

  const handleUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const result = await uploadProfilePicture(file);

      if (result.success && result.imageUrl) {
        setAlert({
          type: "success",
          title: "Profile picture updated",
          description: "Your profile picture has been updated successfully.",
        });

        // Call the callback if provided
        if (onImageUpload) {
          onImageUpload(result.imageUrl);
        }
      } else {
        throw new Error(result.error || "Failed to upload profile picture");
      }
    } catch (error) {
      console.error("Error uploading profile picture:", error);
      setAlert({
        type: "error",
        title: "Upload failed",
        description:
          error instanceof Error
            ? error.message
            : "An error occurred during upload",
      });
      // Reset preview if upload failed
      setPreviewUrl(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const cancelPreview = () => {
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="flex flex-col items-center">
      {alert.type && (
        <Alert
          variant={alert.type === "success" ? "default" : "destructive"}
          className="mb-4 w-full max-w-xs"
        >
          {alert.type === "error" && <AlertCircle className="h-4 w-4" />}
          <AlertTitle>{alert.title}</AlertTitle>
          <AlertDescription>{alert.description}</AlertDescription>
        </Alert>
      )}

      <div className="relative">
        <UserAvatar
          user={{
            firstname: userName.split(" ")[0] || "",
            lastname: userName.split(" ")[1] || "",
            profile_img: previewUrl || userAvatar,
          }}
          size="large"
        />

        <div className="absolute -bottom-2 -right-2">
          <Button
            size="sm"
            variant="secondary"
            className="rounded-full h-8 w-8 p-0 flex items-center justify-center shadow-md"
            onClick={handleButtonClick}
            disabled={isUploading}
          >
            {isUploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Camera className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* File input (hidden) */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/jpeg,image/png,image/gif,image/webp"
        onChange={handleFileSelect}
      />

      {/* Upload button */}
      <Button
        variant="ghost"
        size="sm"
        className="mt-2 text-xs"
        onClick={handleButtonClick}
        disabled={isUploading}
      >
        {isUploading ? (
          <>
            <Loader2 className="mr-2 h-3 w-3 animate-spin" />
            Uploading...
          </>
        ) : (
          <>
            <Upload className="mr-2 h-3 w-3" />
            Change Picture
          </>
        )}
      </Button>
    </div>
  );
}
