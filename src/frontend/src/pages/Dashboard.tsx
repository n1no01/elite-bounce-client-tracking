import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@tanstack/react-router";
import { ChevronRight, Plus, Search, Users } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { AddAthleteForm } from "../components/AddAthleteForm";
import { JumpProgressChart } from "../components/JumpProgressChart";
import { MetricCard } from "../components/MetricCard";
import {
  useGetAllAthletes,
  useGetJumpTestsForAthlete,
} from "../hooks/useQueries";
import type { Athlete, JumpTest } from "../types";

const TEST_TYPES = ["CMJ", "CMJ-AS", "SJ", "DJ", "BJ", "Approach Jump"];

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function AthleteHighlightCard({ athlete }: { athlete: Athlete }) {
  const { data: tests = [], isLoading } = useGetJumpTestsForAthlete(athlete.id);

  const cmjTests = tests.filter((t) => t.testType === "CMJ");
  const latestTest = [...tests].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  )[0];

  const chartTestType =
    cmjTests.length > 0 ? "CMJ" : (latestTest?.testType ?? "CMJ");
  const chartTests =
    cmjTests.length > 0
      ? cmjTests
      : tests.filter((t) => t.testType === chartTestType);

  return (
    <div className="elite-card rounded-xl overflow-hidden">
      {/* Header */}
      <div
        className="px-5 py-4 flex items-center gap-4"
        style={{ borderBottom: "1px solid oklch(0.26 0.009 240)" }}
      >
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
          style={{
            background: "oklch(0.72 0.12 75 / 0.15)",
            border: "2px solid oklch(0.72 0.12 75 / 0.4)",
          }}
        >
          <span style={{ color: "oklch(0.78 0.13 75)" }}>
            {getInitials(athlete.name)}
          </span>
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-foreground truncate">
            {athlete.name}
          </p>
          <p
            className="text-xs mt-0.5"
            style={{ color: "oklch(0.58 0.01 240)" }}
          >
            {String(athlete.age)} yrs &bull; {athlete.sport}
          </p>
        </div>
        {latestTest && (
          <div className="ml-auto text-right">
            <p className="text-xs" style={{ color: "oklch(0.50 0.009 240)" }}>
              Latest
            </p>
            <p
              className="text-xs font-medium"
              style={{ color: "oklch(0.72 0.12 75)" }}
            >
              {latestTest.testType}
            </p>
          </div>
        )}
      </div>

      {/* Chart */}
      <div className="p-5">
        {isLoading ? (
          <Skeleton className="h-40 w-full" />
        ) : (
          <JumpProgressChart
            tests={chartTests}
            testType={chartTestType}
            title="Jump Progress (CMJ \u2013 Max Height)"
            height={180}
          />
        )}
      </div>
    </div>
  );
}

