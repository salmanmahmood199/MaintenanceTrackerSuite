import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, Clock, AlertTriangle, Wrench, FileText, User, Calendar, MessageSquare } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Ticket, TicketMilestone } from "@shared/schema";

interface ProgressTrackerProps {
  ticket: Ticket;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canUpdate?: boolean;
}

const milestoneTypes = [
  { value: "submitted", label: "Ticket Submitted", icon: FileText },
  { value: "reviewed", label: "Under Review", icon: Clock },
  { value: "assigned", label: "Assigned to Vendor", icon: Wrench },
  { value: "in_progress", label: "Work Started", icon: AlertTriangle },
  { value: "technician_assigned", label: "Technician Assigned", icon: User },
  { value: "on_site", label: "Technician On-Site", icon: Wrench },
  { value: "diagnosis_complete", label: "Diagnosis Complete", icon: CheckCircle },
  { value: "parts_ordered", label: "Parts Ordered", icon: Clock },
  { value: "repair_started", label: "Repair Started", icon: Wrench },
  { value: "testing", label: "Testing & Verification", icon: CheckCircle },
  { value: "completed", label: "Work Completed", icon: CheckCircle },
];

export function ProgressTracker({ 
  ticket, 
  open, 
  onOpenChange, 
  canUpdate = false 
}: ProgressTrackerProps) {
  if (!ticket) return null;
  
  const [selectedMilestone, setSelectedMilestone] = useState("");
  const [milestoneDescription, setMilestoneDescription] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch milestones for this ticket
  const { data: milestones = [], isLoading } = useQuery({
    queryKey: ["/api/tickets", ticket.id, "milestones"],
    enabled: open,
  });

  // Add milestone mutation
  const addMilestoneMutation = useMutation({
    mutationFn: async (data: { milestoneType: string; milestoneDescription?: string }) => {
      return apiRequest("POST", `/api/tickets/${ticket.id}/milestones`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tickets", ticket.id, "milestones"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
      setSelectedMilestone("");
      setMilestoneDescription("");
      toast({
        title: "Success",
        description: "Milestone added successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add milestone",
        variant: "destructive",
      });
    },
  });

  const handleAddMilestone = () => {
    if (!selectedMilestone) return;
    
    const milestoneType = milestoneTypes.find(m => m.value === selectedMilestone);
    if (milestoneType) {
      addMilestoneMutation.mutate({
        milestoneType: milestoneType.value,
        milestoneDescription: milestoneDescription || undefined,
      });
    }
  };

  const getMilestoneColor = (type: string) => {
    switch (type) {
      case "completed": return "bg-green-100 text-green-800 border-green-200";
      case "testing": case "diagnosis_complete": return "bg-blue-100 text-blue-800 border-blue-200";
      case "in_progress": case "repair_started": case "on_site": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "assigned": case "technician_assigned": return "bg-purple-100 text-purple-800 border-purple-200";
      case "reviewed": case "parts_ordered": return "bg-orange-100 text-orange-800 border-orange-200";
      default: return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Progress Tracker - {ticket.ticketNumber}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Milestone Timeline */}
          <div className="space-y-4">
            <h3 className="font-medium text-slate-900">Progress Timeline</h3>
            
            {isLoading ? (
              <div className="text-center py-4 text-slate-500">Loading milestones...</div>
            ) : milestones.length === 0 ? (
              <div className="text-center py-4 text-slate-500">No milestones yet</div>
            ) : (
              <div className="space-y-4">
                {milestones.map((milestone: any, index: number) => {
                  const milestoneType = milestoneTypes.find(m => m.value === milestone.milestoneType);
                  const Icon = milestoneType?.icon || FileText;

                  return (
                    <div key={milestone.id} className="flex items-start space-x-3 pb-4 border-b border-slate-100 last:border-b-0">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-600 mt-1">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium text-slate-900">
                            {milestone.milestoneTitle}
                          </h4>
                          <Badge className={getMilestoneColor(milestone.milestoneType)}>
                            {milestoneType?.label || milestone.milestoneType}
                          </Badge>
                        </div>
                        
                        {milestone.milestoneDescription && (
                          <p className="text-sm text-slate-600 mt-1">
                            {milestone.milestoneDescription}
                          </p>
                        )}
                        
                        <div className="flex items-center space-x-4 mt-2 text-xs text-slate-500">
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-3 w-3" />
                            <span>{formatDate(milestone.achievedAt)}</span>
                          </div>
                          {milestone.achievedByName && (
                            <div className="flex items-center space-x-1">
                              <User className="h-3 w-3" />
                              <span>{milestone.achievedByName}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Add New Milestone (if user can update) */}
          {canUpdate && (
            <div className="space-y-3 pt-4 border-t">
              <h3 className="font-medium text-slate-900">Add Milestone</h3>
              <div className="space-y-3">
                <Select value={selectedMilestone} onValueChange={setSelectedMilestone}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select milestone type..." />
                  </SelectTrigger>
                  <SelectContent>
                    {milestoneTypes.map((milestone) => (
                      <SelectItem key={milestone.value} value={milestone.value}>
                        <div className="flex items-center gap-2">
                          <milestone.icon className="h-4 w-4" />
                          <span>{milestone.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Textarea
                  placeholder="Add a description or note (optional)..."
                  value={milestoneDescription}
                  onChange={(e) => setMilestoneDescription(e.target.value)}
                  className="min-h-[80px]"
                />
                
                <Button 
                  onClick={handleAddMilestone} 
                  disabled={!selectedMilestone || addMilestoneMutation.isPending}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {addMilestoneMutation.isPending ? "Adding..." : "Add Milestone"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}