import { Minus, TrendingDown, TrendingUp } from "lucide-react";
import type { JumpTest } from "../types";

interface MetricCardProps {
  testType: string;
  tests: JumpTest[];
  index?: number;
}

const TEST_DISPLAY: Record<string, { label: string; unit: string }> = {
  CMJ: { label: "CMJ", unit: "cm" },
  "CMJ-AS": { label: "CMJ-AS", unit: "cm" },
  SJ: { label: "SJ", unit: "cm" },
  DJ: { label: "Drop Jump", unit: "cm" },
  BJ: { label: "Broad Jump", unit: "cm" },
  "Approach Jump": { label: "Approach", unit: "cm" },
};

function getMetricValue(test: JumpTest): number | null {
  if (test.testType === "BJ")
    return test.distance != null ? test.distance : null;
  return test.height != null ? test.height : null;
}

export function MetricCard({ testType, tests, index = 1 }: MetricCardProps) {
  const info = TEST_DISPLAY[testType] ?? { label: testType, unit: "cm" };

  const sorted = [...tests]
    .filter((t) => getMetricValue(t) !== null)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const latest = sorted.at(-1);
  const prev = sorted.at(-2);
  const value = latest ? getMetricValue(latest) : null;
  const prevValue = prev ? getMetricValue(prev) : null;

  const delta = value !== null && prevValue !== null ? value - prevValue : null;
  const deltaPercent =
    delta !== null && prevValue ? ((delta / prevValue) * 100).toFixed(1) : null;

  const isPositive = delta !== null && delta > 0;
  const isNegative = delta !== null && delta < 0;

  return (
    <div
      className="elite-card rounded-xl p-4 flex flex-col gap-2"
      data-ocid={`metrics.item.${index}`}
    >
      <div className="flex items-start justify-between">
        <span
          className="text-xs font-semibold tracking-widest uppercase"
          style={{ color: "oklch(0.58 0.01 240)" }}
        >
          {info.label}
        </span>
        <span>
          {isPositive && (
            <TrendingUp
              className="w-3.5 h-3.5"
              style={{ color: "oklch(0.62 0.18 145)" }}
            />
          )}
          {isNegative && (
            <TrendingDown
              className="w-3.5 h-3.5"
              style={{ color: "oklch(0.58 0.22 25)" }}
            />
          )}
          {!isPositive && !isNegative && (
            <Minus
              className="w-3.5 h-3.5"
              style={{ color: "oklch(0.45 0.009 240)" }}
            />
          )}
        </span>
      </div>

      {value !== null ? (
        <p className="metric-value text-2xl text-foreground">
          {value.toFixed(1)}
          <span
            className="text-sm ml-1"
            style={{ color: "oklch(0.58 0.01 240)" }}
          >
            {info.unit}
          </span>
        </p>
      ) : (
        <p
          className="text-lg font-semibold"
          style={{ color: "oklch(0.40 0.008 240)" }}
          data-ocid="metrics.empty_state"
        >
          No data
        </p>
      )}

      {delta !== null && deltaPercent !== null && (
        <p className="text-xs font-medium">
          <span
            style={{
              color: isPositive
                ? "oklch(0.62 0.18 145)"
                : isNegative
                  ? "oklch(0.58 0.22 25)"
                  : "oklch(0.45 0.009 240)",
            }}
          >
            {isPositive ? "+" : ""}
            {delta.toFixed(1)} {info.unit} ({deltaPercent}%)
          </span>
        </p>
      )}

      {latest && (
        <p className="text-xs" style={{ color: "oklch(0.42 0.008 240)" }}>
          {new Date(latest.date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </p>
      )}
    </div>
  );
}
