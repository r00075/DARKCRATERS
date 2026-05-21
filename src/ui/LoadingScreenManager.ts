import { themeConfig } from "../theme/ThemeConfig";

const loadingTips = [
  ...themeConfig.brand.loadingLines,
  "Helium-3 brought humanity to the Moon. The Umbra answered.",
  "Extract to keep what your EVA Pack carries.",
  "Regolith Scrap powers fabrication and upgrades.",
  "Faction contracts pay better when you survive.",
  "Use shoulder swap around cover.",
  "Your Habitat Stash is safe. Your EVA Pack is not.",
  "Carry Anti-Toxin into Tick-heavy crater zones. Lunar Infection erodes Mental Stability over time.",
  "The Quiet Order believes Lunacy is not just disease, but signal exposure.",
] as const;

export class LoadingScreenManager {
  private readonly root = document.createElement("div");
  private readonly destination = document.createElement("span");
  private readonly tip = document.createElement("small");
  private hideTimer: number | null = null;

  public constructor() {
    this.root.className = "loading-screen";
    this.root.innerHTML = `
      <div class="loading-card">
        <span class="loading-kicker">Crater Run Systems Online</span>
        <h1>${themeConfig.brand.title}</h1>
        <p data-loading-tagline>${themeConfig.brand.loadingLines[0]}</p>
        <div class="loading-progress"><i></i></div>
      </div>
    `;
    this.destination.className = "loading-destination";
    this.tip.className = "loading-tip";
    this.root.querySelector(".loading-card")?.append(this.destination, this.tip);
    document.body.append(this.root);
    this.hide();
  }

  public show(destination = "Loading HQ", minimumMs = 1700): void {
    if (this.hideTimer !== null) {
      window.clearTimeout(this.hideTimer);
      this.hideTimer = null;
    }

    this.destination.textContent = destination;
    const tagline = themeConfig.brand.loadingLines[Math.floor(Math.random() * themeConfig.brand.loadingLines.length)];
    const taglineElement = this.root.querySelector("[data-loading-tagline]");
    if (taglineElement) {
      taglineElement.textContent = tagline;
    }
    this.tip.textContent = loadingTips[Math.floor(Math.random() * loadingTips.length)];
    this.root.classList.add("active");
    this.root.setAttribute("aria-hidden", "false");

    if (minimumMs > 0) {
      this.hideTimer = window.setTimeout(() => {
        this.hideTimer = null;
        this.hide();
      }, minimumMs);
    }
  }

  public flash(destination: string): void {
    this.show(destination, 900);
  }

  public hide(): void {
    this.root.classList.remove("active");
    this.root.setAttribute("aria-hidden", "true");
  }

  public dispose(): void {
    if (this.hideTimer !== null) {
      window.clearTimeout(this.hideTimer);
    }

    this.root.remove();
  }
}
