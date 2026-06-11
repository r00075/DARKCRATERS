import {
  AbstractMesh,
  AssetContainer,
  Camera,
  Color3,
  Light,
  LinesMesh,
  MeshBuilder,
  PointLight,
  Scene,
  SceneLoader,
  StandardMaterial,
  TransformNode,
  Vector3,
} from "@babylonjs/core";
import "@babylonjs/loaders/glTF";
import {
  extractionZoneDefinitions,
  getPoiNameAtPosition,
  mapLayoutConfig,
  poiDefinitions,
} from "./MapLayout";
import { createTychoScarVisualSlice } from "./TychoScarVisualSlice";
import { themeConfig } from "../theme/ThemeConfig";

export type WorldMap = Readonly<{
  getCurrentPoiName: (position: Vector3) => string | null;
  setActiveExtractionZones: (ids: readonly string[]) => void;
  setContractVariant: (type: string | null, poiName: string | null) => void;
}>;

const halfMapSize = mapLayoutConfig.size / 2;

type MapStructureAssetKey =
  | "mine-access-portal"
  | "nebula-freight-crate"
  | "tychostar-gateway"
  | "looped-industrial-pipe";

type MapStructureAssetDefinition = Readonly<{
  key: MapStructureAssetKey;
  label: string;
  path: string;
  categories: readonly string[];
  defaultScale: number;
  defaultYaw: number;
  role: string;
  fallbackCategory: string;
  safetyRadius: number;
  yOffset: number;
  proxy: "portal" | "crate" | "gateway" | "pipe";
  materialRole: "portal" | "crate" | "gateway" | "pipe";
}>;

type MapStructurePlacement = Readonly<{
  assetKey: MapStructureAssetKey;
  name: string;
  position: Vector3;
  yaw?: number;
  scale?: number;
  category: string;
  pitch?: number;
  roll?: number;
  yOffset?: number;
}>;

type MapStructureTemplate = Readonly<{
  asset: MapStructureAssetDefinition;
  container: AssetContainer;
  importedLightsRemoved: number;
  importedCamerasRemoved: number;
  importedAnimationGroupsDisposed: number;
}>;

type MapStructureSummary = {
  loaded: number;
  placed: number;
  failed: number;
  lightsRemoved: number;
  camerasRemoved: number;
  animationGroupsStopped: number;
  animationGroupsDisposed: number;
  materialsReplaced: number;
  pbrMaterialsReplaced: number;
  alphaMaterialsReplaced: number;
};

type MapStructurePlacementResult = {
  loaded: boolean;
  placed: boolean;
  lightsRemoved: number;
  camerasRemoved: number;
  animationGroupsStopped: number;
  animationGroupsDisposed: number;
  materialsReplaced: number;
  pbrMaterialsReplaced: number;
  alphaMaterialsReplaced: number;
};

type MapStructureMaterialStats = {
  materialsReplaced: number;
  pbrMaterialsReplaced: number;
  alphaMaterialsReplaced: number;
};

type MapStructureMaterials = Readonly<{
  dark: StandardMaterial;
  corporate: StandardMaterial;
  crate: StandardMaterial;
  pipe: StandardMaterial;
  gatewayAccent: StandardMaterial;
  portalAccent: StandardMaterial;
  proxy: StandardMaterial;
  proxyAccent: StandardMaterial;
}>;

const mapStructureAssets: Record<MapStructureAssetKey, MapStructureAssetDefinition> = {
  "mine-access-portal": {
    key: "mine-access-portal",
    label: "Mine Access Portal",
    path: "/models/maps/tychostar/structures/mine-access-portal.glb",
    categories: ["mining-rig", "cargo-cradle", "restricted-recovery"],
    defaultScale: 1.45,
    defaultYaw: Math.PI,
    role: "mining access entrance",
    fallbackCategory: "mining-rig",
    safetyRadius: 6.5,
    yOffset: 0.18,
    proxy: "portal",
    materialRole: "portal",
  },
  "nebula-freight-crate": {
    key: "nebula-freight-crate",
    label: "Nebula Freight Crate",
    path: "/models/maps/tychostar/props/freight-crate.glb",
    categories: ["warehouse-storage", "salvage-cache", "extraction-cradle", "abandoned-camp"],
    defaultScale: 1.05,
    defaultYaw: 0,
    role: "cargo and salvage dressing",
    fallbackCategory: "warehouse-storage",
    safetyRadius: 2.4,
    yOffset: 0.12,
    proxy: "crate",
    materialRole: "crate",
  },
  "tychostar-gateway": {
    key: "tychostar-gateway",
    label: "Tychostar Gateway",
    path: "/models/maps/tychostar/structures/tychostar-gateway.glb",
    categories: ["security-checkpoint", "restricted-recovery", "extraction-cradle"],
    defaultScale: 1.22,
    defaultYaw: 0,
    role: "corporate threshold",
    fallbackCategory: "security-checkpoint",
    safetyRadius: 5.8,
    yOffset: 0.16,
    proxy: "gateway",
    materialRole: "gateway",
  },
  "looped-industrial-pipe": {
    key: "looped-industrial-pipe",
    label: "Looped Industrial Pipe",
    path: "/models/maps/tychostar/props/industrial-pipe-loop.glb",
    categories: ["mining-rig", "warehouse-storage", "relay-signal", "salvage-cache"],
    defaultScale: 1.08,
    defaultYaw: 0,
    role: "industrial utility conduit",
    fallbackCategory: "mining-rig",
    safetyRadius: 3.2,
    yOffset: 0.14,
    proxy: "pipe",
    materialRole: "pipe",
  },
};

const mapStructureLoadWarnings = new Set<MapStructureAssetKey>();
const mapStructureTemplateLoads = new Map<MapStructureAssetKey, Promise<MapStructureTemplate>>();
// Phase 13.1E: direct GLB structure rendering is disabled by default because the
// current crater scene can exceed Babylon shader/uniform-buffer limits. Keep the
// registry and loader for a later optimized GLB pipeline, but use proxy silhouettes
// until export-clean/unlit assets or a tighter scene light budget are available.
const ENABLE_STRUCTURE_GLBS = false;
const MAP_STRUCTURE_DEBUG_PROXIES = false;
const MAP_STRUCTURE_LIGHT_WARNING_THRESHOLD = 12;

export const createWorld = (scene: Scene): WorldMap => {
  createGround(scene);
  createGroundGrid(scene);
  createArenaWalls(scene);
  createLunarTerrainVariation(scene);
  createPoiPads(scene);
  createMapProps(scene);
  createCraterReadabilityAnchors(scene);
  createPoiIdentityDressing(scene);
  placeMapStructureGlbs(scene);
  createTychoScarVisualSlice(scene);
  const extractionMeshes = createExtractionZones(scene);
  const contractVariantMeshes = createContractVariantMarkers(scene);

  return {
    getCurrentPoiName: getPoiNameAtPosition,
    setActiveExtractionZones: (ids: readonly string[]) => {
      const activeIds = new Set(ids);

      for (const [id, mesh] of extractionMeshes) {
        const material = mesh.material as StandardMaterial | null;
        const extractId = typeof mesh.metadata?.extractId === "string" ? mesh.metadata.extractId : id;
        const active = activeIds.has(extractId);
        mesh.setEnabled(active);

        if (material) {
          material.alpha = active ? 0.68 : 0.18;
        }
      }
    },
    setContractVariant: (type: string | null, poiName: string | null) => {
      for (const mesh of contractVariantMeshes) {
        const active = Boolean(type && poiName) &&
          mesh.metadata?.contractType === type &&
          (mesh.metadata?.poiName === poiName || mesh.metadata?.poiId === poiName);
        mesh.setEnabled(active);
      }
    },
  };
};

const createGround = (scene: Scene): void => {
  const groundMaterial = new StandardMaterial("ground-material", scene);
  groundMaterial.diffuseColor = new Color3(0.055, 0.066, 0.084);
  groundMaterial.emissiveColor = themeConfig.colors.cyan.scale(0.018);
  groundMaterial.specularColor = new Color3(0.028, 0.032, 0.043);

  const ground = MeshBuilder.CreateGround(
    "map-floor",
    { width: mapLayoutConfig.size, height: mapLayoutConfig.size },
    scene,
  );
  ground.material = groundMaterial;
  ground.checkCollisions = true;
};

const createGroundGrid = (scene: Scene): void => {
  const gridColor = themeConfig.colors.cyan.scale(0.055);

  for (let i = -halfMapSize; i <= halfMapSize; i += 10) {
    const xLine = MeshBuilder.CreateLines(
      `grid-x-${i}`,
      {
        points: [
          new Vector3(i, 0.015, -halfMapSize),
          new Vector3(i, 0.015, halfMapSize),
        ],
      },
      scene,
    );
    const zLine = MeshBuilder.CreateLines(
      `grid-z-${i}`,
      {
        points: [
          new Vector3(-halfMapSize, 0.015, i),
          new Vector3(halfMapSize, 0.015, i),
        ],
      },
      scene,
    );
    xLine.color = gridColor;
    zLine.color = gridColor;
  }
};

const createArenaWalls = (scene: Scene): void => {
  const wallMaterial = createMaterial(scene, "map-wall-material", new Color3(0.06, 0.08, 0.12), themeConfig.colors.purple.scale(0.05));
  const wallHeight = mapLayoutConfig.wallHeight;

  const wallData = [
    {
      name: "north-wall",
      position: new Vector3(0, wallHeight / 2, halfMapSize),
      scale: new Vector3(mapLayoutConfig.size, wallHeight, 1),
    },
    {
      name: "south-wall",
      position: new Vector3(0, wallHeight / 2, -halfMapSize),
      scale: new Vector3(mapLayoutConfig.size, wallHeight, 1),
    },
    {
      name: "east-wall",
      position: new Vector3(halfMapSize, wallHeight / 2, 0),
      scale: new Vector3(1, wallHeight, mapLayoutConfig.size),
    },
    {
      name: "west-wall",
      position: new Vector3(-halfMapSize, wallHeight / 2, 0),
      scale: new Vector3(1, wallHeight, mapLayoutConfig.size),
    },
  ];

  for (const data of wallData) {
    createBox(scene, data.name, data.position, data.scale, wallMaterial, "arena-boundary");
  }
};

const createPoiPads = (scene: Scene): void => {
  const colors: Record<string, Color3> = {
    warehouse: new Color3(0.08, 0.11, 0.16),
    checkpoint: new Color3(0.1, 0.14, 0.2),
    "abandoned-camp": new Color3(0.07, 0.1, 0.1),
    "data-shack": new Color3(0.1, 0.08, 0.17),
    "core-pit": new Color3(0.04, 0.14, 0.15),
  };

  for (const poi of poiDefinitions) {
    const material = createMaterial(
      scene,
      `${poi.id}-ground-material`,
      colors[poi.id] ?? new Color3(0.3, 0.3, 0.3),
    );
    material.alpha = 0.28;

    const pad = MeshBuilder.CreateCylinder(
      `${poi.id}-poi-area`,
      { height: 0.025, diameter: poi.radius * 2, tessellation: 48 },
      scene,
    );
    pad.position.copyFrom(poi.center.add(new Vector3(0, 0.025, 0)));
    pad.material = material;
    pad.checkCollisions = false;
    pad.metadata = { gameplayTag: "poi", poiId: poi.id, name: poi.name };
  }
};

const createMapProps = (scene: Scene): void => {
  const concrete = createMaterial(scene, "concrete-cover-material", new Color3(0.22, 0.26, 0.32), themeConfig.colors.cyan.scale(0.025));
  const cargo = createMaterial(scene, "cargo-cover-material", new Color3(0.32, 0.18, 0.1), themeConfig.colors.orange.scale(0.055));
  const wood = createMaterial(scene, "wood-cover-material", new Color3(0.24, 0.2, 0.16), themeConfig.colors.yellow.scale(0.025));
  const tarp = createMaterial(scene, "camp-tarp-material", new Color3(0.09, 0.16, 0.13), themeConfig.colors.rootGreen.scale(0.04));
  const shack = createMaterial(scene, "data-shack-material", new Color3(0.12, 0.1, 0.22), themeConfig.colors.purple.scale(0.09));

  createWarehouse(scene, cargo, concrete);
  createCheckpoint(scene, concrete);
  createAbandonedCamp(scene, wood, tarp);
  createDataShack(scene, shack, concrete);
  createCorePit(scene);
  createVerticalRoutes(scene, concrete, cargo);
  createTraversalRoutes(scene);
  createStylizedRouteDressing(scene);
  createDystopianCityDressing(scene);
  createCoverRoutes(scene, concrete, cargo, wood);
  createExpandedPoiAnchors(scene, concrete, cargo, wood, tarp, shack);
  createShipLandingMarker(scene);
  createRouteFlowPolish(scene, concrete, cargo, wood);
};

