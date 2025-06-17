import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Building2, Wrench, Users, ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

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
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isOrgModalOpen, setIsOrgModalOpen] = useState(false);
  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);

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
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/organizations", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/organizations"] });
      setIsOrgModalOpen(false);
      toast({
        title: "Success",
        description: "Organization created successfully!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create organization.",
        variant: "destructive",
      });
    },
  });

  // Create vendor mutation
  const createVendorMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/maintenance-vendors", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/maintenance-vendors"] });
      setIsVendorModalOpen(false);
      toast({
        title: "Success",
        description: "Maintenance vendor created successfully!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create maintenance vendor.",
        variant: "destructive",
      });
    },
  });

  const handleCreateOrg = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      address: formData.get("address") as string,
      phone: formData.get("phone") as string,
      email: formData.get("email") as string,
    };
    createOrgMutation.mutate(data);
  };

  const handleCreateVendor = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const specialties = (formData.get("specialties") as string).split(",").map(s => s.trim()).filter(Boolean);
    
    const data = {
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      address: formData.get("address") as string,
      phone: formData.get("phone") as string,
      email: formData.get("email") as string,
      specialties,
    };
    createVendorMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <h1 className="text-xl font-bold text-slate-900">Admin Panel</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3 pl-4 border-l border-slate-200">
                <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {user?.firstName?.[0] || user?.email[0].toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium">{user?.firstName} {user?.lastName}</p>
                  <p className="text-xs text-slate-500">Root Administrator</p>
                </div>
              </div>
              <Button variant="outline" onClick={logout}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
                  <p className="text-sm text-slate-600 font-medium">Maintenance Vendors</p>
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
                  <p className="text-2xl font-bold text-slate-900">1</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Organizations Section */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Organizations</CardTitle>
              <Dialog open={isOrgModalOpen} onOpenChange={setIsOrgModalOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-primary text-white hover:bg-blue-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Organization
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Organization</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreateOrg} className="space-y-4">
                    <div>
                      <Label htmlFor="org-name">Organization Name</Label>
                      <Input id="org-name" name="name" required />
                    </div>
                    <div>
                      <Label htmlFor="org-desc">Description</Label>
                      <Textarea id="org-desc" name="description" />
                    </div>
                    <div>
                      <Label htmlFor="org-address">Address</Label>
                      <Textarea id="org-address" name="address" />
                    </div>
                    <div>
                      <Label htmlFor="org-phone">Phone</Label>
                      <Input id="org-phone" name="phone" type="tel" />
                    </div>
                    <div>
                      <Label htmlFor="org-email">Email</Label>
                      <Input id="org-email" name="email" type="email" />
                    </div>
                    <Button type="submit" disabled={createOrgMutation.isPending}>
                      {createOrgMutation.isPending ? "Creating..." : "Create Organization"}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {orgsLoading ? (
              <div className="text-center py-4">Loading organizations...</div>
            ) : organizations.length === 0 ? (
              <p className="text-slate-600 text-center py-4">No organizations created yet.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {organizations.map((org) => (
                  <Card key={org.id} className="p-4">
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
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Maintenance Vendors Section */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Maintenance Vendors</CardTitle>
              <Dialog open={isVendorModalOpen} onOpenChange={setIsVendorModalOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-primary text-white hover:bg-blue-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Vendor
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Maintenance Vendor</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreateVendor} className="space-y-4">
                    <div>
                      <Label htmlFor="vendor-name">Vendor Name</Label>
                      <Input id="vendor-name" name="name" required />
                    </div>
                    <div>
                      <Label htmlFor="vendor-desc">Description</Label>
                      <Textarea id="vendor-desc" name="description" />
                    </div>
                    <div>
                      <Label htmlFor="vendor-specialties">Specialties (comma-separated)</Label>
                      <Input id="vendor-specialties" name="specialties" placeholder="plumbing, electrical, hvac" />
                    </div>
                    <div>
                      <Label htmlFor="vendor-address">Address</Label>
                      <Textarea id="vendor-address" name="address" />
                    </div>
                    <div>
                      <Label htmlFor="vendor-phone">Phone</Label>
                      <Input id="vendor-phone" name="phone" type="tel" />
                    </div>
                    <div>
                      <Label htmlFor="vendor-email">Email</Label>
                      <Input id="vendor-email" name="email" type="email" />
                    </div>
                    <Button type="submit" disabled={createVendorMutation.isPending}>
                      {createVendorMutation.isPending ? "Creating..." : "Create Vendor"}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {vendorsLoading ? (
              <div className="text-center py-4">Loading vendors...</div>
            ) : vendors.length === 0 ? (
              <p className="text-slate-600 text-center py-4">No maintenance vendors created yet.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {vendors.map((vendor) => (
                  <Card key={vendor.id} className="p-4">
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