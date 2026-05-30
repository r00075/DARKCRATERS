import {
  Color3,
  Mesh,
  MeshBuilder,
  PointLight,
  Scene,
  StandardMaterial,
  Vector3,
} from "@babylonjs/core";
import { themeConfig } from "../theme/ThemeConfig";
import { mapLayoutConfig, poiDefinitions } from "./MapLayout";

const landing = mapLayoutConfig.shipLandingSitePosition;
const miningPoi = poiDefinitions.find((poi) => poi.id === "warehouse")?.center ?? new Vector3(-92, 0, -22);

export const createTychoScarVisualSlice = (scene: Scene): void => {
  const regolith = createMaterial(scene, "tycho-slice-regolith-material", new Color3(0.045, 0.052, 0.064), themeConfig.colors.cyan.scale(0.01));
  const compressedDust = createMaterial(scene, "tycho-slice-compressed-dust-material", new Color3(0.078, 0.084, 0.092), Color3.Black());
  compressedDust.alpha = 0.66;
  const shadow = createMaterial(scene, "tycho-slice-shadow-regolith-material", new Color3(0.026, 0.032, 0.044), themeConfig.colors.purple.scale(0.012));
  shadow.alpha = 0.78;
  const rock = createMaterial(scene, "tycho-slice-rock-material", new Color3(0.105, 0.116, 0.132), Color3.Black());
  const metal = createMaterial(scene, "tycho-slice-industrial-metal-material", new Color3(0.15, 0.17, 0.19), themeConfig.colors.cyan.scale(0.025));
  const amber = createMaterial(scene, "tycho-slice-amber-worklight-material", new Color3(0.28, 0.16, 0.055), themeConfig.colors.orange.scale(0.42));
  const cyan = createMaterial(scene, "tycho-slice-cyan-worklight-material", new Color3(0.03, 0.16, 0.18), themeConfig.colors.cyan.scale(0.38));
  const lumenTrace = createMaterial(scene, "tycho-slice-lumen-trace-material", new Color3(0.06, 0.04, 0.12), themeConfig.colors.purple.scale(0.22).add(themeConfig.colors.rootGreen.scale(0.08)));

  createLandingGround(scene, regolith, compressedDust, shadow);
  createRockAndRidgeFrame(scene, rock, shadow);
  createShipFieldBase(scene, metal, amber, cyan, compressedDust);
  createIndustrialRecoveryPoi(scene, metal, amber, cyan, compressedDust);
  createRouteReadability(scene, compressedDust, cyan, amber);
  createRestrainedLumenTrace(scene, lumenTrace, rock);
  createSliceReadabilityLighting(scene);
};

const createLandingGround = (
  scene: Scene,
  regolith: StandardMaterial,
  compressedDust: StandardMaterial,
  shadow: StandardMaterial,
): void => {
  createDisc(scene, "tycho-slice-landing-regolith", landing.add(new Vector3(0, 0.046, 0)), 86, regolith, 64, false);
  createDisc(scene, "tycho-slice-landing-shadow-bowl", landing.add(new Vector3(8, 0.052, 16)), 56, shadow, 56, false).scaling.z = 0.62;
  createDisc(scene, "tycho-slice-landing-scorch", landing.add(new Vector3(0, 0.072, 0)), 32, compressedDust, 48, false).scaling.z = 0.76;
  createDisc(scene, "tycho-slice-touchdown-dust-ring", landing.add(new Vector3(0, 0.085, 0)), 43, compressedDust, 64, false).scaling.z = 0.42;
  createDisc(scene, "tycho-slice-thruster-contact-glow", landing.add(new Vector3(0, 0.096, -3)), 19, shadow, 42, false).scaling.z = 0.38;

  const footpads = [
    new Vector3(-13, 0.09, -9),
    new Vector3(13, 0.09, -9),
    new Vector3(-13, 0.09, 9),
    new Vector3(13, 0.09, 9),
  ];
  for (const [index, offset] of footpads.entries()) {
    const pad = createBox(scene, `tycho-slice-ship-footprint-${index}`, landing.add(offset), new Vector3(8, 0.025, 4.6), compressedDust, "visual-landing-footprint");
    pad.rotation.y = index % 2 === 0 ? 0.18 : -0.18;
    pad.checkCollisions = false;
  }
};

