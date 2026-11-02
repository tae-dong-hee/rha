import type { Absence, Lesson } from "@/api/generated/api";

/** Apply overlap filtering before pagination; touching interval endpoints do not overlap. */
export function overlappingLessons(
  lessons: Lesson[],
  absence: Pick<Absence, "instructor" | "startAt" | "endAt">,
): Lesson[] {
  const start = Date.parse(absence.startAt);
  const end = Date.parse(absence.endAt);
  return lessons.filter(
    (lesson) =>
      lesson.instructor.id === absence.instructor.id &&
      lesson.status !== "CANCELED" &&
      Date.parse(lesson.startAt) < end &&
      Date.parse(lesson.endAt) > start,
  );
}
