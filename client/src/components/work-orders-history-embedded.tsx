import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar, User, Wrench, DollarSign, Package, Truck, ImageIcon, Eye, Clock } from "lucide-react";
import { format as formatTz, toZonedTime } from "date-fns-tz";
import { formatDistanceToNow } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { ImageGalleryModal } from "./image-gallery-modal";
import type { WorkOrder } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";

interface WorkOrdersHistoryEmbeddedProps {
  ticketId: number;
}

export function WorkOrdersHistoryEmbedded({ ticketId }: WorkOrdersHistoryEmbeddedProps) {
  const [imageGalleryOpen, setImageGalleryOpen] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [galleryTitle, setGalleryTitle] = useState("");
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrder | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);

  const { data: workOrders = [], isLoading } = useQuery<WorkOrder[]>({
    queryKey: ["/api/tickets", ticketId, "work-orders"],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/tickets/${ticketId}/work-orders`);
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    },
    enabled: !!ticketId,
    staleTime: 0,
    refetchOnMount: true,
  });

  const getStatusColor = (status: string) => {
    return status === "completed" ? "bg-emerald-100 text-emerald-800" : "bg-orange-100 text-orange-800";
  };

  const getStatusText = (status: string) => {
    return status === "completed" ? "Completed" : "Return Needed";
  };

  const openImageGallery = (images: string[], title: string) => {
    setSelectedImages(images);
    setGalleryTitle(title);
    setImageGalleryOpen(true);
  };

  const openWorkOrderDetails = (workOrder: WorkOrder) => {
    setSelectedWorkOrder(workOrder);
    setDetailsModalOpen(true);
  };

  const formatCurrency = (amount: string) => {
    return `$${parseFloat(amount).toFixed(2)}`;
  };

  return (
    <>
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading work orders...</div>
        ) : workOrders.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No work orders found for this ticket.</div>
        ) : (
          workOrders.map((workOrder) => {
            let parts = [];
            let otherCharges = [];
            
            try {
              parts = workOrder.parts ? JSON.parse(workOrder.parts as string) : [];
            } catch (e) {
              console.warn('Failed to parse parts JSON:', workOrder.parts);
              parts = [];
            }
            
            try {
              otherCharges = workOrder.otherCharges ? JSON.parse(workOrder.otherCharges as string) : [];
            } catch (e) {
              console.warn('Failed to parse otherCharges JSON:', workOrder.otherCharges);
              otherCharges = [];
            }

            return (
              <Card 
                key={workOrder.id} 
                className="border-l-4 border-l-blue-500 hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => openWorkOrderDetails(workOrder)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <span>Work Order #{workOrder.workOrderNumber}</span>
                      <Badge variant="outline" className={`${getStatusColor(workOrder.completionStatus)} border-current`}>
                        {getStatusText(workOrder.completionStatus)}
                      </Badge>
                    </CardTitle>
                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          openWorkOrderDetails(workOrder);
                        }}
                        className="flex items-center gap-2"
                      >
                        <Eye className="h-4 w-4" />
                        View Details
                      </Button>
                      <div className="text-sm text-muted-foreground text-right">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {workOrder.createdAt ? formatTz(toZonedTime(new Date(workOrder.createdAt), 'America/New_York'), "MMM dd, yyyy 'at' h:mm a zzz", { timeZone: 'America/New_York' }) : 'Date unavailable'}
                          </span>
                        </div>
                        <div className="text-xs">
                          {workOrder.createdAt ? formatDistanceToNow(new Date(workOrder.createdAt), { addSuffix: true }) : ''}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Summary Info */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="h-4 w-4" />
                      <span>Technician: {workOrder.technicianName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      <span className="text-green-600">{formatCurrency(workOrder.totalCost)}</span>
                    </div>
                  </div>

                  {/* Work Description Preview */}
                  <div>
                    <p className="text-foreground line-clamp-2">
                      {workOrder.workDescription || 'No description provided'}
                    </p>
                  </div>

                  {/* Quick Stats */}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    {workOrder.images && workOrder.images.length > 0 && (
                      <div className="flex items-center gap-1">
                        <ImageIcon className="h-4 w-4" />
                        <span>{workOrder.images.length} images</span>
                      </div>
                    )}
                    {workOrder.hoursWorked && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{workOrder.hoursWorked}h worked</span>
                      </div>
                    )}
                  </div>


                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Work Order Details Modal */}
      <Dialog open={detailsModalOpen} onOpenChange={setDetailsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              Work Order #{selectedWorkOrder?.workOrderNumber} Details
            </DialogTitle>
          </DialogHeader>
          
          {selectedWorkOrder && (
            <ScrollArea className="max-h-[70vh] pr-4">
              <div className="space-y-6">
                {/* Header Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-foreground mb-2">Work Order Information</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>Technician: {selectedWorkOrder.technicianName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {selectedWorkOrder.createdAt ? formatTz(toZonedTime(new Date(selectedWorkOrder.createdAt), 'America/New_York'), "MMM dd, yyyy 'at' h:mm a zzz", { timeZone: 'America/New_York' }) : 'Date unavailable'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={`${getStatusColor(selectedWorkOrder.completionStatus)} border-current`}>
                          {getStatusText(selectedWorkOrder.completionStatus)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-foreground mb-2">Cost Summary</h4>
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(selectedWorkOrder.totalCost)}
                    </div>
                    {selectedWorkOrder.hoursWorked && (
                      <div className="text-sm text-muted-foreground">
                        {selectedWorkOrder.hoursWorked} hours worked
                      </div>
                    )}
                  </div>
                </div>

                {/* Work Description */}
                <div>
                  <h4 className="font-medium text-foreground mb-2">Work Description</h4>
                  <div className="bg-muted p-4 rounded-lg">
                    <p className="text-foreground whitespace-pre-wrap">
                      {selectedWorkOrder.workDescription || 'No description provided'}
                    </p>
                  </div>
                </div>

                {/* Parts Used */}
                {(() => {
                  let parts = [];
                  try {
                    parts = selectedWorkOrder.parts ? JSON.parse(selectedWorkOrder.parts as string) : [];
                  } catch (e) {
                    parts = [];
                  }
                  return parts.length > 0 && (
                    <div>
                      <h4 className="font-medium text-foreground mb-2 flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        Parts Used
                      </h4>
                      <div className="space-y-2">
                        {parts.map((part: any, index: number) => (
                          <div key={index} className="flex justify-between items-center bg-muted p-3 rounded-lg">
                            <div>
                              <span className="font-medium">{part.name}</span>
                              <span className="text-muted-foreground"> × {part.quantity}</span>
                            </div>
                            <span className="font-medium">{formatCurrency(part.cost)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* Other Charges */}
                {(() => {
                  let otherCharges = [];
                  try {
                    otherCharges = selectedWorkOrder.otherCharges ? JSON.parse(selectedWorkOrder.otherCharges as string) : [];
                  } catch (e) {
                    otherCharges = [];
                  }
                  return otherCharges.length > 0 && (
                    <div>
                      <h4 className="font-medium text-foreground mb-2 flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Additional Charges
                      </h4>
                      <div className="space-y-2">
                        {otherCharges.map((charge: any, index: number) => (
                          <div key={index} className="flex justify-between items-center bg-muted p-3 rounded-lg">
                            <span className="font-medium">{charge.description}</span>
                            <span className="font-medium">{formatCurrency(charge.amount)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* Work Order Images */}
                {selectedWorkOrder.images && selectedWorkOrder.images.length > 0 && (
                  <div>
                    <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
                      <ImageIcon className="h-4 w-4" />
                      Work Order Images ({selectedWorkOrder.images.length})
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {selectedWorkOrder.images.map((image: string, index: number) => {
                        const isVideo = image?.toLowerCase().includes('.mp4') ||
                                       image?.toLowerCase().includes('.mov') ||
                                       image?.toLowerCase().includes('.avi') ||
                                       image?.toLowerCase().includes('.webm');
                        
                        return (
                          <div key={index} className="relative group">
                            {isVideo ? (
                              <div className="relative w-full h-32 bg-black rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity">
                                <video
                                  src={image}
                                  className="w-full h-full object-cover"
                                  muted
                                  preload="metadata"
                                  onClick={() => openImageGallery(selectedWorkOrder.images || [], `Work Order #${selectedWorkOrder.workOrderNumber} Images`)}
                                />
                                <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/50 transition-colors">
                                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                                    <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                                      <path d="M8 5v14l11-7z"/>
                                    </svg>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <img
                                src={image}
                                alt={`Work order image ${index + 1}`}
                                className="w-full h-32 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                                onClick={() => openImageGallery(selectedWorkOrder.images || [], `Work Order #${selectedWorkOrder.workOrderNumber} Images`)}
                                onError={(e) => {
                                  console.log('Work order image failed to load:', image);
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Completion Notes */}
                <div>
                  <h4 className="font-medium text-foreground mb-2">
                    {selectedWorkOrder.completionStatus === "return_needed" ? "Return Details" : "Completion Notes"}
                  </h4>
                  <div className="bg-muted p-4 rounded-lg">
                    <p className="text-foreground whitespace-pre-wrap">
                      {selectedWorkOrder.completionNotes || 'No notes provided'}
                    </p>
                  </div>
                </div>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

      {/* Image Gallery Modal */}
      <ImageGalleryModal
        open={imageGalleryOpen}
        onOpenChange={setImageGalleryOpen}
        images={selectedImages}
        title={galleryTitle}
      />
    </>
  );
}