import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Eye, Calendar, DollarSign } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { InvoicePDFViewer } from "./invoice-pdf-viewer";
import { PaymentModal } from "./payment-modal";
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
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [invoiceToPayFor, setInvoiceToPayFor] = useState<Invoice | null>(null);

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

  const handlePayInvoice = (invoice: Invoice) => {
    setInvoiceToPayFor(invoice);
    setIsPaymentModalOpen(true);
  };

  // Organize invoices by status and sort by date
  const organizeInvoices = (invoices: Invoice[]) => {
    const sortedInvoices = [...invoices].sort((a, b) => 
      new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );
    
    return {
      all: sortedInvoices,
      paid: sortedInvoices.filter(inv => inv.status === "paid"),
      unpaid: sortedInvoices.filter(inv => inv.status !== "paid")
    };
  };

  const organizedInvoices = organizeInvoices(invoices);

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

  const renderInvoiceTable = (invoiceList: Invoice[], showPayButton: boolean = false) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Invoice #</TableHead>
          <TableHead>Ticket #</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Created</TableHead>
          <TableHead>Paid Date</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {invoiceList.map((invoice) => (
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
              <div className="flex items-center gap-2">
                <Badge className={getStatusColor(invoice.status)}>
                  {invoice.status}
                </Badge>
                {invoice.paymentMethod && (
                  <Badge variant="outline" className="text-xs">
                    {invoice.paymentMethod === "external" && invoice.paymentType 
                      ? `${invoice.paymentType}${invoice.checkNumber ? ` #${invoice.checkNumber}` : ''}`
                      : invoice.paymentMethod}
                  </Badge>
                )}
              </div>
            </TableCell>
            <TableCell>
              <div className="flex items-center text-sm text-slate-600">
                <Calendar className="h-4 w-4 mr-1" />
                {formatDate(invoice.createdAt || new Date())}
              </div>
            </TableCell>
            <TableCell>
              {invoice.paidAt ? (
                <div className="flex items-center text-sm text-green-600">
                  <Calendar className="h-4 w-4 mr-1" />
                  {formatDate(invoice.paidAt)}
                </div>
              ) : (
                <span className="text-sm text-muted-foreground">-</span>
              )}
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <InvoicePDFViewer invoice={invoice} />
                {showPayButton && invoice.status !== "paid" && (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="text-green-600 border-green-600 hover:bg-green-50"
                    onClick={() => handlePayInvoice(invoice)}
                  >
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
  );

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {userRole === "organization" ? "Organization Invoices" : "Vendor Invoices"}
          </CardTitle>
          {userRole === "organization" && (
            <p className="text-sm text-muted-foreground">
              View and manage all invoices for your organization
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
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="all">
                  All Invoices ({organizedInvoices.all.length})
                </TabsTrigger>
                <TabsTrigger value="unpaid">
                  Unpaid ({organizedInvoices.unpaid.length})
                </TabsTrigger>
                <TabsTrigger value="paid">
                  Paid ({organizedInvoices.paid.length})
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="all" className="mt-4">
                {renderInvoiceTable(organizedInvoices.all, userRole === "organization" && canPayInvoices)}
              </TabsContent>
              
              <TabsContent value="unpaid" className="mt-4">
                {organizedInvoices.unpaid.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <p>No unpaid invoices</p>
                  </div>
                ) : (
                  renderInvoiceTable(organizedInvoices.unpaid, userRole === "organization" && canPayInvoices)
                )}
              </TabsContent>
              
              <TabsContent value="paid" className="mt-4">
                {organizedInvoices.paid.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <p>No paid invoices</p>
                  </div>
                ) : (
                  renderInvoiceTable(organizedInvoices.paid, false)
                )}
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>

      {/* Payment Modal */}
      <PaymentModal
        open={isPaymentModalOpen}
        onOpenChange={setIsPaymentModalOpen}
        invoice={invoiceToPayFor}
      />

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