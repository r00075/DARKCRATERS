export type KeyboardAction =
  | "forward"
  | "backward"
  | "left"
  | "right"
  | "sprint"
  | "jump"
  | "crouch"
  | "cover"
  | "peekLeft"
  | "peekRight"
  | "flashlight"
  | "laser"
  | "nightVision"
  | "interact"
  | "reload"
  | "clearJam"
  | "shoulderSwap"
  | "useMedkit"
  | "restart";

export type ControllerAction =
  | "jump"
  | "crouch"
  | "interact"
  | "weaponSwap"
  | "ads"
  | "fire"
  | "peekLeft"
  | "peekRight"
  | "flashlight"
  | "sprint"
  | "reload"
  | "clearJam"
  | "shoulderSwap"
  | "useMedkit"
  | "menu";

export type SettingsTab = "graphics" | "audio" | "controls" | "gameplay";
export type GraphicsQuality = "low" | "medium" | "high";

export type GameSettings = Readonly<{
  settingsVersion: number;
  graphics: {
    fovDegrees: number;
    cameraSensitivity: number;
    adsSensitivityMultiplier: number;
    quality: GraphicsQuality;
    fullscreen: boolean;
    motionBlur: boolean;
    cameraShake: boolean;
  };
  audio: {
    masterVolume: number;
    sfxVolume: number;
    musicVolume: number;
    muted: boolean;
  };
  controls: {
    invertMouseX: boolean;
    invertMouseY: boolean;
    controllerSensitivity: number;
    adsControllerSensitivityMultiplier: number;
    leftStickDeadzone: number;
    rightStickDeadzone: number;
    triggerThreshold: number;
    keyboardBindings: Record<KeyboardAction, string[]>;
    controllerBindings: Record<ControllerAction, number>;
  };
  gameplay: {
    holdAds: boolean;
    holdCrouch: boolean;
    crosshairOpacity: number;
    hitMarkers: boolean;
    aimAssistEnabled: boolean;
    aimAssistStrength: number;
    adsAimAssistMultiplier: number;
    hipfireAimAssistMultiplier: number;
  };
}>;

const storageKey = "babylon-extraction-shooter-settings-v1";
const settingsVersion = 7;

export const controllerButtonLabels: Record<number, string> = {
  0: "A / Cross",
  1: "B / Circle",
  2: "X / Square",
  3: "Y / Triangle",
  4: "LB / L1",
  5: "RB / R1",
  6: "LT / L2",
  7: "RT / R2",
  8: "View / Share",
  9: "Menu / Options",
  10: "L3",
  11: "R3",
  12: "D-pad Up",
  13: "D-pad Down",
  14: "D-pad Left",
  15: "D-pad Right",
};

export const defaultSettings: GameSettings = {
  settingsVersion,
  graphics: {
    fovDegrees: 80,
    cameraSensitivity: 1,
    adsSensitivityMultiplier: 0.55,
    quality: "high",
    fullscreen: false,
    motionBlur: false,
    cameraShake: true,
  },
  audio: {
    masterVolume: 0.8,
    sfxVolume: 0.65,
    musicVolume: 0.45,
    muted: false,
  },
  controls: {
    invertMouseX: false,
    invertMouseY: false,
    controllerSensitivity: 2.5,
    adsControllerSensitivityMultiplier: 0.7,
    leftStickDeadzone: 0.18,
    rightStickDeadzone: 0.12,
    triggerThreshold: 0.25,
    keyboardBindings: {
      forward: ["KeyW", "ArrowUp"],
      backward: ["KeyS", "ArrowDown"],
      left: ["KeyA", "ArrowLeft"],
      right: ["KeyD", "ArrowRight"],
      sprint: ["ShiftLeft", "ShiftRight"],
      jump: ["Space"],
      crouch: ["KeyC"],
      cover: ["KeyF"],
      peekLeft: ["KeyQ"],
      peekRight: ["KeyE"],
      flashlight: ["KeyT"],
      laser: ["KeyL"],
      nightVision: ["KeyN"],
      interact: ["KeyE", "KeyF"],
      reload: ["KeyR"],
      clearJam: ["KeyB"],
      shoulderSwap: ["KeyV"],
      useMedkit: ["KeyH"],
      restart: ["KeyN"],
    },
    controllerBindings: {
      jump: 0,
      crouch: 2,
      interact: 1,
      weaponSwap: 3,
      ads: 6,
      fire: 7,
      peekLeft: 4,
      peekRight: 5,
      flashlight: 12,
      sprint: 10,
      reload: 15,
      clearJam: 3,
      shoulderSwap: 11,
      useMedkit: 14,
      menu: 9,
    },
  },
  gameplay: {
    holdAds: true,
    holdCrouch: true,
    crosshairOpacity: 0.88,
    hitMarkers: true,
    aimAssistEnabled: true,
    aimAssistStrength: 1,
    adsAimAssistMultiplier: 0.45,
    hipfireAimAssistMultiplier: 0.25,
  },
};

