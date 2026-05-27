type TrackKey = "menu" | "tychoStar";
export type MusicState = TrackKey | "none";
export type MusicAudioSettings = Readonly<{
  masterVolume: number;
  musicVolume: number;
  muted: boolean;
}>;

const TRACKS: Record<TrackKey, string> = {
  menu: "/audio/ui/DC_Menu.mp3",
  tychoStar: "/audio/music/tychostar.mp3",
};

let currentMusic: HTMLAudioElement | null = null;
let currentTrack: TrackKey | null = null;
let currentBaseVolume = 0.35;
let unlocked = false;
let settingsProvider: (() => MusicAudioSettings) | null = null;

function effectiveMusicVolume(baseVolume: number): number {
  const settings = settingsProvider?.();
  if (settings?.muted) {
    return 0;
  }

  return baseVolume * (settings?.masterVolume ?? 1) * (settings?.musicVolume ?? 1);
}

function createMusic(src: string, volume = 0.35): HTMLAudioElement {
  const audio = new Audio(src);
  audio.loop = true;
  audio.volume = effectiveMusicVolume(volume);
  audio.preload = "auto";
  return audio;
}

export async function playMusic(track: TrackKey, volume = 0.35): Promise<void> {
  if (currentTrack === track && currentMusic && !currentMusic.paused) {
    return;
  }

  stopMusic();

  currentTrack = track;
  currentBaseVolume = volume;
  currentMusic = createMusic(TRACKS[track], volume);

  try {
    await currentMusic.play();
  } catch {
    console.warn("[DARK CRATERS AUDIO] Browser blocked autoplay. Waiting for user input.");
  }
}

export function stopMusic(): void {
  if (!currentMusic) {
    return;
  }

  currentMusic.pause();
  currentMusic.currentTime = 0;
  currentMusic = null;
  currentTrack = null;
  currentBaseVolume = 0.35;
}

export function unlockAudio(): void {
  if (unlocked) {
    return;
  }

  unlocked = true;

  const silent = new Audio();
  silent.volume = 0;
  void silent.play().catch(() => {});
}

export function playMenuMusic(): Promise<void> {
  return playMusic("menu", 0.32);
}

export function playTychoStarMusic(): Promise<void> {
  return playMusic("tychoStar", 0.42);
}

export function setMusicSettingsProvider(provider: () => MusicAudioSettings): void {
  settingsProvider = provider;
  updateCurrentMusicVolume();
}

export function updateCurrentMusicVolume(): void {
  if (!currentMusic) {
    return;
  }

  currentMusic.volume = effectiveMusicVolume(currentBaseVolume);
}

export function getCurrentMusicState(): MusicState {
  return currentTrack ?? "none";
}
