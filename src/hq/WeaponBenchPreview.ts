import {
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
  private host: HTMLElement | null = null;
  private loaded = false;
  private disposed = true;
  private contextLost = false;
  private instanceId = 0;
  private renderLoop: (() => void) | null = null;
  private contextLostHandler: ((event: Event) => void) | null = null;
  private contextRestoredHandler: (() => void) | null = null;

  public mount(host: HTMLElement | null, weaponId: WeaponId): void {
    this.dispose();

    if (!host) {
      return;
    }

    const config = getWeaponPreviewConfig(weaponId);
    if (!config) {
      host.classList.add("model-fallback");
      return;
    }

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
    const isCurrent = (): boolean =>
      !this.disposed &&
      !this.contextLost &&
      this.instanceId === instanceId &&
      this.scene === scene &&
      this.engine === engine &&
      !scene.isDisposed;
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

    const camera = new ArcRotateCamera(
      "weapon-bench-preview-camera",
      Math.PI * 0.5,
      Math.PI * 0.48,
      config.cameraRadius ?? 3.35,
      new Vector3(0, config.cameraTargetY ?? 0.14, 0),
      this.scene,
    );
    camera.minZ = 0.05;
    camera.maxZ = 20;
    camera.fov = 0.36;
    camera.detachControl();
    this.scene.activeCamera = camera;

    const fill = new HemisphericLight("weapon-preview-fill", new Vector3(0, 1, 0.2), this.scene);
    fill.diffuse = new Color3(0.48, 0.68, 0.82);
    fill.groundColor = new Color3(0.025, 0.03, 0.04);
    fill.intensity = 0.88;

    const key = new DirectionalLight("weapon-preview-key", new Vector3(-0.5, -0.55, 0.35), this.scene);
    key.diffuse = themeConfig.colors.cyan;
    key.intensity = config.keyIntensity ?? 1.55;

    const rim = new DirectionalLight("weapon-preview-rim", new Vector3(0.65, -0.25, -0.6), this.scene);
    rim.diffuse = themeConfig.colors.orange;
    rim.intensity = 0.74;

    void SceneLoader.ImportMeshAsync("", "", config.path, scene)
      .then((result) => {
        if (!isCurrent()) {
          recordPreviewAsyncIgnored("weapon", "disposed");
          return;
        }
        const root = result.meshes[0];
        const meshes = result.meshes.filter((mesh) => mesh.getTotalVertices() > 0);
        if (!root || meshes.length === 0) {
          throw new Error("Weapon GLB did not contain renderable meshes.");
        }
        const aggregate = meshes.reduce((bounds, mesh) => {
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
        this.loaded = true;
        this.host?.classList.add("model-loaded");
      })
      .catch((error) => {
        if (!isCurrent()) {
          recordPreviewAsyncIgnored("weapon", "disposed");
          return;
        }
        console.warn(`[WeaponBenchPreview] weapon preview failed for ${weaponId}; schematic fallback remains active.`, error);
        this.host?.classList.add("model-fallback");
      });

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

  public dispose(): void {
    const instanceId = this.instanceId;
    const hadEngine = this.engine !== null;
    this.disposed = true;
    window.removeEventListener("resize", this.resize);
    if (this.canvas && this.contextLostHandler) {
      this.canvas.removeEventListener("webglcontextlost", this.contextLostHandler);
    }
    if (this.canvas && this.contextRestoredHandler) {
      this.canvas.removeEventListener("webglcontextrestored", this.contextRestoredHandler);
    }
    this.host?.classList.remove("model-loaded", "model-fallback");
    this.engine?.stopRenderLoop(this.renderLoop ?? undefined);
    this.scene?.dispose();
    this.engine?.dispose();
    this.canvas?.remove();
    this.canvas = null;
    this.engine = null;
    this.scene = null;
    this.host = null;
    this.loaded = false;
    this.contextLost = false;
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

  private readonly resize = (): void => {
    this.engine?.resize();
  };
}
