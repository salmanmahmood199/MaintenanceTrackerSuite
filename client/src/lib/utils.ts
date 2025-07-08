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
