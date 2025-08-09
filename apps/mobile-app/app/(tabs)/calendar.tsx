import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../src/contexts/AuthContext";
import { apiRequest } from "../../src/services/api";
import type { CalendarEvent } from "../../src/types";

interface TimeSlot {
  start: string;
  end: string;
  label: string;
}

export default function CalendarScreen() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [calendarView, setCalendarView] = useState<"month" | "day">("month");
  const [showEventModal, setShowEventModal] = useState(false);
  const [showTimeSlotBooking, setShowTimeSlotBooking] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(
    null,
  );
  const [selectedDuration, setSelectedDuration] = useState(1);
  const [bookingDate, setBookingDate] = useState<Date | null>(null);
  const [bookingForm, setBookingForm] = useState({
    title: "",
    description: "",
    location: "",
  });

  // Fetch calendar events
  const {
    data: calendarEvents = [],
    isLoading: eventsLoading,
    refetch: refetchEvents,
  } = useQuery<CalendarEvent[]>({
    queryKey: ["/api/calendar/events"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/calendar/events");
      return (await response.json()) as CalendarEvent[];
    },
  });

  // Create event mutation
  const createEventMutation = useMutation({
    mutationFn: async (eventData: any) => {
      const response = await apiRequest(
        "POST",
        "/api/calendar/events",
        eventData,
      );
      if (!response.ok) {
        throw new Error("Failed to create event");
      }
      return response.json();
    },
    onSuccess: () => {
      refetchEvents();
      setShowEventModal(false);
      setShowTimeSlotBooking(false);
      setBookingForm({ title: "", description: "", location: "" });
      setSelectedTimeSlot(null);
    },
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetchEvents();
    setRefreshing(false);
  };

  // Format time for display
  const formatTime = (time: string) => {
    const [hour, minute] = time.split(":").map(Number);
    const period = hour >= 12 ? "PM" : "AM";
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minute.toString().padStart(2, "0")} ${period}`;
  };

  // Generate time slots for booking
  const generateTimeSlots = (): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    const durationHours = selectedDuration;
    const durationMinutes = durationHours * 60;

    // Generate slots every 30 minutes from 8 AM to 6 PM
    for (let hour = 8; hour < 18; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const startHour = hour;
        const startMinute = minute;
        const startTime = `${startHour.toString().padStart(2, "0")}:${startMinute.toString().padStart(2, "0")}`;

        // Calculate end time based on duration
        const endTotalMinutes = startHour * 60 + startMinute + durationMinutes;
        const endHour = Math.floor(endTotalMinutes / 60);
        const endMinute = endTotalMinutes % 60;

        // Don't show slots that would end after 6 PM (18:00)
        if (endHour > 18 || (endHour === 18 && endMinute > 0)) {
          continue;
        }

        const endTime = `${endHour.toString().padStart(2, "0")}:${endMinute.toString().padStart(2, "0")}`;

        slots.push({
          start: startTime,
          end: endTime,
          label: `${formatTime(startTime)} - ${formatTime(endTime)}`,
        });
      }
    }
    return slots;
  };

  // Get events for a specific date
  const getEventsForDate = (date: Date) => {
    const dateString = date.toISOString().split("T")[0];
    return calendarEvents.filter((event: CalendarEvent) => {
      if (event.eventType === "availability") {
        return false;
      }
      const eventStartDate = event.startDate.split("T")[0];
      const eventEndDate = event.endDate.split("T")[0];
      return dateString >= eventStartDate && dateString <= eventEndDate;
    });
  };

  // Check if a time slot is available (no conflicting events)
  const isTimeSlotAvailable = (startTime: string, endTime: string) => {
    if (!bookingDate) return true;

    const dayEvents = getEventsForDate(bookingDate);

    for (const event of dayEvents) {
      if (event.startTime && event.endTime) {
        // Check for time overlap
        if (startTime < event.endTime && endTime > event.startTime) {
          return false;
        }
      }
    }

    return true;
  };

  // Generate calendar grid for month view
  const generateCalendarGrid = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days = [];
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      days.push(date);
    }

    return days;
  };

  const calendarDays = generateCalendarGrid();
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const handleDatePress = (date: Date) => {
    setSelectedDate(date);
    setCalendarView("day");
  };

  const handleCreateEvent = () => {
    setBookingDate(selectedDate || new Date());
    setShowTimeSlotBooking(true);
  };

  const handleTimeSlotSelect = (slot: TimeSlot) => {
    setSelectedTimeSlot(slot);
    setShowEventModal(true);
    setShowTimeSlotBooking(false);
  };

  const handleEventSubmit = () => {
    if (!bookingForm.title.trim() || !selectedTimeSlot || !bookingDate) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }

    const eventData = {
      title: bookingForm.title,
      description: bookingForm.description,
      eventType: "work_assignment",
      startDate: bookingDate.toISOString().split("T")[0],
      endDate: bookingDate.toISOString().split("T")[0],
      startTime: selectedTimeSlot.start,
      endTime: selectedTimeSlot.end,
      isAllDay: false,
      priority: "medium",
      status: "confirmed",
      color: "#3b82f6",
      location: bookingForm.location,
      isAvailability: false,
      isRecurring: false,
      syncedToGoogle: false,
    };

    createEventMutation.mutate(eventData);
  };

  const getEventTypeColor = (eventType: string) => {
    switch (eventType) {
      case "availability":
        return "#10b981";
      case "work_assignment":
        return "#3b82f6";
      case "meeting":
        return "#f59e0b";
      case "maintenance":
        return "#ef4444";
      case "personal":
        return "#8b5cf6";
      default:
        return "#94a3b8";
    }
  };

  const hasEventsOnDate = (date: Date) => {
    return getEventsForDate(date).length > 0;
  };

  if (eventsLoading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={["#1e293b", "#7c3aed", "#1e293b"]}
          style={styles.gradient}
        >
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#06b6d4" />
            <Text style={styles.loadingText}>Loading calendar...</Text>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={["#1e293b", "#7c3aed", "#1e293b"]}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => {
                if (calendarView === "day") {
                  setCalendarView("month");
                  setSelectedDate(null);
                } else {
                  const prevMonth = new Date(currentDate);
                  prevMonth.setMonth(currentDate.getMonth() - 1);
                  setCurrentDate(prevMonth);
                }
              }}
            >
              <Ionicons name="chevron-back" size={20} color="#ffffff" />
            </TouchableOpacity>

            <View style={styles.headerTitle}>
              <Text style={styles.headerTitleText}>
                {calendarView === "month"
                  ? `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`
                  : selectedDate?.toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
              </Text>
              <Text style={styles.headerSubtitle}>
                {calendarView === "month" ? "Monthly View" : "Daily View"}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.forwardButton}
              onPress={() => {
                if (calendarView === "day") {
                  handleCreateEvent();
                } else {
                  const nextMonth = new Date(currentDate);
                  nextMonth.setMonth(currentDate.getMonth() + 1);
                  setCurrentDate(nextMonth);
                }
              }}
            >
              <Ionicons
                name={calendarView === "day" ? "add" : "chevron-forward"}
                size={20}
                color="#ffffff"
              />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          style={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#06b6d4"
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {calendarView === "month" ? (
            <>
              {/* Calendar Grid */}
              <View style={styles.calendarContainer}>
                {/* Day Headers */}
                <View style={styles.dayHeadersRow}>
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                    (day) => (
                      <View key={day} style={styles.dayHeader}>
                        <Text style={styles.dayHeaderText}>{day}</Text>
                      </View>
                    ),
                  )}
                </View>

                {/* Calendar Days */}
                <View style={styles.calendarGrid}>
                  {calendarDays.map((date, index) => {
                    const isCurrentMonth =
                      date.getMonth() === currentDate.getMonth();
                    const isToday =
                      date.toDateString() === new Date().toDateString();
                    const hasEvents = hasEventsOnDate(date);

                    return (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.calendarDay,
                          !isCurrentMonth && styles.otherMonthDay,
                          isToday && styles.todayDay,
                        ]}
                        onPress={() => handleDatePress(date)}
                      >
                        <Text
                          style={[
                            styles.calendarDayText,
                            !isCurrentMonth && styles.otherMonthDayText,
                            isToday && styles.todayDayText,
                          ]}
                        >
                          {date.getDate()}
                        </Text>
                        {hasEvents && <View style={styles.eventIndicator} />}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Upcoming Events */}
              <View style={styles.upcomingEventsContainer}>
                <Text style={styles.sectionTitle}>Upcoming Events</Text>
                {calendarEvents
                  .filter((event) => new Date(event.startDate) >= new Date())
                  .slice(0, 5)
                  .map((event) => (
                    <View key={event.id} style={styles.eventCard}>
                      <View
                        style={[
                          styles.eventColorBar,
                          {
                            backgroundColor: getEventTypeColor(event.eventType),
                          },
                        ]}
                      />
                      <View style={styles.eventCardContent}>
                        <Text style={styles.eventTitle}>{event.title}</Text>
                        <Text style={styles.eventDate}>
                          {new Date(event.startDate).toLocaleDateString()}
                          {event.startTime &&
                            ` at ${formatTime(event.startTime)}`}
                        </Text>
                        {event.location && (
                          <View style={styles.eventLocation}>
                            <Ionicons
                              name="location"
                              size={12}
                              color="#64748b"
                            />
                            <Text style={styles.eventLocationText}>
                              {event.location}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  ))}
              </View>
            </>
          ) : (
            <>
              {/* Day View Events */}
              <View style={styles.dayViewContainer}>
                {selectedDate &&
                  getEventsForDate(selectedDate).map((event) => (
                    <View key={event.id} style={styles.dayEventCard}>
                      <View
                        style={[
                          styles.eventColorBar,
                          {
                            backgroundColor: getEventTypeColor(event.eventType),
                          },
                        ]}
                      />
                      <View style={styles.eventCardContent}>
                        <Text style={styles.eventTitle}>{event.title}</Text>
                        <Text style={styles.eventTime}>
                          {event.startTime && event.endTime
                            ? `${formatTime(event.startTime)} - ${formatTime(event.endTime)}`
                            : "All Day"}
                        </Text>
                        {event.description && (
                          <Text style={styles.eventDescription}>
                            {event.description}
                          </Text>
                        )}
                        {event.location && (
                          <View style={styles.eventLocation}>
                            <Ionicons
                              name="location"
                              size={12}
                              color="#64748b"
                            />
                            <Text style={styles.eventLocationText}>
                              {event.location}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  ))}

                {selectedDate &&
                  getEventsForDate(selectedDate).length === 0 && (
                    <View style={styles.noEventsContainer}>
                      <Ionicons
                        name="calendar-outline"
                        size={48}
                        color="#64748b"
                      />
                      <Text style={styles.noEventsTitle}>No Events</Text>
                      <Text style={styles.noEventsText}>
                        No events scheduled for this day
                      </Text>
                      <TouchableOpacity
                        style={styles.createEventButton}
                        onPress={handleCreateEvent}
                      >
                        <Text style={styles.createEventButtonText}>
                          Create Event
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
              </View>
            </>
          )}
        </ScrollView>

        {/* Time Slot Booking Modal */}
        <Modal
          visible={showTimeSlotBooking}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowTimeSlotBooking(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Time Slot</Text>
                <TouchableOpacity onPress={() => setShowTimeSlotBooking(false)}>
                  <Ionicons name="close" size={24} color="#ffffff" />
                </TouchableOpacity>
              </View>

              <View style={styles.durationSelector}>
                <Text style={styles.durationLabel}>Duration (hours):</Text>
                <View style={styles.durationButtons}>
                  {[1, 2, 3, 4].map((hours) => (
                    <TouchableOpacity
                      key={hours}
                      style={[
                        styles.durationButton,
                        selectedDuration === hours &&
                          styles.activeDurationButton,
                      ]}
                      onPress={() => setSelectedDuration(hours)}
                    >
                      <Text
                        style={[
                          styles.durationButtonText,
                          selectedDuration === hours &&
                            styles.activeDurationButtonText,
                        ]}
                      >
                        {hours}h
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <ScrollView style={styles.timeSlotsContainer}>
                {generateTimeSlots().map((slot, index) => {
                  const available = isTimeSlotAvailable(slot.start, slot.end);
                  return (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.timeSlot,
                        !available && styles.unavailableTimeSlot,
                      ]}
                      onPress={() => available && handleTimeSlotSelect(slot)}
                      disabled={!available}
                    >
                      <Text
                        style={[
                          styles.timeSlotText,
                          !available && styles.unavailableTimeSlotText,
                        ]}
                      >
                        {slot.label}
                      </Text>
                      {!available && (
                        <Text style={styles.unavailableLabel}>Unavailable</Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Event Creation Modal */}
        <Modal
          visible={showEventModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowEventModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Create Event</Text>
                <TouchableOpacity onPress={() => setShowEventModal(false)}>
                  <Ionicons name="close" size={24} color="#ffffff" />
                </TouchableOpacity>
              </View>

              {selectedTimeSlot && (
                <View style={styles.selectedTimeContainer}>
                  <Text style={styles.selectedTimeLabel}>Selected Time:</Text>
                  <Text style={styles.selectedTimeText}>
                    {selectedTimeSlot.label}
                  </Text>
                </View>
              )}

              <ScrollView style={styles.formContainer}>
                <View style={styles.formField}>
                  <Text style={styles.fieldLabel}>Title *</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Event title"
                    placeholderTextColor="#94a3b8"
                    value={bookingForm.title}
                    onChangeText={(text) =>
                      setBookingForm({ ...bookingForm, title: text })
                    }
                  />
                </View>

                <View style={styles.formField}>
                  <Text style={styles.fieldLabel}>Description</Text>
                  <TextInput
                    style={[styles.textInput, styles.textArea]}
                    placeholder="Event description"
                    placeholderTextColor="#94a3b8"
                    value={bookingForm.description}
                    onChangeText={(text) =>
                      setBookingForm({ ...bookingForm, description: text })
                    }
                    multiline
                    numberOfLines={3}
                  />
                </View>

                <View style={styles.formField}>
                  <Text style={styles.fieldLabel}>Location</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Event location"
                    placeholderTextColor="#94a3b8"
                    value={bookingForm.location}
                    onChangeText={(text) =>
                      setBookingForm({ ...bookingForm, location: text })
                    }
                  />
                </View>
              </ScrollView>

              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setShowEventModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={handleEventSubmit}
                  disabled={createEventMutation.isPending}
                >
                  <LinearGradient
                    colors={["#06b6d4", "#3b82f6"]}
                    style={styles.submitButtonGradient}
                  >
                    {createEventMutation.isPending ? (
                      <ActivityIndicator color="#ffffff" size="small" />
                    ) : (
                      <Text style={styles.submitButtonText}>Create Event</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#1e293b",
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#94a3b8",
    fontSize: 16,
    marginTop: 16,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    padding: 8,
    borderRadius: 8,
  },
  forwardButton: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    padding: 8,
    borderRadius: 8,
  },
  headerTitle: {
    alignItems: "center",
    flex: 1,
  },
  headerTitleText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffffff",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#94a3b8",
    marginTop: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  calendarContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  dayHeadersRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  dayHeader: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
  },
  dayHeaderText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#94a3b8",
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  calendarDay: {
    width: "14.28571%",
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    marginBottom: 4,
    position: "relative",
  },
  otherMonthDay: {
    opacity: 0.3,
  },
  todayDay: {
    backgroundColor: "#3b82f6",
  },
  calendarDayText: {
    fontSize: 14,
    color: "#ffffff",
    fontWeight: "500",
  },
  otherMonthDayText: {
    color: "#64748b",
  },
  todayDayText: {
    color: "#ffffff",
    fontWeight: "bold",
  },
  eventIndicator: {
    position: "absolute",
    bottom: 2,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#06b6d4",
  },
  upcomingEventsContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 16,
  },
  eventCard: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 8,
    marginBottom: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  eventColorBar: {
    width: 4,
  },
  eventCardContent: {
    flex: 1,
    padding: 12,
  },
  eventTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#ffffff",
    marginBottom: 4,
  },
  eventDate: {
    fontSize: 12,
    color: "#94a3b8",
    marginBottom: 4,
  },
  eventTime: {
    fontSize: 12,
    color: "#06b6d4",
    marginBottom: 4,
  },
  eventDescription: {
    fontSize: 12,
    color: "#94a3b8",
    marginBottom: 4,
  },
  eventLocation: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  eventLocationText: {
    fontSize: 12,
    color: "#64748b",
  },
  dayViewContainer: {
    marginBottom: 24,
  },
  dayEventCard: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 8,
    marginBottom: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  noEventsContainer: {
    alignItems: "center",
    paddingVertical: 60,
  },
  noEventsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffffff",
    marginTop: 16,
    marginBottom: 8,
  },
  noEventsText: {
    fontSize: 14,
    color: "#94a3b8",
    textAlign: "center",
    marginBottom: 24,
  },
  createEventButton: {
    backgroundColor: "#3b82f6",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createEventButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "#1e293b",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
    minHeight: "50%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffffff",
  },
  durationSelector: {
    padding: 20,
  },
  durationLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#ffffff",
    marginBottom: 12,
  },
  durationButtons: {
    flexDirection: "row",
    gap: 8,
  },
  durationButton: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  activeDurationButton: {
    backgroundColor: "#3b82f6",
    borderColor: "#3b82f6",
  },
  durationButtonText: {
    color: "#94a3b8",
    fontSize: 14,
    fontWeight: "500",
  },
  activeDurationButtonText: {
    color: "#ffffff",
  },
  timeSlotsContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  timeSlot: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  unavailableTimeSlot: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderColor: "rgba(239, 68, 68, 0.3)",
  },
  timeSlotText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "500",
  },
  unavailableTimeSlotText: {
    color: "#fca5a5",
  },
  unavailableLabel: {
    color: "#ef4444",
    fontSize: 12,
    marginTop: 4,
  },
  selectedTimeContainer: {
    padding: 20,
    backgroundColor: "rgba(59, 130, 246, 0.1)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  selectedTimeLabel: {
    fontSize: 12,
    color: "#94a3b8",
    marginBottom: 4,
  },
  selectedTimeText: {
    fontSize: 16,
    color: "#06b6d4",
    fontWeight: "600",
  },
  formContainer: {
    flex: 1,
    padding: 20,
  },
  formField: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#ffffff",
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: "#ffffff",
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  modalFooter: {
    flexDirection: "row",
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  cancelButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  submitButton: {
    flex: 1,
    borderRadius: 8,
    overflow: "hidden",
  },
  submitButtonGradient: {
    paddingVertical: 12,
    alignItems: "center",
  },
  submitButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
});
