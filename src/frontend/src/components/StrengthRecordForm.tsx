import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useActor } from "../hooks/useActor";
import { useAddStrengthRecord } from "../hooks/useQueries";
import type { AthleteId, StrengthLiftType } from "../types";

const LIFT_TYPES: { value: StrengthLiftType; label: string }[] = [
  { value: "backSquat", label: "Back Squat" },
  { value: "powerClean", label: "Power Clean" },
  { value: "deadlift", label: "Deadlift" },
];

interface StrengthRecordFormProps {
  athleteId: AthleteId;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function StrengthRecordForm({
  athleteId,
  onSuccess,
  onCancel,
}: StrengthRecordFormProps) {
  const today = new Date().toISOString().split("T")[0];
  const [liftType, setLiftType] = useState<StrengthLiftType | "">("");
  const [weight, setWeight] = useState("");
  const [date, setDate] = useState(today);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const {
    actor,
    isFetching: actorFetching,
    isError: actorError,
    retry: retryActor,
  } = useActor();
  const isActorReady = !!actor && !actorFetching;

  const { mutateAsync, isPending } = useAddStrengthRecord();

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!liftType) errs.liftType = "Please select a lift type";
    if (!weight) errs.weight = "Weight is required";
    else if (Number.isNaN(Number(weight)) || Number(weight) <= 0)
      errs.weight = "Enter a valid weight in kg";
    if (!date) errs.date = "Date is required";
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});

    try {
      await mutateAsync({
        athleteId: BigInt(athleteId),
        liftType: liftType as StrengthLiftType,
        weightKg: Number.parseFloat(weight),
        date,
      });
      const liftLabel =
        LIFT_TYPES.find((l) => l.value === liftType)?.label ?? liftType;
      toast.success(`${liftLabel} recorded!`);
      setLiftType("");
      setWeight("");
      setDate(today);
      onSuccess?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      toast.error(`Failed to save record: ${message}`);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4"
      data-ocid="add_strength.modal"
    >
      {/* Lift Type */}
      <div className="space-y-1">
        <Label className="text-sm text-muted-foreground">Lift Type *</Label>
        <Select
          value={liftType}
          onValueChange={(val) => {
            setLiftType(val as StrengthLiftType);
            setErrors({});
          }}
        >
          <SelectTrigger
            className="bg-muted border-border"
            data-ocid="add_strength.select"
          >
            <SelectValue placeholder="Select lift type..." />
          </SelectTrigger>
          <SelectContent>
            {LIFT_TYPES.map((l) => (
              <SelectItem key={l.value} value={l.value}>
                {l.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.liftType && (
          <p
            className="text-xs"
            style={{ color: "oklch(0.58 0.22 25)" }}
            data-ocid="add_strength.error_state"
          >
            {errors.liftType}
          </p>
        )}
      </div>

      {/* Weight */}
      <div className="space-y-1">
        <Label
          htmlFor="strength-weight"
          className="text-sm text-muted-foreground"
        >
          Weight (kg) *
        </Label>
        <Input
          id="strength-weight"
          type="number"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          placeholder="e.g. 120.5"
          className="bg-muted border-border"
          data-ocid="add_strength.input"
          min="0"
          step="0.5"
        />
        {errors.weight && (
          <p
            className="text-xs"
            style={{ color: "oklch(0.58 0.22 25)" }}
            data-ocid="add_strength.error_state"
          >
            {errors.weight}
          </p>
        )}
      </div>

      {/* Date */}
      <div className="space-y-1">
        <Label
          htmlFor="strength-date"
          className="text-sm text-muted-foreground"
        >
          Date *
        </Label>
        <Input
          id="strength-date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="bg-muted border-border"
          data-ocid="add_strength.input"
        />
        {errors.date && (
          <p
            className="text-xs"
            style={{ color: "oklch(0.58 0.22 25)" }}
            data-ocid="add_strength.error_state"
          >
            {errors.date}
          </p>
        )}
      </div>

      <div className="flex gap-3 pt-2">
        <Button
          type="submit"
          disabled={isPending || (!isActorReady && !actorError)}
          className="flex-1 btn-gold"
          data-ocid="add_strength.submit_button"
          onClick={
            actorError
              ? (e) => {
                  e.preventDefault();
                  retryActor();
                }
              : undefined
          }
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
            </>
          ) : actorError ? (
            "Retry Connection"
          ) : !isActorReady ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Connecting...
            </>
          ) : (
            "Record Lift"
          )}
        </Button>
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="flex-1"
            data-ocid="add_strength.cancel_button"
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
