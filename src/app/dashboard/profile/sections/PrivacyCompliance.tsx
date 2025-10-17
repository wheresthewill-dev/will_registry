"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Download, Trash } from "lucide-react";
import { useAccountSettingsContext } from "../../../../contexts/AccountSettingsContext";
import { handleLogOut } from "@/utils/authUtils";

export default function PrivacyComplianceSection() {
  const { currentDateTime } = useAccountSettingsContext();
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleExport = () => {
    setIsExporting(true);
    // Simulate export process
    setTimeout(() => {
      setIsExporting(false);
    }, 2000);
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    // Simulate delete process - would integrate with your account deletion API
    setTimeout(() => {
      setIsDeleting(false);
      // Redirect to logout or home page after account deletion
      handleLogOut();
    }, 3000);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Data Management</CardTitle>
          <CardDescription>
            Control and manage your personal data. Last updated:{" "}
            {currentDateTime}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-lg border border-border p-4">
            <h3 className="text-sm font-medium mb-2">Export My Data</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Download a copy of your personal data that we store on our
              servers. This includes profile information, documents, and account
              history.
            </p>
            <Button variant="outline" onClick={handleExport} disabled>
              <Download className="mr-2 h-4 w-4" />
              {isExporting ? "Preparing Export..." : "Export Data"}
            </Button>
          </div>

          <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
            <h3 className="text-sm font-medium mb-2">Delete Account</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Permanently delete your account and all associated data. This
              action cannot be undone.
            </p>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash className="mr-2 h-4 w-4" />
                  Delete Account
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action will permanently delete your account and remove
                    all of your data from our servers. This action cannot be
                    undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="mr-auto">
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive hover:bg-destructive/90"
                    onClick={handleDeleteAccount}
                    disabled={isDeleting}
                  >
                    {isDeleting ? "Deleting..." : "Yes, Delete My Account"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
