import { AbstractMesh, Ray, Scene, Vector3 } from "@babylonjs/core";
import type { InputSnapshot } from "../input/InputController";
import { yawToBasis } from "../math/angles";
import type { PlayerCharacter } from "../world/PlayerCharacter";
import type { MotorState } from "../world/PlayerMotor";

export type TraversalMode = "none" | "vault" | "mantle" | "zipline";

export type TraversalState = Readonly<{
  mode: TraversalMode;
  active: boolean;
  prompt: string;
  progress: number;
}>;

export type TraversalEvent = Readonly<{
  type: "jump-pad" | "fall-damage" | "land-impact";
  position: Vector3;
  amount?: number;
}>;

type ActiveMove = {
  mode: Exclude<TraversalMode, "none">;
  from: Vector3;
  to: Vector3;
  elapsed: number;
  duration: number;
};

type ZiplineMetadata = Readonly<{
  gameplayTag: "zipline-node";
  ziplineId: string;
  start: Vector3;
  end: Vector3;
}>;

type JumpPadMetadata = Readonly<{
  gameplayTag: "jump-pad";
  launchVelocity: Vector3;
}>;

const traversalConfig = {
  forwardProbeDistance: 1.55,
  probeHeight: 0.82,
  vaultMinHeight: 0.45,
  vaultMaxHeight: 1.25,
  mantleMaxHeight: 3.35,
  mantleForwardOffset: 1.12,
  vaultDuration: 0.34,
  mantleDuration: 0.58,
  ziplineAttachRange: 2.75,
  ziplineSpeed: 15,
  jumpPadRadius: 2.1,
  fallDamageStartHeight: 7.5,
  fallDamagePerMeter: 5.5,
  maxFallDamage: 70,
};

export class TraversalController {
  private activeMove: ActiveMove | null = null;
  private zipline: { start: Vector3; end: Vector3; progress: number; direction: number } | null = null;
  private stateValue: TraversalState = {
    mode: "none",
    active: false,
    prompt: "",
    progress: 0,
  };
  private events: TraversalEvent[] = [];
  private lastGrounded = false;
  private airborneStartY = 0;
  private jumpPadCooldown = 0;

  public constructor(private readonly scene: Scene) {}

  public get state(): TraversalState {
    return this.stateValue;
  }

  public update(dt: number, input: InputSnapshot, player: PlayerCharacter, cameraYaw: number): TraversalState {
    this.jumpPadCooldown = Math.max(0, this.jumpPadCooldown - dt);
    const motor = player.state;

    this.updateFallDamage(motor);

    if (this.activeMove) {
      this.updateActiveMove(dt, player);
      return this.stateValue;
    }

    if (this.zipline) {
      this.updateZipline(dt, input, player);
      return this.stateValue;
    }

    const ziplineNode = this.findNearbyZiplineNode(motor.position);
    const ledge = this.findTraversalLedge(motor.position, cameraYaw);
    const jumpPad = this.findJumpPad(motor.position);

    if (jumpPad && motor.grounded && this.jumpPadCooldown <= 0) {
      player.addTraversalLaunch(jumpPad.launchVelocity);
      this.jumpPadCooldown = 0.65;
      this.events.push({ type: "jump-pad", position: motor.position.clone() });
      this.stateValue = { mode: "none", active: false, prompt: "Launch pad burst", progress: 0 };
      return this.stateValue;
    }

    if (ziplineNode && input.interactPressed) {
      this.startZipline(player, ziplineNode);
      return this.stateValue;
    }

    if (ledge && input.jumpPressed && motor.grounded) {
      player.cancelTraversalMotion();
      this.activeMove = {
        mode: ledge.mode,
        from: motor.position.clone(),
        to: ledge.target,
        elapsed: 0,
        duration: ledge.mode === "vault" ? traversalConfig.vaultDuration : traversalConfig.mantleDuration,
      };
      this.stateValue = {
        mode: ledge.mode,
        active: true,
        prompt: ledge.mode === "vault" ? "Vaulting" : "Mantling",
        progress: 0,
      };
      return this.stateValue;
    }

    this.stateValue = {
      mode: "none",
      active: false,
      prompt: ziplineNode
        ? "E/F ride zipline"
        : ledge
          ? ledge.mode === "vault" ? "Space vault" : "Space mantle"
          : "",
      progress: 0,
    };
    return this.stateValue;
  }

