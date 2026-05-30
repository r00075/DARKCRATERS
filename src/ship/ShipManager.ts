import { getItemDefinition } from "../raid/ItemDefinitions";
import type { LootStack, RaidInventory } from "../raid/RaidInventory";
import type { LootType } from "../raid/ItemDefinitions";
import type { ShipModuleManager } from "./ShipModuleManager";

export type LandingQuality = "clean" | "rough" | "damaged";
export type ShipReadiness = "offline" | "warming" | "ready" | "compromised";
export type ShipCargoRisk = "secure" | "unstable" | "compromised";
export type ShipRepairStatus = "stable" | "patched" | "repaired" | "unrepaired";
export type ShipRepairChoice = "quick-patch" | "full-stabilize";

export type ShipState = Readonly<{
  integrity: number;
  cargoUsed: number;
  cargoCapacity: number;
  maxCargoCapacity: number;
  landingQuality: LandingQuality;
  specialCargoEligible: boolean;
  statusLabel: string;
  readiness: ShipReadiness;
  cargoRisk: ShipCargoRisk;
  repaired: boolean;
  repairStatus: ShipRepairStatus;
  heavyCargoSecured: boolean;
  heavyCargoLabel: string | null;
}>;

export type ShipDepositResult = Readonly<{
  deposited: LootStack[];
  transferredSlots: number;
  message: string;
}>;

export type ShipRepairResult = Readonly<{
  repaired: boolean;
  scrapCost: number;
  spent: Partial<Record<LootType, number>>;
  message: string;
}>;

const shipConfig = {
  maxCargoCapacity: 12,
  cleanLandingChance: 0.58,
  roughLandingChance: 0.32,
  roughIntegrity: 75,
  damagedIntegrity: 45,
  roughCargoCapacity: 9,
  damagedCargoCapacity: 5,
} as const;

export const heavyCargoTypes = [
  "helium-drill-core",
  "lumen-relic-mass",
  "reactor-spindle",
  "black-box-survey-crate",
  "sealed-mining-cache",
] as const satisfies readonly LootType[];

const isHeavyCargoType = (type: LootType): boolean => heavyCargoTypes.includes(type as (typeof heavyCargoTypes)[number]);

export class ShipManager {
  private cargo: LootStack[] = [];
  private heavyCargoLabel: string | null = null;
  private currentState: ShipState = this.createState("clean", 0);
  private modules: ShipModuleManager | null = null;

  public setModuleManager(modules: ShipModuleManager): ShipState {
    this.modules = modules;
    this.currentState = this.createState(
      this.currentState.landingQuality,
      this.currentState.cargoUsed,
      this.currentState.readiness,
      this.currentState.repaired,
      this.currentState.repairStatus,
    );
    return this.state;
  }

  public get state(): ShipState {
    return { ...this.currentState };
  }

  public get cargoItems(): LootStack[] {
    return this.cargo.map((item) => ({ ...item }));
  }

  public initializeForRaid(roll = Math.random()): ShipState {
    const landingQuality = this.rollLandingQuality(roll);
    return this.initializeForRaidWithQuality(landingQuality);
  }

  public initializeForRaidWithQuality(landingQuality: LandingQuality): ShipState {
    this.cargo = [];
    this.heavyCargoLabel = null;
    this.currentState = this.createState(landingQuality, 0);
    return this.state;
  }

  public secureHeavyCargo(label: string): ShipState {
    this.heavyCargoLabel = label;
    this.currentState = this.createState(
      this.currentState.landingQuality,
      this.currentState.cargoUsed,
      this.currentState.readiness,
      this.currentState.repaired,
      this.currentState.repairStatus,
    );
    return this.state;
  }

  public clearHeavyCargo(): ShipState {
    this.heavyCargoLabel = null;
    this.currentState = this.createState(
      this.currentState.landingQuality,
      this.currentState.cargoUsed,
      this.currentState.readiness,
      this.currentState.repaired,
      this.currentState.repairStatus,
    );
    return this.state;
  }

