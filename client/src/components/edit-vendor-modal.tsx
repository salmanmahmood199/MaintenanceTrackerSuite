import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { updateMaintenanceVendorSchema, type UpdateMaintenanceVendor, type MaintenanceVendor, type Organization } from "@shared/schema";
import { Key, Save } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface EditVendorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (id: number, data: UpdateMaintenanceVendor) => void;
  onResetPassword: (id: number, newPassword: string) => void;
  isLoading: boolean;
  vendor: MaintenanceVendor | null;
}

type VendorFormData = {
  name: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  specialties?: string[];
  assignedOrganizations: number[];
};

export function EditVendorModal({ 
  open, 
  onOpenChange, 
  onSubmit, 
  onResetPassword,
  isLoading, 
  vendor 
}: EditVendorModalProps) {
  const [newPassword, setNewPassword] = useState("");
  const [selectedOrganizations, setSelectedOrganizations] = useState<number[]>([]);
  const { toast } = useToast();

  // Fetch organizations for assignment
  const { data: organizations = [] } = useQuery<Organization[]>({
    queryKey: ["/api/organizations"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/organizations");
      return await response.json() as Organization[];
    },
  });

  // Fetch vendor's current organization assignments
  const { data: vendorOrganizations = [] } = useQuery<Array<{organizationId: number, tier: string, isActive: boolean}>>({
    queryKey: ["/api/maintenance-vendors", vendor?.id, "organizations"],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/maintenance-vendors/${vendor!.id}/organizations`);
      return await response.json();
    },
    enabled: !!vendor?.id && open,
  });

  const form = useForm<VendorFormData>({
    resolver: zodResolver(updateMaintenanceVendorSchema.pick({
      name: true,
      description: true,
      address: true,
      phone: true,
      email: true,
      specialties: true,
    })),
    defaultValues: {
      name: "",
      description: "",
      address: "",
      phone: "",
      email: "",
      specialties: [],
      assignedOrganizations: [],
    },
  });

  useEffect(() => {
    if (vendor) {
      console.log('Vendor organizations data:', vendorOrganizations);
      const assignedOrgIds = vendorOrganizations.map(vo => vo.organizationId);
      
      // Check if vendor has marketplace tier access
      const hasMarketplaceAccess = vendorOrganizations.some(vo => vo.tier === "marketplace");
      console.log('Has marketplace access:', hasMarketplaceAccess);
      console.log('Organization IDs:', assignedOrgIds);
      
      // Add -1 as identifier for marketplace access if present
      const selectedIds = hasMarketplaceAccess ? [...assignedOrgIds, -1] : assignedOrgIds;
      console.log('Selected IDs:', selectedIds);
      
      form.reset({
        name: vendor.name,
        description: vendor.description || "",
        address: vendor.address || "",
        phone: vendor.phone || "",
        email: vendor.email || "",
        specialties: vendor.specialties || [],
        assignedOrganizations: assignedOrgIds,
      });
      setSelectedOrganizations(selectedIds);
    }
  }, [vendor, vendorOrganizations, form]);

  const handleSubmit = (data: VendorFormData) => {
    if (!vendor) return;
    
    // Filter out empty strings and prepare clean data
    const cleanData = Object.fromEntries(
      Object.entries(data).filter(([_, value]) => value !== "" && value !== undefined)
    );
    
    // Add selected organizations to the data (including marketplace if selected)
    const organizationIds = selectedOrganizations.filter(id => id !== -1); // Remove marketplace ID
    const hasMarketplaceAccess = selectedOrganizations.includes(-1);
    
    const dataWithAssignments = {
      ...cleanData,
      assignedOrganizations: organizationIds,
      hasMarketplaceAccess: hasMarketplaceAccess
    };
    
    onSubmit(vendor.id, dataWithAssignments);
  };

  const handleResetPassword = () => {
    if (!vendor || !newPassword.trim()) {
      toast({
        title: "Error",
        description: "Please enter a new password",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }

    onResetPassword(vendor.id, newPassword);
    setNewPassword("");
  };

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 12; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(result);
  };

  const handleOrganizationToggle = (orgId: number, checked: boolean) => {
    if (checked) {
      setSelectedOrganizations(prev => [...prev, orgId]);
    } else {
      setSelectedOrganizations(prev => prev.filter(id => id !== orgId));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Maintenance Vendor</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="name">Vendor Name</Label>
            <Input
              id="name"
              {...form.register("name")}
              placeholder="Enter vendor name"
            />
            {form.formState.errors.name && (
              <p className="text-sm text-red-500 mt-1">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...form.register("description")}
              placeholder="Enter description"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              {...form.register("address")}
              placeholder="Enter address"
            />
          </div>

          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              {...form.register("phone")}
              placeholder="Enter phone number"
            />
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              {...form.register("email")}
              placeholder="Enter email address"
            />
          </div>

          <div>
            <Label>Assigned Organizations</Label>
            <div className="space-y-2 mt-2 max-h-32 overflow-y-auto border rounded p-3">
              {organizations.length === 0 ? (
                <p className="text-sm text-slate-500">No organizations available</p>
              ) : (
                <>
                  {organizations.map((org) => (
                    <div key={org.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`org-${org.id}`}
                        checked={selectedOrganizations.includes(org.id)}
                        onCheckedChange={(checked) => 
                          handleOrganizationToggle(org.id, checked as boolean)
                        }
                      />
                      <Label htmlFor={`org-${org.id}`} className="text-sm">
                        {org.name}
                      </Label>
                    </div>
                  ))}
                  
                  {/* Marketplace Option */}
                  <div className="border-t pt-2 mt-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="marketplace-access"
                        checked={selectedOrganizations.includes(-1)}
                        onCheckedChange={(checked) => 
                          handleOrganizationToggle(-1, checked as boolean)
                        }
                      />
                      <Label htmlFor="marketplace-access" className="text-sm font-medium">
                        Marketplace Access
                        <span className="text-xs text-slate-500 ml-1">(open bidding system)</span>
                      </Label>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="mb-4">
              <Label className="text-sm font-medium">Marketplace Access</Label>
              <div className="flex items-center space-x-2 mt-2">
                <input type="checkbox" id="marketplace-access-edit" />
                <Label htmlFor="marketplace-access-edit" className="text-sm">
                  Enable marketplace bidding for this vendor
                  <span className="text-xs text-slate-500 ml-1">(open bidding system)</span>
                </Label>
              </div>
            </div>

            <Label>Reset Admin Password</Label>
            <div className="flex space-x-2 mt-2">
              <Input
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                type="password"
              />
              <Button
                type="button"
                variant="outline"
                onClick={generateRandomPassword}
                size="sm"
              >
                Generate
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleResetPassword}
                disabled={!newPassword.trim()}
                size="sm"
              >
                <Key className="h-4 w-4 mr-1" />
                Reset
              </Button>
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}