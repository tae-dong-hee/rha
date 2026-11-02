import { test } from "node:test";
import assert from "node:assert/strict";
import { overlappingLessons } from "../src/features/admin/absenceLessons.ts";

const absence = {
  instructor: { id: 6 },
  startAt: "2026-12-17T09:00:00+09:00",
  endAt: "2026-12-17T18:00:00+09:00",
};
const lesson = (id, startAt, endAt, extra = {}) => ({
  id,
  startAt,
  endAt,
  instructor: { id: 6 },
  status: "PUBLISHED",
  ...extra,
});

test("부재 시작 전부터 이어지는 수업과 부재 기간 내부·전체를 덮는 수업을 포함한다", () => {
  const rows = [
    lesson(1, "2026-12-16T23:00:00Z", "2026-12-17T01:00:00Z"),
    lesson(2, "2026-12-17T01:00:00Z", "2026-12-17T02:00:00Z"),
    lesson(3, "2026-12-16T23:00:00Z", "2026-12-17T10:00:00Z"),
    lesson(4, "2026-12-17T08:00:00Z", "2026-12-17T10:00:00Z"),
  ];
  assert.deepEqual(overlappingLessons(rows, absence), rows);
});

test("경계만 맞닿는 수업, 취소된 수업, 다른 강사의 수업은 제외한다", () => {
  const rows = [
    lesson(1, "2026-12-16T23:00:00Z", "2026-12-17T00:00:00Z"),
    lesson(2, "2026-12-17T09:00:00Z", "2026-12-17T10:00:00Z"),
    lesson(3, "2026-12-17T01:00:00Z", "2026-12-17T02:00:00Z", { status: "CANCELED" }),
    lesson(4, "2026-12-17T01:00:00Z", "2026-12-17T02:00:00Z", { instructor: { id: 7 } }),
  ];
  assert.deepEqual(overlappingLessons(rows, absence), []);
});

test("첫 서버 페이지가 전부 과거 수업이어도 다음 페이지의 겹치는 수업을 누락하지 않는다", () => {
  const firstPage = Array.from({ length: 100 }, (_, i) =>
    lesson(i + 1, "2026-11-01T00:00:00Z", "2026-11-01T01:00:00Z"),
  );
  const nextPage = Array.from({ length: 11 }, (_, i) =>
    lesson(i + 101, "2026-12-17T01:00:00Z", "2026-12-17T02:00:00Z"),
  );
  const rows = overlappingLessons([...firstPage, ...nextPage], absence);
  assert.equal(rows.length, 11);
  assert.deepEqual(
    rows.slice(0, 10).map((row) => row.id),
    [101, 102, 103, 104, 105, 106, 107, 108, 109, 110],
  );
  assert.deepEqual(
    rows.slice(10).map((row) => row.id),
    [111],
  );
  assert.deepEqual(overlappingLessons(firstPage, absence), []);
  assert.deepEqual(overlappingLessons([], absence), []);
});
