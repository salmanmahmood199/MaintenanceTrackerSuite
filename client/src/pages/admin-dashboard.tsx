import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Building2, Wrench, Users, Activity, Edit, Key, Trash2, LogOut, X, Calendar } from "lucide-react";
import { Link, useLocation } from "wouter";
import { EditOrganizationModal } from "@/components/edit-organization-modal";
import { EditVendorModal } from "@/components/edit-vendor-modal";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import type { Organization, MaintenanceVendor, InsertOrganization, InsertMaintenanceVendor, UpdateOrganization, UpdateMaintenanceVendor } from "@shared/schema";
import { insertOrganizationSchema, insertMaintenanceVendorSchema } from "@shared/schema";

export default function AdminDashboard() {
  const [isOrgModalOpen, setIsOrgModalOpen] = useState(false);
  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
  const [isEditOrgModalOpen, setIsEditOrgModalOpen] = useState(false);
  const [isEditVendorModalOpen, setIsEditVendorModalOpen] = useState(false);
  const [selectedOrganization, setSelectedOrganization] = useState<Organization | null>(null);
  const [selectedVendor, setSelectedVendor] = useState<MaintenanceVendor | null>(null);
  const [vendorSpecialties, setVendorSpecialties] = useState<string[]>([]);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();
  const [, navigate] = useLocation();

  const availableSpecialties = ["HVAC", "Electrical", "Plumbing", "Other"];

  // Organization form
  const orgForm = useForm<InsertOrganization>({
    resolver: zodResolver(insertOrganizationSchema),
    defaultValues: {
      name: "",
      description: "",
      address: "",
      phone: "",
      email: "",
    },
  });

  // Vendor form
  const vendorForm = useForm<InsertMaintenanceVendor>({
    resolver: zodResolver(insertMaintenanceVendorSchema),
    defaultValues: {
      name: "",
      description: "",
      address: "",
      phone: "",
      email: "",
      specialties: [],
    },
  });

  // Fetch organizations
  const { data: organizations = [], isLoading: orgsLoading } = useQuery<Organization[]>({
    queryKey: ["/api/organizations"],
  });

  // Fetch maintenance vendors
  const { data: vendors = [], isLoading: vendorsLoading } = useQuery<MaintenanceVendor[]>({
    queryKey: ["/api/maintenance-vendors"],
  });

  // Create organization mutation
  const createOrgMutation = useMutation({
    mutationFn: (data: InsertOrganization) => apiRequest("POST", "/api/organizations", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/organizations"] });
      setIsOrgModalOpen(false);
      orgForm.reset();
      toast({
        title: "Success",
        description: "Organization created successfully!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create organization. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Create vendor mutation
  const createVendorMutation = useMutation({
    mutationFn: (data: InsertMaintenanceVendor) => apiRequest("POST", "/api/maintenance-vendors", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/maintenance-vendors"] });
      setIsVendorModalOpen(false);
      vendorForm.reset();
      toast({
        title: "Success",
        description: "Maintenance vendor created successfully!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create vendor. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleCreateOrg = (data: InsertOrganization) => {
    createOrgMutation.mutate(data);
  };

  // Edit organization mutation
  const editOrgMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateOrganization }) => 
      apiRequest("PATCH", `/api/organizations/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/organizations"] });
      setIsEditOrgModalOpen(false);
      setSelectedOrganization(null);
      toast({
        title: "Success",
        description: "Organization updated successfully!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update organization.",
        variant: "destructive",
      });
    },
  });

  // Edit vendor mutation
  const editVendorMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateMaintenanceVendor }) => 
      apiRequest("PATCH", `/api/maintenance-vendors/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/maintenance-vendors"] });
      setIsEditVendorModalOpen(false);
      setSelectedVendor(null);
      toast({
        title: "Success",
        description: "Vendor updated successfully!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update vendor.",
        variant: "destructive",
      });
    },
  });

  // Reset organization admin password mutation
  const resetOrgPasswordMutation = useMutation({
    mutationFn: ({ id, newPassword }: { id: number; newPassword: string }) => 
      apiRequest("POST", `/api/organizations/${id}/reset-admin-password`, { newPassword }),
    onSuccess: (response) => {
      toast({
        title: "Password Reset",
        description: `New admin password set successfully`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to reset admin password.",
        variant: "destructive",
      });
    },
  });

  // Reset vendor admin password mutation
  const resetVendorPasswordMutation = useMutation({
    mutationFn: ({ id, newPassword }: { id: number; newPassword: string }) => 
      apiRequest("POST", `/api/maintenance-vendors/${id}/reset-admin-password`, { newPassword }),
    onSuccess: (response) => {
      toast({
        title: "Password Reset",
        description: `New admin password set successfully`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to reset admin password.",
        variant: "destructive",
      });
    },
  });

  const handleCreateVendor = (data: InsertMaintenanceVendor) => {
    createVendorMutation.mutate({
      ...data,
      specialties: vendorSpecialties,
    });
  };

  const addVendorSpecialty = (specialty: string) => {
    if (!vendorSpecialties.includes(specialty)) {
      setVendorSpecialties([...vendorSpecialties, specialty]);
    }
  };

  const removeVendorSpecialty = (specialty: string) => {
    setVendorSpecialties(vendorSpecialties.filter(s => s !== specialty));
  };

  const handleEditOrganization = (id: number, data: UpdateOrganization) => {
    editOrgMutation.mutate({ id, data });
  };

  const handleEditVendor = (id: number, data: UpdateMaintenanceVendor) => {
    editVendorMutation.mutate({ id, data });
  };

  const handleResetOrgPassword = (id: number, newPassword: string) => {
    resetOrgPasswordMutation.mutate({ id, newPassword });
  };

  const handleResetVendorPassword = (id: number, newPassword: string) => {
    resetVendorPasswordMutation.mutate({ id, newPassword });
  };

  const openEditOrgModal = (organization: Organization) => {
    setSelectedOrganization(organization);
    setIsEditOrgModalOpen(true);
  };

  const openEditVendorModal = (vendor: MaintenanceVendor) => {
    setSelectedVendor(vendor);
    setIsEditVendorModalOpen(true);
  };

  if (!user || user.role !== "root") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Access Denied</h2>
          <p className="text-slate-600">You don't have permission to view this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <div className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-sidebar-border">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground text-sm font-bold">D</span>
            </div>
            <span className="text-xl font-bold text-sidebar-foreground">Dashboard</span>
          </div>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          <div className="flex items-center px-3 py-2 text-sm font-medium text-sidebar-primary bg-sidebar-accent rounded-lg">
            <Building2 className="h-4 w-4 mr-3" />
            Home
          </div>
          <div className="flex items-center px-3 py-2 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent rounded-lg cursor-pointer">
            <Building2 className="h-4 w-4 mr-3" />
            Organizations
          </div>
          <div className="flex items-center px-3 py-2 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent rounded-lg cursor-pointer">
            <Wrench className="h-4 w-4 mr-3" />
            Vendors
          </div>
          <div className="flex items-center px-3 py-2 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent rounded-lg cursor-pointer">
            <Activity className="h-4 w-4 mr-3" />
            Tickets
          </div>
          <Link to="/calendar">
            <div className="flex items-center px-3 py-2 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent rounded-lg cursor-pointer">
              <Calendar className="h-4 w-4 mr-3" />
              Calendar
            </div>
          </Link>
        </nav>
        
        {/* User Profile */}
        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <span className="text-primary-foreground text-sm font-medium">R</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-sidebar-foreground">root@mail.com</p>
              <p className="text-xs text-muted-foreground">Logout</p>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => window.location.href = '/api/logout'}
              className="text-sidebar-foreground hover:bg-sidebar-accent"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-card border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Home</h1>
              <p className="text-muted-foreground">System Analytics Dashboard</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm font-medium text-foreground">
                  Root Admin
                </div>
                <div className="text-sm text-muted-foreground">{user.email}</div>
              </div>
              <Button variant="outline" onClick={() => window.location.href = '/api/logout'}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <div className="flex-1 p-6">
          {/* Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="bg-blue-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-100 font-medium">Organizations</p>
                    <p className="text-2xl font-bold text-white">{organizations.length}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                    <Building2 className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-pink-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-pink-100 font-medium">Vendors</p>
                    <p className="text-2xl font-bold text-white">{vendors.length}</p>
                  </div>
                  <div className="w-12 h-12 bg-pink-500 rounded-lg flex items-center justify-center">
                    <Wrench className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-cyan-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-cyan-100 font-medium">Sub-Admins</p>
                    <p className="text-2xl font-bold text-white">11</p>
                  </div>
                  <div className="w-12 h-12 bg-cyan-500 rounded-lg flex items-center justify-center">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-green-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-100 font-medium">Locations</p>
                    <p className="text-2xl font-bold text-white">4</p>
                  </div>
                  <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                    <Activity className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-orange-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-orange-100 font-medium">Tickets</p>
                    <p className="text-2xl font-bold text-white">13</p>
                  </div>
                  <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center">
                    <Activity className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Organizations Overview */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-foreground">Organizations Overview</h2>
              <Dialog open={isOrgModalOpen} onOpenChange={setIsOrgModalOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Organization
                  </Button>
                </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Organization</DialogTitle>
                </DialogHeader>
                <Form {...orgForm}>
                  <form onSubmit={orgForm.handleSubmit(handleCreateOrg)} className="space-y-4">
                    <FormField
                      control={orgForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="Organization name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={orgForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Organization description" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={orgForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="contact@organization.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={orgForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone</FormLabel>
                          <FormControl>
                            <Input placeholder="Phone number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={orgForm.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Full address" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={createOrgMutation.isPending}
                    >
                      {createOrgMutation.isPending ? "Creating..." : "Create Organization"}
                    </Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
          
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left p-4 font-medium text-muted-foreground">Organization</th>
                        <th className="text-left p-4 font-medium text-muted-foreground">Sub-Admins</th>
                        <th className="text-left p-4 font-medium text-muted-foreground">Locations</th>
                        <th className="text-left p-4 font-medium text-muted-foreground">Vendors</th>
                        <th className="text-left p-4 font-medium text-muted-foreground">Active Tickets</th>
                        <th className="text-left p-4 font-medium text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orgsLoading ? (
                        <tr>
                          <td colSpan={6} className="text-center py-8">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                          </td>
                        </tr>
                      ) : organizations.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center py-8 text-muted-foreground">
                            No organizations created yet.
                          </td>
                        </tr>
                      ) : (
                        organizations.map((org) => (
                          <tr key={org.id} className="border-b border-border hover:bg-muted/50">
                            <td className="p-4">
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                                  <Building2 className="h-4 w-4 text-white" />
                                </div>
                                <div>
                                  <div className="font-medium text-foreground">{org.name}</div>
                                  {org.description && (
                                    <div className="text-sm text-muted-foreground">{org.description}</div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center justify-center w-8 h-8 bg-muted rounded-full">
                                <span className="text-sm font-medium text-foreground">5</span>
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center justify-center w-8 h-8 bg-muted rounded-full">
                                <span className="text-sm font-medium text-foreground">2</span>
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center justify-center w-8 h-8 bg-muted rounded-full">
                                <span className="text-sm font-medium text-foreground">7</span>
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center justify-center w-8 h-8 bg-muted rounded-full">
                                <span className="text-sm font-medium text-foreground">0</span>
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center space-x-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openEditOrgModal(org)}
                                  className="text-muted-foreground hover:text-foreground"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => navigate(`/organization/${org.id}`)}
                                  className="text-primary hover:text-primary-foreground hover:bg-primary"
                                >
                                  →
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Maintenance Vendors Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-foreground">Maintenance Vendors</h2>
              <Dialog open={isVendorModalOpen} onOpenChange={setIsVendorModalOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Vendor
                  </Button>
                </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Maintenance Vendor</DialogTitle>
                </DialogHeader>
                <Form {...vendorForm}>
                  <form onSubmit={vendorForm.handleSubmit(handleCreateVendor)} className="space-y-4">
                    <FormField
                      control={vendorForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="Vendor name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={vendorForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Vendor description" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Specialties</label>
                      <Select onValueChange={addVendorSpecialty}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select specialties to add..." />
                        </SelectTrigger>
                        <SelectContent>
                          {availableSpecialties
                            .filter(specialty => !vendorSpecialties.includes(specialty))
                            .map((specialty) => (
                              <SelectItem key={specialty} value={specialty}>
                                {specialty}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <div className="flex flex-wrap gap-2">
                        {vendorSpecialties.map((specialty) => (
                          <Badge key={specialty} variant="secondary" className="flex items-center gap-1">
                            {specialty}
                            <X 
                              className="h-3 w-3 cursor-pointer" 
                              onClick={() => removeVendorSpecialty(specialty)}
                            />
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <FormField
                      control={vendorForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="contact@vendor.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={vendorForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone</FormLabel>
                          <FormControl>
                            <Input placeholder="Phone number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={vendorForm.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Full address" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={createVendorMutation.isPending}
                    >
                      {createVendorMutation.isPending ? "Creating..." : "Create Vendor"}
                    </Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
            
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left p-4 font-medium text-muted-foreground">Vendor</th>
                        <th className="text-left p-4 font-medium text-muted-foreground">Specialties</th>
                        <th className="text-left p-4 font-medium text-muted-foreground">Technicians</th>
                        <th className="text-left p-4 font-medium text-muted-foreground">Active Jobs</th>
                        <th className="text-left p-4 font-medium text-muted-foreground">Revenue</th>
                        <th className="text-left p-4 font-medium text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vendorsLoading ? (
                        <tr>
                          <td colSpan={6} className="text-center py-8">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                          </td>
                        </tr>
                      ) : vendors.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center py-8 text-muted-foreground">
                            No maintenance vendors created yet.
                          </td>
                        </tr>
                      ) : (
                        vendors.map((vendor) => (
                          <tr key={vendor.id} className="border-b border-border hover:bg-muted/50">
                            <td className="p-4">
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-pink-600 rounded-lg flex items-center justify-center">
                                  <Wrench className="h-4 w-4 text-white" />
                                </div>
                                <div>
                                  <div className="font-medium text-foreground">{vendor.name}</div>
                                  {vendor.description && (
                                    <div className="text-sm text-muted-foreground">{vendor.description}</div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="flex flex-wrap gap-1">
                                {vendor.specialties?.slice(0, 2).map((specialty, idx) => (
                                  <Badge key={idx} variant="outline" className="text-xs">
                                    {specialty}
                                  </Badge>
                                ))}
                                {vendor.specialties && vendor.specialties.length > 2 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{vendor.specialties.length - 2}
                                  </Badge>
                                )}
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center justify-center w-8 h-8 bg-muted rounded-full">
                                <span className="text-sm font-medium text-foreground">3</span>
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center justify-center w-8 h-8 bg-muted rounded-full">
                                <span className="text-sm font-medium text-foreground">2</span>
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="text-sm font-medium text-foreground">$2,400</div>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center space-x-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openEditVendorModal(vendor)}
                                  className="text-muted-foreground hover:text-foreground"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => navigate(`/vendor/${vendor.id}`)}
                                  className="text-primary hover:text-primary-foreground hover:bg-primary"
                                >
                                  →
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Edit Organization Modal */}
          <EditOrganizationModal
            open={isEditOrgModalOpen}
            onOpenChange={setIsEditOrgModalOpen}
            onSubmit={handleEditOrganization}
            onResetPassword={handleResetOrgPassword}
            isLoading={editOrgMutation.isPending || resetOrgPasswordMutation.isPending}
            organization={selectedOrganization}
          />

          {/* Edit Vendor Modal */}
          <EditVendorModal
            open={isEditVendorModalOpen}
            onOpenChange={setIsEditVendorModalOpen}
            onSubmit={handleEditVendor}
            onResetPassword={handleResetVendorPassword}
            isLoading={editVendorMutation.isPending || resetVendorPasswordMutation.isPending}
            vendor={selectedVendor}
          />
        </div>
      </div>
    </div>
  );
}