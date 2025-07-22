import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, Eye, Calendar, DollarSign } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { InvoicePDFViewer } from "./invoice-pdf-viewer";
import type { Invoice } from "@shared/schema";

interface InvoicesViewProps {
  vendorId?: number;
  organizationId?: number;
  userRole: "vendor" | "organization";
  canPayInvoices?: boolean;
}

export function InvoicesView({ vendorId, organizationId, userRole, canPayInvoices }: InvoicesViewProps) {
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isInvoiceViewOpen, setIsInvoiceViewOpen] = useState(false);

  // Fetch invoices - either for vendor or organization
  const { data: invoices = [], isLoading } = useQuery<Invoice[]>({
    queryKey: ["/api/invoices", vendorId || organizationId, userRole],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/invoices`);
      return await response.json() as Invoice[];
    },
    enabled: !!(vendorId || organizationId),
  });

  const handleViewInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsInvoiceViewOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft": return "bg-gray-100 text-gray-800";
      case "sent": return "bg-blue-100 text-blue-800";
      case "paid": return "bg-green-100 text-green-800";
      case "overdue": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-500">Loading invoices...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {userRole === "organization" ? "Organization Invoices" : "Vendor Invoices"} ({invoices.length})
          </CardTitle>
          {userRole === "organization" && (
            <p className="text-sm text-muted-foreground">
              View all invoices for your organization
              {canPayInvoices && " • Payment access enabled"}
            </p>
          )}
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No invoices {userRole === "organization" ? "received" : "created"} yet</p>
              <p className="text-sm">
                {userRole === "organization" 
                  ? "Invoices will appear here once vendors create them for your tickets"
                  : "Create invoices from ready-for-billing tickets"
                }
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Ticket #</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">
                      {invoice.invoiceNumber}
                    </TableCell>
                    <TableCell>
                      {'ticketNumber' in invoice ? invoice.ticketNumber || 'N/A' : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold text-green-600">
                        ${parseFloat(invoice.total).toFixed(2)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(invoice.status)}>
                        {invoice.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-sm text-slate-600">
                        <Calendar className="h-4 w-4 mr-1" />
                        {formatDate(invoice.createdAt || new Date())}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <InvoicePDFViewer invoice={invoice} />
                        {userRole === "organization" && canPayInvoices && invoice.status !== "paid" && (
                          <Button size="sm" variant="outline" className="text-green-600 border-green-600 hover:bg-green-50">
                            <DollarSign className="h-4 w-4 mr-1" />
                            Pay
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Invoice Details Modal */}
      <Dialog open={isInvoiceViewOpen} onOpenChange={setIsInvoiceViewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Invoice Details</DialogTitle>
          </DialogHeader>
          
          {selectedInvoice && (
            <div className="space-y-6">
              {/* Invoice Header */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-lg mb-2">Invoice Information</h3>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Invoice #:</span> {selectedInvoice.invoiceNumber}</div>
                    <div><span className="font-medium">Ticket #:</span> {'ticketNumber' in selectedInvoice ? selectedInvoice.ticketNumber || 'N/A' : 'N/A'}</div>
                    <div><span className="font-medium">Status:</span> 
                      <Badge className={`ml-2 ${getStatusColor(selectedInvoice.status)}`}>
                        {selectedInvoice.status}
                      </Badge>
                    </div>
                    <div><span className="font-medium">Created:</span> {formatDate(selectedInvoice.createdAt || new Date())}</div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold text-lg mb-2">Amount Summary</h3>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Subtotal:</span> ${parseFloat(selectedInvoice.subtotal).toFixed(2)}</div>
                    <div><span className="font-medium">Tax:</span> ${parseFloat(selectedInvoice.tax).toFixed(2)}</div>
                    <div className="border-t pt-2">
                      <span className="font-semibold text-lg">Total: ${parseFloat(selectedInvoice.total).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Work Orders */}
              {selectedInvoice.workOrderIds && selectedInvoice.workOrderIds.length > 0 && (
                <div>
                  <h3 className="font-semibold text-lg mb-2">Work Orders Included</h3>
                  <div className="bg-slate-50 p-4 rounded-lg">
                    <p className="text-sm text-slate-600">
                      {selectedInvoice.workOrderIds.length} work order(s) included in this invoice
                    </p>
                  </div>
                </div>
              )}

              {/* Additional Items */}
              {selectedInvoice.additionalItems && (
                <div>
                  <h3 className="font-semibold text-lg mb-2">Additional Items</h3>
                  <div className="bg-slate-50 p-4 rounded-lg">
                    <div className="text-sm">
                      {(() => {
                        try {
                          const items = JSON.parse(selectedInvoice.additionalItems);
                          return items.map((item: any, i: number) => (
                            <div key={i} className="flex justify-between py-1">
                              <span>{item.description} (Qty: {item.quantity})</span>
                              <span>${item.amount.toFixed(2)}</span>
                            </div>
                          ));
                        } catch {
                          return <span className="text-slate-500">No additional items</span>;
                        }
                      })()}
                    </div>
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedInvoice.notes && (
                <div>
                  <h3 className="font-semibold text-lg mb-2">Notes</h3>
                  <div className="bg-slate-50 p-4 rounded-lg">
                    <p className="text-sm">{selectedInvoice.notes}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}