import { useState } from "react";
import { CalendarDaysIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import "./month-picker.css";

const months = Array.from({ length: 12 }, (_, index) => index + 1);
const pad = (value: number) => String(value).padStart(2, "0");

function MonthPicker({
  id,
  label,
  value,
  min = "1900-01",
  max = "9998-12",
  onChange,
}: {
  id?: string;
  label: string;
  value: string;
  min?: string;
  max?: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selectedYear = Number(value.slice(0, 4));
  const [viewYear, setViewYear] = useState(selectedYear);
  const [yearInput, setYearInput] = useState(String(selectedYear));
  const minYear = Number(min.slice(0, 4));
  const maxYear = Number(max.slice(0, 4));

  const showYear = (year: number) => {
    setViewYear(year);
    setYearInput(String(year));
  };

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (next) showYear(selectedYear);
        setOpen(next);
      }}
    >
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          data-slot="month-picker"
          className="month-picker-trigger"
          aria-label={label}
        >
          <span>
            {selectedYear}년 {Number(value.slice(5, 7))}월
          </span>
          <CalendarDaysIcon aria-hidden="true" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="month-picker-popup"
        align="start"
      >
        <div className="month-picker-header">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="이전 연도"
            disabled={viewYear <= minYear}
            onClick={() => showYear(viewYear - 1)}
          >
            <ChevronLeftIcon aria-hidden="true" />
          </Button>
          <div className="month-picker-year">
            <Input
              type="text"
              inputMode="numeric"
              aria-label="조회 연도"
              value={yearInput}
              onChange={(event) => {
                const next = event.target.value;
                if (!/^\d{0,4}$/.test(next)) return;
                setYearInput(next);
                const year = Number(next);
                if (next.length === 4 && year >= minYear && year <= maxYear) {
                  setViewYear(year);
                }
              }}
              onBlur={() => setYearInput(String(viewYear))}
              onKeyDown={(event) => {
                if (event.key === "Enter") event.currentTarget.blur();
              }}
            />
            <span>년</span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="다음 연도"
            disabled={viewYear >= maxYear}
            onClick={() => showYear(viewYear + 1)}
          >
            <ChevronRightIcon aria-hidden="true" />
          </Button>
        </div>
        <div
          className="month-picker-grid"
          role="group"
          aria-label={`${viewYear}년 월 선택`}
        >
          {months.map((month) => {
            const option = `${viewYear}-${pad(month)}`;
            return (
              <Button
                key={month}
                type="button"
                variant={option === value ? "secondary" : "ghost"}
                size="sm"
                aria-pressed={option === value}
                disabled={option < min || option > max}
                onClick={() => {
                  onChange(option);
                  setOpen(false);
                }}
              >
                {month}월
              </Button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export { MonthPicker };
