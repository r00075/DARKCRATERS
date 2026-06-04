import {
  AbstractMesh,
  ArcRotateCamera,
  BaseTexture,
  Color3,
  DirectionalLight,
  Engine,
  HemisphericLight,
  Material,
  PBRMaterial,
  Scene,
  SceneLoader,
  Vector3,
} from "@babylonjs/core";
import "@babylonjs/loaders/glTF";
import type { ClassId } from "../classes/ClassDefinitions";
import { themeConfig } from "../theme/ThemeConfig";
import {
  nextPreviewId,
  recordPreviewAsyncIgnored,
  recordPreviewContextLost,
  recordPreviewContextRestored,
  recordPreviewCreate,
  recordPreviewDispose,
  recordRunnerAttach,
  recordRunnerDetach,
  recordRunnerModelLoad,
  recordRunnerModelReplaced,
  recordRunnerRemountSkipped,
  recordRunnerUpdate,
} from "./PreviewLifecycle";

const previewModelPath = "/models/player/obsidianSentinelPlayer.glb";

export type HabitatRunnerPreviewVariant = "habitat" | "class-selection";
export type HabitatRunnerPreviewFraming = "fullBody" | "upperBody";
export type HabitatRunnerPreviewOptions = Readonly<{
  variant?: HabitatRunnerPreviewVariant;
  framingMode?: HabitatRunnerPreviewFraming;
  modelPaths?: readonly string[];
  classId?: ClassId;
  verticalLift?: number;
  targetHeight?: number;
  cameraRadius?: number;
  cameraTargetY?: number;
  yaw?: number;
}>;

type RunnerPreviewRequest = Readonly<{
  host: HTMLElement;
  key: string;
  modelKey: string;
  variant: HabitatRunnerPreviewVariant;
  framingMode: HabitatRunnerPreviewFraming;
  modelPaths: readonly string[];
  cameraRadius: number;
  cameraTargetY: number;
  targetHeight: number;
  verticalLift: number;
  modelYaw: number;
}>;

const classPreviewTuning: Partial<Record<ClassId, Partial<HabitatRunnerPreviewOptions>>> = {
  surveyor: { targetHeight: 1.5, verticalLift: 0.02, yaw: Math.PI * 1.5 },
  salvager: { targetHeight: 1.48, verticalLift: 0.02, yaw: Math.PI * 1.5 },
  security: { targetHeight: 1.42, verticalLift: 0.02, yaw: Math.PI * 1.5 },
  "systems-specialist": { targetHeight: 1.46, verticalLift: 0.02, yaw: Math.PI * 1.5 },
};

export class HabitatRunnerPreview {
  private canvas: HTMLCanvasElement | null = null;
  private engine: Engine | null = null;
  private scene: Scene | null = null;
  private camera: ArcRotateCamera | null = null;
  private host: HTMLElement | null = null;
  private loaded = false;
  private attached = false;
  private disposed = true;
  private contextLost = false;
  private instanceId = 0;
  private loadToken = 0;
  private currentKey: string | null = null;
  private currentModelKey: string | null = null;
  private loadingKey: string | null = null;
  private currentModelMeshes: AbstractMesh[] = [];
  private renderLoopRunning = false;
  private renderLoop: (() => void) | null = null;
  private contextLostHandler: ((event: Event) => void) | null = null;
  private contextRestoredHandler: (() => void) | null = null;

  public mount(host: HTMLElement | null, options: HabitatRunnerPreviewVariant | HabitatRunnerPreviewOptions = "habitat"): void {
    this.attach(host, options);
  }

