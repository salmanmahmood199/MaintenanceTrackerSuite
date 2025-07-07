import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, User, Hash, Wrench, CheckCircle, XCircle, Eye, ImageIcon, Clock, Calculator, MessageSquare, ChevronLeft, ChevronRight, X, Video } from "lucide-react";
import { format } from "date-fns";
import { formatDate, getPriorityColor, getStatusColor } from "@/lib/utils";
import { ProgressTracker } from "@/components/progress-tracker";
import { TicketComments } from "./ticket-comments";
import type { Ticket } from "@shared/schema";

interface TicketTableProps {
  tickets: Ticket[];
  onAccept?: (id: number) => void;
  onReject?: (id: number) => void;
  onComplete?: (id: number) => void;
  onConfirm?: (id: number) => void;
  onStart?: (id: number) => void;
  onViewWorkOrders?: (id: number) => void;
  onCreateInvoice?: (id: number) => void;
  onViewBids?: (ticket: Ticket) => void;
  showActions?: boolean;
  showTechnicianActions?: boolean;
  userRole?: string;
  userPermissions?: string[];
  userId?: number;
}

export function TicketTable({ 
  tickets, 
  onAccept, 
  onReject, 
  onComplete,
  onConfirm,
  onStart,
  onViewWorkOrders,
  onCreateInvoice,
  onViewBids,
  showActions = true,
  showTechnicianActions = false,
  userRole, 
  userPermissions,
  userId
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
    console.log("Opening progress tracker for ticket:", ticket.id);
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
              <TableHead>Timeline</TableHead>
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
                      <div className="flex gap-2">
                        <Badge className={statusColor}>
                          {ticket.status === "in-progress" ? "In Progress" : 
                           ticket.status === "pending_confirmation" ? "Pending Confirmation" :
                           ticket.status === "ready_for_billing" ? "Ready for Billing" :
                           ticket.status === "marketplace" ? "Marketplace" :
                           ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
                        </Badge>
                        {ticket.status === "marketplace" && onViewBids && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onViewBids(ticket)}
                            className="text-xs text-purple-600 border-purple-300 hover:bg-purple-50"
                          >
                            View Bids
                          </Button>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openProgressTracker(ticket)}
                        className="text-xs"
                      >
                        <Clock className="h-3 w-3 mr-1" />
                        View Timeline
                      </Button>
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
                          {ticket.images.length} file{ticket.images.length > 1 ? 's' : ''}
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
                        {/* Organization level: Accept/Reject for pending tickets */}
                        {showActions && ticket.status === "pending" && onAccept && onReject && (userRole === "org_admin" || userRole === "org_subadmin") && (
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
                        
                        {/* Vendor level: Accept/Reject for accepted tickets (assigned to vendor but not yet accepted by vendor) */}
                        {showActions && userRole === "maintenance_admin" && ticket.status === "accepted" && !ticket.assigneeId && onAccept && onReject && (
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
                        
                        {/* Vendor level: Assign technician for accepted tickets without assignee */}
                        {showActions && userRole === "maintenance_admin" && ticket.status === "accepted" && ticket.assigneeId && onAccept && (
                          <Button
                            onClick={() => onAccept?.(ticket.id)}
                            className="bg-blue-600 text-white hover:bg-blue-700"
                            size="sm"
                          >
                            <User className="h-4 w-4 mr-1" />
                            Reassign Technician
                          </Button>
                        )}
                        {ticket.status === "pending_confirmation" && onConfirm && (
                          <Button
                            onClick={() => onConfirm(ticket.id)}
                            className="bg-blue-600 text-white hover:bg-blue-700"
                            size="sm"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Confirm Completion
                          </Button>
                        )}
                        {ticket.status === "ready_for_billing" && onCreateInvoice && userRole === "maintenance_admin" && (
                          <Button
                            onClick={() => onCreateInvoice(ticket.id)}
                            className="bg-purple-600 text-white hover:bg-purple-700"
                            size="sm"
                          >
                            <Calculator className="h-4 w-4 mr-1" />
                            Create Invoice
                          </Button>
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
            <ScrollArea className="h-[70vh]">
              <Tabs defaultValue="details" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="comments">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Comments
                  </TabsTrigger>
                  <TabsTrigger value="work-orders">Work Orders</TabsTrigger>
                </TabsList>
                
                <TabsContent value="details" className="space-y-6 mt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <Hash className="h-5 w-5 text-slate-500" />
                        <span className="text-sm font-medium text-slate-600">Ticket Number</span>
                      </div>
                      <p className="text-lg font-mono">{selectedTicket.ticketNumber}</p>
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <Calendar className="h-5 w-5 text-slate-500" />
                        <span className="text-sm font-medium text-slate-600">Created</span>
                      </div>
                      <p className="text-lg">{format(new Date(selectedTicket.createdAt), 'PPp')}</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-2">{selectedTicket.title}</h3>
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
                      <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-800">
                          <strong>Rejection Reason:</strong> {selectedTicket.rejectionReason}
                        </p>
                      </div>
                    )}
                  </div>

                  <div>
                    <h4 className="text-lg font-semibold mb-2">Description</h4>
                    <div className="bg-slate-50 p-4 rounded-lg">
                      <p className="text-slate-700 whitespace-pre-wrap">{selectedTicket.description}</p>
                    </div>
                  </div>

                  {selectedTicket.images && selectedTicket.images.length > 0 && (
                    <div>
                      <h4 className="text-lg font-semibold mb-3">Media Files</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {selectedTicket.images.map((fileName, index) => {
                          const isVideo = fileName?.toLowerCase().includes('.mp4') ||
                                         fileName?.toLowerCase().includes('.mov') ||
                                         fileName?.toLowerCase().includes('.avi') ||
                                         fileName?.toLowerCase().includes('.webm');
                          
                          return isVideo ? (
                            <video
                              key={index}
                              src={`/uploads/${fileName}`}
                              className="w-full h-32 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                              controls={false}
                              muted
                              preload="metadata"
                              onClick={() => openImageViewer(selectedTicket, index)}
                            />
                          ) : (
                            <img
                              key={index}
                              src={`/uploads/${fileName}`}
                              alt={`Ticket media ${index + 1}`}
                              className="w-full h-32 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() => openImageViewer(selectedTicket, index)}
                            />
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <ProgressTracker ticketId={selectedTicket.id} />
                </TabsContent>

                <TabsContent value="comments" className="mt-6">
                  <TicketComments 
                    ticket={selectedTicket} 
                    userRole={userRole}
                    userId={userId}
                  />
                </TabsContent>

                <TabsContent value="work-orders" className="mt-6">
                  <div className="text-center py-8 text-slate-500">
                    <p>Work Orders functionality will be available soon.</p>
                  </div>
                </TabsContent>
              </Tabs>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

      {/* Image Viewer Modal */}
      <Dialog open={isImageViewerOpen} onOpenChange={closeImageViewer}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              Media {selectedImageIndex + 1} of {selectedTicket?.images?.length || 0}
            </DialogTitle>
          </DialogHeader>
          
          {selectedTicket && selectedTicket.images && (
            <div className="space-y-4">
              <div className="relative">
                {selectedTicket.images[selectedImageIndex]?.toLowerCase().includes('.mp4') ||
                 selectedTicket.images[selectedImageIndex]?.toLowerCase().includes('.mov') ||
                 selectedTicket.images[selectedImageIndex]?.toLowerCase().includes('.avi') ||
                 selectedTicket.images[selectedImageIndex]?.toLowerCase().includes('.webm') ? (
                  <video
                    src={selectedTicket.images[selectedImageIndex]}
                    controls
                    className="w-full max-h-[60vh] object-contain rounded-lg"
                  />
                ) : (
                  <img
                    src={selectedTicket.images[selectedImageIndex]}
                    alt={`Attachment ${selectedImageIndex + 1}`}
                    className="w-full max-h-[60vh] object-contain rounded-lg"
                  />
                )}
                
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
      {selectedTicket && (
        <ProgressTracker
          ticket={selectedTicket}
          open={isProgressTrackerOpen}
          onOpenChange={setIsProgressTrackerOpen}
          canUpdate={!!canAcceptTickets}
        />
      )}
    </>
  );
}