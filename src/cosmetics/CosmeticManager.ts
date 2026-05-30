import { Color3 } from "@babylonjs/core";
import type { LootRarity } from "../theme/ThemeConfig";

export type CosmeticCategory =
  | "outfit"
  | "headgear"
  | "mask"
  | "backpack"
  | "weaponWrap"
  | "emote"
  | "banner";

export type CosmeticId =
  | "default-raider"
  | "neon-root-hoodie"
  | "glitch-runner"
  | "scrap-scout"
  | "dark-core-variant"
  | "camo-core-raider"
  | "fn-style-operator"
  | "glitch-scout"
  | "scrapyard-striker"
  | "white-gold-raider"
  | "root-rot-variant"
  | "streamsniper-elite"
  | "headgear-none"
  | "root-cap"
  | "glitch-visor"
  | "mask-default"
  | "mask-cyan"
  | "pack-default"
  | "pack-root-rig"
  | "wrap-default"
  | "wrap-neon-root"
  | "wrap-glitch-purple"
  | "wrap-scrap-orange"
  | "wrap-core-cyan"
  | "wrap-camo-core"
  | "wrap-white-gold"
  | "wrap-dark-matter"
  | "wrap-streamline-green"
  | "wrap-raid-winner-gold"
  | "emote-ready"
  | "banner-default"
  | "banner-core";

export type CosmeticPalette = Readonly<{
  hoodie: Color3;
  jacketDark: Color3;
  vest: Color3;
  boots: Color3;
  gloves: Color3;
  visor: Color3;
  glow: Color3;
  accent: Color3;
}>;

export type CosmeticDefinition = Readonly<{
  id: CosmeticId;
  category: CosmeticCategory;
  name: string;
  rarity: LootRarity;
  unlocked: boolean;
  description: string;
  source: "starter" | "crafted" | "contract reward" | "vendor" | "future event";
  palette?: Partial<CosmeticPalette>;
}>;

export type CosmeticLoadout = Readonly<Record<CosmeticCategory, CosmeticId>>;

export type CosmeticManagerState = Readonly<{
  selectedCategory: CosmeticCategory;
  equipped: CosmeticLoadout;
  previewRotation: number;
}>;

const storageKey = "darc-raiders.cosmetics.v1";

export const defaultCosmeticPalette: CosmeticPalette = {
  hoodie: new Color3(0.12, 0.48, 0.9),
  jacketDark: new Color3(0.08, 0.12, 0.25),
  vest: new Color3(0.06, 0.16, 0.22),
  boots: new Color3(0.05, 0.06, 0.08),
  gloves: new Color3(0.04, 0.08, 0.12),
  visor: new Color3(0.08, 0.95, 0.9),
  glow: new Color3(0.18, 1, 0.46),
  accent: new Color3(1, 0.48, 0.12),
};

export const cosmeticCategories: CosmeticCategory[] = [
  "outfit",
  "headgear",
  "mask",
  "backpack",
  "weaponWrap",
  "emote",
  "banner",
];

export const cosmeticCategoryLabels: Record<CosmeticCategory, string> = {
  outfit: "Skins",
  headgear: "Headgear",
  mask: "Mask",
  backpack: "Back Bling",
  weaponWrap: "Wraps",
  emote: "Emotes",
  banner: "Banners",
};

export const defaultCosmetics: CosmeticLoadout = {
  outfit: "default-raider",
  headgear: "headgear-none",
  mask: "mask-default",
  backpack: "pack-default",
  weaponWrap: "wrap-default",
  emote: "emote-ready",
  banner: "banner-default",
};

