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
  // Modal states for future implementation
  
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

  // Future implementation for CRUD operations

  return (
    <div className="min-h-screen taskscout-bg">
      {/* Header */}
      <header className="taskscout-card border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 taskscout-gradient rounded-lg flex items-center justify-center">
                <Settings className="h-5 w-5 text-background" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">TaskScout Admin</h1>
                <p className="text-sm text-muted-foreground">System Management Dashboard</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
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
          <TabsList className="grid w-full grid-cols-4 taskscout-card shadow-sm border border-border p-1">
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
              <Card className="taskscout-gradient text-background border-0">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-background/80">Total Organizations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{organizations.length}</div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-r from-teal-600 to-teal-700 text-white border-0">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-teal-100">Total Vendors</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{vendors.length}</div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white border-0">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-emerald-100">Active Tickets</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {ticketStats ? ticketStats.pending + ticketStats.accepted + ticketStats.inProgress : 0}
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-r from-amber-600 to-amber-700 text-white border-0">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-amber-100">High Priority</CardTitle>
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
                  <Button className="taskscout-gradient text-background hover:opacity-90">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Organization
                  </Button>
                  <Button className="bg-teal-600 hover:bg-teal-700 text-white">
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
              <h2 className="text-xl font-semibold text-foreground">Organizations</h2>
              <Button className="taskscout-gradient text-background hover:opacity-90">
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
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
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
              <h2 className="text-xl font-semibold text-foreground">Maintenance Vendors</h2>
              <Button className="bg-teal-600 hover:bg-teal-700 text-white">
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
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
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
              <h2 className="text-xl font-semibold text-foreground">All System Tickets</h2>
              <Badge variant="outline" className="border-primary text-primary">{tickets.length} Total</Badge>
            </div>

            <TicketTable
              tickets={tickets}
              showActions={false}
              userRole="root"
              userPermissions={[]}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Modals will be implemented later */}
    </div>
  );
}