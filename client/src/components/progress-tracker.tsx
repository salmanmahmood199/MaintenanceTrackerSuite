import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, Clock, AlertTriangle, Wrench, FileText, User, Calendar, MessageSquare, Building, UserCheck, XCircle, ArrowRight, Info, ClipboardList, CheckSquare } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { format } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Ticket, TicketMilestone } from "@shared/schema";

interface ProgressTrackerProps {
  ticket: Ticket;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canUpdate?: boolean;
}

// Define the complete ticket journey with detailed progress stages
const ticketJourneyStages = [
  { key: "submitted", label: "Ticket Submitted", description: "Initial ticket creation", icon: FileText, color: "bg-blue-100 text-blue-800" },
  { key: "under_review", label: "Under Review", description: "Office reviewing ticket details", icon: Clock, color: "bg-yellow-100 text-yellow-800" },
  { key: "accepted", label: "Accepted by Office", description: "Ticket approved and ready for vendor assignment", icon: CheckCircle, color: "bg-green-100 text-green-800" },
  { key: "vendor_assigned", label: "Vendor Assigned", description: "Maintenance vendor selected and assigned", icon: Building, color: "bg-purple-100 text-purple-800" },
  { key: "vendor_accepted", label: "Vendor Accepted", description: "Vendor confirmed and accepted the work", icon: UserCheck, color: "bg-indigo-100 text-indigo-800" },
  { key: "technician_assigned", label: "Technician Assigned", description: "Specific technician assigned to the job", icon: User, color: "bg-cyan-100 text-cyan-800" },
  { key: "work_started", label: "Work Started", description: "Technician began working on the issue", icon: Wrench, color: "bg-orange-100 text-orange-800" },
  { key: "in_progress", label: "Work in Progress", description: "Active repair/maintenance work ongoing", icon: AlertTriangle, color: "bg-amber-100 text-amber-800" },
  { key: "work_completed", label: "Work Completed", description: "Technician completed the work", icon: CheckSquare, color: "bg-emerald-100 text-emerald-800" },
  { key: "pending_confirmation", label: "Pending Confirmation", description: "Awaiting requester approval", icon: Clock, color: "bg-slate-100 text-slate-800" },
  { key: "confirmed", label: "Confirmed", description: "Work confirmed and approved by requester", icon: CheckCircle, color: "bg-green-100 text-green-800" },
  { key: "billed", label: "Billed", description: "Invoice generated and sent", icon: ClipboardList, color: "bg-gray-100 text-gray-800" },
];

const rejectionStages = [
  { key: "rejected_by_office", label: "Rejected by Office", description: "Ticket rejected during initial review", icon: XCircle, color: "bg-red-100 text-red-800" },
  { key: "rejected_by_vendor", label: "Rejected by Vendor", description: "Vendor declined to accept the work", icon: XCircle, color: "bg-red-100 text-red-800" },
];

