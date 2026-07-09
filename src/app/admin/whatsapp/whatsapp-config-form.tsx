"use client";

import { useActionState } from "react";
import { toast } from "sonner";
import { useEffect, useRef } from "react";
import { saveAutoResponderConfig, type SaveConfigState } from "./actions";
import type { AutoResponderConfig } from "@/lib/whatsapp/config";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Mail, MessageSquare, Calendar } from "lucide-react";

const WEEKDAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

const WEEKDAY_LABELS: Record<string, string> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
};

const TIMEZONE_OPTIONS = [
  "Australia/Perth",
  "Australia/Sydney",
  "Australia/Melbourne",
  "Australia/Brisbane",
  "Australia/Adelaide",
  "Australia/Darwin",
  "Australia/Hobart",
  "Europe/London",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Asia/Kolkata",
  "Pacific/Auckland",
];

/** Generate time options in 30-minute increments for selects */
function generateTimeOptions(): string[] {
  const options: string[] = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 30) {
      options.push(
        `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`,
      );
    }
  }
  return options;
}

const TIME_OPTIONS = generateTimeOptions();

const initialState: SaveConfigState = { success: false };

interface WhatsAppConfigFormProps {
  config: AutoResponderConfig;
}

export function WhatsAppConfigForm({ config }: WhatsAppConfigFormProps) {
  const [state, formAction, pending] = useActionState(
    saveAutoResponderConfig,
    initialState,
  );
  const prevSuccessRef = useRef(false);

  // Show toast on successful save
  useEffect(() => {
    if (state.success && !prevSuccessRef.current) {
      toast.success("Auto-responder configuration saved successfully.");
    }
    prevSuccessRef.current = state.success;
  }, [state.success]);

  // Show toast on error
  useEffect(() => {
    if (state.error) {
      toast.error(state.error);
    }
  }, [state.error]);

  return (
    <form action={formAction} className="space-y-6">
      {/* Enabled Toggle + Cooldown */}
      <Card variant="elevated">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            General Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Auto-Responder Enabled</p>
              <p className="text-sm text-muted-foreground">
                When disabled, leads are still captured but no reply is sent.
              </p>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                name="enabled"
                value="true"
                defaultChecked={config.enabled}
                className="peer sr-only"
              />
              <div className="h-6 w-11 rounded-full bg-muted peer-checked:bg-emerald-500 peer-focus:ring-2 peer-focus:ring-primary/50 transition-colors">
                <div className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition-transform peer-checked:translate-x-5" />
              </div>
            </label>
          </div>

          <div>
            <label
              htmlFor="cooldownMinutes"
              className="text-sm font-medium text-muted-foreground"
            >
              Cooldown (minutes)
            </label>
            <p className="text-xs text-muted-foreground mb-1">
              Suppress repeat acknowledgements within this window (0–1440).
            </p>
            <input
              id="cooldownMinutes"
              name="cooldownMinutes"
              type="number"
              min={0}
              max={1440}
              defaultValue={config.cooldownMinutes}
              className="mt-1 block w-full max-w-[200px] rounded-lg border border-border bg-background px-3 py-2 text-foreground sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <FieldError errors={state.fieldErrors} field="cooldownMinutes" />
          </div>
        </CardContent>
      </Card>

      {/* Message Templates */}
      <Card variant="elevated">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            Message Templates
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label
              htmlFor="inHoursMessage"
              className="text-sm font-medium text-muted-foreground"
            >
              In-Hours Message
            </label>
            <textarea
              id="inHoursMessage"
              name="inHoursMessage"
              rows={3}
              defaultValue={config.inHoursMessage}
              className="mt-1 block w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-y"
            />
            <FieldError errors={state.fieldErrors} field="inHoursMessage" />
          </div>

          <div>
            <label
              htmlFor="awayMessage"
              className="text-sm font-medium text-muted-foreground"
            >
              Away Message
            </label>
            <textarea
              id="awayMessage"
              name="awayMessage"
              rows={3}
              defaultValue={config.awayMessage}
              className="mt-1 block w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-y"
            />
            <FieldError errors={state.fieldErrors} field="awayMessage" />
          </div>
        </CardContent>
      </Card>

      {/* Business Hours */}
      <Card variant="elevated">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            Business Hours
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label
              htmlFor="timezone"
              className="text-sm font-medium text-muted-foreground"
            >
              Timezone
            </label>
            <select
              id="timezone"
              name="timezone"
              defaultValue={config.businessHours.timezone}
              className="mt-1 block w-full max-w-xs rounded-lg border border-border bg-background px-3 py-2 text-foreground sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              {TIMEZONE_OPTIONS.map((tz) => (
                <option key={tz} value={tz}>
                  {tz.replace(/_/g, " ")}
                </option>
              ))}
            </select>
            <FieldError
              errors={state.fieldErrors}
              field="businessHours.timezone"
            />
          </div>

          <div className="space-y-3">
            {WEEKDAYS.map((day) => {
              const hours = config.businessHours.days[day];
              const isClosed = hours === null;

              return (
                <DayRow
                  key={day}
                  day={day}
                  label={WEEKDAY_LABELS[day]}
                  defaultClosed={isClosed}
                  defaultOpen={hours?.open ?? "09:00"}
                  defaultClose={hours?.close ?? "17:00"}
                  errors={state.fieldErrors}
                />
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Routing */}
      <Card variant="elevated">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            Lead Routing
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <label
              htmlFor="routingDefaultEmail"
              className="text-sm font-medium text-muted-foreground"
            >
              Default Routing Email
            </label>
            <p className="text-xs text-muted-foreground mb-1">
              Where lead notifications are sent when no vendor is associated.
            </p>
            <input
              id="routingDefaultEmail"
              name="routingDefaultEmail"
              type="email"
              defaultValue={config.routingDefaultEmail}
              className="mt-1 block w-full max-w-md rounded-lg border border-border bg-background px-3 py-2 text-foreground sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <FieldError errors={state.fieldErrors} field="routingDefaultEmail" />
          </div>
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {pending ? "Saving…" : "Save Configuration"}
        </button>
      </div>
    </form>
  );
}

/** Per-weekday row with closed toggle and time selects */
function DayRow({
  day,
  label,
  defaultClosed,
  defaultOpen,
  defaultClose,
  errors,
}: {
  day: string;
  label: string;
  defaultClosed: boolean;
  defaultOpen: string;
  defaultClose: string;
  errors?: Record<string, string[]>;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border px-3 py-2">
      <span className="w-24 text-sm font-medium text-foreground">{label}</span>

      <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <input
          type="checkbox"
          name={`${day}_closed`}
          value="true"
          defaultChecked={defaultClosed}
          className="rounded border-border"
        />
        Closed
      </label>

      <div className="flex items-center gap-2 ml-auto">
        <select
          name={`${day}_open`}
          defaultValue={defaultOpen}
          className="rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          {TIME_OPTIONS.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <span className="text-xs text-muted-foreground">to</span>
        <select
          name={`${day}_close`}
          defaultValue={defaultClose}
          className="rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          {TIME_OPTIONS.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      <FieldError errors={errors} field={`businessHours.days.${day}.close`} />
    </div>
  );
}

/** Inline field error display */
function FieldError({
  errors,
  field,
}: {
  errors?: Record<string, string[]>;
  field: string;
}) {
  const fieldErrors = errors?.[field];
  if (!fieldErrors?.length) return null;
  return (
    <p className="mt-1 text-xs text-red-600 dark:text-red-400" aria-live="polite">
      {fieldErrors.join(", ")}
    </p>
  );
}
