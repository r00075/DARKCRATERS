import {
  AbstractMesh,
  Color3,
  MeshBuilder,
  Scene,
  StandardMaterial,
  Vector3,
} from "@babylonjs/core";
import { lootRarityByType, themeConfig } from "../theme/ThemeConfig";
import { mapLayoutConfig } from "../world/MapLayout";
import type { LootRarity } from "../theme/ThemeConfig";
import { getItemDefinition, itemDefinitions, type LootType } from "./ItemDefinitions";
import type { LootEvent, LootStack, RaidInventory } from "./RaidInventory";
import type { NetworkContainerState } from "../multiplayer/MultiplayerTypes";

export type LootDirectorResult = Readonly<{
  events: LootEvent[];
  message: string;
}>;

export type LootContainerView = Readonly<{
  id: string;
  title: string;
  items: LootStack[];
}>;

type LootContainerDefinition = Readonly<{
  id: string;
  position: Vector3;
  table: LootDrop[];
}>;

export type LootDrop = Readonly<{
  type: LootType;
  quantity: number;
  chance: number;
}>;

type LootContainer = {
  id: string;
  mesh: AbstractMesh;
  opened: boolean;
  table: LootDrop[];
  items: LootStack[];
};

const interactionRange = 3.2;
const rarityScore: Record<LootRarity, number> = {
  common: 0,
  uncommon: 1,
  rare: 2,
  epic: 3,
  legendary: 4,
  core: 5,
};

