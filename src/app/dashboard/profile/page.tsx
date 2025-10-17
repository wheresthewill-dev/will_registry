"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  User,
  Settings,
  CreditCard,
  Shield,
  LogOut,
  Loader2,
  Upload,
  X,
  Camera,
} from "lucide-react";
import { useUsers } from "@/app/utils/repo_services/hooks/user";
import AccountDetailsSection from "./sections/AccountDetails";
import ProfileDetailsSection from "./sections/ProfileDetails";
import SubscriptionBillingSection from "./sections/SubscriptionBilling";
import PrivacyComplianceSection from "./sections/PrivacyCompliance";

import { UserAvatar } from "@/components/custom/user-avatar";
import { NavigationItem } from "./sections/userProfileTypes";
import {
  AccountSettingsProvider,
  useAccountSettingsContext,
} from "@/contexts/AccountSettingsContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Maximum file size (3MB)
const MAX_FILE_SIZE = 3 * 1024 * 1024;
// Allowed file types
const ALLOWED_FILE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

// Navigation items outside component to prevent unnecessary re-renders
const navigationItems: NavigationItem[] = [
  { id: "account-details", label: "Account Details", icon: User },
  { id: "profile-details", label: "Profile Details", icon: Settings },
  {
    id: "subscription-billing",
    label: "Subscription & Billing",
    icon: CreditCard,
  },
  { id: "privacy-compliance", label: "Privacy & Compliance", icon: Shield },
];

// Interface for the profile image
interface ProfileImageState {
  file: File | null;
  preview: string | null;
  error: string | null;
  isUploading: boolean;
}

