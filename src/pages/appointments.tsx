import { useEffect, useState, useMemo } from "react";
import { AppointmentCalendar } from "@/components/ui/appointment-calendar";
import { useToast } from "@/hooks/use-toast";
import { Search, Calendar as CalendarIcon, UserSearch } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import moment from "moment-timezone";
import { useClientData, useInitialData } from "@/hooks/use-client-data";
import { RootLayout } from "@/components/layout/root-layout";
import { cn } from "@/lib/utils";
import { getTopMetrics } from "@/lib/metrics";
import { Input } from "@/components/ui/input";
import { CalendarActions } from "@/components/ui/calendar-actions";
import { AppointmentData, convertTimezone } from "@/lib/calendar-utils";
import type { Appointment } from "@/hooks/use-client-data";
import { AppointmentActions } from "@/components/ui/appointment-actions";
import { useUI } from "@/hooks/use-ui";
import { usePreferences } from "@/hooks/use-preferences";
import { subDays } from "date-fns";
import { MemoizedAppointmentDetails } from "@/components/ui/appointment-details";

export default function Appointments() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { clientInfo, fetchAppointments } = useClientData();
  const {
    todayMetrics,
    appointments: initialAppointments,
    isAppointmentsLoading,
  } = useInitialData();
  const { selectedCampaignId } = usePreferences();
  const [allAppointments, setAllAppointments] =
    useState<Appointment[]>(initialAppointments);
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc" | null;
  }>({ key: "", direction: null });
  const [searchQuery, setSearchQuery] = useState(
    () => searchParams.get("search") || "",
  );

  // Add effect to handle search from URL
  useEffect(() => {
    const searchFromUrl = searchParams.get("search");
    if (searchFromUrl) {
      setSearchQuery(searchFromUrl);
    }
  }, [searchParams]);

  // Load all appointments once
  useEffect(() => {
    const loadAppointments = async () => {
      try {
        const appointments = await fetchAppointments();
        setAllAppointments(appointments);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load appointments",
          variant: "destructive",
        });
      }
    };

    loadAppointments();
  }, [fetchAppointments, toast]);

  // Filter appointments for upcoming ones
  const appointments = useMemo(() => {
    const now = new Date();
    return allAppointments.filter((appointment) => {
      const appointmentDate = new Date(appointment.appointmentDateTime);
      return appointmentDate > now;
    });
  }, [allAppointments]);

  const handleMonthChange = (month: Date) => {
    setCurrentMonth(month);
  };

  const navigateToCustomer = (customerId: string, callerId: string | null) => {
    // Always use callerId for search if available, as it's the phone number
    if (callerId) {
      // Remove any formatting from the phone number
      const cleanNumber = callerId.replace(/\D/g, "");
      navigate(`/customers?search=${encodeURIComponent(cleanNumber)}`);
    } else {
      navigate(`/customers?search=${encodeURIComponent(customerId)}`);
    }
  };

  const handleAppointmentClick = (appointmentId: string) => {
    const appointment = allAppointments.find(
      (apt: Appointment) => apt.id === appointmentId,
    );
    if (appointment) {
      navigateToCustomer(appointment.customerId, appointment.callerId);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    // Update URL with search param
    if (value) {
      navigate(`?search=${encodeURIComponent(value)}`, { replace: true });
    } else {
      navigate("", { replace: true });
    }
  };

  const formatAppointmentTime = (dateTime: string) => {
    if (!clientInfo?.timezone) return moment.utc(dateTime).format("LLL");
    try {
      const ianaTimezone = convertTimezone(clientInfo.timezone);
      const tzMoment = moment.utc(dateTime).tz(ianaTimezone);
      const formattedTime = tzMoment.format("LLL z");

      return formattedTime;
    } catch (e) {
      console.warn("Invalid timezone:", clientInfo.timezone);
      return moment.utc(dateTime).format("LLL");
    }
  };

  // At the top of your component, define the campaign options
  const campaignOptions = useMemo(() => {
    if (!clientInfo?.campaigns) return [];

    return [
      { value: "all", label: "All Campaigns" },
      ...clientInfo.campaigns.map((campaign) => ({
        value: campaign.id,
        label: campaign.name || campaign.description,
      })),
    ];
  }, [clientInfo?.campaigns]);

  // Update the filteredAppointments useMemo to include search filtering
  const filteredAppointments = useMemo(() => {
    return (appointments || []).filter((appointment) => {
      const campaignMatch =
        selectedCampaignId === "all" ||
        appointment.campaignId === selectedCampaignId;

      if (!searchQuery) return campaignMatch;

      // Convert search term to lowercase once
      const searchLower = searchQuery.toLowerCase();
      const searchDigits = searchQuery.replace(/\D/g, "");

      // Check phone number fields first
      if (appointment.callerId) {
        const callerIdDigits = appointment.callerId.replace(/\D/g, "");
        if (callerIdDigits === searchDigits) return true;
      }

      // Then check all other fields
      const searchMatch = Object.entries(appointment).some(([, value]) => {
        if (value === null || value === undefined) return false;

        // Convert value to lowercase string for comparison
        const valueStr =
          typeof value === "object"
            ? JSON.stringify(value).toLowerCase()
            : String(value).toLowerCase();

        return valueStr.includes(searchLower);
      });

      return campaignMatch && searchMatch;
    });
  }, [appointments, selectedCampaignId, searchQuery]);

  // Convert appointments to AppointmentData type for calendar actions
  const appointmentsData: AppointmentData[] = useMemo(() => {
    return filteredAppointments.map((apt) => ({
      id: apt.id,
      customerId: apt.customerId,
      firstName: apt.firstName,
      lastName: apt.lastName,
      timezone: apt.timezone,
      state: apt.state,
      postalCode: apt.postalCode,
      appointmentDateTime: apt.appointmentDateTime,
      appointmentAttended: apt.appointmentAttended || false,
      campaignId: apt.campaignId,
      campaignName: apt.campaignName,
      callerId: apt.callerId,
    }));
  }, [filteredAppointments]);

  const handleAppointmentClose = () => {
    setSelectedAppointment(null);
  };

  return (
    <RootLayout topMetrics={getTopMetrics(todayMetrics)} hideKnowledgeSearch>
      {selectedAppointment && (
        <MemoizedAppointmentDetails
          key={selectedAppointment.id}
          appointment={selectedAppointment}
          onClose={handleAppointmentClose}
        />
      )}
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Column - Appointments List */}
          <div className="lg:w-[300px] flex-shrink-0 h-[500px] lg:h-[calc(100vh-12rem)] rounded-lg border">
            <div className="p-4 h-full">
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">
                    Upcoming Appointments
                  </h2>
                  <CalendarActions appointments={appointmentsData} />
                </div>
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input
                    placeholder="Search by phone number or name..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    className="pl-8"
                  />
                </div>
              </div>
              <div className="mt-3 space-y-2 overflow-y-auto h-[calc(100%-5rem)]">
                {isAppointmentsLoading ? (
                  <div className="flex items-center justify-center h-24">
                    <div className="animate-pulse text-gray-500">
                      Loading appointments...
                    </div>
                  </div>
                ) : filteredAppointments.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-24 text-gray-500">
                    <CalendarIcon className="h-8 w-8 mb-2 opacity-50" />
                    <p className="text-sm">No appointments found</p>
                  </div>
                ) : (
                  filteredAppointments.map((appointment: Appointment) => (
                    <div
                      key={appointment.id}
                      className={cn(
                        "relative group cursor-pointer",
                        "border rounded-lg p-3",
                        "hover:bg-black/5 transition-all duration-200",
                      )}
                      onClick={() =>
                        navigateToCustomer(
                          appointment.customerId,
                          appointment.callerId,
                        )
                      }
                    >
                      <div className="flex justify-between items-start gap-1">
                        <div className="min-w-0 flex-1">
                          <h3 className="font-medium text-gray-900 text-sm">
                            {appointment.firstName || appointment.lastName
                              ? `${appointment.firstName || ""} ${appointment.lastName || ""}`
                              : "Unnamed Customer"}
                          </h3>
                          <div className="mt-0.5 space-y-0.5">
                            <p className="text-xs font-medium text-gray-900">
                              {formatAppointmentTime(
                                appointment.appointmentDateTime,
                              )}
                            </p>
                            <p className="text-xs text-gray-600">
                              {appointment.campaignName}
                            </p>
                            {appointment.callerId && (
                              <p className="text-xs text-gray-600">
                                {appointment.callerId}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigateToCustomer(
                                appointment.customerId,
                                appointment.callerId,
                              );
                            }}
                            className={cn(
                              "text-gray-400 hover:text-blue-600",
                              "transition-colors duration-200",
                              "flex-shrink-0 h-6 w-6 flex items-center justify-center",
                              "hover:bg-gray-100 rounded-full",
                            )}
                            title={
                              appointment.callerId
                                ? `Search customer: ${appointment.callerId}`
                                : "Search customer"
                            }
                          >
                            <UserSearch size={16} />
                          </button>
                          <div onClick={(e) => e.stopPropagation()}>
                            {moment(appointment.appointmentDateTime).isAfter(
                              moment(),
                            ) && (
                              <AppointmentActions
                                appointment={{
                                  id: appointment.id,
                                  customerId: appointment.customerId,
                                  firstName: appointment.firstName,
                                  lastName: appointment.lastName,
                                  timezone: appointment.timezone,
                                  state: appointment.state,
                                  postalCode: appointment.postalCode,
                                  appointmentDateTime:
                                    appointment.appointmentDateTime,
                                  appointmentAttended:
                                    appointment.appointmentAttended || false,
                                  campaignId: appointment.campaignId,
                                  campaignName: appointment.campaignName,
                                  callerId: appointment.callerId,
                                }}
                                showCalendarOnly={true}
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Calendar */}
          <div className="flex-1 min-h-[500px] lg:min-h-[calc(100vh-12rem)] rounded-lg border overflow-hidden flex flex-col">
            <div className="flex-1 p-4">
              <AppointmentCalendar
                appointments={appointmentsData}
                month={currentMonth}
                onMonthChange={handleMonthChange}
                onAppointmentClick={handleAppointmentClick}
              />
            </div>
          </div>
        </div>
      </div>
    </RootLayout>
  );
}
