import type {
  NetworkContainerClaimResult,
  NetworkContainerState,
  NetworkHeavyCargoActionResult,
  NetworkHeavyCargoState,
  NetworkHeavyCargoStatus,
  NetworkVec3,
  NetworkLootStack,
  NetworkObjectiveState,
  NetworkSharedWorldSnapshot,
} from "../../shared/MultiplayerProtocol";

type LootDrop = Readonly<{
  type: string;
  quantity: number;
  chance: number;
}>;

type SharedContainerDefinition = Readonly<{
  id: string;
  table: readonly LootDrop[];
  source?: "world" | "poi-reward";
}>;

type SharedContainer = {
  id: string;
  opened: boolean;
  items: NetworkLootStack[];
  lastInteractionPlayerId: string | null;
};

type SharedHeavyCargo = {
  id: string;
  itemType: string;
  label: string;
  status: NetworkHeavyCargoStatus;
  carrierPlayerId: string | null;
  position: NetworkVec3;
  shipSecured: boolean;
  pressure: NetworkHeavyCargoState["pressure"];
  pressureTrigger: NetworkHeavyCargoState["pressureTrigger"];
  lastEvent: string;
};

type POIObjectiveType =
  | "secure-cache"
  | "restore-power"
  | "hack-signal-box"
  | "clear-enemy-patrol"
  | "retrieve-core-fragment";

type POIRewardRegistration = Readonly<{
  objectiveId: string;
  objectiveType: POIObjectiveType;
  poiId: string;
  rewardChestId: string;
  registered: boolean;
  reason: "registered" | "already-registered" | "unsupported";
}>;

const poiThreatRatings: Record<string, number> = {
  "abandoned-camp": 1,
  checkpoint: 2,
  "data-shack": 3,
  warehouse: 4,
  "core-pit": 5,
};

const supportedPoiObjectiveTypes: POIObjectiveType[] = [
  "secure-cache",
  "restore-power",
  "hack-signal-box",
  "clear-enemy-patrol",
  "retrieve-core-fragment",
];

const knownPoiObjectiveRewards = new Map(
  Object.keys(poiThreatRatings).flatMap((poiId) =>
    supportedPoiObjectiveTypes.map((objectiveType) => {
      const objectiveId = `poi-objective-${poiId}-${objectiveType}`;
      return [
        objectiveId,
        {
          objectiveId,
          objectiveType,
          poiId,
          rewardChestId: `${objectiveId}-reward-chest`,
        },
      ] as const;
    }),
  ),
);

const sharedContainerDefinitions: SharedContainerDefinition[] = [
  {
    id: "landing-site-emergency-cache",
    table: [
      { type: "scrap", quantity: 2, chance: 1 },
      { type: "bandage", quantity: 1, chance: 0.62 },
      { type: "ammo", quantity: 8, chance: 0.5 },
      { type: "battery", quantity: 1, chance: 0.35 },
    ],
  },
  {
    id: "camp-supply-cache",
    table: [
      { type: "scrap", quantity: 3, chance: 1 },
      { type: "medkit", quantity: 1, chance: 0.45 },
      { type: "anti-toxin", quantity: 1, chance: 0.28 },
      { type: "ammo", quantity: 8, chance: 0.45 },
    ],
  },
  {
    id: "data-shack-lockbox",
    table: [
      { type: "scrap", quantity: 5, chance: 1 },
      { type: "electronics", quantity: 1, chance: 0.42 },
      { type: "rare-core", quantity: 1, chance: 0.16 },
      { type: "attachment-red-dot", quantity: 1, chance: 0.2 },
    ],
  },
  {
    id: "checkpoint-field-kit",
    table: [
      { type: "scrap", quantity: 2, chance: 1 },
      { type: "armor-plate", quantity: 1, chance: 0.35 },
      { type: "medkit", quantity: 1, chance: 0.7 },
      { type: "ammo", quantity: 14, chance: 0.65 },
    ],
  },
  {
    id: "warehouse-armory-crate",
    table: [
      { type: "scrap", quantity: 7, chance: 1 },
      { type: "weapon-parts", quantity: 4, chance: 0.7 },
      { type: "weapon-assault-rifle", quantity: 1, chance: 0.18 },
      { type: "attachment-suppressor", quantity: 1, chance: 0.12 },
    ],
  },
  {
    id: "warehouse-med-station",
    table: [
      { type: "medkit", quantity: 1, chance: 0.85 },
      { type: "bandage", quantity: 3, chance: 0.7 },
      { type: "anti-toxin", quantity: 1, chance: 0.48 },
      { type: "armor-plate", quantity: 1, chance: 0.42 },
    ],
  },
  {
    id: "roadside-junk-cache",
    table: [
      { type: "scrap", quantity: 2, chance: 1 },
      { type: "cloth", quantity: 2, chance: 0.65 },
      { type: "ammo", quantity: 6, chance: 0.35 },
    ],
  },
  {
    id: "ridge-miner-cache",
    table: [
      { type: "scrap", quantity: 5, chance: 1 },
      { type: "electronics", quantity: 1, chance: 0.28 },
      { type: "anti-toxin", quantity: 1, chance: 0.22 },
    ],
  },
  {
    id: "core-pit-helium-cache",
    table: [
      { type: "scrap", quantity: 8, chance: 1 },
      { type: "rare-core", quantity: 1, chance: 0.42 },
      { type: "weapon-parts", quantity: 5, chance: 0.62 },
      { type: "helium-drill-core", quantity: 1, chance: 0.08 },
    ],
  },
  {
    id: "far-side-lumen-cache",
    table: [
      { type: "alien-chitin", quantity: 4, chance: 0.72 },
      { type: "lumen-essence", quantity: 1, chance: 0.3 },
      { type: "infected-sample", quantity: 1, chance: 0.28 },
      { type: "lumen-relic-mass", quantity: 1, chance: 0.07 },
    ],
  },
];