function AccountSettingsContent() {
  const [activeSection, setActiveSection] = useState("account-details");
  const {
    isLoading,
    userData,
    updateProfileImage,
    getSubscriptionInfo,
    currentDateTime,
  } = useAccountSettingsContext();

  // Get the uploadProfilePicture function from the useUsers hook
  const { uploadProfilePicture } = useUsers();

  // Current date and time from requirements
  const CURRENT_DATE_TIME = currentDateTime;

  // Image upload state management
  const [profileImage, setProfileImage] = useState<ProfileImageState>({
    file: null,
    preview: userData?.profileImage || null,
    error: null,
    isUploading: false,
  });

  // Update profile image state when userData changes
  useEffect(() => {
    if (userData?.profileImage && !profileImage.preview) {
      setProfileImage((prev) => ({
        ...prev,
        preview: userData.profileImage || null,
      }));
    }
  }, [userData?.profileImage, profileImage.preview]);

  // Dialog state for image upload
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);
  const [uploadMethod, setUploadMethod] = useState<"upload" | "camera">(
    "upload"
  );

  // File input reference
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Camera reference and state
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading your settings...</p>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="bg-destructive/10 p-6 rounded-lg max-w-md">
          <h2 className="text-lg font-medium mb-2">Error loading settings</h2>
          <p className="text-muted-foreground mb-4">
            {"Could not load account settings. Please try again later."}
          </p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  const userFullName =
    `${userData.firstName || ""} ${userData.lastName || ""}`.trim();

  // Function to handle file validation
  const validateFile = (file: File): string | null => {
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return "File type not supported. Please upload a JPEG, PNG, WebP, or GIF image.";
    }

    if (file.size > MAX_FILE_SIZE) {
      return "File size exceeds the limit. Please upload an image smaller than 3MB.";
    }

    return null;
  };

  // Function to handle file change
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const error = validateFile(file);

    if (error) {
      setProfileImage({
        ...profileImage,
        error,
        file: null,
        preview: null,
      });
      return;
    }

    const objectUrl = URL.createObjectURL(file);

    setProfileImage({
      file,
      preview: objectUrl,
      error: null,
      isUploading: false,
    });
  };

  // Function to trigger file input click
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  // Function to cancel image upload
  const handleCancelUpload = () => {
    if (
      profileImage.preview &&
      profileImage.preview !== userData.profileImage
    ) {
      URL.revokeObjectURL(profileImage.preview);
    }

    setProfileImage({
      file: null,
      preview: userData.profileImage || null,
      error: null,
      isUploading: false,
    });

    setIsImageDialogOpen(false);
    stopCamera();
  };

  // Function to save image upload - using the uploadProfilePicture hook directly
  const handleSaveUpload = async () => {
    if (!profileImage.file && !profileImage.preview) {
      handleCancelUpload();
      return;
    }

    setProfileImage({
      ...profileImage,
      isUploading: true,
    });

    try {
      // Use the uploadProfilePicture function directly
      if (profileImage.file) {
        const result = await uploadProfilePicture(profileImage.file);

        if (!result.success) {
          throw new Error(result.error || "Failed to upload profile image");
        }

        // Update state with the new image URL
        setProfileImage({
          file: null,
          preview: result.imageUrl,
          error: null,
          isUploading: false,
        });
      }

      setIsImageDialogOpen(false);
    } catch (error) {
      console.error("Profile image upload failed:", error);
      setProfileImage({
        ...profileImage,
        error:
          error instanceof Error
            ? error.message
            : "Failed to upload image. Please try again.",
        isUploading: false,
      });
    }
  };

  // Function to remove profile image
  const handleRemoveImage = () => {
    if (profileImage.preview) {
      URL.revokeObjectURL(profileImage.preview);
    }

    setProfileImage({
      file: null,
      preview: null,
      error: null,
      isUploading: false,
    });

    // In a real implementation, you would call an API to remove the image
    updateProfileImage(null);

    setIsImageDialogOpen(false);
  };

  // Function to start camera
  const startCamera = async () => {
    try {
      // First stop any existing camera stream
      stopCamera();

      // Then start a new one with appropriate constraints
      const constraints = {
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user",
        },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          console.log("Camera started successfully");
        };
        setCameraStream(stream);
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
      setProfileImage({
        ...profileImage,
        error: "Could not access camera. Please check permissions.",
      });
    }
  };

  // Function to stop camera
  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => {
        track.stop();
        console.log("Camera track stopped");
      });
      setCameraStream(null);

      // Also clear the video source
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }
  };

  // Function to capture photo from camera
  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current && cameraStream) {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw video frame to canvas
      const ctx = canvas.getContext("2d");
      if (ctx) {
        // Adjust to capture a centered square from the video
        const size = Math.min(video.videoWidth, video.videoHeight);
        const x = (video.videoWidth - size) / 2;
        const y = (video.videoHeight - size) / 2;

        // First draw the full frame
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Then grab a square from it
        const imgData = ctx.getImageData(x, y, size, size);

        // Resize canvas to be square
        canvas.width = size;
        canvas.height = size;

        // Put the square image on the resized canvas
        ctx.putImageData(imgData, 0, 0);
      }

      // Convert canvas to blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const file = new File([blob], "profile-photo.jpg", {
              type: "image/jpeg",
            });
            const objectUrl = URL.createObjectURL(blob);

            setProfileImage({
              file,
              preview: objectUrl,
              error: null,
              isUploading: false,
            });
          }
        },
        "image/jpeg",
        0.9
      );

      // We'll keep the camera on so user can retake if needed
    }
  };

  // Function to retake photo
  const handleRetakePhoto = () => {
    if (profileImage.preview) {
      URL.revokeObjectURL(profileImage.preview);
    }

    setProfileImage({
      file: null,
      preview: null,
      error: null,
      isUploading: false,
    });

    // Restart camera if it was stopped
    if (!cameraStream) {
      startCamera();
    }
  };

  // Handle dialog open and setting up camera if needed
  const handleOpenImageDialog = (method: "upload" | "camera") => {
    setUploadMethod(method);
    setIsImageDialogOpen(true);

    // Reset any errors when opening dialog
    if (profileImage.error) {
      setProfileImage({
        ...profileImage,
        error: null,
      });
    }

    if (method === "camera") {
      // Start camera on next tick to ensure the dialog is open
      setTimeout(() => {
        startCamera();
      }, 300); // Give dialog time to render
    }
  };

  // Clean up on dialog close
  const handleDialogClose = () => {
    // Always stop camera when closing dialog
    stopCamera();

    // Only reset if not saving
    if (profileImage.isUploading) return;

    // Clean up any temporary preview URLs
    if (
      profileImage.preview &&
      profileImage.preview !== userData.profileImage
    ) {
      URL.revokeObjectURL(profileImage.preview);
    }

    // Reset to original profile image
    setProfileImage({
      file: null,
      preview: userData.profileImage || null,
      error: null,
      isUploading: false,
    });
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Left Sidebar */}
      <div className="hidden md:flex w-64 flex-col border-r border-border p-6">
        <div className="flex flex-col items-center space-y-4 pb-6">
          {/* Profile picture with camera icon at bottom-right corner */}
          <div className="relative">
            {/* Avatar component */}
            <div className="relative overflow-hidden flex items-center justify-center">
              <UserAvatar
                user={{
                  firstname: userData.firstName,
                  lastname: userData.lastName,
                  profile_img:
                    profileImage.preview || userData.profileImage || undefined,
                }}
                size="large"
              />
            </div>

            <div className="absolute bottom-0 right-0">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 rounded-full bg-primary/80 hover:bg-primary"
                      onClick={() => setIsImageDialogOpen(true)}
                    >
                      <Camera className="h-4 w-4 text-white" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Change profile picture</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          <div className="text-center">
            <h3 className="font-medium text-foreground">{userFullName}</h3>
            <p className="text-sm text-muted-foreground">{userData.email}</p>
            <p className="text-xs text-muted-foreground mt-1">
              @{userData.username}
            </p>
          </div>
          <Badge variant="outline" className="text-sm">
            {getSubscriptionInfo().name}
          </Badge>
        </div>

        <Separator className="my-4" />

        <nav className="flex flex-col space-y-1">
          {navigationItems.map((item) => (
            <Button
              key={item.id}
              variant={activeSection === item.id ? "secondary" : "ghost"}
              className="justify-start gap-3 px-3"
              onClick={() => setActiveSection(item.id)}
            >
              <item.icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Button>
          ))}
        </nav>
      </div>

      {/* Right Content Area */}
      <div className="flex-1 overflow-auto">
        <div className="container max-w-4xl py-8 px-4 md:px-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-semibold tracking-tight">
              Account Settings
            </h1>
          </div>

          {activeSection === "account-details" && <AccountDetailsSection />}
          {activeSection === "profile-details" && <ProfileDetailsSection />}
          {activeSection === "subscription-billing" && (
            <SubscriptionBillingSection />
          )}
          {activeSection === "privacy-compliance" && (
            <PrivacyComplianceSection />
          )}
        </div>
      </div>

      {/* Profile Image Upload Dialog */}
      <Dialog
        open={isImageDialogOpen}
        onOpenChange={(open) => {
          if (open) {
            setIsImageDialogOpen(open);
            // Wait for dialog to open before starting camera
            if (uploadMethod === "camera") {
              setTimeout(() => {
                startCamera();
              }, 300);
            }
          } else {
            handleDialogClose();
            setIsImageDialogOpen(false);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              Upload Profile Picture
            </DialogTitle>
            <DialogDescription className="text-gray-500">
              Choose a profile picture from your device or use your camera to
              take a new one.
            </DialogDescription>
          </DialogHeader>

          {profileImage.error && (
            <Alert variant="destructive" className="mt-2">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{profileImage.error}</AlertDescription>
            </Alert>
          )}

          <Tabs
            defaultValue="upload"
            className="mt-4"
            onValueChange={(value) => {
              setUploadMethod(value as "upload" | "camera");
              if (value === "camera") {
                startCamera();
              } else {
                stopCamera();
              }
            }}
          >
            <div className="flex justify-center">
              <TabsList className="grid w-[240px] rounded-full bg-gray-100">
                <TabsTrigger
                  value="upload"
                  className="rounded-full px-6 py-1.5 text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm"
                >
                  Upload
                </TabsTrigger>
                {/* Camera tab temporarily disabled
                <TabsTrigger 
                  value="camera" 
                  className="rounded-full px-6 py-1.5 text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm"
                >
                  Camera
                </TabsTrigger>
                */}
              </TabsList>
            </div>

            <TabsContent value="upload" className="mt-2">
              <div className="flex flex-col items-center">
                <div className="mb-4 relative">
                  {profileImage.preview ? (
                    <div
                      className="relative w-48 h-48 rounded-full overflow-hidden cursor-pointer"
                      onClick={handleUploadClick}
                    >
                      <img
                        src={profileImage.preview}
                        alt="Profile Preview"
                        className="w-full h-full object-cover"
                        style={{
                          objectFit: "cover",
                          width: "100%",
                          height: "100%",
                        }}
                        onError={(e) => {
                          console.error("Image failed to load:", e);
                          e.currentTarget.src =
                            "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2'%3E%3C/path%3E%3Ccircle cx='12' cy='7' r='4'%3E%3C/circle%3E%3C/svg%3E";
                        }}
                      />
                    </div>
                  ) : (
                    <div
                      className="w-48 h-48 rounded-full bg-black flex items-center justify-center cursor-pointer"
                      onClick={handleUploadClick}
                    >
                      <Upload className="h-8 w-8 text-white" />
                    </div>
                  )}
                </div>

                <p className="text-center text-sm text-gray-500 mb-4">
                  {profileImage.preview
                    ? "Click on the image to choose a different one"
                    : "Click to browse or drag an image here"}
                </p>

                <Button
                  onClick={handleUploadClick}
                  className="mt-2 rounded-full px-8 py-2 bg-blue-950 text-white hover:bg-blue-900"
                >
                  {profileImage.preview
                    ? "Choose different image"
                    : "Choose different image"}
                </Button>

                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png, image/jpeg, image/webp, image/gif"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
            </TabsContent>

            {/* Camera tab temporarily commented out
            <TabsContent value="camera" className="mt-2">
              <div className="flex flex-col items-center">
                <div className="mb-4 relative">
                  {profileImage.preview ? (
                    <div className="relative w-48 h-48 rounded-full overflow-hidden border-2 border-gray-200">
                      <img
                        src={profileImage.preview}
                        alt="Profile picture preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <>
                      <div className="w-48 h-48 rounded-full overflow-hidden border-2 border-gray-200">
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          muted
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </>
                  )}
                  <canvas ref={canvasRef} className="hidden" />
                </div>
                
                <p className="text-center text-sm text-gray-500 mb-4">
                  {profileImage.preview
                    ? "Looking good! You can retake or save this photo."
                    : "Position yourself in the frame"}
                </p>
                
                <div className="flex gap-3">
                  {profileImage.preview ? (
                    <Button
                      onClick={handleRetakePhoto}
                      className="mt-2 rounded-full px-8 bg-gray-100 text-gray-800 hover:bg-gray-200 border border-gray-300"
                    >
                      Retake Photo
                    </Button>
                  ) : (
                    cameraStream && (
                      <Button
                        onClick={capturePhoto}
                        className="mt-2 rounded-full px-8 bg-gray-900 text-white hover:bg-gray-800"
                      >
                        Take Photo
                      </Button>
                    )
                  )}
                </div>
              </div>
            </TabsContent>
            */}
          </Tabs>

          <DialogFooter className="flex justify-between mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancelUpload}
              disabled={profileImage.isUploading}
              className="rounded-full px-8 py-2.5 text-sm font-medium border-none"
            >
              Cancel
            </Button>

            <div className="flex gap-2">
              {profileImage.preview && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleRemoveImage}
                  disabled={profileImage.isUploading}
                  className="rounded-full px-8 py-2.5 text-sm font-medium bg-red-600 hover:bg-red-700"
                >
                  Remove
                </Button>
              )}

              <Button
                type="button"
                onClick={handleSaveUpload}
                disabled={profileImage.isUploading || !profileImage.preview}
                variant="default"
                className="rounded-full px-8 py-2.5 text-sm font-medium bg-blue-950 text-white hover:bg-blue-900"
              >
                {profileImage.isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save"
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function AccountSettingsPage() {
  return (
    <AccountSettingsProvider>
      <AccountSettingsContent />
    </AccountSettingsProvider>
  );
}
