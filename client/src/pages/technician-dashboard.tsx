import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Wrench, AlertTriangle, Check, LogOut, Calendar } from "lucide-react";
import { TicketTable } from "@/components/ticket-table";
import { TechnicianWorkOrderModal } from "@/components/technician-work-order-modal";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { TicketFilters, type FilterState } from "@/components/ticket-filters";
import { filterTickets } from "@/utils/ticket-filters";
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

  // Apply client-side filtering
  const tickets = filterTickets(allTickets, filters);

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