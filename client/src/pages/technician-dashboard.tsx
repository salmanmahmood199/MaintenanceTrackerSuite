import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Wrench, AlertTriangle, Check, LogOut, Calendar, Star, Zap, ArrowRight } from "lucide-react";
import { TicketTable } from "@/components/ticket-table";
import { TechnicianWorkOrderModal } from "@/components/technician-work-order-modal";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { TicketFilters, type FilterState } from "@/components/ticket-filters";
import { filterTickets } from "@/utils/ticket-filters";
import { format, isToday, isThisWeek, startOfDay, endOfDay } from "date-fns";
import type { Ticket } from "@shared/schema";

interface TicketStats {
  assigned: number;
  inProgress: number;
  completed: number;
  highPriority: number;
}

export default function TechnicianDashboard() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isWorkOrderModalOpen, setIsWorkOrderModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    status: "all",
    priority: "all",
    dateFrom: null,
    dateTo: null,
    organizationId: "all",
    vendorId: "all",
    assigneeId: "all"
  });
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch all tickets assigned to this technician (we'll filter client-side)
  const { data: allTickets = [], isLoading: ticketsLoading } = useQuery<Ticket[]>({
    queryKey: ["/api/tickets", { assigneeId: user?.id }],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/tickets?assigneeId=${user?.id}`);
      return await response.json() as Ticket[];
    },
    enabled: !!user?.id,
    staleTime: 0,
    refetchOnMount: true,
  });

  // Apply client-side filtering and sorting (assigned tickets at top)
  const filteredTickets = filterTickets(allTickets, filters);
  
  // Sort tickets to prioritize assigned ones with most recent assignment first
  const tickets = filteredTickets.sort((a, b) => {
    // If both have assignedAt dates, sort by most recent assignment first
    if (a.assignedAt && b.assignedAt) {
      return new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime();
    }
    // If only one has assignedAt, prioritize it
    if (a.assignedAt && !b.assignedAt) return -1;
    if (!a.assignedAt && b.assignedAt) return 1;
    
    // Fallback to created date (newest first)
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  // Start work mutation
  const startWorkMutation = useMutation({
    mutationFn: (id: number) => apiRequest("POST", `/api/tickets/${id}/start`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tickets", { assigneeId: user?.id }] });
      toast({
        title: "Success",
        description: "Started work on ticket!",
      });
    },
  });

  // Complete work mutation  
  const completeWorkMutation = useMutation({
    mutationFn: (id: number) => apiRequest("POST", `/api/tickets/${id}/complete`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tickets", { assigneeId: user?.id }] });
      toast({
        title: "Success", 
        description: "Completed ticket!",
      });
    },
  });

  const handleStartWork = (id: number) => {
    const ticket = tickets.find(t => t.id === id);
    if (ticket) {
      // First change status to in-progress, then open work order modal
      startWorkMutation.mutate(id);
      setSelectedTicket(ticket);
      // Open work order modal after a brief delay to allow status update
      setTimeout(() => {
        setIsWorkOrderModalOpen(true);
      }, 100);
    }
  };

  const handleCompleteWork = (id: number) => {
    const ticket = tickets.find(t => t.id === id);
    if (ticket) {
      setSelectedTicket(ticket);
      setIsWorkOrderModalOpen(true);
    }
  };



  // Work order submission mutation
  const submitWorkOrderMutation = useMutation({
    mutationFn: async ({ id, workOrder, images }: { id: number; workOrder: any; images: File[] }) => {
      const formData = new FormData();
      formData.append('workOrder', JSON.stringify(workOrder));
      
      // Add images to form data
      images.forEach((image, index) => {
        formData.append('images', image);
      });
      
      return fetch(`/api/tickets/${id}/complete`, {
        method: 'POST',
        body: formData,
      }).then(response => {
        if (!response.ok) {
          throw new Error('Failed to submit work order');
        }
        return response.json();
      });
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/tickets", { assigneeId: user?.id }] });
      setIsWorkOrderModalOpen(false);
      
      // Only clear selected ticket if job is actually completed
      if (variables.workOrder?.completionStatus === "completed") {
        setSelectedTicket(null);
        toast({
          title: "Success",
          description: "Work order completed successfully!",
        });
      } else {
        // For return_needed, keep ticket available for more work orders
        toast({
          title: "Work Order Submitted",
          description: "Work order saved. Ticket remains open for return visit.",
        });
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit work order",
        variant: "destructive",
      });
    },
  });

  const handleWorkOrderSubmit = (id: number, workOrder: any, images: File[]) => {
    submitWorkOrderMutation.mutate({ id, workOrder, images });
  };

  // Helper functions for today's focus
  const getTodaysTickets = () => {
    const today = new Date();
    return tickets.filter(ticket => {
      // Tickets scheduled for today
      if (ticket.scheduledStartTime) {
        const scheduledDate = new Date(ticket.scheduledStartTime);
        if (isToday(scheduledDate)) {
          return true;
        }
      }
      
      // High priority tickets that are active
      if (ticket.priority === 'high' && ['accepted', 'in-progress', 'return_needed'].includes(ticket.status)) {
        return true;
      }
      
      // Return needed tickets (always priority)
      if (ticket.status === 'return_needed') {
        return true;
      }
      
      // In-progress tickets
      if (ticket.status === 'in-progress') {
        return true;
      }
      
      return false;
    }).sort((a, b) => {
      // Sort by priority: return_needed > scheduled today > high priority > in-progress
      if (a.status === 'return_needed' && b.status !== 'return_needed') return -1;
      if (b.status === 'return_needed' && a.status !== 'return_needed') return 1;
      
      // Then by scheduled time for today
      const aScheduledToday = a.scheduledStartTime && isToday(new Date(a.scheduledStartTime));
      const bScheduledToday = b.scheduledStartTime && isToday(new Date(b.scheduledStartTime));
      
      if (aScheduledToday && !bScheduledToday) return -1;
      if (bScheduledToday && !aScheduledToday) return 1;
      
      // Then by priority
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] || 0;
      const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] || 0;
      
      if (aPriority !== bPriority) return bPriority - aPriority;
      
      // Finally by creation date
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  };

  const todaysTickets = getTodaysTickets();
  
  const getTicketUrgencyBadge = (ticket: Ticket) => {
    if (ticket.status === 'return_needed') {
      return <Badge className="bg-orange-500 text-white border-orange-500">Return Needed</Badge>;
    }
    if (ticket.scheduledStartTime && isToday(new Date(ticket.scheduledStartTime))) {
      return <Badge className="bg-blue-500 text-white border-blue-500">Scheduled Today</Badge>;
    }
    if (ticket.priority === 'high') {
      return <Badge className="bg-red-500 text-white border-red-500">High Priority</Badge>;
    }
    if (ticket.status === 'in-progress') {
      return <Badge className="bg-yellow-500 text-white border-yellow-500">In Progress</Badge>;
    }
    return null;
  };

  // Calculate stats
  const stats: TicketStats = {
    assigned: tickets.filter(t => t.status === 'accepted' || t.status === 'in-progress' || t.status === 'return_needed').length,
    inProgress: tickets.filter(t => t.status === 'in-progress' || t.status === 'return_needed').length,
    completed: tickets.filter(t => t.status === 'completed').length,
    highPriority: tickets.filter(t => t.priority === 'high').length,
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-xl font-bold text-foreground">Technician Dashboard</h1>
              <p className="text-sm text-muted-foreground">My Assigned Tickets</p>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link href="/calendar">
                <Button variant="outline" size="sm">
                  <Calendar className="h-4 w-4 mr-2" />
                  Calendar
                </Button>
              </Link>
              <span className="text-sm text-muted-foreground">
                {user?.firstName} {user?.lastName} ({user?.email})
              </span>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.location.href = '/api/auth/logout'}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Today's Focus Section */}
        {todaysTickets.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-500" />
                <h2 className="text-xl font-semibold text-foreground">Today's Focus</h2>
                <Badge variant="outline" className="bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-700">
                  {todaysTickets.length} {todaysTickets.length === 1 ? 'task' : 'tasks'}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {format(new Date(), 'EEEE, MMMM d, yyyy')}
              </p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {todaysTickets.slice(0, 6).map((ticket) => (
                <Card key={ticket.id} className="p-4 border-l-4 border-l-blue-500 bg-gradient-to-r from-blue-50/50 to-white dark:from-blue-900/10 dark:to-gray-900 hover:shadow-md transition-all">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium text-foreground text-sm">
                          #{ticket.ticketNumber}
                        </h3>
                        {getTicketUrgencyBadge(ticket)}
                      </div>
                      
                      <h4 className="font-semibold text-foreground mb-1">{ticket.title}</h4>
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                        {ticket.description}
                      </p>
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                        {ticket.scheduledStartTime && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>
                              {isToday(new Date(ticket.scheduledStartTime)) 
                                ? format(new Date(ticket.scheduledStartTime), 'h:mm a')
                                : format(new Date(ticket.scheduledStartTime), 'MMM d, h:mm a')
                              }
                            </span>
                          </div>
                        )}
                        {ticket.location && (
                          <div className="flex items-center gap-1">
                            <span>{ticket.location}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {ticket.status === 'accepted' && (
                          <Button
                            size="sm"
                            className="text-xs h-7 bg-green-600 hover:bg-green-700"
                            onClick={() => handleStartWork(ticket.id)}
                          >
                            Start Work
                          </Button>
                        )}
                        {(ticket.status === 'in-progress' || ticket.status === 'return_needed') && (
                          <Button
                            size="sm"
                            className="text-xs h-7 bg-blue-600 hover:bg-blue-700"
                            onClick={() => handleCompleteWork(ticket.id)}
                          >
                            Complete
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs h-7"
                          onClick={() => {
                            setSelectedTicket(ticket);
                            setIsWorkOrderModalOpen(true);
                          }}
                        >
                          View Details
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
            
            {todaysTickets.length > 6 && (
              <div className="mt-4 text-center">
                <p className="text-sm text-muted-foreground">
                  Showing 6 of {todaysTickets.length} priority tasks. View all tickets below.
                </p>
              </div>
            )}
          </div>
        )}
        
        {/* No Tasks for Today */}
        {todaysTickets.length === 0 && (
          <div className="mb-8">
            <Card className="p-6 text-center bg-gradient-to-r from-green-50/50 to-white dark:from-green-900/10 dark:to-gray-900">
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                  <Check className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">All Caught Up!</h3>
                  <p className="text-sm text-muted-foreground">
                    No urgent tasks scheduled for today. Check your full ticket list below for future assignments.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <CardContent className="p-0">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Assigned</p>
                  <p className="text-2xl font-bold text-foreground">{stats.assigned}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                  <Wrench className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="p-6">
            <CardContent className="p-0">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">In Progress</p>
                  <p className="text-2xl font-bold text-foreground">{stats.inProgress}</p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg flex items-center justify-center">
                  <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="p-6">
            <CardContent className="p-0">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Completed</p>
                  <p className="text-2xl font-bold text-foreground">{stats.completed}</p>
                </div>
                <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/20 rounded-lg flex items-center justify-center">
                  <Check className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="p-6">
            <CardContent className="p-0">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">High Priority</p>
                  <p className="text-2xl font-bold text-foreground">{stats.highPriority}</p>
                </div>
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Comprehensive Filters */}
        <TicketFilters
          onFiltersChange={setFilters}
          showOrganizationFilter={true}
          organizations={[]}
          userRole={user?.role}
        />

        {/* Tickets Table */}
        <TicketTable
          tickets={tickets}
          userRole={user?.role || 'technician'}
          userPermissions={[]}
          showActions={true}
          onStart={(ticketId) => {
            if (tickets.find(t => t.id === ticketId)?.status === 'accepted') {
              handleStartWork(ticketId);
            }
          }}
          onComplete={(ticketId) => {
            const ticket = tickets.find(t => t.id === ticketId);
            if (ticket && (ticket.status === 'in-progress' || ticket.status === 'return_needed')) {
              handleCompleteWork(ticketId);
            }
          }}
        />

        {/* Work Order Modal */}
        <TechnicianWorkOrderModal
          open={isWorkOrderModalOpen}
          onOpenChange={setIsWorkOrderModalOpen}
          ticket={selectedTicket}
          onSubmit={handleWorkOrderSubmit}
          isLoading={submitWorkOrderMutation.isPending}
        />
      </div>
    </div>
  );
}