import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ResidentialTicketModal } from "@/components/residential-ticket-modal";
import { MarketplaceBidsModal } from "@/components/marketplace-bids-modal";
import { useAuth } from "@/hooks/useAuth";
import { Ticket } from "@shared/schema";
import { Plus, Home, MapPin, Clock, AlertCircle, LogOut, Eye } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

function ResidentialDashboard() {
  const { user } = useAuth();
  const [showCreateTicket, setShowCreateTicket] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [selectedBidsTicket, setSelectedBidsTicket] = useState<Ticket | null>(null);
  const [showBidsModal, setShowBidsModal] = useState(false);
  const queryClient = useQueryClient();

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Important for session cookies
      });
      
      if (!response.ok) {
        throw new Error(`Logout failed: ${response.status} ${response.statusText}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      console.log('Logout successful');
      queryClient.clear();
      window.location.href = "/login";
    },
    onError: (error) => {
      console.error('Logout error:', error);
      // Even if logout fails on server, clear local state and redirect
      queryClient.clear();
      window.location.href = "/login";
    },
  });

  const handleLogout = () => {
    console.log('Logout button clicked');
    logoutMutation.mutate();
  };

  const { data: tickets = [], isLoading } = useQuery<Ticket[]>({
    queryKey: ["/api/tickets"],
    enabled: !!user,
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "marketplace":
        return <Badge className="bg-blue-500">Open for Bids</Badge>;
      case "accepted":
        return <Badge className="bg-green-500">Accepted</Badge>;
      case "in-progress":
        return <Badge className="bg-yellow-500">In Progress</Badge>;
      case "completed":
        return <Badge className="bg-purple-500">Completed</Badge>;
      case "pending_confirmation":
        return <Badge className="bg-orange-500">Pending Confirmation</Badge>;
      case "confirmed":
        return <Badge className="bg-green-600">Confirmed</Badge>;
      case "ready_for_billing":
        return <Badge className="bg-indigo-500">Ready for Billing</Badge>;
      case "billed":
        return <Badge className="bg-gray-500">Billed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityIcon = (priority: string) => {
    if (priority === "high") {
      return <AlertCircle className="w-4 h-4 text-red-500" />;
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg">
                <Home className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  TaskScout Residential
                </h1>
                <p className="text-sm text-muted-foreground">
                  Welcome back, {user?.firstName} {user?.lastName}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button 
                onClick={() => setShowCreateTicket(true)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Request Service
              </Button>
              <Button
                variant="outline"
                onClick={handleLogout}
                disabled={logoutMutation.isPending}
                className="border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
              >
                <LogOut className="w-4 h-4 mr-2" />
                {logoutMutation.isPending ? "Logging out..." : "Logout"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Address Info */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <span className="text-sm">
                Service Address: {(user as any)?.address || 'Loading...'}, {(user as any)?.city || ''}, {(user as any)?.state || ''} {(user as any)?.zipCode || ''}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Service Requests */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Your Service Requests</h2>
            <span className="text-sm text-muted-foreground">
              {tickets.length} total requests
            </span>
          </div>

          {tickets.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <Home className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No service requests yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Get started by requesting your first maintenance service.
                  </p>
                  <Button 
                    onClick={() => setShowCreateTicket(true)}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Request Service
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {tickets.map((ticket) => (
                <Card key={ticket.id} className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          {getPriorityIcon(ticket.priority)}
                          <h3 className="font-medium">{ticket.title}</h3>
                          <span className="text-xs text-muted-foreground">
                            #{ticket.ticketNumber}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {ticket.description}
                        </p>
                        <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                          <div className="flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>
                              {ticket.createdAt 
                                ? new Date(ticket.createdAt).toLocaleDateString()
                                : "Unknown"
                              }
                            </span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <MapPin className="w-3 h-3" />
                            <span>
                              {ticket.residentialAddress 
                                ? `${ticket.residentialCity}, ${ticket.residentialState}`
                                : "Home"
                              }
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="ml-4 flex flex-col items-end space-y-2">
                        {getStatusBadge(ticket.status)}
                        {ticket.status === "marketplace" && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedBidsTicket(ticket);
                              setShowBidsModal(true);
                            }}
                            className="text-xs"
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            View Bids
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Residential Ticket Creation Modal */}
      {showCreateTicket && user && (
        <ResidentialTicketModal 
          open={showCreateTicket}
          onOpenChange={setShowCreateTicket}
          userId={user.id}
        />
      )}

      {/* Marketplace Bids Modal */}
      {selectedBidsTicket && (
        <MarketplaceBidsModal
          ticket={selectedBidsTicket}
          isOpen={showBidsModal}
          onClose={() => {
            setShowBidsModal(false);
            setSelectedBidsTicket(null);
          }}
        />
      )}
    </div>
  );
}

export default ResidentialDashboard;