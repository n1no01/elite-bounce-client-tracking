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
export type TestId = bigint;
export interface Athlete {
    id: AthleteId;
    age: bigint;
    name: string;
    createdAt: bigint;
    sport: string;
    notes: string;
}
export type AthleteId = bigint;
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
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addJumpTest(athleteId: AthleteId, testType: TestType, date: string, height: number | null, distance: number | null, rsi: number | null, dropHeight: number | null): Promise<TestId>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createAthlete(name: string, age: bigint, sport: string, notes: string): Promise<AthleteId>;
    deleteAthlete(id: AthleteId): Promise<void>;
    deleteJumpTest(testId: TestId): Promise<void>;
    getAllAthletes(): Promise<Array<Athlete>>;
    getAthlete(id: AthleteId): Promise<Athlete>;
    getCallerUserRole(): Promise<UserRole>;
    getJumpTestsByType(athleteId: AthleteId, testType: TestType): Promise<Array<JumpTest>>;
    getJumpTestsForAthlete(athleteId: AthleteId): Promise<Array<JumpTest>>;
    isCallerAdmin(): Promise<boolean>;
    updateAthlete(id: AthleteId, name: string, age: bigint, sport: string, notes: string): Promise<void>;
}
