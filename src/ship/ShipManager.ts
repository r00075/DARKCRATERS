import { getItemDefinition } from "../raid/ItemDefinitions";
import type { LootStack, RaidInventory } from "../raid/RaidInventory";

export type LandingQuality = "clean" | "rough" | "damaged";
export type ShipReadiness = "offline" | "warming" | "ready" | "compromised";
export type ShipCargoRisk = "secure" | "unstable" | "compromised";
export type ShipRepairStatus = "stable" | "repaired" | "unrepaired";

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
}>;

export type ShipDepositResult = Readonly<{
  deposited: LootStack[];
  transferredSlots: number;
  message: string;
}>;

export type ShipRepairResult = Readonly<{
  repaired: boolean;
  scrapCost: number;
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
  roughRepairCost: 5,
  damagedRepairCost: 12,
} as const;

export class ShipManager {
  private cargo: LootStack[] = [];
  private currentState: ShipState = this.createState("clean", 0);

  public get state(): ShipState {
    return { ...this.currentState };
  }

  public get cargoItems(): LootStack[] {
    return this.cargo.map((item) => ({ ...item }));
  }

  public initializeForRaid(roll = Math.random()): ShipState {
    const landingQuality = this.rollLandingQuality(roll);
    this.cargo = [];
    this.currentState = this.createState(landingQuality, 0);
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

  public depositFromRaidInventory(raidInventory: RaidInventory): ShipDepositResult {
    const deposited: LootStack[] = [];
    let transferredSlots = 0;

    for (const slot of raidInventory.inventorySlots) {
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
      );
    }

    if (deposited.length > 0) {
      return { deposited, transferredSlots, message: "Cargo transferred" };
    }

    return {
      deposited,
      transferredSlots,
      message: raidInventory.usedSlots > 0 ? "Cargo capacity reached" : "No carried cargo",
    };
  }

  public repair(spendScrap: (quantity: number) => boolean): ShipRepairResult {
    if (this.currentState.landingQuality === "clean" || this.currentState.repairStatus === "stable") {
      return { repaired: false, scrapCost: 0, message: "Ship systems stable" };
    }

    const scrapCost = this.currentState.landingQuality === "rough"
      ? shipConfig.roughRepairCost
      : shipConfig.damagedRepairCost;

    if (!spendScrap(scrapCost)) {
      return { repaired: false, scrapCost, message: "Not enough scrap" };
    }

    const readiness = this.currentState.landingQuality === "rough"
      ? "ready"
      : this.currentState.readiness === "ready"
        ? "ready"
        : "warming";
    this.currentState = this.createState(this.currentState.landingQuality, this.currentState.cargoUsed, readiness, true);

    return {
      repaired: true,
      scrapCost,
      message: this.currentState.landingQuality === "rough" ? "Ship systems stabilized" : "Cargo bay systems patched",
    };
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
  ): ShipState {
    const maxCargoCapacity = shipConfig.maxCargoCapacity;
    const integrity = landingQuality === "clean"
      ? 100
      : landingQuality === "rough"
        ? shipConfig.roughIntegrity
        : shipConfig.damagedIntegrity;
    const cargoCapacity = landingQuality === "clean"
      ? maxCargoCapacity
      : landingQuality === "rough"
        ? shipConfig.roughCargoCapacity
        : shipConfig.damagedCargoCapacity;
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
      repairStatus: this.getRepairStatus(landingQuality, repaired),
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
