import type { LootRarity } from "../theme/ThemeConfig";

export type LootType =
  | "credits"
  | "scrap"
  | "cloth"
  | "medkit"
  | "bandage"
  | "armor-plate"
  | "improved-armor-plate"
  | "anti-toxin"
  | "ammo"
  | "battery"
  | "electronics"
  | "weapon-parts"
  | "alien-chitin"
  | "acid-gland"
  | "crater-tissue"
  | "horror-core"
  | "infected-sample"
  | "backpack-upgrade"
  | "tool-flashlight"
  | "rare-core"
  | "encrypted-data"
  | "target-token"
  | "dog-tag"
  | "armor-light"
  | "weapon-pistol"
  | "weapon-burst-pistol"
  | "weapon-revolver"
  | "weapon-compact-smg"
  | "weapon-smg"
  | "weapon-shotgun"
  | "weapon-assault-rifle"
  | "weapon-rifle"
  | "weapon-knife"
  | "attachment-red-dot"
  | "attachment-compensator"
  | "attachment-suppressor"
  | "high-tier-suppressor"
  | "attachment-extended-mag"
  | "attachment-vertical-grip"
  | "attachment-angled-grip"
  | "attachment-thermal-optic"
  | "advanced-medkit"
  | "weapon-repair-kit"
  | "rare-upgrade-kit"
  | "elite-backpack";

export type ItemCategory = "material" | "gear" | "consumable" | "objective";

export type ItemDefinition = Readonly<{
  type: LootType;
  label: string;
  rarity: LootRarity;
  category: ItemCategory;
  stackable: boolean;
  slots: number;
  value: number;
  description: string;
  use: string;
}>;

