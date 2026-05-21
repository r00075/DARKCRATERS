import type { LootContainerView } from "./LootDirector";
import { RaidInventory, type InventorySlot, type LootEvent, type LootStack, type LootType } from "./RaidInventory";

export type InventoryManagerSnapshot = Readonly<{
  slots: InventorySlot[];
  items: LootStack[];
  usedSlots: number;
  capacity: number;
  activeContainer: LootContainerView | null;
  warning: string | null;
}>;

export class InventoryManager {
  public readonly raidInventory: RaidInventory;
  private activeContainerView: LootContainerView | null = null;
  private warningMessage: string | null = null;

  public constructor(defaultSlots = 30) {
    this.raidInventory = new RaidInventory(defaultSlots);
  }

  public get snapshot(): InventoryManagerSnapshot {
    return {
      slots: this.raidInventory.inventorySlots,
      items: this.raidInventory.items,
      usedSlots: this.raidInventory.usedSlots,
      capacity: this.raidInventory.capacity,
      activeContainer: this.activeContainerView,
      warning: this.warningMessage,
    };
  }

  public setActiveContainer(container: LootContainerView | null): void {
    this.activeContainerView = container;
  }

  public refreshActiveContainer(container: LootContainerView | null): void {
    this.activeContainerView = container && container.items.length > 0 ? container : null;
  }

  public add(type: LootType, quantity: number): LootEvent | null {
    const event = this.raidInventory.add(type, quantity);
    this.warningMessage = event ? null : "Inventory Full";
    return event;
  }

  public consume(type: LootType, quantity: number): boolean {
    const consumed = this.raidInventory.consume(type, quantity);
    this.warningMessage = consumed ? null : `No ${type}`;
    return consumed;
  }

  public dropSlot(slotId: string): LootEvent | null {
    const event = this.raidInventory.dropSlot(slotId);
    this.warningMessage = event ? `Dropped ${event.label}` : null;
    return event;
  }

  public clearWarning(): void {
    this.warningMessage = null;
  }

  public setWarning(message: string): void {
    this.warningMessage = message;
  }

  public clearRaid(): void {
    this.raidInventory.clear();
    this.activeContainerView = null;
    this.warningMessage = null;
  }
}
