import { App } from "./runtime/App";
import "./styles.css";

const canvas = document.querySelector<HTMLCanvasElement>("#app");

if (!canvas) {
  throw new Error("Missing #app canvas element.");
}

let app: App | null = null;

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

window.addEventListener("beforeunload", () => {
  app?.dispose();
});