const poiCenter = (id: string): Vector3 => poiDefinitions.find((poi) => poi.id === id)?.center.clone() ?? Vector3.Zero();

const createLunarTerrainVariation = (scene: Scene): void => {
  const moundMaterial = createMaterial(scene, "lunar-mound-material", new Color3(0.08, 0.1, 0.14), themeConfig.colors.cyan.scale(0.018));
  moundMaterial.alpha = 0.86;
  const ridgeMaterial = createMaterial(scene, "lunar-ridge-material", new Color3(0.12, 0.14, 0.18), themeConfig.colors.cyan.scale(0.02));
  const rockMaterial = createMaterial(scene, "lunar-rock-cluster-material", new Color3(0.16, 0.18, 0.22), themeConfig.colors.purple.scale(0.018));
  const dustMaterial = createMaterial(scene, "lunar-dust-field-material", new Color3(0.09, 0.11, 0.13), themeConfig.colors.cyan.scale(0.012));
  dustMaterial.alpha = 0.52;

  const mounds = [
    [-126, -54, 22, 0.08],
    [-118, 68, 28, 0.1],
    [-82, 116, 24, 0.09],
    [-48, -104, 30, 0.08],
    [38, -122, 28, 0.1],
    [102, -64, 34, 0.09],
    [116, 42, 26, 0.08],
    [54, 102, 32, 0.1],
    [-16, 122, 22, 0.08],
    [18, -54, 26, 0.07],
  ] as const;

  for (const [x, z, diameter, height] of mounds) {
    const mound = MeshBuilder.CreateCylinder(
      `lunar-crater-mound-${x}-${z}`,
      { height, diameter, tessellation: 40 },
      scene,
    );
    mound.position.set(x, height / 2 + 0.018, z);
    mound.material = moundMaterial;
    mound.checkCollisions = false;
    mound.metadata = { gameplayTag: "terrain-mound" };
  }

  const dustFields = [
    [-102, -96, 26, 18, 0.18],
    [-38, -68, 30, 14, -0.24],
    [34, -40, 34, 16, 0.1],
    [82, -16, 28, 18, -0.35],
    [-72, 46, 34, 14, 0.42],
    [48, 70, 32, 16, -0.18],
  ] as const;

  for (const [x, z, width, depth, yaw] of dustFields) {
    const field = createBox(
      scene,
      `lunar-dust-field-${x}-${z}`,
      new Vector3(x, 0.028, z),
      new Vector3(width, 0.035, depth),
      dustMaterial,
      "terrain-dust",
    );
    field.rotation.y = yaw;
    field.checkCollisions = false;
  }

  const ridges = [
    [-80, -68, 42, 0.32],
    [-20, -86, 38, -0.22],
    [42, -78, 46, 0.18],
    [78, 6, 52, -0.34],
    [8, 54, 44, 0.42],
    [-78, 28, 48, -0.18],
    [-118, 16, 36, 0.28],
  ] as const;

  for (const [x, z, length, yaw] of ridges) {
    const ridge = createBox(
      scene,
      `lunar-ridge-line-${x}-${z}`,
      new Vector3(x, 0.16, z),
      new Vector3(length, 0.22, 1.8),
      ridgeMaterial,
      "terrain-ridge",
    );
    ridge.rotation.y = yaw;
    ridge.checkCollisions = false;
  }

  const rocks = [
    [-124, -18, 2.6, 1.3],
    [-92, 20, 3.2, 1.6],
    [-54, -92, 2.4, 1.1],
    [-26, 106, 3.8, 1.8],
    [22, 88, 2.8, 1.4],
    [48, -112, 3.4, 1.8],
    [82, -72, 2.6, 1.4],
    [112, 12, 3.2, 1.5],
    [104, 86, 4.2, 2.0],
    [-126, 100, 3.4, 1.7],
  ] as const;

  for (const [x, z, width, height] of rocks) {
    createBox(
      scene,
      `lunar-rock-cluster-${x}-${z}`,
      new Vector3(x, height / 2, z),
      new Vector3(width, height, width * 0.78),
      rockMaterial,
      "cover",
    );
  }
};

const createExpandedPoiAnchors = (
  scene: Scene,
  concrete: StandardMaterial,
  cargo: StandardMaterial,
  wood: StandardMaterial,
  tarp: StandardMaterial,
  shack: StandardMaterial,
): void => {
  const signMaterial = createMaterial(scene, "expanded-poi-sign-material", new Color3(0.06, 0.1, 0.16), themeConfig.colors.cyan.scale(0.16));
  const amber = createMaterial(scene, "expanded-poi-amber-material", new Color3(0.3, 0.16, 0.04), themeConfig.colors.orange.scale(0.24));
  const cyan = createMaterial(scene, "expanded-poi-cyan-material", new Color3(0.04, 0.2, 0.24), themeConfig.colors.cyan.scale(0.38));
  const Lumen = createMaterial(scene, "expanded-poi-Lumen-material", new Color3(0.12, 0.06, 0.2), themeConfig.colors.purple.scale(0.34));

  const drop = poiCenter("warehouse");
  createBox(scene, "expanded-drop-yard-slab", drop.add(new Vector3(0, 0.08, 0)), new Vector3(28, 0.16, 18), concrete, "poi-floor");
  createBox(scene, "expanded-drop-yard-rig", drop.add(new Vector3(-8, 2.2, -7)), new Vector3(4, 4.4, 4), cargo, "cover");
  createBox(scene, "expanded-drop-yard-crane-arm", drop.add(new Vector3(2, 4.5, -7)), new Vector3(18, 0.55, 1), amber, "poi-sign");
  createBox(scene, "expanded-drop-yard-crates", drop.add(new Vector3(9, 1.1, 5)), new Vector3(8, 2.2, 4), cargo, "cover");
  createPoiSign(scene, "expanded-sign-tycho-drop", "TYCHO", drop.add(new Vector3(0, 3.6, -20)), signMaterial, amber);

  const gate = poiCenter("checkpoint");
  createBox(scene, "expanded-raid-gate-left", gate.add(new Vector3(-10, 1.8, 0)), new Vector3(4, 3.6, 18), concrete, "cover");
  createBox(scene, "expanded-raid-gate-right", gate.add(new Vector3(10, 1.8, 0)), new Vector3(4, 3.6, 18), concrete, "cover");
  createBox(scene, "expanded-raid-gate-crossbar", gate.add(new Vector3(0, 4.3, -2)), new Vector3(26, 0.7, 1.2), amber, "poi-sign");
  createBox(scene, "expanded-raid-gate-booth", gate.add(new Vector3(0, 1.2, 12)), new Vector3(6, 2.4, 5), concrete, "cover");
  createPoiSign(scene, "expanded-sign-redline", "REDLINE", gate.add(new Vector3(0, 4.9, -11)), signMaterial, amber);

  const camp = poiCenter("abandoned-camp");
  createBox(scene, "expanded-camp-main-tent", camp.add(new Vector3(-7, 0.9, 2)), new Vector3(10, 1.8, 7), tarp, "cover");
  createBox(scene, "expanded-camp-side-tent", camp.add(new Vector3(8, 0.75, -7)), new Vector3(7, 1.5, 5), tarp, "cover");
  createBox(scene, "expanded-camp-scrap-wall", camp.add(new Vector3(0, 1.1, 13)), new Vector3(22, 2.2, 1), wood, "cover");
  createBarrel(scene, "expanded-camp-canister-a", camp.add(new Vector3(12, 0.75, 4)), amber);
  createPoiSign(scene, "expanded-sign-hollow", "HOLLOW", camp.add(new Vector3(-2, 3.4, 18)), signMaterial, cyan);

  const signal = poiCenter("data-shack");
  createBox(scene, "expanded-signal-shack-body", signal.add(new Vector3(0, 1.7, 0)), new Vector3(12, 3.4, 10), shack, "cover");
  createBox(scene, "expanded-signal-antenna-mast", signal.add(new Vector3(7, 5.2, -5)), new Vector3(0.6, 10.4, 0.6), cyan, "poi-sign");
  createBox(scene, "expanded-signal-terminal", signal.add(new Vector3(-5, 0.8, 7)), new Vector3(4, 1.6, 2), concrete, "cover");
  createPoiSign(scene, "expanded-sign-vanta", "VANTA", signal.add(new Vector3(0, 4.2, 13)), signMaterial, cyan);

  const core = poiCenter("core-pit");
  const coreRing = MeshBuilder.CreateTorus("expanded-core-pit-outer-ring", { diameter: 34, thickness: 0.28, tessellation: 64 }, scene);
  coreRing.position.copyFrom(core.add(new Vector3(0, 0.18, 0)));
  coreRing.rotation.x = Math.PI / 2;
  coreRing.material = Lumen;
  coreRing.checkCollisions = false;
  coreRing.metadata = { gameplayTag: "core-pit-ring" };
  createBox(scene, "expanded-core-pit-drill-spine", core.add(new Vector3(0, 2.8, -10)), new Vector3(5, 5.6, 4), concrete, "cover");
  createBox(scene, "expanded-core-pit-Lumen-growth", core.add(new Vector3(16, 1.8, 12)), new Vector3(4, 3.6, 8), Lumen, "cover");
  createPoiSign(scene, "expanded-sign-basin", "BASIN", core.add(new Vector3(0, 4.3, 22)), signMaterial, Lumen);

  createCable(scene, "expanded-route-ship-to-drop", [
    mapLayoutConfig.shipLandingSitePosition.add(new Vector3(0, 0.22, 7)),
    new Vector3(-110, 0.22, -62),
    drop.add(new Vector3(-4, 0.22, -7)),
  ], themeConfig.colors.orange.scale(0.72));
  createCable(scene, "expanded-route-drop-to-core", [
    drop.add(new Vector3(10, 0.22, 2)),
    new Vector3(-40, 0.22, -18),
    core.add(new Vector3(-12, 0.22, -3)),
  ], themeConfig.colors.cyan.scale(0.66));
  createCable(scene, "expanded-route-core-to-signal", [
    core.add(new Vector3(-5, 0.22, 12)),
    new Vector3(-34, 0.22, 48),
    signal.add(new Vector3(6, 0.22, -8)),
  ], themeConfig.colors.purple.scale(0.72));

  createZipline(scene, "expanded-signal-to-core-zipline", signal.add(new Vector3(6, 7.2, -4)), core.add(new Vector3(-10, 5.0, 5)), themeConfig.colors.cyan, cyan);
  createZipline(scene, "expanded-core-to-camp-zipline", core.add(new Vector3(12, 5.2, 6)), camp.add(new Vector3(-8, 4.2, -2)), themeConfig.colors.rootGreen, cyan);
};

const createShipLandingMarker = (scene: Scene): void => {
  const landing = mapLayoutConfig.shipLandingSitePosition;
  const padMaterial = createMaterial(scene, "ship-landing-pad-material", new Color3(0.08, 0.1, 0.12), themeConfig.colors.orange.scale(0.12));
  const beaconMaterial = createMaterial(scene, "ship-landing-beacon-material", new Color3(0.28, 0.18, 0.06), themeConfig.colors.orange.scale(0.5));
  const guideMaterial = createMaterial(scene, "ship-landing-guide-material", new Color3(0.02, 0.16, 0.18), themeConfig.colors.cyan.scale(0.42));

  const pad = MeshBuilder.CreateCylinder("ship-landing-site-pad", { height: 0.035, diameter: 28, tessellation: 48 }, scene);
  pad.position.copyFrom(landing.add(new Vector3(0, 0.035, 0)));
  pad.material = padMaterial;
  pad.checkCollisions = false;
  pad.metadata = { gameplayTag: "ship-landing-site" };

  for (const [index, offset] of [
    new Vector3(-9, 0.45, 10),
    new Vector3(9, 0.45, 10),
    new Vector3(-9, 0.45, -10),
    new Vector3(9, 0.45, -10),
  ].entries()) {
    createBox(scene, `ship-landing-guide-${index}`, landing.add(offset), new Vector3(1, 0.9, 1), guideMaterial, "landing-guide");
  }

  createBox(scene, "ship-landing-beacon-mast", landing.add(new Vector3(-15, 2.4, 8)), new Vector3(0.45, 4.8, 0.45), beaconMaterial, "ship-marker");
  createBox(scene, "ship-landing-beacon-head", landing.add(new Vector3(-15, 4.95, 8)), new Vector3(1.3, 0.42, 1.3), beaconMaterial, "ship-marker");
  createBox(scene, "ship-landing-cargo-stack", landing.add(new Vector3(14, 0.9, -6)), new Vector3(4.5, 1.8, 3.2), padMaterial, "cover");
};

