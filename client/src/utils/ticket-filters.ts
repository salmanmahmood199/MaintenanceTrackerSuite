import type { Ticket } from "@shared/schema";
import type { FilterState } from "@/components/ticket-filters";

export function filterTickets(tickets: Ticket[], filters: FilterState): Ticket[] {
  return tickets.filter(ticket => {
    // Search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      const matchesSearch = 
        ticket.title?.toLowerCase().includes(searchTerm) ||
        ticket.description?.toLowerCase().includes(searchTerm) ||
        ticket.ticketNumber?.toLowerCase().includes(searchTerm);
      if (!matchesSearch) return false;
    }

    // Status filter
    if (filters.status !== "all" && ticket.status !== filters.status) {
      return false;
    }

    // Priority filter
    if (filters.priority !== "all" && ticket.priority !== filters.priority) {
      return false;
    }

    // Date range filter
    if (filters.dateFrom || filters.dateTo) {
      const ticketDate = new Date(ticket.createdAt);
      if (filters.dateFrom && ticketDate < filters.dateFrom) {
        return false;
      }
      if (filters.dateTo && ticketDate > filters.dateTo) {
        return false;
      }
    }

    // Organization filter
    if (filters.organizationId !== "all" && ticket.organizationId !== parseInt(filters.organizationId)) {
      return false;
    }

    // Vendor filter
    if (filters.vendorId !== "all" && ticket.maintenanceVendorId !== parseInt(filters.vendorId)) {
      return false;
    }

    // Assignee filter
    if (filters.assigneeId !== "all") {
      if (filters.assigneeId === "unassigned" && ticket.assigneeId !== null) {
        return false;
      }
      if (filters.assigneeId === "assigned" && ticket.assigneeId === null) {
        return false;
      }
    }

    return true;
  });
}

export function getFilteredTicketsCount(tickets: Ticket[], filters: FilterState): number {
  return filterTickets(tickets, filters).length;
}