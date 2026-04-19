import Text "mo:core/Text";
import Time "mo:core/Time";
import Nat "mo:core/Nat";
import Int "mo:core/Int";
import Map "mo:core/Map";
import List "mo:core/List";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import Array "mo:core/Array";

import AccessControl "mo:caffeineai-authorization/access-control";
import MixinAuthorization "mo:caffeineai-authorization/MixinAuthorization";

actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // Types
  type AthleteId = Nat;
  type TestId = Nat;
  public type TestType = Text; // "CMJ" | "CMJ_AS" | "SJ" | "BJ" | "DJ" | "ApproachJump"

  public type Athlete = {
    id : AthleteId;
    name : Text;
    age : Nat;
    sport : Text;
    notes : Text;
    createdAt : Int;
  };

  public type JumpTest = {
    id : TestId;
    athleteId : AthleteId;
    testType : TestType;
    date : Text;
    height : ?Float;
    distance : ?Float;
    rsi : ?Float;
    dropHeight : ?Float;
    createdAt : Int;
  };

  // Strength lift types and records
  type StrengthRecordId = Nat;
  public type StrengthLiftType = { #backSquat; #powerClean; #deadlift };

  public type StrengthRecord = {
    id : StrengthRecordId;
    athleteId : AthleteId;
    liftType : StrengthLiftType;
    weightKg : Float;
    date : Text;
    createdAt : Int;
  };

  // State — enhanced orthogonal persistence, no stable keyword needed
  var nextAthleteId : Nat = 1;
  var nextTestId : Nat = 1;
  var nextStrengthRecordId : Nat = 1;
  let athletes = Map.empty<AthleteId, Athlete>();
  let jumpTests = Map.empty<TestId, JumpTest>();
  let strengthRecords = Map.empty<StrengthRecordId, StrengthRecord>();

  // Require caller to be authenticated (non-anonymous). All logged-in users
  // can manage athletes and tests — no admin gate on CRUD operations.
  func requireAuthenticated(caller : Principal) {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Must be logged in");
    };
  };

  // Athlete CRUD
  public shared ({ caller }) func createAthlete(name : Text, age : Nat, sport : Text, notes : Text) : async AthleteId {
    requireAuthenticated(caller);
    let id = nextAthleteId;
    nextAthleteId += 1;
    athletes.add(id, { id; name; age; sport; notes; createdAt = Time.now() });
    id;
  };

  public shared ({ caller }) func updateAthlete(id : AthleteId, name : Text, age : Nat, sport : Text, notes : Text) : async () {
    requireAuthenticated(caller);
    switch (athletes.get(id)) {
      case (null) { Runtime.trap("Athlete not found") };
      case (?existing) {
        athletes.add(id, { existing with name; age; sport; notes });
      };
    };
  };

  public shared ({ caller }) func deleteAthlete(id : AthleteId) : async () {
    requireAuthenticated(caller);
    if (not athletes.containsKey(id)) {
      Runtime.trap("Athlete does not exist");
    };
    athletes.remove(id);
    // Delete all associated jump tests
    let testIds = List.empty<TestId>();
    for ((testId, test) in jumpTests.entries()) {
      if (test.athleteId == id) { testIds.add(testId) };
    };
    for (testId in testIds.values()) {
      jumpTests.remove(testId);
    };
    // Delete all associated strength records
    let strengthIds = List.empty<StrengthRecordId>();
    for ((recordId, record) in strengthRecords.entries()) {
      if (record.athleteId == id) { strengthIds.add(recordId) };
    };
    for (recordId in strengthIds.values()) {
      strengthRecords.remove(recordId);
    };
  };

  public query func getAthlete(id : AthleteId) : async ?Athlete {
    athletes.get(id);
  };

  public query func getAllAthletes() : async [Athlete] {
    let result = List.fromIter<Athlete>(athletes.values());
    let arr = result.toArray();
    arr.sort<Athlete>(func(a, b) = Text.compare(a.name, b.name));
  };

  // Jump Test CRUD
  public shared ({ caller }) func addJumpTest(
    athleteId : AthleteId,
    testType : TestType,
    date : Text,
    height : ?Float,
    distance : ?Float,
    rsi : ?Float,
    dropHeight : ?Float,
  ) : async TestId {
    requireAuthenticated(caller);
    if (not athletes.containsKey(athleteId)) {
      Runtime.trap("Athlete does not exist");
    };
    let id = nextTestId;
    nextTestId += 1;
    jumpTests.add(id, { id; athleteId; testType; date; height; distance; rsi; dropHeight; createdAt = Time.now() });
    id;
  };

  public shared ({ caller }) func deleteJumpTest(testId : TestId) : async () {
    requireAuthenticated(caller);
    if (not jumpTests.containsKey(testId)) {
      Runtime.trap("Test does not exist");
    };
    jumpTests.remove(testId);
  };

  public query func getJumpTestsForAthlete(athleteId : AthleteId) : async [JumpTest] {
    let result = List.empty<JumpTest>();
    for ((_, test) in jumpTests.entries()) {
      if (test.athleteId == athleteId) { result.add(test) };
    };
    let arr = result.toArray();
    arr.sort<JumpTest>(func(a, b) = Text.compare(a.date, b.date));
  };

  public query func getJumpTestsByType(athleteId : AthleteId, testType : TestType) : async [JumpTest] {
    let result = List.empty<JumpTest>();
    for ((_, test) in jumpTests.entries()) {
      if (test.athleteId == athleteId and test.testType == testType) {
        result.add(test);
      };
    };
    let arr = result.toArray();
    arr.sort<JumpTest>(func(a, b) = Text.compare(a.date, b.date));
  };

  // Strength Record CRUD
  public shared ({ caller }) func addStrengthRecord(
    athleteId : AthleteId,
    liftType : StrengthLiftType,
    weightKg : Float,
    date : Text,
  ) : async StrengthRecordId {
    requireAuthenticated(caller);
    if (not athletes.containsKey(athleteId)) {
      Runtime.trap("Athlete does not exist");
    };
    let id = nextStrengthRecordId;
    nextStrengthRecordId += 1;
    strengthRecords.add(id, { id; athleteId; liftType; weightKg; date; createdAt = Time.now() });
    id;
  };

  public shared ({ caller }) func deleteStrengthRecord(recordId : StrengthRecordId) : async () {
    requireAuthenticated(caller);
    if (not strengthRecords.containsKey(recordId)) {
      Runtime.trap("Strength record does not exist");
    };
    strengthRecords.remove(recordId);
  };

  public query func getStrengthRecordsForAthlete(athleteId : AthleteId) : async [StrengthRecord] {
    let result = List.empty<StrengthRecord>();
    for ((_, record) in strengthRecords.entries()) {
      if (record.athleteId == athleteId) { result.add(record) };
    };
    let arr = result.toArray();
    arr.sort<StrengthRecord>(func(a, b) = Text.compare(a.date, b.date));
  };

  public query func getStrengthRecordsByLift(athleteId : AthleteId, liftType : StrengthLiftType) : async [StrengthRecord] {
    let result = List.empty<StrengthRecord>();
    for ((_, record) in strengthRecords.entries()) {
      let sameAthlete = record.athleteId == athleteId;
      let sameLift = switch (liftType, record.liftType) {
        case (#backSquat, #backSquat) true;
        case (#powerClean, #powerClean) true;
        case (#deadlift, #deadlift) true;
        case _ false;
      };
      if (sameAthlete and sameLift) { result.add(record) };
    };
    let arr = result.toArray();
    arr.sort<StrengthRecord>(func(a, b) = Text.compare(a.date, b.date));
  };

  // Training Session types and state
  type SessionId = Nat;

  public type TrainingSession = {
    id : Text;
    date : Text;
    athleteIds : [Text];
    fatigueLevel : Nat;
    notes : Text;
    createdBy : Principal;
    createdAt : Int;
  };

  var nextSessionId : Nat = 1;
  let trainingSessions = Map.empty<SessionId, TrainingSession>();

  // Training Session CRUD
  public shared ({ caller }) func addTrainingSession(
    date : Text,
    athleteIds : [Text],
    fatigueLevel : Nat,
    notes : Text,
  ) : async TrainingSession {
    requireAuthenticated(caller);
    if (fatigueLevel < 1 or fatigueLevel > 5) {
      Runtime.trap("fatigueLevel must be between 1 and 5");
    };
    let id = nextSessionId;
    nextSessionId += 1;
    let session : TrainingSession = {
      id = id.toText() # "-" # Time.now().toText();
      date;
      athleteIds;
      fatigueLevel;
      notes;
      createdBy = caller;
      createdAt = Time.now();
    };
    trainingSessions.add(id, session);
    session;
  };

  public shared ({ caller }) func deleteTrainingSession(sessionId : Text) : async () {
    requireAuthenticated(caller);
    var foundKey : ?SessionId = null;
    for ((key, session) in trainingSessions.entries()) {
      if (session.id == sessionId) {
        foundKey := ?key;
      };
    };
    switch (foundKey) {
      case (null) { Runtime.trap("Training session not found") };
      case (?key) {
        trainingSessions.remove(key);
      };
    };
  };

  public query func getAllTrainingSessions() : async [TrainingSession] {
    let result = List.fromIter<TrainingSession>(trainingSessions.values());
    let arr = result.toArray();
    // Sort descending by date (reverse string compare)
    arr.sort<TrainingSession>(func(a, b) = Text.compare(b.date, a.date));
  };

  public query func getTrainingSessionsForAthlete(athleteId : Text) : async [TrainingSession] {
    let result = List.empty<TrainingSession>();
    for ((_, session) in trainingSessions.entries()) {
      let found = session.athleteIds.find(func(aid : Text) : Bool { aid == athleteId });
      switch (found) {
        case (?_) { result.add(session) };
        case (null) {};
      };
    };
    let arr = result.toArray();
    // Sort descending by date
    arr.sort<TrainingSession>(func(a, b) = Text.compare(b.date, a.date));
  };
};
