import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, ChevronDown, X } from "lucide-react";
import { useState } from "react";
import { computeCmjSjDelta } from "../components/PersonalBests";
import {
  useGetAllAthletes,
  useGetJumpTestsForAthlete,
  useGetStrengthRecordsForAthlete,
} from "../hooks/useQueries";
import type {
  Athlete,
  AthleteId,
  JumpTest,
  StrengthLiftType,
  StrengthRecord,
  TestType,
} from "../types";

const TEST_TYPES: TestType[] = [
  "CMJ",
  "CMJ-AS",
  "SJ",
  "Approach Jump",
  "BJ",
  "DJ",
];

const TEST_DISPLAY_NAMES: Record<TestType, string> = {
  CMJ: "Countermovement Jump",
  "CMJ-AS": "CMJ with Arm Swing",
  SJ: "Squat Jump",
  "Approach Jump": "Approach Jump",
  BJ: "Broad Jump",
  DJ: "Drop Jump",
};

const LIFT_TYPES: StrengthLiftType[] = ["backSquat", "powerClean", "deadlift"];

const LIFT_DISPLAY_NAMES: Record<StrengthLiftType, string> = {
  backSquat: "Back Squat",
  powerClean: "Power Clean",
  deadlift: "Deadlift",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getJumpBest(
  tests: JumpTest[],
  testType: TestType,
): { value: number | null; rsi: number | null; date: string | null } {
  const filtered = tests.filter((t) => t.testType === testType);
  if (filtered.length === 0) return { value: null, rsi: null, date: null };

  if (testType === "BJ") {
    const best = filtered.reduce(
      (acc, t) => ((t.distance ?? 0) > (acc.distance ?? 0) ? t : acc),
      filtered[0],
    );
    return {
      value: best.distance ?? null,
      rsi: null,
      date: best.date,
    };
  }

  const best = filtered.reduce(
    (acc, t) => ((t.height ?? 0) > (acc.height ?? 0) ? t : acc),
    filtered[0],
  );
  return {
    value: best.height ?? null,
    rsi: testType === "DJ" ? (best.rsi ?? null) : null,
    date: best.date,
  };
}

function getStrengthBest(
  records: StrengthRecord[],
  liftType: StrengthLiftType,
): { value: number | null; date: string | null } {
  const filtered = records.filter((r) => r.liftType === liftType);
  if (filtered.length === 0) return { value: null, date: null };
  const best = filtered.reduce(
    (acc, r) => (r.weightKg > acc.weightKg ? r : acc),
    filtered[0],
  );
  return { value: best.weightKg, date: best.date };
}

// ─── Athlete Selector ─────────────────────────────────────────────────────────

interface AthleteSelectorProps {
  label: string;
  athletes: Athlete[];
  selected: AthleteId | null;
  disabledId: AthleteId | null;
  onSelect: (id: AthleteId | null) => void;
  ocidPrefix: string;
}

function AthleteSelector({
  label,
  athletes,
  selected,
  disabledId,
  onSelect,
  ocidPrefix,
}: AthleteSelectorProps) {
  const selectedAthlete = athletes.find((a) => a.id === selected) ?? null;
  const selectId = `athlete-selector-${ocidPrefix}`;

  return (
    <div className="flex-1 min-w-0">
      <label
        htmlFor={selectId}
        className="block text-xs font-semibold tracking-widest uppercase mb-2"
        style={{ color: "oklch(0.72 0.12 75)" }}
      >
        {label}
      </label>
      <div className="relative">
        <select
          id={selectId}
          value={selected !== null ? selected.toString() : ""}
          onChange={(e) => {
            const val = e.target.value;
            onSelect(val ? BigInt(val) : null);
          }}
          className="w-full appearance-none rounded-lg px-4 py-3 pr-10 text-sm font-medium transition-colors focus:outline-none focus:ring-2"
          style={{
            background: "oklch(0.16 0.007 240)",
            border: "1px solid oklch(0.28 0.01 240)",
            color: selected ? "oklch(0.95 0.005 240)" : "oklch(0.50 0.009 240)",
          }}
          data-ocid={`${ocidPrefix}.select`}
        >
          <option value="">Select an athlete...</option>
          {athletes.map((a) => (
            <option
              key={a.id.toString()}
              value={a.id.toString()}
              disabled={disabledId !== null && a.id === disabledId}
            >
              {a.name} — {a.sport}
            </option>
          ))}
        </select>
        <ChevronDown
          className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
          style={{ color: "oklch(0.50 0.009 240)" }}
        />
      </div>

      {selectedAthlete && (
        <div
          className="mt-2 flex items-center gap-2 px-3 py-2 rounded-lg"
          style={{
            background: "oklch(0.72 0.12 75 / 0.08)",
            border: "1px solid oklch(0.72 0.12 75 / 0.25)",
          }}
        >
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
            style={{
              background: "oklch(0.72 0.12 75 / 0.2)",
              color: "oklch(0.78 0.13 75)",
            }}
          >
            {selectedAthlete.name[0]?.toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p
              className="text-sm font-semibold truncate"
              style={{ color: "oklch(0.93 0.005 240)" }}
            >
              {selectedAthlete.name}
            </p>
            <p
              className="text-xs truncate"
              style={{ color: "oklch(0.55 0.009 240)" }}
            >
              {selectedAthlete.sport} · Age {Number(selectedAthlete.age)}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onSelect(null)}
            className="p-1 rounded transition-colors hover:bg-muted shrink-0"
            aria-label="Clear selection"
            data-ocid={`${ocidPrefix}.clear_button`}
          >
            <X
              className="w-3.5 h-3.5"
              style={{ color: "oklch(0.55 0.009 240)" }}
            />
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Personal Bests Table ─────────────────────────────────────────────────────

interface PersonalBestsTableProps {
  tests1: JumpTest[];
  tests2: JumpTest[];
  strength1: StrengthRecord[];
  strength2: StrengthRecord[];
  athlete1Name: string;
  athlete2Name: string;
}

function ValueCell({
  value,
  unit,
  isWinner,
  isTie,
}: {
  value: number | null;
  unit: string;
  isWinner: boolean;
  isTie: boolean;
}) {
  if (value === null) {
    return (
      <span className="text-sm" style={{ color: "oklch(0.38 0.009 240)" }}>
        —
      </span>
    );
  }
  return (
    <span
      className={`text-sm font-semibold tabular-nums ${isWinner && !isTie ? "font-bold" : ""}`}
      style={{
        color:
          isWinner && !isTie ? "oklch(0.78 0.13 75)" : "oklch(0.90 0.005 240)",
      }}
    >
      {value}
      <span
        className="text-xs ml-0.5"
        style={{ color: "oklch(0.52 0.009 240)" }}
      >
        {unit}
      </span>
    </span>
  );
}

function PersonalBestsTable({
  tests1,
  tests2,
  strength1,
  strength2,
  athlete1Name,
  athlete2Name,
}: PersonalBestsTableProps) {
  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ border: "1px solid oklch(0.22 0.008 240)" }}
      data-ocid="comparison.table"
    >
      {/* Header */}
      <div
        className="grid grid-cols-3 px-5 py-3 text-xs font-semibold tracking-widest uppercase"
        style={{
          background: "oklch(0.16 0.007 240)",
          borderBottom: "1px solid oklch(0.22 0.008 240)",
          color: "oklch(0.55 0.009 240)",
        }}
      >
        <span>Metric</span>
        <span
          className="text-center truncate"
          style={{ color: "oklch(0.72 0.12 75)" }}
        >
          {athlete1Name}
        </span>
        <span
          className="text-center truncate"
          style={{ color: "oklch(0.72 0.12 75)" }}
        >
          {athlete2Name}
        </span>
      </div>
      {/* Jump Tests section label */}
      <div
        className="px-5 py-2"
        style={{
          background: "oklch(0.14 0.006 240)",
          borderBottom: "1px solid oklch(0.20 0.008 240)",
        }}
      >
        <span
          className="text-xs font-semibold tracking-widest uppercase"
          style={{ color: "oklch(0.50 0.009 240)" }}
        >
          Jump Tests
        </span>
      </div>
      {/* Jump rows */}
      {TEST_TYPES.map((testType, i) => {
        const best1 = getJumpBest(tests1, testType);
        const best2 = getJumpBest(tests2, testType);
        const unit = testType === "BJ" ? "cm" : "cm";
        const val1 = best1.value;
        const val2 = best2.value;
        const winner1 = val1 !== null && val2 !== null && val1 > val2;
        const winner2 = val1 !== null && val2 !== null && val2 > val1;
        const tie = val1 !== null && val2 !== null && val1 === val2;

        return (
          <div
            key={testType}
            className="grid grid-cols-3 px-5 py-4 items-start"
            style={{
              background:
                i % 2 === 0
                  ? "oklch(0.13 0.006 240)"
                  : "oklch(0.115 0.005 240)",
              borderBottom: "1px solid oklch(0.18 0.007 240)",
            }}
            data-ocid={`comparison.row.${i + 1}`}
          >
            {/* Metric name */}
            <div>
              <p
                className="text-xs font-bold tracking-wide"
                style={{ color: "oklch(0.80 0.009 240)" }}
              >
                {testType}
              </p>
              <p
                className="text-xs mt-0.5"
                style={{ color: "oklch(0.45 0.009 240)" }}
              >
                {TEST_DISPLAY_NAMES[testType]}
              </p>
            </div>

            {/* Athlete 1 */}
            <div className="text-center">
              <ValueCell
                value={val1}
                unit={unit}
                isWinner={winner1}
                isTie={tie}
              />
              {testType === "DJ" && best1.rsi !== null && (
                <p
                  className="text-xs mt-1"
                  style={{ color: "oklch(0.55 0.009 240)" }}
                >
                  RSI:{" "}
                  <span
                    style={{
                      color:
                        best1.rsi > (best2.rsi ?? 0) && !tie
                          ? "oklch(0.78 0.13 75)"
                          : "oklch(0.75 0.009 240)",
                    }}
                  >
                    {best1.rsi.toFixed(2)}
                  </span>
                </p>
              )}
            </div>

            {/* Athlete 2 */}
            <div className="text-center">
              <ValueCell
                value={val2}
                unit={unit}
                isWinner={winner2}
                isTie={tie}
              />
              {testType === "DJ" && best2.rsi !== null && (
                <p
                  className="text-xs mt-1"
                  style={{ color: "oklch(0.55 0.009 240)" }}
                >
                  RSI:{" "}
                  <span
                    style={{
                      color:
                        best2.rsi > (best1.rsi ?? 0) && !tie
                          ? "oklch(0.78 0.13 75)"
                          : "oklch(0.75 0.009 240)",
                    }}
                  >
                    {best2.rsi.toFixed(2)}
                  </span>
                </p>
              )}
            </div>
          </div>
        );
      })}
      {/* Strength section label */} {/* CMJ vs SJ delta section */}
      <div
        className="px-5 py-2"
        style={{
          background: "oklch(0.14 0.006 240)",
          borderBottom: "1px solid oklch(0.20 0.008 240)",
          borderTop: "1px solid oklch(0.22 0.008 240)",
        }}
      >
        <span
          className="text-xs font-semibold tracking-widest uppercase"
          style={{ color: "oklch(0.78 0.13 75)" }}
        >
          CMJ vs SJ Analysis
        </span>
      </div>
      {/* CMJ vs SJ rows */}
      {(() => {
        const delta1 = computeCmjSjDelta(tests1);
        const delta2 = computeCmjSjDelta(tests2);
        const rows: Array<{
          label: string;
          sublabel: string;
          val1: number | null;
          val2: number | null;
          unit: string;
          isGold?: boolean;
        }> = [
          {
            label: "Best CMJ",
            sublabel: "With arm swing",
            val1: delta1.bestCmj,
            val2: delta2.bestCmj,
            unit: "cm",
          },
          {
            label: "Best SJ",
            sublabel: "No arm swing",
            val1: delta1.bestSj,
            val2: delta2.bestSj,
            unit: "cm",
          },
          {
            label: "CMJ Advantage",
            sublabel: "CMJ minus SJ",
            val1: delta1.diffCm,
            val2: delta2.diffCm,
            unit: "cm",
            isGold: true,
          },
          {
            label: "% Difference",
            sublabel: "Relative to SJ",
            val1: delta1.diffPct,
            val2: delta2.diffPct,
            unit: "%",
            isGold: true,
          },
        ];
        return rows.map((row, i) => {
          const { val1, val2, unit, label, sublabel, isGold } = row;
          const winner1 = val1 !== null && val2 !== null && val1 > val2;
          const winner2 = val1 !== null && val2 !== null && val2 > val1;
          const tie = val1 !== null && val2 !== null && val1 === val2;

          const formatVal = (v: number | null) => {
            if (v === null) return null;
            return unit === "%"
              ? Math.round(v * 10) / 10
              : Math.round(v * 10) / 10;
          };

          return (
            <div
              key={label}
              className="grid grid-cols-3 px-5 py-4 items-start"
              style={{
                background:
                  i % 2 === 0
                    ? "oklch(0.13 0.006 240)"
                    : "oklch(0.115 0.005 240)",
                borderBottom:
                  i < rows.length - 1
                    ? "1px solid oklch(0.18 0.007 240)"
                    : "none",
              }}
              data-ocid={`comparison.cmj_sj.row.${i + 1}`}
            >
              <div>
                <p
                  className="text-xs font-bold tracking-wide"
                  style={{
                    color: isGold
                      ? "oklch(0.78 0.13 75)"
                      : "oklch(0.80 0.009 240)",
                  }}
                >
                  {label}
                </p>
                <p
                  className="text-xs mt-0.5"
                  style={{ color: "oklch(0.45 0.009 240)" }}
                >
                  {sublabel}
                </p>
              </div>
              <div className="text-center">
                {val1 === null ? (
                  <span
                    className="text-sm"
                    style={{ color: "oklch(0.38 0.009 240)" }}
                  >
                    —
                  </span>
                ) : (
                  <span
                    className="text-sm font-semibold tabular-nums"
                    style={{
                      color:
                        winner1 && !tie
                          ? "oklch(0.78 0.13 75)"
                          : "oklch(0.90 0.005 240)",
                    }}
                  >
                    {val1 >= 0 && isGold ? "+" : ""}
                    {formatVal(val1)}
                    <span
                      className="text-xs ml-0.5"
                      style={{ color: "oklch(0.52 0.009 240)" }}
                    >
                      {unit}
                    </span>
                  </span>
                )}
              </div>
              <div className="text-center">
                {val2 === null ? (
                  <span
                    className="text-sm"
                    style={{ color: "oklch(0.38 0.009 240)" }}
                  >
                    —
                  </span>
                ) : (
                  <span
                    className="text-sm font-semibold tabular-nums"
                    style={{
                      color:
                        winner2 && !tie
                          ? "oklch(0.78 0.13 75)"
                          : "oklch(0.90 0.005 240)",
                    }}
                  >
                    {val2 >= 0 && isGold ? "+" : ""}
                    {formatVal(val2)}
                    <span
                      className="text-xs ml-0.5"
                      style={{ color: "oklch(0.52 0.009 240)" }}
                    >
                      {unit}
                    </span>
                  </span>
                )}
              </div>
            </div>
          );
        });
      })()}
      <div
        className="px-5 py-2"
        style={{
          background: "oklch(0.14 0.006 240)",
          borderBottom: "1px solid oklch(0.20 0.008 240)",
          borderTop: "1px solid oklch(0.22 0.008 240)",
        }}
      >
        <span
          className="text-xs font-semibold tracking-widest uppercase"
          style={{ color: "oklch(0.50 0.009 240)" }}
        >
          Strength Records
        </span>
      </div>
      {/* Strength rows */}
      {LIFT_TYPES.map((liftType, i) => {
        const best1 = getStrengthBest(strength1, liftType);
        const best2 = getStrengthBest(strength2, liftType);
        const val1 = best1.value;
        const val2 = best2.value;
        const winner1 = val1 !== null && val2 !== null && val1 > val2;
        const winner2 = val1 !== null && val2 !== null && val2 > val1;
        const tie = val1 !== null && val2 !== null && val1 === val2;

        return (
          <div
            key={liftType}
            className="grid grid-cols-3 px-5 py-4 items-center"
            style={{
              background:
                i % 2 === 0
                  ? "oklch(0.13 0.006 240)"
                  : "oklch(0.115 0.005 240)",
              borderBottom:
                i < LIFT_TYPES.length - 1
                  ? "1px solid oklch(0.18 0.007 240)"
                  : "none",
            }}
            data-ocid={`comparison.strength.row.${i + 1}`}
          >
            <div>
              <p
                className="text-xs font-bold tracking-wide"
                style={{ color: "oklch(0.80 0.009 240)" }}
              >
                {LIFT_DISPLAY_NAMES[liftType]}
              </p>
              <p
                className="text-xs mt-0.5"
                style={{ color: "oklch(0.45 0.009 240)" }}
              >
                Max weight lifted
              </p>
            </div>

            <div className="text-center">
              <ValueCell
                value={val1}
                unit="kg"
                isWinner={winner1}
                isTie={tie}
              />
            </div>

            <div className="text-center">
              <ValueCell
                value={val2}
                unit="kg"
                isWinner={winner2}
                isTie={tie}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Comparison content (fetches data) ────────────────────────────────────────

interface ComparisonContentProps {
  athleteId1: AthleteId;
  athleteId2: AthleteId;
  athlete1Name: string;
  athlete2Name: string;
}

function ComparisonContent({
  athleteId1,
  athleteId2,
  athlete1Name,
  athlete2Name,
}: ComparisonContentProps) {
  const { data: tests1 = [], isLoading: loadingTests1 } =
    useGetJumpTestsForAthlete(athleteId1);
  const { data: tests2 = [], isLoading: loadingTests2 } =
    useGetJumpTestsForAthlete(athleteId2);
  const { data: strength1 = [], isLoading: loadingStrength1 } =
    useGetStrengthRecordsForAthlete(athleteId1);
  const { data: strength2 = [], isLoading: loadingStrength2 } =
    useGetStrengthRecordsForAthlete(athleteId2);

  const isLoading =
    loadingTests1 || loadingTests2 || loadingStrength1 || loadingStrength2;

  if (isLoading) {
    return (
      <div className="space-y-2" data-ocid="comparison.loading_state">
        {["c1", "c2", "c3", "c4", "c5", "c6", "c7", "c8", "c9"].map((k) => (
          <Skeleton key={k} className="h-14 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <PersonalBestsTable
      tests1={tests1}
      tests2={tests2}
      strength1={strength1}
      strength2={strength2}
      athlete1Name={athlete1Name}
      athlete2Name={athlete2Name}
    />
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function AthleteComparison() {
  const { data: athletes = [], isLoading } = useGetAllAthletes();
  const [athleteId1, setAthleteId1] = useState<AthleteId | null>(null);
  const [athleteId2, setAthleteId2] = useState<AthleteId | null>(null);

  const athlete1 = athletes.find((a) => a.id === athleteId1) ?? null;
  const athlete2 = athletes.find((a) => a.id === athleteId2) ?? null;
  const canCompare =
    athleteId1 !== null && athleteId2 !== null && athleteId1 !== athleteId2;

  return (
    <div
      className="min-h-screen"
      style={{ background: "oklch(0.10 0.005 240)" }}
      data-ocid="comparison.page"
    >
      {/* Page header */}
      <div
        className="sticky top-16 z-40 border-b"
        style={{
          background:
            "linear-gradient(180deg, oklch(0.14 0.006 240) 0%, oklch(0.12 0.005 240) 100%)",
          borderColor: "oklch(0.22 0.008 240)",
        }}
      >
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4 mb-1">
            <Link
              to="/athletes"
              className="flex items-center gap-1.5 text-xs transition-colors hover:text-foreground"
              style={{ color: "oklch(0.52 0.009 240)" }}
              data-ocid="comparison.back_link"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Athletes
            </Link>
          </div>
          <h1
            className="font-display text-2xl font-bold tracking-tight"
            style={{ color: "oklch(0.95 0.005 240)" }}
          >
            Athlete{" "}
            <span style={{ color: "oklch(0.78 0.13 75)" }}>Comparison</span>
          </h1>
          <p
            className="text-xs mt-1"
            style={{ color: "oklch(0.50 0.009 240)" }}
          >
            Personal bests side-by-side
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        {/* Selector panel */}
        <div
          className="rounded-xl p-6"
          style={{
            background: "oklch(0.14 0.006 240)",
            border: "1px solid oklch(0.22 0.008 240)",
          }}
          data-ocid="comparison.panel"
        >
          <p
            className="text-xs font-semibold tracking-widest uppercase mb-5"
            style={{ color: "oklch(0.55 0.009 240)" }}
          >
            Select Two Athletes to Compare
          </p>

          {isLoading ? (
            <div className="flex gap-4">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="flex-1 h-12 rounded-lg animate-pulse"
                  style={{ background: "oklch(0.18 0.007 240)" }}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-4 items-start">
              <AthleteSelector
                label="Athlete 1"
                athletes={athletes}
                selected={athleteId1}
                disabledId={athleteId2}
                onSelect={setAthleteId1}
                ocidPrefix="comparison.athlete1"
              />

              <div className="hidden sm:flex flex-col items-center justify-center pt-8 shrink-0">
                <span
                  className="text-xs font-bold tracking-widest px-3 py-1 rounded-full"
                  style={{
                    color: "oklch(0.72 0.12 75)",
                    background: "oklch(0.72 0.12 75 / 0.10)",
                    border: "1px solid oklch(0.72 0.12 75 / 0.25)",
                  }}
                >
                  VS
                </span>
              </div>

              <AthleteSelector
                label="Athlete 2"
                athletes={athletes}
                selected={athleteId2}
                disabledId={athleteId1}
                onSelect={setAthleteId2}
                ocidPrefix="comparison.athlete2"
              />
            </div>
          )}

          {!canCompare && !isLoading && (
            <p
              className="mt-4 text-xs"
              style={{ color: "oklch(0.45 0.009 240)" }}
              data-ocid="comparison.empty_state"
            >
              {athleteId1 === null && athleteId2 === null
                ? "Choose two different athletes above to compare their personal bests."
                : athleteId1 !== null && athleteId2 === null
                  ? "Now select a second athlete."
                  : athleteId1 !== null &&
                      athleteId2 !== null &&
                      athleteId1 === athleteId2
                    ? "Please select two different athletes."
                    : "Select both athletes to begin the comparison."}
            </p>
          )}
        </div>

        {/* Personal bests comparison */}
        {canCompare && athlete1 && athlete2 && (
          <ComparisonContent
            athleteId1={athleteId1}
            athleteId2={athleteId2}
            athlete1Name={athlete1.name}
            athlete2Name={athlete2.name}
          />
        )}
      </div>
    </div>
  );
}
