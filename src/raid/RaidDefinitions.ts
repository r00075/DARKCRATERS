export type RaidTierId = "survey-run" | "mining-disruption" | "blackout-zone" | "deep-crater-operation" | "extinction-dig";

export type RaidDefinition = Readonly<{
  id: RaidTierId;
  tier: number;
  name: string;
  lengthSeconds: number;
  difficultyLabel: string;
  enemyDensityLabel: string;
  lootQuality: string;
  bestFor: string;
  extractionRisk: string;
  recommendedGearScore: number;
  difficultyLevelBonus: number;
  rareLootMultiplier: number;
  lootMultiplier: number;
  contractRewardMultiplier: number;
  oxygenDrainMultiplier: number;
  oxygenPressure: string;
  radiationRisk: string;
  environmentalHazards: string[];
  craterZone: string;
  description: string;
  accentColor: string;
  modifiers: string[];
}>;

export const raidDefinitions: RaidDefinition[] = [
  {
    id: "survey-run",
    tier: 1,
    name: "Survey Run",
    lengthSeconds: 10 * 60,
    difficultyLabel: "Low",
    enemyDensityLabel: "Low Lumen presence",
    lootQuality: "Common / Uncommon",
    bestFor: "Regolith scrap, oxygen cells, basic Helium-3 samples",
    extractionRisk: "Easier",
    recommendedGearScore: 10,
    difficultyLevelBonus: 0,
    rareLootMultiplier: 1,
    lootMultiplier: 1,
    contractRewardMultiplier: 0.9,
    oxygenDrainMultiplier: 1,
    oxygenPressure: "Low",
    radiationRisk: "Low",
    environmentalHazards: ["low gravity", "cold shadow pockets"],
    craterZone: "Tycho Scar",
    description: "Recently opened zones with light Lumen activity and basic salvage.",
    accentColor: "#2F8CFF",
    modifiers: ["beginner survey route", "easy ascenders", "light oxygen drain"],
  },
  {
    id: "mining-disruption",
    tier: 2,
    name: "Mining Disruption",
    lengthSeconds: 14 * 60,
    difficultyLabel: "Standard",
    enemyDensityLabel: "Moderate Lumen pressure",
    lootQuality: "Uncommon / Rare",
    bestFor: "Mining tech, oxygen supplies, weapon parts, Helium-3",
    extractionRisk: "Standard",
    recommendedGearScore: 24,
    difficultyLevelBonus: 1,
    rareLootMultiplier: 1.35,
    lootMultiplier: 1.35,
    contractRewardMultiplier: 1,
    oxygenDrainMultiplier: 1.15,
    oxygenPressure: "Moderate",
    radiationRisk: "Moderate",
    environmentalHazards: ["dust storms", "suit punctures", "seismic tremors"],
    craterZone: "Aristarchus Redline",
    description: "Active mining sites under alien pressure. Management wants the equipment back.",
    accentColor: "#FFB02E",
    modifiers: ["mining equipment objectives", "balanced loot", "moderate ascender risk"],
  },
  {
    id: "blackout-zone",
    tier: 3,
    name: "Blackout Zone",
    lengthSeconds: 17 * 60,
    difficultyLabel: "High",
    enemyDensityLabel: "Strong Lumen presence",
    lootQuality: "Rare / Epic",
    bestFor: "Signal shards, suit cores, crater glass, extraction bonuses",
    extractionRisk: "Dangerous",
    recommendedGearScore: 42,
    difficultyLevelBonus: 3,
    rareLootMultiplier: 1.75,
    lootMultiplier: 1.75,
    contractRewardMultiplier: 1.18,
    oxygenDrainMultiplier: 1.3,
    oxygenPressure: "High",
    radiationRisk: "High",
    environmentalHazards: ["crater darkness", "radar disruption", "cold shadow zones"],
    craterZone: "Mare Vanta",
    description: "Comms unstable. Radar unreliable. Crews missing.",
    accentColor: "#7A4DFF",
    modifiers: ["radar/comms disruption", "dark map profile", "better extraction rewards"],
  },
  {
    id: "deep-crater-operation",
    tier: 4,
    name: "Deep Crater Operation",
    lengthSeconds: 20 * 60,
    difficultyLabel: "Very High",
    enemyDensityLabel: "Heavy Lumen encounters",
    lootQuality: "Epic / Legendary chance",
    bestFor: "Rare resources, artifact fragments, advanced contracts",
    extractionRisk: "Contested",
    recommendedGearScore: 62,
    difficultyLevelBonus: 5,
    rareLootMultiplier: 2.25,
    lootMultiplier: 2.25,
    contractRewardMultiplier: 1.35,
    oxygenDrainMultiplier: 1.5,
    oxygenPressure: "Severe",
    radiationRisk: "Severe",
    environmentalHazards: ["severe hazards", "seismic tremors", "oxygen drain"],
    craterZone: "The Hollow Sea",
    description: "Restricted lunar zones near alien structures.",
    accentColor: "#72FF9D",
    modifiers: ["lava tube darkness", "unstable extraction", "heavy alien encounters"],
  },
  {
    id: "extinction-dig",
    tier: 5,
    name: "Extinction Dig",
    lengthSeconds: 24 * 60,
    difficultyLabel: "Extreme",
    enemyDensityLabel: "Extreme Lumen + boss chance",
    lootQuality: "Legendary / Core chance",
    bestFor: "Highest-value loot, alien artifacts, faction-defining rewards",
    extractionRisk: "Hardest",
    recommendedGearScore: 84,
    difficultyLevelBonus: 8,
    rareLootMultiplier: 3,
    lootMultiplier: 3,
    contractRewardMultiplier: 1.6,
    oxygenDrainMultiplier: 1.75,
    oxygenPressure: "Extreme",
    radiationRisk: "Extreme",
    environmentalHazards: ["crater darkness", "radiation spikes", "boss-class alien chance", "suit punctures"],
    craterZone: "The Black Basin",
    description: "No rescue. No witnesses. No guarantee the thing you extract is yours.",
    accentColor: "#FF3347",
    modifiers: ["endgame dig site", "Craterborn chance", "highest-value extraction"],
  },
];

export const defaultRaidDefinition = raidDefinitions[1];

export const raidDefinitionById = Object.fromEntries(
  raidDefinitions.map((definition) => [definition.id, definition]),
) as Record<RaidTierId, RaidDefinition>;
