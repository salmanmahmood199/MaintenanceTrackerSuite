import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Settings, Wrench, AlertCircle } from "lucide-react";
import { Label } from "@/components/ui/label";
import type { MaintenanceVendor } from "@shared/schema";

interface VendorManagementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: number;
  vendors: Array<{
    vendor: MaintenanceVendor;
    tier: string;
    isActive: boolean;
  }>;
  onUpdateVendor: (vendorId: number, updates: { tier?: string; isActive?: boolean }) => void;
  isLoading: boolean;
}

const tierLabels = {
  tier_1: "Tier 1 - Basic",
  tier_2: "Tier 2 - Standard", 
  tier_3: "Tier 3 - Premium"
};

const tierColors = {
  tier_1: "bg-blue-100 text-blue-800",
  tier_2: "bg-yellow-100 text-yellow-800",
  tier_3: "bg-green-100 text-green-800"
};

export function VendorManagementModal({
  open,
  onOpenChange,
  organizationId,
  vendors,
  onUpdateVendor,
  isLoading
}: VendorManagementModalProps) {

  const handleToggleActive = (vendorId: number, isActive: boolean) => {
    onUpdateVendor(vendorId, { isActive });
  };

  const handleChangeTier = (vendorId: number, tier: string) => {
    onUpdateVendor(vendorId, { tier });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Vendor Management
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {vendors.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600">No vendors assigned to this organization yet.</p>
              <p className="text-sm text-slate-500 mt-2">
                Contact your system administrator to assign vendors to your organization.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {vendors.map(({ vendor, tier, isActive }) => (
                <Card key={vendor?.id || 'unknown'} className={`transition-all ${isActive ? 'border-slate-200' : 'border-slate-100 bg-slate-50'}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Wrench className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{vendor?.name || 'Unknown Vendor'}</CardTitle>
                          {vendor?.description && (
                            <p className="text-sm text-slate-600 mt-1">{vendor.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={tierColors[tier as keyof typeof tierColors]}>
                          {tierLabels[tier as keyof typeof tierLabels]}
                        </Badge>
                        <Badge variant={isActive ? "default" : "secondary"}>
                          {isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0">
                    <div className="space-y-4">
                      {/* Vendor Info */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <div className="text-xs text-slate-500 space-y-1">
                            {vendor?.email && <p>Email: {vendor.email}</p>}
                            {vendor?.phone && <p>Phone: {vendor.phone}</p>}
                          </div>
                        </div>
                        <div>
                          {vendor?.specialties && vendor.specialties.length > 0 && (
                            <div>
                              <p className="text-xs text-slate-500 mb-1">Specialties:</p>
                              <div className="flex flex-wrap gap-1">
                                {vendor.specialties.map((specialty, idx) => (
                                  <Badge key={idx} variant="outline" className="text-xs">
                                    {specialty}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Management Controls */}
                      <div className="border-t pt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Active Status Control */}
                          <div className="flex items-center justify-between">
                            <div>
                              <Label htmlFor={`active-${vendor?.id}`} className="font-medium">
                                Active Status
                              </Label>
                              <p className="text-sm text-slate-600">
                                {isActive ? 'Vendor is available for ticket assignments' : 'Vendor is hidden from ticket assignments'}
                              </p>
                            </div>
                            <Switch
                              id={`active-${vendor?.id}`}
                              checked={isActive}
                              onCheckedChange={(checked) => handleToggleActive(vendor?.id || 0, checked)}
                              disabled={isLoading}
                            />
                          </div>

                          {/* Tier Control */}
                          <div>
                            <Label className="font-medium">Access Tier</Label>
                            <p className="text-sm text-slate-600 mb-2">
                              Controls which users can assign this vendor
                            </p>
                            <Select
                              value={tier}
                              onValueChange={(value) => handleChangeTier(vendor?.id || 0, value)}
                              disabled={isLoading}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="tier_1">Tier 1 - Basic (All users)</SelectItem>
                                <SelectItem value="tier_2">Tier 2 - Standard (Sub-admins+)</SelectItem>
                                <SelectItem value="tier_3">Tier 3 - Premium (Admins only)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}