const containerDefinitions: LootContainerDefinition[] = [
  {
    id: "camp-supply-cache",
    position: new Vector3(88, 0.45, 41),
    table: [
      { type: "scrap", quantity: 3, chance: 1 },
      { type: "cloth", quantity: 2, chance: 0.5 },
      { type: "medkit", quantity: 1, chance: 0.45 },
      { type: "bandage", quantity: 2, chance: 0.55 },
      { type: "anti-toxin", quantity: 1, chance: 0.28 },
      { type: "infected-sample", quantity: 1, chance: 0.08 },
      { type: "ammo", quantity: 8, chance: 0.45 },
      { type: "battery", quantity: 1, chance: 0.38 },
    ],
  },
  {
    id: "data-shack-lockbox",
    position: new Vector3(-74, 0.45, 86),
    table: [
      { type: "scrap", quantity: 5, chance: 1 },
      { type: "weapon-parts", quantity: 2, chance: 0.35 },
      { type: "electronics", quantity: 1, chance: 0.42 },
      { type: "ammo", quantity: 12, chance: 0.7 },
      { type: "battery", quantity: 1, chance: 0.42 },
      { type: "rare-core", quantity: 1, chance: 0.16 },
      { type: "acid-gland", quantity: 1, chance: 0.12 },
      { type: "attachment-red-dot", quantity: 1, chance: 0.2 },
    ],
  },
  {
    id: "checkpoint-field-kit",
    position: new Vector3(58, 0.45, -92),
    table: [
      { type: "scrap", quantity: 2, chance: 1 },
      { type: "armor-plate", quantity: 1, chance: 0.35 },
      { type: "medkit", quantity: 1, chance: 0.7 },
      { type: "anti-toxin", quantity: 1, chance: 0.34 },
      { type: "ammo", quantity: 14, chance: 0.65 },
      { type: "battery", quantity: 1, chance: 0.5 },
      { type: "attachment-extended-mag", quantity: 1, chance: 0.16 },
    ],
  },
  {
    id: "warehouse-armory-crate",
    position: new Vector3(-86, 0.45, -26),
    table: [
      { type: "scrap", quantity: 7, chance: 1 },
      { type: "weapon-parts", quantity: 4, chance: 0.7 },
      { type: "electronics", quantity: 2, chance: 0.46 },
      { type: "ammo", quantity: 24, chance: 0.85 },
      { type: "backpack-upgrade", quantity: 1, chance: 0.12 },
      { type: "rare-core", quantity: 1, chance: 0.35 },
      { type: "horror-core", quantity: 1, chance: 0.04 },
      { type: "weapon-assault-rifle", quantity: 1, chance: 0.18 },
      { type: "weapon-rifle", quantity: 1, chance: 0.09 },
      { type: "weapon-shotgun", quantity: 1, chance: 0.14 },
      { type: "weapon-revolver", quantity: 1, chance: 0.14 },
      { type: "weapon-knife", quantity: 1, chance: 0.16 },
      { type: "attachment-thermal-optic", quantity: 1, chance: 0.08 },
      { type: "attachment-suppressor", quantity: 1, chance: 0.12 },
      { type: "attachment-angled-grip", quantity: 1, chance: 0.12 },
    ],
  },
  {
    id: "warehouse-med-station",
    position: new Vector3(-98, 0.45, -12),
    table: [
      { type: "medkit", quantity: 1, chance: 0.85 },
      { type: "bandage", quantity: 3, chance: 0.7 },
      { type: "anti-toxin", quantity: 1, chance: 0.48 },
      { type: "alien-chitin", quantity: 2, chance: 0.16 },
      { type: "armor-plate", quantity: 1, chance: 0.42 },
      { type: "ammo", quantity: 12, chance: 0.5 },
      { type: "battery", quantity: 1, chance: 0.55 },
      { type: "scrap", quantity: 3, chance: 0.7 },
      { type: "weapon-smg", quantity: 1, chance: 0.12 },
      { type: "weapon-burst-pistol", quantity: 1, chance: 0.16 },
      { type: "weapon-compact-smg", quantity: 1, chance: 0.08 },
      { type: "attachment-compensator", quantity: 1, chance: 0.18 },
      { type: "attachment-vertical-grip", quantity: 1, chance: 0.18 },
    ],
  },
  {
    id: "roadside-junk-cache",
    position: new Vector3(-62, 0.45, -70),
    table: [
      { type: "scrap", quantity: 2, chance: 1 },
      { type: "cloth", quantity: 2, chance: 0.65 },
      { type: "ammo", quantity: 6, chance: 0.35 },
      { type: "battery", quantity: 1, chance: 0.22 },
    ],
  },
  {
    id: "landing-site-emergency-cache",
    position: new Vector3(-110, 0.45, -88),
    table: [
      { type: "scrap", quantity: 2, chance: 1 },
      { type: "bandage", quantity: 1, chance: 0.6 },
      { type: "ammo", quantity: 8, chance: 0.5 },
      { type: "battery", quantity: 1, chance: 0.35 },
    ],
  },
  {
    id: "ridge-miner-cache",
    position: new Vector3(-112, 0.45, 90),
    table: [
      { type: "scrap", quantity: 5, chance: 1 },
      { type: "cloth", quantity: 3, chance: 0.52 },
      { type: "electronics", quantity: 1, chance: 0.28 },
      { type: "ammo", quantity: 10, chance: 0.55 },
      { type: "anti-toxin", quantity: 1, chance: 0.22 },
    ],
  },
  {
    id: "core-pit-helium-cache",
    position: new Vector3(12, 0.45, 8),
    table: [
      { type: "scrap", quantity: 8, chance: 1 },
      { type: "rare-core", quantity: 1, chance: 0.42 },
      { type: "weapon-parts", quantity: 5, chance: 0.62 },
      { type: "electronics", quantity: 3, chance: 0.52 },
      { type: "acid-gland", quantity: 1, chance: 0.18 },
      { type: "helium-drill-core", quantity: 1, chance: 0.08 },
      { type: "attachment-thermal-optic", quantity: 1, chance: 0.12 },
    ],
  },
  {
    id: "far-side-lumen-cache",
    position: new Vector3(106, 0.45, 82),
    table: [
      { type: "alien-chitin", quantity: 4, chance: 0.72 },
      { type: "lumen-essence", quantity: 1, chance: 0.3 },
      { type: "infected-sample", quantity: 1, chance: 0.28 },
      { type: "crater-tissue", quantity: 2, chance: 0.26 },
      { type: "lumen-relic-mass", quantity: 1, chance: 0.07 },
      { type: "rare-core", quantity: 1, chance: 0.18 },
      { type: "horror-core", quantity: 1, chance: 0.04 },
      { type: "scrap", quantity: 6, chance: 0.9 },
    ],
  },
];

