import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, Clock, Save } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { fromZonedTime, toZonedTime } from "date-fns-tz";

const eventSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  eventType: z.enum(["availability", "work_assignment", "meeting", "maintenance", "personal"]),
  startDate: z.string().min(1, "Start date is required"),
  startTime: z.string().optional(),
  endDate: z.string().min(1, "End date is required"),
  endTime: z.string().optional(),
  isAllDay: z.boolean().default(false),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  location: z.string().optional(),
  color: z.string().default("#3B82F6"),
  timezone: z.string().default("America/New_York"),
  // For availability events - enhanced fields
  availabilityDays: z.array(z.string()).optional(),
  availabilityStartTime: z.string().optional(),
  availabilityEndTime: z.string().optional(),
  isRecurring: z.boolean().default(false),
});

type EventFormData = z.infer<typeof eventSchema>;

interface CreateEventModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultDate?: Date | null;
  onSuccess: () => void;
}

const eventTypeOptions = [
  { value: "availability", label: "Availability", description: "Set when you're available for work", color: "#10B981" },
  { value: "work_assignment", label: "Work Assignment", description: "Scheduled work or maintenance", color: "#3B82F6" },
  { value: "meeting", label: "Meeting", description: "Business meetings or calls", color: "#8B5CF6" },
  { value: "maintenance", label: "Maintenance", description: "Equipment or facility maintenance", color: "#F59E0B" },
  { value: "personal", label: "Personal", description: "Personal events and appointments", color: "#6B7280" },
];

const timezoneOptions = [
  { value: "America/New_York", label: "New York (EST/EDT)" },
  { value: "America/Chicago", label: "Chicago (CST/CDT)" },
  { value: "America/Denver", label: "Denver (MST/MDT)" },
  { value: "America/Los_Angeles", label: "Los Angeles (PST/PDT)" },
  { value: "America/Phoenix", label: "Phoenix (MST)" },
  { value: "America/Anchorage", label: "Anchorage (AKST/AKDT)" },
  { value: "Pacific/Honolulu", label: "Hawaii (HST)" },
  { value: "America/Toronto", label: "Toronto (EST/EDT)" },
  { value: "America/Vancouver", label: "Vancouver (PST/PDT)" },
  { value: "Europe/London", label: "London (GMT/BST)" },
  { value: "Europe/Paris", label: "Paris (CET/CEST)" },
  { value: "Asia/Tokyo", label: "Tokyo (JST)" },
  { value: "Australia/Sydney", label: "Sydney (AEST/AEDT)" },
];

const dayOptions = [
  { value: "monday", label: "Monday" },
  { value: "tuesday", label: "Tuesday" },
  { value: "wednesday", label: "Wednesday" },
  { value: "thursday", label: "Thursday" },
  { value: "friday", label: "Friday" },
  { value: "saturday", label: "Saturday" },
  { value: "sunday", label: "Sunday" },
];

const timeOptions = Array.from({ length: 24 }, (_, i) => {
  const hour = i;
  const time12 = hour === 0 ? "12:00 AM" : hour < 12 ? `${hour}:00 AM` : hour === 12 ? "12:00 PM" : `${hour - 12}:00 PM`;
  const time24 = `${hour.toString().padStart(2, '0')}:00`;
  return { value: time24, label: time12 };
});

