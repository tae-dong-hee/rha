import { Input } from "@/components/ui/input";

const formatMoney = (value: string) =>
  value.replace(/\D/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, ",");

function MoneyInput({
  id,
  value,
  onChange,
  onBlur,
  disabled,
  invalid,
  describedBy,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  disabled?: boolean;
  invalid?: boolean;
  describedBy?: string;
}) {
  return (
    <Input
      id={id}
      type="text"
      inputMode="numeric"
      autoComplete="off"
      value={formatMoney(value)}
      onChange={(event) => onChange(event.target.value.replace(/\D/g, "").replace(/^0+(?=\d)/, ""))}
      onBlur={onBlur}
      disabled={disabled}
      aria-invalid={invalid}
      aria-describedby={describedBy}
    />
  );
}

export { MoneyInput };
