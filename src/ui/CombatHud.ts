import { PlaceholderWeaponAudio } from "../audio/PlaceholderWeaponAudio";
import type { CampaignPresentation } from "../campaign/CampaignProgress";
import type { EnemyDebugState } from "../ai/EnemyAgent";
import type { ShoulderSide } from "../camera/ThirdPersonCameraRig";
import type { ActiveContractState } from "../contracts/ContractManager";
import type { CoverState } from "../cover/CoverController";
import type { InputSnapshot } from "../input/InputController";
import type { PlayerHealthSnapshot } from "../combat/PlayerHealth";
import type { PlayerStatusSnapshot } from "../combat/PlayerStatus";
import type { DynamicEventState } from "../raid/DynamicEventDirector";
import type { EnvironmentState } from "../environment/EnvironmentManager";
import type { ExtractionState } from "../raid/ExtractionController";
import type { HeavyCargoViewState } from "../raid/HeavyCargoManager";
import type { ObjectiveState } from "../raid/ObjectiveDirector";
import { getItemDefinition, getItemUseProfile } from "../raid/ItemDefinitions";
import type { LootContainerView } from "../raid/LootDirector";
import type { MissionPresentation } from "../raid/MissionPresentation";
import type { POIObjectiveState, POIObjectiveView } from "../raid/POIObjectiveManager";
import type { InventorySlot, LootEvent, LootStack } from "../raid/RaidInventory";
import type { RaidPressureState } from "../raid/RaidPressure";
import type { RaidResultPresentation, RaidResultItem } from "../raid/RaidResultPresentation";
import type { RaidResultSummary } from "../raid/RaidResultSummary";
import type { RaidTimerState } from "../raid/RaidTimer";
import type { SettingsManager } from "../settings/SettingsManager";
import type { OrbitalDeploymentSequenceState } from "../ship/OrbitalDeploymentSequence";
import type { ShipState } from "../ship/ShipManager";
import type { NoiseSystemState } from "../stealth/NoiseSystem";
import type { TacticalToolState } from "../tactical/TacticalToolManager";
import { colorToCss, themeConfig } from "../theme/ThemeConfig";
import type { TraversalState } from "../traversal/TraversalController";
import type { VisibilityToolState } from "../visibility/VisibilityToolManager";
import type { WeaponState } from "../weapons/WeaponController";
import {
  weaponDefinitions,
  weaponIdFromLootType,
  type WeaponId,
} from "../weapons/WeaponDefinitions";
import type { MotorState } from "../world/PlayerMotor";

export type DamageNumber = Readonly<{
  amount: number;
  headshot: boolean;
  hitZone: "body" | "head" | "legs";
}>;

export type RaidOutcome = "active" | "extracted" | "lost";
export type RaidScreen =
  | "menu"
  | "stash"
  | "loadout"
  | "inspect"
  | "workbench"
  | "settings"
  | "raid"
  | "raid-select"
  | "ship-systems"
  | "class-assignment"
  | "skill-matrix"
  | "arsenal";
export type HudNavigationMarker = Readonly<{
  id: string;
  label: string;
  distance: number;
  kind: "ship" | "contract" | "objective" | "extraction" | "danger" | "poi";
}>;
export type TacticalMapPoiMarker = Readonly<{
  id: string;
  name: string;
  x: number;
  z: number;
  danger: string;
  lootProfile: string;
  distance: number;
  activeContract: boolean;
  highRisk: boolean;
}>;
export type TacticalMapPointMarker = Readonly<{
  id: string;
  label: string;
  x: number;
  z: number;
  kind: "ship" | "cargo" | "launch" | "objective" | "poiObjective" | "extraction" | "contract" | "breadcrumb" | "signal";
  active?: boolean;
  selected?: boolean;
  tracked?: boolean;
  trackable?: boolean;
  distance?: number;
  remainingSeconds?: number;
  source?: "essence-flare";
  status?: "live" | "last-known";
}>;
export type TacticalNavTarget = Readonly<{
  id: string;
  label: string;
  type: "objective" | "poi" | "extraction" | "cache" | "reveal-signal";
  worldPosition: { x: number; y: number; z: number };
  selectedAt: number;
  source: "contract" | "map" | "reveal" | "extraction" | "system";
  status?: string;
  remainingSeconds?: number;
}>;
export type TacticalRouteHint = Readonly<{
  id: string;
  label: string;
  type: TacticalNavTarget["type"];
  source: TacticalNavTarget["source"];
  status: string;
  distance: number;
  remainingSeconds?: number;
}>;
export type TacticalRouteFeedback = Readonly<{
  label: string;
  status: "route-cleared" | "signal-lost" | "target-unavailable" | "objective-complete";
  remainingSeconds: number;
}>;
export type TacticalMapData = Readonly<{
  open: boolean;
  mapSize: number;
  player: { x: number; z: number; yaw: number };
  selectedPoiId: string | null;
  selectedTargetId: string | null;
  trackedTarget: TacticalRouteHint | null;
  mission: MissionPresentation;
  pois: TacticalMapPoiMarker[];
  points: TacticalMapPointMarker[];
}>;

export type RevealSignalHudState = Readonly<{
  active: boolean;
  count: number;
  nearestDistance: number | null;
  nearestLabel: string | null;
  remainingSeconds: number;
  surveyorAffinity: boolean;
  contextHint: string | null;
  lastResult: string;
}>;

export type RevealAffinityHudState = Readonly<{
  surveyor: boolean;
  radius: number;
  durationSeconds: number;
  surveyorRadius: number;
  surveyorDurationSeconds: number;
  baseRadius: number;
  baseDurationSeconds: number;
}>;

export type RaidHudState = Readonly<{
  screen: RaidScreen;
  outcome: RaidOutcome;
  inventoryItems: LootStack[];
  inventorySlotsList: InventorySlot[];
  outcomeItems: LootStack[];
  lootLostItems: LootStack[];
  resultSummary: RaidResultSummary;
  resultPresentation: RaidResultPresentation | null;
  campaign: CampaignPresentation;
  armorDurability: number;
  inventorySlots: number;
  inventoryCapacity: number;
  raidBagOpen: boolean;
  selectedInventorySlotId: string | null;
  equippedPrimaryWeaponId: WeaponId | null;
  equippedSidearmWeaponId: WeaponId;
  selectedLootIndex: number;
  lootContainer: LootContainerView | null;
  inventoryWarning: string | null;
  extraction: ExtractionState;
  raidTimer: RaidTimerState;
  dynamicEvent: DynamicEventState;
  objective: ObjectiveState;
  poiObjectives: POIObjectiveState;
  activeContract: ActiveContractState | null;
  oxygenPercent: number;
  oxygenState: "normal" | "half" | "low" | "critical" | "depleted";
  playerStatus: PlayerStatusSnapshot;
  poiName: string | null;
  cover: CoverState;
  environment: EnvironmentState;
  visibilityTools: VisibilityToolState;
  tacticalTool: TacticalToolState;
  noise: NoiseSystemState;
  traversal: TraversalState;
  shoulderSide: ShoulderSide;
  returnToHqProgress: number;
  ship: ShipState;
  shipInRange: boolean;
  shipPrompt: string;
  shipRepairPrompt: string;
  shipWarning: string;
  shipRepairChoices: string;
  shipModuleSummary: string;
  shipCargoItems: LootStack[];
  heavyCargo: HeavyCargoViewState;
  mission: MissionPresentation;
  pressure: RaidPressureState;
  landingSequence: OrbitalDeploymentSequenceState;
  navigationMarkers: HudNavigationMarker[];
  routeHint: TacticalRouteHint | null;
  routeFeedback: TacticalRouteFeedback | null;
  tacticalMap: TacticalMapData;
  revealSignal: RevealSignalHudState;
  revealAffinity: RevealAffinityHudState;
}>;

export class CombatHud {
  private readonly root = document.createElement("div");
  private readonly crosshair = document.createElement("div");
  private readonly ammo = document.createElement("div");
  private readonly status = document.createElement("div");
  private readonly weaponDurability = document.createElement("div");
  private readonly health = document.createElement("div");
  private readonly oxygen = document.createElement("div");
  private readonly mental = document.createElement("div");
  private readonly controllerStatus = document.createElement("div");
  private readonly controllerDebug = document.createElement("div");
  private readonly aiDebug = document.createElement("div");
  private readonly damageFlash = document.createElement("div");
  private readonly damageDirection = document.createElement("div");
  private readonly lowHealthVignette = document.createElement("div");
  private readonly movementDebug = document.createElement("div");
  private readonly inventory = document.createElement("div");
  private readonly notification = document.createElement("div");
  private readonly extraction = document.createElement("div");
  private readonly raidTimer = document.createElement("div");
  private readonly eventBanner = document.createElement("div");
  private readonly condition = document.createElement("div");
  private readonly navigation = document.createElement("div");
  private readonly routeHint = document.createElement("div");
  private readonly revealSignal = document.createElement("div");
  private readonly landingSequence = document.createElement("div");
  private readonly tacticalMap = document.createElement("div");
  private readonly visibilityTools = document.createElement("div");
  private readonly stealth = document.createElement("div");
  private readonly ship = document.createElement("div");
  private readonly shoulder = document.createElement("div");
  private readonly objective = document.createElement("div");
  private readonly poiObjectives = document.createElement("div");
  private readonly contractTracker = document.createElement("div");
  private readonly poi = document.createElement("div");
  private readonly coverPrompt = document.createElement("div");
  private readonly traversalPrompt = document.createElement("div");
  private readonly killFeed = document.createElement("div");
  private readonly outcome = document.createElement("div");
  private readonly sniperScope = document.createElement("div");
  private readonly hitMarker = document.createElement("div");
  private readonly hitFlash = document.createElement("div");
  private readonly audio = new PlaceholderWeaponAudio();
  private hitMarkerTimer = 0;
  private hitFlashTimer = 0;
  private notificationTimer = 0;
  private previousDamageActive = false;
  private previousAlive = true;
  private previousExtracting = false;
  private previousCompleted = false;
  private killFeedEntries: Array<{ text: string; ttl: number; hostile: boolean }> = [];
  private raidActionHandler: ((action: string) => void) | null = null;
  private previousInventoryMarkup = "";
  private previousOutcomeMarkup = "";
  private previousRaidResultDisplayKey = "";
  private suppressNextRaidActionClick = false;
  private suppressNextLootActionClick = false;

