import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { Eye, Printer, Building2, User } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import type { Invoice, Ticket, Organization, MaintenanceVendor, WorkOrder, Location } from "@shared/schema";

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

  const { data: location } = useQuery<Location>({
    queryKey: ["/api/locations", invoice.locationId],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/organizations/${invoice.organizationId}/locations`);
      const locations = await response.json();
      return locations.find((loc: Location) => loc.id === invoice.locationId);
    },
    enabled: isOpen && !!invoice.locationId,
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

        {/* PDF-style Invoice Content - Matching Enhanced Invoice Creator Preview */}
        <div className="bg-white text-black p-8 rounded-lg space-y-6" style={{ fontFamily: 'Arial, sans-serif' }}>
          
          {/* Header Section */}
          <div className="text-center border-b pb-6">
            <h1 className="text-4xl font-bold mb-2" style={{color: 'black'}}>INVOICE</h1>
            <div className="text-lg" style={{color: 'black'}}>
              Invoice #{invoice.invoiceNumber} | Date: {invoice.createdAt ? formatDate(invoice.createdAt) : 'N/A'}
            </div>
          </div>

          {/* From/To Section */}
          <div className="grid grid-cols-2 gap-8">
            <div>
              <h3 className="font-semibold text-lg mb-3" style={{color: 'black'}}>
                From:
              </h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="font-semibold text-xl" style={{color: 'black'}}>
                  {vendor?.name || 'Maintenance Vendor'}
                </p>
                <p style={{color: 'black'}}>{vendor?.address || 'Vendor Address'}</p>
                <p style={{color: 'black'}}>{vendor?.email || 'vendor@email.com'}</p>
                <p style={{color: 'black'}}>{vendor?.phone || 'Phone Number'}</p>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-3" style={{color: 'black'}}>
                Bill To:
              </h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="font-semibold text-xl" style={{color: 'black'}}>
                  {organization?.name || 'Organization'}
                </p>
                {location && (
                  <div className="mt-2 p-2 bg-blue-50 rounded border-l-4 border-blue-400">
                    <p className="font-semibold" style={{color: 'black'}}>
                      Service Location: {location.name}
                    </p>
                    {location.address && (
                      <p style={{color: 'black'}}>{location.address}</p>
                    )}
                  </div>
                )}
                <div className="mt-2">
                  <p style={{color: 'black'}}>{organization?.address || 'Organization Address'}</p>
                  <p style={{color: 'black'}}>{organization?.email || 'org@email.com'}</p>
                  <p style={{color: 'black'}}>{organization?.phone || 'Phone Number'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Ticket Information */}
          {ticket && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-lg mb-2" style={{color: 'black'}}>Service Details</h3>
              <div className="grid grid-cols-2 gap-4 text-sm" style={{color: 'black'}}>
                <div><span className="font-medium">Ticket Number:</span> {ticket.ticketNumber}</div>
                <div><span className="font-medium">Priority:</span> <Badge variant="outline">{ticket.priority}</Badge></div>
                <div className="col-span-2"><span className="font-medium">Description:</span> {ticket.description}</div>
              </div>
            </div>
          )}

          {/* Work Orders Table */}
          <div>
            <h3 className="font-semibold text-lg mb-4" style={{color: 'black'}}>Work Orders Completed</h3>
            <div className="overflow-hidden rounded-lg border">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold" style={{color: 'black'}}>Work Order</th>
                    <th className="px-4 py-3 text-left font-semibold" style={{color: 'black'}}>Description</th>
                    <th className="px-4 py-3 text-left font-semibold" style={{color: 'black'}}>Labor Details</th>
                    <th className="px-4 py-3 text-left font-semibold" style={{color: 'black'}}>Parts Used</th>
                    <th className="px-4 py-3 text-right font-semibold" style={{color: 'black'}}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {workOrders.length > 0 ? workOrders.map((workOrder) => {
                    const parts = workOrder.parts && Array.isArray(workOrder.parts) ? workOrder.parts : [];
                    const partsCost = parts.reduce((sum: number, part: any) => sum + (part.cost * part.quantity), 0);
                    const laborCost = parseFloat(workOrder.totalCost || "0") - partsCost;
                    const hourlyRate = workOrder.totalHours ? (laborCost / parseFloat(workOrder.totalHours)).toFixed(2) : "0.00";
                    
                    return (
                      <tr key={workOrder.id} className="border-t">
                        <td className="px-4 py-3 font-medium align-top" style={{color: 'black'}}>
                          <div>#{workOrder.workOrderNumber}</div>
                          <div className="text-sm" style={{color: 'black'}}>by {workOrder.technicianName}</div>
                          <div className="text-xs" style={{color: 'black'}}>
                            {workOrder.dateCompleted ? new Date(workOrder.dateCompleted).toLocaleDateString() : 'In Progress'}
                          </div>
                        </td>
                        <td className="px-4 py-3 align-top" style={{color: 'black'}}>
                          <div className="text-sm">{workOrder.workDescription || 'Work order description'}</div>
                          {workOrder.notes && (
                            <div className="text-xs mt-1 italic" style={{color: 'black'}}>
                              Notes: {workOrder.notes}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 align-top" style={{color: 'black'}}>
                          <div className="text-sm">
                            <div>{workOrder.totalHours} hours</div>
                            <div>@ ${hourlyRate}/hr</div>
                            <div className="font-medium">Labor: ${laborCost.toFixed(2)}</div>
                          </div>
                        </td>
                        <td className="px-4 py-3 align-top" style={{color: 'black'}}>
                          {parts.length > 0 ? (
                            <div className="text-sm space-y-1">
                              {parts.map((part: any, index: number) => (
                                <div key={index}>
                                  <div>{part.name}</div>
                                  <div className="text-xs">
                                    Qty: {part.quantity} @ ${part.cost.toFixed(2)} = ${(part.quantity * part.cost).toFixed(2)}
                                  </div>
                                </div>
                              ))}
                              <div className="font-medium border-t pt-1">
                                Parts Total: ${partsCost.toFixed(2)}
                              </div>
                            </div>
                          ) : (
                            <div className="text-sm" style={{color: 'black'}}>No parts used</div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold align-top" style={{color: 'black'}}>
                          ${parseFloat(workOrder.totalCost || "0").toFixed(2)}
                        </td>
                      </tr>
                    );
                  }) : (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                        No work orders available.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Invoice Total */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <div className="flex justify-end">
              <div className="w-64 space-y-2">
                <div className="flex justify-between text-lg" style={{color: 'black'}}>
                  <span>Subtotal:</span>
                  <span>${parseFloat(invoice.subtotal).toFixed(2)}</span>
                </div>
                {parseFloat(invoice.tax) > 0 && (
                  <div className="flex justify-between" style={{color: 'black'}}>
                    <span>Tax:</span>
                    <span>${parseFloat(invoice.tax).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-2xl font-bold border-t pt-2" style={{color: 'black'}}>
                  <span>TOTAL:</span>
                  <span style={{color: 'black'}}>${parseFloat(invoice.total).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Terms & Notes */}
          <div className="text-sm" style={{color: 'black'}}>
            <p><span className="font-medium">Payment Terms:</span> Net 30</p>
            {invoice.notes && (
              <div className="mt-2">
                <p className="font-medium">Notes:</p>
                <p>{invoice.notes}</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}