export interface Call {
  id: string;
  campaignId: string;
  disposition: string;
  callerId: string;
  createdAt: string;
  recordingUrl: string;
  duration: string;
  assistantType: string;
  successEvaluation: string;
  summary: string;
  transcript: string;
  direction: "inbound" | "outbound";
  cost: number;
  testFlag: boolean;
  source?: string | null;
}
