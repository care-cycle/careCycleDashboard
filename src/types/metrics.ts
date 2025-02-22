export interface MetricsResponse {
  success: boolean;
  data: {
    total: HourlyMetric[];
    [campaignId: string]: HourlyMetric[];
  };
}

export interface HourlyMetric {
  hour: string;
  hourFormatted: string;
  dateFormatted: string;
  inbound: number;
  outbound: number;
  total: number;
  dispositionCounts: {
    Voicemail?: number;
    Transferred?: number;
    "Busy/No Answer"?: number;
    "Not Interested"?: number;
    [key: string]: number | undefined;
  };
}
