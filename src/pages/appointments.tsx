import { useEffect, useState, useMemo } from 'react';
import { AppointmentCalendar } from '@/components/ui/appointment-calendar';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Search, Calendar as CalendarIcon, UserSearch } from 'lucide-react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import moment from 'moment-timezone';
import { useClientData, useInitialData } from '@/hooks/use-client-data';
import { RootLayout } from '@/components/layout/root-layout';
import { cn } from '@/lib/utils';
import { getTopMetrics } from '@/lib/metrics';
import { Input } from '@/components/ui/input';

interface Appointment {
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

export default function Appointments() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { clientInfo, fetchAppointments } = useClientData();
  const { todayMetrics, appointments: initialAppointments, isAppointmentsLoading } = useInitialData();
  const [allAppointments, setAllAppointments] = useState<Appointment[]>(initialAppointments);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get('search') || '');
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  // Handle URL search param
  useEffect(() => {
    const searchFromUrl = searchParams.get('search');
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
          title: 'Error',
          description: 'Failed to load appointments',
          variant: 'destructive',
        });
      }
    };

    loadAppointments();
  }, []); // Only load once on mount

  // Filter appointments for the current month view
  const appointments = useMemo(() => {
    return allAppointments.filter(appointment => {
      const appointmentDate = new Date(appointment.appointmentDateTime);
      return appointmentDate.getMonth() === currentMonth.getMonth() &&
             appointmentDate.getFullYear() === currentMonth.getFullYear();
    });
  }, [allAppointments, currentMonth]);

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
  };

  const handleMonthChange = (month: Date) => {
    setCurrentMonth(month);
  };

  const navigateToCustomer = (customerId: string, callerId: string | null) => {
    // Always use callerId for search if available, as it's the phone number
    if (callerId) {
      // Remove any formatting from the phone number
      const cleanNumber = callerId.replace(/\D/g, '');
      navigate(`/customers?search=${encodeURIComponent(cleanNumber)}`);
    } else {
      navigate(`/customers?search=${encodeURIComponent(customerId)}`);
    }
  };

  const handleAppointmentClick = (appointmentId: string) => {
    const appointment = allAppointments.find((apt: Appointment) => apt.id === appointmentId);
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
      navigate('', { replace: true });
    }
  };

  const convertTimezone = (timezone: string | null): string => {
    if (!timezone) return 'America/New_York';
    
    // Convert common timezone names to IANA format
    const timezoneMap: Record<string, string> = {
      'Eastern': 'America/New_York',
      'Central': 'America/Chicago',
      'Mountain': 'America/Denver',
      'Pacific': 'America/Los_Angeles',
    };

    return timezoneMap[timezone] || timezone;
  };

  const formatAppointmentTime = (dateTime: string) => {
    if (!clientInfo?.timezone) return moment(dateTime).format('LLL');
    try {
      const ianaTimezone = convertTimezone(clientInfo.timezone);
      return moment(dateTime).tz(ianaTimezone).format('LLL z');
    } catch (e) {
      console.warn('Invalid timezone:', clientInfo.timezone);
      return moment(dateTime).format('LLL');
    }
  };

  // Filter appointments based on search query
  const filteredAppointments = useMemo(() => {
    if (!searchQuery) {
      // If no search query, show future appointments
      return allAppointments.filter(appointment => {
        let appointmentDate;
        try {
          const ianaTimezone = convertTimezone(appointment.timezone);
          appointmentDate = moment(appointment.appointmentDateTime).tz(ianaTimezone);
        } catch (e) {
          console.warn('Invalid timezone:', appointment.timezone);
          appointmentDate = moment(appointment.appointmentDateTime).tz('America/New_York');
        }
        
        return appointmentDate.isAfter(moment());
      });
    }

    // If there's a search query, search through all appointments
    const searchLower = searchQuery.toLowerCase();
    const searchDigits = searchQuery.replace(/\D/g, '');
    
    return allAppointments.filter(appointment => {
      // Check phone number (callerId)
      if (appointment.callerId) {
        const callerIdDigits = appointment.callerId.replace(/\D/g, '');
        if (callerIdDigits.includes(searchDigits)) return true;
      }

      // Then check other fields
      return (
        (appointment.firstName?.toLowerCase() || '').includes(searchLower) ||
        (appointment.lastName?.toLowerCase() || '').includes(searchLower) ||
        (appointment.customerId.toLowerCase()).includes(searchLower) ||
        (appointment.campaignName.toLowerCase()).includes(searchLower)
      );
    });
  }, [allAppointments, searchQuery]);

  return (
    <RootLayout hideKnowledgeSearch topMetrics={getTopMetrics(todayMetrics)}>
      <div className="flex flex-col lg:flex-row gap-6 px-6 py-4 min-h-[calc(100vh-8rem)] lg:h-[calc(100vh-8rem)]">
        {/* Left Column - Appointments List */}
        <Card className="relative overflow-hidden lg:w-1/5 h-[500px] lg:h-auto">
          <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-white/20 backdrop-blur-xl" />
          <div className="relative p-4 h-full">
            <div className="flex flex-col gap-3">
              <h2 className="text-lg font-semibold">Upcoming Appointments</h2>
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
                  <div className="animate-pulse text-gray-500">Loading appointments...</div>
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
                      "border border-white/30 rounded-lg p-3",
                      "bg-white/40 backdrop-blur-sm",
                      "hover:bg-white/60 transition-all duration-200",
                      "shadow-sm hover:shadow-md"
                    )}
                    onClick={() => navigateToCustomer(appointment.customerId, appointment.callerId)}
                  >
                    <div className="flex justify-between items-start gap-1">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-medium text-gray-900 text-sm">
                          {appointment.firstName || appointment.lastName ? (
                            `${appointment.firstName || ''} ${appointment.lastName || ''}`
                          ) : (
                            'Unnamed Customer'
                          )}
                        </h3>
                        <div className="mt-0.5 space-y-0.5">
                          <p className="text-xs font-medium text-gray-900">
                            {formatAppointmentTime(appointment.appointmentDateTime)}
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
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigateToCustomer(appointment.customerId, appointment.callerId);
                        }}
                        className={cn(
                          "text-gray-400 hover:text-gray-900",
                          "transition-colors duration-200",
                          "flex-shrink-0 ml-2"
                        )}
                        title={appointment.callerId ? `Search by ${appointment.callerId}` : "Search customer"}
                      >
                        <UserSearch size={16} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </Card>

        {/* Right Column - Calendar */}
        <Card className="relative overflow-hidden flex-1 flex flex-col">
          <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-white/20 backdrop-blur-xl" />
          <div className="relative flex-1 flex flex-col">
            <AppointmentCalendar
              selected={selectedDate}
              onSelect={handleDateSelect}
              onMonthChange={handleMonthChange}
              appointments={appointments}
              onAppointmentClick={handleAppointmentClick}
            />
          </div>
        </Card>
      </div>
    </RootLayout>
  );
}