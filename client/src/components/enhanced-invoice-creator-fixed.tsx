import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp, Calculator, FileText, Package, DollarSign, Clock } from "lucide-react";
import { InvoicePDFViewer } from "./invoice-pdf-viewer";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { WorkOrder, Invoice, Ticket, MaintenanceVendor, Organization } from "@shared/schema";

const invoiceSchema = z.object({
  tax: z.number().min(0),
  discount: z.number().min(0),
  notes: z.string().optional(),
  paymentTerms: z.string().optional(),
});

interface EnhancedInvoiceCreatorProps {
  ticket: Ticket;
  workOrders: WorkOrder[];
  vendor: MaintenanceVendor;
  organization: Organization;
  onClose: () => void;
}

interface EditableWorkOrder extends WorkOrder {
  editableHourlyRate: number;
  editableHours: number;
  editableLaborCost: number;
  editableParts: any[];
  editableOtherCharges: any[];
  editableTotalCost: number;
}

export function EnhancedInvoiceCreator({
  ticket,
  workOrders,
  vendor,
  organization,
  onClose
}: EnhancedInvoiceCreatorProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("work-orders");
  const [expandedWorkOrders, setExpandedWorkOrders] = useState<Record<number, boolean>>({});
  const [editableWorkOrders, setEditableWorkOrders] = useState<EditableWorkOrder[]>([]);

  const form = useForm({
    resolver: zodResolver(invoiceSchema),
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

        // Ensure parts have editable costs initialized
        const editableParts = parts.map((part: any) => ({
          ...part,
          cost: part.cost || 0
        }));

        const editableHours = parseFloat(wo.totalHours || "0");
        const editableHourlyRate = 75;
        const laborCost = editableHours * editableHourlyRate;
        
        const partsCost = editableParts.reduce((sum: number, p: any) => 
          sum + (p.cost * p.quantity), 0);
        
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
        const otherChargesCost = (wo.editableOtherCharges || []).reduce((sum, charge) => sum + charge.amount, 0);
        
        return {
          ...wo,
          editableHourlyRate: newRate,
          editableLaborCost: laborCost,
          editableTotalCost: laborCost + partsCost + otherChargesCost,
        };
      }
      return wo;
    }));
  };

  const updateWorkOrderHours = (workOrderId: number, newHours: number) => {
    setEditableWorkOrders(prev => prev.map(wo => {
      if (wo.id === workOrderId) {
        const rate = wo.editableHourlyRate || 75;
        const laborCost = newHours * rate;
        const partsCost = (wo.editableParts || []).reduce((sum, part) => sum + (part.cost * part.quantity), 0);
        const otherChargesCost = (wo.editableOtherCharges || []).reduce((sum, charge) => sum + charge.amount, 0);
        
        return {
          ...wo,
          editableHours: newHours,
          editableLaborCost: laborCost,
          editableTotalCost: laborCost + partsCost + otherChargesCost,
        };
      }
      return wo;
    }));
  };

  const updatePartCost = (workOrderId: number, partIndex: number, newCost: number) => {
    setEditableWorkOrders(prev => prev.map(wo => {
      if (wo.id === workOrderId) {
        const updatedParts = [...wo.editableParts];
        updatedParts[partIndex] = { ...updatedParts[partIndex], cost: newCost };
        
        const partsCost = updatedParts.reduce((sum, part) => sum + (part.cost * part.quantity), 0);
        const laborCost = wo.editableLaborCost || 0;
        const otherChargesCost = (wo.editableOtherCharges || []).reduce((sum, charge) => sum + charge.amount, 0);
        
        return {
          ...wo,
          editableParts: updatedParts,
          editableTotalCost: laborCost + partsCost + otherChargesCost,
        };
      }
      return wo;
    }));
  };

  const toggleWorkOrder = (workOrderId: number) => {
    setExpandedWorkOrders(prev => ({
      ...prev,
      [workOrderId]: !prev[workOrderId]
    }));
  };

  const handleSubmit = async (data: z.infer<typeof invoiceSchema>) => {
    try {
      const invoice = {
        ticketId: ticket.id,
        organizationId: organization.id,
        maintenanceVendorId: vendor.id,
        subtotal: subtotal.toString(),
        tax: data.tax.toString(),
        discount: data.discount.toString(),
        total: total.toString(),
        notes: data.notes,
        paymentTerms: data.paymentTerms,
        status: "draft" as const,
        workOrdersData: editableWorkOrders.map(wo => ({
          id: wo.id,
          hourlyRate: wo.editableHourlyRate,
          hours: wo.editableHours,
          laborCost: wo.editableLaborCost,
          parts: wo.editableParts,
          otherCharges: wo.editableOtherCharges,
          totalCost: wo.editableTotalCost,
        })),
      };

      await apiRequest("/api/invoices", {
        method: "POST",
        body: JSON.stringify(invoice),
        headers: { "Content-Type": "application/json" },
      });

      await queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      
      toast({
        title: "Invoice Created",
        description: "Invoice has been created successfully!",
      });

      onClose();
    } catch (error) {
      console.error("Failed to create invoice:", error);
      toast({
        title: "Error",
        description: "Failed to create invoice. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6 bg-background text-foreground">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Invoice Creation - {ticket.number}</h1>
          <p className="text-muted-foreground mt-1">Create professional invoice for completed work</p>
        </div>
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="work-orders" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Edit Work Orders
          </TabsTrigger>
          <TabsTrigger value="invoice-details" className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            Invoice Details
          </TabsTrigger>
          <TabsTrigger value="pdf-preview" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            PDF Preview
          </TabsTrigger>
        </TabsList>

        {/* Work Orders Tab */}
        <TabsContent value="work-orders">
          <Card className="bg-card text-card-foreground border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <FileText className="h-5 w-5" />
                Adjust Work Order Costs & Rates
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {editableWorkOrders.map((workOrder) => (
                <Card key={workOrder.id} className="bg-muted/30 border-border">
                  <Collapsible 
                    open={expandedWorkOrders[workOrder.id]} 
                    onOpenChange={() => toggleWorkOrder(workOrder.id)}
                  >
                    <CollapsibleTrigger asChild>
                      <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg flex items-center gap-2 text-foreground">
                            <Clock className="h-4 w-4" />
                            Work Order #{workOrder.workOrderNumber}
                          </CardTitle>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-foreground">
                              {workOrder.editableHours || 0} hours
                            </Badge>
                            <Badge variant="outline" className="text-green-600 font-semibold">
                              ${workOrder.editableTotalCost?.toFixed(2) || '0.00'}
                            </Badge>
                            {expandedWorkOrders[workOrder.id] ? (
                              <ChevronUp className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="pt-0 space-y-6">
                        {/* Labor Costs */}
                        <div className="bg-background p-4 rounded-lg border border-border">
                          <h4 className="font-semibold mb-3 flex items-center gap-2 text-foreground">
                            <Clock className="h-4 w-4" />
                            Labor Costs
                          </h4>
                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <label className="text-sm font-medium text-foreground">Hourly Rate</label>
                              <div className="flex items-center mt-1">
                                <span className="mr-1 text-foreground">$</span>
                                <Input
                                  type="number"
                                  step="0.50"
                                  value={workOrder.editableHourlyRate || 0}
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

                        {/* Parts Section */}
                        <div className="bg-background p-4 rounded-lg border border-border">
                          <h4 className="font-semibold mb-3 flex items-center gap-2 text-foreground">
                            <Package className="h-4 w-4" />
                            Parts & Materials
                          </h4>
                          
                          {workOrder.editableParts && workOrder.editableParts.length > 0 ? (
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
                          ) : (
                            <p className="text-muted-foreground text-sm">
                              No parts used in this work order.
                            </p>
                          )}
                        </div>

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
                    </CollapsibleContent>
                  </Collapsible>
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

                  <FormField
                    control={form.control}
                    name="paymentTerms"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground">Payment Terms</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Net 30"
                            className="bg-background text-foreground border-input"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground">Additional Notes</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Any additional notes for this invoice..."
                            className="min-h-[100px] bg-background text-foreground border-input"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="bg-muted/50 p-4 rounded-lg border">
                    <h3 className="font-semibold mb-4 text-foreground">Invoice Summary</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Work Orders Subtotal:</span>
                        <span className="font-medium text-foreground">${workOrdersSubtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Tax:</span>
                        <span className="font-medium text-foreground">${tax.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Discount:</span>
                        <span className="font-medium text-foreground">-${discount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-lg font-bold border-t pt-2">
                        <span className="text-foreground">Total:</span>
                        <span className="text-green-600">${total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <Button type="submit" className="w-full">
                    Create Invoice
                  </Button>
                </CardContent>
              </Card>
            </form>
          </Form>
        </TabsContent>

        {/* PDF Preview Tab */}
        <TabsContent value="pdf-preview">
          <InvoicePDFViewer
            invoice={{
              id: 0,
              invoiceNumber: `INV-${ticket.number}`,
              ticketId: ticket.id,
              organizationId: organization.id,
              maintenanceVendorId: vendor.id,
              subtotal: subtotal.toString(),
              tax: tax.toString(),
              discount: discount.toString(),
              total: total.toString(),
              notes: form.watch("notes"),
              paymentTerms: form.watch("paymentTerms"),
              status: "draft",
              createdAt: new Date(),
              paidAt: null,
            }}
            ticket={ticket}
            vendor={vendor}
            organization={organization}
            workOrders={editableWorkOrders}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}