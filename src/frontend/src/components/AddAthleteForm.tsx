import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useActor } from "../hooks/useActor";
import { useCreateAthlete } from "../hooks/useQueries";

interface AddAthleteFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function AddAthleteForm({ onSuccess, onCancel }: AddAthleteFormProps) {
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [sport, setSport] = useState("");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const {
    actor,
    isFetching: actorFetching,
    isError: actorError,
    retry: retryActor,
  } = useActor();
  const isActorReady = !!actor && !actorFetching;

  const { mutateAsync, isPending } = useCreateAthlete();

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "Name is required";
    const parsedAge = Number.parseInt(age, 10);
    if (!age || Number.isNaN(parsedAge) || parsedAge < 1 || parsedAge > 120)
      errs.age = "Enter a valid age (1-120)";
    if (!sport.trim()) errs.sport = "Sport / hobby is required";
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
    const parsedAge = Number.parseInt(age, 10);
    try {
      await mutateAsync({
        name: name.trim(),
        age: parsedAge,
        sport: sport.trim(),
        notes: notes.trim(),
      });
      toast.success("Athlete added successfully!");
      onSuccess?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      toast.error(`Failed to add athlete: ${message}`);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4"
      data-ocid="add_athlete.modal"
    >
      <div className="space-y-1">
        <Label htmlFor="athlete-name" className="text-sm text-muted-foreground">
          Full Name *
        </Label>
        <Input
          id="athlete-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Marcus Johnson"
          className="bg-muted border-border"
          data-ocid="add_athlete.input"
          autoComplete="off"
        />
        {errors.name && (
          <p
            className="text-xs"
            style={{ color: "oklch(0.58 0.22 25)" }}
            data-ocid="add_athlete.error_state"
          >
            {errors.name}
          </p>
        )}
      </div>

      <div className="space-y-1">
        <Label htmlFor="athlete-age" className="text-sm text-muted-foreground">
          Age *
        </Label>
        <Input
          id="athlete-age"
          type="number"
          value={age}
          onChange={(e) => setAge(e.target.value)}
          placeholder="e.g. 22"
          className="bg-muted border-border"
          data-ocid="add_athlete.input"
          min="1"
          max="120"
        />
        {errors.age && (
          <p
            className="text-xs"
            style={{ color: "oklch(0.58 0.22 25)" }}
            data-ocid="add_athlete.error_state"
          >
            {errors.age}
          </p>
        )}
      </div>

      <div className="space-y-1">
        <Label
          htmlFor="athlete-sport"
          className="text-sm text-muted-foreground"
        >
          Sport / Hobby *
        </Label>
        <Input
          id="athlete-sport"
          value={sport}
          onChange={(e) => setSport(e.target.value)}
          placeholder="e.g. Basketball"
          className="bg-muted border-border"
          data-ocid="add_athlete.input"
          autoComplete="off"
        />
        {errors.sport && (
          <p
            className="text-xs"
            style={{ color: "oklch(0.58 0.22 25)" }}
            data-ocid="add_athlete.error_state"
          >
            {errors.sport}
          </p>
        )}
      </div>

      <div className="space-y-1">
        <Label
          htmlFor="athlete-notes"
          className="text-sm text-muted-foreground"
        >
          Notes
        </Label>
        <Textarea
          id="athlete-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any relevant notes about this athlete..."
          className="bg-muted border-border resize-none"
          rows={3}
          data-ocid="add_athlete.textarea"
        />
      </div>

      <div className="flex gap-3 pt-2">
        <Button
          type="submit"
          disabled={isPending || (!isActorReady && !actorError)}
          className="flex-1 btn-gold"
          data-ocid="add_athlete.submit_button"
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
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Adding...
            </>
          ) : actorError ? (
            "Retry Connection"
          ) : !isActorReady ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Connecting...
            </>
          ) : (
            "Add Athlete"
          )}
        </Button>
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="flex-1"
            data-ocid="add_athlete.cancel_button"
          >
            Cancel
          </Button>
        )}
      </div>

      {isPending && (
        <div
          className="text-center text-xs text-muted-foreground"
          data-ocid="add_athlete.loading_state"
        >
          Adding athlete to roster...
        </div>
      )}
      {actorError && !isPending && (
        <div
          className="text-center text-xs"
          style={{ color: "oklch(0.65 0.18 25)" }}
          data-ocid="add_athlete.error_state"
        >
          Connection failed. Click "Retry Connection" to try again.
        </div>
      )}
      {!isActorReady && !actorError && !isPending && (
        <div
          className="text-center text-xs text-muted-foreground"
          data-ocid="add_athlete.connecting_state"
        >
          Connecting to backend...
        </div>
      )}
    </form>
  );
}
