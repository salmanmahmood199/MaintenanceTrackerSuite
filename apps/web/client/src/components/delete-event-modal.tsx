import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { AlertTriangle, Calendar, CalendarDays } from "lucide-react";
import { format } from "date-fns";

interface CalendarEvent {
  id: number;
  title: string;
  eventType: string;
  isRecurring: boolean;
  startDate: string;
  endDate: string;
  isAvailability?: boolean;
}

interface DeleteEventModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  event: CalendarEvent | null;
  selectedDate?: string;
}

export function DeleteEventModal({ isOpen, onOpenChange, event, selectedDate }: DeleteEventModalProps) {
  const [deleteOption, setDeleteOption] = useState<"this_day" | "all_occurrences">("this_day");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const deleteEventMutation = useMutation({
    mutationFn: async (data: { eventId: number; deleteOption: string; specificDate?: string }) => {
      if (data.deleteOption === "this_day" && data.specificDate) {
        // Delete for specific date - create an exception
        const response = await apiRequest("POST", `/api/calendar/events/${data.eventId}/exception`, {
          exceptionDate: data.specificDate,
        });
        return await response.json();
      } else {
        // Delete entire event
        const response = await apiRequest("DELETE", `/api/calendar/events/${data.eventId}`);
        return await response.json();
      }
    },
    onSuccess: (_, variables) => {
      const message = variables.deleteOption === "this_day" && variables.specificDate
        ? `${event?.eventType === "availability" ? "Availability" : "Unavailability"} removed for ${format(new Date(variables.specificDate), "MMMM d, yyyy")}`
        : `${event?.eventType === "availability" ? "Availability" : "Unavailability"} deleted completely`;
      
      toast({
        title: "Event Deleted",
        description: message,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/calendar/events"] });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete event",
        variant: "destructive",
      });
    },
  });

  const handleDelete = () => {
    if (!event) return;
    
    deleteEventMutation.mutate({
      eventId: event.id,
      deleteOption,
      specificDate: deleteOption === "this_day" ? selectedDate : undefined,
    });
  };

  if (!event) return null;

  const isAvailabilityEvent = event.eventType === "availability" || event.isAvailability;
  const eventTypeLabel = isAvailabilityEvent ? "Availability" : "Unavailability";
  const eventColor = isAvailabilityEvent ? "text-green-600" : "text-red-600";

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Delete {eventTypeLabel}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Event Info */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className={`font-medium ${eventColor}`}>{event.title}</h4>
            <p className="text-sm text-muted-foreground mt-1">
              {event.isRecurring ? "Recurring " : ""}{eventTypeLabel.toLowerCase()}
              {selectedDate && (
                <span> • Selected: {format(new Date(selectedDate), "MMMM d, yyyy")}</span>
              )}
            </p>
          </div>

          {/* Delete Options */}
          {event.isRecurring && selectedDate ? (
            <div className="space-y-4">
              <Label className="text-base font-medium">What would you like to delete?</Label>
              <RadioGroup value={deleteOption} onValueChange={(value: "this_day" | "all_occurrences") => setDeleteOption(value)}>
                <div className="flex items-start space-x-3 space-y-0 p-3 border rounded-lg">
                  <RadioGroupItem value="this_day" id="this_day" className="mt-1" />
                  <div className="grid gap-1.5 leading-none">
                    <Label htmlFor="this_day" className="font-medium">
                      Just this day
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Remove {eventTypeLabel.toLowerCase()} only for {format(new Date(selectedDate), "MMMM d, yyyy")}. 
                      Other days will remain unchanged.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 space-y-0 p-3 border rounded-lg">
                  <RadioGroupItem value="all_occurrences" id="all_occurrences" className="mt-1" />
                  <div className="grid gap-1.5 leading-none">
                    <Label htmlFor="all_occurrences" className="font-medium text-red-600">
                      All recurring days
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Delete this entire {eventTypeLabel.toLowerCase()} pattern. This will remove 
                      all {isAvailabilityEvent ? "available" : "unavailable"} time slots permanently.
                    </p>
                  </div>
                </div>
              </RadioGroup>
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <p className="text-sm text-amber-800">
                  This will permanently delete this {eventTypeLabel.toLowerCase()} event.
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteEventMutation.isPending}
            >
              {deleteEventMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}