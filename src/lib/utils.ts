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

/**
 * Determines the best recording URL to use based on call type and available recordings
 * Prioritizes stereo recordings for Mobius system (twilioSid present) when available
 * Falls back to mono recordings for compatibility
 *
 * Note: Backend handles primary URL transformation and security filtering,
 * but we keep frontend filtering as defense in depth
 */
export function getBestRecordingUrl(call: {
  recordingUrl?: string;
  nodableRecordingUrl?: string;
  stereoRecordingUrl?: string;
  twilioSid?: string;
}): string | undefined {
  // Security filter: Defense in depth - backend should handle this but keep as backup
  const isSecureUrl = (url?: string) => url && !url.includes("vapi");

  // Determine call system type
  const isMobiusSystem = !!call.twilioSid;

  // For Mobius system, prefer stereo recording if available and secure
  if (
    isMobiusSystem &&
    call.stereoRecordingUrl &&
    isSecureUrl(call.stereoRecordingUrl)
  ) {
    return getRecordingUrl(call.stereoRecordingUrl);
  }

  // Prefer nodable URL (should be available for all calls now)
  if (call.nodableRecordingUrl && isSecureUrl(call.nodableRecordingUrl)) {
    return getRecordingUrl(call.nodableRecordingUrl);
  }

  // Fallback to main recording URL if secure
  if (call.recordingUrl && isSecureUrl(call.recordingUrl)) {
    return getRecordingUrl(call.recordingUrl);
  }

  // No secure recording URL available
  return undefined;
}

/**
 * Gets the stereo recording URL with proper environment transformation
 */
export function getStereoRecordingUrl(call: {
  stereoRecordingUrl?: string;
  twilioSid?: string;
}): string | undefined {
  // Only return stereo URL for Mobius calls (have twilioSid)
  if (!call.twilioSid || !call.stereoRecordingUrl) {
    return undefined;
  }

  // Security filter and environment transformation
  const isSecureUrl = (url?: string) => url && !url.includes("vapi");

  if (isSecureUrl(call.stereoRecordingUrl)) {
    return getRecordingUrl(call.stereoRecordingUrl);
  }

  return undefined;
}
