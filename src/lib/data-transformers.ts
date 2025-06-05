import { Call } from "@/types/calls";

/**
 * Raw API response format for calls (abbreviated field names)
 */
interface RawCallData {
  i: string; // id
  cid: string; // campaignId
  d: string; // disposition
  ca: string; // callerId
  cr: string; // createdAt
  r: string; // recordingUrl
  du: string; // duration
  at: string; // assistantType
  se: string; // successEvaluation
  su: string; // summary
  tr: string; // transcript
  di: "i" | "o"; // direction
  co: number; // cost
  tf: boolean; // testFlag
  s?: string | null; // source
  ts?: string | null; // twilioSid
  nr?: string | null; // nodableRecordingUrl
  sr?: string | null; // stereoRecordingUrl
}

/**
 * Transforms raw API call data to the Call interface
 * @param rawCall - Raw call data from API
 * @returns Transformed Call object
 */
export function transformApiCallToCall(rawCall: RawCallData): Call {
  return {
    id: rawCall.i,
    campaignId: rawCall.cid,
    disposition: rawCall.d,
    callerId: rawCall.ca,
    createdAt: rawCall.cr,
    recordingUrl: rawCall.r,
    duration: rawCall.du,
    assistantType: rawCall.at,
    successEvaluation: rawCall.se,
    summary: rawCall.su,
    transcript: rawCall.tr,
    direction: rawCall.di === "i" ? "inbound" : "outbound",
    cost: rawCall.co,
    testFlag: rawCall.tf,
    source: rawCall.s || undefined,
    // Call system identification and additional recording URLs
    twilioSid: rawCall.ts || undefined,
    nodableRecordingUrl: rawCall.nr || undefined,
    stereoRecordingUrl: rawCall.sr || undefined,
  };
}

/**
 * Transforms an array of raw API call data to Call objects
 * @param rawCalls - Array of raw call data from API
 * @returns Array of transformed Call objects
 */
export function transformApiCallsToCallArray(rawCalls: RawCallData[]): Call[] {
  return rawCalls.map(transformApiCallToCall);
}

/**
 * Parses duration string (e.g., "2m 30s") to milliseconds
 * @param durationString - Duration in format "2m 30s"
 * @returns Duration in milliseconds
 */
export function parseDurationToMs(durationString: string): number {
  if (!durationString) return 0;

  const match = durationString.match(/(\d+)m\s*(\d+)s/);
  if (match) {
    const minutes = parseInt(match[1], 10);
    const seconds = parseInt(match[2], 10);
    return (minutes * 60 + seconds) * 1000;
  }
  return 0;
}
