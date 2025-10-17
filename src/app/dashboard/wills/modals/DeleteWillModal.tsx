import React from "react";
import { useDocumentLocations } from "@/app/utils/repo_services/hooks/document_location";
import { Card, CardContent } from "@/components/ui/card";
import { Trash } from "lucide-react";
import AlertDialogDestructive from "@/components/alert-dialog-destructive";
import { toast } from "sonner";
import {
  getDocumentDisplayName,
  DocumentLocation,
} from "@/app/utils/repo_services/interfaces/document_location";

interface DeleteWillModalProps {
  documentId: string;
  document: DocumentLocation;
  onSuccess?: () => void | Promise<void>;
  iconOnly?: boolean;
}

export default function DeleteWillModal({
  document,
  documentId,
  onSuccess,
  iconOnly = false,
}: DeleteWillModalProps) {
  const { deleteDocumentLocation } = useDocumentLocations();

  const handleDelete = async (id: string, name: string) => {
    const success = await deleteDocumentLocation(id);
    if (success) {
      toast.success(`"${name}" has been deleted successfully!`);

      // Call onSuccess callback to refresh parent data
      if (onSuccess) {
        await onSuccess();
      }
    } else {
      toast.error("Failed to delete document");
    }
  };

  return (
    <AlertDialogDestructive
      icon={<Trash />}
      triggerText={iconOnly ? undefined : "Delete"}
      iconOnly={iconOnly}
      variant="ghost"
      size="sm"
      className="hover:bg-destructive/10"
      title={`Delete ${getDocumentDisplayName(document)}`}
      description={
        <>
          Are you sure you want to delete "{getDocumentDisplayName(document)}"?
          <br />
          This action cannot be undone.
        </>
      }
      cancelText="Cancel"
      confirmText="Delete"
      onClick={() => handleDelete(documentId, getDocumentDisplayName(document))}
    />
  );
}
