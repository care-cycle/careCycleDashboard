export interface CustomData {
  agentName?: string;
  carrierName?: string;
  effectiveDate?: string;
  enrollmentDate?: string;
  [key: string]: any;
}

export interface Customer {
  id: string;
  firstName: string;
  lastName?: string;
  callerId?: string;
  email?: string;
  state?: string;
  timezone?: string;
  postalCode?: string;
  campaigns?: Array<{
    campaign_id: string;
    campaign_name: string;
    campaign_status: string;
  }>;
  totalCalls?: number;
  lastCallDate?: string;
  smsConsent?: boolean;
  doNotContact?: boolean;
  customData?: {
    [key: string]: any;
  };
}
