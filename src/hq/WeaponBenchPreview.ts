import {
  AbstractMesh,
  ArcRotateCamera,
  Color3,
  DirectionalLight,
  Engine,
  HemisphericLight,
  Scene,
  SceneLoader,
  Vector3,
} from "@babylonjs/core";
import "@babylonjs/loaders/glTF";
import { themeConfig } from "../theme/ThemeConfig";
import type { WeaponId } from "../weapons/WeaponDefinitions";
import {
  nextPreviewId,
  recordPreviewAsyncIgnored,
  recordPreviewContextLost,
  recordPreviewContextRestored,
  recordPreviewCreate,
  recordPreviewDispose,
} from "./PreviewLifecycle";

export type WeaponPreviewConfig = Readonly<{
  path: string;
  scale?: number;
  yaw?: number;
  pitch?: number;
  roll?: number;
  targetWidth?: number;
  verticalOffset?: number;
  cameraRadius?: number;
  cameraTargetY?: number;
  keyIntensity?: number;
}>;

type DisposableLike = {
  dispose?: () => void;
  isDisposed?: boolean | (() => boolean);
  getActiveTextures?: () => DisposableLike[];
};

const weaponPreviewConfigs: Partial<Record<WeaponId, WeaponPreviewConfig>> = {
  pistol: { path: "/models/weapons/mk3-survey-pistol.glb", yaw: Math.PI * 0.43, pitch: -0.04, roll: -0.03, targetWidth: 1.85, verticalOffset: 0.06, cameraRadius: 3.05 },
  "burst-pistol": { path: "/models/weapons/mk3-survey-pistol-alt.glb", yaw: Math.PI * 0.43, pitch: -0.04, roll: -0.03, targetWidth: 1.85, verticalOffset: 0.06, cameraRadius: 3.05 },
  revolver: { path: "/models/weapons/Flare-Spike-Launcher.glb", yaw: Math.PI * 0.43, pitch: -0.04, roll: -0.02, targetWidth: 1.8, verticalOffset: 0.04, cameraRadius: 3.16 },
  "compact-smg": { path: "/models/weapons/TY-7-Crater-Carbine.glb", yaw: Math.PI * 0.44, pitch: -0.04, roll: -0.02, targetWidth: 2.18, verticalOffset: 0.04, cameraRadius: 3.24 },
  smg: { path: "/models/weapons/TY-7-Crater-Carbine.glb", yaw: Math.PI * 0.44, pitch: -0.04, roll: -0.02, targetWidth: 2.2, verticalOffset: 0.04, cameraRadius: 3.2 },
  shotgun: { path: "/models/weapons/Breach-12-Scattergun.glb", yaw: Math.PI * 0.45, pitch: -0.035, roll: -0.015, targetWidth: 2.28, verticalOffset: 0.02, cameraRadius: 3.34 },
  "assault-rifle": { path: "/models/weapons/PR4-Pulse-Rifle.glb", yaw: Math.PI * 0.44, pitch: -0.035, roll: -0.02, targetWidth: 2.36, verticalOffset: 0.02, cameraRadius: 3.3 },
  rifle: { path: "/models/weapons/Longline-Marksman-Rifle.glb", yaw: Math.PI * 0.45, pitch: -0.03, roll: -0.012, targetWidth: 2.55, verticalOffset: 0.01, cameraRadius: 3.55 },
  knife: { path: "/models/weapons/Industrial-mining-laser.glb", yaw: Math.PI * 0.45, pitch: -0.035, roll: -0.015, targetWidth: 2.05, verticalOffset: 0.02, cameraRadius: 3.22 },
};

export const getWeaponPreviewConfig = (weaponId: WeaponId): WeaponPreviewConfig | null =>
  weaponPreviewConfigs[weaponId] ?? null;

export class WeaponBenchPreview {
  private canvas: HTMLCanvasElement | null = null;
  private engine: Engine | null = null;
  private scene: Scene | null = null;
  private camera: ArcRotateCamera | null = null;
  private host: HTMLElement | null = null;
  private loaded = false;
  private disposed = true;
  private contextLost = false;
  private instanceId = 0;
  private loadToken = 0;
  private currentModelKey: string | null = null;
  private importedMeshes: AbstractMesh[] = [];
  private renderLoop: (() => void) | null = null;
  private contextLostHandler: ((event: Event) => void) | null = null;
  private contextRestoredHandler: (() => void) | null = null;

