import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, User, Wrench, DollarSign, Package, Truck, ImageIcon } from "lucide-react";
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
                className="border-l-4 border-l-blue-500 hover:bg-muted/50 transition-colors"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <span>Work Order #{workOrder.workOrderNumber}</span>
                      <Badge variant="outline" className={`${getStatusColor(workOrder.completionStatus)} border-current`}>
                        {getStatusText(workOrder.completionStatus)}
                      </Badge>
                    </CardTitle>
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
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Technician Info */}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="h-4 w-4" />
                    <span>Technician: {workOrder.technicianName}</span>
                  </div>

                  {/* Work Description */}
                  <div>
                    <h4 className="font-medium text-foreground mb-2">Work Performed</h4>
                    <p className="text-foreground bg-muted p-3 rounded-lg">
                      {workOrder.workPerformed}
                    </p>
                  </div>

                  {/* Parts Used */}
                  {parts.length > 0 && (
                    <div>
                      <h4 className="font-medium text-foreground mb-2 flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        Parts Used
                      </h4>
                      <div className="space-y-2">
                        {parts.map((part: any, index: number) => (
                          <div key={index} className="flex justify-between items-center bg-muted p-2 rounded-lg">
                            <div>
                              <span className="font-medium">{part.name}</span>
                              <span className="text-muted-foreground"> × {part.quantity}</span>
                            </div>
                            <span className="font-medium">{formatCurrency(part.cost)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Other Charges */}
                  {otherCharges.length > 0 && (
                    <div>
                      <h4 className="font-medium text-foreground mb-2 flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Additional Charges
                      </h4>
                      <div className="space-y-2">
                        {otherCharges.map((charge: any, index: number) => (
                          <div key={index} className="flex justify-between items-center bg-muted p-2 rounded-lg">
                            <span className="font-medium">{charge.description}</span>
                            <span className="font-medium">{formatCurrency(charge.amount)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Total Cost */}
                  <div className="border-t pt-3">
                    <div className="flex justify-between items-center text-lg font-semibold">
                      <span>Total Cost:</span>
                      <span className="text-blue-600">{formatCurrency(workOrder.totalCost)}</span>
                    </div>
                  </div>

                  {/* Images */}
                  {workOrder.images && workOrder.images.length > 0 && (
                    <div>
                      <h4 className="font-medium text-foreground mb-2 flex items-center gap-2">
                        <ImageIcon className="h-4 w-4" />
                        Work Order Images ({workOrder.images.length})
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {workOrder.images.slice(0, 4).map((image: string, index: number) => (
                          <button
                            key={index}
                            onClick={() => openImageGallery(workOrder.images || [], `Work Order #${workOrder.workOrderNumber} Images`)}
                            className="relative w-20 h-20 rounded-lg overflow-hidden border-2 border-gray-200 hover:border-blue-400 transition-colors group"
                          >
                            <img
                              src={image}
                              alt={`Work order image ${index + 1}`}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                            {index === 3 && workOrder.images && workOrder.images.length > 4 && (
                              <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-sm font-medium">
                                +{(workOrder.images?.length || 0) - 4}
                              </div>
                            )}
                          </button>
                        ))}
                        {workOrder.images && workOrder.images.length > 1 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openImageGallery(workOrder.images || [], `Work Order #${workOrder.workOrderNumber} Images`)}
                            className="h-20 px-3 text-xs"
                          >
                            View All<br />({workOrder.images.length})
                          </Button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Completion Notes */}
                  <div>
                    <h4 className="font-medium text-foreground mb-2">
                      {workOrder.completionStatus === "return_needed" ? "Return Details" : "Completion Notes"}
                    </h4>
                    <p className="text-foreground bg-muted p-3 rounded-lg">
                      {workOrder.completionNotes}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

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