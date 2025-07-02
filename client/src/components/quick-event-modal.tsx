import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { Calendar, Clock, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const quickEventSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  eventType: z.enum(["availability", "work_assignment", "meeting", "maintenance", "personal"]),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  location: z.string().optional(),
  duration: z.enum(["15", "30", "45", "60", "120", "180"]).default("60"),
});

type QuickEventFormData = z.infer<typeof quickEventSchema>;

interface QuickEventModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: string;
  selectedTimeSlot: string;
}

const eventTypeOptions = [
  { value: "work_assignment", label: "Work Assignment", color: "#3B82F6" },
  { value: "meeting", label: "Meeting", color: "#8B5CF6" },
  { value: "maintenance", label: "Maintenance", color: "#F59E0B" },
  { value: "personal", label: "Personal", color: "#6B7280" },
];

const durationOptions = [
  { value: "15", label: "15 minutes" },
  { value: "30", label: "30 minutes" },
  { value: "45", label: "45 minutes" },
  { value: "60", label: "1 hour" },
  { value: "120", label: "2 hours" },
  { value: "180", label: "3 hours" },
];

export function QuickEventModal({ isOpen, onOpenChange, selectedDate, selectedTimeSlot }: QuickEventModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<QuickEventFormData>({
    resolver: zodResolver(quickEventSchema),
    defaultValues: {
      title: "",
      description: "",
      eventType: "work_assignment",
      priority: "medium",
      location: "",
      duration: "60",
    },
  });

  const createEventMutation = useMutation({
    mutationFn: async (data: QuickEventFormData) => {
      const startHour = parseInt(selectedTimeSlot);
      const durationMinutes = parseInt(data.duration);
      const endTotalMinutes = startHour * 60 + durationMinutes;
      const endHour = Math.floor(endTotalMinutes / 60);
      const endMinute = endTotalMinutes % 60;
      const endTime = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
      
      const eventData = {
        title: data.title,
        description: data.description || undefined,
        eventType: data.eventType,
        startDate: selectedDate,
        endDate: selectedDate,
        startTime: `${selectedTimeSlot}:00`,
        endTime,
        isAllDay: false,
        isRecurring: false,
        isAvailability: data.eventType === "availability",
        timezone: "America/New_York",
        color: eventTypeOptions.find(opt => opt.value === data.eventType)?.color || "#3B82F6",
        priority: data.priority,
        status: "confirmed" as const,
        location: data.location || undefined,
      };

      const response = await apiRequest("POST", "/api/calendar/events", eventData);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Event Created",
        description: "Your event has been successfully added to the calendar.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/calendar/events"] });
      onOpenChange(false);
      form.reset();
    },
    onError: (error: Error) => {
      console.error("Error creating event:", error);
      
      // Check if it's a conflict error (409)
      if (error.message.includes('409') || error.message.includes('blocked time')) {
        toast({
          title: "Booking Conflict",
          description: "This time slot conflicts with an existing event or blocked period. Please choose a different time.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: error.message || "Failed to create event. Please try again.",
          variant: "destructive",
        });
      }
    },
  });

  const onSubmit = (data: QuickEventFormData) => {
    createEventMutation.mutate(data);
  };

  const formatDate = (dateStr: string) => {
    try {
      const [year, month, day] = dateStr.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      return format(date, "MMMM d, yyyy");
    } catch {
      return dateStr;
    }
  };

  const formatTimeSlot = (hour: string) => {
    const hourNum = parseInt(hour);
    if (isNaN(hourNum) || hourNum < 0 || hourNum > 23) {
      return "Invalid time slot";
    }
    const startTime = format(new Date(2000, 0, 1, hourNum), "h:mm a");
    const endTime = format(new Date(2000, 0, 1, hourNum + 1), "h:mm a");
    return `${startTime} - ${endTime}`;
  };

  // Don't render content if we don't have valid data
  if (!selectedDate || !selectedTimeSlot) {
    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Error</DialogTitle>
          </DialogHeader>
          <p>Invalid date or time slot selected.</p>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-blue-600" />
            Create Event
          </DialogTitle>
          <div className="text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {formatDate(selectedDate)}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Clock className="h-4 w-4" />
              {formatTimeSlot(selectedTimeSlot)}
            </div>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Event Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter event title..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Event Type */}
            <FormField
              control={form.control}
              name="eventType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Event Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select event type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {eventTypeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: option.color }}
                            />
                            {option.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Duration */}
            <FormField
              control={form.control}
              name="duration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Duration</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {durationOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Priority */}
            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Priority</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="low">Low Priority</SelectItem>
                      <SelectItem value="medium">Medium Priority</SelectItem>
                      <SelectItem value="high">High Priority</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Location */}
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter location..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Add any additional details..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createEventMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {createEventMutation.isPending ? "Creating..." : "Create Event"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}