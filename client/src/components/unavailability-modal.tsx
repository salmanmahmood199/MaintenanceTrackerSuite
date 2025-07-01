import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { CalendarDays, Clock, X, Plus } from "lucide-react";
import { format } from "date-fns";

// Major timezone cities for selection
const TIMEZONE_OPTIONS = [
  { value: "America/New_York", label: "New York (EST/EDT)" },
  { value: "America/Chicago", label: "Chicago (CST/CDT)" },
  { value: "America/Denver", label: "Denver (MST/MDT)" },
  { value: "America/Los_Angeles", label: "Los Angeles (PST/PDT)" },
  { value: "America/Toronto", label: "Toronto (EST/EDT)" },
  { value: "America/Vancouver", label: "Vancouver (PST/PDT)" },
  { value: "Europe/London", label: "London (GMT/BST)" },
  { value: "Europe/Paris", label: "Paris (CET/CEST)" },
  { value: "Europe/Berlin", label: "Berlin (CET/CEST)" },
  { value: "Asia/Tokyo", label: "Tokyo (JST)" },
  { value: "Asia/Shanghai", label: "Shanghai (CST)" },
  { value: "Asia/Dubai", label: "Dubai (GST)" },
  { value: "Australia/Sydney", label: "Sydney (AEST/AEDT)" },
];

const DAYS_OF_WEEK = [
  { value: "monday", label: "Monday" },
  { value: "tuesday", label: "Tuesday" },
  { value: "wednesday", label: "Wednesday" },
  { value: "thursday", label: "Thursday" },
  { value: "friday", label: "Friday" },
  { value: "saturday", label: "Saturday" },
  { value: "sunday", label: "Sunday" },
];

interface TimeBlock {
  startTime: string;
  endTime: string;
}

const unavailabilityFormSchema = z.object({
  unavailabilityType: z.enum(["date_range", "days_of_week", "specific_date"]),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  specificDate: z.string().optional(),
  selectedDays: z.array(z.string()).optional(),
  timeBlocks: z.array(z.object({
    startTime: z.string(),
    endTime: z.string(),
  })).min(1, "At least one time block is required"),
  timezone: z.string(),
  isRecurring: z.boolean(),
  title: z.string().min(1, "Title is required"),
  notes: z.string().optional(),
});

type UnavailabilityFormData = z.infer<typeof unavailabilityFormSchema>;

interface UnavailabilityModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate?: string;
}

