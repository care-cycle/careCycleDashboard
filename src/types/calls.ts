export interface Call {
  id: string;
  agent: string;
  duration: string;
  direction: 'Inbound' | 'Outbound';
  disposition: string;
  performance: string;
  endedBy: string;
} 