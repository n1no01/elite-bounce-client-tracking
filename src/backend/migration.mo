import Map "mo:core/Map";

module {
  // Old Athlete type (without totalPaidKM)
  type AthleteId = Nat;
  type OldAthlete = {
    id : AthleteId;
    name : Text;
    age : Nat;
    sport : Text;
    notes : Text;
    createdAt : Int;
  };

  // New Athlete type (with totalPaidKM)
  type NewAthlete = {
    id : AthleteId;
    name : Text;
    age : Nat;
    sport : Text;
    notes : Text;
    createdAt : Int;
    totalPaidKM : ?Float;
  };

  type OldActor = {
    athletes : Map.Map<AthleteId, OldAthlete>;
  };

  type NewActor = {
    athletes : Map.Map<AthleteId, NewAthlete>;
  };

  public func run(old : OldActor) : NewActor {
    let athletes = old.athletes.map<AthleteId, OldAthlete, NewAthlete>(
      func(_id, a) {
        { a with totalPaidKM = null : ?Float };
      }
    );
    { athletes };
  };
};
