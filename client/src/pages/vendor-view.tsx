import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, Wrench, Clock, Check, AlertTriangle, Users } from "lucide-react";
import { TicketCard } from "@/components/ticket-card";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";
import type { Ticket, MaintenanceVendor } from "@shared/schema";

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

  // Fetch tickets assigned to this vendor
  const { data: tickets = [], isLoading: ticketsLoading } = useQuery<Ticket[]>({
    queryKey: statusFilter === "all" 
      ? ["/api/tickets", { maintenanceVendorId: vendorId }] 
      : ["/api/tickets", { status: statusFilter, maintenanceVendorId: vendorId }],
    queryFn: async () => {
      const url = statusFilter === "all" 
        ? `/api/tickets?maintenanceVendorId=${vendorId}`
        : `/api/tickets?status=${statusFilter}&maintenanceVendorId=${vendorId}`;
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

  // Accept ticket mutation
  const acceptTicketMutation = useMutation({
    mutationFn: (id: number) => apiRequest("POST", `/api/tickets/${id}/accept`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tickets", { maintenanceVendorId: vendorId }] });
      queryClient.invalidateQueries({ queryKey: ["/api/tickets/stats", vendorId] });
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
      queryClient.invalidateQueries({ queryKey: ["/api/tickets", { maintenanceVendorId: vendorId }] });
      queryClient.invalidateQueries({ queryKey: ["/api/tickets/stats", vendorId] });
      toast({
        title: "Success",
        description: "Ticket completed successfully!",
      });
    },
  });

  const handleAcceptTicket = (id: number) => {
    acceptTicketMutation.mutate(id);
  };

  const handleCompleteTicket = (id: number) => {
    completeTicketMutation.mutate(id);
  };

  if (!vendor) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Vendor Not Found</h2>
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
                <h1 className="text-xl font-bold text-slate-900">{vendor.name}</h1>
                <p className="text-sm text-slate-500">Maintenance Vendor Dashboard</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3 pl-4 border-l border-slate-200">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {vendor.name[0]}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium">{vendor.name}</p>
                  <p className="text-xs text-slate-500">Vendor View</p>
                </div>
              </div>
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

        {/* Technician Management Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Technician Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <p className="text-slate-600 mb-4">Manage your technician team and assign tickets</p>
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add Technician
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card className="p-6 mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
            <h2 className="text-lg font-semibold text-slate-900">Assigned Tickets</h2>
            
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
              <p className="text-slate-600">No tickets assigned to this vendor yet.</p>
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
    </div>
  );
}