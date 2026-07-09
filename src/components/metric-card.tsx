import { type LucideIcon, Eye, Phone, MessageCircle, TrendingUp, Car, ArrowUpRight, ArrowUp, ArrowDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/** Props for the MetricCard component */
export interface MetricCardProps {
  /** The metric name — displayed uppercase at 13px, font-weight 700 */
  label: string;
  /** The main numeric value — displayed at 36px+, font-weight 800+ */
  value: string | number;
  /** Optional helper text shown below the value */
  helper?: string;
  /** Category icon — accepts a LucideIcon component or a preset string key */
  icon?: LucideIcon | "eye" | "phone" | "chat" | "trend" | "car" | "leads";
  /** Optional trend indicator showing percentage change with directional arrow */
  trend?: { value: number; direction?: "up" | "down"; label?: string };
  /** Accent color for the icon tinted container */
  accent?: "blue" | "green" | "amber" | "emerald" | "slate" | "primary";
}

const iconMap: Record<string, LucideIcon> = {
  eye: Eye,
  phone: Phone,
  chat: MessageCircle,
  trend: TrendingUp,
  car: Car,
  leads: ArrowUpRight,
};

const iconBgMap: Record<string, string> = {
  blue: "bg-blue-100 text-blue-600",
  green: "bg-green-100 text-green-600",
  amber: "bg-amber-100 text-amber-600",
  emerald: "bg-emerald-100 text-emerald-600",
  slate: "bg-slate-100 text-slate-600",
  primary: "bg-primary/10 text-primary",
};

export function MetricCard({
  label,
  value,
  helper,
  icon,
  trend,
  accent = "primary",
}: MetricCardProps) {
  // Resolve icon: supports both LucideIcon components and string keys
  let Icon: LucideIcon | null = null;
  if (icon) {
    if (typeof icon === "string") {
      Icon = iconMap[icon] || null;
    } else {
      Icon = icon;
    }
  }

  const iconBg = iconBgMap[accent];

  // Determine trend direction from explicit prop or infer from value
  const trendDirection = trend
    ? trend.direction ?? (trend.value >= 0 ? "up" : "down")
    : undefined;

  return (
    <Card variant="elevated" className="h-full">
      <CardContent className="flex flex-col h-full p-6">
        {/* Header: Label + Icon */}
        <div className="flex items-start justify-between mb-4">
          <p className="text-[13px] font-bold uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          {Icon && (
            <div
              className={cn(
                "flex h-11 w-11 items-center justify-center rounded-xl",
                iconBg
              )}
            >
              <Icon className="h-5 w-5" />
            </div>
          )}
        </div>

        {/* Numeric Value */}
        <p className="text-[36px] font-extrabold leading-tight tracking-tight text-foreground tabular-nums">
          {value}
        </p>

        {/* Footer: Helper text + Trend indicator */}
        <div className="mt-auto flex items-center justify-between pt-4">
          {helper && (
            <p className="text-xs font-semibold text-muted-foreground">
              {helper}
            </p>
          )}
          {trend && (
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider",
                trendDirection === "up"
                  ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                  : "bg-red-50 text-red-600 border border-red-100"
              )}
            >
              {trendDirection === "up" ? (
                <ArrowUp className="h-3 w-3" />
              ) : (
                <ArrowDown className="h-3 w-3" />
              )}
              {Math.abs(trend.value)}%
              {trend.label && <span className="ml-0.5">{trend.label}</span>}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
