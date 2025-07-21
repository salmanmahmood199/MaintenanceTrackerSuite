import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, User, Hash, Wrench, CheckCircle, XCircle, Eye, ImageIcon, Clock, Calculator, MessageSquare, ChevronLeft, ChevronRight, X, Video, AlertTriangle, MoreHorizontal } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { formatDate, getPriorityColor, getStatusColor } from "@/lib/utils";
import { ProgressTrackerEmbedded } from "@/components/progress-tracker";
import { TicketComments } from "./ticket-comments";
import { WorkOrdersHistoryEmbedded } from "@/components/work-orders-history-embedded";
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
  onForceClose?: (id: number, reason: string) => void;
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
  onForceClose,
  showActions = true,
  showTechnicianActions = false,
  userRole, 
  userPermissions,
  userId
}: TicketTableProps) {
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
  const [showForceCloseDialog, setShowForceCloseDialog] = useState(false);
  const [forceCloseReason, setForceCloseReason] = useState("");
  const [forceCloseConfirmed, setForceCloseConfirmed] = useState(false);
  const [ticketToForceClose, setTicketToForceClose] = useState<number | null>(null);

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

  const handleForceClose = (ticketId: number) => {
    setTicketToForceClose(ticketId);
    setShowForceCloseDialog(true);
  };

  const confirmForceClose = () => {
    if (ticketToForceClose && forceCloseConfirmed && forceCloseReason.trim()) {
      onForceClose?.(ticketToForceClose, forceCloseReason);
      setShowForceCloseDialog(false);
      setForceCloseReason("");
      setForceCloseConfirmed(false);
      setTicketToForceClose(null);
    }
  };

  const cancelForceClose = () => {
    setShowForceCloseDialog(false);
    setForceCloseReason("");
    setForceCloseConfirmed(false);
    setTicketToForceClose(null);
  };

  const openImageViewer = (ticket: Ticket, imageIndex: number = 0) => {
    setSelectedTicket(ticket);
    setSelectedImageIndex(imageIndex);
    setIsImageViewerOpen(true);
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
      <div className="bg-card rounded-lg shadow overflow-hidden border border-border">
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200 dark:scrollbar-thumb-gray-600 dark:scrollbar-track-gray-800">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="whitespace-nowrap">Ticket #</TableHead>
                <TableHead className="whitespace-nowrap">Title</TableHead>
                <TableHead className="whitespace-nowrap">Priority</TableHead>
                <TableHead className="whitespace-nowrap">Status</TableHead>
                <TableHead className="whitespace-nowrap">Timeline</TableHead>
                <TableHead className="whitespace-nowrap">Created</TableHead>
                <TableHead className="whitespace-nowrap">Images</TableHead>
                <TableHead className="whitespace-nowrap">Actions</TableHead>
              </TableRow>
            </TableHeader>
          <TableBody>
            {tickets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No tickets found
                </TableCell>
              </TableRow>
            ) : (
              tickets.map((ticket) => {
                const priorityColor = getPriorityColor(ticket.priority);
                const statusColor = getStatusColor(ticket.status);
                
                return (
                  <TableRow key={ticket.id} className="hover:bg-muted/50">
                    <TableCell className="font-mono text-sm">
                      {ticket.ticketNumber || `TKT-${ticket.id.toString().padStart(3, '0')}`}
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs">
                        <p className="font-medium text-foreground truncate">{ticket.title}</p>
                        <p className="text-sm text-muted-foreground truncate">{ticket.description}</p>
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
                           ticket.status === "force_closed" ? "Closed" :
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
                        onClick={() => openTicketDetails(ticket)}
                        className="text-xs h-8 px-2"
                      >
                        <Clock className="h-3 w-3 mr-1" />
                        Timeline
                      </Button>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(ticket.createdAt)}
                    </TableCell>
                    <TableCell>
                      {ticket.images && ticket.images.length > 0 ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openImageViewer(ticket, 0)}
                          className="text-blue-500 h-8 px-2 text-xs"
                        >
                          <ImageIcon className="h-3 w-3 mr-1" />
                          {ticket.images.length} file{ticket.images.length > 1 ? 's' : ''}
                        </Button>
                      ) : (
                        <span className="text-muted-foreground text-sm">None</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 whitespace-nowrap">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openTicketDetails(ticket)}
                          className="h-8 px-2 text-xs"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </Button>
                        
                        {/* Actions Dropdown */}
                        {showActions && (
                          <DropdownMenu modal={false}>
                            <DropdownMenuTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-8 px-2 relative z-10"
                                aria-label="More actions"
                              >
                                <MoreHorizontal className="h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent 
                              align="end" 
                              className="min-w-[160px] z-50"
                              sideOffset={4}
                              collisionPadding={8}
                            >
                              {/* Organization level: Accept/Reject for pending tickets */}
                              {ticket.status === "pending" && onAccept && onReject && (userRole === "org_admin" || userRole === "org_subadmin") && (
                                <>
                                  <DropdownMenuItem 
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      onAccept?.(ticket.id);
                                    }}
                                    className="cursor-pointer"
                                  >
                                    <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                                    Accept
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      onReject?.(ticket.id);
                                    }}
                                    className="cursor-pointer"
                                  >
                                    <XCircle className="h-4 w-4 mr-2 text-red-500" />
                                    Reject
                                  </DropdownMenuItem>
                                </>
                              )}
                              
                              {/* Vendor level: Accept/Reject for accepted tickets (assigned to vendor but not yet accepted by vendor) */}
                              {userRole === "maintenance_admin" && ticket.status === "accepted" && !ticket.assigneeId && onAccept && onReject && (
                                <>
                                  <DropdownMenuItem 
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      onAccept?.(ticket.id);
                                    }}
                                    className="cursor-pointer"
                                  >
                                    <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                                    Accept & Assign
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      onReject?.(ticket.id);
                                    }}
                                    className="cursor-pointer"
                                  >
                                    <XCircle className="h-4 w-4 mr-2 text-red-500" />
                                    Reject
                                  </DropdownMenuItem>
                                </>
                              )}
                              
                              {/* Vendor level: Reassign technician for accepted tickets with assignee */}
                              {userRole === "maintenance_admin" && ticket.status === "accepted" && ticket.assigneeId && onAccept && (
                                <DropdownMenuItem 
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    onAccept?.(ticket.id);
                                  }}
                                  className="cursor-pointer"
                                >
                                  <User className="h-4 w-4 mr-2 text-blue-500" />
                                  Reassign Technician
                                </DropdownMenuItem>
                              )}
                              
                              {/* Confirm completion */}
                              {ticket.status === "pending_confirmation" && onConfirm && (
                                <DropdownMenuItem 
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    onConfirm(ticket.id);
                                  }}
                                  className="cursor-pointer"
                                >
                                  <CheckCircle className="h-4 w-4 mr-2 text-blue-500" />
                                  Confirm Completion
                                </DropdownMenuItem>
                              )}
                              
                              {/* Create invoice */}
                              {ticket.status === "ready_for_billing" && onCreateInvoice && userRole === "maintenance_admin" && (
                                <DropdownMenuItem 
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    onCreateInvoice(ticket.id);
                                  }}
                                  className="cursor-pointer"
                                >
                                  <Calculator className="h-4 w-4 mr-2 text-purple-500" />
                                  Create Invoice
                                </DropdownMenuItem>
                              )}

                              {/* Force Close - Available for users with accept ticket permissions */}
                              {canAcceptTickets && ticket.status !== "billed" && ticket.status !== "rejected" && ticket.status !== "force_closed" && (
                                <DropdownMenuItem 
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleForceClose(ticket.id);
                                  }} 
                                  className="text-red-600 cursor-pointer"
                                >
                                  <AlertTriangle className="h-4 w-4 mr-2" />
                                  Force Close
                                </DropdownMenuItem>
                              )}
                              
                              {/* View bids for marketplace tickets */}
                              {ticket.status === "marketplace" && onViewBids && (
                                <DropdownMenuItem 
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    onViewBids(ticket);
                                  }}
                                  className="cursor-pointer"
                                >
                                  <Eye className="h-4 w-4 mr-2 text-purple-500" />
                                  View Bids
                                </DropdownMenuItem>
                              )}

                              {/* Technician actions */}
                              {userRole === "technician" && (
                                <>
                                  {ticket.status === "accepted" && onStart && (
                                    <DropdownMenuItem 
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        onStart(ticket.id);
                                      }}
                                      className="cursor-pointer"
                                    >
                                      <Wrench className="h-4 w-4 mr-2 text-blue-500" />
                                      Start Work
                                    </DropdownMenuItem>
                                  )}
                                  {(ticket.status === "in-progress" || ticket.status === "return_needed") && onComplete && (
                                    <DropdownMenuItem 
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        onComplete(ticket.id);
                                      }}
                                      className="cursor-pointer"
                                    >
                                      <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                                      Create Work Order
                                    </DropdownMenuItem>
                                  )}
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
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
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="comments">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Comments
                  </TabsTrigger>
                  <TabsTrigger value="progress">
                    <Calculator className="h-4 w-4 mr-2" />
                    Progress
                  </TabsTrigger>
                  <TabsTrigger value="work-orders">Work Orders</TabsTrigger>
                </TabsList>
                
                <TabsContent value="details" className="space-y-6 mt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <Hash className="h-5 w-5 text-muted-foreground" />
                        <span className="text-sm font-medium text-muted-foreground">Ticket Number</span>
                      </div>
                      <p className="text-lg font-mono">{selectedTicket.ticketNumber}</p>
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <Calendar className="h-5 w-5 text-muted-foreground" />
                        <span className="text-sm font-medium text-muted-foreground">Created</span>
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
                         selectedTicket.status === "pending_confirmation" ? "Pending Confirmation" :
                         selectedTicket.status === "ready_for_billing" ? "Ready for Billing" :
                         selectedTicket.status === "marketplace" ? "Marketplace" :
                         selectedTicket.status === "force_closed" ? "Closed" :
                         selectedTicket.status.charAt(0).toUpperCase() + selectedTicket.status.slice(1)}
                      </Badge>
                    </div>

                    {selectedTicket.rejectionReason && (
                      <div className="mt-3 p-3 bg-red-900/20 border border-red-700 rounded-lg">
                        <p className="text-sm text-red-300">
                          <strong>Rejection Reason:</strong> {selectedTicket.rejectionReason}
                        </p>
                      </div>
                    )}

                    {selectedTicket.status === "force_closed" && selectedTicket.forceCloseReason && (
                      <div className="mt-3 p-3 bg-muted border border-border rounded-lg">
                        <p className="text-sm text-foreground">
                          <strong>Force Close Reason:</strong> {selectedTicket.forceCloseReason}
                        </p>
                        {selectedTicket.forceClosedAt && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Closed on: {format(new Date(selectedTicket.forceClosedAt), 'PPp')}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  <div>
                    <h4 className="text-lg font-semibold mb-2">Description</h4>
                    <div className="bg-muted p-4 rounded-lg">
                      <p className="text-foreground whitespace-pre-wrap">{selectedTicket.description}</p>
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

                </TabsContent>

                <TabsContent value="comments" className="mt-6">
                  <TicketComments 
                    ticket={selectedTicket} 
                    userRole={userRole}
                    userId={userId}
                  />
                </TabsContent>

                <TabsContent value="progress" className="mt-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                      <Calculator className="h-5 w-5 text-blue-600" />
                      <h3 className="text-lg font-semibold">Ticket Journey Progress</h3>
                    </div>
                    <ProgressTrackerEmbedded 
                      ticket={selectedTicket} 
                      canUpdate={!!canAcceptTickets}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="work-orders" className="mt-6">
                  <WorkOrdersHistoryEmbedded 
                    ticketId={selectedTicket.id} 
                  />
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
                        index === selectedImageIndex ? 'bg-blue-600' : 'bg-muted'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Force Close Confirmation Dialog */}
      <Dialog open={showForceCloseDialog} onOpenChange={cancelForceClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Force Close Ticket
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-700">
                <strong>Warning:</strong> This action will permanently close the ticket and bypass all remaining workflow steps. This cannot be undone.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="forceCloseReason">Reason for Force Close (Required)</Label>
              <Textarea
                id="forceCloseReason"
                placeholder="Please provide a detailed reason for force closing this ticket..."
                value={forceCloseReason}
                onChange={(e) => setForceCloseReason(e.target.value)}
                className="min-h-[80px]"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="forceCloseConfirmation"
                checked={forceCloseConfirmed}
                onCheckedChange={(checked) => setForceCloseConfirmed(!!checked)}
              />
              <Label htmlFor="forceCloseConfirmation" className="text-sm">
                I understand this action is permanent and will close the ticket immediately
              </Label>
            </div>
          </div>

          <DialogFooter className="flex justify-between">
            <Button
              variant="outline"
              onClick={cancelForceClose}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmForceClose}
              disabled={!forceCloseConfirmed || !forceCloseReason.trim()}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Force Close Ticket
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}