const createRouteFlowPolish = (
  scene: Scene,
  concrete: StandardMaterial,
  cargo: StandardMaterial,
  wood: StandardMaterial,
): void => {
  const trailMaterial = createMaterial(scene, "expanded-route-trail-material", new Color3(0.11, 0.12, 0.14), themeConfig.colors.cyan.scale(0.014));
  trailMaterial.alpha = 0.42;
  const hazard = createMaterial(scene, "expanded-route-hazard-material", new Color3(0.32, 0.12, 0.04), themeConfig.colors.orange.scale(0.22));
  const lumenGrowth = createMaterial(scene, "alien-growth-site-material", new Color3(0.12, 0.04, 0.2), themeConfig.colors.purple.scale(0.42));
  const lumenNode = createMaterial(scene, "alien-lumen-node-material", new Color3(0.03, 0.22, 0.12), themeConfig.colors.rootGreen.scale(0.44));
  const cyan = createMaterial(scene, "route-cyan-guide-material", new Color3(0.03, 0.17, 0.2), themeConfig.colors.cyan.scale(0.32));

  const trails = [
    [-104, -74, 12, 55, -0.08],
    [-78, -52, 12, 48, -0.72],
    [-38, -28, 12, 58, -1.08],
    [26, -44, 10, 66, -0.78],
    [66, -66, 10, 52, -0.28],
    [-88, 36, 10, 60, 0.2],
    [-50, 64, 9, 52, 0.62],
    [48, 34, 12, 70, 1.08],
  ] as const;

  for (const [x, z, width, depth, yaw] of trails) {
    const trail = createBox(scene, `expanded-lunar-route-${x}-${z}`, new Vector3(x, 0.032, z), new Vector3(width, 0.035, depth), trailMaterial, "route-trail");
    trail.rotation.y = yaw;
    trail.checkCollisions = false;
  }

  const coverClusters = [
    [-96, -64, concrete, 0.2],
    [-72, -46, cargo, -0.28],
    [-48, -32, wood, 0.52],
    [-18, -18, concrete, -0.08],
    [34, -36, cargo, 0.34],
    [78, -72, concrete, -0.32],
    [-98, 48, wood, 0.18],
    [-54, 66, concrete, -0.48],
    [42, 58, cargo, 0.25],
    [74, 18, concrete, -0.18],
  ] as const;

  for (const [x, z, material, yaw] of coverClusters) {
    const first = createBox(scene, `expanded-route-cover-a-${x}-${z}`, new Vector3(x, 0.7, z), new Vector3(5.2, 1.4, 1.1), material, "cover");
    const second = createBox(scene, `expanded-route-cover-b-${x}-${z}`, new Vector3(x + 3.2, 0.55, z + 2.6), new Vector3(1.2, 1.1, 4.2), material, "cover");
    first.rotation.y = yaw;
    second.rotation.y = yaw + 0.35;
  }

  for (const [index, x, z] of [
    [0, -114, -70],
    [1, -64, -42],
    [2, -8, -24],
    [3, 40, -48],
    [4, -92, 58],
    [5, -42, 74],
    [6, 34, 58],
  ] as const) {
    createBox(scene, `expanded-cyan-route-light-${index}`, new Vector3(x, 0.5, z), new Vector3(0.65, 1, 0.65), cyan, "route-marker");
  }

  const alienSite = new Vector3(118, 0, 82);
  const alienPad = MeshBuilder.CreateCylinder("alien-growth-site-risk-ring", { height: 0.035, diameter: 25, tessellation: 48 }, scene);
  alienPad.position.copyFrom(alienSite.add(new Vector3(0, 0.05, 0)));
  alienPad.material = lumenGrowth;
  alienPad.checkCollisions = false;
  alienPad.metadata = { gameplayTag: "alien-growth-site" };
  for (const [index, offset, height, yaw] of [
    [0, new Vector3(-7, 1.8, -3), 8, 0.24],
    [1, new Vector3(5, 1.35, 5), 6, -0.45],
    [2, new Vector3(0, 1.1, -9), 5, 0.72],
    [3, new Vector3(9, 1.55, -2), 7, -0.12],
  ] as const) {
    const tendril = createBox(scene, `alien-growth-tendril-${index}`, alienSite.add(offset), new Vector3(1.1, height, 1.1), lumenGrowth, "cover");
    tendril.rotation.z = yaw;
    tendril.rotation.y = yaw * 1.7;
  }
  createBox(scene, "alien-growth-lumen-node", alienSite.add(new Vector3(0, 1.1, 0)), new Vector3(2.6, 2.2, 2.6), lumenNode, "objective-platform");
  createPoiSign(scene, "expanded-sign-alien-growth", "LUMEN", alienSite.add(new Vector3(0, 4.4, 14)), lumenGrowth, lumenNode);

  const gate = poiCenter("checkpoint");
  createBox(scene, "raid-gate-warning-light-left", gate.add(new Vector3(-14, 4.8, -7)), new Vector3(0.8, 0.8, 0.8), hazard, "route-marker");
  createBox(scene, "raid-gate-warning-light-right", gate.add(new Vector3(14, 4.8, -7)), new Vector3(0.8, 0.8, 0.8), hazard, "route-marker");
};

const createWarehouse = (
  scene: Scene,
  cargo: StandardMaterial,
  concrete: StandardMaterial,
): void => {
  createBox(scene, "warehouse-back-wall", new Vector3(46, 1.75, -47), new Vector3(32, 3.5, 1), concrete, "poi-wall");
  createBox(scene, "warehouse-left-wall", new Vector3(30, 1.75, -32), new Vector3(1, 3.5, 28), concrete, "poi-wall");
  createBox(scene, "warehouse-right-wall", new Vector3(62, 1.75, -32), new Vector3(1, 3.5, 28), concrete, "poi-wall");
  createBox(scene, "warehouse-roof-line", new Vector3(46, 3.6, -32), new Vector3(30, 0.5, 24), concrete, "poi-roof");

  const stacks = [
    [38, -36, 4, 2.2, 3],
    [50, -38, 6, 2.8, 2.6],
    [56, -25, 3.5, 1.6, 5],
    [39, -21, 5.5, 1.5, 2],
    [48, -30, 2.4, 2.2, 2.4],
  ] as const;

  for (const [x, z, width, height, depth] of stacks) {
    createBox(
      scene,
      `warehouse-cargo-${x}-${z}`,
      new Vector3(x, height / 2, z),
      new Vector3(width, height, depth),
      cargo,
      "cover",
    );
  }
};

const createCheckpoint = (scene: Scene, concrete: StandardMaterial): void => {
  createBox(scene, "checkpoint-gate-left", new Vector3(-24, 1.3, -52), new Vector3(9, 2.6, 1.2), concrete, "cover");
  createBox(scene, "checkpoint-gate-right", new Vector3(2, 1.3, -52), new Vector3(9, 2.6, 1.2), concrete, "cover");
  createBox(scene, "checkpoint-booth", new Vector3(-12, 1.1, -39), new Vector3(5, 2.2, 5), concrete, "cover");
  createBox(scene, "checkpoint-barricade-a", new Vector3(-28, 0.7, -42), new Vector3(6, 1.4, 1.2), concrete, "cover");
  createBox(scene, "checkpoint-barricade-b", new Vector3(6, 0.7, -44), new Vector3(6, 1.4, 1.2), concrete, "cover");
};

const createAbandonedCamp = (
  scene: Scene,
  wood: StandardMaterial,
  tarp: StandardMaterial,
): void => {
  const tents = [
    { name: "camp-tent-north", position: new Vector3(-52, 0.8, 38), scale: new Vector3(7, 1.6, 5) },
    { name: "camp-tent-south", position: new Vector3(-35, 0.8, 20), scale: new Vector3(6, 1.6, 4.5) },
  ];

  for (const tent of tents) {
    createBox(scene, tent.name, tent.position, tent.scale, tarp, "cover");
  }

  createBox(scene, "camp-supply-crates", new Vector3(-44, 0.75, 31), new Vector3(4, 1.5, 2.5), wood, "cover");
  createBox(scene, "camp-log-cover-a", new Vector3(-57, 0.45, 25), new Vector3(7, 0.9, 1), wood, "cover");
  createBox(scene, "camp-log-cover-b", new Vector3(-29, 0.45, 34), new Vector3(1, 0.9, 7), wood, "cover");
};

const createDataShack = (
  scene: Scene,
  shack: StandardMaterial,
  concrete: StandardMaterial,
): void => {
  createBox(scene, "data-shack-back-wall", new Vector3(30, 1.6, 46), new Vector3(12, 3.2, 1), shack, "poi-wall");
  createBox(scene, "data-shack-left-wall", new Vector3(24, 1.6, 38), new Vector3(1, 3.2, 15), shack, "poi-wall");
  createBox(scene, "data-shack-right-wall", new Vector3(36, 1.6, 38), new Vector3(1, 3.2, 15), shack, "poi-wall");
  createBox(scene, "data-shack-terminal-cover", new Vector3(30, 0.75, 36), new Vector3(4, 1.5, 1.4), concrete, "cover");
};

const createCorePit = (scene: Scene): void => {
  const danger = createMaterial(scene, "core-pit-danger-material", new Color3(0.12, 0.05, 0.18), themeConfig.colors.purple.scale(0.16));
  const core = createMaterial(scene, "core-pit-core-material", new Color3(0.02, 0.22, 0.26), themeConfig.colors.cyan.scale(0.55));
  const root = createMaterial(scene, "core-pit-root-material", new Color3(0.04, 0.18, 0.1), themeConfig.colors.rootGreen.scale(0.22));
  const rail = createMaterial(scene, "core-pit-rail-material", new Color3(0.2, 0.08, 0.28), themeConfig.colors.purple.scale(0.18));

  const pit = MeshBuilder.CreateCylinder("core-pit-glow-floor", { height: 0.03, diameter: 18, tessellation: 48 }, scene);
  pit.position.set(0, 0.045, 4);
  pit.material = core;
  pit.checkCollisions = false;

  createBox(scene, "core-pit-north-danger-wall", new Vector3(0, 0.75, 15), new Vector3(19, 1.5, 1.2), danger, "cover");
  createBox(scene, "core-pit-south-danger-wall", new Vector3(0, 0.75, -7), new Vector3(19, 1.5, 1.2), danger, "cover");
  createBox(scene, "core-pit-west-danger-wall", new Vector3(-11, 0.75, 4), new Vector3(1.2, 1.5, 18), danger, "cover");
  createBox(scene, "core-pit-east-danger-wall", new Vector3(11, 0.75, 4), new Vector3(1.2, 1.5, 18), danger, "cover");
  createBox(scene, "core-pit-high-value-cache-platform", new Vector3(0, 1.15, 4), new Vector3(5.5, 0.45, 5.5), rail, "objective-platform");

  for (const [index, x, z, rotation] of [
    [0, -7, -4, 0.55],
    [1, 7, 12, -0.55],
    [2, -8, 11, -0.35],
    [3, 8, -5, 0.35],
  ] as const) {
    const growth = createBox(scene, `core-pit-root-growth-${index}`, new Vector3(x, 0.45, z), new Vector3(1.2, 0.9, 7), root, "cover");
    growth.rotation.y = rotation;
  }

  const light = new PointLight("core-pit-cyan-glow", new Vector3(0, 4.8, 4), scene);
  light.diffuse = themeConfig.colors.cyan;
  light.intensity = 0.85;
  light.range = 26;
};

const createVerticalRoutes = (
  scene: Scene,
  concrete: StandardMaterial,
  cargo: StandardMaterial,
): void => {
  const catwalk = createMaterial(scene, "catwalk-material", new Color3(0.18, 0.26, 0.42), themeConfig.colors.cyan.scale(0.08));
  const ramp = createMaterial(scene, "ramp-material", new Color3(0.18, 0.23, 0.3), themeConfig.colors.rootGreen.scale(0.035));

  createBox(scene, "drop-yard-rooftop-platform", new Vector3(46, 4.4, -31), new Vector3(22, 0.45, 10), catwalk, "platform");
  createRamp(scene, "drop-yard-ramp-up", new Vector3(30, 2.0, -22), new Vector3(15, 0.5, 4), 0, -0.28, ramp);
  createBox(scene, "drop-yard-catwalk-rail-a", new Vector3(46, 4.9, -26), new Vector3(22, 0.45, 0.6), concrete, "cover");
  createBox(scene, "drop-yard-catwalk-rail-b", new Vector3(46, 4.9, -36), new Vector3(22, 0.45, 0.6), concrete, "cover");

  createBox(scene, "raid-gate-watch-platform", new Vector3(-12, 3.0, -48), new Vector3(12, 0.5, 7), catwalk, "platform");
  createRamp(scene, "raid-gate-ramp", new Vector3(-23, 1.5, -43), new Vector3(11, 0.45, 3.5), -0.38, 0.22, ramp);
  createBox(scene, "raid-gate-banner-bridge", new Vector3(-12, 4.8, -52), new Vector3(30, 0.55, 0.8), cargo, "poi-sign");

  createBox(scene, "signal-shack-rooftop", new Vector3(30, 3.55, 39), new Vector3(13, 0.45, 12), catwalk, "platform");
  createRamp(scene, "signal-shack-roof-ramp", new Vector3(40, 1.9, 36), new Vector3(11, 0.45, 3.2), 0.42, -0.26, ramp);

  createBox(scene, "creator-camp-lookout", new Vector3(-49, 2.7, 24), new Vector3(8, 0.45, 8), catwalk, "platform");
  createRamp(scene, "creator-camp-log-ramp", new Vector3(-39, 1.5, 22), new Vector3(10, 0.45, 3), 0.35, -0.22, ramp);
};

