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
  | "scanner-battery"
  | "electronics"
  | "weapon-parts"
  | "alien-chitin"
  | "lumen-essence"
  | "essence-flare"
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
  | "elite-backpack"
  | "helium-drill-core"
  | "lumen-relic-mass"
  | "reactor-spindle"
  | "black-box-survey-crate"
  | "sealed-mining-cache";

export type ItemCategory = "material" | "gear" | "consumable" | "objective";
export type ItemUseRole =
  | "equip"
  | "consume"
  | "craft"
  | "repair"
  | "upgrade"
  | "sell"
  | "turn-in"
  | "reveal"
  | "lore"
  | "contract"
  | "future";

export type ItemUseProfile = Readonly<{
  roles: readonly ItemUseRole[];
  usableInRaid: boolean;
  usableInHQ: boolean;
  currentUse: string;
  futureUse?: string;
  blockedReason?: string;
}>;

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
  useProfile?: ItemUseProfile;
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
    description: "Flexible Lumen shell fiber scraped from alien remains.",
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
    useProfile: {
      roles: ["consume"],
      usableInRaid: true,
      usableInHQ: false,
      currentUse: "Usable in raid. Restores health when injured.",
    },
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
    useProfile: {
      roles: ["consume", "craft"],
      usableInRaid: true,
      usableInHQ: false,
      currentUse: "Usable in raid. Restores a small amount of health.",
      futureUse: "Can become a component for stronger medical recipes.",
    },
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
    useProfile: {
      roles: ["consume"],
      usableInRaid: true,
      usableInHQ: false,
      currentUse: "Usable in raid. Temporarily improves suit protection.",
    },
  },
  "improved-armor-plate": {
    type: "improved-armor-plate",
    label: "Improved Armor Plate",
    rarity: "rare",
    category: "consumable",
    stackable: false,
    slots: 1,
    value: 10,
    description: "Reinforced composite plate rated for Lumen claws and rig shrapnel.",
    use: "Higher-tier armor consumable for future armor tuning.",
    useProfile: {
      roles: ["consume", "upgrade"],
      usableInRaid: true,
      usableInHQ: false,
      currentUse: "Usable in raid. Fits a stronger suit protection plate.",
      futureUse: "Upgrade economy hook for armor tuning.",
    },
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
    useProfile: {
      roles: ["consume", "craft"],
      usableInRaid: true,
      usableInHQ: false,
      currentUse: "Usable in raid when toxin, infection, or instability is active.",
      futureUse: "Crafting output and Lumen biohazard countermeasure.",
    },
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
    useProfile: {
      roles: ["consume", "craft", "future"],
      usableInRaid: true,
      usableInHQ: false,
      currentUse: "Usable in raid as an emergency oxygen cell.",
      futureUse: "Power source for scanners, reveal tools, and field devices.",
    },
  },
  "scanner-battery": {
    type: "scanner-battery",
    label: "Scanner Battery",
    rarity: "uncommon",
    category: "material",
    stackable: true,
    slots: 1,
    value: 3,
    description: "Utility power cell for reveal scanners and Lumen field devices.",
    use: "Used in crafting and future scanner systems. Not directly usable in raid yet.",
    useProfile: {
      roles: ["craft", "reveal", "future"],
      usableInRaid: false,
      usableInHQ: true,
      currentUse: "Utility power cell for reveal scanners and Lumen field devices.",
      futureUse: "Future power cell for persistent Lumen scanner tools.",
      blockedReason: "Used in crafting and future scanner systems. Not directly usable in raid yet.",
    },
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
    useProfile: {
      roles: ["craft", "repair", "upgrade"],
      usableInRaid: false,
      usableInHQ: true,
      currentUse: "Electronics salvage used by Fabrication Bench recipes.",
      futureUse: "Scanner, repair, and weapon systems ingredient.",
      blockedReason: "This item cannot be used directly.",
    },
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
    useProfile: {
      roles: ["craft", "repair", "upgrade"],
      usableInRaid: false,
      usableInHQ: true,
      currentUse: "Used for weapon repair kits and future weapon upgrades.",
      blockedReason: "This item cannot be used directly.",
    },
  },
  "alien-chitin": {
    type: "alien-chitin",
    label: "Alien Chitin",
    rarity: "uncommon",
    category: "material",
    stackable: true,
    slots: 1,
    value: 4,
    description: "Hard Lumen shell fragments. Still warm when freshly cut loose.",
    use: "Future alien-material fabrication and Anti-Toxin refinement.",
  },
  "lumen-essence": {
    type: "lumen-essence",
    label: "Lumen Essence",
    rarity: "rare",
    category: "material",
    stackable: true,
    slots: 1,
    value: 12,
    description: "Bioluminescent residue that reacts to nearby Lumen movement. Valuable to researchers and useful for crude tracking.",
    use: "Crafting material for reveal technology and future Lumen interface systems.",
    useProfile: {
      roles: ["craft", "reveal", "lore"],
      usableInRaid: false,
      usableInHQ: true,
      currentUse: "Crafting material for reveal technology.",
      futureUse: "Advanced Lumen interface systems, scanner pings, nest tracking, and anti-infection work.",
      blockedReason: "Craft into an Essence Flare before field activation.",
    },
  },
  "essence-flare": {
    type: "essence-flare",
    label: "Essence Flare",
    rarity: "rare",
    category: "consumable",
    stackable: true,
    slots: 1,
    value: 18,
    description: "A crude cyan-violet reveal charge built from Lumen Essence and salvaged suit electronics.",
    use: "Emit Reveal Pulse. Briefly reveals nearby Lumen signatures and consumes one flare on successful activation.",
    useProfile: {
      roles: ["consume", "reveal"],
      usableInRaid: true,
      usableInHQ: false,
      currentUse: "Reveal Consumable. Emits a 30m Lumen reveal pulse for 10s; Surveyors extend it to 36m for 12s.",
      futureUse: "Future camouflage disruption and persistent scanner tracking item.",
    },
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
    description: "Dense alien tissue that pulses with faint Lumen signal.",
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
    useProfile: {
      roles: ["craft", "turn-in", "contract"],
      usableInRaid: false,
      usableInHQ: true,
      currentUse: "Anti-Toxin crafting component and research turn-in.",
      blockedReason: "This item cannot be used directly.",
    },
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
    useProfile: {
      roles: ["turn-in", "contract", "sell"],
      usableInRaid: false,
      usableInHQ: true,
      currentUse: "Turn-in / contract item.",
      futureUse: "Faction reputation and contract economy input.",
      blockedReason: "This item cannot be used directly.",
    },
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
    useProfile: {
      roles: ["consume"],
      usableInRaid: true,
      usableInHQ: false,
      currentUse: "Usable in raid. Restores a large amount of health.",
    },
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
    useProfile: {
      roles: ["repair"],
      usableInRaid: false,
      usableInHQ: true,
      currentUse: "Repair material. Used at the bench to support weapon maintenance.",
      futureUse: "Future field repair action hook.",
      blockedReason: "Use at Fabrication/Arsenal repair interfaces.",
    },
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
  "helium-drill-core": {
    type: "helium-drill-core",
    label: "Helium-3 Drill Core",
    rarity: "legendary",
    category: "objective",
    stackable: false,
    slots: 5,
    value: 140,
    description: "Oversized drill heart from a Helium-3 rig. Too heavy for ordinary EVA handling.",
    use: "Heavy ship cargo prototype. High Broker value.",
  },
  "lumen-relic-mass": {
    type: "lumen-relic-mass",
    label: "Lumen Relic Mass",
    rarity: "legendary",
    category: "objective",
    stackable: false,
    slots: 5,
    value: 155,
    description: "Dense luminous matter pulled from a crater structure. It reacts when Lumen move nearby.",
    use: "Heavy ship cargo prototype. High research value.",
  },
  "reactor-spindle": {
    type: "reactor-spindle",
    label: "Reactor Spindle",
    rarity: "epic",
    category: "objective",
    stackable: false,
    slots: 4,
    value: 115,
    description: "Industrial spindle from a lunar fusion support rig.",
    use: "Heavy ship cargo prototype. Strong Mechanic value.",
  },
  "black-box-survey-crate": {
    type: "black-box-survey-crate",
    label: "Black Box Survey Crate",
    rarity: "epic",
    category: "objective",
    stackable: false,
    slots: 4,
    value: 105,
    description: "Sealed crate of restricted survey telemetry.",
    use: "Heavy ship cargo prototype. Contract and intel value.",
  },
  "sealed-mining-cache": {
    type: "sealed-mining-cache",
    label: "Sealed Mining Cache",
    rarity: "rare",
    category: "objective",
    stackable: false,
    slots: 4,
    value: 85,
    description: "Heavy mining lockbox with mixed material returns.",
    use: "Heavy ship cargo prototype. Mixed material value.",
  },
};