const heliumDrillCoreCargoId = "heavy-cargo-helium-3-drill-core";
const heliumDrillCoreSourcePosition: NetworkVec3 = { x: 1, y: 0.35, z: 2 };
const heavyCargoSurfaceY = 0.35;

export class SharedWorldManager {
  public static readonly protocolVersion = 1;
  public static readonly poiRewardAuthorityVersion = 2;
  public static readonly heavyCargoAuthorityVersion = 1;
  private readonly containers = new Map<string, SharedContainer>();
  private readonly containerDefinitions = new Map<string, SharedContainerDefinition>();
  private readonly objectives = new Map<string, NetworkObjectiveState>();
  private readonly heavyCargo = new Map<string, SharedHeavyCargo>();
  private extractionUnlocked = false;
  private duplicateClaimCount = 0;
  private lastContainerEvent = "none";
  private lastObjectiveEvent = "none";

  public constructor(private readonly seed = Math.floor(Math.random() * 1_000_000_000)) {
    console.info(
      `[SharedWorld] protocol=v${SharedWorldManager.protocolVersion} poiRewardAuthority=v${SharedWorldManager.poiRewardAuthorityVersion} heavyCargoAuthority=v${SharedWorldManager.heavyCargoAuthorityVersion} enabled=true`,
    );
    console.info(`[SharedWorld] heavyCargoAuthority=v${SharedWorldManager.heavyCargoAuthorityVersion} enabled=true`);

    for (const definition of sharedContainerDefinitions) {
      this.registerContainerDefinition(definition);
    }
    this.initializeHeavyCargo();
  }

  public get snapshot(): NetworkSharedWorldSnapshot {
    const containers = Array.from(this.containers.values()).map((container) => this.toContainerState(container));
    const objectives = Array.from(this.objectives.values());
    return {
      protocolVersion: SharedWorldManager.protocolVersion,
      containers,
      objectives,
      heavyCargo: Array.from(this.heavyCargo.values()).map((cargo) => this.toHeavyCargoState(cargo)),
      extractionUnlocked: this.extractionUnlocked,
      containerCount: containers.length,
      containersDepleted: containers.filter((container) => container.depleted).length,
      duplicateClaimCount: this.duplicateClaimCount,
      lastContainerEvent: this.lastContainerEvent,
      lastObjectiveEvent: this.lastObjectiveEvent,
    };
  }

  public openContainer(containerId: string, playerId: string): NetworkContainerState | null {
    const container = this.containers.get(containerId);

    if (!container) {
      this.lastContainerEvent = `missing ${containerId}`;
      return null;
    }

    if (!container.opened) {
      container.opened = true;
      container.items = this.rollContainerItems(containerId);
    }

    container.lastInteractionPlayerId = playerId;
    this.lastContainerEvent = `open ${containerId}`;
    return this.toContainerState(container);
  }

