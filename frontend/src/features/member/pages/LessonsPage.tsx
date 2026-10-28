import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useCreateReservation, useGetLesson } from "@/api/generated/api";
import { useAllMyReservations } from "@/features/admin/queries";
import { currentTime } from "@/api/runtime";
import { Dialog } from "@/components/ui/Dialog";
import { dateInSeoul, timeInSeoul } from "@/features/timetable/model";
import { PageTitle } from "@/components/ui/PageTitle";
import { MenuPanel, MenuEmpty } from "@/components/layout/MenuPanel";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import "./lessons.css";

export function LessonDetailPage({
  lessonId,
  onBack,
  canReserve,
}: {
  lessonId: number;
  onBack: () => void;
  canReserve: boolean;
}) {
  const client = useQueryClient();
  const lessonQuery = useGetLesson(lessonId);
  const reservationsQuery = useAllMyReservations({ status: "RESERVED" });
  const createReservation = useCreateReservation();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const lesson = lessonQuery.data;
  const alreadyReserved = reservationsQuery.data?.content.some(
    (reservation) => reservation.lesson.id === lessonId,
  );
  const reservable =
    lesson?.status === "PUBLISHED" &&
    Date.parse(lesson.startAt) > Date.parse(currentTime()) &&
    lesson.reservedCount < lesson.capacity &&
    !alreadyReserved;
  const lessonDate = lesson ? `${dateInSeoul(lesson.startAt)} ${timeInSeoul(lesson.startAt)}` : "";
  return (
    <div className="menu-page">
      <PageTitle
        title="수업 상세"
        description={lesson ? `${lessonDate} · ${lesson.title}` : "수업 정보를 확인합니다."}
        action={
          <Button
            variant="outline"
            onClick={onBack}
          >
            목록으로
          </Button>
        }
      />
      {lessonQuery.isPending ? (
        <MenuEmpty
          title="수업을 불러오는 중입니다"
          description="잠시만 기다려 주세요."
        />
      ) : lessonQuery.isError || !lesson ? (
        <MenuEmpty
          title="수업을 불러오지 못했습니다"
          description="목록에서 다시 확인해 주세요."
        />
      ) : (
        <div className="menu-detail-columns">
          <MenuPanel
            title={lesson.title}
            action={
              <StatusBadge
                domain="lesson"
                status={lesson.status}
              />
            }
          >
            <dl className="menu-facts">
              {[
                ["수업 유형", lesson.lessonType.name],
                ["담당 강사", lesson.instructor.name],
                ["룸", lesson.room.name],
                ["수업 일시", lessonDate],
                ["예약 / 정원", `${lesson.reservedCount} / ${lesson.capacity}명`],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          </MenuPanel>
          <MenuPanel title="내 신청 상태">
            <div className="menu-stack">
              <p>
                {alreadyReserved
                  ? "이미 예약한 수업입니다."
                  : lesson.reservedCount >= lesson.capacity
                    ? "정원이 찬 수업입니다."
                    : reservable
                      ? "예약할 수 있는 수업입니다."
                      : "현재 예약할 수 없는 수업입니다."}
              </p>
              <p className="menu-note">예약 시 사용 가능한 이용권에서 1회가 차감됩니다.</p>
              <Button
                disabled={
                  !canReserve ||
                  !reservable ||
                  reservationsQuery.isPending ||
                  reservationsQuery.isError ||
                  createReservation.isPending
                }
                onClick={() => setConfirmOpen(true)}
              >
                {alreadyReserved
                  ? "예약 완료"
                  : lesson.reservedCount >= lesson.capacity
                    ? "수업 마감"
                    : "수업 예약하기"}
              </Button>
            </div>
          </MenuPanel>
        </div>
      )}
      {confirmOpen && lesson && (
        <Dialog
          dialog={{
            title: "수업 예약 확인",
            body: `${lesson.title} · ${lessonDate}`,
            action: "수업 예약하기",
            details: [
              { label: "수업", value: lesson.title },
              { label: "일시", value: lessonDate },
              { label: "담당 강사", value: lesson.instructor.name },
              { label: "룸", value: lesson.room.name },
            ],
            notice: "예약이 확정되면 이용권 1회가 차감됩니다. 예약 취소 시 횟수는 복구됩니다.",
          }}
          onClose={() => {
            if (!createReservation.isPending) setConfirmOpen(false);
          }}
          footerAction={
            <Button
              disabled={createReservation.isPending}
              onClick={() => {
                void createReservation
                  .mutateAsync({ data: { lessonId } })
                  .then(async () => {
                    await client.invalidateQueries();
                    setConfirmOpen(false);
                    toast.success("수업 예약이 완료되었습니다.");
                  })
                  .catch((error) => {
                    toast.error(
                      error instanceof Error ? error.message : "수업 예약에 실패했습니다.",
                    );
                  });
              }}
            >
              {createReservation.isPending ? "예약 중…" : "수업 예약하기"}
            </Button>
          }
        />
      )}
    </div>
  );
}