const createStylizedRouteDressing = (scene: Scene): void => {
  const signMaterial = createMaterial(scene, "poi-sign-material", new Color3(0.08, 0.12, 0.24), themeConfig.colors.cyan.scale(0.18));
  const bannerGreen = createMaterial(scene, "banner-green-material", new Color3(0.04, 0.2, 0.12), themeConfig.colors.rootGreen.scale(0.2));
  const bannerOrange = createMaterial(scene, "banner-orange-material", new Color3(0.28, 0.13, 0.05), themeConfig.colors.orange.scale(0.16));
  const barrel = createMaterial(scene, "stylized-barrel-material", new Color3(0.34, 0.12, 0.09), themeConfig.colors.orange.scale(0.08));
  const scrap = createMaterial(scene, "scrap-pile-material", new Color3(0.32, 0.36, 0.4), themeConfig.colors.cyan.scale(0.045));
  const cableColor = themeConfig.colors.cyan.scale(0.62);

  createPoiSign(scene, "sign-drop-yard", "TYCHO", new Vector3(47, 3.2, -56), signMaterial, bannerOrange);
  createPoiSign(scene, "sign-raid-gate", "REDLINE", new Vector3(-13, 3.0, -62), signMaterial, bannerGreen);
  createPoiSign(scene, "sign-creator-camp", "HOLLOW", new Vector3(-61, 2.8, 35), signMaterial, bannerGreen);
  createPoiSign(scene, "sign-signal-shack", "VANTA", new Vector3(29, 3.2, 56), signMaterial, bannerOrange);
  createPoiSign(scene, "sign-core-pit", "BASIN", new Vector3(0, 3.4, 20), signMaterial, bannerGreen);

  for (const [index, x, z] of [
    [0, -66, 55],
    [1, -58, 62],
    [2, -3, 29],
    [3, 22, 28],
    [4, 65, -18],
    [5, 60, -48],
  ] as const) {
    createBarrel(scene, `color-barrel-${index}`, new Vector3(x, 0.75, z), barrel);
  }

  for (const [index, x, z, sx, sz] of [
    [0, -24, 6, 4, 3],
    [1, 18, 22, 5, 2.5],
    [2, 56, 5, 4, 4],
    [3, -35, -17, 3, 4],
    [4, -5, -33, 5, 3],
  ] as const) {
    createScrapPile(scene, `scrap-pile-${index}`, new Vector3(x, 0.35, z), new Vector3(sx, 0.7, sz), scrap);
  }

  createCable(scene, "core-cable-to-signal", [new Vector3(2, 0.18, 4), new Vector3(12, 0.2, 20), new Vector3(28, 0.2, 38)], cableColor);
  createCable(scene, "core-cable-to-drop-yard", [new Vector3(5, 0.18, 0), new Vector3(24, 0.2, -17), new Vector3(44, 0.2, -32)], themeConfig.colors.rootGreen.scale(0.75));
  createCable(scene, "camp-cable-to-raid-gate", [new Vector3(-43, 0.2, 30), new Vector3(-32, 0.2, -6), new Vector3(-13, 0.2, -48)], themeConfig.colors.purple.scale(0.78));
};

const createDystopianCityDressing = (scene: Scene): void => {
  const asphalt = createMaterial(scene, "future-city-asphalt-material", new Color3(0.08, 0.1, 0.16), themeConfig.colors.cyan.scale(0.04));
  const facade = createMaterial(scene, "ruined-city-facade-material", new Color3(0.24, 0.28, 0.42), themeConfig.colors.purple.scale(0.05));
  const neonCyan = createMaterial(scene, "neon-city-cyan-material", new Color3(0.04, 0.22, 0.26), themeConfig.colors.cyan.scale(0.7));
  const neonPink = createMaterial(scene, "neon-city-pink-material", new Color3(0.3, 0.08, 0.32), themeConfig.colors.purple.scale(0.55));
  const vendor = createMaterial(scene, "neon-vendor-kiosk-material", new Color3(0.16, 0.16, 0.24), themeConfig.colors.orange.scale(0.28));
  const root = createMaterial(scene, "city-root-corruption-material", new Color3(0.08, 0.34, 0.16), themeConfig.colors.rootGreen.scale(0.34));

  for (const [index, x, z, sx, sz] of [
    [0, -62, -8, 12, 18],
    [1, -48, -12, 10, 14],
    [2, 65, 18, 11, 16],
    [3, 52, 26, 9, 12],
    [4, 10, 58, 15, 10],
  ] as const) {
    createBox(scene, `future-city-ruined-street-${index}`, new Vector3(x, 0.035, z), new Vector3(sx, 0.06, sz), asphalt, "city-street");
  }

  for (const [index, x, z, width, height, depth] of [
    [0, -66, -24, 9, 7, 7],
    [1, -54, -30, 7, 5, 9],
    [2, 64, 34, 8, 6, 6],
    [3, 48, 52, 12, 5, 7],
    [4, -7, 60, 14, 6, 8],
  ] as const) {
    createBox(scene, `future-city-ruined-block-${index}`, new Vector3(x, height / 2, z), new Vector3(width, height, depth), facade, "city-building");
    createBox(scene, `future-city-rooftop-route-${index}`, new Vector3(x, height + 0.25, z), new Vector3(width * 0.9, 0.5, depth * 0.85), neonCyan, "platform");
  }

  for (const [index, x, z, material] of [
    [0, -62, -16, neonCyan],
    [1, 61, 28, neonPink],
    [2, 35, 54, neonCyan],
    [3, -34, 52, neonPink],
  ] as const) {
    createBox(scene, `future-city-holo-sign-${index}`, new Vector3(x, 3.2, z), new Vector3(4.8, 1.6, 0.16), material, "neon-sign");
  }

  for (const [index, x, z] of [
    [0, -20, -24],
    [1, 18, -28],
    [2, 43, 18],
    [3, -48, 52],
  ] as const) {
    createBox(scene, `future-city-vendor-kiosk-${index}`, new Vector3(x, 1, z), new Vector3(3.4, 2, 2.6), vendor, "vendor-kiosk");
    createBox(scene, `future-city-kiosk-awning-${index}`, new Vector3(x, 2.25, z - 0.2), new Vector3(4.2, 0.28, 3.1), neonCyan, "vendor-kiosk");
  }

  for (const [index, x, z] of [
    [0, -60, -2],
    [1, 59, 9],
    [2, 22, 47],
    [3, -13, 48],
    [4, 8, -42],
  ] as const) {
    createBox(scene, `future-city-broken-vehicle-${index}`, new Vector3(x, 0.55, z), new Vector3(4, 1.1, 2), facade, "cover");
    createBox(scene, `future-city-vehicle-glow-${index}`, new Vector3(x + 1.5, 1.25, z), new Vector3(0.35, 0.35, 2.1), neonPink, "neon-sign");
  }

  for (const [index, x, z, rotation] of [
    [0, -65, -34, 0.35],
    [1, 68, 43, -0.28],
    [2, 40, 62, 0.6],
    [3, -18, 63, -0.48],
  ] as const) {
    const growth = createBox(scene, `future-city-root-growth-${index}`, new Vector3(x, 1.2, z), new Vector3(1.2, 2.4, 7), root, "cover");
    growth.rotation.y = rotation;
  }
};

const createTraversalRoutes = (scene: Scene): void => {
  const ziplineMaterial = createMaterial(scene, "zipline-node-material", new Color3(0.08, 0.12, 0.18), themeConfig.colors.cyan.scale(0.42));
  const padMaterial = createMaterial(scene, "jump-pad-material", new Color3(0.1, 0.72, 0.96), themeConfig.colors.rootGlow.scale(0.55));
  padMaterial.alpha = 0.88;

  createZipline(
    scene,
    "drop-yard-to-raid-gate-zipline",
    new Vector3(43, 5.3, -30),
    new Vector3(-12, 4.0, -48),
    themeConfig.colors.cyan,
    ziplineMaterial,
  );
  createZipline(
    scene,
    "signal-to-camp-zipline",
    new Vector3(30, 4.45, 40),
    new Vector3(-49, 3.55, 24),
    themeConfig.colors.rootGreen,
    ziplineMaterial,
  );

  createJumpPad(scene, "core-pit-jump-pad", new Vector3(0, 0.12, -18), new Vector3(0, 12.5, -8.5), padMaterial);
  createJumpPad(scene, "drop-yard-rotation-pad", new Vector3(22, 0.12, -18), new Vector3(6, 10.5, -10), padMaterial);
  createJumpPad(scene, "creator-camp-rotation-pad", new Vector3(-31, 0.12, 9), new Vector3(7.5, 10.8, -4.5), padMaterial);
};

const createCoverRoutes = (
  scene: Scene,
  concrete: StandardMaterial,
  cargo: StandardMaterial,
  wood: StandardMaterial,
): void => {
  const routeCover = [
    { name: "route-center-slab-a", position: new Vector3(-10, 0.65, 8), scale: new Vector3(6, 1.3, 1.2), material: concrete },
    { name: "route-center-slab-b", position: new Vector3(12, 0.65, -8), scale: new Vector3(1.2, 1.3, 6), material: concrete },
    { name: "route-camp-data-a", position: new Vector3(-17, 0.65, 40), scale: new Vector3(6, 1.3, 1.2), material: wood },
    { name: "route-camp-data-b", position: new Vector3(4, 0.65, 35), scale: new Vector3(1.2, 1.3, 6), material: concrete },
    { name: "route-check-warehouse-a", position: new Vector3(18, 0.9, -52), scale: new Vector3(4, 1.8, 2), material: cargo },
    { name: "route-check-warehouse-b", position: new Vector3(34, 0.65, -56), scale: new Vector3(6, 1.3, 1.2), material: concrete },
    { name: "route-open-danger-low", position: new Vector3(20, 0.55, 14), scale: new Vector3(5, 1.1, 1.1), material: concrete },
  ];

  for (const cover of routeCover) {
    createBox(scene, cover.name, cover.position, cover.scale, cover.material, "cover");
  }
};

const createCraterReadabilityAnchors = (scene: Scene): void => {
  const cyan = createMaterial(scene, "crater-readability-cyan-material", new Color3(0.025, 0.18, 0.21), themeConfig.colors.cyan.scale(0.5));
  const amber = createMaterial(scene, "crater-readability-amber-material", new Color3(0.32, 0.16, 0.035), themeConfig.colors.orange.scale(0.42));
  const residue = createMaterial(scene, "crater-readability-residue-material", new Color3(0.035, 0.18, 0.14), themeConfig.colors.rootGreen.scale(0.28).add(themeConfig.colors.cyan.scale(0.12)));
  const footprint = createMaterial(scene, "crater-readability-footprint-material", new Color3(0.12, 0.13, 0.15), themeConfig.colors.cyan.scale(0.018));
  footprint.alpha = 0.44;
  residue.alpha = 0.52;

  for (const poi of poiDefinitions) {
    const highRisk = poi.id === "core-pit" || poi.id === "warehouse";
    const material = poi.id === "core-pit" || poi.id === "data-shack" ? cyan : highRisk ? amber : footprint;
    const footprintRing = MeshBuilder.CreateTorus(
      `${poi.id}-readability-footprint-ring`,
      { diameter: poi.radius * 1.55, thickness: 0.055, tessellation: 64 },
      scene,
    );
    footprintRing.position.copyFrom(poi.center.add(new Vector3(0, 0.07, 0)));
    footprintRing.rotation.x = Math.PI / 2;
    footprintRing.material = material;
    footprintRing.checkCollisions = false;
    footprintRing.metadata = { gameplayTag: "poi-readability-ring", poiId: poi.id };

    const mast = MeshBuilder.CreateBox(`${poi.id}-readability-mast`, { width: 0.38, height: highRisk ? 7.2 : 5.4, depth: 0.38 }, scene);
    mast.position.copyFrom(poi.center.add(new Vector3(poi.radius * 0.42, highRisk ? 3.6 : 2.7, -poi.radius * 0.34)));
    mast.material = material;
    mast.checkCollisions = false;
    mast.metadata = { gameplayTag: "poi-readability-mast", poiId: poi.id };

    const lampMarker = MeshBuilder.CreateSphere(
      `${poi.id}-readability-lamp-marker`,
      { diameter: highRisk ? 0.86 : 0.62, segments: 12 },
      scene,
    );
    lampMarker.position.copyFrom(mast.position.add(new Vector3(0, highRisk ? 2.3 : 1.7, 0)));
    lampMarker.material = material;
    lampMarker.checkCollisions = false;
    lampMarker.isPickable = false;
    lampMarker.metadata = { gameplayTag: "poi-readability-lamp-marker", poiId: poi.id };
  }

  for (const [index, position, diameter] of [
    [0, poiCenter("data-shack").add(new Vector3(5, 0, -8)), 9],
    [1, poiCenter("core-pit").add(new Vector3(13, 0, 9)), 11],
    [2, poiCenter("abandoned-camp").add(new Vector3(-6, 0, 10)), 8],
  ] as const) {
    const field = MeshBuilder.CreateCylinder(
      `lumen-residue-readability-field-${index}`,
      { height: 0.03, diameter, tessellation: 48 },
      scene,
    );
    field.position.copyFrom(position.add(new Vector3(0, 0.065, 0)));
    field.material = residue;
    field.checkCollisions = false;
    field.metadata = { gameplayTag: "lumen-residue-visual" };
  }
};