  public getContainerDiagnostics(containerId: string): Readonly<{
    recognized: boolean;
    opened: boolean;
    depleted: boolean;
    itemCount: number;
  }> {
    const container = this.containers.get(containerId);

    if (!container) {
      return {
        recognized: false,
        opened: false,
        depleted: false,
        itemCount: 0,
      };
    }

    return {
      recognized: true,
      opened: container.opened,
      depleted: container.opened && container.items.length === 0,
      itemCount: container.items.length,
    };
  }

  public claim(
    containerId: string,
    itemIndex: number | "all",
    playerId: string,
    expectedType: string | null = null,
    expectedQuantity: number | null = null,
  ): NetworkContainerClaimResult {
    const container = this.containers.get(containerId);

    if (!container) {
      this.lastContainerEvent = `missing ${containerId}`;
      return {
        ok: false,
        reason: "missing",
        containerId,
        claimantPlayerId: playerId,
        requestedItemIndex: itemIndex,
        container: null,
        claimedItems: [],
      };
    }

    if (!container.opened) {
      container.opened = true;
      container.items = this.rollContainerItems(containerId);
    }

    if (container.items.length === 0) {
      this.duplicateClaimCount += 1;
      this.lastContainerEvent = `depleted ${containerId}`;
      return {
        ok: false,
        reason: "depleted",
        containerId,
        claimantPlayerId: playerId,
        requestedItemIndex: itemIndex,
        container: this.toContainerState(container),
        claimedItems: [],
      };
    }

    if (itemIndex !== "all" && expectedType) {
      const current = container.items[itemIndex];
      if (!current || current.type !== expectedType || (expectedQuantity !== null && current.quantity !== expectedQuantity)) {
        this.duplicateClaimCount += 1;
        this.lastContainerEvent = `stale claim ${containerId}`;
        return {
          ok: false,
          reason: "invalid",
          containerId,
          claimantPlayerId: playerId,
          requestedItemIndex: itemIndex,
          container: this.toContainerState(container),
          claimedItems: [],
        };
      }
    }

    const claimedItems = itemIndex === "all"
      ? container.items.splice(0)
      : this.claimSingle(container, itemIndex);

    if (claimedItems.length === 0) {
      this.duplicateClaimCount += 1;
      this.lastContainerEvent = `invalid claim ${containerId}`;
      return {
        ok: false,
        reason: "invalid",
        containerId,
        claimantPlayerId: playerId,
        requestedItemIndex: itemIndex,
        container: this.toContainerState(container),
        claimedItems: [],
      };
    }

    container.lastInteractionPlayerId = playerId;
    this.lastContainerEvent = `claim ${containerId}`;
    return {
      ok: true,
      reason: "claimed",
      containerId,
      claimantPlayerId: playerId,
      requestedItemIndex: itemIndex,
      container: this.toContainerState(container),
      claimedItems,
    };
  }

  public completeObjective(
    objectiveId: string,
    objectiveType: string,
    poiId: string,
    playerId: string,
  ): { state: NetworkObjectiveState; changed: boolean; reward: POIRewardRegistration | null } {
    const existing = this.objectives.get(objectiveId);

    if (existing?.completed) {
      this.lastObjectiveEvent = `duplicate ${objectiveId}`;
      return {
        state: existing,
        changed: false,
        reward: this.registerPoiRewardChest(objectiveId, objectiveType, poiId),
      };
    }

    const state: NetworkObjectiveState = {
      id: objectiveId,
      objectiveType,
      poiId,
      completed: true,
      extractionUnlocked: true,
      completedByPlayerId: playerId,
    };
    this.objectives.set(objectiveId, state);
    this.extractionUnlocked = true;
    const reward = this.registerPoiRewardChest(objectiveId, objectiveType, poiId);
    this.lastObjectiveEvent = reward?.registered
      ? `complete ${objectiveId} reward ${reward.rewardChestId}`
      : `complete ${objectiveId}`;
    return { state, changed: true, reward };
  }

  public getHeavyCargo(id: string): NetworkHeavyCargoState | null {
    const cargo = this.heavyCargo.get(id);
    return cargo ? this.toHeavyCargoState(cargo) : null;
  }

