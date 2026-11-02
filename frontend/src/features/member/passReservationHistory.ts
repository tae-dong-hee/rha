import type { Reservation } from "@/api/generated/api";

export type PassReservationEvent = {
  id: number;
  reservation: Reservation;
  occurredAt: string | null;
  label: string;
  change: number;
};

/** Reservation events only; never infer historical balances or administrator adjustments. */
export function passReservationHistory(reservations: Reservation[], passId: number) {
  return reservations
    .filter((reservation) => reservation.pass.id === passId)
    .flatMap((reservation): PassReservationEvent[] => {
      const events: PassReservationEvent[] = [
        {
          id: reservation.id * 2,
          reservation,
          occurredAt: reservation.createdAt,
          label: "예약 차감",
          change: -1,
        },
      ];
      if (reservation.status === "CANCELED") {
        events.push({
          id: reservation.id * 2 + 1,
          reservation,
          occurredAt: reservation.canceledAt ?? null,
          label: reservation.canceledBy === "LESSON_CANCELED" ? "수업 취소 복구" : "예약 취소 복구",
          change: 1,
        });
      }
      return events;
    })
    .sort(
      (a, b) =>
        Date.parse(b.occurredAt ?? b.reservation.createdAt) -
          Date.parse(a.occurredAt ?? a.reservation.createdAt) || b.id - a.id,
    );
}
