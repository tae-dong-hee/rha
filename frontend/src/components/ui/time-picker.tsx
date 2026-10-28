import { useRef, useState } from "react";
import { Clock3Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { hourOptions, minuteOptions } from "@/lib/date-time";
import "./time-picker.css";

/** 영업시간처럼 날짜 없이 HH:mm 값을 고르는 공통 시각 선택기. */
function TimePicker({
  id,
  label,
  value,
  onChange,
  disabled,
  required,
  "aria-invalid": invalid,
  "aria-describedby": describedBy,
}: {
  id?: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
}) {
  const [open, setOpen] = useState(false);
  const [hour = "", minute = ""] = value.split(":");
  const hourList = useRef<HTMLDivElement>(null);
  const minuteList = useRef<HTMLDivElement>(null);

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
    >
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          data-slot="time-picker"
          className="time-picker-trigger"
          aria-label={label}
          aria-required={required}
          aria-invalid={invalid}
          aria-describedby={describedBy}
          disabled={disabled}
        >
          <span>{value || "시간 선택"}</span>
          <Clock3Icon aria-hidden="true" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="time-picker-popup"
        align="start"
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          for (const list of [hourList.current, minuteList.current]) {
            const selected = list?.querySelector<HTMLElement>('[aria-pressed="true"]');
            if (!list || !selected) continue;
            list.scrollTop +=
              selected.getBoundingClientRect().top -
              list.getBoundingClientRect().top -
              (list.clientHeight - selected.clientHeight) / 2;
          }
          (
            hourList.current?.querySelector<HTMLElement>('[aria-pressed="true"]') ??
            hourList.current?.querySelector<HTMLElement>("button")
          )?.focus({ preventScroll: true });
        }}
      >
        <div className="time-picker-heading">
          <strong>시간 선택</strong>
          <span>24시간제</span>
        </div>
        <div className="time-picker-columns">
          <div>
            <span className="time-picker-column-label">시</span>
            <div
              className="time-picker-options"
              role="group"
              aria-label={`${label} 시`}
              ref={hourList}
            >
              {hourOptions().map((option) => (
                <Button
                  key={option}
                  type="button"
                  variant={hour === option ? "secondary" : "ghost"}
                  size="sm"
                  aria-pressed={hour === option}
                  onClick={() => onChange(`${option}:${minute || "00"}`)}
                >
                  {option}시
                </Button>
              ))}
            </div>
          </div>
          <div>
            <span className="time-picker-column-label">분</span>
            <div
              className="time-picker-options"
              role="group"
              aria-label={`${label} 분`}
              ref={minuteList}
            >
              {minuteOptions(minute).map((option) => (
                <Button
                  key={option}
                  type="button"
                  variant={minute === option ? "secondary" : "ghost"}
                  size="sm"
                  aria-pressed={minute === option}
                  onClick={() => {
                    onChange(`${hour || "00"}:${option}`);
                    setOpen(false);
                  }}
                >
                  {option}분
                </Button>
              ))}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export { TimePicker };
