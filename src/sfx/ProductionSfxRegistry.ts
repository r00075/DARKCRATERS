export type SfxEventKey =
  | "ui.play"
  | "ui.nav"
  | "ui.deploy"
  | "ui.error"
  | "loot.open"
  | "loot.claim"
  | "loot.rare"
  | "loot.empty"
  | "heavy.release"
  | "heavy.pickup"
  | "heavy.exposed"
  | "heavy.drop"
  | "heavy.secure"
  | "heavy.extracted"
  | "revive.downed"
  | "revive.start"
  | "revive.complete"
  | "ship.dock"
  | "ship.burn"
  | "ship.transit"
  | "ship.interference"
  | "ship.reacquired"
  | "ship.approach"
  | "ship.final"
  | "ship.impact"
  | "ship.touchdown.clean"
  | "ship.touchdown.rough"
  | "ship.touchdown.damaged"
  | "ship.cargo"
  | "ship.extract.start"
  | "ship.extract.complete"
  | "weapon.fire"
  | "weapon.reload"
  | "weapon.empty"
  | "weapon.equip"
  | "weapon.overheat"
  | "combat.hit"
  | "combat.damage"
  | "combat.death";

export type SfxEventDefinition = Readonly<{
  paths: readonly string[];
  volume: number;
  minIntervalMs?: number;
}>;

