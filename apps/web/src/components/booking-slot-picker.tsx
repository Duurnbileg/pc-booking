"use client";

import { Minus, Plus } from "lucide-react";
import { MAX_BOOKING_HOURS, type BookingSlot } from "@pc-booking/shared";
import { addDays, availableTimes } from "@/lib/booking";
import { todayIso } from "@/lib/search";
import { useLocale } from "@/components/locale-provider";
import { DatePicker } from "@/components/date-picker";

export function BookingSlotPicker({
  slot,
  onChange,
}: {
  slot: BookingSlot;
  onChange: (slot: BookingSlot) => void;
}) {
  const { t } = useLocale();
  const today = todayIso();
  const minDate = availableTimes(today).length ? today : addDays(today, 1);
  const times = availableTimes(slot.date);

  function changeDate(date: string) {
    const options = availableTimes(date);
    const startTime = options.includes(slot.startTime)
      ? slot.startTime
      : (options.find((time) => time.endsWith(":00")) ?? options[0] ?? slot.startTime);
    onChange({ ...slot, date, startTime });
  }

  return (
    <div className="grid gap-3 rounded-xl border border-ink-800 bg-ink-950/30 p-3 sm:grid-cols-3">
      <Control label={t("booking.date")}>
        <DatePicker value={slot.date} min={minDate} onChange={changeDate} />
      </Control>

      <Control label={t("booking.startTime")}>
        <select
          value={slot.startTime}
          onChange={(e) => onChange({ ...slot, startTime: e.target.value })}
          className="w-full cursor-pointer bg-transparent py-1.5 text-sm font-medium tabular-nums text-ink-100 focus:outline-none [color-scheme:dark]"
        >
          {times.map((time) => (
            <option key={time} value={time} className="bg-ink-900">
              {time}
            </option>
          ))}
        </select>
      </Control>

      <Control label={t("booking.duration")}>
        <div className="flex items-center gap-2 py-0.5">
          <StepButton
            label={t("booking.fewerHours")}
            disabled={slot.hours <= 1}
            onClick={() => onChange({ ...slot, hours: slot.hours - 1 })}
          >
            <Minus className="h-3.5 w-3.5" />
          </StepButton>
          <span className="min-w-[3.5rem] text-center text-sm font-medium tabular-nums text-ink-100">
            {t("booking.hoursN", { n: slot.hours })}
          </span>
          <StepButton
            label={t("booking.moreHours")}
            disabled={slot.hours >= MAX_BOOKING_HOURS}
            onClick={() => onChange({ ...slot, hours: slot.hours + 1 })}
          >
            <Plus className="h-3.5 w-3.5" />
          </StepButton>
        </div>
      </Control>
    </div>
  );
}

function Control({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0 px-1">
      <p className="text-[11px] font-medium uppercase tracking-wider text-ink-500">{label}</p>
      {children}
    </div>
  );
}

function StepButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="flex h-7 w-7 items-center justify-center rounded-full border border-ink-700 text-ink-300 transition hover:border-accent/50 hover:text-accent disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-ink-700 disabled:hover:text-ink-300"
    >
      {children}
    </button>
  );
}
