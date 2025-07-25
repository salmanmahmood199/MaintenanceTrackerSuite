import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, LogOut, FileText, Package, Calendar, AlertCircle, CheckCircle } from "lucide-react";
import { TicketTable } from "@/components/ticket-table";
import { EnhancedInvoiceCreator } from "@/components/enhanced-invoice-creator";
import { InvoicesView } from "@/components/invoices-view";
import { VendorTicketActionModal } from "@/components/vendor-ticket-action-modal";
import { MarketplaceTicketsView } from "@/components/marketplace-tickets-view";
import { VendorBidsView } from "@/components/vendor-bids-view";
import PartsManagement from "./parts-management";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";
import AISearchBar from "@/components/ai-search-bar";
import { TicketFilters, type FilterState } from "@/components/ticket-filters";
import { filterTickets } from "@/utils/ticket-filters";
import type { Ticket, MaintenanceVendor, WorkOrder, User, Organization } from "@shared/schema";

export function VendorView() {
  const [, routeParams] = useRoute("/vendor/:id");
  const routeVendorId = routeParams?.id ? parseInt(routeParams.id) : undefined;
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<"tickets" | "marketplace" | "invoices" | "parts">("tickets");
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
  const [isCreateInvoiceModalOpen, setIsCreateInvoiceModalOpen] = useState(false);
  const [selectedTicketForInvoice, setSelectedTicketForInvoice] = useState<Ticket | null>(null);
  const [selectedOrganization, setSelectedOrganization] = useState<Organization | null>(null);
  const [isTicketActionModalOpen, setIsTicketActionModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [ticketAction, setTicketAction] = useState<"accept" | "reject" | null>(null);
  const [isTicketDetailsModalOpen, setIsTicketDetailsModalOpen] = useState(false);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  const vendorId = user?.role === "maintenance_admin" ? user.maintenanceVendorId : routeVendorId;
  
  // Fetch vendor details
  const { data: vendor } = useQuery<MaintenanceVendor | undefined>({
    queryKey: ["/api/maintenance-vendors", vendorId],
    enabled: !!vendorId,
  });

  // Fetch vendor bids to check for counter offers
  const { data: vendorBids = [] } = useQuery({
    queryKey: ["/api/marketplace/vendor-bids"],
    enabled: !!vendorId,
  });

  // Count pending counter offers
  const counterOffersCount = vendorBids.filter((bid: any) => bid.status === "counter").length;

  // Fetch all tickets for this vendor (we'll filter client-side)
  const { data: allTickets = [], isLoading: ticketsLoading } = useQuery<Ticket[]>({
    queryKey: ["/api/tickets", { maintenanceVendorId: vendorId }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (vendorId) params.append("maintenanceVendorId", vendorId.toString());
      
      const response = await apiRequest("GET", `/api/tickets?${params.toString()}`);
      return await response.json() as Ticket[];
    },
    enabled: !!vendorId,
  });

  // Apply client-side filtering
  const tickets = filterTickets(allTickets, filters);

  // Fetch organizations for filtering
  const { data: organizations = [] } = useQuery<Array<{id: number; name: string}>>({
    queryKey: ["/api/organizations"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/organizations");
      return await response.json();
    },
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

  // Fetch organizations for invoice creation
  const { data: allOrganizations = [] } = useQuery<Organization[]>({
    queryKey: ["/api/organizations"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/organizations");
      return await response.json();
    },
  });

  const handleCreateInvoice = async (ticketId: number) => {
    const ticket = tickets?.find(t => t.id === ticketId);
    if (ticket) {
      // Find the organization for this ticket
      const org = allOrganizations.find(o => o.id === ticket.organizationId);
      setSelectedTicketForInvoice(ticket);
      setSelectedOrganization(org || null);
      setIsCreateInvoiceModalOpen(true);
    }
  };

  const handleForceClose = (id: number, reason: string) => {
    forceCloseMutation.mutate({ id, reason });
  };

  if (!vendor) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground mb-2">Vendor Not Found</h2>
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-40">
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
                <h1 className="text-xl font-bold text-foreground">{vendor.name}</h1>
                <p className="text-sm text-muted-foreground">Maintenance Vendor Dashboard</p>
              </div>
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
          
          {/* AI Search Bar */}
          <div className="pb-4">
            <AISearchBar className="max-w-2xl mx-auto" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="mb-6">
          <div className="border-b border-border">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab("tickets")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "tickets"
                    ? "border-blue-500 text-blue-500"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted"
                }`}
              >
                Assigned Tickets
              </button>
              <button
                onClick={() => setActiveTab("marketplace")}
                className={`py-2 px-1 border-b-2 font-medium text-sm relative ${
                  activeTab === "marketplace"
                    ? "border-blue-500 text-blue-500"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted"
                }`}
              >
                Marketplace
                {counterOffersCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {counterOffersCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab("invoices")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "invoices"
                    ? "border-blue-500 text-blue-500"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted"
                }`}
              >
                Invoices
              </button>
              <button
                onClick={() => setActiveTab("parts")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "parts"
                    ? "border-blue-500 text-blue-500"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted"
                }`}
              >
                Parts
              </button>
            </nav>
          </div>
        </div>

        {activeTab === "tickets" && (
          <div>
            {/* Vendor Status Overview Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
              <Card className="border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                      <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-orange-700 dark:text-orange-300">Action Required</p>
                      <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                        {tickets.filter((t: Ticket) => t.status === 'accepted' && !t.assigneeId).length}
                      </p>
                      <p className="text-xs text-orange-600/70 dark:text-orange-400/70">Assign technicians</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-blue-700 dark:text-blue-300">In Progress</p>
                      <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {tickets.filter((t: Ticket) => ['in-progress', 'return_needed', 'accepted'].includes(t.status) && t.assigneeId).length}
                      </p>
                      <p className="text-xs text-blue-600/70 dark:text-blue-400/70">Active work</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                      <FileText className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-green-700 dark:text-green-300">Ready to Bill</p>
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {tickets.filter((t: Ticket) => ['ready_for_billing', 'pending_confirmation'].includes(t.status)).length}
                      </p>
                      <p className="text-xs text-green-600/70 dark:text-green-400/70">Create invoices</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-950/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 dark:bg-gray-900/30 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">All Done</p>
                      <p className="text-2xl font-bold text-gray-600 dark:text-gray-400">
                        {tickets.filter((t: Ticket) => ['completed', 'billed', 'force_closed'].includes(t.status)).length}
                      </p>
                      <p className="text-xs text-gray-600/70 dark:text-gray-400/70">Closed tickets</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Comprehensive Filters */}
            <TicketFilters
              onFiltersChange={setFilters}
              showOrganizationFilter={true}
              organizations={organizations}
              userRole={user?.role}
            />

            {/* Tickets Table */}
            <div className="bg-card rounded-lg shadow border border-border">
              {ticketsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="text-muted-foreground mt-2">Loading tickets...</p>
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
          <div className="space-y-6">
            {/* Counter Offers Alert */}
            {counterOffersCount > 0 && (
              <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-orange-500" />
                  <h3 className="font-medium text-orange-800 dark:text-orange-200">
                    You have {counterOffersCount} pending counter offer{counterOffersCount > 1 ? 's' : ''}
                  </h3>
                </div>
                <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                  Organizations have sent counter offers for your bids. Review and respond below.
                </p>
              </div>
            )}

            {/* Vendor Bids Section */}
            <VendorBidsView />

            {/* Available Marketplace Tickets */}
            <div className="mt-8">
              <h2 className="text-xl font-semibold text-foreground mb-4">Available Marketplace Tickets</h2>
              <MarketplaceTicketsView />
            </div>
          </div>
        )}

        {activeTab === "invoices" && (
          <InvoicesView vendorId={vendorId!} userRole="vendor" />
        )}

        {activeTab === "parts" && vendorId && (
          <PartsManagement />
        )}

        {/* Modals */}
        <EnhancedInvoiceCreator
          open={isCreateInvoiceModalOpen}
          onOpenChange={setIsCreateInvoiceModalOpen}
          onSubmit={createInvoiceMutation.mutate}
          isLoading={createInvoiceMutation.isPending}
          ticket={selectedTicketForInvoice}
          workOrders={invoiceWorkOrders}
          vendor={vendor}
          organization={selectedOrganization}
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