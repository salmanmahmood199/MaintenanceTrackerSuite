import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, FileText, Download, Print } from "lucide-react";
import { format as formatTz, toZonedTime } from "date-fns-tz";
import type { Invoice, Ticket, MaintenanceVendor, Organization, WorkOrder } from "@shared/schema";

interface InvoicePDFViewerProps {
  invoice: Invoice;
  ticket: Ticket | null;
  vendor: MaintenanceVendor | null;
  organization: Organization | null;
  workOrders: WorkOrder[];
}

export function InvoicePDFViewer({
  invoice,
  ticket,
  vendor,
  organization,
  workOrders,
}: InvoicePDFViewerProps) {
  
  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // Future enhancement: Generate PDF download
    alert("PDF download feature coming soon!");
  };

  return (
    <div className="space-y-6">
      {/* Print/Download Actions */}
      <div className="flex justify-end gap-2 no-print">
        <Button onClick={handlePrint} variant="outline" className="flex items-center gap-2">
          <Print className="h-4 w-4" />
          Print Invoice
        </Button>
        <Button onClick={handleDownload} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700">
          <Download className="h-4 w-4" />
          Download PDF
        </Button>
      </div>

      {/* Professional Invoice Display */}
      <Card className="bg-white text-black print:shadow-none print:border-0 max-w-4xl mx-auto" style={{ color: 'black' }}>
        {/* Invoice Header with Gradient */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-8 print:p-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold print:text-3xl">INVOICE</h1>
              <p className="text-blue-100 mt-2 text-lg">Professional Maintenance Services</p>
            </div>
            <div className="text-right">
              <div className="bg-white/20 p-4 rounded-lg print:bg-gray-100 print:text-black">
                <p className="text-sm opacity-90 print:opacity-70">Invoice Number:</p>
                <p className="text-xl font-bold print:text-lg">{invoice.invoiceNumber}</p>
                <p className="text-sm opacity-90 mt-2 print:opacity-70">Date:</p>
                <p className="font-semibold">
                  {invoice.createdAt ? formatTz(toZonedTime(new Date(invoice.createdAt), 'America/New_York'), "MMM dd, yyyy", { timeZone: 'America/New_York' }) : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-8 print:p-6 space-y-8" style={{ color: 'black' }}>
          {/* Company & Client Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 print:gap-6">
            <div>
              <h3 className="font-bold text-xl mb-4 flex items-center gap-2 text-black">
                <Building2 className="h-5 w-5" />
                Service Provider
              </h3>
              <div className="bg-gray-50 p-6 print:p-4 rounded-xl print:rounded-lg border">
                <p className="font-bold text-2xl print:text-xl text-black">{vendor?.name || 'Maintenance Vendor'}</p>
                <div className="mt-3 space-y-1 text-black">
                  <p>{vendor?.address || 'Vendor Address'}</p>
                  <p>Email: {vendor?.email || 'vendor@email.com'}</p>
                  <p>Phone: {vendor?.phone || 'Phone Number'}</p>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="font-bold text-xl mb-4 flex items-center gap-2 text-black">
                <Building2 className="h-5 w-5" />
                Bill To
              </h3>
              <div className="bg-gray-50 p-6 print:p-4 rounded-xl print:rounded-lg border">
                <p className="font-bold text-2xl print:text-xl text-black">{organization?.name || 'Organization'}</p>
                <div className="mt-3 space-y-1 text-black">
                  <p>{organization?.address || 'Organization Address'}</p>
                  <p>Email: {organization?.email || 'org@email.com'}</p>
                  <p>Phone: {organization?.phone || 'Phone Number'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Service Details */}
          <div className="bg-blue-50 print:bg-gray-50 p-6 print:p-4 rounded-xl print:rounded-lg border border-blue-200 print:border-gray-200">
            <h3 className="font-bold text-xl mb-4 text-black">Service Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-black">
              <div><span className="font-semibold">Ticket Number:</span> {ticket?.ticketNumber || 'N/A'}</div>
              <div><span className="font-semibold">Priority:</span> <Badge variant="outline" className="ml-2">{ticket?.priority || 'Standard'}</Badge></div>
              <div className="md:col-span-2"><span className="font-semibold">Description:</span> {ticket?.description || 'Service completed'}</div>
            </div>
          </div>

          {/* Work Orders Table */}
          <div>
            <h3 className="font-bold text-xl mb-6 text-black">Work Orders Completed</h3>
            <div className="overflow-hidden rounded-xl print:rounded-lg border border-gray-200 bg-white">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr className="border-b border-gray-200">
                    <th className="px-6 print:px-4 py-4 text-left font-bold text-black">Work Order</th>
                    <th className="px-6 print:px-4 py-4 text-left font-bold text-black">Technician</th>
                    <th className="px-6 print:px-4 py-4 text-right font-bold text-black">Hours</th>
                    <th className="px-6 print:px-4 py-4 text-right font-bold text-black">Labor</th>
                    <th className="px-6 print:px-4 py-4 text-right font-bold text-black">Parts</th>
                    <th className="px-6 print:px-4 py-4 text-right font-bold text-black">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {workOrders.map((workOrder, index) => {
                    let parts = [];
                    try {
                      parts = workOrder.parts ? JSON.parse(workOrder.parts as string) : [];
                    } catch (e) {
                      parts = [];
                    }
                    const partsCost = parts.reduce((sum: number, part: any) => sum + (part.cost * part.quantity), 0);
                    
                    return (
                      <tr key={workOrder.id} className={`border-b border-gray-100 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                        <td className="px-6 print:px-4 py-4 font-semibold text-black">#{workOrder.workOrderNumber}</td>
                        <td className="px-6 print:px-4 py-4 text-black">{workOrder.technicianName}</td>
                        <td className="px-6 print:px-4 py-4 text-right text-black">{parseFloat(workOrder.totalHours || "0").toFixed(2)}</td>
                        <td className="px-6 print:px-4 py-4 text-right text-black">${(parseFloat(workOrder.totalHours || "0") * 75).toFixed(2)}</td>
                        <td className="px-6 print:px-4 py-4 text-right text-black">${partsCost.toFixed(2)}</td>
                        <td className="px-6 print:px-4 py-4 text-right font-semibold text-black">${parseFloat(workOrder.totalCost || "0").toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Invoice Totals */}
          <div className="bg-gray-50 print:bg-gray-50 p-6 print:p-4 rounded-xl print:rounded-lg border">
            <div className="flex justify-end">
              <div className="w-80 print:w-72 space-y-3">
                <div className="flex justify-between text-lg text-black">
                  <span>Subtotal:</span>
                  <span>${parseFloat(invoice.subtotal || "0").toFixed(2)}</span>
                </div>
                {parseFloat(invoice.tax || "0") > 0 && (
                  <div className="flex justify-between text-black">
                    <span>Tax:</span>
                    <span>${parseFloat(invoice.tax || "0").toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-2xl print:text-xl font-bold border-t pt-3 text-black">
                  <span>TOTAL:</span>
                  <span className="text-black">${parseFloat(invoice.total || "0").toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Terms & Notes */}
          <div className="border-t pt-6 print:pt-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-black">
              <div>
                <h4 className="font-semibold text-black mb-2">Payment Terms</h4>
                <p>Net 30 - Payment due within 30 days</p>
                {invoice.dueDate && (
                  <p className="mt-1">
                    <span className="font-medium">Due Date:</span> {formatTz(toZonedTime(new Date(invoice.dueDate), 'America/New_York'), "MMM dd, yyyy", { timeZone: 'America/New_York' })}
                  </p>
                )}
              </div>
              <div>
                <h4 className="font-semibold text-black mb-2">Invoice Status</h4>
                <Badge variant={invoice.status === 'paid' ? 'default' : 'outline'} className="text-sm">
                  {invoice.status ? invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1) : 'Draft'}
                </Badge>
              </div>
            </div>
            
            {invoice.notes && (
              <div className="mt-4">
                <h4 className="font-semibold text-black mb-2">Additional Notes</h4>
                <p className="text-black bg-white p-4 rounded-lg border">{invoice.notes}</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="text-center text-sm text-black border-t pt-6 print:pt-4">
            <p>Thank you for your business!</p>
            <p className="mt-1">For questions about this invoice, please contact {vendor?.email || 'vendor@email.com'}</p>
          </div>
        </div>
      </Card>

      {/* Print-specific styles */}
      <style jsx>{`
        @media print {
          .no-print {
            display: none !important;
          }
          @page {
            margin: 0.5in;
            size: A4;
          }
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          * {
            color: black !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .text-green-600 {
            color: black !important;
          }
        }
      `}</style>
    </div>
  );
}