  public attach(host: HTMLElement | null, options: HabitatRunnerPreviewVariant | HabitatRunnerPreviewOptions = "habitat"): void {
    if (!host) {
      this.detach();
      return;
    }

    const request = this.createRequest(host, options);
    this.ensurePreviewSurface(request.variant);

    if (!this.canvas || !this.engine || !this.scene || !this.camera) {
      return;
    }

    if (this.host !== host) {
      this.canvas.remove();
      host.append(this.canvas);
      this.host = host;
      recordRunnerAttach(this.instanceId, this.describeHost(host), this.attached ? "host-changed" : "host-attached");
    } else if (!this.canvas.parentElement) {
      host.append(this.canvas);
      recordRunnerAttach(this.instanceId, this.describeHost(host), "canvas-reattached");
    }

    this.attached = true;
    this.canvas.className = `hq-runner-preview-canvas ${request.variant === "class-selection" ? "class-preview-canvas" : ""}`;
    this.host.classList.remove("model-fallback");
    if (this.loaded && this.currentModelMeshes.length > 0 && !this.contextLost) {
      this.host.classList.add("model-loaded");
      this.host.classList.remove("model-loading");
    } else {
      this.host.classList.remove("model-loaded");
      this.host.classList.add("model-loading");
    }
    this.update(request);
    this.startRenderLoop();
    this.resize();
  }

  public update(request: RunnerPreviewRequest): void {
    if (!this.scene || !this.camera) {
      return;
    }

    if (this.currentKey === request.key && this.loaded && !this.contextLost) {
      recordRunnerRemountSkipped("same-config");
      return;
    }

    if (this.currentKey === request.key && this.loadingKey === request.key && !this.contextLost) {
      recordRunnerRemountSkipped("load-pending");
      return;
    }

    recordRunnerUpdate(this.instanceId, request.key);
    this.currentKey = request.key;
    this.applyCameraDefaults(request);

    if (this.currentModelKey === request.modelKey && this.currentModelMeshes.length > 0) {
      this.fitCurrentModel(request);
      return;
    }

    this.replaceModel(request, 0);
  }

  public detach(reason = "screen-exit"): void {
    if (!this.attached && !this.canvas?.parentElement) {
      return;
    }

    this.stopRenderLoop();
    this.host?.classList.remove("model-loaded", "model-fallback", "model-loading");
    this.canvas?.remove();
    this.host = null;
    this.attached = false;
    recordRunnerDetach(this.instanceId, reason);
  }

  public dispose(): void {
    const instanceId = this.instanceId;
    const hadEngine = this.engine !== null;
    this.disposed = true;
    this.attached = false;
    this.loadToken += 1;
    this.stopRenderLoop();
    window.removeEventListener("resize", this.resize);
    if (this.canvas && this.contextLostHandler) {
      this.canvas.removeEventListener("webglcontextlost", this.contextLostHandler);
    }
    if (this.canvas && this.contextRestoredHandler) {
      this.canvas.removeEventListener("webglcontextrestored", this.contextRestoredHandler);
    }
    this.disposeCurrentModel();
    this.host?.classList.remove("model-loaded", "model-fallback", "model-loading");
    this.scene?.dispose();
    this.engine?.dispose();
    this.canvas?.remove();
    this.canvas = null;
    this.engine = null;
    this.scene = null;
    this.camera = null;
    this.host = null;
    this.currentKey = null;
    this.currentModelKey = null;
    this.loadingKey = null;
    this.loaded = false;
    this.contextLost = false;
    this.renderLoop = null;
    this.contextLostHandler = null;
    this.contextRestoredHandler = null;
    if (hadEngine) {
      recordPreviewDispose("runner", instanceId);
    }
  }

  public get status(): "loaded" | "fallback" {
    return this.loaded ? "loaded" : "fallback";
  }

