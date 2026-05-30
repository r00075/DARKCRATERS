import { productionSfxRegistry, type SfxEventKey } from "../sfx/ProductionSfxRegistry";

type ToneOptions = Readonly<{
  frequency: number;
  duration: number;
  volume: number;
  type?: OscillatorType;
  delay?: number;
  endFrequency?: number;
  attack?: number;
}>;

type NoiseOptions = Readonly<{
  duration: number;
  volume: number;
  delay?: number;
  filterFrequency?: number;
  filterType?: BiquadFilterType;
}>;

type AudioSettings = Readonly<{
  masterVolume: number;
  sfxVolume: number;
  muted: boolean;
}>;

export class PlaceholderWeaponAudio {
  private static settingsProvider: (() => AudioSettings) | null = null;
  private static lastPlayedAt = new Map<string, number>();
  private static lastDebug: Readonly<{
    event: string;
    path: string;
    result: "played" | "muted" | "throttled" | "missing" | "blocked";
  }> = { event: "none", path: "none", result: "missing" };
  private context: AudioContext | null = null;

  public static setSettingsProvider(provider: () => AudioSettings): void {
    PlaceholderWeaponAudio.settingsProvider = provider;
  }

  public static getDebugState(): Readonly<{ event: string; path: string; result: string }> {
    return PlaceholderWeaponAudio.lastDebug;
  }

  public playEvent(event: SfxEventKey): boolean {
    const definition = productionSfxRegistry[event];

    if (!definition || definition.paths.length === 0) {
      PlaceholderWeaponAudio.lastDebug = { event, path: "none", result: "missing" };
      return false;
    }

    const settings = PlaceholderWeaponAudio.settingsProvider?.();
    const path = definition.paths[Math.floor(Math.random() * definition.paths.length)] ?? definition.paths[0]!;
    if (settings?.muted) {
      PlaceholderWeaponAudio.lastDebug = { event, path, result: "muted" };
      return true;
    }

    const now = performance.now();
    const minIntervalMs = definition.minIntervalMs ?? 0;
    const lastPlayedAt = PlaceholderWeaponAudio.lastPlayedAt.get(event) ?? -Infinity;
    if (now - lastPlayedAt < minIntervalMs) {
      PlaceholderWeaponAudio.lastDebug = { event, path, result: "throttled" };
      return true;
    }

    PlaceholderWeaponAudio.lastPlayedAt.set(event, now);
    const audio = new Audio(path);
    audio.volume = definition.volume * (settings?.masterVolume ?? 1) * (settings?.sfxVolume ?? 1);
    audio.preload = "auto";
    PlaceholderWeaponAudio.lastDebug = { event, path, result: "played" };
    audio.play().catch(() => {
      PlaceholderWeaponAudio.lastDebug = { event, path, result: "blocked" };
    });
    return true;
  }

  public playGunshot(): void {
    if (this.playEvent("weapon.fire")) {
      return;
    }

    this.playTone({ frequency: 70, endFrequency: 42, duration: 0.09, volume: 0.12, type: "square" });
    this.playTone({ frequency: 240, endFrequency: 120, duration: 0.045, volume: 0.055, type: "sawtooth" });
    this.playNoise({ duration: 0.055, volume: 0.08, filterFrequency: 1800, filterType: "bandpass" });
    this.playTone({ frequency: 1100, duration: 0.018, volume: 0.025, type: "square" });
  }

  public playReload(): void {
    if (this.playEvent("weapon.reload")) {
      return;
    }

    this.playTone({ frequency: 320, duration: 0.04, volume: 0.03, type: "triangle" });
    this.playNoise({ duration: 0.045, volume: 0.025, filterFrequency: 1200, filterType: "highpass", delay: 0.12 });
    this.playTone({ frequency: 210, duration: 0.05, volume: 0.035, type: "sawtooth", delay: 0.16 });
    this.playTone({ frequency: 540, duration: 0.055, volume: 0.04, type: "triangle", delay: 0.46 });
    this.playNoise({ duration: 0.06, volume: 0.03, filterFrequency: 900, filterType: "bandpass", delay: 0.52 });
    this.playTone({ frequency: 980, duration: 0.04, volume: 0.025, type: "sine", delay: 0.62 });
    this.playTone({ frequency: 680, duration: 0.035, volume: 0.035, type: "square", delay: 0.76 });
  }

  public playDryFire(): void {
    if (this.playEvent("weapon.empty")) {
      return;
    }

    this.playTone({ frequency: 1180, duration: 0.018, volume: 0.028, type: "square" });
    this.playTone({ frequency: 240, duration: 0.04, volume: 0.03, type: "sawtooth", delay: 0.024 });
    this.playNoise({ duration: 0.025, volume: 0.018, filterFrequency: 1600, filterType: "highpass", delay: 0.035 });
    this.playTone({ frequency: 620, duration: 0.025, volume: 0.018, type: "sine", delay: 0.062 });
  }

