import { PlaceholderWeaponAudio } from "../audio/PlaceholderWeaponAudio";
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
import type { ObjectiveState } from "../raid/ObjectiveDirector";
import { getItemDefinition } from "../raid/ItemDefinitions";
import type { LootContainerView } from "../raid/LootDirector";
import type { POIObjectiveState, POIObjectiveView } from "../raid/POIObjectiveManager";
import type { InventorySlot, LootEvent, LootStack } from "../raid/RaidInventory";
import type { RaidResultSummary } from "../raid/RaidResultSummary";
import type { RaidTimerState } from "../raid/RaidTimer";
import type { SettingsManager } from "../settings/SettingsManager";
import type { NoiseSystemState } from "../stealth/NoiseSystem";
import type { TacticalToolState } from "../tactical/TacticalToolManager";
import { colorToCss, themeConfig } from "../theme/ThemeConfig";
import type { TraversalState } from "../traversal/TraversalController";
import type { VisibilityToolState } from "../visibility/VisibilityToolManager";
import type { WeaponState } from "../weapons/WeaponController";
import type { MotorState } from "../world/PlayerMotor";

export type DamageNumber = Readonly<{
  amount: number;
  headshot: boolean;
  hitZone: "body" | "head" | "legs";
}>;

export type RaidOutcome = "active" | "extracted" | "lost";
export type RaidScreen = "menu" | "stash" | "loadout" | "inspect" | "workbench" | "settings" | "raid" | "raid-select";

