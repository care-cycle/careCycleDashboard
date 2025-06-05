import WaveSurfer from "wavesurfer.js";

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
  preloadedWaveform?: WaveSurfer;
  preloadedAudio?: HTMLAudioElement | null;
  // Call system identification (vapiUuid is NOT exposed to frontend for security)
  twilioSid?: string;
  // Additional recording URLs (filtered to exclude vapi URLs)
  nodableRecordingUrl?: string;
  stereoRecordingUrl?: string;
}