  private ensurePreviewSurface(variant: HabitatRunnerPreviewVariant): void {
    if (this.engine && this.scene && this.canvas && this.camera) {
      return;
    }

    this.disposed = false;
    this.contextLost = false;
    this.loaded = false;
    this.instanceId = nextPreviewId();
    this.canvas = document.createElement("canvas");
    this.canvas.className = `hq-runner-preview-canvas ${variant === "class-selection" ? "class-preview-canvas" : ""}`;
    this.canvas.setAttribute("aria-label", "Obsidian Sentinel runner preview");
    recordPreviewCreate("runner", this.instanceId);

    this.engine = new Engine(this.canvas, true, {
      antialias: true,
      adaptToDeviceRatio: true,
      preserveDrawingBuffer: false,
      stencil: false,
    });
    this.scene = new Scene(this.engine);
    this.scene.clearColor.set(0, 0, 0, 0);

    this.contextLostHandler = (event: Event): void => {
      event.preventDefault();
      this.contextLost = true;
      this.loadToken += 1;
      this.stopRenderLoop();
      recordPreviewContextLost("runner");
      this.host?.classList.remove("model-loaded", "model-loading");
      this.host?.classList.add("model-fallback");
    };
    this.contextRestoredHandler = (): void => {
      this.contextLost = false;
      recordPreviewContextRestored("runner");
      this.host?.classList.remove("model-loaded", "model-loading");
      this.host?.classList.add("model-fallback");
    };
    this.canvas.addEventListener("webglcontextlost", this.contextLostHandler);
    this.canvas.addEventListener("webglcontextrestored", this.contextRestoredHandler);

    this.camera = new ArcRotateCamera(
      "habitat-runner-preview-camera",
      Math.PI,
      Math.PI * 0.48,
      5.25,
      new Vector3(0, 0.72, 0),
      this.scene,
    );
    this.camera.minZ = 0.05;
    this.camera.maxZ = 20;
    this.camera.fov = 0.44;
    this.camera.detachControl();
    this.scene.activeCamera = this.camera;

    const fill = new HemisphericLight("habitat-preview-fill", new Vector3(0.15, 1, 0.2), this.scene);
    fill.diffuse = new Color3(0.55, 0.72, 0.82);
    fill.groundColor = new Color3(0.02, 0.025, 0.035);
    fill.intensity = 0.9;

    const key = new DirectionalLight("habitat-preview-key", new Vector3(-0.45, -0.62, 0.35), this.scene);
    key.diffuse = themeConfig.colors.cyan;
    key.intensity = 1.7;

    const rim = new DirectionalLight("habitat-preview-rim", new Vector3(0.55, -0.2, -0.55), this.scene);
    rim.diffuse = themeConfig.colors.orange;
    rim.intensity = 0.7;

    this.renderLoop = () => {
      if (!this.scene || this.disposed || this.contextLost || !this.attached || this.scene.isDisposed) {
        return;
      }
      this.scene.render();
    };
    window.addEventListener("resize", this.resize);
  }

