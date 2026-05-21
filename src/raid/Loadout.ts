import type { WeaponId } from "../weapons/WeaponDefinitions";
import {
  attachmentDefinitions,
  attachmentIdFromLootType,
  attachmentSlots,
  type AttachmentId,
  type AttachmentLoadout,
  type AttachmentSlot,
} from "../weapons/AttachmentDefinitions";
import { buildRuntimeWeaponDefinition } from "../weapons/WeaponStatModifiers";
import { weaponDefinitions, weaponIdFromLootType, weaponLootTypes } from "../weapons/WeaponDefinitions";
import type { LootStack, LootType } from "./RaidInventory";

export type RaidLoadout = Readonly<{
  primaryWeaponId: WeaponId | null;
  sidearmWeaponId: WeaponId;
  meleeWeaponId: WeaponId | null;
  attachments: AttachmentLoadout;
  armorId: "light-armor";
  extraAmmoMags: number;
  medkits: number;
}>;

export const loadoutConfig = {
  roundsPerMagazine: 12,
  freeStarterMags: 2,
  maxExtraAmmoMags: 2,
  maxMedkits: 2,
  lightArmorDamageMultiplier: 0.85,
};

const primaryOptions: WeaponId[] = ["smg", "shotgun", "assault-rifle", "rifle"];
export const sidearmOptions: WeaponId[] = ["pistol", "burst-pistol", "revolver", "compact-smg"];
export const meleeOptions: WeaponId[] = ["knife"];

export class Loadout {
  private primaryWeaponId: WeaponId | null = null;
  private sidearmWeaponId: WeaponId = "pistol";
  private meleeWeaponId: WeaponId | null = null;
  private readonly attachments: AttachmentLoadout = {};
  private extraAmmoMags = 0;
  private medkits = 1;

  public get snapshot(): RaidLoadout {
    return {
      primaryWeaponId: this.primaryWeaponId,
      sidearmWeaponId: this.sidearmWeaponId,
      meleeWeaponId: this.meleeWeaponId,
      attachments: { ...this.attachments },
      armorId: "light-armor",
      extraAmmoMags: this.extraAmmoMags,
      medkits: this.medkits,
    };
  }

  public get primaryWeaponName(): string {
    return this.primaryWeaponId ? weaponDefinitions[this.primaryWeaponId].name : "None";
  }

  public cyclePrimary(stashItems: readonly LootStack[]): void {
    const available = primaryOptions.filter((weaponId) => {
      return this.getQuantity(stashItems, weaponLootTypes[weaponId]) > 0;
    });

    if (available.length === 0) {
      this.primaryWeaponId = null;
      return;
    }

    if (!this.primaryWeaponId) {
      this.primaryWeaponId = available[0];
      return;
    }

    const currentIndex = available.indexOf(this.primaryWeaponId);
    this.primaryWeaponId = currentIndex === -1 || currentIndex === available.length - 1
      ? null
      : available[currentIndex + 1];
  }

  public clearPrimary(): void {
    this.primaryWeaponId = null;
  }

  public equipPrimary(weaponId: WeaponId | null): void {
    this.primaryWeaponId = weaponId && primaryOptions.includes(weaponId) ? weaponId : null;
  }

  public equipSidearm(weaponId: WeaponId | null): void {
    this.sidearmWeaponId = weaponId && sidearmOptions.includes(weaponId) ? weaponId : "pistol";
  }

  public equipMelee(weaponId: WeaponId | null): void {
    this.meleeWeaponId = weaponId && meleeOptions.includes(weaponId) ? weaponId : null;
  }

  public cycleAttachment(slot: AttachmentSlot, stashItems: readonly LootStack[]): void {
    const available = Object.values(attachmentDefinitions).filter((attachment) => {
      return attachment.slot === slot && this.getQuantity(stashItems, attachment.lootType) > 0;
    });

    if (available.length === 0) {
      delete this.attachments[slot];
      return;
    }

    const current = this.attachments[slot];

    if (!current) {
      this.attachments[slot] = available[0].id;
      return;
    }

    const currentIndex = available.findIndex((attachment) => attachment.id === current);
    const next = currentIndex === -1 || currentIndex === available.length - 1
      ? null
      : available[currentIndex + 1].id;

    if (next) {
      this.attachments[slot] = next;
    } else {
      delete this.attachments[slot];
    }
  }

  public clearAttachment(slot: AttachmentSlot): void {
    delete this.attachments[slot];
  }

  public equipAttachment(slot: AttachmentSlot, attachmentId: AttachmentId | null): void {
    if (!attachmentId) {
      delete this.attachments[slot];
      return;
    }

    const attachment = attachmentDefinitions[attachmentId];

    if (attachment?.slot === slot) {
      this.attachments[slot] = attachmentId;
    }
  }

  public addMedkit(stashItems: readonly LootStack[]): void {
    const stashMedkits = this.getQuantity(stashItems, "medkit");
    this.medkits = Math.min(this.medkits + 1, loadoutConfig.maxMedkits, stashMedkits);
  }

