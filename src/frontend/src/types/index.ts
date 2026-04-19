// Domain types for Elite Bounce — mirrors the Motoko backend types
export type AthleteId = bigint;
export type TestId = bigint;
export type TestType = "CMJ" | "CMJ-AS" | "SJ" | "Approach Jump" | "BJ" | "DJ";

// String union aligned with the backend StrengthLiftType enum values
export type StrengthLiftType = "backSquat" | "powerClean" | "deadlift";
export type StrengthRecordId = bigint;

export interface Athlete {
  id: AthleteId;
  name: string;
  age: bigint;
  sport: string;
  notes: string;
  createdAt: bigint;
}

export interface JumpTest {
  id: TestId;
  athleteId: AthleteId;
  testType: TestType;
  date: string;
  /** Optional: undefined means not recorded, number means the measured value */
  height?: number;
  distance?: number;
  rsi?: number;
  dropHeight?: number;
  createdAt: bigint;
}

export interface StrengthRecord {
  id: StrengthRecordId;
  athleteId: AthleteId;
  liftType: StrengthLiftType;
  weightKg: number;
  date: string;
  createdAt: bigint;
}

export interface TrainingSession {
  id: string;
  date: string;
  athleteIds: string[];
  fatigueLevel: number;
  notes: string;
  createdAt: bigint;
}

/** Full canister method interface — matches backend.d.ts exactly */
export interface BackendActor {
  createAthlete(
    name: string,
    age: bigint,
    sport: string,
    notes: string,
  ): Promise<AthleteId>;
  updateAthlete(
    id: AthleteId,
    name: string,
    age: bigint,
    sport: string,
    notes: string,
  ): Promise<void>;
  deleteAthlete(id: AthleteId): Promise<void>;
  getAthlete(id: AthleteId): Promise<Athlete | null>;
  getAllAthletes(): Promise<Athlete[]>;
  addJumpTest(
    athleteId: AthleteId,
    testType: string,
    date: string,
    height: number | null,
    distance: number | null,
    rsi: number | null,
    dropHeight: number | null,
  ): Promise<TestId>;
  deleteJumpTest(testId: TestId): Promise<void>;
  getJumpTestsForAthlete(athleteId: AthleteId): Promise<JumpTest[]>;
  addStrengthRecord(
    athleteId: AthleteId,
    liftType: StrengthLiftType,
    weightKg: number,
    date: string,
  ): Promise<StrengthRecordId>;
  deleteStrengthRecord(recordId: StrengthRecordId): Promise<void>;
  getStrengthRecordsForAthlete(athleteId: AthleteId): Promise<StrengthRecord[]>;
  getStrengthRecordsByLift(
    athleteId: AthleteId,
    liftType: StrengthLiftType,
  ): Promise<StrengthRecord[]>;
  addTrainingSession(
    date: string,
    athleteIds: string[],
    fatigueLevel: bigint,
    notes: string,
  ): Promise<TrainingSession>;
  deleteTrainingSession(sessionId: string): Promise<void>;
  getAllTrainingSessions(): Promise<TrainingSession[]>;
  getTrainingSessionsForAthlete(athleteId: string): Promise<TrainingSession[]>;
  isCallerAdmin(): Promise<boolean>;
  _initializeAccessControl?(): Promise<void>;
}