  private replaceModel(
    request: RunnerPreviewRequest,
    candidateIndex: number,
    token = this.loadToken + 1,
    hadVisibleModel = this.loaded && this.currentModelMeshes.length > 0,
  ): void {
    const scene = this.scene;
    if (candidateIndex === 0) {
      this.loadToken = token;
      this.loadingKey = request.key;
      if (hadVisibleModel) {
        this.retainFallbackHidden("model-swap-pending");
      } else {
        this.loaded = false;
        this.disposeCurrentModel();
        this.hideFallback("model-load-started");
      }
    }

    if (!scene) {
      return;
    }

    const modelPath = request.modelPaths[candidateIndex] ?? previewModelPath;
    recordRunnerModelLoad(token);
    void SceneLoader.ImportMeshAsync("", "", modelPath, scene)
      .then((result) => {
        const inactiveReason = this.getInactiveReason(scene, token);
        if (inactiveReason) {
          this.disposeImportedMeshes(result.meshes);
          if (this.loadToken === token) {
            this.loadingKey = null;
          }
          recordPreviewAsyncIgnored("runner", inactiveReason);
          return;
        }

        const root = result.meshes[0];
        if (!root) {
          throw new Error("No meshes returned from preview GLB.");
        }

        const meshes = result.meshes.filter((mesh) => mesh.getTotalVertices() > 0);
        if (meshes.length === 0) {
          throw new Error("Preview GLB did not contain renderable meshes.");
        }

        this.neutralizePreviewMaterials(result.meshes);
        const previousMeshes = [...this.currentModelMeshes];
        this.currentModelMeshes = [...result.meshes];
        this.fitModelToPreview(root, meshes, request);
        this.loaded = true;
        this.currentModelKey = request.modelKey;
        this.loadingKey = null;
        this.hideFallback("model-loaded");
        this.disposeImportedMeshes(previousMeshes);
        recordRunnerModelReplaced(token);
      })
      .catch((error) => {
        const inactiveReason = this.getInactiveReason(scene, token);
        if (inactiveReason) {
          if (this.loadToken === token) {
            this.loadingKey = null;
          }
          recordPreviewAsyncIgnored("runner", inactiveReason);
          return;
        }

        if (candidateIndex + 1 < request.modelPaths.length) {
          this.replaceModel(request, candidateIndex + 1, token, hadVisibleModel);
          return;
        }

        if (hadVisibleModel && this.currentModelMeshes.length > 0) {
          this.loaded = true;
          this.currentKey = null;
          this.loadingKey = null;
          this.retainFallbackHidden("model-swap-pending");
          console.warn("[HabitatRunnerPreview] runner preview swap failed; retaining previous model.", error);
          return;
        }

        this.loaded = false;
        this.loadingKey = null;
        console.warn("[HabitatRunnerPreview] runner preview failed; CSS fallback remains active.", error);
        this.showFallback("model-load-failed");
      });
  }

  private fitCurrentModel(request: RunnerPreviewRequest): void {
    const root = this.currentModelMeshes[0];
    const meshes = this.currentModelMeshes.filter((mesh) => mesh.getTotalVertices() > 0);
    if (!root || meshes.length === 0) {
      return;
    }
    this.fitModelToPreview(root, meshes, request);
  }

