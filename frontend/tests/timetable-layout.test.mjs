import { test } from "node:test";
import assert from "node:assert/strict";
import { layoutDayItems } from "../src/features/timetable/model.ts";

const date = "2026-10-28";
const lesson = (id, start, end) => ({
  id,
  startAt: `${date}T${start}:00+09:00`,
  endAt: `${date}T${end}:00+09:00`,
});

test("같은 시간대의 수업이 3개 이상이면 하나의 요약으로 묶고 모두 선택 가능하게 보존한다", () => {
  const items = layoutDayItems(
    [lesson(1, "09:00", "10:00"), lesson(2, "09:00", "10:00"), lesson(3, "09:00", "10:00")],
    date,
  );
  assert.equal(items.length, 1);
  assert.equal(items[0].kind, "group");
  assert.deepEqual(
    items[0].lessons.map(({ id }) => id),
    [1, 2, 3],
  );
  assert.deepEqual([items[0].start, items[0].end], [540, 600]);
});

test("겹침이 2개 이하면 개별 수업을 유지하고, 이어진 밀집 구간은 분리한다", () => {
  const items = layoutDayItems(
    [
      lesson(1, "09:00", "10:00"),
      lesson(2, "09:00", "10:00"),
      lesson(3, "10:00", "11:00"),
      lesson(4, "10:15", "11:15"),
      lesson(5, "10:30", "11:30"),
      lesson(6, "12:00", "13:00"),
    ],
    date,
  );
  assert.deepEqual(
    items.map((item) => item.kind),
    ["lesson", "lesson", "group", "lesson"],
  );
  assert.deepEqual(
    items[2].lessons.map(({ id }) => id),
    [3, 4, 5],
  );
  assert.deepEqual([items[2].start, items[2].end], [600, 690]);
  assert.equal(items[3].event.lesson.id, 6);
});
