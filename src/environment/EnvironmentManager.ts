import {
  Color3,
  DirectionalLight,
  HemisphericLight,
  MeshBuilder,
  Scene,
  StandardMaterial,
  Vector3,
  type AbstractMesh,
} from "@babylonjs/core";
import { themeConfig } from "../theme/ThemeConfig";

export type TimeOfDayPreset = "morning" | "afternoon" | "dusk" | "night";
export type WeatherPreset = "clear" | "fog" | "rain" | "storm";
export type RaidConditionPreset = "surface-day" | "surface-eclipse" | "crater-night" | "mining-tunnel" | "alien-nest";

export type EnvironmentGameplayModifiers = Readonly<{
  enemyVisionMultiplier: number;
  rareLootChanceMultiplier: number;
  alertPropagationMultiplier: number;
  flashlightDetectionMultiplier: number;
}>;

export type EnvironmentState = Readonly<{
  timeOfDay: TimeOfDayPreset;
  weather: WeatherPreset;
  condition: RaidConditionPreset;
  label: string;
  visibilityLabel: string;
  flashlightUsefulness: "low" | "medium" | "high" | "critical";
  darkness: number;
  gameplay: EnvironmentGameplayModifiers;
}>;

type EnvironmentVisualPreset = Readonly<{
  sky: Color3;
  light: Color3;
  ground: Color3;
  intensity: number;
  sunIntensity: number;
  sunDirection: Vector3;
  fogColor: Color3;
  fogDensity: number;
}>;

const timePresets: Record<TimeOfDayPreset, EnvironmentVisualPreset> = {
  morning: {
    sky: new Color3(0.055, 0.075, 0.11),
    light: new Color3(0.68, 0.78, 0.92),
    ground: new Color3(0.08, 0.1, 0.13),
    intensity: 0.74,
    sunIntensity: 0.72,
    sunDirection: new Vector3(-0.35, -0.82, 0.28),
    fogColor: new Color3(0.08, 0.11, 0.15),
    fogDensity: 0.004,
  },
  afternoon: {
    sky: themeConfig.colors.sky,
    light: new Color3(0.62, 0.75, 0.95),
    ground: new Color3(0.055, 0.07, 0.09),
    intensity: 0.7,
    sunIntensity: 0.76,
    sunDirection: new Vector3(-0.2, -0.95, 0.12),
    fogColor: new Color3(0.045, 0.06, 0.09),
    fogDensity: 0.003,
  },
  dusk: {
    sky: new Color3(0.04, 0.035, 0.085),
    light: new Color3(0.58, 0.48, 0.9),
    ground: new Color3(0.055, 0.05, 0.085),
    intensity: 0.6,
    sunIntensity: 0.54,
    sunDirection: new Vector3(-0.55, -0.35, 0.34),
    fogColor: new Color3(0.055, 0.045, 0.1),
    fogDensity: 0.009,
  },
  night: {
    sky: new Color3(0.012, 0.016, 0.026),
    light: new Color3(0.2, 0.42, 0.78),
    ground: new Color3(0.025, 0.035, 0.055),
    intensity: 0.44,
    sunIntensity: 0.28,
    sunDirection: new Vector3(0.32, -0.48, -0.18),
    fogColor: new Color3(0.018, 0.025, 0.045),
    fogDensity: 0.014,
  },
};

const weatherModifiers: Record<WeatherPreset, EnvironmentGameplayModifiers & { fogBoost: number; rain: number }> = {
  clear: {
    enemyVisionMultiplier: 1,
    rareLootChanceMultiplier: 1,
    alertPropagationMultiplier: 1,
    flashlightDetectionMultiplier: 1.08,
    fogBoost: 0,
    rain: 0,
  },
  fog: {
    enemyVisionMultiplier: 0.68,
    rareLootChanceMultiplier: 1.08,
    alertPropagationMultiplier: 0.82,
    flashlightDetectionMultiplier: 1.2,
    fogBoost: 0.018,
    rain: 0,
  },
  rain: {
    enemyVisionMultiplier: 0.82,
    rareLootChanceMultiplier: 1.06,
    alertPropagationMultiplier: 0.88,
    flashlightDetectionMultiplier: 1.16,
    fogBoost: 0.006,
    rain: 0.65,
  },
  storm: {
    enemyVisionMultiplier: 0.58,
    rareLootChanceMultiplier: 1.14,
    alertPropagationMultiplier: 0.72,
    flashlightDetectionMultiplier: 1.28,
    fogBoost: 0.014,
    rain: 1,
  },
};