export class LootDirector {
  private readonly containers: LootContainer[] = [];
  private readonly containerMaterial: StandardMaterial;
  private readonly openedMaterial: StandardMaterial;
  private readonly depletedMaterial: StandardMaterial;
  private readonly lootMaterials: Record<LootType, StandardMaterial>;
  private readonly spawnedLoot: AbstractMesh[] = [];
  private rareLootChanceMultiplier = 1;

  public constructor(private readonly scene: Scene) {
    this.containerMaterial = new StandardMaterial("loot-container-material", scene);
    this.containerMaterial.diffuseColor = new Color3(0.16, 0.38, 0.74);
    this.containerMaterial.emissiveColor = themeConfig.colors.cyan.scale(0.14);

    this.openedMaterial = new StandardMaterial("loot-container-opened-material", scene);
    this.openedMaterial.diffuseColor = new Color3(0.18, 0.22, 0.34);
    this.openedMaterial.emissiveColor = themeConfig.colors.cyan.scale(0.045);

    this.depletedMaterial = new StandardMaterial("loot-container-depleted-material", scene);
    this.depletedMaterial.diffuseColor = new Color3(0.06, 0.07, 0.085);
    this.depletedMaterial.emissiveColor = themeConfig.colors.orange.scale(0.025);

    this.lootMaterials = {
      credits: this.createLootMaterial("loot-credits-material", "credits"),
      scrap: this.createLootMaterial("loot-scrap-material", "scrap"),
      medkit: this.createLootMaterial("loot-medkit-material", "medkit"),
      ammo: this.createLootMaterial("loot-ammo-material", "ammo"),
      cloth: this.createLootMaterial("loot-cloth-material", "cloth"),
      bandage: this.createLootMaterial("loot-bandage-material", "bandage"),
      "armor-plate": this.createLootMaterial("loot-armor-plate-material", "armor-plate"),
      "improved-armor-plate": this.createLootMaterial("loot-improved-armor-plate-material", "improved-armor-plate"),
      "anti-toxin": this.createLootMaterial("loot-anti-toxin-material", "anti-toxin"),
      battery: this.createLootMaterial("loot-battery-material", "battery"),
      electronics: this.createLootMaterial("loot-electronics-material", "electronics"),
      "weapon-parts": this.createLootMaterial("loot-weapon-parts-material", "weapon-parts"),
      "alien-chitin": this.createLootMaterial("loot-alien-chitin-material", "alien-chitin"),
      "lumen-essence": this.createLootMaterial("loot-lumen-essence-material", "lumen-essence"),
      "acid-gland": this.createLootMaterial("loot-acid-gland-material", "acid-gland"),
      "crater-tissue": this.createLootMaterial("loot-crater-tissue-material", "crater-tissue"),
      "horror-core": this.createLootMaterial("loot-horror-core-material", "horror-core"),
      "infected-sample": this.createLootMaterial("loot-infected-sample-material", "infected-sample"),
      "backpack-upgrade": this.createLootMaterial("loot-backpack-upgrade-material", "backpack-upgrade"),
      "tool-flashlight": this.createLootMaterial("loot-tool-flashlight-material", "tool-flashlight"),
      "rare-core": this.createLootMaterial("loot-rare-core-material", "rare-core"),
      "encrypted-data": this.createLootMaterial("loot-encrypted-data-material", "encrypted-data"),
      "target-token": this.createLootMaterial("loot-target-token-material", "target-token"),
      "dog-tag": this.createLootMaterial("loot-dog-tag-material", "dog-tag"),
      "weapon-pistol": this.createLootMaterial("loot-weapon-pistol-material", "weapon-pistol"),
      "weapon-burst-pistol": this.createLootMaterial("loot-weapon-burst-pistol-material", "weapon-burst-pistol"),
      "weapon-revolver": this.createLootMaterial("loot-weapon-revolver-material", "weapon-revolver"),
      "weapon-compact-smg": this.createLootMaterial("loot-weapon-compact-smg-material", "weapon-compact-smg"),
      "weapon-smg": this.createLootMaterial("loot-weapon-smg-material", "weapon-smg"),
      "weapon-shotgun": this.createLootMaterial("loot-weapon-shotgun-material", "weapon-shotgun"),
      "weapon-assault-rifle": this.createLootMaterial("loot-weapon-assault-rifle-material", "weapon-assault-rifle"),
      "weapon-rifle": this.createLootMaterial("loot-weapon-rifle-material", "weapon-rifle"),
      "weapon-knife": this.createLootMaterial("loot-weapon-knife-material", "weapon-knife"),
      "attachment-red-dot": this.createLootMaterial("loot-attachment-red-dot-material", "attachment-red-dot"),
      "attachment-compensator": this.createLootMaterial("loot-attachment-compensator-material", "attachment-compensator"),
      "attachment-suppressor": this.createLootMaterial("loot-attachment-suppressor-material", "attachment-suppressor"),
      "high-tier-suppressor": this.createLootMaterial("loot-high-tier-suppressor-material", "high-tier-suppressor"),
      "attachment-extended-mag": this.createLootMaterial("loot-attachment-extended-mag-material", "attachment-extended-mag"),
      "attachment-vertical-grip": this.createLootMaterial("loot-attachment-vertical-grip-material", "attachment-vertical-grip"),
      "attachment-angled-grip": this.createLootMaterial("loot-attachment-angled-grip-material", "attachment-angled-grip"),
      "attachment-thermal-optic": this.createLootMaterial("loot-attachment-thermal-optic-material", "attachment-thermal-optic"),
      "armor-light": this.createLootMaterial("loot-armor-light-material", "armor-light"),
      "advanced-medkit": this.createLootMaterial("loot-advanced-medkit-material", "advanced-medkit"),
      "weapon-repair-kit": this.createLootMaterial("loot-weapon-repair-kit-material", "weapon-repair-kit"),
      "rare-upgrade-kit": this.createLootMaterial("loot-rare-upgrade-kit-material", "rare-upgrade-kit"),
      "elite-backpack": this.createLootMaterial("loot-elite-backpack-material", "elite-backpack"),
      "helium-drill-core": this.createLootMaterial("loot-helium-drill-core-material", "helium-drill-core"),
      "lumen-relic-mass": this.createLootMaterial("loot-lumen-relic-mass-material", "lumen-relic-mass"),
      "reactor-spindle": this.createLootMaterial("loot-reactor-spindle-material", "reactor-spindle"),
      "black-box-survey-crate": this.createLootMaterial("loot-black-box-survey-crate-material", "black-box-survey-crate"),
      "sealed-mining-cache": this.createLootMaterial("loot-sealed-mining-cache-material", "sealed-mining-cache"),
    };

    this.spawnContainers();
  }

