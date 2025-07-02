import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { Calendar, Clock, MapPin, User, FileText, Trash2, Edit, Save, X } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface CalendarEvent {
  id: number;
  title: string;
  description?: string;
  eventType: "availability" | "work_assignment" | "meeting" | "maintenance" | "personal" | "unavailability";
  startDate: string;
  startTime?: string;
  endDate: string;
  endTime?: string;
  isAllDay: boolean;
  priority: "low" | "medium" | "high";
  status: "confirmed" | "tentative" | "cancelled";
  color: string;
  location?: string;
  isAvailability: boolean;
  timezone?: string;
  attendees?: string;
  relatedTicketId?: number;
}

interface EventDetailsModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  event: CalendarEvent | null;
}

const eventTypeLabels = {
  availability: "Availability",
  work_assignment: "Work Assignment",
  meeting: "Meeting", 
  maintenance: "Maintenance",
  personal: "Personal",
  unavailability: "Unavailable",
};

const priorityColors = {
  low: "bg-green-100 text-green-800",
  medium: "bg-yellow-100 text-yellow-800", 
  high: "bg-red-100 text-red-800",
};

const statusColors = {
  confirmed: "bg-blue-100 text-blue-800",
  tentative: "bg-gray-100 text-gray-800",
  cancelled: "bg-red-100 text-red-800",
};

export function EventDetailsModal({ isOpen, onOpenChange, event }: EventDetailsModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const deleteEventMutation = useMutation({
    mutationFn: async (eventId: number) => {
      await apiRequest("DELETE", `/api/calendar/events/${eventId}`);
    },
    onSuccess: () => {
      toast({
        title: "Event Deleted",
        description: "The event has been successfully removed from your calendar.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/calendar/events"] });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      if (error.message.includes("404") || error.message.includes("not found")) {
        queryClient.invalidateQueries({ queryKey: ["/api/calendar/events"] });
        onOpenChange(false);
      } else {
        toast({
          title: "Error",
          description: error.message || "Failed to delete event. Please try again.",
          variant: "destructive",
        });
      }
    },
  });

  const handleDelete = () => {
    if (event && confirm("Are you sure you want to delete this event?")) {
      deleteEventMutation.mutate(event.id);
    }
  };

  if (!event) return null;

  const formatDate = (dateStr: string) => {
    try {
      const [year, month, day] = dateStr.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      return format(date, "MMMM d, yyyy");
    } catch {
      return dateStr;
    }
  };

  const formatTime = (timeStr?: string) => {
    if (!timeStr) return null;
    try {
      const [hours, minutes] = timeStr.split(':').map(Number);
      const date = new Date();
      date.setHours(hours, minutes);
      return format(date, "h:mm a");
    } catch {
      return timeStr;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" style={{ color: event.color || "#3B82F6" }} />
            {event.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Event Type and Status */}
          <div className="flex gap-2 flex-wrap">
            <Badge variant="secondary" className="text-xs">
              {eventTypeLabels[event.eventType]}
            </Badge>
            <Badge className={`text-xs ${priorityColors[event.priority]}`}>
              {event.priority.charAt(0).toUpperCase() + event.priority.slice(1)} Priority
            </Badge>
            <Badge className={`text-xs ${statusColors[event.status]}`}>
              {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
            </Badge>
          </div>

          {/* Date and Time */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>
                {event.startDate === event.endDate 
                  ? formatDate(event.startDate)
                  : `${formatDate(event.startDate)} - ${formatDate(event.endDate)}`
                }
              </span>
            </div>
            
            {!event.isAllDay && event.startTime && (
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>
                  {formatTime(event.startTime)}
                  {event.endTime && ` - ${formatTime(event.endTime)}`}
                </span>
                {event.timezone && (
                  <span className="text-muted-foreground">({event.timezone})</span>
                )}
              </div>
            )}

            {event.isAllDay && (
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>All Day</span>
              </div>
            )}
          </div>

          {/* Location */}
          {event.location && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{event.location}</span>
            </div>
          )}

          {/* Attendees */}
          {event.attendees && (
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              <span>{event.attendees}</span>
            </div>
          )}

          {/* Description */}
          {event.description && (
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm font-medium">
                <FileText className="h-4 w-4 text-muted-foreground" />
                Description
              </div>
              <p className="text-sm text-muted-foreground pl-6">{event.description}</p>
            </div>
          )}

          {/* Related Ticket */}
          {event.relatedTicketId && (
            <div className="text-sm">
              <span className="font-medium">Related Ticket: </span>
              <span className="text-muted-foreground">#{event.relatedTicketId}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDelete}
              disabled={deleteEventMutation.isPending}
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              {deleteEventMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}