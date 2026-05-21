export type HQStationId =
  | "raid-terminal"
  | "loadout-locker"
  | "stash"
  | "workshop"
  | "vendor-row"
  | "style-locker"
  | "intel-board";

export type HQStationDefinition = Readonly<{
  id: HQStationId;
  title: string;
  eyebrow: string;
  description: string;
  action: string;
  accent: "green" | "cyan" | "purple" | "orange" | "gold";
}>;

export type HQState = Readonly<{
  selectedStationId: HQStationId;
  visits: number;
  lastOpenedAt: string | null;
}>;

const storageKey = "darc-raiders.hq-hub.v1";

export const hqStations: readonly HQStationDefinition[] = [
  {
    id: "raid-terminal",
    title: "Crater Runs",
    eyebrow: "Launch",
    description: "Deploy into lunar crater zones or future matchmaking queues.",
    action: "start",
    accent: "green",
  },
  {
    id: "loadout-locker",
    title: "Loadout Locker",
    eyebrow: "Gear",
    description: "Weapons, armor, EVA pack, consumables, and oxygen prep.",
    action: "hq-loadout",
    accent: "cyan",
  },
  {
    id: "stash",
    title: "Habitat Stash",
    eyebrow: "Storage",
    description: "Extracted loot, Helium-3, alien materials, and faction tags.",
    action: "stash",
    accent: "gold",
  },
  {
    id: "workshop",
    title: "Fabrication Bench",
    eyebrow: "Craft",
    description: "Suit repairs, weapon upgrades, fabrication hooks, and durability.",
    action: "workbench",
    accent: "orange",
  },
  {
    id: "vendor-row",
    title: "Faction Vendors",
    eyebrow: "Economy",
    description: "Trade, sell loot, repair gear, and build faction reputation.",
    action: "vendors",
    accent: "purple",
  },
  {
    id: "style-locker",
    title: "Style Locker",
    eyebrow: "Cosmetics",
    description: "Crater Runner suits, wraps, EVA pack looks, banners, and identity.",
    action: "hq-style",
    accent: "cyan",
  },
  {
    id: "intel-board",
    title: "Faction Contracts",
    eyebrow: "Objectives",
    description: "Faction contracts, crater conditions, objective previews, and hazards.",
    action: "intel",
    accent: "green",
  },
];

const defaultState: HQState = {
  selectedStationId: "raid-terminal",
  visits: 0,
  lastOpenedAt: null,
};

const isStationId = (value: unknown): value is HQStationId =>
  typeof value === "string" && hqStations.some((station) => station.id === value);

export class HQManager {
  private state: HQState = this.load();

  public get snapshot(): HQState {
    return { ...this.state };
  }

  public open(stationId: HQStationId): void {
    this.state = {
      selectedStationId: stationId,
      visits: this.state.visits + 1,
      lastOpenedAt: new Date().toISOString(),
    };
    this.save();
  }

  private load(): HQState {
    try {
      const raw = window.localStorage.getItem(storageKey);

      if (!raw) {
        return defaultState;
      }

      const parsed = JSON.parse(raw) as Partial<HQState>;
      return {
        selectedStationId: isStationId(parsed.selectedStationId)
          ? parsed.selectedStationId
          : defaultState.selectedStationId,
        visits: Number.isFinite(parsed.visits) ? Math.max(0, Math.floor(parsed.visits ?? 0)) : 0,
        lastOpenedAt: typeof parsed.lastOpenedAt === "string" ? parsed.lastOpenedAt : null,
      };
    } catch (error) {
      console.warn("HQ state failed to load; using default hub state.", error);
      return defaultState;
    }
  }

  private save(): void {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(this.state));
    } catch (error) {
      console.warn("HQ state could not be saved.", error);
    }
  }
}
