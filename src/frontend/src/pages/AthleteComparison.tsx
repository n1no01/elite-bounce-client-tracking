import { Link } from "@tanstack/react-router";
import { ArrowLeft, ChevronDown, X } from "lucide-react";
import { useState } from "react";
import { JumpProgressChart } from "../components/JumpProgressChart";
import { StrengthProgressChart } from "../components/StrengthProgressChart";
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

// ─── No data placeholder ──────────────────────────────────────────────────────

function NoDataPlaceholder() {
  return (
    <div
      className="flex items-center justify-center rounded-lg"
      style={{
        height: 180,
        background: "oklch(0.15 0.006 240)",
        border: "1px dashed oklch(0.24 0.009 240)",
      }}
      data-ocid="comparison.empty_state"
    >
      <p className="text-xs" style={{ color: "oklch(0.40 0.009 240)" }}>
        No data recorded
      </p>
    </div>
  );
}

// ─── Jump comparison row ───────────────────────────────────────────────────────

interface JumpComparisonRowProps {
  testType: TestType;
  tests1: JumpTest[];
  tests2: JumpTest[];
  athlete1Name: string;
  athlete2Name: string;
  rowIndex: number;
}

function JumpComparisonRow({
  testType,
  tests1,
  tests2,
  athlete1Name,
  athlete2Name,
  rowIndex,
}: JumpComparisonRowProps) {
  const filtered1 = tests1.filter((t) => t.testType === testType);
  const filtered2 = tests2.filter((t) => t.testType === testType);
  const hasAnyData = filtered1.length > 0 || filtered2.length > 0;

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ border: "1px solid oklch(0.22 0.008 240)" }}
      data-ocid={`comparison.row.${rowIndex}`}
    >
      <div
        className="px-5 py-3 flex items-center gap-3"
        style={{
          background: "oklch(0.16 0.007 240)",
          borderBottom: "1px solid oklch(0.22 0.008 240)",
        }}
      >
        <span
          className="text-xs font-bold tracking-widest uppercase"
          style={{ color: "oklch(0.72 0.12 75)" }}
        >
          {testType}
        </span>
        <span className="text-xs" style={{ color: "oklch(0.45 0.009 240)" }}>
          {TEST_DISPLAY_NAMES[testType]}
        </span>
        {!hasAnyData && (
          <span
            className="ml-auto text-xs"
            style={{ color: "oklch(0.40 0.009 240)" }}
          >
            No data for either athlete
          </span>
        )}
      </div>

      <div
        className="grid grid-cols-1 md:grid-cols-2"
        style={{ background: "oklch(0.13 0.006 240)" }}
      >
        <div
          className="p-5 md:border-r"
          style={{ borderColor: "oklch(0.20 0.008 240)" }}
        >
          <p
            className="text-xs font-semibold tracking-wide mb-3 truncate"
            style={{ color: "oklch(0.65 0.009 240)" }}
          >
            {athlete1Name}
          </p>
          {filtered1.length === 0 ? (
            <NoDataPlaceholder />
          ) : (
            <JumpProgressChart
              tests={filtered1}
              testType={testType}
              height={180}
            />
          )}
        </div>
        <div className="p-5">
          <p
            className="text-xs font-semibold tracking-wide mb-3 truncate"
            style={{ color: "oklch(0.65 0.009 240)" }}
          >
            {athlete2Name}
          </p>
          {filtered2.length === 0 ? (
            <NoDataPlaceholder />
          ) : (
            <JumpProgressChart
              tests={filtered2}
              testType={testType}
              height={180}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Strength comparison row ───────────────────────────────────────────────────

interface StrengthComparisonRowProps {
  liftType: StrengthLiftType;
  records1: StrengthRecord[];
  records2: StrengthRecord[];
  athlete1Name: string;
  athlete2Name: string;
  rowIndex: number;
}

function StrengthComparisonRow({
  liftType,
  records1,
  records2,
  athlete1Name,
  athlete2Name,
  rowIndex,
}: StrengthComparisonRowProps) {
  const filtered1 = records1.filter((r) => r.liftType === liftType);
  const filtered2 = records2.filter((r) => r.liftType === liftType);
  const hasAnyData = filtered1.length > 0 || filtered2.length > 0;

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ border: "1px solid oklch(0.22 0.008 240)" }}
      data-ocid={`comparison.strength.row.${rowIndex}`}
    >
      <div
        className="px-5 py-3 flex items-center gap-3"
        style={{
          background: "oklch(0.16 0.007 240)",
          borderBottom: "1px solid oklch(0.22 0.008 240)",
        }}
      >
        <span
          className="text-xs font-bold tracking-widest uppercase"
          style={{ color: "oklch(0.72 0.12 75)" }}
        >
          {LIFT_DISPLAY_NAMES[liftType]}
        </span>
        <span className="text-xs" style={{ color: "oklch(0.45 0.009 240)" }}>
          kg
        </span>
        {!hasAnyData && (
          <span
            className="ml-auto text-xs"
            style={{ color: "oklch(0.40 0.009 240)" }}
          >
            No data for either athlete
          </span>
        )}
      </div>

      <div
        className="grid grid-cols-1 md:grid-cols-2"
        style={{ background: "oklch(0.13 0.006 240)" }}
      >
        <div
          className="p-5 md:border-r"
          style={{ borderColor: "oklch(0.20 0.008 240)" }}
        >
          <p
            className="text-xs font-semibold tracking-wide mb-3 truncate"
            style={{ color: "oklch(0.65 0.009 240)" }}
          >
            {athlete1Name}
          </p>
          {filtered1.length === 0 ? (
            <NoDataPlaceholder />
          ) : (
            <StrengthProgressChart
              records={filtered1}
              liftType={liftType}
              height={180}
            />
          )}
        </div>
        <div className="p-5">
          <p
            className="text-xs font-semibold tracking-wide mb-3 truncate"
            style={{ color: "oklch(0.65 0.009 240)" }}
          >
            {athlete2Name}
          </p>
          {filtered2.length === 0 ? (
            <NoDataPlaceholder />
          ) : (
            <StrengthProgressChart
              records={filtered2}
              liftType={liftType}
              height={180}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Combined charts (fetches both athletes' data) ────────────────────────────

interface ComparisonChartsProps {
  athleteId1: AthleteId;
  athleteId2: AthleteId;
  athlete1Name: string;
  athlete2Name: string;
}

function ComparisonCharts({
  athleteId1,
  athleteId2,
  athlete1Name,
  athlete2Name,
}: ComparisonChartsProps) {
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
      <div className="space-y-4" data-ocid="comparison.loading_state">
        {[...TEST_TYPES, ...LIFT_TYPES].map((t) => (
          <div
            key={t}
            className="h-40 rounded-xl animate-pulse"
            style={{ background: "oklch(0.16 0.007 240)" }}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Jump Tests */}
      <div>
        <h3
          className="text-xs font-semibold tracking-widest uppercase mb-4"
          style={{ color: "oklch(0.58 0.01 240)" }}
        >
          Jump Tests
        </h3>
        <div className="space-y-4" data-ocid="comparison.jumps.list">
          {TEST_TYPES.map((testType, i) => (
            <JumpComparisonRow
              key={testType}
              testType={testType}
              tests1={tests1}
              tests2={tests2}
              athlete1Name={athlete1Name}
              athlete2Name={athlete2Name}
              rowIndex={i + 1}
            />
          ))}
        </div>
      </div>

      {/* Strength */}
      <div>
        <h3
          className="text-xs font-semibold tracking-widest uppercase mb-4"
          style={{ color: "oklch(0.58 0.01 240)" }}
        >
          Strength
        </h3>
        <div className="space-y-4" data-ocid="comparison.strength.list">
          {LIFT_TYPES.map((liftType, i) => (
            <StrengthComparisonRow
              key={liftType}
              liftType={liftType}
              records1={strength1}
              records2={strength2}
              athlete1Name={athlete1Name}
              athlete2Name={athlete2Name}
              rowIndex={i + 1}
            />
          ))}
        </div>
      </div>
    </div>
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
        <div className="max-w-7xl mx-auto px-6 py-4">
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
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
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
                ? "Choose two different athletes above to see their test histories side-by-side."
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

        {/* Comparison charts */}
        {canCompare && athlete1 && athlete2 && (
          <ComparisonCharts
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
