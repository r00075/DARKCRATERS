import { App } from "./runtime/App";
import { PlaceholderWeaponAudio } from "./audio/PlaceholderWeaponAudio";
import { unlockAudio, playMenuMusic } from "./audio/darkCratersAudio";
import "./styles.css";

const canvas = document.querySelector<HTMLCanvasElement>("#app");

if (!canvas) {
  throw new Error("Missing #app canvas element.");
}

let app: App | null = null;

const audioGate = document.createElement("div");
audioGate.className = "audio-start-gate";
audioGate.innerHTML = `
  <div class="audio-start-panel">
    <button type="button" class="audio-start-button">PLAY</button>
    <span>ENTER HABITAT</span>
  </div>
`;

document.body.append(audioGate);

const playButton = audioGate.querySelector<HTMLButtonElement>(".audio-start-button");

playButton?.addEventListener("click", () => {
  void unlockAudio();
  new PlaceholderWeaponAudio().playEvent("ui.play");
  void playMenuMusic();

  audioGate.remove();

  try {
    app = new App(canvas);
    app.start();
  } catch (error) {
    console.error("DARK CRATERS failed to start.", error);

    const fallback = document.createElement("div");
    fallback.className = "startup-fallback";
    fallback.innerHTML = `
      <strong>DARK CRATERS</strong>
      <span>Startup failed, but the page stayed alive. Check the console for details.</span>
      <button type="button">Reset Local Save</button>
    `;

    document.body.append(fallback);

    fallback.querySelector("button")?.addEventListener("click", () => {
      for (const key of Object.keys(window.localStorage)) {
        if (
          key.startsWith("darc-raiders.") ||
          key.startsWith("extraction-shooter.prototype.") ||
          key.startsWith("babylon-extraction-shooter")
        ) {
          window.localStorage.removeItem(key);
        }
      }

      window.location.reload();
    });
  }
});

window.addEventListener("beforeunload", () => {
  app?.dispose();
});
