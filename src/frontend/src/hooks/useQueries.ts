import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  Athlete,
  AthleteId,
  BackendActor,
  JumpTest,
  StrengthLiftType,
  StrengthRecord,
  StrengthRecordId,
  TestId,
  TestType,
  TrainingSession,
} from "../types";
import { useActor } from "./useActor";

// Re-export types so pages can import from a single location
export type {
  Athlete,
  AthleteId,
  JumpTest,
  StrengthLiftType,
  StrengthRecord,
  StrengthRecordId,
  TestId,
  TestType,
  TrainingSession,
} from "../types";

function getActor(actor: unknown): BackendActor {
  return actor as BackendActor;
}

/**
 * Throws a user-friendly error when the actor isn't ready.
 */
function requireActor(actor: unknown): BackendActor {
  if (!actor) {
    throw new Error(
      "Connection not ready. Please wait a moment and try again.",
    );
  }
  return actor as BackendActor;
}

export function useGetAllAthletes() {
  const { actor, isFetching } = useActor();
  return useQuery<Athlete[]>({
    queryKey: ["athletes"],
    queryFn: async () => {
      if (!actor) return [];
      return getActor(actor).getAllAthletes();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetAthlete(id: AthleteId | null) {
  const { actor, isFetching } = useActor();
  return useQuery<Athlete | null>({
    queryKey: ["athlete", id?.toString()],
    queryFn: async () => {
      if (!actor || id === null) return null;
      return getActor(actor).getAthlete(id);
    },
    enabled: !!actor && !isFetching && id !== null,
  });
}

export function useGetJumpTestsForAthlete(athleteId: AthleteId | null) {
  const { actor, isFetching } = useActor();
  return useQuery<JumpTest[]>({
    queryKey: ["jumpTests", athleteId?.toString()],
    queryFn: async () => {
      if (!actor || athleteId === null) return [];
      return getActor(actor).getJumpTestsForAthlete(athleteId);
    },
    enabled: !!actor && !isFetching && athleteId !== null,
  });
}

export function useGetStrengthRecordsForAthlete(athleteId: AthleteId | null) {
  const { actor, isFetching } = useActor();
  return useQuery<StrengthRecord[]>({
    queryKey: ["strengthRecords", athleteId?.toString()],
    queryFn: async () => {
      if (!actor || athleteId === null) return [];
      return getActor(actor).getStrengthRecordsForAthlete(athleteId);
    },
    enabled: !!actor && !isFetching && athleteId !== null,
  });
}

export function useIsCallerAdmin() {
  const { actor, isFetching } = useActor();
  return useQuery<boolean>({
    queryKey: ["isAdmin"],
    queryFn: async () => {
      if (!actor) return false;
      return getActor(actor).isCallerAdmin();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateAthlete() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      name: string;
      age: number;
      sport: string;
      notes: string;
    }) => {
      const a = requireActor(actor);
      return a.createAthlete(
        data.name,
        BigInt(data.age),
        data.sport,
        data.notes,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["athletes"] });
    },
  });
}

export function useUpdateAthlete() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      id: AthleteId;
      name: string;
      age: number;
      sport: string;
      notes: string;
    }) => {
      const a = requireActor(actor);
      return a.updateAthlete(
        data.id,
        data.name,
        BigInt(data.age),
        data.sport,
        data.notes,
      );
    },
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: ["athletes"] });
      queryClient.invalidateQueries({
        queryKey: ["athlete", variables.id.toString()],
      });
    },
  });
}

export function useDeleteAthlete() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: AthleteId) => {
      const a = requireActor(actor);
      return a.deleteAthlete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["athletes"] });
    },
  });
}

export function useAddJumpTest() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      athleteId: AthleteId;
      testType: TestType;
      date: string;
      height: number | null;
      distance: number | null;
      rsi: number | null;
      dropHeight: number | null;
    }) => {
      const a = requireActor(actor);
      return a.addJumpTest(
        BigInt(data.athleteId),
        data.testType,
        data.date,
        data.height,
        data.distance,
        data.rsi,
        data.dropHeight,
      );
    },
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["jumpTests", variables.athleteId.toString()],
      });
      queryClient.invalidateQueries({ queryKey: ["athletes"] });
    },
  });
}

export function useDeleteJumpTest(athleteId: AthleteId | null) {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (testId: TestId) => {
      const a = requireActor(actor);
      return a.deleteJumpTest(testId);
    },
    onSuccess: () => {
      if (athleteId !== null) {
        queryClient.invalidateQueries({
          queryKey: ["jumpTests", athleteId.toString()],
        });
      }
      queryClient.invalidateQueries({ queryKey: ["athletes"] });
    },
  });
}

export function useAddStrengthRecord() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      athleteId: AthleteId;
      liftType: StrengthLiftType;
      weightKg: number;
      date: string;
    }) => {
      const a = requireActor(actor);
      return a.addStrengthRecord(
        BigInt(data.athleteId),
        data.liftType,
        data.weightKg,
        data.date,
      );
    },
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["strengthRecords", variables.athleteId.toString()],
      });
    },
  });
}

export function useDeleteStrengthRecord(athleteId: AthleteId | null) {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (recordId: StrengthRecordId) => {
      const a = requireActor(actor);
      return a.deleteStrengthRecord(recordId);
    },
    onSuccess: () => {
      if (athleteId !== null) {
        queryClient.invalidateQueries({
          queryKey: ["strengthRecords", athleteId.toString()],
        });
      }
    },
  });
}

// ─── Training Sessions ─────────────────────────────────────────────────────────

/** Normalize a raw backend TrainingSession — converts bigint fields to safe JS types. */
function normalizeSession(s: TrainingSession): TrainingSession {
  return {
    ...s,
    fatigueLevel: Number(s.fatigueLevel),
    createdAt: BigInt(s.createdAt), // keep as bigint but ensure it's a real bigint
  };
}

export function useGetAllTrainingSessions() {
  const { actor, isFetching } = useActor();
  return useQuery<TrainingSession[]>({
    queryKey: ["trainingSessions"],
    queryFn: async () => {
      if (!actor) return [];
      const raw = await getActor(actor).getAllTrainingSessions();
      return raw.map(normalizeSession);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetTrainingSessionsForAthlete(athleteId: AthleteId | null) {
  const { actor, isFetching } = useActor();
  return useQuery<TrainingSession[]>({
    queryKey: ["trainingSessions", "athlete", athleteId?.toString()],
    queryFn: async () => {
      if (!actor || athleteId === null) return [];
      const raw = await getActor(actor).getTrainingSessionsForAthlete(
        athleteId.toString(),
      );
      return raw.map(normalizeSession);
    },
    enabled: !!actor && !isFetching && athleteId !== null,
  });
}

export function useAddTrainingSession() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      date: string;
      athleteIds: string[];
      fatigueLevel: number;
      notes: string;
    }) => {
      const a = requireActor(actor);
      return a.addTrainingSession(
        data.date,
        data.athleteIds,
        BigInt(data.fatigueLevel),
        data.notes,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trainingSessions"] });
    },
  });
}

export function useDeleteTrainingSession() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (sessionId: string) => {
      const a = requireActor(actor);
      return a.deleteTrainingSession(sessionId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trainingSessions"] });
    },
  });
}