  public mount(host: HTMLElement | null, weaponId: WeaponId): void {
    if (!host) {
      return;
    }

    const hostMode = this.host === host ? "reused" : this.host ? "reattached" : "new";
    this.host?.classList.remove("model-loaded", "model-fallback", "model-loading");
    this.host = host;
    if (this.canvas && this.canvas.parentElement !== host) {
      host.append(this.canvas);
    }

    if (!this.engine || !this.scene || !this.canvas || this.disposed || this.scene.isDisposed) {
      this.createPreview(host);
    } else {
      this.syncHostClasses();
      this.resize();
    }

    console.info(`[PreviewLifecycle] attach type=weapon id=${this.instanceId} host=${hostMode}`);
    this.updateWeapon(weaponId);
  }

  public dispose(): void {
    const instanceId = this.instanceId;
    const hadEngine = this.engine !== null;
    this.loadToken += 1;
    this.disposed = true;
    window.removeEventListener("resize", this.resize);
    if (this.canvas && this.contextLostHandler) {
      this.canvas.removeEventListener("webglcontextlost", this.contextLostHandler);
    }
    if (this.canvas && this.contextRestoredHandler) {
      this.canvas.removeEventListener("webglcontextrestored", this.contextRestoredHandler);
    }
    this.host?.classList.remove("model-loaded", "model-fallback", "model-loading");
    this.engine?.stopRenderLoop(this.renderLoop ?? undefined);
    this.disposeImportedMeshes(this.importedMeshes, "dispose");
    this.scene?.dispose();
    this.engine?.dispose();
    this.canvas?.remove();
    this.canvas = null;
    this.engine = null;
    this.scene = null;
    this.camera = null;
    this.host = null;
    this.loaded = false;
    this.contextLost = false;
    this.currentModelKey = null;
    this.importedMeshes = [];
    this.renderLoop = null;
    this.contextLostHandler = null;
    this.contextRestoredHandler = null;
    if (hadEngine) {
      recordPreviewDispose("weapon", instanceId);
    }
  }

  public get status(): "loaded" | "fallback" {
    return this.loaded ? "loaded" : "fallback";
  }

  private createPreview(host: HTMLElement): void {
    this.dispose();
    this.host = host;
    this.canvas = document.createElement("canvas");
    this.canvas.className = "weapon-bench-preview-canvas";
    this.canvas.setAttribute("aria-label", "Selected weapon GLB preview");
    host.append(this.canvas);
    this.disposed = false;
    this.contextLost = false;
    const instanceId = nextPreviewId();
    this.instanceId = instanceId;
    recordPreviewCreate("weapon", instanceId);

    this.engine = new Engine(this.canvas, true, {
      antialias: true,
      adaptToDeviceRatio: true,
      preserveDrawingBuffer: false,
      stencil: false,
    });
    this.scene = new Scene(this.engine);
    this.scene.clearColor.set(0, 0, 0, 0);
    const scene = this.scene;
    const engine = this.engine;
    const isCurrent = (): boolean => this.isCurrent(scene, engine, instanceId);

    this.contextLostHandler = (event: Event): void => {
      event.preventDefault();
      this.contextLost = true;
      engine.stopRenderLoop(this.renderLoop ?? undefined);
      recordPreviewContextLost("weapon");
      this.host?.classList.add("model-fallback");
    };
    this.contextRestoredHandler = (): void => {
      this.contextLost = false;
      recordPreviewContextRestored("weapon");
      if (!this.disposed && this.instanceId === instanceId && this.renderLoop) {
        engine.runRenderLoop(this.renderLoop);
      }
    };
    this.canvas.addEventListener("webglcontextlost", this.contextLostHandler);
    this.canvas.addEventListener("webglcontextrestored", this.contextRestoredHandler);

    this.camera = new ArcRotateCamera(
      "weapon-bench-preview-camera",
      Math.PI * 0.5,
      Math.PI * 0.48,
      3.35,
      new Vector3(0, 0.14, 0),
      scene,
    );
    this.camera.minZ = 0.05;
    this.camera.maxZ = 20;
    this.camera.fov = 0.36;
    this.camera.detachControl();
    scene.activeCamera = this.camera;

    const fill = new HemisphericLight("weapon-preview-fill", new Vector3(0, 1, 0.2), scene);
    fill.diffuse = new Color3(0.48, 0.68, 0.82);
    fill.groundColor = new Color3(0.025, 0.03, 0.04);
    fill.intensity = 0.88;

    const key = new DirectionalLight("weapon-preview-key", new Vector3(-0.5, -0.55, 0.35), scene);
    key.diffuse = themeConfig.colors.cyan;
    key.intensity = 1.55;

    const rim = new DirectionalLight("weapon-preview-rim", new Vector3(0.65, -0.25, -0.6), scene);
    rim.diffuse = themeConfig.colors.orange;
    rim.intensity = 0.74;

    this.renderLoop = () => {
      if (!isCurrent()) {
        return;
      }
      scene.render();
    };
    engine.runRenderLoop(this.renderLoop);

    window.addEventListener("resize", this.resize);
    this.resize();
  }

