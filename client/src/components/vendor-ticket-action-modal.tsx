import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Ticket, User } from "@shared/schema";

const acceptTicketSchema = z.object({
  assigneeId: z.string().optional(),
});

const rejectTicketSchema = z.object({
  rejectionReason: z.string().min(1, "Rejection reason is required"),
});

type AcceptTicketFormData = z.infer<typeof acceptTicketSchema>;
type RejectTicketFormData = z.infer<typeof rejectTicketSchema>;

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

  const acceptForm = useForm<AcceptTicketFormData>({
    resolver: zodResolver(acceptTicketSchema),
    defaultValues: {
      assigneeId: "",
    },
  });

  const rejectForm = useForm<RejectTicketFormData>({
    resolver: zodResolver(rejectTicketSchema),
    defaultValues: {
      rejectionReason: "",
    },
  });

  const handleAccept = (data: AcceptTicketFormData) => {
    if (ticket) {
      const assigneeId = selectedTechnician ? parseInt(selectedTechnician) : undefined;
      onAccept(ticket.id, assigneeId);
    }
  };

  const handleReject = (data: RejectTicketFormData) => {
    if (ticket) {
      onReject(ticket.id, data.rejectionReason);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {action === "accept" ? "Accept Ticket" : "Reject Ticket"}
          </DialogTitle>
        </DialogHeader>

        {ticket && (
          <div className="space-y-4">
            {/* Ticket Info */}
            <div className="bg-slate-50 p-4 rounded-lg">
              <h4 className="font-medium text-slate-900">{ticket.title}</h4>
              <p className="text-sm text-slate-600 mt-1">{ticket.description}</p>
              <div className="flex items-center gap-4 mt-2">
                <span className="text-xs text-slate-500">Priority: {ticket.priority}</span>
                <span className="text-xs text-slate-500">Ticket: {ticket.ticketNumber}</span>
              </div>
            </div>

            {action === "accept" ? (
              <form onSubmit={acceptForm.handleSubmit(handleAccept)} className="space-y-4">
                <div>
                  <Label htmlFor="technician">Assign Technician (Optional)</Label>
                  <Select onValueChange={setSelectedTechnician} value={selectedTechnician}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a technician or leave unassigned" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No assignment (assign later)</SelectItem>
                      {technicians.map((tech) => (
                        <SelectItem key={tech.id} value={tech.id.toString()}>
                          {tech.firstName} {tech.lastName} ({tech.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-slate-500 mt-1">
                    You can assign a technician now or leave unassigned and assign later
                  </p>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Accepting..." : "Accept Ticket"}
                  </Button>
                </div>
              </form>
            ) : (
              <form onSubmit={rejectForm.handleSubmit(handleReject)} className="space-y-4">
                <div>
                  <Label htmlFor="rejectionReason">Rejection Reason</Label>
                  <Textarea
                    id="rejectionReason"
                    {...rejectForm.register("rejectionReason")}
                    placeholder="Please provide a reason for rejecting this ticket..."
                    rows={3}
                  />
                  {rejectForm.formState.errors.rejectionReason && (
                    <p className="text-sm text-red-500 mt-1">
                      {rejectForm.formState.errors.rejectionReason.message}
                    </p>
                  )}
                </div>

                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" variant="destructive" disabled={isLoading}>
                    {isLoading ? "Rejecting..." : "Reject Ticket"}
                  </Button>
                </div>
              </form>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}