  public get containerCount(): number {
    return this.containers.length;
  }

  public tryInteract(playerPosition: Vector3, _inventory: RaidInventory): LootDirectorResult | null {
  const container = this.findNearbyOpenableContainer(playerPosition);

  if (!container) {
    return null;
  }

  this.openContainer(container);

  return {
    events: [],
    message: container.items.length > 0 ? "Container Opened" : "Empty",
  };
}

  public openNearbyContainer(playerPosition: Vector3): LootContainerView | null {
    const container = this.findNearbyOpenableContainer(playerPosition);

    if (!container) {
      return null;
    }

    this.openContainer(container);
    return this.toView(container);
  }

  public getNearbyContainerId(playerPosition: Vector3): string | null {
    return this.findNearbyOpenableContainer(playerPosition)?.id ?? null;
  }

  public getContainerView(containerId: string): LootContainerView | null {
    const container = this.containers.find((item) => item.id === containerId);
    return container ? this.toView(container) : null;
  }

  public applyNetworkContainerState(state: NetworkContainerState): LootContainerView | null {
    const container = this.containers.find((item) => item.id === state.id);

    if (!container) {
      return null;
    }

    container.opened = state.opened;
    container.items = state.items
      .filter((item) => item.type in itemDefinitions && item.quantity > 0)
      .map((item) => {
        const type = item.type as LootType;
        return {
          type,
          label: getItemDefinition(type).label,
          quantity: item.quantity,
        };
      });
    container.mesh.metadata = {
      ...container.mesh.metadata,
      opened: state.opened,
      depleted: state.depleted,
    };

    if (state.opened) {
      container.mesh.material = this.openedMaterial;
      container.mesh.rotation.x = 0.35;
    }

    if (state.depleted) {
      this.markContainerDepleted(container);
    } else {
      container.mesh.setEnabled(true);
      container.mesh.scaling.y = 1;
    }

    return this.toView(container);
  }

