import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertResidentialTicketSchema, type InsertResidentialTicket } from "@shared/schema";
import { MediaUpload } from "./media-upload";

interface ResidentialTicketModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: InsertResidentialTicket, images: File[]) => void;
  isLoading: boolean;
  userHomeAddress?: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
  };
}

export function ResidentialTicketModal({ 
  open, 
  onOpenChange, 
  onSubmit, 
  isLoading, 
  userHomeAddress 
}: ResidentialTicketModalProps) {
  const [images, setImages] = useState<File[]>([]);

  const form = useForm<InsertResidentialTicket>({
    resolver: zodResolver(insertResidentialTicketSchema),
    defaultValues: {
      title: "",
      description: "",
      priority: "medium" as const,
      useHomeAddress: true,
      serviceStreetAddress: "",
      serviceStreetAddress2: "",
      serviceCity: "",
      serviceState: "",
      serviceZipCode: "",
    },
  });

  const useHomeAddress = form.watch("useHomeAddress");

  const handleSubmit = (data: InsertResidentialTicket) => {
    if (images.length === 0) {
      form.setError("root", { 
        type: "manual", 
        message: "Please upload at least one image or video" 
      });
      return;
    }
    
    onSubmit(data, images);
    form.reset();
    setImages([]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-lg font-semibold text-foreground">
            Create Service Request
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto px-1">
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="title" className="text-sm font-medium text-foreground">
                Service Title *
              </Label>
              <Input
                id="title"
                {...form.register("title")}
                placeholder="Brief description of the issue"
                className="mt-1"
              />
              {form.formState.errors.title && (
                <p className="text-sm text-destructive mt-1">
                  {form.formState.errors.title.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="description" className="text-sm font-medium text-foreground">
                Description *
              </Label>
              <Textarea
                id="description"
                {...form.register("description")}
                placeholder="Detailed description of the service needed"
                rows={3}
                className="mt-1"
              />
              {form.formState.errors.description && (
                <p className="text-sm text-destructive mt-1">
                  {form.formState.errors.description.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="priority" className="text-sm font-medium text-foreground">
                Priority *
              </Label>
              <Select
                value={form.watch("priority")}
                onValueChange={(value) => form.setValue("priority", value as "low" | "medium" | "high")}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="useHomeAddress"
                  checked={useHomeAddress}
                  onCheckedChange={(checked) => form.setValue("useHomeAddress", checked as boolean)}
                />
                <Label htmlFor="useHomeAddress" className="text-sm font-medium text-foreground">
                  Use my home address for service location
                </Label>
              </div>

              {userHomeAddress && useHomeAddress && (
                <div className="p-3 bg-muted rounded-md">
                  <h4 className="text-sm font-medium text-foreground mb-2">Service Location:</h4>
                  <p className="text-sm text-muted-foreground">
                    {userHomeAddress.address}<br />
                    {userHomeAddress.city}, {userHomeAddress.state} {userHomeAddress.zipCode}
                  </p>
                </div>
              )}

              {!useHomeAddress && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-foreground">Service Address</h4>
                  
                  <div>
                    <Label htmlFor="serviceStreetAddress" className="text-sm font-medium text-foreground">
                      Street Address *
                    </Label>
                    <Input
                      id="serviceStreetAddress"
                      {...form.register("serviceStreetAddress")}
                      placeholder="123 Main Street"
                      className="mt-1"
                    />
                    {form.formState.errors.serviceStreetAddress && (
                      <p className="text-sm text-destructive mt-1">
                        {form.formState.errors.serviceStreetAddress.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="serviceStreetAddress2" className="text-sm font-medium text-foreground">
                      Apartment/Unit (Optional)
                    </Label>
                    <Input
                      id="serviceStreetAddress2"
                      {...form.register("serviceStreetAddress2")}
                      placeholder="Apt 2B, Suite 100, etc."
                      className="mt-1"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="serviceCity" className="text-sm font-medium text-foreground">
                        City *
                      </Label>
                      <Input
                        id="serviceCity"
                        {...form.register("serviceCity")}
                        placeholder="City"
                        className="mt-1"
                      />
                      {form.formState.errors.serviceCity && (
                        <p className="text-sm text-destructive mt-1">
                          {form.formState.errors.serviceCity.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="serviceState" className="text-sm font-medium text-foreground">
                        State *
                      </Label>
                      <Input
                        id="serviceState"
                        {...form.register("serviceState")}
                        placeholder="State"
                        className="mt-1"
                      />
                      {form.formState.errors.serviceState && (
                        <p className="text-sm text-destructive mt-1">
                          {form.formState.errors.serviceState.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="serviceZipCode" className="text-sm font-medium text-foreground">
                      ZIP Code *
                    </Label>
                    <Input
                      id="serviceZipCode"
                      {...form.register("serviceZipCode")}
                      placeholder="12345"
                      className="mt-1"
                    />
                    {form.formState.errors.serviceZipCode && (
                      <p className="text-sm text-destructive mt-1">
                        {form.formState.errors.serviceZipCode.message}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div>
              <Label className="text-sm font-medium text-foreground">
                Images/Videos * (At least one required)
              </Label>
              <MediaUpload
                files={images}
                onFilesChange={setImages}
                maxFiles={5}
                className="mt-1"
              />
              {form.formState.errors.root && (
                <p className="text-sm text-destructive mt-1">
                  {form.formState.errors.root.message}
                </p>
              )}
            </div>

            <div className="flex-shrink-0 pt-4 border-t border-border">
              <Button 
                type="submit" 
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? "Creating Request..." : "Create Service Request"}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}