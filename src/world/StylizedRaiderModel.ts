import {
  AbstractMesh,
  Color3,
  Material,
  MeshBuilder,
  Scene,
  StandardMaterial,
  Vector3,
} from "@babylonjs/core";
import type { PlayerAnimationRig } from "../animation/PlayerAnimationController";
import type { CosmeticPalette } from "../cosmetics/CosmeticManager";
import { themeConfig } from "../theme/ThemeConfig";

export const stylizedRaiderModelConfig = {
  bodyScale: 1,
  torso: { width: 0.7, height: 0.78, depth: 0.42 },
  head: { diameter: 0.46 },
  hips: { width: 0.48, height: 0.24, depth: 0.34 },
  upperArm: { width: 0.16, height: 0.42, depth: 0.16 },
  forearm: { width: 0.18, height: 0.38, depth: 0.18 },
  glove: { width: 0.3, height: 0.18, depth: 0.28 },
  thigh: { width: 0.2, height: 0.46, depth: 0.2 },
  calf: { width: 0.18, height: 0.42, depth: 0.18 },
  boot: { width: 0.36, height: 0.22, depth: 0.52 },
  vest: { width: 0.74, height: 0.62, depth: 0.18 },
  backpack: { width: 0.58, height: 0.78, depth: 0.3 },
  visor: { width: 0.42, height: 0.11, depth: 0.08 },
  shoulderPad: { width: 0.24, height: 0.14, depth: 0.26 },
} as const;

export type StylizedRaiderMaterials = Readonly<{
  hoodie: StandardMaterial;
  jacketDark: StandardMaterial;
  vest: StandardMaterial;
  boots: StandardMaterial;
  gloves: StandardMaterial;
  visor: StandardMaterial;
  glow: StandardMaterial;
  accent: StandardMaterial;
}>;

export type StylizedRaiderSockets = Readonly<{
  weaponHand: AbstractMesh;
  backpack: AbstractMesh;
  headgear: AbstractMesh;
  chestEmblem: AbstractMesh;
}>;

export type StylizedRaiderParts = Readonly<{
  torso: AbstractMesh;
  shoulder: AbstractMesh;
  head: AbstractMesh;
  leftArm: AbstractMesh;
  rightArm: AbstractMesh;
  leftLeg: AbstractMesh;
  rightLeg: AbstractMesh;
  backpack: AbstractMesh;
  vest: AbstractMesh;
  visor: AbstractMesh;
  chestEmblem: AbstractMesh;
  visualMeshes: AbstractMesh[];
}>;

export class StylizedRaiderModel {
  public readonly parts: StylizedRaiderParts;
  public readonly sockets: StylizedRaiderSockets;
  public readonly materials: StylizedRaiderMaterials;

  public constructor(scene: Scene, private readonly root: AbstractMesh) {
    this.materials = this.createMaterials(scene);
    const built = this.build(scene);
    this.parts = built.parts;
    this.sockets = built.sockets;
  }

  public get animationRig(): PlayerAnimationRig {
    return {
      body: this.parts.torso,
      shoulder: this.parts.shoulder,
      head: this.parts.head,
      leftArm: this.parts.leftArm,
      rightArm: this.parts.rightArm,
      leftLeg: this.parts.leftLeg,
      rightLeg: this.parts.rightLeg,
      weaponSocket: this.sockets.weaponHand,
    };
  }

  public setAlpha(alpha: number): void {
    for (const material of Object.values(this.materials)) {
      material.alpha = alpha;
    }
  }

  public setEnabled(enabled: boolean): void {
    for (const mesh of this.parts.visualMeshes) {
      mesh.setEnabled(enabled);
    }
  }

  public applyCosmeticPalette(palette: CosmeticPalette): void {
    this.applyMaterialColors(this.materials.hoodie, palette.hoodie, palette.hoodie.scale(0.08));
    this.applyMaterialColors(this.materials.jacketDark, palette.jacketDark, palette.jacketDark.scale(0.12));
    this.applyMaterialColors(this.materials.vest, palette.vest, palette.accent.scale(0.08));
    this.applyMaterialColors(this.materials.boots, palette.boots, palette.boots.scale(0.08));
    this.applyMaterialColors(this.materials.gloves, palette.gloves, palette.accent.scale(0.06));
    this.applyMaterialColors(this.materials.visor, palette.visor, palette.visor.scale(0.55));
    this.applyMaterialColors(this.materials.glow, palette.glow, palette.glow.scale(0.78));
    this.applyMaterialColors(this.materials.accent, palette.accent, palette.accent.scale(0.22));
  }

