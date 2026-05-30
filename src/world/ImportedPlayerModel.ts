import {
  AbstractMesh,
  Color3,
  Material,
  Mesh,
  Scene,
  SceneLoader,
  StandardMaterial,
  TransformNode,
  Vector3,
} from "@babylonjs/core";
import "@babylonjs/loaders/glTF";
import { themeConfig } from "../theme/ThemeConfig";

export const importedPlayerModelConfig = {
  useImportedPlayerModel: false,
  url: "/models/player/obsidianSentinelPlayer.glb",
  targetHeight: 2.05,
  modelScale: 0.98,
  positionOffset: new Vector3(0, -0.02, 0),
  rotationOffset: new Vector3(0, Math.PI, 0),
  skinId: "roots-operator-fn",
  materialOverride: {
    enabled: false,
    charcoal: new Color3(0.03, 0.04, 0.07),
    cyan: themeConfig.colors.cyan,
    green: themeConfig.colors.rootGreen,
    purple: themeConfig.colors.purple,
  },
  rimHighlight: {
    enabled: true,
    emissiveStrength: 0.08,
  },
} as const;

// TODO: When the static Meshy character is promoted past preview quality, run it
// through Blender cleanup, add a humanoid armature, export a rigged GLB, then
// retarget placeholder movement/combat states through Mixamo or authored clips.

export type ImportedPlayerModelState = "loading" | "ready" | "fallback";

export class ImportedPlayerModel {
  private readonly container: TransformNode;
  private readonly importedMeshes: AbstractMesh[] = [];
  private readonly importedMaterials: Material[] = [];
  private state: ImportedPlayerModelState = "loading";
  private loadStarted = false;
  private fittedScale: number = importedPlayerModelConfig.modelScale;
  private standingPositionY: number = importedPlayerModelConfig.positionOffset.y;

  public constructor(
    private readonly scene: Scene,
    root: AbstractMesh,
    private readonly onReady: () => void,
  ) {
    this.container = new TransformNode("imported-player-model-root", scene);
    this.container.parent = root;
    this.container.position.copyFrom(importedPlayerModelConfig.positionOffset);
    this.container.rotation.copyFrom(importedPlayerModelConfig.rotationOffset);
  }

  public get status(): ImportedPlayerModelState {
    return this.state;
  }

  public get visualMeshes(): AbstractMesh[] {
    return [...this.importedMeshes];
  }

  public async load(): Promise<void> {
    if (this.loadStarted) {
      return;
    }

    if (!importedPlayerModelConfig.useImportedPlayerModel) {
      this.state = "fallback";
      console.info("Imported player model disabled; using placeholder.");
      return;
    }

    this.loadStarted = true;

    try {
      const result = await SceneLoader.ImportMeshAsync(
        "",
        "",
        importedPlayerModelConfig.url,
        this.scene,
      );

      this.importedMeshes.length = 0;

      for (const mesh of result.meshes) {
        if (mesh === this.container) {
          continue;
        }

        mesh.parent = this.container;
        mesh.checkCollisions = false;
        mesh.metadata = {
          ...(mesh.metadata ?? {}),
          entityType: "player",
          importedSkin: importedPlayerModelConfig.skinId,
        };

        if (mesh instanceof Mesh) {
          mesh.isPickable = true;
        }

        this.importedMeshes.push(mesh);
      }

      if (this.importedMeshes.length === 0) {
        throw new Error(`No renderable meshes found in ${importedPlayerModelConfig.url}`);
      }

      this.fitToPlayerHeight();
      this.applyMaterialPass();
      this.state = "ready";
      this.onReady();
    } catch (error) {
      this.state = "fallback";
      this.disposeImportedMeshes();
      console.warn(
        `Imported player model failed to load from ${importedPlayerModelConfig.url}; using stylized placeholder.`,
        error,
      );
    }
  }

  public setAlpha(alpha: number): void {
    for (const material of this.importedMaterials) {
      material.alpha = alpha;
    }
  }

  public setCrouchAmount(crouchAmount: number): void {
    this.container.scaling.y = this.fittedScale * (1 - crouchAmount * 0.16);
    this.container.position.y = this.standingPositionY - crouchAmount * 0.08;
  }

