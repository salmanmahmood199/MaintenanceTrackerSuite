import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Hash, User, Wrench, CheckCircle, XCircle, ImageIcon, X } from "lucide-react";
import { format as formatTz, toZonedTime } from "date-fns-tz";
import { formatDistanceToNow } from "date-fns";
import { getPriorityColor, getStatusColor } from "@/lib/utils";
import type { Ticket } from "@shared/schema";
import { useState } from "react";

interface VendorTicketDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticket: Ticket | null;
  onAccept?: (id: number) => void;
  onReject?: (id: number) => void;
  onComplete?: (id: number) => void;
  canAccept?: boolean;
}

export function VendorTicketDetailsModal({
  open,
  onOpenChange,
  ticket,
  onAccept,
  onReject,
  onComplete,
  canAccept = true,
}: VendorTicketDetailsModalProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);

  if (!ticket) return null;

  const priorityColor = getPriorityColor(ticket.priority);
  const statusColor = getStatusColor(ticket.status);

  const showImageViewer = (index: number) => {
    setSelectedImageIndex(index);
  };

  const closeImageViewer = () => {
    setSelectedImageIndex(null);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <span>{ticket.title}</span>
              <Badge variant="outline" className={`${priorityColor} border-current`}>
                {ticket.priority}
              </Badge>
              <Badge variant="outline" className={`${statusColor} border-current`}>
                {ticket.status}
              </Badge>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Ticket Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium text-slate-900 mb-2">Description</h4>
                  <p className="text-slate-600 bg-slate-50 p-3 rounded-lg">{ticket.description}</p>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-slate-500">
                  <div className="flex items-center gap-1">
                    <Hash className="h-4 w-4" />
                    <span>{ticket.ticketNumber}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    <span>Reporter: {ticket.reporterId}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <h4 className="font-medium text-slate-900 mb-2">Timeline</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-slate-400" />
                      <span className="text-slate-600">
                        Created: {formatTz(toZonedTime(new Date(ticket.createdAt), 'America/New_York'), "MMM dd, yyyy 'at' h:mm a zzz", { timeZone: 'America/New_York' })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-slate-400" />
                      <span className="text-slate-600">
                        Updated: {formatDistanceToNow(new Date(ticket.updatedAt), { addSuffix: true })}
                      </span>
                    </div>
                    {ticket.assigneeId && (
                      <div className="flex items-center gap-2">
                        <Wrench className="h-4 w-4 text-slate-400" />
                        <span className="text-slate-600">Assigned to: {ticket.assigneeId}</span>
                      </div>
                    )}
                  </div>
                </div>

                {ticket.rejectionReason && (
                  <div>
                    <h4 className="font-medium text-red-900 mb-2">Rejection Reason</h4>
                    <p className="text-red-700 bg-red-50 p-3 rounded-lg border border-red-200">
                      {ticket.rejectionReason}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Images */}
            {ticket.images && ticket.images.length > 0 && (
              <div>
                <h4 className="font-medium text-slate-900 mb-3">Attachments ({ticket.images.length})</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {ticket.images.map((image, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={image}
                        alt={`Ticket attachment ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border-2 border-slate-200 cursor-pointer hover:border-blue-400 transition-colors"
                        onClick={() => showImageViewer(index)}
                        onError={(e) => {
                          console.error('Failed to load image:', image);
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-opacity rounded-lg flex items-center justify-center">
                        <ImageIcon className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            {canAccept && (
              <div className="flex justify-end gap-3 pt-4 border-t">
                {(ticket.status === 'pending' || ticket.status === 'open' || ticket.status === 'accepted') && (
                  <>
                    <Button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onAccept?.(ticket.id);
                      }}
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Accept & Assign
                    </Button>
                    <Button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onReject?.(ticket.id);
                      }}
                      variant="destructive"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject Ticket
                    </Button>
                  </>
                )}
                {ticket.status === 'in-progress' && onComplete && (
                  <Button
                    onClick={() => onComplete(ticket.id)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Mark Complete
                  </Button>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Image Viewer Modal */}
      {selectedImageIndex !== null && ticket.images && (
        <Dialog open={true} onOpenChange={closeImageViewer}>
          <DialogContent className="max-w-6xl max-h-[95vh] p-0">
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 z-10 bg-black bg-opacity-50 hover:bg-opacity-70 text-white"
                onClick={closeImageViewer}
              >
                <X className="h-4 w-4" />
              </Button>
              <img
                src={ticket.images[selectedImageIndex]}
                alt={`Ticket attachment ${selectedImageIndex + 1}`}
                className="w-full h-auto max-h-[90vh] object-contain"
                onError={(e) => {
                  console.error('Failed to load full image:', ticket.images![selectedImageIndex]);
                }}
              />
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-70 text-white px-3 py-1 rounded-lg text-sm">
                {selectedImageIndex + 1} of {ticket.images.length}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}