export const lootLabels = Object.fromEntries(
  Object.entries(itemDefinitions).map(([type, definition]) => [type, definition.label]),
) as Record<LootType, string>;

export const getItemDefinition = (type: LootType): ItemDefinition => itemDefinitions[type];

const defaultUseProfiles: Partial<Record<LootType, ItemUseProfile>> = {
  credits: {
    roles: ["sell"],
    usableInRaid: false,
    usableInHQ: true,
    currentUse: "Currency and sell value.",
    blockedReason: "This item cannot be used directly.",
  },
  scrap: {
    roles: ["craft", "repair", "upgrade"],
    usableInRaid: false,
    usableInHQ: true,
    currentUse: "Structural repair material used for weapons, tools, and ship components.",
    blockedReason: "This item cannot be used directly.",
  },
  cloth: {
    roles: ["craft"],
    usableInRaid: false,
    usableInHQ: true,
    currentUse: "Fabrication material for patches, bandages, and utility gear.",
    blockedReason: "This item cannot be used directly.",
  },
  ammo: {
    roles: ["craft", "future"],
    usableInRaid: false,
    usableInHQ: true,
    currentUse: "Reserve ammunition material handled by loadout prep.",
    blockedReason: "This item cannot be used directly.",
  },
  "acid-gland": {
    roles: ["craft", "turn-in"],
    usableInRaid: false,
    usableInHQ: true,
    currentUse: "Toxin research and future specialty crafting component.",
    blockedReason: "This item cannot be used directly.",
  },
  "crater-tissue": {
    roles: ["craft", "lore", "turn-in"],
    usableInRaid: false,
    usableInHQ: true,
    currentUse: "High-tier Lumen research material.",
    blockedReason: "This item cannot be used directly.",
  },
  "rare-core": {
    roles: ["craft", "upgrade", "sell"],
    usableInRaid: false,
    usableInHQ: true,
    currentUse: "Helium-3 resource for ship, scanner, and future upgrade work.",
    blockedReason: "This item cannot be used directly.",
  },
  "encrypted-data": {
    roles: ["turn-in", "contract", "lore"],
    usableInRaid: false,
    usableInHQ: true,
    currentUse: "Objective reward and intel turn-in item.",
    blockedReason: "This item cannot be used directly.",
  },
  "target-token": {
    roles: ["turn-in", "contract", "lore"],
    usableInRaid: false,
    usableInHQ: true,
    currentUse: "Objective reward and Quiet Order research material.",
    blockedReason: "This item cannot be used directly.",
  },
  "rare-upgrade-kit": {
    roles: ["upgrade"],
    usableInRaid: false,
    usableInHQ: true,
    currentUse: "Future high-tier weapon and gear upgrade material.",
    blockedReason: "Upgrade system coming in Phase 11.3.",
  },
};

export const getItemUseProfile = (type: LootType): ItemUseProfile => {
  const definition = itemDefinitions[type];
  if (definition.useProfile) {
    return definition.useProfile;
  }

  if (defaultUseProfiles[type]) {
    return defaultUseProfiles[type];
  }

  if (definition.category === "gear") {
    return {
      roles: ["equip"],
      usableInRaid: false,
      usableInHQ: true,
      currentUse: definition.use,
      blockedReason: "Equip or manage this item through Loadout / Arsenal.",
    };
  }

  if (definition.category === "objective") {
    return {
      roles: ["turn-in", "sell"],
      usableInRaid: false,
      usableInHQ: true,
      currentUse: definition.use,
      blockedReason: "This item cannot be used directly.",
    };
  }

  return {
    roles: ["future"],
    usableInRaid: false,
    usableInHQ: false,
    currentUse: definition.use,
    blockedReason: "This item cannot be used directly.",
  };
};
