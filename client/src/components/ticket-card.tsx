import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, User, Hash, Wrench, CheckCircle, XCircle, Clock, Calculator, Eye } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { toZonedTime, format as formatTz } from "date-fns-tz";
import { formatDate, getPriorityColor, getStatusColor } from "@/lib/utils";
import type { Ticket } from "@shared/schema";

interface TicketCardProps {
  ticket: Ticket;
  onAccept?: (id: number) => void;
  onReject?: (id: number) => void;
  onComplete?: (id: number) => void;
  onStart?: (id: number) => void;
  onConfirm?: (id: number) => void;
  onViewWorkOrders?: (id: number) => void;
  onCreateInvoice?: (id: number) => void;
  onClick?: (ticket: Ticket) => void;
  onView?: (ticket: Ticket) => void;
  showActions?: boolean;
  showTechnicianActions?: boolean;
  userRole?: string;
  userPermissions?: string[];
  userId?: number;
}

export function TicketCard({ ticket, onAccept, onReject, onComplete, onStart, onConfirm, onViewWorkOrders, onCreateInvoice, showActions = true, showTechnicianActions = false, userRole, userPermissions, userId, onClick, onView }: TicketCardProps) {
  const priorityColor = getPriorityColor(ticket.priority);
  const statusColor = getStatusColor(ticket.status);
  
  // Check if user can accept tickets based on role or permissions
  const canAcceptTickets = userRole && (
    ["org_admin", "maintenance_admin"].includes(userRole) || 
    (userRole === "org_subadmin" && userPermissions?.includes("accept_ticket"))
  );

  // Check if maintenance admin is assigned to this ticket themselves
  const isMaintenanceAdminAssignedToSelf = userRole === "maintenance_admin" && ticket.assigneeId === userId;

  // Show technician actions if explicitly requested OR if maintenance admin assigned to themselves
  const shouldShowTechnicianActions = showTechnicianActions || isMaintenanceAdminAssignedToSelf;

  return (
    <Card 
      className="p-6 hover:shadow-md transition-shadow cursor-pointer" 
      onClick={() => onClick?.(ticket)}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <h3 className="text-lg font-semibold text-foreground">{ticket.title}</h3>
            <Badge variant="outline" className={`${priorityColor} border-current`}>
              {ticket.priority}
            </Badge>
            <Badge variant="outline" className={`${statusColor} border-current`}>
              {ticket.status}
            </Badge>
          </div>
          
          <p className="text-muted-foreground mb-4">{ticket.description}</p>
          
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Hash className="h-4 w-4" />
              <span>{ticket.ticketNumber}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>{formatTz(toZonedTime(new Date(ticket.createdAt), 'America/New_York'), "MMM dd, yyyy 'at' h:mm a zzz", { timeZone: 'America/New_York' })}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}</span>
            </div>
          </div>
          
          {ticket.images && ticket.images.length > 0 && (
            <div className="flex gap-2 mt-3">
              {ticket.images.map((image, index) => (
                <img
                  key={index}
                  src={image}
                  alt={`Ticket image ${index + 1}`}
                  className="w-16 h-16 object-cover rounded border"
                />
              ))}
            </div>
          )}
        </div>
        
        <div className="ml-6 flex flex-col gap-2">
          {shouldShowTechnicianActions && (
            <>
              {/* Always show View button for technicians */}
              {onView && (
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    onView(ticket);
                  }}
                  variant="outline"
                  size="sm"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </Button>
              )}
              {ticket.status === 'accepted' && onStart && (
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    onStart(ticket.id);
                  }}
                  className="bg-blue-600 hover:bg-blue-700"
                  size="sm"
                >
                  <Wrench className="h-4 w-4 mr-2" />
                  Start & Create Work Order
                </Button>
              )}
              {(ticket.status === 'in-progress' || ticket.status === 'return_needed') && onComplete && (
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    onComplete(ticket.id);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700"
                  size="sm"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Create Work Order
                </Button>
              )}
            </>
          )}
          
          {showActions && !shouldShowTechnicianActions && canAcceptTickets && (
            <>
              {/* Organization admin can accept pending/open tickets */}
              {(userRole === "org_admin" || userRole === "org_subadmin") && (ticket.status === 'pending' || ticket.status === 'open') && onAccept && (
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAccept(ticket.id);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700"
                  size="sm"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Accept
                </Button>
              )}
              {(userRole === "org_admin" || userRole === "org_subadmin") && (ticket.status === 'pending' || ticket.status === 'open') && onReject && (
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    onReject(ticket.id);
                  }}
                  variant="destructive"
                  size="sm"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </Button>
              )}
              
              {/* Vendor admin can accept/assign tickets in accepted status OR reassign when already assigned to themselves */}
              {userRole === "maintenance_admin" && (ticket.status === 'accepted' || isMaintenanceAdminAssignedToSelf) && onAccept && (
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAccept(ticket.id);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700"
                  size="sm"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {isMaintenanceAdminAssignedToSelf ? "Reassign Technician" : "Accept & Assign"}
                </Button>
              )}
              {userRole === "maintenance_admin" && ticket.status === 'accepted' && onReject && (
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    onReject(ticket.id);
                  }}
                  variant="destructive"
                  size="sm"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </Button>
              )}
              {ticket.status === 'pending_confirmation' && onConfirm && (
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    onConfirm(ticket.id);
                  }}
                  className="bg-blue-600 hover:bg-blue-700"
                  size="sm"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Confirm Completion
                </Button>
              )}
              {ticket.status === 'ready_for_billing' && onCreateInvoice && userRole === 'maintenance_admin' && (
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    onCreateInvoice(ticket.id);
                  }}
                  className="bg-purple-600 hover:bg-purple-700"
                  size="sm"
                >
                  <Calculator className="h-4 w-4 mr-2" />
                  Create Invoice
                </Button>
              )}
              {ticket.status === 'in-progress' && onComplete && (
                <Button
                  onClick={() => onComplete(ticket.id)}
                  className="bg-blue-600 hover:bg-blue-700"
                  size="sm"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Complete
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {ticket.rejectionReason && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <h4 className="text-sm font-medium text-red-900 mb-1">Rejection Reason</h4>
          <p className="text-sm text-red-700">{ticket.rejectionReason}</p>
        </div>
      )}
    </Card>
  );
}