  public constructor(private readonly settingsManager: SettingsManager) {
    this.root.className = "combat-hud";
    this.root.addEventListener("mousedown", this.stopInteractiveHudEvent);
    this.root.addEventListener("mouseup", this.stopInteractiveHudEvent);
    this.root.addEventListener("pointerup", this.handleInteractivePointerUp);
    this.root.addEventListener("click", this.handleHudClick);
    this.root.addEventListener("wheel", this.stopInteractiveHudEvent, { passive: true });
    this.crosshair.className = "crosshair";
    this.hitMarker.className = "hit-marker";
    this.hitFlash.className = "hit-flash";
    this.ammo.className = "ammo";
    this.status.className = "weapon-status";
    this.weaponDurability.className = "weapon-durability";
    this.health.className = "player-health";
    this.oxygen.className = "oxygen-status";
    this.mental.className = "mental-status";
    this.controllerStatus.className = "controller-status";
    this.controllerDebug.className = "controller-debug";
    this.aiDebug.className = "ai-debug";
    this.damageFlash.className = "damage-flash";
    this.damageDirection.className = "damage-direction";
    this.lowHealthVignette.className = "low-health-vignette";
    this.movementDebug.className = "movement-debug";
    this.inventory.className = "raid-inventory";
    this.notification.className = "loot-notification";
    this.extraction.className = "extraction-progress";
    this.raidTimer.className = "raid-timer";
    this.eventBanner.className = "event-banner";
    this.condition.className = "condition-chip";
    this.navigation.className = "navigation-markers";
    this.routeHint.className = "route-hint";
    this.revealSignal.className = "reveal-signal-hud";
    this.landingSequence.className = "landing-sequence-hud";
    this.tacticalMap.className = "tactical-map-overlay";
    this.visibilityTools.className = "visibility-tools";
    this.stealth.className = "stealth-status";
    this.ship.className = "ship-status";
    this.shoulder.className = "shoulder-status";
    this.objective.className = "objective-panel";
    this.poiObjectives.className = "poi-objectives-panel";
    this.contractTracker.className = "contract-tracker-panel";
    this.poi.className = "poi-banner";
    this.coverPrompt.className = "cover-prompt";
    this.traversalPrompt.className = "traversal-prompt";
    this.killFeed.className = "kill-feed";
    this.outcome.className = "raid-outcome";
    this.outcome.addEventListener("pointerup", this.handleOutcomePointerUp);
    this.sniperScope.className = "sniper-scope";

    for (let i = 0; i < 4; i += 1) {
      this.crosshair.append(document.createElement("span"));
    }

    this.root.append(
      this.crosshair,
      this.hitMarker,
      this.hitFlash,
      this.damageFlash,
      this.damageDirection,
      this.lowHealthVignette,
      this.ammo,
      this.status,
      this.weaponDurability,
      this.health,
      this.oxygen,
      this.mental,
      this.controllerStatus,
      this.controllerDebug,
      this.aiDebug,
      this.movementDebug,
      this.inventory,
      this.notification,
      this.extraction,
      this.raidTimer,
      this.eventBanner,
      this.condition,
      this.navigation,
      this.routeHint,
      this.revealSignal,
      this.landingSequence,
      this.tacticalMap,
      this.visibilityTools,
      this.stealth,
      this.ship,
      this.shoulder,
      this.objective,
      this.poiObjectives,
      this.contractTracker,
      this.poi,
      this.coverPrompt,
      this.traversalPrompt,
      this.killFeed,
      this.outcome,
      this.sniperScope,
    );
    document.body.append(this.root);
  }

  private readonly stopInteractiveHudEvent = (event: Event): void => {
    const target = event.target instanceof HTMLElement
      ? event.target.closest<HTMLElement>(".raid-inventory, .loot-container-panel, .raid-outcome.active, .tactical-map-overlay.active, [data-raid-action], [data-loot-action]")
      : null;

    if (target) {
      event.stopPropagation();
    }
  };

  public setRaidActionHandler(handler: (action: string) => void): void {
    this.raidActionHandler = handler;
  }

  public update(
    dt: number,
    input: InputSnapshot,
    weapon: WeaponState,
    motor: MotorState,
    playerHealth: PlayerHealthSnapshot,
    enemies: EnemyDebugState[],
    raid: RaidHudState,
  ): void {
    const moving = input.moveX !== 0 || input.moveZ !== 0;
    const sprinting = input.sprintHeld && input.moveZ > 0 && !input.adsHeld && !input.crouchHeld;
    const recoilBloom = weapon.recoilBloom * (input.adsHeld ? 2 : 6);
    const showRaidHud = raid.screen === "raid";
    const landingActive = showRaidHud && raid.landingSequence.active;
    const settings = this.settingsManager.snapshot;

    this.crosshair.style.setProperty("--crosshair-bloom", `${recoilBloom}px`);
    this.crosshair.style.opacity = String(settings.gameplay.crosshairOpacity);
    this.crosshair.classList.toggle("hidden", landingActive || !showRaidHud);
    this.crosshair.classList.toggle("moving", moving);
    this.crosshair.classList.toggle("sprinting", sprinting);
    this.crosshair.classList.toggle("ads", input.adsHeld);
    this.crosshair.classList.toggle("reload", weapon.reloading);
    const sniperScoped = showRaidHud &&
      raid.outcome === "active" &&
      playerHealth.alive &&
      input.adsHeld &&
      weapon.scoped;
    this.crosshair.classList.toggle("scoped", sniperScoped);
    this.sniperScope.classList.toggle("active", sniperScoped);

    this.ammo.textContent = `${weapon.ammoInMagazine} / ${weapon.reserveAmmo}`;
    this.ammo.classList.toggle("hidden", landingActive || !showRaidHud);
    this.ammo.classList.toggle("low", weapon.ammoInMagazine > 0 && weapon.ammoInMagazine <= Math.max(3, Math.ceil((weapon.ammoInMagazine + weapon.reserveAmmo) * 0.06)));
    this.ammo.classList.toggle("empty", weapon.ammoInMagazine === 0 && !weapon.reloading);
    this.ammo.classList.toggle("reload", weapon.reloading);
    this.health.textContent = playerHealth.alive
      ? `Health ${Math.ceil(playerHealth.current)} / ${playerHealth.max}`
      : "Downed - regrouping";
    this.controllerStatus.textContent = input.controllerConnected
      ? `Controller connected${input.controllerName ? `: ${this.formatControllerName(input.controllerName)}` : ""}`
      : "Keyboard / mouse";
    this.controllerStatus.classList.toggle("connected", input.controllerConnected);
    this.controllerDebug.innerHTML = this.formatControllerDebug(input);
    this.controllerDebug.classList.toggle("active", input.controllerConnected);
    this.status.textContent = this.formatWeaponStatus(weapon);
    this.status.classList.toggle("hidden", landingActive || !showRaidHud);
    this.weaponDurability.innerHTML = this.formatWeaponDurability(weapon);
    this.weaponDurability.classList.toggle("warning", weapon.jamWarning);
    this.weaponDurability.classList.toggle("jammed", weapon.jammed);
    this.weaponDurability.classList.toggle("hidden", landingActive || !showRaidHud);
    this.movementDebug.textContent = `Hop ${motor.consecutiveHopCount} | Momentum ${motor.bunnyhopMomentumMultiplier.toFixed(2)}x | Speed ${motor.horizontalSpeed.toFixed(1)}`;
    this.movementDebug.classList.toggle("hidden", landingActive || !showRaidHud);
    this.aiDebug.textContent = enemies
      .slice(0, 6)
      .map((enemy) => {
        const marker = enemy.elite ? "ELITE " : "";
        const cover = enemy.coverTarget ? " cover" : "";
        const faction = themeConfig.enemyFactionNames[enemy.type];
        return `${faction}: ${marker}${enemy.role.toUpperCase()} ${enemy.state.toUpperCase()} ${enemy.tactic}${cover} ${Math.ceil(enemy.health)}hp`;
      })
      .concat(enemies.length > 6 ? [`+${enemies.length - 6} contacts bucketed`] : [])
      .join("\n");
    this.aiDebug.classList.toggle("hidden", landingActive || !showRaidHud);
    this.damageFlash.classList.toggle("active", playerHealth.recentDamage);
    this.damageFlash.classList.toggle("dead", !playerHealth.alive);
    this.damageDirection.classList.toggle("active", playerHealth.recentDamage && playerHealth.recentDamageAngle !== null);
    this.damageDirection.style.transform = `translate(-50%, -50%) rotate(${playerHealth.recentDamageAngle ?? 0}rad)`;
    this.lowHealthVignette.classList.toggle("active", showRaidHud && playerHealth.lowHealth && playerHealth.alive);
    this.health.classList.toggle("low", playerHealth.lowHealth);
    this.health.textContent += raid.armorDurability <= 20 ? " | ARMOR BREAK" : "";
    this.health.classList.toggle("armor-break", raid.armorDurability <= 20);
    this.health.classList.toggle("hidden", landingActive || !showRaidHud);
    this.controllerStatus.classList.toggle("hidden", landingActive || !showRaidHud);
    this.oxygen.innerHTML = this.formatOxygen(raid.oxygenPercent);
    this.oxygen.className = `oxygen-status ${raid.oxygenState}`;
    this.oxygen.classList.toggle("hidden", !showRaidHud || landingActive);
    this.mental.innerHTML = this.formatMentalStatus(raid.playerStatus);
    this.mental.className = `mental-status ${raid.playerStatus.mentalState}${raid.playerStatus.lunarInfection ? " infected" : ""}`;
    this.mental.classList.toggle("hidden", !showRaidHud || landingActive);
    this.playStateAudio(playerHealth, raid.extraction, raid.outcome);
    this.notificationTimer = Math.max(0, this.notificationTimer - dt);
    this.notification.classList.toggle("active", this.notificationTimer > 0);
    this.updateInventoryMarkup(raid);
    this.inventory.classList.toggle("hidden", !showRaidHud || (!raid.raidBagOpen && raid.lootContainer === null));
    this.extraction.innerHTML = this.formatExtraction(raid.extraction);
    this.raidTimer.innerHTML = this.formatRaidTimer(raid.raidTimer);
    this.raidTimer.classList.toggle("hidden", !showRaidHud);
    this.raidTimer.classList.toggle("warning", raid.raidTimer.finalWarning);
    this.eventBanner.innerHTML = this.formatDynamicEvent(raid.dynamicEvent);
    this.eventBanner.classList.toggle("active", showRaidHud && this.hasDynamicEventHud(raid.dynamicEvent));
    this.eventBanner.classList.toggle("power", raid.dynamicEvent.powerOutageActive);
    this.condition.innerHTML = this.formatEnvironment(raid.environment);
    this.condition.classList.toggle("hidden", !showRaidHud || landingActive);
    this.navigation.innerHTML = this.formatNavigationMarkers(raid.navigationMarkers);
    this.navigation.classList.toggle("hidden", !showRaidHud || landingActive || raid.navigationMarkers.length === 0);
    this.routeHint.innerHTML = this.formatRouteHint(raid.routeHint, raid.routeFeedback);
    this.routeHint.classList.toggle("hidden", !showRaidHud || landingActive || (raid.routeHint === null && raid.routeFeedback === null));
    this.routeHint.classList.toggle("route-feedback", raid.routeHint === null && raid.routeFeedback !== null);
    this.revealSignal.innerHTML = this.formatRevealSignal(raid.revealSignal);
    this.revealSignal.classList.toggle("hidden", !showRaidHud || landingActive || !raid.revealSignal.active);
    this.revealSignal.classList.toggle("empty", raid.revealSignal.active && raid.revealSignal.count === 0);
    this.landingSequence.innerHTML = this.formatLandingSequence(raid.landingSequence);
    this.landingSequence.classList.toggle("active", landingActive);
    this.tacticalMap.innerHTML = this.formatTacticalMap(raid.tacticalMap, raid.revealAffinity);
    this.tacticalMap.classList.toggle("active", showRaidHud && !landingActive && raid.tacticalMap.open);
    this.visibilityTools.innerHTML = this.formatVisibilityTools(raid.visibilityTools, raid.tacticalTool);
    this.visibilityTools.classList.toggle("hidden", !showRaidHud || landingActive);
    this.stealth.innerHTML = this.formatStealth(raid.noise);
    this.stealth.classList.toggle("hidden", !showRaidHud || landingActive);
    this.stealth.classList.toggle("quiet", raid.noise.quiet);
    this.stealth.classList.toggle("loud", raid.noise.stealthLabel === "Loud");
    this.ship.innerHTML = this.formatShipStatus(
      raid.ship,
      raid.shipPrompt,
      raid.shipRepairPrompt,
      raid.shipWarning,
      raid.shipRepairChoices,
      raid.shipModuleSummary,
      raid.shipCargoItems,
    );
    this.ship.classList.toggle("hidden", !showRaidHud || landingActive || !raid.shipInRange);
    this.ship.classList.toggle("in-range", raid.shipInRange);
    this.ship.classList.toggle("readiness-offline", raid.ship.readiness === "offline");
    this.ship.classList.toggle("readiness-warming", raid.ship.readiness === "warming");
    this.ship.classList.toggle("readiness-ready", raid.ship.readiness === "ready");
    this.ship.classList.toggle("readiness-compromised", raid.ship.readiness === "compromised");
    this.shoulder.textContent = `Shoulder: ${raid.shoulderSide === "right" ? "R" : "L"}`;
    this.shoulder.classList.toggle("hidden", !showRaidHud || landingActive);
    this.objective.innerHTML = this.formatMissionObjective(raid.mission, raid.objective, raid.heavyCargo, raid.routeHint, raid.pressure);
    this.objective.classList.toggle("hidden", !showRaidHud || landingActive);
    this.poiObjectives.innerHTML = this.formatPoiObjectives(raid.poiObjectives);
    this.poiObjectives.classList.toggle("hidden", !showRaidHud || landingActive || !raid.poiObjectives.active);
    this.contractTracker.innerHTML = this.formatActiveContract(raid.activeContract, raid.poiObjectives);
    this.contractTracker.classList.toggle("hidden", !showRaidHud || landingActive || raid.activeContract === null);
    this.poi.textContent = raid.poiName ?? "";
    this.poi.classList.toggle("active", showRaidHud && !landingActive && raid.poiName !== null);
    this.coverPrompt.textContent = raid.cover.prompt;
    this.coverPrompt.classList.toggle(
      "active",
      showRaidHud && !landingActive && raid.outcome === "active" && (raid.cover.available || raid.cover.inCover),
    );
    this.coverPrompt.classList.toggle("in-cover", raid.cover.inCover);
    this.coverPrompt.classList.toggle("peeking", raid.cover.peek !== 0);
    this.traversalPrompt.textContent = raid.traversal.prompt;
    this.traversalPrompt.classList.toggle(
      "active",
      showRaidHud && !landingActive && raid.outcome === "active" && raid.traversal.prompt.length > 0,
    );
    this.traversalPrompt.classList.toggle("moving", raid.traversal.active);
    this.extraction.classList.toggle(
      "active",
      showRaidHud && !landingActive && raid.extraction.insideZone && raid.outcome === "active",
    );
    this.updateOutcomeMarkup(raid, playerHealth);
    this.outcome.classList.toggle("active", showRaidHud && (raid.outcome !== "active" || !playerHealth.alive));
    this.outcome.classList.toggle("lost", raid.outcome === "lost");
    this.updateKillFeed(dt);

    this.hitMarkerTimer = Math.max(0, this.hitMarkerTimer - dt);
    this.hitFlashTimer = Math.max(0, this.hitFlashTimer - dt);
    this.hitMarker.classList.toggle("active", this.hitMarkerTimer > 0);
    this.hitFlash.classList.toggle("active", this.hitFlashTimer > 0);
  }

