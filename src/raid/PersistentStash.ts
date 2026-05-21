import { itemDefinitions, lootLabels, type LootType } from "./ItemDefinitions";
import type { LootStack } from "./RaidInventory";

const stashStorageKey = "extraction-shooter.prototype.stash.v1";

type SerializedStash = Partial<Record<LootType, number>>;

export class PersistentStash {
  private readonly stacks = new Map<LootType, number>();

  public constructor(private readonly storage: Storage | null = window.localStorage) {
    this.load();
  }

  public get items(): LootStack[] {
    return (Object.keys(itemDefinitions) as LootType[]).map((type) => ({
      type,
      label: lootLabels[type],
      quantity: this.stacks.get(type) ?? 0,
    }));
  }

  public get raidLevel(): number {
    let value = 0;

    for (const [type, quantity] of this.stacks) {
      value += itemDefinitions[type].value * quantity;
    }

    return Math.min(8, 1 + Math.floor(value / 75));
  }

  public addItems(items: readonly LootStack[]): void {
    for (const item of items) {
      const current = this.stacks.get(item.type) ?? 0;
      this.stacks.set(item.type, current + item.quantity);
    }

    this.save();
  }

  public remove(type: LootType, quantity: number): boolean {
    const current = this.stacks.get(type) ?? 0;

    if (current < quantity) {
      return false;
    }

    const next = current - quantity;

    if (next === 0) {
      this.stacks.delete(type);
    } else {
      this.stacks.set(type, next);
    }

    this.save();
    return true;
  }

  private load(): void {
    if (!this.storage) {
      return;
    }

    try {
      const raw = this.storage.getItem(stashStorageKey);

      if (!raw) {
        return;
      }

      const parsed = JSON.parse(raw) as SerializedStash;

      for (const type of Object.keys(itemDefinitions) as LootType[]) {
        const quantity = parsed[type] ?? 0;

        if (quantity > 0) {
          this.stacks.set(type, quantity);
        }
      }
    } catch {
      this.stacks.clear();
    }
  }

  private save(): void {
    if (!this.storage) {
      return;
    }

    const serialized: SerializedStash = {};

    for (const [type, quantity] of this.stacks) {
      serialized[type] = quantity;
    }

    try {
      this.storage.setItem(stashStorageKey, JSON.stringify(serialized));
    } catch {
      // Local persistence is best-effort until a backend stash is introduced.
    }
  }
}
