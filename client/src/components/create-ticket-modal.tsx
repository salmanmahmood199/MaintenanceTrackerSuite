import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { insertTicketSchema, type InsertTicket, type Location } from "@shared/schema";
import { ImageUpload } from "./image-upload";
import { Plus } from "lucide-react";

interface CreateTicketModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: InsertTicket, images: File[]) => void;
  isLoading: boolean;
}

export function CreateTicketModal({ open, onOpenChange, onSubmit, isLoading, userId, organizationId }: CreateTicketModalProps) {
  const [images, setImages] = useState<File[]>([]);

  const form = useForm<InsertTicket>({
    resolver: zodResolver(insertTicketSchema),
    defaultValues: {
      title: "",
      description: "",
      priority: "medium" as const,
      status: "pending" as const,
      organizationId: 1, // This will be set dynamically
      reporterId: 1, // This will be set dynamically
    },
  });

  const handleSubmit = (data: InsertTicket) => {
    console.log("Form submitted with data:", data);
    console.log("Form errors:", form.formState.errors);
    onSubmit(data, images);
    form.reset();
    setImages([]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-lg font-semibold text-slate-900">Create New Ticket</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto px-1">
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              <div>
                <Label htmlFor="title" className="text-sm font-medium text-slate-700">
                  Title
                </Label>
                <Input
                  id="title"
                  {...form.register("title")}
                  placeholder="Brief description of the issue"
                  className="mt-2"
                />
                {form.formState.errors.title && (
                  <p className="text-sm text-red-600 mt-1">{form.formState.errors.title.message}</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="description" className="text-sm font-medium text-slate-700">
                  Description
                </Label>
                <Textarea
                  id="description"
                  {...form.register("description")}
                  rows={4}
                  placeholder="Detailed description of the maintenance issue..."
                  className="mt-2"
                />
                {form.formState.errors.description && (
                  <p className="text-sm text-red-600 mt-1">{form.formState.errors.description.message}</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="priority" className="text-sm font-medium text-slate-700">
                  Priority Level
                </Label>
                <Select onValueChange={(value) => form.setValue("priority", value as "low" | "medium" | "high")}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low Priority</SelectItem>
                    <SelectItem value="medium">Medium Priority</SelectItem>
                    <SelectItem value="high">High Priority</SelectItem>
                  </SelectContent>
                </Select>
                {form.formState.errors.priority && (
                  <p className="text-sm text-red-600 mt-1">{form.formState.errors.priority.message}</p>
                )}
              </div>
              
              <div>
                <Label className="text-sm font-medium text-slate-700">Upload Images</Label>
                <div className="mt-2">
                  <ImageUpload onImagesChange={setImages} />
                </div>
              </div>
          
            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-primary text-white hover:bg-blue-700"
              >
                {isLoading ? (
                  "Creating..."
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Ticket
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
