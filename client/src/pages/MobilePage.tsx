import React, { useState, useEffect } from "react";
import axios from "axios";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Smartphone,
  Calendar,
  Settings,
  Bell,
  LogOut,
  CheckCircle,
  Ticket as TicketIcon,
  AlertCircle,
  TrendingUp,
  Plus,
  Clock,
  User as UserIcon,
  MapPin,
  Filter,
  Search,
  MessageSquare,
  Image,
  Video,
  FileText,
  Phone,
  Mail,
  Users,
  Building2,
  Wrench,
  Edit,
  Eye,
  ArrowLeft,
  ChevronDown,
  MoreVertical,
  Home,
  DollarSign,
  Star,
  Camera,
  List,
  X,
  UserCheck,
  XCircle,
  CheckSquare,
  Building,
  Trash2,
  Loader2,
} from "lucide-react";
import { CreateTicketModal } from "@/components/create-ticket-modal";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { TicketActionModal } from "@/components/ticket-action-modal";
import { ConfirmCompletionModal } from "@/components/confirm-completion-modal";
import { MarketplaceBidsModal } from "@/components/marketplace-bids-modal";
import { EnhancedInvoiceCreator } from "@/components/enhanced-invoice-creator";
import { TicketComments } from "@/components/ticket-comments";
import { ProgressTrackerEmbedded } from "@/components/progress-tracker";
import { WorkOrdersHistory } from "@/components/work-orders-history";
import { CreateEventModal } from "@/components/create-event-modal";
import AvailabilityConfigModal from "@/components/availability-config-modal";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertTicketSchema } from "@shared/schema";
import { format } from "date-fns";

import type {
  Ticket,
  InsertTicket,
  Organization,
  MaintenanceVendor,
  User,
  Location,
} from "@shared/schema";
import taskscoutLogo from "@assets/Logo_1753808482955.png";

