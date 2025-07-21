import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Calendar, User, Wrench, DollarSign, Package, Truck, ImageIcon } from "lucide-react";
import { format as formatTz, toZonedTime } from "date-fns-tz";
import { formatDistanceToNow } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { ImageGalleryModal } from "./image-gallery-modal";
import type { WorkOrder } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";

interface WorkOrdersHistoryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticketId: number | null;
}

export function WorkOrdersHistory({ open, onOpenChange, ticketId }: WorkOrdersHistoryProps) {
  const [imageGalleryOpen, setImageGalleryOpen] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [galleryTitle, setGalleryTitle] = useState("");
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrder | null>(null);
  const [workOrderDetailOpen, setWorkOrderDetailOpen] = useState(false);
  const { data: workOrders = [], isLoading } = useQuery<WorkOrder[]>({
    queryKey: ["/api/tickets", ticketId, "work-orders"],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/tickets/${ticketId}/work-orders`);
      const data = await response.json();
      console.log(`Fetched ${Array.isArray(data) ? data.length : 0} work orders for ticket ${ticketId}:`, data);
      return Array.isArray(data) ? data : [];
    },
    enabled: !!ticketId && open,
    staleTime: 0, // Force fresh data
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

  const openWorkOrderDetail = (workOrder: WorkOrder) => {
    setSelectedWorkOrder(workOrder);
    setWorkOrderDetailOpen(true);
  };

  const formatCurrency = (amount: string) => {
    return `$${parseFloat(amount).toFixed(2)}`;
  };

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Work Orders History
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-8 text-slate-500">Loading work orders...</div>
          ) : workOrders.length === 0 ? (
            <div className="text-center py-8 text-slate-500">No work orders found for this ticket.</div>
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
                  className="border-l-4 border-l-blue-500 hover:bg-slate-50 cursor-pointer transition-colors"
                  onClick={() => openWorkOrderDetail(workOrder)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <span>Work Order #{workOrder.workOrderNumber}</span>
                        <Badge variant="outline" className={`${getStatusColor(workOrder.completionStatus)} border-current`}>
                          {getStatusText(workOrder.completionStatus)}
                        </Badge>
                      </CardTitle>
                      <div className="text-sm text-slate-500 text-right">
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
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <User className="h-4 w-4" />
                      <span>Technician: {workOrder.technicianName}</span>
                    </div>

                    {/* Work Description */}
                    <div>
                      <h4 className="font-medium text-slate-900 mb-2">Work Performed</h4>
                      <p className="text-slate-700 bg-slate-50 p-3 rounded-lg">
                        {workOrder.workDescription}
                      </p>
                    </div>

                    {/* Parts Used */}
                    {parts.length > 0 && (
                      <div>
                        <h4 className="font-medium text-slate-900 mb-2 flex items-center gap-2">
                          <Package className="h-4 w-4" />
                          Parts & Equipment Used
                        </h4>
                        <div className="space-y-2">
                          {parts.map((part: any, index: number) => (
                            <div key={index} className="flex justify-between items-center bg-slate-50 p-2 rounded">
                              <span>{part.name}</span>
                              <div className="text-sm text-slate-600">
                                Qty: {part.quantity} × {formatCurrency(part.cost)} = {formatCurrency((part.quantity * part.cost).toString())}
                              </div>
                            </div>
                          ))}
                          <div className="text-right font-medium text-slate-700">
                            Parts Total: {formatCurrency(parts.reduce((sum: number, part: any) => sum + (part.quantity * part.cost), 0).toString())}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Other Charges */}
                    {otherCharges.length > 0 && (
                      <div>
                        <h4 className="font-medium text-slate-900 mb-2 flex items-center gap-2">
                          <Truck className="h-4 w-4" />
                          Other Charges
                        </h4>
                        <div className="space-y-2">
                          {otherCharges.map((charge: any, index: number) => (
                            <div key={index} className="flex justify-between items-center bg-slate-50 p-2 rounded">
                              <span>{charge.description}</span>
                              <span className="text-sm text-slate-600">{formatCurrency(charge.cost)}</span>
                            </div>
                          ))}
                          <div className="text-right font-medium text-slate-700">
                            Other Total: {formatCurrency(otherCharges.reduce((sum: number, charge: any) => sum + charge.cost, 0).toString())}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Total Cost */}
                    {parseFloat(workOrder.totalCost || '0') > 0 && (
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-blue-900 flex items-center gap-2">
                            <DollarSign className="h-4 w-4" />
                            Total Cost
                          </span>
                          <span className="text-xl font-bold text-blue-900">
                            {formatCurrency((workOrder.totalCost || '0').toString())}
                          </span>
                        </div>
                      </div>
                    )}

                    <Separator />

                    {/* Images */}
                    {workOrder.images && workOrder.images.length > 0 && (
                      <div>
                        <h4 className="font-medium text-slate-900 mb-3 flex items-center gap-2">
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
                          {workOrder.images.length > 1 && (
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
                      <h4 className="font-medium text-slate-900 mb-2">
                        {workOrder.completionStatus === "return_needed" ? "Return Details" : "Completion Notes"}
                      </h4>
                      <p className="text-slate-700 bg-slate-50 p-3 rounded-lg">
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
      </DialogContent>
    </Dialog>

    {/* Detailed Work Order Modal */}
    <Dialog open={workOrderDetailOpen} onOpenChange={setWorkOrderDetailOpen}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Work Order #{selectedWorkOrder?.workOrderNumber} - Complete Details
          </DialogTitle>
        </DialogHeader>

        {selectedWorkOrder && (
          <div className="space-y-6 py-4">
            {/* Header Info */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg">
              <div>
                <h3 className="font-medium text-slate-900 mb-2">Work Order Information</h3>
                <div className="space-y-1 text-sm">
                  <div><strong>Work Order #:</strong> {selectedWorkOrder.workOrderNumber}</div>
                  <div><strong>Technician:</strong> {selectedWorkOrder.technicianName}</div>
                  <div><strong>Status:</strong> 
                    <Badge className={`ml-2 ${getStatusColor(selectedWorkOrder.completionStatus)}`}>
                      {getStatusText(selectedWorkOrder.completionStatus)}
                    </Badge>
                  </div>
                  <div><strong>Created:</strong> {selectedWorkOrder.createdAt ? formatTz(toZonedTime(new Date(selectedWorkOrder.createdAt), 'America/New_York'), "MMM dd, yyyy 'at' h:mm a zzz", { timeZone: 'America/New_York' }) : 'Date unavailable'}</div>
                </div>
              </div>
              
              {/* Time Tracking Section */}
              {(selectedWorkOrder.workDate || selectedWorkOrder.timeIn || selectedWorkOrder.timeOut || selectedWorkOrder.totalHours) && (
                <div>
                  <h3 className="font-medium text-slate-900 mb-2">Time Tracking</h3>
                  <div className="space-y-1 text-sm">
                    {selectedWorkOrder.workDate && <div><strong>Work Date:</strong> {selectedWorkOrder.workDate}</div>}
                    {selectedWorkOrder.timeIn && <div><strong>Time In:</strong> {selectedWorkOrder.timeIn}</div>}
                    {selectedWorkOrder.timeOut && <div><strong>Time Out:</strong> {selectedWorkOrder.timeOut}</div>}
                    {selectedWorkOrder.totalHours && (
                      <div className="font-medium text-green-700">
                        <strong>Total Hours:</strong> {selectedWorkOrder.totalHours} hours
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Work Description */}
            <div>
              <h3 className="font-medium text-slate-900 mb-2">Work Performed</h3>
              <div className="bg-slate-50 p-4 rounded-lg">
                <p className="text-slate-700">{selectedWorkOrder.workDescription}</p>
              </div>
            </div>

            {/* Parts Used */}
            {(() => {
              try {
                const parts = typeof selectedWorkOrder.parts === 'string' ? JSON.parse(selectedWorkOrder.parts) : selectedWorkOrder.parts || [];
                return parts.length > 0 ? (
                  <div>
                    <h3 className="font-medium text-slate-900 mb-2 flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      Parts & Equipment Used
                    </h3>
                    <div className="space-y-3">
                      {parts.map((part: any, index: number) => (
                        <div key={index} className="bg-slate-50 p-3 rounded-lg">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-medium text-slate-900">{part.name}</div>
                              {part.description && <div className="text-sm text-slate-600">{part.description}</div>}
                            </div>
                            <div className="text-right">
                              <div className="text-sm text-slate-600">Qty: {part.quantity}</div>
                              <div className="text-sm text-slate-600">Unit: ${part.cost}</div>
                              <div className="font-medium text-slate-900">Total: ${(part.quantity * part.cost).toFixed(2)}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null;
              } catch {
                return null;
              }
            })()}

            {/* Other Charges */}
            {(() => {
              try {
                const otherCharges = typeof selectedWorkOrder.otherCharges === 'string' ? JSON.parse(selectedWorkOrder.otherCharges) : selectedWorkOrder.otherCharges || [];
                return otherCharges.length > 0 ? (
                  <div>
                    <h3 className="font-medium text-slate-900 mb-2 flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Additional Charges
                    </h3>
                    <div className="space-y-2">
                      {otherCharges.map((charge: any, index: number) => (
                        <div key={index} className="flex justify-between items-center bg-slate-50 p-3 rounded-lg">
                          <div>
                            <div className="font-medium text-slate-900">{charge.description}</div>
                          </div>
                          <div className="font-medium text-slate-900">${charge.cost}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null;
              } catch {
                return null;
              }
            })()}

            {/* Total Cost */}
            {selectedWorkOrder.totalCost && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-blue-900">Total Work Order Cost</h3>
                  <div className="text-2xl font-bold text-blue-900">${selectedWorkOrder.totalCost}</div>
                </div>
              </div>
            )}

            {/* Manager Verification */}
            {(selectedWorkOrder.managerName || selectedWorkOrder.managerSignature) && (
              <div>
                <h3 className="font-medium text-slate-900 mb-2">Manager Verification</h3>
                <div className="bg-slate-50 p-4 rounded-lg space-y-3">
                  {selectedWorkOrder.managerName && (
                    <div>
                      <strong>Manager Name:</strong> {selectedWorkOrder.managerName}
                    </div>
                  )}
                  {selectedWorkOrder.managerSignature && (
                    <div>
                      <strong>Manager Signature:</strong>
                      <div className="mt-2 p-2 bg-white border rounded">
                        <img 
                          src={selectedWorkOrder.managerSignature} 
                          alt="Manager Signature" 
                          className="max-w-full h-auto"
                          style={{ maxHeight: '100px' }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Work Images */}
            {selectedWorkOrder.images && selectedWorkOrder.images.length > 0 && (
              <div>
                <h3 className="font-medium text-slate-900 mb-2 flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" />
                  Work Documentation ({selectedWorkOrder.images.length} file{selectedWorkOrder.images.length !== 1 ? 's' : ''})
                </h3>
                <div className="grid grid-cols-4 gap-2">
                  {selectedWorkOrder.images.slice(0, 8).map((image: string, index: number) => {
                    const isVideo = image.includes('.mp4') || image.includes('.mov') || image.includes('.avi') || image.includes('.webm');
                    return (
                      <div key={index} className="relative">
                        {isVideo ? (
                          <video
                            src={`/api/uploads/${image}`}
                            className="w-full h-20 object-cover rounded cursor-pointer"
                            onClick={() => openImageGallery(selectedWorkOrder.images || [], `Work Order #${selectedWorkOrder.workOrderNumber} Documentation`)}
                          />
                        ) : (
                          <img
                            src={`/api/uploads/${image}`}
                            alt={`Work image ${index + 1}`}
                            className="w-full h-20 object-cover rounded cursor-pointer"
                            onClick={() => openImageGallery(selectedWorkOrder.images || [], `Work Order #${selectedWorkOrder.workOrderNumber} Documentation`)}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
                {selectedWorkOrder.images.length > 8 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => openImageGallery(selectedWorkOrder.images || [], `Work Order #${selectedWorkOrder.workOrderNumber} Documentation`)}
                  >
                    View All {selectedWorkOrder.images.length} Files
                  </Button>
                )}
              </div>
            )}

            {/* Completion Notes */}
            <div>
              <h3 className="font-medium text-slate-900 mb-2">
                {selectedWorkOrder.completionStatus === "return_needed" ? "Return Details" : "Completion Notes"}
              </h3>
              <div className="bg-slate-50 p-4 rounded-lg">
                <p className="text-slate-700">{selectedWorkOrder.completionNotes}</p>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
    </>
  );
}