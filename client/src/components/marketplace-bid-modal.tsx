import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, DollarSign } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface MarketplaceBidModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticket: any;
  onSubmitBid: (bidData: {
    ticketId: number;
    bidAmount: string;
    proposedStartDate: string;
    estimatedDuration: number;
    description: string;
  }) => void;
  isLoading: boolean;
}

export function MarketplaceBidModal({
  open,
  onOpenChange,
  ticket,
  onSubmitBid,
  isLoading
}: MarketplaceBidModalProps) {
  const [bidAmount, setBidAmount] = useState("");
  const [proposedStartDate, setProposedStartDate] = useState("");
  const [estimatedDuration, setEstimatedDuration] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = () => {
    if (!bidAmount || !proposedStartDate || !estimatedDuration) return;

    onSubmitBid({
      ticketId: ticket.id,
      bidAmount,
      proposedStartDate,
      estimatedDuration: parseInt(estimatedDuration),
      description,
    });

    // Reset form
    setBidAmount("");
    setProposedStartDate("");
    setEstimatedDuration("");
    setDescription("");
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset form
    setBidAmount("");
    setProposedStartDate("");
    setEstimatedDuration("");
    setDescription("");
  };

  if (!ticket) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Place Bid on Marketplace Ticket</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Ticket Details */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{ticket.title}</CardTitle>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant={ticket.priority === "high" ? "destructive" : "secondary"}>
                      {ticket.priority} priority
                    </Badge>
                    <Badge variant="outline">
                      #{ticket.ticketNumber}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-sm text-slate-600">{ticket.description}</p>
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>Posted {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}</span>
                  </div>
                  {ticket.locationName && (
                    <div className="flex items-center gap-1">
                      <span>Location: {ticket.locationName}</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bid Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Your Bid</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="bid-amount">Bid Amount ($)</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      id="bid-amount"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={bidAmount}
                      onChange={(e) => setBidAmount(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="start-date">Proposed Start Date</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={proposedStartDate}
                    onChange={(e) => setProposedStartDate(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="duration">Estimated Duration (hours)</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="duration"
                    type="number"
                    placeholder="Hours to complete"
                    value={estimatedDuration}
                    onChange={(e) => setEstimatedDuration(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Bid Description (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your approach, experience, or any additional details..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!bidAmount || !proposedStartDate || !estimatedDuration || isLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? "Submitting..." : "Submit Bid"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}