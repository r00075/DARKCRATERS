import { Color3 } from "@babylonjs/core";
import { getItemDefinition, type LootType } from "../raid/ItemDefinitions";

export type LootRarity = "common" | "uncommon" | "rare" | "epic" | "legendary" | "core";

const hex = (value: string): Color3 => Color3.FromHexString(value);

export const themeConfig = {
  brand: {
    title: "DARK CRATERS",
    subtitle: "The crater is listening.",
    menuFlavor: "Helium-3 brought humanity to the Moon.\nSomething beneath the craters answered.\nDeploy, recover what you can, and extract before the crater goes dark.",
    loadingLines: [
      "The crater is listening.",
      "Extract before the dark finds you.",
      "Helium-3 was only the beginning.",
      "The Moon remembers what we buried.",
      "Mine fast. Breathe slow.",
      "No signal. No sunrise. No mercy.",
      "The shadows move differently here.",
      "Extraction is survival.",
      "Don't follow the lights underground.",
      "The Moon was never ours.",
    ],
  },
  palette: {
    deepSpaceBlack: "#05070A",
    craterBlack: "#0A0D12",
    lunarCharcoal: "#111720",
    gunmetalBlue: "#17202B",
    moonDustGray: "#6F7680",
    paleRegolith: "#AEB6BF",
    coldWhite: "#E6EDF3",
    heliumCyan: "#41D9FF",
    oxygenBlue: "#2F8CFF",
    warningAmber: "#FFB02E",
    hazardOrange: "#FF6B1A",
    criticalRed: "#FF3347",
    alienLumenGreen: "#72FF9D",
    umbraViolet: "#7A4DFF",
  },
  colors: {
    sky: hex("#05070A"),
    ground: hex("#0A0D12"),
    neonGrass: hex("#41D9FF"),
    rootGreen: hex("#72FF9D"),
    rootGlow: hex("#0B3B27"),
    cyan: hex("#41D9FF"),
    purple: hex("#7A4DFF"),
    orange: hex("#FF6B1A"),
    yellow: hex("#FFB02E"),
    hoodie: hex("#17202B"),
    vest: hex("#0A0D12"),
    boots: hex("#05070A"),
    visor: hex("#41D9FF"),
  },
  rarityColors: {
    common: new Color3(0.86, 0.88, 0.92),
    uncommon: new Color3(0.22, 0.95, 0.42),
    rare: new Color3(0.2, 0.58, 1),
    epic: new Color3(0.76, 0.28, 1),
    legendary: new Color3(1, 0.54, 0.1),
    core: new Color3(0.12, 0.95, 1),
  } satisfies Record<LootRarity, Color3>,
  poiNames: {
    warehouse: "Tycho Scar",
    checkpoint: "Aristarchus Redline",
    "abandoned-camp": "The Hollow Sea",
    "data-shack": "Mare Vanta",
    "core-pit": "The Black Basin",
  },
  extractionName: "Lunar Ascender Extract",
  enemyFactionNames: {
    grunt: "Lunar Tick",
    charger: "Burrower",
    spitter: "Spitter",
    guard: "Guardian",
    elite: "Crater Horror",
  },
  enemyCollectiveName: "The Umbra",
  factions: {
    lea: {
      name: "L.E.A. - Lunar Extraction Authority",
      shortName: "L.E.A.",
      description: "Official mining authority offering starter gear, oxygen supplies, mining objectives, and basic contracts.",
      motto: "Earth depends on output.",
      primary: "#2F8CFF",
      secondary: "#DDEBFF",
    },
    helios: {
      name: "Helios Dynamics",
      shortName: "Helios",
      description: "Corporate fusion-energy megacorp trading advanced weapons, energy gear, mining tech, and high-value contracts.",
      motto: "Powering tomorrow, whatever it costs.",
      primary: "#FFB02E",
      secondary: "#FFE0A3",
    },
    craterRats: {
      name: "Crater Rats",
      shortName: "Crater Rats",
      description: "Smugglers, scavengers, and independent miners moving EVA Pack upgrades and survival goods.",
      motto: "If it ain't bolted down, it's oxygen money.",
      primary: "#D66A2A",
      secondary: "#B8A078",
    },
    quietOrder: {
      name: "The Quiet Order",
      shortName: "Quiet Order",
      description: "Secretive alien artifact researchers selling scanner upgrades and alien-material modifications.",
      motto: "The Moon remembers impact.",
      primary: "#7A4DFF",
      secondary: "#72FF9D",
    },
    freeOrbit: {
      name: "Free Orbit Security",
      shortName: "Free Orbit",
      description: "Mercenary security faction offering heavy weapons, tactical armor, and combat contracts.",
      motto: "No atmosphere. No witnesses.",
      primary: "#7F8A96",
      secondary: "#FF3347",
    },
  },
  craterZones: {
    tychoScar: {
      id: "tycho-scar",
      name: "Tycho Scar",
      shortDescription: "Beginner lunar mining battlefield with wrecked rigs and abandoned equipment.",
      longDescription: "Tycho Scar was one of the first Helium-3 mining sites to go dark. Official reports blame equipment failure. The claw marks on the rigs suggest otherwise.",
      recommendedTier: "Survey Run",
      environmentalHazards: ["oxygen drain", "cold shadow pockets", "low gravity"],
      primaryLoot: ["Regolith Scrap", "Oxygen Cells", "Helium-3 Canisters"],
      enemyPresence: "Light Umbra activity",
      visualTheme: "Wrecked mining rigs, broken floodlights, dark regolith, cold blue rim light, and faint alien lumen traces.",
      extractionNotes: "Lunar ascenders are easier to reach but still expose runners to open crater lanes.",
    },
  },
  umbraTypes: {
    lunarTick: {
      id: "lunar_tick",
      displayName: "Lunar Tick",
      pluralName: "Lunar Ticks",
      faction: "Umbra",
      sizeClass: "Smallest",
      role: "Swarm Parasite",
      description: "Small parasite-like Umbra organisms that attack in swarms, pierce EVA suit seams, and spread a neurotoxic lunar infection that erodes mental stability over time.",
      combatRole: "Pressure the player through swarming, panic, and infection rather than raw damage.",
      spawnNotes: "Common near nests, dark crater pockets, dead mining crews, broken rigs, and abandoned tunnels.",
    },
    burrower: {
      name: "Burrower",
      role: "underground ambush alien",
      description: "Ambushers that surface from fractured regolith near noisy extraction activity.",
    },
    spitter: {
      name: "Spitter",
      role: "ranged acid alien",
      description: "Medium-distance Umbra that spits corrosive bile and tries to keep pressure from cover lanes.",
    },
    guardian: {
      name: "Guardian",
      role: "Helium-3 objective defender",
      description: "Armored Umbra grown around mining equipment and fusion-fuel containers.",
    },
    craterHorror: {
      name: "Crater Horror",
      role: "elite lunacy pressure alien",
      description: "Rare high-tier Umbra whose presence bends HUD signals and mental stability.",
    },
    choirNode: {
      name: "Choir Node",
      role: "stationary signal growth",
      description: "Alien growth that buffs nearby Umbra and disrupts runner HUD systems.",
    },
    craterborn: {
      name: "Craterborn",
      role: "boss-class alien",
      description: "Rare apex entity reported only in deep crater operations and extinction digs.",
    },
  },
} as const;

export const lootRarityByType = (type: LootType): LootRarity => {
  return getItemDefinition(type).rarity;
};

export const colorToCss = (color: Color3): string => {
  const r = Math.round(color.r * 255);
  const g = Math.round(color.g * 255);
  const b = Math.round(color.b * 255);
  return `rgb(${r}, ${g}, ${b})`;
};
