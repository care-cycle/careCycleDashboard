export interface RetryPattern {
  days: {
    start: number;
    end: number;
  };
  attempts: number;
  intervalMinutes: number;
}

export interface RetryBehavior {
  onDayComplete: "NEXT_DAY_START" | "NEXT_PATTERN";
  onPatternComplete: "COOLDOWN" | "END";
  onCooldownComplete: "END";
}

export interface RetrySettings {
  cooldownPeriod: {
    hours: number;
    afterAttempts: number;
  };
  retryBehavior: RetryBehavior;
}

export interface SmsTypes {
  redial: boolean;
  firstContact: boolean;
  appointmentBooked: boolean;
  missedAppointment: boolean;
  missedFirstContact: boolean;
  appointmentReminder: boolean;
}

export interface SmsContent {
  redial: string;
  firstContact: string;
  appointmentBooked: string;
  missedAppointment: string;
  missedFirstContact: string;
  appointmentReminder: string;
}

export interface CustomerStats {
  total: number;
  metSuccessCriteria: number;
  metFailureCriteria: number;
  pending: number;
  remainingToCall: number;
  totalCalls: number;
  totalSources: number;
  statusCounts: {
    expired: number;
    failed: number;
    pending: number;
    completed: number;
    exceeded_max_calls: number;
    in_progress: number;
    cancelled: number;
    skipped: number;
  };
  successCriteria: {
    transferred?: number;
    disposition?: number;
    leadStatus?: number;
  };
  failureCriteria: {
    "Do Not Contact"?: number;
    disposition?: number;
    leadStatus?: number;
  };
}

export interface Campaign {
  id: string;
  name: string;
  type: string;
  description?: string;
  status: string;
  smsCompanyName?: string;
  companyName?: string;
  retryStrategy?: string;
  retryDelays?: number[];
  retryDelaysInput?: string;
  retryPatterns?: any[];
  retrySettings?: {
    cooldownPeriod: {
      hours: number;
      afterAttempts: number;
    };
    retryBehavior: {
      onDayComplete: string;
      onPatternComplete: string;
      onCooldownComplete: string;
    };
  };
  successCriteria?: {
    operator: string;
    conditions: Array<{
      field: string;
      operator: string;
      value: boolean;
    }>;
  };
  failureCriteria?: {
    operator: string;
    conditions: Array<{
      field: string;
      operator: string;
      value: boolean;
    }>;
  };
  maxAttempts?: number;
  smsTypes?: SmsTypes;
  smsContent?: SmsContent;
  metrics?: {
    customers: number;
    calls: number;
    sources: number;
    customersByStatus: {
      pending: number;
      in_progress: number;
      completed: number;
      failed: number;
      expired: number;
      cancelled: number;
      skipped: number;
      exceeded_max_calls: number;
    };
  };
  customerStats?: {
    total: number;
    totalCalls: number;
    totalSources: number;
    statusCounts: {
      pending: number;
      in_progress: number;
      completed: number;
      failed: number;
      expired: number;
      cancelled: number;
      skipped: number;
      exceeded_max_calls: number;
    };
  };
}