  public pickupHeavyCargo(id: string, playerId: string): NetworkHeavyCargoActionResult {
    const cargo = this.heavyCargo.get(id);

    if (!cargo) {
      return { ok: false, reason: "missing", cargo: null };
    }

    if (cargo.status === "locked") {
      return { ok: false, reason: "locked", cargo: this.toHeavyCargoState(cargo) };
    }

    if (cargo.shipSecured || cargo.status === "secured" || cargo.status === "extracted") {
      return { ok: false, reason: "already-secured", cargo: this.toHeavyCargoState(cargo) };
    }

    if (cargo.status === "carried") {
      return { ok: false, reason: "already-carried", cargo: this.toHeavyCargoState(cargo) };
    }

    if (cargo.status !== "available" && cargo.status !== "dropped") {
      return { ok: false, reason: "invalid-state", cargo: this.toHeavyCargoState(cargo) };
    }

    const pressureTriggered = cargo.pressure === "inactive";
    cargo.status = "carried";
    cargo.carrierPlayerId = playerId;
    cargo.pressure = pressureTriggered ? "triggered" : cargo.pressure === "resolved" ? "resolved" : "active";
    cargo.pressureTrigger = cargo.pressure === "resolved" ? "core secured" : "core carried";
    cargo.lastEvent = `picked up by ${playerId}`;
    return { ok: true, reason: "picked-up", cargo: this.toHeavyCargoState(cargo), pressureTriggered };
  }

  public releaseHeavyCargo(id: string, playerId: string): NetworkHeavyCargoActionResult {
    const cargo = this.heavyCargo.get(id);

    if (!cargo) {
      return { ok: false, reason: "missing", cargo: null };
    }

    if (cargo.shipSecured || cargo.status === "secured" || cargo.status === "extracted") {
      return { ok: false, reason: "already-secured", cargo: this.toHeavyCargoState(cargo) };
    }

    if (cargo.status !== "locked") {
      return { ok: false, reason: cargo.status === "carried" ? "already-carried" : "invalid-state", cargo: this.toHeavyCargoState(cargo) };
    }

    cargo.status = "available";
    cargo.carrierPlayerId = null;
    cargo.position = { ...heliumDrillCoreSourcePosition };
    cargo.lastEvent = `released by ${playerId}`;
    return { ok: true, reason: "released", cargo: this.toHeavyCargoState(cargo), pressureTriggered: false };
  }

  public dropHeavyCargo(id: string, playerId: string, position: NetworkVec3): NetworkHeavyCargoActionResult {
    const cargo = this.heavyCargo.get(id);

    if (!cargo) {
      return { ok: false, reason: "missing", cargo: null };
    }

    if (cargo.carrierPlayerId !== playerId || cargo.status !== "carried") {
      return { ok: false, reason: "not-carrier", cargo: this.toHeavyCargoState(cargo) };
    }

    cargo.status = "dropped";
    cargo.carrierPlayerId = null;
    cargo.position = this.sanitizePosition(position, cargo.position);
    if (cargo.pressure !== "resolved") {
      cargo.pressure = "active";
      cargo.pressureTrigger = "core carried";
    }
    cargo.lastEvent = `dropped by ${playerId}`;
    return { ok: true, reason: "dropped", cargo: this.toHeavyCargoState(cargo) };
  }

  public secureHeavyCargo(id: string, playerId: string): NetworkHeavyCargoActionResult {
    const cargo = this.heavyCargo.get(id);

    if (!cargo) {
      return { ok: false, reason: "missing", cargo: null };
    }

    if (cargo.shipSecured || cargo.status === "secured" || cargo.status === "extracted") {
      return { ok: false, reason: "already-secured", cargo: this.toHeavyCargoState(cargo) };
    }

    if (cargo.carrierPlayerId !== playerId || cargo.status !== "carried") {
      return { ok: false, reason: "not-carrier", cargo: this.toHeavyCargoState(cargo) };
    }

    cargo.status = "secured";
    cargo.carrierPlayerId = null;
    cargo.shipSecured = true;
    cargo.pressure = "resolved";
    cargo.pressureTrigger = "core secured";
    cargo.lastEvent = `secured by ${playerId}`;
    this.extractionUnlocked = true;
    return { ok: true, reason: "secured", cargo: this.toHeavyCargoState(cargo) };
  }

