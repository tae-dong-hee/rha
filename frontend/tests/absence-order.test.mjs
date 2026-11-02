import { test } from "node:test";
import assert from "node:assert/strict";
import { sortAbsences } from "../src/features/admin/absenceOrder.ts";

const absence = (id, status, startAt) => ({ id, status, startAt });

test("승인 대기를 먼저 표시하고 각 그룹은 부재 시작일이 빠른 순서다", () => {
  const rows = [
    absence(1, "CANCELED", "2026-12-01T00:00:00Z"),
    absence(2, "REQUESTED", "2026-12-17T00:00:00Z"),
    absence(3, "APPROVED", "2026-12-03T00:00:00Z"),
    absence(4, "REQUESTED", "2026-12-04T00:00:00Z"),
    absence(5, "REJECTED", "2026-12-02T00:00:00Z"),
  ];
  const original = structuredClone(rows);
  assert.deepEqual(
    sortAbsences(rows).map((row) => row.id),
    [4, 2, 1, 5, 3],
  );
  assert.deepEqual(rows, original, "공유 API 캐시의 원본 순서를 변경하지 않는다");
});

test("같은 상태·시각은 ID 내림차순으로 안정적으로 정렬하고 시간대 표기를 처리한다", () => {
  const rows = [
    absence(1, "REQUESTED", "2026-12-01T09:00:00+09:00"),
    absence(2, "REQUESTED", "2026-12-01T00:00:00Z"),
    absence(3, "REQUESTED", "2026-12-01T08:00:00+09:00"),
  ];
  assert.deepEqual(
    sortAbsences(rows).map((row) => row.id),
    [3, 2, 1],
  );
  assert.deepEqual(sortAbsences([]), []);
});

test("서버의 다음 페이지에 있는 승인 대기도 화면 첫 페이지로 이동한다", () => {
  const firstServerPage = Array.from({ length: 100 }, (_, i) =>
    absence(i + 1, "APPROVED", "2026-12-17T00:00:00Z"),
  );
  const nextServerPage = [
    absence(101, "REQUESTED", "2026-12-18T00:00:00Z"),
    absence(102, "REQUESTED", "2026-12-02T00:00:00Z"),
  ];
  const sorted = sortAbsences([...firstServerPage, ...nextServerPage]);
  assert.deepEqual(
    sorted.slice(0, 5).map((row) => row.id),
    [102, 101, 100, 99, 98],
  );
  assert.equal(sorted.length, 102);
  assert.equal(new Set(sorted.map((row) => row.id)).size, 102);
});
