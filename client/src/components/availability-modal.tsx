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
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CalendarDays, Clock, MapPin, Repeat } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const timezones = [
  "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles",
  "America/Toronto", "America/Vancouver", "Europe/London", "Europe/Paris", 
  "Europe/Berlin", "Europe/Rome", "Asia/Tokyo", "Asia/Shanghai", 
  "Asia/Kolkata", "Australia/Sydney", "Pacific/Auckland"
];

const daysOfWeek = [
  { id: "monday", label: "Monday" },
  { id: "tuesday", label: "Tuesday" },
  { id: "wednesday", label: "Wednesday" },
  { id: "thursday", label: "Thursday" },
  { id: "friday", label: "Friday" },
  { id: "saturday", label: "Saturday" },
  { id: "sunday", label: "Sunday" },
];

const availabilitySchema = z.object({
  availabilityType: z.enum(["date_range", "days_of_week"]),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  selectedDays: z.array(z.string()).optional(),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  timezone: z.string().default("America/New_York"),
  isRecurring: z.boolean().default(false),
  title: z.string().min(1, "Title is required"),
  notes: z.string().optional(),
});

type AvailabilityFormData = z.infer<typeof availabilitySchema>;

interface AvailabilityModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AvailabilityModal({ isOpen, onClose }: AvailabilityModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [availabilityType, setAvailabilityType] = useState<"date_range" | "days_of_week">("days_of_week");

  const form = useForm<AvailabilityFormData>({
    resolver: zodResolver(availabilitySchema),
    defaultValues: {
      availabilityType: "days_of_week",
      selectedDays: ["monday", "tuesday", "wednesday", "thursday", "friday"],
      startTime: "08:00",
      endTime: "18:00",
      timezone: "America/New_York",
      isRecurring: true,
      title: "General Availability",
      notes: "",
    },
  });

  const createAvailabilityMutation = useMutation({
    mutationFn: async (data: AvailabilityFormData) => {
      // Convert form data to calendar event format
      const eventData = {
        title: data.title,
        description: data.notes || `Available ${data.startTime} - ${data.endTime}`,
        eventType: "availability" as const,
        startDate: data.availabilityType === "date_range" ? data.startDate! : new Date().toISOString().split('T')[0],
        endDate: data.availabilityType === "date_range" ? data.endDate! : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        startTime: data.startTime,
        endTime: data.endTime,
        isAllDay: false,
        isRecurring: data.isRecurring,
        isAvailability: true,
        timezone: data.timezone,
        availabilityDays: data.availabilityType === "days_of_week" ? data.selectedDays : undefined,
        availabilityStartTime: data.startTime,
        availabilityEndTime: data.endTime,
        color: "#10B981", // Green for availability
        priority: "medium" as const,
        status: "confirmed" as const,
        recurrencePattern: data.isRecurring && data.availabilityType === "days_of_week" 
          ? JSON.stringify({
              type: "weekly",
              days: data.selectedDays,
              endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            })
          : undefined,
      };

      const response = await apiRequest("POST", "/api/calendar/events", eventData);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Availability Set",
        description: "Your availability has been configured successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/calendar/events"] });
      onClose();
      form.reset();
    },
    onError: (error) => {
      console.error("Error setting availability:", error);
      toast({
        title: "Error",
        description: "Failed to set availability. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: AvailabilityFormData) => {
    createAvailabilityMutation.mutate(data);
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-green-600" />
            Set Your Availability
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Availability Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., General Work Hours, Weekend Availability" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Availability Type Selection */}
            <div className="space-y-4">
              <FormLabel className="text-base font-medium">Availability Pattern</FormLabel>
              <RadioGroup
                value={availabilityType}
                onValueChange={(value) => {
                  setAvailabilityType(value as "date_range" | "days_of_week");
                  form.setValue("availabilityType", value as "date_range" | "days_of_week");
                }}
                className="grid grid-cols-1 gap-4"
              >
                <div className="flex items-center space-x-2 p-4 border rounded-lg">
                  <RadioGroupItem value="days_of_week" id="days_of_week" />
                  <Label htmlFor="days_of_week" className="flex-1">
                    <div className="font-medium">Days of the Week</div>
                    <div className="text-sm text-muted-foreground">
                      Set recurring availability for specific days (e.g., Monday-Friday)
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-4 border rounded-lg">
                  <RadioGroupItem value="date_range" id="date_range" />
                  <Label htmlFor="date_range" className="flex-1">
                    <div className="font-medium">Date Range</div>
                    <div className="text-sm text-muted-foreground">
                      Set availability for a specific date range
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Days of Week Selection */}
            {availabilityType === "days_of_week" && (
              <FormField
                control={form.control}
                name="selectedDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select Days</FormLabel>
                    <div className="grid grid-cols-2 gap-2">
                      {daysOfWeek.map((day) => (
                        <div key={day.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={day.id}
                            checked={field.value?.includes(day.id)}
                            onCheckedChange={(checked) => {
                              const current = field.value || [];
                              if (checked) {
                                field.onChange([...current, day.id]);
                              } else {
                                field.onChange(current.filter((d) => d !== day.id));
                              }
                            }}
                          />
                          <Label htmlFor={day.id}>{day.label}</Label>
                        </div>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Date Range Selection */}
            {availabilityType === "date_range" && (
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
            )}

            {/* Time Selection */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Start Time
                    </FormLabel>
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
                    <FormLabel className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      End Time
                    </FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
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
                  <FormLabel className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Timezone
                  </FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select timezone" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {timezones.map((tz) => (
                        <SelectItem key={tz} value={tz}>
                          {tz.replace('_', ' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Recurring Option */}
            {availabilityType === "days_of_week" && (
              <FormField
                control={form.control}
                name="isRecurring"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="flex items-center gap-2">
                        <Repeat className="h-4 w-4" />
                        Recurring Availability
                      </FormLabel>
                      <div className="text-sm text-muted-foreground">
                        This availability pattern will repeat weekly
                      </div>
                    </div>
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            )}

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add any specific notes about your availability..."
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Action Buttons */}
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createAvailabilityMutation.isPending}
                className="bg-green-600 hover:bg-green-700"
              >
                {createAvailabilityMutation.isPending ? "Setting..." : "Set Availability"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}