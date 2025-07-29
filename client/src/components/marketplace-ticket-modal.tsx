import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { MapPin, Calendar, DollarSign, Wrench, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { Ticket, Location } from "@shared/schema";

// Location Info Component
interface LocationInfoProps {
  locationId: number;
}

function LocationInfo({ locationId }: LocationInfoProps) {
  const { data: location } = useQuery<Location>({
    queryKey: ["/api/location", locationId],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/locations/${locationId}`);
      return await response.json();
    }
  });

  if (!location) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <MapPin className="h-4 w-4" />
        Loading location...
      </div>
    );
  }

  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
      <div className="flex items-center gap-2 mb-1">
        <MapPin className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        <span className="text-sm font-medium text-blue-900 dark:text-blue-100">Service Location</span>
      </div>
      <div className="ml-6">
        <p className="font-semibold text-blue-900 dark:text-blue-100">{location.name}</p>
        {location.address && (
          <p className="text-sm text-blue-700 dark:text-blue-300">{location.address}</p>
        )}
      </div>
    </div>
  );
}

interface MarketplaceTicketModalProps {
  ticket: Ticket | null;
  isOpen: boolean;
  onClose: () => void;
}



export function MarketplaceTicketModal({ ticket, isOpen, onClose }: MarketplaceTicketModalProps) {
  const [totalAmount, setTotalAmount] = useState("");
  const [responseTimeValue, setResponseTimeValue] = useState("");
  const [responseTimeUnit, setResponseTimeUnit] = useState("hours");
  const [responseDate, setResponseDate] = useState<Date | undefined>(undefined);
  const [responseTime, setResponseTime] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const vendorId = user?.maintenanceVendorId;

  // Check if vendor has already submitted a bid for this ticket
  const { data: existingBid } = useQuery({
    queryKey: ["/api/marketplace/vendor-bids", ticket?.id],
    queryFn: async () => {
      if (!ticket?.id) return null;
      const response = await apiRequest("GET", "/api/marketplace/vendor-bids");
      const bids = await response.json();
      return bids.find((bid: any) => bid.ticketId === ticket.id) || null;
    },
    enabled: !!ticket?.id && isOpen,
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

  // Update bid mutation
  const updateBidMutation = useMutation({
    mutationFn: async ({ bidId, bidData }: { bidId: number, bidData: any }) => {
      console.log("Updating bid data:", bidData);
      await apiRequest("PUT", `/api/marketplace/bids/${bidId}`, bidData);
    },
    onSuccess: () => {
      toast({
        title: "Bid Updated Successfully",
        description: "Your bid has been updated.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/marketplace/tickets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/marketplace/vendor-bids"] });
      onClose();
      resetForm();
    },
    onError: (error: any) => {
      console.error("Bid update error:", error);
      toast({
        title: "Error",
        description: `Failed to update bid: ${error.message || "Please try again."}`,
        variant: "destructive",
      });
    },
  });

  // Pre-populate form when existingBid changes
  useEffect(() => {
    if (existingBid && isOpen) {
      setTotalAmount(existingBid.totalAmount || "");
      setAdditionalNotes(existingBid.additionalNotes || "");
      
      // Parse response time to extract value and unit
      const responseTimeStr = existingBid.responseTime;
      if (responseTimeStr.includes("hour")) {
        const match = responseTimeStr.match(/(\d+)\s+hours?/);
        if (match) {
          setResponseTimeValue(match[1]);
          setResponseTimeUnit("hours");
        }
      } else if (responseTimeStr.includes("By")) {
        const match = responseTimeStr.match(/By .+?\((\d+)\s+(\w+)\)/);
        if (match) {
          setResponseTimeValue(match[1]);
          setResponseTimeUnit(match[2] + "s"); // days/weeks
        }
      }
    } else if (isOpen) {
      resetForm();
    }
  }, [existingBid, isOpen]);

  // Update response time string when value or unit changes
  useEffect(() => {
    if (responseTimeValue && responseTimeUnit) {
      if (responseTimeUnit === "hours") {
        setResponseTime(`${responseTimeValue} ${responseTimeValue === "1" ? "hour" : "hours"}`);
      } else if (responseTimeUnit === "days" || responseTimeUnit === "weeks") {
        if (responseDate) {
          const dateStr = format(responseDate, "MMM dd, yyyy");
          setResponseTime(`By ${dateStr} (${responseTimeValue} ${responseTimeValue === "1" ? responseTimeUnit.slice(0, -1) : responseTimeUnit})`);
        } else {
          setResponseTime(`${responseTimeValue} ${responseTimeValue === "1" ? responseTimeUnit.slice(0, -1) : responseTimeUnit}`);
        }
      }
    } else {
      setResponseTime("");
    }
  }, [responseTimeValue, responseTimeUnit, responseDate]);

  const resetForm = () => {
    setTotalAmount("");
    setResponseTimeValue("");
    setResponseTimeUnit("hours");
    setResponseDate(undefined);
    setResponseTime("");
    setAdditionalNotes("");
    setShowDatePicker(false);
  };



  const handleSubmitBid = () => {
    if (!ticket || !totalAmount || !responseTimeValue || !responseTimeUnit) {
      toast({
        title: "Missing Information",
        description: "Please provide total bid amount and response time.",
        variant: "destructive",
      });
      return;
    }

    const bidData = {
      ticketId: ticket.id,
      hourlyRate: 0, // Not used in simplified form
      estimatedHours: 0, // Not used in simplified form
      responseTime,
      parts: [], // Not used in simplified form
      totalAmount: parseFloat(totalAmount),
      additionalNotes,
    };

    if (existingBid) {
      console.log("Updating existing bid:", bidData);
      updateBidMutation.mutate({ bidId: existingBid.id, bidData });
    } else {
      console.log("Placing new bid:", bidData);
      placeBidMutation.mutate(bidData);
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

  if (!ticket) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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
            <ScrollArea className="h-[calc(90vh-12rem)] pr-4">
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

                    {ticket.locationId ? (
                      <LocationInfo locationId={ticket.locationId} />
                    ) : ticket.residentialCity && ticket.residentialState && ticket.residentialZip ? (
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                        <div className="flex items-center gap-2 mb-1">
                          <MapPin className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          <span className="text-sm font-medium text-blue-900 dark:text-blue-100">Service Location</span>
                        </div>
                        <div className="ml-6">
                          <p className="text-sm text-blue-700 dark:text-blue-300">
                            {ticket.residentialCity}, {ticket.residentialState} {ticket.residentialZip}
                          </p>
                          <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                            Full address available after bid acceptance
                          </p>
                        </div>
                      </div>
                    ) : null}
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
            <ScrollArea className="h-[calc(90vh-12rem)] pr-4">
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <DollarSign className="h-5 w-5" />
                      Place Your Bid
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Total Bid Amount */}
                    <div>
                      <Label htmlFor="totalAmount">Total Bid Amount ($)</Label>
                      <Input
                        id="totalAmount"
                        type="number"
                        step="0.01"
                        placeholder="150.00"
                        value={totalAmount}
                        onChange={(e) => setTotalAmount(e.target.value)}
                        className="text-lg font-semibold"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Enter your total quote for this job including labor and materials
                      </p>
                    </div>

                    {/* Response Time */}
                    <div>
                      <Label htmlFor="response-time">How quickly can you arrive?</Label>
                      <div className="mt-1 space-y-2">
                        <div className="flex gap-2">
                          <Input
                            id="response-time-value"
                            type="number"
                            min="1"
                            placeholder="1"
                            value={responseTimeValue}
                            onChange={(e) => setResponseTimeValue(e.target.value)}
                            className="w-20"
                          />
                          <Select value={responseTimeUnit} onValueChange={(value) => {
                            setResponseTimeUnit(value);
                            setShowDatePicker(value === "days" || value === "weeks");
                            if (value === "hours") {
                              setResponseDate(undefined);
                              setShowDatePicker(false);
                            }
                          }}>
                            <SelectTrigger className="w-24">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="hours">Hours</SelectItem>
                              <SelectItem value="days">Days</SelectItem>
                              <SelectItem value="weeks">Weeks</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        {(responseTimeUnit === "days" || responseTimeUnit === "weeks") && (
                          <div>
                            <Label className="text-sm text-muted-foreground">Select target date (optional)</Label>
                            <Popover open={showDatePicker} onOpenChange={setShowDatePicker}>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "w-full justify-start text-left font-normal mt-1",
                                    !responseDate && "text-muted-foreground"
                                  )}
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {responseDate ? format(responseDate, "PPP") : "Pick a date"}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <CalendarComponent
                                  mode="single"
                                  selected={responseDate}
                                  onSelect={(date) => {
                                    setResponseDate(date);
                                    setShowDatePicker(false);
                                  }}
                                  disabled={(date) =>
                                    date < new Date() || date < new Date("1900-01-01")
                                  }
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                          </div>
                        )}
                        
                        {responseTime && (
                          <div className="text-sm text-muted-foreground bg-muted p-2 rounded">
                            <strong>Response:</strong> {responseTime}
                          </div>
                        )}
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
                      {existingBid && (existingBid.status === "accepted" || existingBid.status === "rejected") ? (
                        <div className="flex items-center gap-2 w-full">
                          <Badge variant="secondary" className={existingBid.status === "accepted" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                            Bid {existingBid.status}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            Status: {existingBid.status}
                          </span>
                        </div>
                      ) : (
                        <Button
                          onClick={handleSubmitBid}
                          disabled={(placeBidMutation.isPending || updateBidMutation.isPending) || !totalAmount || !responseTimeValue || !responseTimeUnit}
                          className="flex-1"
                        >
                          {(placeBidMutation.isPending || updateBidMutation.isPending) ? 
                            (existingBid ? "Updating Bid..." : "Placing Bid...") : 
                            (existingBid ? "Update Bid" : "Place Bid")
                          }
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