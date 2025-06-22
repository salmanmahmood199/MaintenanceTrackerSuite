import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Building2, 
  Users, 
  Wrench, 
  TicketIcon, 
  Plus, 
  Edit, 
  Trash2, 
  Key,
  BarChart3,
  Settings,
  LogOut
} from "lucide-react";
import { CreateOrganizationModal } from "@/components/create-organization-modal";
import { EditOrganizationModal } from "@/components/edit-organization-modal";
import { CreateVendorModal } from "@/components/create-vendor-modal";
import { EditVendorModal } from "@/components/edit-vendor-modal";
import { TicketTable } from "@/components/ticket-table";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";
import type { Organization, MaintenanceVendor, User, Ticket } from "@shared/schema";

export default function RootDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedOrganization, setSelectedOrganization] = useState<Organization | null>(null);
  const [selectedVendor, setSelectedVendor] = useState<MaintenanceVendor | null>(null);
  const [isCreateOrgModalOpen, setIsCreateOrgModalOpen] = useState(false);
  const [isEditOrgModalOpen, setIsEditOrgModalOpen] = useState(false);
  const [isCreateVendorModalOpen, setIsCreateVendorModalOpen] = useState(false);
  const [isEditVendorModalOpen, setIsEditVendorModalOpen] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Fetch data
  const { data: organizations = [] } = useQuery<Organization[]>({
    queryKey: ["/api/organizations"],
  });

  const { data: vendors = [] } = useQuery<MaintenanceVendor[]>({
    queryKey: ["/api/maintenance-vendors"],
  });

  const { data: tickets = [] } = useQuery<Ticket[]>({
    queryKey: ["/api/tickets"],
  });

  const { data: ticketStats } = useQuery<{
    pending: number;
    accepted: number;
    inProgress: number;
    completed: number;
    highPriority: number;
  }>({
    queryKey: ["/api/tickets/stats"],
  });

  // Organization mutations
  const createOrgMutation = useMutation({
    mutationFn: async (data: Partial<Organization>) => apiRequest("POST", "/api/organizations", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/organizations"] });
      setIsCreateOrgModalOpen(false);
      toast({ title: "Success", description: "Organization created successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create organization", variant: "destructive" });
    },
  });

  const updateOrgMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Organization> }) => 
      apiRequest("PUT", `/api/organizations/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/organizations"] });
      setIsEditOrgModalOpen(false);
      toast({ title: "Success", description: "Organization updated successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update organization", variant: "destructive" });
    },
  });

  const deleteOrgMutation = useMutation({
    mutationFn: async (id: number) => apiRequest("DELETE", `/api/organizations/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/organizations"] });
      toast({ title: "Success", description: "Organization deleted successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete organization", variant: "destructive" });
    },
  });

  // Vendor mutations
  const createVendorMutation = useMutation({
    mutationFn: async (data: Partial<MaintenanceVendor>) => apiRequest("POST", "/api/maintenance-vendors", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/maintenance-vendors"] });
      setIsCreateVendorModalOpen(false);
      toast({ title: "Success", description: "Vendor created successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create vendor", variant: "destructive" });
    },
  });

  const updateVendorMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<MaintenanceVendor> }) => 
      apiRequest("PUT", `/api/maintenance-vendors/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/maintenance-vendors"] });
      setIsEditVendorModalOpen(false);
      toast({ title: "Success", description: "Vendor updated successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update vendor", variant: "destructive" });
    },
  });

  const deleteVendorMutation = useMutation({
    mutationFn: async (id: number) => apiRequest("DELETE", `/api/maintenance-vendors/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/maintenance-vendors"] });
      toast({ title: "Success", description: "Vendor deleted successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete vendor", variant: "destructive" });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async ({ type, id, newPassword }: { type: 'org' | 'vendor'; id: number; newPassword: string }) => {
      const endpoint = type === 'org' 
        ? `/api/organizations/${id}/reset-admin-password`
        : `/api/maintenance-vendors/${id}/reset-admin-password`;
      return apiRequest("POST", endpoint, { newPassword });
    },
    onSuccess: (data: any) => {
      toast({ 
        title: "Success", 
        description: `Password reset. New password: ${data.newPassword}` 
      });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to reset password", variant: "destructive" });
    },
  });

  const handleEditOrganization = (org: Organization) => {
    setSelectedOrganization(org);
    setIsEditOrgModalOpen(true);
  };

  const handleEditVendor = (vendor: MaintenanceVendor) => {
    setSelectedVendor(vendor);
    setIsEditVendorModalOpen(true);
  };

  const handleResetOrgPassword = (id: number, newPassword: string) => {
    resetPasswordMutation.mutate({ type: 'org', id, newPassword });
  };

  const handleResetVendorPassword = (id: number, newPassword: string) => {
    resetPasswordMutation.mutate({ type: 'vendor', id, newPassword });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Settings className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">TaskScout Admin</h1>
                <p className="text-sm text-slate-600">System Management Dashboard</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                Root Admin
              </Badge>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/api/logout">
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-white p-1 shadow-sm">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="organizations" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Organizations
            </TabsTrigger>
            <TabsTrigger value="vendors" className="flex items-center gap-2">
              <Wrench className="h-4 w-4" />
              Vendors
            </TabsTrigger>
            <TabsTrigger value="tickets" className="flex items-center gap-2">
              <TicketIcon className="h-4 w-4" />
              All Tickets
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-blue-100">Total Organizations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{organizations.length}</div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-purple-100">Total Vendors</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{vendors.length}</div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-green-100">Active Tickets</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {ticketStats ? ticketStats.pending + ticketStats.accepted + ticketStats.inProgress : 0}
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-orange-100">High Priority</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{ticketStats?.highPriority || 0}</div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button 
                    onClick={() => setIsCreateOrgModalOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Organization
                  </Button>
                  <Button 
                    onClick={() => setIsCreateVendorModalOpen(true)}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Vendor
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Organizations Tab */}
          <TabsContent value="organizations" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-slate-900">Organizations</h2>
              <Button 
                onClick={() => setIsCreateOrgModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Organization
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {organizations.map((org: Organization) => (
                <Card key={org.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{org.name}</CardTitle>
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditOrganization(org)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteOrgMutation.mutate(org.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <p className="text-sm text-slate-600">{org.description}</p>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline">
                          <Building2 className="h-3 w-3 mr-1" />
                          {org.address || "No address"}
                        </Badge>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full"
                        asChild
                      >
                        <Link href={`/organizations/${org.id}`}>
                          View Details
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Vendors Tab */}
          <TabsContent value="vendors" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-slate-900">Maintenance Vendors</h2>
              <Button 
                onClick={() => setIsCreateVendorModalOpen(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Vendor
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {vendors.map((vendor: MaintenanceVendor) => (
                <Card key={vendor.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{vendor.name}</CardTitle>
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditVendor(vendor)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteVendorMutation.mutate(vendor.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <p className="text-sm text-slate-600">{vendor.description}</p>
                      <div className="flex flex-wrap gap-2">
                        {vendor.specialties?.map((specialty, index) => (
                          <Badge key={index} variant="secondary">
                            {specialty}
                          </Badge>
                        ))}
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full"
                        asChild
                      >
                        <Link href={`/vendors/${vendor.id}`}>
                          View Details
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* All Tickets Tab */}
          <TabsContent value="tickets" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-slate-900">All System Tickets</h2>
              <Badge variant="outline">{tickets.length} Total</Badge>
            </div>

            <TicketTable
              tickets={tickets}
              showActions={false}
              userRole="root"
              userPermissions={[]}
              userId={user?.id}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Modals */}
      <CreateOrganizationModal
        open={isCreateOrgModalOpen}
        onOpenChange={setIsCreateOrgModalOpen}
        onSubmit={(data) => createOrgMutation.mutate(data)}
        isLoading={createOrgMutation.isPending}
      />

      <EditOrganizationModal
        open={isEditOrgModalOpen}
        onOpenChange={setIsEditOrgModalOpen}
        onSubmit={(id, data) => updateOrgMutation.mutate({ id, data })}
        onResetPassword={handleResetOrgPassword}
        isLoading={updateOrgMutation.isPending}
        organization={selectedOrganization}
      />

      <CreateVendorModal
        open={isCreateVendorModalOpen}
        onOpenChange={setIsCreateVendorModalOpen}
        onSubmit={(data) => createVendorMutation.mutate(data)}
        isLoading={createVendorMutation.isPending}
      />

      <EditVendorModal
        open={isEditVendorModalOpen}
        onOpenChange={setIsEditVendorModalOpen}
        onSubmit={(id, data) => updateVendorMutation.mutate({ id, data })}
        onResetPassword={handleResetVendorPassword}
        isLoading={updateVendorMutation.isPending}
        vendor={selectedVendor}
      />
    </div>
  );
}