export const cosmeticDefinitions: Record<CosmeticId, CosmeticDefinition> = {
  "default-raider": {
    id: "default-raider",
    category: "outfit",
    name: "Default Crater Runner",
    rarity: "common",
    unlocked: true,
    description: "Clean starter runner kit.",
    source: "starter",
  },
  "neon-root-hoodie": {
    id: "neon-root-hoodie",
    category: "outfit",
    name: "Neon Root Hoodie",
    rarity: "uncommon",
    unlocked: true,
    description: "Charcoal cloth with bright root energy.",
    source: "starter",
    palette: {
      hoodie: new Color3(0.04, 0.08, 0.07),
      jacketDark: new Color3(0.02, 0.06, 0.05),
      glow: new Color3(0.18, 1, 0.46),
      accent: new Color3(0.18, 1, 0.46),
    },
  },
  "glitch-runner": {
    id: "glitch-runner",
    category: "outfit",
    name: "Glitch Runner",
    rarity: "rare",
    unlocked: true,
    description: "Black and cyan kit with purple corruption trims.",
    source: "starter",
    palette: {
      hoodie: new Color3(0.02, 0.04, 0.08),
      jacketDark: new Color3(0.01, 0.02, 0.05),
      visor: new Color3(0.1, 0.9, 1),
      glow: new Color3(0.72, 0.24, 1),
      accent: new Color3(0.72, 0.24, 1),
    },
  },
  "scrap-scout": {
    id: "scrap-scout",
    category: "outfit",
    name: "Scrap Scout",
    rarity: "rare",
    unlocked: true,
    description: "Orange scrapyard accents for loud loot runs.",
    source: "crafted",
    palette: {
      hoodie: new Color3(0.16, 0.12, 0.08),
      jacketDark: new Color3(0.08, 0.07, 0.06),
      vest: new Color3(0.16, 0.13, 0.1),
      glow: new Color3(1, 0.48, 0.12),
      accent: new Color3(1, 0.48, 0.12),
    },
  },
  "dark-core-variant": {
    id: "dark-core-variant",
    category: "outfit",
    name: "Dark Core Variant",
    rarity: "legendary",
    unlocked: true,
    description: "White, gold, and cyan for clean high-risk flexing.",
    source: "contract reward",
    palette: {
      hoodie: new Color3(0.86, 0.88, 0.92),
      jacketDark: new Color3(0.08, 0.08, 0.1),
      vest: new Color3(0.95, 0.78, 0.22),
      boots: new Color3(0.08, 0.08, 0.1),
      visor: new Color3(0.12, 0.95, 1),
      glow: new Color3(0.12, 0.95, 1),
      accent: new Color3(1, 0.82, 0.18),
    },
  },
  "camo-core-raider": {
    id: "camo-core-raider",
    category: "outfit",
    name: "Camo Core Runner",
    rarity: "epic",
    unlocked: true,
    description: "Camo-tinted lunar runner kit with cyan suit hardware.",
    source: "starter",
    palette: {
      hoodie: new Color3(0.13, 0.2, 0.16),
      jacketDark: new Color3(0.05, 0.08, 0.06),
      vest: new Color3(0.16, 0.24, 0.14),
      visor: new Color3(0.12, 0.95, 1),
      glow: new Color3(0.12, 0.95, 1),
      accent: new Color3(0.36, 0.78, 0.42),
    },
  },
  "fn-style-operator": {
    id: "fn-style-operator",
    category: "outfit",
    name: "FN-Style Runner",
    rarity: "epic",
    unlocked: true,
    description: "Chunky readable streamer-ready Crater Runner silhouette.",
    source: "starter",
    palette: {
      hoodie: new Color3(0.07, 0.14, 0.28),
      jacketDark: new Color3(0.03, 0.05, 0.12),
      vest: new Color3(0.14, 0.2, 0.36),
      glow: new Color3(0.18, 1, 0.46),
      accent: new Color3(1, 0.48, 0.12),
    },
  },
  "glitch-scout": {
    id: "glitch-scout",
    category: "outfit",
    name: "Glitch Scout",
    rarity: "rare",
    unlocked: true,
    description: "Cyan visor scout with purple signal corruption.",
    source: "contract reward",
    palette: {
      hoodie: new Color3(0.02, 0.09, 0.12),
      jacketDark: new Color3(0.02, 0.02, 0.07),
      visor: new Color3(0.18, 1, 1),
      glow: new Color3(0.72, 0.24, 1),
      accent: new Color3(0.18, 1, 1),
    },
  },
  "scrapyard-striker": {
    id: "scrapyard-striker",
    category: "outfit",
    name: "Scrapyard Striker",
    rarity: "uncommon",
    unlocked: true,
    description: "Orange scrap accents built for loud POI pushes.",
    source: "vendor",
    palette: {
      hoodie: new Color3(0.16, 0.1, 0.05),
      jacketDark: new Color3(0.06, 0.05, 0.05),
      vest: new Color3(0.24, 0.12, 0.04),
      glow: new Color3(1, 0.48, 0.12),
      accent: new Color3(1, 0.32, 0.06),
    },
  },
  "white-gold-raider": {
    id: "white-gold-raider",
    category: "outfit",
    name: "White Gold Runner",
    rarity: "legendary",
    unlocked: false,
    description: "Clean rare variant reserved for future prestige rewards.",
    source: "future event",
    palette: {
      hoodie: new Color3(0.92, 0.94, 0.98),
      jacketDark: new Color3(0.14, 0.13, 0.12),
      vest: new Color3(1, 0.78, 0.18),
      glow: new Color3(1, 0.82, 0.18),
      accent: new Color3(0.12, 0.95, 1),
    },
  },
  "root-rot-variant": {
    id: "root-rot-variant",
    category: "outfit",
    name: "Root Rot Variant",
    rarity: "epic",
    unlocked: false,
    description: "Green and purple corruption skin for future event drops.",
    source: "future event",
    palette: {
      hoodie: new Color3(0.06, 0.16, 0.07),
      jacketDark: new Color3(0.05, 0.03, 0.09),
      glow: new Color3(0.18, 1, 0.46),
      accent: new Color3(0.72, 0.24, 1),
    },
  },
  "streamsniper-elite": {
    id: "streamsniper-elite",
    category: "outfit",
    name: "Lumen Trophy Elite",
    rarity: "core",
    unlocked: false,
    description: "Flashy elite identity placeholder for contract trophies.",
    source: "contract reward",
    palette: {
      hoodie: new Color3(0.05, 0.05, 0.08),
      jacketDark: new Color3(0.02, 0.02, 0.03),
      vest: new Color3(0.25, 0.18, 0.04),
      visor: new Color3(1, 0.82, 0.18),
      glow: new Color3(0.12, 0.95, 1),
      accent: new Color3(1, 0.82, 0.18),
    },
  },
  "headgear-none": {
    id: "headgear-none",
    category: "headgear",
    name: "No Headgear",
    rarity: "common",
    unlocked: true,
    description: "Keep the silhouette clean.",
    source: "starter",
  },
  "root-cap": {
    id: "root-cap",
    category: "headgear",
    name: "Root Cap",
    rarity: "uncommon",
    unlocked: true,
    description: "Simple runner cap with root glow stitching.",
    source: "starter",
  },
  "glitch-visor": {
    id: "glitch-visor",
    category: "headgear",
    name: "Glitch Visor",
    rarity: "epic",
    unlocked: false,
    description: "Locked placeholder for future event rewards.",
    source: "future event",
  },
  "mask-default": {
    id: "mask-default",
    category: "mask",
    name: "Default Mask",
    rarity: "common",
    unlocked: true,
    description: "Readable starter facewear.",
    source: "starter",
  },
  "mask-cyan": {
    id: "mask-cyan",
    category: "mask",
    name: "Cyan Faceplate",
    rarity: "rare",
    unlocked: true,
    description: "Brighter visor pass for stormy Crater Runs.",
    source: "crafted",
    palette: { visor: new Color3(0.1, 0.9, 1) },
  },
  "pack-default": {
    id: "pack-default",
    category: "backpack",
    name: "Default Pack",
    rarity: "common",
    unlocked: true,
    description: "Cosmetic pack shell only. Capacity still comes from gear.",
    source: "starter",
  },
  "pack-root-rig": {
    id: "pack-root-rig",
    category: "backpack",
    name: "Root Rig",
    rarity: "rare",
    unlocked: true,
    description: "Green glow backpack shell with no stat changes.",
    source: "crafted",
    palette: { vest: new Color3(0.04, 0.18, 0.12), accent: new Color3(0.18, 1, 0.46) },
  },
  "wrap-default": {
    id: "wrap-default",
    category: "weaponWrap",
    name: "Default",
    rarity: "common",
    unlocked: true,
    description: "Factory finish.",
    source: "starter",
  },
  "wrap-neon-root": {
    id: "wrap-neon-root",
    category: "weaponWrap",
    name: "Neon Root",
    rarity: "uncommon",
    unlocked: true,
    description: "Green root glow weapon finish.",
    source: "starter",
    palette: { accent: new Color3(0.18, 1, 0.46) },
  },
  "wrap-glitch-purple": {
    id: "wrap-glitch-purple",
    category: "weaponWrap",
    name: "Glitch Purple",
    rarity: "rare",
    unlocked: true,
    description: "Purple corrupted weapon finish.",
    source: "starter",
    palette: { accent: new Color3(0.72, 0.24, 1) },
  },
  "wrap-scrap-orange": {
    id: "wrap-scrap-orange",
    category: "weaponWrap",
    name: "Scrap Orange",
    rarity: "rare",
    unlocked: true,
    description: "Orange scrap-yard weapon finish.",
    source: "crafted",
    palette: { accent: new Color3(1, 0.48, 0.12) },
  },
  "wrap-core-cyan": {
    id: "wrap-core-cyan",
    category: "weaponWrap",
    name: "Core Cyan",
    rarity: "epic",
    unlocked: true,
    description: "Cyan core-energy weapon finish.",
    source: "contract reward",
    palette: { accent: new Color3(0.12, 0.95, 1) },
  },
  "wrap-camo-core": {
    id: "wrap-camo-core",
    category: "weaponWrap",
    name: "Camo Core",
    rarity: "rare",
    unlocked: true,
    description: "Muted camo weapon finish with cyan core glow.",
    source: "starter",
    palette: { accent: new Color3(0.36, 0.78, 0.42), glow: new Color3(0.12, 0.95, 1) },
  },
  "wrap-white-gold": {
    id: "wrap-white-gold",
    category: "weaponWrap",
    name: "White Gold",
    rarity: "legendary",
    unlocked: false,
    description: "Prestige white and gold wrap placeholder.",
    source: "future event",
    palette: { accent: new Color3(1, 0.82, 0.18), glow: new Color3(0.92, 0.94, 0.98) },
  },
  "wrap-dark-matter": {
    id: "wrap-dark-matter",
    category: "weaponWrap",
    name: "Dark Matter",
    rarity: "epic",
    unlocked: false,
    description: "Dark purple corruption wrap for future high-risk rewards.",
    source: "contract reward",
    palette: { accent: new Color3(0.72, 0.24, 1), glow: new Color3(0.1, 0.05, 0.2) },
  },
  "wrap-streamline-green": {
    id: "wrap-streamline-green",
    category: "weaponWrap",
    name: "Streamline Green",
    rarity: "uncommon",
    unlocked: true,
    description: "Bright readable green weapon wrap.",
    source: "starter",
    palette: { accent: new Color3(0.18, 1, 0.46) },
  },
  "wrap-raid-winner-gold": {
    id: "wrap-raid-winner-gold",
    category: "weaponWrap",
    name: "Extraction Gold",
    rarity: "core",
    unlocked: false,
    description: "Gold wrap reserved for future clean extraction streak rewards.",
    source: "future event",
    palette: { accent: new Color3(1, 0.82, 0.18), glow: new Color3(0.12, 0.95, 1) },
  },
  "emote-ready": {
    id: "emote-ready",
    category: "emote",
    name: "Ready Check",
    rarity: "common",
    unlocked: true,
    description: "Placeholder emote slot for future lobby identity.",
    source: "starter",
  },
  "banner-default": {
    id: "banner-default",
    category: "banner",
    name: "Dark Craters Default",
    rarity: "common",
    unlocked: true,
    description: "Starter profile card.",
    source: "starter",
  },
  "banner-core": {
    id: "banner-core",
    category: "banner",
    name: "Core Flex",
    rarity: "legendary",
    unlocked: false,
    description: "Locked placeholder for high-value event rewards.",
    source: "future event",
  },
};