  public releaseHeavyCargoCarrier(playerId: string, position: NetworkVec3): NetworkHeavyCargoState[] {
    const changed: NetworkHeavyCargoState[] = [];
    for (const cargo of this.heavyCargo.values()) {
      if (cargo.status !== "carried" || cargo.carrierPlayerId !== playerId) {
        continue;
      }
      cargo.status = "dropped";
      cargo.carrierPlayerId = null;
      cargo.position = this.sanitizePosition(position, cargo.position);
      cargo.lastEvent = `carrier released ${playerId}`;
      changed.push(this.toHeavyCargoState(cargo));
    }
    return changed;
  }

  public markHeavyCargoExtracted(): NetworkHeavyCargoState[] {
    const changed: NetworkHeavyCargoState[] = [];
    for (const cargo of this.heavyCargo.values()) {
      if (!cargo.shipSecured || cargo.status === "extracted") {
        continue;
      }
      cargo.status = "extracted";
      cargo.pressure = "resolved";
      cargo.pressureTrigger = "core secured";
      cargo.lastEvent = "extracted";
      changed.push(this.toHeavyCargoState(cargo));
    }
    return changed;
  }

  private claimSingle(container: SharedContainer, itemIndex: number): NetworkLootStack[] {
    if (!Number.isInteger(itemIndex) || itemIndex < 0 || itemIndex >= container.items.length) {
      return [];
    }

    return container.items.splice(itemIndex, 1);
  }

  private rollContainerItems(containerId: string): NetworkLootStack[] {
    const definition = this.containerDefinitions.get(containerId);

    if (!definition) {
      return [];
    }

    const rolled = definition.table.flatMap((drop, index) => {
      const roll = this.deterministicUnit(`${containerId}:${index}`);
      return roll <= drop.chance ? [{ type: drop.type, quantity: drop.quantity }] : [];
    });
    return rolled.length > 0 ? rolled : [{ type: "scrap", quantity: 1 }];
  }

  private deterministicUnit(key: string): number {
    let hash = this.seed;
    for (let index = 0; index < key.length; index += 1) {
      hash = Math.imul(hash ^ key.charCodeAt(index), 2654435761);
    }
    return ((hash >>> 0) % 10_000) / 10_000;
  }

  private registerContainerDefinition(definition: SharedContainerDefinition): boolean {
    if (this.containerDefinitions.has(definition.id)) {
      return false;
    }

    this.containerDefinitions.set(definition.id, definition);
    this.containers.set(definition.id, {
      id: definition.id,
      opened: false,
      items: [],
      lastInteractionPlayerId: null,
    });
    return true;
  }

  private initializeHeavyCargo(): void {
    this.heavyCargo.set(heliumDrillCoreCargoId, {
      id: heliumDrillCoreCargoId,
      itemType: "helium-drill-core",
      label: "Helium-3 Drill Core",
      status: "locked",
      carrierPlayerId: null,
      position: heliumDrillCoreSourcePosition,
      shipSecured: false,
      pressure: "inactive",
      pressureTrigger: "none",
      lastEvent: "initialized at core pit",
    });
    console.info(`[HeavyCargo] initialized id=${heliumDrillCoreCargoId} state=locked`);
  }

  private registerPoiRewardChest(objectiveId: string, objectiveType: string, poiId: string): POIRewardRegistration | null {
    const known = knownPoiObjectiveRewards.get(objectiveId);
    const normalizedType = this.isPoiObjectiveType(objectiveType) ? objectiveType : known?.objectiveType;
    const normalizedPoiId = poiThreatRatings[poiId] ? poiId : known?.poiId;

    if (!known || !normalizedType || !normalizedPoiId || known.objectiveType !== normalizedType || known.poiId !== normalizedPoiId) {
      this.lastContainerEvent = `unsupported reward ${objectiveId}`;
      console.info(
        `[SharedWorld] reward chest unlock objective=${objectiveId} chest=${objectiveId}-reward-chest valid=false registered=false unlocked=false reason=unsupported`,
      );
      return known
        ? {
          objectiveId,
          objectiveType: known.objectiveType,
          poiId: known.poiId,
          rewardChestId: known.rewardChestId,
          registered: false,
          reason: "unsupported",
        }
        : null;
    }

    const rewardChestId = known.rewardChestId;
    const registered = this.registerContainerDefinition({
      id: rewardChestId,
      table: this.rewardTableForObjective(normalizedPoiId, normalizedType),
      source: "poi-reward",
    });
    this.lastContainerEvent = registered
      ? `reward registered ${rewardChestId}`
      : `reward already registered ${rewardChestId}`;
    const diagnostics = this.getContainerDiagnostics(rewardChestId);
    console.info(
      `[SharedWorld] reward chest unlock objective=${objectiveId} chest=${rewardChestId} valid=true registered=${registered ? "true" : "already-registered"} unlocked=true opened=${diagnostics.opened} depleted=${diagnostics.depleted} itemsInitialized=${diagnostics.opened ? diagnostics.itemCount : "on-open"}`,
    );
    return {
      objectiveId,
      objectiveType: normalizedType,
      poiId: normalizedPoiId,
      rewardChestId,
      registered,
      reason: registered ? "registered" : "already-registered",
    };
  }

