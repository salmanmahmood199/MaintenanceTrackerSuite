import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Building, FileText, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Invoice } from "@shared/schema";

interface PaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: Invoice | null;
}

export function PaymentModal({ open, onOpenChange, invoice }: PaymentModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<string>("credit_card");
  const [paymentType, setPaymentType] = useState<string>("check");
  const [checkNumber, setCheckNumber] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const paymentMutation = useMutation({
    mutationFn: async (paymentData: {
      invoiceId: number;
      paymentMethod: string;
      paymentType?: string;
      checkNumber?: string;
    }) => {
      return apiRequest("POST", `/api/invoices/${paymentData.invoiceId}/pay`, paymentData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      onOpenChange(false);
      setPaymentMethod("credit_card");
      setPaymentType("check");
      setCheckNumber("");
      toast({
        title: "Payment Processed",
        description: "Invoice has been marked as paid successfully!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Payment Failed",
        description: error.message || "Failed to process payment",
        variant: "destructive",
      });
    },
  });

  const handlePayment = () => {
    if (!invoice) return;

    if (paymentMethod === "external" && paymentType === "check" && !checkNumber.trim()) {
      toast({
        title: "Check Number Required",
        description: "Please enter a check number for check payments",
        variant: "destructive",
      });
      return;
    }

    paymentMutation.mutate({
      invoiceId: invoice.id,
      paymentMethod,
      paymentType: paymentMethod === "external" ? paymentType : undefined,
      checkNumber: paymentMethod === "external" && paymentType === "check" ? checkNumber : undefined,
    });
  };

  if (!invoice) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Pay Invoice {invoice.invoiceNumber}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pb-4">
          {/* Invoice Summary */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Invoice Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Invoice Number:</span>
                <span className="font-mono">{invoice.invoiceNumber}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>${parseFloat(invoice.subtotal).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Tax:</span>
                <span>${parseFloat(invoice.tax).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-semibold pt-2 border-t">
                <span>Total Amount:</span>
                <span className="text-green-600">${parseFloat(invoice.total).toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Payment Method Selection */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Select Payment Method</Label>
            <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-3">
              {/* Credit Card Option */}
              <Card className={`cursor-pointer transition-all ${paymentMethod === "credit_card" ? "ring-2 ring-blue-500" : ""}`}>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem value="credit_card" id="credit_card" />
                    <CreditCard className="h-5 w-5 text-blue-600" />
                    <div className="flex-1">
                      <Label htmlFor="credit_card" className="text-base font-medium cursor-pointer">
                        Pay by Credit Card
                      </Label>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-sm text-muted-foreground">Secure card processing</p>
                        <Badge variant="secondary" className="text-xs">Coming Soon</Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* ACH Option */}
              <Card className={`cursor-pointer transition-all ${paymentMethod === "ach" ? "ring-2 ring-blue-500" : ""}`}>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem value="ach" id="ach" />
                    <Building className="h-5 w-5 text-green-600" />
                    <div className="flex-1">
                      <Label htmlFor="ach" className="text-base font-medium cursor-pointer">
                        Pay by ACH (Bank Transfer)
                      </Label>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-sm text-muted-foreground">Lower fees, 3-5 business days</p>
                        <Badge variant="secondary" className="text-xs">Coming Soon</Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* External Payment Option */}
              <Card className={`cursor-pointer transition-all ${paymentMethod === "external" ? "ring-2 ring-blue-500" : ""}`}>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem value="external" id="external" />
                    <FileText className="h-5 w-5 text-purple-600" />
                    <div className="flex-1">
                      <Label htmlFor="external" className="text-base font-medium cursor-pointer">
                        Pay Externally
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">Check, cash, or other payment method</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </RadioGroup>
          </div>

          {/* External Payment Details */}
          {paymentMethod === "external" && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">External Payment Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 max-h-[300px] overflow-y-auto">
                <div>
                  <Label className="text-sm font-medium">Payment Type</Label>
                  <RadioGroup value={paymentType} onValueChange={setPaymentType} className="mt-2">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="check" id="check" />
                      <Label htmlFor="check" className="cursor-pointer">Check</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="other" id="other" />
                      <Label htmlFor="other" className="cursor-pointer">Other</Label>
                    </div>
                  </RadioGroup>
                </div>

                {paymentType === "check" && (
                  <div>
                    <Label htmlFor="checkNumber" className="text-sm font-medium">Check Number</Label>
                    <Input
                      id="checkNumber"
                      type="text"
                      placeholder="Enter check number"
                      value={checkNumber}
                      onChange={(e) => setCheckNumber(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t bg-white dark:bg-gray-900 sticky bottom-0">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={handlePayment} 
              disabled={paymentMutation.isPending || (paymentMethod !== "external")}
              className="flex-1"
            >
              {paymentMutation.isPending ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Processing...
                </div>
              ) : paymentMethod === "external" ? (
                "Mark as Paid"
              ) : (
                "Coming Soon"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}