import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Clock, MapPin, DollarSign, Eye, Target, Edit, FileText } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { MarketplaceTicketModal } from "./marketplace-ticket-modal";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface VendorBid {
  id: number;
  ticketId: number;
  vendorId: number;
  hourlyRate: string;
  estimatedHours: string;
  responseTime: string;
  parts: any[];
  totalAmount: string;
  additionalNotes: string;
  status: string;
  rejectionReason?: string;
  counterOffer?: string;
  counterNotes?: string;
  approved?: boolean;
  createdAt: string;
  updatedAt: string;
  ticket: {
    id: number;
    ticketNumber: string;
    title: string;
    priority: string;
  };
}

interface MarketplaceTicket {
  id: number;
  ticketNumber: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  createdAt: string;
  images?: string[];
  locationId?: number;
  residentialAddress?: string;
  residentialCity?: string;
  residentialState?: string;
  residentialZip?: string;
}

// Bid Details Modal Component
function BidDetailsModal({ bid, isOpen, onClose }: { bid: VendorBid | null; isOpen: boolean; onClose: () => void }) {
  if (!bid) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Bid Details - {bid.ticket.title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Ticket Number</label>
              <p className="text-foreground">#{bid.ticket.ticketNumber}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Status</label>
              <Badge variant={bid.status === 'pending' ? 'default' : bid.status === 'accepted' ? 'default' : 'destructive'}>
                {bid.status}
              </Badge>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Total Bid Amount</label>
              <p className="text-foreground font-bold text-2xl">${bid.totalAmount}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Response Time</label>
              <p className="text-foreground font-medium">{bid.responseTime}</p>
            </div>
          </div>

          {bid.additionalNotes && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">Additional Notes</label>
              <p className="text-foreground mt-1 p-3 bg-muted rounded">{bid.additionalNotes}</p>
            </div>
          )}

          {bid.counterOffer && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded border">
              <label className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Counter Offer</label>
              <p className="text-yellow-900 dark:text-yellow-100 font-bold">${bid.counterOffer}</p>
              {bid.counterNotes && (
                <p className="text-yellow-700 dark:text-yellow-300 text-sm mt-1">{bid.counterNotes}</p>
              )}
            </div>
          )}

          {bid.rejectionReason && (
            <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded border">
              <label className="text-sm font-medium text-red-800 dark:text-red-200">Rejection Reason</label>
              <p className="text-red-900 dark:text-red-100 text-sm mt-1">{bid.rejectionReason}</p>
            </div>
          )}

          <div className="text-xs text-muted-foreground">
            Submitted: {formatDistanceToNow(new Date(bid.createdAt))} ago
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function MarketplaceTicketsView() {
  const [selectedTicket, setSelectedTicket] = useState<MarketplaceTicket | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isBidModalOpen, setIsBidModalOpen] = useState(false);
  const [selectedBid, setSelectedBid] = useState<VendorBid | null>(null);
  const [isBidDetailsOpen, setIsBidDetailsOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch marketplace tickets
  const { data: marketplaceTickets = [], isLoading } = useQuery<MarketplaceTicket[]>({
    queryKey: ["/api/marketplace/tickets"],
  });

  // Fetch vendor bids
  const { data: vendorBids = [], isLoading: bidsLoading } = useQuery<VendorBid[]>({
    queryKey: ["/api/marketplace/vendor-bids"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/marketplace/vendor-bids");
      return await response.json();
    },
  });

  // Get existing bid for a ticket
  const getExistingBid = (ticketId: number) => {
    return vendorBids.find(bid => bid.ticketId === ticketId);
  };

  const handleViewTicket = (ticket: MarketplaceTicket) => {
    setSelectedTicket(ticket);
    setIsViewModalOpen(true);
  };

  const handlePlaceBid = (ticket: MarketplaceTicket) => {
    setSelectedTicket(ticket);
    setIsBidModalOpen(true);
  };

  const handleViewBidDetails = (bid: VendorBid) => {
    setSelectedBid(bid);
    setIsBidDetailsOpen(true);
  };

  if (isLoading || bidsLoading) {
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

  // Sort vendor bids by creation date (newest first)
  const sortedVendorBids = [...vendorBids].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-2">Marketplace</h2>
        <p className="text-sm text-muted-foreground">
          Browse available tickets and manage your bids
        </p>
      </div>

      <Tabs defaultValue="available" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-muted p-1 rounded-lg">
          <TabsTrigger 
            value="available" 
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm font-medium transition-all"
          >
            Available Marketplace Tickets
          </TabsTrigger>
          <TabsTrigger 
            value="bids" 
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm font-medium transition-all"
          >
            Your Bids ({vendorBids.length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="available" className="space-y-4 mt-4">

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
              {marketplaceTickets.map((ticket: any) => {
                const existingBid = getExistingBid(ticket.id);
                return (
                  <Card key={ticket.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-foreground">{ticket.title}</h3>
                            <Badge variant="secondary" className="text-xs">#{ticket.ticketNumber}</Badge>
                            {existingBid && (
                              <Badge 
                                variant={
                                  existingBid.status === 'pending' ? 'default' : 
                                  existingBid.status === 'accepted' ? 'default' : 
                                  existingBid.status === 'counter' ? 'default' : 
                                  'destructive'
                                }
                                className={`text-xs ${
                                  existingBid.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                                  existingBid.status === 'accepted' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                                  existingBid.status === 'counter' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400' :
                                  'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                                }`}
                              >
                                Bid: {existingBid.status === 'counter' ? 'Counter Offer' : existingBid.status}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mb-3">
                            <Badge variant={ticket.priority === "high" ? "destructive" : ticket.priority === "medium" ? "default" : "secondary"}>
                              {ticket.priority} priority
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{ticket.description}</p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {formatDistanceToNow(new Date(ticket.createdAt))} ago
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {ticket.residentialCity && ticket.residentialState && ticket.residentialZip 
                                ? `${ticket.residentialCity}, ${ticket.residentialState} ${ticket.residentialZip}`
                                : "Organization ticket"
                              }
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleViewTicket(ticket)}>
                            <Eye className="h-4 w-4 mr-1" />
                            View Details
                          </Button>
                          <Button 
                            size="sm" 
                            onClick={() => handlePlaceBid(ticket)}
                            className="bg-green-600 hover:bg-green-700 text-white"
                            disabled={existingBid?.status === 'accepted'}
                          >
                            <DollarSign className="h-4 w-4 mr-1" />
                            {existingBid ? "Update Bid" : "Place Bid"}
                          </Button>
                        </div>
                      </div>
              </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="bids" className="space-y-4 mt-4">
          {sortedVendorBids.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No Bids Yet</h3>
                <p className="text-muted-foreground">
                  You haven't submitted any marketplace bids yet. Browse available tickets to get started.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {sortedVendorBids.map((bid) => (
                <Card key={bid.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-foreground">{bid.ticket.title}</h3>
                          <Badge variant="secondary" className="text-xs">#{bid.ticket.ticketNumber}</Badge>
                          <Badge 
                            variant={
                              bid.status === 'pending' ? 'default' : 
                              bid.status === 'accepted' ? 'default' : 
                              bid.status === 'counter' ? 'default' : 
                              'destructive'
                            }
                            className={`${
                              bid.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                              bid.status === 'accepted' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                              bid.status === 'counter' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400' :
                              'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                            }`}
                          >
                            {bid.status === 'counter' ? 'Counter Offer' : bid.status}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 mb-3">
                          <div>
                            <span className="text-xs text-muted-foreground">Your Bid</span>
                            <p className="font-semibold text-lg text-foreground">${bid.totalAmount}</p>
                          </div>
                          <div>
                            <span className="text-xs text-muted-foreground">Response Time</span>
                            <p className="font-medium text-foreground">{bid.responseTime}</p>
                          </div>
                        </div>

                        {bid.status === 'counter' && bid.counterOffer && (
                          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded mb-3">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Counter Offer:</span>
                              <span className="font-bold text-yellow-900 dark:text-yellow-100">${bid.counterOffer}</span>
                            </div>
                            {bid.counterNotes && (
                              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">{bid.counterNotes}</p>
                            )}
                          </div>
                        )}

                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {formatDistanceToNow(new Date(bid.createdAt))} ago
                          </div>
                          <div className="flex items-center gap-1">
                            <Target className="h-4 w-4" />
                            {bid.responseTime}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleViewBidDetails(bid)}>
                          <FileText className="h-4 w-4 mr-1" />
                          Details
                        </Button>
                        {bid.status === 'pending' && (
                          <Button variant="outline" size="sm" onClick={() => handlePlaceBid(marketplaceTickets.find((t: MarketplaceTicket) => t.id === bid.ticketId)!)}>
                            <Edit className="h-4 w-4 mr-1" />
                            Edit Bid
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* View Ticket Details Modal (Read-only) */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              {selectedTicket?.ticketNumber} - {selectedTicket?.title}
            </DialogTitle>
          </DialogHeader>
          {selectedTicket && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Priority</label>
                  <Badge variant={selectedTicket.priority === "high" ? "destructive" : selectedTicket.priority === "medium" ? "default" : "secondary"}>
                    {selectedTicket.priority} priority
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <Badge variant="outline">{selectedTicket.status}</Badge>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">Description</label>
                <p className="text-foreground mt-1">{selectedTicket.description}</p>
              </div>

              {selectedTicket.residentialAddress && (
                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-2 mb-1">
                    <MapPin className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-sm font-medium text-blue-900 dark:text-blue-100">Service Address</span>
                  </div>
                  <div className="ml-6">
                    <p className="text-blue-900 dark:text-blue-100">
                      {selectedTicket.residentialAddress}
                    </p>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      {selectedTicket.residentialCity}, {selectedTicket.residentialState} {selectedTicket.residentialZip}
                    </p>
                  </div>
                </div>
              )}

              {selectedTicket.images && selectedTicket.images.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Images</label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {selectedTicket.images.map((image, index) => (
                      <img
                        key={index}
                        src={image}
                        alt={`Ticket image ${index + 1}`}
                        className="w-full h-32 object-cover rounded border"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Place/Update Bid Modal */}
      <MarketplaceTicketModal
        ticket={selectedTicket}
        isOpen={isBidModalOpen}
        onClose={() => setIsBidModalOpen(false)}
      />

      <BidDetailsModal
        bid={selectedBid}
        isOpen={isBidDetailsOpen}
        onClose={() => setIsBidDetailsOpen(false)}
      />
    </div>
  );
}