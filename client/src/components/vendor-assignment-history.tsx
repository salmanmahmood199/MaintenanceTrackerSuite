import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Clock, User, Building2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface VendorAssignmentHistoryItem {
  id: number;
  vendorName: string;
  assignedByName: string;
  assignmentType: 'initial' | 'reassignment';
  status: 'assigned' | 'rejected';
  rejectionReason?: string;
  assignedAt: string;
  rejectedAt?: string;
  isActive: boolean;
}

interface VendorAssignmentHistoryProps {
  ticketId: number;
}

export function VendorAssignmentHistory({ ticketId }: VendorAssignmentHistoryProps) {
  const { data: history, isLoading, error } = useQuery<VendorAssignmentHistoryItem[]>({
    queryKey: ['/api/tickets', ticketId, 'vendor-history'],
    queryFn: async () => {
      const response = await fetch(`/api/tickets/${ticketId}/vendor-history`);
      if (!response.ok) {
        throw new Error('Failed to fetch vendor assignment history');
      }
      return response.json();
    },
    enabled: !!ticketId
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-4 bg-muted rounded w-1/3 mb-3"></div>
          <div className="space-y-3">
            <div className="h-16 bg-muted rounded"></div>
            <div className="h-16 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8 text-muted-foreground">
        <AlertCircle className="h-5 w-5 mr-2" />
        Unable to load vendor assignment history
      </div>
    );
  }

  if (!history || history.length === 0) {
    return (
      <div className="flex items-center justify-center p-8 text-muted-foreground">
        <Building2 className="h-5 w-5 mr-2" />
        No vendor assignments yet
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Building2 className="h-5 w-5 text-muted-foreground" />
        <h3 className="font-semibold text-foreground">Vendor Assignment History</h3>
        <Badge variant="outline" className="ml-auto">
          {history.length} Assignment{history.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      <div className="space-y-4">
        {history.map((item, index) => (
          <div key={item.id} className="relative">
            {/* Timeline connector */}
            {index < history.length - 1 && (
              <div className="absolute left-4 top-8 bottom-0 w-px bg-border"></div>
            )}
            
            <div className="flex gap-4">
              {/* Status Icon */}
              <div className="flex-shrink-0 mt-1">
                {item.status === 'assigned' ? (
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                    <CheckCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
                    <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                  </div>
                )}
              </div>

              {/* Assignment Details */}
              <div className="flex-grow min-w-0">
                <div className="bg-card border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-medium text-foreground flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        {item.vendorName}
                        {item.isActive && (
                          <Badge variant="default" className="text-xs">
                            Current
                          </Badge>
                        )}
                      </h4>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                        <User className="h-3 w-3" />
                        Assigned by {item.assignedByName}
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <Badge 
                        variant={item.status === 'assigned' ? 'default' : 'destructive'}
                        className="mb-1"
                      >
                        {item.status === 'assigned' ? 'Assigned' : 'Rejected'}
                      </Badge>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(item.assignedAt), { addSuffix: true })}
                      </div>
                    </div>
                  </div>

                  {/* Assignment Type */}
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-xs">
                      {item.assignmentType === 'initial' ? 'Initial Assignment' : 'Reassignment'}
                    </Badge>
                  </div>

                  {/* Rejection Details */}
                  {item.status === 'rejected' && item.rejectionReason && (
                    <div className="mt-3 pt-3 border-t">
                      <div className="flex items-start gap-2">
                        <XCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-foreground">Rejection Reason</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {item.rejectionReason}
                          </p>
                          {item.rejectedAt && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                              <Clock className="h-3 w-3" />
                              Rejected {formatDistanceToNow(new Date(item.rejectedAt), { addSuffix: true })}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <Separator />
      <div className="text-sm text-muted-foreground">
        <div className="flex items-center justify-between">
          <span>Total assignments: {history.length}</span>
          <span>
            Active: {history.filter(h => h.isActive).length} | 
            Rejected: {history.filter(h => h.status === 'rejected').length}
          </span>
        </div>
      </div>
    </div>
  );
}