const defaultState: CosmeticManagerState = {
  selectedCategory: "outfit",
  equipped: defaultCosmetics,
  previewRotation: 0,
};

export class CosmeticManager {
  private state: CosmeticManagerState = this.load();

  public get snapshot(): CosmeticManagerState {
    return {
      ...this.state,
      equipped: { ...this.state.equipped },
    };
  }

  public get definitions(): CosmeticDefinition[] {
    return Object.values(cosmeticDefinitions);
  }

  public setCategory(category: CosmeticCategory): void {
    this.state = { ...this.state, selectedCategory: category };
    this.save();
  }

  public rotatePreview(deltaDegrees: number): void {
    this.state = {
      ...this.state,
      previewRotation: (this.state.previewRotation + deltaDegrees + 360) % 360,
    };
    this.save();
  }

  public equip(id: CosmeticId): string {
    const definition = cosmeticDefinitions[id];

    if (!definition) {
      console.warn(`Unknown cosmetic ignored: ${id}`);
      return "Cosmetic unavailable";
    }

    if (!definition.unlocked) {
      return `${definition.name} is locked`;
    }

    this.state = {
      ...this.state,
      selectedCategory: definition.category,
      equipped: {
        ...this.state.equipped,
        [definition.category]: id,
      },
    };
    this.save();
    return `${definition.name} equipped`;
  }

