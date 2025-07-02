import { useState, useEffect } from "react";
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

export function EventDetailsModal({ isOpen, onOpenChange, event }: EventDetailsModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editedEvent, setEditedEvent] = useState<CalendarEvent | null>(null);
  const [originalEvent, setOriginalEvent] = useState<CalendarEvent | null>(null);

  // Initialize edit state when event changes
  useEffect(() => {
    if (event) {
      setEditedEvent({ ...event });
      setOriginalEvent({ ...event });
    }
  }, [event]);

  const deleteEventMutation = useMutation({
    mutationFn: async (eventId: number) => {
      await apiRequest("DELETE", `/api/calendar/events/${eventId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/calendar/events"] });
      toast({
        title: "Success",
        description: "Event deleted successfully",
      });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateEventMutation = useMutation({
    mutationFn: async (updatedEvent: CalendarEvent) => {
      await apiRequest("PUT", `/api/calendar/events/${updatedEvent.id}`, updatedEvent);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/calendar/events"] });
      toast({
        title: "Success",
        description: "Event updated successfully",
      });
      setIsEditing(false);
      if (editedEvent) {
        setOriginalEvent({ ...editedEvent });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (!event || !editedEvent || !originalEvent) return null;

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this event?")) {
      deleteEventMutation.mutate(event.id);
    }
  };

  const handleSave = () => {
    updateEventMutation.mutate(editedEvent);
  };

  const handleCancel = () => {
    setEditedEvent({ ...originalEvent });
    setIsEditing(false);
  };

  const formatDateTime = (date: string, time?: string) => {
    const dateObj = new Date(date);
    if (time) {
      const [hours, minutes] = time.split(':');
      dateObj.setHours(parseInt(hours), parseInt(minutes));
      return format(dateObj, 'MMM d, yyyy h:mm a');
    }
    return format(dateObj, 'MMM d, yyyy');
  };

  const ChangeTracker = ({ oldValue, newValue, show = true }: { oldValue: any, newValue: any, show?: boolean }) => {
    if (!show || oldValue === newValue) return <span>{newValue || 'Not specified'}</span>;
    return (
      <div className="space-y-1">
        <span className="line-through text-gray-400 text-sm">{oldValue || 'Not specified'}</span>
        <div className="font-medium text-blue-600">{newValue || 'Not specified'}</div>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {isEditing ? "Edit Event" : "Event Details"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Title</Label>
            {isEditing ? (
              <Input
                value={editedEvent.title}
                onChange={(e) => setEditedEvent({ ...editedEvent, title: e.target.value })}
                className="text-lg"
              />
            ) : (
              <div className="text-lg font-semibold">
                <ChangeTracker 
                  oldValue={originalEvent.title} 
                  newValue={editedEvent.title}
                  show={originalEvent.title !== editedEvent.title}
                />
              </div>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Description</Label>
            {isEditing ? (
              <Textarea
                value={editedEvent.description || ''}
                onChange={(e) => setEditedEvent({ ...editedEvent, description: e.target.value })}
                placeholder="Add description..."
                rows={3}
              />
            ) : (
              <div className="text-gray-600">
                <ChangeTracker 
                  oldValue={originalEvent.description} 
                  newValue={editedEvent.description}
                  show={originalEvent.description !== editedEvent.description}
                />
              </div>
            )}
          </div>

          {/* Event Type */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Event Type</Label>
            {isEditing ? (
              <Select
                value={editedEvent.eventType}
                onValueChange={(value: any) => setEditedEvent({ ...editedEvent, eventType: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="availability">Availability</SelectItem>
                  <SelectItem value="work_assignment">Work Assignment</SelectItem>
                  <SelectItem value="meeting">Meeting</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="personal">Personal</SelectItem>
                  <SelectItem value="unavailability">Unavailable</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <div>
                <ChangeTracker 
                  oldValue={eventTypeLabels[originalEvent.eventType]}
                  newValue={eventTypeLabels[editedEvent.eventType]}
                  show={originalEvent.eventType !== editedEvent.eventType}
                />
              </div>
            )}
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Priority</Label>
            {isEditing ? (
              <Select
                value={editedEvent.priority}
                onValueChange={(value: any) => setEditedEvent({ ...editedEvent, priority: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <div>
                <ChangeTracker 
                  oldValue={originalEvent.priority.toUpperCase()}
                  newValue={editedEvent.priority.toUpperCase()}
                  show={originalEvent.priority !== editedEvent.priority}
                />
              </div>
            )}
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Status</Label>
            {isEditing ? (
              <Select
                value={editedEvent.status}
                onValueChange={(value: any) => setEditedEvent({ ...editedEvent, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="tentative">Tentative</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <div>
                <ChangeTracker 
                  oldValue={originalEvent.status.toUpperCase()}
                  newValue={editedEvent.status.toUpperCase()}
                  show={originalEvent.status !== editedEvent.status}
                />
              </div>
            )}
          </div>

          {/* Date and Time */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Date & Time</Label>
            {isEditing ? (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Start Date</Label>
                    <Input
                      type="date"
                      value={editedEvent.startDate.split('T')[0]}
                      onChange={(e) => setEditedEvent({ 
                        ...editedEvent, 
                        startDate: e.target.value 
                      })}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">End Date</Label>
                    <Input
                      type="date"
                      value={editedEvent.endDate.split('T')[0]}
                      onChange={(e) => setEditedEvent({ 
                        ...editedEvent, 
                        endDate: e.target.value 
                      })}
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="allDay"
                    checked={editedEvent.isAllDay}
                    onChange={(e) => setEditedEvent({ 
                      ...editedEvent, 
                      isAllDay: e.target.checked 
                    })}
                  />
                  <Label htmlFor="allDay" className="text-xs">All Day</Label>
                </div>
                {!editedEvent.isAllDay && (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Start Time</Label>
                      <Input
                        type="time"
                        value={editedEvent.startTime || ''}
                        onChange={(e) => setEditedEvent({ 
                          ...editedEvent, 
                          startTime: e.target.value 
                        })}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">End Time</Label>
                      <Input
                        type="time"
                        value={editedEvent.endTime || ''}
                        onChange={(e) => setEditedEvent({ 
                          ...editedEvent, 
                          endTime: e.target.value 
                        })}
                      />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-gray-600">
                {editedEvent.isAllDay ? (
                  <ChangeTracker
                    oldValue={`All Day - ${format(new Date(originalEvent.startDate), 'MMM d, yyyy')}`}
                    newValue={`All Day - ${format(new Date(editedEvent.startDate), 'MMM d, yyyy')}`}
                    show={originalEvent.startDate !== editedEvent.startDate}
                  />
                ) : (
                  <div>
                    <div>
                      <span className="text-sm text-gray-500">Start: </span>
                      <ChangeTracker
                        oldValue={formatDateTime(originalEvent.startDate, originalEvent.startTime)}
                        newValue={formatDateTime(editedEvent.startDate, editedEvent.startTime)}
                        show={originalEvent.startDate !== editedEvent.startDate || originalEvent.startTime !== editedEvent.startTime}
                      />
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">End: </span>
                      <ChangeTracker
                        oldValue={formatDateTime(originalEvent.endDate, originalEvent.endTime)}
                        newValue={formatDateTime(editedEvent.endDate, editedEvent.endTime)}
                        show={originalEvent.endDate !== editedEvent.endDate || originalEvent.endTime !== editedEvent.endTime}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Location</Label>
            {isEditing ? (
              <Input
                value={editedEvent.location || ''}
                onChange={(e) => setEditedEvent({ ...editedEvent, location: e.target.value })}
                placeholder="Add location..."
              />
            ) : (
              <div className="text-gray-600">
                <ChangeTracker
                  oldValue={originalEvent.location}
                  newValue={editedEvent.location}
                  show={originalEvent.location !== editedEvent.location}
                />
              </div>
            )}
          </div>

          {/* Attendees */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Attendees</Label>
            {isEditing ? (
              <Input
                value={editedEvent.attendees || ''}
                onChange={(e) => setEditedEvent({ ...editedEvent, attendees: e.target.value })}
                placeholder="Add attendees..."
              />
            ) : (
              <div className="text-gray-600">
                <ChangeTracker
                  oldValue={originalEvent.attendees}
                  newValue={editedEvent.attendees}
                  show={originalEvent.attendees !== editedEvent.attendees}
                />
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-between pt-4 border-t">
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={deleteEventMutation.isPending || isEditing}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              {deleteEventMutation.isPending ? "Deleting..." : "Delete"}
            </Button>

            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancel}
                    disabled={updateEventMutation.isPending}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={updateEventMutation.isPending}
                  >
                    <Save className="h-4 w-4 mr-1" />
                    {updateEventMutation.isPending ? "Saving..." : "Save"}
                  </Button>
                </>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}