  private fitToPlayerHeight(): void {
    const bounds = this.calculateBounds();
    const height = Math.max(0.01, bounds.max.y - bounds.min.y);
    const normalizedScale = (importedPlayerModelConfig.targetHeight / height) *
      importedPlayerModelConfig.modelScale;

    this.container.scaling.setAll(normalizedScale);
    this.fittedScale = normalizedScale;
    this.standingPositionY = importedPlayerModelConfig.positionOffset.y - bounds.min.y * normalizedScale;
    this.container.position.set(
      importedPlayerModelConfig.positionOffset.x,
      this.standingPositionY,
      importedPlayerModelConfig.positionOffset.z,
    );
  }

  private calculateBounds(): { min: Vector3; max: Vector3 } {
    const min = new Vector3(Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY);
    const max = new Vector3(Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY);

    for (const mesh of this.importedMeshes) {
      const info = mesh.getBoundingInfo();
      const meshMin = info.boundingBox.minimumWorld;
      const meshMax = info.boundingBox.maximumWorld;
      min.minimizeInPlace(meshMin);
      max.maximizeInPlace(meshMax);
    }

    if (!Number.isFinite(min.x) || !Number.isFinite(max.x)) {
      return { min: Vector3.Zero(), max: new Vector3(0, importedPlayerModelConfig.targetHeight, 0) };
    }

    return { min, max };
  }

  private applyMaterialPass(): void {
    const override = importedPlayerModelConfig.materialOverride;

    for (const mesh of this.importedMeshes) {
      const existing = mesh.material;
      const material = override.enabled
        ? this.createOverrideMaterial(mesh.name)
        : this.cloneMaterialForFade(existing, mesh.name);

      if (!material) {
        continue;
      }

      material.transparencyMode = Material.MATERIAL_ALPHABLEND;
      material.alpha = 1;
      mesh.material = material;
      this.importedMaterials.push(material);
    }
  }

  private cloneMaterialForFade(material: AbstractMesh["material"], meshName: string): Material | null {
    if (material) {
      const clone = material.clone(`${meshName}-fade-material`);

      if (!clone) {
        return this.createFallbackMaterial(meshName);
      }

      if (clone instanceof StandardMaterial) {
        clone.emissiveColor = clone.emissiveColor.add(
          importedPlayerModelConfig.rimHighlight.enabled
            ? themeConfig.colors.cyan.scale(importedPlayerModelConfig.rimHighlight.emissiveStrength)
            : Color3.Black(),
        );
      }

      return clone;
    }

    return this.createFallbackMaterial(meshName);
  }

  private createFallbackMaterial(meshName: string): StandardMaterial {
    const fallback = new StandardMaterial(`${meshName}-imported-material`, this.scene);
    fallback.diffuseColor = new Color3(0.08, 0.1, 0.14);
    fallback.emissiveColor = importedPlayerModelConfig.rimHighlight.enabled
      ? themeConfig.colors.cyan.scale(importedPlayerModelConfig.rimHighlight.emissiveStrength)
      : Color3.Black();
    return fallback;
  }

  private disposeImportedMeshes(): void {
    for (const mesh of this.importedMeshes) {
      mesh.dispose(false, true);
    }

    this.importedMeshes.length = 0;

    for (const material of this.importedMaterials) {
      material.dispose();
    }

    this.importedMaterials.length = 0;
  }

  private createOverrideMaterial(meshName: string): StandardMaterial {
    const material = new StandardMaterial(`${meshName}-darc-override`, this.scene);
    const lowerName = meshName.toLowerCase();

    if (lowerName.includes("visor") || lowerName.includes("eye")) {
      material.diffuseColor = importedPlayerModelConfig.materialOverride.cyan;
      material.emissiveColor = importedPlayerModelConfig.materialOverride.cyan.scale(0.45);
    } else if (lowerName.includes("accent") || lowerName.includes("trim")) {
      material.diffuseColor = importedPlayerModelConfig.materialOverride.green;
      material.emissiveColor = importedPlayerModelConfig.materialOverride.green.scale(0.35);
    } else if (lowerName.includes("corrupt")) {
      material.diffuseColor = importedPlayerModelConfig.materialOverride.purple;
      material.emissiveColor = importedPlayerModelConfig.materialOverride.purple.scale(0.28);
    } else {
      material.diffuseColor = importedPlayerModelConfig.materialOverride.charcoal;
      material.emissiveColor = themeConfig.colors.cyan.scale(0.04);
    }

    material.specularColor = new Color3(0.12, 0.16, 0.22);
    return material;
  }
}