  public removeMedkit(): void {
    this.medkits = Math.max(0, this.medkits - 1);
  }

  public setMedkits(quantity: number): void {
    this.medkits = Math.max(0, Math.min(loadoutConfig.maxMedkits, Math.floor(quantity)));
  }

  public addAmmoMag(stashItems: readonly LootStack[]): void {
    const stashAmmo = this.getQuantity(stashItems, "ammo");
    const stashMags = Math.floor(stashAmmo / loadoutConfig.roundsPerMagazine);
    this.extraAmmoMags = Math.min(
      this.extraAmmoMags + 1,
      loadoutConfig.maxExtraAmmoMags,
      stashMags,
    );
  }

  public removeAmmoMag(): void {
    this.extraAmmoMags = Math.max(0, this.extraAmmoMags - 1);
  }

  public setExtraAmmoMags(quantity: number): void {
    this.extraAmmoMags = Math.max(0, Math.min(loadoutConfig.maxExtraAmmoMags, Math.floor(quantity)));
  }

  public clampToStash(stashItems: readonly LootStack[]): void {
    const stashMedkits = this.getQuantity(stashItems, "medkit");
    const stashAmmo = this.getQuantity(stashItems, "ammo");
    this.medkits = Math.min(this.medkits, stashMedkits, loadoutConfig.maxMedkits);
    this.extraAmmoMags = Math.min(
      this.extraAmmoMags,
      Math.floor(stashAmmo / loadoutConfig.roundsPerMagazine),
      loadoutConfig.maxExtraAmmoMags,
    );

    if (this.primaryWeaponId && this.getQuantity(stashItems, weaponLootTypes[this.primaryWeaponId]) <= 0) {
      this.primaryWeaponId = null;
    }

    if (this.sidearmWeaponId !== "pistol" && this.getQuantity(stashItems, weaponLootTypes[this.sidearmWeaponId]) <= 0) {
      this.sidearmWeaponId = "pistol";
    }

    if (this.meleeWeaponId && this.getQuantity(stashItems, weaponLootTypes[this.meleeWeaponId]) <= 0) {
      this.meleeWeaponId = null;
    }

    for (const [slot, attachmentId] of Object.entries(this.attachments) as Array<[AttachmentSlot, AttachmentId]>) {
      const attachment = attachmentDefinitions[attachmentId];

      if (!attachment || this.getQuantity(stashItems, attachment.lootType) <= 0) {
        delete this.attachments[slot];
      }
    }
  }

  public equippedWeaponLootTypes(): LootType[] {
    const types: LootType[] = [];
    if (this.primaryWeaponId) {
      types.push(weaponLootTypes[this.primaryWeaponId]);
    }
    if (this.sidearmWeaponId !== "pistol") {
      types.push(weaponLootTypes[this.sidearmWeaponId]);
    }
    if (this.meleeWeaponId) {
      types.push(weaponLootTypes[this.meleeWeaponId]);
    }
    return types;
  }

  public equippedAttachmentLootTypes(): LootType[] {
    return Object.values(this.attachments)
      .filter((attachmentId): attachmentId is AttachmentId => Boolean(attachmentId))
      .map((attachmentId) => attachmentDefinitions[attachmentId].lootType);
  }

  public getWeaponNameForLoot(type: LootType): string | null {
    const weaponId = weaponIdFromLootType(type);
    return weaponId ? weaponDefinitions[weaponId].name : null;
  }

  public getAttachmentName(slot: AttachmentSlot): string {
    const attachmentId = this.attachments[slot];
    return attachmentId ? attachmentDefinitions[attachmentId].name : "Empty";
  }

  public getAttachmentComparison(): string {
    const weaponId = this.primaryWeaponId ?? "pistol";
    const base = weaponDefinitions[weaponId];
    const modified = buildRuntimeWeaponDefinition(weaponId, this.attachments);
    return [
      `Damage ${base.damage}->${modified.damage}`,
      `Mag ${base.magazineSize}->${modified.magazineSize}`,
      `Reload ${base.reloadTime.toFixed(1)}s->${modified.reloadTime.toFixed(1)}s`,
      `Recoil ${(base.hipfireRecoil * 100).toFixed(0)}->${(modified.hipfireRecoil * 100).toFixed(0)}`,
      `Range ${Math.round(base.effectiveRange)}->${Math.round(modified.effectiveRange)}`,
    ].join(" | ");
  }

  public get attachmentSlots(): readonly AttachmentSlot[] {
    return attachmentSlots;
  }

  public getAttachmentNameForLoot(type: LootType): string | null {
    const attachmentId = attachmentIdFromLootType(type);
    return attachmentId ? attachmentDefinitions[attachmentId].name : null;
  }

  private getQuantity(stashItems: readonly LootStack[], type: LootType): number {
    return stashItems.find((item) => item.type === type)?.quantity ?? 0;
  }
}
