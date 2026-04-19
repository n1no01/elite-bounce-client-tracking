import { useActor as useActorBase } from "@caffeineai/core-infrastructure";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { createActor } from "../backend";

/**
 * Wrapper around the core-infrastructure useActor hook, pre-wired to the
 * project's generated backend createActor function.
 *
 * Returns { actor, isFetching, isError, retry }
 * - isError: true when the actor failed to initialize (e.g. env.json misconfigured)
 * - retry: function to re-trigger actor initialization
 * Consumers should cast actor to BackendActor before calling methods.
 */
export function useActor(): {
  actor: unknown | null;
  isFetching: boolean;
  isError: boolean;
  retry: () => void;
} {
  const base = useActorBase(createActor);
  const queryClient = useQueryClient();

  // Track whether isFetching has settled to false without producing an actor
  // (indicates initialization failed / timed out).
  const [isError, setIsError] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Clear any previous error when a new fetch starts
    if (base.isFetching) {
      setIsError(false);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    // Not fetching + no actor → error / stuck state; apply 10s timeout window
    if (!base.actor && !base.isFetching) {
      timerRef.current = setTimeout(() => {
        setIsError(true);
      }, 10_000);
    } else {
      // Actor is available — clear error
      setIsError(false);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [base.isFetching, base.actor]);

  const retry = () => {
    setIsError(false);
    // Invalidate the actor query so core-infrastructure re-runs createActorWithConfig
    queryClient.invalidateQueries({ queryKey: ["actor"] });
  };

  return { ...base, isError, retry };
}
