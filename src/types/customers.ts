export interface CustomData {
  agentName?: string;
  carrierName?: string;
  effectiveDate?: string;
  enrollmentDate?: string;
  [key: string]: any;
}

export interface Customer {
  id: string;
  clientId: string;
  callerId: string;
  firstName: string;
  lastName: string;
  email: string | null;
  state: string | null;
  timezone: string | null;
  totalCalls: number;
  lastCallDate: string;
  activeCampaigns: number;
  customData: CustomData;
  dateOfBirth?: string;
  language?: string | null;
  postalCode?: string;
  do_not_contact?: boolean;
  sms_consent?: boolean;
} 