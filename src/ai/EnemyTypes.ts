import { Color3 } from "@babylonjs/core";
import type { LootType } from "../raid/RaidInventory";
import { themeConfig } from "../theme/ThemeConfig";

export type EnemyType = "grunt" | "charger" | "spitter" | "guard" | "elite";
export type EnemyRole = "rifleman" | "flanker" | "rusher" | "support";

export type EnemyLootDrop = Readonly<{
  type: LootType;
  quantity: number;
  chance: number;
}>;

export type EnemyTypeDefinition = Readonly<{
  label: string;
  materialColor: Color3;
  maxHealth: number;
  visionRange: number;
  attackRange: number;
  combatDistance: number;
  patrolSpeed: number;
  chaseSpeed: number;
  attackCooldown: number;
  attackDamage: number;
  armorDamageReduction: number;
  visualScale: Readonly<{ x: number; y: number; z: number; head: number }>;
  visualYOffset: number;
  colliderYOffset: number;
  colliderHeight: number;
  colliderRadius: number;
  hitboxYOffset: number;
  losOriginYOffset: number;
  feetGroundOffset: number;
  threatClass: "small-swarmer" | "burrower" | "ranged-spitter" | "objective-guardian" | "crater-horror";
  lootTable: EnemyLootDrop[];
}>;

export type EnemyRoleDefinition = Readonly<{
  label: string;
  preferredCoverDistance: number;
  flankBias: number;
  retreatHealthRatio: number;
  repositionInterval: number;
  burstShots: number;
  burstInterval: number;
  reloadAfterShots: number;
  reloadTime: number;
  accuracy: number;
  suppression: number;
  reactionMultiplier: number;
}>;

export const enemyRoleDefinitions: Record<EnemyRole, EnemyRoleDefinition> = {
  rifleman: {
    label: "Rifleman",
    preferredCoverDistance: 8,
    flankBias: 0.25,
    retreatHealthRatio: 0.2,
    repositionInterval: 7,
    burstShots: 2,
    burstInterval: 0.14,
    reloadAfterShots: 9,
    reloadTime: 1.4,
    accuracy: 0.82,
    suppression: 0.2,
    reactionMultiplier: 1,
  },
  flanker: {
    label: "Flanker",
    preferredCoverDistance: 10,
    flankBias: 1,
    retreatHealthRatio: 0.25,
    repositionInterval: 4.8,
    burstShots: 2,
    burstInterval: 0.12,
    reloadAfterShots: 8,
    reloadTime: 1.25,
    accuracy: 0.76,
    suppression: 0.1,
    reactionMultiplier: 0.92,
  },
  rusher: {
    label: "Rusher",
    preferredCoverDistance: 3,
    flankBias: 0.35,
    retreatHealthRatio: 0.12,
    repositionInterval: 8,
    burstShots: 1,
    burstInterval: 0.1,
    reloadAfterShots: 6,
    reloadTime: 1.1,
    accuracy: 0.68,
    suppression: 0,
    reactionMultiplier: 0.82,
  },
  support: {
    label: "Support",
    preferredCoverDistance: 13,
    flankBias: 0.1,
    retreatHealthRatio: 0.34,
    repositionInterval: 9,
    burstShots: 4,
    burstInterval: 0.11,
    reloadAfterShots: 14,
    reloadTime: 1.8,
    accuracy: 0.72,
    suppression: 0.9,
    reactionMultiplier: 1.18,
  },
};

