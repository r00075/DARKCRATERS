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
import type { ClassId } from "../classes/ClassDefinitions";
import { themeConfig } from "../theme/ThemeConfig";

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
  private host: HTMLElement | null = null;
  private loaded = false;

  public mount(host: HTMLElement | null, options: HabitatRunnerPreviewVariant | HabitatRunnerPreviewOptions = "habitat"): void {
    this.dispose();

    if (!host) {
      return;
    }

    const variant = typeof options === "string" ? options : options.variant ?? "habitat";
    const framingMode = typeof options === "string" ? "fullBody" : options.framingMode ?? "fullBody";
    const tuning = typeof options === "string" || variant !== "class-selection" || !options.classId
      ? {}
      : classPreviewTuning[options.classId] ?? {};
    const modelPaths = [...(typeof options === "string" ? [previewModelPath] : options.modelPaths ?? [previewModelPath])];
    if (!modelPaths.includes(previewModelPath)) {
      modelPaths.push(previewModelPath);
    }

    this.host = host;
    this.canvas = document.createElement("canvas");
    this.canvas.className = `hq-runner-preview-canvas ${variant === "class-selection" ? "class-preview-canvas" : ""}`;
    this.canvas.setAttribute("aria-label", "Obsidian Sentinel runner preview");
    host.append(this.canvas);

    this.engine = new Engine(this.canvas, true, {
      antialias: true,
      adaptToDeviceRatio: true,
      preserveDrawingBuffer: false,
      stencil: false,
    });
    this.scene = new Scene(this.engine);
    this.scene.clearColor.set(0, 0, 0, 0);

    const fullBodyDefaults = variant === "class-selection"
      ? { cameraRadius: 5.4, cameraTargetY: 0.76, targetHeight: 1.46, verticalLift: 0.02 }
      : { cameraRadius: 5.24, cameraTargetY: 0.72, targetHeight: 1.44, verticalLift: 0.02 };
    const upperBodyDefaults = variant === "class-selection"
      ? { cameraRadius: 3.5, cameraTargetY: 1.36, targetHeight: 1.56, verticalLift: 0.48 }
      : { cameraRadius: 3.95, cameraTargetY: 1.34, targetHeight: 1.26, verticalLift: 0.54 };
    const defaults = framingMode === "fullBody" ? fullBodyDefaults : upperBodyDefaults;
    let cameraRadius = typeof options === "string"
      ? defaults.cameraRadius
      : options.cameraRadius ?? tuning.cameraRadius ?? defaults.cameraRadius;
    let cameraTargetY = typeof options === "string"
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

    const camera = new ArcRotateCamera(
      "habitat-runner-preview-camera",
      Math.PI,
      Math.PI * 0.48,
      cameraRadius,
      new Vector3(0, cameraTargetY, 0),
      this.scene,
    );
    camera.minZ = 0.05;
    camera.maxZ = 20;
    camera.fov = 0.44;
    camera.detachControl();
    this.scene.activeCamera = camera;

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

    const loadPreviewModel = (candidateIndex: number): void => {
      const modelPath = modelPaths[candidateIndex] ?? previewModelPath;
      void SceneLoader.ImportMeshAsync("", "", modelPath, this.scene)
      .then((result) => {
        if (!this.scene || this.scene.isDisposed) {
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
        const aggregate = meshes.reduce((bounds, mesh) => {
          const bounding = mesh.getBoundingInfo().boundingBox;
          return {
            min: Vector3.Minimize(bounds.min, bounding.minimumWorld),
            max: Vector3.Maximize(bounds.max, bounding.maximumWorld),
          };
        }, { min: new Vector3(Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY), max: new Vector3(Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY) });
        const size = aggregate.max.subtract(aggregate.min);
        const height = Math.max(0.1, size.y);
        const center = aggregate.min.add(size.scale(0.5));
        const scale = targetHeight / height;
        root.scaling.setAll(scale);
        root.position.set(
          -center.x * scale,
          -aggregate.min.y * scale + verticalLift,
          -center.z * scale,
        );
        root.rotationQuaternion = null;
        root.rotation.y = modelYaw;
        root.computeWorldMatrix(true);
        const transformedBounds = meshes.reduce((bounds, mesh) => {
          mesh.computeWorldMatrix(true);
          const bounding = mesh.getBoundingInfo().boundingBox;
          return {
            min: Vector3.Minimize(bounds.min, bounding.minimumWorld),
            max: Vector3.Maximize(bounds.max, bounding.maximumWorld),
          };
        }, { min: new Vector3(Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY), max: new Vector3(Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY) });
        const transformedSize = transformedBounds.max.subtract(transformedBounds.min);
        const transformedCenter = transformedBounds.min.add(transformedSize.scale(0.5));
        const verticalFitRadius = (transformedSize.y * 0.62) / Math.max(0.1, Math.tan(camera.fov * 0.5));
        cameraRadius = Math.max(cameraRadius, verticalFitRadius * 1.22);
        cameraTargetY = transformedCenter.y + (framingMode === "fullBody" ? 0.02 : 0.16);
        camera.setTarget(new Vector3(transformedCenter.x, cameraTargetY, transformedCenter.z));
        camera.radius = cameraRadius;
        this.loaded = true;
        this.host?.classList.add("model-loaded");
      })
      .catch((error) => {
        if (candidateIndex + 1 < modelPaths.length) {
          loadPreviewModel(candidateIndex + 1);
          return;
        }
        console.warn("[HabitatRunnerPreview] runner preview failed; CSS fallback remains active.", error);
        this.host?.classList.add("model-fallback");
      });
    };
    loadPreviewModel(0);

    this.engine.runRenderLoop(() => {
      if (!this.scene) {
        return;
      }
      this.scene.render();
    });

    window.addEventListener("resize", this.resize);
    this.resize();
  }

  public dispose(): void {
    window.removeEventListener("resize", this.resize);
    this.host?.classList.remove("model-loaded", "model-fallback");
    this.scene?.dispose();
    this.engine?.dispose();
    this.canvas?.remove();
    this.canvas = null;
    this.engine = null;
    this.scene = null;
    this.host = null;
    this.loaded = false;
  }

  public get status(): "loaded" | "fallback" {
    return this.loaded ? "loaded" : "fallback";
  }

  private readonly resize = (): void => {
    this.engine?.resize();
  };
}
