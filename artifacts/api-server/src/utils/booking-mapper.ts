export function asIsoString(value: string | Date | undefined | null): string {
  if (!value) return "";
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

export function mapBookingToFrontend(booking: any) {
  if (!booking) return null;
  return {
    id: booking.id,
    date: booking.date,
    slot: booking.slot,
    sessionType: booking.sessionType,
    bookingKind: booking.bookingKind,
    packageSessionsTotal: booking.packageSessionsTotal,
    packageSessionsRemaining: booking.packageSessionsRemaining,
    topic: booking.topic,
    notes: booking.notes,
    name: booking.guestName,
    email: booking.guestEmail,
    whatsapp: booking.guestWhatsapp,
    status: booking.status,
    createdAt: asIsoString(booking.createdAt),
    userId: booking.userId,
    coachId: booking.coachId,
  };
}

export function mapBookingsToFrontend(bookings: any[]) {
  if (!bookings) return [];
  return bookings.map(mapBookingToFrontend).filter(Boolean);
}
