import {
  useAllLessons,
  useAllLessonTypes,
  useAllRooms,
  useAllMyReservations,
} from "@/features/admin/queries";
import { LessonEditor } from "@/features/admin/LessonPages";
import type { Values } from "@/features/admin/AdminUI";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useCreateReservation, type Lesson } from "@/api/generated/api";
import type { Screen } from "@/config/access";
import type { DashboardUser } from "@/features/dashboard/model";
import { MenuEmpty, MenuPanel } from "@/components/layout/MenuPanel";
import { Dialog } from "@/components/ui/Dialog";
import type { DialogState } from "@/app/routes";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge, getStatusLabel } from "@/components/ui/StatusBadge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ApiError } from "@/api/client";
import { fallbackInstructorColor, useInstructorColors } from "@/features/instructor/colors";
import { LessonSelectionCard } from "./LessonSelectionCard";
import { WeekToolbarControls } from "./WeekToolbarControls";
import { useLessonPermissions } from "./lessonPermissions";
import { dateInSeoul, layoutDayItems, shiftDate, timeInSeoul, weekRange, weekStart } from "./model";
import "./timetable.css";

const weekdays = ["월", "화", "수", "목", "금", "토", "일"];

export function TimetablePage({
  user,
  onNavigate,
  canReserve = false,
  view = "calendar",
  initialDate,
  selectedLessonId,
  onSelectLesson,
  initialInstructorId,
  legendHost,
}: {
  user: DashboardUser;
  onNavigate: (screen: Screen, id?: number) => void;
  canReserve?: boolean;
  view?: "calendar" | "list";
  initialDate?: string;
  selectedLessonId?: number | null;
  onSelectLesson?: (id: number | null) => void;
  initialInstructorId?: number;
  legendHost?: HTMLElement | null;
}) {
  const today = dateInSeoul();
  const [date, setDate] = useState(initialDate ?? today);
  const [room, setRoom] = useState("all");
  const [lessonType, setLessonType] = useState("all");
  const [instructor, setInstructor] = useState(
    initialInstructorId ? String(initialInstructorId) : "all",
  );
  const [scope, setScope] = useState("all");
  const [status, setStatus] = useState("all");
  const [editing, setEditing] = useState(false);
  const [editor, setEditor] = useState<{ id?: number; initialValues?: Values } | null>(null);
  const [localSelectedId, setLocalSelectedId] = useState<number | null>(null);
  const selectedId = selectedLessonId === undefined ? localSelectedId : selectedLessonId;
  const setSelectedId = (id: number | null) => {
    setLocalSelectedId(id);
    onSelectLesson?.(id);
  };
  const changeDate = (nextDate: string) => {
    setDate(nextDate);
    setSelectedId(null);
  };
  const start = weekStart(date);
  // 관리자와, 수업 개설·수정 권한을 받은 강사만 시간표를 편집한다.
  const lessonPermissions = useLessonPermissions(user);
  const canEdit = lessonPermissions.canManage;
  const openCreate = (day = start < today ? shiftDate(today, 1) : start, hour = 9) => {
    if (!lessonPermissions.canCreate) return;
    setSelectedId(null);
    const endDay = hour === 23 ? shiftDate(day, 1) : day;
    setEditor({
      initialValues: {
        startAt: `${day}T${String(hour).padStart(2, "0")}:00`,
        endAt: `${endDay}T${String((hour + 1) % 24).padStart(2, "0")}:00`,
        ...(room !== "all" ? { roomId: room } : {}),
        ...(lessonType !== "all" ? { lessonTypeId: lessonType } : {}),
      },
    });
  };
  if (editor && canEdit)
    return (
      <LessonEditor
        id={editor.id}
        initialValues={editor.initialValues}
        allowedTypeCodes={lessonPermissions.createCodes}
        onNavigate={onNavigate}
        onBack={() => setEditor(null)}
        onSaved={(lesson) => {
          setDate(dateInSeoul(lesson.startAt));
          setRoom("all");
          setLessonType("all");
          setInstructor("all");
          setScope("all");
          setStatus("all");
          setSelectedId(lesson.id);
          setEditor(null);
        }}
      />
    );
  const renderToolbar = (filters?: ReactNode) => (
    <div
      className="timetable-toolbar timetable-main-toolbar"
      data-editing={editing}
      data-view={view}
    >
      <WeekToolbarControls
        monthId="timetable-month"
        date={date}
        start={start}
        today={today}
        onChangeDate={changeDate}
        filters={filters}
        navigationSuffix={
          canEdit && (
            <div className="menu-actions timetable-edit-actions">
              {editing ? (
                <>
                  {lessonPermissions.canCreate && (
                    <Button
                      variant="outline"
                      onClick={() => openCreate()}
                    >
                      수업 추가
                    </Button>
                  )}
                  <Button onClick={() => setEditing(false)}>편집 완료</Button>
                </>
              ) : (
                <Button onClick={() => setEditing(true)}>시간표 편집</Button>
              )}
            </div>
          )
        }
      />
    </div>
  );
  return (
    <section className="menu-page timetable-page">
      <h1 className="sr-only">{view === "list" ? "수업 목록" : "시간표"}</h1>
      <WeekSchedule
        key={`${user.role}-${user.id}-${start}`}
        start={start}
        today={today}
        user={user}
        onNavigate={onNavigate}
        canReserve={canReserve}
        room={room}
        setRoom={setRoom}
        lessonType={lessonType}
        setLessonType={setLessonType}
        instructor={instructor}
        setInstructor={setInstructor}
        scope={scope}
        setScope={setScope}
        status={status}
        setStatus={setStatus}
        editing={editing && canEdit}
        canCreate={lessonPermissions.canCreate}
        canUpdate={lessonPermissions.canUpdate}
        onCreate={openCreate}
        onEdit={(id) => {
          if (canEdit) setEditor({ id });
        }}
        selectedId={selectedId}
        onSelect={setSelectedId}
        renderToolbar={renderToolbar}
        legendHost={legendHost}
        view={view}
      />
    </section>
  );
}

