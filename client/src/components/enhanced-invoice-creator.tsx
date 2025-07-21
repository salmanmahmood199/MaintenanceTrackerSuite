import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, Calculator, Edit3, FileText, DollarSign, Clock, Package, User, Building2, ChevronDown } from "lucide-react";
import type { Ticket, WorkOrder, MaintenanceVendor, Organization } from "@shared/schema";
import { format as formatTz, toZonedTime } from "date-fns-tz";

interface EnhancedInvoiceCreatorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => void;
  isLoading: boolean;
  ticket: Ticket | null;
  workOrders: WorkOrder[];
  vendor: MaintenanceVendor | null;
  organization: Organization | null;
}

interface EditableWorkOrder extends WorkOrder {
  editableHourlyRate?: number;
  editableHours?: number;
  editableLaborCost?: number;
  editableParts?: Array<{
    name: string;
    quantity: number;
    cost: number;
  }>;
  editableOtherCharges?: Array<{
    description: string;
    amount: number;
  }>;
  editableTotalCost?: number;
}

const invoiceFormSchema = z.object({
  tax: z.number().min(0, "Tax must be positive").default(0),
  discount: z.number().min(0, "Discount must be positive").default(0),
  notes: z.string().optional(),
  paymentTerms: z.string().default("Net 30"),
  dueDate: z.string().optional(),
});

type InvoiceFormData = z.infer<typeof invoiceFormSchema>;

