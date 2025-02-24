import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker as DayPickerComponent } from "react-day-picker";
import type {
  DayPickerSingleProps,
  DayContentProps,
  SelectSingleEventHandler,
} from "react-day-picker";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button-styles";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import moment from "moment-timezone";

export interface AppointmentCalendarProps
  extends Omit<DayPickerSingleProps, "components" | "mode"> {
  appointments?: Array<{
    id: string;
    appointmentDateTime: string;
    firstName?: string | null;
    lastName?: string | null;
    campaignName?: string;
    timezone?: string | null;
    appointmentAttended?: boolean;
  }>;
  onAppointmentClick?: (appointmentId: string) => void;
  onMonthChange?: (month: Date) => void;
}

export function AppointmentCalendar({
  className,
  appointments = [],
  onAppointmentClick,
  showOutsideDays = true,
  onSelect,
  onMonthChange,
  ...props
}: AppointmentCalendarProps) {
  const getAppointmentsForDate = (date: Date) => {
    return appointments.filter(
      (apt) =>
        new Date(apt.appointmentDateTime).toDateString() ===
        date.toDateString(),
    );
  };

  const convertTimezone = (timezone: string | null): string => {
    if (!timezone) return "America/New_York";

    // Convert common timezone names to IANA format
    const timezoneMap: Record<string, string> = {
      Eastern: "America/New_York",
      Central: "America/Chicago",
      Mountain: "America/Denver",
      Pacific: "America/Los_Angeles",
    };

    return timezoneMap[timezone] || timezone;
  };

  const isPastAppointment = (
    appointmentDateTime: string,
    timezone: string | null | undefined,
  ) => {
    try {
      const ianaTimezone = convertTimezone(timezone || null);
      const tzDateTime = moment(appointmentDateTime).tz(ianaTimezone);
      return tzDateTime.isBefore(moment());
    } catch (e) {
      console.warn("Error comparing appointment dates:", e);
      return moment(appointmentDateTime).isBefore(moment());
    }
  };

  const formatTime = (
    dateTime: string,
    timezone: string | null | undefined,
  ) => {
    try {
      const ianaTimezone = convertTimezone(timezone || null);
      const tzDateTime = moment(dateTime).tz(ianaTimezone);
      return tzDateTime.format("h:mm A");
    } catch (e) {
      console.warn("Error formatting time:", e);
      return moment(dateTime).format("h:mm A");
    }
  };

  const [currentMonth, setCurrentMonth] = React.useState<Date>(
    props.selected || new Date(),
  );

  const handleMonthChange = (month: Date) => {
    setCurrentMonth(month);
    onMonthChange?.(month);
  };

  const handleSelect: SelectSingleEventHandler = (
    date,
    selectedDay,
    modifiers,
    e,
  ) => {
    if (date && onSelect) {
      // Only allow selection if the date is in the current month view
      if (date.getMonth() === currentMonth.getMonth()) {
        onSelect(date, selectedDay, modifiers, e);
      }
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-4 px-4 py-2 border-b">
        <div className="flex items-center gap-2 text-xs">
          <div className="w-3 h-3 rounded-sm bg-green-100 border border-green-200" />
          <span className="text-green-800">Attended</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <div className="w-3 h-3 rounded-sm bg-red-100 border border-red-200" />
          <span className="text-red-800">Not Attended</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <div className="w-3 h-3 rounded-sm bg-[#74E0BB]/10 border border-[#74E0BB]/20" />
          <span className="text-[#293AF9]">Upcoming</span>
        </div>
      </div>
      <DayPickerComponent
        mode="single"
        showOutsideDays={showOutsideDays}
        className={cn("p-3 flex-1", className)}
        month={currentMonth}
        onMonthChange={handleMonthChange}
        onSelect={handleSelect}
        modifiers={{
          outside: (date) => {
            const month = currentMonth.getMonth();
            return date.getMonth() !== month;
          },
          selected: (date) => {
            return (
              date.toDateString() === (props.selected?.toDateString() || "")
            );
          },
        }}
        modifiersStyles={{
          outside: {
            opacity: 0.5,
          },
          selected: {
            backgroundColor: "#74E0BB",
            color: "#293AF9",
          },
        }}
        classNames={{
          months: "flex-1 flex flex-col space-y-4",
          month: "flex-1 flex flex-col space-y-4",
          caption:
            "flex justify-center pt-1 relative items-center h-14 border-b border-border/20",
          caption_label: "text-xl font-semibold",
          nav: "space-x-1 flex items-center absolute inset-x-4",
          nav_button: cn(
            buttonVariants({ variant: "ghost" }),
            "h-8 w-8 bg-transparent p-0 opacity-50 hover:opacity-100 hover:bg-gray-100/50",
            "flex items-center justify-center",
          ),
          nav_button_previous: "absolute left-0",
          nav_button_next: "absolute right-0",
          table: "w-full h-full border-collapse space-y-1",
          head_row: "flex w-full",
          head_cell: cn(
            "text-muted-foreground font-medium",
            "w-[calc(100%/7)] h-10 flex items-center justify-center",
          ),
          row: "flex w-full flex-1 min-h-[8rem]",
          cell: cn(
            "relative w-[calc(100%/7)] p-0 first:rounded-l-lg last:rounded-r-lg",
            "[&:nth-child(7n)]:bg-gray-100/70 [&:nth-child(1)]:bg-gray-100/70",
            "border-r last:border-r-0 border-border/10",
          ),
          day: cn(
            "h-full w-full inline-flex flex-col items-start justify-start p-2",
            "hover:bg-accent/50 rounded-lg transition-colors",
            "aria-selected:bg-accent/30",
          ),
          day_selected: "bg-accent/30",
          day_today: cn(
            "bg-accent text-accent-foreground",
            "before:absolute before:top-0 before:left-0",
            "before:w-full before:h-1 before:bg-[#293AF9]",
          ),
          day_outside: "text-muted-foreground/50",
          day_disabled: "text-muted-foreground/50",
          day_range_middle: "aria-selected:bg-accent",
          day_hidden: "invisible",
        }}
        components={{
          IconLeft: () => <ChevronLeft className="h-5 w-5" />,
          IconRight: () => <ChevronRight className="h-5 w-5" />,
          DayContent: (props: DayContentProps) => {
            const { date } = props;
            const dayAppointments = getAppointmentsForDate(date);

            return (
              <div className="h-full w-full relative group">
                <div className="absolute top-1 right-2 text-sm font-medium">
                  {date.getDate()}
                </div>
                <div className="mt-6 space-y-1 max-h-[calc(100%-2rem)] overflow-y-auto">
                  {dayAppointments.map((apt) => (
                    <TooltipProvider key={apt.id}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div
                            role="button"
                            tabIndex={0}
                            onClick={() => onAppointmentClick?.(apt.id)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                onAppointmentClick?.(apt.id);
                              }
                            }}
                            className={cn(
                              "w-full text-left px-2 py-1 rounded-sm text-xs",
                              isPastAppointment(
                                apt.appointmentDateTime,
                                apt.timezone,
                              )
                                ? apt.appointmentAttended
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                                : "bg-[#74E0BB]/10 text-[#293AF9]",
                              "hover:bg-[#74E0BB]/20 transition-colors",
                              "truncate block cursor-pointer",
                            )}
                          >
                            <time
                              className={cn(
                                "font-medium",
                                isPastAppointment(
                                  apt.appointmentDateTime,
                                  apt.timezone,
                                ) &&
                                  (apt.appointmentAttended
                                    ? "text-green-900"
                                    : "text-red-900"),
                              )}
                            >
                              {formatTime(
                                apt.appointmentDateTime,
                                apt.timezone,
                              )}
                            </time>
                            <span
                              className={cn(
                                "ml-1",
                                isPastAppointment(
                                  apt.appointmentDateTime,
                                  apt.timezone,
                                )
                                  ? apt.appointmentAttended
                                    ? "text-green-800/90"
                                    : "text-red-800/90"
                                  : "opacity-80",
                              )}
                            >
                              {apt.firstName || apt.lastName
                                ? `${apt.firstName || ""} ${apt.lastName || ""}`
                                : "Unnamed Customer"}
                            </span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          {apt.firstName || apt.lastName
                            ? `${apt.firstName || ""} ${apt.lastName || ""}`
                            : "Unnamed Customer"}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ))}
                </div>
              </div>
            );
          },
        }}
        {...props}
      />
    </div>
  );
}
