import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Clock, X, Plus } from "lucide-react";
import { UnavailabilityModal } from "./unavailability-modal";

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
}

interface CalendarDayDetailProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: Date | null;
}

export function CalendarDayDetail({ isOpen, onOpenChange, selectedDate }: CalendarDayDetailProps) {
  const [showUnavailabilityModal, setShowUnavailabilityModal] = useState(false);

  const { data: events = [] } = useQuery<CalendarEvent[]>({
    queryKey: ["/api/calendar/events"],
    enabled: isOpen && !!selectedDate,
  });

  if (!selectedDate) return null;

  const dateString = format(selectedDate, 'yyyy-MM-dd');
  const dayEvents = events.filter((event: any) => {
    const eventStartDate = event.startDate.split('T')[0];
    return eventStartDate === dateString;
  });

  // Generate hourly slots from 6 AM to 10 PM
  const hours = [];
  for (let hour = 6; hour <= 22; hour++) {
    const timeSlot = `${hour.toString().padStart(2, '0')}:00`;
    const nextHour = `${(hour + 1).toString().padStart(2, '0')}:00`;
    
    // Check if this hour is blocked by any unavailability events
    const isBlocked = dayEvents.some((event: any) => {
      if (event.eventType !== 'unavailability') return false;
      if (event.isAllDay) return true;
      
      if (!event.startTime || !event.endTime) return false;
      const eventStart = event.startTime.includes('T') ? event.startTime.split('T')[1]?.substring(0, 5) : event.startTime;
      const eventEnd = event.endTime.includes('T') ? event.endTime.split('T')[1]?.substring(0, 5) : event.endTime;
      
      return !!(eventStart && eventEnd && timeSlot >= eventStart && timeSlot < eventEnd);
    });

    // Get events that start in this hour
    const hourEvents = dayEvents.filter((event: any) => {
      if (event.isAllDay) return false;
      if (!event.startTime) return false;
      const eventStart = event.startTime.includes('T') ? event.startTime.split('T')[1]?.substring(0, 5) : event.startTime;
      return !!(eventStart && eventStart >= timeSlot && eventStart < nextHour);
    });

    hours.push({
      time: timeSlot,
      displayTime: format(new Date(`2000-01-01T${timeSlot}`), 'h:mm a'),
      isBlocked,
      events: hourEvents,
    });
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-500" />
              {format(selectedDate, "EEEE, MMMM d, yyyy")}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Add Unavailability Button */}
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-medium text-muted-foreground">Daily Schedule</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowUnavailabilityModal(true)}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                <Plus className="h-3 w-3 mr-1" />
                Block Time
              </Button>
            </div>

            {/* Hourly Breakdown */}
            <div className="space-y-1">
              {hours.map((hour) => (
                <div
                  key={hour.time}
                  className={`flex items-center justify-between p-2 rounded border ${
                    hour.isBlocked
                      ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                      : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-mono text-muted-foreground min-w-[60px]">
                      {hour.displayTime}
                    </span>
                    {hour.isBlocked && (
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-0.5 bg-red-500 relative">
                          <div className="absolute inset-0 bg-red-500 transform rotate-12"></div>
                        </div>
                        <span className="text-xs text-red-600 font-medium">Blocked</span>
                      </div>
                    )}
                  </div>

                  {/* Events in this hour */}
                  {hour.events.length > 0 && (
                    <div className="flex flex-col gap-1">
                      {hour.events.map((event: CalendarEvent) => (
                        <div
                          key={event.id}
                          className="text-xs px-2 py-1 rounded"
                          style={{ backgroundColor: event.color + '20', color: event.color }}
                        >
                          {event.title}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* All Day Events */}
            {dayEvents.some((event: CalendarEvent) => event.isAllDay) && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-muted-foreground mb-2">All Day</h4>
                <div className="space-y-1">
                  {dayEvents
                    .filter((event: CalendarEvent) => event.isAllDay)
                    .map((event: CalendarEvent) => (
                      <div
                        key={event.id}
                        className="p-2 rounded border"
                        style={{ backgroundColor: event.color + '20', borderColor: event.color + '40' }}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium" style={{ color: event.color }}>
                            {event.title}
                          </span>
                          {event.eventType === 'unavailability' && (
                            <span className="text-xs text-red-600 bg-red-100 px-2 py-1 rounded">
                              Blocked
                            </span>
                          )}
                        </div>
                        {event.description && (
                          <p className="text-xs text-muted-foreground mt-1">{event.description}</p>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Summary */}
            <div className="pt-4 border-t">
              <div className="text-xs text-muted-foreground">
                {dayEvents.filter((e: CalendarEvent) => e.eventType === 'unavailability').length > 0 
                  ? `${dayEvents.filter((e: CalendarEvent) => e.eventType === 'unavailability').length} time block(s) unavailable`
                  : "Fully available"
                }
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <UnavailabilityModal
        isOpen={showUnavailabilityModal}
        onOpenChange={setShowUnavailabilityModal}
        selectedDate={dateString}
      />
    </>
  );
}