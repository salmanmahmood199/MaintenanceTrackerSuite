import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Clock, DollarSign, AlertCircle, CheckCircle, XCircle, MessageSquare } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
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

export function VendorBidsView() {
  const [selectedBid, setSelectedBid] = useState<VendorBid | null>(null);
  const [isResponseModalOpen, setIsResponseModalOpen] = useState(false);
  const [responseAmount, setResponseAmount] = useState("");
  const [responseNotes, setResponseNotes] = useState("");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch vendor bids
  const { data: vendorBids = [], isLoading } = useQuery<VendorBid[]>({
    queryKey: ["/api/marketplace/vendor-bids"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/marketplace/vendor-bids");
      return await response.json();
    },
  });

  // Update bid mutation (for responding to counter offers)
  const updateBidMutation = useMutation({
    mutationFn: async ({ bidId, updateData }: { bidId: number; updateData: any }) => {
      await apiRequest("PUT", `/api/marketplace/bids/${bidId}`, updateData);
    },
    onSuccess: () => {
      toast({
        title: "Bid Updated",
        description: "Your bid has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/marketplace/vendor-bids"] });
      setIsResponseModalOpen(false);
      setSelectedBid(null);
      setResponseAmount("");
      setResponseNotes("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update bid. Please try again.",
        variant: "destructive",
      });
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case "accepted":
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"><CheckCircle className="h-3 w-3 mr-1" />Accepted</Badge>;
      case "rejected":
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      case "counter":
        return <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"><MessageSquare className="h-3 w-3 mr-1" />Counter Offer</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">Unknown</Badge>;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "medium": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "low": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
    }
  };

  const handleRespondToCounter = (bid: VendorBid) => {
    setSelectedBid(bid);
    setResponseAmount(bid.counterOffer || "");
    setResponseNotes(bid.counterNotes || "");
    setIsResponseModalOpen(true);
  };

  const handleSubmitResponse = () => {
    if (!selectedBid || !responseAmount || !responseNotes.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide both amount and notes for your response.",
        variant: "destructive",
      });
      return;
    }

    updateBidMutation.mutate({
      bidId: selectedBid.id,
      updateData: {
        totalAmount: parseFloat(responseAmount),
        additionalNotes: responseNotes,
        status: "pending" // Reset to pending after counter response
      }
    });
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

  const counterOffers = vendorBids.filter(bid => bid.status === "counter");
  const otherBids = vendorBids.filter(bid => bid.status !== "counter");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-2">Your Marketplace Bids</h2>
        <p className="text-sm text-muted-foreground">
          Track the status of your submitted bids and respond to counter offers
        </p>
      </div>

      {/* Counter Offers Section */}
      {counterOffers.length > 0 && (
        <div>
          <h3 className="text-lg font-medium text-foreground mb-4 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-500" />
            Counter Offers Received ({counterOffers.length})
          </h3>
          <div className="space-y-4 mb-8">
            {counterOffers.map((bid) => (
              <Card key={bid.id} className="border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/20">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        {bid.ticket.ticketNumber} - {bid.ticket.title}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={getPriorityColor(bid.ticket.priority)}>
                          {bid.ticket.priority} priority
                        </Badge>
                        {getStatusBadge(bid.status)}
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Updated {formatDistanceToNow(new Date(bid.updatedAt))} ago
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-background p-3 rounded-md">
                      <Label className="text-xs text-muted-foreground">Your Original Bid</Label>
                      <div className="text-lg font-semibold">${bid.totalAmount}</div>
                    </div>
                    <div className="bg-orange-100 dark:bg-orange-900/30 p-3 rounded-md">
                      <Label className="text-xs text-muted-foreground">Counter Offer</Label>
                      <div className="text-lg font-semibold text-orange-700 dark:text-orange-300">${bid.counterOffer}</div>
                    </div>
                    <div className="bg-background p-3 rounded-md">
                      <Label className="text-xs text-muted-foreground">Difference</Label>
                      <div className={`text-lg font-semibold ${
                        parseFloat(bid.counterOffer || "0") > parseFloat(bid.totalAmount) 
                          ? "text-green-600" 
                          : "text-red-600"
                      }`}>
                        {parseFloat(bid.counterOffer || "0") > parseFloat(bid.totalAmount) ? "+" : ""}
                        ${(parseFloat(bid.counterOffer || "0") - parseFloat(bid.totalAmount)).toFixed(2)}
                      </div>
                    </div>
                  </div>

                  {bid.counterNotes && (
                    <div className="bg-background p-3 rounded-md">
                      <Label className="text-xs text-muted-foreground">Counter Offer Notes</Label>
                      <p className="text-sm mt-1">{bid.counterNotes}</p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button 
                      onClick={() => handleRespondToCounter(bid)}
                      className="bg-orange-600 hover:bg-orange-700"
                    >
                      Respond to Counter Offer
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Other Bids Section */}
      {otherBids.length > 0 && (
        <div>
          <h3 className="text-lg font-medium text-foreground mb-4">All Your Bids</h3>
          <div className="space-y-4">
            {otherBids.map((bid) => (
              <Card key={bid.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        {bid.ticket.ticketNumber} - {bid.ticket.title}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={getPriorityColor(bid.ticket.priority)}>
                          {bid.ticket.priority} priority
                        </Badge>
                        {getStatusBadge(bid.status)}
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Submitted {formatDistanceToNow(new Date(bid.createdAt))} ago
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-muted p-3 rounded-md">
                      <Label className="text-xs text-muted-foreground">Hourly Rate</Label>
                      <div className="text-lg font-semibold">${bid.hourlyRate}/hr</div>
                    </div>
                    <div className="bg-muted p-3 rounded-md">
                      <Label className="text-xs text-muted-foreground">Estimated Hours</Label>
                      <div className="text-lg font-semibold">{bid.estimatedHours} hrs</div>
                    </div>
                    <div className="bg-muted p-3 rounded-md">
                      <Label className="text-xs text-muted-foreground">Total Amount</Label>
                      <div className="text-lg font-semibold text-green-600">${bid.totalAmount}</div>
                    </div>
                  </div>

                  {bid.rejectionReason && (
                    <div className="mt-4 bg-red-50 dark:bg-red-950/20 p-3 rounded-md">
                      <Label className="text-xs text-muted-foreground">Rejection Reason</Label>
                      <p className="text-sm mt-1 text-red-700 dark:text-red-300">{bid.rejectionReason}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {vendorBids.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No Bids Yet</h3>
            <p className="text-muted-foreground">
              You haven't submitted any marketplace bids yet. Browse available tickets to get started.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Response Modal */}
      <Dialog open={isResponseModalOpen} onOpenChange={setIsResponseModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Respond to Counter Offer</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label htmlFor="responseAmount">Your Response Amount ($)</Label>
              <Input
                id="responseAmount"
                type="number"
                step="0.01"
                placeholder="Enter your final amount"
                value={responseAmount}
                onChange={(e) => setResponseAmount(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="responseNotes">Response Notes</Label>
              <Textarea
                id="responseNotes"
                placeholder="Explain your response to the counter offer..."
                value={responseNotes}
                onChange={(e) => setResponseNotes(e.target.value)}
                rows={4}
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button
                onClick={handleSubmitResponse}
                disabled={updateBidMutation.isPending || !responseAmount || !responseNotes.trim()}
                className="flex-1"
              >
                {updateBidMutation.isPending ? "Submitting..." : "Submit Response"}
              </Button>
              <Button variant="outline" onClick={() => setIsResponseModalOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}