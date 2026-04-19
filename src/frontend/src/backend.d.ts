import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export type TestType = string;
export interface TrainingSession {
    id: string;
    fatigueLevel: bigint;
    date: string;
    createdAt: bigint;
    createdBy: Principal;
    notes: string;
    athleteIds: Array<string>;
}
export type AthleteId = bigint;
export interface StrengthRecord {
    id: StrengthRecordId;
    date: string;
    createdAt: bigint;
    athleteId: AthleteId;
    weightKg: number;
    liftType: StrengthLiftType;
}
export type TestId = bigint;
export interface Athlete {
    id: AthleteId;
    age: bigint;
    name: string;
    createdAt: bigint;
    sport: string;
    notes: string;
}
export type StrengthRecordId = bigint;
export interface JumpTest {
    id: TestId;
    rsi?: number;
    height?: number;
    dropHeight?: number;
    date: string;
    createdAt: bigint;
    testType: TestType;
    athleteId: AthleteId;
    distance?: number;
}
export enum StrengthLiftType {
    powerClean = "powerClean",
    backSquat = "backSquat",
    deadlift = "deadlift"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addJumpTest(athleteId: AthleteId, testType: TestType, date: string, height: number | null, distance: number | null, rsi: number | null, dropHeight: number | null): Promise<TestId>;
    addStrengthRecord(athleteId: AthleteId, liftType: StrengthLiftType, weightKg: number, date: string): Promise<StrengthRecordId>;
    addTrainingSession(date: string, athleteIds: Array<string>, fatigueLevel: bigint, notes: string): Promise<TrainingSession>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createAthlete(name: string, age: bigint, sport: string, notes: string): Promise<AthleteId>;
    deleteAthlete(id: AthleteId): Promise<void>;
    deleteJumpTest(testId: TestId): Promise<void>;
    deleteStrengthRecord(recordId: StrengthRecordId): Promise<void>;
    deleteTrainingSession(sessionId: string): Promise<void>;
    getAllAthletes(): Promise<Array<Athlete>>;
    getAllTrainingSessions(): Promise<Array<TrainingSession>>;
    getAthlete(id: AthleteId): Promise<Athlete | null>;
    getCallerUserRole(): Promise<UserRole>;
    getJumpTestsByType(athleteId: AthleteId, testType: TestType): Promise<Array<JumpTest>>;
    getJumpTestsForAthlete(athleteId: AthleteId): Promise<Array<JumpTest>>;
    getStrengthRecordsByLift(athleteId: AthleteId, liftType: StrengthLiftType): Promise<Array<StrengthRecord>>;
    getStrengthRecordsForAthlete(athleteId: AthleteId): Promise<Array<StrengthRecord>>;
    getTrainingSessionsForAthlete(athleteId: string): Promise<Array<TrainingSession>>;
    isCallerAdmin(): Promise<boolean>;
    updateAthlete(id: AthleteId, name: string, age: bigint, sport: string, notes: string): Promise<void>;
}
