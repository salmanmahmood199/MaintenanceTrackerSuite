import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Building2, Wrench, Users, Activity } from "lucide-react";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import type { Organization, MaintenanceVendor, InsertOrganization, InsertMaintenanceVendor } from "@shared/schema";
import { insertOrganizationSchema, insertMaintenanceVendorSchema } from "@shared/schema";

interface Organization {
  id: number;
  name: string;
  description: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  isActive: boolean;
  createdAt: Date;
}

interface MaintenanceVendor {
  id: number;
  name: string;
  description: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  specialties: string[] | null;
  isActive: boolean;
  createdAt: Date;
}

export default function AdminDashboard() {
  const [isOrgModalOpen, setIsOrgModalOpen] = useState(false);
  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

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

  const handleCreateVendor = (data: InsertMaintenanceVendor) => {
    // Parse specialties from comma-separated string
    const formData = vendorForm.getValues();
    const specialtiesString = formData.specialties as unknown as string;
    const specialtiesArray = specialtiesString 
      ? specialtiesString.split(',').map(s => s.trim()).filter(s => s.length > 0)
      : [];
    
    createVendorMutation.mutate({
      ...data,
      specialties: specialtiesArray,
    });
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
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  ← Back to Dashboard
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-slate-900">System Administration</h1>
                <p className="text-sm text-slate-500">Manage organizations and vendors</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">R</span>
              </div>
              <div>
                <p className="text-sm font-medium">Root Admin</p>
                <p className="text-xs text-slate-500">{user.email}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <CardContent className="p-0">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 font-medium">Organizations</p>
                  <p className="text-2xl font-bold text-slate-900">{organizations.length}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="p-6">
            <CardContent className="p-0">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 font-medium">Vendors</p>
                  <p className="text-2xl font-bold text-slate-900">{vendors.length}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Wrench className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="p-6">
            <CardContent className="p-0">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 font-medium">Total Users</p>
                  <p className="text-2xl font-bold text-slate-900">-</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="p-6">
            <CardContent className="p-0">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 font-medium">System Status</p>
                  <p className="text-2xl font-bold text-green-600">Active</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Activity className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Organizations Section */}
        <Card className="mb-8">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center">
              <Building2 className="h-5 w-5 mr-2" />
              Organizations
            </CardTitle>
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
          </CardHeader>
          <CardContent>
            {orgsLoading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
              </div>
            ) : organizations.length === 0 ? (
              <p className="text-slate-600 text-center py-4">No organizations created yet.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {organizations.map((org) => (
                  <Card key={org.id} className="p-4 hover:shadow-md transition-shadow cursor-pointer">
                    <Link href={`/admin/organizations/${org.id}`}>
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-slate-900">{org.name}</h3>
                        <Badge variant="secondary">Active</Badge>
                      </div>
                      {org.description && (
                        <p className="text-sm text-slate-600 mb-2">{org.description}</p>
                      )}
                      <div className="text-xs text-slate-500 space-y-1">
                        {org.email && <p>Email: {org.email}</p>}
                        {org.phone && <p>Phone: {org.phone}</p>}
                      </div>
                      <div className="mt-3 pt-2 border-t border-slate-100">
                        <p className="text-xs text-primary font-medium">Click to view dashboard →</p>
                      </div>
                    </Link>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Maintenance Vendors Section */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center">
              <Wrench className="h-5 w-5 mr-2" />
              Maintenance Vendors
            </CardTitle>
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
                    <FormField
                      control={vendorForm.control}
                      name="specialties"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Specialties</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="HVAC, Plumbing, Electrical (comma-separated)" 
                              {...field}
                              value={field.value as string || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
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
          </CardHeader>
          <CardContent>
            {vendorsLoading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
              </div>
            ) : vendors.length === 0 ? (
              <p className="text-slate-600 text-center py-4">No maintenance vendors created yet.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {vendors.map((vendor) => (
                  <Card key={vendor.id} className="p-4 hover:shadow-md transition-shadow cursor-pointer">
                    <Link href={`/admin/vendors/${vendor.id}`}>
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-slate-900">{vendor.name}</h3>
                        <Badge variant="secondary">Active</Badge>
                      </div>
                      {vendor.description && (
                        <p className="text-sm text-slate-600 mb-2">{vendor.description}</p>
                      )}
                      {vendor.specialties && vendor.specialties.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {vendor.specialties.map((specialty, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {specialty}
                            </Badge>
                          ))}
                        </div>
                      )}
                      <div className="text-xs text-slate-500 space-y-1">
                        {vendor.email && <p>Email: {vendor.email}</p>}
                        {vendor.phone && <p>Phone: {vendor.phone}</p>}
                      </div>
                      <div className="mt-3 pt-2 border-t border-slate-100">
                        <p className="text-xs text-primary font-medium">Click to view dashboard →</p>
                      </div>
                    </Link>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}