export function EnhancedInvoiceCreator({
  open,
  onOpenChange,
  onSubmit,
  isLoading,
  ticket,
  workOrders,
  vendor,
  organization,
}: EnhancedInvoiceCreatorProps) {
  const [editableWorkOrders, setEditableWorkOrders] = useState<EditableWorkOrder[]>([]);
  const [selectedWorkOrderId, setSelectedWorkOrderId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState("work-orders");

  const form = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: {
      tax: 0,
      discount: 0,
      notes: "",
      paymentTerms: "Net 30",
    },
  });

  // Initialize editable work orders
  useEffect(() => {
    if (workOrders.length > 0) {
      const editableWOs = workOrders.map(wo => {
        let parts = [];
        let otherCharges = [];
        
        try {
          parts = wo.parts ? JSON.parse(wo.parts as string) : [];
        } catch (e) {
          parts = [];
        }
        
        try {
          otherCharges = wo.otherCharges ? JSON.parse(wo.otherCharges as string) : [];
        } catch (e) {
          otherCharges = [];
        }

        // Ensure parts have editable costs initialized from system defaults
        const editableParts = parts.map((part: any) => ({
          ...part,
          cost: part.cost || 0 // Use existing cost or default to 0
        }));

        const editableHours = parseFloat(wo.totalHours || "0");
        const editableHourlyRate = 75; // Default rate but customizable
        const laborCost = editableHours * editableHourlyRate;
        
        // Calculate total parts cost
        const partsCost = editableParts.reduce((sum: number, p: any) => 
          sum + (p.cost * p.quantity), 0);
        
        // Calculate total other charges
        const otherChargesCost = otherCharges.reduce((sum: number, c: any) => 
          sum + c.amount, 0);

        return {
          ...wo,
          editableHourlyRate,
          editableHours,
          editableLaborCost: laborCost,
          editableParts,
          editableOtherCharges: otherCharges,
          editableTotalCost: laborCost + partsCost + otherChargesCost,
        };
      });
      
      setEditableWorkOrders(editableWOs);
    }
  }, [workOrders]);

  // Calculate totals
  const workOrdersSubtotal = editableWorkOrders.reduce((sum, wo) => {
    return sum + (wo.editableTotalCost || 0);
  }, 0);

  const tax = form.watch("tax") || 0;
  const discount = form.watch("discount") || 0;
  const subtotal = workOrdersSubtotal;
  const total = subtotal + tax - discount;

  const updateWorkOrderRate = (workOrderId: number, newRate: number) => {
    setEditableWorkOrders(prev => prev.map(wo => {
      if (wo.id === workOrderId) {
        const hours = wo.editableHours || 0;
        const laborCost = newRate * hours;
        const partsCost = (wo.editableParts || []).reduce((sum, part) => sum + (part.cost * part.quantity), 0);
        const otherCost = (wo.editableOtherCharges || []).reduce((sum, charge) => sum + charge.amount, 0);
        const totalCost = laborCost + partsCost + otherCost;
        
        return {
          ...wo,
          editableHourlyRate: newRate,
          editableLaborCost: laborCost,
          editableTotalCost: totalCost,
        };
      }
      return wo;
    }));
  };

  const updateWorkOrderHours = (workOrderId: number, newHours: number) => {
    setEditableWorkOrders(prev => prev.map(wo => {
      if (wo.id === workOrderId) {
        const rate = wo.editableHourlyRate || 75;
        const laborCost = rate * newHours;
        const partsCost = (wo.editableParts || []).reduce((sum, part) => sum + (part.cost * part.quantity), 0);
        const otherCost = (wo.editableOtherCharges || []).reduce((sum, charge) => sum + charge.amount, 0);
        const totalCost = laborCost + partsCost + otherCost;
        
        return {
          ...wo,
          editableHours: newHours,
          editableLaborCost: laborCost,
          editableTotalCost: totalCost,
        };
      }
      return wo;
    }));
  };

  const updatePartCost = (workOrderId: number, partIndex: number, newCost: number) => {
    setEditableWorkOrders(prev => prev.map(wo => {
      if (wo.id === workOrderId) {
        const updatedParts = [...(wo.editableParts || [])];
        updatedParts[partIndex] = { ...updatedParts[partIndex], cost: newCost };
        
        const laborCost = wo.editableLaborCost || 0;
        const partsCost = updatedParts.reduce((sum, part) => sum + (part.cost * part.quantity), 0);
        const otherCost = (wo.editableOtherCharges || []).reduce((sum, charge) => sum + charge.amount, 0);
        const totalCost = laborCost + partsCost + otherCost;
        
        return {
          ...wo,
          editableParts: updatedParts,
          editableTotalCost: totalCost,
        };
      }
      return wo;
    }));
  };

  const handleSubmit = (data: InvoiceFormData) => {
    onSubmit({
      ...data,
      ticketId: ticket?.id,
      workOrdersData: editableWorkOrders,
      subtotal: workOrdersSubtotal,
      total: total,
    });
  };

  if (!ticket) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto bg-background text-foreground">
        <DialogHeader className="border-b pb-4">
          <DialogTitle className="flex items-center gap-3 text-2xl text-foreground">
            <FileText className="h-6 w-6 text-blue-600" />
            Invoice Creation - {ticket.ticketNumber}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6 bg-muted">
            <TabsTrigger value="work-orders" className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:text-foreground">
              <Edit3 className="h-4 w-4" />
              Edit Work Orders
            </TabsTrigger>
            <TabsTrigger value="invoice-details" className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:text-foreground">
              <Calculator className="h-4 w-4" />
              Invoice Details
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:text-foreground">
              <FileText className="h-4 w-4" />
              PDF Preview
            </TabsTrigger>
          </TabsList>

          {/* Work Orders Editing Tab */}
          <TabsContent value="work-orders" className="space-y-4">
            <Card className="bg-card text-card-foreground border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <Edit3 className="h-5 w-5" />
                  Adjust Work Order Costs & Rates
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {editableWorkOrders.map((workOrder) => (
                  <Card 
                    key={workOrder.id} 
                    className={`border-l-4 ${selectedWorkOrderId === workOrder.id ? 'border-l-blue-500 bg-muted/50' : 'border-l-border'} transition-colors bg-card text-card-foreground`}
                  >
                    <CardHeader 
                      className="cursor-pointer"
                      onClick={() => setSelectedWorkOrderId(selectedWorkOrderId === workOrder.id ? null : workOrder.id)}
                    >
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg text-foreground">Work Order #{workOrder.workOrderNumber}</CardTitle>
                        <div className="flex items-center gap-4">
                          <div className="text-sm text-muted-foreground">
                            <Clock className="h-4 w-4 inline mr-1" />
                            {workOrder.editableHours} hours
                          </div>
                          <div className="text-lg font-semibold text-green-600">
                            ${workOrder.editableTotalCost?.toFixed(2) || '0.00'}
                          </div>
                          <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${selectedWorkOrderId === workOrder.id ? 'rotate-180' : ''}`} />
                        </div>
                      </div>
                    </CardHeader>

                    {selectedWorkOrderId === workOrder.id && (
                      <CardContent className="space-y-4 bg-muted/30" onClick={(e) => e.stopPropagation()}>
                        {/* Labor Section */}
                        <div className="bg-background p-4 rounded-lg border border-border">
                          <h4 className="font-semibold mb-3 flex items-center gap-2 text-foreground">
                            <User className="h-4 w-4" />
                            Labor Costs
                          </h4>
                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <label className="text-sm font-medium text-foreground">Hourly Rate</label>
                              <div className="flex items-center mt-1">
                                <span className="text-lg mr-1 text-foreground">$</span>
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={workOrder.editableHourlyRate || 75}
                                  onChange={(e) => {
                                    e.stopPropagation();
                                    updateWorkOrderRate(workOrder.id, parseFloat(e.target.value) || 0);
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                  onFocus={(e) => e.stopPropagation()}
                                  className="w-full bg-background text-foreground border-input"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-foreground">Hours Worked</label>
                              <Input
                                type="number"
                                step="0.25"
                                value={workOrder.editableHours || 0}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  updateWorkOrderHours(workOrder.id, parseFloat(e.target.value) || 0);
                                }}
                                onClick={(e) => e.stopPropagation()}
                                onFocus={(e) => e.stopPropagation()}
                                className="w-full mt-1 bg-background text-foreground border-input"
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium text-foreground">Labor Total</label>
                              <div className="mt-1 p-2 bg-muted text-foreground rounded border text-lg font-semibold">
                                ${workOrder.editableLaborCost?.toFixed(2) || '0.00'}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Parts Summary Display (underneath labor) */}
                        {workOrder.editableParts && workOrder.editableParts.length > 0 && (
                          <div className="bg-muted/20 p-3 rounded-lg border border-muted">
                            <h5 className="text-sm font-medium text-muted-foreground mb-2">Parts & Materials Summary</h5>
                            <div className="space-y-1">
                              {workOrder.editableParts.map((part, index) => (
                                <div key={index} className="flex justify-between items-center text-sm">
                                  <span className="text-foreground">
                                    {part.name} (x{part.quantity})
                                  </span>
                                  <span className="font-medium text-green-600">
                                    ${(part.cost * part.quantity).toFixed(2)}
                                  </span>
                                </div>
                              ))}
                              <div className="border-t border-muted pt-1 mt-2">
                                <div className="flex justify-between items-center text-sm font-semibold">
                                  <span className="text-foreground">Parts Total:</span>
                                  <span className="text-green-600">
                                    ${workOrder.editableParts.reduce((sum, p) => sum + (p.cost * p.quantity), 0).toFixed(2)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Detailed Parts Section (for editing) */}
                        {workOrder.editableParts && workOrder.editableParts.length > 0 && (
                          <div className="bg-background p-4 rounded-lg border border-border">
                            <h4 className="font-semibold mb-3 flex items-center gap-2 text-foreground">
                              <Package className="h-4 w-4" />
                              Edit Parts & Materials Costs
                            </h4>
                            <div className="space-y-3">
                              {workOrder.editableParts.map((part, index) => (
                                <div key={index} className="grid grid-cols-4 gap-4 items-center bg-muted/50 p-3 rounded">
                                  <div>
                                    <label className="text-sm font-medium text-foreground">Part Name</label>
                                    <div className="mt-1 font-medium text-foreground">{part.name}</div>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-foreground">Quantity</label>
                                    <div className="mt-1 text-center font-medium text-foreground">{part.quantity}</div>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-foreground">Unit Cost</label>
                                    <div className="flex items-center mt-1">
                                      <span className="mr-1 text-foreground">$</span>
                                      <Input
                                        type="number"
                                        step="0.01"
                                        value={part.cost}
                                        onChange={(e) => {
                                          e.stopPropagation();
                                          updatePartCost(workOrder.id, index, parseFloat(e.target.value) || 0);
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                        onFocus={(e) => e.stopPropagation()}
                                        className="w-full bg-background text-foreground border-input"
                                      />
                                    </div>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-foreground">Total</label>
                                    <div className="mt-1 text-center font-semibold text-green-600">
                                      ${(part.cost * part.quantity).toFixed(2)}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Other Charges */}
                        {workOrder.editableOtherCharges && workOrder.editableOtherCharges.length > 0 && (
                          <div className="bg-background p-4 rounded-lg border border-border">
                            <h4 className="font-semibold mb-3 flex items-center gap-2 text-foreground">
                              <DollarSign className="h-4 w-4" />
                              Additional Charges
                            </h4>
                            <div className="space-y-2">
                              {workOrder.editableOtherCharges.map((charge, index) => (
                                <div key={index} className="flex justify-between items-center bg-muted/50 p-3 rounded">
                                  <span className="font-medium text-foreground">{charge.description}</span>
                                  <span className="font-semibold text-green-600">${charge.amount.toFixed(2)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    )}
                  </Card>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Invoice Details Tab */}
          <TabsContent value="invoice-details">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                <Card className="bg-card text-card-foreground border-border">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-foreground">
                      <Calculator className="h-5 w-5" />
                      Invoice Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="tax"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-foreground">Tax Amount ($)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                className="bg-background text-foreground border-input"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="discount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-foreground">Discount ($)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                className="bg-background text-foreground border-input"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="paymentTerms"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-foreground">Payment Terms</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Net 30" className="bg-background text-foreground border-input" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="dueDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-foreground">Due Date</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} className="bg-background text-foreground border-input" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-foreground">Notes</FormLabel>
                          <FormControl>
                            <Textarea {...field} rows={3} placeholder="Additional notes or terms..." className="bg-background text-foreground border-input" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Invoice Summary */}
                <Card className="bg-card text-card-foreground border-border">
                  <CardHeader>
                    <CardTitle className="text-foreground">Invoice Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-lg">
                        <span>Subtotal:</span>
                        <span>${workOrdersSubtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tax:</span>
                        <span>${tax.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Discount:</span>
                        <span>-${discount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-2xl font-bold border-t pt-2">
                        <span>Total:</span>
                        <span className="text-green-600">${total.toFixed(2)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">
                    {isLoading ? "Creating..." : "Create Invoice"}
                  </Button>
                </div>
              </form>
            </Form>
          </TabsContent>

          {/* PDF Preview Tab */}
          <TabsContent value="preview">
            <div className="bg-white border rounded-lg shadow-lg max-w-4xl mx-auto">
              {/* Professional Invoice Header */}
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <h1 className="text-3xl font-bold">INVOICE</h1>
                    <p className="text-blue-100 mt-2">Professional Maintenance Services</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm opacity-75">Invoice Date:</p>
                    <p className="text-lg font-semibold">
                      {formatTz(toZonedTime(new Date(), 'America/New_York'), "MMM dd, yyyy", { timeZone: 'America/New_York' })}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Company & Client Info */}
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <Building2 className="h-5 w-5" />
                      From:
                    </h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="font-semibold text-xl">{vendor?.name || 'Maintenance Vendor'}</p>
                      <p className="text-gray-600">{vendor?.address || 'Vendor Address'}</p>
                      <p className="text-gray-600">{vendor?.email || 'vendor@email.com'}</p>
                      <p className="text-gray-600">{vendor?.phone || 'Phone Number'}</p>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <Building2 className="h-5 w-5" />
                      Bill To:
                    </h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="font-semibold text-xl">{organization?.name || 'Organization'}</p>
                      <p className="text-gray-600">{organization?.address || 'Organization Address'}</p>
                      <p className="text-gray-600">{organization?.email || 'org@email.com'}</p>
                      <p className="text-gray-600">{organization?.phone || 'Phone Number'}</p>
                    </div>
                  </div>
                </div>

                {/* Ticket Information */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-lg mb-2">Service Details</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><span className="font-medium">Ticket Number:</span> {ticket.ticketNumber}</div>
                    <div><span className="font-medium">Priority:</span> <Badge variant="outline">{ticket.priority}</Badge></div>
                    <div className="col-span-2"><span className="font-medium">Description:</span> {ticket.description}</div>
                  </div>
                </div>

                {/* Work Orders Table */}
                <div>
                  <h3 className="font-semibold text-lg mb-4">Work Orders Completed</h3>
                  <div className="overflow-hidden rounded-lg border">
                    <table className="w-full">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-4 py-3 text-left font-semibold">Work Order</th>
                          <th className="px-4 py-3 text-left font-semibold">Technician</th>
                          <th className="px-4 py-3 text-right font-semibold">Hours</th>
                          <th className="px-4 py-3 text-right font-semibold">Labor</th>
                          <th className="px-4 py-3 text-right font-semibold">Parts</th>
                          <th className="px-4 py-3 text-right font-semibold">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {editableWorkOrders.map((workOrder) => {
                          const partsCost = (workOrder.editableParts || []).reduce((sum, part) => sum + (part.cost * part.quantity), 0);
                          return (
                            <tr key={workOrder.id} className="border-t">
                              <td className="px-4 py-3 font-medium">#{workOrder.workOrderNumber}</td>
                              <td className="px-4 py-3">{workOrder.technicianName}</td>
                              <td className="px-4 py-3 text-right">{workOrder.editableHours?.toFixed(2)}</td>
                              <td className="px-4 py-3 text-right">${workOrder.editableLaborCost?.toFixed(2)}</td>
                              <td className="px-4 py-3 text-right">${partsCost.toFixed(2)}</td>
                              <td className="px-4 py-3 text-right font-semibold">${workOrder.editableTotalCost?.toFixed(2)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Invoice Total */}
                <div className="bg-gray-50 p-6 rounded-lg">
                  <div className="flex justify-end">
                    <div className="w-64 space-y-2">
                      <div className="flex justify-between text-lg">
                        <span>Subtotal:</span>
                        <span>${workOrdersSubtotal.toFixed(2)}</span>
                      </div>
                      {tax > 0 && (
                        <div className="flex justify-between">
                          <span>Tax:</span>
                          <span>${tax.toFixed(2)}</span>
                        </div>
                      )}
                      {discount > 0 && (
                        <div className="flex justify-between">
                          <span>Discount:</span>
                          <span>-${discount.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-2xl font-bold border-t pt-2">
                        <span>TOTAL:</span>
                        <span className="text-green-600">${total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment Terms & Notes */}
                <div className="text-sm text-gray-600">
                  <p><span className="font-medium">Payment Terms:</span> {form.watch("paymentTerms") || "Net 30"}</p>
                  {form.watch("notes") && (
                    <div className="mt-2">
                      <p className="font-medium">Notes:</p>
                      <p>{form.watch("notes")}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}