// Embedded version for tab content
export function ProgressTrackerEmbedded({ 
  ticket, 
  canUpdate = false 
}: { ticket: Ticket; canUpdate?: boolean }) {
  if (!ticket) return null;
  
  const [selectedMilestone, setSelectedMilestone] = useState("");
  const [milestoneDescription, setMilestoneDescription] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch milestones for this ticket
  const { data: milestones = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/tickets", ticket.id, "milestones"],
  });

  // Fetch ticket details with related data
  const { data: ticketDetails, isLoading: isLoadingDetails } = useQuery<any>({
    queryKey: ["/api/tickets", ticket.id, "details"],
  });

  // Calculate progress percentage based on ticket status
  const getProgressPercentage = (status: string) => {
    switch (status) {
      case "pending": return 10;
      case "accepted": return 25;
      case "rejected": return 0;
      case "in-progress": return 60;
      case "completed": return 85;
      case "pending_confirmation": return 90;
      case "confirmed": return 95;
      case "ready_for_billing": return 98;
      case "billed": return 100;
      default: return 0;
    }
  };

  // Get current stage information
  const getCurrentStage = (status: string) => {
    return ticketJourneyStages.find(stage => 
      stage.key === status || 
      (status === "pending" && stage.key === "submitted") ||
      (status === "accepted" && stage.key === "accepted") ||
      (status === "rejected" && stage.key === "rejected_by_office") ||
      (status === "in-progress" && stage.key === "in_progress") ||
      (status === "completed" && stage.key === "work_completed") ||
      (status === "pending_confirmation" && stage.key === "pending_confirmation") ||
      (status === "confirmed" && stage.key === "confirmed") ||
      (status === "ready_for_billing" && stage.key === "confirmed") ||
      (status === "billed" && stage.key === "billed")
    ) || ticketJourneyStages[0];
  };

  // Get relevant stages for current ticket status
  const getRelevantStages = (status: string) => {
    const mainStages = [
      ticketJourneyStages.find(s => s.key === "submitted"),
      ticketJourneyStages.find(s => s.key === "accepted"),
      ticketJourneyStages.find(s => s.key === "in_progress"),
      ticketJourneyStages.find(s => s.key === "work_completed"),
      ticketJourneyStages.find(s => s.key === "billed")
    ].filter(Boolean);
    return mainStages;
  };

  // Check if stage is completed
  const isStageCompleted = (stageKey: string, currentStatus: string) => {
    const stageOrder = ["submitted", "accepted", "in_progress", "work_completed", "billed"];
    const currentOrder = ["pending", "accepted", "in-progress", "completed", "billed"];
    
    const stageIndex = stageOrder.indexOf(stageKey);
    const currentIndex = currentOrder.indexOf(currentStatus);
    
    if (stageKey === "submitted") return true; // Always completed
    if (stageKey === "accepted" && ["accepted", "in-progress", "completed", "billed"].includes(currentStatus)) return true;
    if (stageKey === "in_progress" && ["in-progress", "completed", "billed"].includes(currentStatus)) return true;
    if (stageKey === "work_completed" && ["completed", "billed"].includes(currentStatus)) return true;
    if (stageKey === "billed" && currentStatus === "billed") return true;
    
    return false;
  };

  // Check if stage is current
  const isCurrentStage = (stageKey: string, currentStatus: string) => {
    if (stageKey === "submitted" && currentStatus === "pending") return true;
    if (stageKey === "accepted" && currentStatus === "accepted") return true;
    if (stageKey === "in_progress" && currentStatus === "in-progress") return true;
    if (stageKey === "work_completed" && currentStatus === "completed") return true;
    if (stageKey === "billed" && currentStatus === "billed") return true;
    return false;
  };

  const progressPercentage = getProgressPercentage(ticket.status);
  const currentStage = getCurrentStage(ticket.status);

  // Create detailed timeline events from ticket data
  const createTimelineEvents = () => {
    const events = [];
    
    // 1. Ticket Submitted
    events.push({
      id: 'submitted',
      title: 'Ticket Submitted',
      timestamp: ticket.createdAt,
      user: ticketDetails?.reporter,
      description: 'Initial ticket creation and submission',
      status: 'completed',
      icon: FileText,
      details: {
        ticketNumber: ticket.ticketNumber,
        priority: ticket.priority,
        description: ticket.description?.substring(0, 100) + (ticket.description?.length > 100 ? '...' : '')
      }
    });

    // 2. Under Review (if status progressed past pending)
    if (['accepted', 'in-progress', 'completed', 'confirmed', 'ready_for_billing', 'billed'].includes(ticket.status)) {
      events.push({
        id: 'under_review',
        title: 'Under Review',
        timestamp: ticket.updatedAt, // Approximate
        user: null,
        description: `Organization ${ticketDetails?.organization?.name || 'Unknown'} reviewing ticket details`,
        status: 'completed',
        icon: Clock,
        details: {
          organization: ticketDetails?.organization?.name,
          reviewType: 'Initial assessment and prioritization'
        }
      });
    }

    // 3. Ticket Accepted
    if (['accepted', 'in-progress', 'completed', 'confirmed', 'ready_for_billing', 'billed'].includes(ticket.status)) {
      events.push({
        id: 'accepted',
        title: 'Ticket Accepted',
        timestamp: ticket.acceptedAt || ticket.updatedAt,
        user: null,
        description: `Approved by organization admin and ready for vendor assignment`,
        status: 'completed',
        icon: CheckCircle,
        details: {
          acceptedBy: 'Organization Admin',
          nextStep: 'Vendor assignment pending'
        }
      });
    }

    // 4. Vendor Assigned
    if (ticket.maintenanceVendorId && ['accepted', 'in-progress', 'completed', 'confirmed', 'ready_for_billing', 'billed'].includes(ticket.status)) {
      events.push({
        id: 'vendor_assigned',
        title: 'Vendor Assigned',
        timestamp: ticket.vendorAssignedAt || ticket.updatedAt,
        user: null,
        description: `${ticketDetails?.maintenanceVendor?.name || 'Vendor'} selected for maintenance work`,
        status: 'completed',
        icon: Building,
        details: {
          vendor: ticketDetails?.maintenanceVendor?.name,
          specialties: ticketDetails?.maintenanceVendor?.specialties || 'General maintenance',
          contact: ticketDetails?.maintenanceVendor?.contactInfo
        }
      });
    }

    // 5. Vendor Accepted Work
    if (ticket.maintenanceVendorId && ['in-progress', 'completed', 'confirmed', 'ready_for_billing', 'billed'].includes(ticket.status)) {
      events.push({
        id: 'vendor_accepted',
        title: 'Vendor Accepted Work',
        timestamp: ticket.vendorAcceptedAt || ticket.updatedAt,
        user: null,
        description: `${ticketDetails?.maintenanceVendor?.name || 'Vendor'} confirmed availability and accepted the work`,
        status: 'completed',
        icon: UserCheck,
        details: {
          vendor: ticketDetails?.maintenanceVendor?.name,
          estimatedStartTime: 'Within 24-48 hours',
          priority: ticket.priority
        }
      });
    }

    // 6. Technician Assigned
    if (ticket.assigneeId && ['in-progress', 'completed', 'confirmed', 'ready_for_billing', 'billed'].includes(ticket.status)) {
      events.push({
        id: 'technician_assigned',
        title: 'Technician Assigned',
        timestamp: ticket.technicianAssignedAt || ticket.updatedAt,
        user: ticketDetails?.assignee,
        description: `${ticketDetails?.assignee?.firstName || 'Technician'} ${ticketDetails?.assignee?.lastName || ''} assigned to handle the work`,
        status: 'completed',
        icon: User,
        details: {
          technician: `${ticketDetails?.assignee?.firstName || 'Unknown'} ${ticketDetails?.assignee?.lastName || ''}`,
          email: ticketDetails?.assignee?.email,
          phone: ticketDetails?.assignee?.phone || 'Contact through vendor',
          estimatedArrival: 'Will be scheduled soon'
        }
      });
    }

    // 7. Work Started
    if (['in-progress', 'completed', 'confirmed', 'ready_for_billing', 'billed'].includes(ticket.status)) {
      events.push({
        id: 'work_started',
        title: 'Work Started',
        timestamp: ticket.workStartedAt || ticket.updatedAt,
        user: ticketDetails?.assignee,
        description: `${ticketDetails?.assignee?.firstName || 'Technician'} arrived on-site and began diagnostic work`,
        status: ticket.status === 'in-progress' ? 'current' : 'completed',
        icon: Wrench,
        details: {
          technician: `${ticketDetails?.assignee?.firstName || 'Unknown'} ${ticketDetails?.assignee?.lastName || ''}`,
          workOrderCount: ticketDetails?.workOrders?.length || 0,
          currentActivity: ticket.status === 'in-progress' ? 'Active repair work in progress' : 'Work completed'
        }
      });
    }

    // 8. Work Completed
    if (['completed', 'pending_confirmation', 'confirmed', 'ready_for_billing', 'billed'].includes(ticket.status)) {
      events.push({
        id: 'work_completed',
        title: 'Work Completed',
        timestamp: ticket.completedAt || ticket.updatedAt,
        user: ticketDetails?.assignee,
        description: `All repair work finished. Awaiting customer confirmation and approval`,
        status: ticket.status === 'completed' || ticket.status === 'pending_confirmation' ? 'current' : 'completed',
        icon: CheckSquare,
        details: {
          completedBy: `${ticketDetails?.assignee?.firstName || 'Unknown'} ${ticketDetails?.assignee?.lastName || ''}`,
          workOrders: ticketDetails?.workOrders?.length || 0,
          nextStep: ticket.status === 'pending_confirmation' ? 'Waiting for customer confirmation' : 'Work confirmed'
        }
      });
    }

    // 9. Customer Confirmation
    if (['confirmed', 'ready_for_billing', 'billed'].includes(ticket.status)) {
      events.push({
        id: 'confirmed',
        title: 'Work Confirmed',
        timestamp: ticket.confirmedAt || ticket.updatedAt,
        user: ticketDetails?.reporter,
        description: `Customer confirmed work completion and quality. Ready for billing process`,
        status: 'completed',
        icon: CheckCircle,
        details: {
          confirmedBy: `${ticketDetails?.reporter?.firstName || 'Customer'} ${ticketDetails?.reporter?.lastName || ''}`,
          satisfaction: 'Work approved',
          nextStep: 'Invoice generation'
        }
      });
    }

    // 10. Invoice Generated & Billed
    if (ticket.status === 'billed') {
      events.push({
        id: 'billed',
        title: 'Invoiced & Billed',
        timestamp: ticket.billedAt || ticket.updatedAt,
        user: null,
        description: `Invoice generated and sent. Ticket workflow complete`,
        status: 'completed',
        icon: ClipboardList,
        details: {
          invoiceNumber: `INV-${ticket.id}-${new Date().getFullYear()}`,
          vendor: ticketDetails?.maintenanceVendor?.name,
          status: 'Invoice sent to organization'
        }
      });
    }

    return events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  };

  const timelineEvents = createTimelineEvents();

  return (
    <div className="space-y-6">
      {/* Detailed Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <ClipboardList className="h-6 w-6 text-blue-600" />
            Complete Ticket Journey Timeline
          </CardTitle>
          <p className="text-sm text-slate-600">
            Detailed step-by-step progress with timestamps, personnel, and actions
          </p>
        </CardHeader>
        <CardContent>
          <div className="relative">
            {/* Vertical Timeline Line */}
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-slate-200"></div>
            
            {timelineEvents.map((event, index) => {
              const IconComponent = event.icon;
              const isCompleted = event.status === 'completed';
              const isCurrent = event.status === 'current';
              
              return (
                <div key={event.id} className="relative flex items-start space-x-4 pb-8 last:pb-0">
                  {/* Timeline Circle */}
                  <div className={`
                    relative z-10 flex items-center justify-center w-16 h-16 rounded-full border-4 shrink-0
                    ${isCompleted 
                      ? 'bg-green-500 border-green-500 text-white shadow-lg' 
                      : isCurrent 
                        ? 'bg-blue-500 border-blue-500 text-white shadow-xl animate-pulse'
                        : 'bg-slate-200 border-slate-300 text-slate-400'
                    }
                  `}>
                    <IconComponent className="h-8 w-8" />
                  </div>
                  
                  {/* Event Details */}
                  <div className="flex-1 min-w-0 pt-2">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className={`text-lg font-semibold ${
                        isCompleted || isCurrent ? 'text-slate-900' : 'text-slate-500'
                      }`}>
                        {event.title}
                      </h3>
                      <Badge className={`
                        ${isCompleted 
                          ? 'bg-green-100 text-green-800' 
                          : isCurrent 
                            ? 'bg-blue-100 text-blue-800 animate-pulse'
                            : 'bg-slate-100 text-slate-600'
                        }
                      `}>
                        {isCompleted ? 'Completed' : isCurrent ? 'In Progress' : 'Pending'}
                      </Badge>
                    </div>
                    
                    <p className="text-slate-600 mb-3">{event.description}</p>
                    
                    {/* Timestamp */}
                    <div className="flex items-center gap-2 text-sm text-slate-500 mb-3">
                      <Calendar className="h-4 w-4" />
                      <span>{event.timestamp ? format(new Date(event.timestamp), 'MMM dd, yyyy • h:mm a') : 'Timestamp pending'}</span>
                    </div>
                    
                    {/* Person Responsible */}
                    {event.user && (
                      <div className="flex items-center gap-2 text-sm text-slate-700 mb-3">
                        <User className="h-4 w-4" />
                        <span className="font-medium">
                          {event.user.firstName} {event.user.lastName}
                        </span>
                        <span className="text-slate-500">({event.user.email})</span>
                      </div>
                    )}
                    
                    {/* Additional Details */}
                    {event.details && (
                      <div className="bg-slate-50 rounded-lg p-3 space-y-2">
                        {Object.entries(event.details).map(([key, value]) => (
                          <div key={key} className="flex justify-between text-sm">
                            <span className="font-medium text-slate-600 capitalize">
                              {key.replace(/([A-Z])/g, ' $1').trim()}:
                            </span>
                            <span className="text-slate-700 max-w-xs text-right">{value}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Quick Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Status Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{progressPercentage}%</div>
              <div className="text-sm text-blue-700">Complete</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{timelineEvents.filter(e => e.status === 'completed').length}</div>
              <div className="text-sm text-green-700">Steps Done</div>
            </div>
            <div className="text-center p-4 bg-slate-50 rounded-lg">
              <div className="text-2xl font-bold text-slate-600">{timelineEvents.length}</div>
              <div className="text-sm text-slate-700">Total Steps</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Work Orders Summary */}
      {ticketDetails?.workOrders && ticketDetails.workOrders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              Work Orders Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {ticketDetails.workOrders.map((workOrder: any, index: number) => (
                <div key={workOrder.id} className="border rounded-lg p-3">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium">Work Order #{index + 1}</h4>
                    <Badge className={`${
                      workOrder.status === 'completed' ? 'bg-green-100 text-green-800' :
                      workOrder.status === 'return_needed' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {workOrder.status?.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-600 mb-2">{workOrder.workDescription}</p>
                  {workOrder.createdAt && (
                    <div className="text-xs text-slate-500">
                      Created: {format(new Date(workOrder.createdAt), 'MMM dd, yyyy • h:mm a')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export function ProgressTracker({ 
  ticket, 
  open, 
  onOpenChange, 
  canUpdate = false 
}: ProgressTrackerProps) {
  if (!ticket) return null;
  
  const [selectedMilestone, setSelectedMilestone] = useState("");
  const [milestoneDescription, setMilestoneDescription] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch milestones for this ticket
  const { data: milestones = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/tickets", ticket.id, "milestones"],
    enabled: open,
  });

  // Fetch ticket details with related data
  const { data: ticketDetails, isLoading: isLoadingDetails } = useQuery<any>({
    queryKey: ["/api/tickets", ticket.id, "details"],
    enabled: open,
  });

  // Calculate progress percentage based on ticket status
  const getProgressPercentage = (status: string) => {
    switch (status) {
      case "pending": return 10;
      case "accepted": return 25;
      case "rejected": return 0;
      case "in-progress": return 60;
      case "completed": return 85;
      case "pending_confirmation": return 90;
      case "confirmed": return 95;
      case "ready_for_billing": return 98;
      case "billed": return 100;
      default: return 0;
    }
  };

  // Get current stage information
  const getCurrentStage = (status: string) => {
    return ticketJourneyStages.find(stage => 
      stage.key === status || 
      (status === "pending" && stage.key === "submitted") ||
      (status === "accepted" && stage.key === "accepted") ||
      (status === "rejected" && stage.key === "rejected_by_office") ||
      (status === "in-progress" && stage.key === "in_progress") ||
      (status === "completed" && stage.key === "work_completed") ||
      (status === "pending_confirmation" && stage.key === "pending_confirmation") ||
      (status === "confirmed" && stage.key === "confirmed") ||
      (status === "ready_for_billing" && stage.key === "confirmed") ||
      (status === "billed" && stage.key === "billed")
    ) || ticketJourneyStages[0];
  };

  // Get relevant stages for current ticket status
  const getRelevantStages = (status: string) => {
    const mainStages = [
      ticketJourneyStages.find(s => s.key === "submitted"),
      ticketJourneyStages.find(s => s.key === "accepted"),
      ticketJourneyStages.find(s => s.key === "in_progress"),
      ticketJourneyStages.find(s => s.key === "work_completed"),
      ticketJourneyStages.find(s => s.key === "billed")
    ].filter(Boolean);
    return mainStages;
  };

  // Check if stage is completed
  const isStageCompleted = (stageKey: string, currentStatus: string) => {
    const stageOrder = ["submitted", "accepted", "in_progress", "work_completed", "billed"];
    const currentOrder = ["pending", "accepted", "in-progress", "completed", "billed"];
    
    const stageIndex = stageOrder.indexOf(stageKey);
    const currentIndex = currentOrder.indexOf(currentStatus);
    
    if (stageKey === "submitted") return true; // Always completed
    if (stageKey === "accepted" && ["accepted", "in-progress", "completed", "billed"].includes(currentStatus)) return true;
    if (stageKey === "in_progress" && ["in-progress", "completed", "billed"].includes(currentStatus)) return true;
    if (stageKey === "work_completed" && ["completed", "billed"].includes(currentStatus)) return true;
    if (stageKey === "billed" && currentStatus === "billed") return true;
    
    return false;
  };

  // Check if stage is current
  const isCurrentStage = (stageKey: string, currentStatus: string) => {
    if (stageKey === "accepted" && currentStatus === "accepted") return true;
    if (stageKey === "in_progress" && currentStatus === "in-progress") return true;
    if (stageKey === "work_completed" && currentStatus === "completed") return true;
    if (stageKey === "billed" && currentStatus === "billed") return true;
    return false;
  };

  const currentStage = getCurrentStage(ticket.status);
  const progressPercentage = getProgressPercentage(ticket.status);

  // Add milestone mutation
  const addMilestoneMutation = useMutation({
    mutationFn: async (data: { milestoneType: string; milestoneDescription?: string }) => {
      return apiRequest("POST", `/api/tickets/${ticket.id}/milestones`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tickets", ticket.id, "milestones"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
      setSelectedMilestone("");
      setMilestoneDescription("");
      toast({
        title: "Success",
        description: "Milestone added successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add milestone",
        variant: "destructive",
      });
    },
  });

  const handleAddMilestone = () => {
    if (!selectedMilestone) return;
    
    const milestoneType = milestoneTypes.find(m => m.value === selectedMilestone);
    if (milestoneType) {
      addMilestoneMutation.mutate({
        milestoneType: milestoneType.value,
        milestoneDescription: milestoneDescription || undefined,
      });
    }
  };

  const getMilestoneColor = (type: string) => {
    switch (type) {
      case "completed": return "bg-green-100 text-green-800 border-green-200";
      case "testing": case "diagnosis_complete": return "bg-blue-100 text-blue-800 border-blue-200";
      case "in_progress": case "repair_started": case "on_site": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "assigned": case "technician_assigned": return "bg-purple-100 text-purple-800 border-purple-200";
      case "reviewed": case "parts_ordered": return "bg-orange-100 text-orange-800 border-orange-200";
      default: return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Ticket Progress Timeline - {ticket.ticketNumber}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-full max-h-[70vh] pr-4">
          <div className="space-y-6">
            {/* Domino's Style Progress Tracker */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-blue-600" />
                  Ticket Journey Progress
                </CardTitle>
                <p className="text-sm text-slate-600">Track your maintenance ticket from start to finish</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-8">
                  {/* Main Progress Line with Circles */}
                  <div className="relative px-4">
                    {/* Progress Bar Background */}
                    <div className="absolute top-6 left-12 right-12 h-1 bg-slate-200 rounded-full"></div>
                    <div 
                      className="absolute top-6 left-12 h-1 bg-blue-500 rounded-full transition-all duration-700 ease-out"
                      style={{ 
                        width: `${Math.max(0, Math.min(100, (progressPercentage / 100) * 76))}%` 
                      }}
                    ></div>
                    
                    {/* Stage Circles */}
                    <div className="relative flex justify-between items-center">
                      {getRelevantStages(ticket.status).map((stage, index) => {
                        const isCompleted = isStageCompleted(stage.key, ticket.status);
                        const isCurrent = isCurrentStage(stage.key, ticket.status);
                        
                        return (
                          <div key={stage.key} className="flex flex-col items-center space-y-3">
                            {/* Circle */}
                            <div className={`
                              relative z-10 w-12 h-12 rounded-full border-3 flex items-center justify-center transition-all duration-500 transform
                              ${isCompleted 
                                ? 'bg-blue-500 border-blue-500 text-white shadow-lg scale-110' 
                                : isCurrent 
                                  ? 'bg-white border-blue-500 text-blue-500 border-4 shadow-xl animate-pulse scale-105'
                                  : 'bg-white border-slate-300 text-slate-400'
                              }
                            `}>
                              {isCompleted ? (
                                <CheckCircle className="h-6 w-6" />
                              ) : (
                                <span className="text-sm font-bold">{index + 1}</span>
                              )}
                            </div>
                            
                            {/* Stage Label */}
                            <div className="text-center max-w-20">
                              <div className={`text-xs font-semibold ${
                                isCompleted || isCurrent ? 'text-slate-900' : 'text-slate-500'
                              }`}>
                                {stage.label.split(' ').slice(0, 2).join(' ')}
                              </div>
                              {isCurrent && (
                                <div className="text-xs text-blue-600 font-medium mt-1">
                                  Current
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Circular Progress Indicator */}
                  <div className="flex items-center justify-center">
                    <div className="relative">
                      <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 100 100">
                        {/* Background circle */}
                        <circle
                          cx="50"
                          cy="50"
                          r="35"
                          stroke="currentColor"
                          strokeWidth="6"
                          fill="transparent"
                          className="text-slate-200"
                        />
                        {/* Progress circle */}
                        <circle
                          cx="50"
                          cy="50"
                          r="35"
                          stroke="currentColor"
                          strokeWidth="6"
                          fill="transparent"
                          strokeDasharray={`${2 * Math.PI * 35}`}
                          strokeDashoffset={`${2 * Math.PI * 35 * (1 - progressPercentage / 100)}`}
                          className="text-blue-500 transition-all duration-700 ease-out"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-lg font-bold text-blue-600">
                          {progressPercentage}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Current Stage Status */}
                  <div className="text-center">
                    <Badge className={`px-4 py-2 text-sm font-medium ${currentStage.color}`}>
                      {currentStage.icon && (
                        <currentStage.icon className="h-4 w-4 mr-2" />
                      )}
                      {currentStage.label}
                    </Badge>
                    <p className="text-xs text-slate-600 mt-2">{currentStage.description}</p>
                  </div>
                </div>
                
                {/* Ticket Basic Info */}
                <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-slate-700">Priority:</span>
                    <Badge className="ml-2" variant={ticket.priority === 'high' ? 'destructive' : ticket.priority === 'medium' ? 'default' : 'secondary'}>
                      {ticket.priority}
                    </Badge>
                  </div>
                  <div>
                    <span className="font-medium text-slate-700">Status:</span>
                    <Badge className="ml-2" variant="outline">{ticket.status}</Badge>
                  </div>
                  <div>
                    <span className="font-medium text-slate-700">Created:</span>
                    <span className="ml-2 text-slate-600">{format(new Date(ticket.createdAt), 'MMM dd, yyyy h:mm a')}</span>
                  </div>
                  <div>
                    <span className="font-medium text-slate-700">Updated:</span>
                    <span className="ml-2 text-slate-600">{format(new Date(ticket.updatedAt), 'MMM dd, yyyy h:mm a')}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Detailed Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Detailed Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Ticket Creation */}
                  <div className="flex items-start space-x-3 pb-4 border-b border-slate-100">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 mt-1">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-slate-900">
                          Ticket Submitted
                        </h4>
                        <Badge className="bg-blue-100 text-blue-800">
                          Initial
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-600 mt-1">
                        Ticket created and submitted for review
                      </p>
                      <div className="flex items-center space-x-4 mt-2 text-xs text-slate-500">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3" />
                          <span>Created {format(new Date(ticket.createdAt), 'MMM dd, yyyy h:mm a')}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <User className="h-3 w-3" />
                          <span>Reporter: {ticketDetails?.reporter ? `${ticketDetails.reporter.firstName} ${ticketDetails.reporter.lastName} (${ticketDetails.reporter.email})` : `ID: ${ticket.reporterId}`}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Status-based timeline entries */}
                  {ticket.status !== 'pending' && (
                    <div className="flex items-start space-x-3 pb-4 border-b border-slate-100">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-600 mt-1">
                        {ticket.status === 'rejected' ? <XCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium text-slate-900">
                            {ticket.status === 'rejected' ? 'Ticket Rejected' : 'Ticket Accepted'}
                          </h4>
                          <Badge className={ticket.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}>
                            Office Decision
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-600 mt-1">
                          {ticket.status === 'rejected' 
                            ? `Office rejected the ticket${ticket.rejectionReason ? `: ${ticket.rejectionReason}` : ''}`
                            : 'Office reviewed and accepted the ticket for processing'
                          }
                        </p>
                        <div className="flex items-center space-x-4 mt-2 text-xs text-slate-500">
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-3 w-3" />
                            <span>Updated {format(new Date(ticket.updatedAt), 'MMM dd, yyyy h:mm a')}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Vendor Assignment */}
                  {ticket.maintenanceVendorId && (
                    <div className="flex items-start space-x-3 pb-4 border-b border-slate-100">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 text-purple-600 mt-1">
                        <Building className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium text-slate-900">
                            Vendor Assigned
                          </h4>
                          <Badge className="bg-purple-100 text-purple-800">
                            Assignment
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-600 mt-1">
                          Maintenance vendor assigned to handle this ticket
                        </p>
                        <div className="flex items-center space-x-4 mt-2 text-xs text-slate-500">
                          <div className="flex items-center space-x-1">
                            <Building className="h-3 w-3" />
                            <span>Vendor: {ticketDetails?.maintenanceVendor ? `${ticketDetails.maintenanceVendor.name}` : `ID: ${ticket.maintenanceVendorId}`}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Work Progress */}
                  {ticket.status === 'in-progress' && (
                    <div className="flex items-start space-x-3 pb-4 border-b border-slate-100">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-100 text-amber-600 mt-1">
                        <Wrench className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium text-slate-900">
                            Work in Progress
                          </h4>
                          <Badge className="bg-amber-100 text-amber-800">
                            Active
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-600 mt-1">
                          Maintenance work is currently being performed
                        </p>
                        {ticket.assigneeId && (
                          <div className="flex items-center space-x-4 mt-2 text-xs text-slate-500">
                            <div className="flex items-center space-x-1">
                              <User className="h-3 w-3" />
                              <span>Assignee: {ticketDetails?.assignee ? `${ticketDetails.assignee.firstName} ${ticketDetails.assignee.lastName} (${ticketDetails.assignee.email})` : `ID: ${ticket.assigneeId}`}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Completion Status */}
                  {(ticket.status === 'completed' || ticket.status === 'pending_confirmation' || ticket.status === 'confirmed') && (
                    <div className="flex items-start space-x-3 pb-4 border-b border-slate-100">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 mt-1">
                        <CheckSquare className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium text-slate-900">
                            Work Completed
                          </h4>
                          <Badge className="bg-emerald-100 text-emerald-800">
                            Completed
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-600 mt-1">
                          Maintenance work has been completed by the technician
                        </p>
                        {ticket.completedAt && (
                          <div className="flex items-center space-x-4 mt-2 text-xs text-slate-500">
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-3 w-3" />
                              <span>Completed {format(new Date(ticket.completedAt), 'MMM dd, yyyy h:mm a')}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Confirmation Status */}
                  {ticket.status === 'confirmed' && (
                    <div className="flex items-start space-x-3 pb-4 border-b border-slate-100">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-600 mt-1">
                        <CheckCircle className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium text-slate-900">
                            Work Confirmed
                          </h4>
                          <Badge className="bg-green-100 text-green-800">
                            Approved
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-600 mt-1">
                          Requester has confirmed and approved the completed work
                        </p>
                        {ticket.confirmedAt && (
                          <div className="flex items-center space-x-4 mt-2 text-xs text-slate-500">
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-3 w-3" />
                              <span>Confirmed {format(new Date(ticket.confirmedAt), 'MMM dd, yyyy h:mm a')}</span>
                            </div>
                            {ticket.confirmationFeedback && (
                              <div className="flex items-center space-x-1">
                                <MessageSquare className="h-3 w-3" />
                                <span>"{ticket.confirmationFeedback}"</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Show custom milestones if any exist */}
                  {!isLoading && milestones && milestones.length > 0 && (
                    <>
                      <Separator className="my-4" />
                      <h4 className="font-medium text-slate-900 mb-3">Custom Milestones</h4>
                      {milestones.map((milestone: any, index: number) => {
                        const milestoneType = ticketJourneyStages.find(m => m.key === milestone.milestoneType) || ticketJourneyStages[0];
                        const Icon = milestoneType.icon;

                        return (
                          <div key={milestone.id} className="flex items-start space-x-3 pb-4 border-b border-slate-100 last:border-b-0">
                            <div className={`flex items-center justify-center w-8 h-8 rounded-full mt-1 ${milestoneType.color.replace('text-', 'text-').replace('bg-', 'bg-')}`}>
                              <Icon className="h-4 w-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <h4 className="text-sm font-medium text-slate-900">
                                  {milestone.milestoneTitle}
                                </h4>
                                <Badge className={milestoneType.color}>
                                  Custom
                                </Badge>
                              </div>
                              
                              {milestone.milestoneDescription && (
                                <p className="text-sm text-slate-600 mt-1">
                                  {milestone.milestoneDescription}
                                </p>
                              )}
                              
                              <div className="flex items-center space-x-4 mt-2 text-xs text-slate-500">
                                <div className="flex items-center space-x-1">
                                  <Calendar className="h-3 w-3" />
                                  <span>{milestone.achievedAt ? formatDate(milestone.achievedAt) : 'Date not available'}</span>
                                </div>
                                {milestone.achievedByName && (
                                  <div className="flex items-center space-x-1">
                                    <User className="h-3 w-3" />
                                    <span>{milestone.achievedByName}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Notes Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Activity Log & Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Info className="h-4 w-4 text-slate-500" />
                      <span className="font-medium">Ticket Details</span>
                    </div>
                    <p className="text-slate-600">Title: {ticket.title}</p>
                    <p className="text-slate-600 mt-1">Description: {ticket.description}</p>
                    
                    {ticketDetails?.organization && (
                      <p className="text-slate-600 mt-1">Organization: {ticketDetails.organization.name}</p>
                    )}
                    
                    {ticket.rejectionReason && (
                      <p className="text-red-600 mt-2">Rejection Reason: {ticket.rejectionReason}</p>
                    )}
                    {ticket.rejectionFeedback && (
                      <p className="text-red-600 mt-1">Rejection Feedback: {ticket.rejectionFeedback}</p>
                    )}
                  </div>
                  
                  {ticket.images && ticket.images.length > 0 && (
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <FileText className="h-4 w-4 text-blue-500" />
                        <span className="font-medium">Attachments</span>
                      </div>
                      <p className="text-slate-600">{ticket.images.length} file(s) attached to this ticket</p>
                    </div>
                  )}

                  {/* Work Orders Summary */}
                  {ticketDetails?.workOrders && ticketDetails.workOrders.length > 0 && (
                    <div className="p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <Wrench className="h-4 w-4 text-green-500" />
                        <span className="font-medium">Work Orders ({ticketDetails.workOrders.length})</span>
                      </div>
                      {ticketDetails.workOrders.map((workOrder: any, index: number) => (
                        <div key={workOrder.id} className="mt-2 p-2 bg-white rounded border-l-2 border-green-300">
                          <p className="font-medium text-slate-700">Work Order #{index + 1}</p>
                          <p className="text-slate-600">Status: {workOrder.status}</p>
                          {workOrder.workDescription && (
                            <p className="text-slate-600">Description: {workOrder.workDescription}</p>
                          )}
                          {workOrder.totalCost && (
                            <p className="text-slate-600">Cost: ${workOrder.totalCost}</p>
                          )}
                          <p className="text-xs text-slate-500">Created: {workOrder.createdAt ? format(new Date(workOrder.createdAt), 'MMM dd, yyyy h:mm a') : 'Date not available'}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Comments Summary */}
                  {ticketDetails?.comments && ticketDetails.comments.length > 0 && (
                    <div className="p-3 bg-purple-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <MessageSquare className="h-4 w-4 text-purple-500" />
                        <span className="font-medium">Comments & Notes ({ticketDetails.comments.length})</span>
                      </div>
                      {ticketDetails.comments.slice(0, 3).map((comment: any) => (
                        <div key={comment.id} className="mt-2 p-2 bg-white rounded border-l-2 border-purple-300">
                          <p className="text-slate-600">{comment.content}</p>
                          <p className="text-xs text-slate-500 mt-1">
                            By {comment.user?.firstName} {comment.user?.lastName} - {comment.createdAt ? format(new Date(comment.createdAt), 'MMM dd, yyyy h:mm a') : 'Date not available'}
                          </p>
                        </div>
                      ))}
                      {ticketDetails.comments.length > 3 && (
                        <p className="text-xs text-slate-500 mt-2">+ {ticketDetails.comments.length - 3} more comments</p>
                      )}
                    </div>
                  )}

                  {/* Vendor Assignment Changes */}
                  <div className="p-3 bg-amber-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <ArrowRight className="h-4 w-4 text-amber-500" />
                      <span className="font-medium">Assignment History</span>
                    </div>
                    <div className="space-y-1">
                      <p className="text-slate-600">
                        Initial Reporter: {ticketDetails?.reporter ? `${ticketDetails.reporter.firstName} ${ticketDetails.reporter.lastName}` : 'Unknown'}
                      </p>
                      {ticket.maintenanceVendorId && (
                        <p className="text-slate-600">
                          Assigned Vendor: {ticketDetails?.maintenanceVendor ? ticketDetails.maintenanceVendor.name : `ID: ${ticket.maintenanceVendorId}`}
                        </p>
                      )}
                      {ticket.assigneeId && (
                        <p className="text-slate-600">
                          Assigned Technician: {ticketDetails?.assignee ? `${ticketDetails.assignee.firstName} ${ticketDetails.assignee.lastName}` : `ID: ${ticket.assigneeId}`}
                        </p>
                      )}
                    </div>
                  </div>

                  {isLoadingDetails && (
                    <div className="text-center py-4 text-slate-500">Loading detailed information...</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}