  public getAdjustedInput(input: InputSnapshot): InputSnapshot {
    if (!this.stateValue.active) {
      return input;
    }

    return {
      ...input,
      firePressed: this.stateValue.mode === "zipline" ? input.firePressed : false,
      fireHeld: this.stateValue.mode === "zipline" ? input.fireHeld : false,
      adsHeld: this.stateValue.mode === "zipline" ? input.adsHeld : false,
      reloadPressed: false,
      weaponSwapPressed: false,
      weaponSlotPressed: null,
      clearJamPressed: false,
      clearJamHeld: false,
    };
  }

  public consumeEvents(): TraversalEvent[] {
    const pending = this.events.map((event) => ({
      ...event,
      position: event.position.clone(),
    }));
    this.events.length = 0;
    return pending;
  }

  public reset(): void {
    this.activeMove = null;
    this.zipline = null;
    this.events.length = 0;
    this.lastGrounded = false;
    this.airborneStartY = 0;
    this.jumpPadCooldown = 0;
    this.stateValue = { mode: "none", active: false, prompt: "", progress: 0 };
  }

  private updateActiveMove(dt: number, player: PlayerCharacter): void {
    if (!this.activeMove) {
      return;
    }

    this.activeMove.elapsed = Math.min(this.activeMove.duration, this.activeMove.elapsed + dt);
    const amount = this.smoothStep(this.activeMove.elapsed / this.activeMove.duration);
    const next = Vector3.Lerp(this.activeMove.from, this.activeMove.to, amount);
    player.setTraversalPosition(next);

    this.stateValue = {
      mode: this.activeMove.mode,
      active: true,
      prompt: this.activeMove.mode === "vault" ? "Vaulting" : "Mantling",
      progress: amount,
    };

    if (this.activeMove.elapsed >= this.activeMove.duration) {
      player.cancelTraversalMotion();
      this.activeMove = null;
      this.stateValue = { mode: "none", active: false, prompt: "", progress: 0 };
    }
  }

  private startZipline(player: PlayerCharacter, metadata: ZiplineMetadata): void {
    const position = player.state.position;
    const startDistance = Vector3.Distance(position, metadata.start);
    const endDistance = Vector3.Distance(position, metadata.end);
    const direction = startDistance <= endDistance ? 1 : -1;
    const progress = direction > 0 ? 0 : 1;

    player.cancelTraversalMotion();
    player.setTraversalPosition(direction > 0 ? metadata.start : metadata.end);
    this.zipline = {
      start: metadata.start.clone(),
      end: metadata.end.clone(),
      progress,
      direction,
    };
    this.stateValue = { mode: "zipline", active: true, prompt: "Zipline | Space detach", progress };
  }

  private updateZipline(dt: number, input: InputSnapshot, player: PlayerCharacter): void {
    if (!this.zipline) {
      return;
    }

    const distance = Vector3.Distance(this.zipline.start, this.zipline.end);
    const delta = distance > 0 ? (traversalConfig.ziplineSpeed * dt) / distance : 1;
    this.zipline.progress += delta * this.zipline.direction;

    const reachedEnd = this.zipline.progress <= 0 || this.zipline.progress >= 1;
    const progress = Math.min(1, Math.max(0, this.zipline.progress));
    const position = Vector3.Lerp(this.zipline.start, this.zipline.end, progress);
    player.setTraversalPosition(position);

    this.stateValue = {
      mode: "zipline",
      active: true,
      prompt: "Zipline | Space detach",
      progress,
    };

    if (input.jumpPressed || reachedEnd) {
      const forward = this.zipline.end.subtract(this.zipline.start).normalize().scale(this.zipline.direction);
      player.addTraversalLaunch(forward.scale(3.2).addInPlace(new Vector3(0, input.jumpPressed ? 3.2 : 0.8, 0)));
      this.zipline = null;
      this.stateValue = { mode: "none", active: false, prompt: "", progress: 0 };
    }
  }

