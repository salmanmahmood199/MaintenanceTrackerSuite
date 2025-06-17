import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Calendar, User, Hash, Wrench, CheckCircle, XCircle, Eye, ImageIcon, Clock } from "lucide-react";
import { formatDate, getPriorityColor, getStatusColor } from "@/lib/utils";
import { ProgressTracker } from "@/components/progress-tracker";
import type { Ticket } from "@shared/schema";

interface TicketTableProps {
  tickets: Ticket[];
  onAccept?: (id: number) => void;
  onReject?: (id: number) => void;
  onComplete?: (id: number) => void;
  onUpdateProgress?: (ticketId: number, progress: number, stage: string) => void;
  showActions?: boolean;
  userRole?: string;
  userPermissions?: string[];
}

export function TicketTable({ 
  tickets, 
  onAccept, 
  onReject, 
  onComplete, 
  onUpdateProgress,
  showActions = true, 
  userRole, 
  userPermissions 
}: TicketTableProps) {
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
  const [isProgressTrackerOpen, setIsProgressTrackerOpen] = useState(false);

  // Check if user can accept tickets based on role or permissions
  const canAcceptTickets = userRole && (
    ["org_admin", "maintenance_admin"].includes(userRole) || 
    (userRole === "org_subadmin" && userPermissions?.includes("accept_ticket"))
  );

  const openTicketDetails = (ticket: Ticket) => {
    setSelectedTicket(ticket);
  };

  const closeTicketDetails = () => {
    setSelectedTicket(null);
  };

  const openImageViewer = (ticket: Ticket, imageIndex: number = 0) => {
    setSelectedTicket(ticket);
    setSelectedImageIndex(imageIndex);
    setIsImageViewerOpen(true);
  };

  const openProgressTracker = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setIsProgressTrackerOpen(true);
  };

  const closeImageViewer = () => {
    setIsImageViewerOpen(false);
    setSelectedImageIndex(0);
  };

  const nextImage = () => {
    if (selectedTicket && selectedTicket.images) {
      setSelectedImageIndex((prev) => 
        prev < selectedTicket.images!.length - 1 ? prev + 1 : 0
      );
    }
  };

  const prevImage = () => {
    if (selectedTicket && selectedTicket.images) {
      setSelectedImageIndex((prev) => 
        prev > 0 ? prev - 1 : selectedTicket.images!.length - 1
      );
    }
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ticket #</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Progress</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Images</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tickets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-slate-500">
                  No tickets found
                </TableCell>
              </TableRow>
            ) : (
              tickets.map((ticket) => {
                const priorityColor = getPriorityColor(ticket.priority);
                const statusColor = getStatusColor(ticket.status);
                
                return (
                  <TableRow key={ticket.id} className="hover:bg-slate-50">
                    <TableCell className="font-mono text-sm">
                      {ticket.ticketNumber || `TKT-${ticket.id.toString().padStart(3, '0')}`}
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs">
                        <p className="font-medium text-slate-900 truncate">{ticket.title}</p>
                        <p className="text-sm text-slate-500 truncate">{ticket.description}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={priorityColor}>
                        {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColor}>
                        {ticket.status === "in-progress" ? "In Progress" : 
                         ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1 min-w-[120px]">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-600">
                            {ticket.progressStage || "submitted"}
                          </span>
                          <span className="font-medium">{ticket.progress || 0}%</span>
                        </div>
                        <Progress 
                          value={ticket.progress || 0} 
                          className="h-2 cursor-pointer"
                          onClick={() => openProgressTracker(ticket)}
                        />
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">
                      {formatDate(ticket.createdAt)}
                    </TableCell>
                    <TableCell>
                      {ticket.images && ticket.images.length > 0 ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openImageViewer(ticket, 0)}
                          className="text-blue-600"
                        >
                          <ImageIcon className="h-4 w-4 mr-1" />
                          {ticket.images.length}
                        </Button>
                      ) : (
                        <span className="text-slate-400 text-sm">None</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openTicketDetails(ticket)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        {showActions && canAcceptTickets && ticket.status === "pending" && (
                          <>
                            <Button
                              onClick={() => onAccept?.(ticket.id)}
                              className="bg-green-600 text-white hover:bg-green-700"
                              size="sm"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Accept
                            </Button>
                            <Button
                              onClick={() => onReject?.(ticket.id)}
                              variant="outline"
                              className="border-red-300 text-red-600 hover:bg-red-50"
                              size="sm"
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </>
                        )}
                        {showActions && canAcceptTickets && (ticket.status === "accepted" || ticket.status === "in-progress") && (
                          <Button
                            onClick={() => onComplete?.(ticket.id)}
                            className="bg-blue-600 text-white hover:bg-blue-700"
                            size="sm"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Complete
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Ticket Details Modal */}
      <Dialog open={!!selectedTicket && !isImageViewerOpen} onOpenChange={closeTicketDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Hash className="h-5 w-5" />
              {selectedTicket?.ticketNumber || `TKT-${selectedTicket?.id.toString().padStart(3, '0')}`}
            </DialogTitle>
          </DialogHeader>
          
          {selectedTicket && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">{selectedTicket.title}</h3>
                <p className="text-slate-600">{selectedTicket.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  <span className="text-slate-600">Created {formatDate(selectedTicket.createdAt)}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-slate-400" />
                  <span className="text-slate-600">Reporter ID: {selectedTicket.reporterId}</span>
                </div>
                {selectedTicket.maintenanceVendorId && (
                  <div className="flex items-center space-x-2">
                    <Wrench className="h-4 w-4 text-slate-400" />
                    <span className="text-slate-600">Vendor ID: {selectedTicket.maintenanceVendorId}</span>
                  </div>
                )}
                {selectedTicket.assigneeId && (
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-slate-400" />
                    <span className="text-slate-600">Assigned to: {selectedTicket.assigneeId}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-3">
                <Badge className={getPriorityColor(selectedTicket.priority)}>
                  {selectedTicket.priority.charAt(0).toUpperCase() + selectedTicket.priority.slice(1)} Priority
                </Badge>
                <Badge className={getStatusColor(selectedTicket.status)}>
                  {selectedTicket.status === "in-progress" ? "In Progress" : 
                   selectedTicket.status.charAt(0).toUpperCase() + selectedTicket.status.slice(1)}
                </Badge>
              </div>

              {selectedTicket.rejectionReason && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800">
                    <strong>Rejection Reason:</strong> {selectedTicket.rejectionReason}
                  </p>
                </div>
              )}

              {selectedTicket.images && selectedTicket.images.length > 0 && (
                <div>
                  <h4 className="font-medium text-slate-900 mb-3">Attachments ({selectedTicket.images.length})</h4>
                  <div className="grid grid-cols-4 gap-3">
                    {selectedTicket.images.map((image, index) => (
                      <img
                        key={index}
                        src={image}
                        alt={`Attachment ${index + 1}`}
                        className="w-full h-20 object-cover rounded-lg border border-slate-200 cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => openImageViewer(selectedTicket, index)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Image Viewer Modal */}
      <Dialog open={isImageViewerOpen} onOpenChange={closeImageViewer}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              Image {selectedImageIndex + 1} of {selectedTicket?.images?.length || 0}
            </DialogTitle>
          </DialogHeader>
          
          {selectedTicket && selectedTicket.images && (
            <div className="space-y-4">
              <div className="relative">
                <img
                  src={selectedTicket.images[selectedImageIndex]}
                  alt={`Attachment ${selectedImageIndex + 1}`}
                  className="w-full max-h-[60vh] object-contain rounded-lg"
                />
                
                {selectedTicket.images.length > 1 && (
                  <>
                    <Button
                      onClick={prevImage}
                      className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 text-white hover:bg-black/70"
                      size="sm"
                    >
                      ←
                    </Button>
                    <Button
                      onClick={nextImage}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 text-white hover:bg-black/70"
                      size="sm"
                    >
                      →
                    </Button>
                  </>
                )}
              </div>
              
              {selectedTicket.images.length > 1 && (
                <div className="flex justify-center space-x-2">
                  {selectedTicket.images.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImageIndex(index)}
                      className={`w-3 h-3 rounded-full ${
                        index === selectedImageIndex ? 'bg-blue-600' : 'bg-slate-300'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Progress Tracker Modal */}
      <ProgressTracker
        ticket={selectedTicket!}
        open={isProgressTrackerOpen}
        onOpenChange={setIsProgressTrackerOpen}
        onUpdateProgress={onUpdateProgress}
        canUpdate={canAcceptTickets}
      />
    </>
  );
}