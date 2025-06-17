import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, Users, Clock, Wrench, Check, AlertTriangle, UserPlus } from "lucide-react";
import { CreateTicketModal } from "@/components/create-ticket-modal";
import { CreateSubAdminModal } from "@/components/create-subadmin-modal";
import { TicketCard } from "@/components/ticket-card";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";
import type { Ticket, InsertTicket, InsertSubAdmin, Organization, User } from "@shared/schema";

interface TicketStats {
  open: number;
  inProgress: number;
  completed: number;
  highPriority: number;
}

export default function OrganizationView() {
  const [, params] = useRoute("/admin/organizations/:id");
  const organizationId = parseInt(params?.id || "0");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreateSubAdminOpen, setIsCreateSubAdminOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  // Fetch organization details
  const { data: organization } = useQuery<Organization | undefined>({
    queryKey: ["/api/organizations", organizationId],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/organizations");
      const orgs = await response.json() as Organization[];
      return orgs.find(org => org.id === organizationId);
    },
    enabled: !!organizationId,
  });

  // Fetch tickets for this organization
  const { data: tickets = [], isLoading: ticketsLoading } = useQuery<Ticket[]>({
    queryKey: statusFilter === "all" 
      ? ["/api/tickets", { organizationId }] 
      : ["/api/tickets", { status: statusFilter, organizationId }],
    queryFn: async () => {
      const url = statusFilter === "all" 
        ? `/api/tickets?organizationId=${organizationId}`
        : `/api/tickets?status=${statusFilter}&organizationId=${organizationId}`;
      const response = await apiRequest("GET", url);
      return await response.json() as Ticket[];
    },
  });

  // Fetch stats for this organization
  const { data: stats } = useQuery<TicketStats>({
    queryKey: ["/api/tickets/stats", organizationId],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/tickets/stats?organizationId=${organizationId}`);
      return await response.json() as TicketStats;
    },
  });

  // Fetch sub-admins for this organization
  const { data: subAdmins = [] } = useQuery<User[]>({
    queryKey: ["/api/organizations", organizationId, "sub-admins"],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/organizations/${organizationId}/sub-admins`);
      return await response.json() as User[];
    },
    enabled: !!organizationId,
  });

  // Create ticket mutation
  const createTicketMutation = useMutation({
    mutationFn: async ({ data, images }: { data: InsertTicket; images: File[] }) => {
      const formData = new FormData();
      formData.append("title", data.title);
      formData.append("description", data.description);
      formData.append("priority", data.priority);
      formData.append("status", data.status);
      formData.append("organizationId", organizationId.toString());
      formData.append("reporterId", user?.id.toString() || "1");
      
      images.forEach((image) => {
        formData.append("images", image);
      });

      return apiRequest("POST", "/api/tickets", formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tickets/stats"] });
      setIsCreateModalOpen(false);
      toast({
        title: "Success",
        description: "Ticket created successfully!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create ticket. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Accept ticket mutation
  const acceptTicketMutation = useMutation({
    mutationFn: (id: number) => apiRequest("POST", `/api/tickets/${id}/accept`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tickets/stats"] });
      toast({
        title: "Success",
        description: "Ticket accepted successfully!",
      });
    },
  });

  // Complete ticket mutation
  const completeTicketMutation = useMutation({
    mutationFn: (id: number) => apiRequest("POST", `/api/tickets/${id}/complete`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tickets/stats"] });
      toast({
        title: "Success",
        description: "Ticket completed successfully!",
      });
    },
  });

  const handleCreateTicket = (data: InsertTicket, images: File[]) => {
    createTicketMutation.mutate({ data, images });
  };

  // Create sub-admin mutation
  const createSubAdminMutation = useMutation({
    mutationFn: async (data: InsertSubAdmin) => {
      const response = await apiRequest("POST", `/api/organizations/${organizationId}/sub-admins`, data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/organizations", organizationId, "sub-admins"] });
      setIsCreateSubAdminOpen(false);
      toast({
        title: "Success",
        description: "Sub-admin created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create sub-admin",
        variant: "destructive",
      });
    },
  });

  const handleCreateSubAdmin = (data: InsertSubAdmin) => {
    createSubAdminMutation.mutate(data);
  };

  const handleAcceptTicket = (id: number) => {
    acceptTicketMutation.mutate(id);
  };

  const handleCompleteTicket = (id: number) => {
    completeTicketMutation.mutate(id);
  };

  if (!organization) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Organization Not Found</h2>
          <Link href="/admin">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Admin
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/admin">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Admin
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-slate-900">{organization.name}</h1>
                <p className="text-sm text-slate-500">Organization Dashboard</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={() => setIsCreateSubAdminOpen(true)}
                className="border-blue-200 text-blue-700 hover:bg-blue-50"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Add Sub-Admin
              </Button>
              <Button
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-primary text-white hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Ticket
              </Button>
              
              <div className="flex items-center space-x-3 pl-4 border-l border-slate-200">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {organization.name[0]}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium">{organization.name}</p>
                  <p className="text-xs text-slate-500">Organization View</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Organization Info */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Organization Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">{organization.name}</h3>
                {organization.description && (
                  <p className="text-slate-600 mb-2">{organization.description}</p>
                )}
                <div className="text-sm text-slate-500 space-y-1">
                  {organization.email && <p>Email: {organization.email}</p>}
                  {organization.phone && <p>Phone: {organization.phone}</p>}
                  {organization.address && <p>Address: {organization.address}</p>}
                </div>
              </div>
              <div className="flex items-center justify-center">
                <Badge variant="secondary" className="text-lg px-4 py-2">
                  Active Organization
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <CardContent className="p-0">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 font-medium">Open Tickets</p>
                  <p className="text-2xl font-bold text-slate-900">{stats?.open || 0}</p>
                </div>
                <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                  <Clock className="h-6 w-6 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="p-6">
            <CardContent className="p-0">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 font-medium">In Progress</p>
                  <p className="text-2xl font-bold text-slate-900">{stats?.inProgress || 0}</p>
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
                  <p className="text-sm text-slate-600 font-medium">Completed</p>
                  <p className="text-2xl font-bold text-slate-900">{stats?.completed || 0}</p>
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
                  <p className="text-2xl font-bold text-slate-900">{stats?.highPriority || 0}</p>
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
            <h2 className="text-lg font-semibold text-slate-900">Maintenance Tickets</h2>
            
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
                  onClick={() => setStatusFilter("open")}
                  className={statusFilter === "open" ? "bg-white shadow-sm" : ""}
                >
                  Open
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
              <p className="text-slate-600">No tickets found for this organization. Create your first ticket to get started!</p>
            </Card>
          ) : (
            tickets.map((ticket) => (
              <TicketCard
                key={ticket.id}
                ticket={ticket}
                onAccept={handleAcceptTicket}
                onComplete={handleCompleteTicket}
              />
            ))
          )}
        </div>
      </div>

      {/* Create Ticket Modal */}
      <CreateTicketModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onSubmit={handleCreateTicket}
        isLoading={createTicketMutation.isPending}
      />

      {/* Create Sub-Admin Modal */}
      <CreateSubAdminModal
        open={isCreateSubAdminOpen}
        onOpenChange={setIsCreateSubAdminOpen}
        onSubmit={handleCreateSubAdmin}
        isLoading={createSubAdminMutation.isPending}
      />
    </div>
  );
}