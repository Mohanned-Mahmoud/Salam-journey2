/**
 * Cal.com API helper
 * Docs: https://cal.com/docs/api-reference/v2/bookings/create-a-booking
 *
 * Required env vars:
 *   CAL_API_KEY        — Cal.com API key (Settings → Developer → API Keys)
 *   CAL_EVENT_TYPE_ID  — Numeric ID of the Event Type (from the URL in Cal.com)
 *   CAL_TIMEZONE       — Timezone string, e.g. "Africa/Cairo" (default: Africa/Cairo)
 */

const CAL_BASE = "https://api.cal.com/v2";

export interface CalBookingInput {
  name: string;
  email: string;
  /** YYYY-MM-DD */
  date: string;
  /** HH:mm  (24-hour, local time of CAL_TIMEZONE) */
  time: string;
  /** Extra notes shown in the Cal.com event */
  notes?: string;
  /** Guest phone / WhatsApp */
  phone?: string;
}

export interface CalBookingResult {
  /** Cal.com booking uid */
  uid: string;
  /** Cal.com meeting link / video URL if any */
  meetingUrl?: string;
}

export class CalComConflictError extends Error {
  constructor(message = "Cal.com: that slot is no longer available.") {
    super(message);
    this.name = "CalComConflictError";
  }
}

/**
 * Creates a booking on Cal.com and returns the booking uid.
 * Throws CalComConflictError when the slot was taken simultaneously.
 */
export async function createCalBooking(
  input: CalBookingInput,
): Promise<CalBookingResult> {
  const apiKey = process.env.CAL_API_KEY;
  const eventTypeId = Number(process.env.CAL_EVENT_TYPE_ID);
  const timezone = process.env.CAL_TIMEZONE ?? "Africa/Cairo";

  if (!apiKey || !eventTypeId) {
    // Cal.com not configured — skip gracefully
    return { uid: "" };
  }

  // Build ISO start time: combine date + time + timezone offset
  // Cal.com v2 accepts ISO 8601 with timezone in the body.
  const startTime = `${input.date}T${input.time}:00`;

  const body = {
    start: startTime,
    eventTypeId,
    attendee: {
      name: input.name,
      email: input.email,
      timeZone: timezone,
      language: "ar",
    },
    metadata: {
      ...(input.phone ? { phone: input.phone } : {}),
      source: "salam-journey-website",
    },
    ...(input.notes ? { notes: input.notes } : {}),
  };

  const response = await fetch(`${CAL_BASE}/bookings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "cal-api-version": "2024-08-13",
    },
    body: JSON.stringify(body),
  });

  const json = (await response.json()) as any;

  if (!response.ok) {
    const message: string = json?.error?.message ?? json?.message ?? response.statusText;
    // 409 or "already booked" style errors → conflict
    if (response.status === 409 || message.toLowerCase().includes("slot")) {
      throw new CalComConflictError(message);
    }
    throw new Error(`Cal.com booking failed (${response.status}): ${message}`);
  }

  const data = json?.data ?? json;
  return {
    uid: data?.uid ?? data?.id ?? "",
    meetingUrl: data?.meetingUrl ?? data?.videoCallData?.url,
  };
}

/**
 * Cancels a booking on Cal.com by uid.
 * Safe to call even if Cal.com is not configured (returns false).
 */
export async function cancelCalBooking(uid: string): Promise<boolean> {
  const apiKey = process.env.CAL_API_KEY;
  if (!apiKey || !uid) return false;

  const response = await fetch(`${CAL_BASE}/bookings/${uid}/cancel`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "cal-api-version": "2024-08-13",
    },
    body: JSON.stringify({ cancellationReason: "Cancelled by host" }),
  });

  return response.ok;
}
