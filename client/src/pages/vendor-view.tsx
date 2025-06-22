import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, Wrench, Clock, Check, AlertTriangle, Users, LogOut, Trash2, Edit } from "lucide-react";
import { TicketCard } from "@/components/ticket-card";
import { CreateTechnicianModal } from "@/components/create-technician-modal";
import { EditTechnicianModal } from "@/components/edit-technician-modal";
import { VendorTicketActionModal } from "@/components/vendor-ticket-action-modal";
import { VendorTicketDetailsModal } from "@/components/vendor-ticket-details-modal";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";
import { CreateInvoiceModal } from "@/components/create-invoice-modal";
import { InvoicesView } from "@/components/invoices-view";
import type { Ticket, MaintenanceVendor, User, InsertUser, WorkOrder } from "@shared/schema";

interface TicketStats {
  open: number;
  inProgress: number;
  completed: number;
  highPriority: number;
}

export default function VendorView() {
  const [, params] = useRoute("/admin/vendors/:id");
  const routeVendorId = parseInt(params?.id || "0");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isCreateTechnicianModalOpen, setIsCreateTechnicianModalOpen] = useState(false);
  const [isEditTechnicianModalOpen, setIsEditTechnicianModalOpen] = useState(false);
  const [selectedTechnician, setSelectedTechnician] = useState<User | null>(null);
  const [isTicketActionModalOpen, setIsTicketActionModalOpen] = useState(false);
  const [isTicketDetailsModalOpen, setIsTicketDetailsModalOpen] = useState(false);
  const [isCreateInvoiceModalOpen, setIsCreateInvoiceModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [selectedTicketForInvoice, setSelectedTicketForInvoice] = useState<Ticket | null>(null);
  const [activeTab, setActiveTab] = useState<"tickets" | "invoices">("tickets");
  const [ticketAction, setTicketAction] = useState<"accept" | "reject" | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  // Use vendor ID from user (for maintenance_admin) or route (for root accessing vendor)
  const vendorId = user?.role === "maintenance_admin" ? user.maintenanceVendorId : routeVendorId;
  
  // Fetch vendor details
  const { data: vendor } = useQuery<MaintenanceVendor | undefined>({
    queryKey: ["/api/maintenance-vendors", vendorId],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/maintenance-vendors");
      const vendors = await response.json() as MaintenanceVendor[];
      return vendors.find(v => v.id === vendorId);
    },
    enabled: !!vendorId,
  });

  // Fetch tickets for this vendor
  const { data: tickets = [], isLoading: ticketsLoading } = useQuery<Ticket[]>({
    queryKey: statusFilter === "all" 
      ? ["/api/tickets", { maintenanceVendorId: vendorId }] 
      : ["/api/tickets", { status: statusFilter, maintenanceVendorId: vendorId }],
    queryFn: async () => {
      let url;
      if (statusFilter === "all") {
        url = `/api/tickets?maintenanceVendorId=${vendorId}`;
      } else if (statusFilter === "pending") {
        // Get pending tickets assigned to this vendor by organization admin
        url = `/api/tickets?status=accepted&maintenanceVendorId=${vendorId}`;
      } else {
        url = `/api/tickets?status=${statusFilter}&maintenanceVendorId=${vendorId}`;
      }
      const response = await apiRequest("GET", url);
      return await response.json() as Ticket[];
    },
  });

  // Fetch stats for this vendor
  const { data: stats } = useQuery<TicketStats>({
    queryKey: ["/api/tickets/stats", vendorId],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/tickets/stats?maintenanceVendorId=${vendorId}`);
      return await response.json() as TicketStats;
    },
  });

  // Fetch technicians for this vendor
  const { data: technicians, isLoading: techniciansLoading, error: techniciansError, refetch: refetchTechnicians } = useQuery<User[]>({
    queryKey: ["/api/maintenance-vendors", vendorId, "technicians"],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/maintenance-vendors/${vendorId}/technicians`);
      return await response.json() as User[];
    },
    enabled: !!vendorId,
  });

  // Fetch work orders for invoice creation
  const { data: invoiceWorkOrders = [] } = useQuery<WorkOrder[]>({
    queryKey: ["/api/tickets", selectedTicketForInvoice?.id, "work-orders"],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/tickets/${selectedTicketForInvoice!.id}/work-orders`);
      return await response.json() as WorkOrder[];
    },
    enabled: !!selectedTicketForInvoice?.id,
  });

  // Accept ticket mutation
  const acceptTicketMutation = useMutation({
    mutationFn: ({ id, assigneeId }: { id: number; assigneeId?: number }) => 
      apiRequest("POST", `/api/tickets/${id}/accept`, { maintenanceVendorId: vendorId, assigneeId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tickets", { maintenanceVendorId: vendorId }] });
      queryClient.invalidateQueries({ queryKey: ["/api/tickets/stats", vendorId] });
      setIsTicketActionModalOpen(false);
      setSelectedTicket(null);
      setTicketAction(null);
      toast({
        title: "Success",
        description: "Ticket accepted successfully!",
      });
    },
  });

  // Reject ticket mutation
  const rejectTicketMutation = useMutation({
    mutationFn: ({ id, rejectionReason }: { id: number; rejectionReason: string }) => 
      apiRequest("POST", `/api/tickets/${id}/reject`, { rejectionReason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tickets", { maintenanceVendorId: vendorId }] });
      queryClient.invalidateQueries({ queryKey: ["/api/tickets/stats", vendorId] });
      setIsTicketActionModalOpen(false);
      setSelectedTicket(null);
      setTicketAction(null);
      toast({
        title: "Success",
        description: "Ticket rejected successfully!",
      });
    },
  });

  // Complete ticket mutation
  const completeTicketMutation = useMutation({
    mutationFn: (id: number) => apiRequest("POST", `/api/tickets/${id}/complete`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tickets", { maintenanceVendorId: vendorId }] });
      queryClient.invalidateQueries({ queryKey: ["/api/tickets/stats", vendorId] });
      toast({
        title: "Success",
        description: "Ticket completed successfully!",
      });
    },
  });
  
  // Create technician mutation
  const createTechnicianMutation = useMutation({
    mutationFn: async (data: InsertUser) => 
      apiRequest("POST", `/api/maintenance-vendors/${vendorId}/technicians`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/maintenance-vendors", vendorId, "technicians"] });
      refetchTechnicians(); // Force immediate refetch
      setIsCreateTechnicianModalOpen(false);
      toast({ title: "Success", description: "Technician added successfully" });
    },
    onError: (error: any) => {
      const message = error.message?.includes("duplicate key") 
        ? "Email or phone number already exists" 
        : "Failed to add technician";
      toast({ title: "Error", description: message, variant: "destructive" });
    },
  });

  const deleteTechnicianMutation = useMutation({
    mutationFn: async (id: number) => 
      apiRequest("DELETE", `/api/maintenance-vendors/${vendorId}/technicians/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/maintenance-vendors", vendorId, "technicians"] });
      refetchTechnicians(); // Force immediate refetch
      toast({ title: "Success", description: "Technician removed successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to remove technician", variant: "destructive" });
    },
  });

  // Edit technician mutation
  const editTechnicianMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return apiRequest("PATCH", `/api/maintenance-vendors/${vendorId}/technicians/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/maintenance-vendors", vendorId, "technicians"] });
      refetchTechnicians();
      setIsEditTechnicianModalOpen(false);
      setSelectedTechnician(null);
      toast({ title: "Success", description: "Technician updated successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update technician", variant: "destructive" });
    },
  });

  // Reset password mutation
  const resetPasswordMutation = useMutation({
    mutationFn: async ({ id, newPassword }: { id: number; newPassword: string }) => {
      return apiRequest("POST", `/api/maintenance-vendors/${vendorId}/technicians/${id}/reset-password`, { newPassword });
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Password reset successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to reset password", variant: "destructive" });
    },
  });

  // Create invoice mutation
  const createInvoiceMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/invoices", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      setIsCreateInvoiceModalOpen(false);
      setSelectedTicketForInvoice(null);
      toast({
        title: "Success",
        description: "Invoice created successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create invoice",
        variant: "destructive",
      });
    },
  });

  const handleAcceptTicket = (id: number) => {
    const ticket = tickets.find(t => t.id === id);
    if (ticket) {
      setSelectedTicket(ticket);
      setTicketAction("accept");
      setIsTicketDetailsModalOpen(false);
      setIsTicketActionModalOpen(true);
    }
  };

  const handleRejectTicket = (id: number) => {
    const ticket = tickets.find(t => t.id === id);
    if (ticket) {
      setSelectedTicket(ticket);
      setTicketAction("reject");
      setIsTicketDetailsModalOpen(false);
      setIsTicketActionModalOpen(true);
    }
  };

  const handleCompleteTicket = (id: number) => {
    completeTicketMutation.mutate(id);
  };

  const handleEditTechnician = (id: number, data: any) => {
    editTechnicianMutation.mutate({ id, data });
  };

  const handleResetPassword = (id: number, newPassword: string) => {
    resetPasswordMutation.mutate({ id, newPassword });
  };

  const openEditModal = (technician: User) => {
    setSelectedTechnician(technician);
    setIsEditTechnicianModalOpen(true);
  };

  const handleVendorAcceptTicket = (ticketId: number, assigneeId?: number) => {
    acceptTicketMutation.mutate({ id: ticketId, assigneeId });
  };

  const handleVendorRejectTicket = (ticketId: number, rejectionReason: string) => {
    rejectTicketMutation.mutate({ id: ticketId, rejectionReason });
  };

  const handleViewTicketDetails = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setIsTicketDetailsModalOpen(true);
  };

  const handleViewWorkOrders = (ticketId: number) => {
    // Work order viewing functionality can be added here if needed
    console.log("View work orders for ticket:", ticketId);
  };

  const handleCreateInvoice = (ticketId: number) => {
    const ticket = tickets?.find(t => t.id === ticketId);
    if (ticket) {
      setSelectedTicketForInvoice(ticket);
      setIsCreateInvoiceModalOpen(true);
    }
  };

  if (!vendor) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Vendor Not Found</h2>
          <Link href="/">
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
    <>
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              {user?.role === "root" && (
                <Link href="/">
                  <Button variant="ghost" size="sm">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Admin
                  </Button>
                </Link>
              )}
              <div>
                <h1 className="text-xl font-bold text-slate-900">{vendor.name}</h1>
                <p className="text-sm text-slate-500">Maintenance Vendor Dashboard</p>
              </div>
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
        {/* Vendor Info */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Wrench className="h-5 w-5 mr-2" />
              Vendor Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">{vendor.name}</h3>
                {vendor.description && (
                  <p className="text-slate-600 mb-2">{vendor.description}</p>
                )}
                <div className="text-sm text-slate-500 space-y-1">
                  {vendor.email && <p>Email: {vendor.email}</p>}
                  {vendor.phone && <p>Phone: {vendor.phone}</p>}
                  {vendor.address && <p>Address: {vendor.address}</p>}
                </div>
              </div>
              <div>
                <div className="mb-4">
                  <h4 className="font-medium text-slate-700 mb-2">Specialties</h4>
                  {vendor.specialties && vendor.specialties.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {vendor.specialties.map((specialty, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {specialty}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-500 text-sm">No specialties listed</p>
                  )}
                </div>
                <Badge variant="secondary" className="text-lg px-4 py-2">
                  Active Vendor
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

        {/* Technicians Management */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Technicians
              </CardTitle>
              <Button 
                onClick={() => setIsCreateTechnicianModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Technician
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {techniciansLoading ? (
              <div className="text-center py-8 text-slate-500">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Loading technicians...</p>
              </div>
            ) : techniciansError ? (
              <div className="text-center py-8 text-red-500">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Error loading technicians: {techniciansError.message}</p>
                <Button 
                  variant="outline" 
                  onClick={() => refetchTechnicians()}
                  className="mt-2"
                >
                  Retry
                </Button>
              </div>
            ) : technicians.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No technicians added yet</p>
                <p className="text-sm">Add technicians to assign tickets and manage work</p>
              </div>
            ) : (
              <div className="space-y-4">
                {technicians.map((technician: User) => (
                  <div key={technician.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">
                        {technician.firstName} {technician.lastName}
                      </h4>
                      <p className="text-sm text-slate-600">{technician.email}</p>
                      {technician.phone && (
                        <p className="text-sm text-slate-600">{technician.phone}</p>
                      )}
                      <p className="text-xs text-blue-600 font-medium">Role: {technician.role}</p>
                    </div>
                    <div className="flex space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditModal(technician)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteTechnicianMutation.mutate(technician.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Filters */}
        <Card className="p-6 mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
            <h2 className="text-lg font-semibold text-slate-900">Assigned Tickets ({tickets.length})</h2>
            
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
                  onClick={() => setStatusFilter("pending")}
                  className={statusFilter === "pending" ? "bg-white shadow-sm" : ""}
                >
                  Need Action
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setStatusFilter("accepted")}
                  className={statusFilter === "accepted" ? "bg-white shadow-sm" : ""}
                >
                  Accepted
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
              <p className="text-slate-600">No tickets {statusFilter === "all" ? "assigned to this vendor" : `with status "${statusFilter}"`} yet.</p>
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
              <div
                key={ticket.id}
                onClick={() => handleViewTicketDetails(ticket)}
                className="cursor-pointer"
              >
                <TicketCard
                  ticket={ticket}
                  onAccept={handleAcceptTicket}
                  onReject={handleRejectTicket}
                  onViewWorkOrders={handleViewWorkOrders}
                  onCreateInvoice={handleCreateInvoice}
                  userRole={user?.role}
                  userPermissions={user?.permissions ? user.permissions : undefined}
                  showActions={true}
                />
              </div>
            ))
          )}
        </div>
          </div>
        )}

        {activeTab === "invoices" && (
          <InvoicesView vendorId={vendorId} />
        )}

        {/* Modals */}
        <CreateTechnicianModal
          open={isCreateTechnicianModalOpen}
          onOpenChange={setIsCreateTechnicianModalOpen}
          onSubmit={(data) => createTechnicianMutation.mutate(data)}
          isLoading={createTechnicianMutation.isPending}
        />
        
        <EditTechnicianModal
          open={isEditTechnicianModalOpen}
          onOpenChange={setIsEditTechnicianModalOpen}
          onSubmit={handleEditTechnician}
          onResetPassword={handleResetPassword}
          isLoading={editTechnicianMutation.isPending || resetPasswordMutation.isPending}
          technician={selectedTechnician}
        />

        <VendorTicketDetailsModal
          open={isTicketDetailsModalOpen}
          onOpenChange={setIsTicketDetailsModalOpen}
          ticket={selectedTicket}
          onAccept={handleAcceptTicket}
          onReject={handleRejectTicket}
          onComplete={selectedTicket?.status === 'in-progress' ? handleCompleteTicket : undefined}
          canAccept={true}
        />

        <VendorTicketActionModal
          open={isTicketActionModalOpen}
          onOpenChange={setIsTicketActionModalOpen}
          ticket={selectedTicket}
          action={ticketAction}
          technicians={technicians || []}
          onAccept={handleVendorAcceptTicket}
          onReject={handleVendorRejectTicket}
          isLoading={acceptTicketMutation.isPending || rejectTicketMutation.isPending}
        />

        <CreateInvoiceModal
          open={isCreateInvoiceModalOpen}
          onOpenChange={setIsCreateInvoiceModalOpen}
          onSubmit={createInvoiceMutation.mutate}
          isLoading={createInvoiceMutation.isPending}
          ticket={selectedTicketForInvoice}
          workOrders={invoiceWorkOrders}
        />
      </div>
    </>
  );
}