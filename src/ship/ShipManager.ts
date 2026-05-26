import { getItemDefinition } from "../raid/ItemDefinitions";
import type { LootStack, RaidInventory } from "../raid/RaidInventory";

export type LandingQuality = "clean" | "rough" | "damaged";

export type ShipState = Readonly<{
  integrity: number;
  cargoUsed: number;
  cargoCapacity: number;
  maxCargoCapacity: number;
  landingQuality: LandingQuality;
  specialCargoEligible: boolean;
  statusLabel: string;
}>;

export type ShipDepositResult = Readonly<{
  deposited: LootStack[];
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
      this.currentState = this.createState(this.currentState.landingQuality, this.currentState.cargoUsed + slot.slots);
    }

    if (deposited.length > 0) {
      return { deposited, message: "Cargo transferred" };
    }

    return {
      deposited,
      message: raidInventory.usedSlots > 0 ? "Ship cargo full" : "No EVA Pack cargo to transfer",
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

  private createState(landingQuality: LandingQuality, cargoUsed: number): ShipState {
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
      statusLabel: this.getStatusLabel(landingQuality, integrity),
    };
  }

  private getStatusLabel(landingQuality: LandingQuality, integrity: number): string {
    if (landingQuality === "clean") {
      return "Route stable";
    }

    if (landingQuality === "rough") {
      return `Cargo condition limited (${integrity}%)`;
    }

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
