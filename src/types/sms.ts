export interface Campaign {
  id: string;
  name: string;
  type: string;
  status: string;
}

export interface Client {
  id: string;
  name: string;
  email?: string;
}

export interface SMS {
  id: string;
  clientId: string;
  campaignId: string | null;
  fromNumber: string;
  toNumber: string;
  direction: "inbound" | "outbound";
  tellsSmsId: string | null;
  smsType: string | null;
  smsCost: number;
  content: string | null;
  sentAt: string | null;
  createdAt: string;
  updatedAt: string;
  campaign?: Campaign | null;
  client?: Client | null;
}
