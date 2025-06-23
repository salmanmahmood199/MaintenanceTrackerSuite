import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle, XCircle, Wrench, User, DollarSign } from "lucide-react";
import type { Ticket, MaintenanceVendor } from "@shared/schema";

interface TicketActionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticket: Ticket | null;
  action: "accept" | "reject" | null;
  vendors: Array<{ vendor: MaintenanceVendor; tier: string; isActive: boolean }>;
  onAccept: (ticketId: number, data: { maintenanceVendorId?: number; assigneeId?: number; marketplace?: boolean }) => void;
  onReject: (ticketId: number, rejectionReason: string) => void;
  isLoading: boolean;
  userRole?: string;
  userPermissions?: string[];
  userVendorTiers?: string[];
}

export function TicketActionModal({
  open,
  onOpenChange,
  ticket,
  action,
  vendors,
  onAccept,
  onReject,
  isLoading,
  userRole,
  userPermissions,
  userVendorTiers
}: TicketActionModalProps) {
  const [selectedVendorId, setSelectedVendorId] = useState<string>("");
  const [rejectionReason, setRejectionReason] = useState("");

  // Debug logging
  console.log("TicketActionModal - User role:", userRole);
  console.log("TicketActionModal - User permissions:", userPermissions);
  console.log("TicketActionModal - User vendor tiers:", userVendorTiers);
  console.log("TicketActionModal - Available vendors:", vendors);

  const handleSubmit = () => {
    if (!ticket) return;

    if (action === "accept") {
      if (selectedVendorId === "marketplace") {
        onAccept(ticket.id, { marketplace: true });
      } else {
        onAccept(ticket.id, {
          maintenanceVendorId: selectedVendorId && selectedVendorId !== "none" ? parseInt(selectedVendorId) : undefined,
        });
      }
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

  // Filter vendors based on user role and tier access
  const availableVendors = vendors.filter(v => {
    if (!v.isActive) return false;
    
    // Root and org admins can see all active vendors
    if (userRole === "root" || userRole === "org_admin") return true;
    
    // Sub-admins with accept_ticket permission can see vendors based on their tier permissions
    if (userRole === "org_subadmin" && userPermissions?.includes("accept_ticket")) {
      // Check if user has access to this vendor tier
      return userVendorTiers?.includes(v.tier);
    }
    
    // Maintenance admins can see all vendors assigned to their organization
    if (userRole === "maintenance_admin") return true;
    
    return false;
  });

  // Check if user has marketplace access
  const hasMarketplaceAccess = userRole === "root" || userRole === "org_admin" || 
    (userRole === "org_subadmin" && userVendorTiers?.includes("marketplace"));

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
                      <SelectItem value="none">No vendor assigned</SelectItem>
                      {availableVendors.map(({ vendor, tier }) => (
                        <SelectItem key={vendor.id} value={vendor.id.toString()}>
                          <div className="flex items-center gap-2">
                            <Wrench className="h-4 w-4" />
                            <span>{vendor.name}</span>
                            <span className="text-xs text-slate-500">({tier})</span>
                          </div>
                        </SelectItem>
                      ))}
                      {hasMarketplaceAccess && (
                        <SelectItem value="marketplace">
                          <div className="flex items-center gap-2">
                            <span>🏪 Marketplace (Open Bidding)</span>
                          </div>
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  {availableVendors.length === 0 && (
                    <p className="text-sm text-slate-500 mt-1">
                      No active vendors available for assignment
                    </p>
                  )}
                </div>
                
                {selectedVendorId === "marketplace" && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-800">
                      <strong>Marketplace Assignment:</strong> This ticket will be visible to all vendors with marketplace access. 
                      They can submit bids, and you can choose the best offer.
                    </p>
                  </div>
                )}
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