type PoiDressingMaterials = Readonly<{
  darkMetal: StandardMaterial;
  regolith: StandardMaterial;
  corporateBlack: StandardMaterial;
  amber: StandardMaterial;
  cyan: StandardMaterial;
  utilityBlue: StandardMaterial;
  lumen: StandardMaterial;
  hazard: StandardMaterial;
  restricted: StandardMaterial;
  dustyGray: StandardMaterial;
}>;

type PoiDressingStats = {
  meshes: number;
  categories: Set<string>;
};

const createPoiIdentityDressing = (scene: Scene): void => {
  const materials: PoiDressingMaterials = {
    darkMetal: createMaterial(scene, "poi-identity-dark-metal-material", new Color3(0.075, 0.084, 0.094), themeConfig.colors.cyan.scale(0.018)),
    regolith: createMaterial(scene, "poi-identity-regolith-material", new Color3(0.13, 0.135, 0.145), themeConfig.colors.cyan.scale(0.012)),
    corporateBlack: createMaterial(scene, "poi-identity-corporate-black-material", new Color3(0.018, 0.024, 0.032), themeConfig.colors.cyan.scale(0.055)),
    amber: createMaterial(scene, "poi-identity-amber-material", new Color3(0.28, 0.13, 0.035), themeConfig.colors.orange.scale(0.28)),
    cyan: createMaterial(scene, "poi-identity-cyan-material", new Color3(0.025, 0.16, 0.18), themeConfig.colors.cyan.scale(0.36)),
    utilityBlue: createMaterial(scene, "poi-identity-utility-blue-material", new Color3(0.035, 0.07, 0.13), themeConfig.colors.cyan.scale(0.16)),
    lumen: createMaterial(scene, "poi-identity-lumen-mineral-material", new Color3(0.036, 0.16, 0.13), themeConfig.colors.rootGreen.scale(0.26).add(themeConfig.colors.cyan.scale(0.12))),
    hazard: createMaterial(scene, "poi-identity-hazard-material", new Color3(0.32, 0.1, 0.025), themeConfig.colors.orange.scale(0.24)),
    restricted: createMaterial(scene, "poi-identity-restricted-material", new Color3(0.13, 0.025, 0.028), themeConfig.colors.purple.scale(0.12).add(themeConfig.colors.orange.scale(0.08))),
    dustyGray: createMaterial(scene, "poi-identity-dusty-gray-material", new Color3(0.18, 0.19, 0.2), themeConfig.colors.cyan.scale(0.02)),
  };
  materials.regolith.alpha = 0.58;
  materials.lumen.alpha = 0.64;
  const stats: PoiDressingStats = { meshes: 0, categories: new Set() };

  createMiningRigDressing(scene, materials, stats);
  createRelayAndDataDressing(scene, materials, stats);
  createSecurityCheckpointDressing(scene, materials, stats);
  createWarehouseStorageDressing(scene, materials, stats);
  createAbandonedCampDressing(scene, materials, stats);
  createSalvageCacheDressing(scene, materials, stats);
  createLumenResidueDressing(scene, materials, stats);
  createExtractionCradleDressing(scene, materials, stats);
  createRestrictedRecoveryDressing(scene, materials, stats);

  console.info(`[WorldDressing] phase=13.1 poiIdentity categories=${stats.categories.size} meshes=${stats.meshes}`);
};

const createMiningRigDressing = (scene: Scene, materials: PoiDressingMaterials, stats: PoiDressingStats): void => {
  const core = poiCenter("core-pit");
  addDressingTorus(scene, "core-pit-mining-pit-service-ring", core.add(new Vector3(0, 0.11, 0)), 25.5, 0.16, materials.darkMetal, "mining-rig", stats);
  addDressingBox(scene, "core-pit-drill-gantry-left", core.add(new Vector3(-8.8, 3.0, -8.8)), new Vector3(0.5, 6, 0.5), materials.darkMetal, "mining-rig", stats, 0.25);
  addDressingBox(scene, "core-pit-drill-gantry-right", core.add(new Vector3(8.8, 3.0, -8.8)), new Vector3(0.5, 6, 0.5), materials.darkMetal, "mining-rig", stats, -0.25);
  addDressingBox(scene, "core-pit-drill-gantry-crossbar", core.add(new Vector3(0, 6.1, -8.8)), new Vector3(18, 0.42, 0.62), materials.darkMetal, "mining-rig", stats);
  addDressingBox(scene, "core-pit-drill-spindle", core.add(new Vector3(0, 3.35, -7.2)), new Vector3(1.1, 5.2, 1.1), materials.cyan, "mining-rig", stats, 0.75);
  addDressingBox(scene, "core-pit-core-cradle-bed", core.add(new Vector3(-5.2, 0.34, 2.4)), new Vector3(5.2, 0.34, 2.5), materials.darkMetal, "cargo-cradle", stats, -0.16);
  addDressingBox(scene, "core-pit-core-cradle-amber-clamp-a", core.add(new Vector3(-5.2, 1.05, 1.2)), new Vector3(4.6, 0.22, 0.34), materials.amber, "cargo-cradle", stats, -0.16);
  addDressingBox(scene, "core-pit-core-cradle-amber-clamp-b", core.add(new Vector3(-5.2, 1.05, 3.6)), new Vector3(4.6, 0.22, 0.34), materials.amber, "cargo-cradle", stats, -0.16);
  addPipeBundle(scene, "core-pit-he3-pipe", core.add(new Vector3(9.5, 0.42, 7.5)), 6, 0.42, 0.28, materials.dustyGray, "mining-rig", stats);
  addHazardPosts(scene, "core-pit-hazard-post", core, 15.5, materials.hazard, "mining-rig", stats);
};

const createRelayAndDataDressing = (scene: Scene, materials: PoiDressingMaterials, stats: PoiDressingStats): void => {
  const signal = poiCenter("data-shack");
  addDressingBox(scene, "data-shack-relay-mast-tall", signal.add(new Vector3(9.5, 5.1, -7.8)), new Vector3(0.48, 10.2, 0.48), materials.cyan, "relay-signal", stats);
  addDressingTorus(scene, "data-shack-relay-dish-ring", signal.add(new Vector3(9.5, 8.7, -7.8)), 3.4, 0.08, materials.cyan, "relay-signal", stats, Math.PI / 2);
  addDressingBox(scene, "data-shack-signal-array-arm-a", signal.add(new Vector3(9.5, 7.9, -7.8)), new Vector3(5.2, 0.18, 0.28), materials.utilityBlue, "relay-signal", stats, 0.2);
  addDressingBox(scene, "data-shack-signal-array-arm-b", signal.add(new Vector3(9.5, 6.7, -7.8)), new Vector3(4.2, 0.16, 0.24), materials.utilityBlue, "relay-signal", stats, -0.45);
  addDressingBox(scene, "data-shack-field-terminal-screen", signal.add(new Vector3(-5.6, 1.25, 7.2)), new Vector3(3.2, 1.3, 0.16), materials.cyan, "data-terminal", stats, -0.08);
  addDressingBox(scene, "data-shack-field-terminal-base", signal.add(new Vector3(-5.6, 0.55, 7.1)), new Vector3(3.6, 1.1, 1.2), materials.corporateBlack, "data-terminal", stats, -0.08);
  addDressingBox(scene, "data-shack-sealed-manifest-crate", signal.add(new Vector3(4.4, 0.55, 8.4)), new Vector3(2.2, 1.1, 1.6), materials.dustyGray, "data-terminal", stats, 0.18);
  addDressingCable(scene, "data-shack-floor-cable", [
    signal.add(new Vector3(-5.8, 0.16, 6.4)),
    signal.add(new Vector3(-1.2, 0.16, 3.8)),
    signal.add(new Vector3(5.8, 0.16, -4.8)),
  ], themeConfig.colors.cyan.scale(0.64), "relay-signal", stats);
};

const createSecurityCheckpointDressing = (scene: Scene, materials: PoiDressingMaterials, stats: PoiDressingStats): void => {
  const gate = poiCenter("checkpoint");
  addDressingBox(scene, "checkpoint-corporate-gate-left-post", gate.add(new Vector3(-12, 2.7, -8)), new Vector3(0.72, 5.4, 0.72), materials.corporateBlack, "security-checkpoint", stats);
  addDressingBox(scene, "checkpoint-corporate-gate-right-post", gate.add(new Vector3(12, 2.7, -8)), new Vector3(0.72, 5.4, 0.72), materials.corporateBlack, "security-checkpoint", stats);
  addDressingBox(scene, "checkpoint-corporate-gate-scanbar", gate.add(new Vector3(0, 5.15, -8)), new Vector3(25, 0.38, 0.5), materials.amber, "security-checkpoint", stats);
  addDressingBox(scene, "checkpoint-hazard-strip-a", gate.add(new Vector3(-7, 0.18, -2)), new Vector3(9, 0.08, 0.62), materials.hazard, "security-checkpoint", stats, 0.34);
  addDressingBox(scene, "checkpoint-hazard-strip-b", gate.add(new Vector3(7, 0.18, 2)), new Vector3(9, 0.08, 0.62), materials.hazard, "security-checkpoint", stats, 0.34);
  addDressingBox(scene, "checkpoint-scanner-pole-a", gate.add(new Vector3(-17, 1.65, 7)), new Vector3(0.42, 3.3, 0.42), materials.cyan, "security-checkpoint", stats);
  addDressingBox(scene, "checkpoint-scanner-pole-b", gate.add(new Vector3(17, 1.65, 7)), new Vector3(0.42, 3.3, 0.42), materials.cyan, "security-checkpoint", stats);
  addDressingBox(scene, "checkpoint-low-watch-platform", gate.add(new Vector3(0, 2.5, 13.5)), new Vector3(7.5, 0.42, 5.2), materials.darkMetal, "security-checkpoint", stats);
};

const createWarehouseStorageDressing = (scene: Scene, materials: PoiDressingMaterials, stats: PoiDressingStats): void => {
  const yard = poiCenter("warehouse");
  for (const [index, offset, scale, yaw] of [
    [0, new Vector3(-10, 0.85, -9), new Vector3(8, 1.7, 2.4), 0.1],
    [1, new Vector3(-2, 1.05, -5), new Vector3(7, 2.1, 2.2), 0.1],
    [2, new Vector3(8, 0.75, 4), new Vector3(6.2, 1.5, 2.8), -0.18],
    [3, new Vector3(14, 0.55, -10), new Vector3(3.4, 1.1, 5), -0.18],
  ] as const) {
    addDressingBox(scene, `warehouse-container-row-${index}`, yard.add(offset), scale, index % 2 === 0 ? materials.darkMetal : materials.dustyGray, "warehouse-storage", stats, yaw);
  }
  addPipeBundle(scene, "warehouse-pipe-bundle-north", yard.add(new Vector3(-14, 0.48, 10)), 7, 0.36, -0.18, materials.regolith, "warehouse-storage", stats);
  addPipeBundle(scene, "warehouse-pipe-bundle-east", yard.add(new Vector3(15, 0.48, 12)), 5, 0.32, 0.55, materials.regolith, "warehouse-storage", stats);
  addDressingBox(scene, "warehouse-loader-body", yard.add(new Vector3(2, 0.75, 12)), new Vector3(3.6, 1.5, 2.2), materials.amber, "warehouse-storage", stats, 0.34);
  addDressingBox(scene, "warehouse-loader-fork", yard.add(new Vector3(4.2, 0.32, 13.1)), new Vector3(3.8, 0.16, 0.26), materials.darkMetal, "warehouse-storage", stats, 0.34);
};

