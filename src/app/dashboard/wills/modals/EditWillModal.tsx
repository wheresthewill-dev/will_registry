"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Pencil, Loader2Icon, Edit } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useDocumentLocations } from "@/app/utils/repo_services/hooks/document_location";
import { getDocumentDisplayName } from "@/app/utils/repo_services/interfaces/document_location";
import { EDIT_WILL_DETAILS } from "@/app/constants/form-field-constants";
import { DialogClose } from "@radix-ui/react-dialog";
import MultiFileUpload from "@/components/custom/multi-file-upload";
import { MODAL_SIZES } from "@/app/constants/sizes";

const editWillSchema = z.object({
  document_label: z.string().min(1, "Please enter will title"),
  description: z.string().min(1, "Please enter will description/location"),
});

interface EditWillDialogProps {
  documentId: string;
  onSuccess?: () => void | Promise<void>;
  iconOnly?: boolean;
}

export default function EditWillDialog({
  documentId,
  onSuccess,
  iconOnly = false,
}: EditWillDialogProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [existingUrls, setExistingUrls] = useState<string[]>([]);
  const [deletedUrls, setDeletedUrls] = useState<string[]>([]);

  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Track if form has been initialized to prevent unwanted resets
  const formInitialized = useRef(false);

  const { getDocumentById, updateDocumentLocation, loading, error } =
    useDocumentLocations();

  const form = useForm<z.infer<typeof editWillSchema>>({
    resolver: zodResolver(editWillSchema),
    defaultValues: {
      document_label: "",
      description: "",
    },
  });

  const document = getDocumentById(documentId);

  // Initialize form only once when document is first loaded or dialog opens
  useEffect(() => {
    if (document && isDialogOpen && !formInitialized.current) {
      form.setValue("document_label", document.document_label || "");
      form.setValue("description", document.description || "");
      setExistingUrls(document.urls || []);
      formInitialized.current = true;
    }
  }, [document, form, isDialogOpen]);

  // Reset form initialization flag when dialog closes
  useEffect(() => {
    if (!isDialogOpen) {
      formInitialized.current = false;
      // Reset all states when dialog closes
      setSelectedFiles([]);
      setDeletedUrls([]);
      form.reset();
    }
  }, [isDialogOpen, form]);

  const onSubmit = async (values: z.infer<typeof editWillSchema>) => {
    setIsSubmitting(true);
    try {
      // Create a new document location object with updated URLs
      const currentUrls = existingUrls.filter(
        (url) => !deletedUrls.includes(url)
      );

      const updateData: {
        description: string;
        document_label: string;
        files?: File[];
        urls?: string[]; // Add explicit URLs field
      } = {
        description: values.description,
        document_label: values.document_label,
        urls: currentUrls, // Explicitly set the URLs we want to keep
      };

      // Add new files if selected
      if (selectedFiles.length > 0) {
        updateData.files = selectedFiles;
      }

      const result = await updateDocumentLocation(documentId, updateData);

      if (result.success) {
        toast.success("Will document updated successfully!");
        setIsDialogOpen(false);

        // Reset states
        setSelectedFiles([]);
        setDeletedUrls([]);
        formInitialized.current = false;

        // Call onSuccess callback to refresh parent data
        if (onSuccess) {
          await onSuccess();
        }
      } else {
        toast.error(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error("Update error:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle cancel/close button in dialog
  const handleModalClose = () => {
    router.push("/dashboard/wills");
  };

  // Handle dialog close with state cleanup
  const handleDialogClose = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      // Clean up states when closing
      setSelectedFiles([]);
      setDeletedUrls([]);
      formInitialized.current = false;
    }
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
      <DialogTrigger asChild>
        {iconOnly ? (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 hover:bg-blue-100"
            onClick={(e) => e.stopPropagation()}
          >
            <Edit className="w-4 h-4 text-blue-600" />
          </Button>
        ) : (
          <Button
            variant="outline"
            className="bg-blue-50 hover:bg-blue-100 text-blue-500 hover:text-blue-600 border-blue-200 hover:border-blue-300"
          >
            <Pencil />
            Edit
          </Button>
        )}
      </DialogTrigger>
      <DialogContent
        className={`${MODAL_SIZES.large} max-h-[90vh] overflow-y-auto`}
        onCloseClick={handleModalClose}
      >
        <DialogHeader>
          <DialogTitle>
            Editing: {document ? getDocumentDisplayName(document) : "Will"}
          </DialogTitle>
          <DialogDescription>
            Update your will document details and file.
          </DialogDescription>
        </DialogHeader>
        {document && (
          <Form {...form}>
            <div className="flex-1 overflow-y-auto px-1 pb-4">
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                {EDIT_WILL_DETAILS.map((detail) => (
                  <FormField
                    key={detail.name}
                    control={form.control}
                    name={detail.name as "document_label" | "description"}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{detail.label}</FormLabel>
                        <FormControl>
                          {detail.type === "textarea" ? (
                            <Textarea
                              {...field}
                              id={detail.name}
                              rows={3} // Optional: Adjust rows as needed
                            />
                          ) : detail.type === "file" ? (
                            <MultiFileUpload
                              label="Upload Will Documents"
                              // description="Upload PDF, Word documents, or images of your will"
                              onFilesChange={setSelectedFiles}
                              initialFiles={selectedFiles}
                              existingUrls={existingUrls.filter(
                                (url) => !deletedUrls.includes(url)
                              )}
                              onExistingUrlsChange={(urls) => {
                                // Calculate which URLs were removed
                                const newDeletedUrls = existingUrls.filter(
                                  (url) => !urls.includes(url)
                                );
                                setDeletedUrls([
                                  ...deletedUrls,
                                  ...newDeletedUrls,
                                ]);
                              }}
                              maxFiles={5}
                            />
                          ) : (
                            <Input
                              {...field}
                              id={detail.name}
                              type={detail.type}
                            />
                          )}
                        </FormControl>
                        <FormDescription>{detail.description}</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
                <DialogFooter className="pt-4 sticky bottom-0 bg-white border-t">
                  <DialogClose asChild>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                      className="mr-auto"
                    >
                      Cancel
                    </Button>
                  </DialogClose>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2Icon className="animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>Update Will</>
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </div>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
