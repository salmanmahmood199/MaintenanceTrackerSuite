import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Wrench, AlertTriangle, Check, LogOut } from "lucide-react";
import { TicketCard } from "@/components/ticket-card";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import type { Ticket } from "@shared/schema";

interface TicketStats {
  assigned: number;
  inProgress: number;
  completed: number;
  highPriority: number;
}

export default function TechnicianDashboard() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch tickets assigned to this technician
  const { data: tickets = [], isLoading: ticketsLoading } = useQuery<Ticket[]>({
    queryKey: statusFilter === "all" 
      ? ["/api/tickets", { assigneeId: user?.id }] 
      : ["/api/tickets", { status: statusFilter, assigneeId: user?.id }],
    queryFn: async () => {
      const url = statusFilter === "all" 
        ? `/api/tickets?assigneeId=${user?.id}`
        : `/api/tickets?status=${statusFilter}&assigneeId=${user?.id}`;
      const response = await apiRequest("GET", url);
      return await response.json() as Ticket[];
    },
    enabled: !!user?.id,
    staleTime: 0,
    refetchOnMount: true,
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
    startWorkMutation.mutate(id);
  };

  const handleCompleteWork = (id: number) => {
    completeWorkMutation.mutate(id);
  };

  // Calculate stats
  const stats: TicketStats = {
    assigned: tickets.filter(t => t.status === 'accepted' || t.status === 'in-progress').length,
    inProgress: tickets.filter(t => t.status === 'in-progress').length,
    completed: tickets.filter(t => t.status === 'completed').length,
    highPriority: tickets.filter(t => t.priority === 'high').length,
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-xl font-bold text-slate-900">Technician Dashboard</h1>
              <p className="text-sm text-slate-500">My Assigned Tickets</p>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-slate-600">
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
                  <p className="text-sm text-slate-600 font-medium">Assigned</p>
                  <p className="text-2xl font-bold text-slate-900">{stats.assigned}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Wrench className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="p-6">
            <CardContent className="p-0">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 font-medium">In Progress</p>
                  <p className="text-2xl font-bold text-slate-900">{stats.inProgress}</p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="p-6">
            <CardContent className="p-0">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 font-medium">Completed</p>
                  <p className="text-2xl font-bold text-slate-900">{stats.completed}</p>
                </div>
                <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <Check className="h-6 w-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="p-6">
            <CardContent className="p-0">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 font-medium">High Priority</p>
                  <p className="text-2xl font-bold text-slate-900">{stats.highPriority}</p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-6 mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
            <h2 className="text-lg font-semibold text-slate-900">My Tickets ({tickets.length})</h2>
            
            <div className="flex items-center gap-3">
              <div className="flex bg-slate-100 rounded-lg p-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setStatusFilter("all")}
                  className={statusFilter === "all" ? "bg-white shadow-sm" : ""}
                >
                  All
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setStatusFilter("accepted")}
                  className={statusFilter === "accepted" ? "bg-white shadow-sm" : ""}
                >
                  Assigned
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setStatusFilter("in-progress")}
                  className={statusFilter === "in-progress" ? "bg-white shadow-sm" : ""}
                >
                  In Progress
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setStatusFilter("completed")}
                  className={statusFilter === "completed" ? "bg-white shadow-sm" : ""}
                >
                  Completed
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Tickets List */}
        <div className="space-y-4">
          {ticketsLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-slate-600 mt-2">Loading tickets...</p>
            </div>
          ) : tickets.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-slate-600">No tickets {statusFilter === "all" ? "assigned to you" : `with status "${statusFilter}"`} yet.</p>
              {statusFilter !== "all" && (
                <Button 
                  variant="outline" 
                  onClick={() => setStatusFilter("all")}
                  className="mt-2"
                >
                  Show All Tickets
                </Button>
              )}
            </Card>
          ) : (
            tickets.map((ticket) => (
              <TicketCard
                key={ticket.id}
                ticket={ticket}
                onStart={ticket.status === 'accepted' ? (id) => handleStartWork(id) : undefined}
                onComplete={ticket.status === 'in-progress' ? (id) => handleCompleteWork(id) : undefined}
                showTechnicianActions={true}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}