  private fitModelToPreview(
    root: AbstractMesh,
    meshes: readonly AbstractMesh[],
    request: RunnerPreviewRequest,
  ): void {
    if (!this.camera) {
      return;
    }

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
    const height = Math.max(0.1, size.y);
    const center = aggregate.min.add(size.scale(0.5));
    const scale = request.targetHeight / height;
    root.scaling.setAll(scale);
    root.position.set(
      -center.x * scale,
      -aggregate.min.y * scale + request.verticalLift,
      -center.z * scale,
    );
    root.rotationQuaternion = null;
    root.rotation.y = request.modelYaw;
    root.computeWorldMatrix(true);

    const transformedBounds = meshes.reduce((bounds, mesh) => {
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
    const transformedSize = transformedBounds.max.subtract(transformedBounds.min);
    const transformedCenter = transformedBounds.min.add(transformedSize.scale(0.5));
    const verticalFitRadius = (transformedSize.y * 0.62) / Math.max(0.1, Math.tan(this.camera.fov * 0.5));
    const cameraRadius = Math.max(request.cameraRadius, verticalFitRadius * 1.22);
    const cameraTargetY = transformedCenter.y + (request.framingMode === "fullBody" ? 0.02 : 0.16);
    this.camera.setTarget(new Vector3(transformedCenter.x, cameraTargetY, transformedCenter.z));
    this.camera.radius = cameraRadius;
  }

  private applyCameraDefaults(request: RunnerPreviewRequest): void {
    if (!this.camera) {
      return;
    }
    this.camera.radius = request.cameraRadius;
    this.camera.setTarget(new Vector3(0, request.cameraTargetY, 0));
  }

  private neutralizePreviewMaterials(meshes: readonly AbstractMesh[]): void {
    const materials = new Set<Material>();
    for (const mesh of meshes) {
      if (mesh.material) {
        materials.add(mesh.material);
      }
    }

    for (const material of materials) {
      const maybeReflective = material as Material & {
        reflectionTexture?: BaseTexture | null;
        environmentIntensity?: number;
      };
      if (maybeReflective.reflectionTexture) {
        this.safeDisposeTexture(maybeReflective.reflectionTexture, "reflectionTexture");
        maybeReflective.reflectionTexture = null;
      }
      if (material instanceof PBRMaterial) {
        material.environmentIntensity = 0;
        material.disableLighting = false;
      } else if (typeof maybeReflective.environmentIntensity === "number") {
        maybeReflective.environmentIntensity = 0;
      }
    }
  }

  private createRequest(
    host: HTMLElement,
    options: HabitatRunnerPreviewVariant | HabitatRunnerPreviewOptions,
  ): RunnerPreviewRequest {
    const variant = typeof options === "string" ? options : options.variant ?? "habitat";
    const framingMode = typeof options === "string" ? "fullBody" : options.framingMode ?? "fullBody";
    const tuning = typeof options === "string" || variant !== "class-selection" || !options.classId
      ? {}
      : classPreviewTuning[options.classId] ?? {};
    const modelPaths = [...(typeof options === "string" ? [previewModelPath] : options.modelPaths ?? [previewModelPath])];
    if (!modelPaths.includes(previewModelPath)) {
      modelPaths.push(previewModelPath);
    }

    const fullBodyDefaults = variant === "class-selection"
      ? { cameraRadius: 5.4, cameraTargetY: 0.76, targetHeight: 1.46, verticalLift: 0.02 }
      : { cameraRadius: 5.24, cameraTargetY: 0.72, targetHeight: 1.44, verticalLift: 0.02 };
    const upperBodyDefaults = variant === "class-selection"
      ? { cameraRadius: 3.5, cameraTargetY: 1.36, targetHeight: 1.56, verticalLift: 0.48 }
      : { cameraRadius: 3.95, cameraTargetY: 1.34, targetHeight: 1.26, verticalLift: 0.54 };
    const defaults = framingMode === "fullBody" ? fullBodyDefaults : upperBodyDefaults;
    const cameraRadius = typeof options === "string"
      ? defaults.cameraRadius
      : options.cameraRadius ?? tuning.cameraRadius ?? defaults.cameraRadius;
    const cameraTargetY = typeof options === "string"
      ? defaults.cameraTargetY
      : options.cameraTargetY ?? tuning.cameraTargetY ?? defaults.cameraTargetY;
    const targetHeight = typeof options === "string"
      ? defaults.targetHeight
      : options.targetHeight ?? tuning.targetHeight ?? defaults.targetHeight;
    const verticalLift = typeof options === "string"
      ? defaults.verticalLift
      : options.verticalLift ?? tuning.verticalLift ?? defaults.verticalLift;
    const modelYaw = typeof options === "string"
      ? Math.PI * 1.5
      : options.yaw ?? tuning.yaw ?? Math.PI * 1.5;
    const modelKey = modelPaths.join(",");
    const key = [
      variant,
      framingMode,
      typeof options === "string" ? "none" : options.classId ?? "none",
      modelKey,
      cameraRadius.toFixed(3),
      cameraTargetY.toFixed(3),
      targetHeight.toFixed(3),
      verticalLift.toFixed(3),
      modelYaw.toFixed(3),
    ].join("|");

    return {
      host,
      key,
      modelKey,
      variant,
      framingMode,
      modelPaths,
      cameraRadius,
      cameraTargetY,
      targetHeight,
      verticalLift,
      modelYaw,
    };
  }

  private getInactiveReason(scene: Scene, token: number): "disposed" | "stale-token" | "context-lost" | "host-disconnected" | null {
    if (this.disposed || this.scene !== scene || scene.isDisposed) {
      return "disposed";
    }

    if (this.contextLost) {
      return "context-lost";
    }

    if (this.loadToken !== token) {
      return "stale-token";
    }

    if (!this.host?.isConnected || !this.attached) {
      return "host-disconnected";
    }

    return null;
  }

  private disposeCurrentModel(): void {
    this.disposeImportedMeshes(this.currentModelMeshes);
    this.currentModelMeshes = [];
    this.currentModelKey = null;
  }

  private hideFallback(reason: "model-loaded" | "model-load-started"): void {
    this.host?.classList.remove("model-fallback");
    if (this.loaded && this.currentModelMeshes.length > 0 && !this.contextLost) {
      this.host?.classList.add("model-loaded");
      this.host?.classList.remove("model-loading");
    } else {
      this.host?.classList.remove("model-loaded");
      this.host?.classList.add("model-loading");
    }
    console.info(`[PreviewLifecycle] fallback hidden type=runner reason=${reason}`);
  }

  private retainFallbackHidden(reason: "model-swap-pending"): void {
    this.host?.classList.remove("model-fallback", "model-loading");
    if (this.currentModelMeshes.length > 0 && !this.contextLost) {
      this.host?.classList.add("model-loaded");
    }
    console.info(`[PreviewLifecycle] fallback retained-hidden type=runner reason=${reason}`);
  }

  private showFallback(reason: "model-load-failed"): void {
    this.host?.classList.remove("model-loaded", "model-loading");
    this.host?.classList.add("model-fallback");
    console.info(`[PreviewLifecycle] fallback shown type=runner reason=${reason}`);
  }

  private disposeImportedMeshes(meshes: readonly AbstractMesh[]): void {
    const materials = new Set<Material>();
    for (const mesh of meshes) {
      if (mesh?.material) {
        materials.add(mesh.material);
      }
      this.safeDisposeMesh(mesh);
      if (mesh) {
        mesh.material = null;
      }
    }
    for (const material of materials) {
      this.safeDisposeMaterial(material);
    }
  }

  private safeDisposeMesh(mesh: AbstractMesh | null | undefined): void {
    if (!mesh || typeof mesh.dispose !== "function") {
      return;
    }

    const maybeDisposable = mesh as AbstractMesh & { isDisposed?: () => boolean };
    try {
      if (typeof maybeDisposable.isDisposed === "function" && maybeDisposable.isDisposed()) {
        return;
      }
      mesh.dispose(false, true);
    } catch (error) {
      console.warn("[HabitatRunnerPreview] mesh disposal skipped after error.", error);
    }
  }

  private safeDisposeMaterial(material: Material | null | undefined): void {
    if (!material || typeof material.dispose !== "function") {
      return;
    }

    const maybeDisposable = material as Material & { isDisposed?: () => boolean };
    try {
      if (typeof maybeDisposable.isDisposed === "function" && maybeDisposable.isDisposed()) {
        return;
      }
      material.dispose(true, true);
    } catch (error) {
      console.warn("[HabitatRunnerPreview] material disposal skipped after error.", error);
    }
  }

  private safeDisposeTexture(texture: BaseTexture | null | undefined, label: string): void {
    if (!texture || typeof texture.dispose !== "function") {
      return;
    }

    const maybeDisposable = texture as BaseTexture & { isDisposed?: () => boolean };
    try {
      if (typeof maybeDisposable.isDisposed === "function" && maybeDisposable.isDisposed()) {
        return;
      }
      texture.dispose();
    } catch (error) {
      console.warn(`[HabitatRunnerPreview] ${label} disposal skipped after error.`, error);
    }
  }

  private startRenderLoop(): void {
    if (!this.engine || !this.renderLoop || this.renderLoopRunning || this.contextLost) {
      return;
    }

    this.engine.runRenderLoop(this.renderLoop);
    this.renderLoopRunning = true;
  }

  private stopRenderLoop(): void {
    if (!this.engine || !this.renderLoop || !this.renderLoopRunning) {
      return;
    }

    this.engine.stopRenderLoop(this.renderLoop);
    this.renderLoopRunning = false;
  }

  private describeHost(host: HTMLElement): string {
    return host.className.toString().trim().replace(/\s+/g, ".") || host.tagName.toLowerCase();
  }

  private readonly resize = (): void => {
    this.engine?.resize();
  };
}
