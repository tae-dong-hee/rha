import { useState } from "react";
import { DatePicker } from "@/components/ui/date-picker";
import { TimePicker } from "@/components/ui/time-picker";
import { joinDateTime, splitDateTime, type DateTimeParts } from "@/lib/date-time";
import "./date-time-picker.css";

/**
 * 네이티브 `input type="datetime-local"`을 대신하는 날짜+시각 선택.
 * 날짜는 공통 달력, 시각은 공통 24시간제 선택창에서 고른다.
 */
function DateTimePicker({
  id,
  label,
  value,
  onChange,
  onBlur,
  disabled,
  ...aria
}: {
  id?: string;
  /** 시·분 선택의 접근성 이름 앞에 붙는다. 예: "시작 시각" → "시작 시각 시" */
  label: string;
  value?: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  disabled?: boolean;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
}) {
  // 날짜를 고르기 전에 시·분을 먼저 골라도 잃지 않도록 따로 둔다.
  const [pending, setPending] = useState<DateTimeParts>(() => splitDateTime(value));
  const parts = value ? splitDateTime(value) : pending;
  const update = (patch: Partial<DateTimeParts>) => {
    const next = { ...parts, ...patch };
    setPending(next);
    onChange(joinDateTime(next));
  };
  return (
    <div
      className="date-time-picker"
      data-slot="date-time-picker"
    >
      <DatePicker
        id={id}
        value={parts.date}
        onChange={(date) => update({ date })}
        onBlur={onBlur}
        disabled={disabled}
        {...aria}
      />
      <TimePicker
        label={`${label} 시각`}
        value={parts.hour ? `${parts.hour}:${parts.minute || "00"}` : ""}
        onChange={(time) => {
          const [hour, minute] = time.split(":");
          update({ hour, minute });
        }}
        disabled={disabled}
        aria-invalid={aria["aria-invalid"]}
        aria-describedby={aria["aria-describedby"]}
      />
    </div>
  );
}

export { DateTimePicker };