// Mobile Create Ticket Form Component
const MobileCreateTicketForm = ({
  onClose,
  onSuccess,
  user,
}: {
  onClose: () => void;
  onSuccess: () => void;
  user: any;
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const { toast } = useToast();

  // Fetch user's assigned locations
  const { data: userLocations = [] } = useQuery<Location[]>({
    queryKey: ["/api/users", user?.id, "locations"],
    queryFn: async () => {
      const response = await apiRequest(
        "GET",
        `/api/users/${user?.id}/locations`,
      );
      return (await response.json()) as Location[];
    },
    enabled: !!user?.id,
  });

  const form = useForm<InsertTicket>({
    resolver: zodResolver(
      insertTicketSchema.omit({ reporterId: true, organizationId: true }),
    ),
    defaultValues: {
      title: "",
      description: "",
      priority: "medium" as const,
    },
  });

  const handleSubmit = async (data: any) => {
    // Validate location selection for users with location assignments
    if (userLocations.length > 0 && !data.locationId) {
      form.setError("locationId", {
        type: "manual",
        message: "Please select a location for this ticket",
      });
      return;
    }

    if (images.length === 0) {
      toast({
        title: "Images Required",
        description: "Please upload at least one image or video.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("title", data.title);
      formData.append("description", data.description);
      formData.append("priority", data.priority);
      if (data.locationId) {
        formData.append("locationId", data.locationId.toString());
      }

      images.forEach((image) => {
        formData.append("images", image);
      });

      const response = await fetch("/api/tickets", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Ticket created successfully!",
        });
        onSuccess();
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.message || "Failed to create ticket",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error creating ticket:", error);
      toast({
        title: "Error",
        description: "Failed to create ticket. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/20 bg-gradient-to-r from-blue-600 to-purple-600 text-white flex-shrink-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="p-2 text-white hover:bg-white/10"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="text-center">
          <h2 className="text-lg font-semibold text-white">Create Ticket</h2>
          <p className="text-sm text-blue-100">New maintenance request</p>
        </div>
        <div className="w-10" /> {/* Spacer */}
      </div>

      {/* Form Content - Scrollable */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-6 pb-24"
            >
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">Title</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Brief description of the issue"
                        {...field}
                      />
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
                    <FormLabel className="text-foreground">
                      Description
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Detailed description of the maintenance issue..."
                        rows={4}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">
                      Priority Level
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">Low Priority</SelectItem>
                        <SelectItem value="medium">Medium Priority</SelectItem>
                        <SelectItem value="high">High Priority</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="locationId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">
                      Location <span className="text-red-500">*</span>
                    </FormLabel>
                    {userLocations.length > 0 ? (
                      <Select
                        onValueChange={(value) =>
                          field.onChange(parseInt(value))
                        }
                        value={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select location for this ticket" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {userLocations.map((location) => (
                            <SelectItem
                              key={location.id}
                              value={location.id.toString()}
                            >
                              {location.name}
                              {location.address && ` - ${location.address}`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="mt-2 p-3 bg-yellow-500/20 border border-yellow-400/30 rounded-md">
                        <p className="text-sm text-yellow-200">
                          No locations assigned to your account. Please contact
                          your administrator to assign locations before creating
                          tickets.
                        </p>
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div>
                <Label className="text-sm font-medium text-foreground">
                  Upload Images & Videos *
                </Label>
                <div className="mt-2">
                  <div className="border-2 border-dashed border-border rounded-lg p-6 text-center relative">
                    <div className="flex flex-col items-center justify-center">
                      <Camera className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-sm text-muted-foreground mb-2">
                        {images.length > 0
                          ? `${images.length} file(s) selected`
                          : "Tap to add photos or videos"}
                      </p>
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          multiple
                          accept="image/*,video/*"
                          onChange={(e) => {
                            const files = Array.from(e.target.files || []);
                            setImages((prev) => [...prev, ...files]);
                          }}
                          className="hidden"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="mt-2"
                          asChild
                        >
                          <span>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Files
                          </span>
                        </Button>
                      </label>
                    </div>
                  </div>
                  {images.length > 0 && (
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      {images.slice(0, 6).map((file, index) => (
                        <div
                          key={index}
                          className="relative aspect-square bg-muted rounded-lg flex items-center justify-center"
                        >
                          <div className="text-center">
                            <div className="text-xs text-muted-foreground mb-1">
                              {file.type.startsWith("video/") ? (
                                <Video className="h-6 w-6 mx-auto" />
                              ) : (
                                <Image className="h-6 w-6 mx-auto" />
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground truncate px-1">
                              {file.name.length > 12
                                ? `${file.name.substring(0, 12)}...`
                                : file.name}
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                            onClick={() =>
                              setImages((prev) =>
                                prev.filter((_, i) => i !== index),
                              )
                            }
                          >
                            ×
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </form>
          </Form>
        </div>
      </div>

      {/* Fixed Footer Buttons */}
      <div className="flex-shrink-0 p-4 border-t border-white/20 bg-gradient-to-r from-slate-900/90 to-purple-900/90 backdrop-blur-sm">
        <div className="flex justify-end space-x-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
            className="border-white/20 text-white hover:bg-white/10"
          >
            Cancel
          </Button>
          <Button
            onClick={form.handleSubmit(handleSubmit)}
            disabled={isSubmitting || images.length === 0}
            className="bg-gradient-to-r from-teal-500 to-blue-600 text-white hover:from-teal-600 hover:to-blue-700 border-0"
          >
            {isSubmitting ? (
              "Creating..."
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Create Ticket
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

const MobilePage = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [selectedOrganization, setSelectedOrganization] =
    useState<Organization | null>(null);
  const [selectedVendor, setSelectedVendor] =
    useState<MaintenanceVendor | null>(null);
  const [isCreateTicketOpen, setIsCreateTicketOpen] = useState(false);
  const [isTicketActionOpen, setIsTicketActionOpen] = useState(false);
  const [isConfirmCompletionOpen, setIsConfirmCompletionOpen] = useState(false);
  const [isMarketplaceBidsOpen, setIsMarketplaceBidsOpen] = useState(false);
  const [isTicketDetailsOpen, setIsTicketDetailsOpen] = useState(false);
  const [isWorkOrderOpen, setIsWorkOrderOpen] = useState(false);
  const [isInvoiceCreatorOpen, setIsInvoiceCreatorOpen] = useState(false);

  const [uploadedImages, setUploadedImages] = useState<
    Array<{ file: File; url: string }>
  >([]);
  const [uploadingImg, setUploadingImg] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [ticketAction, setTicketAction] = useState<"accept" | "reject" | null>(
    null,
  );
  const [currentView, setCurrentView] = useState<
    "dashboard" | "organization" | "vendor" | "calendar" | "marketplace"
  >("dashboard");
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date | null>(
    null,
  );
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedCalendarEvent, setSelectedCalendarEvent] = useState<any>(null);
  const [calendarView, setCalendarView] = useState<"month" | "day">("month");
  const [ticketDateFilter, setTicketDateFilter] = useState<
    "all" | "last30" | "last7" | "today"
  >("last30");
  const [selectedTicketForDetails, setSelectedTicketForDetails] =
    useState<Ticket | null>(null);

  // Fetch location details for selected ticket
  const { data: selectedTicketLocation } = useQuery<Location>({
    queryKey: ["/api/locations", selectedTicketForDetails?.locationId],
    queryFn: async () => {
      const response = await apiRequest(
        "GET",
        `/api/locations/${selectedTicketForDetails?.locationId}`,
      );
      return (await response.json()) as Location;
    },
    enabled: !!selectedTicketForDetails?.locationId,
  });
  const [isTicketDetailModalOpen, setIsTicketDetailModalOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(
    null,
  );
  const [parts, setParts] = useState<
    Array<{ name: string; customName?: string; quantity: number; cost: number }>
  >([{ name: "", quantity: 1, cost: 0 }]);
  const [otherCharges, setOtherCharges] = useState([
    { description: "", cost: 0 },
  ]);
  const [completionStatus, setCompletionStatus] = useState<
    "completed" | "return_needed"
  >("completed");
  const [timeIn, setTimeIn] = useState("");
  const [timeOut, setTimeOut] = useState("");
  const [isWorkOrderHistoryOpen, setIsWorkOrderHistoryOpen] = useState(false);
  const [selectedImageForViewer, setSelectedImageForViewer] = useState<
    string | null
  >(null);
  const [isCreateEventModalOpen, setIsCreateEventModalOpen] = useState(false);
  const [isAvailabilityConfigOpen, setIsAvailabilityConfigOpen] =
    useState(false);
  const [selectedCalendarDateForEvent, setSelectedCalendarDateForEvent] =
    useState<Date | null>(null);
  const [showTimeSlotBooking, setShowTimeSlotBooking] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<{
    start: string;
    end: string;
  } | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<number>(1); // Default 1 hour
  const [bookingDate, setBookingDate] = useState<Date | null>(null);
  const [bookingForm, setBookingForm] = useState({
    title: "",
    description: "",
    location: "",
  });

  // Location autocomplete state
  const [locationSuggestions, setLocationSuggestions] = useState<string[]>([]);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const [locationSearchLoading, setLocationSearchLoading] = useState(false);
  const [locationSearchTimeout, setLocationSearchTimeout] =
    useState<NodeJS.Timeout | null>(null);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (locationSearchTimeout) {
        clearTimeout(locationSearchTimeout);
      }
    };
  }, [locationSearchTimeout]);

  // Format time for display
  const formatTime = (time: string) => {
    const [hour, minute] = time.split(":").map(Number);
    const period = hour >= 12 ? "PM" : "AM";
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minute.toString().padStart(2, "0")} ${period}`;
  };

  // Generate time slots for booking
  const generateTimeSlots = () => {
    const slots = [];
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
    const dateString = format(date, "yyyy-MM-dd");
    return calendarEvents.filter((event: any) => {
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

  // Work order submission mutation
  const submitWorkOrderMutation = useMutation({
    mutationFn: async (workOrderData: any) => {
      if (!selectedTicket) {
        throw new Error("No ticket selected");
      }

      const formData = new FormData();

      // Prepare work order data
      const workOrder = {
        workDescription: workOrderData.workDescription || "Work completed",
        parts: workOrderData.parts || [],
        otherCharges: workOrderData.otherCharges || [],
        timeIn: workOrderData.timeIn || "",
        timeOut: workOrderData.timeOut || "",
        completionStatus: workOrderData.completionStatus || "completed",
        completionNotes:
          workOrderData.completionStatus === "return_needed"
            ? "Return visit needed"
            : "Work completed",
        managerName: "",
        managerSignature: "",
      };

      // Add work order data as JSON string
      formData.append("workOrder", JSON.stringify(workOrder));

      // Add images if any
      if (uploadedImages.length > 0) {
        uploadedImages.forEach((image) => {
          formData.append("images", image.file);
        });
      }

      // Send to the complete ticket endpoint which also creates a work order
      // For FormData, we don't set Content-Type header - let the browser set it with the correct boundary
      const response = await apiRequest(
        "POST",
        `/api/tickets/${selectedTicket.id}/complete`,
        formData,
      );
      return response;
    },
    onSuccess: () => {
      // Invalidate and refetch tickets to update the UI
      queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
      setIsWorkOrderOpen(false);
      setUploadedImages([]);
      setParts([{ name: "", quantity: 1, cost: 0 }]);
      setOtherCharges([{ description: "", cost: 0 }]);
      setTimeIn("");
      setTimeOut("");
      setCompletionStatus("completed");

      toast({
        title: "Success",
        description: "Work order submitted successfully",
        variant: "default",
      });
    },
    onError: (error: any) => {
      console.error("Error submitting work order:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit work order",
        variant: "destructive",
      });
    },
  });

  // Handle work order submission
  // Handle work order submission
  const handleWorkOrderSubmit = () => {
    if (!selectedTicket) {
      toast({
        title: "Error",
        description: "No ticket selected",
        variant: "destructive",
      });
      return;
    }

    // Validate required fields
    if (!timeIn || !timeOut) {
      toast({
        title: "Error",
        description: "Please provide both time in and time out",
        variant: "destructive",
      });
      return;
    }

    const workOrderData = {
      workDescription: "Work completed",
      parts: parts
        .filter(
          (part) =>
            (part.name === "custom"
              ? part.customName || ""
              : part.name
            ).trim() !== "",
        )
        .map((part) => ({
          ...part,
          name: part.name === "custom" ? part.customName || "" : part.name,
        })),
      otherCharges: otherCharges.filter(
        (charge) => charge.description.trim() !== "",
      ),
      timeIn,
      timeOut,
      completionStatus,
    };

    submitWorkOrderMutation.mutate(workOrderData);
  };

  // Calculate selling price from cost and markup
  const calculateSellingPrice = (
    cost: number,
    markupPercentage: number,
    roundToNinteyNine: boolean,
  ) => {
    const markup = cost * (markupPercentage / 100);
    let sellingPrice = cost + markup;

    if (roundToNinteyNine) {
      // Round to nearest .99 (e.g., 12.34 becomes 12.99)
      sellingPrice = Math.floor(sellingPrice) + 0.99;
    }

    return sellingPrice;
  };

  // Calculate total cost of all parts
  const calculatePartsTotal = (parts: any[]) => {
    return parts.reduce((total, part) => {
      const quantity = Number(part.quantity) || 0;
      const cost = Number(part.cost) || 0;
      return total + quantity * cost;
    }, 0);
  };

  // Calculate hours between time in and time out
  const calculateHours = (timeIn: string, timeOut: string) => {
    if (!timeIn || !timeOut) return 0;

    try {
      const [inHour, inMin] = timeIn.split(":").map(Number);
      const [outHour, outMin] = timeOut.split(":").map(Number);

      if (isNaN(inHour) || isNaN(inMin) || isNaN(outHour) || isNaN(outMin))
        return 0;

      const inMinutes = inHour * 60 + inMin;
      const outMinutes = outHour * 60 + outMin;

      if (outMinutes <= inMinutes) return 0;

      const totalMinutes = outMinutes - inMinutes;
      return Math.round((totalMinutes / 60) * 100) / 100;
    } catch (error) {
      return 0;
    }
  };

  // Fetch available parts for this vendor
  const { data: availableParts = [] } = useQuery({
    queryKey: [`/api/maintenance-vendors/${user?.maintenanceVendorId}/parts`],
    enabled: !!user?.maintenanceVendorId,
  });

  // Check if any work order has return_needed status for a ticket
  const hasReturnNeededWorkOrder = (ticket: Ticket, workOrders?: any[]) => {
    if (!workOrders) return false;
    return workOrders.some(
      (wo: any) => wo.completionStatus === "return_needed",
    );
  };

  // Queries for data
  const {
    data: tickets = [],
    isLoading: ticketsLoading,
    refetch: refetchTickets,
  } = useQuery<Ticket[]>({
    queryKey: ["/api/tickets"],
    enabled: !!user,
  });

  // Calendar events query
  const { data: calendarEvents = [], isLoading: calendarLoading } = useQuery<
    any[]
  >({
    queryKey: ["/api/calendar/events"],
    enabled: !!user && currentView === "calendar",
  });

  // Fetch work orders for all tickets to check return needed status
  const { data: allTicketsWorkOrders = {} } = useQuery({
    queryKey: ["/api/tickets/work-orders"],
    queryFn: async () => {
      if (!tickets?.length) return {};

      const workOrderPromises = tickets.map(async (ticket: Ticket) => {
        try {
          const response = await apiRequest(
            "GET",
            `/api/tickets/${ticket.id}/work-orders`,
          );
          const data = await response.json();
          return { [ticket.id]: data };
        } catch (error) {
          return { [ticket.id]: [] };
        }
      });

      const results = await Promise.all(workOrderPromises);
      return results.reduce((acc, result) => ({ ...acc, ...result }), {});
    },
    enabled: !!tickets?.length,
  });

  const { data: organizations = [], isLoading: orgsLoading } = useQuery<
    Organization[]
  >({
    queryKey: ["/api/organizations"],
    enabled: !!user && (user.role === "root" || user.role === "org_admin"),
  });

  // Fetch technicians for maintenance admin users
  const { data: technicians = [] } = useQuery<
    Array<{ id: number; firstName: string; lastName: string; email: string }>
  >({
    queryKey: [
      "/api/maintenance-vendors",
      user?.maintenanceVendorId,
      "technicians",
    ],
    queryFn: async () => {
      if (!user?.maintenanceVendorId) return [];
      const response = await apiRequest(
        "GET",
        `/api/maintenance-vendors/${user.maintenanceVendorId}/technicians`,
      );
      return await response.json();
    },
    enabled: !!user?.maintenanceVendorId && user.role === "maintenance_admin",
  });

  // Fetch vendor tiers (similar to web app approach)
  const { data: vendorTiers = [], isLoading: vendorsLoading } = useQuery<
    Array<{ vendor: MaintenanceVendor; tier: string; isActive: boolean }>
  >({
    queryKey:
      user?.role === "maintenance_admin"
        ? ["/api/maintenance-vendors"]
        : user?.organizationId
          ? ["/api/organizations", user.organizationId, "vendor-tiers"]
          : ["/api/maintenance-vendors"],
    queryFn: async () => {
      if (user?.role === "maintenance_admin") {
        // Maintenance admin - get all vendors and convert to tier format
        const response = await apiRequest("GET", "/api/maintenance-vendors");
        const allVendors = (await response.json()) as MaintenanceVendor[];
        return allVendors.map((vendor) => ({
          vendor,
          tier: "all",
          isActive: true,
        }));
      } else if (
        user?.organizationId &&
        (user?.role === "org_admin" || user?.role === "org_subadmin")
      ) {
        // Organization users - get vendor tiers directly
        const response = await apiRequest(
          "GET",
          `/api/organizations/${user.organizationId}/vendor-tiers`,
        );
        const orgVendorTiers = (await response.json()) as Array<{
          vendor: MaintenanceVendor;
          tier: string;
          isActive: boolean;
        }>;

        return orgVendorTiers;
      } else if (user?.role === "root") {
        // Root user - get all vendors and convert to tier format
        const response = await apiRequest("GET", "/api/maintenance-vendors");
        const allVendors = (await response.json()) as MaintenanceVendor[];
        return allVendors.map((vendor) => ({
          vendor,
          tier: "all",
          isActive: true,
        }));
      }
      return [];
    },
    enabled:
      !!user &&
      (user.role === "root" ||
        user.role === "org_admin" ||
        user.role === "org_subadmin" ||
        user.role === "maintenance_admin"),
  });

  // Removed redundant vendorTiers query - now handled directly in vendors query above

  // Marketplace queries
  const { data: marketplaceTickets = [], isLoading: marketplaceLoading } =
    useQuery<Ticket[]>({
      queryKey: ["/api/marketplace/tickets"],
      enabled:
        !!user &&
        (user.role === "maintenance_admin" || user.role === "technician"),
    });

  const { data: myBids = [], isLoading: bidsLoading } = useQuery<any[]>({
    queryKey: ["/api/marketplace/my-bids"],
    enabled: !!user && user.role === "maintenance_admin",
  });

  // Check authentication and load data
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/user", {
          credentials: "include",
        });
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        }
      } catch (error) {
        console.error("Auth check failed:", error);
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuth();
  }, []);

  // Show loading state while checking auth
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white flex items-center justify-center">
        {/* Animated Background */}
        <div className="fixed inset-0 opacity-20">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 animate-pulse"></div>
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-bounce"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-bounce delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-cyan-500/10 rounded-full blur-2xl animate-pulse delay-500"></div>
        </div>

        <div className="relative z-10 text-center p-4">
          <div className="flex justify-center items-center space-x-3 mb-6">
            <img
              src={taskscoutLogo}
              alt="TaskScout Logo"
              className="w-16 h-16 object-contain"
            />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-teal-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">
              TaskScout
            </h1>
          </div>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading TaskScout Mobile...</p>
        </div>
      </div>
    );
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        // Get user data and update state instead of reloading
        const userResponse = await fetch("/api/auth/user", {
          credentials: "include",
        });
        if (userResponse.ok) {
          const userData = await userResponse.json();
          setUser(userData);
          queryClient.invalidateQueries();
        }
      } else {
        const errorData = await response.json();
        console.error("Login failed:", errorData.message);
        toast({
          title: "Login Failed",
          description: errorData.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Login failed:", error);
      toast({
        title: "Login Failed",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    setUser(null);
    queryClient.clear();
  };

  // Login screen for unauthenticated users
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white flex items-center justify-center">
        {/* Animated Background */}
        <div className="fixed inset-0 opacity-20">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 animate-pulse"></div>
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-bounce"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-bounce delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-cyan-500/10 rounded-full blur-2xl animate-pulse delay-500"></div>
        </div>

        <div className="relative z-10 w-full max-w-md space-y-8 p-4">
          <div className="text-center">
            <div className="flex justify-center items-center space-x-3 mb-4">
              <img
                src={taskscoutLogo}
                alt="TaskScout Logo"
                className="w-20 h-20 object-contain"
              />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-teal-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">
                TaskScout
              </h1>
            </div>
            <p className="text-gray-400">
              Mobile App - Sign in to your account
            </p>
          </div>

          <Card className="bg-gradient-to-br from-white/5 to-white/10 border-white/20 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-center text-white">
                Mobile Login
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder=""
                    className="text-base bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-white">
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="admin"
                    className="text-base bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                  />
                </div>

                <div className="flex space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 text-xs p-2 h-8 bg-white/5 border-white/20 text-white hover:bg-white/10"
                    onClick={() => {
                      setEmail("");
                      setPassword("");
                    }}
                  >
                    Root
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 text-xs p-2 h-8 bg-white/5 border-white/20 text-white hover:bg-white/10"
                    onClick={() => {
                      setEmail("");
                      setPassword("");
                    }}
                  >
                    Vendor
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 text-xs p-2 h-8 bg-white/5 border-white/20 text-white hover:bg-white/10"
                    onClick={() => {
                      setEmail("");
                      setPassword("");
                    }}
                  >
                    Org Admin
                  </Button>
                </div>

                <Button
                  type="submit"
                  className="w-full text-base py-6 bg-gradient-to-r from-teal-500 via-cyan-500 to-blue-500 hover:from-teal-600 hover:via-cyan-600 hover:to-blue-600 text-white"
                  disabled={loading}
                >
                  {loading ? "Signing In..." : "Sign In"}
                </Button>

                <div className="mt-6 p-4 bg-white/5 rounded-lg border border-white/10 backdrop-blur-sm">
                  <h3 className="text-sm font-medium text-white mb-2">
                    Quick Access:
                  </h3>
                  <div className="space-y-1 text-xs text-gray-400">
                    <div>
                      <strong className="text-white">Root Admin:</strong>{" "}
                      root@mail.com / admin
                    </div>
                    <div>
                      <strong className="text-white">Org Admin:</strong>{" "}
                      admin@nsrpetroservices.org / password
                    </div>
                    <div>
                      <strong className="text-white">Vendor Admin:</strong>{" "}
                      admin@vendor.vendor / password
                    </div>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "accepted":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "in-progress":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300";
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "pending_confirmation":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
      case "ready_for_billing":
        return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300";
      case "billed":
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "text-red-600 dark:text-red-400";
      case "medium":
        return "text-yellow-600 dark:text-yellow-400";
      case "low":
        return "text-green-600 dark:text-green-400";
      default:
        return "text-gray-600 dark:text-gray-400";
    }
  };

  const handleTicketAction = (ticket: Ticket, action: "accept" | "reject") => {
    setSelectedTicket(ticket);
    setTicketAction(action);
    setIsTicketActionOpen(true);
  };

  const handleViewTicketDetails = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setIsTicketDetailsOpen(true);
  };

  const handleCreateWorkOrder = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setIsWorkOrderOpen(true);
  };

  const handleViewBids = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setIsMarketplaceBidsOpen(true);
  };

  const handleCreateInvoice = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setIsInvoiceCreatorOpen(true);
  };

  const handleConfirmCompletion = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setIsConfirmCompletionOpen(true);
  };

  // Filter tickets based on date range
  const getFilteredTickets = () => {
    const now = new Date();
    const filterDate = new Date();

    switch (ticketDateFilter) {
      case "today":
        filterDate.setHours(0, 0, 0, 0);
        return tickets.filter((ticket) => {
          const ticketDate = new Date(ticket.createdAt || 0);
          return ticketDate >= filterDate;
        });
      case "last7":
        filterDate.setDate(now.getDate() - 7);
        return tickets.filter((ticket) => {
          const ticketDate = new Date(ticket.createdAt || 0);
          return ticketDate >= filterDate;
        });
      case "last30":
        filterDate.setDate(now.getDate() - 30);
        return tickets.filter((ticket) => {
          const ticketDate = new Date(ticket.createdAt || 0);
          return ticketDate >= filterDate;
        });
      case "all":
      default:
        return tickets;
    }
  };

  const filteredTickets = getFilteredTickets();

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploadingImg(true);
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const formData = new FormData();
      formData.append("file", file);

      try {
        const response = await axios.post(
          "https://byzpal.com/api/application/uploadfile",
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          },
        );

        if (response.data && response.data.url) {
          setUploadedImages((prev) => [
            ...prev,
            { url: response.data.url, file },
          ]);
          // Show success message
          const toast = document.createElement("div");
          toast.className =
            "fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-md shadow-lg";
          toast.textContent = "Files uploaded successfully!";
          document.body.appendChild(toast);
          setUploadingImg(false);
          setTimeout(() => toast.remove(), 3000);
        }
      } catch (error) {
        console.error("Error uploading files:", error);
        const toast = document.createElement("div");
        toast.className =
          "fixed bottom-4 right-4 bg-red-500 text-white px-4 py-2 rounded-md shadow-lg";
        toast.textContent = "Failed to upload files. Please try again.";
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
        setUploadingImg(false);
      }
    }
  };

  const handleRemoveImage = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
  };
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileUpload(e.target.files);
    }
  };
  const getDashboardView = () => {
    if (user.role === "root") {
      return (
        <div className="space-y-6">
          {/* Statistics Cards */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
                      Organizations
                    </p>
                    <p className="text-2xl font-bold text-foreground mt-1">
                      {organizations.length}
                    </p>
                  </div>
                  <div className="bg-blue-500/10 p-2.5 rounded-lg">
                    <Building2 className="h-5 w-5 text-blue-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
                      Vendors
                    </p>
                    <p className="text-2xl font-bold text-foreground mt-1">
                      {vendorTiers.length}
                    </p>
                  </div>
                  <div className="bg-green-500/10 p-2.5 rounded-lg">
                    <Wrench className="h-5 w-5 text-green-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Organizations List */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Organizations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64">
                <div className="space-y-3">
                  {organizations.map((org) => (
                    <div
                      key={org.id}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted"
                      onClick={() => {
                        setSelectedOrganization(org);
                        setCurrentView("organization");
                      }}
                    >
                      <div className="flex-1">
                        <p className="font-medium text-foreground">
                          {org.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {org.email}
                        </p>
                      </div>
                      <ChevronDown className="h-4 w-4 text-muted-foreground rotate-[-90deg]" />
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Vendors List */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                Maintenance Vendors
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64">
                <div className="space-y-3">
                  {vendorTiers.map((vendorTier) => (
                    <div
                      key={vendorTier.vendor.id}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted"
                      onClick={() => {
                        setSelectedVendor(vendorTier.vendor);
                        setCurrentView("vendor");
                      }}
                    >
                      <div className="flex-1">
                        <p className="font-medium text-foreground">
                          {vendorTier.vendor.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {vendorTier.vendor.email}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Tier: {vendorTier.tier}
                        </p>
                      </div>
                      <ChevronDown className="h-4 w-4 text-muted-foreground rotate-[-90deg]" />
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      );
    }

    // Default ticket dashboard for other roles
    return (
      <div className="space-y-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
                    Total Tickets
                  </p>
                  <p className="text-2xl font-bold text-foreground mt-1">
                    {tickets.length}
                  </p>
                </div>
                <div className="bg-blue-500/10 p-2.5 rounded-lg">
                  <TicketIcon className="h-5 w-5 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
                    Open
                  </p>
                  <p className="text-2xl font-bold text-foreground mt-1">
                    {tickets.filter((t: any) => t.status === "open").length}
                  </p>
                </div>
                <div className="bg-yellow-500/10 p-2.5 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-yellow-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Tickets */}
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <List className="h-5 w-5" />
              Recent Tickets
            </CardTitle>
            {/* Only show create ticket button for organization users, not vendors */}
            {user &&
              (user.role === "org_admin" ||
                user.role === "org_subadmin" ||
                user.role === "residential") && (
                <Button
                  size="sm"
                  onClick={() => setIsCreateTicketOpen(true)}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  New
                </Button>
              )}
          </CardHeader>
          <CardContent>
            {/* Date Filter */}
            <div className="mb-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {filteredTickets.length} of {tickets.length} tickets
                </p>
                <div className="flex items-center gap-2">
                  <Select
                    value={ticketDateFilter}
                    onValueChange={(
                      value: "all" | "last30" | "last7" | "today",
                    ) => setTicketDateFilter(value)}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="last7">Last 7 days</SelectItem>
                      <SelectItem value="last30">Last 30 days</SelectItem>
                      <SelectItem value="all">All tickets</SelectItem>
                    </SelectContent>
                  </Select>
                  <Filter className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            </div>

            <ScrollArea className="h-96">
              <div className="space-y-3">
                {filteredTickets.slice(0, 20).map((ticket: any) => (
                  <div
                    key={ticket.id}
                    className="p-4 bg-muted/50 rounded-lg border border-border"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-medium text-foreground mb-1">
                          {ticket.title || "Untitled Ticket"}
                        </h4>
                        <p className="text-sm text-muted-foreground mb-2">
                          {ticket.ticketNumber || `#${ticket.id}`}
                        </p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedTicketForDetails(ticket);
                              setIsTicketDetailModalOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedTicketForDetails(ticket);
                              setIsTicketDetailModalOpen(true);
                            }}
                          >
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Comments
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedTicketForDetails(ticket);
                              setIsTicketDetailModalOpen(true);
                            }}
                          >
                            <TrendingUp className="h-4 w-4 mr-2" />
                            Progress
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedTicketForDetails(ticket);
                              setIsTicketDetailModalOpen(true);
                            }}
                          >
                            <Wrench className="h-4 w-4 mr-2" />
                            Work Orders
                          </DropdownMenuItem>
                          {/* Accept/Reject for users with proper permissions */}
                          {(user.role === "org_admin" ||
                            (user.role === "org_subadmin" &&
                              user.permissions?.includes("accept_ticket"))) &&
                            (ticket.status === "open" ||
                              ticket.status === "pending") && (
                              <>
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleTicketAction(ticket, "accept")
                                  }
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Accept Ticket
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleTicketAction(ticket, "reject")
                                  }
                                >
                                  <AlertCircle className="h-4 w-4 mr-2" />
                                  Reject Ticket
                                </DropdownMenuItem>
                              </>
                            )}

                          {/* Vendor-specific actions for maintenance admins */}
                          {user.role === "maintenance_admin" && (
                            <>
                              {/* Accept assignment when ticket is assigned to vendor */}
                              {ticket.maintenanceVendorId ===
                                user.maintenanceVendorId &&
                                ticket.status === "accepted" &&
                                !ticket.assigneeId && (
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleTicketAction(ticket, "accept")
                                    }
                                  >
                                    <UserCheck className="h-4 w-4 mr-2" />
                                    Accept & Assign Technician
                                  </DropdownMenuItem>
                                )}
                              {/* Reject assignment when ticket is assigned to vendor */}
                              {ticket.maintenanceVendorId ===
                                user.maintenanceVendorId &&
                                ticket.status === "accepted" && (
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleTicketAction(ticket, "reject")
                                    }
                                  >
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Reject Assignment
                                  </DropdownMenuItem>
                                )}
                              {/* Accept/Reject open tickets that can be assigned to any vendor */}
                              {(ticket.status === "open" ||
                                ticket.status === "pending") &&
                                !ticket.maintenanceVendorId && (
                                  <>
                                    <DropdownMenuItem
                                      onClick={() =>
                                        handleTicketAction(ticket, "accept")
                                      }
                                    >
                                      <CheckCircle className="h-4 w-4 mr-2" />
                                      Accept Ticket
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() =>
                                        handleTicketAction(ticket, "reject")
                                      }
                                    >
                                      <AlertCircle className="h-4 w-4 mr-2" />
                                      Reject Ticket
                                    </DropdownMenuItem>
                                  </>
                                )}
                            </>
                          )}
                          {/* Technician actions */}
                          {user.role === "technician" &&
                            ticket.assigneeId === user.id && (
                              <>
                                {ticket.status === "accepted" && (
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleCreateWorkOrder(ticket)
                                    }
                                  >
                                    <Wrench className="h-4 w-4 mr-2" />
                                    Start Work
                                  </DropdownMenuItem>
                                )}
                                {ticket.status === "in-progress" && (
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleCreateWorkOrder(ticket)
                                    }
                                  >
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Complete Work
                                  </DropdownMenuItem>
                                )}
                                {/* Allow creating another work order if previous one needed return visit */}
                                {hasReturnNeededWorkOrder(
                                  ticket,
                                  allTicketsWorkOrders[ticket.id],
                                ) &&
                                  ticket.status !== "pending_confirmation" &&
                                  ticket.status !== "confirmed" &&
                                  ticket.status !== "ready_for_billing" &&
                                  ticket.status !== "billed" && (
                                    <DropdownMenuItem
                                      onClick={() =>
                                        handleCreateWorkOrder(ticket)
                                      }
                                    >
                                      <Wrench className="h-4 w-4 mr-2" />
                                      Create Another Work Order
                                    </DropdownMenuItem>
                                  )}
                              </>
                            )}
                          {/* Marketplace actions */}
                          {ticket.assignedToMarketplace && (
                            <DropdownMenuItem
                              onClick={() => handleViewBids(ticket)}
                            >
                              <DollarSign className="h-4 w-4 mr-2" />
                              View Marketplace Bids
                            </DropdownMenuItem>
                          )}

                          {/* Marketplace bidding for vendors */}
                          {user.role === "maintenance_admin" &&
                            ticket.assignedToMarketplace &&
                            !ticket.maintenanceVendorId && (
                              <DropdownMenuItem
                                onClick={() => handleViewBids(ticket)}
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Place Bid
                              </DropdownMenuItem>
                            )}

                          {/* Billing actions */}
                          {user.role === "maintenance_admin" &&
                            ticket.status === "ready_for_billing" &&
                            ticket.maintenanceVendorId ===
                              user.maintenanceVendorId && (
                              <DropdownMenuItem
                                onClick={() => handleCreateInvoice(ticket)}
                              >
                                <FileText className="h-4 w-4 mr-2" />
                                Create Invoice
                              </DropdownMenuItem>
                            )}

                          {/* Completion confirmation for requesters */}
                          {(ticket.reporterId === user.id ||
                            user.role === "org_admin" ||
                            (user.role === "org_subadmin" &&
                              user.permissions?.includes("accept_ticket"))) &&
                            ticket.status === "pending_confirmation" && (
                              <DropdownMenuItem
                                onClick={() => handleConfirmCompletion(ticket)}
                              >
                                <CheckSquare className="h-4 w-4 mr-2" />
                                Verify Job Completed
                              </DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="flex items-center gap-2 mb-2">
                      <Badge
                        className={getStatusColor(ticket.status)}
                        variant="secondary"
                      >
                        {ticket.status?.replace("_", " ").replace("-", " ")}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={getPriorityColor(ticket.priority)}
                      >
                        {ticket.priority}
                      </Badge>
                    </div>

                    {ticket.description && (
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                        {ticket.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>
                        {ticket.createdAt &&
                          new Date(ticket.createdAt).toLocaleDateString()}
                      </span>
                      {ticket.images && ticket.images.length > 0 && (
                        <div className="flex items-center gap-1">
                          <Image className="h-3 w-3" />
                          <span>{ticket.images.length}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    );
  };

  const getOrganizationView = () => {
    if (!selectedOrganization) return null;

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentView("dashboard")}
            className="p-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-xl font-bold text-foreground">
              {selectedOrganization.name}
            </h2>
            <p className="text-sm text-muted-foreground">
              Organization Dashboard
            </p>
          </div>
        </div>

        {/* Organization stats and content would go here */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">
                    Active Tickets
                  </p>
                  <p className="text-2xl font-bold">
                    {
                      tickets.filter(
                        (t) => t.organizationId === selectedOrganization.id,
                      ).length
                    }
                  </p>
                </div>
                <TicketIcon className="h-5 w-5 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Users</p>
                  <p className="text-2xl font-bold">5</p>
                </div>
                <Users className="h-5 w-5 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  const getVendorView = () => {
    if (!selectedVendor) return null;

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentView("dashboard")}
            className="p-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-xl font-bold text-foreground">
              {selectedVendor.name}
            </h2>
            <p className="text-sm text-muted-foreground">Vendor Dashboard</p>
          </div>
        </div>

        {/* Vendor stats and content would go here */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">
                    Assigned Tickets
                  </p>
                  <p className="text-2xl font-bold">
                    {
                      tickets.filter(
                        (t) => t.maintenanceVendorId === selectedVendor.id,
                      ).length
                    }
                  </p>
                </div>
                <TicketIcon className="h-5 w-5 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Technicians</p>
                  <p className="text-2xl font-bold">3</p>
                </div>
                <Users className="h-5 w-5 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  const getCalendarView = () => {
    const today = new Date();
    const currentMonth = currentCalendarDate.getMonth();
    const currentYear = currentCalendarDate.getFullYear();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

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

    const getEventTypeColor = (eventType: string) => {
      switch (eventType) {
        case "work_assignment":
          return "bg-blue-500";
        case "meeting":
          return "bg-purple-500";
        case "maintenance":
          return "bg-orange-500";
        case "personal":
          return "bg-gray-500";
        default:
          return "bg-green-500";
      }
    };

    const handleDateClick = (date: Date) => {
      // Reset all modal states first
      setShowTimeSlotBooking(false);
      setShowEventModal(false);

      setSelectedCalendarDate(date);
      const eventsForDate = getEventsForDate(date);
      if (eventsForDate.length > 0) {
        // Always show day view for dates with events
        setCalendarView("day");
      } else {
        // Show time slot booking for empty dates
        setBookingDate(date);
        setShowTimeSlotBooking(true);
        setSelectedTimeSlot(null);
        setBookingForm({ title: "", description: "", location: "" });
        // Clear location autocomplete state
        setLocationSuggestions([]);
        setShowLocationSuggestions(false);
      }
    };

    const handleEventClick = (event: any) => {
      setSelectedCalendarEvent(event);
      setShowEventModal(true);
    };

    const generateCalendarDays = () => {
      const days = [];

      // Empty cells for days before the first day of month
      for (let i = 0; i < firstDayOfMonth; i++) {
        days.push(<div key={`empty-${i}`} className="h-16 w-full"></div>);
      }

      // Days of the month
      for (let day = 1; day <= daysInMonth; day++) {
        const currentDate = new Date(currentYear, currentMonth, day);
        const isToday =
          day === today.getDate() &&
          currentMonth === today.getMonth() &&
          currentYear === today.getFullYear();
        const dayEvents = getEventsForDate(currentDate);

        days.push(
          <div
            key={day}
            className={`h-16 w-full flex flex-col items-center justify-start p-1 rounded-lg text-sm cursor-pointer hover:bg-muted transition-colors relative ${
              isToday ? "bg-primary/10 ring-1 ring-primary" : "hover:bg-accent"
            }`}
            onClick={() => handleDateClick(currentDate)}
            onDoubleClick={() => {
              setSelectedCalendarDateForEvent(currentDate);
              setIsCreateEventModalOpen(true);
            }}
          >
            <div
              className={`font-medium mb-1 ${
                isToday ? "text-primary font-bold" : "text-foreground"
              }`}
            >
              {day}
            </div>
            <div className="flex flex-col gap-0.5 w-full">
              {dayEvents.slice(0, 2).map((event: any, index: number) => (
                <div
                  key={`${event.id}-${index}`}
                  className={`w-2 h-2 rounded-full ${getEventTypeColor(event.eventType)} flex-shrink-0`}
                  title={event.title}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEventClick(event);
                  }}
                ></div>
              ))}
              {dayEvents.length > 2 && (
                <div className="text-xs text-muted-foreground">
                  +{dayEvents.length - 2}
                </div>
              )}
            </div>
          </div>,
        );
      }

      return days;
    };

    const navigateMonth = (direction: "prev" | "next") => {
      setCurrentCalendarDate((prev) => {
        const newDate = new Date(prev);
        if (direction === "prev") {
          newDate.setMonth(prev.getMonth() - 1);
        } else {
          newDate.setMonth(prev.getMonth() + 1);
        }
        return newDate;
      });
    };

    const formatEventTime = (timeString: string) => {
      try {
        const [hours, minutes] = timeString.split(":").map(Number);
        const date = new Date();
        date.setHours(hours, minutes);
        return format(date, "h:mm a");
      } catch {
        return timeString;
      }
    };

    // Google Places API location search via backend proxy
    const searchLocations = async (query: string): Promise<string[]> => {
      if (query.trim().length < 2) return [];

      try {
        // Use backend proxy to avoid CORS issues
        const response = await fetch(
          `/api/places/search?q=${encodeURIComponent(query)}`,
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // Extract location descriptions from Google Places response
        const suggestions =
          data.predictions?.map((prediction: any) => prediction.description) ||
          [];

        // Return top 8 results
        return suggestions.slice(0, 8);
      } catch (error) {
        console.error("Error fetching locations from Google Places:", error);
        // Fallback to mock data if API fails
        return fallbackLocationSearch(query);
      }
    };

    // Fallback location search (in case Google API fails)
    const fallbackLocationSearch = (query: string): string[] => {
      const mockLocations = [
        "2318 Halls Ferry Rd, St. Louis, MO 63136",
        "2318 Hall Street, San Francisco, CA 94133",
        "2318 Hallmark Drive, Austin, TX 78758",
        "Main Street, Your City",
        "123 Business Ave, Corporate Center",
        "456 Office Park Dr, Business District",
      ];

      return mockLocations
        .filter((location) =>
          location.toLowerCase().includes(query.toLowerCase()),
        )
        .slice(0, 5);
    };

    // Handle location input change with proper debounce
    const handleLocationChange = (value: string) => {
      setBookingForm((prev) => ({ ...prev, location: value }));

      // Clear existing timeout
      if (locationSearchTimeout) {
        clearTimeout(locationSearchTimeout);
      }

      if (value.trim().length === 0) {
        setLocationSuggestions([]);
        setShowLocationSuggestions(false);
        setLocationSearchLoading(false);
        return;
      }

      if (value.trim().length < 2) {
        setShowLocationSuggestions(false);
        setLocationSearchLoading(false);
        return;
      }

      setLocationSearchLoading(true);
      setShowLocationSuggestions(true);

      // Proper debounce implementation
      const timeoutId = setTimeout(async () => {
        try {
          const suggestions = await searchLocations(value);
          setLocationSuggestions(suggestions);
        } catch (error) {
          console.error("Error searching locations:", error);
          setLocationSuggestions([]);
        } finally {
          setLocationSearchLoading(false);
        }
      }, 300);

      setLocationSearchTimeout(timeoutId);
    };

    // Handle selecting a location suggestion
    const handleLocationSelect = (selectedLocation: string) => {
      setBookingForm((prev) => ({ ...prev, location: selectedLocation }));
      setShowLocationSuggestions(false);
      setLocationSuggestions([]);
      setLocationSearchLoading(false);
      // Clear any pending search
      if (locationSearchTimeout) {
        clearTimeout(locationSearchTimeout);
        setLocationSearchTimeout(null);
      }
    };

    // Handle booking a selected time slot
    const handleBookTimeSlot = async () => {
      if (bookingDate && selectedTimeSlot && bookingForm.title.trim()) {
        try {
          const eventData = {
            title: bookingForm.title,
            description:
              bookingForm.description ||
              `Booked for ${formatTime(selectedTimeSlot.start)} - ${formatTime(selectedTimeSlot.end)}`,
            eventType: "personal" as const,
            startDate: format(bookingDate, "yyyy-MM-dd"),
            endDate: format(bookingDate, "yyyy-MM-dd"),
            startTime: selectedTimeSlot.start,
            endTime: selectedTimeSlot.end,
            isAllDay: false,
            priority: "medium" as const,
            location: bookingForm.location || "",
            color: "#6B7280",
            timezone: "America/New_York",
            status: "confirmed" as const,
          };

          const response = await apiRequest(
            "POST",
            "/api/calendar/events",
            eventData,
          );

          toast({
            title: "Event Booked!",
            description: `Successfully booked ${bookingForm.title} for ${format(bookingDate, "MMM d")} at ${formatEventTime(selectedTimeSlot.start)}`,
          });

          // Reset all form state and close modal
          setShowTimeSlotBooking(false);
          setBookingDate(null);
          setBookingForm({ title: "", description: "", location: "" });
          setSelectedTimeSlot(null);
          setLocationSuggestions([]);
          setShowLocationSuggestions(false);
          setLocationSearchLoading(false);

          // Clear search timeout if exists
          if (locationSearchTimeout) {
            clearTimeout(locationSearchTimeout);
            setLocationSearchTimeout(null);
          }

          // Refresh calendar events
          queryClient.invalidateQueries({ queryKey: ["/api/calendar/events"] });
        } catch (error) {
          console.error("Error booking time slot:", error);
          toast({
            title: "Booking Failed",
            description: "Failed to book the time slot. Please try again.",
            variant: "destructive",
          });
        }
      }
    };

    if (calendarView === "day" && selectedCalendarDate) {
      const dayEvents = getEventsForDate(selectedCalendarDate);
      return (
        <div className="space-y-4">
          {/* Day View Header */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // Clean up all modal states when going back
                    setShowTimeSlotBooking(false);
                    setShowEventModal(false);
                    setSelectedCalendarDate(null);
                    setBookingDate(null);
                    setSelectedTimeSlot(null);
                    setBookingForm({
                      title: "",
                      description: "",
                      location: "",
                    });
                    setLocationSuggestions([]);
                    setShowLocationSuggestions(false);
                    setCalendarView("month");
                  }}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
                <CardTitle className="text-lg text-center">
                  {format(selectedCalendarDate, "EEEE, MMM d")}
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setBookingDate(selectedCalendarDate);
                    setShowTimeSlotBooking(true);
                    setSelectedTimeSlot(null);
                    setBookingForm({
                      title: "",
                      description: "",
                      location: "",
                    });
                  }}
                  className="text-xs"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
          </Card>

          {/* Day Events */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center justify-between">
                <span>Scheduled Events ({dayEvents.length})</span>
                <div className="text-xs text-muted-foreground">
                  {format(selectedCalendarDate, "yyyy")}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-2">
              {dayEvents.length === 0 ? (
                <div className="text-center py-6">
                  <Calendar className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground mb-3">
                    No events scheduled for this day
                  </p>
                  <Button
                    size="sm"
                    onClick={() => {
                      setBookingDate(selectedCalendarDate);
                      setShowTimeSlotBooking(true);
                      setSelectedTimeSlot(null);
                      setBookingForm({
                        title: "",
                        description: "",
                        location: "",
                      });
                    }}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Schedule Event
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {dayEvents.map((event: any, index: number) => (
                    <div
                      key={event.id || index}
                      className="p-3 border rounded-lg bg-card hover:bg-accent/50 transition-colors cursor-pointer"
                      onClick={() => handleEventClick(event)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm text-card-foreground">
                            {event.title}
                          </h4>
                          {event.startTime && (
                            <p className="text-xs text-blue-600 font-medium mt-1">
                              {formatEventTime(event.startTime)}
                              {event.endTime &&
                                ` - ${formatEventTime(event.endTime)}`}
                            </p>
                          )}
                        </div>
                        <div
                          className={`w-3 h-3 rounded-full ${getEventTypeColor(event.eventType)} flex-shrink-0 mt-1`}
                        ></div>
                      </div>

                      {event.description && (
                        <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                          {event.description}
                        </p>
                      )}

                      {event.location && (
                        <div className="flex items-center gap-1 mb-2">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {event.location}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <Badge
                          variant="secondary"
                          className="text-xs capitalize"
                        >
                          {event.eventType.replace("_", " ")}
                        </Badge>
                        {event.priority && (
                          <Badge
                            variant="outline"
                            className={`text-xs ${
                              event.priority === "high"
                                ? "border-red-200 text-red-700 bg-red-50"
                                : event.priority === "medium"
                                  ? "border-yellow-200 text-yellow-700 bg-yellow-50"
                                  : "border-green-200 text-green-700 bg-green-50"
                            }`}
                          >
                            {event.priority}
                          </Badge>
                        )}
                        {event.status && (
                          <Badge
                            variant="outline"
                            className={`text-xs ${
                              event.status === "confirmed"
                                ? "border-green-200 text-green-700"
                                : event.status === "tentative"
                                  ? "border-yellow-200 text-yellow-700"
                                  : "border-red-200 text-red-700"
                            }`}
                          >
                            {event.status}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Add new event button */}
                  <div className="pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // Use the currently selected date from day detail
                        const dateToUse = selectedCalendarDate;
                        console.log("Add Another Event clicked:", {
                          selectedCalendarDate,
                          dateToUse,
                          showTimeSlotBooking,
                          bookingDate,
                        });

                        if (dateToUse) {
                          // Reset all booking-related state first
                          setSelectedTimeSlot(null);
                          setSelectedDuration(1);
                          setBookingForm({
                            title: "",
                            description: "",
                            location: "",
                          });
                          setLocationSuggestions([]);
                          setShowLocationSuggestions(false);
                          setLocationSearchLoading(false);

                          // Clear search timeout if exists
                          if (locationSearchTimeout) {
                            clearTimeout(locationSearchTimeout);
                            setLocationSearchTimeout(null);
                          }

                          // Set booking date and show modal
                          setBookingDate(dateToUse);
                          setShowTimeSlotBooking(true);

                          console.log("Should open modal now:", {
                            bookingDate: dateToUse,
                            showTimeSlotBooking: true,
                          });
                        } else {
                          console.error(
                            "No selected calendar date available:",
                            { selectedCalendarDate },
                          );
                          toast({
                            title: "Error",
                            description:
                              "Unable to determine selected date. Please try again.",
                            variant: "destructive",
                          });
                        }
                      }}
                      className="w-full text-blue-600 border-blue-200 hover:bg-blue-50"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Another Event
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {/* Calendar Header */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth("prev")}
                disabled={calendarLoading}
              >
                <ChevronDown className="h-4 w-4 rotate-90" />
              </Button>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                {monthNames[currentMonth]} {currentYear}
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth("next")}
                disabled={calendarLoading}
              >
                <ChevronDown className="h-4 w-4 -rotate-90" />
              </Button>
            </div>
            <div className="flex justify-center mt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentCalendarDate(new Date())}
                disabled={calendarLoading}
              >
                Today
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Calendar Grid */}
        <Card>
          <CardContent className="p-4">
            {calendarLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading calendar...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Calendar Header */}
                <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted-foreground">
                  <div className="py-2">Sun</div>
                  <div className="py-2">Mon</div>
                  <div className="py-2">Tue</div>
                  <div className="py-2">Wed</div>
                  <div className="py-2">Thu</div>
                  <div className="py-2">Fri</div>
                  <div className="py-2">Sat</div>
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-1">
                  {generateCalendarDays()}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Event Legend */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Event Types</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span>Work Assignment</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                <span>Meeting</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                <span>Maintenance</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                <span>Personal</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="space-y-2">
              <Button
                size="sm"
                variant="outline"
                className="w-full justify-start bg-gradient-to-r from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 border-blue-200 text-blue-700"
                onClick={() => {
                  setSelectedCalendarDateForEvent(null);
                  setIsCreateEventModalOpen(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create New Event
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="w-full justify-start bg-gradient-to-r from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 border-green-200 text-green-700"
                onClick={() => setIsAvailabilityConfigOpen(true)}
              >
                <Clock className="h-4 w-4 mr-2" />
                Set Availability
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  const upcomingEvents = calendarEvents.filter((event: any) => {
                    const eventDate = new Date(event.startDate);
                    return eventDate >= today;
                  });
                  toast({
                    title: "Upcoming Events",
                    description: `You have ${upcomingEvents.length} upcoming events`,
                  });
                }}
              >
                <List className="h-4 w-4 mr-2" />
                View Upcoming (
                {
                  calendarEvents.filter(
                    (event: any) => new Date(event.startDate) >= today,
                  ).length
                }
                )
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Event Detail Modal */}
        {showEventModal && selectedCalendarEvent && (
          <Dialog open={showEventModal} onOpenChange={setShowEventModal}>
            <DialogContent className="max-w-sm mx-4">
              <DialogHeader>
                <DialogTitle className="text-lg">
                  {selectedCalendarEvent.title}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {selectedCalendarEvent.description && (
                  <div>
                    <h4 className="text-sm font-medium mb-1">Description</h4>
                    <p className="text-sm text-muted-foreground">
                      {selectedCalendarEvent.description}
                    </p>
                  </div>
                )}
                <div>
                  <h4 className="text-sm font-medium mb-1">Date & Time</h4>
                  <p className="text-sm text-muted-foreground">
                    {format(
                      new Date(selectedCalendarEvent.startDate),
                      "MMMM d, yyyy",
                    )}
                    {selectedCalendarEvent.startTime && (
                      <>
                        {" "}
                        at {formatEventTime(selectedCalendarEvent.startTime)}
                      </>
                    )}
                    {selectedCalendarEvent.endTime && (
                      <> - {formatEventTime(selectedCalendarEvent.endTime)}</>
                    )}
                  </p>
                </div>
                {selectedCalendarEvent.location && (
                  <div>
                    <h4 className="text-sm font-medium mb-1">Location</h4>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        {selectedCalendarEvent.location}
                      </p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    {selectedCalendarEvent.eventType.replace("_", " ")}
                  </Badge>
                  {selectedCalendarEvent.priority && (
                    <Badge
                      variant="outline"
                      className={`${
                        selectedCalendarEvent.priority === "high"
                          ? "border-red-200 text-red-700"
                          : selectedCalendarEvent.priority === "medium"
                            ? "border-yellow-200 text-yellow-700"
                            : "border-green-200 text-green-700"
                      }`}
                    >
                      {selectedCalendarEvent.priority}
                    </Badge>
                  )}
                  <Badge
                    variant="outline"
                    className={`${
                      selectedCalendarEvent.status === "confirmed"
                        ? "border-green-200 text-green-700"
                        : selectedCalendarEvent.status === "tentative"
                          ? "border-yellow-200 text-yellow-700"
                          : "border-red-200 text-red-700"
                    }`}
                  >
                    {selectedCalendarEvent.status}
                  </Badge>
                </div>
                <div className="flex gap-2 pt-4">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowEventModal(false)}
                  >
                    Close
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      toast({
                        title: "Edit Event",
                        description: "Event editing will be available soon",
                      });
                      setShowEventModal(false);
                    }}
                  >
                    Edit
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Time Slot Booking Modal */}
        <Dialog
          open={showTimeSlotBooking}
          onOpenChange={(open) => {
            console.log("Time Slot Booking Modal onOpenChange:", {
              open,
              showTimeSlotBooking,
            });
            if (!open) {
              // Clean up state when modal is closed
              setShowTimeSlotBooking(false);
              setBookingDate(null);
              setSelectedTimeSlot(null);
              setBookingForm({ title: "", description: "", location: "" });
              setLocationSuggestions([]);
              setShowLocationSuggestions(false);
              setLocationSearchLoading(false);
              if (locationSearchTimeout) {
                clearTimeout(locationSearchTimeout);
                setLocationSearchTimeout(null);
              }
            }
          }}
        >
          <DialogContent className="max-w-sm mx-4 max-h-[80vh] overflow-y-auto fixed inset-0 z-50 bg-white">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                Book Time Slot
              </DialogTitle>
            </DialogHeader>

            {bookingDate && (
              <div className="space-y-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <p className="font-medium text-blue-900">
                    {format(bookingDate, "EEEE, MMMM d, yyyy")}
                  </p>
                  <p className="text-sm text-blue-700">
                    Select your preferred time slot
                  </p>
                </div>

                {/* Duration Selection */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-700">
                    Duration:
                  </h4>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { value: 0.25, label: "15min" },
                      { value: 0.5, label: "30min" },
                      { value: 1, label: "1hr" },
                      { value: 2, label: "2hr" },
                    ].map((duration) => (
                      <button
                        key={duration.value}
                        onClick={() => {
                          setSelectedDuration(duration.value);
                          setSelectedTimeSlot(null); // Reset selected slot when duration changes
                        }}
                        className={`
                          px-2 py-1 text-xs rounded border transition-all
                          ${
                            selectedDuration === duration.value
                              ? "bg-blue-500 text-white border-blue-500"
                              : "bg-white text-gray-900 border-gray-200 hover:bg-blue-50"
                          }
                        `}
                      >
                        {duration.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Available Time Slots */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-700">
                    Available Times (
                    {selectedDuration >= 1
                      ? `${selectedDuration} hour${selectedDuration > 1 ? "s" : ""}`
                      : `${selectedDuration * 60} min`}
                    ):
                  </h4>
                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                    {generateTimeSlots().map((slot, index) => {
                      const isAvailable = isTimeSlotAvailable(
                        slot.start,
                        slot.end,
                      );
                      const isSelected =
                        selectedTimeSlot?.start === slot.start &&
                        selectedTimeSlot?.end === slot.end;

                      return (
                        <button
                          key={index}
                          onClick={() =>
                            setSelectedTimeSlot(
                              isSelected
                                ? null
                                : { start: slot.start, end: slot.end },
                            )
                          }
                          disabled={!isAvailable}
                          className={`
                            p-2 text-xs rounded border transition-all text-center
                            ${
                              isAvailable
                                ? isSelected
                                  ? "bg-green-500 text-white border-green-500"
                                  : "bg-white text-gray-900 border-gray-200 hover:bg-green-50"
                                : "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                            }
                          `}
                        >
                          {slot.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {selectedTimeSlot && (
                  <div className="space-y-4">
                    <div className="p-3 bg-green-50 border border-green-200 rounded">
                      <p className="text-sm font-medium text-green-900">
                        Selected: {formatEventTime(selectedTimeSlot.start)} -{" "}
                        {formatEventTime(selectedTimeSlot.end)}
                      </p>
                      <p className="text-xs text-green-700">
                        Ready to schedule for{" "}
                        {format(bookingDate, "MMM d, yyyy")}
                      </p>
                    </div>

                    {/* Event Details Form */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-gray-700">
                        Event Details:
                      </h4>

                      <div>
                        <Label htmlFor="booking-title" className="text-xs">
                          Title *
                        </Label>
                        <Input
                          id="booking-title"
                          placeholder="What's this event about?"
                          value={bookingForm.title}
                          onChange={(e) =>
                            setBookingForm((prev) => ({
                              ...prev,
                              title: e.target.value,
                            }))
                          }
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label
                          htmlFor="booking-description"
                          className="text-xs"
                        >
                          Description
                        </Label>
                        <Textarea
                          id="booking-description"
                          placeholder="Add details about the event (optional)"
                          value={bookingForm.description}
                          onChange={(e) =>
                            setBookingForm((prev) => ({
                              ...prev,
                              description: e.target.value,
                            }))
                          }
                          rows={2}
                          className="mt-1"
                        />
                      </div>

                      <div className="relative">
                        <Label htmlFor="booking-location" className="text-xs">
                          Location
                        </Label>
                        <Input
                          id="booking-location"
                          placeholder="Search for any address or business..."
                          value={bookingForm.location}
                          onChange={(e) => handleLocationChange(e.target.value)}
                          onFocus={() => {
                            if (
                              bookingForm.location.trim().length >= 2 &&
                              locationSuggestions.length > 0
                            ) {
                              setShowLocationSuggestions(true);
                            }
                          }}
                          className="mt-1"
                        />

                        {/* Location Suggestions Dropdown */}
                        {showLocationSuggestions &&
                          (locationSuggestions.length > 0 ||
                            locationSearchLoading) && (
                            <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md shadow-lg max-h-48 overflow-y-auto">
                              {locationSearchLoading ? (
                                <div className="p-3 text-center text-sm text-muted-foreground">
                                  <div className="flex items-center justify-center gap-2">
                                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                    Searching...
                                  </div>
                                </div>
                              ) : locationSuggestions.length > 0 ? (
                                locationSuggestions.map((suggestion, index) => (
                                  <button
                                    key={index}
                                    type="button"
                                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700 focus:outline-none transition-colors border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                                    onClick={() =>
                                      handleLocationSelect(suggestion)
                                    }
                                  >
                                    <div className="flex items-start gap-2">
                                      <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                                      <div className="flex-1 min-w-0">
                                        <div className="text-gray-900 dark:text-gray-100 truncate">
                                          {suggestion.split(",")[0]}
                                        </div>
                                        {suggestion.includes(",") && (
                                          <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                            {suggestion
                                              .split(",")
                                              .slice(1)
                                              .join(",")
                                              .trim()}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </button>
                                ))
                              ) : (
                                <div className="p-3 text-center text-sm text-muted-foreground">
                                  No locations found
                                </div>
                              )}
                            </div>
                          )}
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      // Clean up all state when canceling
                      setShowTimeSlotBooking(false);
                      setBookingDate(null);
                      setSelectedTimeSlot(null);
                      setBookingForm({
                        title: "",
                        description: "",
                        location: "",
                      });
                      setLocationSuggestions([]);
                      setShowLocationSuggestions(false);
                      setLocationSearchLoading(false);
                      if (locationSearchTimeout) {
                        clearTimeout(locationSearchTimeout);
                        setLocationSearchTimeout(null);
                      }
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleBookTimeSlot}
                    disabled={!selectedTimeSlot || !bookingForm.title.trim()}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50"
                  >
                    {!bookingForm.title.trim() && selectedTimeSlot
                      ? "Enter Title"
                      : "Book Event"}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    );
  };

  const getMarketplaceView = () => {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-foreground">Marketplace</h2>
            <p className="text-sm text-muted-foreground">
              Available tickets for bidding
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Available</p>
                  <p className="text-2xl font-bold">
                    {marketplaceTickets.length}
                  </p>
                </div>
                <TicketIcon className="h-5 w-5 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">My Bids</p>
                  <p className="text-2xl font-bold">{myBids.length || 0}</p>
                </div>
                <Star className="h-5 w-5 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Marketplace Tickets */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Open Marketplace Tickets</CardTitle>
            <CardDescription>Tickets available for bidding</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {marketplaceLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-muted-foreground">
                      Loading marketplace tickets...
                    </p>
                  </div>
                ) : marketplaceTickets.length === 0 ? (
                  <div className="text-center py-8">
                    <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      No tickets available for bidding
                    </p>
                  </div>
                ) : (
                  marketplaceTickets.map((ticket: Ticket) => (
                    <div
                      key={ticket.id}
                      className="p-4 border rounded-lg bg-card hover:bg-accent/50 transition-colors cursor-pointer"
                      onClick={() => handleViewTicketDetails(ticket)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-card-foreground truncate flex-1">
                          {ticket.title}
                        </h4>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            // Handle place bid
                            toast({
                              title: "Place Bid",
                              description: "Bidding functionality coming soon",
                            });
                          }}
                        >
                          Bid
                        </Button>
                      </div>

                      <div className="flex items-center gap-2 mb-2">
                        <Badge
                          className={getStatusColor(ticket.status)}
                          variant="secondary"
                        >
                          {ticket.status?.replace("_", " ").replace("-", " ")}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={getPriorityColor(ticket.priority)}
                        >
                          {ticket.priority}
                        </Badge>
                      </div>

                      {ticket.description && (
                        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                          {ticket.description}
                        </p>
                      )}

                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>
                          {ticket.createdAt &&
                            new Date(ticket.createdAt).toLocaleDateString()}
                        </span>
                        {ticket.images && ticket.images.length > 0 && (
                          <div className="flex items-center gap-1">
                            <Image className="h-3 w-3" />
                            <span>{ticket.images.length}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    );
  };

  const getCurrentView = () => {
    switch (currentView) {
      case "organization":
        return getOrganizationView();
      case "vendor":
        return getVendorView();
      case "calendar":
        return getCalendarView();
      case "marketplace":
        return getMarketplaceView();
      default:
        return getDashboardView();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white sticky top-0 z-50">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-3">
            <div className="bg-white/10 backdrop-blur-sm p-2 rounded-lg">
              <Smartphone className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">TaskScout</h1>
              <p className="text-xs text-blue-100">Mobile</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              variant="ghost"
              className="p-2 text-white hover:bg-white/10"
            >
              <Bell className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-xs text-white hover:bg-white/10"
            >
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* User Profile Bar */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 pb-6">
        <div className="flex items-center space-x-3">
          <Avatar className="h-12 w-12 border-2 border-white/20 bg-white/10">
            <AvatarFallback className="bg-white/10 text-white font-bold backdrop-blur-sm">
              {(user.first_name || user.firstName)?.[0] ||
                user.email[0].toUpperCase()}
              {(user.last_name || user.lastName)?.[0] || ""}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h2 className="font-semibold text-lg text-white">
              {user.first_name || user.firstName}{" "}
              {user.last_name || user.lastName || ""}
            </h2>
            <p className="text-blue-100 text-sm capitalize">
              {user.role?.replace("_", " ")}
            </p>
            <div className="flex items-center space-x-2 mt-1">
              <CheckCircle className="h-3 w-3 text-green-400" />
              <span className="text-xs text-blue-100">Online</span>
            </div>
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="text-white hover:bg-white/10 border-white/20"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-background border-b border-border px-4 -mt-2">
        <Tabs
          value={currentView}
          onValueChange={(value) => setCurrentView(value as any)}
          className="w-full"
        >
          <TabsList className="w-full flex bg-muted overflow-x-auto">
            <TabsTrigger value="dashboard" className="text-xs flex-shrink-0">
              <Home className="h-4 w-4 mr-1" />
              Home
            </TabsTrigger>
            {user.role === "root" && (
              <>
                <TabsTrigger
                  value="organization"
                  className="text-xs flex-shrink-0"
                >
                  <Building2 className="h-4 w-4 mr-1" />
                  Orgs
                </TabsTrigger>
                <TabsTrigger value="vendor" className="text-xs flex-shrink-0">
                  <Wrench className="h-4 w-4 mr-1" />
                  Vendors
                </TabsTrigger>
              </>
            )}
            {(user.role === "maintenance_admin" ||
              user.role === "technician") && (
              <TabsTrigger
                value="marketplace"
                className="text-xs flex-shrink-0"
              >
                <DollarSign className="h-4 w-4 mr-1" />
                Market
              </TabsTrigger>
            )}
            <TabsTrigger value="calendar" className="text-xs flex-shrink-0">
              <Calendar className="h-4 w-4 mr-1" />
              Calendar
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Main Content */}
      <div className="p-4">{getCurrentView()}</div>

      {/* Mobile Ticket Details Modal */}
      <Dialog
        open={isTicketDetailModalOpen}
        onOpenChange={setIsTicketDetailModalOpen}
      >
        <DialogContent className="max-w-full h-full m-0 p-0 rounded-none">
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsTicketDetailModalOpen(false)}
                  className="p-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                  <h2 className="text-lg font-semibold">
                    {selectedTicketForDetails?.title || "Ticket Details"}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {selectedTicketForDetails?.ticketNumber ||
                      `#${selectedTicketForDetails?.id}`}
                  </p>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="details" className="flex-1 flex flex-col">
              <TabsList className="grid w-full grid-cols-4 rounded-none border-b">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="comments">Comments</TabsTrigger>
                <TabsTrigger value="progress">Progress</TabsTrigger>
                <TabsTrigger value="work-orders">Work Orders</TabsTrigger>
              </TabsList>

              {/* Details Tab */}
              <TabsContent
                value="details"
                className="flex-1 overflow-y-auto p-4"
              >
                {selectedTicketForDetails && (
                  <div className="space-y-4">
                    {/* Status & Priority */}
                    <div className="flex gap-2">
                      <Badge
                        variant="secondary"
                        className={getStatusColor(
                          selectedTicketForDetails.status,
                        )}
                      >
                        {selectedTicketForDetails.status
                          ?.replace("_", " ")
                          .replace("-", " ")}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={getPriorityColor(
                          selectedTicketForDetails.priority,
                        )}
                      >
                        {selectedTicketForDetails.priority}
                      </Badge>
                    </div>

                    {/* Description */}
                    {selectedTicketForDetails.description && (
                      <div>
                        <h3 className="font-semibold mb-2">Description</h3>
                        <p className="text-sm text-muted-foreground">
                          {selectedTicketForDetails.description}
                        </p>
                      </div>
                    )}

                    {/* Images */}
                    {selectedTicketForDetails.images &&
                      selectedTicketForDetails.images.length > 0 && (
                        <div>
                          <h3 className="font-semibold mb-2">
                            Images ({selectedTicketForDetails.images.length})
                          </h3>
                          <div className="grid grid-cols-2 gap-2">
                            {selectedTicketForDetails.images.map(
                              (image: string, idx: number) => (
                                <div
                                  key={idx}
                                  className="aspect-square bg-muted rounded-lg overflow-hidden border"
                                >
                                  {image.includes(".mp4") ||
                                  image.includes(".mov") ||
                                  image.includes(".MOV") ? (
                                    <video
                                      src={image}
                                      className="w-full h-full object-cover"
                                      controls
                                      playsInline
                                      onError={(e) => {
                                        console.error(
                                          "Video load error:",
                                          image,
                                        );
                                        const target =
                                          e.target as HTMLVideoElement;
                                        target.style.display = "none";
                                        target.parentElement!.innerHTML = `<div class="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs text-muted-foreground p-2 text-center">Video unavailable<br/>${image}</div>`;
                                      }}
                                    />
                                  ) : (
                                    <img
                                      src={image}
                                      alt={`Ticket image ${idx + 1}`}
                                      className="w-full h-full object-cover cursor-pointer"
                                      loading="lazy"
                                      onClick={() =>
                                        setSelectedImageForViewer(image)
                                      }
                                      onError={(e) => {
                                        console.error(
                                          "Image load error:",
                                          image,
                                        );
                                        const target =
                                          e.target as HTMLImageElement;
                                        target.style.display = "none";
                                        target.parentElement!.innerHTML = `<div class="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs text-muted-foreground p-2 text-center">Image unavailable<br/>${image}</div>`;
                                      }}
                                    />
                                  )}
                                </div>
                              ),
                            )}
                          </div>
                        </div>
                      )}

                    {/* Location */}
                    {selectedTicketForDetails.locationId && (
                      <div>
                        <h3 className="font-semibold mb-2">Location</h3>
                        <p className="text-sm text-muted-foreground">
                          {selectedTicketLocation ? (
                            <>
                              <strong>{selectedTicketLocation.name}</strong>
                              {selectedTicketLocation.address && (
                                <>
                                  <br />
                                  {selectedTicketLocation.address}
                                </>
                              )}
                            </>
                          ) : (
                            "Loading location..."
                          )}
                        </p>
                      </div>
                    )}

                    {/* Created Date */}
                    <div>
                      <h3 className="font-semibold mb-2">Created</h3>
                      <p className="text-sm text-muted-foreground">
                        {selectedTicketForDetails.createdAt &&
                          new Date(
                            selectedTicketForDetails.createdAt,
                          ).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* Comments Tab */}
              <TabsContent
                value="comments"
                className="flex-1 overflow-y-auto p-4"
              >
                {selectedTicketForDetails && (
                  <TicketComments
                    ticket={selectedTicketForDetails}
                    userRole={user?.role}
                    userId={user?.id}
                  />
                )}
              </TabsContent>

              {/* Progress Tab */}
              <TabsContent
                value="progress"
                className="flex-1 overflow-y-auto p-4"
              >
                {selectedTicketForDetails && (
                  <ProgressTrackerEmbedded
                    ticket={selectedTicketForDetails}
                    canUpdate={
                      user?.role === "org_admin" ||
                      user?.role === "maintenance_admin"
                    }
                  />
                )}
              </TabsContent>

              {/* Work Orders Tab */}
              <TabsContent
                value="work-orders"
                className="flex-1 overflow-y-auto p-4"
              >
                {selectedTicketForDetails && (
                  <div className="space-y-4">
                    <Button
                      onClick={() => setIsWorkOrderHistoryOpen(true)}
                      className="w-full"
                      variant="outline"
                    >
                      <Wrench className="h-4 w-4 mr-2" />
                      View All Work Orders
                    </Button>
                    <p className="text-sm text-muted-foreground text-center">
                      Click above to view detailed work order history with
                      parts, labor, and completion notes.
                    </p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>

      {/* Work Orders History Modal */}
      <WorkOrdersHistory
        open={isWorkOrderHistoryOpen}
        onOpenChange={setIsWorkOrderHistoryOpen}
        ticketId={selectedTicketForDetails?.id || null}
      />

      {/* Modals */}
      <CreateTicketModal
        open={isCreateTicketOpen}
        onOpenChange={setIsCreateTicketOpen}
        onSubmit={(data, images) => {
          // Handle ticket creation here
          console.log("Creating ticket:", data, images);
          setIsCreateTicketOpen(false);
          refetchTickets();
        }}
        isLoading={false}
        userId={user?.id}
        organizationId={user?.organizationId}
      />

      {selectedTicket && (
        <>
          <TicketActionModal
            open={isTicketActionOpen}
            onOpenChange={(open) => {
              setIsTicketActionOpen(open);
              if (!open) {
                setSelectedTicket(null);
                setTicketAction(null);
              }
            }}
            ticket={selectedTicket}
            action={ticketAction}
            vendors={vendorTiers}
            technicians={technicians}
            userRole={user?.role}
            userPermissions={user?.permissions}
            userVendorTiers={user?.vendorTiers}
            onAccept={async (ticketId, data) => {
              try {
                const response = await fetch(
                  `/api/tickets/${ticketId}/accept`,
                  {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify(data),
                  },
                );

                if (response.ok) {
                  toast({
                    title: "Success",
                    description: "Ticket accepted successfully",
                  });
                  setIsTicketActionOpen(false);
                  setSelectedTicket(null);
                  setTicketAction(null);
                  refetchTickets();
                  queryClient.invalidateQueries({
                    queryKey: ["/api/calendar/events"],
                  });
                } else {
                  const error = await response.json();
                  toast({
                    title: "Error",
                    description: error.message || "Failed to accept ticket",
                    variant: "destructive",
                  });
                }
              } catch (error) {
                toast({
                  title: "Error",
                  description: "Failed to accept ticket",
                  variant: "destructive",
                });
              }
            }}
            onReject={async (ticketId, reason) => {
              try {
                const response = await fetch(
                  `/api/tickets/${ticketId}/reject`,
                  {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({ rejectionReason: reason }),
                  },
                );

                if (response.ok) {
                  toast({
                    title: "Success",
                    description: "Ticket rejected successfully",
                  });
                  setIsTicketActionOpen(false);
                  setSelectedTicket(null);
                  setTicketAction(null);
                  refetchTickets();
                } else {
                  const error = await response.json();
                  toast({
                    title: "Error",
                    description: error.message || "Failed to reject ticket",
                    variant: "destructive",
                  });
                }
              } catch (error) {
                toast({
                  title: "Error",
                  description: "Failed to reject ticket",
                  variant: "destructive",
                });
              }
            }}
            isLoading={false}
          />

          <ConfirmCompletionModal
            open={isConfirmCompletionOpen}
            onOpenChange={(open) => {
              setIsConfirmCompletionOpen(open);
              if (!open) {
                setSelectedTicket(null);
              }
            }}
            ticket={selectedTicket}
            onConfirm={async (confirmed, feedback) => {
              try {
                if (!selectedTicket) return;

                const response = await fetch(
                  `/api/tickets/${selectedTicket.id}/confirm`,
                  {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    credentials: "include",
                    body: JSON.stringify({
                      confirmed,
                      feedback:
                        feedback ||
                        (confirmed
                          ? "Work completed and verified via mobile app"
                          : "Work needs additional attention"),
                    }),
                  },
                );

                if (response.ok) {
                  toast({
                    title: confirmed ? "Job Verified" : "Job Needs More Work",
                    description: confirmed
                      ? "Ticket sent to billing successfully"
                      : "Ticket marked as needing additional work",
                  });
                  refetchTickets();
                } else {
                  const errorData = await response.json();
                  toast({
                    title: "Error",
                    description:
                      errorData.message || "Failed to update ticket status",
                    variant: "destructive",
                  });
                }
              } catch (error) {
                console.error("Error confirming completion:", error);
                toast({
                  title: "Error",
                  description: "Failed to update ticket. Please try again.",
                  variant: "destructive",
                });
              }

              setIsConfirmCompletionOpen(false);
              setSelectedTicket(null);
            }}
            isLoading={false}
          />

          <MarketplaceBidsModal
            isOpen={isMarketplaceBidsOpen}
            onClose={() => {
              setIsMarketplaceBidsOpen(false);
              setSelectedTicket(null);
            }}
            ticket={selectedTicket}
          />

          {/* Enhanced Ticket Details Modal - Mobile Optimized */}
          <Dialog
            open={isTicketDetailsOpen}
            onOpenChange={setIsTicketDetailsOpen}
          >
            <DialogContent className="max-w-full h-full m-0 p-0 rounded-none">
              <div className="h-full flex flex-col">
                <DialogHeader className="p-4 border-b">
                  <DialogTitle className="flex items-center gap-2">
                    <TicketIcon className="h-5 w-5" />
                    Ticket Details
                  </DialogTitle>
                </DialogHeader>

                {selectedTicket && (
                  <ScrollArea className="flex-1">
                    <div className="p-4 space-y-6">
                      {/* Ticket Header */}
                      <div>
                        <h3 className="font-semibold text-lg mb-1">
                          {selectedTicket.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-3">
                          {selectedTicket.ticketNumber}
                        </p>
                        <div className="flex gap-2 mb-3">
                          <Badge
                            className={getStatusColor(selectedTicket.status)}
                          >
                            {selectedTicket.status?.replace("_", " ")}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={getPriorityColor(
                              selectedTicket.priority,
                            )}
                          >
                            {selectedTicket.priority}
                          </Badge>
                        </div>
                      </div>

                      {/* Description */}
                      <div>
                        <h4 className="font-medium mb-2">Description</h4>
                        <p className="text-sm text-muted-foreground">
                          {selectedTicket.description}
                        </p>
                      </div>

                      {/* Original Images */}
                      {selectedTicket.images &&
                        selectedTicket.images.length > 0 && (
                          <div>
                            <h4 className="font-medium mb-2">
                              Attachments ({selectedTicket.images.length})
                            </h4>
                            <div className="grid grid-cols-2 gap-2">
                              {selectedTicket.images.map((image, index) => (
                                <div
                                  key={index}
                                  className="aspect-square bg-background rounded border overflow-hidden"
                                >
                                  <img
                                    src={image}
                                    alt={`Attachment ${index + 1}`}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                      {/* Work Orders Section */}
                      <div>
                        <h4 className="font-medium mb-3">Work Orders</h4>
                        <WorkOrdersHistory
                          ticketId={selectedTicket.id}
                          open={isWorkOrderHistoryOpen}
                          onOpenChange={setIsWorkOrderHistoryOpen}
                        />
                      </div>

                      {/* Comments Section */}
                      <div>
                        <h4 className="font-medium mb-3">Comments & Updates</h4>
                        <TicketComments
                          ticket={selectedTicket}
                          userRole={user?.role}
                          userId={user?.id}
                        />
                      </div>

                      {/* Progress Tracker */}
                      <div>
                        <h4 className="font-medium mb-3">Progress</h4>
                        <ProgressTrackerEmbedded ticket={selectedTicket} />
                      </div>
                    </div>
                  </ScrollArea>
                )}

                {/* Fixed Footer with Actions */}
                <div className="p-4 border-t bg-background">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setIsTicketDetailsOpen(false)}
                  >
                    Close
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Enhanced Work Order Modal - Mobile Optimized with Proper Scrolling */}
          <Dialog open={isWorkOrderOpen} onOpenChange={setIsWorkOrderOpen}>
            <DialogContent className="max-w-full h-screen w-screen m-0 p-0 rounded-none max-h-screen">
              <div className="h-screen flex flex-col">
                {/* Fixed Header */}
                <div className="bg-background border-b p-4 flex-shrink-0 z-10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Wrench className="h-5 w-5" />
                      <h2 className="text-lg font-semibold">
                        Create Work Order
                      </h2>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsWorkOrderOpen(false)}
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                </div>

                {/* Scrollable Content */}
                {selectedTicket && (
                  <div
                    className="flex-1 overflow-y-auto bg-muted"
                    style={{
                      height: "calc(100vh - 140px)",
                      overflowY: "auto",
                      WebkitOverflowScrolling: "touch",
                    }}
                  >
                    <div className="p-4 space-y-6">
                      {/* Original Ticket Information */}
                      <div className="bg-card p-4 rounded-lg shadow-sm">
                        <h4 className="font-medium text-foreground mb-2">
                          Original Request
                        </h4>
                        <p className="text-sm text-muted-foreground mb-3">
                          {selectedTicket.description}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
                          <span>#{selectedTicket.ticketNumber}</span>
                          <span>
                            {selectedTicket.createdAt &&
                              new Date(
                                selectedTicket.createdAt,
                              ).toLocaleDateString()}
                          </span>
                        </div>

                        {/* Original Images - Clickable to Enlarge */}
                        {selectedTicket.images &&
                          selectedTicket.images.length > 0 && (
                            <div>
                              <p className="text-sm font-medium mb-2">
                                Original Photos ({selectedTicket.images.length})
                              </p>
                              <div className="grid grid-cols-3 gap-2">
                                {selectedTicket.images
                                  .slice(0, 6)
                                  .map((image, index) => (
                                    <div
                                      key={index}
                                      className="aspect-square bg-background rounded border overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                                      onClick={() =>
                                        setSelectedImageIndex(index)
                                      }
                                    >
                                      <img
                                        src={image}
                                        alt={`Original ${index + 1}`}
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                  ))}
                              </div>
                            </div>
                          )}
                      </div>

                      {/* Work Description */}
                      <div className="bg-card p-4 rounded-lg shadow-sm">
                        <Label className="text-sm font-medium text-foreground">
                          Work Description *
                        </Label>
                        <Textarea
                          placeholder="Describe the work performed in detail..."
                          className="mt-2 min-h-[100px] resize-none"
                        />
                      </div>

                      {/* Time Tracking */}
                      <div className="bg-card p-4 rounded-lg shadow-sm">
                        <h4 className="font-medium text-foreground mb-3">
                          Time Tracking
                        </h4>
                        <div className="space-y-4">
                          <div>
                            <Label className="text-sm font-medium text-muted-foreground">
                              Work Date
                            </Label>
                            <Input
                              type="date"
                              value={new Date().toISOString().split("T")[0]}
                              disabled
                              className="mt-1 bg-muted"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label className="text-sm font-medium text-muted-foreground">
                                Time In *
                              </Label>
                              <Input
                                type="time"
                                value={timeIn}
                                onChange={(e) => setTimeIn(e.target.value)}
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label className="text-sm font-medium text-muted-foreground">
                                Time Out *
                              </Label>
                              <Input
                                type="time"
                                value={timeOut}
                                onChange={(e) => setTimeOut(e.target.value)}
                                className="mt-1"
                              />
                            </div>
                          </div>

                          {/* Calculated Hours Display */}
                          {timeIn &&
                            timeOut &&
                            calculateHours(timeIn, timeOut) > 0 && (
                              <div className="bg-green-50 dark:bg-green-950 p-3 rounded-lg mt-3">
                                <div className="font-medium text-green-900 dark:text-green-100">
                                  Total Hours: {calculateHours(timeIn, timeOut)}{" "}
                                  hours
                                </div>
                              </div>
                            )}
                        </div>
                      </div>

                      {/* Parts Used */}
                      <div className="bg-card p-4 rounded-lg shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium text-foreground">
                            Parts Used
                          </h4>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setParts((prev) => [
                                ...prev,
                                { name: "", quantity: 1, cost: 0 },
                              ])
                            }
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Add Part
                          </Button>
                        </div>
                        <div className="space-y-3">
                          {parts.map((part, index) => (
                            <div
                              key={index}
                              className="p-3 border rounded-lg bg-background"
                            >
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <Label className="text-sm font-medium text-muted-foreground">
                                    Part Name
                                  </Label>
                                  {parts.length > 1 && (
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() =>
                                        setParts((prev) =>
                                          prev.filter((_, i) => i !== index),
                                        )
                                      }
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                                <Select
                                  value={
                                    part.name && part.name !== "custom"
                                      ? part.name
                                      : ""
                                  }
                                  onValueChange={(value) => {
                                    if (value === "custom") {
                                      setParts((prev) =>
                                        prev.map((p, i) =>
                                          i === index
                                            ? {
                                                ...p,
                                                name: "custom",
                                                customName: "",
                                                cost: 0,
                                              }
                                            : p,
                                        ),
                                      );
                                    } else {
                                      const selectedPart = (
                                        availableParts as any[]
                                      )?.find((p: any) => p.name === value);
                                      if (selectedPart) {
                                        const sellingPrice =
                                          calculateSellingPrice(
                                            Number(selectedPart.currentCost),
                                            Number(
                                              selectedPart.markupPercentage,
                                            ),
                                            selectedPart.roundToNinteyNine,
                                          );
                                        setParts((prev) =>
                                          prev.map((p, i) =>
                                            i === index
                                              ? {
                                                  ...p,
                                                  name: value,
                                                  cost: sellingPrice,
                                                }
                                              : p,
                                          ),
                                        );
                                      }
                                    }
                                  }}
                                >
                                  <SelectTrigger className="mt-1">
                                    <SelectValue placeholder="Select a part" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {Array.isArray(availableParts) &&
                                      availableParts.map(
                                        (availablePart: any) => (
                                          <SelectItem
                                            key={availablePart.id}
                                            value={availablePart.name}
                                          >
                                            <div className="flex flex-col">
                                              <div className="flex justify-between items-center">
                                                <span className="font-medium">
                                                  {availablePart.name}
                                                </span>
                                                <span className="text-xs text-green-600 font-medium">
                                                  $
                                                  {calculateSellingPrice(
                                                    Number(
                                                      availablePart.currentCost,
                                                    ),
                                                    Number(
                                                      availablePart.markupPercentage,
                                                    ),
                                                    availablePart.roundToNinteyNine,
                                                  ).toFixed(2)}
                                                </span>
                                              </div>
                                              {availablePart.description && (
                                                <span className="text-xs text-muted-foreground">
                                                  {availablePart.description}
                                                </span>
                                              )}
                                            </div>
                                          </SelectItem>
                                        ),
                                      )}
                                    <SelectItem value="custom">
                                      <span className="italic text-muted-foreground">
                                        Custom part...
                                      </span>
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                                {part.name === "custom" && (
                                  <div
                                    className="mt-2"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <Label className="text-xs text-muted-foreground">
                                      Custom Part Name
                                    </Label>
                                    <Input
                                      placeholder="Enter custom part name"
                                      value={part.customName || ""}
                                      onChange={(e) => {
                                        setParts((prev) =>
                                          prev.map((p, i) =>
                                            i === index
                                              ? {
                                                  ...p,
                                                  customName: e.target.value,
                                                }
                                              : p,
                                          ),
                                        );
                                      }}
                                      onClick={(e) => e.stopPropagation()}
                                      onFocus={(e) => e.stopPropagation()}
                                      className="mt-1"
                                    />
                                  </div>
                                )}
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <Label className="text-sm font-medium text-muted-foreground">
                                      Quantity
                                    </Label>
                                    <Input
                                      type="number"
                                      min="1"
                                      value={part.quantity}
                                      onChange={(e) => {
                                        const value = e.target.value;

                                        // Only update if it's a valid number or empty (allow empty so users can type freely)
                                        if (/^\d*$/.test(value)) {
                                          setParts((prev) =>
                                            prev.map((p, i) =>
                                              i === index
                                                ? {
                                                    ...p,
                                                    quantity:
                                                      value === ""
                                                        ? 0
                                                        : Number(value),
                                                  }
                                                : p,
                                            ),
                                          );
                                        }
                                      }}
                                      onBlur={() => {
                                        // On blur, ensure quantity is at least 1
                                        setParts((prev) =>
                                          prev.map((p, i) =>
                                            i === index
                                              ? {
                                                  ...p,
                                                  quantity:
                                                    Number(p.quantity) < 1
                                                      ? 1
                                                      : Number(p.quantity),
                                                }
                                              : p,
                                          ),
                                        );
                                      }}
                                      onKeyDown={(e) => {
                                        if (
                                          ["e", "E", "+", "-", "."].includes(
                                            e.key,
                                          )
                                        ) {
                                          e.preventDefault();
                                        }
                                      }}
                                      className="mt-1"
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium text-muted-foreground">
                                      {part.name === "custom"
                                        ? "Selling Price ($)"
                                        : "Selling Price (Auto-filled)"}
                                    </Label>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      value={part.cost}
                                      disabled={part.name !== "custom"}
                                      onChange={(e) =>
                                        setParts((prev) =>
                                          prev.map((p, i) =>
                                            i === index
                                              ? {
                                                  ...p,
                                                  cost:
                                                    parseFloat(
                                                      e.target.value,
                                                    ) || 0,
                                                }
                                              : p,
                                          ),
                                        )
                                      }
                                      placeholder="0.00"
                                      className={
                                        part.name !== "custom"
                                          ? "mt-1 bg-muted text-muted-foreground"
                                          : "mt-1"
                                      }
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        {parts.length > 0 && (
                          <div className="text-right font-medium text-sm mt-2">
                            <div className="text-foreground/80">
                              Parts Subtotal: $
                              {calculatePartsTotal(parts).toFixed(2)}
                            </div>
                            <div className="text-foreground/60 text-xs">
                              (
                              {
                                parts.filter((p) => p.name && p.quantity > 0)
                                  .length
                              }{" "}
                              item
                              {parts.filter((p) => p.name && p.quantity > 0)
                                .length !== 1
                                ? "s"
                                : ""}
                              )
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Note: Other Charges section removed for technicians as per web version */}

                      {/* Completion Status */}
                      <div className="bg-card p-4 rounded-lg shadow-sm">
                        <Label className="text-sm font-medium text-foreground">
                          Completion Status *
                        </Label>
                        <Select
                          value={completionStatus}
                          onValueChange={(
                            value: "completed" | "return_needed",
                          ) => setCompletionStatus(value)}
                        >
                          <SelectTrigger className="mt-2">
                            <SelectValue placeholder="Select completion status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="return_needed">
                              Return Visit Needed
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Completion Notes */}
                      <div className="bg-card p-4 rounded-lg shadow-sm">
                        <Label className="text-sm font-medium text-foreground">
                          Completion Notes *
                        </Label>
                        <Textarea
                          placeholder="Provide detailed notes about the work completion..."
                          className="mt-2 min-h-[80px] resize-none"
                        />
                      </div>

                      {/* Work Completion Photos */}
                      <div className="bg-card p-4 rounded-lg shadow-sm">
                        <Label className="text-sm font-medium text-foreground">
                          Work Completion Photos
                        </Label>
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-2">
                            {uploadedImages.map((image, index) => (
                              <div key={index} className="relative group">
                                <img
                                  src={image.url}
                                  alt={`Uploaded ${index + 1}`}
                                  className="h-24 w-full object-cover rounded-md cursor-pointer hover:opacity-80 transition-opacity"
                                  onClick={() =>
                                    setSelectedImageForViewer(image.url)
                                  }
                                />
                                <button
                                  type="button"
                                  onClick={() => handleRemoveImage(index)}
                                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            ))}
                            {uploadingImg && (
                              <div className="flex items-center justify-center">
                                <Loader2 className="h-6 w-6 animate-spin" />
                                <p className="ml-2 text-sm text-muted-foreground">
                                  Uploading...
                                </p>
                              </div>
                            )}
                          </div>
                          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 text-center">
                            <input
                              type="file"
                              ref={fileInputRef}
                              onChange={handleFileInputChange}
                              accept="image/*,video/*"
                              multiple
                              className="hidden"
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              className="w-full"
                            >
                              <Camera className="h-4 w-4 mr-2" />
                              {uploadedImages.length > 0
                                ? "Add More Photos"
                                : "Take Photos"}
                            </Button>
                            <p className="text-xs text-muted-foreground mt-2">
                              Upload images or videos of completed work
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Manager Verification with Working Signature Canvas */}
                      <div className="bg-card p-4 rounded-lg shadow-sm">
                        <h4 className="font-medium text-foreground mb-3">
                          Manager Verification
                        </h4>
                        <div className="space-y-4">
                          <div>
                            <Label className="text-sm font-medium text-muted-foreground">
                              Manager Name *
                            </Label>
                            <Input
                              placeholder="Enter manager's full name"
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-muted-foreground">
                              Manager Signature *
                            </Label>
                            <div className="mt-2 space-y-2">
                              <canvas
                                width={300}
                                height={150}
                                className="border-2 border-border rounded-lg bg-white touch-none w-full max-w-sm"
                                style={{ touchAction: "none" }}
                                onMouseDown={(e) => {
                                  const canvas = e.currentTarget;
                                  const rect = canvas.getBoundingClientRect();
                                  const ctx = canvas.getContext("2d");
                                  if (ctx) {
                                    ctx.strokeStyle = "#000000";
                                    ctx.lineWidth = 2;
                                    ctx.lineCap = "round";
                                    ctx.beginPath();
                                    ctx.moveTo(
                                      e.clientX - rect.left,
                                      e.clientY - rect.top,
                                    );
                                    canvas.setAttribute("data-drawing", "true");
                                  }
                                }}
                                onMouseMove={(e) => {
                                  const canvas = e.currentTarget;
                                  if (
                                    canvas.getAttribute("data-drawing") ===
                                    "true"
                                  ) {
                                    const rect = canvas.getBoundingClientRect();
                                    const ctx = canvas.getContext("2d");
                                    if (ctx) {
                                      ctx.lineTo(
                                        e.clientX - rect.left,
                                        e.clientY - rect.top,
                                      );
                                      ctx.stroke();
                                    }
                                  }
                                }}
                                onMouseUp={(e) => {
                                  const canvas = e.currentTarget;
                                  canvas.setAttribute("data-drawing", "false");
                                }}
                                onTouchStart={(e) => {
                                  e.preventDefault();
                                  const touch = e.touches[0];
                                  const canvas = e.currentTarget;
                                  const rect = canvas.getBoundingClientRect();
                                  const ctx = canvas.getContext("2d");
                                  if (ctx && touch) {
                                    ctx.strokeStyle = "#000000";
                                    ctx.lineWidth = 2;
                                    ctx.lineCap = "round";
                                    ctx.beginPath();
                                    ctx.moveTo(
                                      touch.clientX - rect.left,
                                      touch.clientY - rect.top,
                                    );
                                    canvas.setAttribute("data-drawing", "true");
                                  }
                                }}
                                onTouchMove={(e) => {
                                  e.preventDefault();
                                  const canvas = e.currentTarget;
                                  if (
                                    canvas.getAttribute("data-drawing") ===
                                    "true"
                                  ) {
                                    const touch = e.touches[0];
                                    if (touch) {
                                      const rect =
                                        canvas.getBoundingClientRect();
                                      const ctx = canvas.getContext("2d");
                                      if (ctx) {
                                        ctx.lineTo(
                                          touch.clientX - rect.left,
                                          touch.clientY - rect.top,
                                        );
                                        ctx.stroke();
                                      }
                                    }
                                  }
                                }}
                                onTouchEnd={(e) => {
                                  e.preventDefault();
                                  const canvas = e.currentTarget;
                                  canvas.setAttribute("data-drawing", "false");
                                }}
                              />
                              <div className="flex gap-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    const canvas = e.currentTarget.parentElement
                                      ?.previousElementSibling as HTMLCanvasElement;
                                    if (canvas) {
                                      const ctx = canvas.getContext("2d");
                                      if (ctx) {
                                        ctx.clearRect(
                                          0,
                                          0,
                                          canvas.width,
                                          canvas.height,
                                        );
                                      }
                                    }
                                  }}
                                >
                                  Clear Signature
                                </Button>
                                <p className="text-xs text-muted-foreground flex items-center">
                                  Sign with finger or stylus
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Extra padding at bottom for safe scrolling */}
                      <div className="h-4"></div>
                    </div>
                  </div>
                )}

                {/* Fixed Footer */}
                <div className="bg-background border-t p-4 flex-shrink-0">
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setIsWorkOrderOpen(false)}
                      disabled={submitWorkOrderMutation.isPending}
                    >
                      Cancel
                    </Button>
                    <Button
                      className="flex-1"
                      onClick={handleWorkOrderSubmit}
                      disabled={submitWorkOrderMutation.isPending}
                    >
                      {submitWorkOrderMutation.isPending ? (
                        <span className="flex items-center">
                          <svg
                            className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          Submitting...
                        </span>
                      ) : (
                        "Submit Work Order"
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Image Enlargement Modal with better exit functionality */}
          {selectedImageIndex !== null && selectedTicket?.images && (
            <Dialog
              open={true}
              onOpenChange={() => setSelectedImageIndex(null)}
            >
              <DialogContent className="max-w-full h-full m-0 p-0 rounded-none">
                <div
                  className="relative h-full bg-black flex items-center justify-center"
                  onClick={() => setSelectedImageIndex(null)}
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-4 right-4 z-10 text-white hover:bg-white/20 bg-black/50"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedImageIndex(null);
                    }}
                  >
                    <X className="h-6 w-6" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-4 left-4 z-10 text-white hover:bg-white/20 bg-black/50"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedImageIndex(null);
                    }}
                  >
                    <ArrowLeft className="h-6 w-6" />
                  </Button>
                  <img
                    src={selectedTicket.images[selectedImageIndex]}
                    alt={`Original ${selectedImageIndex + 1}`}
                    className="max-w-full max-h-full object-contain"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white bg-black/50 px-3 py-1 rounded">
                    {selectedImageIndex + 1} of {selectedTicket.images.length}
                  </div>
                  <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 text-white text-sm opacity-80">
                    Tap anywhere to close
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}

          <EnhancedInvoiceCreator
            open={isInvoiceCreatorOpen}
            onOpenChange={(open) => {
              setIsInvoiceCreatorOpen(open);
              if (!open) {
                setSelectedTicket(null);
              }
            }}
            ticket={selectedTicket}
            onSubmit={(data) => {
              console.log("Submit invoice:", data);
              setIsInvoiceCreatorOpen(false);
              setSelectedTicket(null);
              refetchTickets();
            }}
            isLoading={false}
            workOrders={
              selectedTicket
                ? allTicketsWorkOrders[selectedTicket.id] || []
                : []
            }
            vendor={null}
            organization={null}
            location={null}
          />
        </>
      )}

      {/* Create Ticket Modal - Mobile Optimized */}
      <Dialog open={isCreateTicketOpen} onOpenChange={setIsCreateTicketOpen}>
        <DialogContent className="max-w-full h-full m-0 p-0 rounded-none">
          <MobileCreateTicketForm
            onClose={() => setIsCreateTicketOpen(false)}
            onSuccess={() => {
              setIsCreateTicketOpen(false);
              refetchTickets();
            }}
            user={user}
          />
        </DialogContent>
      </Dialog>

      {/* Image Viewer Modal */}
      <Dialog
        open={!!selectedImageForViewer}
        onOpenChange={() => setSelectedImageForViewer(null)}
      >
        <DialogContent className="max-w-full h-full m-0 p-0 bg-black/95 border-0 rounded-none">
          <div className="relative w-full h-full flex items-center justify-center">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 z-10 text-white bg-black/50 hover:bg-black/70 rounded-full"
              onClick={() => setSelectedImageForViewer(null)}
            >
              <X className="h-6 w-6" />
            </Button>
            {selectedImageForViewer && (
              <img
                src={selectedImageForViewer}
                alt="Full size view"
                className="max-w-full max-h-full object-contain"
                onClick={() => setSelectedImageForViewer(null)}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Calendar-related modals */}

      <CreateEventModal
        open={isCreateEventModalOpen}
        onOpenChange={setIsCreateEventModalOpen}
        defaultDate={selectedCalendarDateForEvent}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["/api/calendar/events"] });
          setIsCreateEventModalOpen(false);
          setSelectedCalendarDateForEvent(null);
          toast({
            title: "Success",
            description: "Event created successfully!",
          });
        }}
      />

      <AvailabilityConfigModal
        isOpen={isAvailabilityConfigOpen}
        onClose={() => setIsAvailabilityConfigOpen(false)}
      />

      {/* Time Slot Booking Modal */}
      <Dialog
        open={showTimeSlotBooking}
        onOpenChange={() => {
          setShowTimeSlotBooking(false);
          setBookingDate(null);
          setSelectedTimeSlot(null);
          setBookingForm({ title: "", description: "", location: "" });
          setLocationSuggestions([]);
          setShowLocationSuggestions(false);
          if (locationSearchTimeout) {
            clearTimeout(locationSearchTimeout);
            setLocationSearchTimeout(null);
          }
        }}
      >
        <DialogContent className="max-w-full h-screen m-0 p-0 rounded-none border-0">
          <div className="h-screen flex flex-col bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/20 bg-gradient-to-r from-blue-600 to-purple-600 text-white flex-shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowTimeSlotBooking(false);
                  setBookingDate(null);
                  setSelectedTimeSlot(null);
                  setBookingForm({ title: "", description: "", location: "" });
                  setLocationSuggestions([]);
                  setShowLocationSuggestions(false);
                  if (locationSearchTimeout) {
                    clearTimeout(locationSearchTimeout);
                    setLocationSearchTimeout(null);
                  }
                }}
                className="p-2 text-white hover:bg-white/10"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="text-center">
                <h2 className="text-lg font-semibold text-white">
                  Book Time Slot
                </h2>
                <p className="text-sm text-blue-100">
                  {bookingDate ? format(bookingDate, "EEEE, MMM d, yyyy") : ""}
                </p>
              </div>
              <div className="w-10" /> {/* Spacer */}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-48">
              {/* Duration Selection */}
              <div className="space-y-3">
                <Label className="text-sm font-medium text-white">
                  Duration
                </Label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { value: 0.25, label: "15m" },
                    { value: 0.5, label: "30m" },
                    { value: 1, label: "1h" },
                    { value: 2, label: "2h" },
                    { value: 3, label: "3h" },
                    { value: 4, label: "4h" },
                  ].map((duration) => (
                    <Button
                      key={duration.value}
                      type="button"
                      variant={
                        selectedDuration === duration.value
                          ? "default"
                          : "outline"
                      }
                      size="sm"
                      onClick={() => {
                        setSelectedDuration(duration.value);
                        setSelectedTimeSlot(null);
                      }}
                      className={
                        selectedDuration === duration.value
                          ? "bg-teal-500 text-white border-teal-500"
                          : "bg-white/10 text-white border-white/20 hover:bg-white/20"
                      }
                    >
                      {duration.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Time Slots */}
              <div className="space-y-3">
                <Label className="text-sm font-medium text-white">
                  Available Time Slots
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  {generateTimeSlots().map((slot, index) => {
                    const isAvailable = isTimeSlotAvailable(
                      slot.start,
                      slot.end,
                    );
                    const isSelected =
                      selectedTimeSlot?.start === slot.start &&
                      selectedTimeSlot?.end === slot.end;
                    return (
                      <Button
                        key={index}
                        type="button"
                        variant={isSelected ? "default" : "outline"}
                        size="sm"
                        disabled={!isAvailable}
                        onClick={() =>
                          setSelectedTimeSlot(
                            isSelected
                              ? null
                              : { start: slot.start, end: slot.end },
                          )
                        }
                        className={`${
                          !isAvailable
                            ? "bg-red-500/20 text-red-300 border-red-500/30 cursor-not-allowed"
                            : isSelected
                              ? "bg-purple-500 text-white border-purple-500"
                              : "bg-white/10 text-white border-white/20 hover:bg-white/20"
                        }`}
                      >
                        {slot.label}
                        {!isAvailable && " (Booked)"}
                      </Button>
                    );
                  })}
                </div>
              </div>

              {/* Event Details Form */}
              {selectedTimeSlot && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-white">
                      Title *
                    </Label>
                    <Input
                      value={bookingForm.title}
                      onChange={(e) =>
                        setBookingForm((prev) => ({
                          ...prev,
                          title: e.target.value,
                        }))
                      }
                      placeholder="Event title"
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-white">
                      Description
                    </Label>
                    <Textarea
                      value={bookingForm.description}
                      onChange={(e) =>
                        setBookingForm((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      placeholder="Event description (optional)"
                      rows={3}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
                    />
                  </div>

                  <div className="space-y-2 relative">
                    <Label className="text-sm font-medium text-white">
                      Location
                    </Label>
                    <div className="relative">
                      <Input
                        value={bookingForm.location}
                        onChange={(e) => {
                          const query = e.target.value;
                          setBookingForm((prev) => ({
                            ...prev,
                            location: query,
                          }));

                          // Clear existing timeout
                          if (locationSearchTimeout) {
                            clearTimeout(locationSearchTimeout);
                          }

                          if (query.length >= 2) {
                            setLocationSearchLoading(true);
                            const timeout = setTimeout(async () => {
                              try {
                                const response = await fetch(
                                  `/api/places/search?q=${encodeURIComponent(query)}`,
                                );
                                const data = await response.json();
                                setLocationSuggestions(
                                  data.predictions
                                    ?.slice(0, 5)
                                    .map((p: any) => p.description) || [],
                                );
                                setShowLocationSuggestions(true);
                              } catch (error) {
                                console.error(
                                  "Error fetching locations:",
                                  error,
                                );
                                setLocationSuggestions([]);
                              } finally {
                                setLocationSearchLoading(false);
                              }
                            }, 300);
                            setLocationSearchTimeout(timeout);
                          } else {
                            setLocationSuggestions([]);
                            setShowLocationSuggestions(false);
                            setLocationSearchLoading(false);
                          }
                        }}
                        placeholder="Event location (optional)"
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
                      />

                      {/* Location Suggestions Dropdown */}
                      {showLocationSuggestions &&
                        locationSuggestions.length > 0 && (
                          <div className="absolute top-full left-0 right-0 bg-white/95 backdrop-blur-sm border border-white/20 rounded-md mt-1 max-h-48 overflow-y-auto z-50">
                            {locationSuggestions.map((suggestion, index) => (
                              <button
                                key={index}
                                className="w-full px-3 py-2 text-left text-sm text-gray-800 hover:bg-blue-100 first:rounded-t-md last:rounded-b-md"
                                onClick={() => {
                                  setBookingForm((prev) => ({
                                    ...prev,
                                    location: suggestion,
                                  }));
                                  setLocationSuggestions([]);
                                  setShowLocationSuggestions(false);
                                }}
                              >
                                {suggestion}
                              </button>
                            ))}
                          </div>
                        )}

                      {locationSearchLoading && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <Loader2 className="h-4 w-4 animate-spin text-white/60" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            {selectedTimeSlot && (
              <div className="fixed bottom-0 left-0 right-0 p-4 border-t border-white/20 bg-gradient-to-r from-slate-900/95 to-purple-900/95 backdrop-blur-md z-50">
                <div className="mb-3 p-3 bg-blue-500/20 border border-blue-400/30 rounded">
                  <p className="text-sm font-medium text-blue-100">
                    Selected: {formatTime(selectedTimeSlot.start)} -{" "}
                    {formatTime(selectedTimeSlot.end)}
                  </p>
                  <p className="text-xs text-blue-200">
                    Duration:{" "}
                    {selectedDuration >= 1
                      ? `${selectedDuration} hour${selectedDuration > 1 ? "s" : ""}`
                      : `${selectedDuration * 60} minutes`}
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowTimeSlotBooking(false);
                      setBookingDate(null);
                      setSelectedTimeSlot(null);
                      setBookingForm({
                        title: "",
                        description: "",
                        location: "",
                      });
                      setLocationSuggestions([]);
                      setShowLocationSuggestions(false);
                      if (locationSearchTimeout) {
                        clearTimeout(locationSearchTimeout);
                        setLocationSearchTimeout(null);
                      }
                    }}
                    className="flex-1 border-white/20 text-white hover:bg-white/10"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={async () => {
                      if (!bookingForm.title.trim()) {
                        toast({
                          title: "Error",
                          description: "Please enter a title for the event",
                          variant: "destructive",
                        });
                        return;
                      }

                      if (!bookingDate || !selectedTimeSlot) {
                        toast({
                          title: "Error",
                          description: "Please select a date and time slot",
                          variant: "destructive",
                        });
                        return;
                      }

                      try {
                        const eventData = {
                          title: bookingForm.title,
                          description: bookingForm.description || "",
                          eventType: "personal",
                          startDate: format(bookingDate, "yyyy-MM-dd"),
                          endDate: format(bookingDate, "yyyy-MM-dd"),
                          startTime: selectedTimeSlot.start,
                          endTime: selectedTimeSlot.end,
                          isAllDay: false,
                          priority: "medium",
                          location: bookingForm.location || "",
                          color: "#3B82F6",
                          timezone: "America/New_York",
                          isAvailability: false,
                          status: "confirmed",
                        };

                        await apiRequest(
                          "POST",
                          "/api/calendar/events",
                          eventData,
                        );

                        toast({
                          title: "Success",
                          description: "Event booked successfully!",
                        });

                        // Invalidate calendar events
                        queryClient.invalidateQueries({
                          queryKey: ["/api/calendar/events"],
                        });

                        // Close modal and reset state
                        setShowTimeSlotBooking(false);
                        setBookingDate(null);
                        setSelectedTimeSlot(null);
                        setBookingForm({
                          title: "",
                          description: "",
                          location: "",
                        });
                        setLocationSuggestions([]);
                        setShowLocationSuggestions(false);
                        if (locationSearchTimeout) {
                          clearTimeout(locationSearchTimeout);
                          setLocationSearchTimeout(null);
                        }

                        // Switch to day view to show the new event
                        setCalendarView("day");
                      } catch (error) {
                        console.error("Error creating event:", error);
                        toast({
                          title: "Error",
                          description:
                            "Failed to book event. Please try again.",
                          variant: "destructive",
                        });
                      }
                    }}
                    className="flex-1 bg-gradient-to-r from-teal-500 to-blue-600 text-white hover:from-teal-600 hover:to-blue-700 border-0"
                  >
                    Book Event
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MobilePage;
