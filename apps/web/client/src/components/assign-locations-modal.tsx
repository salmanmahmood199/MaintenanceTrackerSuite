import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Location, User } from "@shared/schema";

interface AssignLocationsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (locationIds: number[]) => void;
  isLoading: boolean;
  user: User;
  organizationId: number;
}

export function AssignLocationsModal({
  open,
  onOpenChange,
  onSubmit,
  isLoading,
  user,
  organizationId,
}: AssignLocationsModalProps) {
  const [selectedLocationIds, setSelectedLocationIds] = useState<number[]>([]);

  // Fetch all locations for the organization
  const { data: locations = [] } = useQuery<Location[]>({
    queryKey: ["/api/locations", organizationId],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/organizations/${organizationId}/locations`);
      return await response.json() as Location[];
    },
    enabled: open,
  });

  // Fetch current user location assignments
  const { data: userLocations = [] } = useQuery<Location[]>({
    queryKey: ["/api/users", user.id, "locations"],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/users/${user.id}/locations`);
      return await response.json() as Location[];
    },
    enabled: open,
  });

  // Update selected locations when user locations are loaded
  useEffect(() => {
    if (userLocations.length > 0) {
      setSelectedLocationIds(userLocations.map(loc => loc.id));
    } else {
      setSelectedLocationIds([]);
    }
  }, [userLocations]);

  const handleLocationToggle = (locationId: number) => {
    setSelectedLocationIds(prev => 
      prev.includes(locationId) 
        ? prev.filter(id => id !== locationId)
        : [...prev, locationId]
    );
  };

  const handleSubmit = () => {
    onSubmit(selectedLocationIds);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Assign Locations</DialogTitle>
          <DialogDescription>
            Select which locations {user.firstName} {user.lastName} can access.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {locations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No locations available. Create locations first.
            </div>
          ) : (
            <ScrollArea className="h-64 w-full border rounded-md p-4">
              <div className="space-y-3">
                {locations.map((location) => (
                  <div key={location.id} className="flex items-start space-x-3">
                    <Checkbox
                      id={`location-${location.id}`}
                      checked={selectedLocationIds.includes(location.id)}
                      onCheckedChange={() => handleLocationToggle(location.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <Label
                        htmlFor={`location-${location.id}`}
                        className="text-sm font-medium cursor-pointer"
                      >
                        {location.name}
                      </Label>
                      {location.address && (
                        <p className="text-xs text-gray-500 mt-1">{location.address}</p>
                      )}
                      {location.description && (
                        <p className="text-xs text-gray-600 mt-1">{location.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
          
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
              onClick={handleSubmit} 
              disabled={isLoading || locations.length === 0}
            >
              {isLoading ? "Saving..." : "Save Assignments"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}