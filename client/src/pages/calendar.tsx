import React, { useState } from "react";
import { Calendar as CalendarIcon, Plus, Clock, Users, MapPin, Edit2, Trash2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { CreateEventModal } from "@/components/create-event-modal";
import { Link } from "wouter";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isToday } from "date-fns";

interface CalendarEvent {
  id: number;
  title: string;
  description?: string;
  eventType: "availability" | "work_assignment" | "meeting" | "maintenance" | "personal";
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

const eventTypeColors = {
  availability: "bg-green-100 text-green-800 border-green-200",
  work_assignment: "bg-blue-100 text-blue-800 border-blue-200",
  meeting: "bg-purple-100 text-purple-800 border-purple-200",
  maintenance: "bg-orange-100 text-orange-800 border-orange-200",
  personal: "bg-gray-100 text-gray-800 border-gray-200",
};

const priorityColors = {
  low: "border-l-4 border-l-green-400",
  medium: "border-l-4 border-l-yellow-400",
  high: "border-l-4 border-l-red-400",
};

export default function Calendar() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [createEventOpen, setCreateEventOpen] = useState(false);
  const [eventDetailOpen, setEventDetailOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  // Fetch calendar events
  const { data: events = [], isLoading } = useQuery<CalendarEvent[]>({
    queryKey: ["/api/calendar/events"],
    enabled: !!user,
  });

  // Delete event mutation
  const deleteEventMutation = useMutation({
    mutationFn: async (eventId: number) => {
      await apiRequest("DELETE", `/api/calendar/events/${eventId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/calendar/events"] });
      setEventDetailOpen(false);
      toast({
        title: "Success",
        description: "Event deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete event",
        variant: "destructive",
      });
    },
  });

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getEventsForDate = (date: Date) => {
    return events.filter((event: CalendarEvent) => {
      const eventStart = new Date(event.startDate);
      const eventEnd = new Date(event.endDate);
      return date >= eventStart && date <= eventEnd;
    });
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setCreateEventOpen(true);
  };

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setEventDetailOpen(true);
  };

  const handleDeleteEvent = () => {
    if (selectedEvent) {
      deleteEventMutation.mutate(selectedEvent.id);
    }
  };

  const getUserRoleDescription = () => {
    switch (user?.role) {
      case "root":
        return "System Administrator";
      case "org_admin":
        return "Organization Administrator";
      case "org_subadmin":
        return "Organization Sub-Administrator";
      case "maintenance_admin":
        return "Maintenance Vendor Administrator";
      case "technician":
        return "Technician";
      default:
        return "User";
    }
  };

  const getDashboardRoute = () => {
    switch (user?.role) {
      case "root":
        return "/";
      case "org_admin":
      case "org_subadmin":
        return user?.organizationId ? `/admin/organizations/${user.organizationId}` : "/";
      case "maintenance_admin":
        return user?.maintenanceVendorId ? `/vendor/${user.maintenanceVendorId}` : "/";
      case "technician":
        return "/";
      default:
        return "/";
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-48 mb-6"></div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href={getDashboardRoute()}>
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
                <CalendarIcon className="h-8 w-8 text-blue-600" />
                Calendar
              </h1>
              <p className="text-slate-600 mt-1">
                {getUserRoleDescription()} • Manage your schedule and availability
              </p>
            </div>
          </div>
          <Button 
            onClick={() => setCreateEventOpen(true)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Event
          </Button>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Calendar Grid */}
          <Card className="col-span-8">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-xl">
                {format(currentDate, "MMMM yyyy")}
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentDate(subMonths(currentDate, 1))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentDate(new Date())}
                >
                  Today
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentDate(addMonths(currentDate, 1))}
                >
                  Next
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1 mb-4">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                  <div key={day} className="p-3 text-center font-medium text-slate-600 border-b">
                    {day}
                  </div>
                ))}
              </div>
              
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day) => {
                  const dayEvents = getEventsForDate(day);
                  const isCurrentMonth = isSameMonth(day, currentDate);
                  const isDayToday = isToday(day);

                  return (
                    <div
                      key={day.toString()}
                      className={`min-h-[120px] p-2 border rounded cursor-pointer transition-colors ${
                        isCurrentMonth 
                          ? "bg-white hover:bg-blue-50" 
                          : "bg-gray-50 text-gray-400"
                      } ${isDayToday ? "ring-2 ring-blue-500" : ""}`}
                      onClick={() => handleDateClick(day)}
                    >
                      <div className={`text-sm font-medium mb-1 ${
                        isDayToday ? "text-blue-600" : ""
                      }`}>
                        {format(day, "d")}
                      </div>
                      
                      <div className="space-y-1">
                        {dayEvents.slice(0, 3).map((event: CalendarEvent) => (
                          <div
                            key={event.id}
                            className={`text-xs p-1 rounded cursor-pointer ${
                              eventTypeColors[event.eventType]
                            } ${priorityColors[event.priority]}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEventClick(event);
                            }}
                          >
                            <div className="font-medium truncate">{event.title}</div>
                            {event.startTime && (
                              <div className="text-xs opacity-75">
                                {event.startTime}
                              </div>
                            )}
                          </div>
                        ))}
                        {dayEvents.length > 3 && (
                          <div className="text-xs text-gray-500 font-medium">
                            +{dayEvents.length - 3} more
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Event Details Sidebar */}
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {user?.role === "technician" && (
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => {
                    setSelectedDate(new Date());
                    setCreateEventOpen(true);
                  }}
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Set Availability
                </Button>
              )}
              
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => setCreateEventOpen(true)}
              >
                <Users className="h-4 w-4 mr-2" />
                Schedule Meeting
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => setCreateEventOpen(true)}
              >
                <MapPin className="h-4 w-4 mr-2" />
                Add Personal Event
              </Button>

              {/* Recent Events */}
              <div className="space-y-3 mt-6">
                <h3 className="font-medium text-slate-900">Recent Events</h3>
                {events.slice(0, 5).map((event: CalendarEvent) => (
                  <div
                    key={event.id}
                    className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                    onClick={() => handleEventClick(event)}
                  >
                    <div className="font-medium text-sm">{event.title}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {format(new Date(event.startDate), "MMM dd")}
                      {event.startTime && ` at ${event.startTime}`}
                    </div>
                    <Badge className={`mt-1 ${eventTypeColors[event.eventType]}`} variant="outline">
                      {event.eventType.replace("_", " ")}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Create Event Modal */}
        <CreateEventModal
          open={createEventOpen}
          onOpenChange={setCreateEventOpen}
          defaultDate={selectedDate}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["/api/calendar/events"] });
            setCreateEventOpen(false);
          }}
        />

        {/* Event Detail Modal */}
        <Dialog open={eventDetailOpen} onOpenChange={setEventDetailOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Event Details</DialogTitle>
            </DialogHeader>
            
            {selectedEvent && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-lg">{selectedEvent.title}</h3>
                  {selectedEvent.description && (
                    <p className="text-gray-600 mt-1">{selectedEvent.description}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">
                      {format(new Date(selectedEvent.startDate), "MMM dd, yyyy")}
                      {selectedEvent.startDate !== selectedEvent.endDate && 
                        ` - ${format(new Date(selectedEvent.endDate), "MMM dd, yyyy")}`
                      }
                    </span>
                  </div>

                  {selectedEvent.startTime && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">
                        {selectedEvent.startTime}
                        {selectedEvent.endTime && ` - ${selectedEvent.endTime}`}
                      </span>
                    </div>
                  )}

                  {selectedEvent.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">{selectedEvent.location}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Badge className={eventTypeColors[selectedEvent.eventType]} variant="outline">
                    {selectedEvent.eventType.replace("_", " ")}
                  </Badge>
                  <Badge variant="outline" className={
                    selectedEvent.priority === "high" ? "border-red-200 text-red-800" :
                    selectedEvent.priority === "medium" ? "border-yellow-200 text-yellow-800" :
                    "border-green-200 text-green-800"
                  }>
                    {selectedEvent.priority} priority
                  </Badge>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Edit2 className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 text-red-600 hover:bg-red-50"
                    onClick={handleDeleteEvent}
                    disabled={deleteEventMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}