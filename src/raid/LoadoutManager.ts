import {
  attachmentDefinitions,
  attachmentIdFromLootType,
  type AttachmentId,
  type AttachmentLoadout,
  type AttachmentSlot,
} from "../weapons/AttachmentDefinitions";
import { weaponIdFromLootType, type WeaponId } from "../weapons/WeaponDefinitions";
import { getItemDefinition, getItemUseProfile, itemDefinitions, type LootType } from "./ItemDefinitions";
import { loadoutConfig, meleeOptions, sidearmOptions, type Loadout } from "./Loadout";
import type { LootStack } from "./RaidInventory";

export type EquipmentSlot =
  | "primary"
  | "sidearm"
  | "melee"
  | "armor"
  | "backpack"
  | "tactical"
  | "consumable1"
  | "consumable2";

export type LoadoutFilter =
  | "all"
  | "weapons"
  | "armor"
  | "consumables"
  | "materials"
  | "attachments"
  | "objective"
  | "rarity";

export type LoadoutManagerState = Readonly<{
  selectedType: LootType | null;
  filter: LoadoutFilter;
  primaryWeaponId: WeaponId | null;
  sidearmWeaponId: WeaponId;
  meleeWeaponId: WeaponId | null;
  attachments: AttachmentLoadout;
  armorType: "armor-light" | null;
  backpackType: "backpack-upgrade" | "elite-backpack" | null;
  tacticalToolType: "tool-flashlight" | null;
  consumable1Type: "medkit" | "advanced-medkit" | "bandage" | "armor-plate" | "improved-armor-plate" | null;
  consumable2Type: "medkit" | "advanced-medkit" | "bandage" | "armor-plate" | "improved-armor-plate" | null;
  raidBag: LootStack[];
}>;

const storageKey = "darc-raiders.loadout-manager.v1";
const defaultState: LoadoutManagerState = {
  selectedType: "weapon-pistol",
  filter: "all",
  primaryWeaponId: null,
  sidearmWeaponId: "pistol",
  meleeWeaponId: null,
  attachments: {},
  armorType: "armor-light",
  backpackType: null,
  tacticalToolType: "tool-flashlight",
  consumable1Type: "medkit",
  consumable2Type: null,
  raidBag: [],
};

const consumableTypes = new Set<LootType>(["medkit", "advanced-medkit", "bandage", "armor-plate", "improved-armor-plate"]);
const materialTypes = new Set<LootType>([
  "credits",
  "scrap",
  "cloth",
  "ammo",
  "battery",
  "scanner-battery",
  "electronics",
  "weapon-parts",
  "alien-chitin",
  "lumen-essence",
  "acid-gland",
  "crater-tissue",
  "infected-sample",
]);
const isLootType = (type: unknown): type is LootType =>
  typeof type === "string" && type in itemDefinitions;
const isLoadoutFilter = (filter: unknown): filter is LoadoutFilter =>
  typeof filter === "string" && loadoutFilters.includes(filter as LoadoutFilter);

export class LoadoutManager {
  private state: LoadoutManagerState = this.load();

  public get snapshot(): LoadoutManagerState {
    return {
      ...this.state,
      raidBag: this.state.raidBag.map((item) => ({ ...item })),
    };
  }

  public initialize(loadout: Loadout, stashItems: readonly LootStack[]): void {
    this.applyToLoadout(loadout, stashItems);
  }

  public setFilter(filter: LoadoutFilter): void {
    this.state = { ...this.state, filter };
    this.save();
  }

  public select(type: LootType): void {
    this.state = { ...this.state, selectedType: type };
    this.save();
  }

  public equipSelected(loadout: Loadout, stashItems: readonly LootStack[]): string {
    const type = this.state.selectedType;

    if (!type) {
      return "Select an item first";
    }

    return this.equipType(type, loadout, stashItems);
  }