const createRockAndRidgeFrame = (scene: Scene, rock: StandardMaterial, shadow: StandardMaterial): void => {
  const ridgeSpecs = [
    [-135, -126, 38, 2.8, 7, 0.38],
    [-72, -140, 44, 3.2, 8, -0.18],
    [-136, -76, 34, 2.6, 6, -0.72],
    [-45, -78, 32, 2.2, 5, 0.56],
    [-122, -18, 28, 2.1, 5, 0.08],
  ] as const;
  for (const [x, z, sx, sy, sz, yaw] of ridgeSpecs) {
    const ridge = createBox(scene, `tycho-slice-ridge-${x}-${z}`, new Vector3(x, sy / 2 - 0.05, z), new Vector3(sx, sy, sz), rock, "visual-ridge");
    ridge.rotation.y = yaw;
    ridge.checkCollisions = false;
  }

  const masterRock = MeshBuilder.CreateSphere("tycho-slice-rock-master", { diameter: 1, segments: 6 }, scene);
  masterRock.material = rock;
  masterRock.isVisible = false;
  masterRock.checkCollisions = false;

  const rocks = [
    [-136, -102, 4.2, 1.7, 0.2],
    [-126, -134, 2.8, 1.2, 0.8],
    [-94, -138, 3.4, 1.4, 0.5],
    [-64, -118, 3.6, 1.2, -0.3],
    [-52, -68, 2.8, 1.1, 0.7],
    [-122, -54, 3.2, 1.3, -0.4],
    [-142, -82, 2.5, 1.1, 0.9],
    [-74, -88, 2.1, 0.9, 0.1],
    [-108, -18, 3.4, 1.5, -0.5],
    [-86, -36, 2.2, 0.9, 0.2],
  ] as const;
  for (const [index, x, z, sx, sy, yaw] of rocks.map((item, index) => [index, ...item] as const)) {
    const instance = masterRock.createInstance(`tycho-slice-rock-${index}`);
    instance.position.set(x, sy / 2, z);
    instance.scaling.set(sx, sy, sx * 0.72);
    instance.rotation.set(0.15, yaw, 0.06);
    instance.metadata = { gameplayTag: "visual-rock" };
  }

  createDisc(scene, "tycho-slice-deep-shadow-pocket", new Vector3(-134, 0.055, -48), 30, shadow, 36, false).scaling.z = 0.55;
};

const createShipFieldBase = (
  scene: Scene,
  metal: StandardMaterial,
  amber: StandardMaterial,
  cyan: StandardMaterial,
  dust: StandardMaterial,
): void => {
  createBox(scene, "tycho-slice-field-base-mat-a", landing.add(new Vector3(18, 0.09, 12)), new Vector3(12, 0.045, 5), dust, "visual-field-base").rotation.y = 0.12;
  createBox(scene, "tycho-slice-field-base-mat-b", landing.add(new Vector3(-18, 0.09, 13)), new Vector3(10, 0.045, 4.5), dust, "visual-field-base").rotation.y = -0.18;
  createBox(scene, "tycho-slice-field-base-crate-a", landing.add(new Vector3(21, 0.55, 16)), new Vector3(3.4, 1.1, 2.1), metal, "visual-field-base");
  createBox(scene, "tycho-slice-field-base-case-b", landing.add(new Vector3(-23, 0.45, 12)), new Vector3(2.4, 0.9, 2.4), metal, "visual-field-base");
  createBox(scene, "tycho-slice-cargo-side-light", landing.add(new Vector3(17, 0.8, 5)), new Vector3(0.45, 1.6, 0.45), cyan, "visual-field-base-light");
  createBox(scene, "tycho-slice-launch-side-beacon", landing.add(new Vector3(-17, 0.8, -14)), new Vector3(0.45, 1.6, 0.45), amber, "visual-field-base-light");

  const bayLight = new PointLight("tycho-slice-cargo-worklight", landing.add(new Vector3(16, 2.1, 5)), scene);
  bayLight.diffuse = themeConfig.colors.cyan;
  bayLight.intensity = 0.46;
  bayLight.range = 22;

  const beaconLight = new PointLight("tycho-slice-landing-amber-beacon", landing.add(new Vector3(-17, 2.1, -14)), scene);
  beaconLight.diffuse = themeConfig.colors.orange;
  beaconLight.intensity = 0.34;
  beaconLight.range = 18;
};

const createIndustrialRecoveryPoi = (
  scene: Scene,
  metal: StandardMaterial,
  amber: StandardMaterial,
  cyan: StandardMaterial,
  dust: StandardMaterial,
): void => {
  const center = miningPoi.add(new Vector3(-4, 0, -20));
  createDisc(scene, "tycho-slice-mining-yard-ground", center.add(new Vector3(0, 0.06, 0)), 42, dust, 48, false).scaling.z = 0.62;
  createBox(scene, "tycho-slice-drill-deck", center.add(new Vector3(0, 0.25, 0)), new Vector3(24, 0.42, 14), metal, "visual-mining-poi").checkCollisions = false;
  createBox(scene, "tycho-slice-drill-a-frame-left", center.add(new Vector3(-6, 3.2, -2)), new Vector3(0.8, 6.4, 0.8), metal, "visual-mining-poi").rotation.z = -0.22;
  createBox(scene, "tycho-slice-drill-a-frame-right", center.add(new Vector3(6, 3.2, -2)), new Vector3(0.8, 6.4, 0.8), metal, "visual-mining-poi").rotation.z = 0.22;
  createBox(scene, "tycho-slice-drill-crosshead", center.add(new Vector3(0, 6.2, -2)), new Vector3(15, 0.55, 0.8), amber, "visual-mining-poi");
  createBox(scene, "tycho-slice-drill-spindle-preview", center.add(new Vector3(0, 2.3, -2)), new Vector3(1.4, 4.6, 1.4), cyan, "visual-mining-poi");
  createBox(scene, "tycho-slice-mining-cargo-sled", center.add(new Vector3(12, 0.8, 6)), new Vector3(5.5, 1.6, 3.2), metal, "visual-mining-poi");
  createBox(scene, "tycho-slice-relay-mast", center.add(new Vector3(-14, 4.2, 6)), new Vector3(0.5, 8.4, 0.5), cyan, "visual-mining-poi");
  createBox(scene, "tycho-slice-relay-head", center.add(new Vector3(-14, 8.6, 6)), new Vector3(4.2, 0.38, 1.2), cyan, "visual-mining-poi");
  createBox(scene, "tycho-slice-mining-floodlight", center.add(new Vector3(15, 3.4, -8)), new Vector3(1.4, 0.8, 0.45), amber, "visual-mining-poi");

  const poiLight = new PointLight("tycho-slice-mining-controlled-floodlight", center.add(new Vector3(15, 5.2, -8)), scene);
  poiLight.diffuse = themeConfig.colors.orange;
  poiLight.intensity = 0.28;
  poiLight.range = 26;
};

