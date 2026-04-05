import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Edit2,
  Loader2,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { AthleteId, JumpTest } from "../backend";
import { JumpProgressChart } from "../components/JumpProgressChart";
import { JumpTestForm } from "../components/JumpTestForm";
import {
  useDeleteAthlete,
  useDeleteJumpTest,
  useGetAthlete,
  useGetJumpTestsForAthlete,
  useUpdateAthlete,
} from "../hooks/useQueries";

const TEST_TYPES = ["CMJ", "CMJ-AS", "SJ", "DJ", "BJ", "Approach Jump"];

const TEST_LABELS: Record<string, string> = {
  CMJ: "Countermovement Jump",
  "CMJ-AS": "CMJ with Arm Swing",
  SJ: "Squat Jump",
  DJ: "Drop Jump",
  BJ: "Broad Jump",
  "Approach Jump": "Approach Jump",
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatTestValue(test: JumpTest) {
  if (test.testType === "BJ") {
    return test.distance != null ? `${test.distance.toFixed(1)} cm` : "—";
  }
  if (test.testType === "DJ") {
    const parts: string[] = [];
    if (test.height != null) parts.push(`${test.height.toFixed(1)} cm`);
    if (test.rsi != null) parts.push(`RSI: ${test.rsi.toFixed(2)}`);
    if (test.dropHeight != null)
      parts.push(`Drop: ${test.dropHeight.toFixed(1)} cm`);
    return parts.join(" · ") || "—";
  }
  return test.height != null ? `${test.height.toFixed(1)} cm` : "—";
}

function EditAthleteForm({
  athleteId,
  initialData,
  onSuccess,
  onCancel,
}: {
  athleteId: AthleteId;
  initialData: { name: string; age: number; sport: string; notes: string };
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initialData.name);
  const [age, setAge] = useState(String(initialData.age));
  const [sport, setSport] = useState(initialData.sport);
  const [notes, setNotes] = useState(initialData.notes);
  const { mutateAsync, isPending } = useUpdateAthlete();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !age || !sport.trim()) return;
    try {
      await mutateAsync({
        id: athleteId,
        name: name.trim(),
        age: Number(age),
        sport: sport.trim(),
        notes: notes.trim(),
      });
      toast.success("Athlete updated!");
      onSuccess();
    } catch {
      toast.error("Failed to update athlete.");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4"
      data-ocid="edit_athlete.modal"
    >
      <div className="space-y-1">
        <Label className="text-sm text-muted-foreground">Full Name</Label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="bg-muted"
          data-ocid="edit_athlete.input"
        />
      </div>
      <div className="space-y-1">
        <Label className="text-sm text-muted-foreground">Age</Label>
        <Input
          type="number"
          value={age}
          onChange={(e) => setAge(e.target.value)}
          className="bg-muted"
          data-ocid="edit_athlete.input"
          min="1"
          max="120"
        />
      </div>
      <div className="space-y-1">
        <Label className="text-sm text-muted-foreground">Sport / Hobby</Label>
        <Input
          value={sport}
          onChange={(e) => setSport(e.target.value)}
          className="bg-muted"
          data-ocid="edit_athlete.input"
        />
      </div>
      <div className="space-y-1">
        <Label className="text-sm text-muted-foreground">Notes</Label>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="bg-muted resize-none"
          rows={3}
          data-ocid="edit_athlete.textarea"
        />
      </div>
      <div className="flex gap-3">
        <Button
          type="submit"
          disabled={isPending}
          className="flex-1 btn-gold"
          data-ocid="edit_athlete.save_button"
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
            </>
          ) : (
            "Save Changes"
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="flex-1"
          data-ocid="edit_athlete.cancel_button"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}

function TestHistorySection({ athleteId }: { athleteId: AthleteId }) {
  const { data: tests = [], isLoading } = useGetJumpTestsForAthlete(athleteId);
  const deleteTest = useDeleteJumpTest(athleteId);
  const [expandedTypes, setExpandedTypes] = useState<Set<string>>(
    new Set(TEST_TYPES),
  );

  const toggleType = (type: string) => {
    setExpandedTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  };

  const testsByType: Record<string, JumpTest[]> = {};
  for (const t of tests) {
    if (!testsByType[t.testType]) testsByType[t.testType] = [];
    testsByType[t.testType].push(t);
  }

  const handleDelete = async (testId: bigint) => {
    try {
      await deleteTest.mutateAsync(testId);
      toast.success("Test deleted.");
    } catch {
      toast.error("Failed to delete test.");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3" data-ocid="tests.loading_state">
        {[1, 2].map((i) => (
          <Skeleton key={i} className="h-32 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (tests.length === 0) {
    return (
      <div
        className="elite-card rounded-xl flex flex-col items-center justify-center p-12 text-center"
        data-ocid="tests.empty_state"
      >
        <p className="font-semibold text-foreground mb-1">
          No tests recorded yet
        </p>
        <p className="text-sm" style={{ color: "oklch(0.45 0.009 240)" }}>
          Use the form above to add a jump test for this athlete.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {TEST_TYPES.filter((type) => testsByType[type]?.length > 0).map(
        (type) => {
          const typeTests = [...(testsByType[type] ?? [])].sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
          );
          const isExpanded = expandedTypes.has(type);

          return (
            <div key={type} className="elite-card rounded-xl overflow-hidden">
              {/* Type header */}
              <button
                type="button"
                className="w-full px-5 py-3 flex items-center justify-between hover:bg-muted/20 transition-colors"
                onClick={() => toggleType(type)}
                style={{
                  borderBottom: isExpanded
                    ? "1px solid oklch(0.24 0.008 240)"
                    : undefined,
                }}
                data-ocid="tests.tab"
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-foreground">
                    {TEST_LABELS[type] ?? type}
                  </span>
                  <Badge
                    variant="secondary"
                    className="text-xs px-1.5 py-0"
                    style={{
                      background: "oklch(0.72 0.12 75 / 0.15)",
                      color: "oklch(0.72 0.12 75)",
                    }}
                  >
                    {typeTests.length}
                  </Badge>
                </div>
                {isExpanded ? (
                  <ChevronUp
                    className="w-4 h-4"
                    style={{ color: "oklch(0.45 0.009 240)" }}
                  />
                ) : (
                  <ChevronDown
                    className="w-4 h-4"
                    style={{ color: "oklch(0.45 0.009 240)" }}
                  />
                )}
              </button>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    style={{ overflow: "hidden" }}
                  >
                    {/* Chart */}
                    <div className="px-5 pt-4">
                      <JumpProgressChart
                        tests={typeTests}
                        testType={type}
                        height={160}
                      />
                    </div>

                    {/* Table */}
                    <div className="px-5 py-4">
                      <table className="w-full text-sm">
                        <thead>
                          <tr
                            style={{
                              borderBottom: "1px solid oklch(0.24 0.008 240)",
                            }}
                          >
                            <th
                              className="text-left py-2 text-xs font-medium tracking-wider"
                              style={{ color: "oklch(0.50 0.009 240)" }}
                            >
                              Date
                            </th>
                            <th
                              className="text-left py-2 text-xs font-medium tracking-wider"
                              style={{ color: "oklch(0.50 0.009 240)" }}
                            >
                              Result
                            </th>
                            <th
                              className="text-right py-2 text-xs font-medium tracking-wider"
                              style={{ color: "oklch(0.50 0.009 240)" }}
                            >
                              Action
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {typeTests.map((test, i) => (
                            <tr
                              key={test.id.toString()}
                              style={{
                                borderBottom: "1px solid oklch(0.20 0.007 240)",
                              }}
                              data-ocid={`tests.row.${i + 1}`}
                            >
                              <td
                                className="py-2.5"
                                style={{ color: "oklch(0.65 0.01 240)" }}
                              >
                                {new Date(test.date).toLocaleDateString(
                                  "en-US",
                                  {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  },
                                )}
                              </td>
                              <td className="py-2.5 font-medium text-foreground">
                                {formatTestValue(test)}
                              </td>
                              <td className="py-2.5 text-right">
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-7 w-7 p-0 hover:text-destructive hover:bg-destructive/10"
                                      data-ocid={`tests.delete_button.${i + 1}`}
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent className="elite-card border-border">
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>
                                        Delete Test
                                      </AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to delete this{" "}
                                        {TEST_LABELS[test.testType] ??
                                          test.testType}{" "}
                                        result from{" "}
                                        {new Date(
                                          test.date,
                                        ).toLocaleDateString()}
                                        ? This cannot be undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel data-ocid="tests.cancel_button">
                                        Cancel
                                      </AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleDelete(test.id)}
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                        data-ocid="tests.confirm_button"
                                      >
                                        Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        },
      )}
    </div>
  );
}

export function AthleteDetail() {
  const params = useParams({ from: "/athletes/$athleteId" });
  const navigate = useNavigate();
  const athleteId = BigInt(params.athleteId);

  const { data: athlete, isLoading } = useGetAthlete(athleteId);
  const deleteAthlete = useDeleteAthlete();

  const [editOpen, setEditOpen] = useState(false);
  const [addTestOpen, setAddTestOpen] = useState(false);

  const handleDeleteAthlete = async () => {
    try {
      await deleteAthlete.mutateAsync(athleteId);
      toast.success("Athlete deleted.");
      navigate({ to: "/athletes" });
    } catch {
      toast.error("Failed to delete athlete.");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen grid-bg">
        <div className="fixed inset-0 vignette pointer-events-none" />
        <main
          className="relative z-10 max-w-5xl mx-auto px-6 py-8"
          data-ocid="athlete_detail.loading_state"
        >
          <Skeleton className="h-8 w-32 mb-8 rounded-lg" />
          <Skeleton className="h-40 w-full rounded-xl mb-6" />
          <Skeleton className="h-60 w-full rounded-xl" />
        </main>
      </div>
    );
  }

  if (!athlete) {
    return (
      <div className="min-h-screen grid-bg">
        <div className="fixed inset-0 vignette pointer-events-none" />
        <main
          className="relative z-10 max-w-5xl mx-auto px-6 py-8"
          data-ocid="athlete_detail.error_state"
        >
          <p className="text-muted-foreground">Athlete not found.</p>
          <Link to="/athletes" className="text-primary hover:underline">
            Back to roster
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen grid-bg relative">
      <div className="fixed inset-0 vignette pointer-events-none" />

      <main className="relative z-10 max-w-5xl mx-auto px-6 py-8">
        {/* Back */}
        <Link
          to="/athletes"
          className="inline-flex items-center gap-2 text-sm mb-6 transition-colors hover:text-foreground"
          style={{ color: "oklch(0.55 0.009 240)" }}
          data-ocid="athlete_detail.link"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Roster
        </Link>

        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="elite-card rounded-xl p-6 mb-6"
          data-ocid="athlete_detail.card"
        >
          <div className="flex flex-col sm:flex-row sm:items-start gap-5">
            {/* Avatar */}
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-lg font-bold shrink-0"
              style={{
                background: "oklch(0.72 0.12 75 / 0.15)",
                border: "2px solid oklch(0.72 0.12 75 / 0.4)",
              }}
            >
              <span style={{ color: "oklch(0.78 0.13 75)" }}>
                {getInitials(athlete.name)}
              </span>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h1 className="font-display text-3xl font-bold text-foreground">
                {athlete.name}
              </h1>
              <div
                className="flex flex-wrap items-center gap-3 mt-1 text-sm"
                style={{ color: "oklch(0.58 0.01 240)" }}
              >
                <span>Age {String(athlete.age)}</span>
                <span style={{ color: "oklch(0.32 0.008 240)" }}>|</span>
                <span>{athlete.sport}</span>
              </div>
              {athlete.notes && (
                <p
                  className="mt-3 text-sm leading-relaxed"
                  style={{ color: "oklch(0.55 0.01 240)" }}
                >
                  {athlete.notes}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0">
              <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogTrigger asChild>
                  <Button
                    size="sm"
                    className="btn-gold gap-1.5"
                    data-ocid="athlete_detail.edit_button"
                  >
                    <Edit2 className="w-3.5 h-3.5" /> Edit
                  </Button>
                </DialogTrigger>
                <DialogContent className="elite-card border-border">
                  <DialogHeader>
                    <DialogTitle>Edit Athlete</DialogTitle>
                  </DialogHeader>
                  <EditAthleteForm
                    athleteId={athleteId}
                    initialData={{
                      name: athlete.name,
                      age: Number(athlete.age),
                      sport: athlete.sport,
                      notes: athlete.notes,
                    }}
                    onSuccess={() => setEditOpen(false)}
                    onCancel={() => setEditOpen(false)}
                  />
                </DialogContent>
              </Dialog>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="gap-1.5 hover:text-destructive hover:bg-destructive/10"
                    data-ocid="athlete_detail.delete_button"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="elite-card border-border">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Athlete</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete {athlete.name}? All their
                      test data will be permanently removed. This action cannot
                      be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel data-ocid="athlete_detail.cancel_button">
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteAthlete}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      data-ocid="athlete_detail.confirm_button"
                    >
                      {deleteAthlete.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                          Deleting...
                        </>
                      ) : (
                        "Delete Athlete"
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </motion.div>

        {/* Add Test */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="elite-card rounded-xl overflow-hidden mb-6"
        >
          <button
            type="button"
            className="w-full px-5 py-4 flex items-center justify-between hover:bg-muted/20 transition-colors"
            onClick={() => setAddTestOpen((v) => !v)}
            style={{
              borderBottom: addTestOpen
                ? "1px solid oklch(0.24 0.008 240)"
                : undefined,
            }}
            data-ocid="add_test.open_modal_button"
          >
            <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Plus
                className="w-4 h-4"
                style={{ color: "oklch(0.72 0.12 75)" }}
              />
              Record Jump Test
            </span>
            {addTestOpen ? (
              <X
                className="w-4 h-4"
                style={{ color: "oklch(0.45 0.009 240)" }}
              />
            ) : (
              <ChevronDown
                className="w-4 h-4"
                style={{ color: "oklch(0.45 0.009 240)" }}
              />
            )}
          </button>

          <AnimatePresence>
            {addTestOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                style={{ overflow: "hidden" }}
              >
                <div className="p-5">
                  <JumpTestForm
                    athleteId={athleteId}
                    onSuccess={() => setAddTestOpen(false)}
                    onCancel={() => setAddTestOpen(false)}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Test History */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <h2
            className="text-xs font-semibold tracking-widest uppercase mb-4"
            style={{ color: "oklch(0.58 0.01 240)" }}
          >
            Test History
          </h2>
          <TestHistorySection athleteId={athleteId} />
        </motion.div>
      </main>
    </div>
  );
}
