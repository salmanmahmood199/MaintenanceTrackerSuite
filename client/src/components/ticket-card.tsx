import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, User, Hash, Wrench, CheckCircle, XCircle, Clock } from "lucide-react";
import { formatDate, getPriorityColor, getStatusColor } from "@/lib/utils";
import type { Ticket } from "@shared/schema";

interface TicketCardProps {
  ticket: Ticket;
  onAccept?: (id: number) => void;
  onReject?: (id: number) => void;
  onComplete?: (id: number) => void;
  showActions?: boolean;
  userRole?: string;
  userPermissions?: string[];
}

export function TicketCard({ ticket, onAccept, onReject, onComplete, showActions = true, userRole, userPermissions }: TicketCardProps) {
  const priorityColor = getPriorityColor(ticket.priority);
  const statusColor = getStatusColor(ticket.status);
  
  // Check if user can accept tickets based on role or permissions
  const canAcceptTickets = userRole && (
    ["org_admin", "maintenance_admin"].includes(userRole) || 
    (userRole === "org_subadmin" && userPermissions?.includes("accept_ticket"))
  );

  return (
    <Card className="p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-3">
            <h3 className="text-lg font-semibold text-slate-900">{ticket.title}</h3>
            <Badge className={priorityColor}>
              {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)} Priority
            </Badge>
            <Badge className={statusColor}>
              {ticket.status === "in-progress" ? "In Progress" : 
               ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
            </Badge>
          </div>
          
          <p className="text-slate-600 mb-4">{ticket.description}</p>
          
          <div className="flex items-center space-x-6 text-sm text-slate-500 flex-wrap">
            <div className="flex items-center space-x-1">
              <Calendar className="h-4 w-4" />
              <span>Created {formatDate(ticket.createdAt)}</span>
            </div>
            <div className="flex items-center space-x-1">
              <User className="h-4 w-4" />
              <span>Reporter ID: {ticket.reporterId}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Hash className="h-4 w-4" />
              <span>{ticket.ticketNumber || `TKT-${ticket.id.toString().padStart(3, '0')}`}</span>
            </div>
            {ticket.maintenanceVendorId && (
              <div className="flex items-center space-x-1">
                <Wrench className="h-4 w-4" />
                <span>Vendor ID: {ticket.maintenanceVendorId}</span>
              </div>
            )}
            {ticket.assigneeId && (
              <div className="flex items-center space-x-1">
                <User className="h-4 w-4" />
                <span>Assigned to: {ticket.assigneeId}</span>
              </div>
            )}
          </div>

          {ticket.rejectionReason && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">
                <strong>Rejection Reason:</strong> {ticket.rejectionReason}
              </p>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-3 ml-6">
          {ticket.images && ticket.images.length > 0 && (
            <img
              src={ticket.images[0]}
              alt="Ticket attachment"
              className="w-20 h-16 rounded-lg object-cover"
            />
          )}
          
          {showActions && canAcceptTickets && (
            <>
              {ticket.status === "pending" && (
                <div className="flex space-x-2">
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
                </div>
              )}
              
              {(ticket.status === "accepted" || ticket.status === "in-progress") && (
                <Button
                  onClick={() => onComplete?.(ticket.id)}
                  className="bg-blue-600 text-white hover:bg-blue-700"
                  size="sm"
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Complete
                </Button>
              )}
            </>
          )}
          
          {ticket.status === "completed" && (
            <div className="flex items-center text-emerald-600">
              <CheckCircle className="h-6 w-6" />
            </div>
          )}
          
          {ticket.status === "rejected" && (
            <div className="flex items-center text-red-600">
              <XCircle className="h-6 w-6" />
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