  private isPoiObjectiveType(value: string): value is POIObjectiveType {
    return supportedPoiObjectiveTypes.includes(value as POIObjectiveType);
  }

  private rewardTableForObjective(poiId: string, objectiveType: POIObjectiveType): LootDrop[] {
    const threatRating = poiThreatRatings[poiId] ?? 1;
    const table: LootDrop[] = [
      { type: "credits", quantity: 8 + threatRating * 12, chance: 0.78 },
      { type: "scrap", quantity: 3 + threatRating * 2, chance: 1 },
      { type: "ammo", quantity: 8 + threatRating * 4, chance: 0.78 },
      { type: "electronics", quantity: Math.max(1, threatRating - 1), chance: 0.24 + threatRating * 0.08 },
      { type: "weapon-parts", quantity: Math.max(1, threatRating - 1), chance: 0.42 + threatRating * 0.07 },
      { type: "battery", quantity: 1, chance: objectiveType === "restore-power" || objectiveType === "hack-signal-box" ? 0.72 : 0.38 },
    ];

    if (threatRating >= 2) {
      table.push({ type: "attachment-red-dot", quantity: 1, chance: 0.14 + threatRating * 0.025 });
      table.push({ type: "armor-plate", quantity: 1, chance: 0.32 });
    }

    if (threatRating >= 3) {
      table.push({ type: "attachment-vertical-grip", quantity: 1, chance: 0.16 });
      table.push({ type: "attachment-extended-mag", quantity: 1, chance: 0.14 });
    }

    if (threatRating >= 4) {
      table.push({ type: "weapon-smg", quantity: 1, chance: 0.16 });
      table.push({ type: "weapon-assault-rifle", quantity: 1, chance: 0.14 });
      table.push({ type: "weapon-rifle", quantity: 1, chance: 0.06 });
      table.push({ type: "attachment-suppressor", quantity: 1, chance: 0.16 });
      table.push({ type: "dog-tag", quantity: 1, chance: 0.2 });
    }

    if (threatRating >= 5 || objectiveType === "retrieve-core-fragment") {
      table.push({ type: "rare-core", quantity: 1, chance: 0.55 });
      table.push({ type: "attachment-thermal-optic", quantity: 1, chance: 0.12 });
    }

    return table;
  }

  private toContainerState(container: SharedContainer): NetworkContainerState {
    return {
      id: container.id,
      opened: container.opened,
      depleted: container.opened && container.items.length === 0,
      items: container.items.map((item) => ({ ...item })),
      lastInteractionPlayerId: container.lastInteractionPlayerId,
    };
  }

  private toHeavyCargoState(cargo: SharedHeavyCargo): NetworkHeavyCargoState {
    return {
      id: cargo.id,
      itemType: cargo.itemType,
      label: cargo.label,
      status: cargo.status,
      carrierPlayerId: cargo.carrierPlayerId,
      position: { ...cargo.position },
      shipSecured: cargo.shipSecured,
      pressure: cargo.pressure,
      pressureTrigger: cargo.pressureTrigger,
      lastEvent: cargo.lastEvent,
    };
  }

  private sanitizePosition(position: NetworkVec3 | undefined, fallback: NetworkVec3): NetworkVec3 {
    if (!position) {
      return { ...fallback };
    }
    return {
      x: Number.isFinite(position.x) ? Math.max(-160, Math.min(160, position.x)) : fallback.x,
      y: Number.isFinite(position.y) ? Math.max(heavyCargoSurfaceY, Math.min(40, position.y)) : Math.max(heavyCargoSurfaceY, fallback.y),
      z: Number.isFinite(position.z) ? Math.max(-160, Math.min(160, position.z)) : fallback.z,
    };
  }
}
