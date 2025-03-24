import React, { useCallback, useMemo } from "react";
import { UserSearch, CalendarPlus, Download, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  createGoogleCalendarUrl,
  generateICSForAppointment,
  downloadFile,
} from "@/lib/calendar-utils";
import moment from "moment-timezone";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Define a local appointment type that matches what we need
interface AppointmentData {
  id: string;
  customerId: string;
  firstName: string | null;
  lastName: string | null;
  timezone: string | null;
  state: string | null;
  postalCode: string | null;
  appointmentDateTime: string;
  appointmentAttended: boolean;
  campaignId: string;
  campaignName: string;
  callerId: string | null;
}

interface AppointmentActionsProps {
  appointment: AppointmentData;
  onCustomerSearch?: (customerId: string, callerId: string | null) => void;
  onDropdownOpenChange?: (open: boolean) => void;
  className?: string;
  showCalendarOnly?: boolean;
}

export function AppointmentActions({
  appointment,
  onCustomerSearch,
  onDropdownOpenChange,
  className,
  showCalendarOnly = false,
}: AppointmentActionsProps) {
  // Check if appointment is in the future - memoized to prevent recalculation
  const isFuture = useMemo(() => {
    const now = moment();
    try {
      return moment(appointment.appointmentDateTime).isAfter(now);
    } catch (e) {
      console.warn("Error comparing appointment dates:", e);
      return false;
    }
  }, [appointment.appointmentDateTime]);

  // Memoize all event handlers to prevent recreating them on each render
  const handleCustomerSearch = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      if (onCustomerSearch) {
        onCustomerSearch(appointment.customerId, appointment.callerId);
      }
    },
    [appointment.customerId, appointment.callerId, onCustomerSearch],
  );

  const handleAddToGoogleCalendar = useCallback(() => {
    if (!isFuture) return;

    const url = createGoogleCalendarUrl(appointment);
    if (!url) return;

    window.open(url, "_blank");
  }, [appointment, isFuture]);

  const handleExportICS = useCallback(() => {
    if (!isFuture) return;

    const icsContent = generateICSForAppointment(appointment);
    if (!icsContent) return;

    const customerName =
      appointment.firstName || appointment.lastName
        ? `${appointment.firstName || ""}_${appointment.lastName || ""}`
            .trim()
            .replace(/\s+/g, "_")
        : "appointment";

    const filename = `carecycle_${customerName}_${new Date(appointment.appointmentDateTime).toISOString().split("T")[0]}.ics`;
    downloadFile(icsContent, filename);
  }, [appointment, isFuture]);

  // Handle dropdown open state change
  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (onDropdownOpenChange) {
        onDropdownOpenChange(open);
      }
    },
    [onDropdownOpenChange],
  );

  // Memoize the stopPropagation handler to prevent recreating it on each render
  const handleStopPropagation = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
  }, []);

  // Memoize the dropdown menu to prevent unnecessary re-renders
  const calendarDropdown = useMemo(() => {
    if (!isFuture) return null;

    return (
      <DropdownMenu onOpenChange={handleOpenChange}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-gray-400 hover:text-blue-600 transition-colors duration-200 flex-shrink-0 flex items-center justify-center hover:bg-gray-100 rounded-full"
            onClick={handleStopPropagation}
          >
            <Calendar className="h-4 w-4" />
            <span className="sr-only">Calendar options</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="bg-white border shadow-md p-1 min-w-[180px]"
          onClick={handleStopPropagation}
          sideOffset={5}
        >
          <DropdownMenuItem onSelect={handleExportICS}>
            <Download className="mr-2 h-4 w-4" />
            Export as .ics
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={handleAddToGoogleCalendar}>
            <CalendarPlus className="mr-2 h-4 w-4" />
            Add to Google Calendar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }, [
    isFuture,
    handleOpenChange,
    handleStopPropagation,
    handleExportICS,
    handleAddToGoogleCalendar,
  ]);

  return (
    <div
      className={cn("flex items-center gap-1", className)}
      onClick={handleStopPropagation}
    >
      {calendarDropdown}
      {!showCalendarOnly && (
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-gray-400 hover:text-blue-600 transition-colors duration-200 flex-shrink-0 flex items-center justify-center hover:bg-gray-100 rounded-full"
          onClick={handleCustomerSearch}
          title={
            appointment.callerId
              ? `Search customer: ${appointment.callerId}`
              : "Search customer"
          }
        >
          <UserSearch className="h-4 w-4" />
          <span className="sr-only">Search customer</span>
        </Button>
      )}
    </div>
  );
}