  public showHitMarker(headshot: boolean): void {
    if (!this.settingsManager.snapshot.gameplay.hitMarkers) {
      return;
    }

    this.hitMarkerTimer = headshot ? 0.18 : 0.12;
    this.hitFlashTimer = headshot ? 0.12 : 0.08;
    this.hitMarker.classList.toggle("headshot", headshot);
    this.hitFlash.classList.toggle("headshot", headshot);
    this.audio.playHitMarker(headshot);
  }

  public showDamageNumber(event: DamageNumber): void {
    const element = document.createElement("div");
    element.className = `damage-number${event.headshot ? " headshot" : ""}`;
    element.textContent = `${event.headshot ? "HEAD " : event.hitZone === "legs" ? "LEG " : "BODY "}${event.amount}`;
    element.style.left = `${50 + (Math.random() - 0.5) * 5}%`;
    element.style.top = `${46 + (Math.random() - 0.5) * 5}%`;
    this.root.append(element);

    window.setTimeout(() => {
      element.remove();
    }, 650);
  }

  public showLootNotification(event: LootEvent | string): void {
    this.notificationTimer = 2.1;
    this.notification.textContent = typeof event === "string"
      ? event
      : `+${event.quantity} ${event.label}`;
  }

  public showKillFeed(text: string, hostile = false): void {
    this.killFeedEntries.unshift({ text, hostile, ttl: 5 });
    this.killFeedEntries = this.killFeedEntries.slice(0, 5);
  }

  public dispose(): void {
    this.root.remove();
  }

  private readonly handleHudClick = (event: MouseEvent): void => {
    const target = event.target instanceof HTMLElement
      ? event.target.closest<HTMLElement>("[data-raid-action], [data-loot-action]")
      : null;

    if (target?.dataset.raidAction) {
      if (this.suppressNextRaidActionClick) {
        this.suppressNextRaidActionClick = false;
        event.stopPropagation();
        return;
      }

      this.raidActionHandler?.(target.dataset.raidAction);
      event.stopPropagation();
      return;
    }

    if (target?.dataset.lootAction) {
      if (this.suppressNextLootActionClick) {
        this.suppressNextLootActionClick = false;
        event.stopPropagation();
        return;
      }

      this.dispatchLootAction(target);
      event.stopPropagation();
    }
  };

