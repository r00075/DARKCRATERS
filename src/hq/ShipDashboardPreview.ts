import {
  AbstractMesh,
  ArcRotateCamera,
  BaseTexture,
  Color3,
  DirectionalLight,
  Engine,
  HemisphericLight,
  Material,
  MeshBuilder,
  PBRMaterial,
  Scene,
  SceneLoader,
  StandardMaterial,
  Vector3,
} from "@babylonjs/core";
import "@babylonjs/loaders/glTF";
import { themeConfig } from "../theme/ThemeConfig";
import {
  nextPreviewId,
  recordPreviewAsyncIgnored,
  recordPreviewContextLost,
  recordPreviewContextRestored,
  recordPreviewCreate,
  recordPreviewDispose,
  recordPreviewUpdateSkipped,
  recordShipAttach,
  recordShipDetach,
  recordShipUpdate,
} from "./PreviewLifecycle";

const kestrelDashboardPath = "/models/ships/kestrel-9-dashboard.glb";
const shipPreviewKey = "kestrel-9-dashboard";

export class ShipDashboardPreview {
  private canvas: HTMLCanvasElement | null = null;
  private engine: Engine | null = null;
  private scene: Scene | null = null;
  private camera: ArcRotateCamera | null = null;
  private host: HTMLElement | null = null;
  private currentModelMeshes: AbstractMesh[] = [];
  private loaded = false;
  private attached = false;
  private disposed = true;
  private contextLost = false;
  private instanceId = 0;
  private loadToken = 0;
  private currentKey: string | null = null;
  private loadingKey: string | null = null;
  private renderLoopRunning = false;
  private renderLoop: (() => void) | null = null;
  private contextLostHandler: ((event: Event) => void) | null = null;
  private contextRestoredHandler: (() => void) | null = null;

  public mount(host: HTMLElement | null): void {
    this.attach(host);
  }

  public attach(host: HTMLElement | null): void {
    if (!host) {
      this.detach("host-missing");
      return;
    }

    this.ensurePreviewSurface();
    if (!this.canvas || !this.engine || !this.scene || !this.camera) {
      return;
    }

    if (this.host !== host) {
      this.canvas.remove();
      host.append(this.canvas);
      this.host = host;
      recordShipAttach(this.instanceId, this.describeHost(host), this.attached ? "host-changed" : "host-attached");
    } else if (!this.canvas.parentElement) {
      host.append(this.canvas);
      recordShipAttach(this.instanceId, this.describeHost(host), "canvas-reattached");
    }

    this.attached = true;
    this.host.classList.remove("model-fallback");
    if (this.loaded && this.currentModelMeshes.length > 0 && !this.contextLost) {
      this.host.classList.add("model-loaded");
    } else {
      this.host.classList.remove("model-loaded");
    }

    this.update(shipPreviewKey);
    this.startRenderLoop();
    this.resize();
  }

  public detach(reason = "screen-exit"): void {
    if (!this.attached && !this.canvas?.parentElement) {
      return;
    }

    this.stopRenderLoop();
    this.host?.classList.remove("model-loaded", "model-fallback");
    this.canvas?.remove();
    this.host = null;
    this.attached = false;
    recordShipDetach(this.instanceId, reason);
  }

  public dispose(): void {
    const instanceId = this.instanceId;
    const hadEngine = this.engine !== null;
    this.disposed = true;
    this.attached = false;
    this.loadToken += 1;
    window.removeEventListener("resize", this.resize);
    if (this.canvas && this.contextLostHandler) {
      this.canvas.removeEventListener("webglcontextlost", this.contextLostHandler);
    }
    if (this.canvas && this.contextRestoredHandler) {
      this.canvas.removeEventListener("webglcontextrestored", this.contextRestoredHandler);
    }
    this.stopRenderLoop();
    this.disposeCurrentModel();
    this.host?.classList.remove("model-loaded", "model-fallback");
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
    this.currentKey = null;
    this.loadingKey = null;
    this.renderLoop = null;
    this.contextLostHandler = null;
    this.contextRestoredHandler = null;
    if (hadEngine) {
      recordPreviewDispose("ship", instanceId);
    }
  }

