import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { User } from "@shared/schema";

const editSubAdminSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  permissions: z.array(z.string()).optional(),
  vendorTiers: z.array(z.string()).optional(),
});

type EditSubAdminFormData = z.infer<typeof editSubAdminSchema>;

interface EditSubAdminModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (id: number, data: EditSubAdminFormData) => void;
  isLoading: boolean;
  subAdmin: User | null;
}

export function EditSubAdminModal({ 
  open, 
  onOpenChange, 
  onSubmit, 
  isLoading, 
  subAdmin 
}: EditSubAdminModalProps) {
  const [acceptTicketChecked, setAcceptTicketChecked] = useState(false);

  const form = useForm<EditSubAdminFormData>({
    resolver: zodResolver(editSubAdminSchema),
    defaultValues: {
      firstName: subAdmin?.firstName || "",
      lastName: subAdmin?.lastName || "",
      email: subAdmin?.email || "",
      phone: subAdmin?.phone || "",
      permissions: subAdmin?.permissions || [],
      vendorTiers: subAdmin?.vendorTiers || [],
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

  // Reset form when subAdmin changes
  useEffect(() => {
    if (subAdmin) {
      form.reset({
        firstName: subAdmin.firstName || "",
        lastName: subAdmin.lastName || "",
        email: subAdmin.email || "",
        phone: subAdmin.phone || "",
        permissions: subAdmin.permissions || [],
        vendorTiers: subAdmin.vendorTiers || [],
      });
    }
  }, [subAdmin, form]);

  const handleSubmit = (data: EditSubAdminFormData) => {
    if (subAdmin) {
      onSubmit(subAdmin.id, data);
    }
  };

  // Handle tier selection with automatic inheritance
  const handleTierChange = (tier: "tier_1" | "tier_2" | "tier_3" | "marketplace", checked: boolean) => {
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

  const currentVendorTiers = form.watch("vendorTiers") || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Sub-Admin</DialogTitle>
          <DialogDescription>
            Update sub-admin information and permissions.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
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

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter email address" {...field} />
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
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter phone number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Permissions Section */}
            <div className="space-y-3">
              <FormLabel className="text-base font-semibold">Permissions</FormLabel>
              
              <FormField
                control={form.control}
                name="permissions"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="place_ticket"
                        checked={field.value?.includes("place_ticket") || false}
                        onCheckedChange={(checked) => {
                          const currentPermissions = field.value || [];
                          if (checked) {
                            field.onChange([...currentPermissions.filter(p => p !== "place_ticket"), "place_ticket"]);
                          } else {
                            field.onChange(currentPermissions.filter(p => p !== "place_ticket"));
                          }
                        }}
                      />
                      <label htmlFor="place_ticket" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Can place tickets
                      </label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="accept_ticket"
                        checked={field.value?.includes("accept_ticket") || false}
                        onCheckedChange={(checked) => {
                          const currentPermissions = field.value || [];
                          if (checked) {
                            field.onChange([...currentPermissions.filter(p => p !== "accept_ticket"), "accept_ticket"]);
                          } else {
                            field.onChange(currentPermissions.filter(p => p !== "accept_ticket"));
                          }
                        }}
                      />
                      <label htmlFor="accept_ticket" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Can accept tickets and assign vendors
                      </label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="view_invoices"
                        checked={field.value?.includes("view_invoices") || false}
                        onCheckedChange={(checked) => {
                          const currentPermissions = field.value || [];
                          if (checked) {
                            field.onChange([...currentPermissions.filter(p => p !== "view_invoices"), "view_invoices"]);
                          } else {
                            field.onChange(currentPermissions.filter(p => p !== "view_invoices"));
                          }
                        }}
                      />
                      <label htmlFor="view_invoices" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Can view invoices
                      </label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="pay_invoices"
                        checked={field.value?.includes("pay_invoices") || false}
                        onCheckedChange={(checked) => {
                          const currentPermissions = field.value || [];
                          if (checked) {
                            field.onChange([...currentPermissions.filter(p => p !== "pay_invoices"), "pay_invoices"]);
                          } else {
                            field.onChange(currentPermissions.filter(p => p !== "pay_invoices"));
                          }
                        }}
                      />
                      <label htmlFor="pay_invoices" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Can pay invoices
                      </label>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Vendor Tiers Section - Only show if accept_ticket is checked */}
            {acceptTicketChecked && (
              <div className="space-y-3">
                <FormLabel className="text-base font-semibold">Vendor Access Levels</FormLabel>
                <p className="text-sm text-muted-foreground">
                  Select which vendor tiers this sub-admin can assign tickets to.
                </p>
                
                <FormField
                  control={form.control}
                  name="vendorTiers"
                  render={() => (
                    <FormItem className="space-y-3">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="tier_1"
                            checked={currentVendorTiers.includes("tier_1")}
                            onCheckedChange={(checked) => handleTierChange("tier_1", checked as boolean)}
                          />
                          <label htmlFor="tier_1" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            🥇 Tier 1 - Premium vendors
                          </label>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="tier_2"
                            checked={currentVendorTiers.includes("tier_2")}
                            onCheckedChange={(checked) => handleTierChange("tier_2", checked as boolean)}
                          />
                          <label htmlFor="tier_2" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            🥈 Tier 2 - Standard vendors (includes Tier 1)
                          </label>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="tier_3"
                            checked={currentVendorTiers.includes("tier_3")}
                            onCheckedChange={(checked) => handleTierChange("tier_3", checked as boolean)}
                          />
                          <label htmlFor="tier_3" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            🥉 Tier 3 - All vendors (includes all tiers)
                          </label>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="marketplace"
                            checked={currentVendorTiers.includes("marketplace")}
                            onCheckedChange={(checked) => handleTierChange("marketplace", checked as boolean)}
                          />
                          <label htmlFor="marketplace" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            🏪 Marketplace access
                          </label>
                        </div>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Updating..." : "Update Sub-Admin"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}