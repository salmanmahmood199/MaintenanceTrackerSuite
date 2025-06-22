import { useState } from "react";
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
import { Plus, Trash2, Calculator } from "lucide-react";
import type { Ticket, WorkOrder } from "@shared/schema";

interface CreateInvoiceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => void;
  isLoading: boolean;
  ticket: Ticket | null;
  workOrders: WorkOrder[];
}

const additionalItemSchema = z.object({
  description: z.string().min(1, "Description required"),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  rate: z.number().min(0, "Rate must be positive"),
  amount: z.number().min(0, "Amount must be positive"),
});

const invoiceFormSchema = z.object({
  tax: z.number().min(0, "Tax must be positive").default(0),
  notes: z.string().optional(),
  additionalItems: z.array(additionalItemSchema).default([]),
});

type InvoiceFormData = z.infer<typeof invoiceFormSchema>;

export function CreateInvoiceModal({
  open,
  onOpenChange,
  onSubmit,
  isLoading,
  ticket,
  workOrders,
}: CreateInvoiceModalProps) {
  const [additionalItems, setAdditionalItems] = useState<Array<{
    description: string;
    quantity: number;
    rate: number;
    amount: number;
  }>>([]);

  const form = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: {
      tax: 0,
      notes: "",
      additionalItems: [],
    },
  });

  // Calculate work orders subtotal
  const workOrdersSubtotal = workOrders.reduce((sum, wo) => {
    return sum + parseFloat(wo.totalCost || "0");
  }, 0);

  // Calculate additional items subtotal
  const additionalItemsSubtotal = additionalItems.reduce((sum, item) => {
    return sum + item.amount;
  }, 0);

  const subtotal = workOrdersSubtotal + additionalItemsSubtotal;
  const tax = form.watch("tax") || 0;
  const total = subtotal + tax;

  const addAdditionalItem = () => {
    setAdditionalItems([...additionalItems, {
      description: "",
      quantity: 1,
      rate: 0,
      amount: 0,
    }]);
  };

  const removeAdditionalItem = (index: number) => {
    setAdditionalItems(additionalItems.filter((_, i) => i !== index));
  };

  const updateAdditionalItem = (index: number, field: string, value: any) => {
    const updated = [...additionalItems];
    updated[index] = { ...updated[index], [field]: value };
    
    // Auto-calculate amount when quantity or rate changes
    if (field === "quantity" || field === "rate") {
      updated[index].amount = updated[index].quantity * updated[index].rate;
    }
    
    setAdditionalItems(updated);
  };

  const handleSubmit = (data: InvoiceFormData) => {
    onSubmit({
      ...data,
      ticketId: ticket?.id,
      additionalItems,
    });
  };

  if (!ticket) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Create Invoice for {ticket.ticketNumber}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Ticket Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Ticket Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Ticket:</span> {ticket.ticketNumber}
                  </div>
                  <div>
                    <span className="font-medium">Status:</span>{" "}
                    <Badge variant="outline">{ticket.status}</Badge>
                  </div>
                  <div className="col-span-2">
                    <span className="font-medium">Description:</span> {ticket.description}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Work Orders */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Work Orders</CardTitle>
              </CardHeader>
              <CardContent>
                {workOrders.length === 0 ? (
                  <p className="text-slate-500">No work orders found</p>
                ) : (
                  <div className="space-y-4">
                    {workOrders.map((wo, index) => (
                      <div key={wo.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium">Work Order #{wo.workOrderNumber}</h4>
                          <span className="font-semibold">${wo.totalCost}</span>
                        </div>
                        <p className="text-sm text-slate-600 mb-2">{wo.workDescription}</p>
                        
                        {wo.parts && (
                          <div className="text-xs text-slate-500">
                            <span className="font-medium">Parts:</span>{" "}
                            {(() => {
                              try {
                                const parts = wo.parts && wo.parts !== '[]' && wo.parts !== '' ? JSON.parse(wo.parts) : [];
                                return parts.map((part: any, i: number) => (
                                  <span key={i}>
                                    {part.name} (${part.cost} x {part.quantity})
                                    {i < parts.length - 1 ? ", " : ""}
                                  </span>
                                ));
                              } catch {
                                return <span className="text-slate-400">No parts</span>;
                              }
                            })()}
                          </div>
                        )}
                      </div>
                    ))}
                    <div className="flex justify-end pt-2 border-t">
                      <span className="font-semibold">
                        Work Orders Subtotal: ${workOrdersSubtotal.toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Additional Items */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  Additional Items
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addAdditionalItem}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {additionalItems.length === 0 ? (
                  <p className="text-slate-500">No additional items</p>
                ) : (
                  <div className="space-y-4">
                    {additionalItems.map((item, index) => (
                      <div key={index} className="grid grid-cols-12 gap-4 items-end">
                        <div className="col-span-5">
                          <label className="text-sm font-medium">Description</label>
                          <Input
                            value={item.description}
                            onChange={(e) => updateAdditionalItem(index, "description", e.target.value)}
                            placeholder="Item description"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="text-sm font-medium">Qty</label>
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateAdditionalItem(index, "quantity", parseInt(e.target.value) || 0)}
                            min="1"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="text-sm font-medium">Rate</label>
                          <Input
                            type="number"
                            step="0.01"
                            value={item.rate}
                            onChange={(e) => updateAdditionalItem(index, "rate", parseFloat(e.target.value) || 0)}
                            min="0"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="text-sm font-medium">Amount</label>
                          <Input
                            type="number"
                            step="0.01"
                            value={item.amount}
                            onChange={(e) => updateAdditionalItem(index, "amount", parseFloat(e.target.value) || 0)}
                            min="0"
                          />
                        </div>
                        <div className="col-span-1">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeAdditionalItem(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    <div className="flex justify-end pt-2 border-t">
                      <span className="font-semibold">
                        Additional Items: ${additionalItemsSubtotal.toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tax and Total */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Invoice Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="tax"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tax Amount ($)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-2 text-right">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax:</span>
                    <span>${tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-semibold border-t pt-2">
                    <span>Total:</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Additional notes for the invoice..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Creating..." : "Create Invoice"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}