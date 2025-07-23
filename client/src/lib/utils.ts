import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format as formatTz, toZonedTime } from "date-fns-tz";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  return formatTz(toZonedTime(new Date(date), 'America/New_York'), "MMM dd, yyyy 'at' h:mm a zzz", { timeZone: 'America/New_York' });
}

export function getPriorityColor(priority: string) {
  switch (priority) {
    case "high":
      return "bg-red-100 text-red-800";
    case "medium":
      return "bg-yellow-100 text-yellow-800";
    case "low":
      return "bg-green-100 text-green-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

export function getStatusColor(status: string) {
  switch (status) {
    case "open":
    case "pending":
      return "bg-amber-100 text-amber-800";
    case "accepted":
      return "bg-purple-100 text-purple-800";
    case "in-progress":
      return "bg-blue-100 text-blue-800";
    case "completed":
      return "bg-emerald-100 text-emerald-800";
    case "rejected":
      return "bg-red-100 text-red-800";
    case "return_needed":
      return "bg-orange-100 text-orange-800";
    case "force_closed":
      return "bg-slate-100 text-slate-800";
    case "billed":
      return "bg-green-100 text-green-800";
    case "pending_confirmation":
      return "bg-yellow-100 text-yellow-800";
    case "ready_for_billing":
      return "bg-teal-100 text-teal-800";
    case "marketplace":
      return "bg-indigo-100 text-indigo-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

export function getVendorStatusDisplay(status: string, assigneeId?: number | null): { text: string; color: string; priority: 'high' | 'medium' | 'low' } {
  switch (status) {
    case 'accepted':
      if (!assigneeId) {
        return { 
          text: 'Needs Assignment', 
          color: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800', 
          priority: 'high' 
        };
      }
      return { 
        text: 'Assigned - Ready to Start', 
        color: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800', 
        priority: 'medium' 
      };
    case 'in-progress':
      return { 
        text: 'Work in Progress', 
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800', 
        priority: 'medium' 
      };
    case 'return_needed':
      return { 
        text: 'Return Visit Required', 
        color: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800', 
        priority: 'medium' 
      };
    case 'pending_confirmation':
      return { 
        text: 'Awaiting Customer Approval', 
        color: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800', 
        priority: 'low' 
      };
    case 'ready_for_billing':
      return { 
        text: 'Ready to Invoice', 
        color: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800', 
        priority: 'high' 
      };
    case 'billed':
      return { 
        text: 'Invoiced', 
        color: 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-900/20 dark:text-slate-300 dark:border-slate-800', 
        priority: 'low' 
      };
    case 'completed':
      return { 
        text: 'Job Complete', 
        color: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800', 
        priority: 'low' 
      };
    case 'rejected':
      return { 
        text: 'Rejected', 
        color: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800', 
        priority: 'low' 
      };
    default:
      return { 
        text: status.replace('_', ' ').toUpperCase(), 
        color: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-300 dark:border-gray-800', 
        priority: 'low' 
      };
  }
}
