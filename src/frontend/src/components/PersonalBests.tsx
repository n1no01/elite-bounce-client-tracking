import { Trophy } from "lucide-react";
import { motion } from "motion/react";
import type { JumpTest, StrengthLiftType, StrengthRecord } from "../types";

// ─── Types ────────────────────────────────────────────────────────────────────

interface JumpBest {
  label: string;
  value: string;
  date: string | null;
}

interface StrengthBest {
  label: string;
  value: string;
  date: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function computeJumpBests(tests: JumpTest[]): JumpBest[] {
  const results: JumpBest[] = [];

  // Height-based types
  const heightTypes: Array<{ key: string; label: string }> = [
    { key: "CMJ", label: "CMJ" },
    { key: "CMJ-AS", label: "CMJ-AS" },
    { key: "SJ", label: "Squat Jump" },
    { key: "Approach Jump", label: "Approach Jump" },
    { key: "DJ", label: "Drop Jump" },
  ];

  for (const { key, label } of heightTypes) {
    const relevant = tests.filter(
      (t) => t.testType === key && t.height != null,
    );
    if (relevant.length === 0) {
      results.push({ label, value: "No data yet", date: null });
    } else {
      const best = relevant.reduce((a, b) => (a.height! > b.height! ? a : b));
      let display = `${best.height!.toFixed(1)} cm`;
      if (key === "DJ" && best.rsi != null) {
        display += ` · RSI ${best.rsi.toFixed(2)}`;
      }
      results.push({ label, value: display, date: best.date });
    }
  }

  // BJ: distance-based
  const bjTests = tests.filter(
    (t) => t.testType === "BJ" && t.distance != null,
  );
  if (bjTests.length === 0) {
    results.push({ label: "Broad Jump", value: "No data yet", date: null });
  } else {
    const best = bjTests.reduce((a, b) => (a.distance! > b.distance! ? a : b));
    results.push({
      label: "Broad Jump",
      value: `${best.distance!.toFixed(1)} cm`,
      date: best.date,
    });
  }

  return results;
}

function computeStrengthBests(records: StrengthRecord[]): StrengthBest[] {
  const lifts: Array<{ key: StrengthLiftType; label: string }> = [
    { key: "backSquat", label: "Back Squat" },
    { key: "powerClean", label: "Power Clean" },
    { key: "deadlift", label: "Deadlift" },
  ];

  return lifts.map(({ key, label }) => {
    const relevant = records.filter((r) => r.liftType === key);
    if (relevant.length === 0) {
      return { label, value: "No data yet", date: null };
    }
    const best = relevant.reduce((a, b) => (a.weightKg > b.weightKg ? a : b));
    return { label, value: `${best.weightKg.toFixed(1)} kg`, date: best.date };
  });
}

// ─── Best Card ────────────────────────────────────────────────────────────────

function BestCard({
  label,
  value,
  date,
  index,
  ocidPrefix,
}: {
  label: string;
  value: string;
  date: string | null;
  index: number;
  ocidPrefix: string;
}) {
  const isEmpty = date === null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="elite-card rounded-xl p-4 flex flex-col gap-1.5"
      data-ocid={`${ocidPrefix}.item.${index + 1}`}
    >
      <span
        className="text-xs font-semibold tracking-wider uppercase"
        style={{ color: "oklch(0.50 0.009 240)" }}
      >
        {label}
      </span>
      <span
        className="text-xl font-bold font-display leading-tight"
        style={{
          color: isEmpty ? "oklch(0.38 0.008 240)" : "oklch(0.78 0.13 75)",
        }}
      >
        {value}
      </span>
      {date && (
        <span className="text-xs" style={{ color: "oklch(0.45 0.009 240)" }}>
          {formatDate(date)}
        </span>
      )}
    </motion.div>
  );
}

// ─── Personal Bests ───────────────────────────────────────────────────────────

interface PersonalBestsProps {
  jumpTests: JumpTest[];
  strengthRecords: StrengthRecord[];
}

export function PersonalBests({
  jumpTests,
  strengthRecords,
}: PersonalBestsProps) {
  const jumpBests = computeJumpBests(jumpTests);
  const strengthBests = computeStrengthBests(strengthRecords);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mb-8"
      data-ocid="personal_bests.section"
    >
      {/* Section Header */}
      <div className="flex items-center gap-2 mb-5">
        <Trophy className="w-5 h-5" style={{ color: "oklch(0.72 0.12 75)" }} />
        <h2
          className="text-sm font-bold tracking-widest uppercase"
          style={{ color: "oklch(0.72 0.12 75)" }}
        >
          Personal Bests
        </h2>
        <div
          className="flex-1 h-px"
          style={{ background: "oklch(0.72 0.12 75 / 0.2)" }}
        />
      </div>

      {/* Jump Records */}
      <div className="mb-5">
        <p
          className="text-xs font-semibold tracking-widest uppercase mb-3"
          style={{ color: "oklch(0.50 0.009 240)" }}
        >
          Jump Records
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {jumpBests.map((best, i) => (
            <BestCard
              key={best.label}
              label={best.label}
              value={best.value}
              date={best.date}
              index={i}
              ocidPrefix="personal_bests.jump"
            />
          ))}
        </div>
      </div>

      {/* Strength Records */}
      <div>
        <p
          className="text-xs font-semibold tracking-widest uppercase mb-3"
          style={{ color: "oklch(0.50 0.009 240)" }}
        >
          Strength Records
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {strengthBests.map((best, i) => (
            <BestCard
              key={best.label}
              label={best.label}
              value={best.value}
              date={best.date}
              index={i}
              ocidPrefix="personal_bests.strength"
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}
