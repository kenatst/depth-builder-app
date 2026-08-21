import Foundation

// Deterministic engine tests — compiled with:
//   swiftc tools/test-engine.swift ios/REBOOT/Product/AdaptiveCore.swift \
//     ios/REBOOT/Environment/EnvironmentModels.swift \
//     ios/REBOOT/Environment/EnvironmentEngine.swift ios/REBOOT/Product/QASeed.swift \
//     -o /tmp/test-engine && /tmp/test-engine

var failures = 0

func check(_ condition: Bool, _ name: String) {
    if condition {
        print("PASS  \(name)")
    } else {
        print("FAIL  \(name)")
        failures += 1
    }
}

@main
struct Runner {
    static func main() {
// MARK: - Regression: the four QA profiles keep their prescriptions

let day1 = PrescriptionEngine.prescription(profile: QASeeds.day1.profile ?? AttentionProfile(), sessions: [], day: 1)
check(day1.mode == .observe && day1.headline == "Work normally." && day1.minutes == 15, "regression day1 → OBSERVE 15")

let stayProfile = QASeeds.stay.profile!
let stay = PrescriptionEngine.prescription(profile: stayProfile, sessions: QASeeds.stay.sessions!, day: 4)
check(stay.mode == .stay && stay.headline == "Make switching harder." && stay.minutes == 20, "regression stay → STAY 20")

let recallProfile = QASeeds.recall.profile!
let recall = PrescriptionEngine.prescription(profile: recallProfile, sessions: QASeeds.recall.sessions!, day: 5)
check(recall.mode == .recall && recall.headline == "Close it. Recall it." && recall.minutes == 30, "regression recall → RECALL 30")

let rest = PrescriptionEngine.prescription(profile: QASeeds.rest.profile!, sessions: QASeeds.rest.sessions!, day: 3)
check(rest.mode == .nothing && rest.headline == "Give your mind less to react to." && rest.minutes == 10, "regression rest → NOTHING 10")

// MARK: - Friction ladder

check(FrictionLadder.chooseLevel(env: nil, distractorKnown: false) == 0, "no distractor → observe only")
check(FrictionLadder.chooseLevel(env: nil, distractorKnown: true) == 1, "distractor without evidence → manual friction")

var manualGood = EnvironmentEvidence()
manualGood.manualInterventionsTotal = 2
manualGood.manualInterventionsSuccessful = 2
check(FrictionLadder.chooseLevel(env: manualGood, distractorKnown: true) == 1, "manual friction working → stays level 1")

var manualFailing = EnvironmentEvidence()
manualFailing.manualInterventionsTotal = 2
manualFailing.manualInterventionsSuccessful = 0
manualFailing.screenTimeConnected = true
manualFailing.hasSelection = true
check(FrictionLadder.chooseLevel(env: manualFailing, distractorKnown: true) == 2, "manual failing + opted in → session protection")

var earlyExits = EnvironmentEvidence()
earlyExits.protectedSessionsCompleted = 2
earlyExits.protectionEarlyExits = 2
check(FrictionLadder.chooseLevel(env: earlyExits, distractorKnown: true) == 1, "repeated early exits → reduce to manual")

var comfortable = EnvironmentEvidence()
comfortable.screenTimeConnected = true
comfortable.hasSelection = true
comfortable.manualInterventionsTotal = 3
comfortable.manualInterventionsSuccessful = 0
comfortable.protectedSessionsCompleted = 5
comfortable.protectionEarlyExits = 0
check(FrictionLadder.chooseLevel(env: comfortable, distractorKnown: true) == 3, "comfortable protected sessions → recurring window")

var threshold = EnvironmentEvidence()
threshold.thresholdApproved = true
threshold.evidenceCount = 3
check(FrictionLadder.chooseLevel(env: threshold, distractorKnown: true) == 4, "approved threshold + evidence → threshold rule")

// MARK: - Migration (new optional fields absent in old payloads)

let oldProfileJSON = """
{"primaryGoal":{"unknown":{}},"goals":{"unknown":{}},"distractors":{"unknown":{}},"reflex":{"unknown":{}},"attentionStability":{"unknown":{}},"returnAfterDistraction":{"unknown":{}},"recall":{"unknown":{}},"depth":{"unknown":{}},"environment":{"unknown":{}},"flowConditions":{"unknown":{}},"energyContext":{"unknown":{}}}
""".data(using: .utf8)!
let migratedProfile = try? JSONDecoder().decode(AttentionProfile.self, from: oldProfileJSON)
check(migratedProfile?.environmentEvidence == nil, "old profile decodes with environmentEvidence = nil")

let oldSessionJSON = """
{"id":"00000000-0000-0000-0000-000000000001","day":1,"date":0,"mode":"observe","targetMinutes":15,"actualMinutes":14,"completed":true,"endedEarly":false,"firstDistraction":null,"switches":null,"difficulty":null,"energy":null,"environmentActionDone":null,"firstSwitchMinute":null}
""".data(using: .utf8)!
let migratedSession = try? JSONDecoder().decode(SessionRecord.self, from: oldSessionJSON)
check(migratedSession?.environment == nil, "old session decodes with environment = nil")

// MARK: - Evidence update

var evidence: EnvironmentEvidence?
let protectedRecord = SessionRecord(
    day: 2, date: Date(), mode: .stay, targetMinutes: 20, actualMinutes: 19,
    completed: true, endedEarly: false, firstDistraction: "none", switches: 2,
    difficulty: 2, energy: 4, environmentActionDone: true, firstSwitchMinute: nil,
    environment: EnvironmentSnapshot(
        protectionOffered: true, protectionAccepted: true, protectionActivated: true,
        protectionEndedEarly: false, protectedSelectionID: UUID(), manualIntervention: nil,
        phoneLocationSelfReport: nil, thresholdEvents: [], environmentCondition: "protected",
        startedEasierSelfReport: true, protectionExitReason: nil
    )
)
let obs = EnvironmentObservationFactory.observation(from: protectedRecord)!
check(obs.condition == .protected, "observation condition mapped from snapshot")
EnvironmentUpdater.apply(session: protectedRecord, observation: obs, to: &evidence)
check(evidence?.evidenceCount == 1, "evidence count increments")
check(evidence?.protectedSessionsCompleted == 1, "protected session recorded")
check(evidence?.confidence == 1.0 / 6.0, "confidence derives from count")

let earlyRecord = SessionRecord(
    day: 3, date: Date(), mode: .stay, targetMinutes: 20, actualMinutes: 6,
    completed: true, endedEarly: true, firstDistraction: "social", switches: 8,
    difficulty: 5, energy: nil, environmentActionDone: nil, firstSwitchMinute: 1,
    environment: EnvironmentSnapshot(
        protectionOffered: true, protectionAccepted: true, protectionActivated: true,
        protectionEndedEarly: true, protectedSelectionID: UUID(), manualIntervention: nil,
        phoneLocationSelfReport: nil, thresholdEvents: [], environmentCondition: "protected",
        startedEasierSelfReport: false, protectionExitReason: "restrictive"
    )
)
let obs2 = EnvironmentObservationFactory.observation(from: earlyRecord)!
EnvironmentUpdater.apply(session: earlyRecord, observation: obs2, to: &evidence)
check(evidence?.protectionEarlyExits == 1, "early exit recorded")

var deviceFacts: EnvironmentEvidence?
EnvironmentUpdater.updateDeviceFacts(screenTimeConnected: true, hasSelection: true, hasApprovedWindows: true, thresholdApproved: false, evidence: &deviceFacts)
check(deviceFacts?.screenTimeConnected == true && deviceFacts?.hasSelection == true, "device facts update")

print(failures == 0 ? "ALL TESTS PASSED" : "\(failures) TEST(S) FAILED")
exit(failures == 0 ? 0 : 1)
    }
}