  public equipType(type: LootType, loadout: Loadout, stashItems: readonly LootStack[]): string {
    const quantity = this.availableQuantity(stashItems, type);

    if (quantity <= 0 && type !== "weapon-pistol") {
      return "None available";
    }

    const weaponId = weaponIdFromLootType(type);

    if (weaponId) {
      if (sidearmOptions.includes(weaponId)) {
        loadout.equipSidearm(weaponId);
        this.state = { ...this.state, sidearmWeaponId: weaponId };
        this.save();
        return `${getItemDefinition(type).label} equipped as sidearm`;
      }

      if (meleeOptions.includes(weaponId)) {
        loadout.equipMelee(weaponId);
        this.state = { ...this.state, meleeWeaponId: weaponId };
        this.save();
        return `${getItemDefinition(type).label} equipped as melee`;
      }

      loadout.equipPrimary(weaponId);
      this.state = { ...this.state, primaryWeaponId: weaponId };
      this.save();
      return `${getItemDefinition(type).label} equipped`;
    }

    const attachmentId = attachmentIdFromLootType(type);

    if (attachmentId) {
      const attachment = attachmentDefinitions[attachmentId];
      loadout.equipAttachment(attachment.slot, attachmentId);
      this.state = {
        ...this.state,
        attachments: {
          ...this.state.attachments,
          [attachment.slot]: attachmentId,
        },
      };
      this.save();
      return `${attachment.name} equipped`;
    }

    if (type === "armor-light") {
      this.state = { ...this.state, armorType: "armor-light" };
      this.save();
      return "Light armor equipped";
    }

    if (type === "backpack-upgrade" || type === "elite-backpack") {
      this.state = { ...this.state, backpackType: type };
      this.save();
      return `${getItemDefinition(type).label} equipped`;
    }

    if (type === "tool-flashlight") {
      this.state = { ...this.state, tacticalToolType: "tool-flashlight" };
      this.save();
      return "Flashlight equipped";
    }

    if (consumableTypes.has(type)) {
      const nextState = this.state.consumable1Type === null
        ? { ...this.state, consumable1Type: type as LoadoutManagerState["consumable1Type"] }
        : { ...this.state, consumable2Type: type as LoadoutManagerState["consumable2Type"] };
      this.state = nextState;
      this.syncConsumablesToLoadout(loadout, stashItems);
      this.save();
      return `${getItemDefinition(type).label} slotted`;
    }

    return "Wrong slot";
  }

  public unequip(slot: EquipmentSlot, loadout: Loadout, stashItems: readonly LootStack[]): string {
    if (slot === "primary") {
      loadout.equipPrimary(null);
      this.state = { ...this.state, primaryWeaponId: null };
      this.save();
      return "Primary cleared";
    }

    if (slot === "sidearm") {
      loadout.equipSidearm("pistol");
      this.state = { ...this.state, sidearmWeaponId: "pistol" };
      this.save();
      return "Sidearm reset to starter pistol";
    }

    if (slot === "melee") {
      loadout.equipMelee(null);
      this.state = { ...this.state, meleeWeaponId: null };
      this.save();
      return "Melee slot cleared";
    }

    if (slot === "armor") {
      this.state = { ...this.state, armorType: null };
    } else if (slot === "backpack") {
      this.state = { ...this.state, backpackType: null };
    } else if (slot === "tactical") {
      this.state = { ...this.state, tacticalToolType: null };
    } else if (slot === "consumable1") {
      this.state = { ...this.state, consumable1Type: null };
      this.syncConsumablesToLoadout(loadout, stashItems);
    } else if (slot === "consumable2") {
      this.state = { ...this.state, consumable2Type: null };
      this.syncConsumablesToLoadout(loadout, stashItems);
    }

    this.save();
    return "Slot cleared";
  }

  public moveSelectedToRaidBag(stashItems: readonly LootStack[]): string {
    const type = this.state.selectedType;

    if (!type) {
      return "Select an item first";
    }

    return this.moveToRaidBag(type, stashItems);
  }

  public moveToRaidBag(type: LootType, stashItems: readonly LootStack[]): string {
    const definition = getItemDefinition(type);
    const profile = getItemUseProfile(type);

    if (!profile.usableInRaid) {
      return definition.category === "material" ? "Material only" : "No compatible slot";
    }

    if (this.availableQuantity(stashItems, type) <= 0) {
      return "None available";
    }

    const nextBag = this.addToBagPreview(type, 1);

    if (this.calculateSlots(nextBag) > this.raidBagCapacity) {
      return "EVA Pack full";
    }

    this.state = { ...this.state, raidBag: nextBag };
    this.save();
    return `${definition.label} moved to EVA Pack`;
  }

  public removeFromRaidBag(type: LootType): string {
    const nextBag = this.removeOneFromBag(type);
    const changed = nextBag.length !== this.state.raidBag.length ||
      nextBag.some((item, index) => item.quantity !== this.state.raidBag[index]?.quantity);

    if (!changed) {
      return "Item not in EVA Pack";
    }

    this.state = { ...this.state, raidBag: nextBag };
    this.save();
    return `${getItemDefinition(type).label} returned to stash`;
  }

