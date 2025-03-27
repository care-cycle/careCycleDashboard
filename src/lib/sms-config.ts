import type { SmsContent } from "@/types/campaign";

export const DEFAULT_SMS_CONTENT: SmsContent = {
  redial:
    "Hi {{clientCustomer.firstName}}, we tried to reach you but couldn't connect. We'll try again shortly.",
  firstContact:
    "Hi {{clientCustomer.firstName}}, we'll be calling you shortly to discuss your application.",
  appointmentBooked:
    "Hi {{clientCustomer.firstName}}, your appointment has been scheduled for {{appointmentDate}}. We look forward to speaking with you.",
  missedAppointment:
    "Hi {{clientCustomer.firstName}}, we noticed you missed your scheduled appointment. We'll be calling you shortly to reschedule.",
  missedFirstContact:
    "Hi {{clientCustomer.firstName}}, we tried to reach you but couldn't connect. We'll try again shortly.",
  appointmentReminder:
    "Hi {{clientCustomer.firstName}}, this is a reminder that you have an appointment scheduled for {{appointmentDate}}. We look forward to speaking with you.",
  INFORMATIONAL_FOLLOWUP:
    "Hi {{clientCustomer.firstName}}, thank you for your time today. Here's a summary of what we discussed: {{callSummary}}. If you have any questions, please don't hesitate to reach out.",
  missedInquiry:
    "Hi {{clientCustomer.firstName}}, we tried to reach you but couldn't connect. We'll try again shortly.",
};
