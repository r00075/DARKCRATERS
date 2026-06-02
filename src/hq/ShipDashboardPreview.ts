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

const kestrelDashboardPath = "/models/ships/kestrel-9-dashboard.glb";

export class ShipDashboardPreview {
  private canvas: HTMLCanvasElement | null = null;
  private engine: Engine | null = null;
  private scene: Scene | null = null;
  private host: HTMLElement | null = null;
  private loaded = false;

  public mount(host: HTMLElement | null): void {
    this.dispose();

    if (!host) {
      return;
    }

    this.host = host;
    this.canvas = document.createElement("canvas");
    this.canvas.className = "ship-dashboard-preview-canvas";
    this.canvas.setAttribute("aria-label", "Kestrel-9 dashboard GLB preview");
    host.append(this.canvas);

    this.engine = new Engine(this.canvas, true, {
      antialias: true,
      adaptToDeviceRatio: true,
      preserveDrawingBuffer: false,
      stencil: false,
    });
    this.scene = new Scene(this.engine);
    this.scene.clearColor.set(0, 0, 0, 0);

    const camera = new ArcRotateCamera(
      "kestrel-dashboard-camera",
      Math.PI * 1.1,
      Math.PI * 0.43,
      4.6,
      new Vector3(0, 0.18, 0),
      this.scene,
    );
    camera.minZ = 0.05;
    camera.maxZ = 30;
    camera.fov = 0.38;
    camera.detachControl();
    this.scene.activeCamera = camera;

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

    void SceneLoader.ImportMeshAsync("", "", kestrelDashboardPath, this.scene)
      .then((result) => {
        if (!this.scene || this.scene.isDisposed) {
          return;
        }
        const root = result.meshes[0];
        const meshes = result.meshes.filter((mesh) => mesh.getTotalVertices() > 0);
        if (!root || meshes.length === 0) {
          throw new Error("Kestrel dashboard GLB did not contain renderable meshes.");
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
        const scale = 2.35 / largestAxis;
        root.scaling.setAll(scale);
        root.position.subtractInPlace(center.scale(scale));
        root.position.y += 0.1;
        root.rotationQuaternion = null;
        root.rotation.set(-0.04, Math.PI * 1.18, 0);
        this.loaded = true;
        this.host?.classList.add("model-loaded");
      })
      .catch((error) => {
        console.warn("[ShipDashboardPreview] Kestrel-9 dashboard GLB failed; schematic fallback remains active.", error);
        this.host?.classList.add("model-fallback");
      });

    this.engine.runRenderLoop(() => {
      this.scene?.render();
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
