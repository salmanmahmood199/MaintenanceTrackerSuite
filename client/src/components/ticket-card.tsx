import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, User, Hash, Wrench, CheckCircle } from "lucide-react";
import { formatDate, getPriorityColor, getStatusColor } from "@/lib/utils";
import type { Ticket } from "@shared/schema";

interface TicketCardProps {
  ticket: Ticket;
  onAccept: (id: number) => void;
  onComplete: (id: number) => void;
}

export function TicketCard({ ticket, onAccept, onComplete }: TicketCardProps) {
  const priorityColor = getPriorityColor(ticket.priority);
  const statusColor = getStatusColor(ticket.status);

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
              <span>{ticket.reporter}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Hash className="h-4 w-4" />
              <span>TKT-{ticket.id.toString().padStart(3, '0')}</span>
            </div>
            {ticket.assignee && (
              <div className="flex items-center space-x-1">
                <Wrench className="h-4 w-4" />
                <span>Assigned to {ticket.assignee}</span>
              </div>
            )}
            {ticket.status === "completed" && (
              <div className="flex items-center space-x-1">
                <CheckCircle className="h-4 w-4" />
                <span>Completed by {ticket.assignee}</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-3 ml-6">
          {ticket.images && ticket.images.length > 0 && (
            <img
              src={ticket.images[0]}
              alt="Ticket attachment"
              className="w-20 h-16 rounded-lg object-cover"
            />
          )}
          
          {ticket.status === "open" && (
            <Button
              onClick={() => onAccept(ticket.id)}
              className="bg-primary text-white hover:bg-blue-700"
            >
              Accept
            </Button>
          )}
          
          {ticket.status === "in-progress" && (
            <Button
              onClick={() => onComplete(ticket.id)}
              className="bg-emerald-600 text-white hover:bg-emerald-700"
            >
              Complete
            </Button>
          )}
          
          {ticket.status === "completed" && (
            <div className="flex items-center text-emerald-600">
              <CheckCircle className="h-6 w-6" />
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
