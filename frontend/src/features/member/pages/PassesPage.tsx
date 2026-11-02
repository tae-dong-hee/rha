import { useEffect, useState } from "react";
import { useGetMyPasses, type Pass } from "@/api/generated/api";
import { PageTitle } from "@/components/ui/PageTitle";
import { Pagination, PAGE_SIZE } from "@/components/ui/Pagination";
import { MenuEmpty, MenuPanel } from "@/components/layout/MenuPanel";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { PassUsage } from "@/features/member/PassUsage";
import { useAllMyReservations } from "@/features/admin/queries";
import { DataTable, QueryState, dateTime } from "@/features/admin/AdminUI";
import { passReservationHistory } from "@/features/member/passReservationHistory";

export const passUsage = (pass: Pass) => ({
  name: pass.passProduct.name,
  total: pass.totalCount,
  remaining: pass.remainingCount,
  teacher: pass.instructor.name,
  start: pass.startDate,
  end: pass.endDate,
});

export function PassesPage({ onOpen }: { onOpen: (id: number) => void }) {
  const [page, setPage] = useState(1);
  const query = useGetMyPasses({ page, size: PAGE_SIZE });
  const passes = query.data?.content ?? [];

  return (
    <div className="menu-page">
      <PageTitle
        title="내 이용권"
        description="보유한 이용권과 남은 횟수, 이용 기간을 확인합니다."
      />
      {query.isPending ? (
        <MenuEmpty
          title="이용권을 불러오는 중입니다"
          description="잠시만 기다려 주세요."
        />
      ) : query.isError ? (
        <MenuEmpty
          title="이용권을 불러오지 못했습니다"
          description="잠시 후 다시 확인해 주세요."
        />
      ) : passes.length ? (
        <div className="menu-pass-list">
          {passes.map((pass) => (
            <MenuPanel
              key={pass.id}
              variant="pass"
              title={pass.passProduct.name}
              action={
                <StatusBadge
                  domain="pass"
                  status={pass.status}
                />
              }
            >
              <div className="menu-stack">
                <PassUsage pass={passUsage(pass)} />
                <div className="menu-actions">
                  <Button
                    variant="outline"
                    onClick={() => onOpen(pass.id)}
                  >
                    이용권 상세
                  </Button>
                </div>
              </div>
            </MenuPanel>
          ))}
        </div>
      ) : (
        <MenuEmpty
          title="보유 이용권이 없습니다"
          description="이용권이 발급되면 여기에 표시됩니다."
        />
      )}
      {query.isError && (
        <Button
          variant="outline"
          onClick={() => void query.refetch()}
        >
          다시 시도
        </Button>
      )}
      {!query.isError && (
        <Pagination
          total={query.data?.pageInfo.totalElements ?? 0}
          page={page}
          pageSize={PAGE_SIZE}
          totalPages={Math.max(1, query.data?.pageInfo.totalPages ?? 1)}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}

export function PassDetailPage({ passId, onBack }: { passId: number; onBack: () => void }) {
  const [page, setPage] = useState(1);
  const query = useGetMyPasses({ page, size: 100 });
  const pass = query.data?.content.find((item) => item.id === passId);
  const lastPage = query.data?.pageInfo.totalPages ?? 1;
  const reservations = useAllMyReservations({}, !!pass);
  const history = passReservationHistory(reservations.data?.content ?? [], passId);

  useEffect(() => {
    if (query.data && !pass && page < lastPage) setPage(page + 1);
  }, [query.data, pass, page, lastPage]);

  return (
    <div className="menu-page">
      <PageTitle
        title="이용권 상세"
        description={pass?.passProduct.name ?? "이용권 정보"}
        action={
          <Button
            variant="outline"
            onClick={onBack}
          >
            목록으로
          </Button>
        }
      />
      {pass ? (
        <>
          <MenuPanel
            title={pass.passProduct.name}
            action={
              <StatusBadge
                domain="pass"
                status={pass.status}
              />
            }
          >
            <div className="menu-pass-detail">
              <PassUsage pass={passUsage(pass)} />
              <p className="menu-note">
                만료일 당일까지 이용할 수 있습니다. 차감 횟수에는 예약과 관리자 조정이 포함되어 실제
                출석 횟수와 다를 수 있습니다.
              </p>
            </div>
          </MenuPanel>
          <QueryState query={reservations}>
            <DataTable
              key={passId}
              title="예약·출결 및 횟수 내역"
              rows={history}
              empty="이 이용권으로 예약한 내역이 없습니다"
              emptyDescription="수업을 예약하면 차감 내역과 출결 상태를 확인할 수 있습니다."
              columns={[
                { label: "처리 일시", render: (event) => dateTime(event.occurredAt) },
                { label: "수업", render: (event) => event.reservation.lesson.title },
                {
                  label: "수업 일시",
                  render: (event) => dateTime(event.reservation.lesson.startAt),
                },
                { label: "내역", render: (event) => event.label },
                { label: "횟수 처리", render: (event) => (event.change > 0 ? "복구" : "−1회") },
                {
                  label: "현재 예약 상태",
                  render: (event) => (
                    <StatusBadge
                      domain="reservation"
                      status={event.reservation.status}
                    />
                  ),
                },
              ]}
            />
            <p className="menu-note">
              예약 시 1회 차감되고 취소 시 총 횟수 한도 내에서 최대 1회 복구됩니다. 출석·노쇼는 추가
              차감되지 않습니다. 이 목록은 예약 내역 기준이며, 관리자 횟수 조정 내역은 포함하지
              않습니다.
            </p>
          </QueryState>
        </>
      ) : (
        <MenuEmpty
          title={
            query.isError
              ? "이용권을 불러오지 못했습니다"
              : query.isPending || page < lastPage
                ? "이용권을 불러오는 중입니다"
                : "이용권을 찾을 수 없습니다"
          }
          description={
            query.isError ? "잠시 후 다시 확인해 주세요." : "내 이용권 목록을 확인해 주세요."
          }
        />
      )}
      {query.isError && (
        <Button
          variant="outline"
          onClick={() => void query.refetch()}
        >
          다시 시도
        </Button>
      )}
    </div>
  );
}