export function UnavailabilityModal({ isOpen, onOpenChange, selectedDate }: UnavailabilityModalProps) {
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>([{ startTime: "09:00", endTime: "10:00" }]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<UnavailabilityFormData>({
    resolver: zodResolver(unavailabilityFormSchema),
    defaultValues: {
      unavailabilityType: selectedDate ? "specific_date" : "days_of_week",
      specificDate: selectedDate,
      selectedDays: [],
      timeBlocks: [{ startTime: "09:00", endTime: "10:00" }],
      timezone: "America/New_York",
      isRecurring: false,
      title: "Unavailable",
      notes: "",
    },
  });

  const unavailabilityType = form.watch("unavailabilityType");

  const createUnavailabilityMutation = useMutation({
    mutationFn: async (data: UnavailabilityFormData) => {
      // Convert form data to calendar event format
      const eventData = {
        title: data.title,
        description: data.notes || `Unavailable - ${data.timeBlocks.map(block => `${block.startTime}-${block.endTime}`).join(", ")}`,
        eventType: "unavailability" as const,
        startDate: data.unavailabilityType === "specific_date" 
          ? data.specificDate!
          : data.unavailabilityType === "date_range" 
            ? data.startDate! 
            : new Date().toISOString().split('T')[0],
        endDate: data.unavailabilityType === "specific_date"
          ? data.specificDate!
          : data.unavailabilityType === "date_range" 
            ? data.endDate!
            : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        startTime: data.timeBlocks[0].startTime,
        endTime: data.timeBlocks[data.timeBlocks.length - 1].endTime,
        isAllDay: false,
        isRecurring: data.isRecurring,
        isAvailability: false,
        timezone: data.timezone,
        unavailabilityDays: data.unavailabilityType === "days_of_week" ? data.selectedDays : undefined,
        unavailabilityTimeBlocks: data.timeBlocks,
        color: "#EF4444", // Red for unavailability
        priority: "high" as const,
        status: "confirmed" as const,
        recurrencePattern: data.isRecurring && data.unavailabilityType === "days_of_week" 
          ? JSON.stringify({
              type: "weekly",
              days: data.selectedDays,
              timeBlocks: data.timeBlocks,
              endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            })
          : undefined,
      };

      const response = await apiRequest("POST", "/api/calendar/events", eventData);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Unavailability Set",
        description: "Your unavailability has been configured successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/calendar/events"] });
      onOpenChange(false);
      form.reset();
      setTimeBlocks([{ startTime: "09:00", endTime: "10:00" }]);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to set unavailability",
        variant: "destructive",
      });
    },
  });

  const addTimeBlock = () => {
    setTimeBlocks([...timeBlocks, { startTime: "09:00", endTime: "10:00" }]);
  };

  const removeTimeBlock = (index: number) => {
    if (timeBlocks.length > 1) {
      const newBlocks = timeBlocks.filter((_, i) => i !== index);
      setTimeBlocks(newBlocks);
      form.setValue("timeBlocks", newBlocks);
    }
  };

  const updateTimeBlock = (index: number, field: keyof TimeBlock, value: string) => {
    const newBlocks = [...timeBlocks];
    newBlocks[index][field] = value;
    setTimeBlocks(newBlocks);
    form.setValue("timeBlocks", newBlocks);
  };

  const onSubmit = (data: UnavailabilityFormData) => {
    // Update form data with current time blocks
    data.timeBlocks = timeBlocks;
    createUnavailabilityMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-red-500" />
            Set Unavailability
            {selectedDate && (
              <span className="text-sm font-normal text-muted-foreground">
                for {format(new Date(selectedDate), "MMMM d, yyyy")}
              </span>
            )}
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
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Meeting, Personal Time, Out of Office" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {!selectedDate && (
              <>
                {/* Unavailability Type */}
                <FormField
                  control={form.control}
                  name="unavailabilityType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unavailability Period</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select unavailability type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="days_of_week">Specific Days of Week</SelectItem>
                          <SelectItem value="date_range">Date Range</SelectItem>
                          <SelectItem value="specific_date">Specific Date</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Days of Week Selection */}
                {unavailabilityType === "days_of_week" && (
                  <FormField
                    control={form.control}
                    name="selectedDays"
                    render={() => (
                      <FormItem>
                        <FormLabel>Select Days</FormLabel>
                        <div className="grid grid-cols-2 gap-2">
                          {DAYS_OF_WEEK.map((day) => (
                            <FormField
                              key={day.value}
                              control={form.control}
                              name="selectedDays"
                              render={({ field }) => {
                                return (
                                  <FormItem
                                    key={day.value}
                                    className="flex flex-row items-start space-x-3 space-y-0"
                                  >
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(day.value)}
                                        onCheckedChange={(checked) => {
                                          return checked
                                            ? field.onChange([...(field.value || []), day.value])
                                            : field.onChange(
                                                field.value?.filter(
                                                  (value) => value !== day.value
                                                )
                                              );
                                        }}
                                      />
                                    </FormControl>
                                    <FormLabel className="font-normal">
                                      {day.label}
                                    </FormLabel>
                                  </FormItem>
                                );
                              }}
                            />
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* Date Range */}
                {unavailabilityType === "date_range" && (
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

                {/* Specific Date */}
                {unavailabilityType === "specific_date" && (
                  <FormField
                    control={form.control}
                    name="specificDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </>
            )}

            {/* Time Blocks */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <FormLabel className="text-base">Time Blocks</FormLabel>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addTimeBlock}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Time Block
                </Button>
              </div>
              
              {timeBlocks.map((block, index) => (
                <div key={index} className="flex items-center gap-2 p-3 border rounded-lg">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <Input
                    type="time"
                    value={block.startTime}
                    onChange={(e) => updateTimeBlock(index, "startTime", e.target.value)}
                    className="w-24"
                  />
                  <span className="text-muted-foreground">to</span>
                  <Input
                    type="time"
                    value={block.endTime}
                    onChange={(e) => updateTimeBlock(index, "endTime", e.target.value)}
                    className="w-24"
                  />
                  {timeBlocks.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeTimeBlock(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            {/* Timezone */}
            <FormField
              control={form.control}
              name="timezone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Timezone</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select timezone" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {TIMEZONE_OPTIONS.map((tz) => (
                        <SelectItem key={tz.value} value={tz.value}>
                          {tz.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Recurring Option */}
            {!selectedDate && unavailabilityType === "days_of_week" && (
              <FormField
                control={form.control}
                name="isRecurring"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Recurring Weekly</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        This unavailability will repeat every week for the selected days
                      </p>
                    </div>
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
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Add any additional details about your unavailability..."
                      rows={3}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Submit */}
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createUnavailabilityMutation.isPending}
                className="bg-red-600 hover:bg-red-700"
              >
                {createUnavailabilityMutation.isPending ? "Setting..." : "Set Unavailability"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}