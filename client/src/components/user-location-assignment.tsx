import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { MapPin } from "lucide-react";
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
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch all locations for the organization
  const { data: allLocations = [] } = useQuery<Location[]>({
    queryKey: [`/api/organizations/${organizationId}/locations`],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/organizations/${organizationId}/locations`);
      return await response.json();
    },
    enabled: open,
  });

  // Fetch current user locations
  const { data: userLocations = [] } = useQuery<Location[]>({
    queryKey: [`/api/users/${userId}/locations`],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/users/${userId}/locations`);
      return await response.json();
    },
    enabled: open && !!userId,
  });

  // Update selected locations when userLocations data changes
  useEffect(() => {
    if (userLocations.length > 0) {
      setSelectedLocationIds(userLocations.map(loc => loc.id));
    }
  }, [userLocations]);

  // Update user location assignments
  const updateAssignmentsMutation = useMutation({
    mutationFn: async (locationIds: number[]) => {
      await apiRequest("POST", `/api/users/${userId}/locations`, {
        body: JSON.stringify({ locationIds }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/locations`] });
      queryClient.invalidateQueries({ queryKey: [`/api/organizations/${organizationId}/sub-admins`] });
      onOpenChange(false);
      toast({
        title: "Success",
        description: "User location assignments updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update user location assignments",
        variant: "destructive",
      });
    },
  });

  const handleLocationToggle = (locationId: number, checked: boolean) => {
    if (checked) {
      setSelectedLocationIds(prev => [...prev, locationId]);
    } else {
      setSelectedLocationIds(prev => prev.filter(id => id !== locationId));
    }
  };

  const handleSave = () => {
    updateAssignmentsMutation.mutate(selectedLocationIds);
  };

  const handleCancel = () => {
    if (userLocations && userLocations.length > 0) {
      setSelectedLocationIds(userLocations.map(loc => loc.id));
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="taskscout-card border-border max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            Assign Locations to {userName}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Select the locations this user can access:
          </p>
          
          {allLocations.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No locations available. Create locations first.
            </p>
          ) : (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {allLocations.map((location) => (
                <div key={location.id} className="flex items-center space-x-3 p-3 border border-border rounded-lg">
                  <Checkbox
                    id={`location-${location.id}`}
                    checked={selectedLocationIds.includes(location.id)}
                    onCheckedChange={(checked) => 
                      handleLocationToggle(location.id, checked as boolean)
                    }
                  />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-primary" />
                      <Label 
                        htmlFor={`location-${location.id}`}
                        className="text-foreground font-medium cursor-pointer"
                      >
                        {location.name}
                      </Label>
                      <Badge variant={location.isActive ? "default" : "secondary"} className="text-xs">
                        {location.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    {location.address && (
                      <p className="text-sm text-muted-foreground mt-1">{location.address}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={updateAssignmentsMutation.isPending || allLocations.length === 0}
            >
              Save Assignments
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}