  public updateExtractionReadiness(extractionAvailable: boolean): ShipState {
    const nextReadiness = this.getReadinessForExtraction(this.currentState, extractionAvailable);
    if (nextReadiness !== this.currentState.readiness) {
      this.currentState = this.createState(
        this.currentState.landingQuality,
        this.currentState.cargoUsed,
        nextReadiness,
        this.currentState.repaired,
        this.currentState.repairStatus,
      );
    }
    return this.state;
  }

  public canStoreSpecialCargo(): boolean {
    return (
      this.currentState.specialCargoEligible &&
      this.currentState.landingQuality === "clean" &&
      this.currentState.integrity >= 100 &&
      this.currentState.cargoCapacity === this.currentState.maxCargoCapacity
    );
  }

  public canStoreHeavyCargo(): boolean {
    return Boolean(this.modules?.heavyCargoEnabled);
  }

  public depositFromRaidInventory(raidInventory: RaidInventory): ShipDepositResult {
    const deposited: LootStack[] = [];
    let transferredSlots = 0;

    for (const slot of raidInventory.inventorySlots) {
      if (isHeavyCargoType(slot.type) && !this.canStoreHeavyCargo()) {
        continue;
      }

      if (this.currentState.cargoUsed + slot.slots > this.currentState.cargoCapacity) {
        continue;
      }

      const removed = raidInventory.dropSlot(slot.id);

      if (!removed) {
        continue;
      }

      this.cargo = this.mergeCargoStack(this.cargo, removed);
      deposited.push(removed);
      transferredSlots += slot.slots;
      this.currentState = this.createState(
        this.currentState.landingQuality,
        this.currentState.cargoUsed + slot.slots,
        this.currentState.readiness,
        this.currentState.repaired,
        this.currentState.repairStatus,
      );
    }

    if (deposited.length > 0) {
      return { deposited, transferredSlots, message: "Cargo transferred" };
    }

    return {
      deposited,
      transferredSlots,
      message: raidInventory.inventorySlots.some((slot) => isHeavyCargoType(slot.type)) && !this.canStoreHeavyCargo()
        ? "Cargo module insufficient"
        : raidInventory.usedSlots > 0 ? "Cargo capacity reached" : "No carried cargo",
    };
  }

  public repair(
    choice: ShipRepairChoice,
    spendMaterials: (cost: Partial<Record<LootType, number>>) => boolean,
  ): ShipRepairResult {
    if (this.currentState.landingQuality === "clean" || this.currentState.repairStatus === "stable") {
      return { repaired: false, scrapCost: 0, spent: {}, message: "Ship systems stable" };
    }

    const cost = this.repairCost(choice, this.currentState.landingQuality);

    if (!spendMaterials(cost)) {
      return { repaired: false, scrapCost: cost.scrap ?? 0, spent: cost, message: "Not enough materials" };
    }

    const readiness = choice === "full-stabilize" || this.currentState.landingQuality === "rough"
      ? "ready"
      : this.currentState.readiness === "ready"
        ? "ready"
        : "warming";
    const status: ShipRepairStatus = choice === "quick-patch" ? "patched" : "repaired";
    this.currentState = this.createState(
      this.currentState.landingQuality,
      this.currentState.cargoUsed,
      readiness,
      true,
      status,
    );

    return {
      repaired: true,
      scrapCost: cost.scrap ?? 0,
      spent: cost,
      message: choice === "quick-patch"
        ? "Ship systems patched"
        : this.currentState.landingQuality === "rough" ? "Ship systems stabilized" : "Cargo bay systems stabilized",
    };
  }

  public repairCost(choice: ShipRepairChoice, landingQuality = this.currentState.landingQuality): Partial<Record<LootType, number>> {
    if (landingQuality === "clean") {
      return {};
    }

    if (choice === "quick-patch") {
      return { scrap: landingQuality === "rough" ? 3 : 8 };
    }

    return landingQuality === "rough"
      ? { scrap: 8, "weapon-parts": 1 }
      : { scrap: 18, "weapon-parts": 2, electronics: 1 };
  }

  private rollLandingQuality(roll: number): LandingQuality {
    if (roll < shipConfig.cleanLandingChance) {
      return "clean";
    }

    if (roll < shipConfig.cleanLandingChance + shipConfig.roughLandingChance) {
      return "rough";
    }

    return "damaged";
  }

