import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Trash2, Clock } from "lucide-react";

interface TimeSlot {
  start: string;
  end: string;
}

interface WeeklySchedule {
  monday: TimeSlot[];
  tuesday: TimeSlot[];
  wednesday: TimeSlot[];
  thursday: TimeSlot[];
  friday: TimeSlot[];
  saturday: TimeSlot[];
  sunday: TimeSlot[];
}

interface AvailabilityConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DAYS = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' },
] as const;

const TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'UTC', label: 'UTC' },
];

export default function AvailabilityConfigModal({ isOpen, onClose }: AvailabilityConfigModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch existing availability configuration when modal is open
  const { data: existingConfig, isLoading } = useQuery({
    queryKey: ["/api/availability/config"],
    enabled: isOpen,
    retry: false,
  });

  // Initialize state with defaults - will be updated when data loads
  const [weeklySchedule, setWeeklySchedule] = useState<WeeklySchedule>({
    monday: [{ start: "09:00", end: "17:00" }],
    tuesday: [{ start: "09:00", end: "17:00" }],
    wednesday: [{ start: "09:00", end: "17:00" }],
    thursday: [{ start: "09:00", end: "17:00" }],
    friday: [{ start: "09:00", end: "17:00" }],
    saturday: [],
    sunday: [],
  });

  const [timezone, setTimezone] = useState("America/New_York");

  // Update state when configuration loads from API
  useEffect(() => {
    if (existingConfig) {
      // Set timezone
      if (existingConfig.timezone) {
        setTimezone(existingConfig.timezone);
      }
      
      // Parse and set weekly schedule
      if (existingConfig.weeklySchedule) {
        try {
          const schedule = JSON.parse(existingConfig.weeklySchedule);
          console.log('Loading existing availability config:', schedule);
          console.log('Saturday data:', schedule.saturday);
          console.log('Sunday data:', schedule.sunday);
          
          // Ensure all days have proper array structure
          const normalizedSchedule = {
            monday: schedule.monday || [],
            tuesday: schedule.tuesday || [],
            wednesday: schedule.wednesday || [],
            thursday: schedule.thursday || [],
            friday: schedule.friday || [],
            saturday: schedule.saturday || [],
            sunday: schedule.sunday || [],
          };
          
          console.log('Normalized schedule:', normalizedSchedule);
          setWeeklySchedule(normalizedSchedule);
        } catch (error) {
          console.error("Error parsing weekly schedule:", error);
          // Keep default schedule if parsing fails
        }
      }
    }
  }, [existingConfig]);

  const saveAvailabilityMutation = useMutation({
    mutationFn: async (config: { weeklySchedule: WeeklySchedule; timezone: string }) => {
      return await apiRequest("POST", "/api/availability/config", config);
    },
    onSuccess: () => {
      toast({
        title: "Availability Updated",
        description: "Your availability schedule has been saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/availability/config"] });
      onClose();
    },
    onError: (error) => {
      console.error("Error saving availability:", error);
      toast({
        title: "Error",
        description: "Failed to save availability configuration.",
        variant: "destructive",
      });
    },
  });

  const addTimeSlot = (day: keyof WeeklySchedule) => {
    setWeeklySchedule(prev => ({
      ...prev,
      [day]: [...prev[day], { start: "09:00", end: "17:00" }],
    }));
  };

  const removeTimeSlot = (day: keyof WeeklySchedule, index: number) => {
    setWeeklySchedule(prev => ({
      ...prev,
      [day]: prev[day].filter((_, i) => i !== index),
    }));
  };

  const updateTimeSlot = (day: keyof WeeklySchedule, index: number, field: 'start' | 'end', value: string) => {
    setWeeklySchedule(prev => ({
      ...prev,
      [day]: prev[day].map((slot, i) => 
        i === index ? { ...slot, [field]: value } : slot
      ),
    }));
  };

  const handleSave = () => {
    saveAvailabilityMutation.mutate({
      weeklySchedule,
      timezone,
    });
  };

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Configure Your Availability
            </DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">Loading availability configuration...</div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Configure Your Availability
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Timezone Selection */}
          <div className="space-y-2">
            <Label htmlFor="timezone">Timezone</Label>
            <Select value={timezone} onValueChange={setTimezone}>
              <SelectTrigger>
                <SelectValue placeholder="Select timezone" />
              </SelectTrigger>
              <SelectContent>
                {TIMEZONES.map((tz) => (
                  <SelectItem key={tz.value} value={tz.value}>
                    {tz.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="text-sm text-muted-foreground">
            <p>Set your weekly availability schedule. This defines when you're generally available for bookings.</p>
            <p>You can add multiple time blocks per day (e.g., morning and afternoon shifts).</p>
          </div>

          {/* Weekly Schedule */}
          <div className="grid gap-4">
            {DAYS.map(({ key, label }) => (
              <Card key={key}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center justify-between">
                    {label}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addTimeSlot(key)}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Time Block
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {weeklySchedule[key].length === 0 ? (
                    <p className="text-sm text-muted-foreground italic">Not available</p>
                  ) : (
                    weeklySchedule[key].map((slot, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div className="flex items-center gap-2 flex-1">
                          <Input
                            type="time"
                            value={slot.start}
                            onChange={(e) => updateTimeSlot(key, index, 'start', e.target.value)}
                            className="w-32"
                          />
                          <span className="text-muted-foreground">to</span>
                          <Input
                            type="time"
                            value={slot.end}
                            onChange={(e) => updateTimeSlot(key, index, 'end', e.target.value)}
                            className="w-32"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeTimeSlot(key, index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              onClick={handleSave}
              disabled={saveAvailabilityMutation.isPending}
              className="flex-1"
            >
              {saveAvailabilityMutation.isPending ? "Saving..." : "Save Availability"}
            </Button>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}