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
}>;

export const mapLayoutConfig = {
  size: 180,
  wallHeight: 4.5,
} as const;

export const poiDefinitions: PoiDefinition[] = [
  {
    id: "warehouse",
    name: themeConfig.poiNames.warehouse,
    center: new Vector3(46, 0, -32),
    radius: 30,
  },
  {
    id: "checkpoint",
    name: themeConfig.poiNames.checkpoint,
    center: new Vector3(-12, 0, -48),
    radius: 24,
  },
  {
    id: "abandoned-camp",
    name: themeConfig.poiNames["abandoned-camp"],
    center: new Vector3(-44, 0, 30),
    radius: 26,
  },
  {
    id: "data-shack",
    name: themeConfig.poiNames["data-shack"],
    center: new Vector3(30, 0, 38),
    radius: 22,
  },
  {
    id: "core-pit",
    name: themeConfig.poiNames["core-pit"],
    center: new Vector3(0, 0, 4),
    radius: 24,
  },
];

export const extractionZoneDefinitions: ExtractionZoneDefinition[] = [
  {
    id: "ridge-extract",
    name: `${themeConfig.extractionName} - Ridge`,
    center: new Vector3(-74, 0, 70),
    radius: 3.3,
  },
  {
    id: "service-road-extract",
    name: `${themeConfig.extractionName} - Service Road`,
    center: new Vector3(74, 0, -70),
    radius: 3.3,
  },
  {
    id: "event-extract-camp-road",
    name: `${themeConfig.extractionName} - Creator Road`,
    center: new Vector3(-70, 0, -16),
    radius: 3.1,
    temporary: true,
  },
  {
    id: "event-extract-north-yard",
    name: `${themeConfig.extractionName} - North Yard`,
    center: new Vector3(12, 0, 76),
    radius: 3.1,
    temporary: true,
  },
  {
    id: "event-extract-warehouse-tunnel",
    name: `${themeConfig.extractionName} - Drop Tunnel`,
    center: new Vector3(70, 0, 28),
    radius: 3.1,
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