  public resetToDefault(): void {
    this.state = {
      ...defaultState,
      previewRotation: this.state.previewRotation,
    };
    this.save();
  }

  public randomizeUnlocked(): string {
    const equipped = { ...this.state.equipped };

    for (const category of cosmeticCategories) {
      const available = this.definitions.filter((definition) => definition.category === category && definition.unlocked);
      if (available.length > 0) {
        equipped[category] = available[Math.floor(Math.random() * available.length)].id;
      }
    }

    this.state = {
      ...this.state,
      equipped,
    };
    this.save();
    return "Unlocked cosmetics randomized";
  }

  public getEquippedName(category: CosmeticCategory): string {
    return cosmeticDefinitions[this.state.equipped[category]]?.name ?? cosmeticDefinitions[defaultCosmetics[category]].name;
  }

  public getPalette(loadout: CosmeticLoadout = this.state.equipped): CosmeticPalette {
    const palette = { ...defaultCosmeticPalette };

    for (const id of Object.values(loadout)) {
      const definition = cosmeticDefinitions[id];

      if (!definition?.palette) {
        continue;
      }

      Object.assign(palette, definition.palette);
    }

    return palette;
  }

  private load(): CosmeticManagerState {
    try {
      const raw = window.localStorage.getItem(storageKey);

      if (!raw) {
        return defaultState;
      }

      const parsed = JSON.parse(raw) as Partial<CosmeticManagerState>;
      return this.sanitizeState(parsed);
    } catch (error) {
      console.warn("Cosmetic settings failed to load; using defaults.", error);
      return defaultState;
    }
  }

  private sanitizeState(candidate: Partial<CosmeticManagerState>): CosmeticManagerState {
    const equipped = { ...defaultCosmetics };

    for (const category of cosmeticCategories) {
      const id = candidate.equipped?.[category];
      const definition = id ? cosmeticDefinitions[id] : null;

      if (definition?.category === category && definition.unlocked) {
        equipped[category] = definition.id;
      }
    }

    const selectedCategory = candidate.selectedCategory && cosmeticCategories.includes(candidate.selectedCategory)
      ? candidate.selectedCategory
      : defaultState.selectedCategory;

    return {
      selectedCategory,
      equipped,
      previewRotation: Number.isFinite(candidate.previewRotation) ? candidate.previewRotation ?? 0 : 0,
    };
  }

  private save(): void {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(this.state));
    } catch (error) {
      console.warn("Cosmetic settings could not be saved.", error);
    }
  }
}