export type RaidHudState = Readonly<{
  screen: RaidScreen;
  outcome: RaidOutcome;
  inventoryItems: LootStack[];
  inventorySlotsList: InventorySlot[];
  outcomeItems: LootStack[];
  lootLostItems: LootStack[];
  resultSummary: RaidResultSummary;
  armorDurability: number;
  inventorySlots: number;
  inventoryCapacity: number;
  raidBagOpen: boolean;
  selectedInventorySlotId: string | null;
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
  private readonly visibilityTools = document.createElement("div");
  private readonly stealth = document.createElement("div");
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

  public constructor(private readonly settingsManager: SettingsManager) {
    this.root.className = "combat-hud";
    this.root.addEventListener("mousedown", (event) => event.stopPropagation());
    this.root.addEventListener("mouseup", (event) => event.stopPropagation());
    this.root.addEventListener("click", (event) => {
  const target = event.target instanceof HTMLElement
    ? event.target.closest<HTMLElement>("[data-raid-action], [data-loot-action]")
    : null;

  if (target?.dataset.raidAction) {
    this.raidActionHandler?.(target.dataset.raidAction);
    event.stopPropagation();
    return;
  }

  if (target?.dataset.lootAction) {
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
    event.stopPropagation();
  }
});
    this.root.addEventListener("wheel", (event) => event.stopPropagation(), { passive: true });
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
    this.visibilityTools.className = "visibility-tools";
    this.stealth.className = "stealth-status";
    this.shoulder.className = "shoulder-status";
    this.objective.className = "objective-panel";
    this.poiObjectives.className = "poi-objectives-panel";
    this.contractTracker.className = "contract-tracker-panel";
    this.poi.className = "poi-banner";
    this.coverPrompt.className = "cover-prompt";
    this.traversalPrompt.className = "traversal-prompt";
    this.killFeed.className = "kill-feed";
    this.outcome.className = "raid-outcome";
    this.sniperScope.className = "sniper-scope";
    this.outcome.addEventListener("click", (event) => {
      const target = event.target instanceof HTMLElement
        ? event.target.closest<HTMLElement>("[data-raid-action]")
        : null;

      if (target?.dataset.raidAction) {
        this.raidActionHandler?.(target.dataset.raidAction);
        event.stopPropagation();
      }
    });

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
      this.visibilityTools,
      this.stealth,
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
    const settings = this.settingsManager.snapshot;

    this.crosshair.style.setProperty("--crosshair-bloom", `${recoilBloom}px`);
    this.crosshair.style.opacity = String(settings.gameplay.crosshairOpacity);
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
    this.weaponDurability.innerHTML = this.formatWeaponDurability(weapon);
    this.weaponDurability.classList.toggle("warning", weapon.jamWarning);
    this.weaponDurability.classList.toggle("jammed", weapon.jammed);
    this.movementDebug.textContent = `Hop ${motor.consecutiveHopCount} | Momentum ${motor.bunnyhopMomentumMultiplier.toFixed(2)}x | Speed ${motor.horizontalSpeed.toFixed(1)}`;
    this.aiDebug.textContent = enemies
      .map((enemy) => {
        const marker = enemy.elite ? "ELITE " : "";
        const cover = enemy.coverTarget ? " cover" : "";
        const faction = themeConfig.enemyFactionNames[enemy.type];
        return `${faction}: ${marker}${enemy.role.toUpperCase()} ${enemy.state.toUpperCase()} ${enemy.tactic}${cover} ${Math.ceil(enemy.health)}hp`;
      })
      .join("\n");
    this.damageFlash.classList.toggle("active", playerHealth.recentDamage);
    this.damageFlash.classList.toggle("dead", !playerHealth.alive);
    this.damageDirection.classList.toggle("active", playerHealth.recentDamage && playerHealth.recentDamageAngle !== null);
    this.damageDirection.style.transform = `translate(-50%, -50%) rotate(${playerHealth.recentDamageAngle ?? 0}rad)`;
    this.lowHealthVignette.classList.toggle("active", showRaidHud && playerHealth.lowHealth && playerHealth.alive);
    this.health.classList.toggle("low", playerHealth.lowHealth);
    this.health.textContent += raid.armorDurability <= 20 ? " | ARMOR BREAK" : "";
    this.health.classList.toggle("armor-break", raid.armorDurability <= 20);
    this.oxygen.innerHTML = this.formatOxygen(raid.oxygenPercent);
    this.oxygen.className = `oxygen-status ${raid.oxygenState}`;
    this.oxygen.classList.toggle("hidden", !showRaidHud);
    this.mental.innerHTML = this.formatMentalStatus(raid.playerStatus);
    this.mental.className = `mental-status ${raid.playerStatus.mentalState}${raid.playerStatus.lunarInfection ? " infected" : ""}`;
    this.mental.classList.toggle("hidden", !showRaidHud);
    this.playStateAudio(playerHealth, raid.extraction, raid.outcome);
    this.notificationTimer = Math.max(0, this.notificationTimer - dt);
    this.notification.classList.toggle("active", this.notificationTimer > 0);
    this.inventory.innerHTML = this.formatInventory(raid);
    this.inventory.classList.toggle("hidden", !showRaidHud || (!raid.raidBagOpen && raid.lootContainer === null));
    this.extraction.innerHTML = this.formatExtraction(raid.extraction);
    this.raidTimer.innerHTML = this.formatRaidTimer(raid.raidTimer);
    this.raidTimer.classList.toggle("hidden", !showRaidHud);
    this.raidTimer.classList.toggle("warning", raid.raidTimer.finalWarning);
    this.eventBanner.innerHTML = this.formatDynamicEvent(raid.dynamicEvent);
    this.eventBanner.classList.toggle("active", showRaidHud && this.hasDynamicEventHud(raid.dynamicEvent));
    this.eventBanner.classList.toggle("power", raid.dynamicEvent.powerOutageActive);
    this.condition.innerHTML = this.formatEnvironment(raid.environment);
    this.condition.classList.toggle("hidden", !showRaidHud);
    this.visibilityTools.innerHTML = this.formatVisibilityTools(raid.visibilityTools, raid.tacticalTool);
    this.visibilityTools.classList.toggle("hidden", !showRaidHud);
    this.stealth.innerHTML = this.formatStealth(raid.noise);
    this.stealth.classList.toggle("hidden", !showRaidHud);
    this.stealth.classList.toggle("quiet", raid.noise.quiet);
    this.stealth.classList.toggle("loud", raid.noise.stealthLabel === "Loud");
    this.shoulder.textContent = `Shoulder: ${raid.shoulderSide === "right" ? "R" : "L"}`;
    this.shoulder.classList.toggle("hidden", !showRaidHud);
    this.objective.innerHTML = this.formatObjective(raid.objective);
    this.objective.classList.toggle("hidden", !showRaidHud);
    this.poiObjectives.innerHTML = this.formatPoiObjectives(raid.poiObjectives);
    this.poiObjectives.classList.toggle("hidden", !showRaidHud || !raid.poiObjectives.active);
    this.contractTracker.innerHTML = this.formatActiveContract(raid.activeContract, raid.poiObjectives);
    this.contractTracker.classList.toggle("hidden", !showRaidHud || raid.activeContract === null);
    this.poi.textContent = raid.poiName ?? "";
    this.poi.classList.toggle("active", showRaidHud && raid.poiName !== null);
    this.coverPrompt.textContent = raid.cover.prompt;
    this.coverPrompt.classList.toggle(
      "active",
      showRaidHud && raid.outcome === "active" && (raid.cover.available || raid.cover.inCover),
    );
    this.coverPrompt.classList.toggle("in-cover", raid.cover.inCover);
    this.coverPrompt.classList.toggle("peeking", raid.cover.peek !== 0);
    this.traversalPrompt.textContent = raid.traversal.prompt;
    this.traversalPrompt.classList.toggle(
      "active",
      showRaidHud && raid.outcome === "active" && raid.traversal.prompt.length > 0,
    );
    this.traversalPrompt.classList.toggle("moving", raid.traversal.active);
    this.extraction.classList.toggle(
      "active",
      showRaidHud && raid.extraction.insideZone && raid.outcome === "active",
    );
    this.outcome.innerHTML = this.formatOutcome(raid, playerHealth);
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

  private formatInventory(raid: RaidHudState): string {
    const slots = raid.inventorySlotsList.length > 0
      ? raid.inventorySlotsList.map((item) => this.formatInventorySlot(item, raid.selectedInventorySlotId)).join("")
      : Array.from({ length: raid.inventoryCapacity }, (_, index) => `<div class="inventory-slot empty">${index + 1}</div>`).join("");
    const empties = Math.max(0, raid.inventoryCapacity - raid.inventorySlots);
    const emptySlots = Array.from({ length: empties }, () => `<div class="inventory-slot empty"></div>`).join("");
    const warning = raid.inventoryWarning ? `<em>${raid.inventoryWarning}</em>` : "";
    const freeSlots = Math.max(0, raid.inventoryCapacity - raid.inventorySlots);

    return `
      <strong>EVA Pack ${raid.inventorySlots}/${raid.inventoryCapacity}</strong>
      <span class="inventory-capacity">${freeSlots} free slot${freeSlots === 1 ? "" : "s"} | Tab close | X drop selected</span>
      <button type="button" class="bag-close-button" data-loot-action="close-bag">Close EVA Pack</button>
      <div class="inventory-grid">${slots}${emptySlots}</div>
      ${this.formatLootContainer(raid)}
      ${warning}
    `;
  }

  private formatInventorySlot(item: InventorySlot, selectedSlotId: string | null): string {
    const definition = getItemDefinition(item.type);
    const color = colorToCss(themeConfig.rarityColors[definition.rarity]);
    const selected = item.id === selectedSlotId;
    return `
      <div class="inventory-slot filled${selected ? " selected" : ""}" data-loot-action="select" data-slot-id="${item.id}" style="--rarity-color: ${color}">
        <span>${item.label}</span>
        <small>${item.quantity > 1 ? `x${item.quantity}` : `${item.slots} slot${item.slots > 1 ? "s" : ""}`} | ${definition.rarity}</small>
        ${this.formatItemTooltip(item.type, item.quantity)}
        <footer class="inventory-slot-actions">
          <button type="button" data-loot-action="use" data-slot-id="${item.id}">Use</button>
          <button type="button" data-loot-action="drop" data-slot-id="${item.id}">Drop</button>
          <button type="button" data-loot-action="inspect" data-slot-id="${item.id}">Inspect</button>
          <button type="button" data-loot-action="mark" data-slot-id="${item.id}">Mark</button>
        </footer>
      </div>
    `;
  }

  private formatLootContainer(raid: RaidHudState): string {
    const container = raid.lootContainer;

    if (!container) {
      return "";
    }

    const items = container.items.length > 0
      ? container.items.map((item, index) => {
        const definition = getItemDefinition(item.type);
        const color = colorToCss(themeConfig.rarityColors[definition.rarity]);
        const selected = index === raid.selectedLootIndex;
        return `
          <div class="loot-row${selected ? " selected" : ""}" style="--rarity-color: ${color}">
            <span>${item.label}</span>
            <small>${item.quantity > 1 ? `x${item.quantity}` : `${definition.slots} slot${definition.slots > 1 ? "s" : ""}`} | ${definition.rarity} | ${definition.stackable ? "stacks" : "does not stack"}</small>
            <button type="button" class="loot-take-button" data-loot-action="take" data-container-id="${container.id}" data-item-index="${index}">Take</button>
            ${this.formatItemTooltip(item.type, item.quantity)}
          </div>
        `;
      }).join("")
      : `<span class="loot-empty">Empty</span>`;

    return `
      <section class="loot-container-panel">
        <header>
          <strong>${container.title}</strong>
          <button type="button" data-loot-action="close" data-container-id="${container.id}">Close</button>
        </header>
        <div>${items}</div>
        <button type="button" data-loot-action="take-all" data-container-id="${container.id}">Take All</button>
        <small class="loot-controls-hint">F/Y = Take All | Enter/E/A = Take Selected | Esc/B = Close | Arrows/WASD/Stick = Select</small>
      </section>
    `;
  }

  private formatItemTooltip(type: LootStack["type"], quantity: number): string {
    const definition = getItemDefinition(type);
    return `
      <span class="item-tooltip">
        <strong>${definition.label}</strong>
        <span>${definition.rarity.toUpperCase()} ${definition.category}</span>
        <span>${definition.stackable ? `Stack x${quantity}` : "Non-stackable"} | ${definition.slots} slot${definition.slots > 1 ? "s" : ""}</span>
        <span>${definition.description}</span>
        <span>Value ${definition.value * quantity} | ${definition.use}</span>
      </span>
    `;
  }

  private formatExtraction(extraction: ExtractionState): string {
    if (!extraction.insideZone) {
      return extraction.cancelReason ? `<strong>${this.formatExtractionCancel(extraction.cancelReason)}</strong>` : "";
    }

    const progress = Math.round(extraction.progress * 100);
    const label = extraction.extracting
      ? `Lunar Ascender locking ${extraction.secondsRemaining.toFixed(1)}s`
      : extraction.cancelReason
        ? this.formatExtractionCancel(extraction.cancelReason)
        : "Hold E for Lunar Ascender";

    return `
      <strong>${label}</strong>
      <small>${extraction.extracting ? "Stay in the ascender beam. Taking damage cancels extraction." : "Hold interact to extract."}</small>
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

  private formatStealth(noise: NoiseSystemState): string {
    const detail = noise.recentType
      ? `${noise.recentType.replace("-", " ")} ${Math.round(noise.recentRadius)}m`
      : "No recent sound";

    return `
      <strong>${noise.stealthLabel}</strong>
      <span>${detail}</span>
    `;
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

  private formatObjective(objective: ObjectiveState): string {
    const distance = Math.max(0, Math.round(objective.distance));
    const progress = Math.round(objective.progress * 100);
    const progressBar = objective.progress > 0 && !objective.completed
      ? `<div><span style="width: ${progress}%"></span></div>`
      : "";

    return `
      <strong>${objective.completed ? "Objective Complete" : objective.title}</strong>
      <span>${objective.description}</span>
      <em>${distance}m</em>
      ${progressBar}
    `;
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
        <b>${objective.contractLinked ? "CONTRACT: " : ""}${objective.title}</b>
        <em>${Math.round(objective.distance)}m | ${objective.poiName} | Threat ${objective.threatRating} | ${objective.rewardRarity}</em>
        ${progressBar}
      </span>
    `;
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
      return "";
    }

    const waitingForRevive = raid.outcome === "active" && !playerHealth.alive;

    if (waitingForRevive) {
      return `
        <strong>Waiting for revive</strong>
        <span>Hold N / B to abandon the Crater Run and return to the habitat.</span>
        <button type="button" data-raid-action="return-hq">Return to Habitat</button>
        <em>Leaving now counts as LEFT DOWNED and loses carried EVA Pack loot.</em>
        <div class="return-hq-progress"><span style="width: ${Math.round(raid.returnToHqProgress * 100)}%"></span></div>
      `;
    }

    const summary = raid.resultSummary;
    const gained = this.formatLootList(summary.lootExtracted, "No loot extracted");
    const lost = this.formatLootList(summary.lootLost, "No carried loot lost");
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
        <div><b>Survival</b><span>${summary.survivalStatus}</span></div>
        <div><b>Run Duration</b><span>${this.formatDuration(summary.raidDurationSeconds)}</span></div>
        <div><b>Enemies Eliminated</b><span>${summary.enemiesEliminated}</span></div>
        <div><b>Loot Extracted</b><span>${gained}</span></div>
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
      return "Reloading";
    }

    if (weapon.dryFireFeedback) {
      return "Empty";
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