export const enemyTypeDefinitions: Record<EnemyType, EnemyTypeDefinition> = {
  grunt: {
    label: themeConfig.enemyFactionNames.grunt,
    materialColor: new Color3(0.12, 0.16, 0.18).add(themeConfig.colors.rootGreen.scale(0.18)),
    maxHealth: 46,
    visionRange: 21,
    attackRange: 3.4,
    combatDistance: 1.4,
    patrolSpeed: 2.4,
    chaseSpeed: 9.2,
    attackCooldown: 0.58,
    attackDamage: 5,
    armorDamageReduction: 0,
    visualScale: { x: 0.62, y: 0.56, z: 0.86, head: 0.82 },
    visualYOffset: 0.56,
    colliderYOffset: 0,
    colliderHeight: 1.05,
    colliderRadius: 0.34,
    hitboxYOffset: 0.02,
    losOriginYOffset: 0.92,
    feetGroundOffset: 0.08,
    threatClass: "small-swarmer",
    lootTable: [
      { type: "scrap", quantity: 1, chance: 0.45 },
      { type: "cloth", quantity: 1, chance: 0.34 },
      { type: "infected-sample", quantity: 1, chance: 0.12 },
      { type: "anti-toxin", quantity: 1, chance: 0.08 },
    ],
  },
  charger: {
    label: themeConfig.enemyFactionNames.charger,
    materialColor: new Color3(0.35, 0.24, 0.16).add(themeConfig.colors.orange.scale(0.24)),
    maxHealth: 120,
    visionRange: 24,
    attackRange: 4.6,
    combatDistance: 1.8,
    patrolSpeed: 2.2,
    chaseSpeed: 8.8,
    attackCooldown: 0.72,
    attackDamage: 12,
    armorDamageReduction: 0,
    visualScale: { x: 1.18, y: 1.05, z: 1.35, head: 0.95 },
    visualYOffset: 0.98,
    colliderYOffset: 0,
    colliderHeight: 1.8,
    colliderRadius: 0.48,
    hitboxYOffset: 0.04,
    losOriginYOffset: 1.42,
    feetGroundOffset: 0.08,
    threatClass: "burrower",
    lootTable: [
      { type: "scrap", quantity: 2, chance: 0.55 },
      { type: "alien-chitin", quantity: 1, chance: 0.38 },
      { type: "medkit", quantity: 1, chance: 0.12 },
    ],
  },
  spitter: {
    label: themeConfig.enemyFactionNames.spitter,
    materialColor: new Color3(0.24, 0.76, 0.46),
    maxHealth: 95,
    visionRange: 30,
    attackRange: 24,
    combatDistance: 15,
    patrolSpeed: 1.55,
    chaseSpeed: 5.4,
    attackCooldown: 1.18,
    attackDamage: 9,
    armorDamageReduction: 0.02,
    visualScale: { x: 0.82, y: 0.94, z: 1.1, head: 0.95 },
    visualYOffset: 0.98,
    colliderYOffset: 0,
    colliderHeight: 1.72,
    colliderRadius: 0.42,
    hitboxYOffset: 0.06,
    losOriginYOffset: 1.44,
    feetGroundOffset: 0.08,
    threatClass: "ranged-spitter",
    lootTable: [
      { type: "scrap", quantity: 2, chance: 0.52 },
      { type: "acid-gland", quantity: 1, chance: 0.34 },
      { type: "anti-toxin", quantity: 1, chance: 0.12 },
    ],
  },
  guard: {
    label: themeConfig.enemyFactionNames.guard,
    materialColor: new Color3(0.4, 0.42, 0.5).add(themeConfig.colors.cyan.scale(0.16)),
    maxHealth: 190,
    visionRange: 28,
    attackRange: 5.4,
    combatDistance: 3,
    patrolSpeed: 1.32,
    chaseSpeed: 4.8,
    attackCooldown: 0.9,
    attackDamage: 18,
    armorDamageReduction: 0.18,
    visualScale: { x: 1.2, y: 1.36, z: 1.05, head: 1.05 },
    visualYOffset: 1.42,
    colliderYOffset: 0,
    colliderHeight: 2.16,
    colliderRadius: 0.42,
    hitboxYOffset: 0.08,
    losOriginYOffset: 1.84,
    feetGroundOffset: 0.08,
    threatClass: "objective-guardian",
    lootTable: [
      { type: "scrap", quantity: 3, chance: 0.65 },
      { type: "ammo", quantity: 10, chance: 0.38 },
      { type: "alien-chitin", quantity: 2, chance: 0.42 },
      { type: "rare-core", quantity: 1, chance: 0.16 },
      { type: "medkit", quantity: 1, chance: 0.18 },
    ],
  },
  elite: {
    label: themeConfig.enemyFactionNames.elite,
    materialColor: new Color3(0.44, 0.18, 0.92),
    maxHealth: 240,
    visionRange: 32,
    attackRange: 22,
    combatDistance: 15,
    patrolSpeed: 1.7,
    chaseSpeed: 6.6,
    attackCooldown: 0.68,
    attackDamage: 14,
    armorDamageReduction: 0.22,
    visualScale: { x: 1.42, y: 1.22, z: 1.42, head: 0.92 },
    visualYOffset: 1.3,
    colliderYOffset: 0,
    colliderHeight: 2.06,
    colliderRadius: 0.58,
    hitboxYOffset: 0.06,
    losOriginYOffset: 1.76,
    feetGroundOffset: 0.1,
    threatClass: "crater-horror",
    lootTable: [
      { type: "scrap", quantity: 6, chance: 0.9 },
      { type: "ammo", quantity: 18, chance: 0.62 },
      { type: "rare-core", quantity: 1, chance: 0.28 },
      { type: "horror-core", quantity: 1, chance: 0.36 },
      { type: "crater-tissue", quantity: 2, chance: 0.42 },
      { type: "weapon-assault-rifle", quantity: 1, chance: 0.12 },
      { type: "weapon-rifle", quantity: 1, chance: 0.05 },
      { type: "weapon-shotgun", quantity: 1, chance: 0.1 },
      { type: "attachment-suppressor", quantity: 1, chance: 0.12 },
      { type: "attachment-angled-grip", quantity: 1, chance: 0.1 },
    ],
  },
};