  public get raidBagCapacity(): number {
    return this.state.backpackType === "elite-backpack" ? 42 : this.state.backpackType ? 34 : 30;
  }

  public get raidBagUsedSlots(): number {
    return this.calculateSlots(this.state.raidBag);
  }

  public applyToLoadout(loadout: Loadout, stashItems: readonly LootStack[]): void {
    loadout.equipPrimary(this.state.primaryWeaponId);
    loadout.equipSidearm(this.state.sidearmWeaponId);
    loadout.equipMelee(this.state.meleeWeaponId);
    for (const [slot, attachmentId] of Object.entries(this.state.attachments) as Array<[AttachmentSlot, AttachmentId]>) {
      loadout.equipAttachment(slot, attachmentId);
    }
    this.syncConsumablesToLoadout(loadout, stashItems);
    this.save();
  }

  public captureFromLoadout(loadout: Loadout): void {
    const snapshot = loadout.snapshot;
    this.state = {
      ...this.state,
      primaryWeaponId: snapshot.primaryWeaponId,
      sidearmWeaponId: snapshot.sidearmWeaponId,
      meleeWeaponId: snapshot.meleeWeaponId,
      attachments: { ...snapshot.attachments },
    };
    this.save();
  }

  public raidBagItems(): LootStack[] {
    return this.state.raidBag.map((item) => ({ ...item }));
  }

  public availableQuantity(stashItems: readonly LootStack[], type: LootType): number {
    const stashQuantity = stashItems.find((item) => item.type === type)?.quantity ?? 0;
    const bagQuantity = this.state.raidBag.find((item) => item.type === type)?.quantity ?? 0;
    const equippedQuantity = this.equippedQuantity(type);
    return Math.max(0, stashQuantity - bagQuantity - equippedQuantity);
  }

  public matchesFilter(type: LootType, filter = this.state.filter): boolean {
    const definition = getItemDefinition(type);

    if (filter === "all") {
      return true;
    }

    if (filter === "weapons") {
      return type.startsWith("weapon-");
    }

    if (filter === "armor") {
      return type.startsWith("armor") || type === "backpack-upgrade" || type === "elite-backpack";
    }

    if (filter === "consumables") {
      return definition.category === "consumable";
    }

    if (filter === "materials") {
      return materialTypes.has(type);
    }

    if (filter === "attachments") {
      return type.startsWith("attachment-");
    }

    if (filter === "objective") {
      return definition.category === "objective";
    }

    return definition.rarity === "epic" || definition.rarity === "legendary" || definition.rarity === "core";
  }

  private syncConsumablesToLoadout(loadout: Loadout, stashItems: readonly LootStack[]): void {
    const medkits = [this.state.consumable1Type, this.state.consumable2Type].filter((type) => type === "medkit").length;
    const stashMedkits = stashItems.find((item) => item.type === "medkit")?.quantity ?? 0;
    loadout.setMedkits(Math.min(medkits, stashMedkits, loadoutConfig.maxMedkits));
  }

  private equippedQuantity(type: LootType): number {
    const weaponId = weaponIdFromLootType(type);

    if (weaponId && (weaponId === this.state.primaryWeaponId || weaponId === this.state.sidearmWeaponId || weaponId === this.state.meleeWeaponId)) {
      return 1;
    }

    if (Object.values(this.state.attachments).some((attachmentId) => {
      const attachment = attachmentId ? attachmentDefinitions[attachmentId] : null;
      return attachment?.lootType === type;
    })) {
      return 1;
    }

    if (type === this.state.armorType || type === this.state.backpackType || type === this.state.tacticalToolType) {
      return 1;
    }

    return [this.state.consumable1Type, this.state.consumable2Type].filter((item) => item === type).length;
  }

  private addToBagPreview(type: LootType, quantity: number): LootStack[] {
    const definition = getItemDefinition(type);

    if (definition.stackable) {
      const existing = this.state.raidBag.find((item) => item.type === type);

      if (existing) {
        return this.state.raidBag.map((item) => item.type === type
          ? { ...item, quantity: item.quantity + quantity }
          : item);
      }
    }

    return [
      ...this.state.raidBag,
      {
        type,
        label: definition.label,
        quantity,
      },
    ];
  }