type ScheduleProps = {
  view: "calendar" | "list";
  lessonType: string;
  setLessonType: (value: string) => void;
  instructor: string;
  setInstructor: (value: string) => void;
  editing: boolean;
  canCreate: boolean;
  canUpdate: (lesson: Lesson) => boolean;
  onCreate: (day: string, hour: number) => void;
  onEdit: (id: number) => void;
  selectedId: number | null;
  onSelect: (id: number) => void;
  start: string;
  today: string;
  user: DashboardUser;
  onNavigate: (screen: Screen, id?: number) => void;
  canReserve: boolean;
  room: string;
  setRoom: (value: string) => void;
  scope: string;
  setScope: (value: string) => void;
  status: string;
  setStatus: (value: string) => void;
  legendHost?: HTMLElement | null;
  renderToolbar: (filters?: ReactNode) => ReactNode;
};

function WeekSchedule({
  start,
  today,
  user,
  onNavigate,
  renderToolbar,
  ...filters
}: ScheduleProps) {
  // Include the preceding day for lessons continuing past midnight.
  const query = useAllLessons({
    ...weekRange(start),
    from: weekRange(shiftDate(start, -1)).from,
    order: "ASC",
  });
  const loading = query.isPending;
  const lessons = (query.data?.content ?? []).filter(
    (lesson) => Date.parse(lesson.endAt) > Date.parse(weekRange(start).from),
  );
  if (query.isError) {
    const status = query.error instanceof ApiError ? query.error.problem.status : undefined;
    return (
      <>
        {renderToolbar()}
        <Alert variant="destructive">
          <AlertTitle>
            {status === 401
              ? "로그인이 만료되었습니다"
              : status === 403
                ? "조회 권한이 없습니다"
                : "시간표를 불러오지 못했습니다"}
          </AlertTitle>
          <AlertDescription>
            {status === 401 ? "다시 로그인한 뒤 이용해 주세요." : "잠시 후 다시 시도해 주세요."}
            <Button
              variant="outline"
              onClick={() => query.refetch()}
            >
              다시 시도
            </Button>
          </AlertDescription>
        </Alert>
      </>
    );
  }
  if (loading)
    return (
      <>
        {renderToolbar()}
        <div
          role="status"
          aria-label="시간표 불러오는 중"
        >
          <Skeleton className="timetable-loading" />
        </div>
      </>
    );
  return (
    <Schedule
      lessons={lessons}
      start={start}
      today={today}
      user={user}
      onNavigate={onNavigate}
      renderToolbar={renderToolbar}
      {...filters}
    />
  );
}

