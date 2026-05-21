import {
  AbstractMesh,
  Color3,
  LinesMesh,
  MeshBuilder,
  PointLight,
  Scene,
  StandardMaterial,
  Vector3,
} from "@babylonjs/core";
import {
  extractionZoneDefinitions,
  getPoiNameAtPosition,
  mapLayoutConfig,
  poiDefinitions,
} from "./MapLayout";
import { themeConfig } from "../theme/ThemeConfig";

export type WorldMap = Readonly<{
  getCurrentPoiName: (position: Vector3) => string | null;
  setActiveExtractionZones: (ids: readonly string[]) => void;
  setContractVariant: (type: string | null, poiName: string | null) => void;
}>;

const halfMapSize = mapLayoutConfig.size / 2;

export const createWorld = (scene: Scene): WorldMap => {
  createGround(scene);
  createGroundGrid(scene);
  createArenaWalls(scene);
  createPoiPads(scene);
  createMapProps(scene);
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
  groundMaterial.diffuseColor = themeConfig.colors.ground;
  groundMaterial.emissiveColor = themeConfig.colors.cyan.scale(0.012);
  groundMaterial.specularColor = new Color3(0.02, 0.025, 0.035);

  const ground = MeshBuilder.CreateGround(
    "map-floor",
    { width: mapLayoutConfig.size, height: mapLayoutConfig.size },
    scene,
  );
  ground.material = groundMaterial;
  ground.checkCollisions = true;
};

const createGroundGrid = (scene: Scene): void => {
  const gridColor = themeConfig.colors.cyan.scale(0.16);

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
    material.alpha = 0.62;

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
