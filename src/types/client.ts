export interface Campaign {
  name: string;
  description: string | null;
  status: string;
  type: string;
  enabled: boolean;
  appointmentBookedSmsEnabled: boolean;
  appointmentBookedSmsContent: string | null;
  appointmentReminderSmsEnabled: boolean;
  appointmentReminderSmsContent: string | null;
  startDate: Date | null;
  endDate: Date | null;
}

export interface PaymentMethod {
  last4: string;
  expMonth: number;
  expYear: number;
  brand: string;
}

export interface ClientInfo {
  // Required fields
  id: string;
  name: string;

  // Optional fields
  email?: string;
  pricePerCallMs: string;
  pricePerSms: string;
  availableBalance: string;
  totalCallSpend: string;
  totalSmsSpend: string;
  topUpThreshold?: string;
  topUpAmount?: string;
  enableTopUp: boolean;
  associatedNumbers?: string[];
  customDataSchema?: Record<string, unknown>;
  createdAt: string;

  // Computed fields
  organizationId: string | null;
  isPersonal: boolean;
  paymentMethod: PaymentMethod | null;
  campaigns: Campaign[];
}
