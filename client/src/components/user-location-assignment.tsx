import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, User } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Location } from "@shared/schema";

interface UserLocationAssignmentProps {
  userId: number;
  userName: string;
  organizationId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserLocationAssignment({
  userId,
  userName,
  organizationId,
  open,
  onOpenChange,
}: UserLocationAssignmentProps) {
  const [selectedLocationIds, setSelectedLocationIds] = useState<number[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch organization locations
  const { data: locations, isLoading: locationsLoading } = useQuery({
    queryKey: [`/api/organizations/${organizationId}/locations`],
    enabled: open,
  });

  // Fetch user's current location assignments
  const { data: userLocations, isLoading: userLocationsLoading } = useQuery({
    queryKey: [`/api/users/${userId}/locations`],
    enabled: open,
  });

  // Update user location assignments
  const updateAssignmentsMutation = useMutation({
    mutationFn: async (locationIds: number[]) => {
      return await apiRequest("POST", `/api/users/${userId}/locations`, { locationIds });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/locations`] });
      queryClient.invalidateQueries({ queryKey: [`/api/organizations/${organizationId}/locations`] });
      onOpenChange(false);
      toast({
        title: "Success",
        description: "Location assignments updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update location assignments",
        variant: "destructive",
      });
    },
  });

  // Set initial selected locations when user locations are loaded
  useEffect(() => {
    if (Array.isArray(userLocations)) {
      setSelectedLocationIds(userLocations.map((loc: Location) => loc.id));
    }
  }, [userLocations]);

  const handleLocationToggle = (locationId: number, checked: boolean) => {
    if (checked) {
      setSelectedLocationIds([...selectedLocationIds, locationId]);
    } else {
      setSelectedLocationIds(selectedLocationIds.filter(id => id !== locationId));
    }
  };

  const handleSave = () => {
    updateAssignmentsMutation.mutate(selectedLocationIds);
  };

  const isLoading = locationsLoading || userLocationsLoading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>Assign Locations to {userName}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-slate-500">Loading locations...</p>
            </div>
          ) : Array.isArray(locations) && locations.length > 0 ? (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {locations.map((location: Location) => (
                <Card key={location.id} className="border border-slate-200">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        id={`location-${location.id}`}
                        checked={selectedLocationIds.includes(location.id)}
                        onCheckedChange={(checked) => 
                          handleLocationToggle(location.id, checked as boolean)
                        }
                      />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-4 w-4 text-blue-600" />
                          <label
                            htmlFor={`location-${location.id}`}
                            className="font-medium text-slate-900 cursor-pointer"
                          >
                            {location.name}
                          </label>
                        </div>
                        {location.address && (
                          <p className="text-sm text-slate-600 mt-1 ml-6">
                            {location.address}
                          </p>
                        )}
                        {location.description && (
                          <p className="text-sm text-slate-500 mt-1 ml-6">
                            {location.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <MapPin className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">No locations available</p>
              <p className="text-slate-400 text-sm">
                Create locations first to assign them to users
              </p>
            </div>
          )}

          {Array.isArray(locations) && locations.length > 0 && (
            <div className="flex justify-between items-center pt-4 border-t border-slate-200">
              <p className="text-sm text-slate-600">
                {selectedLocationIds.length} of {locations.length} locations selected
              </p>
              <div className="flex space-x-2">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={updateAssignmentsMutation.isPending}
                >
                  {updateAssignmentsMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}