  public updateCrouchAccessories(crouchAmount: number, lerp: (from: number, to: number, amount: number) => number): void {
    this.parts.shoulder.position.y = lerp(1.55, 1.02, crouchAmount);
    this.sockets.weaponHand.position.y = lerp(1.32, 0.86, crouchAmount);
    this.parts.backpack.scaling.y = lerp(1, 0.72, crouchAmount);
    this.parts.vest.scaling.y = lerp(1, 0.74, crouchAmount);
    this.parts.chestEmblem.position.y = lerp(1.36, 0.98, crouchAmount);
    this.sockets.backpack.position.y = lerp(1.28, 0.92, crouchAmount);
    this.sockets.headgear.position.y = lerp(2.18, 1.68, crouchAmount);
    this.sockets.chestEmblem.position.y = this.parts.chestEmblem.position.y;
  }

  private build(scene: Scene): { parts: StylizedRaiderParts; sockets: StylizedRaiderSockets } {
    const visualMeshes: AbstractMesh[] = [];
    const makeBox = (
      name: string,
      position: Vector3,
      scale: Vector3,
      material: StandardMaterial,
      parent: AbstractMesh = this.root,
    ): AbstractMesh => {
      const mesh = MeshBuilder.CreateBox(name, { size: 1 }, scene);
      mesh.parent = parent;
      mesh.position.copyFrom(position);
      mesh.scaling.copyFrom(scale);
      mesh.material = material;
      mesh.checkCollisions = false;
      mesh.metadata = { entityType: "player", cosmeticSlot: name };
      visualMeshes.push(mesh);
      return mesh;
    };

    const makeSphere = (
      name: string,
      position: Vector3,
      diameter: number,
      material: StandardMaterial,
    ): AbstractMesh => {
      const mesh = MeshBuilder.CreateSphere(name, { diameter, segments: 16 }, scene);
      mesh.parent = this.root;
      mesh.position.copyFrom(position);
      mesh.material = material;
      mesh.checkCollisions = false;
      mesh.metadata = { entityType: "player", cosmeticSlot: name };
      visualMeshes.push(mesh);
      return mesh;
    };

    const torso = makeBox(
      "darc-raider-torso-jacket",
      new Vector3(0, 0.98, 0.03),
      new Vector3(
        stylizedRaiderModelConfig.torso.width,
        stylizedRaiderModelConfig.torso.height,
        stylizedRaiderModelConfig.torso.depth,
      ),
      this.materials.hoodie,
    );
    const shoulder = makeBox(
      "darc-raider-shoulder-line",
      new Vector3(0.18, 1.55, 0.08),
      new Vector3(0.82, 0.14, 0.26),
      this.materials.hoodie,
    );
    const head = makeSphere(
      "darc-raider-mask-head",
      new Vector3(0, 1.98, 0.02),
      stylizedRaiderModelConfig.head.diameter,
      this.materials.jacketDark,
    );
    head.scaling.set(1.08, 1.02, 1.08);

    makeBox("darc-raider-hood", new Vector3(0, 1.88, -0.08), new Vector3(0.56, 0.3, 0.24), this.materials.hoodie);
    makeBox("darc-raider-hips", new Vector3(0, 0.58, 0), new Vector3(0.48, 0.24, 0.34), this.materials.jacketDark);

    const leftArm = makeBox("darc-raider-left-arm-rig", new Vector3(0.46, 1.34, 0.2), new Vector3(0.01, 0.01, 0.01), this.materials.hoodie);
    leftArm.isVisible = false;
    const rightArm = makeBox("darc-raider-right-arm-rig", new Vector3(0.22, 1.34, 0.4), new Vector3(0.01, 0.01, 0.01), this.materials.hoodie);
    rightArm.isVisible = false;
    this.createArm(scene, "left", leftArm, -1, visualMeshes);
    this.createArm(scene, "right", rightArm, 1, visualMeshes);

    const leftLeg = makeBox("darc-raider-left-leg-rig", new Vector3(-0.16, 0.42, 0), new Vector3(0.01, 0.01, 0.01), this.materials.boots);
    leftLeg.isVisible = false;
    const rightLeg = makeBox("darc-raider-right-leg-rig", new Vector3(0.16, 0.42, 0), new Vector3(0.01, 0.01, 0.01), this.materials.boots);
    rightLeg.isVisible = false;
    this.createLeg(scene, "left", leftLeg, visualMeshes);
    this.createLeg(scene, "right", rightLeg, visualMeshes);

    const vest = makeBox("darc-raider-tactical-vest", new Vector3(0, 1.26, 0.23), new Vector3(0.74, 0.62, 0.18), this.materials.vest);
    makeBox("darc-raider-left-shoulder-pad", new Vector3(-0.54, 1.52, 0.1), new Vector3(0.3, 0.16, 0.3), this.materials.accent);
    makeBox("darc-raider-right-shoulder-pad", new Vector3(0.54, 1.52, 0.1), new Vector3(0.3, 0.16, 0.3), this.materials.accent);
    const backpack = makeBox("darc-raider-loot-rig-backpack", new Vector3(0, 1.22, -0.38), new Vector3(0.58, 0.78, 0.3), this.materials.vest);
    makeBox("darc-raider-backpack-roll", new Vector3(0, 1.56, -0.5), new Vector3(0.58, 0.18, 0.18), this.materials.accent);
    makeBox("darc-raider-left-vest-plate", new Vector3(-0.22, 1.28, 0.34), new Vector3(0.18, 0.36, 0.04), this.materials.jacketDark);
    makeBox("darc-raider-right-vest-plate", new Vector3(0.22, 1.28, 0.34), new Vector3(0.18, 0.36, 0.04), this.materials.jacketDark);
    makeBox("darc-raider-backpack-antenna", new Vector3(0.22, 1.78, -0.54), new Vector3(0.05, 0.52, 0.05), this.materials.glow);
    const visor = makeBox("darc-raider-cyan-visor", new Vector3(0, 1.98, 0.24), new Vector3(0.42, 0.11, 0.08), this.materials.visor);
    const chestEmblem = makeBox("darc-raider-glow-emblem", new Vector3(0, 1.36, 0.33), new Vector3(0.22, 0.22, 0.035), this.materials.glow);

    const weaponHand = this.createSocket(scene, "darc-raider-weapon-hand-socket", new Vector3(0.34, 1.32, 0.42));
    const backpackSocket = this.createSocket(scene, "darc-raider-backpack-socket", new Vector3(0, 1.28, -0.48));
    const headgearSocket = this.createSocket(scene, "darc-raider-headgear-socket", new Vector3(0, 2.18, 0));
    const chestEmblemSocket = this.createSocket(scene, "darc-raider-chest-emblem-socket", new Vector3(0, 1.36, 0.36));

    return {
      parts: {
        torso,
        shoulder,
        head,
        leftArm,
        rightArm,
        leftLeg,
        rightLeg,
        backpack,
        vest,
        visor,
        chestEmblem,
        visualMeshes: visualMeshes.filter((mesh) => mesh.isVisible),
      },
      sockets: {
        weaponHand,
        backpack: backpackSocket,
        headgear: headgearSocket,
        chestEmblem: chestEmblemSocket,
      },
    };
  }