const createAbandonedCampDressing = (scene: Scene, materials: PoiDressingMaterials, stats: PoiDressingStats): void => {
  const camp = poiCenter("abandoned-camp");
  addDressingBox(scene, "camp-pressure-tent-a", camp.add(new Vector3(-8, 0.72, -3)), new Vector3(8.6, 1.45, 4.8), materials.regolith, "abandoned-camp", stats, 0.28);
  addDressingBox(scene, "camp-pressure-tent-ridge-a", camp.add(new Vector3(-8, 1.62, -3)), new Vector3(8.9, 0.18, 0.42), materials.dustyGray, "abandoned-camp", stats, 0.28);
  addDressingBox(scene, "camp-collapsed-panel", camp.add(new Vector3(8, 0.55, 6)), new Vector3(7.2, 0.28, 4.8), materials.darkMetal, "abandoned-camp", stats, -0.62);
  addDressingBox(scene, "camp-failed-beacon-pole", camp.add(new Vector3(13, 1.8, -8)), new Vector3(0.38, 3.6, 0.38), materials.utilityBlue, "abandoned-camp", stats, 0.08);
  addDressingBox(scene, "camp-failed-beacon-head", camp.add(new Vector3(13, 3.72, -8)), new Vector3(1.1, 0.32, 1.1), materials.restricted, "abandoned-camp", stats, 0.08);
  addDressingBox(scene, "camp-vac-crate-stack", camp.add(new Vector3(-13, 0.7, 8)), new Vector3(3.4, 1.4, 2.2), materials.dustyGray, "abandoned-camp", stats, -0.2);
};

const createSalvageCacheDressing = (scene: Scene, materials: PoiDressingMaterials, stats: PoiDressingStats): void => {
  const salvage = poiCenter("warehouse").add(new Vector3(20, 0, 18));
  addDressingTorus(scene, "salvage-cache-locator-ring", salvage.add(new Vector3(0, 0.09, 0)), 10.5, 0.06, materials.cyan, "salvage-cache", stats);
  addDressingBox(scene, "salvage-cache-buried-panel-a", salvage.add(new Vector3(-3.5, 0.24, -1.8)), new Vector3(5.2, 0.22, 3.2), materials.dustyGray, "salvage-cache", stats, -0.38);
  addDressingBox(scene, "salvage-cache-broken-equipment", salvage.add(new Vector3(3.4, 0.58, 2.4)), new Vector3(3.1, 1.15, 2.2), materials.darkMetal, "salvage-cache", stats, 0.52);
  addDressingBox(scene, "salvage-cache-black-box-hint", salvage.add(new Vector3(0.4, 0.42, -5.2)), new Vector3(1.6, 0.84, 1.2), materials.corporateBlack, "salvage-cache", stats, 0.12);
  addHazardPosts(scene, "salvage-cache-caution-post", salvage, 6.2, materials.hazard, "salvage-cache", stats);
};

const createLumenResidueDressing = (scene: Scene, materials: PoiDressingMaterials, stats: PoiDressingStats): void => {
  for (const [siteId, origin, radius] of [
    ["core-resonance", poiCenter("core-pit").add(new Vector3(12, 0, 10)), 9],
    ["vanta-signal-fragment", poiCenter("data-shack").add(new Vector3(-9, 0, -10)), 7],
  ] as const) {
    addDressingTorus(scene, `${siteId}-residue-boundary`, origin.add(new Vector3(0, 0.08, 0)), radius * 2, 0.045, materials.lumen, "lumen-residue", stats);
    for (let index = 0; index < 5; index += 1) {
      const angle = index * 1.25;
      const distance = radius * (0.25 + index * 0.11);
      const position = origin.add(new Vector3(Math.sin(angle) * distance, 0.28 + index * 0.08, Math.cos(angle) * distance));
      const shard = addDressingBox(scene, `${siteId}-mineral-shard-${index}`, position, new Vector3(0.42, 0.9 + index * 0.12, 0.34), materials.lumen, "lumen-residue", stats, angle);
      shard.rotation.z = 0.32 - index * 0.08;
    }
    addDressingCable(scene, `${siteId}-residue-streak`, [
      origin.add(new Vector3(-radius * 0.55, 0.12, radius * 0.15)),
      origin.add(new Vector3(-radius * 0.1, 0.13, -radius * 0.08)),
      origin.add(new Vector3(radius * 0.58, 0.12, -radius * 0.22)),
    ], themeConfig.colors.rootGreen.scale(0.52).add(themeConfig.colors.cyan.scale(0.25)), "lumen-residue", stats);
  }
};

const createExtractionCradleDressing = (scene: Scene, materials: PoiDressingMaterials, stats: PoiDressingStats): void => {
  const landing = mapLayoutConfig.shipLandingSitePosition;
  addDressingBox(scene, "ship-return-alignment-rail-left", landing.add(new Vector3(-6.5, 0.22, 2)), new Vector3(0.42, 0.32, 15), materials.cyan, "extraction-cradle", stats);
  addDressingBox(scene, "ship-return-alignment-rail-right", landing.add(new Vector3(6.5, 0.22, 2)), new Vector3(0.42, 0.32, 15), materials.cyan, "extraction-cradle", stats);
  addDressingBox(scene, "ship-heavy-cargo-docking-cradle", landing.add(new Vector3(0, 0.42, 10.5)), new Vector3(7.2, 0.36, 2.6), materials.darkMetal, "extraction-cradle", stats);
  addDressingBox(scene, "ship-heavy-cargo-docking-clamp-a", landing.add(new Vector3(-2.8, 0.92, 10.5)), new Vector3(0.36, 1.1, 2.8), materials.amber, "extraction-cradle", stats);
  addDressingBox(scene, "ship-heavy-cargo-docking-clamp-b", landing.add(new Vector3(2.8, 0.92, 10.5)), new Vector3(0.36, 1.1, 2.8), materials.amber, "extraction-cradle", stats);

  for (const zone of extractionZoneDefinitions) {
    addDressingTorus(scene, `${zone.id}-industrial-anchor-ring`, zone.center.add(new Vector3(0, 0.08, 0)), zone.radius * 3.25, 0.045, materials.utilityBlue, "extraction-cradle", stats);
    addHazardPosts(scene, `${zone.id}-extract-anchor-post`, zone.center, zone.radius + 2.4, materials.amber, "extraction-cradle", stats);
  }
};

const createRestrictedRecoveryDressing = (scene: Scene, materials: PoiDressingMaterials, stats: PoiDressingStats): void => {
  for (const [name, origin, yaw] of [
    ["data-shack-restricted-recovery", poiCenter("data-shack").add(new Vector3(8, 0, 10)), -0.22],
    ["checkpoint-sealed-corporate", poiCenter("checkpoint").add(new Vector3(-10, 0, 13)), 0.38],
  ] as const) {
    addDressingBox(scene, `${name}-black-panel-a`, origin.add(new Vector3(-2.2, 1.05, 0)), new Vector3(0.36, 2.1, 4.2), materials.corporateBlack, "restricted-recovery", stats, yaw);
    addDressingBox(scene, `${name}-black-panel-b`, origin.add(new Vector3(2.2, 1.05, 0)), new Vector3(0.36, 2.1, 4.2), materials.corporateBlack, "restricted-recovery", stats, yaw);
    addDressingBox(scene, `${name}-sealed-crate`, origin.add(new Vector3(0, 0.56, -2.8)), new Vector3(3.8, 1.12, 1.8), materials.restricted, "restricted-recovery", stats, yaw);
    addDressingBox(scene, `${name}-muted-indicator`, origin.add(new Vector3(0, 1.35, 2.4)), new Vector3(2.8, 0.28, 0.22), materials.hazard, "restricted-recovery", stats, yaw);
  }
};

const placeMapStructureGlbs = (scene: Scene): void => {
  mapStructureTemplateLoads.clear();
  const core = poiCenter("core-pit");
  const warehouse = poiCenter("warehouse");
  const checkpoint = poiCenter("checkpoint");
  const dataShack = poiCenter("data-shack");

  const placements: MapStructurePlacement[] = [
    {
      assetKey: "mine-access-portal",
      name: "core-pit-access-portal",
      position: core.add(new Vector3(-18, 0, -18)),
      yaw: Math.PI * 0.22,
      scale: 1.55,
      category: "mining-rig",
    },
    {
      assetKey: "nebula-freight-crate",
      name: "warehouse-nebula-crate",
      position: warehouse.add(new Vector3(-18, 0, 16)),
      yaw: -0.18,
      scale: 1.2,
      category: "warehouse-storage",
    },
    {
      assetKey: "tychostar-gateway",
      name: "checkpoint-tychostar-gateway",
      position: checkpoint.add(new Vector3(0, 0, -21)),
      yaw: 0,
      scale: 1.35,
      category: "security-checkpoint",
    },
    {
      assetKey: "looped-industrial-pipe",
      name: "data-shack-utility-pipe-loop",
      position: dataShack.add(new Vector3(-18, 0, -14)),
      yaw: Math.PI * 0.18,
      scale: 1.05,
      category: "relay-signal",
    },
  ];

  void placeMapStructures(scene, placements);
};

const placeMapStructures = async (scene: Scene, placements: readonly MapStructurePlacement[]): Promise<void> => {
  const lightsBefore = scene.lights.length;
  const materials = createMapStructureMaterials(scene);

  if (!ENABLE_STRUCTURE_GLBS) {
    for (const placement of placements) {
      createMapStructureProxy(scene, placement, mapStructureAssets[placement.assetKey], false, materials);
    }
    console.info(
      `[MapStructureProxy] phase=13.1E mode=proxy-only placements=${placements.length} glbEnabled=false lightsBefore=${lightsBefore} lightsAfter=${scene.lights.length}`,
    );
    return;
  }

  const summary: MapStructureSummary = {
    loaded: 0,
    placed: 0,
    failed: 0,
    lightsRemoved: 0,
    camerasRemoved: 0,
    animationGroupsStopped: 0,
    animationGroupsDisposed: 0,
    materialsReplaced: 0,
    pbrMaterialsReplaced: 0,
    alphaMaterialsReplaced: 0,
  };
  const loadedAssets = new Set<MapStructureAssetKey>();

  for (const placement of placements) {
    const result = await placeMapStructure(scene, placement, materials);
    if (result.loaded) {
      loadedAssets.add(placement.assetKey);
    }
    if (result.placed) {
      summary.placed += 1;
    } else {
      summary.failed += 1;
    }
    summary.lightsRemoved += result.lightsRemoved;
    summary.camerasRemoved += result.camerasRemoved;
    summary.animationGroupsStopped += result.animationGroupsStopped;
    summary.animationGroupsDisposed += result.animationGroupsDisposed;
    summary.materialsReplaced += result.materialsReplaced;
    summary.pbrMaterialsReplaced += result.pbrMaterialsReplaced;
    summary.alphaMaterialsReplaced += result.alphaMaterialsReplaced;
  }

  summary.loaded = loadedAssets.size;
  const lightsAfter = scene.lights.length;
  console.info(
    `[MapStructureGLB] phase=13.1D loaded=${summary.loaded} placed=${summary.placed} failed=${summary.failed} lightsBefore=${lightsBefore} lightsAfter=${lightsAfter} lightsDisposed=${summary.lightsRemoved} camerasDisposed=${summary.camerasRemoved} animationGroupsStopped=${summary.animationGroupsStopped} animationGroupsDisposed=${summary.animationGroupsDisposed} materialsReplaced=${summary.materialsReplaced} pbrMaterialsReplaced=${summary.pbrMaterialsReplaced} alphaMaterialsReplaced=${summary.alphaMaterialsReplaced} glbsEnabled=${ENABLE_STRUCTURE_GLBS}`,
  );
  if (lightsAfter > MAP_STRUCTURE_LIGHT_WARNING_THRESHOLD) {
    console.warn(`[MapStructureGLB] phase=13.1D scene-light-budget high=${lightsAfter} threshold=${MAP_STRUCTURE_LIGHT_WARNING_THRESHOLD}`);
  }
};

