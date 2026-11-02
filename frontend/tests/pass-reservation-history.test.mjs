import { test } from "node:test";
import assert from "node:assert/strict";
import { passReservationHistory } from "../src/features/member/passReservationHistory.ts";
import { createServer } from "vite";
import { setupServer } from "msw/node";
import { fileURLToPath } from "node:url";

const reservation = (id, status, extra = {}) => ({
  id,
  status,
  pass: { id: 1 },
  createdAt: "2026-10-01T01:00:00Z",
  lesson: { title: "필라테스", startAt: "2026-10-03T01:00:00Z" },
  ...extra,
});

test("선택한 이용권의 예약·출석·노쇼는 예약 시점에만 1회 차감한다", () => {
  const rows = [
    reservation(1, "RESERVED"),
    reservation(2, "ATTENDED"),
    reservation(3, "NO_SHOW"),
    reservation(4, "ATTENDED", { pass: { id: 2 } }),
  ];
  const events = passReservationHistory(rows, 1);
  assert.equal(events.length, 3);
  assert.ok(events.every((event) => event.change === -1 && event.occurredAt === rows[0].createdAt));
  assert.deepEqual(
    events.map((event) => event.reservation.status),
    ["NO_SHOW", "ATTENDED", "RESERVED"],
  );
});

test("취소된 예약은 최초 차감과 취소 시 복구를 모두 최신순으로 표시한다", () => {
  const events = passReservationHistory(
    [
      reservation(1, "CANCELED", {
        canceledAt: "2026-10-02T01:00:00Z",
        canceledBy: "LESSON_CANCELED",
      }),
    ],
    1,
  );
  assert.deepEqual(
    events.map(({ label, change, occurredAt }) => ({ label, change, occurredAt })),
    [
      { label: "수업 취소 복구", change: 1, occurredAt: "2026-10-02T01:00:00Z" },
      { label: "예약 차감", change: -1, occurredAt: "2026-10-01T01:00:00Z" },
    ],
  );
  assert.equal(new Set(events.map((event) => event.id)).size, 2);
});

test("취소 시각이 없는 과거 기록은 시각과 당시 잔여 횟수를 만들어내지 않는다", () => {
  const events = passReservationHistory([reservation(1, "CANCELED")], 1);
  assert.equal(events[0].occurredAt, null);
  assert.equal(events[0].label, "예약 취소 복구");
  assert.ok(events.every((event) => !("remaining" in event)));
  assert.deepEqual(passReservationHistory([], 1), []);
});

test("다음 서버 페이지의 이용권 기록까지 필터링 후 화면 페이지를 나눈다", () => {
  const rows = Array.from({ length: 100 }, (_, i) =>
    reservation(i + 1, "ATTENDED", { pass: { id: 2 } }),
  );
  rows.push(...Array.from({ length: 11 }, (_, i) => reservation(i + 101, "ATTENDED")));
  const events = passReservationHistory(rows, 1);
  assert.equal(events.length, 11);
  assert.equal(events.slice(0, 10).length, 10);
  assert.equal(events.slice(10).length, 1);
});

test("회원 미리보기에서도 본인 이용권과 해당 예약 이력을 연결하고 환불 이용권은 기본 제외한다", async () => {
  const vite = await createServer({
    configFile: false,
    resolve: { alias: { "@": fileURLToPath(new URL("../src", import.meta.url)) } },
    cacheDir: "node_modules/.vite-pass-history-tests",
    server: { middlewareMode: true, ws: false },
    appType: "custom",
  });
  const { adminHandlers } = await vite.ssrLoadModule("/src/mocks/admin/handlers.ts");
  const { authPreview } = await vite.ssrLoadModule("/src/features/auth/preview.ts");
  const { store } = await vite.ssrLoadModule("/src/mocks/admin/store.ts");
  const mock = setupServer(...adminHandlers);
  mock.listen({ onUnhandledRequest: "error" });
  try {
    const request = (path) => fetch(`http://localhost/v1${path}`);
    assert.equal((await request("/members/me/passes")).status, 401);
    authPreview.login("demo@rha.example", "RhaDemo123!");
    const passes = await (await request("/members/me/passes")).json();
    assert.ok(passes.content.length > 0);
    assert.ok(passes.content.every((pass) => pass.member.id === 1));
    const reservations = await (await request("/members/me/reservations?size=100")).json();
    assert.ok(passReservationHistory(reservations.content, passes.content[0].id).length > 0);
    store.passes.find((pass) => pass.id === passes.content[0].id).status = "REFUNDED";
    assert.equal((await (await request("/members/me/passes")).json()).content.length, 0);
    assert.equal(
      (await (await request("/members/me/passes?status=REFUNDED")).json()).content.length,
      1,
    );
  } finally {
    authPreview.logout();
    mock.close();
    await vite.close();
  }
});
