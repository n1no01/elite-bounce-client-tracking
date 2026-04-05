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
import type { AthleteId } from "../backend";
import { useAddJumpTest } from "../hooks/useQueries";

const TEST_TYPES = [
  { value: "CMJ", label: "Countermovement Jump (CMJ)" },
  { value: "CMJ-AS", label: "CMJ with Arm Swing (CMJ-AS)" },
  { value: "SJ", label: "Squat Jump (SJ)" },
  { value: "DJ", label: "Drop Jump (DJ)" },
  { value: "BJ", label: "Broad Jump (BJ)" },
  { value: "Approach Jump", label: "Approach Jump" },
];

interface JumpTestFormProps {
  athleteId: AthleteId;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function JumpTestForm({
  athleteId,
  onSuccess,
  onCancel,
}: JumpTestFormProps) {
  const today = new Date().toISOString().split("T")[0];
  const [testType, setTestType] = useState("");
  const [date, setDate] = useState(today);
  const [height, setHeight] = useState("");
  const [distance, setDistance] = useState("");
  const [rsi, setRsi] = useState("");
  const [dropHeight, setDropHeight] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { mutateAsync, isPending } = useAddJumpTest();

  const isBJ = testType === "BJ";
  const isDJ = testType === "DJ";
  const showHeight = testType !== "" && !isBJ;
  const showDistance = isBJ;
  const showRsiDrop = isDJ;

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!testType) errs.testType = "Please select a test type";
    if (!date) errs.date = "Date is required";
    if (showHeight && !height) errs.height = "Height is required";
    if (
      showHeight &&
      height &&
      (Number.isNaN(Number(height)) || Number(height) <= 0)
    )
      errs.height = "Enter a valid height in cm";
    if (showDistance && !distance) errs.distance = "Distance is required";
    if (
      showDistance &&
      distance &&
      (Number.isNaN(Number(distance)) || Number(distance) <= 0)
    )
      errs.distance = "Enter a valid distance in cm";
    if (showRsiDrop && !rsi) errs.rsi = "RSI is required for Drop Jump";
    if (showRsiDrop && !dropHeight) errs.dropHeight = "Drop height is required";
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
        athleteId,
        testType,
        date,
        height: showHeight && height ? Number(height) : null,
        distance: showDistance && distance ? Number(distance) : null,
        rsi: showRsiDrop && rsi ? Number(rsi) : null,
        dropHeight: showRsiDrop && dropHeight ? Number(dropHeight) : null,
      });
      toast.success(`${testType} test recorded!`);
      // Reset form
      setTestType("");
      setDate(today);
      setHeight("");
      setDistance("");
      setRsi("");
      setDropHeight("");
      onSuccess?.();
    } catch {
      toast.error("Failed to save test. Please try again.");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4"
      data-ocid="add_test.modal"
    >
      {/* Test Type */}
      <div className="space-y-1">
        <Label className="text-sm text-muted-foreground">Test Type *</Label>
        <Select
          value={testType}
          onValueChange={(val) => {
            setTestType(val);
            setErrors({});
          }}
        >
          <SelectTrigger
            className="bg-muted border-border"
            data-ocid="add_test.select"
          >
            <SelectValue placeholder="Select test type..." />
          </SelectTrigger>
          <SelectContent>
            {TEST_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.testType && (
          <p
            className="text-xs"
            style={{ color: "oklch(0.58 0.22 25)" }}
            data-ocid="add_test.error_state"
          >
            {errors.testType}
          </p>
        )}
      </div>

      {/* Date */}
      <div className="space-y-1">
        <Label htmlFor="test-date" className="text-sm text-muted-foreground">
          Date *
        </Label>
        <Input
          id="test-date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="bg-muted border-border"
          data-ocid="add_test.input"
        />
        {errors.date && (
          <p
            className="text-xs"
            style={{ color: "oklch(0.58 0.22 25)" }}
            data-ocid="add_test.error_state"
          >
            {errors.date}
          </p>
        )}
      </div>

      {/* Height (all except BJ) */}
      {showHeight && (
        <div className="space-y-1">
          <Label
            htmlFor="test-height"
            className="text-sm text-muted-foreground"
          >
            Jump Height (cm) *
          </Label>
          <Input
            id="test-height"
            type="number"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
            placeholder="e.g. 58.5"
            className="bg-muted border-border"
            data-ocid="add_test.input"
            min="0"
            step="0.1"
          />
          {errors.height && (
            <p
              className="text-xs"
              style={{ color: "oklch(0.58 0.22 25)" }}
              data-ocid="add_test.error_state"
            >
              {errors.height}
            </p>
          )}
        </div>
      )}

      {/* Distance (BJ only) */}
      {showDistance && (
        <div className="space-y-1">
          <Label
            htmlFor="test-distance"
            className="text-sm text-muted-foreground"
          >
            Jump Distance (cm) *
          </Label>
          <Input
            id="test-distance"
            type="number"
            value={distance}
            onChange={(e) => setDistance(e.target.value)}
            placeholder="e.g. 220"
            className="bg-muted border-border"
            data-ocid="add_test.input"
            min="0"
            step="0.5"
          />
          {errors.distance && (
            <p
              className="text-xs"
              style={{ color: "oklch(0.58 0.22 25)" }}
              data-ocid="add_test.error_state"
            >
              {errors.distance}
            </p>
          )}
        </div>
      )}

      {/* RSI + Drop Height (DJ only) */}
      {showRsiDrop && (
        <>
          <div className="space-y-1">
            <Label htmlFor="test-rsi" className="text-sm text-muted-foreground">
              RSI *
            </Label>
            <Input
              id="test-rsi"
              type="number"
              value={rsi}
              onChange={(e) => setRsi(e.target.value)}
              placeholder="e.g. 1.85"
              className="bg-muted border-border"
              data-ocid="add_test.input"
              min="0"
              step="0.01"
            />
            {errors.rsi && (
              <p
                className="text-xs"
                style={{ color: "oklch(0.58 0.22 25)" }}
                data-ocid="add_test.error_state"
              >
                {errors.rsi}
              </p>
            )}
          </div>
          <div className="space-y-1">
            <Label
              htmlFor="test-drop-height"
              className="text-sm text-muted-foreground"
            >
              Drop Height (cm) *
            </Label>
            <Input
              id="test-drop-height"
              type="number"
              value={dropHeight}
              onChange={(e) => setDropHeight(e.target.value)}
              placeholder="e.g. 30"
              className="bg-muted border-border"
              data-ocid="add_test.input"
              min="0"
              step="0.5"
            />
            {errors.dropHeight && (
              <p
                className="text-xs"
                style={{ color: "oklch(0.58 0.22 25)" }}
                data-ocid="add_test.error_state"
              >
                {errors.dropHeight}
              </p>
            )}
          </div>
        </>
      )}

      <div className="flex gap-3 pt-2">
        <Button
          type="submit"
          disabled={isPending}
          className="flex-1 btn-gold"
          data-ocid="add_test.submit_button"
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
            </>
          ) : (
            "Record Test"
          )}
        </Button>
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="flex-1"
            data-ocid="add_test.cancel_button"
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
