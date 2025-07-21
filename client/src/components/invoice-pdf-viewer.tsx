import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { Eye, Printer } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import type { Invoice, Ticket, Organization, MaintenanceVendor, WorkOrder } from "@shared/schema";

interface InvoicePDFViewerProps {
  invoice: Invoice;
}

export function InvoicePDFViewer({ invoice }: InvoicePDFViewerProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Fetch related data for the invoice
  const { data: ticket } = useQuery<Ticket>({
    queryKey: ["/api/tickets", invoice.ticketId],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/tickets/${invoice.ticketId}`);
      return await response.json();
    },
    enabled: isOpen && !!invoice.ticketId,
  });

  const { data: organization } = useQuery<Organization>({
    queryKey: ["/api/organizations", invoice.organizationId],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/organizations`);
      const orgs = await response.json();
      return orgs.find((org: Organization) => org.id === invoice.organizationId);
    },
    enabled: isOpen && !!invoice.organizationId,
  });

  const { data: vendor } = useQuery<MaintenanceVendor>({
    queryKey: ["/api/maintenance-vendors", invoice.maintenanceVendorId],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/maintenance-vendors`);
      const vendors = await response.json();
      return vendors.find((v: MaintenanceVendor) => v.id === invoice.maintenanceVendorId);
    },
    enabled: isOpen && !!invoice.maintenanceVendorId,
  });

  const { data: workOrders = [] } = useQuery<WorkOrder[]>({
    queryKey: ["/api/tickets", invoice.ticketId, "work-orders"],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/tickets/${invoice.ticketId}/work-orders`);
      return await response.json();
    },
    enabled: isOpen && !!invoice.ticketId,
  });

  const handlePrint = () => {
    window.print();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft": return "bg-yellow-100 text-yellow-800";
      case "sent": return "bg-blue-100 text-blue-800";
      case "paid": return "bg-green-100 text-green-800";
      case "overdue": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  // Parse additional items
  const additionalItems = invoice.additionalItems ? (() => {
    try {
      return JSON.parse(invoice.additionalItems);
    } catch {
      return [];
    }
  })() : [];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Eye className="h-4 w-4 mr-1" />
          View
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Invoice {invoice.invoiceNumber}</span>
            <div className="flex items-center gap-2">
              <Badge className={getStatusColor(invoice.status)}>
                {invoice.status}
              </Badge>
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-1" />
                Print
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* PDF-style Invoice Content */}
        <div className="bg-white text-black p-8 rounded-lg" style={{ fontFamily: 'Arial, sans-serif' }}>
          {/* Header */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-3xl font-bold text-black mb-2">INVOICE</h1>
              <div className="text-sm text-black">
                <div><strong>Invoice #:</strong> {invoice.invoiceNumber}</div>
                <div><strong>Date:</strong> {invoice.createdAt ? formatDate(invoice.createdAt) : 'N/A'}</div>
                {ticket && <div><strong>Ticket #:</strong> {ticket.ticketNumber}</div>}
              </div>
            </div>
            <div className="text-right">
              <h2 className="text-xl font-bold text-black mb-2">
                {vendor?.name || "Professional Maintenance Services"}
              </h2>
              <div className="text-sm text-black">
                <div>{vendor?.address || "123 Service Drive"}</div>
                <div>{vendor?.email || "billing@vendor.com"}</div>
                <div>{vendor?.phone || "(555) 123-4567"}</div>
              </div>
            </div>
          </div>

          <Separator className="my-6" />

          {/* Bill To Section */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-black mb-3">Bill To:</h3>
            <div className="text-black">
              <div className="font-semibold">{organization?.name || "Loading..."}</div>
              <div>{organization?.address || "Loading address..."}</div>
              <div>{organization?.email || "Loading email..."}</div>
              <div>{organization?.phone || "Loading phone..."}</div>
            </div>
          </div>

          <Separator className="my-6" />

          {/* Work Orders Section */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-black mb-4">Service Details</h3>
            
            {workOrders.length > 0 ? (
              <div className="space-y-6">
                {workOrders.map((workOrder, index) => (
                  <Card key={workOrder.id} className="border border-gray-300">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="font-semibold text-black">Work Order #{index + 1}</h4>
                        <div className="text-sm text-black">
                          {workOrder.workDate && <div>Date: {workOrder.workDate}</div>}
                          {workOrder.timeIn && workOrder.timeOut && (
                            <div>Time: {workOrder.timeIn} - {workOrder.timeOut}</div>
                          )}
                        </div>
                      </div>

                      <div className="text-black mb-3">
                        <div><strong>Description:</strong> {workOrder.workDescription || 'N/A'}</div>
                        {workOrder.technicianName && (
                          <div><strong>Technician:</strong> {workOrder.technicianName}</div>
                        )}
                        {workOrder.totalHours && (
                          <div><strong>Total Hours:</strong> {workOrder.totalHours}</div>
                        )}
                      </div>

                      {/* Labor Breakdown */}
                      {workOrder.totalHours && (
                        <div className="mb-4 p-3 bg-gray-50 rounded">
                          <div className="font-semibold text-black mb-2">Labor:</div>
                          <div className="flex justify-between text-black">
                            <span>{workOrder.totalHours} hours</span>
                            <span>${parseFloat(workOrder.totalCost || "0").toFixed(2)}</span>
                          </div>
                        </div>
                      )}

                      {/* Parts Used */}
                      {workOrder.parts && Array.isArray(workOrder.parts) && workOrder.parts.length > 0 && (
                        <div className="mb-4">
                          <div className="font-semibold text-black mb-2">Parts Used:</div>
                          <div className="space-y-1">
                            {workOrder.parts.map((part: any, partIndex: number) => (
                              <div key={partIndex} className="flex justify-between text-black">
                                <span>{part.name} (Qty: {part.quantity})</span>
                                <span>${(part.cost * part.quantity).toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="border-t pt-2 mt-3">
                        <div className="flex justify-between font-semibold text-black">
                          <span>Work Order Total:</span>
                          <span>${parseFloat(workOrder.totalCost || "0").toFixed(2)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-black">No work orders available.</div>
            )}
          </div>

          {/* Additional Items */}
          {additionalItems.length > 0 && (
            <>
              <Separator className="my-6" />
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-black mb-4">Additional Items</h3>
                <div className="space-y-2">
                  {additionalItems.map((item: any, index: number) => (
                    <div key={index} className="flex justify-between text-black">
                      <span>{item.description} (Qty: {item.quantity})</span>
                      <span>${item.amount.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          <Separator className="my-6" />

          {/* Invoice Summary */}
          <div className="flex justify-end">
            <div className="w-64">
              <div className="space-y-2 text-black">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>${parseFloat(invoice.subtotal).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax:</span>
                  <span>${parseFloat(invoice.tax).toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-lg text-black">
                  <span>Total:</span>
                  <span>${parseFloat(invoice.total).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <>
              <Separator className="my-6" />
              <div>
                <h3 className="text-lg font-semibold text-black mb-3">Notes</h3>
                <div className="text-black whitespace-pre-wrap">{invoice.notes}</div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}