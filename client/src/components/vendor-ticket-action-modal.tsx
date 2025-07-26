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
}: VendorTicketActionModalProps) {
  const [selectedTechnician, setSelectedTechnician] = useState<string>("");
  const [rejectionReason, setRejectionReason] = useState("");
  
  // ETA related state
  const [estimatedStartDate, setEstimatedStartDate] = useState("");
  const [estimatedEndDate, setEstimatedEndDate] = useState("");
  const [estimatedDuration, setEstimatedDuration] = useState("");
  const [scheduledStartTime, setScheduledStartTime] = useState("");
  const [scheduledEndTime, setScheduledEndTime] = useState("");
  const [etaNotes, setEtaNotes] = useState("");
  const [showSchedule, setShowSchedule] = useState(false);
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

  // Check availability when scheduled time changes
  useEffect(() => {
    const checkAvailability = async () => {
      if (selectedTechnician && scheduledStartTime && scheduledEndTime) {
        try {
          const response = await fetch(`/api/technicians/${selectedTechnician}/check-availability`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              startTime: scheduledStartTime,
              endTime: scheduledEndTime
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
  }, [selectedTechnician, scheduledStartTime, scheduledEndTime]);

  const handleSubmit = () => {
    if (!ticket) return;

    if (action === "accept") {
      const acceptData = {
        assigneeId: selectedTechnician ? parseInt(selectedTechnician) : undefined,
        estimatedStartDate: estimatedStartDate || undefined,
        estimatedEndDate: estimatedEndDate || undefined,
        estimatedDuration: estimatedDuration ? parseInt(estimatedDuration) : undefined,
        scheduledStartTime: scheduledStartTime || undefined,
        scheduledEndTime: scheduledEndTime || undefined,
        etaNotes: etaNotes || undefined,
      };
      onAccept(ticket.id, acceptData);
    } else if (action === "reject") {
      if (!rejectionReason.trim()) return;
      onReject(ticket.id, rejectionReason);
    }
  };

  const handleClose = () => {
    setSelectedTechnician("");
    setRejectionReason("");
    setEstimatedStartDate("");
    setEstimatedEndDate("");
    setEstimatedDuration("");
    setScheduledStartTime("");
    setScheduledEndTime("");
    setEtaNotes("");
    setShowSchedule(false);
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
            <Label className="text-sm font-medium">Ticket</Label>
            <p className="text-sm text-slate-600">
              {ticket.ticketNumber} - {ticket.title}
            </p>
          </div>

          {action === "accept" && (
            <>
              <div>
                <Label htmlFor="technician-select" className="text-sm font-medium">
                  Assign Technician (Optional)
                </Label>
                <Select value={selectedTechnician} onValueChange={setSelectedTechnician}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a technician" />
                  </SelectTrigger>
                  <SelectContent>
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
                  <p className="text-xs text-slate-500 mt-1">Loading technician schedule...</p>
                )}
              </div>

              {/* ETA Estimation Section */}
              <div className="border rounded-lg p-4 bg-slate-50">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  <Label className="text-sm font-medium">Work Estimates</Label>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="estimated-start" className="text-xs font-medium text-slate-600">
                      Estimated Start Date
                    </Label>
                    <Input
                      id="estimated-start"
                      type="date"
                      value={estimatedStartDate}
                      onChange={(e) => setEstimatedStartDate(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="estimated-end" className="text-xs font-medium text-slate-600">
                      Estimated Completion Date
                    </Label>
                    <Input
                      id="estimated-end"
                      type="date"
                      value={estimatedEndDate}
                      onChange={(e) => setEstimatedEndDate(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="mt-3">
                  <Label htmlFor="duration" className="text-xs font-medium text-slate-600">
                    Estimated Duration (hours)
                  </Label>
                  <Input
                    id="duration"
                    type="number"
                    placeholder="e.g., 2"
                    value={estimatedDuration}
                    onChange={(e) => setEstimatedDuration(e.target.value)}
                    className="mt-1"
                    min="0.5"
                    step="0.5"
                  />
                </div>
              </div>

              {/* Scheduled Time Section */}
              {selectedTechnician && (
                <div className="border rounded-lg p-4 bg-blue-50">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-blue-600" />
                      <Label className="text-sm font-medium">Schedule Technician</Label>
                    </div>
                    <div className="flex gap-2">
                      <TechnicianCalendarWidget
                        technicianId={parseInt(selectedTechnician)}
                        technicianName={technicians.find(t => t.id.toString() === selectedTechnician)?.firstName || 'Technician'}
                        onDateSelect={(date) => {
                          // Set the date part for scheduled start time
                          const dateStr = format(date, 'yyyy-MM-dd');
                          if (scheduledStartTime) {
                            const timeStr = scheduledStartTime.split('T')[1] || '09:00';
                            setScheduledStartTime(`${dateStr}T${timeStr}`);
                          } else {
                            setScheduledStartTime(`${dateStr}T09:00`);
                          }
                          if (scheduledEndTime) {
                            const timeStr = scheduledEndTime.split('T')[1] || '17:00';
                            setScheduledEndTime(`${dateStr}T${timeStr}`);
                          } else {
                            setScheduledEndTime(`${dateStr}T17:00`);
                          }
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
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowSchedule(!showSchedule)}
                      >
                        {showSchedule ? "Hide" : "Show"} Schedule
                      </Button>
                    </div>
                  </div>
                  
                  {showSchedule && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="scheduled-start" className="text-xs font-medium text-slate-600">
                            Scheduled Start Time
                          </Label>
                          <Input
                            id="scheduled-start"
                            type="datetime-local"
                            value={scheduledStartTime}
                            onChange={(e) => setScheduledStartTime(e.target.value)}
                            className="mt-1"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="scheduled-end" className="text-xs font-medium text-slate-600">
                            Scheduled End Time
                          </Label>
                          <Input
                            id="scheduled-end"
                            type="datetime-local"
                            value={scheduledEndTime}
                            onChange={(e) => setScheduledEndTime(e.target.value)}
                            className="mt-1"
                          />
                        </div>
                      </div>

                      {/* Availability Check */}
                      {availabilityCheck.checked && (
                        <div className={`flex items-center gap-2 p-2 rounded text-sm ${
                          availabilityCheck.available 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
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

                      {/* Technician Schedule Display */}
                      {technicianSchedule && technicianSchedule.length > 0 && (
                        <div className="mt-3">
                          <Label className="text-xs font-medium text-slate-600">Current Schedule</Label>
                          <div className="mt-1 space-y-1 max-h-32 overflow-y-auto">
                            {technicianSchedule.slice(0, 5).map((item: any, index: number) => (
                              <div key={index} className="text-xs p-2 bg-white rounded border">
                                {item.title} - {format(new Date(item.startTime), 'MMM dd, h:mm a')} to {format(new Date(item.endTime), 'h:mm a')}
                              </div>
                            ))}
                            {technicianSchedule.length > 5 && (
                              <p className="text-xs text-slate-500">+ {technicianSchedule.length - 5} more items</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Notes Section */}
              <div>
                <Label htmlFor="eta-notes" className="text-sm font-medium">
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
              <Label htmlFor="rejection-reason" className="text-sm font-medium">
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
                (action === "accept" && availabilityCheck.checked && !availabilityCheck.available)
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