export const productionSfxRegistry: Record<SfxEventKey, SfxEventDefinition> = {
  "ui.play": { paths: ["/audio/sfx/radio/docking-control-confirm.mp3"], volume: 0.42, minIntervalMs: 180 },
  "ui.nav": { paths: ["/audio/sfx/environment/terminal-beep.mp3", "/audio/sfx/environment/terminal-beep-01.mp3"], volume: 0.2, minIntervalMs: 90 },
  "ui.deploy": { paths: ["/audio/sfx/radio/hq-radio-briefing-start.mp3"], volume: 0.42, minIntervalMs: 700 },
  "ui.error": { paths: ["/audio/sfx/survival/objective-failed.mp3"], volume: 0.34, minIntervalMs: 350 },
  "loot.open": { paths: ["/audio/sfx/environment/base-door-open.mp3"], volume: 0.35, minIntervalMs: 550 },
  "loot.claim": { paths: ["/audio/sfx/resources/artifact-discovered.mp3"], volume: 0.3, minIntervalMs: 120 },
  "loot.rare": { paths: ["/audio/sfx/resources/artifact-discovered-01.mp3", "/audio/sfx/radio/suit-ai-notification.mp3"], volume: 0.4, minIntervalMs: 500 },
  "loot.empty": { paths: ["/audio/sfx/environment/terminal-beep-01.mp3"], volume: 0.18, minIntervalMs: 450 },
  "heavy.release": { paths: ["/audio/sfx/resources/helium3-drill-loop.mp3"], volume: 0.36, minIntervalMs: 900 },
  "heavy.pickup": { paths: ["/audio/sfx/resources/artifact-discovered.mp3"], volume: 0.44, minIntervalMs: 650 },
  "heavy.exposed": { paths: ["/audio/sfx/aliens/infection-pulse.mp3", "/audio/sfx/aliens/infection-pulse-01.mp3"], volume: 0.48, minIntervalMs: 900 },
  "heavy.drop": { paths: ["/audio/sfx/ship/ship-cargo-transfer.mp3"], volume: 0.34, minIntervalMs: 500 },
  "heavy.secure": { paths: ["/audio/sfx/ship/docking-clamps-lock.mp3", "/audio/sfx/ship/ship-cargo-transfer-01.mp3"], volume: 0.42, minIntervalMs: 700 },
  "heavy.extracted": { paths: ["/audio/sfx/radio/docking-control-confirm.mp3"], volume: 0.46, minIntervalMs: 900 },
  "revive.downed": { paths: ["/audio/sfx/player/player-pain-hit.mp3", "/audio/sfx/survival/suit-breach-warning.mp3"], volume: 0.42, minIntervalMs: 700 },
  "revive.start": { paths: ["/audio/sfx/radio/suit-ai-notification.mp3"], volume: 0.28, minIntervalMs: 650 },
  "revive.complete": { paths: ["/audio/sfx/player/anti-toxin-inject.mp3", "/audio/sfx/radio/docking-control-confirm.mp3"], volume: 0.38, minIntervalMs: 700 },
  "ship.dock": { paths: ["/audio/sfx/ship/docking-clamps-lock.mp3"], volume: 0.34, minIntervalMs: 900 },
  "ship.burn": { paths: ["/audio/sfx/ship/ship-engine-idle-loop.mp3"], volume: 0.28, minIntervalMs: 1200 },
  "ship.transit": { paths: ["/audio/sfx/radio/docking-control-confirm.mp3"], volume: 0.26, minIntervalMs: 900 },
  "ship.interference": { paths: ["/audio/sfx/radio/alien-corrupted-transmission.mp3"], volume: 0.34, minIntervalMs: 900 },
  "ship.reacquired": { paths: ["/audio/sfx/radio/docking-control-confirm.mp3"], volume: 0.28, minIntervalMs: 900 },
  "ship.approach": { paths: ["/audio/sfx/ship/landing-gear-deploy.mp3"], volume: 0.28, minIntervalMs: 900 },
  "ship.final": { paths: ["/audio/sfx/ship/landing-gear-deploy-01.mp3"], volume: 0.3, minIntervalMs: 900 },
  "ship.impact": { paths: ["/audio/sfx/ship/hard-landing-impact.mp3"], volume: 0.46, minIntervalMs: 900 },
  "ship.touchdown.clean": { paths: ["/audio/sfx/ship/clean-landing-confirm.mp3"], volume: 0.38, minIntervalMs: 900 },
  "ship.touchdown.rough": { paths: ["/audio/sfx/ship/hard-landing-impact.mp3"], volume: 0.45, minIntervalMs: 900 },
  "ship.touchdown.damaged": { paths: ["/audio/sfx/ship/ship-crash-destroyed.mp3"], volume: 0.48, minIntervalMs: 900 },
  "ship.cargo": { paths: ["/audio/sfx/ship/ship-cargo-transfer.mp3"], volume: 0.38, minIntervalMs: 450 },
  "ship.extract.start": { paths: ["/audio/sfx/radio/hq-extraction-warning.mp3"], volume: 0.42, minIntervalMs: 900 },
  "ship.extract.complete": { paths: ["/audio/sfx/radio/docking-control-confirm.mp3"], volume: 0.46, minIntervalMs: 900 },
  "weapon.fire": { paths: ["/audio/sfx/weapons/weapon-fire-basic.mp3", "/audio/sfx/weapons/weapon-fire-basic-01.mp3"], volume: 0.34, minIntervalMs: 38 },
  "weapon.reload": { paths: ["/audio/sfx/weapons/weapon-reload-basic.mp3", "/audio/sfx/weapons/weapon-reload-basic-01.mp3"], volume: 0.32, minIntervalMs: 250 },
  "weapon.empty": { paths: ["/audio/sfx/weapons/weapon-empty-click.mp3"], volume: 0.32, minIntervalMs: 120 },
  "weapon.equip": { paths: ["/audio/sfx/weapons/weapon-equip.mp3"], volume: 0.26, minIntervalMs: 220 },
  "weapon.overheat": { paths: ["/audio/sfx/weapons/weapon-overheat.mp3"], volume: 0.35, minIntervalMs: 450 },
  "combat.hit": { paths: ["/audio/sfx/weapons/bullet-impact-alien-flesh.mp3"], volume: 0.22, minIntervalMs: 50 },
  "combat.damage": { paths: ["/audio/sfx/player/player-pain-hit.mp3"], volume: 0.35, minIntervalMs: 350 },
  "combat.death": { paths: ["/audio/sfx/player/player-death.mp3"], volume: 0.42, minIntervalMs: 900 },
};
