import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDuration(ms: number): string {
  if (!ms) return "0s";

  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  }

  if (minutes === 0) {
    return `${seconds}s`;
  }

  return `${minutes}m ${seconds}s`;
}

export function formatPhoneNumber(
  phoneNumber: string | null | undefined,
): string {
  // Handle null, undefined, or empty string
  if (!phoneNumber) return "-";

  // Remove any non-digit characters
  const cleaned = phoneNumber.replace(/\D/g, "");

  // Check if it's a valid phone number
  if (cleaned.length !== 11) return phoneNumber;

  // Format as "+1 234-567-8901"
  return `+${cleaned.slice(0, 1)} ${cleaned.slice(1, 4)}-${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
}

export function formatDate(date: string | Date) {
  if (!date) return "-";
  return format(new Date(date), "MMM d, yyyy h:mm a");
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Transforms a recording URL to use the correct API endpoint based on environment
 * In development: converts https://api.nodable.ai/recordings/... to http://localhost:3000/recordings/...
 * In production: returns the URL as-is
 */
export function getRecordingUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;

  const isDevelopment = import.meta.env.VITE_NODE_ENV === "development";

  if (isDevelopment && url.includes("api.nodable.ai/recordings/")) {
    // Replace the production URL with the local development URL
    return url.replace(
      "https://api.nodable.ai/recordings/",
      "http://localhost:3000/recordings/",
    );
  }

  return url;
}
