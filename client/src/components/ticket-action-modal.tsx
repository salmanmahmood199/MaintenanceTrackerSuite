import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle, XCircle, Wrench, User } from "lucide-react";
import type { Ticket, MaintenanceVendor } from "@shared/schema";

interface TicketActionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticket: Ticket | null;
  action: "accept" | "reject" | null;
  vendors: Array<{ vendor: MaintenanceVendor; tier: string; isActive: boolean }>;
  onAccept: (ticketId: number, data: { maintenanceVendorId?: number; assigneeId?: number }) => void;
  onReject: (ticketId: number, rejectionReason: string) => void;
  isLoading: boolean;
}

export function TicketActionModal({
  open,
  onOpenChange,
  ticket,
  action,
  vendors,
  onAccept,
  onReject,
  isLoading
}: TicketActionModalProps) {
  const [selectedVendorId, setSelectedVendorId] = useState<string>("");
  const [rejectionReason, setRejectionReason] = useState("");

  const handleSubmit = () => {
    if (!ticket) return;

    if (action === "accept") {
      onAccept(ticket.id, {
        maintenanceVendorId: selectedVendorId ? parseInt(selectedVendorId) : undefined,
      });
    } else if (action === "reject") {
      if (!rejectionReason.trim()) return;
      onReject(ticket.id, rejectionReason);
    }

    // Reset form
    setSelectedVendorId("");
    setRejectionReason("");
  };

  const handleClose = () => {
    setSelectedVendorId("");
    setRejectionReason("");
    onOpenChange(false);
  };

  const activeVendors = vendors.filter(v => v.isActive);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {action === "accept" ? (
              <>
                <CheckCircle className="h-5 w-5 text-green-600" />
                Accept Ticket
              </>
            ) : (
              <>
                <XCircle className="h-5 w-5 text-red-600" />
                Reject Ticket
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        {ticket && (
          <div className="space-y-4">
            <div className="bg-slate-50 p-3 rounded-lg">
              <p className="font-medium text-slate-900">{ticket.title}</p>
              <p className="text-sm text-slate-600 mt-1">{ticket.ticketNumber}</p>
            </div>

            {action === "accept" && (
              <div className="space-y-3">
                <div>
                  <Label htmlFor="vendor-select" className="text-sm font-medium">
                    Assign to Vendor (Optional)
                  </Label>
                  <Select value={selectedVendorId} onValueChange={setSelectedVendorId}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select a vendor..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No vendor assigned</SelectItem>
                      {activeVendors.map(({ vendor, tier }) => (
                        <SelectItem key={vendor.id} value={vendor.id.toString()}>
                          <div className="flex items-center gap-2">
                            <Wrench className="h-4 w-4" />
                            <span>{vendor.name}</span>
                            <span className="text-xs text-slate-500">({tier})</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {activeVendors.length === 0 && (
                    <p className="text-sm text-slate-500 mt-1">
                      No active vendors available for assignment
                    </p>
                  )}
                </div>
              </div>
            )}

            {action === "reject" && (
              <div>
                <Label htmlFor="rejection-reason" className="text-sm font-medium">
                  Rejection Reason *
                </Label>
                <Textarea
                  id="rejection-reason"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Please provide a reason for rejecting this ticket..."
                  className="mt-1"
                  rows={3}
                />
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4">
              <Button variant="outline" onClick={handleClose} disabled={isLoading}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isLoading || (action === "reject" && !rejectionReason.trim())}
                className={action === "accept" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
              >
                {isLoading ? "Processing..." : action === "accept" ? "Accept Ticket" : "Reject Ticket"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}