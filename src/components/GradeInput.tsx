"use client";

import { formatCoefficient, formatNumber } from "@/lib/format";

type GradeInputProps = {
  id: string;
  label: string;
  value?: number;
  coefficient: number | null;
  max?: number;
  onChange: (value: number | undefined) => void;
  locked?: boolean;
  lockedLabel?: string;
};

function Label({
  htmlFor,
  label,
  coefficient,
  max,
  lockedLabel,
}: {
  htmlFor?: string;
  label: string;
  coefficient: number | null;
  max: number;
  lockedLabel?: string;
}) {
  return (
    <span className="flex items-baseline justify-between gap-2 text-sm">
      <label htmlFor={htmlFor} className="font-medium text-ink">
        {label}{" "}
        {coefficient !== null ? (
          <span className="font-normal text-ink-faint">(coef. {formatCoefficient(coefficient)})</span>
        ) : (
          <span className="font-normal text-ink-faint">/ {max}</span>
        )}
      </label>
      {lockedLabel ? (
        <span className="shrink-0 text-[0.7rem] font-medium uppercase tracking-wide text-lock">
          {lockedLabel}
        </span>
      ) : null}
    </span>
  );
}

export function GradeInput({
  id,
  label,
  value,
  coefficient,
  max = 20,
  onChange,
  locked,
  lockedLabel,
}: GradeInputProps) {
  if (locked) {
    return (
      <div className="flex flex-col gap-1.5">
        <Label label={label} coefficient={coefficient} max={max} lockedLabel={lockedLabel ?? "Note réelle"} />
        <div className="flex h-10 items-center border-b-2 border-lock/40 bg-lock-soft px-3 text-ink tnum">
          <span className="font-semibold">
            {typeof value === "number" ? formatNumber(value) : "—"}
          </span>
          <span className="ml-1 text-ink-faint">/{max}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id} label={label} coefficient={coefficient} max={max} />
      <input
        id={id}
        type="number"
        min="0"
        max={max}
        step="0.01"
        inputMode="decimal"
        value={value ?? ""}
        onChange={(event) => {
          const rawValue = event.target.value;
          if (rawValue === "") {
            onChange(undefined);
            return;
          }

          const numericValue = Number(rawValue);
          if (!Number.isNaN(numericValue)) {
            onChange(Math.min(max, Math.max(0, numericValue)));
          }
        }}
        className="h-10 border border-rule bg-surface px-3 text-ink outline-none transition-colors tnum focus:border-accent focus:ring-2 focus:ring-accent/15"
        placeholder={`0 à ${max}`}
      />
    </div>
  );
}
