import {
  ArcRotateCamera,
  Color3,
  DirectionalLight,
  Engine,
  HemisphericLight,
  MeshBuilder,
  Scene,
  SceneLoader,
  StandardMaterial,
  Vector3,
} from "@babylonjs/core";
import "@babylonjs/loaders/glTF";
import { themeConfig } from "../theme/ThemeConfig";

const previewModelPath = "/models/player/obsidianSentinelPlayer.glb";

export type HabitatRunnerPreviewVariant = "habitat" | "class-selection";
export type HabitatRunnerPreviewOptions = Readonly<{
  variant?: HabitatRunnerPreviewVariant;
  modelPaths?: readonly string[];
}>;

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

    const cameraRadius = variant === "class-selection" ? 3.12 : 3.85;
    const cameraTargetY = variant === "class-selection" ? 1.08 : 1.16;
    const targetHeight = variant === "class-selection" ? 1.78 : 1.38;
    const verticalLift = variant === "class-selection" ? 0.14 : 0.32;

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

    const padMaterial = new StandardMaterial("habitat-preview-pad-material", this.scene);
    padMaterial.diffuseColor = new Color3(0.025, 0.042, 0.055);
    padMaterial.emissiveColor = themeConfig.colors.cyan.scale(0.12);
    padMaterial.specularColor = themeConfig.colors.cyan.scale(0.2);
    const pad = MeshBuilder.CreateCylinder("habitat-preview-pad", { diameter: 2.15, height: 0.04, tessellation: 64 }, this.scene);
    pad.position.y = -0.02;
    pad.material = padMaterial;

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
        root.position.subtractInPlace(center.scale(scale));
        root.position.y -= aggregate.min.y * scale;
        root.position.y += verticalLift;
        root.rotationQuaternion = null;
        root.rotation.y = Math.PI * 1.5;
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
