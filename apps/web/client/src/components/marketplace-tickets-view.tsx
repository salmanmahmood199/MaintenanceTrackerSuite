import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin, DollarSign, Eye, Target } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { MarketplaceTicketModal } from "./marketplace-ticket-modal";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function MarketplaceTicketsView() {
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch marketplace tickets
  const { data: marketplaceTickets = [], isLoading } = useQuery({
    queryKey: ["/api/marketplace/tickets"],
  });

  const handleViewTicket = (ticket: any) => {
    setSelectedTicket(ticket);
    setIsViewModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-2">Marketplace Tickets</h2>
        <p className="text-sm text-muted-foreground">
          Browse and bid on tickets posted to the marketplace by organizations
        </p>
      </div>

      {marketplaceTickets.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No Marketplace Tickets</h3>
            <p className="text-muted-foreground">
              There are currently no tickets available for bidding in the marketplace.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {marketplaceTickets.map((ticket: any) => (
            <Card key={ticket.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-foreground">{ticket.title}</h3>
                      <Badge variant="secondary" className="text-xs">#{ticket.ticketNumber}</Badge>
                    </div>
                    <div className="flex items-center gap-3 mb-3">
                      <Badge variant={ticket.priority === "high" ? "destructive" : ticket.priority === "medium" ? "default" : "secondary"}>
                        {ticket.priority} priority
                      </Badge>
                      <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                        Marketplace
                      </Badge>
                    </div>
                    <p className="text-muted-foreground mb-4 line-clamp-2">{ticket.description}</p>
                    
                    <div className="flex items-center gap-6 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>Posted {formatDistanceToNow(new Date(ticket.createdAt))} ago</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        <span>Organization</span>
                      </div>
                      {ticket.images && ticket.images.length > 0 && (
                        <div className="flex items-center gap-1">
                          <span>Attachments:</span>
                          <Badge variant="outline" className="text-xs">
                            {ticket.images.length} image(s)
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="outline"
                      onClick={() => handleViewTicket(ticket)}
                      className="flex items-center gap-2"
                    >
                      <Eye className="h-4 w-4" />
                      View
                    </Button>
                    <Button
                      onClick={() => handleViewTicket(ticket)}
                      className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
                    >
                      <Target className="h-4 w-4" />
                      Place Bid
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <MarketplaceTicketModal
        ticket={selectedTicket}
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
      />
    </div>
  );
}