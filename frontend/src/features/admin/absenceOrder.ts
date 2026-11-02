import type { Absence } from "@/api/generated/api";

// Sort the complete filtered result before splitting it into display pages.
export function sortAbsences<T extends Pick<Absence, "id" | "status" | "startAt">>(rows: T[]) {
  return [...rows].sort(
    (a, b) =>
      Number(b.status === "REQUESTED") - Number(a.status === "REQUESTED") ||
      Date.parse(a.startAt) - Date.parse(b.startAt) ||
      b.id - a.id,
  );
}
