import { Vector3 } from "@babylonjs/core";
import type { EnemyDebugState } from "../ai/EnemyAgent";
import type { ExtractionState } from "./ExtractionController";
import type { HeavyCargoViewState } from "./HeavyCargoManager";
import type { MissionFamilyId } from "./MissionDefinitions";
import type { ObjectiveState } from "./ObjectiveDirector";
import type { POIObjectiveState } from "./POIObjectiveManager";
import type { RaidTimerState } from "./RaidTimer";

export type RaidPressurePhase = "quiet" | "contact" | "escalating" | "critical" | "extraction";

export type RaidPressureState = Readonly<{
  phase: RaidPressurePhase;
  threatLevel: number;
  pressureLabel: string;
  reason: string;
  objectivePressure: boolean;
  heavyCargoPressure: boolean;
  extractionPressure: boolean;
  objectiveZoneContested: boolean;
  nearbyEnemyCount: number;
  activePatrolCount: number;
  familyHint: string;
  contactFeed: string[];
}>;

export type RaidPressureInput = Readonly<{
  timer: RaidTimerState;
  familyId: MissionFamilyId;
  objective: ObjectiveState;
  poiObjectives: POIObjectiveState;
  heavyCargo: HeavyCargoViewState;
  extraction: ExtractionState;
  playerPosition: Vector3;
  enemies: readonly EnemyDebugState[];
  revealActive: boolean;
  missionComplete: boolean;
}>;

const emptyPressure: RaidPressureState = {
  phase: "quiet",
  threatLevel: 1,
  pressureLabel: "Quiet Survey",
  reason: "Initial approach. Keep the route short.",
  objectivePressure: false,
  heavyCargoPressure: false,
  extractionPressure: false,
  objectiveZoneContested: false,
  nearbyEnemyCount: 0,
  activePatrolCount: 0,
  familyHint: "Solo viable. Move deliberately and choose fights.",
  contactFeed: [],
};

export function buildRaidPressureState(input: RaidPressureInput): RaidPressureState {
  const timeRatio = input.timer.totalDuration > 0
    ? input.timer.timeRemaining / input.timer.totalDuration
    : 1;
  const livingEnemies = input.enemies.filter((enemy) => enemy.state !== "dead" && enemy.health > 0);
  const nearbyEnemies = livingEnemies.filter((enemy) => horizontalDistance(enemy.position, input.playerPosition) <= 42);
  const objectiveDistance = horizontalDistance(input.objective.targetPosition, input.playerPosition);
  const nearestPoi = input.poiObjectives.nearest;
  const poiDistance = nearestPoi?.distance ?? Number.POSITIVE_INFINITY;
  const objectivePressure = !input.objective.completed && (objectiveDistance <= 52 || poiDistance <= 46 || (nearestPoi?.progress ?? 0) > 0);
  const heavyCargoPressure = input.heavyCargo.status === "available" ||
    input.heavyCargo.status === "dropped" ||
    input.heavyCargo.status === "carried" ||
    input.heavyCargo.carriedByLocalPlayer;
  const extractionPressure = input.extraction.extracting || input.extraction.insideZone || input.missionComplete || input.timer.extractionUnlocked;
  const objectiveZoneContested = objectivePressure && nearbyEnemies.length > 0;
  const activePatrolCount = livingEnemies.filter((enemy) => enemy.state === "patrol" || enemy.state === "search" || enemy.state === "alert").length;
  const pressureScore =
    (timeRatio <= 0.7 ? 1 : 0) +
    (timeRatio <= 0.4 ? 1 : 0) +
    (timeRatio <= 0.15 ? 2 : 0) +
    (nearbyEnemies.length >= 1 ? 1 : 0) +
    (nearbyEnemies.length >= 3 ? 1 : 0) +
    (objectivePressure ? 1 : 0) +
    (heavyCargoPressure ? 2 : 0) +
    (extractionPressure ? 1 : 0) +
    (input.revealActive ? 1 : 0);
  const phase = selectPressurePhase(timeRatio, pressureScore, nearbyEnemies.length, objectivePressure, heavyCargoPressure, extractionPressure);
  const reason = selectReason(phase, {
    objectivePressure,
    heavyCargoPressure,
    extractionPressure,
    objectiveZoneContested,
    revealActive: input.revealActive,
    timeRatio,
  });

  return {
    ...emptyPressure,
    phase,
    threatLevel: Math.max(1, Math.min(5, pressureScore + 1)),
    pressureLabel: pressureLabelForPhase(phase),
    reason,
    objectivePressure,
    heavyCargoPressure,
    extractionPressure,
    objectiveZoneContested,
    nearbyEnemyCount: nearbyEnemies.length,
    activePatrolCount,
    familyHint: familyPressureHint(input.familyId, phase),
    contactFeed: buildContactFeed(nearbyEnemies, objectiveZoneContested, heavyCargoPressure, extractionPressure, input.revealActive),
  };
}