  public takeItem(containerId: string, itemIndex: number, inventory: RaidInventory): LootEvent | null {
    const container = this.containers.find((item) => item.id === containerId);
    const item = container?.items[itemIndex];

    if (!container || !item) {
      return null;
    }

    const event = inventory.add(item.type, item.quantity);

    if (!event) {
      return null;
    }

    container.items.splice(itemIndex, 1);
    this.spawnLootPing(item.type, container.mesh.position, itemIndex + 1);
    return event;
  }

  public takeAll(containerId: string, inventory: RaidInventory): LootEvent[] {
    const container = this.containers.find((item) => item.id === containerId);

    if (!container) {
      return [];
    }

    if (!inventory.canAddAll(container.items)) {
      return [];
    }

    const events: LootEvent[] = [];

    for (let i = container.items.length - 1; i >= 0; i -= 1) {
      const event = this.takeItem(containerId, i, inventory);

      if (event) {
        events.unshift(event);
      }
    }

    return events;
  }

  public closeContainer(containerId: string): void {
    const container = this.containers.find((item) => item.id === containerId);

    if (container && container.items.length === 0) {
      this.markContainerDepleted(container);
    }
  }

  private openContainer(container: LootContainer): void {
    if (container.opened) {
      return;
    }

    container.opened = true;
    container.mesh.material = this.openedMaterial;
    container.mesh.rotation.x = 0.35;
    container.mesh.scaling.y = 1;

    for (const drop of container.table) {
      if (Math.random() > this.adjustedDropChance(drop, container.mesh.position)) {
        continue;
      }

      container.items.push({
        type: drop.type,
        label: getItemDefinition(drop.type).label,
        quantity: drop.quantity,
      });
    }
  }

  private markContainerDepleted(container: LootContainer): void {
    container.mesh.setEnabled(true);
    container.mesh.material = this.depletedMaterial;
    container.mesh.rotation.x = 0.35;
    container.mesh.scaling.y = 0.46;
    container.mesh.metadata = {
      ...container.mesh.metadata,
      opened: true,
      depleted: true,
    };
  }

  public reset(): void {
    this.dispose();
    this.spawnContainers();
  }

  public setRareLootChanceMultiplier(multiplier: number): void {
    this.rareLootChanceMultiplier = multiplier;
  }

  public spawnEventContainer(id: string, position: Vector3, table: LootDrop[]): void {
    this.createContainer({
      id,
      position,
      table,
    });
  }

  public spawnDroppedLoot(drop: LootStack, playerPosition: Vector3): void {
    const forwardScatter = new Vector3((Math.random() - 0.5) * 1.2, 0, 1.15 + Math.random() * 0.45);
    this.spawnEventContainer(
      `dropped-${drop.type}-${Date.now()}`,
      playerPosition.add(forwardScatter).add(new Vector3(0, 0.45, 0)),
      [{ type: drop.type, quantity: drop.quantity, chance: 1 }],
    );
  }

  public dispose(): void {
    for (const container of this.containers) {
      container.mesh.dispose();
    }

    for (const loot of this.spawnedLoot) {
      loot.dispose();
    }

    this.containers.length = 0;
    this.spawnedLoot.length = 0;
  }

  private spawnContainers(): void {
    for (const definition of containerDefinitions) {
      this.createContainer(definition);
    }
  }

