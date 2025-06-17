import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { insertSubAdminSchema } from "@shared/schema";
import type { InsertSubAdmin } from "@shared/schema";

interface CreateSubAdminModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: InsertSubAdmin) => void;
  isLoading: boolean;
}

const subAdminFormSchema = insertSubAdminSchema.extend({
  confirmPassword: z.string().min(1, "Confirm password is required"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type SubAdminFormData = z.infer<typeof subAdminFormSchema>;

export function CreateSubAdminModal({ open, onOpenChange, onSubmit, isLoading }: CreateSubAdminModalProps) {
  const [acceptTicketChecked, setAcceptTicketChecked] = useState(false);
  
  const form = useForm<SubAdminFormData>({
    resolver: zodResolver(subAdminFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      permissions: [],
      vendorTiers: [],
    },
  });

  const watchedPermissions = form.watch("permissions");

  // Auto-manage vendor tiers based on accept_ticket permission
  useEffect(() => {
    const hasAcceptTicket = watchedPermissions?.includes("accept_ticket");
    setAcceptTicketChecked(hasAcceptTicket || false);
    
    if (!hasAcceptTicket) {
      form.setValue("vendorTiers", []);
    }
  }, [watchedPermissions, form]);

  // Handle tier selection with automatic inheritance
  const handleTierChange = (tier: string, checked: boolean) => {
    const currentTiers = form.getValues("vendorTiers") || [];
    let newTiers = [...currentTiers];

    if (checked) {
      // Add the tier
      if (!newTiers.includes(tier)) {
        newTiers.push(tier);
      }
      
      // Auto-select lower tiers if selecting tier_3
      if (tier === "tier_3") {
        if (!newTiers.includes("tier_1")) newTiers.push("tier_1");
        if (!newTiers.includes("tier_2")) newTiers.push("tier_2");
      }
      // Auto-select tier_1 if selecting tier_2
      else if (tier === "tier_2") {
        if (!newTiers.includes("tier_1")) newTiers.push("tier_1");
      }
    } else {
      // Remove the tier
      newTiers = newTiers.filter(t => t !== tier);
      
      // Auto-remove higher tiers if removing lower ones
      if (tier === "tier_1") {
        newTiers = newTiers.filter(t => !["tier_2", "tier_3"].includes(t));
      } else if (tier === "tier_2") {
        newTiers = newTiers.filter(t => t !== "tier_3");
      }
    }

    form.setValue("vendorTiers", newTiers);
  };

  const handleSubmit = (data: SubAdminFormData) => {
    const { confirmPassword, ...submitData } = data;
    onSubmit(submitData);
  };

  const currentVendorTiers = form.watch("vendorTiers") || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Sub-Admin</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter first name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter last name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="Enter email address" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter phone number" {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Enter password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Confirm password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-3">
              <Label className="text-base font-medium">Permissions</Label>
              
              <FormField
                control={form.control}
                name="permissions"
                render={({ field }) => (
                  <FormItem>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="place_ticket"
                          checked={field.value?.includes("place_ticket")}
                          onCheckedChange={(checked) => {
                            const currentPermissions = field.value || [];
                            if (checked) {
                              field.onChange([...currentPermissions, "place_ticket"]);
                            } else {
                              field.onChange(currentPermissions.filter(p => p !== "place_ticket"));
                            }
                          }}
                        />
                        <Label htmlFor="place_ticket">Place Ticket</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="accept_ticket"
                          checked={field.value?.includes("accept_ticket")}
                          onCheckedChange={(checked) => {
                            const currentPermissions = field.value || [];
                            if (checked) {
                              field.onChange([...currentPermissions, "accept_ticket"]);
                            } else {
                              field.onChange(currentPermissions.filter(p => p !== "accept_ticket"));
                              form.setValue("vendorTiers", []); // Clear vendor tiers when unchecking accept ticket
                            }
                          }}
                        />
                        <Label htmlFor="accept_ticket">Accept Ticket</Label>
                      </div>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {acceptTicketChecked && (
                <div className="space-y-2 ml-4 border-l-2 border-gray-200 pl-4">
                  <Label className="text-sm font-medium text-gray-700">Vendor Tiers (Can Assign)</Label>
                  
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="tier_1"
                        checked={currentVendorTiers.includes("tier_1")}
                        onCheckedChange={(checked) => handleTierChange("tier_1", checked as boolean)}
                      />
                      <Label htmlFor="tier_1" className="text-sm">Tier 1 Vendors</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="tier_2"
                        checked={currentVendorTiers.includes("tier_2")}
                        onCheckedChange={(checked) => handleTierChange("tier_2", checked as boolean)}
                      />
                      <Label htmlFor="tier_2" className="text-sm">Tier 2 Vendors</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="tier_3"
                        checked={currentVendorTiers.includes("tier_3")}
                        disabled={currentVendorTiers.includes("tier_3")}
                        onCheckedChange={(checked) => handleTierChange("tier_3", checked as boolean)}
                      />
                      <Label htmlFor="tier_3" className="text-sm">
                        Tier 3 Vendors 
                        {currentVendorTiers.includes("tier_3") && (
                          <span className="text-xs text-gray-500 ml-1">(includes Tier 1 & 2)</span>
                        )}
                      </Label>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Creating..." : "Create Sub-Admin"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}