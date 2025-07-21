import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, MapPin, Edit, Trash2 } from "lucide-react";
import { CreateLocationModal } from "@/components/create-location-modal";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Location, InsertLocation } from "@shared/schema";

interface LocationsManagementProps {
  organizationId: number;
}

export function LocationsManagement({ organizationId }: LocationsManagementProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch locations
  const { data: locations = [], isLoading } = useQuery<Location[]>({
    queryKey: ["/api/locations", organizationId],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/organizations/${organizationId}/locations`);
      return await response.json() as Location[];
    },
  });

  // Create location mutation
  const createLocationMutation = useMutation({
    mutationFn: async (data: InsertLocation) => {
      return await apiRequest("POST", `/api/organizations/${organizationId}/locations`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/locations", organizationId] });
      setIsCreateModalOpen(false);
      toast({
        title: "Success",
        description: "Location created successfully!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "Failed to create location",
        variant: "destructive",
      });
    },
  });

  // Delete location mutation
  const deleteLocationMutation = useMutation({
    mutationFn: async (locationId: number) => {
      return await apiRequest("DELETE", `/api/locations/${locationId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/locations", organizationId] });
      toast({
        title: "Success",
        description: "Location deleted successfully!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "Failed to delete location",
        variant: "destructive",
      });
    },
  });

  const handleDeleteLocation = (locationId: number) => {
    if (confirm("Are you sure you want to delete this location? This will remove all user assignments.")) {
      deleteLocationMutation.mutate(locationId);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Locations</h2>
          <p className="text-sm text-muted-foreground">Manage your organization's locations</p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Location
        </Button>
      </div>

      {/* Locations Grid */}
      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground mt-2">Loading locations...</p>
        </div>
      ) : locations.length === 0 ? (
        <Card className="p-8 text-center">
          <MapPin className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium text-foreground mb-2">No locations yet</h3>
          <p className="text-muted-foreground mb-4">
            Create your first location to start organizing your sub-admins by location.
          </p>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add First Location
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {locations.map((location) => (
            <Card key={location.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg text-foreground">{location.name}</CardTitle>
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteLocation(location.id)}
                      disabled={deleteLocationMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {location.address && (
                  <p className="text-sm text-muted-foreground mb-2">{location.address}</p>
                )}
                {location.description && (
                  <p className="text-sm text-muted-foreground mb-3">{location.description}</p>
                )}
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3 mr-1" />
                    {location.isActive ? "Active" : "Inactive"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Created {location.createdAt ? new Date(location.createdAt).toLocaleDateString() : 'Unknown'}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Location Modal */}
      <CreateLocationModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onSubmit={createLocationMutation.mutate}
        isLoading={createLocationMutation.isPending}
        organizationId={organizationId}
      />
    </div>
  );
}