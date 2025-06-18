import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Hash, User, Wrench, CheckCircle, ImageIcon, X, History } from "lucide-react";
import { WorkOrdersHistory } from "@/components/work-orders-history";
import { format as formatTz, toZonedTime } from "date-fns-tz";
import { formatDistanceToNow } from "date-fns";
import { getPriorityColor, getStatusColor } from "@/lib/utils";
import type { Ticket } from "@shared/schema";
import { useState } from "react";

interface TechnicianTicketDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticket: Ticket | null;
  onStart?: (id: number) => void;
  onCreateWorkOrder?: (id: number) => void;
}

export function TechnicianTicketDetailsModal({
  open,
  onOpenChange,
  ticket,
  onStart,
  onCreateWorkOrder,
}: TechnicianTicketDetailsModalProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [showWorkOrdersHistory, setShowWorkOrdersHistory] = useState(false);

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
        <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
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
            <div className="bg-slate-50 p-4 rounded-lg space-y-3">
              <div>
                <h4 className="font-medium text-slate-900 mb-2">Description</h4>
                <p className="text-slate-700">{ticket.description}</p>
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-600">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  <div>
                    <div className="font-medium">Created</div>
                    <div>
                      {formatTz(toZonedTime(new Date(ticket.createdAt), 'America/New_York'), "MMM dd, yyyy 'at' h:mm a zzz", { timeZone: 'America/New_York' })}
                    </div>
                    <div className="text-xs text-slate-500">
                      {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}
                    </div>
                  </div>
                </div>

                {ticket.updatedAt !== ticket.createdAt && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    <div>
                      <div className="font-medium">Last Updated</div>
                      <div>
                        {formatTz(toZonedTime(new Date(ticket.updatedAt), 'America/New_York'), "MMM dd, yyyy 'at' h:mm a zzz", { timeZone: 'America/New_York' })}
                      </div>
                      <div className="text-xs text-slate-500">
                        {formatDistanceToNow(new Date(ticket.updatedAt), { addSuffix: true })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Images */}
            {ticket.images && ticket.images.length > 0 && (
              <div>
                <h4 className="font-medium text-slate-900 mb-3">Photos ({ticket.images.length})</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {ticket.images.map((image, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={image}
                        alt={`Photo ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border-2 border-slate-200 cursor-pointer hover:border-blue-400 transition-colors"
                        onClick={() => showImageViewer(index)}
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity rounded-lg flex items-center justify-center">
                        <ImageIcon className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-between items-center pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setShowWorkOrdersHistory(true)}
                className="flex items-center gap-2"
              >
                <History className="h-4 w-4" />
                View Work Orders History
              </Button>
              
              <div className="flex gap-3">
                {ticket.status === 'accepted' && onStart && (
                  <Button
                    onClick={() => onStart(ticket.id)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Wrench className="h-4 w-4 mr-2" />
                    Start Work
                  </Button>
                )}
                {(ticket.status === 'in-progress' || ticket.status === 'return_needed') && onCreateWorkOrder && (
                  <Button
                    onClick={() => onCreateWorkOrder(ticket.id)}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Create Work Order
                  </Button>
                )}
              </div>
            </div>
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
                alt={`Photo ${selectedImageIndex + 1}`}
                className="w-full h-auto max-h-[90vh] object-contain"
              />
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-70 text-white px-3 py-1 rounded-lg text-sm">
                {selectedImageIndex + 1} of {ticket.images.length}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Work Orders History Modal */}
      <WorkOrdersHistory
        open={showWorkOrdersHistory}
        onOpenChange={setShowWorkOrdersHistory}
        ticketId={ticket?.id || null}
      />
    </>
  );
}