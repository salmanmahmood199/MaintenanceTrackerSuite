import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/contexts/AuthContext';
import { apiRequest } from '../../src/services/api';

const { width } = Dimensions.get('window');
const dayWidth = (width - 40) / 7;

export default function CalendarScreen() {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const { data: events = [] } = useQuery({
    queryKey: ['/api/calendar/events'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/calendar/events');
      return response.json();
    },
    enabled: !!user,
  });

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    // Add all days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const getEventsForDate = (date: Date) => {
    if (!date) return [];
    const dateString = date.toISOString().split('T')[0];
    return events.filter((event: any) => {
      const eventDate = new Date(event.startDate).toISOString().split('T')[0];
      return eventDate === dateString;
    });
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const days = getDaysInMonth(currentDate);
  const today = new Date();

  const getEventTypeColor = (eventType: string) => {
    switch (eventType) {
      case 'work_assignment': return '#3b82f6';
      case 'meeting': return '#8b5cf6';
      case 'maintenance': return '#f59e0b';
      case 'personal': return '#64748b';
      default: return '#10b981';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#1e293b', '#7c3aed', '#1e293b']} style={styles.gradient}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.monthNavigation}>
            <TouchableOpacity onPress={() => navigateMonth('prev')}>
              <Ionicons name="chevron-back" size={24} color="#ffffff" />
            </TouchableOpacity>
            <Text style={styles.monthYear}>
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </Text>
            <TouchableOpacity onPress={() => navigateMonth('next')}>
              <Ionicons name="chevron-forward" size={24} color="#ffffff" />
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.todayButton} onPress={() => setCurrentDate(new Date())}>
            <Text style={styles.todayButtonText}>Today</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {/* Calendar Grid */}
          <View style={styles.calendarContainer}>
            {/* Day headers */}
            <View style={styles.dayHeaders}>
              {dayNames.map((day) => (
                <View key={day} style={styles.dayHeader}>
                  <Text style={styles.dayHeaderText}>{day}</Text>
                </View>
              ))}
            </View>

            {/* Calendar days */}
            <View style={styles.calendarGrid}>
              {days.map((day, index) => {
                if (!day) {
                  return <View key={`empty-${index}`} style={styles.emptyDay} />;
                }

                const isToday = day.toDateString() === today.toDateString();
                const isSelected = selectedDate && day.toDateString() === selectedDate.toDateString();
                const dayEvents = getEventsForDate(day);

                return (
                  <TouchableOpacity
                    key={day.toISOString()}
                    style={[
                      styles.day,
                      isToday && styles.today,
                      isSelected && styles.selectedDay,
                    ]}
                    onPress={() => setSelectedDate(day)}
                  >
                    <Text style={[
                      styles.dayText,
                      isToday && styles.todayText,
                      isSelected && styles.selectedDayText,
                    ]}>
                      {day.getDate()}
                    </Text>
                    <View style={styles.eventsContainer}>
                      {dayEvents.slice(0, 3).map((event: any, eventIndex) => (
                        <View
                          key={event.id}
                          style={[
                            styles.eventDot,
                            { backgroundColor: getEventTypeColor(event.eventType) }
                          ]}
                        />
                      ))}
                      {dayEvents.length > 3 && (
                        <Text style={styles.moreEvents}>+{dayEvents.length - 3}</Text>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Selected Date Events */}
          {selectedDate && (
            <View style={styles.selectedDateSection}>
              <Text style={styles.selectedDateTitle}>
                Events for {selectedDate.toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </Text>
              {getEventsForDate(selectedDate).length === 0 ? (
                <View style={styles.noEventsContainer}>
                  <Ionicons name="calendar-outline" size={48} color="#64748b" />
                  <Text style={styles.noEventsText}>No events scheduled</Text>
                </View>
              ) : (
                <View style={styles.eventsList}>
                  {getEventsForDate(selectedDate).map((event: any) => (
                    <View key={event.id} style={styles.eventCard}>
                      <View style={styles.eventHeader}>
                        <View
                          style={[
                            styles.eventTypeIndicator,
                            { backgroundColor: getEventTypeColor(event.eventType) }
                          ]}
                        />
                        <View style={styles.eventInfo}>
                          <Text style={styles.eventTitle}>{event.title}</Text>
                          <Text style={styles.eventType}>{event.eventType.replace('_', ' ')}</Text>
                        </View>
                        <Text style={styles.eventTime}>
                          {event.startTime && event.endTime 
                            ? `${event.startTime} - ${event.endTime}`
                            : 'All day'}
                        </Text>
                      </View>
                      {event.description && (
                        <Text style={styles.eventDescription}>{event.description}</Text>
                      )}
                      {event.location && (
                        <View style={styles.eventLocationContainer}>
                          <Ionicons name="location-outline" size={16} color="#64748b" />
                          <Text style={styles.eventLocation}>{event.location}</Text>
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* Upcoming Events */}
          <View style={styles.upcomingSection}>
            <Text style={styles.sectionTitle}>Upcoming Events</Text>
            {events.slice(0, 5).map((event: any) => (
              <View key={event.id} style={styles.upcomingEventCard}>
                <View style={styles.upcomingEventDate}>
                  <Text style={styles.upcomingEventMonth}>
                    {new Date(event.startDate).toLocaleDateString('en-US', { month: 'short' })}
                  </Text>
                  <Text style={styles.upcomingEventDay}>
                    {new Date(event.startDate).getDate()}
                  </Text>
                </View>
                <View style={styles.upcomingEventInfo}>
                  <Text style={styles.upcomingEventTitle}>{event.title}</Text>
                  <Text style={styles.upcomingEventTime}>
                    {event.startTime || 'All day'}
                  </Text>
                  <Text style={styles.upcomingEventType}>
                    {event.eventType.replace('_', ' ')}
                  </Text>
                </View>
                <View
                  style={[
                    styles.upcomingEventIndicator,
                    { backgroundColor: getEventTypeColor(event.eventType) }
                  ]}
                />
              </View>
            ))}
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  monthNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  monthYear: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  todayButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  todayButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  calendarContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  dayHeaders: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  dayHeader: {
    width: dayWidth,
    alignItems: 'center',
    paddingVertical: 8,
  },
  dayHeaderText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94a3b8',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  emptyDay: {
    width: dayWidth,
    height: 60,
  },
  day: {
    width: dayWidth,
    height: 60,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderRadius: 8,
  },
  today: {
    backgroundColor: '#3b82f6',
  },
  selectedDay: {
    backgroundColor: '#8b5cf6',
  },
  dayText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  todayText: {
    color: '#ffffff',
  },
  selectedDayText: {
    color: '#ffffff',
  },
  eventsContainer: {
    flexDirection: 'row',
    gap: 2,
    alignItems: 'center',
  },
  eventDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  moreEvents: {
    fontSize: 8,
    color: '#64748b',
  },
  selectedDateSection: {
    marginBottom: 20,
  },
  selectedDateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
  },
  noEventsContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noEventsText: {
    fontSize: 16,
    color: '#64748b',
    marginTop: 12,
  },
  eventsList: {
    gap: 12,
  },
  eventCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  eventTypeIndicator: {
    width: 4,
    height: 24,
    borderRadius: 2,
    marginRight: 12,
  },
  eventInfo: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  eventType: {
    fontSize: 12,
    color: '#94a3b8',
    textTransform: 'capitalize',
  },
  eventTime: {
    fontSize: 14,
    color: '#06b6d4',
    fontWeight: '500',
  },
  eventDescription: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 8,
  },
  eventLocationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventLocation: {
    fontSize: 12,
    color: '#64748b',
    marginLeft: 6,
  },
  upcomingSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
  },
  upcomingEventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  upcomingEventDate: {
    alignItems: 'center',
    marginRight: 16,
  },
  upcomingEventMonth: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
  },
  upcomingEventDay: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  upcomingEventInfo: {
    flex: 1,
  },
  upcomingEventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  upcomingEventTime: {
    fontSize: 12,
    color: '#06b6d4',
    marginBottom: 2,
  },
  upcomingEventType: {
    fontSize: 12,
    color: '#94a3b8',
    textTransform: 'capitalize',
  },
  upcomingEventIndicator: {
    width: 4,
    height: 40,
    borderRadius: 2,
  },
});