function TestSummaryGrid({ athlete }: { athlete: Athlete }) {
  const { data: tests = [], isLoading } = useGetJumpTestsForAthlete(athlete.id);

  const testsByType: Record<string, JumpTest[]> = {};
  for (const t of tests) {
    if (!testsByType[t.testType]) testsByType[t.testType] = [];
    testsByType[t.testType].push(t);
  }

  return (
    <div>
      <p
        className="text-xs font-semibold tracking-widest uppercase mb-3 px-5"
        style={{ color: "oklch(0.58 0.01 240)" }}
      >
        Test Summary
      </p>
      {isLoading ? (
        <div className="grid grid-cols-3 gap-2 px-5 pb-5">
          {TEST_TYPES.map((t) => (
            <Skeleton key={t} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2 px-5 pb-5">
          {TEST_TYPES.map((type, i) => (
            <MetricCard
              key={type}
              testType={type}
              tests={testsByType[type] ?? []}
              index={i + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function Dashboard() {
  const { data: athletes = [], isLoading } = useGetAllAthletes();
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<bigint | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  const filtered = athletes.filter(
    (a) =>
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.sport.toLowerCase().includes(search.toLowerCase()),
  );

  const selected =
    selectedId !== null
      ? (athletes.find((a) => a.id === selectedId) ?? null)
      : (athletes[0] ?? null);

  const latestDate = athletes.length
    ? [...athletes].map((a) => a.createdAt).sort((a, b) => (b > a ? 1 : -1))[0]
    : null;

  return (
    <div className="min-h-screen grid-bg relative">
      <div className="fixed inset-0 vignette pointer-events-none" />

      <main className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <h1 className="font-display text-5xl font-bold text-foreground mb-3">
            Welcome Back, Coach!
          </h1>
          <div
            className="flex flex-wrap items-center justify-center gap-2 text-sm"
            style={{ color: "oklch(0.58 0.01 240)" }}
          >
            <span className="flex items-center gap-1.5">
              <Users
                className="w-3.5 h-3.5"
                style={{ color: "oklch(0.72 0.12 75)" }}
              />
              Tracking {athletes.length} Athlete
              {athletes.length !== 1 ? "s" : ""}
            </span>
            {latestDate && (
              <>
                <span style={{ color: "oklch(0.35 0.007 240)" }}>|</span>
                <span>
                  Latest:{" "}
                  {new Date(Number(latestDate) / 1_000_000).toLocaleDateString(
                    "en-US",
                    {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    },
                  )}
                </span>
              </>
            )}
          </div>
        </motion.div>

        {/* Main 2-col grid */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left: Athlete Roster */}
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="lg:col-span-2"
          >
            <div className="elite-card rounded-xl overflow-hidden">
              <div
                className="px-5 py-4 flex items-center justify-between"
                style={{ borderBottom: "1px solid oklch(0.26 0.009 240)" }}
              >
                <h2
                  className="text-xs font-semibold tracking-widest uppercase"
                  style={{ color: "oklch(0.58 0.01 240)" }}
                >
                  Athlete Roster
                </h2>
                <Dialog open={addOpen} onOpenChange={setAddOpen}>
                  <DialogTrigger asChild>
                    <Button
                      size="sm"
                      className="btn-gold h-7 px-3 text-xs"
                      data-ocid="roster.open_modal_button"
                    >
                      <Plus className="w-3 h-3 mr-1" /> Add
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="elite-card border-border">
                    <DialogHeader>
                      <DialogTitle>Add New Athlete</DialogTitle>
                    </DialogHeader>
                    <AddAthleteForm
                      onSuccess={() => setAddOpen(false)}
                      onCancel={() => setAddOpen(false)}
                    />
                  </DialogContent>
                </Dialog>
              </div>

              {/* Search */}
              <div
                className="px-4 py-3"
                style={{ borderBottom: "1px solid oklch(0.22 0.008 240)" }}
              >
                <div className="relative">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5"
                    style={{ color: "oklch(0.45 0.009 240)" }}
                  />
                  <Input
                    placeholder="Search athletes..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 bg-muted border-border text-sm h-8"
                    data-ocid="roster.search_input"
                  />
                </div>
              </div>

              {/* List */}
              <div className="overflow-y-auto max-h-[480px]">
                {isLoading && (
                  <div
                    className="p-4 space-y-3"
                    data-ocid="roster.loading_state"
                  >
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-14 w-full rounded-lg" />
                    ))}
                  </div>
                )}

                {!isLoading && filtered.length === 0 && (
                  <div
                    className="p-8 text-center"
                    data-ocid="roster.empty_state"
                  >
                    <p
                      className="text-sm"
                      style={{ color: "oklch(0.45 0.009 240)" }}
                    >
                      {search
                        ? "No athletes match your search"
                        : "No athletes yet. Add your first athlete!"}
                    </p>
                  </div>
                )}

                {!isLoading &&
                  filtered.map((athlete, i) => (
                    <AthleteRosterRow
                      key={athlete.id.toString()}
                      athlete={athlete}
                      isSelected={selected?.id === athlete.id}
                      index={i + 1}
                      onSelect={() => setSelectedId(athlete.id)}
                    />
                  ))}
              </div>
            </div>
          </motion.div>

          {/* Right: Chart + Summary */}
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="lg:col-span-3 flex flex-col gap-6"
          >
            {selected ? (
              <div className="elite-card rounded-xl overflow-hidden">
                <AthleteHighlightCard athlete={selected} />
                <div style={{ borderTop: "1px solid oklch(0.22 0.008 240)" }}>
                  <TestSummaryGrid athlete={selected} />
                </div>
              </div>
            ) : (
              <div
                className="elite-card rounded-xl flex flex-col items-center justify-center p-16 text-center"
                data-ocid="dashboard.empty_state"
              >
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                  style={{
                    background: "oklch(0.72 0.12 75 / 0.1)",
                    border: "1px solid oklch(0.72 0.12 75 / 0.2)",
                  }}
                >
                  <Users
                    className="w-8 h-8"
                    style={{ color: "oklch(0.72 0.12 75 / 0.5)" }}
                  />
                </div>
                <p className="font-semibold text-foreground mb-1">
                  No Athletes Yet
                </p>
                <p
                  className="text-sm"
                  style={{ color: "oklch(0.45 0.009 240)" }}
                >
                  Add your first athlete to see their progress here.
                </p>
              </div>
            )}
          </motion.div>
        </div>
      </main>
    </div>
  );
}

function AthleteRosterRow({
  athlete,
  isSelected,
  index,
  onSelect,
}: {
  athlete: Athlete;
  isSelected: boolean;
  index: number;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      className={`w-full flex items-center gap-3 px-4 py-3 transition-colors text-left ${
        isSelected
          ? "border-l-2"
          : "border-l-2 border-l-transparent hover:bg-muted/40"
      }`}
      style={{
        borderLeftColor: isSelected ? "oklch(0.72 0.12 75)" : undefined,
        background: isSelected ? "oklch(0.72 0.12 75 / 0.05)" : undefined,
        borderBottom: "1px solid oklch(0.20 0.007 240)",
      }}
      onClick={onSelect}
      data-ocid={`roster.item.${index}`}
    >
      {/* Avatar */}
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
        style={{
          background: isSelected
            ? "oklch(0.72 0.12 75 / 0.2)"
            : "oklch(0.25 0.009 240)",
          border: isSelected
            ? "1px solid oklch(0.72 0.12 75 / 0.5)"
            : "1px solid oklch(0.30 0.01 240)",
        }}
      >
        <span
          style={{
            color: isSelected ? "oklch(0.78 0.13 75)" : "oklch(0.65 0.01 240)",
          }}
        >
          {getInitials(athlete.name)}
        </span>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 text-left">
        <p className="text-sm font-medium text-foreground truncate">
          {athlete.name}
        </p>
        <p className="text-xs" style={{ color: "oklch(0.50 0.009 240)" }}>
          {athlete.sport} &bull; Age {String(athlete.age)}
        </p>
      </div>

      {/* View arrow */}
      <Link
        to="/athletes/$athleteId"
        params={{ athleteId: athlete.id.toString() }}
        onClick={(e) => e.stopPropagation()}
        className="p-1 rounded hover:bg-muted transition-colors"
        data-ocid={`roster.link.${index}`}
      >
        <ChevronRight
          className="w-4 h-4"
          style={{ color: "oklch(0.45 0.009 240)" }}
        />
      </Link>
    </button>
  );
}
