import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, FilterIcon, X } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface TicketFiltersProps {
  onFiltersChange: (filters: FilterState) => void;
  showOrganizationFilter?: boolean;
  showVendorFilter?: boolean;
  organizations?: Array<{ id: number; name: string }>;
  vendors?: Array<{ id: number; name: string }>;
  userRole?: string;
}

export interface FilterState {
  search: string;
  status: string;
  priority: string;
  dateFrom: Date | null;
  dateTo: Date | null;
  organizationId: string;
  vendorId: string;
  assigneeId: string;
}

const initialFilters: FilterState = {
  search: "",
  status: "all",
  priority: "all",
  dateFrom: null,
  dateTo: null,
  organizationId: "all",
  vendorId: "all",
  assigneeId: "all"
};

export function TicketFilters({
  onFiltersChange,
  showOrganizationFilter = false,
  showVendorFilter = false,
  organizations = [],
  vendors = [],
  userRole
}: TicketFiltersProps) {
  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [isExpanded, setIsExpanded] = useState(false);

  const updateFilter = (key: keyof FilterState, value: string | Date | null) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const clearFilters = () => {
    setFilters(initialFilters);
    onFiltersChange(initialFilters);
  };

  const hasActiveFilters = Object.entries(filters).some(([key, value]) => {
    if (key === 'search') return value !== '';
    if (key === 'dateFrom' || key === 'dateTo') return value !== null;
    return value !== 'all';
  });

  const statusOptions = userRole?.startsWith('maintenance') ? [
    { value: "all", label: "All Tickets" },
    { value: "accepted", label: "⚠️ Action Required" },
    { value: "in-progress", label: "🔧 Work Started" },
    { value: "return_needed", label: "🔄 Return Visit" },
    { value: "pending_confirmation", label: "👀 Customer Review" },
    { value: "ready_for_billing", label: "💰 Ready to Bill" },
    { value: "billed", label: "✅ Invoice Sent" },
    { value: "completed", label: "✓ Work Approved" },
    { value: "rejected", label: "❌ Declined" },
    { value: "force_closed", label: "⛔ Closed" }
  ] : [
    { value: "all", label: "All Statuses" },
    { value: "open", label: "Open" },
    { value: "pending", label: "Pending" },
    { value: "accepted", label: "Accepted" },
    { value: "in-progress", label: "In Progress" },
    { value: "completed", label: "Completed" },
    { value: "pending_confirmation", label: "Pending Confirmation" },
    { value: "ready_for_billing", label: "Ready for Billing" },
    { value: "billed", label: "Billed" },
    { value: "return_needed", label: "Return Needed" },
    { value: "force_closed", label: "Force Closed" },
    { value: "marketplace", label: "Marketplace" }
  ];

  const priorityOptions = [
    { value: "all", label: "All Priorities" },
    { value: "low", label: "Low" },
    { value: "medium", label: "Medium" },
    { value: "high", label: "High" }
  ];

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <FilterIcon className="h-5 w-5" />
            Ticket Filters
          </CardTitle>
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4 mr-1" />
                Clear All
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? "Show Less" : "Show More"}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Quick Status Filters */}
        <div className="flex flex-wrap gap-2">
          {statusOptions.slice(0, 6).map((status) => (
            <Button
              key={status.value}
              variant={filters.status === status.value ? "default" : "outline"}
              size="sm"
              onClick={() => updateFilter('status', status.value)}
            >
              {status.label}
            </Button>
          ))}
        </div>

        {/* Search and Primary Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="search">Search Tickets</Label>
            <Input
              id="search"
              placeholder="Search by title, description, or ticket number..."
              value={filters.search}
              onChange={(e) => updateFilter('search', e.target.value)}
            />
          </div>
          
          <div>
            <Label htmlFor="status">Status</Label>
            <Select value={filters.status} onValueChange={(value) => updateFilter('status', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="priority">Priority</Label>
            <Select value={filters.priority} onValueChange={(value) => updateFilter('priority', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                {priorityOptions.map((priority) => (
                  <SelectItem key={priority.value} value={priority.value}>
                    {priority.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Expanded Filters */}
        {isExpanded && (
          <div className="space-y-4 pt-4 border-t border-border">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Date Range */}
              <div>
                <Label>Date From</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !filters.dateFrom && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filters.dateFrom ? format(filters.dateFrom, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={filters.dateFrom || undefined}
                      onSelect={(date) => updateFilter('dateFrom', date || null)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label>Date To</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !filters.dateTo && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filters.dateTo ? format(filters.dateTo, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={filters.dateTo || undefined}
                      onSelect={(date) => updateFilter('dateTo', date || null)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Organization Filter */}
              {showOrganizationFilter && (
                <div>
                  <Label htmlFor="organization">Organization</Label>
                  <Select value={filters.organizationId} onValueChange={(value) => updateFilter('organizationId', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select organization" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Organizations</SelectItem>
                      {organizations.map((org) => (
                        <SelectItem key={org.id} value={org.id.toString()}>
                          {org.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Vendor Filter */}
              {showVendorFilter && (
                <div>
                  <Label htmlFor="vendor">Vendor</Label>
                  <Select value={filters.vendorId} onValueChange={(value) => updateFilter('vendorId', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select vendor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Vendors</SelectItem>
                      {vendors.map((vendor) => (
                        <SelectItem key={vendor.id} value={vendor.id.toString()}>
                          {vendor.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Additional Filters based on user role */}
            {userRole === "root" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="assignee">Assignee</Label>
                  <Select value={filters.assigneeId} onValueChange={(value) => updateFilter('assigneeId', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select assignee" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Assignees</SelectItem>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      <SelectItem value="assigned">Assigned</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}