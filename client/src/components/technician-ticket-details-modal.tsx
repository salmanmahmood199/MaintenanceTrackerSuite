import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar, Hash, Wrench, CheckCircle, MessageSquare, Calculator } from "lucide-react";
import { WorkOrdersHistory } from "@/components/work-orders-history";
import { TicketComments } from "@/components/ticket-comments";
import { ProgressTracker } from "@/components/progress-tracker";
import { format } from "date-fns";
import { getPriorityColor, getStatusColor } from "@/lib/utils";
import type { Ticket } from "@shared/schema";
import { useState } from "react";

interface TechnicianTicketDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticket: Ticket | null;
  onStart?: (id: number) => void;
  onCreateWorkOrder?: (id: number) => void;
}

export function TechnicianTicketDetailsModal({
  open,
  onOpenChange,
  ticket,
  onStart,
  onCreateWorkOrder,
}: TechnicianTicketDetailsModalProps) {
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  if (!ticket) return null;

  const openImageViewer = (images: string[], index: number) => {
    setSelectedImages(images);
    setSelectedImageIndex(index);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Hash className="h-5 w-5" />
            {ticket.ticketNumber || `TKT-${ticket.id.toString().padStart(3, '0')}`}
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="h-[70vh]">
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="comments">
                <MessageSquare className="h-4 w-4 mr-2" />
                Comments
              </TabsTrigger>
              <TabsTrigger value="progress">
                <Calculator className="h-4 w-4 mr-2" />
                Progress
              </TabsTrigger>
              <TabsTrigger value="work-orders">Work Orders</TabsTrigger>
            </TabsList>
            
            <TabsContent value="details" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <Hash className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground">Ticket Number</span>
                  </div>
                  <p className="text-lg font-mono">{ticket.ticketNumber}</p>
                </div>
                
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground">Created</span>
                  </div>
                  <p className="text-lg">{format(new Date(ticket.createdAt), 'PPp')}</p>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-2">{ticket.title}</h3>
                <div className="flex items-center space-x-3 mb-4">
                  <Badge className={getPriorityColor(ticket.priority)}>
                    {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)} Priority
                  </Badge>
                  <Badge className={getStatusColor(ticket.status)}>
                    {ticket.status === "in-progress" ? "In Progress" : 
                     ticket.status === "pending_confirmation" ? "Pending Confirmation" :
                     ticket.status === "return_needed" ? "Return Needed" :
                     ticket.status === "force_closed" ? "Force Closed" :
                     ticket.status === "ready_for_billing" ? "Ready for Billing" :
                     ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
                  </Badge>
                </div>

                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-foreground">{ticket.description}</p>
                </div>
              </div>

              {ticket.images && ticket.images.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3">Attached Images</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {ticket.images.map((image, index) => (
                      <div 
                        key={index} 
                        className="relative aspect-square bg-muted rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => openImageViewer(ticket.images!, index)}
                      >
                        {image.toLowerCase().endsWith('.mp4') || image.toLowerCase().endsWith('.mov') || image.toLowerCase().endsWith('.avi') ? (
                          <video 
                            src={image} 
                            className="w-full h-full object-cover"
                            muted
                          />
                        ) : (
                          <img 
                            src={image} 
                            alt={`Attachment ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons for Technician */}
              <div className="flex gap-3 pt-4">
                {ticket.status === 'accepted' && onStart && (
                  <Button
                    onClick={() => {
                      onStart(ticket.id);
                      onOpenChange(false);
                    }}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Wrench className="h-4 w-4 mr-2" />
                    Start & Create Work Order
                  </Button>
                )}
                {(ticket.status === 'in-progress' || ticket.status === 'return_needed') && onCreateWorkOrder && (
                  <Button
                    onClick={() => {
                      onCreateWorkOrder(ticket.id);
                      onOpenChange(false);
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Create Work Order
                  </Button>
                )}
              </div>
            </TabsContent>

            <TabsContent value="comments" className="mt-6">
              <TicketComments ticket={ticket} />
            </TabsContent>

            <TabsContent value="progress" className="mt-6">
              <ProgressTracker 
                open={true}
                onOpenChange={() => {}}
                ticket={ticket}
              />
            </TabsContent>

            <TabsContent value="work-orders" className="mt-6">
              <WorkOrdersHistory 
                open={true} 
                onOpenChange={() => {}} 
                ticketId={ticket.id} 
              />
            </TabsContent>
          </Tabs>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}