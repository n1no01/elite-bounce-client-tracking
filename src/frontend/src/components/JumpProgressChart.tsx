import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { JumpTest } from "../types";

interface ChartPoint {
  date: string;
  value: number;
  label: string;
}

interface JumpProgressChartProps {
  tests: JumpTest[];
  testType: string;
  title?: string;
  height?: number;
}

function getMetricValue(test: JumpTest): number | null {
  if (test.testType === "BJ") {
    return test.distance != null ? test.distance : null;
  }
  return test.height != null ? test.height : null;
}

function getMetricLabel(testType: string): string {
  const labels: Record<string, string> = {
    CMJ: "Height (cm)",
    "CMJ-AS": "Height (cm)",
    SJ: "Height (cm)",
    DJ: "Height (cm)",
    BJ: "Distance (cm)",
    "Approach Jump": "Height (cm)",
  };
  return labels[testType] ?? "Value";
}

function getTestDisplayName(testType: string): string {
  const names: Record<string, string> = {
    CMJ: "Countermovement Jump",
    "CMJ-AS": "CMJ with Arm Swing",
    SJ: "Squat Jump",
    DJ: "Drop Jump",
    BJ: "Broad Jump",
    "Approach Jump": "Approach Jump",
  };
  return names[testType] ?? testType;
}

interface TooltipPayload {
  value: number;
  name: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div
        className="rounded-lg px-3 py-2 text-xs"
        style={{
          background: "oklch(0.18 0.008 240)",
          border: "1px solid oklch(0.30 0.01 240)",
          boxShadow: "0 4px 12px oklch(0.05 0.003 240 / 0.8)",
        }}
      >
        <p style={{ color: "oklch(0.58 0.01 240)" }}>{label}</p>
        <p
          className="font-semibold mt-0.5"
          style={{ color: "oklch(0.82 0.14 78)" }}
        >
          {payload[0].value} {payload[0].name}
        </p>
      </div>
    );
  }
  return null;
};

export function JumpProgressChart({
  tests,
  testType,
  title,
  height = 220,
}: JumpProgressChartProps) {
  const sorted = [...tests]
    .filter((t) => getMetricValue(t) !== null)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const data: ChartPoint[] = sorted.map((t) => ({
    date: new Date(t.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    value: getMetricValue(t) as number,
    label: getMetricLabel(testType),
  }));

  if (data.length === 0) {
    return (
      <div
        className="flex items-center justify-center rounded-lg"
        style={{
          height,
          background: "oklch(0.15 0.006 240)",
          border: "1px dashed oklch(0.26 0.009 240)",
        }}
        data-ocid="chart.empty_state"
      >
        <p className="text-xs" style={{ color: "oklch(0.45 0.009 240)" }}>
          No data yet — add a {getTestDisplayName(testType)} test to see
          progress
        </p>
      </div>
    );
  }

  return (
    <div data-ocid="chart.canvas_target">
      {title && (
        <p
          className="text-xs font-semibold tracking-widest uppercase mb-3"
          style={{ color: "oklch(0.58 0.01 240)" }}
        >
          {title}
        </p>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <LineChart
          data={data}
          margin={{ top: 5, right: 8, bottom: 5, left: 0 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="oklch(0.25 0.008 240)"
            vertical={false}
          />
          <XAxis
            dataKey="date"
            tick={{ fill: "oklch(0.45 0.009 240)", fontSize: 11 }}
            axisLine={{ stroke: "oklch(0.25 0.008 240)" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "oklch(0.45 0.009 240)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={36}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="value"
            name={getMetricLabel(testType)}
            stroke="oklch(0.72 0.12 75)"
            strokeWidth={2}
            dot={{ fill: "oklch(0.72 0.12 75)", strokeWidth: 0, r: 4 }}
            activeDot={{ fill: "oklch(0.82 0.14 78)", strokeWidth: 0, r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