export class SettingsManager {
  private currentSettings: GameSettings = this.load();

  public get snapshot(): GameSettings {
    return structuredClone(this.currentSettings);
  }

  public update(mutator: (settings: GameSettings) => GameSettings): void {
    this.currentSettings = mutator(this.snapshot);
    this.save();
  }

  public setValue(path: string, value: string | number | boolean): void {
    this.update((settings) => {
      const next = settings as unknown as Record<string, unknown>;
      const parts = path.split(".");
      let cursor = next;

      for (const part of parts.slice(0, -1)) {
        cursor = cursor[part] as Record<string, unknown>;
      }

      cursor[parts[parts.length - 1]] = path.startsWith("audio.") && typeof value === "number"
        ? this.clamp01(value)
        : value;
      return next as unknown as GameSettings;
    });
  }

  public setKeyboardBinding(action: KeyboardAction, code: string): void {
    this.update((settings) => ({
      ...settings,
      controls: {
        ...settings.controls,
        keyboardBindings: {
          ...settings.controls.keyboardBindings,
          [action]: [code],
        },
      },
    }));
  }

  public setControllerBinding(action: ControllerAction, button: number): void {
    this.update((settings) => ({
      ...settings,
      controls: {
        ...settings.controls,
        controllerBindings: {
          ...settings.controls.controllerBindings,
          [action]: button,
        },
      },
    }));
  }

  public resetToDefaults(): void {
    this.currentSettings = structuredClone(defaultSettings);
    this.save();
  }

  private load(): GameSettings {
    try {
      const stored = window.localStorage.getItem(storageKey);

      if (!stored) {
        return structuredClone(defaultSettings);
      }

      return this.mergeSettings(defaultSettings, JSON.parse(stored) as Partial<GameSettings>);
    } catch (error) {
      console.warn("SettingsManager failed to load settings; using defaults.", error);
      return structuredClone(defaultSettings);
    }
  }

  private save(): void {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(this.currentSettings));
    } catch (error) {
      console.warn("SettingsManager could not save settings.", error);
    }
  }

  private mergeSettings(defaults: GameSettings, stored: Partial<GameSettings>): GameSettings {
    const storedUsesCurrentControllerMap = stored.settingsVersion === settingsVersion;
    const storedUsesCurrentKeyboardMap = stored.settingsVersion === settingsVersion;

    return {
      settingsVersion,
      graphics: { ...defaults.graphics, ...stored.graphics },
      audio: this.mergeAudioSettings(defaults.audio, stored.audio),
      controls: {
        ...defaults.controls,
        ...stored.controls,
        keyboardBindings: {
          ...defaults.controls.keyboardBindings,
          ...(storedUsesCurrentKeyboardMap ? stored.controls?.keyboardBindings : {}),
        },
        controllerBindings: {
          ...defaults.controls.controllerBindings,
          ...(storedUsesCurrentControllerMap ? stored.controls?.controllerBindings : {}),
        },
      },
      gameplay: { ...defaults.gameplay, ...stored.gameplay },
    };
  }

  private mergeAudioSettings(
    defaults: GameSettings["audio"],
    stored: Partial<GameSettings["audio"]> | undefined,
  ): GameSettings["audio"] {
    return {
      masterVolume: this.clamp01(stored?.masterVolume ?? defaults.masterVolume),
      sfxVolume: this.clamp01(stored?.sfxVolume ?? defaults.sfxVolume),
      musicVolume: this.clamp01(stored?.musicVolume ?? defaults.musicVolume),
      muted: Boolean(stored?.muted ?? defaults.muted),
    };
  }

  private clamp01(value: number): number {
    return Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0;
  }
}