  public get status(): "loaded" | "fallback" {
    return this.loaded ? "loaded" : "fallback";
  }

  private ensurePreviewSurface(): void {
    if (this.engine && this.scene && this.canvas && this.camera) {
      return;
    }

    this.disposed = false;
    this.contextLost = false;
    this.loaded = false;
    this.instanceId = nextPreviewId();
    this.canvas = document.createElement("canvas");
    this.canvas.className = "ship-dashboard-preview-canvas";
    this.canvas.setAttribute("aria-label", "Kestrel-9 dashboard GLB preview");
    recordPreviewCreate("ship", this.instanceId);

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
      this.stopRenderLoop();
      recordPreviewContextLost("ship");
      this.host?.classList.add("model-fallback");
    };
    this.contextRestoredHandler = (): void => {
      this.contextLost = false;
      recordPreviewContextRestored("ship");
      if (this.attached) {
        this.startRenderLoop();
      }
    };
    this.canvas.addEventListener("webglcontextlost", this.contextLostHandler);
    this.canvas.addEventListener("webglcontextrestored", this.contextRestoredHandler);

    this.camera = new ArcRotateCamera(
      "kestrel-dashboard-camera",
      Math.PI * 1.1,
      Math.PI * 0.43,
      4.6,
      new Vector3(0, 0.18, 0),
      this.scene,
    );
    this.camera.minZ = 0.05;
    this.camera.maxZ = 30;
    this.camera.fov = 0.38;
    this.camera.detachControl();
    this.scene.activeCamera = this.camera;

    const fill = new HemisphericLight("kestrel-dashboard-fill", new Vector3(0.05, 1, 0.2), this.scene);
    fill.diffuse = new Color3(0.5, 0.7, 0.82);
    fill.groundColor = new Color3(0.02, 0.025, 0.035);
    fill.intensity = 0.86;

    const key = new DirectionalLight("kestrel-dashboard-key", new Vector3(-0.45, -0.6, 0.32), this.scene);
    key.diffuse = themeConfig.colors.cyan;
    key.intensity = 1.55;

    const rim = new DirectionalLight("kestrel-dashboard-rim", new Vector3(0.62, -0.28, -0.55), this.scene);
    rim.diffuse = themeConfig.colors.orange;
    rim.intensity = 0.68;

    const padMaterial = new StandardMaterial("kestrel-dashboard-pad-material", this.scene);
    padMaterial.diffuseColor = new Color3(0.02, 0.035, 0.045);
    padMaterial.emissiveColor = themeConfig.colors.cyan.scale(0.08);
    padMaterial.specularColor = themeConfig.colors.cyan.scale(0.16);
    const pad = MeshBuilder.CreateCylinder("kestrel-dashboard-pad", { diameter: 2.8, height: 0.025, tessellation: 72 }, this.scene);
    pad.position.y = -0.04;
    pad.material = padMaterial;

    this.renderLoop = () => {
      if (!this.scene || this.disposed || this.contextLost || !this.attached || this.scene.isDisposed) {
        return;
      }
      this.scene.render();
    };