  private createContainer(definition: LootContainerDefinition): void {
    const rarity = this.highestRarity(definition.table);
    const rarityColor = themeConfig.rarityColors[rarity];
    const material = this.containerMaterial.clone(`${definition.id}-${rarity}-container-material`);
    material.diffuseColor = rarityColor.scale(rarity === "common" ? 0.58 : 0.72);
    material.emissiveColor = rarityColor.scale(rarity === "common" ? 0.14 : 0.34);
    material.specularColor = new Color3(0.22, 0.24, 0.28);

    const mesh = MeshBuilder.CreateBox(
      definition.id,
      { width: 1.7, height: 0.85, depth: 1.2 },
      this.scene,
    );
    mesh.position.copyFrom(definition.position);
    mesh.material = material;
    mesh.checkCollisions = true;
    mesh.metadata = { gameplayTag: "loot-container", opened: false, rarity };

    const marker = MeshBuilder.CreateSphere(`${definition.id}-rarity-glow`, { diameter: 0.34, segments: 8 }, this.scene);
    marker.parent = mesh;
    marker.position.set(0, 0.68, 0);
    marker.material = this.createRarityMarkerMaterial(`${definition.id}-${rarity}-marker-material`, rarity);
    marker.checkCollisions = false;
    marker.metadata = { gameplayTag: "loot-rarity-marker", rarity };

    this.containers.push({
      id: definition.id,
      mesh,
      opened: false,
      table: definition.table,
      items: [],
    });
  }

  private findNearbyOpenableContainer(playerPosition: Vector3): LootContainer | null {
    let closest: LootContainer | null = null;
    let closestDistance = interactionRange;

    for (const container of this.containers) {
      if (container.opened && container.items.length === 0) {
        continue;
      }

      const distance = Vector3.Distance(container.mesh.position, playerPosition);

      if (distance <= closestDistance) {
        closest = container;
        closestDistance = distance;
      }
    }

    return closest;
  }

  private spawnLootPing(type: LootType, origin: Vector3, index: number): void {
    const loot = MeshBuilder.CreateSphere(
      `loot-ping-${type}`,
      { diameter: type === "rare-core" || type.startsWith("weapon-") || type.startsWith("attachment-") ? 0.34 : 0.24, segments: 10 },
      this.scene,
    );
    loot.position.copyFrom(origin.add(new Vector3((index - 1) * 0.35, 0.65, 0.35)));
    loot.material = this.lootMaterials[type];
    this.spawnedLoot.push(loot);
  }

  private adjustedDropChance(drop: LootDrop, position: Vector3): number {
    const distanceFromShip = Vector3.Distance(position, mapLayoutConfig.shipLandingSitePosition);
    const distanceMultiplier = 1 + Math.min(0.75, Math.max(0, distanceFromShip - 45) / 150);
    if (!this.isRareDrop(drop.type)) {
      return Math.min(0.98, drop.chance * (1 + Math.min(0.18, distanceMultiplier - 1)));
    }

    return Math.min(0.95, drop.chance * this.rareLootChanceMultiplier * distanceMultiplier);
  }

  private isRareDrop(type: LootType): boolean {
    return lootRarityByType(type) === "rare" || lootRarityByType(type) === "epic" || lootRarityByType(type) === "legendary" || lootRarityByType(type) === "core";
  }

  private highestRarity(table: readonly LootDrop[]): LootRarity {
    return table.reduce<LootRarity>((highest, drop) => {
      const rarity = lootRarityByType(drop.type);
      return rarityScore[rarity] > rarityScore[highest] ? rarity : highest;
    }, "common");
  }

  private toView(container: LootContainer): LootContainerView {
    return {
      id: container.id,
      title: this.formatContainerTitle(container.id),
      items: container.items.map((item) => ({ ...item })),
    };
  }

  private formatContainerTitle(id: string): string {
    return id
      .split("-")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  }

  private createLootMaterial(name: string, type: LootType): StandardMaterial {
    const color = themeConfig.rarityColors[lootRarityByType(type)];
    const material = new StandardMaterial(name, this.scene);
    material.diffuseColor = color;
    material.emissiveColor = color.scale(0.38);
    material.specularColor = new Color3(0.18, 0.18, 0.2);
    return material;
  }

  private createRarityMarkerMaterial(name: string, rarity: LootRarity): StandardMaterial {
    const color = themeConfig.rarityColors[rarity];
    const material = new StandardMaterial(name, this.scene);
    material.diffuseColor = color;
    material.emissiveColor = color.scale(0.55);
    material.specularColor = new Color3(0.2, 0.22, 0.26);
    return material;
  }
}
