import { addHours, startOfDay } from 'date-fns';

export interface TimeSeriesDataPoint {
  timestamp: Date;
  Voicemail: number;
  Transferred: number;
  Busy: number;
  Blocked: number;
  'Do Not Call': number;
}

export interface CallVolumeDataPoint {
  timestamp: Date;
  Inbound: number;
  Outbound: number;
}

export function generateTimeSeriesData(): TimeSeriesDataPoint[] {
  const data: TimeSeriesDataPoint[] = [];
  const today = startOfDay(new Date());

  // Generate data for business hours (8am - 7pm)
  for (let hour = 8; hour <= 19; hour++) {
    data.push({
      timestamp: addHours(today, hour),
      Voicemail: Math.floor(Math.random() * 100) + 50,
      Transferred: Math.floor(Math.random() * 150) + 100,
      Busy: Math.floor(Math.random() * 100) + 50,
      Blocked: Math.floor(Math.random() * 80) + 20,
      'Do Not Call': Math.floor(Math.random() * 50) + 10,
    });
  }

  return data;
}

export function generateCallVolumeData(): CallVolumeDataPoint[] {
  const data: CallVolumeDataPoint[] = [];
  const today = startOfDay(new Date());

  // Generate data for business hours (8am - 7pm)
  for (let hour = 8; hour <= 19; hour++) {
    data.push({
      timestamp: addHours(today, hour),
      Inbound: Math.floor(Math.random() * 200) + 100,
      Outbound: Math.floor(Math.random() * 300) + 150,
    });
  }

  return data;
}