  private createArm(
    scene: Scene,
    side: "left" | "right",
    parent: AbstractMesh,
    direction: -1 | 1,
    visualMeshes: AbstractMesh[],
  ): void {
    visualMeshes.push(this.createChildBox(scene, `darc-raider-${side}-upper-arm`, parent, new Vector3(direction * 0.02, 0.08, -0.02), new Vector3(0.18, 0.42, 0.18), this.materials.hoodie));
    visualMeshes.push(this.createChildBox(scene, `darc-raider-${side}-forearm`, parent, new Vector3(direction * 0.02, -0.26, 0.12), new Vector3(0.2, 0.38, 0.2), this.materials.jacketDark));
    visualMeshes.push(this.createChildBox(scene, `darc-raider-${side}-glove`, parent, new Vector3(direction * 0.02, -0.52, 0.2), new Vector3(0.3, 0.18, 0.28), this.materials.gloves));
  }

  private createLeg(scene: Scene, side: "left" | "right", parent: AbstractMesh, visualMeshes: AbstractMesh[]): void {
    visualMeshes.push(this.createChildBox(scene, `darc-raider-${side}-thigh`, parent, new Vector3(0, 0.14, 0), new Vector3(0.22, 0.46, 0.22), this.materials.jacketDark));
    visualMeshes.push(this.createChildBox(scene, `darc-raider-${side}-calf`, parent, new Vector3(0, -0.24, 0.03), new Vector3(0.2, 0.42, 0.2), this.materials.boots));
    visualMeshes.push(this.createChildBox(scene, `darc-raider-${side}-chunky-boot`, parent, new Vector3(0, -0.56, 0.14), new Vector3(0.36, 0.22, 0.52), this.materials.boots));
  }