    window.addEventListener("resize", this.resize);
  }

  private update(key: string): void {
    if (!this.scene) {
      return;
    }

    if (this.currentKey === key && this.loaded && this.currentModelMeshes.length > 0 && !this.contextLost) {
      recordPreviewUpdateSkipped("ship", "same-config");
      return;
    }

    if (this.currentKey === key && this.loadingKey === key && !this.contextLost) {
      recordPreviewUpdateSkipped("ship", "load-pending");
      return;
    }

    recordShipUpdate(this.instanceId, key);
    this.currentKey = key;
    if (this.loaded && this.currentModelMeshes.length > 0) {
      return;
    }

    this.loadModel(key);
  }

  private loadModel(key: string): void {
    const scene = this.scene;
    if (!scene) {
      return;
    }

    const token = this.loadToken + 1;
    this.loadToken = token;
    this.loadingKey = key;
    void SceneLoader.ImportMeshAsync("", "", kestrelDashboardPath, scene)
      .then((result) => {
        const inactiveReason = this.getInactiveReason(scene, token);
        if (inactiveReason) {
          this.disposeImportedMeshes(result.meshes);
          if (this.loadToken === token) {
            this.loadingKey = null;
          }
          recordPreviewAsyncIgnored("ship", inactiveReason);
          return;
        }

        const root = result.meshes[0];
        const meshes = result.meshes.filter((mesh) => mesh.getTotalVertices() > 0);
        if (!root || meshes.length === 0) {
          throw new Error("Kestrel dashboard GLB did not contain renderable meshes.");
        }

        this.neutralizePreviewMaterials(result.meshes);
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
        const scale = 2.35 / largestAxis;
        root.scaling.setAll(scale);
        root.position.subtractInPlace(center.scale(scale));
        root.position.y += 0.1;
        root.rotationQuaternion = null;
        root.rotation.set(-0.04, Math.PI * 1.18, 0);
        this.disposeCurrentModel();
        this.currentModelMeshes = result.meshes;
        this.loaded = true;
        this.currentKey = key;
        this.loadingKey = null;
        this.host?.classList.add("model-loaded");
        this.host?.classList.remove("model-fallback");
      })
      .catch((error) => {
        const inactiveReason = this.getInactiveReason(scene, token);
        if (inactiveReason) {
          if (this.loadToken === token) {
            this.loadingKey = null;
          }
          recordPreviewAsyncIgnored("ship", inactiveReason);
          return;
        }

        console.warn("[ShipDashboardPreview] Kestrel-9 dashboard GLB failed; schematic fallback remains active.", error);
        this.loaded = false;
        this.loadingKey = null;
        this.host?.classList.add("model-fallback");
      });
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

  private disposeCurrentModel(): void {
    this.disposeImportedMeshes(this.currentModelMeshes);
    this.currentModelMeshes = [];
  }

  private disposeImportedMeshes(meshes: readonly AbstractMesh[]): void {
    const materials = new Set<Material>();
    for (const mesh of meshes) {
      if (mesh.material) {
        materials.add(mesh.material);
      }
    }

    for (const mesh of meshes) {
      try {
        if (!mesh.isDisposed()) {
          mesh.dispose(false, false);
        }
      } catch (error) {
        console.warn("[ShipDashboardPreview] Mesh disposal failed; continuing.", error);
      }
    }

    for (const material of materials) {
      this.safeDisposeMaterial(material);
    }
  }

  private safeDisposeMaterial(material: Material | null | undefined): void {
    if (!material) {
      return;
    }

    try {
      const maybeDisposed = material as Material & { isDisposed?: () => boolean };
      if (typeof maybeDisposed.isDisposed === "function" && maybeDisposed.isDisposed()) {
        return;
      }
      if (typeof material.dispose === "function") {
        material.dispose();
      }
    } catch (error) {
      console.warn("[ShipDashboardPreview] Material disposal failed; continuing.", error);
    }
  }

  private safeDisposeTexture(texture: BaseTexture | null | undefined, label: string): void {
    if (!texture) {
      return;
    }

    try {
      const maybeDisposed = texture as BaseTexture & { isDisposed?: () => boolean };
      if (typeof maybeDisposed.isDisposed === "function" && maybeDisposed.isDisposed()) {
        return;
      }
      if (typeof texture.dispose === "function") {
        texture.dispose();
      }
    } catch (error) {
      console.warn(`[ShipDashboardPreview] Texture disposal failed (${label}); continuing.`, error);
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
    return host.className ? `.${String(host.className).trim().replace(/\s+/g, ".")}` : host.tagName.toLowerCase();
  }

  private readonly resize = (): void => {
    this.engine?.resize();
  };
}
