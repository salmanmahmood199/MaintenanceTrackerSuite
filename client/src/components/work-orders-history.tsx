import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Calendar, User, Wrench, DollarSign, Package, Truck } from "lucide-react";
import { format as formatTz, toZonedTime } from "date-fns-tz";
import { formatDistanceToNow } from "date-fns";
import type { WorkOrder } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";

interface WorkOrdersHistoryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticketId: number | null;
}

export function WorkOrdersHistory({ open, onOpenChange, ticketId }: WorkOrdersHistoryProps) {
  const { data: workOrders = [], isLoading } = useQuery<WorkOrder[]>({
    queryKey: ["/api/tickets", ticketId, "work-orders"],
    queryFn: async () => {
      const response = await fetch(`/api/tickets/${ticketId}/work-orders`);
      if (!response.ok) {
        throw new Error('Failed to fetch work orders');
      }
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    },
    enabled: !!ticketId && open,
  });

  const getStatusColor = (status: string) => {
    return status === "completed" ? "bg-emerald-100 text-emerald-800" : "bg-orange-100 text-orange-800";
  };

  const getStatusText = (status: string) => {
    return status === "completed" ? "Completed" : "Return Needed";
  };

  const formatCurrency = (amount: string) => {
    return `$${parseFloat(amount).toFixed(2)}`;
  };

  return (
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
              const parts = JSON.parse((workOrder.parts as string) || '[]');
              const otherCharges = JSON.parse((workOrder.otherCharges as string) || '[]');

              return (
                <Card key={workOrder.id} className="border-l-4 border-l-blue-500">
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
                    {parseFloat(workOrder.totalCost) > 0 && (
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-blue-900 flex items-center gap-2">
                            <DollarSign className="h-4 w-4" />
                            Total Cost
                          </span>
                          <span className="text-xl font-bold text-blue-900">
                            {formatCurrency(workOrder.totalCost)}
                          </span>
                        </div>
                      </div>
                    )}

                    <Separator />

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
      </DialogContent>
    </Dialog>
  );
}