import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  Athlete,
  AthleteId,
  JumpTest,
  TestId,
  TestType,
} from "../backend";
import { useActor } from "./useActor";

export function useGetAllAthletes() {
  const { actor, isFetching } = useActor();
  return useQuery<Athlete[]>({
    queryKey: ["athletes"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllAthletes();
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
      return actor.getAthlete(id);
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
      return actor.getJumpTestsForAthlete(athleteId);
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
      return actor.isCallerAdmin();
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
      if (!actor) throw new Error("Actor not available");
      return actor.createAthlete(
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
      if (!actor) throw new Error("Actor not available");
      return actor.updateAthlete(
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
      if (!actor) throw new Error("Actor not available");
      return actor.deleteAthlete(id);
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
      if (!actor) throw new Error("Actor not available");
      return actor.addJumpTest(
        data.athleteId,
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
      if (!actor) throw new Error("Actor not available");
      return actor.deleteJumpTest(testId);
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
