import { themeConfig } from "../theme/ThemeConfig";

const loadingTips = [
  "ORBITAL HQ LINK ESTABLISHED",
  "PRESSURIZING DOCKING CORRIDOR",
  "LOADING HABITAT SYSTEMS",
  "SYNCING CRATER RUNNER PROFILE",
  "HELIUM-3 CONTRACT BOARD ONLINE",
  "WARNING: SURFACE CONDITIONS HOSTILE",
  ...themeConfig.brand.loadingLines,
  "Helium-3 brought humanity to the Moon. The Lumen answered.",
  "Extract to keep what your EVA Pack carries.",
  "Regolith Scrap powers fabrication and upgrades.",
  "Faction contracts pay better when you survive.",
  "Use shoulder swap around cover.",
  "Your Habitat Stash is safe. Your EVA Pack is not.",
  "Carry Anti-Toxin into Tick-heavy crater zones. Lunar Infection erodes Mental Stability over time.",
  "The Quiet Order believes Lunacy is not just disease, but signal exposure.",
] as const;

const craterRunTips = [
  "KESTREL-9 DESCENT VECTOR LOCKED.",
  "TYCHOSTAR DROP AUTHORIZATION ACCEPTED.",
  "SURFACE TELEMETRY DEGRADED.",
  "SEISMIC ARTIFACT DISMISSED.",
  "HABITAT STASH LINK STANDBY.",
  "RETURN ROUTE PENDING TOUCHDOWN.",
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
        <span class="loading-kicker">Habitat Transfer</span>
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
    const habitatTransfer = /hq|habitat/i.test(destination);
    const craterRunTransfer = /crater|deployment|deploy|tycho/i.test(destination) && !habitatTransfer;
    this.root.classList.toggle("habitat-transfer", habitatTransfer);
    this.root.classList.toggle("crater-run-transfer", craterRunTransfer);
    const kicker = this.root.querySelector(".loading-kicker");
    if (kicker) {
      kicker.textContent = craterRunTransfer ? "Deployment Authorized" : habitatTransfer ? "Habitat Transfer" : "System Transfer";
    }
    const tagline = themeConfig.brand.loadingLines[Math.floor(Math.random() * themeConfig.brand.loadingLines.length)];
    const taglineElement = this.root.querySelector("[data-loading-tagline]");
    if (taglineElement) {
      taglineElement.textContent = craterRunTransfer
        ? "DROP CORRIDOR ACCEPTED"
        : habitatTransfer ? "ORBITAL HQ LINK ESTABLISHED" : tagline;
    }
    this.tip.textContent = craterRunTransfer
      ? craterRunTips[Math.floor(Math.random() * craterRunTips.length)]
      : habitatTransfer
      ? loadingTips[Math.floor(Math.random() * 6)]
      : loadingTips[Math.floor(Math.random() * loadingTips.length)];
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
