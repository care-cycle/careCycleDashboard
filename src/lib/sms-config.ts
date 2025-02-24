import type { SmsContent } from "@/types/campaign";

export const DEFAULT_SMS_CONTENT: SmsContent = {
  redial:
    "Hi {{clientCustomer.firstName}}, we tried to reach you but couldn't connect. We'll try again soon.",
  firstContact:
    "Hi {{clientCustomer.firstName}}, we'll be calling you shortly regarding your inquiry.",
  appointmentBooked:
    "Hi {{clientCustomer.firstName}}, your appointment is confirmed for {{appointmentDate}} at {{appointmentTime}}.",
  missedAppointment:
    "Hi {{clientCustomer.firstName}}, we missed you at your appointment on {{appointmentDate}} at {{appointmentTime}}. Please contact us to reschedule.",
  missedFirstContact:
    "Hi {{clientCustomer.firstName}}, we tried to reach you but couldn't connect. We'll try again soon.",
  appointmentReminder:
    "Hi {{clientCustomer.firstName}}, this is a reminder about your upcoming appointment on {{appointmentDate}} at {{appointmentTime}}.",
  missedInquiry:
    "Hi {{clientCustomer.firstName}}, we tried to reach you regarding your inquiry but couldn't connect. Please contact us back at your earliest convenience.",
};
