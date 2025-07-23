import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertLocationSchema, type InsertLocation } from "@shared/schema";

interface CreateLocationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: InsertLocation) => void;
  isLoading: boolean;
  organizationId: number;
}

type LocationFormData = InsertLocation;

export function CreateLocationModal({
  open,
  onOpenChange,
  onSubmit,
  isLoading,
  organizationId,
}: CreateLocationModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LocationFormData>({
    resolver: zodResolver(insertLocationSchema),
    defaultValues: {
      organizationId,
      isActive: true,
    },
  });

  const handleFormSubmit = (data: LocationFormData) => {
    onSubmit({
      ...data,
      organizationId,
    });
    reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add New Location</DialogTitle>
          <DialogDescription>
            Create a new location for your organization. Sub-admins can be assigned to specific locations.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Location Name</Label>
            <Input
              id="name"
              {...register("name")}
              placeholder="e.g., Downtown Office, Warehouse A"
            />
            {errors.name && (
              <p className="text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="streetAddress">Street Address *</Label>
            <Input
              id="streetAddress"
              {...register("streetAddress")}
              placeholder="123 Main Street"
            />
            {errors.streetAddress && (
              <p className="text-sm text-red-600">{errors.streetAddress.message}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="streetAddress2">Street Address 2 (Optional)</Label>
            <Input
              id="streetAddress2"
              {...register("streetAddress2")}
              placeholder="Apt, Suite, Unit, Building, Floor, etc."
            />
            {errors.streetAddress2 && (
              <p className="text-sm text-red-600">{errors.streetAddress2.message}</p>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City *</Label>
              <Input
                id="city"
                {...register("city")}
                placeholder="New York"
              />
              {errors.city && (
                <p className="text-sm text-red-600">{errors.city.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="state">State *</Label>
              <Input
                id="state"
                {...register("state")}
                placeholder="NY"
              />
              {errors.state && (
                <p className="text-sm text-red-600">{errors.state.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="zipCode">ZIP Code *</Label>
              <Input
                id="zipCode"
                {...register("zipCode")}
                placeholder="10001"
              />
              {errors.zipCode && (
                <p className="text-sm text-red-600">{errors.zipCode.message}</p>
              )}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="Additional details about this location"
              rows={2}
            />
            {errors.description && (
              <p className="text-sm text-red-600">{errors.description.message}</p>
            )}
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
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creating..." : "Create Location"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}