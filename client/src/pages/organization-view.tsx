import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Plus, Users, Clock, Wrench, Check, AlertTriangle, UserPlus, Key, Edit, LogOut, Settings } from "lucide-react";
import { CreateTicketModal } from "@/components/create-ticket-modal";
import { CreateSubAdminModal } from "@/components/create-subadmin-modal";
import { EditSubAdminModal } from "@/components/edit-subadmin-modal";
import { VendorManagementModal } from "@/components/vendor-management-modal";
import { TicketTable } from "@/components/ticket-table";
import { TicketActionModal } from "@/components/ticket-action-modal";
import { LocationManagement } from "@/components/location-management";
import { UserLocationAssignment } from "@/components/user-location-assignment";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";
import type { Ticket, InsertTicket, InsertSubAdmin, Organization, User, MaintenanceVendor } from "@shared/schema";

interface TicketStats {
  pending: number;
  accepted: number;
  inProgress: number;
  completed: number;
  highPriority: number;
}

export default function OrganizationView() {
  const [, params] = useRoute("/admin/organizations/:id");
  const routeOrgId = parseInt(params?.id || "0");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreateSubAdminOpen, setIsCreateSubAdminOpen] = useState(false);
  const [isEditSubAdminOpen, setIsEditSubAdminOpen] = useState(false);
  const [isVendorManagementOpen, setIsVendorManagementOpen] = useState(false);
  const [isTicketActionOpen, setIsTicketActionOpen] = useState(false);
  const [selectedSubAdmin, setSelectedSubAdmin] = useState<User | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [ticketAction, setTicketAction] = useState<"accept" | "reject" | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedUserName, setSelectedUserName] = useState<string>("");
  const [isLocationAssignmentOpen, setIsLocationAssignmentOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  // Use organization ID from user (for org_admin/org_subadmin) or route (for root accessing org)
  const organizationId = (user?.role === "org_admin" || user?.role === "org_subadmin") ? user.organizationId : routeOrgId || 1;

  // Permission helpers
  const canPlaceTickets = user?.role === "root" || user?.role === "org_admin" || 
    (user?.role === "org_subadmin" && user?.permissions?.includes("place_ticket"));
  
  const canAcceptTickets = user?.role === "root" || user?.role === "org_admin" || 
    (user?.role === "org_subadmin" && user?.permissions?.includes("accept_ticket"));
  
  const canManageSubAdmins = user?.role === "root" || user?.role === "org_admin";
  
  const canManageVendors = user?.role === "root" || user?.role === "org_admin";

  // Fetch organization details
  const { data: organization, isLoading: organizationLoading } = useQuery<Organization | undefined>({
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

  // Fetch organization vendors
  const { data: organizationVendors = [] } = useQuery<Array<{vendor: any, tier: string, isActive: boolean}>>({
    queryKey: ["/api/organizations", organizationId, "vendor-tiers"],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/organizations/${organizationId}/vendor-tiers`);
      return await response.json();
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
      formData.append("organizationId", organizationId?.toString() || "0");
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
        description: "Ticket created successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create ticket",
        variant: "destructive",
      });
    },
  });

  const handleCreateTicket = (data: InsertTicket, images: File[]) => {
    createTicketMutation.mutate({ data, images });
  };

  // Accept ticket mutation
  const acceptTicketMutation = useMutation({
    mutationFn: async ({ ticketId, data }: { ticketId: number; data: { maintenanceVendorId?: number; assigneeId?: number } }) => {
      return apiRequest("POST", `/api/tickets/${ticketId}/accept`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tickets/stats"] });
      setIsTicketActionOpen(false);
      toast({
        title: "Success",
        description: "Ticket accepted successfully",
      });
    },
    onError: () => {
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
      return apiRequest("POST", `/api/tickets/${ticketId}/reject`, { rejectionReason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tickets/stats"] });
      setIsTicketActionOpen(false);
      toast({
        title: "Success",
        description: "Ticket rejected successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to reject ticket",
        variant: "destructive",
      });
    },
  });

  // Complete ticket mutation
  const completeTicketMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("POST", `/api/tickets/${id}/complete`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tickets/stats"] });
      toast({
        title: "Success",
        description: "Ticket completed",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to complete ticket",
        variant: "destructive",
      });
    },
  });

  // Create sub-admin mutation
  const createSubAdminMutation = useMutation({
    mutationFn: async (data: InsertSubAdmin) => {
      return apiRequest("POST", `/api/organizations/${organizationId}/sub-admins`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/organizations", organizationId, "sub-admins"] });
      setIsCreateSubAdminOpen(false);
      toast({
        title: "Success",
        description: "Sub-admin created successfully",
      });
    },
    onError: () => {
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

  // Update vendor mutation
  const updateVendorMutation = useMutation({
    mutationFn: async ({ vendorId, updates }: { vendorId: number; updates: { tier?: string; isActive?: boolean } }) => {
      return apiRequest("PATCH", `/api/organizations/${organizationId}/vendors/${vendorId}/tier`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/organizations", organizationId, "vendor-tiers"] });
      toast({
        title: "Success",
        description: "Vendor updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update vendor",
        variant: "destructive",
      });
    },
  });

  const handleUpdateVendor = (vendorId: number, updates: { tier?: string; isActive?: boolean }) => {
    updateVendorMutation.mutate({ vendorId, updates });
  };

  // Edit sub-admin mutation
  const editSubAdminMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertSubAdmin> }) => {
      return apiRequest("PATCH", `/api/sub-admins/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/organizations", organizationId, "sub-admins"] });
      setIsEditSubAdminOpen(false);
      setSelectedSubAdmin(null);
      toast({
        title: "Success",
        description: "Sub-admin updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update sub-admin",
        variant: "destructive",
      });
    },
  });

  const handleEditSubAdmin = (id: number, data: Partial<InsertSubAdmin>) => {
    editSubAdminMutation.mutate({ id, data });
  };

  const openEditModal = (subAdmin: User) => {
    setSelectedSubAdmin(subAdmin);
    setIsEditSubAdminOpen(true);
  };

  // Ticket action handlers
  const handleAcceptTicket = (ticketId: number) => {
    const ticket = tickets?.find(t => t.id === ticketId);
    if (ticket) {
      setSelectedTicket(ticket);
      setTicketAction("accept");
      setIsTicketActionOpen(true);
    }
  };

  const handleRejectTicket = (ticketId: number) => {
    const ticket = tickets?.find(t => t.id === ticketId);
    if (ticket) {
      setSelectedTicket(ticket);
      setTicketAction("reject");
      setIsTicketActionOpen(true);
    }
  };

  const handleTicketAccept = (ticketId: number, data: { maintenanceVendorId?: number; assigneeId?: number }) => {
    acceptTicketMutation.mutate({ ticketId, data });
  };

  const handleTicketReject = (ticketId: number, rejectionReason: string) => {
    rejectTicketMutation.mutate({ ticketId, rejectionReason });
  };

  const handleCompleteTicket = (id: number) => {
    completeTicketMutation.mutate(id);
  };

  const openLocationAssignment = (userId: number, userName: string) => {
    setSelectedUserId(userId);
    setSelectedUserName(userName);
    setIsLocationAssignmentOpen(true);
  };

  const closeLocationAssignment = () => {
    setSelectedUserId(null);
    setSelectedUserName("");
    setIsLocationAssignmentOpen(false);
  };



  if (organizationLoading) {
    return (
      <div className="min-h-screen taskscout-bg flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="min-h-screen taskscout-bg flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground mb-2">Organization Not Found</h2>
          <p className="text-muted-foreground mb-4">Organization ID: {organizationId}</p>
          {user?.role === "root" && (
            <Button variant="outline" asChild className="text-foreground border-border hover:text-foreground">
              <Link href="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                <span className="font-medium">Back to Admin</span>
              </Link>
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen taskscout-bg">
      {/* Header */}
      <header className="taskscout-card border-b border-border sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              {user?.role === "root" && (
                <Button variant="ghost" size="sm" asChild className="text-foreground hover:text-foreground">
                  <Link href="/">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    <span className="font-medium">Back to Admin</span>
                  </Link>
                </Button>
              )}
              <div>
                <h1 className="text-xl font-bold text-foreground">{organization.name}</h1>
                <p className="text-sm text-muted-foreground">Organization Dashboard</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
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

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="w-full grid grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="subadmins">Sub-Admins</TabsTrigger>
              <TabsTrigger value="locations">Locations</TabsTrigger>
              <TabsTrigger value="vendors">Vendors</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-4">
            {canManageSubAdmins && (
              <Button
                variant="outline"
                onClick={() => setIsCreateSubAdminOpen(true)}
                className="border-blue-200 text-blue-700 hover:bg-blue-50"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Add Sub-Admin
              </Button>
            )}
            {canManageVendors && (
              <Button
                variant="outline"
                onClick={() => setIsVendorManagementOpen(true)}
                className="border-green-200 text-green-700 hover:bg-green-50"
              >
                <Settings className="h-4 w-4 mr-2" />
                Manage Vendors
              </Button>
            )}
            {canPlaceTickets && (
              <Button
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-primary text-white hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Ticket
              </Button>
            )}
          </div>
        </div>

        {/* Organization Info */}
        <div className="bg-white rounded-lg shadow mb-8 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <p className="text-sm font-medium text-slate-500">Organization</p>
              <p className="text-lg font-semibold text-slate-900">{organization.name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Address</p>
              <p className="text-lg font-semibold text-slate-900">{organization.address || 'Not specified'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Phone</p>
              <p className="text-lg font-semibold text-slate-900">{organization.phone || 'Not specified'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Email</p>
              <p className="text-lg font-semibold text-slate-900">{organization.email || 'Not specified'}</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.pending || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <Wrench className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.inProgress || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <Check className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.completed || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">High Priority</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.highPriority || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filter Buttons */}
        <div className="flex space-x-2 mb-6">
          <Button
            variant={statusFilter === "all" ? "default" : "outline"}
            onClick={() => setStatusFilter("all")}
            size="sm"
          >
            All Tickets
          </Button>
          <Button
            variant={statusFilter === "open" ? "default" : "outline"}
            onClick={() => setStatusFilter("open")}
            size="sm"
          >
            Open
          </Button>
          <Button
            variant={statusFilter === "in-progress" ? "default" : "outline"}
            onClick={() => setStatusFilter("in-progress")}
            size="sm"
          >
            In Progress
          </Button>
          <Button
            variant={statusFilter === "completed" ? "default" : "outline"}
            onClick={() => setStatusFilter("completed")}
            size="sm"
          >
            Completed
          </Button>
        </div>

        {/* Tickets Table */}
        <div className="mb-8">
          {ticketsLoading ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <p className="text-slate-500">Loading tickets...</p>
            </div>
          ) : (
            <TicketTable
              tickets={tickets || []}
              onAccept={canAcceptTickets ? handleAcceptTicket : undefined}
              onReject={canAcceptTickets ? handleRejectTicket : undefined}
              onComplete={canAcceptTickets ? handleCompleteTicket : undefined}
              showActions={canAcceptTickets}
              userRole={user?.role}
              userPermissions={user?.permissions || undefined}
            />
              )}
              </div>
            </TabsContent>

            <TabsContent value="subadmins" className="space-y-6">
              {/* Sub-Admins Section - Only show for users who can manage sub-admins */}
              {canManageSubAdmins && (
                <div className="bg-white rounded-lg shadow">
                  <div className="px-6 py-4 border-b border-slate-200">
                    <h2 className="text-lg font-semibold text-slate-900 flex items-center">
                      <Users className="h-5 w-5 mr-2" />
                      Sub-Administrators
                    </h2>
                  </div>
                  <div className="p-6">
                    {subAdmins.length === 0 ? (
                      <p className="text-slate-500 text-center py-4">No sub-administrators yet</p>
                    ) : (
                      <div className="space-y-4">
                        {subAdmins.map((subAdmin) => (
                          <div key={subAdmin.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                            <div className="flex items-center space-x-4">
                              <div>
                                <p className="font-medium text-slate-900">
                                  {subAdmin.firstName} {subAdmin.lastName}
                                </p>
                                <p className="text-sm text-slate-500">{subAdmin.email}</p>
                              </div>
                              <div className="flex space-x-2">
                                {subAdmin.permissions?.map((permission) => (
                                  <Badge key={permission} variant="secondary">
                                    {permission.replace('_', ' ')}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openLocationAssignment(
                                  subAdmin.id,
                                  `${subAdmin.firstName} ${subAdmin.lastName}`
                                )}
                              >
                                Locations
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openEditModal(subAdmin)}
                              >
                                <Edit className="h-4 w-4 mr-1" />
                                Edit
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="locations" className="space-y-6">
              {organizationId && (
                <LocationManagement
                  organizationId={organizationId}
                  canManage={canManageSubAdmins}
                />
              )}
            </TabsContent>

            <TabsContent value="vendors" className="space-y-6">
              {/* Vendor management content */}
            </TabsContent>

          </Tabs>
        </div>
      </main>

      {/* Modals */}
      <CreateTicketModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onSubmit={handleCreateTicket}
        isLoading={createTicketMutation.isPending}
      />

      <CreateSubAdminModal
        open={isCreateSubAdminOpen}
        onOpenChange={setIsCreateSubAdminOpen}
        onSubmit={handleCreateSubAdmin}
        isLoading={createSubAdminMutation.isPending}
      />

      <EditSubAdminModal
        open={isEditSubAdminOpen}
        onOpenChange={setIsEditSubAdminOpen}
        onSubmit={handleEditSubAdmin}
        isLoading={editSubAdminMutation.isPending}
        subAdmin={selectedSubAdmin}
      />

      <VendorManagementModal
        open={isVendorManagementOpen}
        onOpenChange={setIsVendorManagementOpen}
        organizationId={organizationId!}
        vendors={organizationVendors}
        onUpdateVendor={handleUpdateVendor}
        isLoading={updateVendorMutation.isPending}
      />

      <TicketActionModal
        open={isTicketActionOpen}
        onOpenChange={setIsTicketActionOpen}
        ticket={selectedTicket}
        action={ticketAction}
        vendors={organizationVendors}
        onAccept={handleTicketAccept}
        onReject={handleTicketReject}
        isLoading={acceptTicketMutation.isPending || rejectTicketMutation.isPending}
        userRole={user?.role}
        userPermissions={user?.permissions || undefined}
      />

      {/* User Location Assignment Modal */}
      {selectedUserId && selectedUserId > 0 && organizationId && (
        <UserLocationAssignment
          userId={selectedUserId}
          userName={selectedUserName}
          organizationId={organizationId}
          open={isLocationAssignmentOpen}
          onOpenChange={closeLocationAssignment}
        />
      )}
    </div>
  );
}