  private updateWeapon(weaponId: WeaponId): void {
    const scene = this.scene;
    const engine = this.engine;
    const config = getWeaponPreviewConfig(weaponId);

    if (!scene || !engine || !config) {
      this.showFallback("invalid-weapon");
      console.info(`[PreviewLifecycle] fallback shown type=weapon reason=invalid-weapon id=${weaponId}`);
      return;
    }

    const modelKey = `${weaponId}:${config.path}`;
    if (this.loaded && this.currentModelKey === modelKey) {
      this.syncHostClasses();
      console.info(`[PreviewLifecycle] update type=weapon id=${this.instanceId} key=${modelKey} reason=unchanged`);
      return;
    }

    const instanceId = this.instanceId;
    const token = this.loadToken + 1;
    this.loadToken = token;
    this.host?.classList.add("model-loading");
    if (this.loaded && this.importedMeshes.length > 0) {
      this.host?.classList.add("model-loaded");
      this.host?.classList.remove("model-fallback");
      console.info("[PreviewLifecycle] fallback retained-hidden type=weapon reason=model-swap-pending");
    } else {
      this.host?.classList.add("model-fallback");
      this.host?.classList.remove("model-loaded");
    }
    console.info(`[PreviewLifecycle] update type=weapon id=${instanceId} key=${modelKey}`);

    this.applyCameraConfig(config);
    void SceneLoader.ImportMeshAsync("", "", config.path, scene)
      .then((result) => {
        if (!this.isCurrent(scene, engine, instanceId) || token !== this.loadToken) {
          this.disposeImportedMeshes(result.meshes, "stale-load");
          recordPreviewAsyncIgnored("weapon", "stale-load");
          return;
        }

        for (const mesh of result.meshes) {
          mesh.setEnabled(false);
        }

        const root = result.meshes[0];
        const meshes = result.meshes.filter((mesh) => mesh.getTotalVertices() > 0);
        if (!root || meshes.length === 0) {
          this.disposeImportedMeshes(result.meshes, "empty-result");
          throw new Error("Weapon GLB did not contain renderable meshes.");
        }

        this.frameImportedModel(root, meshes, config);
        this.disposeImportedMeshes(this.importedMeshes, "replace");
        this.importedMeshes = result.meshes;
        this.currentModelKey = modelKey;
        this.loaded = true;
        for (const mesh of result.meshes) {
          mesh.setEnabled(true);
        }
        this.host?.classList.add("model-loaded");
        this.host?.classList.remove("model-fallback", "model-loading");
        console.info(`[PreviewLifecycle] model replaced type=weapon token=${token} key=${modelKey}`);
      })
      .catch((error) => {
        if (!this.isCurrent(scene, engine, instanceId) || token !== this.loadToken) {
          recordPreviewAsyncIgnored("weapon", "stale-load");
          return;
        }

        console.warn(`[WeaponBenchPreview] weapon preview failed for ${weaponId}; schematic fallback remains active.`, error);
        this.host?.classList.remove("model-loading");
        if (this.loaded && this.importedMeshes.length > 0) {
          this.host?.classList.add("model-loaded");
          this.host?.classList.remove("model-fallback");
          console.info("[PreviewLifecycle] fallback retained-hidden type=weapon reason=model-load-failed-previous-model");
        } else {
          this.showFallback("model-load-failed");
          console.info("[PreviewLifecycle] fallback shown type=weapon reason=model-load-failed");
        }
      });
  }