const placeMapStructure = async (
  scene: Scene,
  placement: MapStructurePlacement,
  materials: MapStructureMaterials,
): Promise<MapStructurePlacementResult> => {
  const asset = mapStructureAssets[placement.assetKey];
  const root = new TransformNode(`map-structure-${placement.name}`, scene);
  root.position.copyFrom(placement.position.add(new Vector3(0, placement.yOffset ?? asset.yOffset, 0)));
  root.rotation.set(placement.pitch ?? 0, (placement.yaw ?? asset.defaultYaw), placement.roll ?? 0);
  const scale = placement.scale ?? asset.defaultScale;
  root.scaling.set(scale, scale, scale);
  root.metadata = {
    gameplayTag: "map-structure-glb",
    phase: "13.1D",
    assetKey: asset.key,
    label: asset.label,
    category: placement.category,
    role: asset.role,
    safetyRadius: asset.safetyRadius,
    fallbackCategory: asset.fallbackCategory,
  };

  if (!ENABLE_STRUCTURE_GLBS) {
    root.dispose();
    createMapStructureProxy(scene, placement, asset, false, materials);
    return createEmptyMapStructurePlacementResult(false, false);
  }

  try {
    const template = await loadMapStructureTemplate(scene, asset);
    const entries = template.container.instantiateModelsToScene(
      (sourceName) => `map-structure-${placement.name}-${sourceName}`,
      false,
      { doNotInstantiate: true },
    );
    for (const node of entries.rootNodes) {
      node.parent = root;
    }
    sanitizeMapStructureNode(root, asset, placement.category);
    const materialStats = replaceMapStructureMaterials(root, asset, materials);
    if (MAP_STRUCTURE_DEBUG_PROXIES) {
      createMapStructureProxy(scene, placement, asset, true, materials);
    }
    return {
      loaded: true,
      placed: true,
      lightsRemoved: template.importedLightsRemoved,
      camerasRemoved: template.importedCamerasRemoved,
      animationGroupsStopped: template.importedAnimationGroupsDisposed,
      animationGroupsDisposed: template.importedAnimationGroupsDisposed,
      ...materialStats,
    };
  } catch (error) {
    root.dispose();
    if (!mapStructureLoadWarnings.has(asset.key)) {
      mapStructureLoadWarnings.add(asset.key);
      console.warn(`[MapStructureGLB] asset=${asset.key} path=${asset.path} failed-to-load fallback=${asset.fallbackCategory}`, error);
    }
    createMapStructureProxy(scene, placement, asset, false, materials);
    return createEmptyMapStructurePlacementResult(false, false);
  }
};

const loadMapStructureTemplate = (scene: Scene, asset: MapStructureAssetDefinition): Promise<MapStructureTemplate> => {
  const existing = mapStructureTemplateLoads.get(asset.key);
  if (existing) {
    return existing;
  }

  const load = (async (): Promise<MapStructureTemplate> => {
    const container = await SceneLoader.LoadAssetContainerAsync("", asset.path, scene);
    const importedLightsRemoved = disposeMapStructureAssets(container.lights);
    const importedCamerasRemoved = disposeMapStructureAssets(container.cameras);
    let importedAnimationGroupsDisposed = 0;

    for (const group of container.animationGroups) {
      group.stop();
      group.dispose();
      importedAnimationGroupsDisposed += 1;
    }

    for (const mesh of container.meshes) {
      sanitizeMapStructureMesh(mesh, asset, asset.fallbackCategory);
    }
    for (const node of container.transformNodes) {
      node.metadata = {
        ...(node.metadata ?? {}),
        gameplayTag: "map-structure-glb-template",
        phase: "13.1D",
        assetKey: asset.key,
      };
    }

    return { asset, container, importedLightsRemoved, importedCamerasRemoved, importedAnimationGroupsDisposed };
  })();

  mapStructureTemplateLoads.set(asset.key, load);
  return load;
};

const createEmptyMapStructurePlacementResult = (
  loaded: boolean,
  placed: boolean,
): MapStructurePlacementResult => ({
  loaded,
  placed,
  lightsRemoved: 0,
  camerasRemoved: 0,
  animationGroupsStopped: 0,
  animationGroupsDisposed: 0,
  materialsReplaced: 0,
  pbrMaterialsReplaced: 0,
  alphaMaterialsReplaced: 0,
});

const createMapStructureMaterials = (scene: Scene): MapStructureMaterials => ({
  dark: createUnlitStructureMaterial(scene, "map-structure-unlit-dark", new Color3(0.08, 0.092, 0.105), themeConfig.colors.cyan.scale(0.055)),
  corporate: createUnlitStructureMaterial(scene, "map-structure-unlit-corporate", new Color3(0.035, 0.042, 0.052), themeConfig.colors.cyan.scale(0.075)),
  crate: createUnlitStructureMaterial(scene, "map-structure-unlit-freight-crate", new Color3(0.23, 0.16, 0.095), themeConfig.colors.orange.scale(0.12)),
  pipe: createUnlitStructureMaterial(scene, "map-structure-unlit-pipe", new Color3(0.12, 0.13, 0.14), themeConfig.colors.cyan.scale(0.07)),
  gatewayAccent: createUnlitStructureMaterial(scene, "map-structure-unlit-gateway-accent", new Color3(0.08, 0.12, 0.14), themeConfig.colors.cyan.scale(0.2)),
  portalAccent: createUnlitStructureMaterial(scene, "map-structure-unlit-portal-accent", new Color3(0.075, 0.12, 0.105), themeConfig.colors.rootGreen.scale(0.16).add(themeConfig.colors.cyan.scale(0.08))),
  proxy: createUnlitStructureMaterial(scene, "map-structure-unlit-proxy", new Color3(0.13, 0.12, 0.105), themeConfig.colors.orange.scale(0.16)),
  proxyAccent: createUnlitStructureMaterial(scene, "map-structure-unlit-proxy-accent", new Color3(0.05, 0.13, 0.15), themeConfig.colors.cyan.scale(0.22)),
});

const createUnlitStructureMaterial = (
  scene: Scene,
  name: string,
  diffuseColor: Color3,
  emissiveColor: Color3,
): StandardMaterial => {
  const material = new StandardMaterial(name, scene);
  material.diffuseColor = diffuseColor;
  material.emissiveColor = emissiveColor;
  material.specularColor = Color3.Black();
  material.disableLighting = true;
  material.maxSimultaneousLights = 0;
  material.alpha = 1;
  material.backFaceCulling = false;
  material.metadata = { gameplayTag: "map-structure-unlit-material", phase: "13.1D" };
  material.freeze();
  return material;
};

const disposeMapStructureAssets = (assets: readonly Light[] | readonly Camera[]): number => {
  let removed = 0;
  for (const asset of assets) {
    asset.dispose();
    removed += 1;
  }
  return removed;
};

const sanitizeMapStructureNode = (
  root: TransformNode,
  asset: MapStructureAssetDefinition,
  category: string,
): void => {
  for (const node of root.getChildTransformNodes(false)) {
    node.metadata = {
      ...(node.metadata ?? {}),
      gameplayTag: "map-structure-glb",
      phase: "13.1D",
      assetKey: asset.key,
      label: asset.label,
      category,
    };
  }
  for (const mesh of root.getChildMeshes(false)) {
    sanitizeMapStructureMesh(mesh, asset, category);
  }
};

const sanitizeMapStructureMesh = (
  mesh: AbstractMesh,
  asset: MapStructureAssetDefinition,
  category: string,
): void => {
  mesh.setEnabled(true);
  mesh.isPickable = false;
  mesh.checkCollisions = false;
  mesh.receiveShadows = false;
  if (mesh.physicsImpostor) {
    mesh.physicsImpostor.dispose();
    mesh.physicsImpostor = null;
  }
  mesh.metadata = {
    ...(mesh.metadata ?? {}),
    gameplayTag: "map-structure-glb",
    phase: "13.1D",
    assetKey: asset.key,
    label: asset.label,
    category,
    collision: false,
    collisions: false,
    isCollisionMesh: false,
  };
};

const replaceMapStructureMaterials = (
  root: TransformNode,
  asset: MapStructureAssetDefinition,
  materials: MapStructureMaterials,
): MapStructureMaterialStats => {
  const stats: MapStructureMaterialStats = {
    materialsReplaced: 0,
    pbrMaterialsReplaced: 0,
    alphaMaterialsReplaced: 0,
  };
  const replacement = getMapStructureMaterial(asset, materials);

  for (const mesh of root.getChildMeshes(false)) {
    const material = mesh.material;
    if (material) {
      const className = material.getClassName();
      if (className.toLowerCase().includes("pbr")) {
        stats.pbrMaterialsReplaced += 1;
      }
      if (typeof material.alpha === "number" && material.alpha < 1) {
        stats.alphaMaterialsReplaced += 1;
      }
    }
    mesh.material = replacement;
    stats.materialsReplaced += 1;
  }
  return stats;
};

const getMapStructureMaterial = (
  asset: MapStructureAssetDefinition,
  materials: MapStructureMaterials,
): StandardMaterial => {
  if (asset.materialRole === "crate") {
    return materials.crate;
  }
  if (asset.materialRole === "pipe") {
    return materials.pipe;
  }
  if (asset.materialRole === "gateway") {
    return materials.gatewayAccent;
  }
  if (asset.materialRole === "portal") {
    return materials.portalAccent;
  }
  return materials.dark;
};

const createMapStructureProxy = (
  scene: Scene,
  placement: MapStructurePlacement,
  asset: MapStructureAssetDefinition,
  debugOnly: boolean,
  materials: MapStructureMaterials,
): void => {
  const suffix = debugOnly ? "debug-proxy" : "fallback-proxy";
  const baseName = `map-structure-${placement.name}-${suffix}`;
  const yOffset = placement.yOffset ?? asset.yOffset;
  const origin = placement.position.add(new Vector3(0, yOffset + 0.05, 0));
  const yaw = placement.yaw ?? asset.defaultYaw;
  const scale = placement.scale ?? asset.defaultScale;
  const material = debugOnly ? materials.proxyAccent : materials.proxy;

  const ring = MeshBuilder.CreateTorus(
    `${baseName}-locator-ring`,
    { diameter: asset.safetyRadius * 2, thickness: 0.065, tessellation: 48 },
    scene,
  );
  ring.position.copyFrom(origin);
  ring.rotation.x = Math.PI / 2;
  ring.material = material;
  ring.checkCollisions = false;
  ring.isPickable = false;
  ring.metadata = { gameplayTag: "map-structure-glb-proxy", phase: "13.1D", assetKey: asset.key, debugOnly };

  const proxyMeshes: AbstractMesh[] = [ring];
  if (!debugOnly) {
    if (asset.proxy === "portal" || asset.proxy === "gateway") {
      proxyMeshes.push(
        addProxyBox(scene, `${baseName}-left-post`, origin.add(new Vector3(-2.1 * scale, 2.1 * scale, 0)), new Vector3(0.38 * scale, 4.2 * scale, 0.38 * scale), material, yaw),
        addProxyBox(scene, `${baseName}-right-post`, origin.add(new Vector3(2.1 * scale, 2.1 * scale, 0)), new Vector3(0.38 * scale, 4.2 * scale, 0.38 * scale), material, yaw),
        addProxyBox(scene, `${baseName}-lintel`, origin.add(new Vector3(0, 4.2 * scale, 0)), new Vector3(4.8 * scale, 0.38 * scale, 0.5 * scale), material, yaw),
      );
    } else if (asset.proxy === "crate") {
      proxyMeshes.push(
        addProxyBox(scene, `${baseName}-crate-a`, origin.add(new Vector3(-0.85 * scale, 0.65 * scale, 0)), new Vector3(1.6 * scale, 1.3 * scale, 1.35 * scale), material, yaw),
        addProxyBox(scene, `${baseName}-crate-b`, origin.add(new Vector3(0.9 * scale, 0.48 * scale, 0.25 * scale)), new Vector3(1.35 * scale, 0.95 * scale, 1.2 * scale), material, yaw + 0.16),
      );
    } else {
      const loop = MeshBuilder.CreateTorus(
        `${baseName}-pipe-loop`,
        { diameter: 3.6 * scale, thickness: 0.18 * scale, tessellation: 40 },
        scene,
      );
      loop.position.copyFrom(origin.add(new Vector3(0, 1.8 * scale, 0)));
      loop.rotation.set(Math.PI / 2, yaw, 0);
      loop.material = material;
      proxyMeshes.push(loop);
    }
  }

  for (const mesh of proxyMeshes) {
    mesh.checkCollisions = false;
    mesh.isPickable = false;
    mesh.metadata = {
      ...(mesh.metadata ?? {}),
      gameplayTag: "map-structure-glb-proxy",
      phase: "13.1D",
      assetKey: asset.key,
      debugOnly,
      collision: false,
    };
  }
};

const addProxyBox = (
  scene: Scene,
  name: string,
  position: Vector3,
  scale: Vector3,
  material: StandardMaterial,
  yaw: number,
): AbstractMesh => {
  const mesh = MeshBuilder.CreateBox(name, { width: scale.x, height: scale.y, depth: scale.z }, scene);
  mesh.position.copyFrom(position);
  mesh.rotation.y = yaw;
  mesh.material = material;
  mesh.checkCollisions = false;
  mesh.isPickable = false;
  return mesh;
};

