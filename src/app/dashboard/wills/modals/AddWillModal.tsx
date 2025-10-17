"use client";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2Icon, Plus } from "lucide-react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { WILL_DETAILS } from "@/app/constants/form-field-constants";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { DialogClose } from "@radix-ui/react-dialog";
import { useDocumentLocations } from "@/app/utils/repo_services/hooks/document_location";
import { useRouter } from "next/navigation";
import MultiFileUpload from "@/components/custom/multi-file-upload";
import { MODAL_SIZES } from "@/app/constants/sizes";
import { LoadingIndicator } from "@/components/custom/LoadingIndicator";

const willSchema = z.object({
  document_label: z.string().min(1, "Please enter Will title"),
  description: z.string().min(1, "Please enter Will description/location"),
});

interface AddWillModalProps {
  onSuccess?: () => void | Promise<void>;
}

export default function AddWillModal({ onSuccess }: AddWillModalProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const { createDocumentLocation } = useDocumentLocations();

  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Form setup (always at the top level to avoid hook errors)
  const form = useForm<z.infer<typeof willSchema>>({
    resolver: zodResolver(willSchema),
    defaultValues: {
      document_label: "",
      description: "",
    },
  });

  // Handle adding new will
  const onSubmit = async (values: z.infer<typeof willSchema>) => {
    setIsSubmitting(true);
    try {
      console.log("Creating document with values:", values);

      const result = await createDocumentLocation({
        description: values.description,
        document_label: values.document_label,
        files: selectedFiles.length > 0 ? selectedFiles : undefined,
      });

      if (result.success) {
        toast.success("Will document added successfully!");
        form.reset();
        setSelectedFiles([]);
        setIsDialogOpen(false);

        // Call onSuccess callback to refresh parent data
        if (onSuccess) {
          await onSuccess();
        }
      } else {
        toast.error(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error("Submit error:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle cancel/close button in dialog
  const handleModalClose = () => {
    form.reset();
    setSelectedFiles([]); // Clear the uploaded files
    router.push("/dashboard/wills");
  };

  return (
    <Form {...form}>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button>
            <Plus /> Add New Will
          </Button>
        </DialogTrigger>
        <DialogContent
          className={`${MODAL_SIZES.large} max-h-[90vh] overflow-y-auto`}
          onCloseClick={handleModalClose}
        >
          <DialogHeader>
            <DialogTitle>Add a New Will</DialogTitle>
            <DialogDescription>
              Fill out the details below to create a new will.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-1 pb-4">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {WILL_DETAILS.map((detail) => (
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
                            onFilesChange={setSelectedFiles}
                            maxFiles={5}
                            label="Upload Will Documents"
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
                    variant="outline"
                    type="button"
                    onClick={handleModalClose}
                    className="mr-auto"
                  >
                    Cancel
                  </Button>
                </DialogClose>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <LoadingIndicator text="Adding..." />
                  ) : (
                    "Add Will"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </Form>
  );
}
