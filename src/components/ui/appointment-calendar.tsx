import * as React from "react";
import { useCallback, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, UserSearch } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { AppointmentActions } from "./appointment-actions";
import { convertTimezone } from "@/lib/calendar-utils";
import { useClientData } from "@/hooks/use-client-data";

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
    customerId: string;
    callerId: string | null;
    state?: string | null;
    postalCode?: string | null;
    campaignId: string;
    appointmentType?: string | null;
  }>;
  onAppointmentClick?: (appointmentId: string) => void;
  onMonthChange?: (month: Date) => void;
  onCustomerSearch?: (customerId: string, callerId: string | null) => void;
}

export function AppointmentCalendar({
  className,
  appointments = [],
  onAppointmentClick,
  onCustomerSearch,
  showOutsideDays = true,
  onSelect,
  onMonthChange,
  ...props
}: AppointmentCalendarProps) {
  // Single state to track if any dropdown is open
  const [isAnyDropdownOpen, setIsAnyDropdownOpen] = useState(false);
  // Get client info to access the client's timezone
  const { clientInfo } = useClientData();

  // Log appointments data when component receives it
  console.log("Calendar received appointments:", {
    count: appointments.length,
    appointments: appointments.map((apt) => ({
      id: apt.id,
      date: apt.appointmentDateTime,
      name: `${apt.firstName || ""} ${apt.lastName || ""}`.trim() || "Unnamed",
      timezone: apt.timezone,
    })),
  });

  // Memoize the appointments data to prevent unnecessary recalculations
  const appointmentsData = useMemo(() => {
    return appointments.map((apt) => ({
      id: apt.id,
      customerId: apt.customerId,
      firstName: apt.firstName || null,
      lastName: apt.lastName || null,
      timezone: apt.timezone || null,
      state: apt.state || null,
      postalCode: apt.postalCode || null,
      appointmentDateTime: apt.appointmentDateTime,
      appointmentAttended: apt.appointmentAttended || false,
      campaignId: apt.campaignId,
      campaignName: apt.campaignName || "",
      callerId: apt.callerId,
      appointmentType: apt.appointmentType || null,
    }));
  }, [appointments]);

  const handleDropdownOpenChange = useCallback((open: boolean) => {
    setIsAnyDropdownOpen(open);
  }, []);

  const getAppointmentsForDate = useCallback(
    (date: Date) => {
      const localDateString = date.toDateString();
      return appointments.filter((apt) => {
        try {
          const ianaTimezone = clientInfo?.timezone
            ? convertTimezone(clientInfo.timezone)
            : "America/New_York";
          const aptMoment = moment
            .utc(apt.appointmentDateTime)
            .tz(ianaTimezone);
          const aptLocalDate = new Date(
            aptMoment.year(),
            aptMoment.month(),
            aptMoment.date(),
          );
          return aptLocalDate.toDateString() === localDateString;
        } catch (e) {
          console.error("Error in date comparison:", e);
          return (
            new Date(apt.appointmentDateTime).toDateString() === localDateString
          );
        }
      });
    },
    [appointments, clientInfo?.timezone],
  );

  const isPastAppointment = useCallback(
    (appointmentDateTime: string, timezone: string | null | undefined) => {
      try {
        // Use the client's timezone instead of the appointment's timezone
        const ianaTimezone = clientInfo?.timezone
          ? convertTimezone(clientInfo.timezone)
          : "America/New_York"; // Fallback to a default timezone

        // Create a moment object in UTC, then convert to the client's timezone
        const tzDateTime = moment.utc(appointmentDateTime).tz(ianaTimezone);
        return tzDateTime.isBefore(moment());
      } catch (e) {
        console.warn("Error comparing appointment dates:", e);
        return moment.utc(appointmentDateTime).isBefore(moment());
      }
    },
    [clientInfo?.timezone],
  );

  const formatTime = useCallback(
    (dateTime: string, timezone: string | null | undefined) => {
      try {
        // Use the client's timezone instead of the appointment's timezone
        const ianaTimezone = clientInfo?.timezone
          ? convertTimezone(clientInfo.timezone)
          : "America/New_York"; // Fallback to a default timezone

        // Create a moment object in UTC, then convert to the client's timezone
        const tzDateTime = moment.utc(dateTime).tz(ianaTimezone);

        // Format the time in the client's timezone
        return tzDateTime.format("h:mm A");
      } catch (e) {
        console.warn("Error formatting time:", e);
        // Fallback to America/New_York timezone if there's an error
        return moment.utc(dateTime).tz("America/New_York").format("h:mm A");
      }
    },
    [clientInfo?.timezone],
  );

  const [currentMonth, setCurrentMonth] = React.useState<Date>(
    props.selected || new Date(),
  );

  const handleMonthChange = useCallback(
    (month: Date) => {
      setCurrentMonth(month);
      onMonthChange?.(month);
    },
    [onMonthChange],
  );

  const handleSelect = useCallback<SelectSingleEventHandler>(
    (date, selectedDay, modifiers, e) => {
      if (date && onSelect) {
        // Only allow selection if the date is in the current month view
        if (date.getMonth() === currentMonth.getMonth()) {
          onSelect(date, selectedDay, modifiers, e);
        }
      }
    },
    [currentMonth, onSelect],
  );

  const handleAppointmentClick = useCallback(
    (e: React.MouseEvent, appointmentId: string) => {
      e.stopPropagation();
      onAppointmentClick?.(appointmentId);
    },
    [onAppointmentClick],
  );

  const handleCustomerSearch = useCallback(
    (customerId: string, callerId: string | null) => {
      onCustomerSearch?.(customerId, callerId);
    },
    [onCustomerSearch],
  );

  // Memoize the modifiers to prevent unnecessary re-renders
  const modifiers = useMemo(
    () => ({
      outside: (date: Date) => {
        const month = currentMonth.getMonth();
        return date.getMonth() !== month;
      },
      selected: (date: Date) => {
        return date.toDateString() === (props.selected?.toDateString() || "");
      },
    }),
    [currentMonth, props.selected],
  );

  // Memoize the modifiers styles
  const modifiersStyles = useMemo(
    () => ({
      outside: {
        opacity: 0.5,
      },
      selected: {
        backgroundColor: "#74E0BB",
        color: "#293AF9",
      },
    }),
    [],
  );

  // Memoize the class names
  const dayPickerClassNames = useMemo(
    () => ({
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
      row: "flex w-full flex-1 min-h-[10rem]",
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
    }),
    [],
  );

  const getAppointmentTypeStyles = (appointmentType: string | null) => {
    if (!appointmentType) return null;

    switch (appointmentType.toLowerCase()) {
      case "member care":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "sales":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return null;
    }
  };

  // Memoize the components
  const dayPickerComponents = useMemo(
    () => ({
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
            <div className="mt-6 space-y-1 overflow-y-auto max-h-[calc(100%-2rem)]">
              {dayAppointments.map((apt) => {
                // Find the appointment data from our memoized array
                const appointmentData = appointmentsData.find(
                  (a) => a.id === apt.id,
                );
                if (!appointmentData) return null;

                const isPast = isPastAppointment(
                  apt.appointmentDateTime,
                  apt.timezone,
                );

                return (
                  <TooltipProvider key={apt.id} delayDuration={300}>
                    <div className="relative">
                      <Tooltip>
                        <TooltipTrigger asChild disabled={isAnyDropdownOpen}>
                          <div
                            className={cn(
                              "w-full text-left px-2 py-1 rounded-sm text-xs",
                              isPast
                                ? apt.appointmentAttended
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                                : apt.appointmentType
                                  ? getAppointmentTypeStyles(
                                      apt.appointmentType,
                                    )
                                  : "bg-[#74E0BB]/10 text-[#293AF9]",
                              "hover:bg-opacity-80 transition-colors",
                              "cursor-alias group/appointment relative",
                              "border border-transparent",
                              "flex items-center justify-between",
                            )}
                            onClick={(e) => {
                              // Stop propagation to prevent the day button's click handler from firing
                              e.stopPropagation();
                              e.preventDefault();
                              handleAppointmentClick(e, apt.id);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.stopPropagation();
                                e.preventDefault();
                                onAppointmentClick?.(apt.id);
                              }
                            }}
                            tabIndex={0}
                          >
                            <div className="flex items-center relative">
                              <div className="w-full truncate pr-6 group-hover/appointment:pr-12">
                                <time
                                  className={cn(
                                    "font-medium",
                                    isPast &&
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
                                    isPast
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
                            </div>
                          </div>
                        </TooltipTrigger>
                        {!isAnyDropdownOpen && (
                          <TooltipContent>
                            <div className="space-y-1">
                              <p className="font-medium">
                                {apt.firstName || apt.lastName
                                  ? `${apt.firstName || ""} ${apt.lastName || ""}`
                                  : "Unnamed Customer"}
                              </p>
                              <p className="text-xs">
                                {formatTime(
                                  apt.appointmentDateTime,
                                  apt.timezone,
                                )}
                              </p>
                              {apt.appointmentType && (
                                <p
                                  className={cn(
                                    "text-xs px-1.5 py-0.5 rounded inline-block",
                                    apt.appointmentType
                                      ? getAppointmentTypeStyles(
                                          apt.appointmentType,
                                        )
                                      : "bg-[#74E0BB]/10 text-[#293AF9]",
                                  )}
                                >
                                  {apt.appointmentType}
                                </p>
                              )}
                              {apt.campaignName && (
                                <p className="text-xs text-muted-foreground">
                                  Campaign: {apt.campaignName}
                                </p>
                              )}
                              {apt.callerId && (
                                <p className="text-xs text-muted-foreground">
                                  Phone: {apt.callerId}
                                </p>
                              )}
                            </div>
                          </TooltipContent>
                        )}
                      </Tooltip>

                      {/* Customer search button - positioned absolutely over the appointment */}
                      <div
                        className="absolute right-0 top-1/2 -translate-y-1/2 opacity-0 group-hover/appointment:opacity-100 transition-opacity z-10"
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                        }}
                      >
                        <span
                          role="button"
                          className="h-6 w-6 text-gray-400 hover:text-blue-600 transition-colors duration-200 flex-shrink-0 flex items-center justify-center hover:bg-gray-100 rounded-full cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            handleCustomerSearch(apt.customerId, apt.callerId);
                          }}
                          title={
                            apt.callerId
                              ? `Search customer: ${apt.callerId}`
                              : "Search customer"
                          }
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.stopPropagation();
                              e.preventDefault();
                              handleCustomerSearch(
                                apt.customerId,
                                apt.callerId,
                              );
                            }
                          }}
                        >
                          <UserSearch className="h-4 w-4" />
                          <span className="sr-only">Search customer</span>
                        </span>
                      </div>
                    </div>
                  </TooltipProvider>
                );
              })}
            </div>
          </div>
        );
      },
    }),
    [
      getAppointmentsForDate,
      handleAppointmentClick,
      handleCustomerSearch,
      isPastAppointment,
      formatTime,
      isAnyDropdownOpen,
      appointmentsData,
    ],
  );

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
        modifiers={modifiers}
        modifiersStyles={modifiersStyles}
        classNames={dayPickerClassNames}
        components={dayPickerComponents}
        {...props}
      />
    </div>
  );
}