  public playHitMarker(headshot: boolean): void {
    if (this.playEvent("combat.hit")) {
      return;
    }

    if (headshot) {
      this.playTone({ frequency: 1320, duration: 0.035, volume: 0.045, type: "square" });
      this.playNoise({ duration: 0.025, volume: 0.025, filterFrequency: 2500, filterType: "highpass", delay: 0.012 });
      this.playTone({ frequency: 1760, duration: 0.025, volume: 0.03, type: "sine", delay: 0.028 });
      return;
    }

    this.playTone({ frequency: 820, duration: 0.035, volume: 0.035, type: "sine" });
    this.playTone({ frequency: 620, duration: 0.025, volume: 0.025, type: "triangle", delay: 0.03 });
  }

  public playPlayerDamage(): void {
    if (this.playEvent("combat.damage")) {
      return;
    }

    this.playTone({ frequency: 96, endFrequency: 70, duration: 0.09, volume: 0.065, type: "sawtooth" });
    this.playNoise({ duration: 0.07, volume: 0.05, filterFrequency: 700, filterType: "bandpass", delay: 0.02 });
    this.playTone({ frequency: 280, duration: 0.055, volume: 0.04, type: "square", delay: 0.035 });
    this.playTone({ frequency: 620, duration: 0.045, volume: 0.028, type: "triangle", delay: 0.09 });
  }

  public playExtractionStart(): void {
    if (this.playEvent("ship.extract.start")) {
      return;
    }

    this.playTone({ frequency: 420, duration: 0.08, volume: 0.035, type: "triangle" });
    this.playTone({ frequency: 560, duration: 0.08, volume: 0.025, type: "sine", delay: 0.08 });
  }

  public playExtractionComplete(): void {
    if (this.playEvent("ship.extract.complete")) {
      return;
    }

    this.playTone({ frequency: 440, duration: 0.08, volume: 0.035, type: "triangle" });
    this.playTone({ frequency: 660, duration: 0.09, volume: 0.04, type: "sine", delay: 0.09 });
    this.playTone({ frequency: 990, duration: 0.11, volume: 0.04, type: "sine", delay: 0.19 });
    this.playNoise({ duration: 0.12, volume: 0.025, filterFrequency: 1600, filterType: "bandpass", delay: 0.24 });
    this.playTone({ frequency: 1320, duration: 0.08, volume: 0.025, type: "triangle", delay: 0.32 });
  }

  public playDeath(): void {
    if (this.playEvent("combat.death")) {
      return;
    }

    this.playTone({ frequency: 92, endFrequency: 52, duration: 0.16, volume: 0.07, type: "sawtooth" });
    this.playNoise({ duration: 0.16, volume: 0.055, filterFrequency: 500, filterType: "lowpass", delay: 0.04 });
    this.playTone({ frequency: 180, endFrequency: 120, duration: 0.18, volume: 0.055, type: "square", delay: 0.09 });
    this.playTone({ frequency: 68, endFrequency: 38, duration: 0.28, volume: 0.055, type: "sawtooth", delay: 0.21 });
    this.playTone({ frequency: 420, duration: 0.22, volume: 0.025, type: "sine", delay: 0.43 });
  }

  private playTone(options: ToneOptions): void {
    const settings = PlaceholderWeaponAudio.settingsProvider?.();

    if (settings?.muted) {
      return;
    }

    const context = this.getContext();
    const oscillator = context.createOscillator();
    const gain = context.createGain();

    const startTime = context.currentTime + (options.delay ?? 0);
    const endTime = startTime + options.duration;
    const volume = options.volume * (settings?.masterVolume ?? 1) * (settings?.sfxVolume ?? 1);
    const attack = Math.min(options.attack ?? 0.002, options.duration * 0.5);

    oscillator.type = options.type ?? "sine";
    oscillator.frequency.setValueAtTime(options.frequency, startTime);

    if (options.endFrequency !== undefined) {
      oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, options.endFrequency), endTime);
    }

    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.linearRampToValueAtTime(volume, startTime + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, endTime);

    oscillator.connect(gain);
    gain.connect(context.destination);

    oscillator.start(startTime);
    oscillator.stop(endTime);
  }

  private playNoise(options: NoiseOptions): void {
    const settings = PlaceholderWeaponAudio.settingsProvider?.();

    if (settings?.muted) {
      return;
    }

    const context = this.getContext();
    const bufferSize = Math.floor(context.sampleRate * options.duration);
    const buffer = context.createBuffer(1, bufferSize, context.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i += 1) {
      data[i] = Math.random() * 2 - 1;
    }

    const source = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const gain = context.createGain();

    const startTime = context.currentTime + (options.delay ?? 0);
    const endTime = startTime + options.duration;
    const volume = options.volume * (settings?.masterVolume ?? 1) * (settings?.sfxVolume ?? 1);

    source.buffer = buffer;

    filter.type = options.filterType ?? "lowpass";
    filter.frequency.setValueAtTime(options.filterFrequency ?? 900, startTime);

    gain.gain.setValueAtTime(volume, startTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, endTime);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(context.destination);

    source.start(startTime);
    source.stop(endTime);
  }

  private getContext(): AudioContext {
    this.context ??= new AudioContext();

    if (this.context.state === "suspended") {
      void this.context.resume();
    }

    return this.context;
  }
}