export function CreateEventModal({ open, onOpenChange, defaultDate, onSuccess }: CreateEventModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedEventType, setSelectedEventType] = useState<string>("");

  const form = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: "",
      description: "",
      eventType: "personal",
      startDate: defaultDate ? format(defaultDate, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"),
      endDate: defaultDate ? format(defaultDate, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"),
      startTime: "",
      endTime: "",
      isAllDay: false,
      priority: "medium",
      location: "",
      color: "#3B82F6",
      timezone: "America/New_York",
      availabilityDays: [],
      availabilityStartTime: "08:00",
      availabilityEndTime: "18:00",
      isRecurring: false,
    },
  });

  const createEventMutation = useMutation({
    mutationFn: async (data: EventFormData) => {
      const eventData = {
        ...data,
        isAvailability: data.eventType === "availability",
        status: "confirmed",
      };
      
      return await apiRequest("POST", "/api/calendar/events", eventData);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Event created successfully",
      });
      form.reset();
      onSuccess();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create event",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: EventFormData) => {
    createEventMutation.mutate(data);
  };

  const handleEventTypeSelect = (value: string) => {
    setSelectedEventType(value);
    const eventType = eventTypeOptions.find(opt => opt.value === value);
    if (eventType) {
      form.setValue("eventType", value as any);
      form.setValue("color", eventType.color);
      
      // Auto-fill title for availability
      if (value === "availability") {
        form.setValue("title", "Available for Work");
        form.setValue("description", "Available for maintenance assignments");
      }
    }
  };

  const watchedIsAllDay = form.watch("isAllDay");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-blue-600" />
            Create New Event
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Event Type Selection */}
            <div className="space-y-3">
              <FormLabel>Event Type</FormLabel>
              <div className="grid grid-cols-1 gap-2">
                {eventTypeOptions.map((option) => (
                  <div
                    key={option.value}
                    className={`p-3 border rounded-lg cursor-pointer transition-all ${
                      selectedEventType === option.value
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => handleEventTypeSelect(option.value)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{option.label}</div>
                        <div className="text-sm text-gray-500">{option.description}</div>
                      </div>
                      <div
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: option.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Title and Description */}
            <div className="grid grid-cols-1 gap-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Event title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Event description (optional)"
                        className="resize-none"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Date and Time */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <FormField
                  control={form.control}
                  name="isAllDay"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="!mt-0">All Day Event</FormLabel>
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {!watchedIsAllDay && (
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Time</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="endTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Time</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </div>

            {/* Priority and Location */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-green-400 rounded"></div>
                            Low Priority
                          </div>
                        </SelectItem>
                        <SelectItem value="medium">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-yellow-400 rounded"></div>
                            Medium Priority
                          </div>
                        </SelectItem>
                        <SelectItem value="high">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-red-400 rounded"></div>
                            High Priority
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input placeholder="Event location (optional)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Timezone Selection */}
            <FormField
              control={form.control}
              name="timezone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Timezone</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select timezone" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {timezoneOptions.map((timezone) => (
                        <SelectItem key={timezone.value} value={timezone.value}>
                          {timezone.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Enhanced Availability Configuration */}
            {selectedEventType === "availability" && (
              <div className="space-y-4 p-4 border rounded-lg bg-green-50">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded"></div>
                  <h3 className="font-medium text-green-800">Availability Configuration</h3>
                </div>
                
                {/* Recurring Toggle */}
                <FormField
                  control={form.control}
                  name="isRecurring"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between">
                      <div>
                        <FormLabel>Recurring Availability</FormLabel>
                        <div className="text-sm text-gray-600">Set availability for multiple days</div>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {/* Day Selection for Recurring */}
                {form.watch("isRecurring") && (
                  <FormField
                    control={form.control}
                    name="availabilityDays"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Available Days</FormLabel>
                        <div className="grid grid-cols-4 gap-2">
                          {dayOptions.map((day) => (
                            <Button
                              key={day.value}
                              type="button"
                              variant={field.value?.includes(day.value) ? "default" : "outline"}
                              size="sm"
                              onClick={() => {
                                const currentDays = field.value || [];
                                if (currentDays.includes(day.value)) {
                                  field.onChange(currentDays.filter(d => d !== day.value));
                                } else {
                                  field.onChange([...currentDays, day.value]);
                                }
                              }}
                              className="text-xs"
                            >
                              {day.label.slice(0, 3)}
                            </Button>
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* Time Range for Availability */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="availabilityStartTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Time</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Start time" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {timeOptions.map((time) => (
                              <SelectItem key={time.value} value={time.value}>
                                {time.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="availabilityEndTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Time</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="End time" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {timeOptions.map((time) => (
                              <SelectItem key={time.value} value={time.value}>
                                {time.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="text-sm text-green-700 bg-green-100 p-3 rounded">
                  <strong>Example:</strong> Select Monday-Friday with 8:00 AM - 6:00 PM to set availability for weekdays
                </div>
              </div>
            )}

            {/* Submit Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createEventMutation.isPending}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <Save className="h-4 w-4 mr-2" />
                {createEventMutation.isPending ? "Creating..." : "Create Event"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}