function selectPressurePhase(
  timeRatio: number,
  pressureScore: number,
  nearbyEnemyCount: number,
  objectivePressure: boolean,
  heavyCargoPressure: boolean,
  extractionPressure: boolean,
): RaidPressurePhase {
  if (extractionPressure && (timeRatio <= 0.4 || pressureScore >= 4)) return "extraction";
  if (timeRatio <= 0.15 || heavyCargoPressure || pressureScore >= 5) return "critical";
  if (timeRatio <= 0.4 || objectivePressure || pressureScore >= 3) return "escalating";
  if (timeRatio <= 0.7 || nearbyEnemyCount > 0) return "contact";
  return "quiet";
}

function pressureLabelForPhase(phase: RaidPressurePhase): string {
  if (phase === "quiet") return "Quiet Survey";
  if (phase === "contact") return "Patrol Contact";
  if (phase === "escalating") return "Crater Pressure Rising";
  if (phase === "critical") return "Critical Pressure";
  return "Extraction Pressure";
}

function selectReason(
  phase: RaidPressurePhase,
  flags: {
    objectivePressure: boolean;
    heavyCargoPressure: boolean;
    extractionPressure: boolean;
    objectiveZoneContested: boolean;
    revealActive: boolean;
    timeRatio: number;
  },
): string {
  if (flags.objectiveZoneContested) return "Objective zone contested.";
  if (flags.heavyCargoPressure) return "Heavy cargo exposed. Patrols converging.";
  if (flags.extractionPressure) return "Extraction route active. Late patrols crossing return paths.";
  if (flags.revealActive) return "Revealed contacts near the route.";
  if (flags.objectivePressure) return "Objective area drawing patrol attention.";
  if (flags.timeRatio <= 0.15) return "Extraction window unstable.";
  if (flags.timeRatio <= 0.4) return "Patrol activity increasing.";
  if (phase === "contact") return "Local patrols detected.";
  return "Initial approach. Keep the route short.";
}

function familyPressureHint(familyId: MissionFamilyId, phase: RaidPressurePhase): string {
  const urgency = phase === "critical" || phase === "extraction" ? " Move toward extraction." : "";
  if (familyId === "heavy-cargo-retrieval") return `Cargo routes draw attention. Secure the carrier before looting wide.${urgency}`;
  if (familyId === "signal-restore") return `Device work may pull patrols. Hold perimeter briefly, then move.${urgency}`;
  if (familyId === "lumen-survey") return `Revealed signatures are awareness, not a requirement. Avoid chasing every contact.${urgency}`;
  if (familyId === "salvage-recovery") return `Caches are safer after the local objective resolves. Do not overstay.${urgency}`;
  if (familyId === "defense-holdout") return `Perimeter pressure is expected. Reset angles between waves.${urgency}`;
  if (familyId === "sabotage-subterfuge") return `Detection raises response pressure. Quiet routes still matter.${urgency}`;
  if (familyId === "evidence-lore-recovery") return `Optional evidence is risk-weighted. Preserve survival first.${urgency}`;
  return `Route instability is the mission. Keep extraction options visible.${urgency}`;
}

function buildContactFeed(
  nearbyEnemies: readonly EnemyDebugState[],
  objectiveZoneContested: boolean,
  heavyCargoPressure: boolean,
  extractionPressure: boolean,
  revealActive: boolean,
): string[] {
  const feed: string[] = [];
  if (objectiveZoneContested) feed.push("Objective guard contact");
  if (heavyCargoPressure) feed.push("Cargo signature exposed");
  if (extractionPressure) feed.push("Extraction route pressure");
  if (revealActive) feed.push("Lumen signatures revealed");

  const eliteCount = nearbyEnemies.filter((enemy) => enemy.elite || enemy.type === "elite").length;
  const guards = nearbyEnemies.filter((enemy) => enemy.type === "guard" || enemy.type === "spitter").length;
  const patrols = Math.max(0, nearbyEnemies.length - eliteCount - guards);
  if (eliteCount > 0) feed.push(`${eliteCount} elite threat${eliteCount === 1 ? "" : "s"}`);
  if (guards > 0) feed.push(`${guards} objective guard${guards === 1 ? "" : "s"}`);
  if (patrols > 0) feed.push(`${patrols} patrol contact${patrols === 1 ? "" : "s"}`);

  return feed.slice(0, 4);
}

function horizontalDistance(a: Vector3, b: Vector3): number {
  return Math.hypot(a.x - b.x, a.z - b.z);
}
