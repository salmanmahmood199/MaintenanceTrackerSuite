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
    { value: "accepted", label: "⚠️ Assign Technician" },
    { value: "in-progress", label: "🔧 Work in Progress" },
    { value: "return_needed", label: "🔄 Return Visit" },
    { value: "pending_confirmation", label: "👀 Customer Review" },
    { value: "ready_for_billing", label: "💰 Create Invoice" },
    { value: "billed", label: "✅ All Done" },
    { value: "completed", label: "✓ Work Approved" },
    { value: "rejected", label: "❌ Declined" },
    { value: "force_closed", label: "⛔ Closed" }
  ] : userRole === 'technician' ? [
    { value: "all", label: "All Tickets" },
    { value: "accepted", label: "🚀 Start Work" },
    { value: "in-progress", label: "🔧 Working On" },
    { value: "return_needed", label: "🔄 Return Visit" },
    { value: "completed", label: "✓ Completed" },
    { value: "pending_confirmation", label: "⏳ Awaiting Approval" },
    { value: "ready_for_billing", label: "💰 Ready to Bill" },
    { value: "billed", label: "✅ Invoiced" }
  ] : [
    { value: "all", label: "All Tickets" },
    { value: "pending", label: "🔄 Needs Review" },
    { value: "accepted", label: "✅ Approved" },
    { value: "in-progress", label: "🔧 In Progress" },
    { value: "completed", label: "✓ Work Done" },
    { value: "pending_confirmation", label: "👀 Review Work" },
    { value: "ready_for_billing", label: "💰 Ready to Bill" },
    { value: "billed", label: "💳 Invoiced" },
    { value: "return_needed", label: "🔄 Return Visit" },
    { value: "force_closed", label: "⛔ Closed" },
    { value: "marketplace", label: "🏪 Marketplace" },
    { value: "rejected", label: "❌ Declined" }
  ];

  const priorityOptions = [
    { value: "all", label: "All Priorities" },
    { value: "low", label: "🟢 Low Priority" },
    { value: "medium", label: "🟡 Medium Priority" },
    { value: "high", label: "🔴 High Priority" }
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
        {/* Active Filters Summary */}
        {hasActiveFilters && (
          <div className="bg-muted/50 rounded-lg p-3 border">
            <div className="flex items-center justify-between">
              <div className="flex flex-wrap gap-2 text-sm">
                <span className="font-medium">Active filters:</span>
                {filters.search && (
                  <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-md">
                    Search: "{filters.search}"
                  </span>
                )}
                {filters.status !== 'all' && (
                  <span className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded-md">
                    Status: {statusOptions.find(s => s.value === filters.status)?.label}
                  </span>
                )}
                {filters.priority !== 'all' && (
                  <span className="bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-2 py-1 rounded-md">
                    Priority: {priorityOptions.find(p => p.value === filters.priority)?.label}
                  </span>
                )}
                {(filters.dateFrom || filters.dateTo) && (
                  <span className="bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 px-2 py-1 rounded-md">
                    Date Range: {filters.dateFrom?.toLocaleDateString()} - {filters.dateTo?.toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Quick Status Filters - Role-based prioritized actions */}
        <div className="flex flex-wrap gap-2">
          {statusOptions.slice(0, userRole === 'technician' ? 5 : 6).map((status) => (
            <Button
              key={status.value}
              variant={filters.status === status.value ? "default" : "outline"}
              size="sm"
              onClick={() => updateFilter('status', status.value)}
              className={`${
                status.value === 'accepted' && userRole?.startsWith('maintenance') ? 'ring-2 ring-orange-200 dark:ring-orange-800' :
                status.value === 'accepted' && userRole === 'technician' ? 'ring-2 ring-blue-200 dark:ring-blue-800' :
                status.value === 'pending_confirmation' && userRole?.startsWith('org') ? 'ring-2 ring-purple-200 dark:ring-purple-800' :
                status.value === 'ready_for_billing' && userRole?.startsWith('maintenance') ? 'ring-2 ring-green-200 dark:ring-green-800' :
                ''
              }`}
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
              placeholder={
                userRole === 'technician' ? "Search your assigned tickets..." :
                userRole?.startsWith('maintenance') ? "Search vendor tickets..." :
                "Search by title, description, or ticket number..."
              }
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