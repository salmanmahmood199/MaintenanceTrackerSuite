import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar, ChevronLeft, ChevronRight, Clock, X } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isToday, startOfWeek, endOfWeek } from 'date-fns';


interface TechnicianCalendarWidgetProps {
  technicianId: number;
  technicianName: string;
  onDateSelect?: (date: Date) => void;
  trigger?: React.ReactNode;
}

interface CalendarEvent {
  id: number;
  title: string;
  startDate: string;
  startTime: string | null;
  endDate: string;
  endTime: string | null;
  isAllDay: boolean;
}

interface Ticket {
  id: number;
  ticketNumber: string;
  title: string;
  scheduledStartTime: string;
  scheduledEndTime: string;
  status: string;
}

interface AvailabilityConfig {
  id: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

interface ScheduleData {
  events: CalendarEvent[];
  tickets: Ticket[];
  availability: AvailabilityConfig[];
}

export function TechnicianCalendarWidget({ 
  technicianId, 
  technicianName, 
  onDateSelect,
  trigger 
}: TechnicianCalendarWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [scheduleData, setScheduleData] = useState<ScheduleData | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  useEffect(() => {
    if (isOpen) {
      fetchScheduleData();
    }
  }, [isOpen, currentDate, technicianId]);

  const fetchScheduleData = async () => {
    setLoading(true);
    try {
      // Get schedule data for the current month
      const startDate = startOfMonth(currentDate).toISOString();
      const endDate = endOfMonth(currentDate).toISOString();
      
      const response = await fetch(`/api/technicians/${technicianId}/availability?startDate=${startDate}&endDate=${endDate}`);
      if (!response.ok) {
        throw new Error('Failed to fetch schedule data');
      }
      const data = await response.json();
      setScheduleData(data);
    } catch (error) {
      console.error('Error fetching schedule data:', error);
      setScheduleData({ events: [], tickets: [], availability: [] });
    } finally {
      setLoading(false);
    }
  };

  const getDayStatus = (date: Date) => {
    if (!scheduleData) return 'unknown';
    
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayOfWeek = date.getDay();
    
    // Check if there are any events or tickets on this day
    const hasEvents = scheduleData.events.some(event => 
      event.startDate === dateStr
    );
    
    const hasTickets = scheduleData.tickets.some(ticket => 
      ticket.scheduledStartTime && format(new Date(ticket.scheduledStartTime), 'yyyy-MM-dd') === dateStr
    );
    
    // Check availability configuration
    const availabilityConfig = scheduleData.availability.find(config => 
      config.dayOfWeek === dayOfWeek
    );
    
    if (hasEvents || hasTickets) {
      return 'busy';
    } else if (availabilityConfig?.isAvailable) {
      return 'available';
    } else if (availabilityConfig?.isAvailable === false) {
      return 'unavailable';
    } else {
      return 'unknown';
    }
  };

  const getDayEvents = (date: Date) => {
    if (!scheduleData) return [];
    
    const dateStr = format(date, 'yyyy-MM-dd');
    const events = scheduleData.events.filter(event => 
      event.startDate === dateStr
    );
    
    const tickets = scheduleData.tickets.filter(ticket => 
      ticket.scheduledStartTime && format(new Date(ticket.scheduledStartTime), 'yyyy-MM-dd') === dateStr
    );
    
    return [...events, ...tickets.map(ticket => ({
      id: ticket.id,
      title: ticket.title || `Ticket ${ticket.ticketNumber}`,
      startDate: format(new Date(ticket.scheduledStartTime), 'yyyy-MM-dd'),
      startTime: format(new Date(ticket.scheduledStartTime), 'HH:mm:ss'),
      endDate: ticket.scheduledEndTime ? format(new Date(ticket.scheduledEndTime), 'yyyy-MM-dd') : format(new Date(ticket.scheduledStartTime), 'yyyy-MM-dd'),
      endTime: ticket.scheduledEndTime ? format(new Date(ticket.scheduledEndTime), 'HH:mm:ss') : null,
      isAllDay: false,
      type: 'ticket'
    }))];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 border-green-200 dark:border-green-700';
      case 'busy':
        return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 border-red-200 dark:border-red-700';
      case 'unavailable':
        return 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-600';
      default:
        return 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available':
        return '✓';
      case 'busy':
        return '●';
      case 'unavailable':
        return '✕';
      default:
        return '';
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1));
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(selectedDate && isSameDay(selectedDate, date) ? null : date);
    if (onDateSelect) {
      onDateSelect(date);
    }
  };

  const defaultTrigger = (
    <Button variant="outline" size="sm">
      <Calendar className="w-4 h-4 mr-2" />
      Show Calendar
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            {technicianName} - Calendar Availability
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Calendar Navigation */}
          <div className="flex items-center justify-between">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigateMonth('prev')}
              disabled={loading}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            
            <h3 className="text-lg font-semibold">
              {format(currentDate, 'MMMM yyyy')}
            </h3>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigateMonth('next')}
              disabled={loading}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-green-500 rounded"></span>
              <span>Available</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-red-500 rounded"></span>
              <span>Busy</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-gray-400 rounded"></span>
              <span>Unavailable</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-blue-500 rounded"></span>
              <span>Today</span>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="relative">
            {loading && (
              <div className="absolute inset-0 bg-white/50 dark:bg-gray-900/50 flex items-center justify-center z-10">
                <div className="text-sm">Loading calendar...</div>
              </div>
            )}
            
            <div className="grid grid-cols-7 gap-1">
              {/* Day Headers */}
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="p-2 text-center text-sm font-medium text-gray-500 dark:text-gray-400">
                  {day}
                </div>
              ))}
              
              {/* Calendar Days */}
              {calendarDays.map(date => {
                const status = getDayStatus(date);
                const dayEvents = getDayEvents(date);
                const isCurrentMonth = isSameMonth(date, currentDate);
                const isTodayDate = isToday(date);
                const isSelected = selectedDate && isSameDay(selectedDate, date);
                
                return (
                  <div
                    key={date.toISOString()}
                    className={`
                      relative min-h-[80px] p-1 border cursor-pointer transition-all
                      ${getStatusColor(status)}
                      ${!isCurrentMonth ? 'opacity-40' : ''}
                      ${isTodayDate ? 'ring-2 ring-blue-500 ring-offset-1' : ''}
                      ${isSelected ? 'ring-2 ring-purple-500 ring-offset-1' : ''}
                      hover:ring-2 hover:ring-blue-300 hover:ring-offset-1
                    `}
                    onClick={() => handleDateClick(date)}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-sm font-medium ${isTodayDate ? 'font-bold' : ''}`}>
                        {format(date, 'd')}
                      </span>
                      {status !== 'unknown' && (
                        <span className="text-xs">
                          {getStatusIcon(status)}
                        </span>
                      )}
                    </div>
                    
                    {/* Events */}
                    <div className="space-y-1">
                      {dayEvents.slice(0, 2).map((event, index) => (
                        <div 
                          key={`${event.id}-${index}`}
                          className="text-xs p-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded truncate"
                          title={event.title}
                        >
                          <div className="flex items-center gap-1">
                            <Clock className="w-2 h-2" />
                            <span className="truncate">{event.title}</span>
                          </div>
                        </div>
                      ))}
                      {dayEvents.length > 2 && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          +{dayEvents.length - 2} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected Date Details */}
          {selectedDate && (
            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {format(selectedDate, 'EEEE, MMMM d, yyyy')}
              </h4>
              
              {getDayEvents(selectedDate).length > 0 ? (
                <div className="space-y-2">
                  {getDayEvents(selectedDate).map((event, index) => (
                    <div key={`${event.id}-${index}`} className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-blue-500" />
                      <span className="font-medium">{event.title}</span>
                      {event.startTime && (
                        <span className="text-gray-500 dark:text-gray-400">
                          {event.startTime}
                          {event.endTime && ` - ${event.endTime}`}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {getDayStatus(selectedDate) === 'available' 
                    ? 'Available for scheduling' 
                    : getDayStatus(selectedDate) === 'unavailable'
                    ? 'Not available'
                    : 'No scheduled events'
                  }
                </p>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}