  private createState(
    landingQuality: LandingQuality,
    cargoUsed: number,
    readiness = this.getInitialReadiness(landingQuality),
    repaired = false,
    repairStatus = this.getRepairStatus(landingQuality, repaired),
  ): ShipState {
    const maxCargoCapacity = shipConfig.maxCargoCapacity + (this.modules?.cargoCapacityBonus ?? 0);
    const integrity = landingQuality === "clean"
      ? 100
      : landingQuality === "rough"
        ? shipConfig.roughIntegrity
        : shipConfig.damagedIntegrity;
    const cargoCapacity = landingQuality === "clean"
      ? maxCargoCapacity
      : landingQuality === "rough"
        ? Math.min(maxCargoCapacity, shipConfig.roughCargoCapacity + (this.modules?.cargoCapacityBonus ?? 0))
        : Math.min(maxCargoCapacity, shipConfig.damagedCargoCapacity + (this.modules?.cargoCapacityBonus ?? 0));
    const specialCargoEligible = landingQuality === "clean" && integrity >= 100 && cargoCapacity === maxCargoCapacity;

    return {
      integrity,
      cargoUsed: Math.min(cargoCapacity, cargoUsed),
      cargoCapacity,
      maxCargoCapacity,
      landingQuality,
      specialCargoEligible,
      statusLabel: this.getStatusLabel(landingQuality, integrity, repaired),
      readiness,
      cargoRisk: this.getCargoRisk(landingQuality),
      repaired,
      repairStatus,
      heavyCargoSecured: this.heavyCargoLabel !== null,
      heavyCargoLabel: this.heavyCargoLabel,
    };
  }

  private getInitialReadiness(landingQuality: LandingQuality): ShipReadiness {
    if (landingQuality === "clean") {
      return "offline";
    }

    return landingQuality === "rough" ? "warming" : "compromised";
  }

  private getReadinessForExtraction(state: ShipState, extractionAvailable: boolean): ShipReadiness {
    if (state.landingQuality === "damaged" && !state.repaired) {
      return "compromised";
    }

    if (state.repaired && state.landingQuality === "damaged" && !extractionAvailable) {
      return "warming";
    }

    if (state.repaired && state.landingQuality === "rough") {
      return "ready";
    }

    if (extractionAvailable) {
      return "ready";
    }

    return this.getInitialReadiness(state.landingQuality);
  }

  private getCargoRisk(landingQuality: LandingQuality): ShipCargoRisk {
    if (landingQuality === "clean") {
      return "secure";
    }

    if (landingQuality === "rough" && this.modules?.cargoModule.roughRiskReduction) {
      return "secure";
    }

    return landingQuality === "rough" ? "unstable" : "compromised";
  }

  private getRepairStatus(landingQuality: LandingQuality, repaired: boolean): ShipRepairStatus {
    if (landingQuality === "clean") {
      return "stable";
    }

    return repaired ? "repaired" : "unrepaired";
  }

  private getStatusLabel(landingQuality: LandingQuality, integrity: number, repaired: boolean): string {
    if (landingQuality === "clean") {
      return "Route stable";
    }

    if (landingQuality === "rough") {
      if (repaired) {
        return "Route stabilized";
      }

      // TODO: Later passes can add handling delay, repair costs, extraction cooldowns,
      // and cargo risk without changing the current Phase 1/2 result rules.
      return `Cargo condition limited (${integrity}%)`;
    }

    if (repaired) {
      return "Cargo bay patched";
    }

    // TODO: Damaged landings should eventually feed reduced usable cargo, theft/damage
    // rules, field repairs, ship extraction reliability, cargo loss chance on player
    // death, enemy sabotage events, ship theft events, repair cost scaling by raid tier,
    // multiplayer server-authoritative ship state, squad shared cargo permissions, and
    // extraction via a ship takeoff sequence.
    return `Return systems degraded (${integrity}%)`;
  }

  private mergeCargoStack(items: LootStack[], next: LootStack): LootStack[] {
    const definition = getItemDefinition(next.type);

    if (!definition.stackable) {
      return [...items, next];
    }

    const existing = items.find((item) => item.type === next.type);

    if (!existing) {
      return [...items, next];
    }

    return items.map((item) => item.type === next.type
      ? { ...item, quantity: item.quantity + next.quantity }
      : item);
  }
}
