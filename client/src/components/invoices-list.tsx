import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, FileText, DollarSign, Calendar, Building } from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { Invoice } from "@shared/schema";

interface InvoicesListProps {
  organizationId: number;
  userRole?: string;
}

interface InvoiceDetails extends Invoice {
  vendor?: {
    id: number;
    name: string;
  };
  ticket?: {
    id: number;
    title: string;
    location?: {
      name: string;
    };
  };
}

export function InvoicesList({ organizationId, userRole }: InvoicesListProps) {
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceDetails | null>(null);

  // Fetch invoices
  const { data: invoices, isLoading } = useQuery<InvoiceDetails[]>({
    queryKey: ["/api/invoices"],
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "bg-gray-100 text-gray-800";
      case "sent":
        return "bg-blue-100 text-blue-800";
      case "paid":
        return "bg-green-100 text-green-800";
      case "overdue":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <p className="text-slate-500">Loading invoices...</p>
      </div>
    );
  }

  if (!invoices || invoices.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <FileText className="h-12 w-12 text-slate-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-slate-900 mb-2">No Invoices Found</h3>
        <p className="text-slate-500">
          {userRole === "billing" 
            ? "No invoices available for your assigned locations." 
            : "No invoices have been created for this organization yet."}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Total Invoices</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{invoices.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Total Amount</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(invoices.reduce((sum, inv) => sum + parseFloat(inv.total.toString()), 0))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Paid</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {invoices.filter(inv => inv.status === "paid").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {invoices.filter(inv => inv.status !== "paid").length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Invoices Table */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900">Invoices</h3>
            <p className="text-sm text-slate-600 mt-1">
              {userRole === "billing" 
                ? "Invoices for your assigned locations" 
                : "All invoices for this organization"}
            </p>
          </div>
          
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Ticket</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">
                    INV-{invoice.id.toString().padStart(4, '0')}
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">#{invoice.ticketId}</div>
                      {invoice.ticket?.title && (
                        <div className="text-sm text-slate-500 truncate max-w-32">
                          {invoice.ticket.title}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {invoice.vendor?.name || "Unknown Vendor"}
                  </TableCell>
                  <TableCell>
                    {invoice.ticket?.location?.name || "No Location"}
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatCurrency(parseFloat(invoice.total.toString()))}
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(invoice.status)}>
                      {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {invoice.createdAt ? formatDate(invoice.createdAt) : "N/A"}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedInvoice(invoice)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Invoice Details Modal */}
      {selectedInvoice && (
        <Dialog open={!!selectedInvoice} onOpenChange={() => setSelectedInvoice(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Invoice INV-{selectedInvoice.id.toString().padStart(4, '0')}
              </DialogTitle>
            </DialogHeader>
            
            <ScrollArea className="max-h-[70vh]">
              <div className="space-y-6">
                {/* Invoice Header */}
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-2">Invoice Details</h4>
                    <div className="space-y-1 text-sm">
                      <div><span className="font-medium">Invoice #:</span> INV-{selectedInvoice.id.toString().padStart(4, '0')}</div>
                      <div><span className="font-medium">Ticket #:</span> {selectedInvoice.ticketId}</div>
                      <div><span className="font-medium">Date:</span> {selectedInvoice.createdAt ? formatDate(selectedInvoice.createdAt) : "N/A"}</div>
                      <div><span className="font-medium">Status:</span> 
                        <Badge className={`ml-2 ${getStatusColor(selectedInvoice.status)}`}>
                          {selectedInvoice.status.charAt(0).toUpperCase() + selectedInvoice.status.slice(1)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-2">Vendor Information</h4>
                    <div className="space-y-1 text-sm">
                      <div><span className="font-medium">Vendor:</span> {selectedInvoice.vendor?.name || "Unknown"}</div>
                      <div><span className="font-medium">Location:</span> {selectedInvoice.ticket?.location?.name || "No Location"}</div>
                    </div>
                  </div>
                </div>

                {/* Work Orders */}
                {selectedInvoice.workOrderIds && selectedInvoice.workOrderIds.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-2">Work Orders</h4>
                    <div className="text-sm text-slate-600">
                      Work Order IDs: {selectedInvoice.workOrderIds.join(", ")}
                    </div>
                  </div>
                )}

                {/* Additional Items */}
                {selectedInvoice.additionalItems && selectedInvoice.additionalItems.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-2">Additional Items</h4>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Description</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(typeof selectedInvoice.additionalItems === 'string' 
                          ? JSON.parse(selectedInvoice.additionalItems) 
                          : selectedInvoice.additionalItems || []).map((item: any, index: number) => (
                          <TableRow key={index}>
                            <TableCell>{item.description}</TableCell>
                            <TableCell className="text-right">{formatCurrency(item.amount)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}

                {/* Invoice Totals */}
                <div className="border-t border-slate-200 pt-4">
                  <div className="flex justify-end">
                    <div className="w-64 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Subtotal:</span>
                        <span>{formatCurrency(parseFloat(selectedInvoice.subtotal.toString()))}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Tax:</span>
                        <span>{formatCurrency(parseFloat(selectedInvoice.tax.toString()))}</span>
                      </div>
                      <div className="flex justify-between font-semibold text-lg border-t border-slate-200 pt-2">
                        <span>Total:</span>
                        <span>{formatCurrency(parseFloat(selectedInvoice.total.toString()))}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {selectedInvoice.notes && (
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-2">Notes</h4>
                    <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded">
                      {selectedInvoice.notes}
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}