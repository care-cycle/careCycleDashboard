import { useCallback, useMemo } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  generateICSForAppointments,
  downloadFile,
  AppointmentData,
  convertTimezone,
} from "@/lib/calendar-utils";
import moment from "moment-timezone";
import { useToast } from "@/hooks/use-toast";

interface CalendarActionsProps {
  appointment?: AppointmentData;
  appointments?: AppointmentData[];
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
}

export function CalendarActions({
  appointments = [],
  variant = "outline",
  size = "icon",
}: CalendarActionsProps) {
  const { toast } = useToast();

  // Filter to only include future appointments - memoized to prevent recalculation on every render
  const futureAppointments = useMemo(() => {
    const now = moment();
    return appointments.filter((apt) => {
      try {
        const ianaTimezone = convertTimezone(apt.timezone);
        const aptDateTime = moment(apt.appointmentDateTime).tz(ianaTimezone);
        return aptDateTime.isAfter(now);
      } catch (e) {
        console.warn("Error comparing appointment dates:", e);
        return moment(apt.appointmentDateTime).isAfter(now);
      }
    });
  }, [appointments]);

  const handleExportAllICS = useCallback(() => {
    if (!futureAppointments.length) {
      toast({
        title: "No future appointments",
        description: "There are no future appointments to export.",
        duration: 3000,
      });
      return;
    }

    const icsContent = generateICSForAppointments(futureAppointments);
    if (!icsContent) return;

    const filename = `careCycle_appointments_${new Date().toISOString().split("T")[0]}.ics`;
    downloadFile(icsContent, filename);

    toast({
      title: "Appointments exported",
      description: `Exported ${futureAppointments.length} future appointments as .ics file.`,
      duration: 3000,
    });
  }, [futureAppointments, toast]);

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleExportAllICS}
      title="Export all future appointments as .ics file"
    >
      <Download className="h-4 w-4" />
      <span className="sr-only">Export appointments</span>
    </Button>
  );
}