const createRouteReadability = (
  scene: Scene,
  dust: StandardMaterial,
  cyan: StandardMaterial,
  amber: StandardMaterial,
): void => {
  const route = [
    [landing.x + 3, landing.z + 28, 10, 36, -0.08],
    [-100, -48, 9, 38, -0.24],
    [-96, -18, 9, 32, 0.08],
  ] as const;
  for (const [x, z, sx, sz, yaw] of route) {
    const trail = createBox(scene, `tycho-slice-route-${x}-${z}`, new Vector3(x, 0.08, z), new Vector3(sx, 0.04, sz), dust, "visual-route");
    trail.rotation.y = yaw;
    trail.checkCollisions = false;
  }

  for (const [index, x, z, material] of [
    [0, -103, -72, cyan],
    [1, -101, -54, cyan],
    [2, -97, -36, amber],
    [3, -94, -20, cyan],
  ] as const) {
    createBox(scene, `tycho-slice-route-bollard-${index}`, new Vector3(x, 0.55, z), new Vector3(0.42, 1.1, 0.42), material, "visual-route-light");
  }
};

const createRestrainedLumenTrace = (scene: Scene, lumenTrace: StandardMaterial, rock: StandardMaterial): void => {
  const traceSite = new Vector3(-132, 0, -42);
  createDisc(scene, "tycho-slice-lumen-residue-shadow", traceSite.add(new Vector3(0, 0.085, 0)), 13, lumenTrace, 28, false).scaling.z = 0.46;
  for (const [index, offset, height, yaw] of [
    [0, new Vector3(-4, 0.7, -1), 1.4, 0.4],
    [1, new Vector3(3, 0.55, 3), 1.1, -0.2],
    [2, new Vector3(1, 0.45, -5), 0.9, 0.7],
  ] as const) {
    const shard = createBox(scene, `tycho-slice-lumen-trace-shard-${index}`, traceSite.add(offset), new Vector3(0.45, height, 0.45), lumenTrace, "visual-lumen-trace");
    shard.rotation.y = yaw;
    shard.checkCollisions = false;
  }
  createBox(scene, "tycho-slice-lumen-shadow-rock", traceSite.add(new Vector3(7, 0.8, -3)), new Vector3(4.6, 1.6, 2.4), rock, "visual-rock").checkCollisions = false;
};

const createSliceReadabilityLighting = (scene: Scene): void => {
  const coldFill = new PointLight("tycho-slice-cold-landing-fill", landing.add(new Vector3(-8, 18, -18)), scene);
  coldFill.diffuse = new Color3(0.48, 0.62, 0.78);
  coldFill.intensity = 0.18;
  coldFill.range = 82;
};

const createDisc = (
  scene: Scene,
  name: string,
  position: Vector3,
  diameter: number,
  material: StandardMaterial,
  tessellation: number,
  collidable: boolean,
): Mesh => {
  const disc = MeshBuilder.CreateCylinder(name, { height: 0.035, diameter, tessellation }, scene);
  disc.position.copyFrom(position);
  disc.material = material;
  disc.checkCollisions = collidable;
  disc.metadata = { gameplayTag: "visual-slice" };
  return disc;
};

const createBox = (
  scene: Scene,
  name: string,
  position: Vector3,
  scale: Vector3,
  material: StandardMaterial,
  gameplayTag: string,
): Mesh => {
  const mesh = MeshBuilder.CreateBox(name, { size: 1 }, scene);
  mesh.position.copyFrom(position);
  mesh.scaling.copyFrom(scale);
  mesh.material = material;
  mesh.checkCollisions = false;
  mesh.metadata = { gameplayTag };
  return mesh;
};

const createMaterial = (
  scene: Scene,
  name: string,
  diffuseColor: Color3,
  emissiveColor: Color3,
): StandardMaterial => {
  const material = new StandardMaterial(name, scene);
  material.diffuseColor = diffuseColor;
  material.emissiveColor = emissiveColor;
  material.specularColor = new Color3(0.035, 0.04, 0.05);
  return material;
};
