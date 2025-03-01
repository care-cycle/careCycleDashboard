import moment from "moment-timezone";

// Define a local appointment type that matches what we need
export interface AppointmentData {
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

/**
 * Converts common timezone names to IANA format
 */
export const convertTimezone = (timezone: string | null): string => {
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

/**
 * Generates an iCalendar (.ics) file content for a single appointment
 */
export const generateICSForAppointment = (
  appointment: AppointmentData,
): string => {
  try {
    const ianaTimezone = convertTimezone(appointment.timezone);
    const startDate = moment(appointment.appointmentDateTime).tz(ianaTimezone);
    // Default appointment duration is 30 minutes if not specified
    const endDate = startDate.clone().add(30, "minutes");

    const customerName =
      appointment.firstName || appointment.lastName
        ? `${appointment.firstName || ""} ${appointment.lastName || ""}`.trim()
        : "Unnamed Customer";

    const summary = `Appointment with ${customerName}`;
    const description = `Campaign: ${appointment.campaignName || "N/A"}\nPhone: ${appointment.callerId || "N/A"}`;
    const location = appointment.state
      ? `${appointment.state}${appointment.postalCode ? `, ${appointment.postalCode}` : ""}`
      : "";

    // Format dates according to iCalendar spec (UTC format)
    const formatDate = (date: moment.Moment) =>
      date.utc().format("YYYYMMDDTHHmmss") + "Z";
    const now = moment().utc().format("YYYYMMDDTHHmmss") + "Z";

    return [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Nodable//Appointment Calendar//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "BEGIN:VEVENT",
      `UID:${appointment.id}@nodable.com`,
      `DTSTAMP:${now}`,
      `DTSTART:${formatDate(startDate)}`,
      `DTEND:${formatDate(endDate)}`,
      `SUMMARY:${summary}`,
      `DESCRIPTION:${description.replace(/\n/g, "\\n")}`,
      location ? `LOCATION:${location}` : "",
      "END:VEVENT",
      "END:VCALENDAR",
    ]
      .filter(Boolean)
      .join("\r\n");
  } catch (error) {
    console.error("Error generating ICS file:", error);
    return "";
  }
};

/**
 * Generates an iCalendar (.ics) file content for multiple appointments
 */
export const generateICSForAppointments = (
  appointments: AppointmentData[],
): string => {
  try {
    const calendarHeader = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Nodable//Appointment Calendar//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
    ].join("\r\n");

    const calendarFooter = "END:VCALENDAR";

    const events = appointments
      .map((appointment) => {
        const ianaTimezone = convertTimezone(appointment.timezone);
        const startDate = moment(appointment.appointmentDateTime).tz(
          ianaTimezone,
        );
        const endDate = startDate.clone().add(30, "minutes");

        const customerName =
          appointment.firstName || appointment.lastName
            ? `${appointment.firstName || ""} ${appointment.lastName || ""}`.trim()
            : "Unnamed Customer";

        const summary = `Appointment with ${customerName}`;
        const description = `Campaign: ${appointment.campaignName || "N/A"}\nPhone: ${appointment.callerId || "N/A"}`;
        const location = appointment.state
          ? `${appointment.state}${appointment.postalCode ? `, ${appointment.postalCode}` : ""}`
          : "";

        // Format dates according to iCalendar spec (UTC format)
        const formatDate = (date: moment.Moment) =>
          date.utc().format("YYYYMMDDTHHmmss") + "Z";
        const now = moment().utc().format("YYYYMMDDTHHmmss") + "Z";

        return [
          "BEGIN:VEVENT",
          `UID:${appointment.id}@nodable.com`,
          `DTSTAMP:${now}`,
          `DTSTART:${formatDate(startDate)}`,
          `DTEND:${formatDate(endDate)}`,
          `SUMMARY:${summary}`,
          `DESCRIPTION:${description.replace(/\n/g, "\\n")}`,
          location ? `LOCATION:${location}` : "",
          "END:VEVENT",
        ]
          .filter(Boolean)
          .join("\r\n");
      })
      .join("\r\n");

    return `${calendarHeader}\r\n${events}\r\n${calendarFooter}`;
  } catch (error) {
    console.error(
      "Error generating ICS file for multiple appointments:",
      error,
    );
    return "";
  }
};

/**
 * Creates a Google Calendar event URL for a single appointment
 */
export const createGoogleCalendarUrl = (
  appointment: AppointmentData,
): string => {
  try {
    const ianaTimezone = convertTimezone(appointment.timezone);
    const startDate = moment(appointment.appointmentDateTime).tz(ianaTimezone);
    const endDate = startDate.clone().add(30, "minutes");

    const customerName =
      appointment.firstName || appointment.lastName
        ? `${appointment.firstName || ""} ${appointment.lastName || ""}`.trim()
        : "Unnamed Customer";

    const summary = `Appointment with ${customerName}`;
    const description = `Campaign: ${appointment.campaignName || "N/A"}\nPhone: ${appointment.callerId || "N/A"}`;
    const location = appointment.state
      ? `${appointment.state}${appointment.postalCode ? `, ${appointment.postalCode}` : ""}`
      : "";

    // Format dates for Google Calendar URL
    const formatDate = (date: moment.Moment) =>
      date.format("YYYYMMDDTHHmmss") + "Z";

    const params = new URLSearchParams({
      action: "TEMPLATE",
      text: summary,
      dates: `${formatDate(startDate)}/${formatDate(endDate)}`,
      details: description,
    });

    if (location) {
      params.append("location", location);
    }

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  } catch (error) {
    console.error("Error creating Google Calendar URL:", error);
    return "";
  }
};

/**
 * Creates a Google Calendar URL for multiple appointments
 * This uses Google Calendar's ability to add multiple events at once
 */
export const createBatchGoogleCalendarUrl = (
  appointments: AppointmentData[],
): string => {
  if (!appointments.length) return "";

  try {
    // We'll create a URL that opens multiple tabs, one for each appointment
    // This is more reliable than trying to batch import, which Google doesn't directly support
    // via URL parameters

    // First, create individual URLs for each appointment
    const urls = appointments.map((appointment) => {
      const ianaTimezone = convertTimezone(appointment.timezone);
      const startDate = moment(appointment.appointmentDateTime).tz(
        ianaTimezone,
      );
      const endDate = startDate.clone().add(30, "minutes");

      const customerName =
        appointment.firstName || appointment.lastName
          ? `${appointment.firstName || ""} ${appointment.lastName || ""}`.trim()
          : "Unnamed Customer";

      const summary = `Appointment with ${customerName}`;
      const description = `Campaign: ${appointment.campaignName || "N/A"}\nPhone: ${appointment.callerId || "N/A"}`;
      const location = appointment.state
        ? `${appointment.state}${appointment.postalCode ? `, ${appointment.postalCode}` : ""}`
        : "";

      // Format dates for Google Calendar URL
      const formatDate = (date: moment.Moment) =>
        date.format("YYYYMMDDTHHmmss") + "Z";

      const params = new URLSearchParams({
        action: "TEMPLATE",
        text: summary,
        dates: `${formatDate(startDate)}/${formatDate(endDate)}`,
        details: description,
      });

      if (location) {
        params.append("location", location);
      }

      return `https://calendar.google.com/calendar/render?${params.toString()}`;
    });

    // For the first appointment, we'll open it directly
    return urls[0];
  } catch (error) {
    console.error("Error creating batch Google Calendar URL:", error);
    return "";
  }
};

/**
 * Downloads a file with the given content and filename
 */
export const downloadFile = (content: string, filename: string): void => {
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
