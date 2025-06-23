import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin, DollarSign } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { MarketplaceBidModal } from "./marketplace-bid-modal";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function MarketplaceTicketsView() {
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [isBidModalOpen, setIsBidModalOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch marketplace tickets
  const { data: marketplaceTickets = [], isLoading } = useQuery({
    queryKey: ["/api/marketplace/tickets"],
  });

  // Create bid mutation
  const createBidMutation = useMutation({
    mutationFn: async (bidData: any) => {
      return await apiRequest("/api/marketplace/bids", "POST", bidData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/marketplace/tickets"] });
      setIsBidModalOpen(false);
      toast({
        title: "Success",
        description: "Your bid has been submitted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit bid",
        variant: "destructive",
      });
    },
  });

  const handleBidClick = (ticket: any) => {
    setSelectedTicket(ticket);
    setIsBidModalOpen(true);
  };

  const handleSubmitBid = (bidData: any) => {
    createBidMutation.mutate(bidData);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-slate-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900 mb-2">Marketplace Tickets</h2>
        <p className="text-sm text-slate-600">
          Browse and bid on tickets posted to the marketplace by organizations
        </p>
      </div>

      {marketplaceTickets.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <DollarSign className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No Marketplace Tickets</h3>
            <p className="text-slate-600">
              There are currently no tickets available for bidding in the marketplace.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {marketplaceTickets.map((ticket: any) => (
            <Card key={ticket.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{ticket.title}</CardTitle>
                      <Badge variant="secondary">#{ticket.ticketNumber}</Badge>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant={ticket.priority === "high" ? "destructive" : "secondary"}>
                        {ticket.priority} priority
                      </Badge>
                      <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                        Marketplace
                      </Badge>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleBidClick(ticket)}
                    className="bg-blue-600 hover:bg-blue-700"
                    size="sm"
                  >
                    <DollarSign className="h-4 w-4 mr-2" />
                    Place Bid
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-slate-600 line-clamp-2">{ticket.description}</p>
                  
                  <div className="flex items-center gap-6 text-xs text-slate-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>Posted {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}</span>
                    </div>
                    {ticket.locationName && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        <span>{ticket.locationName}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>Organization: {ticket.organizationName}</span>
                    </div>
                  </div>

                  {ticket.images && ticket.images.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500">Attachments:</span>
                      <Badge variant="outline" className="text-xs">
                        {ticket.images.length} image(s)
                      </Badge>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <MarketplaceBidModal
        open={isBidModalOpen}
        onOpenChange={setIsBidModalOpen}
        ticket={selectedTicket}
        onSubmitBid={handleSubmitBid}
        isLoading={createBidMutation.isPending}
      />
    </div>
  );
}