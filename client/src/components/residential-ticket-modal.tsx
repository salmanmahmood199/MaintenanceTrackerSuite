import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { z } from "zod";
import { MediaUpload } from "./media-upload";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ResidentialTicketModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: number;
}

const residentialTicketSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  priority: z.enum(["low", "medium", "high"]),
});

type ResidentialTicketForm = z.infer<typeof residentialTicketSchema>;

export function ResidentialTicketModal({ open, onOpenChange, userId }: ResidentialTicketModalProps) {
  const [images, setImages] = useState<File[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<ResidentialTicketForm>({
    resolver: zodResolver(residentialTicketSchema),
    defaultValues: {
      title: "",
      description: "",
      priority: "medium",
    },
  });

  const createTicketMutation = useMutation({
    mutationFn: async (data: ResidentialTicketForm) => {
      const formData = new FormData();
      formData.append("title", data.title);
      formData.append("description", data.description);
      formData.append("priority", data.priority);
      formData.append("status", "marketplace"); // Automatically assign to marketplace
      formData.append("reporterId", userId.toString());

      // Add images
      images.forEach((image, index) => {
        formData.append(`images`, image);
      });

      const response = await fetch("/api/tickets", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create ticket");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
      toast({
        title: "Service Request Created",
        description: "Your request has been posted to the marketplace for vendor bids.",
      });
      form.reset();
      setImages([]);
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Create Request",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: ResidentialTicketForm) => {
    if (images.length === 0) {
      toast({
        title: "Images Required",
        description: "Please upload at least one image or video of the issue.",
        variant: "destructive",
      });
      return;
    }
    createTicketMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Create Service Request
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="title" className="text-sm font-medium">
                What needs to be fixed?
              </Label>
              <Input
                id="title"
                {...form.register("title")}
                placeholder="e.g., Kitchen sink is leaking"
                className="mt-1"
              />
              {form.formState.errors.title && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.title.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="description" className="text-sm font-medium">
                Describe the problem in detail
              </Label>
              <Textarea
                id="description"
                {...form.register("description")}
                placeholder="Please provide as much detail as possible about the issue, when it started, and any other relevant information..."
                rows={4}
                className="mt-1"
              />
              {form.formState.errors.description && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.description.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="priority" className="text-sm font-medium">
                How urgent is this?
              </Label>
              <Select
                value={form.watch("priority")}
                onValueChange={(value) => form.setValue("priority", value as "low" | "medium" | "high")}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low - Can wait a few days</SelectItem>
                  <SelectItem value="medium">Medium - Should be fixed soon</SelectItem>
                  <SelectItem value="high">High - Needs immediate attention</SelectItem>
                </SelectContent>
              </Select>
              {form.formState.errors.priority && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.priority.message}
                </p>
              )}
            </div>

            <div>
              <Label className="text-sm font-medium">
                Upload Photos/Videos <span className="text-red-500">*</span>
              </Label>
              <p className="text-xs text-muted-foreground mb-2">
                Please upload at least one image or video showing the issue
              </p>
              <MediaUpload onFilesChange={setImages} />
              {images.length === 0 && (
                <p className="text-sm text-orange-600 mt-1">
                  At least one image or video is required
                </p>
              )}
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
              What happens next?
            </h4>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <li>• Your request goes to our marketplace</li>
              <li>• Licensed vendors will submit bids</li>
              <li>• You'll receive notifications when bids come in</li>
              <li>• Choose the vendor that works best for you</li>
            </ul>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createTicketMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createTicketMutation.isPending || images.length === 0}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {createTicketMutation.isPending ? (
                "Creating Request..."
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Submit Request
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}