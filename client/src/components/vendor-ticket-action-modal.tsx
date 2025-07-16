import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { Ticket, User } from "@shared/schema";

interface VendorTicketActionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticket: Ticket | null;
  action: "accept" | "reject" | null;
  technicians: User[];
  onAccept: (ticketId: number, assigneeId?: number) => void;
  onReject: (ticketId: number, rejectionReason: string) => void;
  isLoading: boolean;
}

export function VendorTicketActionModal({
  open,
  onOpenChange,
  ticket,
  action,
  technicians,
  onAccept,
  onReject,
  isLoading,
}: VendorTicketActionModalProps) {
  const [selectedTechnician, setSelectedTechnician] = useState<string>("");
  const [rejectionReason, setRejectionReason] = useState("");

  const handleSubmit = () => {
    if (!ticket) return;

    if (action === "accept") {
      const assigneeId = selectedTechnician ? parseInt(selectedTechnician) : undefined;
      onAccept(ticket.id, assigneeId);
    } else if (action === "reject") {
      if (!rejectionReason.trim()) return;
      onReject(ticket.id, rejectionReason);
    }
  };

  const handleClose = () => {
    setSelectedTechnician("");
    setRejectionReason("");
    onOpenChange(false);
  };

  if (!ticket || !action) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {action === "accept" ? "Accept Ticket" : "Reject Ticket"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium">Ticket</Label>
            <p className="text-sm text-slate-600">
              {ticket.ticketNumber} - {ticket.title}
            </p>
          </div>

          {action === "accept" && (
            <div>
              <Label htmlFor="technician-select" className="text-sm font-medium">
                Assign Technician (Optional)
              </Label>
              <Select value={selectedTechnician} onValueChange={setSelectedTechnician}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a technician" />
                </SelectTrigger>
                <SelectContent>
                  {technicians.map((tech) => (
                    <SelectItem key={tech.id} value={tech.id.toString()}>
                      {tech.firstName} {tech.lastName} ({tech.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {action === "reject" && (
            <div>
              <Label htmlFor="rejection-reason" className="text-sm font-medium">
                Rejection Reason *
              </Label>
              <Textarea
                id="rejection-reason"
                placeholder="Please provide a reason for rejection..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={handleClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isLoading || (action === "reject" && !rejectionReason.trim())}
              className={action === "accept" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
            >
              {isLoading ? "Processing..." : action === "accept" ? "Accept" : "Reject"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}