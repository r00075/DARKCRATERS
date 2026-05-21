import { Vector3 } from "@babylonjs/core";
import type { InputSnapshot } from "../input/InputController";
import type { VisibilityToolManager } from "../visibility/VisibilityToolManager";

export type TacticalToolId =
  | "flashlight"
  | "laser-sight"
  | "portable-scanner"
  | "decoy-beacon"
  | "smoke-puck"
  | "shock-trap";

export type TacticalToolDefinition = Readonly<{
  id: TacticalToolId;
  label: string;
  cooldown: number;
  maxCharges: number;
  toggle: boolean;
}>;

export type TacticalToolState = Readonly<{
  equippedId: TacticalToolId;
  label: string;
  active: boolean;
  charges: number;
  maxCharges: number;
  cooldownRemaining: number;
  cooldownProgress: number;
  unavailableReason: string | null;
  lastUsePosition: Vector3 | null;
}>;

export const tacticalToolDefinitions: Record<TacticalToolId, TacticalToolDefinition> = {
  flashlight: {
    id: "flashlight",
    label: "Flashlight",
    cooldown: 0,
    maxCharges: Infinity,
    toggle: true,
  },
  "laser-sight": {
    id: "laser-sight",
    label: "Laser Sight",
    cooldown: 0,
    maxCharges: Infinity,
    toggle: true,
  },
  "portable-scanner": {
    id: "portable-scanner",
    label: "Portable Scanner",
    cooldown: 12,
    maxCharges: 3,
    toggle: false,
  },
  "decoy-beacon": {
    id: "decoy-beacon",
    label: "Decoy Beacon",
    cooldown: 8,
    maxCharges: 2,
    toggle: false,
  },
  "smoke-puck": {
    id: "smoke-puck",
    label: "Smoke Puck",
    cooldown: 10,
    maxCharges: 2,
    toggle: false,
  },
  "shock-trap": {
    id: "shock-trap",
    label: "Shock Trap",
    cooldown: 14,
    maxCharges: 1,
    toggle: false,
  },
};

export class TacticalToolManager {
  private equippedId: TacticalToolId = "flashlight";
  private cooldownRemaining = 0;
  private charges = tacticalToolDefinitions.flashlight.maxCharges;
  private unavailableReason: string | null = null;
  private lastUsePosition: Vector3 | null = null;
  private stateSnapshot: TacticalToolState = this.createState(false);

  public get state(): TacticalToolState {
    return this.stateSnapshot;
  }

  public equip(toolId: TacticalToolId): void {
    this.equippedId = toolId;
    this.cooldownRemaining = 0;
    this.charges = tacticalToolDefinitions[toolId].maxCharges;
    this.unavailableReason = null;
    this.lastUsePosition = null;
    this.stateSnapshot = this.createState(false);
  }

  public resetForRaid(): void {
    this.equip(this.equippedId);
  }

  public update(
    dt: number,
    input: InputSnapshot,
    playerPosition: Vector3,
    visibilityTools: VisibilityToolManager,
  ): TacticalToolState {
    this.cooldownRemaining = Math.max(0, this.cooldownRemaining - dt);
    this.unavailableReason = null;

    if (input.toggleFlashlightPressed) {
      this.useEquippedTool(playerPosition, visibilityTools);
    }

    this.stateSnapshot = this.createState(this.isVisibilityToggleActive(visibilityTools));
    return this.stateSnapshot;
  }

  private useEquippedTool(playerPosition: Vector3, visibilityTools: VisibilityToolManager): void {
    const definition = tacticalToolDefinitions[this.equippedId];

    if (this.cooldownRemaining > 0) {
      this.unavailableReason = "Tool cooling down";
      return;
    }

    if (!Number.isFinite(this.charges) && definition.toggle) {
      this.toggleVisibilityTool(visibilityTools);
      this.lastUsePosition = playerPosition.clone();
      return;
    }

    if (this.charges <= 0) {
      this.unavailableReason = "No charges";
      return;
    }

    this.charges -= 1;
    this.cooldownRemaining = definition.cooldown;
    this.lastUsePosition = playerPosition.clone();
  }

  private toggleVisibilityTool(visibilityTools: VisibilityToolManager): void {
    if (this.equippedId === "laser-sight") {
      visibilityTools.toggleLaser();
      return;
    }

    visibilityTools.toggleFlashlight();
  }

  private isVisibilityToggleActive(visibilityTools: VisibilityToolManager): boolean {
    const state = visibilityTools.state;

    if (this.equippedId === "laser-sight") {
      return state.laserOn;
    }

    if (this.equippedId === "flashlight") {
      return state.flashlightOn;
    }

    return this.cooldownRemaining > 0;
  }

  private createState(active: boolean): TacticalToolState {
    const definition = tacticalToolDefinitions[this.equippedId];
    const cooldownProgress = definition.cooldown > 0
      ? 1 - this.cooldownRemaining / definition.cooldown
      : 1;

    return {
      equippedId: this.equippedId,
      label: definition.label,
      active,
      charges: this.charges,
      maxCharges: definition.maxCharges,
      cooldownRemaining: this.cooldownRemaining,
      cooldownProgress,
      unavailableReason: this.unavailableReason,
      lastUsePosition: this.lastUsePosition?.clone() ?? null,
    };
  }
}