function Schedule({
  lessons,
  start,
  today,
  user,
  onNavigate,
  canReserve,
  room,
  setRoom,
  lessonType,
  setLessonType,
  instructor,
  setInstructor,
  scope,
  setScope,
  status,
  setStatus,
  editing,
  canCreate,
  canUpdate,
  onCreate,
  onEdit,
  selectedId,
  onSelect,
  renderToolbar,
  legendHost,
  view,
}: ScheduleProps & { lessons: Lesson[] }) {
  const client = useQueryClient();
  const instructorColors = useInstructorColors();
  const reserve = useCreateReservation();
  const catalogTypes = useAllLessonTypes();
  const catalogRooms = useAllRooms();
  const [reservationDialog, setReservationDialog] = useState<DialogState>(null);
  const [groupDialog, setGroupDialog] = useState<{ date: string; lessons: Lesson[] } | null>(null);
  const layoutRef = useRef<HTMLDivElement>(null);
  const range = weekRange(start);
  const myReservations = useAllMyReservations(
    { lessonFrom: range.from, lessonTo: range.to, status: "RESERVED" },
    user.role === "MEMBER",
  );
  const myLessonIds = new Set(
    myReservations.data?.content.map((reservation) => reservation.lesson.id),
  );
  const rows = lessons.filter(
    (lesson) =>
      (view !== "calendar" || lesson.status !== "CANCELED") &&
      (lessonType === "all" || String(lesson.lessonType.id) === lessonType) &&
      (room === "all" || String(lesson.room.id) === room) &&
      (instructor === "all" || String(lesson.instructor.id) === instructor) &&
      (scope === "all" ||
        (user.role === "MEMBER" ? myLessonIds.has(lesson.id) : lesson.instructor.id === user.id)) &&
      (status === "all" || lesson.status === status),
  );
  const visibleRows =
    view === "list" && !editing ? rows : rows.filter((lesson) => lesson.status !== "CANCELED");
  const instructors = [
    ...new Map(visibleRows.map((lesson) => [lesson.instructor.id, lesson.instructor])).values(),
  ].sort((a, b) => a.name.localeCompare(b.name, "ko"));
  const instructorOptions = [
    ...new Map(lessons.map((lesson) => [lesson.instructor.id, lesson.instructor])).values(),
  ].sort((a, b) => a.name.localeCompare(b.name, "ko"));
  const selected = visibleRows.find((lesson) => lesson.id === selectedId);
  const dates = Array.from({ length: 7 }, (_, i) => shiftDate(start, i));
  const days = dates.map((date) => layoutDayItems(visibleRows, date));
  const events = days.flat();
  const fromHour = Math.min(9, ...events.map((event) => Math.floor(event.start / 60)));
  const toHour = Math.max(21, ...events.map((event) => Math.ceil(event.end / 60)));
  const hours = Array.from({ length: toHour - fromHour }, (_, i) => fromHour + i);
  useLayoutEffect(() => {
    const layout = layoutRef.current;
    if (view !== "calendar" || !layout) return;
    const scroll = layout.querySelector<HTMLElement>(".timetable-scroll");
    const header = layout.querySelector<HTMLElement>(".timetable-header");
    const content = layout.closest<HTMLElement>(".content");
    const footer = content?.parentElement?.querySelector<HTMLElement>(".app-footer");
    if (!scroll || !header || !content) return;
    const fitHours = () => {
      const styles = getComputedStyle(layout);
      const token = (name: string) => Number.parseFloat(styles.getPropertyValue(name));
      const contentBottom = Number.parseFloat(getComputedStyle(content).paddingBottom);
      const scrollBorder =
        Number.parseFloat(getComputedStyle(scroll).borderTopWidth) +
        Number.parseFloat(getComputedStyle(scroll).borderBottomWidth);
      const available =
        window.innerHeight -
        (scroll.getBoundingClientRect().top + window.scrollY) -
        header.offsetHeight -
        contentBottom -
        (footer?.offsetHeight ?? 0) -
        scrollBorder -
        token("--timetable-fit-bottom-gap");
      const hourHeight = Math.min(
        token("--timetable-fit-hour-max"),
        Math.max(token("--timetable-fit-hour-min"), Math.floor(available / hours.length)),
      );
      const value = `${hourHeight}px`;
      if (layout.style.getPropertyValue("--timetable-hour-height") !== value)
        layout.style.setProperty("--timetable-hour-height", value);
      layout.dataset.compact = String(hourHeight < token("--timetable-fit-compact-at"));
    };
    fitHours();
    const observer = new ResizeObserver(fitHours);
    observer.observe(layout.closest(".timetable-page") ?? layout);
    window.addEventListener("resize", fitHours);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", fitHours);
    };
  });
  const lessonTypes = [
    ...new Map(
      [...(catalogTypes.data?.content ?? []), ...lessons.map((lesson) => lesson.lessonType)].map(
        (item) => [item.id, item],
      ),
    ).values(),
  ];
  const rooms = [
    ...new Map(
      [...(catalogRooms.data?.content ?? []), ...lessons.map((lesson) => lesson.room)].map(
        (item) => [item.id, item],
      ),
    ).values(),
  ];
  const filtersPanel = (
    <div className="timetable-toolbar timetable-filters">
      <div className="menu-actions">
        {(user.role === "INSTRUCTOR" || user.role === "MEMBER") && (
          <Field>
            <FieldLabel
              htmlFor="timetable-scope"
              className="sr-only"
            >
              수업 범위
            </FieldLabel>
            <Select
              value={scope}
              onValueChange={setScope}
            >
              <SelectTrigger id="timetable-scope">
                <SelectValue />
              </SelectTrigger>
              <SelectContent
                position="popper"
                align="start"
              >
                <SelectItem value="all">조회 가능한 전체 수업</SelectItem>
                <SelectItem value="own">
                  {user.role === "INSTRUCTOR" ? "내 담당 수업" : "내 예약 수업"}
                </SelectItem>
              </SelectContent>
            </Select>
          </Field>
        )}
        {user.role === "ADMIN" && (
          <Field>
            <FieldLabel
              htmlFor="timetable-status"
              className="sr-only"
            >
              수업 상태
            </FieldLabel>
            <Select
              value={status}
              onValueChange={setStatus}
            >
              <SelectTrigger id="timetable-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent
                position="popper"
                align="start"
              >
                <SelectItem value="all">전체 수업 상태</SelectItem>
                {(["CREATED", "PUBLISHED", "UNPUBLISHED", "SCHEDULED", "CANCELED"] as const)
                  .filter((value) => view !== "calendar" || value !== "CANCELED")
                  .map((value) => (
                    <SelectItem
                      key={value}
                      value={value}
                    >
                      {getStatusLabel({ domain: "lesson", status: value })}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </Field>
        )}
        <Field>
          <FieldLabel
            htmlFor="timetable-type"
            className="sr-only"
          >
            수업 유형
          </FieldLabel>
          <Select
            value={lessonType}
            onValueChange={setLessonType}
          >
            <SelectTrigger id="timetable-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent
              position="popper"
              align="start"
            >
              <SelectItem value="all">전체 수업 유형</SelectItem>
              {lessonType !== "all" &&
                !lessonTypes.some((item) => String(item.id) === lessonType) && (
                  <SelectItem value={lessonType}>선택한 유형 (수업 없음)</SelectItem>
                )}
              {lessonTypes.map((item) => (
                <SelectItem
                  key={item.id}
                  value={String(item.id)}
                >
                  {item.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field>
          <FieldLabel
            htmlFor="timetable-instructor"
            className="sr-only"
          >
            담당 강사
          </FieldLabel>
          <Select
            value={instructor}
            onValueChange={setInstructor}
          >
            <SelectTrigger id="timetable-instructor">
              <SelectValue />
            </SelectTrigger>
            <SelectContent
              position="popper"
              align="start"
            >
              <SelectItem value="all">전체 강사</SelectItem>
              {instructor !== "all" &&
                !instructorOptions.some((item) => String(item.id) === instructor) && (
                  <SelectItem value={instructor}>선택한 강사 (수업 없음)</SelectItem>
                )}
              {instructorOptions.map((item) => (
                <SelectItem
                  key={item.id}
                  value={String(item.id)}
                >
                  {user.role === "MEMBER" ? `담당 강사 수업 (${item.name})` : item.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field>
          <FieldLabel
            htmlFor="timetable-room"
            className="sr-only"
          >
            룸
          </FieldLabel>
          <Select
            value={room}
            onValueChange={setRoom}
          >
            <SelectTrigger id="timetable-room">
              <SelectValue />
            </SelectTrigger>
            <SelectContent
              position="popper"
              align="start"
            >
              <SelectItem value="all">전체 룸</SelectItem>
              {room !== "all" && !rooms.some((item) => String(item.id) === room) && (
                <SelectItem value={room}>선택한 룸 (수업 없음)</SelectItem>
              )}
              {rooms.map((item) => (
                <SelectItem
                  key={item.id}
                  value={String(item.id)}
                >
                  {item.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>
    </div>
  );
  const legend =
    view === "calendar" && instructors.length > 0 ? (
      <div
        className="timetable-legend"
        aria-label="강사별 시간표 색상"
      >
        <ul>
          {instructors.map((instructor) => (
            <li key={instructor.id}>
              <span
                className="timetable-legend-swatch"
                style={
                  {
                    "--instructor-color":
                      instructorColors[instructor.id] ?? fallbackInstructorColor(instructor.id),
                  } as CSSProperties
                }
                aria-hidden="true"
              />
              {instructor.name}
            </li>
          ))}
        </ul>
      </div>
    ) : undefined;
  return (
    <>
      {legendHost && legend && createPortal(legend, legendHost)}
      {renderToolbar(filtersPanel)}
      {!visibleRows.length && !editing ? (
        <MenuPanel>
          <MenuEmpty
            title="이번 주에 표시할 수업이 없습니다"
            description="다른 주를 선택하거나 수업 유형·범위·룸을 변경해 주세요."
          />
        </MenuPanel>
      ) : (
        <div
          ref={layoutRef}
          className="timetable-layout"
          data-editing={editing}
          data-view={view}
          data-role={user.role}
          style={{ "--timetable-hours": hours.length } as CSSProperties}
        >
          {view === "list" && !editing ? (
            <WeekLessonList
              lessons={rows}
              selectedId={selectedId}
              onSelect={onSelect}
              showStatus={user.role !== "MEMBER"}
            />
          ) : (
            <div
              className="timetable-scroll"
              role="region"
              aria-label="주간 수업 시간표"
              tabIndex={0}
            >
              <div className="timetable-grid">
                <div className="timetable-header timetable-corner">시간</div>
                {dates.map((date, i) => (
                  <div
                    key={date}
                    className="timetable-header"
                    data-today={date === today}
                  >
                    <span>{weekdays[i]}</span>
                    <strong>{date.slice(5).replace("-", ".")}</strong>
                    {date === today && <span className="timetable-today">오늘</span>}
                  </div>
                ))}
                <div
                  className="timetable-times"
                  aria-hidden="true"
                >
                  {hours.map((hour) => (
                    <div key={hour}>{String(hour).padStart(2, "0")}:00</div>
                  ))}
                </div>
                {days.map((day, i) => (
                  <div
                    key={dates[i]}
                    className="timetable-day"
                    data-today={dates[i] === today}
                    aria-label={`${dates[i]} ${weekdays[i]}요일`}
                  >
                    {hours.map((hour) =>
                      editing && canCreate ? (
                        <button
                          key={hour}
                          type="button"
                          className="timetable-hour timetable-slot"
                          aria-label={`${dates[i]} ${String(hour).padStart(2, "0")}:00 수업 등록`}
                          disabled={
                            Date.parse(`${dates[i]}T${String(hour).padStart(2, "0")}:00+09:00`) <=
                            Date.now()
                          }
                          onClick={() => onCreate(dates[i], hour)}
                        >
                          <span aria-hidden="true">수업 추가</span>
                        </button>
                      ) : (
                        <div
                          key={hour}
                          className="timetable-hour"
                          aria-hidden="true"
                        />
                      ),
                    )}
                    {day.map((item) => {
                      const { start: eventStart, end } = item;
                      const position = {
                        top: `${((eventStart - fromHour * 60) / (hours.length * 60)) * 100}%`,
                        "--timetable-event-height": `${((end - eventStart) / (hours.length * 60)) * 100}%`,
                      } as CSSProperties;
                      if (item.kind === "group")
                        return (
                          <button
                            type="button"
                            key={`group-${eventStart}`}
                            className="timetable-event timetable-event-group"
                            data-short={end - eventStart < 45}
                            style={position}
                            aria-label={`${dates[i]} ${String(Math.floor(eventStart / 60)).padStart(2, "0")}:${String(eventStart % 60).padStart(2, "0")} 겹치는 수업 ${item.lessons.length}개 보기`}
                            onClick={() =>
                              setGroupDialog({ date: dates[i], lessons: item.lessons })
                            }
                          >
                            <span className="timetable-event-time">
                              {String(Math.floor(eventStart / 60)).padStart(2, "0")}:
                              {String(eventStart % 60).padStart(2, "0")}
                            </span>
                            <strong>수업 {item.lessons.length}개 보기</strong>
                          </button>
                        );
                      const { lesson, column, columns } = item.event;
                      return (
                        <button
                          type="button"
                          key={lesson.id}
                          className="timetable-event"
                          data-short={end - eventStart < 45}
                          data-status={lesson.status}
                          data-instructor-color={lesson.instructor.id % 6}
                          aria-pressed={selectedId === lesson.id}
                          aria-label={`${dates[i]} ${timeInSeoul(lesson.startAt)} ${lesson.title} · ${lesson.instructor.name} · ${lesson.room.name} · 예약 ${lesson.reservedCount}/${lesson.capacity} · ${getStatusLabel({ domain: "lesson", status: lesson.status })}`}
                          title={`${timeInSeoul(lesson.startAt)}–${timeInSeoul(lesson.endAt)} ${lesson.title} · ${lesson.instructor.name} · ${lesson.room.name}`}
                          style={
                            {
                              ...position,
                              left: `${(column / columns) * 100}%`,
                              width: `${100 / columns}%`,
                              ...(instructorColors[lesson.instructor.id]
                                ? { "--instructor-color": instructorColors[lesson.instructor.id] }
                                : {}),
                            } as CSSProperties
                          }
                          onClick={() => onSelect(lesson.id)}
                        >
                          <span className="timetable-event-meta">
                            <span className="timetable-event-time">
                              {timeInSeoul(lesson.startAt)}
                            </span>
                            <span>
                              {lesson.reservedCount}/{lesson.capacity}
                            </span>
                          </span>
                          <strong>
                            {lesson.title}
                            {lesson.status !== "PUBLISHED" && (
                              <span className="timetable-event-status">
                                {" "}
                                · {getStatusLabel({ domain: "lesson", status: lesson.status })}
                              </span>
                            )}
                          </strong>
                          <span>{lesson.instructor.name}</span>
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          )}
          <aside
            className="timetable-preview"
            aria-label="선택한 수업 요약"
            aria-live="polite"
          >
            <LessonSelectionCard
              lesson={selected}
              emptyMessage={
                editing && canCreate ? "빈 시간칸을 선택해 수업을 등록하세요." : undefined
              }
            >
              {selected && (
                <>
                  {user.role === "MEMBER" &&
                    selected.status === "PUBLISHED" &&
                    Date.parse(selected.startAt) > Date.now() &&
                    (() => {
                      const alreadyReserved = myReservations.data?.content.some(
                        (reservation) =>
                          reservation.lesson.id === selected.id &&
                          reservation.status === "RESERVED",
                      );
                      if (alreadyReserved)
                        return <p className="menu-note">이미 신청한 수업입니다.</p>;
                      if (selected.reservedCount >= selected.capacity) return null;
                      if (!canReserve)
                        return <p className="menu-note">수업 신청 권한이 없습니다.</p>;
                      return (
                        <Button
                          disabled={myReservations.isPending || reserve.isPending}
                          onClick={() =>
                            setReservationDialog({
                              title: "수업 신청 확인",
                              body: `${selected.title} · ${dateInSeoul(selected.startAt)} ${timeInSeoul(selected.startAt)}`,
                              action: "신청하기",
                              details: [
                                ["수업", selected.title],
                                [
                                  "일시",
                                  `${dateInSeoul(selected.startAt)} ${timeInSeoul(selected.startAt)}`,
                                ],
                                ["담당 강사", selected.instructor.name],
                                ["룸", selected.room.name],
                              ].map(([label, value]) => ({ label, value })),
                              notice: "신청이 완료되면 사용 가능한 이용권에서 1회가 차감됩니다.",
                            })
                          }
                        >
                          수업 신청하기
                        </Button>
                      );
                    })()}
                  {editing &&
                    canUpdate(selected) &&
                    selected.status !== "CANCELED" &&
                    Date.parse(selected.startAt) > Date.now() && (
                      <Button onClick={() => onEdit(selected.id)}>수업 수정</Button>
                    )}
                  {(user.role === "ADMIN" || user.role === "INSTRUCTOR") && (
                    <Button
                      onClick={() =>
                        onNavigate(
                          user.role === "ADMIN"
                            ? "admin-lesson-detail"
                            : "instructor-lesson-detail",
                          selected.id,
                        )
                      }
                    >
                      수업 상세 보기
                    </Button>
                  )}
                </>
              )}
            </LessonSelectionCard>
          </aside>
        </div>
      )}
      {reservationDialog && (
        <Dialog
          dialog={reservationDialog}
          onClose={() => setReservationDialog(null)}
          onConfirm={() => {
            const selectedLesson = selected;
            if (!selectedLesson) return;
            void reserve
              .mutateAsync({ data: { lessonId: selectedLesson.id } })
              .then(async () => {
                await client.invalidateQueries();
                toast.success("수업 신청이 완료되었습니다.");
              })
              .catch((error) =>
                toast.error(error instanceof Error ? error.message : "수업 신청에 실패했습니다."),
              );
          }}
        />
      )}
      {groupDialog && (
        <Dialog
          dialog={{
            title: `${groupDialog.date} 겹치는 수업 ${groupDialog.lessons.length}개`,
            body: "수업을 선택하면 상세 정보를 확인할 수 있습니다.",
          }}
          onClose={() => setGroupDialog(null)}
        >
          <div className="timetable-group-list">
            {groupDialog.lessons.map((lesson) => (
              <Button
                key={lesson.id}
                variant="outline"
                className="timetable-group-lesson"
                onClick={() => {
                  onSelect(lesson.id);
                  setGroupDialog(null);
                }}
              >
                <strong>
                  {timeInSeoul(lesson.startAt)}–{timeInSeoul(lesson.endAt)} · {lesson.title}
                </strong>
                <span>
                  {lesson.instructor.name} · {lesson.room.name} · 예약 {lesson.reservedCount}/
                  {lesson.capacity}
                </span>
              </Button>
            ))}
          </div>
        </Dialog>
      )}
    </>
  );
}

function WeekLessonList({
  lessons,
  selectedId,
  onSelect,
  showStatus,
}: {
  lessons: Lesson[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  /** 수업 공개 상태. 회원에게는 공개된 수업만 보이므로 표시하지 않는다. */
  showStatus: boolean;
}) {
  return (
    <MenuPanel
      variant="table"
      className="timetable-list-panel"
      title="이번 주 수업"
      action={<span className="timetable-list-count">{lessons.length}개</span>}
    >
      <Table
        variant="management"
        aria-label="이번 주 수업 목록"
        className="timetable-list-table"
      >
        <TableHeader>
          <TableRow>
            {["일시", "수업", "강사·룸", "예약", ...(showStatus ? ["상태"] : [])].map((label) => (
              <TableHead key={label}>{label}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {[...lessons]
            .sort((a, b) => a.startAt.localeCompare(b.startAt))
            .map((lesson) => {
              const day = dateInSeoul(lesson.startAt);
              const weekday = weekdays[(new Date(`${day}T00:00:00Z`).getUTCDay() + 6) % 7];
              return (
                <TableRow
                  key={lesson.id}
                  data-selected={selectedId === lesson.id}
                  data-selectable="true"
                  aria-selected={selectedId === lesson.id}
                  tabIndex={0}
                  onClick={() => onSelect(lesson.id)}
                  onKeyDown={(event) => {
                    if (
                      event.target === event.currentTarget &&
                      (event.key === "Enter" || event.key === " ")
                    ) {
                      event.preventDefault();
                      onSelect(lesson.id);
                    }
                  }}
                >
                  <TableCell>
                    <div className="timetable-list-primary">
                      <strong>
                        {day.slice(5).replace("-", ".")} ({weekday})
                      </strong>
                      <span>
                        {timeInSeoul(lesson.startAt)}–
                        {dateInSeoul(lesson.endAt) !== day ? "익일 " : ""}
                        {timeInSeoul(lesson.endAt)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="timetable-list-primary">
                      <strong>{lesson.title}</strong>
                      <span>{lesson.lessonType.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="timetable-list-primary">
                      <strong>{lesson.instructor.name}</strong>
                      <span>{lesson.room.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {lesson.reservedCount} / {lesson.capacity}명
                  </TableCell>
                  {showStatus && (
                    <TableCell>
                      <StatusBadge
                        domain="lesson"
                        status={lesson.status}
                      />
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
        </TableBody>
      </Table>
    </MenuPanel>
  );
}