const addDressingBox = (
  scene: Scene,
  name: string,
  position: Vector3,
  scale: Vector3,
  material: StandardMaterial,
  category: string,
  stats: PoiDressingStats,
  yaw = 0,
): AbstractMesh => {
  const mesh = createBox(scene, name, position, scale, material, "poi-dressing");
  mesh.rotation.y = yaw;
  mesh.checkCollisions = false;
  mesh.metadata = { ...mesh.metadata, phase: "13.1", category };
  stats.meshes += 1;
  stats.categories.add(category);
  return mesh;
};

const addDressingTorus = (
  scene: Scene,
  name: string,
  position: Vector3,
  diameter: number,
  thickness: number,
  material: StandardMaterial,
  category: string,
  stats: PoiDressingStats,
  rotationX = Math.PI / 2,
): AbstractMesh => {
  const mesh = MeshBuilder.CreateTorus(name, { diameter, thickness, tessellation: 48 }, scene);
  mesh.position.copyFrom(position);
  mesh.rotation.x = rotationX;
  mesh.material = material;
  mesh.checkCollisions = false;
  mesh.metadata = { gameplayTag: "poi-dressing", phase: "13.1", category };
  stats.meshes += 1;
  stats.categories.add(category);
  return mesh;
};

const addDressingCable = (
  scene: Scene,
  name: string,
  points: Vector3[],
  color: Color3,
  category: string,
  stats: PoiDressingStats,
): LinesMesh => {
  const line = createCable(scene, name, points, color);
  line.metadata = { ...line.metadata, gameplayTag: "poi-dressing-cable", phase: "13.1", category };
  stats.meshes += 1;
  stats.categories.add(category);
  return line;
};

const addPipeBundle = (
  scene: Scene,
  name: string,
  origin: Vector3,
  count: number,
  length: number,
  yaw: number,
  material: StandardMaterial,
  category: string,
  stats: PoiDressingStats,
): void => {
  for (let index = 0; index < count; index += 1) {
    const pipe = MeshBuilder.CreateCylinder(`${name}-${index}`, { height: length, diameter: 0.34, tessellation: 10 }, scene);
    pipe.position.copyFrom(origin.add(new Vector3(index * 0.42, index * 0.06, (index % 2) * 0.42)));
    pipe.rotation.z = Math.PI / 2;
    pipe.rotation.y = yaw;
    pipe.material = material;
    pipe.checkCollisions = false;
    pipe.metadata = { gameplayTag: "poi-dressing", phase: "13.1", category };
    stats.meshes += 1;
    stats.categories.add(category);
  }
};

const addHazardPosts = (
  scene: Scene,
  name: string,
  origin: Vector3,
  radius: number,
  material: StandardMaterial,
  category: string,
  stats: PoiDressingStats,
): void => {
  for (let index = 0; index < 4; index += 1) {
    const angle = Math.PI / 4 + index * (Math.PI / 2);
    addDressingBox(
      scene,
      `${name}-${index}`,
      origin.add(new Vector3(Math.cos(angle) * radius, 0.72, Math.sin(angle) * radius)),
      new Vector3(0.44, 1.44, 0.44),
      material,
      category,
      stats,
      angle,
    );
  }
};

const createExtractionZones = (scene: Scene): Map<string, AbstractMesh> => {
  const meshes = new Map<string, AbstractMesh>();

  for (const zone of extractionZoneDefinitions) {
    const material = createMaterial(
      scene,
      `${zone.id}-material`,
      new Color3(0.02, 0.2, 0.24),
      themeConfig.colors.cyan.scale(0.38),
    );
    material.alpha = 0.68;
    const beaconMaterial = createMaterial(
      scene,
      `${zone.id}-beacon-material`,
      new Color3(0.05, 0.23, 0.26),
      themeConfig.colors.cyan.scale(0.62).add(themeConfig.colors.orange.scale(0.1)),
    );
    beaconMaterial.alpha = 0.76;

    const mesh = MeshBuilder.CreateCylinder(
      zone.id,
      { height: 0.04, diameter: zone.radius * 2, tessellation: 48 },
      scene,
    );
    mesh.position.copyFrom(zone.center.add(new Vector3(0, 0.04, 0)));
    mesh.material = material;
    mesh.checkCollisions = false;
    mesh.metadata = {
      gameplayTag: "extraction-zone",
      extractId: zone.id,
      name: zone.name,
    };
    meshes.set(zone.id, mesh);

    const beam = MeshBuilder.CreateCylinder(
      `${zone.id}-beam`,
      { height: 8, diameterTop: zone.radius * 0.55, diameterBottom: zone.radius * 1.15, tessellation: 24 },
      scene,
    );
    beam.position.copyFrom(zone.center.add(new Vector3(0, 4, 0)));
    beam.material = material;
    beam.checkCollisions = false;
    beam.metadata = {
      gameplayTag: "extraction-beam",
      extractId: zone.id,
    };
    meshes.set(`${zone.id}-beam`, beam);

    const beacon = MeshBuilder.CreateTorus(
      `${zone.id}-beacon-ring`,
      { diameter: zone.radius * 2.55, thickness: 0.08, tessellation: 64 },
      scene,
    );
    beacon.position.copyFrom(zone.center.add(new Vector3(0, 0.12, 0)));
    beacon.rotation.x = Math.PI / 2;
    beacon.material = beaconMaterial;
    beacon.checkCollisions = false;
    beacon.metadata = {
      gameplayTag: "extraction-beacon-ring",
      extractId: zone.id,
    };
    meshes.set(`${zone.id}-beacon`, beacon);

  }

  return meshes;
};

const createRamp = (
  scene: Scene,
  name: string,
  position: Vector3,
  scale: Vector3,
  yaw: number,
  pitch: number,
  material: StandardMaterial,
): AbstractMesh => {
  const ramp = createBox(scene, name, position, scale, material, "ramp");
  ramp.rotation.set(pitch, yaw, 0);
  return ramp;
};

const createPoiSign = (
  scene: Scene,
  name: string,
  label: string,
  position: Vector3,
  signMaterial: StandardMaterial,
  bannerMaterial: StandardMaterial,
): void => {
  createBox(scene, `${name}-post-left`, position.add(new Vector3(-2.4, -1.15, 0)), new Vector3(0.25, 2.3, 0.25), signMaterial, "poi-sign");
  createBox(scene, `${name}-post-right`, position.add(new Vector3(2.4, -1.15, 0)), new Vector3(0.25, 2.3, 0.25), signMaterial, "poi-sign");
  createBox(scene, `${name}-banner`, position, new Vector3(Math.max(4.8, label.length * 0.82), 1.25, 0.28), bannerMaterial, "poi-sign");

  for (let index = 0; index < label.length; index += 1) {
    const marker = MeshBuilder.CreateBox(`${name}-letter-${index}`, { size: 1 }, scene);
    marker.position.copyFrom(position.add(new Vector3((index - (label.length - 1) / 2) * 0.62, 0.02, -0.18)));
    marker.scaling.set(0.36, 0.72, 0.08);
    marker.material = signMaterial;
    marker.checkCollisions = false;
    marker.metadata = { gameplayTag: "poi-sign-letter", label: label[index] };
  }
};

const createBarrel = (
  scene: Scene,
  name: string,
  position: Vector3,
  material: StandardMaterial,
): AbstractMesh => {
  const barrel = MeshBuilder.CreateCylinder(name, { height: 1.5, diameter: 0.9, tessellation: 12 }, scene);
  barrel.position.copyFrom(position);
  barrel.material = material;
  barrel.checkCollisions = true;
  barrel.metadata = { gameplayTag: "cover" };
  return barrel;
};

const createScrapPile = (
  scene: Scene,
  name: string,
  position: Vector3,
  scale: Vector3,
  material: StandardMaterial,
): void => {
  createBox(scene, `${name}-base`, position, scale, material, "scrap-pile");
  createBox(scene, `${name}-chunk-a`, position.add(new Vector3(-scale.x * 0.2, 0.45, 0)), scale.scale(0.45), material, "scrap-pile");
  createBox(scene, `${name}-chunk-b`, position.add(new Vector3(scale.x * 0.2, 0.32, scale.z * 0.18)), scale.scale(0.32), material, "scrap-pile");
};

const createCable = (
  scene: Scene,
  name: string,
  points: Vector3[],
  color: Color3,
): LinesMesh => {
  const cable = MeshBuilder.CreateLines(name, { points }, scene);
  cable.color = color;
  cable.metadata = { gameplayTag: "glowing-cable" };
  return cable;
};

const createZipline = (
  scene: Scene,
  name: string,
  start: Vector3,
  end: Vector3,
  color: Color3,
  nodeMaterial: StandardMaterial,
): void => {
  const line = MeshBuilder.CreateLines(name, { points: [start, end] }, scene);
  line.color = color;
  line.metadata = { gameplayTag: "zipline", ziplineId: name };

  for (const [suffix, position] of [["start", start], ["end", end]] as const) {
    const node = MeshBuilder.CreateCylinder(
      `${name}-${suffix}-node`,
      { height: 1.25, diameter: 1.15, tessellation: 12 },
      scene,
    );
    node.position.copyFrom(position);
    node.material = nodeMaterial;
    node.checkCollisions = false;
    node.metadata = {
      gameplayTag: "zipline-node",
      ziplineId: name,
      start,
      end,
    };
  }
};

const createJumpPad = (
  scene: Scene,
  name: string,
  position: Vector3,
  launchVelocity: Vector3,
  material: StandardMaterial,
): AbstractMesh => {
  const pad = MeshBuilder.CreateCylinder(name, { height: 0.22, diameter: 4, tessellation: 8 }, scene);
  pad.position.copyFrom(position);
  pad.material = material;
  pad.checkCollisions = false;
  pad.metadata = {
    gameplayTag: "jump-pad",
    launchVelocity,
  };

  const ring = MeshBuilder.CreateTorus(`${name}-glow-ring`, { diameter: 4.4, thickness: 0.08, tessellation: 32 }, scene);
  ring.position.copyFrom(position.add(new Vector3(0, 0.13, 0)));
  ring.rotation.x = Math.PI / 2;
  ring.material = material;
  ring.checkCollisions = false;
  ring.metadata = { gameplayTag: "jump-pad-visual" };
  return pad;
};

const createContractVariantMarkers = (scene: Scene): AbstractMesh[] => {
  const meshes: AbstractMesh[] = [];
  const variants = [
    { type: "scavenger", color: themeConfig.colors.rootGreen, tag: "hidden-material-cache" },
    { type: "combat", color: themeConfig.colors.orange, tag: "ambush-barricade" },
    { type: "poi-objective", color: themeConfig.colors.cyan, tag: "recovery-signal-room" },
    { type: "extraction", color: themeConfig.colors.cyan, tag: "emergency-extract-anchor" },
    { type: "stealth", color: themeConfig.colors.purple, tag: "dark-side-entry" },
    { type: "vendor", color: themeConfig.colors.yellow, tag: "vendor-drop-cache" },
  ];

  for (const poi of poiDefinitions) {
    for (const [index, variant] of variants.entries()) {
      const material = createMaterial(
        scene,
        `${poi.id}-${variant.type}-variant-material`,
        variant.color.scale(0.32),
        variant.color.scale(0.42),
      );
      material.alpha = 0.88;
      const marker = createBox(
        scene,
        `${poi.id}-${variant.type}-${variant.tag}`,
        poi.center.add(new Vector3(-4 + index * 1.8, 0.7, poi.radius * 0.42)),
        new Vector3(1.2, 1.4, 1.2),
        material,
        `contract-${variant.type}`,
      );
      marker.checkCollisions = variant.type === "combat";
      marker.metadata = {
        ...marker.metadata,
        contractType: variant.type,
        poiName: poi.name,
        poiId: poi.id,
        contractVariantTag: variant.tag,
      };
      marker.setEnabled(false);
      meshes.push(marker);
    }
  }

  return meshes;
};

const createBox = (
  scene: Scene,
  name: string,
  position: Vector3,
  scale: Vector3,
  material: StandardMaterial,
  gameplayTag: string,
): AbstractMesh => {
  const mesh = MeshBuilder.CreateBox(name, { size: 1 }, scene);
  mesh.position.copyFrom(position);
  mesh.scaling.copyFrom(scale);
  mesh.material = material;
  mesh.checkCollisions = true;
  mesh.metadata = { gameplayTag };
  return mesh;
};

const createMaterial = (
  scene: Scene,
  name: string,
  diffuseColor: Color3,
  emissiveColor = Color3.Black(),
): StandardMaterial => {
  const material = new StandardMaterial(name, scene);
  material.diffuseColor = diffuseColor;
  material.emissiveColor = emissiveColor;
  material.specularColor = new Color3(0.08, 0.08, 0.1);
  return material;
};