const defaultState: EnvironmentState = {
  timeOfDay: "afternoon",
  weather: "clear",
  condition: "surface-day",
  label: "Surface Day",
  visibilityLabel: "Good visibility",
  flashlightUsefulness: "low",
  darkness: 0.18,
  gameplay: {
    enemyVisionMultiplier: 1,
    rareLootChanceMultiplier: 1,
    alertPropagationMultiplier: 1,
    flashlightDetectionMultiplier: 1.08,
  },
};

const conditionPresets: Record<RaidConditionPreset, Readonly<{
  label: string;
  time: TimeOfDayPreset;
  weather: WeatherPreset;
  ambientMultiplier: number;
  sunMultiplier: number;
  fogBoost: number;
  enemyVisionMultiplier: number;
  rareLootChanceMultiplier: number;
  alertPropagationMultiplier: number;
  flashlightDetectionMultiplier: number;
  flashlightUsefulness: EnvironmentState["flashlightUsefulness"];
  darkness: number;
  visibilityLabel: string;
}>> = {
  "surface-day": {
    label: "Surface Day",
    time: "afternoon",
    weather: "clear",
    ambientMultiplier: 1.04,
    sunMultiplier: 1.06,
    fogBoost: 0,
    enemyVisionMultiplier: 1,
    rareLootChanceMultiplier: 1,
    alertPropagationMultiplier: 1,
    flashlightDetectionMultiplier: 1.08,
    flashlightUsefulness: "low",
    darkness: 0.16,
    visibilityLabel: "Readable lunar surface",
  },
  "surface-eclipse": {
    label: "Surface Eclipse",
    time: "dusk",
    weather: "fog",
    ambientMultiplier: 0.72,
    sunMultiplier: 0.46,
    fogBoost: 0.006,
    enemyVisionMultiplier: 0.82,
    rareLootChanceMultiplier: 1.08,
    alertPropagationMultiplier: 0.92,
    flashlightDetectionMultiplier: 1.3,
    flashlightUsefulness: "medium",
    darkness: 0.46,
    visibilityLabel: "Eclipse shadow bands",
  },
  "crater-night": {
    label: "Crater Night",
    time: "night",
    weather: "clear",
    ambientMultiplier: 0.56,
    sunMultiplier: 0.34,
    fogBoost: 0.004,
    enemyVisionMultiplier: 0.68,
    rareLootChanceMultiplier: 1.15,
    alertPropagationMultiplier: 0.86,
    flashlightDetectionMultiplier: 1.45,
    flashlightUsefulness: "high",
    darkness: 0.68,
    visibilityLabel: "Deep crater darkness",
  },
  "mining-tunnel": {
    label: "Mining Tunnel",
    time: "night",
    weather: "fog",
    ambientMultiplier: 0.42,
    sunMultiplier: 0.2,
    fogBoost: 0.016,
    enemyVisionMultiplier: 0.56,
    rareLootChanceMultiplier: 1.24,
    alertPropagationMultiplier: 0.78,
    flashlightDetectionMultiplier: 1.62,
    flashlightUsefulness: "critical",
    darkness: 0.82,
    visibilityLabel: "Tunnel dark - flashlight advised",
  },
  "alien-nest": {
    label: "Alien Nest",
    time: "night",
    weather: "storm",
    ambientMultiplier: 0.36,
    sunMultiplier: 0.16,
    fogBoost: 0.02,
    enemyVisionMultiplier: 0.62,
    rareLootChanceMultiplier: 1.38,
    alertPropagationMultiplier: 0.7,
    flashlightDetectionMultiplier: 1.82,
    flashlightUsefulness: "critical",
    darkness: 0.9,
    visibilityLabel: "Umbra biolumen and black fog",
  },
};

export class EnvironmentManager {
  private readonly sunLight: DirectionalLight;
  private readonly rainMaterial: StandardMaterial;
  private readonly rainDrops: AbstractMesh[] = [];
  private currentState: EnvironmentState = defaultState;
  private baseSky = timePresets.afternoon.sky.clone();
  private baseAmbientIntensity = timePresets.afternoon.intensity;
  private baseSunIntensity = timePresets.afternoon.sunIntensity;
  private lightningTimer = 0;
  private nextLightningDelay = 6;

