import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, LogOut, FileText, Package, Calendar } from "lucide-react";
import { TicketTable } from "@/components/ticket-table";
import { CreateInvoiceModal } from "@/components/create-invoice-modal";
import { InvoicesView } from "@/components/invoices-view";
import { VendorTicketActionModal } from "@/components/vendor-ticket-action-modal";
import { MarketplaceTicketsView } from "@/components/marketplace-tickets-view";
import PartsManagement from "./parts-management";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";
import type { Ticket, MaintenanceVendor, WorkOrder, User } from "@shared/schema";

export function VendorView() {
  const [, routeParams] = useRoute("/vendor/:id");
  const routeVendorId = routeParams?.id ? parseInt(routeParams.id) : undefined;
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<"tickets" | "marketplace" | "invoices" | "parts">("tickets");
  const [isCreateInvoiceModalOpen, setIsCreateInvoiceModalOpen] = useState(false);
  const [selectedTicketForInvoice, setSelectedTicketForInvoice] = useState<Ticket | null>(null);
  const [isTicketActionModalOpen, setIsTicketActionModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [ticketAction, setTicketAction] = useState<"accept" | "reject" | null>(null);
  const [isTicketDetailsModalOpen, setIsTicketDetailsModalOpen] = useState(false);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  const vendorId = user?.role === "maintenance_admin" ? user.maintenanceVendorId : routeVendorId;
  
  console.log("VendorView Debug:", {
    userRole: user?.role,
    routeVendorId,
    userMaintenanceVendorId: user?.maintenanceVendorId,
    finalVendorId: vendorId
  });
  
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
      : ["/api/tickets", { maintenanceVendorId: vendorId, status: statusFilter }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (vendorId) params.append("maintenanceVendorId", vendorId.toString());
      if (statusFilter !== "all") params.append("status", statusFilter);
      
      const response = await apiRequest("GET", `/api/tickets?${params.toString()}`);
      return await response.json() as Ticket[];
    },
    enabled: !!vendorId,
  });

  // Fetch technicians for this vendor
  const { data: technicians = [] } = useQuery<User[]>({
    queryKey: ["/api/technicians", vendorId],
    queryFn: async () => {
      if (!vendorId) return [];
      const response = await apiRequest("GET", `/api/maintenance-vendors/${vendorId}/technicians`);
      return await response.json() as User[];
    },
    enabled: !!vendorId,
  });

  // Fetch work orders for selected ticket
  const { data: invoiceWorkOrders = [] } = useQuery<WorkOrder[]>({
    queryKey: ["/api/tickets", selectedTicketForInvoice?.id, "work-orders"],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/tickets/${selectedTicketForInvoice!.id}/work-orders`);
      return await response.json() as WorkOrder[];
    },
    enabled: !!selectedTicketForInvoice?.id,
  });

  // Create invoice mutation
  const createInvoiceMutation = useMutation({
    mutationFn: async (invoiceData: any) => {
      return apiRequest("POST", "/api/invoices", invoiceData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      setIsCreateInvoiceModalOpen(false);
      setSelectedTicketForInvoice(null);
      toast({
        title: "Success",
        description: "Invoice created successfully!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "Failed to create invoice",
        variant: "destructive",
      });
    },
  });

  // Force close mutation
  const forceCloseMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: number; reason: string }) => {
      try {
        const response = await apiRequest("POST", `/api/tickets/${id}/force-close`, { reason });
        return response.json();
      } catch (error) {
        console.error("Force close error:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tickets/stats"] });
      // Also invalidate the specific vendor tickets query
      queryClient.invalidateQueries({ queryKey: ["/api/tickets", { maintenanceVendorId: vendor?.id }] });
      toast({ title: "Success", description: "Ticket force closed successfully" });
    },
    onError: (error) => {
      console.error("Force close mutation error:", error);
      toast({ title: "Error", description: "Failed to force close ticket", variant: "destructive" });
    },
  });

  // Accept ticket mutation
  const acceptTicketMutation = useMutation({
    mutationFn: async ({ ticketId, assigneeId }: { ticketId: number; assigneeId?: number }) => {
      return apiRequest("POST", `/api/tickets/${ticketId}/accept`, {
        maintenanceVendorId: vendorId,
        assigneeId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
      setIsTicketActionModalOpen(false);
      setSelectedTicket(null);
      setTicketAction(null);
      toast({
        title: "Success",
        description: "Ticket accepted successfully",
      });
    },
    onError: (error: any) => {
      console.error("Accept ticket error:", error);
      toast({
        title: "Error",
        description: "Failed to accept ticket",
        variant: "destructive",
      });
    },
  });

  // Reject ticket mutation
  const rejectTicketMutation = useMutation({
    mutationFn: async ({ ticketId, rejectionReason }: { ticketId: number; rejectionReason: string }) => {
      return apiRequest("POST", `/api/tickets/${ticketId}/reject`, {
        rejectionReason,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
      setIsTicketActionModalOpen(false);
      setSelectedTicket(null);
      setTicketAction(null);
      toast({
        title: "Success",
        description: "Ticket rejected",
      });
    },
    onError: (error: any) => {
      console.error("Reject ticket error:", error);
      toast({
        title: "Error",
        description: "Failed to reject ticket",
        variant: "destructive",
      });
    },
  });

  const handleAcceptTicket = (ticketId: number, assigneeId?: number) => {
    acceptTicketMutation.mutate({ ticketId, assigneeId });
  };

  const handleRejectTicket = (ticketId: number, rejectionReason: string) => {
    rejectTicketMutation.mutate({ ticketId, rejectionReason });
  };

  const openAcceptModal = (ticketId: number) => {
    const ticket = tickets.find(t => t.id === ticketId);
    if (ticket) {
      setSelectedTicket(ticket);
      setTicketAction("accept");
      setIsTicketActionModalOpen(true);
    }
  };

  const openRejectModal = (ticketId: number) => {
    const ticket = tickets.find(t => t.id === ticketId);
    if (ticket) {
      setSelectedTicket(ticket);
      setTicketAction("reject");
      setIsTicketActionModalOpen(true);
    }
  };

  const handleCreateInvoice = (ticketId: number) => {
    const ticket = tickets?.find(t => t.id === ticketId);
    if (ticket) {
      setSelectedTicketForInvoice(ticket);
      setIsCreateInvoiceModalOpen(true);
    }
  };

  const handleForceClose = (id: number, reason: string) => {
    forceCloseMutation.mutate({ id, reason });
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
              <Link href="/calendar">
                <Button variant="outline" size="sm">
                  <Calendar className="h-4 w-4 mr-2" />
                  Calendar
                </Button>
              </Link>
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

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab("tickets")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "tickets"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Assigned Tickets
              </button>
              <button
                onClick={() => setActiveTab("marketplace")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "marketplace"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Marketplace
              </button>
              <button
                onClick={() => setActiveTab("invoices")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "invoices"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Invoices
              </button>
              <button
                onClick={() => setActiveTab("parts")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "parts"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Parts
              </button>
            </nav>
          </div>
        </div>

        {activeTab === "tickets" && (
          <div>
            {/* Filter Buttons */}
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
                      Pending
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setStatusFilter("ready_for_billing")}
                      className={statusFilter === "ready_for_billing" ? "bg-white shadow-sm" : ""}
                    >
                      Ready for Billing
                    </Button>
                  </div>
                </div>
              </div>
            </Card>

            {/* Tickets Table */}
            <div className="bg-white rounded-lg shadow">
              {ticketsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="text-slate-600 mt-2">Loading tickets...</p>
                </div>
              ) : (
                <TicketTable
                  tickets={tickets}
                  onAccept={user?.role === "maintenance_admin" ? openAcceptModal : undefined}
                  onReject={user?.role === "maintenance_admin" ? openRejectModal : undefined}
                  onCreateInvoice={handleCreateInvoice}
                  onForceClose={user?.role === "maintenance_admin" ? handleForceClose : undefined}
                  showActions={true}
                  userRole={user?.role}
                  userPermissions={user?.permissions || []}
                  userId={user?.id}
                />
              )}
            </div>
          </div>
        )}

        {activeTab === "marketplace" && (
          <MarketplaceTicketsView />
        )}

        {activeTab === "invoices" && (
          <InvoicesView vendorId={vendorId} />
        )}

        {activeTab === "parts" && vendorId && (
          <PartsManagement />
        )}

        {/* Modals */}
        <CreateInvoiceModal
          open={isCreateInvoiceModalOpen}
          onOpenChange={setIsCreateInvoiceModalOpen}
          onSubmit={createInvoiceMutation.mutate}
          isLoading={createInvoiceMutation.isPending}
          ticket={selectedTicketForInvoice}
          workOrders={invoiceWorkOrders}
        />

        <VendorTicketActionModal
          open={isTicketActionModalOpen}
          onOpenChange={setIsTicketActionModalOpen}
          ticket={selectedTicket}
          action={ticketAction}
          technicians={technicians || []}
          onAccept={handleAcceptTicket}
          onReject={handleRejectTicket}
          isLoading={acceptTicketMutation.isPending || rejectTicketMutation.isPending}
        />
      </div>
    </div>
  );
}