  private createChildBox(
    scene: Scene,
    name: string,
    parent: AbstractMesh,
    position: Vector3,
    scale: Vector3,
    material: StandardMaterial,
  ): AbstractMesh {
    const mesh = MeshBuilder.CreateBox(name, { size: 1 }, scene);
    mesh.parent = parent;
    mesh.position.copyFrom(position);
    mesh.scaling.copyFrom(scale);
    mesh.material = material;
    mesh.checkCollisions = false;
    mesh.metadata = { entityType: "player", cosmeticSlot: name };
    return mesh;
  }

  private createSocket(scene: Scene, name: string, position: Vector3): AbstractMesh {
    const socket = MeshBuilder.CreateBox(name, { size: 0.04 }, scene);
    socket.parent = this.root;
    socket.position.copyFrom(position);
    socket.isVisible = false;
    socket.checkCollisions = false;
    socket.metadata = { entityType: "player-socket" };
    return socket;
  }

  private createMaterials(scene: Scene): StylizedRaiderMaterials {
    return {
      hoodie: this.createMaterial(scene, "darc-raider-hoodie-material", themeConfig.colors.hoodie, themeConfig.colors.hoodie.scale(0.06)),
      jacketDark: this.createMaterial(scene, "darc-raider-jacket-dark-material", new Color3(0.08, 0.12, 0.25), new Color3(0.01, 0.03, 0.08)),
      vest: this.createMaterial(scene, "darc-raider-vest-material", themeConfig.colors.vest, themeConfig.colors.cyan.scale(0.04)),
      boots: this.createMaterial(scene, "darc-raider-boots-material", themeConfig.colors.boots, new Color3(0.01, 0.01, 0.02)),
      gloves: this.createMaterial(scene, "darc-raider-gloves-material", new Color3(0.04, 0.08, 0.12), themeConfig.colors.purple.scale(0.04)),
      visor: this.createMaterial(scene, "darc-raider-visor-material", themeConfig.colors.visor, themeConfig.colors.visor.scale(0.55)),
      glow: this.createMaterial(scene, "darc-raider-emblem-glow-material", themeConfig.colors.rootGreen, themeConfig.colors.rootGreen.scale(0.78)),
      accent: this.createMaterial(scene, "darc-raider-accent-material", themeConfig.colors.orange, themeConfig.colors.orange.scale(0.22)),
    };
  }

  private createMaterial(scene: Scene, name: string, diffuseColor: Color3, emissiveColor: Color3): StandardMaterial {
    const material = new StandardMaterial(name, scene);
    material.diffuseColor = diffuseColor;
    material.emissiveColor = emissiveColor;
    material.specularColor = new Color3(0.12, 0.16, 0.2);
    material.alpha = 1;
    material.transparencyMode = Material.MATERIAL_ALPHABLEND;
    return material;
  }

  private applyMaterialColors(material: StandardMaterial, diffuseColor: Color3, emissiveColor: Color3): void {
    material.diffuseColor = diffuseColor;
    material.emissiveColor = emissiveColor;
  }
}