  public constructor(
    private readonly scene: Scene,
    private readonly skyLight: HemisphericLight,
  ) {
    this.sunLight = new DirectionalLight("environment-directional-light", timePresets.afternoon.sunDirection, scene);
    this.sunLight.diffuse = timePresets.afternoon.light;
    this.sunLight.specular = new Color3(0.42, 0.58, 0.72);
    this.sunLight.intensity = timePresets.afternoon.sunIntensity;

    this.rainMaterial = new StandardMaterial("weather-rain-material", scene);
    this.rainMaterial.diffuseColor = new Color3(0.55, 0.7, 0.86);
    this.rainMaterial.emissiveColor = themeConfig.colors.cyan.scale(0.24);
    this.rainMaterial.alpha = 0.42;

    for (let i = 0; i < 72; i += 1) {
      const drop = MeshBuilder.CreateBox(`rain-drop-${i}`, { width: 0.025, height: 1.1, depth: 0.025 }, scene);
      drop.material = this.rainMaterial;
      drop.isVisible = false;
      this.randomizeRainDrop(drop);
      this.rainDrops.push(drop);
    }

    this.applyEnvironment("afternoon", "clear");
  }

  public get state(): EnvironmentState {
    return this.currentState;
  }

  public randomizeForRaid(raidTier = 2): EnvironmentState {
    const condition = this.pickWeighted<RaidConditionPreset>([
      ["surface-day", raidTier <= 2 ? 0.28 : 0.08],
      ["surface-eclipse", raidTier <= 3 ? 0.26 : 0.18],
      ["crater-night", 0.24 + raidTier * 0.03],
      ["mining-tunnel", raidTier >= 2 ? 0.18 + raidTier * 0.035 : 0.08],
      ["alien-nest", raidTier >= 4 ? 0.22 : raidTier >= 3 ? 0.1 : 0.02],
    ]);

    return this.applyCondition(condition);
  }

  public update(dt: number, playerPosition: Vector3): void {
    const rainAmount = weatherModifiers[this.currentState.weather].rain;

    for (const drop of this.rainDrops) {
      drop.isVisible = rainAmount > 0;

      if (!drop.isVisible) {
        continue;
      }

      drop.position.y -= (28 + rainAmount * 18) * dt;
      drop.position.x -= rainAmount * 5 * dt;

      if (drop.position.y < 0.4) {
        this.randomizeRainDrop(drop, playerPosition);
      }
    }

    this.updateLightning(dt);
  }

  public dispose(): void {
    for (const drop of this.rainDrops) {
      drop.dispose();
    }

    this.sunLight.dispose();
  }

  private applyCondition(condition: RaidConditionPreset): EnvironmentState {
    const preset = conditionPresets[condition];
    const base = this.applyEnvironment(preset.time, preset.weather, condition);

    this.baseAmbientIntensity *= preset.ambientMultiplier;
    this.baseSunIntensity *= preset.sunMultiplier;
    this.skyLight.intensity = this.baseAmbientIntensity;
    this.sunLight.intensity = this.baseSunIntensity;
    this.scene.fogDensity += preset.fogBoost;

    const alienGlow = condition === "alien-nest" ? themeConfig.colors.rootGreen.scale(0.08) : Color3.Black();
    this.scene.ambientColor = this.scene.ambientColor.add(alienGlow);

    this.currentState = {
      ...base,
      condition,
      label: preset.label,
      visibilityLabel: preset.visibilityLabel,
      flashlightUsefulness: preset.flashlightUsefulness,
      darkness: preset.darkness,
      gameplay: {
        enemyVisionMultiplier: base.gameplay.enemyVisionMultiplier * preset.enemyVisionMultiplier,
        rareLootChanceMultiplier: base.gameplay.rareLootChanceMultiplier * preset.rareLootChanceMultiplier,
        alertPropagationMultiplier: base.gameplay.alertPropagationMultiplier * preset.alertPropagationMultiplier,
        flashlightDetectionMultiplier: preset.flashlightDetectionMultiplier,
      },
    };

    return this.currentState;
  }

