import { useState, useEffect } from "react";
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
import { Calendar } from "@/components/ui/calendar";
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

interface TimeBlock {
  startTime: string;
  endTime: string;
}

const unavailabilityFormSchema = z.object({
  selectedDates: z.array(z.date()).min(1, "Please select at least one date"),
  isAllDay: z.boolean(),
  timeBlocks: z.array(z.object({
    startTime: z.string(),
    endTime: z.string(),
  })).optional(),
  timezone: z.string(),
  title: z.string().min(1, "Title is required"),
  notes: z.string().optional(),
}).refine((data) => {
  // If not all day, require at least one time block
  if (!data.isAllDay && (!data.timeBlocks || data.timeBlocks.length === 0)) {
    return false;
  }
  return true;
}, {
  message: "Time blocks are required when not blocking all day",
  path: ["timeBlocks"]
});

type UnavailabilityFormData = z.infer<typeof unavailabilityFormSchema>;

interface UnavailabilityModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate?: string;
}

export function UnavailabilityModal({ isOpen, onOpenChange, selectedDate }: UnavailabilityModalProps) {
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>([{ startTime: "09:00", endTime: "17:00" }]);
  const [isAllDay, setIsAllDay] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<UnavailabilityFormData>({
    resolver: zodResolver(unavailabilityFormSchema),
    defaultValues: {
      selectedDates: [],
      isAllDay: false,
      timeBlocks: [{ startTime: "09:00", endTime: "17:00" }],
      timezone: "America/New_York",
      title: "Unavailable",
      notes: "",
    },
  });

  // Initialize with selected date if provided
  useEffect(() => {
    if (selectedDate && isOpen) {
      const date = new Date(selectedDate);
      setSelectedDates([date]);
      form.setValue("selectedDates", [date]);
    }
  }, [selectedDate, isOpen, form]);

  const createUnavailabilityMutation = useMutation({
    mutationFn: async (data: UnavailabilityFormData) => {
      // Create separate events for each selected date
      const events = [];
      
      for (const date of data.selectedDates) {
        // Use the date directly without timezone adjustment since we're working in local time
        const dateString = format(date, 'yyyy-MM-dd');
        
        if (data.isAllDay) {
          // Create a single all-day event
          const eventData = {
            title: data.title,
            description: data.notes || "Unavailable all day",
            eventType: "unavailability" as const,
            startDate: dateString,
            endDate: dateString,
            startTime: "00:00",
            endTime: "23:59",
            isAllDay: true,
            isRecurring: false,
            isAvailability: false,
            timezone: data.timezone,
            color: "#EF4444", // Red for unavailability
            priority: "high" as const,
            status: "confirmed" as const,
          };
          events.push(eventData);
        } else {
          // Create events for each time block
          for (const timeBlock of data.timeBlocks || []) {
            const eventData = {
              title: data.title,
              description: data.notes || `Unavailable ${timeBlock.startTime}-${timeBlock.endTime}`,
              eventType: "unavailability" as const,
              startDate: dateString,
              endDate: dateString,
              startTime: timeBlock.startTime,
              endTime: timeBlock.endTime,
              isAllDay: false,
              isRecurring: false,
              isAvailability: false,
              timezone: data.timezone,
              color: "#EF4444", // Red for unavailability
              priority: "high" as const,
              status: "confirmed" as const,
            };
            events.push(eventData);
          }
        }
      }

      // Create all events
      const results = [];
      for (const eventData of events) {
        const response = await apiRequest("POST", "/api/calendar/events", eventData);
        results.push(await response.json());
      }
      
      return results;
    },
    onSuccess: () => {
      toast({
        title: "Unavailability Set",
        description: `Successfully blocked ${selectedDates.length} day${selectedDates.length > 1 ? 's' : ''}`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/calendar/events"] });
      onOpenChange(false);
      form.reset();
      setSelectedDates([]);
      setTimeBlocks([{ startTime: "09:00", endTime: "17:00" }]);
      setIsAllDay(false);
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
    const newBlocks = [...timeBlocks, { startTime: "09:00", endTime: "17:00" }];
    setTimeBlocks(newBlocks);
    form.setValue("timeBlocks", newBlocks);
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
    // Use current state values
    const formData = {
      ...data,
      selectedDates,
      isAllDay,
      timeBlocks: isAllDay ? undefined : timeBlocks,
    };
    createUnavailabilityMutation.mutate(formData);
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

            {/* Calendar Date Selection */}
            <div className="space-y-4">
              <FormLabel>Select Dates</FormLabel>
              <div className="border rounded-md p-4">
                <Calendar
                  mode="multiple"
                  selected={selectedDates}
                  onSelect={(dates) => {
                    setSelectedDates(dates || []);
                    form.setValue("selectedDates", dates || []);
                  }}
                  disabled={(date) => date < new Date()}
                  className="rounded-md"
                />
              </div>
              {selectedDates.length > 0 && (
                <div className="text-sm text-muted-foreground">
                  Selected: {selectedDates.length} day{selectedDates.length > 1 ? 's' : ''}
                  <div className="mt-1 flex flex-wrap gap-1">
                    {selectedDates.map((date, index) => (
                      <span key={index} className="px-2 py-1 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded text-xs">
                        {format(date, 'MMM d')}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* All Day Checkbox */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="allDay"
                checked={isAllDay}
                onCheckedChange={(checked) => {
                  setIsAllDay(checked === true);
                  form.setValue("isAllDay", checked === true);
                }}
              />
              <label htmlFor="allDay" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Block all day
              </label>
            </div>

            {/* Time Blocks (only show if not all day) */}
            {!isAllDay && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <FormLabel className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Time Blocks
                  </FormLabel>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addTimeBlock}
                    className="flex items-center gap-1"
                  >
                    <Plus className="h-3 w-3" />
                    Add Block
                  </Button>
                </div>
                <div className="space-y-3">
                  {timeBlocks.map((block, index) => (
                    <div key={index} className="flex items-center gap-2 p-3 border rounded-lg">
                      <div className="flex-1 grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs text-muted-foreground">Start Time</label>
                          <Input
                            type="time"
                            value={block.startTime}
                            onChange={(e) => updateTimeBlock(index, "startTime", e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground">End Time</label>
                          <Input
                            type="time"
                            value={block.endTime}
                            onChange={(e) => updateTimeBlock(index, "endTime", e.target.value)}
                          />
                        </div>
                      </div>
                      {timeBlocks.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeTimeBlock(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

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

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Additional details about this unavailability..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Form Actions */}
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createUnavailabilityMutation.isPending || selectedDates.length === 0}
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