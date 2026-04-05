import Set "mo:core/Set";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Iter "mo:core/Iter";
import Array "mo:core/Array";
import Float "mo:core/Float";
import Nat "mo:core/Nat";
import Order "mo:core/Order";
import Map "mo:core/Map";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";

actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // Types
  type AthleteId = Nat;
  type TestId = Nat;
  type TestType = Text;

  // Data Formats
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

  // Custom Comparison for Sorting by Name
  module Athlete {
    public func compareByName(a : Athlete, b : Athlete) : Order.Order {
      Text.compare(a.name, b.name);
    };
  };

  module JumpTest {
    public func compare(a : JumpTest, b : JumpTest) : Order.Order {
      Nat.compare(a.id, b.id);
    };

    public func compareByDate(a : JumpTest, b : JumpTest) : Order.Order {
      Text.compare(a.date, b.date);
    };
  };

  // State
  var nextAthleteId = 1;
  var nextTestId = 1;
  let athletes = Map.empty<AthleteId, Athlete>();
  let jumpTests = Map.empty<TestId, JumpTest>();

  // Athlete CRUD
  public shared ({ caller }) func createAthlete(name : Text, age : Nat, sport : Text, notes : Text) : async AthleteId {
    checkAdminAccess(caller);

    let id = nextAthleteId;
    nextAthleteId += 1;

    let athlete : Athlete = {
      id;
      name;
      age;
      sport;
      notes;
      createdAt = Time.now();
    };

    athletes.add(id, athlete);
    id;
  };

  public shared ({ caller }) func updateAthlete(id : AthleteId, name : Text, age : Nat, sport : Text, notes : Text) : async () {
    checkAdminAccess(caller);

    switch (athletes.get(id)) {
      case (null) { Runtime.trap("Athlete not found") };
      case (?existing) {
        let updated : Athlete = {
          existing with
          name;
          age;
          sport;
          notes;
        };
        athletes.add(id, updated);
      };
    };
  };

  public shared ({ caller }) func deleteAthlete(id : AthleteId) : async () {
    checkAdminAccess(caller);

    if (not athletes.containsKey(id)) {
      Runtime.trap("Athlete does not exist: " # id.toText());
    };
    athletes.remove(id);

    // Also delete associated tests
    jumpTests.keys().toArray().forEach(func(testId) {
      switch (jumpTests.get(testId)) {
        case (null) {};
        case (?test) {
          if (test.athleteId == id) {
            jumpTests.remove(testId);
          };
        };
      };
    });
  };

  public query ({ caller }) func getAthlete(id : AthleteId) : async Athlete {
    checkUserAccess(caller);

    switch (athletes.get(id)) {
      case (null) { Runtime.trap("Athlete not found") };
      case (?athlete) { athlete };
    };
  };

  public query ({ caller }) func getAllAthletes() : async [Athlete] {
    checkUserAccess(caller);

    athletes.values().toArray().sort(Athlete.compareByName);
  };

  // Jump Test CRUD
  public shared ({ caller }) func addJumpTest(athleteId : AthleteId, testType : TestType, date : Text, height : ?Float, distance : ?Float, rsi : ?Float, dropHeight : ?Float) : async TestId {
    checkAdminAccess(caller);

    if (not athletes.containsKey(athleteId)) {
      Runtime.trap("Cannot add jump test: Athlete does not exist: " # athleteId.toText());
    };

    let id = nextTestId;
    nextTestId += 1;

    let test : JumpTest = {
      id;
      athleteId;
      testType;
      date;
      height;
      distance;
      rsi;
      dropHeight;
      createdAt = Time.now();
    };

    jumpTests.add(id, test);
    id;
  };

  public shared ({ caller }) func deleteJumpTest(testId : TestId) : async () {
    checkAdminAccess(caller);

    if (not jumpTests.containsKey(testId)) {
      Runtime.trap("Test does not exist: " # testId.toText());
    };
    jumpTests.remove(testId);
  };

  public query ({ caller }) func getJumpTestsForAthlete(athleteId : AthleteId) : async [JumpTest] {
    checkUserAccess(caller);

    if (not athletes.containsKey(athleteId)) {
      Runtime.trap("Athlete does not exist: " # athleteId.toText());
    };

    let filtered = jumpTests.values().toArray().filter(func(jt) { jt.athleteId == athleteId });
    filtered.sort();
  };

  public query ({ caller }) func getJumpTestsByType(athleteId : AthleteId, testType : TestType) : async [JumpTest] {
    checkUserAccess(caller);

    if (not athletes.containsKey(athleteId)) {
      Runtime.trap("Athlete does not exist: " # athleteId.toText());
    };

    let filtered = jumpTests.values().toArray().filter(func(jt) { jt.athleteId == athleteId and jt.testType == testType });
    filtered.sort();
  };

  // Helper Functions
  func checkAdminAccess(caller : Principal) {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Admin access required");
    };
  };

  func checkUserAccess(caller : Principal) {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: User access required");
    };
  };
};