export const itemDefinitions: Record<LootType, ItemDefinition> = {
  credits: {
    type: "credits",
    label: "Credits",
    rarity: "common",
    category: "material",
    stackable: true,
    slots: 1,
    value: 1,
    description: "Lunar credit chips stamped by crater factions.",
    use: "Extractable money loot that contributes to Crater Run payout value.",
  },
  scrap: {
    type: "scrap",
    label: "Regolith Scrap",
    rarity: "common",
    category: "material",
    stackable: true,
    slots: 1,
    value: 1,
    description: "Processed lunar junk metal, basalt fragments, and rig salvage.",
    use: "Fabrication and weapon repair material.",
  },
  cloth: {
    type: "cloth",
    label: "Alien Chitin",
    rarity: "common",
    category: "material",
    stackable: true,
    slots: 1,
    value: 1,
    description: "Flexible Umbra shell fiber scraped from alien remains.",
    use: "Fabrication material for suit patches, bandages, and utility gear.",
  },
  medkit: {
    type: "medkit",
    label: "Medkit",
    rarity: "uncommon",
    category: "consumable",
    stackable: false,
    slots: 1,
    value: 5,
    description: "Pressurized trauma kit with oxygenated clotting foam.",
    use: "Quick use restores a large chunk of health.",
  },
  bandage: {
    type: "bandage",
    label: "Bandage",
    rarity: "common",
    category: "consumable",
    stackable: true,
    slots: 1,
    value: 2,
    description: "Vac-seal wrap for suit cuts and small field mistakes.",
    use: "Quick use restores a small amount of health.",
  },
  "armor-plate": {
    type: "armor-plate",
    label: "Armor Plate",
    rarity: "uncommon",
    category: "consumable",
    stackable: false,
    slots: 1,
    value: 6,
    description: "Pop-in ceramic plate for a Crater Runner suit harness.",
    use: "Quick use refreshes your armor protection.",
  },
  "improved-armor-plate": {
    type: "improved-armor-plate",
    label: "Improved Armor Plate",
    rarity: "rare",
    category: "consumable",
    stackable: false,
    slots: 1,
    value: 10,
    description: "Reinforced composite plate rated for Umbra claws and rig shrapnel.",
    use: "Higher-tier armor consumable for future armor tuning.",
  },
  "anti-toxin": {
    type: "anti-toxin",
    label: "Anti-Toxin",
    rarity: "uncommon",
    category: "consumable",
    stackable: true,
    slots: 1,
    value: 9,
    description: "A fast-acting counteragent for Lunar Tick neurotoxins. Cures Lunar Infection and restores partial mental stability.",
    use: "Quick use clears Lunar Infection and restores +20 Mental Stability.",
  },
  ammo: {
    type: "ammo",
    label: "Ammo",
    rarity: "uncommon",
    category: "material",
    stackable: true,
    slots: 1,
    value: 0.5,
    description: "Mixed rounds packed for Crater Run weapons.",
    use: "Adds reserve ammunition while carried.",
  },
  battery: {
    type: "battery",
    label: "Oxygen Cell",
    rarity: "uncommon",
    category: "material",
    stackable: true,
    slots: 1,
    value: 2,
    description: "Compact emergency oxygen and battery cell for EVA tools.",
    use: "Recharges flashlight, night-vision, and future oxygen systems.",
  },
  electronics: {
    type: "electronics",
    label: "Suit Cores",
    rarity: "rare",
    category: "material",
    stackable: true,
    slots: 1,
    value: 5,
    description: "Recovered suit processors and rig control wafers.",
    use: "Future fabrication material for optics, scanners, signal tools, and Habitat upgrades.",
  },
  "weapon-parts": {
    type: "weapon-parts",
    label: "Mining Weapon Parts",
    rarity: "rare",
    category: "material",
    stackable: true,
    slots: 1,
    value: 4,
    description: "Rugged weapon and mining-tool components stripped from lunar kits.",
    use: "Crafting and weapon upgrade material.",
  },
  "alien-chitin": {
    type: "alien-chitin",
    label: "Alien Chitin",
    rarity: "uncommon",
    category: "material",
    stackable: true,
    slots: 1,
    value: 4,
    description: "Hard Umbra shell fragments. Still warm when freshly cut loose.",
    use: "Future alien-material fabrication and Anti-Toxin refinement.",
  },
  "acid-gland": {
    type: "acid-gland",
    label: "Acid Gland",
    rarity: "rare",
    category: "material",
    stackable: true,
    slots: 1,
    value: 9,
    description: "Spitter organ suspended in corrosive lunar bile.",
    use: "Future specialty crafting, vendor turn-ins, and toxin research.",
  },
  "crater-tissue": {
    type: "crater-tissue",
    label: "Crater Tissue",
    rarity: "epic",
    category: "material",
    stackable: true,
    slots: 1,
    value: 18,
    description: "Dense alien tissue that pulses with faint Umbra signal.",
    use: "Future high-tier suit, scanner, and Quiet Order research upgrades.",
  },
  "horror-core": {
    type: "horror-core",
    label: "Horror Core",
    rarity: "legendary",
    category: "objective",
    stackable: false,
    slots: 2,
    value: 55,
    description: "A rare organ-core recovered from a Crater Horror. Broker and Quiet Order buyers will fight over it.",
    use: "High-value extraction loot and future elite upgrade currency.",
  },
  "infected-sample": {
    type: "infected-sample",
    label: "Infected Sample",
    rarity: "rare",
    category: "material",
    stackable: true,
    slots: 1,
    value: 8,
    description: "Neurotoxic lunar infection sample drawn from Tick-contaminated tissue.",
    use: "Anti-Toxin recipe component and Quiet Order research turn-in.",
  },
  "backpack-upgrade": {
    type: "backpack-upgrade",
    label: "EVA Pack Expander",
    rarity: "rare",
    category: "gear",
    stackable: false,
    slots: 1,
    value: 14,
    description: "Clip-on hardcase that opens more EVA carry space.",
    use: "Adds four EVA Pack slots when picked up.",
  },
  "tool-flashlight": {
    type: "tool-flashlight",
    label: "Suit Floodlight",
    rarity: "common",
    category: "gear",
    stackable: false,
    slots: 1,
    value: 6,
    description: "Aim-following suit light for black craters and lava tubes.",
    use: "Equips to the Tactical Tool slot and toggles with T / D-pad Up.",
  },
  "rare-core": {
    type: "rare-core",
    label: "Helium-3 Canister",
    rarity: "core",
    category: "objective",
    stackable: false,
    slots: 2,
    value: 28,
    description: "Shielded fusion fuel canister. Helios would sell a crater for it.",
    use: "High-value extraction objective item and future upgrade currency.",
  },
  "encrypted-data": {
    type: "encrypted-data",
    label: "Black Box Data",
    rarity: "rare",
    category: "objective",
    stackable: false,
    slots: 1,
    value: 18,
    description: "Recovered drill-rig logs, telemetry, and last-breath suit recordings.",
    use: "Objective reward. Extract to keep it.",
  },
  "target-token": {
    type: "target-token",
    label: "Signal Shard",
    rarity: "rare",
    category: "objective",
    stackable: false,
    slots: 1,
    value: 16,
    description: "Resonant alien fragment that hums when the HUD goes dark.",
    use: "Objective reward and Quiet Order research material. Extract to keep it.",
  },
  "dog-tag": {
    type: "dog-tag",
    label: "Faction Tag",
    rarity: "rare",
    category: "objective",
    stackable: false,
    slots: 1,
    value: 12,
    description: "Recovered contractor or mercenary identity tag.",
    use: "Extractable player or contractor loot for faction turn-ins.",
  },
  "armor-light": {
    type: "armor-light",
    label: "Light Armor",
    rarity: "uncommon",
    category: "gear",
    stackable: false,
    slots: 2,
    value: 10,
    description: "Lightweight suit plating for quick Crater Runs.",
    use: "Loadout armor that reduces incoming damage slightly.",
  },
  "weapon-pistol": {
    type: "weapon-pistol",
    label: "Pistol",
    rarity: "epic",
    category: "gear",
    stackable: false,
    slots: 2,
    value: 12,
    description: "Reliable sidearm with clean handling.",
    use: "Sidearm weapon.",
  },
  "weapon-burst-pistol": {
    type: "weapon-burst-pistol",
    label: "Burst Pistol",
    rarity: "rare",
    category: "gear",
    stackable: false,
    slots: 2,
    value: 18,
    description: "Three-round lunar sidearm for runners who want pressure without carrying a primary.",
    use: "Sidearm weapon.",
  },
  "weapon-revolver": {
    type: "weapon-revolver",
    label: "Revolver",
    rarity: "rare",
    category: "gear",
    stackable: false,
    slots: 2,
    value: 20,
    description: "Heavy cylinder sidearm. Slow, loud, and honest.",
    use: "Sidearm weapon.",
  },
  "weapon-compact-smg": {
    type: "weapon-compact-smg",
    label: "Compact SMG",
    rarity: "epic",
    category: "gear",
    stackable: false,
    slots: 3,
    value: 26,
    description: "Unlocked compact automatic sidearm for close crater interiors.",
    use: "Advanced sidearm weapon.",
  },
  "weapon-smg": {
    type: "weapon-smg",
    label: "SMG",
    rarity: "epic",
    category: "gear",
    stackable: false,
    slots: 3,
    value: 22,
    description: "Close-range shredder for bold pushes.",
    use: "Primary weapon.",
  },
  "weapon-shotgun": {
    type: "weapon-shotgun",
    label: "Shotgun",
    rarity: "epic",
    category: "gear",
    stackable: false,
    slots: 3,
    value: 24,
    description: "High-risk burst damage with chunky spread.",
    use: "Primary weapon.",
  },
  "weapon-assault-rifle": {
    type: "weapon-assault-rifle",
    label: "Assault Rifle",
    rarity: "epic",
    category: "gear",
    stackable: false,
    slots: 3,
    value: 34,
    description: "Automatic mid-range primary with reliable all-around pressure.",
    use: "Primary weapon.",
  },
  "weapon-rifle": {
    type: "weapon-rifle",
    label: "Sniper Rifle",
    rarity: "legendary",
    category: "gear",
    stackable: false,
    slots: 4,
    value: 58,
    description: "Long-range precision rifle with scoped ADS and heavy recoil.",
    use: "Primary precision weapon.",
  },
  "weapon-knife": {
    type: "weapon-knife",
    label: "Suit Knife",
    rarity: "common",
    category: "gear",
    stackable: false,
    slots: 1,
    value: 6,
    description: "Short EVA utility blade. It does not need ammo, which is the whole point.",
    use: "Melee weapon slot.",
  },
  "attachment-red-dot": {
    type: "attachment-red-dot",
    label: "Red Dot",
    rarity: "rare",
    category: "gear",
    stackable: false,
    slots: 1,
    value: 8,
    description: "Clean optic for snappier ADS.",
    use: "Optic attachment.",
  },
  "attachment-compensator": {
    type: "attachment-compensator",
    label: "Compensator",
    rarity: "rare",
    category: "gear",
    stackable: false,
    slots: 1,
    value: 10,
    description: "Loud muzzle device that reins in recoil.",
    use: "Muzzle attachment.",
  },
  "attachment-suppressor": {
    type: "attachment-suppressor",
    label: "Suppressor",
    rarity: "epic",
    category: "gear",
    stackable: false,
    slots: 1,
    value: 18,
    description: "Quieter shots for stealthy Crater Runners.",
    use: "Muzzle attachment.",
  },
  "high-tier-suppressor": {
    type: "high-tier-suppressor",
    label: "High-Tier Suppressor",
    rarity: "legendary",
    category: "gear",
    stackable: false,
    slots: 1,
    value: 32,
    description: "Premium quiet muzzle hardware for risky stealth builds.",
    use: "High-tier muzzle attachment placeholder.",
  },
  "attachment-extended-mag": {
    type: "attachment-extended-mag",
    label: "Extended Mag",
    rarity: "rare",
    category: "gear",
    stackable: false,
    slots: 1,
    value: 10,
    description: "More shots before the scary reload moment.",
    use: "Magazine attachment.",
  },
  "attachment-vertical-grip": {
    type: "attachment-vertical-grip",
    label: "Vertical Grip",
    rarity: "rare",
    category: "gear",
    stackable: false,
    slots: 1,
    value: 10,
    description: "Steadies vertical recoil.",
    use: "Grip attachment.",
  },
  "attachment-angled-grip": {
    type: "attachment-angled-grip",
    label: "Angled Grip",
    rarity: "epic",
    category: "gear",
    stackable: false,
    slots: 1,
    value: 16,
    description: "Faster ready-up for aggressive peeks.",
    use: "Grip attachment.",
  },
  "attachment-thermal-optic": {
    type: "attachment-thermal-optic",
    label: "Thermal Optic",
    rarity: "legendary",
    category: "gear",
    stackable: false,
    slots: 1,
    value: 26,
    description: "Rare optic that makes bad weather less rude.",
    use: "Optic attachment.",
  },
  "advanced-medkit": {
    type: "advanced-medkit",
    label: "Advanced Medkit",
    rarity: "rare",
    category: "consumable",
    stackable: false,
    slots: 1,
    value: 12,
    description: "Packed neon gel, fast wraps, and a tiny good-luck sticker.",
    use: "Higher-tier healing consumable for future healing tuning.",
  },
  "weapon-repair-kit": {
    type: "weapon-repair-kit",
    label: "Weapon Repair Kit",
    rarity: "rare",
    category: "gear",
    stackable: false,
    slots: 1,
    value: 14,
    description: "Compact bench kit for keeping valuable weapons alive.",
    use: "Future field or HQ weapon repair material.",
  },
  "rare-upgrade-kit": {
    type: "rare-upgrade-kit",
    label: "Rare Upgrade Kit",
    rarity: "epic",
    category: "gear",
    stackable: false,
    slots: 1,
    value: 24,
    description: "Polished lunar tuning kit for late-tree upgrades.",
    use: "Future high-tier crafting and upgrade material.",
  },
  "elite-backpack": {
    type: "elite-backpack",
    label: "Elite Backpack",
    rarity: "legendary",
    category: "gear",
    stackable: false,
    slots: 2,
    value: 34,
    description: "Flashy high-capacity loot rig for greedy extracts.",
    use: "Elite backpack placeholder for future loadout capacity.",
  },
};

export const lootLabels = Object.fromEntries(
  Object.entries(itemDefinitions).map(([type, definition]) => [type, definition.label]),
) as Record<LootType, string>;

export const getItemDefinition = (type: LootType): ItemDefinition => itemDefinitions[type];
