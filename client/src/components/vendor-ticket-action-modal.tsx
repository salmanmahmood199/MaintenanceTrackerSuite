import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Calendar, Clock, User2, AlertCircle, CheckCircle, Eye } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import type { Ticket, User } from "@shared/schema";
import { TechnicianCalendarWidget } from "./technician-calendar-widget";

interface VendorTicketActionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticket: Ticket | null;
  action: "accept" | "reject" | null;
  technicians: User[];
  onAccept: (ticketId: number, acceptData: {
    assigneeId?: number;
    estimatedStartDate?: string;
    estimatedEndDate?: string;
    estimatedDuration?: number;
    scheduledStartTime?: string;
    scheduledEndTime?: string;
    etaNotes?: string;
  }) => void;
  onReject: (ticketId: number, rejectionReason: string) => void;
  isLoading: boolean;
  currentUser?: { id: number; firstName: string; lastName: string; email: string };
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
  currentUser,
}: VendorTicketActionModalProps) {
  const [selectedTechnician, setSelectedTechnician] = useState<string>("");
  const [rejectionReason, setRejectionReason] = useState("");
  
  // ETA related state
  const [etaNotes, setEtaNotes] = useState("");
  const [selectedETA, setSelectedETA] = useState<{
    date: Date;
    startTime: string;
    endTime: string;
    duration: number;
  } | null>(null);
  const [availabilityCheck, setAvailabilityCheck] = useState<{ available: boolean; checked: boolean }>({ available: true, checked: false });

  // Get technician availability when technician is selected
  const { data: technicianSchedule, isLoading: isLoadingSchedule } = useQuery<any>({
    queryKey: ['/api/technicians', selectedTechnician, 'availability'],
    queryFn: async () => {
      if (!selectedTechnician) return null;
      const response = await fetch(`/api/technicians/${selectedTechnician}/availability`);
      if (!response.ok) throw new Error('Failed to fetch technician availability');
      return response.json();
    },
    enabled: !!selectedTechnician && open
  });

  // Check availability when ETA is selected
  useEffect(() => {
    const checkAvailability = async () => {
      if (selectedTechnician && selectedETA) {
        try {
          const startDateTime = new Date(selectedETA.date);
          const [startHours, startMinutes] = selectedETA.startTime.split(':');
          startDateTime.setHours(parseInt(startHours), parseInt(startMinutes), 0, 0);
          
          const endDateTime = new Date(selectedETA.date);
          const [endHours, endMinutes] = selectedETA.endTime.split(':');
          endDateTime.setHours(parseInt(endHours), parseInt(endMinutes), 0, 0);
          
          const response = await fetch(`/api/technicians/${selectedTechnician}/check-availability`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              startTime: startDateTime.toISOString(),
              endTime: endDateTime.toISOString()
            })
          });
          const data = await response.json();
          setAvailabilityCheck({ available: data.available, checked: true });
        } catch (error) {
          console.error('Error checking availability:', error);
          setAvailabilityCheck({ available: false, checked: true });
        }
      } else {
        setAvailabilityCheck({ available: true, checked: false });
      }
    };

    checkAvailability();
  }, [selectedTechnician, selectedETA]);

  const handleSubmit = () => {
    if (!ticket) return;

    if (action === "accept") {
      const acceptData: any = {};
      
      if (selectedTechnician) {
        // Require scheduling when assigning a technician
        if (!selectedETA) {
          return; // Don't proceed without scheduling
        }
        acceptData.assigneeId = parseInt(selectedTechnician);
      }
      
      if (selectedETA) {
        // Format the selected date and time for the backend
        const startDateTime = new Date(selectedETA.date);
        const [startHours, startMinutes] = selectedETA.startTime.split(':');
        startDateTime.setHours(parseInt(startHours), parseInt(startMinutes), 0, 0);
        
        const endDateTime = new Date(selectedETA.date);
        const [endHours, endMinutes] = selectedETA.endTime.split(':');
        endDateTime.setHours(parseInt(endHours), parseInt(endMinutes), 0, 0);
        
        // Format without timezone conversion to preserve local time
        const formatDateTimeWithoutTimezone = (date: Date) => {
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          const hours = String(date.getHours()).padStart(2, '0');
          const minutes = String(date.getMinutes()).padStart(2, '0');
          const seconds = String(date.getSeconds()).padStart(2, '0');
          return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
        };
        
        acceptData.scheduledStartTime = formatDateTimeWithoutTimezone(startDateTime);
        acceptData.scheduledEndTime = formatDateTimeWithoutTimezone(endDateTime);
        acceptData.estimatedDuration = selectedETA.duration;
        acceptData.estimatedStartDate = format(selectedETA.date, 'yyyy-MM-dd');
        acceptData.estimatedEndDate = format(selectedETA.date, 'yyyy-MM-dd');
      }
      
      if (etaNotes) {
        acceptData.etaNotes = etaNotes;
      }
      
      onAccept(ticket.id, acceptData);
    } else if (action === "reject") {
      if (!rejectionReason.trim()) return;
      onReject(ticket.id, rejectionReason);
    }
  };

  const handleClose = () => {
    setSelectedTechnician("");
    setRejectionReason("");
    setEtaNotes("");
    setSelectedETA(null);
    setAvailabilityCheck({ available: true, checked: false });
    onOpenChange(false);
  };

  if (!ticket || !action) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {action === "accept" ? "Accept Ticket" : "Reject Ticket"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium text-gray-900 dark:text-gray-100">Ticket</Label>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {ticket.ticketNumber} - {ticket.title}
            </p>
          </div>

          {action === "accept" && (
            <>
              <div>
                <Label htmlFor="technician-select" className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Assign Technician (Optional)
                </Label>
                <Select value={selectedTechnician} onValueChange={setSelectedTechnician}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a technician" />
                  </SelectTrigger>
                  <SelectContent>
                    {currentUser && (
                      <SelectItem value={currentUser.id.toString()}>
                        <div className="flex items-center gap-2">
                          <User2 className="h-4 w-4 text-blue-600" />
                          <span>Assign to Myself</span>
                          <span className="text-xs text-slate-500">({currentUser.firstName} {currentUser.lastName})</span>
                        </div>
                      </SelectItem>
                    )}
                    {technicians.map((tech) => (
                      <SelectItem key={tech.id} value={tech.id.toString()}>
                        <div className="flex items-center gap-2">
                          <User2 className="h-4 w-4" />
                          {tech.firstName} {tech.lastName} ({tech.email})
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {isLoadingSchedule && selectedTechnician && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Loading technician schedule...</p>
                )}
              </div>

              {/* Calendar ETA Selection */}
              {selectedTechnician && (
                <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-blue-600" />
                      <Label className="text-sm font-medium text-gray-900 dark:text-gray-100">Schedule Work</Label>
                    </div>
                    <TechnicianCalendarWidget
                      technicianId={parseInt(selectedTechnician)}
                      technicianName={technicians.find(t => t.id.toString() === selectedTechnician)?.firstName || 'Technician'}
                      onTimeSlotSelect={(slot) => {
                        setSelectedETA(slot);
                      }}
                      trigger={
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Calendar
                        </Button>
                      }
                    />
                  </div>
                  
                  {selectedETA && (
                    <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded">
                      <div className="text-sm">
                        <p className="font-medium text-blue-900 dark:text-blue-100">
                          Scheduled: {format(selectedETA.date, 'EEEE, MMMM d, yyyy')}
                        </p>
                        <p className="text-blue-700 dark:text-blue-300">
                          Time: {selectedETA.startTime} - {selectedETA.endTime} ({selectedETA.duration >= 1 ? `${selectedETA.duration} hour${selectedETA.duration > 1 ? 's' : ''}` : `${selectedETA.duration * 60} min`})
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {!selectedETA && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                      Click "View Calendar" to select a time slot for this technician
                    </p>
                  )}
                </div>
              )}

              {/* Availability Check */}
              {selectedTechnician && selectedETA && availabilityCheck.checked && (
                <div className={`flex items-center gap-2 p-3 rounded border ${
                  availabilityCheck.available 
                    ? 'bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-200 border-green-200 dark:border-green-700' 
                    : 'bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200 border-red-200 dark:border-red-700'
                }`}>
                  {availabilityCheck.available ? (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      Technician is available during this time
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-4 w-4" />
                      Technician has a conflict during this time
                    </>
                  )}
                </div>
              )}

              {/* Notes Section */}
              <div>
                <Label htmlFor="eta-notes" className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Additional Notes (Optional)
                </Label>
                <Textarea
                  id="eta-notes"
                  placeholder="Any special requirements, concerns, or notes about this job..."
                  value={etaNotes}
                  onChange={(e) => setEtaNotes(e.target.value)}
                  className="min-h-[80px] mt-1"
                />
              </div>
            </>
          )}

          {action === "reject" && (
            <div>
              <Label htmlFor="rejection-reason" className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Rejection Reason *
              </Label>
              <Textarea
                id="rejection-reason"
                placeholder="Please provide a reason for rejection..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={handleClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={
                isLoading || 
                (action === "reject" && !rejectionReason.trim()) ||
                (action === "accept" && availabilityCheck.checked && !availabilityCheck.available) ||
                (action === "accept" && selectedTechnician && !selectedETA)
              }
              className={action === "accept" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
            >
              {isLoading ? "Processing..." : action === "accept" ? "Accept Ticket" : "Reject Ticket"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}