  private findTraversalLedge(position: Vector3, cameraYaw: number): { mode: "vault" | "mantle"; target: Vector3 } | null {
    const { forward } = yawToBasis(cameraYaw);
    const origin = position.add(new Vector3(0, traversalConfig.probeHeight, 0));
    const ray = new Ray(origin, forward, traversalConfig.forwardProbeDistance);
    const hit = this.scene.pickWithRay(ray, (mesh) => this.isTraversalObstacle(mesh));

    if (!hit?.hit || !hit.pickedMesh || !hit.pickedPoint) {
      return null;
    }

    const bounds = hit.pickedMesh.getBoundingInfo().boundingBox;
    const top = bounds.maximumWorld.y;
    const height = top - position.y;

    if (height < traversalConfig.vaultMinHeight || height > traversalConfig.mantleMaxHeight) {
      return null;
    }

    const mode = height <= traversalConfig.vaultMaxHeight ? "vault" : "mantle";
    const target = hit.pickedPoint.add(forward.scale(traversalConfig.mantleForwardOffset));
    target.y = top + 0.08;

    if (!this.hasClearance(target)) {
      return null;
    }

    return { mode, target };
  }

  private findNearbyZiplineNode(position: Vector3): ZiplineMetadata | null {
    for (const mesh of this.scene.meshes) {
      const metadata = mesh.metadata as Partial<ZiplineMetadata> | null | undefined;

      if (metadata?.gameplayTag !== "zipline-node" || !metadata.start || !metadata.end) {
        continue;
      }

      if (Vector3.Distance(mesh.position, position) <= traversalConfig.ziplineAttachRange) {
        return metadata as ZiplineMetadata;
      }
    }

    return null;
  }

  private findJumpPad(position: Vector3): JumpPadMetadata | null {
    for (const mesh of this.scene.meshes) {
      const metadata = mesh.metadata as Partial<JumpPadMetadata> | null | undefined;

      if (metadata?.gameplayTag !== "jump-pad" || !metadata.launchVelocity) {
        continue;
      }

      const horizontalDistance = Math.hypot(mesh.position.x - position.x, mesh.position.z - position.z);

      if (horizontalDistance <= traversalConfig.jumpPadRadius && Math.abs(mesh.position.y - position.y) <= 1.2) {
        return metadata as JumpPadMetadata;
      }
    }

    return null;
  }

  private hasClearance(target: Vector3): boolean {
    const origin = target.add(new Vector3(0, 0.2, 0));
    const ray = new Ray(origin, Vector3.Up(), 1.9);
    const hit = this.scene.pickWithRay(ray, (mesh) => mesh.checkCollisions);
    return !hit?.hit;
  }

  private isTraversalObstacle(mesh: AbstractMesh): boolean {
    if (!mesh.checkCollisions) {
      return false;
    }

    const metadata = mesh.metadata as { gameplayTag?: string } | null | undefined;
    return metadata?.gameplayTag === "cover" ||
      metadata?.gameplayTag === "poi-wall" ||
      metadata?.gameplayTag === "platform" ||
      metadata?.gameplayTag === "ramp";
  }

  private updateFallDamage(motor: MotorState): void {
    if (!motor.grounded) {
      if (this.lastGrounded) {
        this.airborneStartY = motor.position.y;
      } else {
        this.airborneStartY = Math.max(this.airborneStartY, motor.position.y);
      }
      this.lastGrounded = false;
      return;
    }

    if (!this.lastGrounded) {
      const fallHeight = this.airborneStartY - motor.position.y;

      if (fallHeight > traversalConfig.fallDamageStartHeight) {
        const amount = Math.min(
          traversalConfig.maxFallDamage,
          (fallHeight - traversalConfig.fallDamageStartHeight) * traversalConfig.fallDamagePerMeter,
        );
        this.events.push({ type: "fall-damage", position: motor.position.clone(), amount });
      } else if (fallHeight > 4.5) {
        this.events.push({ type: "land-impact", position: motor.position.clone() });
      }
    }

    this.airborneStartY = motor.position.y;
    this.lastGrounded = true;
  }

  private smoothStep(amount: number): number {
    const t = Math.min(1, Math.max(0, amount));
    return t * t * (3 - 2 * t);
  }
}