  private removeOneFromBag(type: LootType): LootStack[] {
    let removed = false;

    return this.state.raidBag.flatMap((item) => {
      if (removed || item.type !== type) {
        return [item];
      }

      removed = true;
      return item.quantity > 1 ? [{ ...item, quantity: item.quantity - 1 }] : [];
    });
  }

  private calculateSlots(items: readonly LootStack[]): number {
    return items.reduce((total, item) => {
      const definition = getItemDefinition(item.type);
      return total + (definition.stackable ? definition.slots : definition.slots * item.quantity);
    }, 0);
  }

  private load(): LoadoutManagerState {
    try {
      const raw = window.localStorage.getItem(storageKey);

      if (!raw) {
        return defaultState;
      }

      return this.sanitizeState(JSON.parse(raw) as Partial<LoadoutManagerState>);
    } catch (error) {
      console.warn("Loadout settings failed to load; using defaults.", error);
      return defaultState;
    }
  }

  private sanitizeState(candidate: Partial<LoadoutManagerState>): LoadoutManagerState {
    const attachments: AttachmentLoadout = {};

    for (const [slot, attachmentId] of Object.entries(candidate.attachments ?? {}) as Array<[AttachmentSlot, AttachmentId]>) {
      const attachment = attachmentDefinitions[attachmentId];

      if (attachment?.slot === slot) {
        attachments[slot] = attachmentId;
      }
    }

    return {
      selectedType: isLootType(candidate.selectedType) ? candidate.selectedType : defaultState.selectedType,
      filter: isLoadoutFilter(candidate.filter) ? candidate.filter : defaultState.filter,
      primaryWeaponId: candidate.primaryWeaponId && ["smg", "shotgun", "assault-rifle", "rifle"].includes(candidate.primaryWeaponId)
        ? candidate.primaryWeaponId
        : defaultState.primaryWeaponId,
      sidearmWeaponId: candidate.sidearmWeaponId && sidearmOptions.includes(candidate.sidearmWeaponId)
        ? candidate.sidearmWeaponId
        : defaultState.sidearmWeaponId,
      meleeWeaponId: candidate.meleeWeaponId && meleeOptions.includes(candidate.meleeWeaponId)
        ? candidate.meleeWeaponId
        : defaultState.meleeWeaponId,
      attachments,
      armorType: candidate.armorType === "armor-light" ? "armor-light" : defaultState.armorType,
      backpackType: candidate.backpackType === "backpack-upgrade" || candidate.backpackType === "elite-backpack"
        ? candidate.backpackType
        : defaultState.backpackType,
      tacticalToolType: candidate.tacticalToolType === "tool-flashlight" ? "tool-flashlight" : defaultState.tacticalToolType,
      consumable1Type: candidate.consumable1Type && consumableTypes.has(candidate.consumable1Type)
        ? candidate.consumable1Type as LoadoutManagerState["consumable1Type"]
        : defaultState.consumable1Type,
      consumable2Type: candidate.consumable2Type && consumableTypes.has(candidate.consumable2Type)
        ? candidate.consumable2Type as LoadoutManagerState["consumable2Type"]
        : defaultState.consumable2Type,
      raidBag: Array.isArray(candidate.raidBag)
        ? candidate.raidBag
          .filter((item) => item !== null &&
            typeof item === "object" &&
            isLootType((item as Partial<LootStack>).type) &&
            getItemUseProfile((item as Partial<LootStack>).type as LootType).usableInRaid &&
            Number.isFinite((item as Partial<LootStack>).quantity) &&
            ((item as Partial<LootStack>).quantity ?? 0) > 0)
          .map((item) => ({
            type: item.type,
            label: getItemDefinition(item.type).label,
            quantity: Math.max(1, Math.floor(item.quantity)),
          }))
        : defaultState.raidBag,
    };
  }

  private save(): void {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(this.state));
    } catch {
      // Local persistence is best effort until profile sync exists.
    }
  }
}

export const loadoutFilters: LoadoutFilter[] = [
  "all",
  "weapons",
  "armor",
  "consumables",
  "materials",
  "attachments",
  "objective",
  "rarity",
];

export const equipmentSlotLabels: Record<EquipmentSlot, string> = {
  primary: "Primary weapon",
  sidearm: "Sidearm",
  melee: "Melee",
  armor: "Armor",
  backpack: "Backpack",
  tactical: "Tactical tool",
  consumable1: "Consumable 1",
  consumable2: "Consumable 2",
};
