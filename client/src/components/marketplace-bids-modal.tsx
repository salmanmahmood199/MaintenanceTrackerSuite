import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, Clock, DollarSign, User, Calendar } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { Ticket } from "@shared/schema";

interface MarketplaceBidsModalProps {
  ticket: Ticket | null;
  isOpen: boolean;
  onClose: () => void;
}

interface MarketplaceBid {
  id: number;
  vendorId: number;
  hourlyRate: number;
  estimatedHours: number;
  responseTime: string;
  parts: any[];
  totalAmount: number;
  additionalNotes: string;
  status: string;
  approved?: boolean;
  rejectionReason?: string;
  counterOffer?: number;
  counterNotes?: string;
  isSuperseded?: boolean;
  supersededByBidId?: number;
  previousBidId?: number;
  version?: number;
  createdAt: string;
  vendor: {
    id: number;
    name: string;
    email: string;
  };
}

export function MarketplaceBidsModal({ ticket, isOpen, onClose }: MarketplaceBidsModalProps) {
  const [selectedBidId, setSelectedBidId] = useState<number | null>(null);
  const [actionType, setActionType] = useState<"accept" | "reject" | "counter" | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [counterAmount, setCounterAmount] = useState("");
  const [counterNotes, setCounterNotes] = useState("");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch bids for this ticket
  const { data: bids = [], isLoading } = useQuery<MarketplaceBid[]>({
    queryKey: ["/api/tickets", ticket?.id, "bids"],
    queryFn: async () => {
      if (!ticket?.id) return [];
      const response = await apiRequest("GET", `/api/tickets/${ticket.id}/bids`);
      return await response.json();
    },
    enabled: !!ticket?.id && isOpen,
  });

  // Accept bid mutation
  const acceptBidMutation = useMutation({
    mutationFn: async (bidId: number) => {
      await apiRequest("POST", `/api/marketplace/bids/${bidId}/accept`);
    },
    onSuccess: () => {
      toast({
        title: "Bid Accepted",
        description: "The bid has been accepted and the vendor has been notified.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tickets", ticket?.id, "bids"] });
      resetForm();
      onClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to accept bid. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Reject bid mutation
  const rejectBidMutation = useMutation({
    mutationFn: async ({ bidId, reason }: { bidId: number; reason: string }) => {
      await apiRequest("POST", `/api/marketplace/bids/${bidId}/reject`, { rejectionReason: reason });
    },
    onSuccess: () => {
      toast({
        title: "Bid Rejected",
        description: "The bid has been rejected and the vendor has been notified.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/tickets", ticket?.id, "bids"] });
      resetForm();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to reject bid. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Counter bid mutation
  const counterBidMutation = useMutation({
    mutationFn: async ({ bidId, counterOffer, notes }: { bidId: number; counterOffer: number; notes: string }) => {
      await apiRequest("POST", `/api/marketplace/bids/${bidId}/counter`, { 
        counterOffer, 
        counterNotes: notes 
      });
    },
    onSuccess: () => {
      toast({
        title: "Counter Offer Sent",
        description: "Your counter offer has been sent to the vendor.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/tickets", ticket?.id, "bids"] });
      resetForm();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send counter offer. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Approve bid mutation
  const approveBidMutation = useMutation({
    mutationFn: async (bidId: number) => {
      await apiRequest("POST", `/api/marketplace/bids/${bidId}/approve`);
    },
    onSuccess: () => {
      toast({
        title: "Bid Approved",
        description: "The bid has been approved and the ticket has been assigned to the vendor.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tickets", ticket?.id, "bids"] });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to approve bid: ${error.message || "Please try again."}`,
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setSelectedBidId(null);
    setActionType(null);
    setRejectionReason("");
    setCounterAmount("");
    setCounterNotes("");
  };

  const handleAction = (bidId: number, action: "accept" | "reject" | "counter") => {
    console.log('handleAction called:', { bidId, action });
    setSelectedBidId(bidId);
    setActionType(action);
    console.log('State set:', { selectedBidId: bidId, actionType: action });

    if (action === "accept") {
      acceptBidMutation.mutate(bidId);
    }
  };

  const handleReject = () => {
    if (!selectedBidId || !rejectionReason.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide a reason for rejection.",
        variant: "destructive",
      });
      return;
    }

    rejectBidMutation.mutate({ bidId: selectedBidId, reason: rejectionReason });
  };

  const handleCounter = () => {
    console.log('handleCounter called:', { selectedBidId, counterAmount, counterNotes });
    
    if (!selectedBidId || !counterAmount || !counterNotes.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide counter amount and notes.",
        variant: "destructive",
      });
      return;
    }

    console.log('Submitting counter offer:', { 
      bidId: selectedBidId, 
      counterOffer: parseFloat(counterAmount), 
      notes: counterNotes 
    });

    counterBidMutation.mutate({ 
      bidId: selectedBidId, 
      counterOffer: parseFloat(counterAmount), 
      notes: counterNotes 
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "accepted":
        return <Badge className="bg-green-100 text-green-800">Accepted</Badge>;
      case "rejected":
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      case "counter":
        return <Badge className="bg-yellow-100 text-yellow-800">Counter Offered</Badge>;
      default:
        return <Badge className="bg-blue-100 text-blue-800">Pending</Badge>;
    }
  };

  if (!ticket) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Marketplace Bids - {ticket.ticketNumber}
          </DialogTitle>
          <DialogDescription>
            Review and manage bids from vendors for this marketplace ticket.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto min-h-0 space-y-4 pr-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">Loading bids...</div>
            </div>
          ) : bids.length === 0 ? (
            <div className="text-center py-8">
              <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Bids Yet</h3>
              <p className="text-muted-foreground">
                No vendors have submitted bids for this ticket yet.
              </p>
            </div>
          ) : (
            <>
              {bids.map((bid) => (
                <Card key={bid.id} className={`border ${bid.isSuperseded ? 'border-red-300 dark:border-red-600' : ''}`}>
                  <CardHeader>
                    {bid.isSuperseded && (
                      <div className="bg-red-100 dark:bg-red-900/50 border border-red-300 dark:border-red-600 p-3 rounded-md mb-4">
                        <div className="flex items-center gap-2">
                          <XCircle className="h-5 w-5 text-red-600" />
                          <span className="font-semibold text-red-800 dark:text-red-200">This bid has been updated</span>
                        </div>
                        <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                          This is an older version (v{bid.version}) of the bid. A newer version has been submitted.
                        </p>
                      </div>
                    )}
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <User className="h-5 w-5" />
                          {bid.vendor.name}
                          {bid.version && bid.version > 1 && (
                            <Badge variant="outline" className="ml-2">v{bid.version}</Badge>
                          )}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">{bid.vendor.email}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(bid.status)}
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {formatDistanceToNow(new Date(bid.createdAt))} ago
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Bid Details */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-muted dark:bg-slate-800 p-3 rounded-md">
                        <Label className="text-xs text-muted-foreground">Hourly Rate</Label>
                        <div className="text-lg font-semibold text-foreground">${bid.hourlyRate}</div>
                      </div>
                      <div className="bg-muted dark:bg-slate-800 p-3 rounded-md">
                        <Label className="text-xs text-muted-foreground">Estimated Hours</Label>
                        <div className="text-lg font-semibold text-foreground">{bid.estimatedHours}</div>
                      </div>
                      <div className="bg-muted dark:bg-slate-800 p-3 rounded-md">
                        <Label className="text-xs text-muted-foreground">Total Amount</Label>
                        <div className="text-lg font-semibold text-green-600 dark:text-green-400">${bid.totalAmount}</div>
                      </div>
                    </div>

                    {/* Response Time */}
                    {bid.responseTime && (
                      <div>
                        <Label className="text-sm font-medium text-foreground">Response Time</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-foreground">{bid.responseTime}</span>
                        </div>
                      </div>
                    )}

                    {/* Parts */}
                    {bid.parts && bid.parts.length > 0 && (
                      <div>
                        <Label className="text-sm font-medium text-foreground">Required Parts</Label>
                        <div className="mt-2 space-y-1">
                          {bid.parts.map((part: any, index: number) => (
                            <div key={index} className="flex justify-between text-sm bg-muted dark:bg-slate-800 text-foreground p-2 rounded">
                              <span>{part.name} × {part.quantity}</span>
                              <span>${(part.estimatedCost * part.quantity).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Additional Notes */}
                    {bid.additionalNotes && (
                      <div>
                        <Label className="text-sm font-medium text-foreground">Additional Notes</Label>
                        <p className="text-sm text-muted-foreground mt-1">{bid.additionalNotes}</p>
                      </div>
                    )}

                    {/* Counter Offer or Rejection Details */}
                    {bid.status === "rejected" && bid.rejectionReason && (
                      <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 p-3 rounded-md">
                        <Label className="text-sm font-medium text-red-800 dark:text-red-200">Rejection Reason</Label>
                        <p className="text-sm text-red-700 dark:text-red-300 mt-1">{bid.rejectionReason}</p>
                      </div>
                    )}

                    {bid.status === "counter" && bid.counterOffer && (
                      <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 p-3 rounded-md">
                        <Label className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Counter Offer</Label>
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-lg font-semibold text-yellow-700 dark:text-yellow-300">${bid.counterOffer}</span>
                        </div>
                        {bid.counterNotes && (
                          <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-2">{bid.counterNotes}</p>
                        )}
                      </div>
                    )}

                    {/* Action Buttons */}
                    {bid.status === "pending" && !bid.isSuperseded && (
                      <div className="flex gap-2 pt-2">
                        <Button
                          onClick={() => handleAction(bid.id, "accept")}
                          disabled={acceptBidMutation.isPending}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Accept
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleAction(bid.id, "reject")}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleAction(bid.id, "counter")}
                        >
                          <DollarSign className="h-4 w-4 mr-1" />
                          Counter
                        </Button>
                      </div>
                    )}
                    
                    {/* Disabled Action Buttons for Superseded Bids */}
                    {bid.status === "pending" && bid.isSuperseded && (
                      <div className="flex gap-2 pt-2">
                        <Button
                          disabled={true}
                          className="bg-gray-300 text-gray-500 cursor-not-allowed"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Accept (Superseded)
                        </Button>
                        <Button
                          variant="outline"
                          disabled={true}
                          className="border-gray-300 text-gray-500 cursor-not-allowed"
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject (Superseded)
                        </Button>
                        <Button
                          variant="outline"
                          disabled={true}
                          className="border-gray-300 text-gray-500 cursor-not-allowed"
                        >
                          <DollarSign className="h-4 w-4 mr-1" />
                          Counter (Superseded)
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </>
          )}
        </div>

        {/* Action Forms - Fixed at bottom */}
        {actionType === "reject" && selectedBidId && (
          <div className="border-t pt-4 bg-background flex-shrink-0 mt-4">
            <h4 className="font-medium mb-2">Reject Bid</h4>
            <div className="space-y-3">
              <div>
                <Label htmlFor="rejectionReason">Reason for Rejection</Label>
                <Textarea
                  id="rejectionReason"
                  placeholder="Please provide a reason for rejecting this bid..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleReject}
                  disabled={rejectBidMutation.isPending || !rejectionReason.trim()}
                  variant="destructive"
                >
                  {rejectBidMutation.isPending ? "Rejecting..." : "Reject Bid"}
                </Button>
                <Button variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {actionType === "counter" && selectedBidId && (
          <div className="border-t bg-blue-50 dark:bg-blue-950/20 p-4 rounded-md flex-shrink-0 mt-4">
            <h4 className="font-semibold text-lg mb-4 text-blue-900 dark:text-blue-100">Counter Offer</h4>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="counterAmount" className="text-sm font-medium">Counter Amount ($)</Label>
                  <Input
                    id="counterAmount"
                    type="number"
                    step="0.01"
                    placeholder="Enter your counter amount"
                    value={counterAmount}
                    onChange={(e) => setCounterAmount(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div className="flex items-end">
                  <div className="text-sm text-muted-foreground">
                    Original: ${bids.find(b => b.id === selectedBidId)?.totalAmount || '0'}
                  </div>
                </div>
              </div>
              <div>
                <Label htmlFor="counterNotes" className="text-sm font-medium">Counter Offer Notes</Label>
                <Textarea
                  id="counterNotes"
                  placeholder="Explain your counter offer and any conditions..."
                  value={counterNotes}
                  onChange={(e) => setCounterNotes(e.target.value)}
                  rows={4}
                  className="mt-1 resize-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <Button
                  onClick={handleCounter}
                  disabled={counterBidMutation.isPending || !counterAmount || !counterNotes.trim()}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {counterBidMutation.isPending ? "Sending..." : "Send Counter Offer"}
                </Button>
                <Button variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}