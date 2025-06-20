import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle, XCircle, MessageSquare } from "lucide-react";
import type { Ticket } from "@shared/schema";

interface ConfirmCompletionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (confirmed: boolean, feedback?: string) => void;
  isLoading: boolean;
  ticket: Ticket | null;
}

export function ConfirmCompletionModal({ 
  open, 
  onOpenChange, 
  onConfirm, 
  isLoading, 
  ticket 
}: ConfirmCompletionModalProps) {
  const [feedback, setFeedback] = useState("");
  const [confirmationType, setConfirmationType] = useState<"confirm" | "reject" | null>(null);

  const handleSubmit = () => {
    if (confirmationType !== null) {
      onConfirm(confirmationType === "confirm", feedback);
      setFeedback("");
      setConfirmationType(null);
    }
  };

  const handleCancel = () => {
    setFeedback("");
    setConfirmationType(null);
    onOpenChange(false);
  };

  if (!ticket) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Confirm Work Completion
          </DialogTitle>
          <DialogDescription>
            The technician has completed work on ticket <span className="font-medium">{ticket.ticketNumber}</span>. 
            Please review the work and confirm if it meets your requirements.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Ticket Details */}
          <div className="bg-slate-50 p-4 rounded-lg">
            <h4 className="font-medium text-slate-900 mb-2">Ticket Details</h4>
            <div className="space-y-1 text-sm">
              <div><span className="font-medium">Title:</span> {ticket.title}</div>
              <div><span className="font-medium">Description:</span> {ticket.description}</div>
              <div><span className="font-medium">Priority:</span> 
                <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                  ticket.priority === "high" ? "bg-red-100 text-red-800" :
                  ticket.priority === "medium" ? "bg-yellow-100 text-yellow-800" :
                  "bg-green-100 text-green-800"
                }`}>
                  {ticket.priority?.toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          {/* Feedback Section */}
          <div className="space-y-2">
            <Label htmlFor="feedback">
              {confirmationType === "reject" ? "Please explain why the work is not satisfactory:" : "Additional feedback (optional):"}
            </Label>
            <Textarea
              id="feedback"
              placeholder={
                confirmationType === "reject" 
                  ? "Describe what needs to be corrected or redone..."
                  : "Any additional comments about the completed work..."
              }
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              onClick={() => setConfirmationType("confirm")}
              variant={confirmationType === "confirm" ? "default" : "outline"}
              className={`flex-1 ${
                confirmationType === "confirm" 
                  ? "bg-green-600 hover:bg-green-700" 
                  : "hover:bg-green-50 hover:text-green-700 hover:border-green-300"
              }`}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Confirm Work Completed
            </Button>
            
            <Button
              onClick={() => setConfirmationType("reject")}
              variant={confirmationType === "reject" ? "destructive" : "outline"}
              className={`flex-1 ${
                confirmationType === "reject" 
                  ? "" 
                  : "hover:bg-red-50 hover:text-red-700 hover:border-red-300"
              }`}
            >
              <XCircle className="w-4 h-4 mr-2" />
              Needs More Work
            </Button>
          </div>

          {/* Submit/Cancel */}
          {confirmationType && (
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isLoading || (confirmationType === "reject" && !feedback.trim())}
                className={
                  confirmationType === "confirm" 
                    ? "bg-green-600 hover:bg-green-700" 
                    : "bg-red-600 hover:bg-red-700"
                }
              >
                {isLoading ? "Processing..." : 
                 confirmationType === "confirm" ? "Confirm Completion" : "Request More Work"}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}