  private readonly handleInteractivePointerUp = (event: Event): void => {
    const target = event.target instanceof HTMLElement
      ? event.target.closest<HTMLElement>("[data-raid-action], [data-loot-action]")
      : null;

    if (target?.dataset.raidAction) {
      this.raidActionHandler?.(target.dataset.raidAction);
      this.suppressNextRaidActionClick = true;
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    if (target?.dataset.lootAction && this.isCloseLootAction(target.dataset.lootAction)) {
      this.dispatchLootAction(target);
      this.suppressNextLootActionClick = true;
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    this.stopInteractiveHudEvent(event);
  };

  private readonly handleOutcomePointerUp = (event: PointerEvent): void => {
    const target = event.target instanceof HTMLElement
      ? event.target.closest<HTMLElement>("[data-raid-action]")
      : null;

    if (!target?.dataset.raidAction) {
      return;
    }

    this.raidActionHandler?.(target.dataset.raidAction);
    this.suppressNextRaidActionClick = true;
    event.preventDefault();
    event.stopPropagation();
  };

  private dispatchLootAction(target: HTMLElement): void {
    const action = target.dataset.lootAction;
    const slotId = target.dataset.slotId;
    const containerId = target.dataset.containerId;
    const itemIndex = target.dataset.itemIndex;

    const payload = [
      action,
      slotId ? `slot:${slotId}` : "",
      containerId ? `container:${containerId}` : "",
      itemIndex !== undefined ? `index:${itemIndex}` : "",
    ].filter(Boolean).join("|");

    this.raidActionHandler?.(`loot:${payload}`);
  }

  private isCloseLootAction(action: string | undefined): boolean {
    return action === "close" || action === "close-bag";
  }

  private formatInventory(raid: RaidHudState): string {
    const slots = raid.inventorySlotsList.length > 0
      ? raid.inventorySlotsList.map((item) => this.formatInventorySlot(item, raid)).join("")
      : Array.from({ length: raid.inventoryCapacity }, (_, index) => `<div class="inventory-slot empty">${index + 1}</div>`).join("");
    const empties = Math.max(0, raid.inventoryCapacity - raid.inventorySlots);
    const emptySlots = Array.from({ length: empties }, () => `<div class="inventory-slot empty"></div>`).join("");
    const warning = raid.inventoryWarning ? `<em>${raid.inventoryWarning}</em>` : "";
    const freeSlots = Math.max(0, raid.inventoryCapacity - raid.inventorySlots);

    return `
      <strong>EVA Pack ${raid.inventorySlots}/${raid.inventoryCapacity}</strong>
      <span class="inventory-capacity">${freeSlots} free slot${freeSlots === 1 ? "" : "s"} | Tab close | X drop selected</span>
      <div class="inventory-equipped-strip">
        <span><small>PRIMARY</small>${raid.equippedPrimaryWeaponId ? weaponDefinitions[raid.equippedPrimaryWeaponId].name : "Empty"}</span>
        <span><small>SIDEARM</small>${weaponDefinitions[raid.equippedSidearmWeaponId].name}</span>
      </div>
      <button type="button" class="bag-close-button" data-loot-action="close-bag">Close EVA Pack</button>
      <div class="inventory-grid">${slots}${emptySlots}</div>
      ${this.formatInventorySelectedDetail(raid)}
      ${this.formatLootContainer(raid)}
      ${warning}
    `;
  }

  private updateInventoryMarkup(raid: RaidHudState): void {
    const markup = this.formatInventory(raid);

    if (markup === this.previousInventoryMarkup) {
      return;
    }

    const inventoryGridScrollTop = this.inventory.querySelector<HTMLElement>(".inventory-grid")?.scrollTop ?? 0;
    const lootPanelScrollTop = this.inventory.querySelector<HTMLElement>(".loot-container-panel")?.scrollTop ?? 0;

    this.inventory.innerHTML = markup;
    this.previousInventoryMarkup = markup;

    const inventoryGrid = this.inventory.querySelector<HTMLElement>(".inventory-grid");
    const lootPanel = this.inventory.querySelector<HTMLElement>(".loot-container-panel");

    if (inventoryGrid) {
      inventoryGrid.scrollTop = inventoryGridScrollTop;
    }

    if (lootPanel) {
      lootPanel.scrollTop = lootPanelScrollTop;
    }
  }

  private formatInventorySlot(item: InventorySlot, raid: RaidHudState): string {
    const definition = getItemDefinition(item.type);
    const color = colorToCss(themeConfig.rarityColors[definition.rarity]);
    const selected = item.id === raid.selectedInventorySlotId;
    const weaponActions = selected ? this.formatInventoryWeaponActions(item, raid) : "";
    const useProfile = getItemUseProfile(item.type);
    const useLabel = this.formatInventoryUseLabel(item.type);
    const useAction = useProfile.usableInRaid
      ? `<button type="button" data-loot-action="use" data-slot-id="${item.id}">${useLabel}</button>`
      : "";
    return `
      <div class="inventory-slot filled${selected ? " selected" : ""}" data-loot-action="select" data-slot-id="${item.id}" style="--rarity-color: ${color}">
        <span>${item.label}</span>
        <small>${item.quantity > 1 ? `x${item.quantity}` : `${item.slots} slot${item.slots > 1 ? "s" : ""}`} | ${definition.rarity}</small>
        ${this.formatItemTooltip(item.type, item.quantity, raid)}
        ${weaponActions}
        <footer class="inventory-slot-actions">
          ${useAction}
          <button type="button" data-loot-action="drop" data-slot-id="${item.id}">Drop</button>
          <button type="button" data-loot-action="inspect" data-slot-id="${item.id}">Inspect</button>
          <button type="button" data-loot-action="mark" data-slot-id="${item.id}">Mark</button>
        </footer>
      </div>
    `;
  }

  private formatInventorySelectedDetail(raid: RaidHudState): string {
    const selected = raid.inventorySlotsList.find((item) => item.id === raid.selectedInventorySlotId) ?? null;
    if (!selected) {
      return "";
    }

    const definition = getItemDefinition(selected.type);
    const profile = getItemUseProfile(selected.type);
    const useLabel = this.formatInventoryUseLabel(selected.type);
    const usable = profile.usableInRaid;
    const flareCopy = selected.type === "essence-flare"
      ? `<span class="selected-detail-affinity">${raid.revealAffinity.surveyor
        ? `Surveyor affinity active: ${raid.revealAffinity.surveyorRadius}m scan / ${raid.revealAffinity.surveyorDurationSeconds}s signal.`
        : "Surveyor class extends this scan."}</span>`
      : "";
    const boundary = !usable
      ? `<span class="selected-detail-boundary">${profile.blockedReason ?? "No field use in raid."}</span>`
      : "";
    const current = selected.type === "essence-flare"
      ? "Releases a local Lumen signal scan around the runner."
      : profile.currentUse;

    return `
      <section class="inventory-selected-detail" style="--rarity-color: ${colorToCss(themeConfig.rarityColors[definition.rarity])}">
        <header>
          <div>
            <strong>${selected.label}</strong>
            <span>${selected.quantity > 1 ? `Stack x${selected.quantity}` : `${definition.slots} slot${definition.slots > 1 ? "s" : ""}`} | ${definition.rarity.toUpperCase()}</span>
          </div>
          <b>${usable ? useLabel : "No Field Use"}</b>
        </header>
        <p>${current}</p>
        <div class="selected-detail-chips">
          ${profile.roles.slice(0, 3).map((role) => `<span>${role}</span>`).join("")}
          <span>${definition.category}</span>
        </div>
        ${flareCopy}
        ${boundary}
      </section>
    `;
  }

  private formatInventoryUseLabel(type: LootStack["type"]): string {
    if (type === "essence-flare") return "Emit Reveal Pulse";
    if (type === "medkit") return "Use Medkit";
    if (type === "advanced-medkit") return "Use Advanced Medkit";
    if (type === "bandage") return "Use Bandage";
    if (type === "armor-plate") return "Fit Armor Plate";
    if (type === "improved-armor-plate") return "Fit Improved Plate";
    if (type === "battery") return "Install Oxygen Cell";
    if (type === "anti-toxin") return "Use Anti-Toxin";
    return "Use";
  }

  private formatInventoryWeaponActions(item: InventorySlot, raid: RaidHudState): string {
    const weaponId = weaponIdFromLootType(item.type);

    if (!weaponId) {
      return "";
    }

    const primaryCompatible = this.isPrimaryCompatible(weaponId);
    const sidearmCompatible = this.isSidearmCompatible(weaponId);
    const compatibility = [
      primaryCompatible ? "Primary" : "",
      sidearmCompatible ? "Sidearm" : "",
    ].filter(Boolean).join(" / ") || "No compatible raid slot";
    const primaryLabel = raid.equippedPrimaryWeaponId ? "Swap Primary" : "Equip Primary";
    const sidearmLabel = raid.equippedSidearmWeaponId === "pistol" ? "Equip Sidearm" : "Swap Sidearm";
    const primaryMove = raid.equippedPrimaryWeaponId
      ? `<button type="button" data-loot-action="move-equipped-primary" data-slot-id="${item.id}">Move Primary to Pack</button>`
      : "";
    const sidearmMove = raid.equippedSidearmWeaponId !== "pistol"
      ? `<button type="button" data-loot-action="move-equipped-sidearm" data-slot-id="${item.id}">Move Sidearm to Pack</button>`
      : "";

    return `
      <div class="inventory-weapon-actions">
        <small>WEAPON | ${compatibility}</small>
        <div>
          ${primaryCompatible
            ? `<button type="button" data-loot-action="equip-primary" data-slot-id="${item.id}">${primaryLabel}</button>`
            : `<button type="button" disabled title="This weapon cannot fit that slot.">Primary unavailable</button>`}
          ${sidearmCompatible
            ? `<button type="button" data-loot-action="equip-sidearm" data-slot-id="${item.id}">${sidearmLabel}</button>`
            : `<button type="button" disabled title="This weapon cannot fit that slot.">Sidearm unavailable</button>`}
          ${primaryMove}
          ${sidearmMove}
        </div>
        ${!primaryCompatible && !sidearmCompatible ? `<span class="inventory-weapon-warning">This weapon cannot fit that slot.</span>` : ""}
      </div>
    `;
  }

  private isPrimaryCompatible(weaponId: WeaponId): boolean {
    return weaponId === "smg" || weaponId === "shotgun" || weaponId === "assault-rifle" || weaponId === "rifle";
  }

  private isSidearmCompatible(weaponId: WeaponId): boolean {
    return weaponId === "pistol" || weaponId === "burst-pistol" || weaponId === "revolver" || weaponId === "compact-smg";
  }

  private formatLootContainer(raid: RaidHudState): string {
    const container = raid.lootContainer;

    if (!container) {
      return "";
    }

    const items = container.status === "loading"
      ? `<span class="loot-empty">Loading cache contents...</span>`
      : container.items.length > 0
      ? container.items.map((item, index) => {
        const known = item.known !== false;
        const definition = known ? getItemDefinition(item.type) : getItemDefinition("scrap");
        const color = colorToCss(known ? themeConfig.rarityColors[definition.rarity] : themeConfig.colors.orange);
        const selected = index === raid.selectedLootIndex;
        return `
          <div class="loot-row${selected ? " selected" : ""}" style="--rarity-color: ${color}">
            <span>${item.label}</span>
            <small>${known ? `${item.quantity > 1 ? `x${item.quantity}` : `${definition.slots} slot${definition.slots > 1 ? "s" : ""}`} | ${definition.rarity} | ${definition.stackable ? "stacks" : "does not stack"}` : `x${item.quantity} | unknown server item | claimable`}</small>
            <button type="button" class="loot-take-button" data-loot-action="take" data-container-id="${container.id}" data-item-index="${index}">Take</button>
            ${known ? this.formatItemTooltip(item.type, item.quantity, raid) : ""}
          </div>
        `;
      }).join("")
      : `<span class="loot-empty">No recoverable contents</span>`;

    const linkedObjective = raid.poiObjectives.objectives.find((objective) => container.id === `${objective.id}-reward-chest`);
    const source = linkedObjective
      ? `Unlocked by: ${linkedObjective.poiName} ${linkedObjective.title}`
      : container.id.includes("reward-chest") ? raid.mission.rewardStatus : "Recovered from local cache route";
    const title = container.id.includes("reward-chest") ? "Objective Reward Cache" : container.title;
    const depleted = container.status !== "loading" && container.items.length === 0;

    return `
      <section class="loot-container-panel">
        <header>
          <div>
            <strong>${title}</strong>
            <span class="loot-cache-source">${source}</span>
            ${depleted ? `<span class="loot-cache-source depleted">Cache depleted / claimed</span>` : ""}
          </div>
          <button type="button" data-loot-action="close" data-container-id="${container.id}">Close</button>
        </header>
        <div>${items}</div>
        <button type="button" data-loot-action="take-all" data-container-id="${container.id}">Take All</button>
        <small class="loot-controls-hint">F/Y = Take All | Enter/E/A = Take Selected | Esc/B = Close | Arrows/WASD/Stick = Select</small>
      </section>
    `;
  }

  private formatItemTooltip(type: LootStack["type"], quantity: number, raid: RaidHudState): string {
    const definition = getItemDefinition(type);
    const profile = getItemUseProfile(type);
    const futureUse = profile.futureUse ? `<span>Future: ${profile.futureUse}</span>` : "";
    const blocked = !profile.usableInRaid && profile.blockedReason ? `<span>${profile.blockedReason}</span>` : "";
    const affinity = type === "essence-flare"
      ? `<span>${raid.revealAffinity.surveyor
        ? `Surveyor affinity active: ${raid.revealAffinity.surveyorRadius}m scan / ${raid.revealAffinity.surveyorDurationSeconds}s signal.`
        : `Surveyor class extends this scan to ${raid.revealAffinity.surveyorRadius}m / ${raid.revealAffinity.surveyorDurationSeconds}s.`}</span>`
      : "";
    return `
      <span class="item-tooltip">
        <strong>${definition.label}</strong>
        <span>${definition.rarity.toUpperCase()} ${definition.category}</span>
        <span>Roles: ${profile.roles.join(" / ")}</span>
        <span>${definition.stackable ? `Stack x${quantity}` : "Non-stackable"} | ${definition.slots} slot${definition.slots > 1 ? "s" : ""}</span>
        <span>${definition.description}</span>
        <span>Current: ${profile.currentUse}</span>
        ${affinity}
        ${futureUse}
        ${blocked}
        <span>Value ${definition.value * quantity} | ${definition.use}</span>
      </span>
    `;
  }

  private formatExtraction(extraction: ExtractionState): string {
    if (!extraction.insideZone) {
      return extraction.cancelReason ? `<strong>${this.formatExtractionCancel(extraction.cancelReason)}</strong>` : "";
    }

    const progress = Math.round(extraction.progress * 100);
    const shipReturn = extraction.currentZoneId === "personal-ship-return";
    const label = extraction.extracting
      ? shipReturn
        ? `Launch sequence ${extraction.secondsRemaining.toFixed(1)}s`
        : `Lunar Ascender locking ${extraction.secondsRemaining.toFixed(1)}s`
      : extraction.cancelReason
        ? this.formatExtractionCancel(extraction.cancelReason)
        : shipReturn
          ? extraction.currentZonePrompt ?? "Hold E to Initiate Return"
          : "Hold E for Lunar Ascender";

    return `
      <strong>${label}</strong>
      <small>${extraction.extracting
        ? shipReturn
          ? "Seal suit. Strap in. Lift imminent."
          : "Stay in the ascender beam. Taking damage cancels extraction."
        : shipReturn
          ? "Hold interact to launch."
          : "Hold interact to extract."}</small>
      <div><span style="width: ${progress}%"></span></div>
    `;
  }

  private formatExtractionCancel(reason: NonNullable<ExtractionState["cancelReason"]>): string {
    if (reason === "moved-away") {
      return "Extraction canceled - moved away";
    }

    if (reason === "took-damage") {
      return "Extraction canceled - took damage";
    }

    return "Extraction canceled - released interact";
  }

  private formatRaidTimer(timer: RaidTimerState): string {
    const minutes = Math.floor(timer.timeRemaining / 60);
    const seconds = Math.floor(timer.timeRemaining % 60);
    const extraction = timer.extractionUnlocked ? "Extracts active" : "Extracts locked";

    return `
      <strong>${minutes}:${seconds.toString().padStart(2, "0")}</strong>
      <span>${extraction}</span>
    `;
  }

  private formatOxygen(oxygenPercent: number): string {
    const clamped = Math.max(0, Math.min(100, Math.ceil(oxygenPercent)));
    return `
      <strong>O2 ${clamped}%</strong>
      <div><span style="width: ${clamped}%"></span></div>
    `;
  }

  private formatMentalStatus(status: PlayerStatusSnapshot): string {
    const value = Math.max(0, Math.min(100, Math.ceil(status.mentalStability)));
    const label = status.mentalState === "breakdown"
      ? "Breakdown"
      : status.mentalState.charAt(0).toUpperCase() + status.mentalState.slice(1);
    const infection = status.lunarInfection ? `<em>Lunar Infection</em>` : "";

    return `
      <strong>Mind ${value}%</strong>
      <span>${label}</span>
      ${infection}
      <div><span style="width: ${value}%"></span></div>
    `;
  }

  private formatDynamicEvent(event: DynamicEventState): string {
    if (!this.hasDynamicEventHud(event)) {
      return "";
    }

    const label = event.announcement ?? this.formatEventType(event.activeType);
    const distance = event.markerDistance !== null
      ? `<em>${Math.max(0, Math.round(event.markerDistance))}m</em>`
      : "";

    return `
      <strong>${label}</strong>
      ${distance}
    `;
  }

  private formatEnvironment(environment: EnvironmentState): string {
    return `
      <strong>${environment.label}</strong>
      <span>${environment.visibilityLabel}</span>
      <em>Flashlight ${environment.flashlightUsefulness}</em>
    `;
  }

  private formatNavigationMarkers(markers: readonly HudNavigationMarker[]): string {
    if (markers.length === 0) {
      return "";
    }

    return `
      <strong>Nav</strong>
      ${markers.slice(0, 6).map((marker) => {
        const distance = Math.max(0, Math.round(marker.distance));
        const opacity = Math.max(0.46, Math.min(1, 1.08 - distance / 260));
        return `<span class="nav-marker ${marker.kind}" style="--marker-opacity: ${opacity.toFixed(2)}">
          <b>${marker.label}</b><em>${distance}m</em>
        </span>`;
      }).join("")}
    `;
  }

  private formatRouteHint(hint: TacticalRouteHint | null, feedback: TacticalRouteFeedback | null): string {
    if (!hint && feedback) {
      return `
        <span>${feedback.status === "signal-lost" ? "Signal Update" : "Navigation"}</span>
        <strong>${this.formatRouteFeedbackLabel(feedback)}</strong>
        <div><b>${feedback.label}</b><em>${Math.ceil(feedback.remainingSeconds)}s</em></div>
      `;
    }

    if (!hint) {
      return "";
    }

    const distance = Math.max(0, Math.round(hint.distance));
    const timer = hint.remainingSeconds !== undefined
      ? `<em>${Math.ceil(hint.remainingSeconds)}s signal window</em>`
      : "";
    return `
      <span>Tracking //</span>
      <strong>${hint.label}</strong>
      <div><b>${distance}m</b><em>${this.formatRouteType(hint.type)} // ${this.formatRouteStatus(hint)}</em></div>
      ${timer}
    `;
  }

  private formatRouteFeedbackLabel(feedback: TacticalRouteFeedback): string {
    if (feedback.status === "signal-lost") return "SIGNAL LOST";
    if (feedback.status === "target-unavailable") return "TARGET UNAVAILABLE";
    if (feedback.status === "objective-complete") return "OBJECTIVE COMPLETE - ROUTE CLEARED";
    return "ROUTE CLEARED";
  }

  private formatRouteType(type: TacticalRouteHint["type"]): string {
    if (type === "reveal-signal") return "Reveal";
    if (type === "extraction") return "Extraction";
    if (type === "objective") return "Objective";
    if (type === "cache") return "Cache";
    return "POI";
  }

  private formatRouteStatus(hint: TacticalRouteHint): string {
    if (hint.type === "reveal-signal") {
      return hint.remainingSeconds !== undefined ? "Temporary signal" : "Last known";
    }
    if (hint.type === "extraction") {
      return hint.status === "active" || hint.status === "launch ready" ? "Extraction route" : "Return route";
    }
    if (hint.type === "objective") {
      return hint.status === "tracked" ? "Tracked objective" : "Active objective";
    }
    if (hint.type === "poi") {
      return "Known location";
    }
    return hint.status;
  }

  private formatTacticalMap(map: TacticalMapData, affinity?: RevealAffinityHudState): string {
    if (!map.open) {
      return "";
    }

    const toPercent = (value: number): number => ((value + map.mapSize / 2) / map.mapSize) * 100;
    const selectedPoi = map.pois.find((poi) => `poi-${poi.id}` === map.selectedTargetId)
      ?? map.pois.find((poi) => poi.id === map.selectedPoiId)
      ?? map.pois.find((poi) => poi.activeContract)
      ?? map.pois[0]
      ?? null;
    const selectedPoint = map.points.find((point) => point.id === map.selectedTargetId) ?? null;
    const selectedTarget = selectedPoint
      ? {
          id: selectedPoint.id,
          label: selectedPoint.label,
          type: this.formatMapTargetType(selectedPoint.kind),
          distance: selectedPoint.distance,
          status: selectedPoint.tracked ? "Tracked" : this.formatMapTargetStatus(selectedPoint.kind, selectedPoint.status ?? (selectedPoint.active ? "active" : "known")),
          source: this.formatMapTargetSource(selectedPoint.kind, selectedPoint.source),
          trackable: selectedPoint.trackable !== false && selectedPoint.kind !== "breadcrumb",
          tracked: selectedPoint.tracked === true,
          remainingSeconds: selectedPoint.remainingSeconds,
          copy: this.formatMapTargetCopy(selectedPoint.kind),
          mission: this.formatMapTargetMissionCopy(selectedPoint, map.mission),
        }
      : selectedPoi
        ? {
            id: `poi-${selectedPoi.id}`,
            label: selectedPoi.name,
            type: selectedPoi.activeContract ? "Contract POI" : "POI",
            distance: selectedPoi.distance,
            status: map.trackedTarget?.id === `poi-${selectedPoi.id}` ? "Tracked" : selectedPoi.activeContract ? "Active contract" : "Known location",
            source: selectedPoi.activeContract ? "Contract" : "Map",
            trackable: true,
            tracked: map.trackedTarget?.id === `poi-${selectedPoi.id}`,
            remainingSeconds: undefined,
            copy: selectedPoi.activeContract ? "Route to active contract area. Rewards not confirmed from map data." : "Known location route only. Rewards not confirmed.",
            mission: selectedPoi.activeContract ? "POI route supports the active contract." : "POI route is optional tactical context.",
          }
        : null;
    const playerX = toPercent(map.player.x);
    const playerY = toPercent(map.player.z);
    const routeLine = map.trackedTarget
      ? this.formatTacticalRouteLine(map, map.trackedTarget, toPercent)
      : "";
    const poiMarkers = map.pois.map((poi) => {
      const x = toPercent(poi.x);
      const y = toPercent(poi.z);
      const poiId = `poi-${poi.id}`;
      const tracked = map.trackedTarget?.id === poiId;
      return `<button type="button" class="tactical-map-marker poi ${poi.highRisk ? "high-risk" : ""} ${poi.activeContract ? "contract" : ""} ${poiId === selectedTarget?.id ? "selected" : ""} ${tracked ? "tracked" : ""}"
        style="left: ${x}%; top: ${y}%"
        title="${poi.name} | ${poi.danger} | ${poi.lootProfile}"
        data-raid-action="map-select-target-${poiId}">
        <span>${poi.name}</span>
      </button>`;
    }).join("");
    const signalOffsets = this.getSignalLabelOffsets(map.points, toPercent);
    const pointMarkers = map.points.map((point) => {
      const x = toPercent(point.x);
      const y = toPercent(point.z);
      const signalOffset = signalOffsets.get(point.id);
      const signalStyle = signalOffset
        ? `; --signal-label-x: ${signalOffset.x}px; --signal-label-y: ${signalOffset.y}px`
        : "";
      const signalClass = signalOffset ? " clustered" : "";
      const signalDetail = point.kind === "signal"
        ? `<em>${point.distance !== undefined ? `${Math.max(0, Math.round(point.distance))}m` : ""}${point.remainingSeconds !== undefined ? ` | ${Math.ceil(point.remainingSeconds)}s` : ""}</em>`
        : "";
      const pointContent = `${point.kind === "breadcrumb" ? "" : `<b>${point.label}</b>`}${signalDetail}`;
      if (point.kind === "breadcrumb" || point.trackable === false) {
        return `<span class="tactical-map-marker point ${point.kind}${signalClass} ${point.active ? "active" : ""} ${point.tracked ? "tracked" : ""}"
          style="left: ${x}%; top: ${y}%${signalStyle}"
          title="${point.label}">
          ${pointContent}
        </span>`;
      }
      return `<button type="button" class="tactical-map-marker point ${point.kind}${signalClass} ${point.active ? "active" : ""} ${point.selected ? "selected" : ""} ${point.tracked ? "tracked" : ""}"
        style="left: ${x}%; top: ${y}%${signalStyle}"
        title="${point.label}"
        data-raid-action="map-select-target-${point.id}">
        ${pointContent}
      </button>`;
    }).join("");
    const routeDots = map.points.filter((point) => point.kind === "breadcrumb");
    const signalPoints = map.points.filter((point) => point.kind === "signal");
    const contractRouteHint = routeDots.length > 0
      ? `<small>Contract route hint active: ${routeDots.length} low-power pings</small>`
      : `<small>No contract route pings active</small>`;
    const trackedHint = map.trackedTarget
      ? `<small class="tactical-map-tracked">Tracking ${map.trackedTarget.label}: ${Math.round(map.trackedTarget.distance)}m</small>`
      : `<small>No manual route target tracked</small>`;
    const signalHint = signalPoints.length > 0
      ? `<small>Lumen signals active: ${signalPoints.length}${affinity?.surveyor ? " | Surveyor extended scan active" : ""}</small>`
      : `<small>${affinity?.surveyor ? `Surveyor scan ready: ${affinity.surveyorRadius}m / ${affinity.surveyorDurationSeconds}s with Essence Flare` : "Scanner Battery: future scanner power component"}</small>`;
    const signalRows = signalPoints.length > 0
      ? `<div class="tactical-map-signal-list">
          ${signalPoints.slice(0, 4).map((point, index) => `
            <span>
              <b>Signal ${index + 1}</b>
              <em>${point.source === "essence-flare" ? "Essence Flare" : "Reveal"} | ${point.distance !== undefined ? `${Math.max(0, Math.round(point.distance))}m` : "range unknown"} | ${point.remainingSeconds !== undefined ? `${Math.ceil(point.remainingSeconds)}s` : "last-known"} | ${point.status ?? "last-known"}</em>
            </span>
          `).join("")}
        </div>`
      : "";

    return `
      <section class="tactical-map-panel">
        <header>
          <div>
            <span>DARK CRATERS Tactical Map</span>
            <strong>Tycho Scar Field</strong>
          </div>
          <nav>
            <button type="button" data-raid-action="map-center-player">Center on Player</button>
            <button type="button" data-raid-action="close-tactical-map">Close</button>
          </nav>
        </header>
          <div class="tactical-map-body">
          <div class="tactical-map-grid">
            <div class="tactical-map-risk core"></div>
            <div class="tactical-map-risk alien"></div>
            ${routeLine}
            ${poiMarkers}
            ${pointMarkers}
            <span class="tactical-map-player" style="left: ${playerX}%; top: ${playerY}%; transform: translate(-50%, -50%) rotate(${map.player.yaw}rad)"></span>
          </div>
          <aside>
            <section class="tactical-map-mission">
              <span>${map.mission.familyName}</span>
              <strong>${map.mission.title}</strong>
              <p>${map.mission.currentStep}</p>
              <small>${map.mission.routeContext}</small>
            </section>
            <span>Selected Target</span>
            <strong>${selectedTarget?.label ?? "No target selected"}</strong>
            <p>${selectedTarget
              ? `${selectedTarget.copy} ${selectedTarget.distance !== undefined ? `${Math.round(selectedTarget.distance)}m from current position.` : "Distance pending."}`
              : "Select a marker for details."}</p>
            ${selectedTarget ? `<div class="tactical-map-detail-grid">
              <span>Type</span><b>${selectedTarget.type}</b>
              <span>Status</span><b>${selectedTarget.status}</b>
              <span>Source</span><b>${selectedTarget.source}</b>
              <span>Distance</span><b>${selectedTarget.distance !== undefined ? `${Math.round(selectedTarget.distance)}m` : "Pending"}</b>
              <span>Mission</span><b>${selectedTarget.mission}</b>
            </div>` : ""}
            ${selectedTarget?.remainingSeconds !== undefined ? `<em>${Math.ceil(selectedTarget.remainingSeconds)}s signal window</em>` : ""}
            ${selectedTarget?.trackable
              ? selectedTarget.tracked
                ? `<button type="button" class="tactical-track-button active" data-raid-action="map-clear-tracking">Tracked - Clear</button>`
                : `<button type="button" class="tactical-track-button" data-raid-action="map-track-${selectedTarget.id}">Track</button>`
              : `<em>Tracking unavailable</em>`}
            ${trackedHint}
            ${contractRouteHint}
            ${signalHint}
            ${signalRows}
            <div class="tactical-map-legend">
              <span class="you">You</span>
              <span class="ship">Ship</span>
              <span class="contract">Contract</span>
              <span class="objective">Objective</span>
              <span class="signal">Lumen Signal</span>
              <span class="extract">Extraction</span>
              <span class="risk">High Risk</span>
            </div>
          </aside>
        </div>
      </section>
    `;
  }

  private formatTacticalRouteLine(
    map: TacticalMapData,
    hint: TacticalRouteHint,
    toPercent: (value: number) => number,
  ): string {
    const target = map.points.find((point) => point.id === hint.id)
      ?? map.pois.find((poi) => `poi-${poi.id}` === hint.id);
    if (!target) {
      return "";
    }

    const startX = toPercent(map.player.x);
    const startY = toPercent(map.player.z);
    const endX = toPercent(target.x);
    const endY = toPercent(target.z);
    const deltaX = endX - startX;
    const deltaY = endY - startY;
    const length = Math.hypot(deltaX, deltaY);
    if (length < 1.4) {
      return `<span class="tactical-route-endpoint close" style="left: ${endX}%; top: ${endY}%"></span>`;
    }
    const angle = Math.atan2(deltaY, deltaX);
    return `
      <span class="tactical-route-line" style="left: ${startX}%; top: ${startY}%; width: ${length}%; transform: rotate(${angle}rad)"></span>
      <span class="tactical-route-endpoint" style="left: ${endX}%; top: ${endY}%"></span>
    `;
  }

  private formatMapTargetStatus(kind: TacticalMapPointMarker["kind"], status: string): string {
    if (kind === "signal") {
      return status === "live" ? "Signal active" : "Last known";
    }
    if (kind === "extraction") {
      return status === "active" ? "Active" : "Available";
    }
    if (kind === "objective" || kind === "poiObjective" || kind === "contract") {
      return status === "active" ? "Active" : status;
    }
    return status;
  }

  private formatMapTargetType(kind: TacticalMapPointMarker["kind"]): string {
    if (kind === "signal") return "Lumen Signal";
    if (kind === "extraction") return "Extraction";
    if (kind === "poiObjective") return "POI Objective";
    if (kind === "contract") return "Contract";
    if (kind === "ship" || kind === "cargo" || kind === "launch") return "Extraction";
    if (kind === "objective") return "Objective";
    return "Map Point";
  }

  private formatMapTargetSource(kind: TacticalMapPointMarker["kind"], source?: TacticalMapPointMarker["source"]): string {
    if (kind === "signal") return source === "essence-flare" ? "Essence Flare" : "Reveal";
    if (kind === "extraction") return "Extraction";
    if (kind === "contract" || kind === "poiObjective") return "Contract";
    if (kind === "ship" || kind === "cargo" || kind === "launch" || kind === "objective") return "System";
    return "Map";
  }

  private formatMapTargetCopy(kind: TacticalMapPointMarker["kind"]): string {
    if (kind === "signal") return "Temporary Lumen signal. Signal will be lost when the flare expires.";
    if (kind === "extraction") return "Extraction route available. Route clears on extraction or return to Habitat.";
    if (kind === "contract") return "Route to active contract area. Objective rewards are not changed by tracking.";
    if (kind === "poiObjective") return "Objective route available. Tracking does not complete or alter rewards.";
    if (kind === "objective") return "Route to active objective. Objective completion clears this route.";
    if (kind === "ship" || kind === "cargo" || kind === "launch") return "Ship systems location route available.";
    return "Known location route only. Rewards not confirmed.";
  }

  private formatMapTargetMissionCopy(point: TacticalMapPointMarker, mission: MissionPresentation): string {
    if (point.kind === "signal") return "Reveal signal context, not primary mission.";
    if (point.kind === "extraction" || point.kind === "launch") return "Extraction route updates mission tracker.";
    if (point.kind === "poiObjective") return "POI contract route with reward cache status.";
    if (point.kind === "contract") return "Active contract staging area.";
    if (point.kind === "objective") return mission.status === "complete" ? "Primary objective complete." : "Primary mission route.";
    if (point.kind === "ship" || point.kind === "cargo") return "Ship route supports extraction and heavy cargo.";
    return "Optional route context.";
  }

  private getSignalLabelOffsets(
    points: readonly TacticalMapPointMarker[],
    toPercent: (value: number) => number,
  ): Map<string, { x: number; y: number }> {
    const signalPoints = points
      .filter((point) => point.kind === "signal")
      .map((point) => ({
        point,
        x: toPercent(point.x),
        y: toPercent(point.z),
      }));
    const offsets = new Map<string, { x: number; y: number }>();
    const used = new Set<string>();
    const offsetPattern = [
      { x: 14, y: -14 },
      { x: 14, y: 4 },
      { x: 14, y: 22 },
      { x: -86, y: -14 },
      { x: -86, y: 4 },
      { x: -86, y: 22 },
    ];

    for (const signal of signalPoints) {
      if (used.has(signal.point.id)) {
        continue;
      }
      const cluster = signalPoints.filter((candidate) =>
        !used.has(candidate.point.id) &&
        Math.abs(candidate.x - signal.x) <= 4.2 &&
        Math.abs(candidate.y - signal.y) <= 4.2);
      if (cluster.length <= 1) {
        continue;
      }
      cluster.forEach((candidate, index) => {
        used.add(candidate.point.id);
        offsets.set(candidate.point.id, offsetPattern[index % offsetPattern.length]);
      });
    }

    return offsets;
  }

  private formatVisibilityTools(tools: VisibilityToolState, tacticalTool: TacticalToolState): string {
    const activeTools = [
      tools.flashlightOn ? "Flashlight ON" : "Flashlight OFF",
      tools.laserOn ? "Laser" : "",
      tools.nightVisionOn ? "NV" : "",
    ].filter(Boolean).join(" / ");
    const charges = Number.isFinite(tacticalTool.maxCharges)
      ? `${tacticalTool.charges}/${tacticalTool.maxCharges}`
      : tacticalTool.active ? "active" : "ready";
    const cooldown = tacticalTool.cooldownRemaining > 0
      ? ` | ${tacticalTool.cooldownRemaining.toFixed(1)}s`
      : "";
    const warning = tacticalTool.unavailableReason ? ` | ${tacticalTool.unavailableReason}` : "";

    return `
      <strong>${activeTools}</strong>
      <span>${tacticalTool.label}: ${charges}${cooldown}${warning}</span>
      <span>Battery ${Math.ceil(tools.battery)}% placeholder</span>
    `;
  }

  private formatRevealSignal(signal: RevealSignalHudState): string {
    if (!signal.active) {
      return "";
    }

    const windowText = signal.remainingSeconds > 0
      ? `Reveal window: ${Math.ceil(signal.remainingSeconds)}s`
      : "Reveal window closing";
    if (signal.count <= 0) {
      return `
        <strong>NO LUMEN SIGNATURES DETECTED</strong>
        <span>${windowText}</span>
        ${signal.surveyorAffinity ? `<em class="surveyor-affinity">Surveyor scan extension active</em>` : ""}
      `;
    }

    return `
      <strong>SIGNAL REVEALED</strong>
      <span>Lumen signatures: ${signal.count}</span>
      <span>Nearest ${signal.nearestLabel ?? "Lumen signature"}: ${signal.nearestDistance !== null ? `${Math.round(signal.nearestDistance)}m` : "unknown"}</span>
      <span>${windowText}</span>
      ${signal.contextHint ? `<em>${signal.contextHint}</em>` : ""}
      ${signal.surveyorAffinity ? `<em class="surveyor-affinity">Surveyor scan extension active</em>` : ""}
    `;
  }

  private formatStealth(noise: NoiseSystemState): string {
    const detail = noise.recentType
      ? `${noise.recentType.replace("-", " ")} ${Math.round(noise.recentRadius)}m`
      : "No recent sound";

    return `
      <strong>${noise.stealthLabel}</strong>
      <span>${detail}</span>
    `;
  }

  private formatLandingSequence(sequence: OrbitalDeploymentSequenceState): string {
    if (!sequence.active) {
      return "";
    }

    const stability = Math.round(sequence.approachStability * 100);
    const score = Math.round(sequence.stabilizationScore * 100);
    const altitude = Math.max(0, Math.round((1 - sequence.descentProgress) * 240));
    const alignment = Math.round((1 - Math.min(1, Math.abs(sequence.alignmentOffset - sequence.targetOffset))) * 100);
    const quality = sequence.resolvedLandingQuality
      ? sequence.resolvedLandingQuality.toUpperCase()
      : sequence.phase === "stabilization-window"
        ? "PENDING"
        : "APPROACH";
    const phaseClass = sequence.phase.replace(/[^a-z0-9-]/gi, "");

    return `
      <section class="landing-phase-${phaseClass}">
        <small>TYCHO SCAR | ${sequence.hudPhaseLabel}</small>
        <strong>${sequence.prompt}</strong>
        <div class="landing-bars">
          <label>
            <span>ROUTE ${Math.round(sequence.totalProgress * 100)}%</span>
            <b><i style="width: ${Math.round(sequence.totalProgress * 100)}%"></i></b>
          </label>
          <label>
            <span>ALIGN ${alignment}%</span>
            <b><i style="width: ${alignment}%"></i></b>
          </label>
          <label>
            <span>ALT ${altitude}m</span>
            <b><i style="width: ${Math.round(sequence.descentProgress * 100)}%"></i></b>
          </label>
          <label>
            <span>STABILITY ${stability}%</span>
            <b><i style="width: ${stability}%"></i></b>
          </label>
          <label>
            <span>INPUT ${score}%</span>
            <b><i style="width: ${score}%"></i></b>
          </label>
        </div>
        <em>${sequence.signalInterferenceActive ? "APPROACH VECTOR UNSTABLE" : sequence.routeReacquisitionTriggered && sequence.phase === "route-reacquisition" ? "LANDING LOCK RESTORING" : quality} | MOUSE ORBIT | WHEEL ZOOM | K: SKIP</em>
      </section>
    `;
  }

  private formatShipStatus(
    ship: ShipState,
    prompt: string,
    repairPrompt: string,
    warning: string,
    repairChoices: string,
    moduleSummary: string,
    cargoItems: readonly LootStack[],
  ): string {
    const landing = ship.landingQuality.charAt(0).toUpperCase() + ship.landingQuality.slice(1);
    return `
      <strong>Ship status</strong>
      <span>${ship.statusLabel}</span>
      <span>Landing ${landing}</span>
      <span>Cargo hold ${ship.cargoUsed}/${ship.cargoCapacity}</span>
      <span>${this.formatShipReadiness(ship.readiness)}</span>
      <span>Ship Cargo Risk: ${this.formatShipCargoRisk(ship.cargoRisk)}</span>
      <span>Repair Status: ${this.formatShipRepairStatus(ship.repairStatus)}</span>
      <span>${moduleSummary}</span>
      ${ship.heavyCargoSecured ? `<span class="ship-manifest">Heavy Cargo Secured:<br>${ship.heavyCargoLabel}</span>` : ""}
      ${this.formatShipManifest(cargoItems)}
      <em>${ship.specialCargoEligible ? "Heavy Cargo eligible" : "Heavy Cargo unavailable"}</em>
      ${warning ? `<em>${warning}</em>` : ""}
      ${prompt ? `<small>${prompt}</small>` : ""}
      ${repairPrompt ? `<small>${repairPrompt}</small>` : ""}
      ${repairChoices ? `<div class="ship-repair-choices">${repairChoices}</div>` : ""}
    `;
  }

  private formatShipReadiness(readiness: ShipState["readiness"]): string {
    if (readiness === "offline") return "Systems Offline";
    if (readiness === "warming") return "Launch Warming";
    if (readiness === "ready") return "Launch Ready";
    return "Systems Compromised";
  }

  private formatShipCargoRisk(risk: ShipState["cargoRisk"]): string {
    if (risk === "secure") return "Secure";
    if (risk === "unstable") return "Unstable";
    return "Compromised";
  }

  private formatShipRepairStatus(status: ShipState["repairStatus"]): string {
    if (status === "stable") return "Stable";
    if (status === "patched") return "Patched";
    if (status === "repaired") return "Repaired";
    return "Unrepaired";
  }

  private formatShipManifest(cargoItems: readonly LootStack[]): string {
    if (cargoItems.length === 0) {
      return `<span class="ship-manifest">Manifest: Cargo hold empty</span>`;
    }

    const preview = cargoItems
      .slice(0, 3)
      .map((item) => `${item.label} x${item.quantity}`)
      .join("<br>");
    const remaining = cargoItems.length > 3 ? `<br>+${cargoItems.length - 3} more` : "";
    return `<span class="ship-manifest">Manifest:<br>${preview}${remaining}<br>${cargoItems.length} stack${cargoItems.length === 1 ? "" : "s"} total</span>`;
  }

  private hasDynamicEventHud(event: DynamicEventState): boolean {
    return event.announcement !== null
      || event.markerDistance !== null
      || event.powerOutageActive;
  }

  private formatEventType(type: DynamicEventState["activeType"]): string {
    if (type === "loot-drop") {
      return "Supply crate";
    }

    if (type === "reinforcement") {
      return "Reinforcements";
    }

    if (type === "temporary-extract") {
      return "Temporary extract";
    }

    if (type === "high-value-target") {
      return "High-value target";
    }

    if (type === "power-outage") {
      return "Power outage";
    }

    return "Crater event";
  }

  private formatMissionObjective(
    mission: MissionPresentation,
    objective: ObjectiveState,
    heavyCargo: HeavyCargoViewState,
    routeHint: TacticalRouteHint | null,
    pressure: RaidPressureState,
  ): string {
    const distance = Math.max(0, Math.round(objective.distance));
    const progress = Math.round(objective.progress * 100);
    const progressBar = objective.progress > 0 && !objective.completed
      ? `<div><span style="width: ${progress}%"></span></div>`
      : "";
    const heavyCargoLine = this.formatHeavyCargoObjectiveLine(heavyCargo);
    const routeLine = routeHint
      ? routeHint.type === "reveal-signal"
        ? `Tracked tactical signal: ${routeHint.label} // ${Math.round(routeHint.distance)}m`
        : `Tracked: ${routeHint.label} // ${Math.round(routeHint.distance)}m`
      : "No route tracked";

    return `
      <small class="mission-kicker">CONTRACT // ${mission.familyName}</small>
      <strong>${mission.title}</strong>
      <span>${mission.primaryObjective}</span>
      <span>Step: ${mission.currentStep}</span>
      <em>${mission.status.toUpperCase()} | ${routeLine}</em>
      <span class="mission-pressure ${pressure.phase}">
        ${pressure.pressureLabel} // Threat ${pressure.threatLevel}<br>
        ${this.formatCombatPressureLine(pressure)}<br>
        ${pressure.familyHint}
      </span>
      ${pressure.contactFeed.length > 0 ? `<span class="mission-contact-feed">${pressure.contactFeed.join(" // ")}</span>` : ""}
      <span class="mission-optional">${mission.optionalObjective}</span>
      ${heavyCargoLine}
      <em>${distance}m</em>
      ${progressBar}
    `;
  }

  private formatHeavyCargoObjectiveLine(heavyCargo: HeavyCargoViewState): string {
    if (heavyCargo.shipSecured) {
      return `<span class="heavy-cargo-hud secured">HEAVY CARGO SECURED<br>HELIUM-3 DRILL CORE<br>EXTRACTION AVAILABLE<br>RETURN TO SHIP</span>`;
    }

    if (heavyCargo.carriedByLocalPlayer) {
      const shipPrompt = heavyCargo.distanceToShipCargo <= 4
        ? "E: SECURE HELIUM-3 CORE IN SHIP HOLD"
        : "RETURN TO SHIP CARGO BAY";
      const shipDistance = Math.max(0, Math.round(heavyCargo.distanceToShipCargo));
      return `<span class="heavy-cargo-hud warning">HEAVY CARGO CARRIER<br>HELIUM-3 DRILL CORE<br>WEAPONS LOCKED | CORE SIGNATURE EXPOSED<br>${shipPrompt} - ${shipDistance}m<br>X: DROP CORE</span>`;
    }

    if (heavyCargo.status === "carried") {
      const carrier = heavyCargo.carrierPlayerId ? `RUNNER-${heavyCargo.carrierPlayerId.slice(0, 4)}` : "TEAMMATE";
      const shipDistance = Math.max(0, Math.round(heavyCargo.distanceToShipCargo));
      return `<span class="heavy-cargo-hud">${carrier} CARRYING HELIUM-3 CORE<br>ESCORT CORE CARRIER TO SHIP CARGO BAY - ${shipDistance}m<br>CARRIER WEAPON-LOCKED</span>`;
    }

    if (heavyCargo.status === "dropped") {
      return `<span class="heavy-cargo-hud warning">HELIUM-3 CORE DROPPED<br>E: RECOVER HELIUM-3 DRILL CORE<br>RECOVER CORE OR REVIVE TEAMMATE</span>`;
    }

    if (heavyCargo.status === "available") {
      return `<span class="heavy-cargo-hud warning">E: CARRY HELIUM-3 DRILL CORE<br>HEAVY CARGO DISABLES SPRINT AND WEAPONS</span>`;
    }

    return `<span class="heavy-cargo-hud">LOCATE MINING RIG<br>E: RELEASE HELIUM-3 DRILL CORE<br>EXTRACTION LOCKED UNTIL SECURED</span>`;
  }

  private formatCombatPressureLine(pressure: RaidPressureState): string {
    if (pressure.reasonCategory === "heavy-cargo-exposed") {
      return "Cargo signature exposed - patrol response from contact lanes.";
    }

    if (pressure.reasonCategory === "extraction-route-active") {
      return "Return-route contact - keep the extraction lane clear.";
    }

    if (pressure.reasonCategory === "objective-contested") {
      return "Objective guards active on the POI perimeter.";
    }

    if (pressure.reasonCategory === "objective-approach") {
      return "Objective perimeter drawing patrol attention.";
    }

    if (pressure.reasonCategory === "reveal-contact") {
      return "Revealed signatures near the active route.";
    }

    return pressure.reason;
  }

  private formatPoiObjectives(state: POIObjectiveState): string {
    const nearest = state.nearest;
    const remaining = state.objectives.filter((objective) => !objective.completed).slice(0, 3);

    if (!nearest && state.totalCount === 0) {
      return "";
    }

    const list = remaining.length > 0
      ? remaining.map((objective) => this.formatPoiObjectiveRow(objective)).join("")
      : `<span class="poi-objective-row complete">All POI chests unlocked</span>`;

    return `
      <strong>POI Rewards ${state.completedCount}/${state.totalCount}</strong>
      ${nearest ? `<span>${nearest.title} - ${nearest.poiName}</span>` : ""}
      ${list}
    `;
  }

  private formatPoiObjectiveRow(objective: POIObjectiveView): string {
    const progress = Math.round(objective.progress * 100);
    const color = colorToCss(themeConfig.rarityColors[objective.rewardRarity]);
    const progressBar = objective.progress > 0 && !objective.completed
      ? `<div><span style="width: ${progress}%"></span></div>`
      : "";

    return `
      <span class="poi-objective-row ${objective.completed ? "complete" : ""} ${objective.contractLinked ? "contract-linked" : ""}" style="--rarity-color: ${color}">
        <b>${objective.contractLinked ? "CONTRACT: " : ""}${objective.poiName} ${objective.title}</b>
        <em>${this.formatPoiContractStatus(objective)} | ${Math.round(objective.distance)}m | Threat ${objective.threatRating} | ${objective.rewardRarity}</em>
        ${progressBar}
      </span>
    `;
  }

  private formatPoiContractStatus(objective: POIObjectiveView): string {
    if (objective.completed && objective.chestUnlocked) return "Reward available";
    if (objective.completed) return "Objective complete";
    if (objective.progress > 0) return "Interacting";
    return objective.distance <= 18 ? "Approach and interact" : "Approach POI";
  }

  private formatActiveContract(contract: ActiveContractState | null, poiObjectives: POIObjectiveState): string {
    if (!contract) {
      return "";
    }

    const progress = Math.min(100, Math.round((contract.progress / Math.max(1, contract.goal)) * 100));
    const status = contract.status === "ready-to-claim"
      ? "Extract to claim"
      : contract.status === "failed"
        ? contract.failedReason ?? "Failed"
        : `${contract.progress}/${contract.goal}`;
    const targetObjective = poiObjectives.objectives.find((objective) => objective.poiName === contract.definition.targetPoi);
    const targetPoi = targetObjective
      ? `${contract.definition.targetPoi} - ${Math.round(targetObjective.distance)}m`
      : contract.definition.targetPoi;
    const objectiveStatus = targetObjective
      ? `${targetObjective.title}${targetObjective.completed ? " complete" : ` ${Math.round(targetObjective.progress * 100)}%`}`
      : "";

    return `
      <strong>${contract.definition.title}</strong>
      <span>${status} | Target: ${targetPoi}</span>
      ${objectiveStatus ? `<em>${objectiveStatus}</em>` : ""}
      <div><span style="width: ${progress}%"></span></div>
    `;
  }

  private formatOutcome(raid: RaidHudState, playerHealth: PlayerHealthSnapshot): string {
    if (raid.outcome === "active" && playerHealth.alive) {
      this.previousRaidResultDisplayKey = "";
      return "";
    }

    const waitingForRevive = raid.outcome === "active" && !playerHealth.alive;

    if (waitingForRevive) {
      return `
        <strong>DOWNED</strong>
        <span>Wait for revive or hold N / B to return to the habitat.</span>
        <button type="button" data-raid-action="return-hq">Return to Habitat</button>
        <em>Leaving now counts as LEFT DOWNED and loses carried EVA Pack loot.</em>
        <div class="return-hq-progress"><span style="width: ${Math.round(raid.returnToHqProgress * 100)}%"></span></div>
      `;
    }

    const summary = raid.resultSummary;
    const presentation = raid.resultPresentation;
    if (presentation) {
      const displayKey = `${presentation.missionId}:${presentation.result}`;
      if (this.previousRaidResultDisplayKey !== displayKey) {
        this.previousRaidResultDisplayKey = displayKey;
        console.info(`[RaidResult] displayed result=${presentation.result}`);
      }

      return `
        <strong>${summary.title}</strong>
        <span>${presentation.extractionStatus}</span>
        <section class="raid-result-grid">
          <div class="mission-outcome-summary wide">
            <b>MISSION OUTCOME</b>
            <span>Contract: ${presentation.missionTitle}<br>Family: ${presentation.familyName}<br>Result: ${presentation.resultLabel}</span>
          </div>
          <div class="campaign-result-card">
            <b>CAMPAIGN PROGRESS</b>
            <span>${this.formatResultLines(raid.campaign.resultLines, 7)}<br>${this.formatResultLines(raid.campaign.meterLines, 3)}<br>${this.formatResultLines(raid.campaign.evidence.summaryLines, 3)}</span>
          </div>
          <div>
            <b>PRIMARY OBJECTIVE</b>
            <span>${presentation.primaryObjectiveStatus}<br>${presentation.primaryObjectiveDetail}<br>${presentation.heavyCargoStatus}</span>
          </div>
          <div>
            <b>POI CONTRACTS</b>
            <span>${presentation.poiCompleted}/${presentation.poiTotalKnown} completed<br>${this.formatResultLines(presentation.poiLines, 4)}</span>
          </div>
          <div>
            <b>REWARD CACHES</b>
            <span>${presentation.rewardCachesClaimed}/${presentation.rewardCachesAvailable} claimed<br>${this.formatResultLines(presentation.rewardCacheLines, 3)}</span>
          </div>
          <div>
            <b>RECOVERED ITEMS</b>
            <span>${this.formatResultItems(presentation.recoveredItems, "No loot extracted")}</span>
          </div>
          <div>
            <b>NOTABLE FINDS</b>
            <span>${this.formatResultItems(presentation.notableFinds, "No notable finds secured")}</span>
          </div>
          <div>
            <b>FIELD RISK</b>
            <span>${this.formatResultLines(presentation.pressureSummary, 4)}</span>
          </div>
          <div>
            <b>TYCHOSTAR ASSESSMENT</b>
            <span>${presentation.corporateAssessment}<br>${presentation.narrativeLine}</span>
          </div>
          <div>
            <b>PROGRESSION BRIDGE</b>
            <span>${this.formatResultLines([...presentation.craftingOpportunities, ...presentation.repairOpportunities], 4)}</span>
          </div>
          <div>
            <b>RECOMMENDED NEXT ACTIONS</b>
            <span>${this.formatResultLines(presentation.nextRecommendedActions, 5)}</span>
          </div>
          <div>
            <b>REWARDS</b>
            <span>+${summary.xpGained} XP<br>+${summary.creditsGained} credits<br>+${summary.scrapGained} regolith scrap<br>${summary.scrapSpent} scrap spent</span>
          </div>
          <div>
            <b>SHIP / EVA</b>
            <span>Ship Cargo Secured: ${summary.shipCargoUsed} / ${summary.shipCargoCapacity}<br>Landing Quality: ${summary.shipLandingQuality}<br>Repair Status: ${summary.shipRepairStatus}<br>EVA Pack Left: ${summary.evaPackItemsLeft} item${summary.evaPackItemsLeft === 1 ? "" : "s"}</span>
          </div>
        </section>
        <button type="button" data-raid-action="return-hq">Continue to Habitat</button>
        <em>Habitat Stash is safe. EVA Pack rules have been applied. Hold N / B also returns to the habitat.</em>
      `;
    }

    const primaryRecovery = summary.lootExtracted.some((item) => item.type === "helium-drill-core")
      ? `<div class="primary-recovery"><b>Primary Recovery Secured</b><span>HELIUM-3 DRILL CORE<br>Heavy Objective Reward Confirmed</span></div>`
      : "";
    const gained = this.formatLootList(summary.lootExtracted, "No loot extracted");
    const lost = this.formatLootList(summary.lootLost, "No carried loot lost");
    const shipCargo = this.formatLootList(summary.shipCargoSecured, "No ship cargo secured");
    const contractsCompleted = summary.contractsCompleted.length > 0
      ? summary.contractsCompleted.join("<br>")
      : "None";
    const contractsFailed = summary.contractsFailed.length > 0
      ? summary.contractsFailed.join("<br>")
      : "None";
    const contractsUnclaimed = summary.contractsUnclaimed.length > 0
      ? summary.contractsUnclaimed.join("<br>")
      : "None";
    const poiObjectives = summary.poiObjectivesCompleted.length > 0
      ? summary.poiObjectivesCompleted.join("<br>")
      : "None";
    const vendorReputation = summary.vendorReputationGained.length > 0
      ? summary.vendorReputationGained.join("<br>")
      : "None";

    return `
      <strong>${summary.title}</strong>
      <span>${summary.survivalStatus}</span>
      <section>
        <div class="mission-outcome-summary">
          <b>MISSION OUTCOME</b>
          <span>Contract: ${raid.mission.title}<br>Family: ${raid.mission.familyName}<br>Result: ${raid.mission.result}<br>Primary: ${raid.mission.currentStep}<br>POI Contracts: ${raid.mission.poiContracts}<br>Reward Cache: ${raid.mission.rewardStatus}<br>Next: ${raid.mission.nextAction}</span>
        </div>
        ${primaryRecovery}
        <div><b>Survival</b><span>${summary.survivalStatus}</span></div>
        <div><b>Run Duration</b><span>${this.formatDuration(summary.raidDurationSeconds)}</span></div>
        <div><b>Enemies Eliminated</b><span>${summary.enemiesEliminated}</span></div>
        <div><b>Loot Extracted</b><span>${gained}</span></div>
        <div><b>Ship Cargo</b><span>${shipCargo}<br>Ship Cargo Secured: ${summary.shipCargoUsed} / ${summary.shipCargoCapacity}<br>Landing Quality: ${summary.shipLandingQuality}<br>Ship Cargo Risk: ${summary.shipCargoRisk}<br>Repair Status: ${summary.shipRepairStatus}<br>EVA Pack Left: ${summary.evaPackItemsLeft} item${summary.evaPackItemsLeft === 1 ? "" : "s"}<br>${summary.shipStatus}</span></div>
        <div><b>Loot Lost</b><span>${lost}</span></div>
        <div><b>Rewards</b><span>+${summary.xpGained} XP<br>+${summary.creditsGained} credits<br>+${summary.scrapGained} regolith scrap<br>${summary.scrapSpent} scrap spent</span></div>
        <div><b>Contracts Completed</b><span>${contractsCompleted}</span></div>
        <div><b>Contracts Failed</b><span>${contractsFailed}</span></div>
        <div><b>Unclaimed Contracts</b><span>${contractsUnclaimed}</span></div>
        <div><b>POI Objective</b><span>${poiObjectives}<br>${summary.poiObjectiveOutcome}</span></div>
        <div><b>Vendor Reputation</b><span>${vendorReputation}</span></div>
      </section>
      <button type="button" data-raid-action="return-hq">Continue to Habitat</button>
      <em>Habitat Stash is safe. EVA Pack rules have been applied. Hold N / B also returns to the habitat.</em>
    `;
  }

  private formatLootList(items: readonly LootStack[], emptyLabel: string): string {
    if (items.length === 0) {
      return emptyLabel;
    }

    return items
      .map((item) => `${item.label}${item.quantity > 1 ? ` x${item.quantity}` : ""}`)
      .join("<br>");
  }

  private formatResultItems(items: readonly RaidResultItem[], emptyLabel: string): string {
    if (items.length === 0) {
      return emptyLabel;
    }

    return items
      .slice(0, 8)
      .map((item) => `${item.notable ? "* " : ""}${item.label}${item.quantity > 1 ? ` x${item.quantity}` : ""}`)
      .join("<br>");
  }

  private formatResultLines(lines: readonly string[], maxLines: number): string {
    if (lines.length === 0) {
      return "None";
    }

    const visible = lines.slice(0, maxLines);
    const hidden = lines.length - visible.length;
    return `${visible.join("<br>")}${hidden > 0 ? `<br>+${hidden} more` : ""}`;
  }

  private updateOutcomeMarkup(raid: RaidHudState, playerHealth: PlayerHealthSnapshot): void {
    const markup = this.formatOutcome(raid, playerHealth);

    if (markup === this.previousOutcomeMarkup) {
      return;
    }

    const scrollTop = this.outcome.scrollTop;
    const summaryScrollTop = this.outcome.querySelector<HTMLElement>("section")?.scrollTop ?? 0;

    this.outcome.innerHTML = markup;
    this.previousOutcomeMarkup = markup;
    this.outcome.scrollTop = scrollTop;

    const summary = this.outcome.querySelector<HTMLElement>("section");
    if (summary) {
      summary.scrollTop = summaryScrollTop;
    }
  }

  private formatDuration(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainder = seconds % 60;
    return `${minutes}:${remainder.toString().padStart(2, "0")}`;
  }

  private playStateAudio(
    playerHealth: PlayerHealthSnapshot,
    extraction: ExtractionState,
    outcome: RaidOutcome,
  ): void {
    if (playerHealth.recentDamage && !this.previousDamageActive) {
      this.audio.playPlayerDamage();
    }

    if (extraction.extracting && !this.previousExtracting) {
      this.audio.playExtractionStart();
    }

    if (extraction.completed && !this.previousCompleted) {
      this.audio.playExtractionComplete();
    }

    if (!playerHealth.alive && this.previousAlive) {
      this.audio.playDeath();
    }

    if (outcome === "lost" && this.previousAlive) {
      this.audio.playDeath();
    }

    this.previousDamageActive = playerHealth.recentDamage;
    this.previousExtracting = extraction.extracting;
    this.previousCompleted = extraction.completed;
    this.previousAlive = playerHealth.alive;
  }

  private updateKillFeed(dt: number): void {
    this.killFeedEntries = this.killFeedEntries
      .map((entry) => ({ ...entry, ttl: entry.ttl - dt }))
      .filter((entry) => entry.ttl > 0);
    this.killFeed.innerHTML = this.killFeedEntries
      .map((entry) => `<span class="${entry.hostile ? "hostile" : ""}">${entry.text}</span>`)
      .join("");
    this.killFeed.classList.toggle("active", this.killFeedEntries.length > 0);
  }

  private formatControllerName(name: string): string {
    return name.replace(/\s*\([^)]*\)/g, "").slice(0, 34);
  }

  private formatControllerDebug(input: InputSnapshot): string {
    const debug = input.controllerDebug;
    const axes = debug.axes.map((axis) => axis.toFixed(2)).join(" / ");
    const actions = [
      ["jump", input.jumpPressed],
      ["fire", input.fireHeld],
      ["ADS", input.adsHeld],
      ["crouch", input.crouchHeld],
      ["sprint", input.sprintHeld],
      ["reload", input.reloadPressed],
      ["clear", input.clearJamHeld || input.clearJamPressed],
      ["shoulder", input.shoulderSwapPressed],
      ["interact", input.interactHeld || input.interactPressed],
      ["cover", input.coverPressed],
      ["peekL", input.peekLeftHeld],
      ["peekR", input.peekRightHeld],
    ]
      .map(([label, active]) => `${label}:${active ? "1" : "0"}`)
      .join(" ");

    return `
      <strong>Controller Debug</strong>
      <span>${debug.name ? this.formatControllerName(debug.name) : "No controller"}</span>
      <span>Buttons: ${debug.activeButtons.join(", ") || "none"}</span>
      <span>LT ${debug.leftTrigger.toFixed(2)} | RT ${debug.rightTrigger.toFixed(2)}</span>
      <span>Axes: ${axes}</span>
      <span>${actions}</span>
    `;
  }

  private formatWeaponStatus(weapon: WeaponState): string {
    if (weapon.clearingJam) {
      return `Clearing jam ${Math.round(weapon.jamClearProgress * 100)}%`;
    }

    if (weapon.jammed) {
      return "JAMMED - hold B / Y";
    }

    if (weapon.reloading) {
      return "Reloading - keep cover";
    }

    if (weapon.dryFireFeedback) {
      return "Empty - reload or swap";
    }

    if (weapon.ammoInMagazine === 0) {
      return "Empty magazine";
    }

    if (weapon.ammoInMagazine <= Math.max(3, Math.ceil((weapon.ammoInMagazine + weapon.reserveAmmo) * 0.06))) {
      return `${weapon.equippedName} - low ammo`;
    }

    return weapon.ready ? weapon.equippedName : "";
  }

  private formatWeaponDurability(weapon: WeaponState): string {
    const durability = Math.round(weapon.durability);
    const jamChance = Math.round(weapon.jamChance * 100);
    const shot = weapon.lastShot.fired
      ? `${weapon.lastShot.hit ? "Hit" : "Miss"} ${weapon.lastShot.hitMeshName ?? "none"} | ${weapon.lastShot.hitZone?.toUpperCase() ?? "NO ZONE"} | ${weapon.lastShot.damageDealt} dmg | ${Math.round(weapon.lastShot.distance)}m | ${weapon.lastShot.weaponName} | Laser ${weapon.lastShot.laserActive ? "on" : "off"}`
      : "Last shot: none";

    return `
      <span>Durability ${durability}%${weapon.jamWarning ? ` | Jam ${jamChance}%` : ""}</span>
      <div><span style="width: ${durability}%"></span></div>
      <small>${shot}</small>
    `;
  }
}
