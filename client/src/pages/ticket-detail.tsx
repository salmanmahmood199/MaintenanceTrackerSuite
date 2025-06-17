import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Calendar, Clock, User, MapPin, Building, Wrench, Image, AlertTriangle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import type { Ticket, TicketMilestone } from "@shared/schema";

export default function TicketDetail() {
  const [, params] = useRoute("/tickets/:ticketId");
  const ticketId = params?.ticketId ? parseInt(params.ticketId) : null;
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch ticket details
  const { data: ticket, isLoading: ticketLoading } = useQuery<Ticket>({
    queryKey: [`/api/tickets/${ticketId}`],
    enabled: !!ticketId,
  });

  // Fetch ticket milestones
  const { data: milestones = [], isLoading: milestonesLoading } = useQuery<TicketMilestone[]>({
    queryKey: [`/api/tickets/${ticketId}/milestones`],
    enabled: !!ticketId,
  });

  const canAcceptTickets = user?.permissions?.includes("accept_ticket");
  const canPlaceTickets = user?.permissions?.includes("place_ticket");

  // Accept ticket mutation
  const acceptTicketMutation = useMutation({
    mutationFn: async (data: { maintenanceVendorId?: number; assigneeId?: number }) => {
      return await apiRequest("POST", `/api/tickets/${ticketId}/accept`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tickets/${ticketId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/tickets/${ticketId}/milestones`] });
      toast({
        title: "Success",
        description: "Ticket accepted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to accept ticket",
        variant: "destructive",
      });
    },
  });

  // Complete ticket mutation
  const completeTicketMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", `/api/tickets/${ticketId}/complete`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tickets/${ticketId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/tickets/${ticketId}/milestones`] });
      toast({
        title: "Success",
        description: "Ticket completed successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to complete ticket",
        variant: "destructive",
      });
    },
  });

  const handleAcceptTicket = () => {
    if (user?.role === "maintenance_admin" && user?.maintenanceVendorId) {
      acceptTicketMutation.mutate({ maintenanceVendorId: user.maintenanceVendorId });
    } else {
      acceptTicketMutation.mutate({});
    }
  };

  const handleCompleteTicket = () => {
    completeTicketMutation.mutate();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-blue-100 text-blue-800";
      case "in-progress":
        return "bg-yellow-100 text-yellow-800";
      case "completed":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (ticketLoading) {
    return (
      <div className="min-h-screen bg-slate-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-slate-500">Loading ticket details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="min-h-screen bg-slate-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-slate-500">Ticket not found</p>
            <Link to="/dashboard">
              <Button className="mt-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link to="/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </Link>
              <h1 className="text-xl font-semibold text-slate-900">
                Ticket #{ticket.id}
              </h1>
            </div>
            <div className="flex items-center space-x-3">
              <Badge className={getStatusColor(ticket.status)}>
                {ticket.status.replace('-', ' ')}
              </Badge>
              <Badge className={getPriorityColor(ticket.priority)}>
                {ticket.priority} priority
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Ticket Details */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5" />
                  <span>{ticket.title}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-medium text-slate-900 mb-2">Description</h3>
                  <p className="text-slate-600 whitespace-pre-wrap">{ticket.description}</p>
                </div>

                {ticket.images && ticket.images.length > 0 && (
                  <div>
                    <h3 className="font-medium text-slate-900 mb-2 flex items-center">
                      <Image className="h-4 w-4 mr-2" />
                      Attachments ({ticket.images.length})
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {ticket.images.map((image, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={`/uploads/${image}`}
                            alt={`Attachment ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg border border-slate-200 cursor-pointer hover:opacity-75 transition-opacity"
                            onClick={() => window.open(`/uploads/${image}`, '_blank')}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Milestones */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="h-5 w-5" />
                  <span>Progress Timeline</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {milestonesLoading ? (
                  <p className="text-slate-500">Loading milestones...</p>
                ) : milestones.length > 0 ? (
                  <div className="space-y-4">
                    {milestones.map((milestone, index) => (
                      <div key={milestone.id} className="flex items-start space-x-3">
                        <div className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-900">{milestone.milestoneTitle}</p>
                          {milestone.milestoneDescription && (
                            <p className="text-sm text-slate-600">{milestone.milestoneDescription}</p>
                          )}
                          <div className="flex items-center space-x-2 mt-1">
                            <p className="text-xs text-slate-500">
                              {new Date(milestone.createdAt).toLocaleDateString()}
                            </p>
                            {milestone.achievedByName && (
                              <p className="text-xs text-slate-500">by {milestone.achievedByName}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500">No milestones recorded yet</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Ticket Info */}
            <Card>
              <CardHeader>
                <CardTitle>Ticket Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  <div>
                    <p className="text-sm font-medium text-slate-900">Created</p>
                    <p className="text-sm text-slate-600">
                      {new Date(ticket.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="flex items-center space-x-3">
                  <User className="h-4 w-4 text-slate-400" />
                  <div>
                    <p className="text-sm font-medium text-slate-900">Reporter</p>
                    <p className="text-sm text-slate-600">
                      {ticket.reporterId ? `Reporter ID: ${ticket.reporterId}` : "Unknown"}
                    </p>
                  </div>
                </div>

                {ticket.assigneeId && (
                  <>
                    <Separator />
                    <div className="flex items-center space-x-3">
                      <Wrench className="h-4 w-4 text-slate-400" />
                      <div>
                        <p className="text-sm font-medium text-slate-900">Assigned To</p>
                        <p className="text-sm text-slate-600">Assignee ID: {ticket.assigneeId}</p>
                      </div>
                    </div>
                  </>
                )}

                {ticket.maintenanceVendorId && (
                  <>
                    <Separator />
                    <div className="flex items-center space-x-3">
                      <Building className="h-4 w-4 text-slate-400" />
                      <div>
                        <p className="text-sm font-medium text-slate-900">Vendor</p>
                        <p className="text-sm text-slate-600">Vendor ID: {ticket.maintenanceVendorId}</p>
                      </div>
                    </div>
                  </>
                )}

                {ticket.locationId && (
                  <>
                    <Separator />
                    <div className="flex items-center space-x-3">
                      <MapPin className="h-4 w-4 text-slate-400" />
                      <div>
                        <p className="text-sm font-medium text-slate-900">Location</p>
                        <p className="text-sm text-slate-600">Location ID: {ticket.locationId}</p>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            {canAcceptTickets && (
              <Card>
                <CardHeader>
                  <CardTitle>Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {ticket.status === "open" && (
                    <Button
                      onClick={handleAcceptTicket}
                      disabled={acceptTicketMutation.isPending}
                      className="w-full"
                    >
                      {acceptTicketMutation.isPending ? "Accepting..." : "Accept Ticket"}
                    </Button>
                  )}
                  
                  {ticket.status === "in-progress" && (
                    <Button
                      onClick={handleCompleteTicket}
                      disabled={completeTicketMutation.isPending}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      {completeTicketMutation.isPending ? "Completing..." : "Mark Complete"}
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}