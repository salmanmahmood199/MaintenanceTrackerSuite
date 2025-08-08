import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle, XCircle, Wrench, User, DollarSign, Calendar, Clock, Eye } from "lucide-react";
import { format } from "date-fns";
import { TechnicianCalendarWidget } from "./technician-calendar-widget";
import type { Ticket, MaintenanceVendor } from "@shared/schema";

interface TicketActionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticket: Ticket | null;
  action: "accept" | "reject" | null;
  vendors: Array<{ vendor: MaintenanceVendor; tier: string; isActive: boolean }>;
  technicians?: Array<{ id: number; firstName: string; lastName: string; email: string }>;
  onAccept: (ticketId: number, data: {
    maintenanceVendorId?: number;
    assigneeId?: number;
    marketplace?: boolean;
    scheduledStartTime?: string;
    scheduledEndTime?: string;
    estimatedDuration?: number;
  }) => void;
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
  technicians = [],
  onAccept,
  onReject,
  isLoading,
  userRole,
  userPermissions,
  userVendorTiers
}: TicketActionModalProps) {
  const [selectedVendorId, setSelectedVendorId] = useState<string>("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [selectedSchedule, setSelectedSchedule] = useState<{
    date: Date;
    startTime: string;
    endTime: string;
    duration: number;
  } | null>(null);



  const handleSubmit = () => {
    if (!ticket) return;

    if (action === "accept") {
      if (selectedVendorId === "marketplace") {
        onAccept(ticket.id, { marketplace: true });
      } else if (selectedVendorId.startsWith("tech_")) {
        // Handle technician assignment for maintenance admin
        const technicianId = parseInt(selectedVendorId.replace("tech_", ""));
        const acceptData: any = {
          assigneeId: technicianId,
        };
        
        // Include scheduling data if available
        if (selectedSchedule) {
          const scheduledStart = new Date(selectedSchedule.date);
          const [startHour, startMinute] = selectedSchedule.startTime.split(':').map(Number);
          scheduledStart.setHours(startHour, startMinute, 0, 0);
          
          const scheduledEnd = new Date(selectedSchedule.date);
          const [endHour, endMinute] = selectedSchedule.endTime.split(':').map(Number);
          scheduledEnd.setHours(endHour, endMinute, 0, 0);
          
          acceptData.scheduledStartTime = scheduledStart.toISOString();
          acceptData.scheduledEndTime = scheduledEnd.toISOString();
          acceptData.estimatedDuration = selectedSchedule.duration;
        }
        
        onAccept(ticket.id, acceptData);
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
    setSelectedSchedule(null);
  };

  const handleClose = () => {
    setSelectedVendorId("");
    setRejectionReason("");
    setSelectedSchedule(null);
    onOpenChange(false);
  };

  // Filter vendors based on user role and tier access
  const availableVendors = vendors?.filter(v => {
    if (!v.isActive) return false;
    
    // Root and org admins can see all active vendors
    if (userRole === "root" || userRole === "org_admin") return true;
    
    // Sub-admins with accept_ticket permission can see vendors based on their tier permissions
    if (userRole === "org_subadmin" && userPermissions?.includes("accept_ticket")) {
      // Check if user has access to this vendor tier
      // If userVendorTiers is null/undefined, allow all basic tiers for backwards compatibility
      if (!userVendorTiers || userVendorTiers.length === 0) {
        return ["tier_1", "tier_2", "tier_3"].includes(v.tier);
      }
      return userVendorTiers.includes(v.tier);
    }
    
    // Maintenance admins can see all vendors assigned to their organization
    if (userRole === "maintenance_admin") return true;
    
    return false;
  });

  // Check if user has marketplace access - only based on user's assigned vendor tiers
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
                    {userRole === "maintenance_admin" ? "Assign to Technician (Optional)" : "Assign to Vendor (Optional)"}
                  </Label>
                  <Select value={selectedVendorId} onValueChange={setSelectedVendorId}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder={userRole === "maintenance_admin" ? "Select a technician..." : "Select a vendor..."} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">
                        {userRole === "maintenance_admin" ? "No technician assigned" : "No vendor assigned"}
                      </SelectItem>
                      
                      {userRole === "maintenance_admin" ? (
                        // Show technicians for maintenance admin
                        technicians.map((technician) => (
                          <SelectItem key={technician.id} value={`tech_${technician.id}`}>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              <span>{technician.firstName} {technician.lastName}</span>
                              <span className="text-xs text-slate-500">({technician.email})</span>
                            </div>
                          </SelectItem>
                        ))
                      ) : (
                        // Show vendors for org users
                        <>
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
                                <DollarSign className="h-4 w-4" />
                                <span>Marketplace (Open Bidding)</span>
                              </div>
                            </SelectItem>
                          )}
                        </>
                      )}
                    </SelectContent>
                  </Select>
                  {userRole !== "maintenance_admin" && availableVendors.length === 0 && (
                    <p className="text-sm text-slate-500 mt-1">
                      No active vendors available for assignment
                    </p>
                  )}
                  {userRole === "maintenance_admin" && technicians.length === 0 && (
                    <p className="text-sm text-slate-500 mt-1">
                      No technicians available for assignment
                    </p>
                  )}
                </div>
                
                {/* Calendar scheduling for technician assignment */}
                {userRole === "maintenance_admin" && selectedVendorId.startsWith("tech_") && (
                  <div className="space-y-3 pt-3 border-t">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-blue-600" />
                      <Label className="text-sm font-medium text-gray-900 dark:text-gray-100">Schedule Work (Optional)</Label>
                    </div>
                    
                    <TechnicianCalendarWidget
                      technicianId={parseInt(selectedVendorId.replace("tech_", ""))}
                      technicianName={technicians.find(t => t.id.toString() === selectedVendorId.replace("tech_", ""))?.firstName || 'Technician'}
                      onTimeSlotSelect={(slot) => {
                        setSelectedSchedule(slot);
                      }}
                      trigger={
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="w-full"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Technician Calendar
                        </Button>
                      }
                    />
                    
                    {selectedSchedule && (
                      <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded">
                        <div className="text-sm">
                          <p className="font-medium text-blue-900 dark:text-blue-100">
                            Scheduled: {format(selectedSchedule.date, 'EEEE, MMMM d, yyyy')}
                          </p>
                          <p className="text-blue-700 dark:text-blue-300">
                            Time: {selectedSchedule.startTime} - {selectedSchedule.endTime} ({selectedSchedule.duration >= 1 ? `${selectedSchedule.duration} hour${selectedSchedule.duration > 1 ? 's' : ''}` : `${selectedSchedule.duration * 60} min`})
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedSchedule(null)}
                          className="mt-2 text-xs"
                        >
                          Clear Schedule
                        </Button>
                      </div>
                    )}
                    
                    {!selectedSchedule && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Click "View Technician Calendar" to schedule a specific time slot, or skip to assign without scheduling.
                      </p>
                    )}
                  </div>
                )}
                
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