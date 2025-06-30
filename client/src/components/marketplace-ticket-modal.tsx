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
import { useAuth } from "@/hooks/useAuth";
import { MapPin, Calendar, Clock, DollarSign, Wrench, Plus, Trash2 } from "lucide-react";
import type { Ticket } from "@shared/schema";

interface MarketplaceTicketModalProps {
  ticket: Ticket | null;
  isOpen: boolean;
  onClose: () => void;
}

interface PartItem {
  id: string;
  name: string;
  estimatedCost: number;
  quantity: number;
}

export function MarketplaceTicketModal({ ticket, isOpen, onClose }: MarketplaceTicketModalProps) {
  const [hourlyRate, setHourlyRate] = useState("");
  const [estimatedHours, setEstimatedHours] = useState("");
  const [responseTime, setResponseTime] = useState("");
  const [parts, setParts] = useState<PartItem[]>([]);
  const [newPartName, setNewPartName] = useState("");
  const [newPartCost, setNewPartCost] = useState("");
  const [newPartQuantity, setNewPartQuantity] = useState("1");
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const vendorId = user?.maintenanceVendorId;

  // Check if vendor has already submitted a bid for this ticket
  const { data: existingBid } = useQuery({
    queryKey: ["/api/tickets", ticket?.id, "vendor-bid", vendorId],
    queryFn: async () => {
      if (!ticket?.id || !vendorId) return null;
      const response = await apiRequest("GET", `/api/tickets/${ticket.id}/bids`);
      const bids = await response.json();
      return bids.find((bid: any) => bid.vendorId === vendorId) || null;
    },
    enabled: !!ticket?.id && !!vendorId,
  });

  const placeBidMutation = useMutation({
    mutationFn: async (bidData: any) => {
      console.log("Submitting bid data:", bidData);
      await apiRequest("POST", "/api/marketplace/bids", bidData);
    },
    onSuccess: () => {
      toast({
        title: "Bid Placed Successfully",
        description: "Your bid has been submitted for review.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/marketplace/tickets"] });
      onClose();
      resetForm();
    },
    onError: (error: any) => {
      console.error("Bid submission error:", error);
      toast({
        title: "Error",
        description: `Failed to place bid: ${error.message || "Please try again."}`,
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setHourlyRate("");
    setEstimatedHours("");
    setResponseTime("");
    setParts([]);
    setNewPartName("");
    setNewPartCost("");
    setNewPartQuantity("1");
    setAdditionalNotes("");
  };

  const addPart = () => {
    if (!newPartName || !newPartCost) return;
    
    const newPart: PartItem = {
      id: Date.now().toString(),
      name: newPartName,
      estimatedCost: parseFloat(newPartCost),
      quantity: parseInt(newPartQuantity) || 1,
    };
    
    setParts([...parts, newPart]);
    setNewPartName("");
    setNewPartCost("");
    setNewPartQuantity("1");
  };

  const removePart = (partId: string) => {
    setParts(parts.filter(p => p.id !== partId));
  };

  const calculateTotalBid = () => {
    const laborCost = (parseFloat(hourlyRate) || 0) * (parseFloat(estimatedHours) || 0);
    const partsCost = parts.reduce((sum, part) => sum + (part.estimatedCost * part.quantity), 0);
    return laborCost + partsCost;
  };

  const handlePlaceBid = () => {
    if (!ticket || !hourlyRate || !estimatedHours || !responseTime) {
      toast({
        title: "Missing Information",
        description: "Please provide hourly rate, estimated hours, and response time.",
        variant: "destructive",
      });
      return;
    }

    const bidData = {
      ticketId: ticket.id,
      hourlyRate: parseFloat(hourlyRate),
      estimatedHours: parseFloat(estimatedHours),
      responseTime,
      parts: parts,
      totalAmount: calculateTotalBid(),
      additionalNotes,
    };

    console.log("Submitting bid data:", bidData);
    placeBidMutation.mutate(bidData);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "medium": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "low": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
    }
  };

  if (!ticket) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              {ticket.ticketNumber} - {ticket.title}
            </DialogTitle>
            <DialogDescription>
              Review ticket details and submit your bid with hourly rate, estimated hours, and required parts.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-hidden">
            {/* Left Column - Ticket Details */}
            <ScrollArea className="h-[600px] pr-4">
              <div className="space-y-4">
                {/* Basic Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Ticket Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge className={getPriorityColor(ticket.priority)}>
                        {ticket.priority?.toUpperCase()}
                      </Badge>
                      <Badge variant="outline">{ticket.status}</Badge>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      Created: {new Date(ticket.createdAt).toLocaleDateString()}
                    </div>

                    {ticket.locationId && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        Location ID: {ticket.locationId}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Description */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Description</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm whitespace-pre-wrap">{ticket.description}</p>
                  </CardContent>
                </Card>

                {/* Media Files */}
                {ticket.images && ticket.images.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Media Files</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-2">
                        {ticket.images.map((fileName, index) => {
                          const fullPath = fileName.startsWith('/uploads/') ? fileName : `/uploads/${fileName}`;
                          const isVideo = fullPath?.toLowerCase().includes('.mp4') ||
                                         fullPath?.toLowerCase().includes('.mov') ||
                                         fullPath?.toLowerCase().includes('.avi') ||
                                         fullPath?.toLowerCase().includes('.webm');
                          
                          return isVideo ? (
                            <video
                              key={index}
                              src={fullPath}
                              className="w-full h-24 object-cover rounded-md cursor-pointer hover:opacity-80 transition-opacity"
                              controls={false}
                              muted
                              preload="metadata"
                              onClick={() => setSelectedImage(fullPath)}
                              onError={(e) => {
                                console.log("Video failed to load:", fileName);
                                console.log("Video detection result:", isVideo);
                                console.log("Full path:", fullPath);
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          ) : (
                            <img
                              key={index}
                              src={fullPath}
                              alt={`Ticket media ${index + 1}`}
                              className="w-full h-24 object-cover rounded-md cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() => setSelectedImage(fullPath)}
                              onError={(e) => {
                                console.log("Image failed to load:", fileName);
                                console.log("Video detection result:", isVideo);
                                console.log("Full path:", fullPath);
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </ScrollArea>

            {/* Right Column - Bidding Form */}
            <ScrollArea className="h-[600px] pr-4">
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <DollarSign className="h-5 w-5" />
                      Place Your Bid
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Labor Costs */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="hourlyRate">Hourly Rate ($)</Label>
                        <Input
                          id="hourlyRate"
                          type="number"
                          step="0.01"
                          placeholder="35.00"
                          value={hourlyRate}
                          onChange={(e) => setHourlyRate(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="estimatedHours">Estimated Hours</Label>
                        <Input
                          id="estimatedHours"
                          type="number"
                          step="0.5"
                          placeholder="4"
                          value={estimatedHours}
                          onChange={(e) => setEstimatedHours(e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Response Time */}
                    <div>
                      <Label htmlFor="responseTime">How quickly can you arrive?</Label>
                      <Input
                        id="responseTime"
                        placeholder="e.g., Within 2 hours, Same day, Next business day"
                        value={responseTime}
                        onChange={(e) => setResponseTime(e.target.value)}
                      />
                    </div>

                    <Separator />

                    {/* Parts Section */}
                    <div>
                      <Label className="text-sm font-medium">Required Parts</Label>
                      
                      {/* Add Part Form */}
                      <div className="grid grid-cols-12 gap-2 mt-2">
                        <Input
                          placeholder="Part name"
                          value={newPartName}
                          onChange={(e) => setNewPartName(e.target.value)}
                          className="col-span-5"
                        />
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="Cost"
                          value={newPartCost}
                          onChange={(e) => setNewPartCost(e.target.value)}
                          className="col-span-3"
                        />
                        <Input
                          type="number"
                          placeholder="Qty"
                          value={newPartQuantity}
                          onChange={(e) => setNewPartQuantity(e.target.value)}
                          className="col-span-2"
                        />
                        <Button
                          type="button"
                          size="sm"
                          onClick={addPart}
                          className="col-span-2"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Parts List */}
                      {parts.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {parts.map((part) => (
                            <div key={part.id} className="flex items-center justify-between p-2 bg-muted rounded-md">
                              <div className="flex-1">
                                <span className="font-medium">{part.name}</span>
                                <span className="text-sm text-muted-foreground ml-2">
                                  ${part.estimatedCost.toFixed(2)} × {part.quantity} = ${(part.estimatedCost * part.quantity).toFixed(2)}
                                </span>
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => removePart(part.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <Separator />

                    {/* Total Calculation */}
                    <div className="bg-muted p-3 rounded-md">
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Labor ({estimatedHours || 0} hrs × ${hourlyRate || 0}):</span>
                          <span>${((parseFloat(hourlyRate) || 0) * (parseFloat(estimatedHours) || 0)).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Parts:</span>
                          <span>${parts.reduce((sum, part) => sum + (part.estimatedCost * part.quantity), 0).toFixed(2)}</span>
                        </div>
                        <Separator className="my-2" />
                        <div className="flex justify-between font-medium">
                          <span>Total Bid:</span>
                          <span>${calculateTotalBid().toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Additional Notes */}
                    <div>
                      <Label htmlFor="additionalNotes">Additional Notes (Optional)</Label>
                      <Textarea
                        id="additionalNotes"
                        placeholder="Any additional information about your approach or timeline..."
                        value={additionalNotes}
                        onChange={(e) => setAdditionalNotes(e.target.value)}
                        rows={3}
                      />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      {existingBid ? (
                        <div className="flex items-center gap-2 w-full">
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            Bid Submitted
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            Status: {existingBid.approved ? "Approved" : existingBid.status === "rejected" ? "Rejected" : "Pending"}
                          </span>
                        </div>
                      ) : (
                        <Button
                          onClick={handlePlaceBid}
                          disabled={placeBidMutation.isPending || !hourlyRate || !estimatedHours || !responseTime}
                          className="flex-1"
                        >
                          {placeBidMutation.isPending ? "Placing Bid..." : "Place Bid"}
                        </Button>
                      )}
                      <Button variant="outline" onClick={onClose}>
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>

      {/* Media Viewer Modal */}
      {selectedImage && (
        <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Media Preview</DialogTitle>
            </DialogHeader>
            {selectedImage.toLowerCase().includes('.mp4') ||
             selectedImage.toLowerCase().includes('.mov') ||
             selectedImage.toLowerCase().includes('.avi') ||
             selectedImage.toLowerCase().includes('.webm') ? (
              <video
                src={selectedImage}
                controls
                className="w-full h-auto max-h-[70vh] object-contain rounded-lg"
              />
            ) : (
              <img
                src={selectedImage}
                alt="Enlarged view"
                className="w-full h-auto max-h-[70vh] object-contain rounded-lg"
              />
            )}
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}