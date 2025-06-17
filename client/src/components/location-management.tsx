import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, MapPin, Users, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Location, User } from "@shared/schema";

const locationSchema = z.object({
  name: z.string().min(1, "Location name is required"),
  address: z.string().optional(),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});

type LocationFormData = z.infer<typeof locationSchema>;

interface LocationManagementProps {
  organizationId: number;
  canManage: boolean;
}

export function LocationManagement({ organizationId, canManage }: LocationManagementProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [showUsersModal, setShowUsersModal] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    setValue,
  } = useForm<LocationFormData>({
    resolver: zodResolver(locationSchema),
    defaultValues: {
      isActive: true,
    },
  });

  // Fetch locations for organization
  const { data: locations = [], isLoading } = useQuery<Location[]>({
    queryKey: [`/api/organizations/${organizationId}/locations`],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/organizations/${organizationId}/locations`);
      return await response.json();
    },
  });

  // Fetch users for selected location
  const { data: locationUsers = [] } = useQuery<User[]>({
    queryKey: [`/api/locations/${selectedLocation?.id}/users`],
    queryFn: async () => {
      if (!selectedLocation) return [];
      const response = await apiRequest("GET", `/api/locations/${selectedLocation.id}/users`);
      return await response.json();
    },
    enabled: !!selectedLocation,
  });

  // Create location mutation
  const createLocationMutation = useMutation({
    mutationFn: async (data: LocationFormData) => {
      const response = await apiRequest("POST", `/api/organizations/${organizationId}/locations`, {
        body: JSON.stringify(data),
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/organizations/${organizationId}/locations`] });
      setIsCreateModalOpen(false);
      reset();
      toast({
        title: "Success",
        description: "Location created successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create location",
        variant: "destructive",
      });
    },
  });

  // Update location mutation
  const updateLocationMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<LocationFormData> }) => {
      const response = await apiRequest("PATCH", `/api/locations/${id}`, {
        body: JSON.stringify(data),
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/organizations/${organizationId}/locations`] });
      setEditingLocation(null);
      reset();
      toast({
        title: "Success",
        description: "Location updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update location",
        variant: "destructive",
      });
    },
  });

  // Delete location mutation
  const deleteLocationMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/locations/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/organizations/${organizationId}/locations`] });
      toast({
        title: "Success",
        description: "Location deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete location",
        variant: "destructive",
      });
    },
  });

  const handleCreateLocation = (data: LocationFormData) => {
    createLocationMutation.mutate(data);
  };

  const handleUpdateLocation = (data: LocationFormData) => {
    if (editingLocation) {
      updateLocationMutation.mutate({ id: editingLocation.id, data });
    }
  };

  const openEditModal = (location: Location) => {
    setEditingLocation(location);
    setValue("name", location.name);
    setValue("address", location.address || "");
    setValue("description", location.description || "");
    setValue("isActive", location.isActive || true);
  };

  const closeEditModal = () => {
    setEditingLocation(null);
    reset();
  };

  const openUsersModal = (location: Location) => {
    setSelectedLocation(location);
    setShowUsersModal(true);
  };

  const closeUsersModal = () => {
    setSelectedLocation(null);
    setShowUsersModal(false);
  };

  if (isLoading) {
    return <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Locations</h3>
          <p className="text-sm text-muted-foreground">Manage organization locations and user assignments</p>
        </div>
        {canManage && (
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Location
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {locations.map((location) => (
          <Card key={location.id} className="taskscout-card border-border">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  <CardTitle className="text-base text-foreground">{location.name}</CardTitle>
                </div>
                <div className="flex items-center space-x-1">
                  <Badge variant={location.isActive ? "default" : "secondary"}>
                    {location.isActive ? "Active" : "Inactive"}
                  </Badge>
                  {canManage && (
                    <div className="flex space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditModal(location)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteLocationMutation.mutate(location.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {location.address && (
                <p className="text-sm text-muted-foreground">{location.address}</p>
              )}
              {location.description && (
                <p className="text-sm text-foreground">{location.description}</p>
              )}
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => openUsersModal(location)}
              >
                <Users className="h-4 w-4 mr-2" />
                View Assigned Users
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create/Edit Location Modal */}
      <Dialog open={isCreateModalOpen || !!editingLocation} onOpenChange={
        isCreateModalOpen ? setIsCreateModalOpen : 
        editingLocation ? closeEditModal : undefined
      }>
        <DialogContent className="taskscout-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              {editingLocation ? "Edit Location" : "Create New Location"}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit(editingLocation ? handleUpdateLocation : handleCreateLocation)} className="space-y-4">
            <div>
              <Label htmlFor="name" className="text-foreground">Location Name *</Label>
              <Input
                id="name"
                {...register("name")}
                placeholder="Enter location name"
                className="bg-input border-border text-foreground"
              />
              {errors.name && (
                <p className="text-sm text-destructive mt-1">{errors.name.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="address" className="text-foreground">Address</Label>
              <Input
                id="address"
                {...register("address")}
                placeholder="Enter location address"
                className="bg-input border-border text-foreground"
              />
            </div>

            <div>
              <Label htmlFor="description" className="text-foreground">Description</Label>
              <Textarea
                id="description"
                {...register("description")}
                placeholder="Enter location description"
                className="bg-input border-border text-foreground"
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                {...register("isActive")}
                defaultChecked={true}
              />
              <Label htmlFor="isActive" className="text-foreground">Active</Label>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={editingLocation ? closeEditModal : () => setIsCreateModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createLocationMutation.isPending || updateLocationMutation.isPending}
              >
                {editingLocation ? "Update Location" : "Create Location"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Location Users Modal */}
      <Dialog open={showUsersModal} onOpenChange={closeUsersModal}>
        <DialogContent className="taskscout-card border-border max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              Users Assigned to {selectedLocation?.name}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {locationUsers.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                No users assigned to this location
              </p>
            ) : (
              <div className="space-y-2">
                {locationUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                    <div>
                      <p className="font-medium text-foreground">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                    <Badge variant="outline">{user.role}</Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}