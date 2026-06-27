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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  ClipboardList,
  Edit2,
  Loader2,
  Plus,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import {
  useAddTrainingSession,
  useDeleteTrainingSession,
  useGetAllAthletes,
  useGetAllTrainingSessions,
  useUpdateTrainingSession,
} from "../hooks/useQueries";
import type { TrainingSession } from "../hooks/useQueries";

// ─── Fatigue helpers ──────────────────────────────────────────────────────────

function FatigueIndicator({ level }: { level: number }) {
  const color =
    level <= 2
      ? "oklch(0.72 0.17 145)"
      : level === 3
        ? "oklch(0.78 0.18 75)"
        : "oklch(0.65 0.22 25)";
  const label = level <= 2 ? "Low" : level === 3 ? "Moderate" : "High";
  return (
    <span
      className="inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-full"
      style={{
        background: `${color}22`,
        color,
        border: `1px solid ${color}55`,
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ background: color }}
      />
      {level}/5 · {label}
    </span>
  );
}

// ─── Athlete Multi-Select ─────────────────────────────────────────────────────

function AthleteMultiSelect({
  athletes,
  selectedIds,
  onToggle,
  ocidPrefix,
}: {
  athletes: { id: bigint; name: string; sport: string }[];
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  ocidPrefix: string;
}) {
  if (athletes.length === 0) {
    return (
      <p className="text-sm" style={{ color: "oklch(0.45 0.009 240)" }}>
        No athletes found. Add athletes first.
      </p>
    );
  }
  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{ border: "1px solid oklch(0.28 0.01 240)" }}
    >
      {athletes.map((athlete, i) => {
        const idStr = athlete.id.toString();
        const checked = selectedIds.has(idStr);
        return (
          <label
            key={idStr}
            className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-muted/30 transition-colors"
            style={{
              borderTop: i > 0 ? "1px solid oklch(0.22 0.008 240)" : undefined,
            }}
            data-ocid={`${ocidPrefix}.checkbox.${i + 1}`}
          >
            <div
              className="w-4 h-4 rounded flex items-center justify-center shrink-0 transition-colors"
              style={{
                background: checked ? "oklch(0.72 0.12 75)" : "transparent",
                border: `2px solid ${checked ? "oklch(0.72 0.12 75)" : "oklch(0.40 0.009 240)"}`,
              }}
            >
              {checked && (
                <svg
                  viewBox="0 0 10 8"
                  fill="none"
                  className="w-2.5 h-2"
                  aria-hidden="true"
                >
                  <path
                    d="M1 4l3 3 5-6"
                    stroke="oklch(0.10 0.005 240)"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </div>
            <input
              type="checkbox"
              className="sr-only"
              checked={checked}
              onChange={() => onToggle(idStr)}
            />
            <span className="text-sm text-foreground">{athlete.name}</span>
            <span
              className="ml-auto text-xs"
              style={{ color: "oklch(0.50 0.009 240)" }}
            >
              {athlete.sport}
            </span>
          </label>
        );
      })}
    </div>
  );
}

// ─── Fatigue Level Picker ─────────────────────────────────────────────────────

function FatiguePicker({
  value,
  onChange,
  ocidPrefix,
}: {
  value: number;
  onChange: (v: number) => void;
  ocidPrefix: string;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-xs font-semibold tracking-wider uppercase text-muted-foreground">
        Fatigue Level
      </Label>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((lvl) => (
          <button
            key={lvl}
            type="button"
            onClick={() => onChange(lvl)}
            className="flex-1 h-10 rounded-lg text-sm font-bold transition-all"
            style={
              value === lvl
                ? {
                    background:
                      lvl <= 2
                        ? "oklch(0.72 0.17 145 / 0.25)"
                        : lvl === 3
                          ? "oklch(0.78 0.18 75 / 0.25)"
                          : "oklch(0.65 0.22 25 / 0.25)",
                    border: `2px solid ${lvl <= 2 ? "oklch(0.72 0.17 145)" : lvl === 3 ? "oklch(0.78 0.18 75)" : "oklch(0.65 0.22 25)"}`,
                    color:
                      lvl <= 2
                        ? "oklch(0.72 0.17 145)"
                        : lvl === 3
                          ? "oklch(0.78 0.18 75)"
                          : "oklch(0.65 0.22 25)",
                  }
                : {
                    background: "oklch(0.16 0.006 240)",
                    border: "2px solid oklch(0.28 0.01 240)",
                    color: "oklch(0.55 0.009 240)",
                  }
            }
            data-ocid={`${ocidPrefix}.fatigue.${lvl}`}
          >
            {lvl}
          </button>
        ))}
      </div>
      <p className="text-xs" style={{ color: "oklch(0.45 0.009 240)" }}>
        1–2 = Low · 3 = Moderate · 4–5 = High
      </p>
    </div>
  );
}