  private frameImportedModel(root: AbstractMesh, meshes: AbstractMesh[], config: WeaponPreviewConfig): void {
    root.computeWorldMatrix(true);
    const aggregate = meshes.reduce((bounds, mesh) => {
      mesh.computeWorldMatrix(true);
      const bounding = mesh.getBoundingInfo().boundingBox;
      return {
        min: Vector3.Minimize(bounds.min, bounding.minimumWorld),
        max: Vector3.Maximize(bounds.max, bounding.maximumWorld),
      };
    }, {
      min: new Vector3(Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY),
      max: new Vector3(Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY),
    });
    const size = aggregate.max.subtract(aggregate.min);
    const largestAxis = Math.max(0.1, size.x, size.y, size.z);
    const center = aggregate.min.add(size.scale(0.5));
    const scale = (config.targetWidth ?? 1.8) / largestAxis * (config.scale ?? 1);
    root.scaling.setAll(scale);
    root.position.subtractInPlace(center.scale(scale));
    root.rotationQuaternion = null;
    root.rotation.set(config.pitch ?? 0, config.yaw ?? 0, config.roll ?? 0);
    root.position.y += config.verticalOffset ?? 0.02;
  }

  private applyCameraConfig(config: WeaponPreviewConfig): void {
    if (!this.camera) {
      return;
    }
    this.camera.radius = config.cameraRadius ?? 3.35;
    this.camera.target.set(0, config.cameraTargetY ?? 0.14, 0);
  }

  private syncHostClasses(): void {
    if (this.loaded) {
      this.host?.classList.add("model-loaded");
      this.host?.classList.remove("model-fallback");
    } else {
      this.host?.classList.remove("model-loaded");
      this.host?.classList.add("model-fallback");
    }
  }

  private showFallback(reason: string): void {
    this.loaded = false;
    this.currentModelKey = null;
    this.disposeImportedMeshes(this.importedMeshes, reason);
    this.importedMeshes = [];
    this.host?.classList.add("model-fallback");
    this.host?.classList.remove("model-loaded", "model-loading");
  }

  private disposeImportedMeshes(meshes: readonly AbstractMesh[], reason: string): void {
    if (meshes.length === 0) {
      return;
    }

    const materials = new Set<DisposableLike>();
    for (const mesh of meshes) {
      const material = (mesh as AbstractMesh & { material?: DisposableLike | null }).material;
      if (material) {
        materials.add(material);
      }
    }

    for (const material of materials) {
      try {
        const textures = typeof material.getActiveTextures === "function" ? material.getActiveTextures() : [];
        for (const texture of textures) {
          this.disposeResource(texture, "texture", reason);
        }
        this.disposeResource(material, "material", reason);
      } catch (error) {
        console.warn(`[WeaponBenchPreview] material disposal skipped reason=${reason}`, error);
      }
    }

    for (const mesh of meshes) {
      try {
        if (typeof mesh.dispose === "function" && !mesh.isDisposed()) {
          mesh.dispose(false, false);
        }
      } catch (error) {
        console.warn(`[WeaponBenchPreview] mesh disposal skipped reason=${reason}`, error);
      }
    }
  }

  private disposeResource(resource: DisposableLike | null | undefined, kind: "material" | "texture", reason: string): void {
    if (!resource) {
      return;
    }

    try {
      if (typeof resource.isDisposed === "function" && resource.isDisposed()) {
        return;
      }
      if (typeof resource.isDisposed === "boolean" && resource.isDisposed) {
        return;
      }
      if (typeof resource.dispose === "function") {
        resource.dispose();
      }
    } catch (error) {
      console.warn(`[WeaponBenchPreview] ${kind} disposal failed reason=${reason}`, error);
    }
  }

  private isCurrent(scene: Scene, engine: Engine, instanceId: number): boolean {
    return !this.disposed &&
      !this.contextLost &&
      this.instanceId === instanceId &&
      this.scene === scene &&
      this.engine === engine &&
      !scene.isDisposed;
  }

  private readonly resize = (): void => {
    this.engine?.resize();
  };
}
