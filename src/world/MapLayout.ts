import { Vector3 } from "@babylonjs/core";
import { themeConfig } from "../theme/ThemeConfig";

export type PoiDefinition = Readonly<{
  id: string;
  name: string;
  center: Vector3;
  radius: number;
}>;

export type ExtractionZoneDefinition = Readonly<{
  id: string;
  name: string;
  center: Vector3;
  radius: number;
  temporary?: boolean;
  durationSeconds?: number;
}>;

export const mapLayoutConfig = {
  floorSize: 300,
  playableRadius: 140,
  boundaryRadius: 150,
  size: 300,
  wallHeight: 5.2,
  poiSpacingMultiplier: 1.55,
  extractionSpacingMultiplier: 1.55,
  lootSpacingMultiplier: 1.45,
  enemySpawnSpacingMultiplier: 1.45,
  shipLandingSitePosition: new Vector3(-104, 0, -106),
  playerSpawnPosition: new Vector3(-104, 1.05, -96),
} as const;

export const poiDefinitions: PoiDefinition[] = [
  {
    id: "warehouse",
    name: themeConfig.poiNames.warehouse,
    center: new Vector3(-92, 0, -22),
    radius: 34,
  },
  {
    id: "checkpoint",
    name: themeConfig.poiNames.checkpoint,
    center: new Vector3(62, 0, -96),
    radius: 30,
  },
  {
    id: "abandoned-camp",
    name: themeConfig.poiNames["abandoned-camp"],
    center: new Vector3(92, 0, 34),
    radius: 30,
  },
  {
    id: "data-shack",
    name: themeConfig.poiNames["data-shack"],
    center: new Vector3(-78, 0, 82),
    radius: 28,
  },
  {
    id: "core-pit",
    name: themeConfig.poiNames["core-pit"],
    center: new Vector3(6, 0, 0),
    radius: 34,
  },
];

export const extractionZoneDefinitions: ExtractionZoneDefinition[] = [
  {
    id: "ridge-extract",
    name: `${themeConfig.extractionName} - Ridge`,
    center: new Vector3(-116, 0, 112),
    radius: 4.2,
  },
  {
    id: "service-road-extract",
    name: `${themeConfig.extractionName} - Service Road`,
    center: new Vector3(118, 0, -112),
    radius: 4.2,
  },
  {
    id: "event-extract-camp-road",
    name: `${themeConfig.extractionName} - Creator Road`,
    center: new Vector3(-122, 0, -38),
    radius: 3.8,
    temporary: true,
  },
  {
    id: "event-extract-north-yard",
    name: `${themeConfig.extractionName} - North Yard`,
    center: new Vector3(18, 0, 124),
    radius: 3.8,
    temporary: true,
  },
  {
    id: "event-extract-warehouse-tunnel",
    name: `${themeConfig.extractionName} - Drop Tunnel`,
    center: new Vector3(120, 0, 54),
    radius: 3.8,
    temporary: true,
  },
];

export const permanentExtractionZoneDefinitions = extractionZoneDefinitions.filter((zone) => !zone.temporary);
export const temporaryExtractionZoneDefinitions = extractionZoneDefinitions.filter((zone) => zone.temporary);

export const getPoiNameAtPosition = (position: Vector3): string | null => {
  for (const poi of poiDefinitions) {
    const distance = Math.hypot(position.x - poi.center.x, position.z - poi.center.z);

    if (distance <= poi.radius) {
      return poi.name;
    }
  }

  return null;
};
