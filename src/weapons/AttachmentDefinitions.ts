import type { LootType } from "../raid/RaidInventory";

export type AttachmentSlot = "optic" | "muzzle" | "magazine" | "grip";
export type AttachmentId =
  | "red-dot"
  | "compensator"
  | "suppressor"
  | "extended-mag"
  | "vertical-grip"
  | "angled-grip";

export type AttachmentRarity = "common" | "rare";

export type AttachmentDefinition = Readonly<{
  id: AttachmentId;
  lootType: LootType;
  slot: AttachmentSlot;
  name: string;
  rarity: AttachmentRarity;
  description: string;
  modifiers: Readonly<{
    damageMultiplier?: number;
    rangeMultiplier?: number;
    magazineMultiplier?: number;
    reloadTimeMultiplier?: number;
    verticalRecoilMultiplier?: number;
    horizontalRecoilMultiplier?: number;
    spreadMultiplier?: number;
    adsSpreadMultiplier?: number;
    adsFovOffsetDegrees?: number;
    adsTransitionMultiplier?: number;
    detectionNoiseMultiplier?: number;
  }>;
}>;

export type AttachmentLoadout = Partial<Record<AttachmentSlot, AttachmentId>>;

export const attachmentDefinitions: Record<AttachmentId, AttachmentDefinition> = {
  "red-dot": {
    id: "red-dot",
    lootType: "attachment-red-dot",
    slot: "optic",
    name: "Red Dot",
    rarity: "common",
    description: "Cleaner ADS picture and a touch more ADS zoom.",
    modifiers: {
      adsSpreadMultiplier: 0.85,
      adsFovOffsetDegrees: -4,
    },
  },
  compensator: {
    id: "compensator",
    lootType: "attachment-compensator",
    slot: "muzzle",
    name: "Compensator",
    rarity: "common",
    description: "Cuts recoil but makes shots easier to detect.",
    modifiers: {
      verticalRecoilMultiplier: 0.78,
      horizontalRecoilMultiplier: 0.76,
      detectionNoiseMultiplier: 1.18,
    },
  },
  suppressor: {
    id: "suppressor",
    lootType: "attachment-suppressor",
    slot: "muzzle",
    name: "Suppressor",
    rarity: "rare",
    description: "Quieter shots with slightly reduced damage and range.",
    modifiers: {
      damageMultiplier: 0.92,
      rangeMultiplier: 0.88,
      detectionNoiseMultiplier: 0.62,
    },
  },
  "extended-mag": {
    id: "extended-mag",
    lootType: "attachment-extended-mag",
    slot: "magazine",
    name: "Extended Mag",
    rarity: "common",
    description: "More rounds per reload, slower reload speed.",
    modifiers: {
      magazineMultiplier: 1.35,
      reloadTimeMultiplier: 1.14,
    },
  },
  "vertical-grip": {
    id: "vertical-grip",
    lootType: "attachment-vertical-grip",
    slot: "grip",
    name: "Vertical Grip",
    rarity: "common",
    description: "Reduces vertical recoil.",
    modifiers: {
      verticalRecoilMultiplier: 0.82,
    },
  },
  "angled-grip": {
    id: "angled-grip",
    lootType: "attachment-angled-grip",
    slot: "grip",
    name: "Angled Grip",
    rarity: "rare",
    description: "Snappier ADS handling.",
    modifiers: {
      adsTransitionMultiplier: 1.28,
    },
  },
};

export const attachmentSlots: AttachmentSlot[] = ["optic", "muzzle", "magazine", "grip"];

export const attachmentIdFromLootType = (type: LootType): AttachmentId | null => {
  for (const attachment of Object.values(attachmentDefinitions)) {
    if (attachment.lootType === type) {
      return attachment.id;
    }
  }

  return null;
};
