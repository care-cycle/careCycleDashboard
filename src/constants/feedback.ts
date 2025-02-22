export const SITE_FEEDBACK_TYPES = {
  // UI/UX
  UI_USABILITY: "ui_usability",
  UI_DESIGN: "ui_design",
  // Performance
  PERFORMANCE_SPEED: "performance_speed",
  PERFORMANCE_RESPONSIVENESS: "performance_responsiveness",
  // Features
  FEATURE_REQUEST: "feature_request",
  FEATURE_IMPROVEMENT: "feature_improvement",
  // Bugs
  BUG_REPORT: "bug_report",
  // Other
  OTHER_FEEDBACK: "other_feedback",
} as const;

export const SITE_SEVERITY_LEVELS = {
  HIGH: "high",
  MEDIUM: "medium",
  LOW: "low",
} as const;

// Call feedback types
export const CALL_FEEDBACK_TYPES = {
  "Bot Behavior": {
    BOT_OFF_SCRIPT: "bot_off_script",
    BOT_INCORRECT_INFO: "bot_incorrect_info",
    BOT_MISSED_INTENT: "bot_missed_intent",
    BOT_TRANSFER_ISSUE: "bot_transfer_issue",
  },
  "Technical Issues": {
    AUDIO_QUALITY: "audio_quality",
    CALL_DROPPED: "call_dropped",
    SYSTEM_ERROR: "system_error",
  },
  "Disposition Issues": {
    WRONG_DISPOSITION: "wrong_disposition",
    MISSED_QUALIFICATION: "missed_qualification",
    WRONG_CAMPAIGN: "wrong_campaign",
  },
  Compliance: {
    COMPLIANCE_VIOLATION: "compliance_violation",
    VERIFICATION_ISSUE: "verification_issue",
  },
  "Customer Data": {
    WRONG_CUSTOMER_DATA: "wrong_customer_data",
    MISSING_DATA: "missing_data",
  },
  Other: {
    OTHER_CRITICAL: "other_critical",
    OTHER_FEEDBACK: "other_feedback",
  },
} as const;

export const CALL_SEVERITY_LEVELS = {
  CRITICAL: "critical",
  HIGH: "high",
  MEDIUM: "medium",
  LOW: "low",
} as const;
