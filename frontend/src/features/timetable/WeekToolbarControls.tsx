import type { ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { MonthPicker } from "@/components/ui/month-picker";
import { shiftDate } from "./model";

export function WeekToolbarControls({
  monthId,
  date,
  start,
  today,
  onChangeDate,
  navigationPrefix,
  navigationSuffix,
}: {
  monthId: string;
  date: string;
  start: string;
  today: string;
  onChangeDate: (date: string) => void;
  navigationPrefix?: ReactNode;
  navigationSuffix?: ReactNode;
}) {
  const dayLabel = (value: string) => value.slice(5).replace("-", ".");

  return (
    <div className="timetable-main-controls">
      <div className="menu-actions">
        <Field className="timetable-month">
          <FieldLabel
            htmlFor={monthId}
            className="sr-only"
          >
            조회 월
          </FieldLabel>
          <MonthPicker
            id={monthId}
            label="조회 월"
            value={date.slice(0, 7)}
            min="1900-01"
            max="9998-12"
            onChange={(month) => onChangeDate(`${month}-01`)}
          />
        </Field>
        <p
          className="timetable-period"
          aria-live="polite"
        >
          {dayLabel(start)} – {dayLabel(shiftDate(start, 6))}
        </p>
      </div>
      <div className="timetable-main-navigation">
        {navigationPrefix}
        <div
          className="timetable-week-nav"
          role="group"
          aria-label="주 이동"
        >
          <Button
            variant="ghost"
            aria-label="이전 주"
            title="이전 주"
            onClick={() => onChangeDate(shiftDate(start, -7))}
          >
            <ChevronLeft aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            onClick={() => onChangeDate(today)}
          >
            이번주
          </Button>
          <Button
            variant="ghost"
            aria-label="다음 주"
            title="다음 주"
            onClick={() => onChangeDate(shiftDate(start, 7))}
          >
            <ChevronRight aria-hidden="true" />
          </Button>
        </div>
        {navigationSuffix}
      </div>
    </div>
  );
}