// ─── Add Session Form ─────────────────────────────────────────────────────────

function AddSessionForm({ onClose }: { onClose: () => void }) {
  const { data: athletes = [] } = useGetAllAthletes();
  const addSession = useAddTrainingSession();

  const today = new Date().toISOString().split("T")[0];
  const [date, setDate] = useState(today);
  const [selectedAthleteIds, setSelectedAthleteIds] = useState<Set<string>>(
    new Set(),
  );
  const [fatigue, setFatigue] = useState(3);
  const [activities, setActivities] = useState("");
  const [notes, setNotes] = useState("");

  const toggleAthlete = (id: string) => {
    setSelectedAthleteIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) {
      toast.error("Please select a date.");
      return;
    }
    if (selectedAthleteIds.size === 0) {
      toast.error("Select at least one athlete.");
      return;
    }
    try {
      await addSession.mutateAsync({
        date,
        athleteIds: Array.from(selectedAthleteIds),
        fatigueLevel: fatigue,
        notes: notes.trim(),
        activities: activities.trim(),
      });
      toast.success("Training session logged!");
      onClose();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to save session.",
      );
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-5 p-5"
      data-ocid="add_session.modal"
    >
      {/* Date */}
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold tracking-wider uppercase text-muted-foreground">
          Session Date
        </Label>
        <Input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="bg-muted"
          data-ocid="add_session.input"
        />
      </div>

      {/* Athletes multi-select */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold tracking-wider uppercase text-muted-foreground">
          Athletes Attending
          {selectedAthleteIds.size > 0 && (
            <span
              className="ml-2 font-normal"
              style={{ color: "oklch(0.72 0.12 75)" }}
            >
              ({selectedAthleteIds.size} selected)
            </span>
          )}
        </Label>
        <AthleteMultiSelect
          athletes={athletes}
          selectedIds={selectedAthleteIds}
          onToggle={toggleAthlete}
          ocidPrefix="add_session"
        />
      </div>

      {/* Fatigue level */}
      <FatiguePicker
        value={fatigue}
        onChange={setFatigue}
        ocidPrefix="add_session"
      />

      {/* Activities */}
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold tracking-wider uppercase text-muted-foreground">
          Session Activities (optional)
        </Label>
        <Textarea
          value={activities}
          onChange={(e) => setActivities(e.target.value)}
          placeholder="Describe the exercises and drills done in this session..."
          className="bg-muted resize-y"
          rows={4}
          data-ocid="add_session.activities_textarea"
        />
      </div>

      {/* Notes */}
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold tracking-wider uppercase text-muted-foreground">
          Coaching Notes (optional)
        </Label>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Session observations, athlete feedback, focus areas..."
          className="bg-muted resize-y"
          rows={4}
          data-ocid="add_session.textarea"
        />
      </div>

      <div className="flex gap-3 pt-1">
        <Button
          type="submit"
          disabled={addSession.isPending}
          className="flex-1 btn-gold"
          data-ocid="add_session.submit_button"
        >
          {addSession.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Log Session"
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          className="flex-1"
          data-ocid="add_session.cancel_button"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}

// ─── Edit Session Inline Form ─────────────────────────────────────────────────

function EditSessionForm({
  session,
  athletes,
  onClose,
}: {
  session: TrainingSession;
  athletes: { id: bigint; name: string; sport: string }[];
  onClose: () => void;
}) {
  const updateSession = useUpdateTrainingSession();
  const [date, setDate] = useState(session.date);
  const [selectedAthleteIds, setSelectedAthleteIds] = useState<Set<string>>(
    new Set(session.athleteIds),
  );
  const [fatigue, setFatigue] = useState(session.fatigueLevel);
  const [activities, setActivities] = useState(session.activities ?? "");
  const [notes, setNotes] = useState(session.notes);

  const toggleAthlete = (id: string) => {
    setSelectedAthleteIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) {
      toast.error("Please select a date.");
      return;
    }
    if (selectedAthleteIds.size === 0) {
      toast.error("Select at least one athlete.");
      return;
    }
    try {
      await updateSession.mutateAsync({
        sessionId: session.id,
        date,
        athleteIds: Array.from(selectedAthleteIds),
        fatigueLevel: fatigue,
        notes: notes.trim(),
        activities: activities.trim(),
      });
      toast.success("Session updated!");
      onClose();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update session.",
      );
    }
  };

  return (
    <motion.tr
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      data-ocid={`sessions.edit_form.${session.id}`}
    >
      <td colSpan={5} className="py-0">
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 p-5"
          style={{ borderBottom: "1px solid oklch(0.20 0.007 240)" }}
        >
          <div className="flex items-center gap-2 mb-1">
            <Edit2
              className="w-3.5 h-3.5"
              style={{ color: "oklch(0.72 0.12 75)" }}
            />
            <span className="text-sm font-semibold text-foreground">
              Edit Session
            </span>
          </div>

          {/* Date */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold tracking-wider uppercase text-muted-foreground">
              Session Date
            </Label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-muted max-w-xs"
              data-ocid="edit_session.input"
            />
          </div>

          {/* Athletes */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold tracking-wider uppercase text-muted-foreground">
              Athletes Attending
              {selectedAthleteIds.size > 0 && (
                <span
                  className="ml-2 font-normal"
                  style={{ color: "oklch(0.72 0.12 75)" }}
                >
                  ({selectedAthleteIds.size} selected)
                </span>
              )}
            </Label>
            <AthleteMultiSelect
              athletes={athletes}
              selectedIds={selectedAthleteIds}
              onToggle={toggleAthlete}
              ocidPrefix="edit_session"
            />
          </div>

          {/* Fatigue */}
          <FatiguePicker
            value={fatigue}
            onChange={setFatigue}
            ocidPrefix="edit_session"
          />

          {/* Activities */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold tracking-wider uppercase text-muted-foreground">
              Session Activities (optional)
            </Label>
            <Textarea
              value={activities}
              onChange={(e) => setActivities(e.target.value)}
              placeholder="Describe the exercises and drills done in this session..."
              className="bg-muted resize-y"
              rows={4}
              data-ocid="edit_session.activities_textarea"
            />
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold tracking-wider uppercase text-muted-foreground">
              Coaching Notes (optional)
            </Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Session observations, athlete feedback, focus areas..."
              className="bg-muted resize-y"
              rows={4}
              data-ocid="edit_session.textarea"
            />
          </div>

          <div className="flex gap-3 pt-1">
            <Button
              type="submit"
              disabled={updateSession.isPending}
              className="btn-gold"
              data-ocid="edit_session.save_button"
            >
              {updateSession.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              data-ocid="edit_session.cancel_button"
            >
              Cancel
            </Button>
          </div>
        </form>
      </td>
    </motion.tr>
  );
}

// ─── Session Row ──────────────────────────────────────────────────────────────

function SessionRow({
  session,
  index,
  athleteNameMap,
  athletes,
}: {
  session: TrainingSession;
  index: number;
  athleteNameMap: Map<string, string>;
  athletes: { id: bigint; name: string; sport: string }[];
}) {
  const deleteSession = useDeleteTrainingSession();
  const [isEditing, setIsEditing] = useState(false);

  const handleDelete = async () => {
    try {
      await deleteSession.mutateAsync(session.id);
      toast.success("Session deleted.");
    } catch {
      toast.error("Failed to delete session.");
    }
  };

  const athleteNames = session.athleteIds
    .map((id) => athleteNameMap.get(id) ?? "Unknown")
    .join(", ");

  if (isEditing) {
    return (
      <EditSessionForm
        session={session}
        athletes={athletes}
        onClose={() => setIsEditing(false)}
      />
    );
  }

  return (
    <motion.tr
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04 }}
      style={{ borderBottom: "1px solid oklch(0.20 0.007 240)" }}
      data-ocid={`sessions.row.${index + 1}`}
    >
      {/* Date */}
      <td className="py-3.5 pr-4 whitespace-nowrap align-top">
        <span
          className="text-sm font-medium"
          style={{ color: "oklch(0.72 0.12 75)" }}
        >
          {new Date(session.date).toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </span>
      </td>
      {/* Athletes */}
      <td className="py-3.5 pr-4 align-top">
        <div className="flex items-center gap-2 min-w-0">
          <Users
            className="w-3.5 h-3.5 shrink-0"
            style={{ color: "oklch(0.50 0.009 240)" }}
          />
          <span
            className="text-sm truncate"
            style={{ color: "oklch(0.72 0.01 240)" }}
            title={athleteNames}
          >
            {session.athleteIds.length === 1
              ? athleteNames
              : `${session.athleteIds.length} athletes`}
          </span>
        </div>
      </td>
      {/* Fatigue */}
      <td className="py-3.5 pr-4 whitespace-nowrap align-top">
        <FatigueIndicator level={session.fatigueLevel} />
      </td>
      {/* Activities + Notes */}
      <td className="py-3.5 pr-4 max-w-sm align-top">
        <div className="flex flex-col gap-2">
          {session.activities && (
            <div>
              <p
                className="text-xs font-semibold mb-0.5"
                style={{ color: "oklch(0.55 0.009 240)" }}
              >
                Activities:
              </p>
              <p
                className="text-sm whitespace-pre-wrap"
                style={{ color: "oklch(0.65 0.01 240)" }}
              >
                {session.activities}
              </p>
            </div>
          )}
          {session.notes ? (
            <div>
              {session.activities && (
                <p
                  className="text-xs font-semibold mb-0.5"
                  style={{ color: "oklch(0.55 0.009 240)" }}
                >
                  Notes:
                </p>
              )}
              <p
                className="text-sm whitespace-pre-wrap"
                style={{ color: "oklch(0.60 0.01 240)" }}
              >
                {session.notes}
              </p>
            </div>
          ) : !session.activities ? (
            <span
              className="text-sm italic"
              style={{ color: "oklch(0.38 0.008 240)" }}
            >
              No notes
            </span>
          ) : null}
        </div>
      </td>
      {/* Actions */}
      <td className="py-3.5 text-right whitespace-nowrap align-top">
        <div className="flex items-center justify-end gap-1">
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2 text-xs gap-1"
            style={{ color: "oklch(0.72 0.12 75)" }}
            onClick={() => setIsEditing(true)}
            data-ocid={`sessions.edit_button.${index + 1}`}
          >
            <Edit2 className="w-3 h-3" />
            Edit
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0 hover:text-destructive hover:bg-destructive/10"
                data-ocid={`sessions.delete_button.${index + 1}`}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="elite-card border-border">
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Session</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this training session from{" "}
                  {new Date(session.date).toLocaleDateString()}? This cannot be
                  undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel data-ocid="sessions.cancel_button">
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  data-ocid="sessions.confirm_button"
                >
                  {deleteSession.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    "Delete Session"
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </td>
    </motion.tr>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function TrainingSessions() {
  const { data: sessions = [], isLoading } = useGetAllTrainingSessions();
  const { data: athletes = [] } = useGetAllAthletes();
  const [addOpen, setAddOpen] = useState(false);

  const athleteNameMap = new Map(
    athletes.map((a) => [a.id.toString(), a.name]),
  );

  const sorted = [...sessions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  return (
    <div className="min-h-screen grid-bg relative">
      <div className="fixed inset-0 vignette pointer-events-none" />

      <main className="relative z-10 max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h1
              className="font-display text-3xl font-bold"
              style={{ color: "oklch(0.72 0.12 75)" }}
              data-ocid="sessions.page"
            >
              Training Sessions
            </h1>
            <p
              className="text-sm mt-1"
              style={{ color: "oklch(0.50 0.009 240)" }}
            >
              Coach-wide session log — track attendance, fatigue, and notes
            </p>
          </div>

          <Button
            className="btn-gold gap-2"
            onClick={() => setAddOpen((v) => !v)}
            data-ocid="sessions.open_modal_button"
          >
            {addOpen ? (
              <>
                <X className="w-4 h-4" /> Close
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" /> Log Session
              </>
            )}
          </Button>
        </motion.div>

        {/* Add Session Form */}
        <AnimatePresence>
          {addOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -8, height: 0 }}
              transition={{ duration: 0.3 }}
              className="elite-card rounded-xl overflow-hidden mb-6"
            >
              <div
                className="px-5 py-3 flex items-center gap-2"
                style={{ borderBottom: "1px solid oklch(0.24 0.008 240)" }}
              >
                <Plus
                  className="w-4 h-4"
                  style={{ color: "oklch(0.72 0.12 75)" }}
                />
                <span className="text-sm font-semibold text-foreground">
                  New Training Session
                </span>
              </div>
              <AddSessionForm onClose={() => setAddOpen(false)} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats bar */}
        {sessions.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="grid grid-cols-3 gap-4 mb-6"
          >
            {[
              { label: "Total Sessions", value: sessions.length },
              {
                label: "This Month",
                value: sessions.filter((s) => {
                  const d = new Date(s.date);
                  const now = new Date();
                  return (
                    d.getMonth() === now.getMonth() &&
                    d.getFullYear() === now.getFullYear()
                  );
                }).length,
              },
              {
                label: "Avg Fatigue",
                value:
                  sessions.length > 0
                    ? (
                        sessions.reduce((sum, s) => sum + s.fatigueLevel, 0) /
                        sessions.length
                      ).toFixed(1)
                    : "—",
              },
            ].map((stat) => (
              <div key={stat.label} className="elite-card rounded-xl px-5 py-4">
                <p
                  className="text-xs font-semibold tracking-wider uppercase mb-1"
                  style={{ color: "oklch(0.50 0.009 240)" }}
                >
                  {stat.label}
                </p>
                <p
                  className="font-display text-2xl font-bold"
                  style={{ color: "oklch(0.72 0.12 75)" }}
                >
                  {stat.value}
                </p>
              </div>
            ))}
          </motion.div>
        )}

        {/* Sessions table */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="elite-card rounded-xl overflow-hidden"
        >
          {isLoading ? (
            <div className="p-6 space-y-3" data-ocid="sessions.loading_state">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-14 w-full rounded-lg" />
              ))}
            </div>
          ) : sorted.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-20 px-6 text-center"
              data-ocid="sessions.empty_state"
            >
              <ClipboardList
                className="w-10 h-10 mb-4"
                style={{ color: "oklch(0.35 0.009 240)" }}
              />
              <p className="font-semibold text-foreground mb-1">
                No sessions logged yet
              </p>
              <p
                className="text-sm mb-5"
                style={{ color: "oklch(0.45 0.009 240)" }}
              >
                Start tracking training sessions by clicking "Log Session"
                above.
              </p>
              <Button
                className="btn-gold gap-2"
                onClick={() => setAddOpen(true)}
                data-ocid="sessions.primary_button"
              >
                <Plus className="w-4 h-4" /> Log First Session
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm" data-ocid="sessions.table">
                <thead>
                  <tr
                    style={{
                      borderBottom: "1px solid oklch(0.24 0.008 240)",
                      background: "oklch(0.14 0.006 240 / 0.6)",
                    }}
                  >
                    {[
                      "Date",
                      "Athletes",
                      "Fatigue",
                      "Activities & Notes",
                      "",
                    ].map((h) => (
                      <th
                        key={h}
                        className={`px-0 py-3 text-left text-xs font-semibold tracking-wider uppercase pr-4 first:pl-5 last:pr-5 ${h === "" ? "text-right" : ""}`}
                        style={{ color: "oklch(0.50 0.009 240)" }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="[&>tr:last-child]:border-0">
                  {sorted.map((session, i) => (
                    <SessionRow
                      key={session.id}
                      session={session}
                      index={i}
                      athleteNameMap={athleteNameMap}
                      athletes={athletes}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