  private applyEnvironment(timeOfDay: TimeOfDayPreset, weather: WeatherPreset, condition: RaidConditionPreset = "surface-day"): EnvironmentState {
    const time = timePresets[timeOfDay];
    const weatherTuning = weatherModifiers[weather];
    const nightVisionPenalty = timeOfDay === "night" ? 0.72 : timeOfDay === "dusk" ? 0.86 : 1;
    const nightLootBonus = timeOfDay === "night" ? 1.08 : timeOfDay === "dusk" ? 1.04 : 1;

    this.scene.clearColor.set(time.sky.r, time.sky.g, time.sky.b, 1);
    this.baseSky = time.sky.clone();
    this.scene.ambientColor = time.ground;
    this.scene.fogMode = Scene.FOGMODE_EXP2;
    this.scene.fogColor = time.fogColor;
    this.scene.fogDensity = time.fogDensity + weatherTuning.fogBoost;
    this.skyLight.diffuse = time.light;
    this.skyLight.groundColor = time.ground;
    this.baseAmbientIntensity = time.intensity * (weather === "storm" ? 0.72 : weather === "rain" ? 0.85 : 1);
    this.baseSunIntensity = time.sunIntensity * (weather === "storm" ? 0.62 : weather === "rain" ? 0.78 : 1);
    this.skyLight.intensity = this.baseAmbientIntensity;
    this.sunLight.diffuse = time.light;
    this.sunLight.direction = time.sunDirection;
    this.sunLight.intensity = this.baseSunIntensity;
    this.lightningTimer = 0;
    this.nextLightningDelay = this.randomRange(4.5, 10);

    this.currentState = {
      timeOfDay,
      weather,
      condition,
      label: `${this.capitalize(timeOfDay)} / ${this.capitalize(weather)}`,
      visibilityLabel: this.visibilityLabel(timeOfDay, weather),
      flashlightUsefulness: timeOfDay === "night" ? "high" : timeOfDay === "dusk" || weather === "fog" ? "medium" : "low",
      darkness: timeOfDay === "night" ? 0.62 : timeOfDay === "dusk" ? 0.42 : 0.2,
      gameplay: {
        enemyVisionMultiplier: weatherTuning.enemyVisionMultiplier * nightVisionPenalty,
        rareLootChanceMultiplier: weatherTuning.rareLootChanceMultiplier * nightLootBonus,
        alertPropagationMultiplier: weatherTuning.alertPropagationMultiplier,
        flashlightDetectionMultiplier: timeOfDay === "night" ? 1.35 : weather === "fog" ? 1.2 : 1.08,
      },
    };

    return this.currentState;
  }

  private updateLightning(dt: number): void {
    if (this.currentState.weather !== "storm") {
      this.skyLight.intensity = this.baseAmbientIntensity;
      this.sunLight.intensity = this.baseSunIntensity;
      this.scene.clearColor.set(this.baseSky.r, this.baseSky.g, this.baseSky.b, 1);
      return;
    }

    this.nextLightningDelay -= dt;

    if (this.nextLightningDelay <= 0 && this.lightningTimer <= 0) {
      this.lightningTimer = this.randomRange(0.06, 0.16);
      this.nextLightningDelay = this.randomRange(5.5, 13);
    }

    this.lightningTimer = Math.max(0, this.lightningTimer - dt);
    const flash = this.lightningTimer > 0 ? Math.min(1, this.lightningTimer / 0.08) : 0;
    const skyBoost = 0.34 * flash;

    this.skyLight.intensity = this.baseAmbientIntensity + 1.6 * flash;
    this.sunLight.intensity = this.baseSunIntensity + 2.4 * flash;
    this.scene.clearColor.set(
      Math.min(1, this.baseSky.r + skyBoost),
      Math.min(1, this.baseSky.g + skyBoost),
      Math.min(1, this.baseSky.b + skyBoost),
      1,
    );
  }

  private randomizeRainDrop(drop: AbstractMesh, center = Vector3.Zero()): void {
    drop.position.set(
      center.x + this.randomRange(-44, 44),
      this.randomRange(8, 26),
      center.z + this.randomRange(-44, 44),
    );
    drop.rotation.z = -0.18;
  }

  private visibilityLabel(timeOfDay: TimeOfDayPreset, weather: WeatherPreset): string {
    if (weather === "storm") {
      return "Severe visibility";
    }

    if (weather === "fog" || timeOfDay === "night") {
      return "Low visibility";
    }

    if (weather === "rain" || timeOfDay === "dusk") {
      return "Reduced visibility";
    }

    return "Good visibility";
  }

  private pickWeighted<T>(items: ReadonlyArray<readonly [T, number]>): T {
    const total = items.reduce((sum, [, weight]) => sum + weight, 0);
    let roll = Math.random() * total;

    for (const [item, weight] of items) {
      roll -= weight;

      if (roll <= 0) {
        return item;
      }
    }

    return items[items.length - 1][0];
  }

  private randomRange(min: number, max: number): number {
    return min + Math.random() * (max - min);
  }

  private capitalize(value: string): string {
    return value.charAt(0).toUpperCase() + value.slice(1);
  }
}
