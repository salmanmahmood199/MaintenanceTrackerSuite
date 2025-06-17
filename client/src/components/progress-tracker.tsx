import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, AlertTriangle, Wrench, FileText } from "lucide-react";
import type { Ticket } from "@shared/schema";

interface ProgressTrackerProps {
  ticket: Ticket;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateProgress?: (ticketId: number, progress: number, stage: string) => void;
  canUpdate?: boolean;
}

const progressStages = [
  { value: "submitted", label: "Ticket Submitted", progress: 0, icon: FileText },
  { value: "reviewed", label: "Under Review", progress: 20, icon: Clock },
  { value: "assigned", label: "Assigned to Vendor", progress: 40, icon: Wrench },
  { value: "in_progress", label: "Work in Progress", progress: 60, icon: AlertTriangle },
  { value: "testing", label: "Testing & Verification", progress: 80, icon: CheckCircle },
  { value: "completed", label: "Completed", progress: 100, icon: CheckCircle },
];

export function ProgressTracker({ 
  ticket, 
  open, 
  onOpenChange, 
  onUpdateProgress, 
  canUpdate = false 
}: ProgressTrackerProps) {
  const [selectedStage, setSelectedStage] = useState(ticket.progressStage || "submitted");

  const currentStage = progressStages.find(stage => stage.value === (ticket.progressStage || "submitted"));
  const currentProgress = ticket.progress || currentStage?.progress || 0;

  const handleUpdateProgress = () => {
    const stage = progressStages.find(s => s.value === selectedStage);
    if (stage && onUpdateProgress) {
      onUpdateProgress(ticket.id, stage.progress, stage.value);
      onOpenChange(false);
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress === 100) return "bg-green-500";
    if (progress >= 60) return "bg-blue-500";
    if (progress >= 40) return "bg-yellow-500";
    return "bg-slate-400";
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case "completed": return "bg-green-100 text-green-800 border-green-200";
      case "testing": return "bg-blue-100 text-blue-800 border-blue-200";
      case "in_progress": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "assigned": return "bg-purple-100 text-purple-800 border-purple-200";
      case "reviewed": return "bg-orange-100 text-orange-800 border-orange-200";
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
          {/* Current Progress */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-slate-900">Current Progress</h3>
              <Badge className={getStageColor(ticket.progressStage || "submitted")}>
                {currentStage?.label || "Submitted"}
              </Badge>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Progress</span>
                <span className="font-medium">{currentProgress}%</span>
              </div>
              <Progress 
                value={currentProgress} 
                className="h-3"
                style={{
                  backgroundColor: '#e2e8f0'
                }}
              />
            </div>
          </div>

          {/* Progress Timeline */}
          <div className="space-y-4">
            <h3 className="font-medium text-slate-900">Progress Timeline</h3>
            <div className="space-y-3">
              {progressStages.map((stage, index) => {
                const isCompleted = currentProgress >= stage.progress;
                const isCurrent = stage.value === (ticket.progressStage || "submitted");
                const Icon = stage.icon;

                return (
                  <div key={stage.value} className="flex items-center space-x-3">
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                      isCompleted 
                        ? "bg-green-100 text-green-600" 
                        : isCurrent 
                        ? "bg-blue-100 text-blue-600" 
                        : "bg-slate-100 text-slate-400"
                    }`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <div className={`text-sm font-medium ${
                        isCompleted ? "text-green-900" : isCurrent ? "text-blue-900" : "text-slate-500"
                      }`}>
                        {stage.label}
                      </div>
                      <div className="text-xs text-slate-500">{stage.progress}% Complete</div>
                    </div>
                    {isCompleted && (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Update Progress (if user can update) */}
          {canUpdate && (
            <div className="space-y-3 pt-4 border-t">
              <h3 className="font-medium text-slate-900">Update Progress</h3>
              <div className="flex items-center space-x-3">
                <Select value={selectedStage} onValueChange={setSelectedStage}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select progress stage..." />
                  </SelectTrigger>
                  <SelectContent>
                    {progressStages.map((stage) => (
                      <SelectItem key={stage.value} value={stage.value}>
                        <div className="flex items-center gap-2">
                          <stage.icon className="h-4 w-4" />
                          <span>{stage.label} ({stage.progress}%)</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={handleUpdateProgress} className="bg-blue-600 hover:bg-blue-700">
                  Update
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}