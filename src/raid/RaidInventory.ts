import { getItemDefinition, lootLabels, type LootType } from "./ItemDefinitions";

export type { LootType } from "./ItemDefinitions";

export type LootStack = Readonly<{
  type: LootType;
  label: string;
  quantity: number;
}>;

export type LootEvent = Readonly<{
  type: LootType;
  label: string;
  quantity: number;
}>;

export type InventorySlot = Readonly<{
  id: string;
  type: LootType;
  label: string;
  quantity: number;
  slots: number;
}>;

export class RaidInventory {
  private slots: InventorySlot[] = [];
  private bonusSlots = 0;
  private nextSlotId = 1;

  public constructor(private readonly baseSlots = 30) {}

  public get capacity(): number {
    return this.baseSlots + this.bonusSlots;
  }

  public get usedSlots(): number {
    return this.slots.reduce((total, item) => total + item.slots, 0);
  }

  public get inventorySlots(): InventorySlot[] {
    return this.slots.map((slot) => ({ ...slot }));
  }

  public get items(): LootStack[] {
    const stacks = new Map<LootType, number>();

    for (const slot of this.slots) {
      stacks.set(slot.type, (stacks.get(slot.type) ?? 0) + slot.quantity);
    }

    return Array.from(stacks.entries()).map(([type, quantity]) => ({
      type,
      label: lootLabels[type],
      quantity,
    }));
  }

  public canAdd(type: LootType, quantity: number): boolean {
    if (quantity <= 0) {
      return false;
    }

    const definition = getItemDefinition(type);

    if (definition.stackable && this.slots.some((slot) => slot.type === type)) {
      return true;
    }

    const slotsNeeded = definition.stackable ? definition.slots : definition.slots * quantity;
    return this.usedSlots + slotsNeeded <= this.capacity;
  }

  public canAddAll(items: readonly LootStack[]): boolean {
    let usedSlots = this.usedSlots;
    const occupiedStackTypes = new Set(
      this.slots
        .filter((slot) => getItemDefinition(slot.type).stackable)
        .map((slot) => slot.type),
    );

    for (const item of items) {
      const definition = getItemDefinition(item.type);

      if (definition.stackable) {
        if (!occupiedStackTypes.has(item.type)) {
          usedSlots += definition.slots;
          occupiedStackTypes.add(item.type);
        }
      } else {
        usedSlots += definition.slots * item.quantity;
      }

      if (usedSlots > this.capacity) {
        return false;
      }
    }

    return true;
  }

  public add(type: LootType, quantity: number): LootEvent | null {
    if (!this.canAdd(type, quantity)) {
      return null;
    }

    const definition = getItemDefinition(type);

    if (definition.stackable) {
      const existing = this.slots.find((slot) => slot.type === type);

      if (existing) {
        this.slots = this.slots.map((slot) => slot.id === existing.id
          ? { ...slot, quantity: slot.quantity + quantity }
          : slot);
      } else {
        this.slots.push({
          id: this.createSlotId(),
          type,
          label: definition.label,
          quantity,
          slots: definition.slots,
        });
      }
    } else {
      for (let i = 0; i < quantity; i += 1) {
        this.slots.push({
          id: this.createSlotId(),
          type,
          label: definition.label,
          quantity: 1,
          slots: definition.slots,
        });
      }
    }

    if (type === "backpack-upgrade") {
      this.bonusSlots += 4;
    } else if (type === "elite-backpack") {
      this.bonusSlots += 8;
    }

    return { type, label: definition.label, quantity };
  }

  public consume(type: LootType, quantity: number): boolean {
    const available = this.items.find((item) => item.type === type)?.quantity ?? 0;

    if (available < quantity) {
      return false;
    }

    let remaining = quantity;

    this.slots = this.slots.flatMap((slot) => {
      if (slot.type !== type || remaining <= 0) {
        return [slot];
      }

      const consumed = Math.min(slot.quantity, remaining);
      remaining -= consumed;
      const nextQuantity = slot.quantity - consumed;
      return nextQuantity > 0 ? [{ ...slot, quantity: nextQuantity }] : [];
    });

    return true;
  }

  public dropSlot(slotId: string): LootEvent | null {
    const slot = this.slots.find((item) => item.id === slotId);

    if (!slot) {
      return null;
    }

    this.slots = this.slots.filter((item) => item.id !== slotId);
    return {
      type: slot.type,
      label: slot.label,
      quantity: slot.quantity,
    };
  }

  public clear(): void {
    this.slots = [];
    this.bonusSlots = 0;
    this.nextSlotId = 1;
  }

  public setBonusSlots(slots: number): void {
    this.bonusSlots = Math.max(0, Math.floor(slots));
  }

  private createSlotId(): string {
    const id = `raid-slot-${this.nextSlotId}`;
    this.nextSlotId += 1;
    return id;
  }
}
