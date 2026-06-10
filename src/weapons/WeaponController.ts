import {
  AbstractMesh,
  Color3,
  MeshBuilder,
  PointLight,
  Ray,
  Scene,
  StandardMaterial,
  UniversalCamera,
  Vector3,
} from "@babylonjs/core";
import { PlaceholderWeaponAudio } from "../audio/PlaceholderWeaponAudio";
import type { ThirdPersonCameraRig } from "../camera/ThirdPersonCameraRig";
import { getDamageableMetadata } from "../combat/Damageable";
import type { DamageResult } from "../combat/Damageable";
import type { InputSnapshot } from "../input/InputController";
import type { RaidLoadout } from "../raid/Loadout";
import type { SettingsManager } from "../settings/SettingsManager";
import { themeConfig } from "../theme/ThemeConfig";
import type { VisibilityToolState } from "../visibility/VisibilityToolManager";
import type { PlayerCharacter } from "../world/PlayerCharacter";
import { AmmoPool } from "./AmmoPool";
import { FireRateGate } from "./FireRateGate";
import { buildRuntimeWeaponDefinition } from "./WeaponStatModifiers";
import { WeaponDurabilitySystem, type WeaponDurabilityState } from "./WeaponDurabilitySystem";
import { weaponDefinitions, type RuntimeWeaponDefinition, type WeaponId } from "./WeaponDefinitions";

export type WeaponState = Readonly<{
  equippedId: WeaponId;
  equippedName: string;
  aimDirection: Vector3;
  triggerHeld: boolean;
  ammoInMagazine: number;
  reserveAmmo: number;
  reloading: boolean;
  jammed: boolean;
  clearingJam: boolean;
  jamClearProgress: number;
  jamWarning: boolean;
  durability: number;
  jamChance: number;
  ready: boolean;
  scoped: boolean;
  dryFireFeedback: boolean;
  recoilBloom: number;
  noiseDetectionMultiplier: number;
  lastShot: WeaponShotDebugState;
}>;

export type WeaponShotDebugState = Readonly<{
  fired: boolean;
  hit: boolean;
  hitMeshName: string | null;
  damageDealt: number;
  hitZone: "body" | "head" | "legs" | null;
  distance: number;
  weaponName: string;
  laserActive: boolean;
}>;

type WeaponSlot = Readonly<{
  weaponId: WeaponId;
  weapon: RuntimeWeaponDefinition;
  ammo: AmmoPool;
  fireRate: FireRateGate;
  degradationMultiplier: number;
}>;

type WeaponCallbacks = Readonly<{
  onDamage: (result: DamageResult) => void;
  onDryFire: () => void;
  onShot?: (shot: {
    origin: { x: number; y: number; z: number };
    direction: { x: number; y: number; z: number };
    damage: number;
    range: number;
  }) => void;
}>;

type TimedEffect = Readonly<{
  mesh: AbstractMesh;
  ttl: number;
}>;

const weaponConfig = {
  muzzleFlashDuration: 0.045,
  dryFireFeedbackDuration: 0.18,
  recoilBloomDuration: 0.14,
  meleeRange: 2.05,
  meleeDamage: 25,
  meleeCooldown: 0.62,
};

export class WeaponController {
  private readonly weaponMesh: AbstractMesh;
  private readonly muzzleFlash: AbstractMesh;
  private readonly muzzleLight: PointLight;
  private readonly audio = new PlaceholderWeaponAudio();
  private readonly tracerMaterial: StandardMaterial;
  private readonly impactMaterial: StandardMaterial;
  private readonly weaponMaterial: StandardMaterial;
  private readonly transientEffects: TimedEffect[] = [];
  private readonly weaponDetailMeshes: AbstractMesh[] = [];
  private primarySlot: WeaponSlot | null = null;
  private sidearmSlot: WeaponSlot = this.createSlot("pistol", {}, 24);
  private meleeSlot: WeaponSlot | null = null;
  private activeSlotIndex: 1 | 2 | 3 = 2;
  private reloadTimer = 0;
  private meleeCooldownTimer = 0;
  private muzzleFlashTimer = 0;
  private dryFireTimer = 0;
  private recoilBloomTimer = 0;
  private hipfireSpreadMultiplier = 1;
  private laserActive = false;
  private lastShot: WeaponShotDebugState = {
    fired: false,
    hit: false,
    hitMeshName: null,
    damageDealt: 0,
    hitZone: null,
    distance: 0,
    weaponName: weaponDefinitions.pistol.name,
    laserActive: false,
  };
  private activeDurabilityState: WeaponDurabilityState = {
    weaponId: "pistol",
    durability: 100,
    jammed: false,
    clearingJam: false,
    clearProgress: 0,
    jamWarning: false,
    accuracyMultiplier: 1,
    recoilMultiplier: 1,
    adsTransitionMultiplier: 1,
    jamChance: 0,
  };
  private state: WeaponState = this.createState(Vector3.Forward(), false);

  public constructor(
    private readonly scene: Scene,
    private readonly owner: PlayerCharacter,
    private readonly camera: UniversalCamera,
    private readonly cameraRig: ThirdPersonCameraRig,
    private readonly settingsManager: SettingsManager,
    private readonly durabilitySystem: WeaponDurabilitySystem,
    private readonly callbacks: WeaponCallbacks,
  ) {
    this.activeDurabilityState = this.durabilitySystem.getState(this.activeSlot.weaponId);
    this.weaponMaterial = new StandardMaterial("placeholder-weapon-material", scene);
    this.weaponMaterial.diffuseColor = new Color3(0.08, 0.16, 0.34);
    this.weaponMaterial.emissiveColor = themeConfig.colors.cyan.scale(0.08);
    this.weaponMaterial.specularColor = new Color3(0.34, 0.42, 0.5);

    const flashMaterial = new StandardMaterial("muzzle-flash-material", scene);
    flashMaterial.diffuseColor = new Color3(1, 0.72, 0.18);
    flashMaterial.emissiveColor = new Color3(1, 0.48, 0.08);

    this.tracerMaterial = new StandardMaterial("bullet-tracer-material", scene);
    this.tracerMaterial.emissiveColor = new Color3(1, 0.82, 0.28);
    this.tracerMaterial.disableLighting = true;

    this.impactMaterial = new StandardMaterial("bullet-impact-material", scene);
    this.impactMaterial.diffuseColor = new Color3(1, 0.86, 0.48);
    this.impactMaterial.emissiveColor = new Color3(0.85, 0.42, 0.08);

    this.weaponMesh = MeshBuilder.CreateBox("placeholder-weapon", { size: 1 }, scene);
    this.weaponMesh.parent = owner.weaponSocket;
    this.weaponMesh.position.set(0, 0, 0.3);
    this.weaponMesh.material = this.weaponMaterial;

    this.muzzleFlash = MeshBuilder.CreateSphere(
      "muzzle-flash",
      { diameter: 0.24, segments: 8 },
      scene,
    );
    this.muzzleFlash.parent = this.weaponMesh;
    this.muzzleFlash.position.z = 0.44;
    this.muzzleFlash.material = flashMaterial;
    this.muzzleFlash.setEnabled(false);

    this.muzzleLight = new PointLight("muzzle-light", Vector3.Zero(), scene);
    this.muzzleLight.parent = this.weaponMesh;
    this.muzzleLight.position.z = 0.48;
    this.muzzleLight.diffuse = new Color3(1, 0.68, 0.24);
    this.muzzleLight.intensity = 0;
    this.muzzleLight.range = 5;
    this.applyWeaponMesh();
  }

  public get snapshot(): WeaponState {
    return {
      ...this.state,
      aimDirection: this.state.aimDirection.clone(),
    };
  }

  public applyWrapColor(color: Color3): void {
    this.weaponMaterial.diffuseColor = Color3.Lerp(new Color3(0.08, 0.16, 0.34), color, 0.32);
    this.weaponMaterial.emissiveColor = color.scale(0.12);
  }

  public update(
    dt: number,
    input: InputSnapshot,
    aimDirection: Vector3,
    visibilityTools?: VisibilityToolState,
  ): void {
    this.hipfireSpreadMultiplier = visibilityTools?.hipfireSpreadMultiplier ?? 1;
    this.laserActive = visibilityTools?.laserOn ?? false;
    this.activeSlot.fireRate.update(dt);
    this.activeDurabilityState = this.durabilitySystem.update(
      dt,
      this.activeSlot.weaponId,
      input.clearJamHeld || input.clearJamPressed,
    );
    this.syncHandlingModifiers();
    this.dryFireTimer = Math.max(0, this.dryFireTimer - dt);
    this.recoilBloomTimer = Math.max(0, this.recoilBloomTimer - dt);
    this.meleeCooldownTimer = Math.max(0, this.meleeCooldownTimer - dt);
    this.updateReload(dt);
    this.updateMuzzleFlash(dt);
    this.updateTransientEffects(dt);

    const clearingWeapon = this.activeDurabilityState.jammed || this.activeDurabilityState.clearingJam || input.clearJamHeld;

    if (input.weaponSlotPressed && !clearingWeapon) {
      this.equipSlot(input.weaponSlotPressed);
    }

    if (input.weaponSwapPressed && !clearingWeapon) {
      this.swapSlot();
    }

    if (input.reloadPressed && !clearingWeapon) {
      this.tryReload();
    }

    if (input.meleePressed) {
      this.tryMelee();
    }

    const weapon = this.activeWeapon;
    const wantsFire = weapon.automatic ? input.fireHeld : input.firePressed;

    if (wantsFire && weapon.id === "knife") {
      this.tryMelee();
    } else if (wantsFire) {
      this.tryFire(input.adsHeld);
    }

    this.state = this.createState(aimDirection, wantsFire);
  }

  public addReserveAmmo(amount: number): void {
    this.activeSlot.ammo.addReserve(amount);
    this.syncState(this.state.aimDirection);
  }

  public applyDeathWear(): void {
    this.durabilitySystem.applyDeathWear(this.activeSlot.weaponId);
    this.activeDurabilityState = this.durabilitySystem.getState(this.activeSlot.weaponId);
    this.syncState(this.state.aimDirection);
  }

  public repairWeapon(weaponId: WeaponId, spendScrap: (quantity: number) => boolean): string {
    const result = this.durabilitySystem.repairWithScrap(weaponId, spendScrap);
    this.activeDurabilityState = this.durabilitySystem.getState(this.activeSlot.weaponId);
    this.syncHandlingModifiers();
    this.syncState(this.state.aimDirection);
    return result.message;
  }

  public repairWeaponFully(weaponId: WeaponId, spendScrap: (quantity: number) => boolean): {
    repaired: boolean;
    message: string;
    scrapCost: number;
  } {
    const result = this.durabilitySystem.repairFullyWithScrap(weaponId, spendScrap);
    this.activeDurabilityState = this.durabilitySystem.getState(this.activeSlot.weaponId);
    this.syncHandlingModifiers();
    this.syncState(this.state.aimDirection);
    return {
      repaired: result.repaired,
      message: result.message,
      scrapCost: result.scrapCost,
    };
  }

  public repairWeaponFullyWithKit(weaponId: WeaponId): {
    repaired: boolean;
    message: string;
    scrapCost: number;
  } {
    const result = this.durabilitySystem.repairFullyWithKit(weaponId);
    this.activeDurabilityState = this.durabilitySystem.getState(this.activeSlot.weaponId);
    this.syncHandlingModifiers();
    this.syncState(this.state.aimDirection);
    return {
      repaired: result.repaired,
      message: result.message,
      scrapCost: result.scrapCost,
    };
  }

  public getFullRepairCost(weaponId: WeaponId): number {
    return this.durabilitySystem.getFullRepairCost(weaponId);
  }

  public getDurabilityState(weaponId: WeaponId): WeaponDurabilityState {
    return this.durabilitySystem.getState(weaponId);
  }

  public reset(): void {
    for (const effect of this.transientEffects) {
      effect.mesh.dispose();
    }

    this.transientEffects.length = 0;
    this.reloadTimer = 0;
    this.meleeCooldownTimer = 0;
    this.muzzleFlashTimer = 0;
    this.dryFireTimer = 0;
    this.recoilBloomTimer = 0;
    this.muzzleFlash.setEnabled(false);
    this.muzzleLight.intensity = 0;
    this.lastShot = {
      fired: false,
      hit: false,
      hitMeshName: null,
      damageDealt: 0,
      hitZone: null,
      distance: 0,
      weaponName: this.activeWeapon.name,
      laserActive: false,
    };
    this.syncState(Vector3.Forward());
  }

  public resetForRaid(loadout: RaidLoadout, reserveAmmo: number): void {
    this.reset();
    this.primarySlot = loadout.primaryWeaponId
      ? this.createSlot(loadout.primaryWeaponId, loadout.attachments, reserveAmmo)
      : null;
    this.sidearmSlot = this.createSlot(
      loadout.sidearmWeaponId,
      loadout.primaryWeaponId ? {} : loadout.attachments,
      Math.max(24, reserveAmmo),
    );
    this.meleeSlot = loadout.meleeWeaponId
      ? this.createSlot(loadout.meleeWeaponId, {}, 0)
      : null;
    this.activeSlotIndex = this.primarySlot ? 1 : 2;
    this.applyWeaponMesh();
    this.syncState(Vector3.Forward());
  }

  public dispose(): void {
    for (const effect of this.transientEffects) {
      effect.mesh.dispose();
    }

    this.weaponMesh.dispose(false, true);
    this.muzzleLight.dispose();
  }

  private tryFire(adsHeld: boolean): void {
    if (
      this.isReloading() ||
      this.activeDurabilityState.jammed ||
      this.activeDurabilityState.clearingJam ||
      !this.activeSlot.fireRate.ready
    ) {
      return;
    }

    if (!this.activeSlot.ammo.consumeRound()) {
      this.dryFire();
      return;
    }

    if (this.durabilitySystem.recordShot(this.activeSlot.weaponId, this.activeSlot.degradationMultiplier)) {
      this.activeDurabilityState = this.durabilitySystem.getState(this.activeSlot.weaponId);
      return;
    }

    this.activeSlot.fireRate.trigger();
    this.recoilBloomTimer = weaponConfig.recoilBloomDuration;
    this.audio.playGunshot();
    this.showMuzzleFlash();
    if (this.settingsManager.snapshot.graphics.cameraShake) {
      this.applyRecoil(adsHeld);
    }
    this.notifyShot();
    this.performShots(adsHeld);
  }

  private tryMelee(): void {
    if (this.isReloading() || this.meleeCooldownTimer > 0) {
      return;
    }

    this.meleeCooldownTimer = weaponConfig.meleeCooldown;
    const ray = this.camera.getForwardRay(weaponConfig.meleeRange);
    const hit = this.scene.pickWithRay(ray, (mesh) => this.canHitMesh(mesh));

    this.lastShot = {
      fired: true,
      hit: false,
      hitMeshName: hit?.pickedMesh?.name ?? null,
      damageDealt: 0,
      hitZone: null,
      distance: hit?.distance ?? weaponConfig.meleeRange,
      weaponName: `${this.activeWeapon.name} melee`,
      laserActive: this.laserActive,
    };

    if (!hit?.hit || !hit.pickedMesh || !hit.pickedPoint) {
      return;
    }

    this.spawnImpact(hit.pickedPoint);
    const metadata = getDamageableMetadata(hit.pickedMesh);

    if (!metadata) {
      return;
    }

    const result = metadata.target.applyDamage({
      amount: weaponConfig.meleeDamage,
      hitZone: metadata.hitZone,
      point: hit.pickedPoint,
      sourceEntityId: "local-player",
    });
    this.lastShot = {
      fired: true,
      hit: result.appliedDamage > 0,
      hitMeshName: hit.pickedMesh.name,
      damageDealt: result.appliedDamage,
      hitZone: metadata.hitZone,
      distance: hit.distance,
      weaponName: `${this.activeWeapon.name} melee`,
      laserActive: this.laserActive,
    };
    this.callbacks.onDamage(result);
  }

  private notifyShot(): void {
    const weapon = this.activeWeapon;
    const ray = this.camera.getForwardRay(weapon.effectiveRange);
    this.callbacks.onShot?.({
      origin: { x: ray.origin.x, y: ray.origin.y, z: ray.origin.z },
      direction: { x: ray.direction.x, y: ray.direction.y, z: ray.direction.z },
      damage: weapon.damage,
      range: weapon.effectiveRange,
    });
  }

  private performShots(adsHeld: boolean): void {
    const weapon = this.activeWeapon;

    for (let i = 0; i < weapon.pellets; i += 1) {
      this.performHitscan(weapon, adsHeld);
    }
  }

  private performHitscan(weapon: RuntimeWeaponDefinition, adsHeld: boolean): void {
    const ray = this.createWeaponRay(weapon, adsHeld);
    const hit = this.scene.pickWithRay(ray, (mesh) => this.canHitMesh(mesh));
    const impactPoint = hit?.hit && hit.pickedPoint
      ? hit.pickedPoint
      : ray.origin.add(ray.direction.scale(weapon.effectiveRange));

    // Camera-center hitscan is the gameplay source of truth. The laser sight is visual only.
    this.spawnTracer(this.muzzleFlash.getAbsolutePosition(), impactPoint);
    this.lastShot = {
      fired: true,
      hit: false,
      hitMeshName: hit?.pickedMesh?.name ?? null,
      damageDealt: 0,
      hitZone: null,
      distance: hit?.distance ?? weapon.effectiveRange,
      weaponName: weapon.name,
      laserActive: this.laserActive,
    };

    if (!hit?.hit || !hit.pickedMesh || !hit.pickedPoint) {
      return;
    }

    this.spawnImpact(hit.pickedPoint);
    const metadata = getDamageableMetadata(hit.pickedMesh);

    if (!metadata) {
      return;
    }

    const damage = metadata.hitZone === "head"
      ? weapon.damage * weapon.headshotMultiplier
      : metadata.hitZone === "legs"
        ? weapon.damage * 0.75
        : weapon.damage;
    const result = metadata.target.applyDamage({
      amount: damage,
      hitZone: metadata.hitZone,
      point: hit.pickedPoint,
      sourceEntityId: "local-player",
    });
    this.lastShot = {
      fired: true,
      hit: result.appliedDamage > 0,
      hitMeshName: hit.pickedMesh.name,
      damageDealt: result.appliedDamage,
      hitZone: metadata.hitZone,
      distance: hit.distance,
      weaponName: weapon.name,
      laserActive: this.laserActive,
    };

    this.callbacks.onDamage(result);
  }

  private canHitMesh(mesh: AbstractMesh): boolean {
    const metadata = mesh.metadata as { gameplayTag?: string; entityType?: string } | null | undefined;
    const tag = metadata?.gameplayTag;

    if (
      tag === "loot-container" ||
      tag === "loot-rarity-marker" ||
      tag === "extraction-zone" ||
      tag === "extraction-beam" ||
      tag === "objective-marker" ||
      tag === "traversal-prompt" ||
      tag?.includes("debug")
    ) {
      return false;
    }

    return mesh !== this.weaponMesh &&
      mesh !== this.muzzleFlash &&
      mesh !== this.owner.root &&
      metadata?.entityType !== "player" &&
      metadata?.entityType !== "player-socket" &&
      mesh.isEnabled();
  }

  private createWeaponRay(weapon: RuntimeWeaponDefinition, adsHeld: boolean): Ray {
    const baseRay = this.camera.getForwardRay(weapon.effectiveRange);
    const crouchAccuracyMultiplier = this.owner.state.crouched ? 0.86 : 1;
    const spreadMultiplier = (adsHeld ? weapon.adsSpreadMultiplier : this.hipfireSpreadMultiplier) * crouchAccuracyMultiplier;
    const spread = (weapon.spreadDegrees * spreadMultiplier * this.activeDurabilityState.accuracyMultiplier * Math.PI) / 180;

    if (spread <= 0.0001) {
      return baseRay;
    }

    const right = Vector3.Cross(baseRay.direction, Vector3.Up()).normalize();
    const up = Vector3.Cross(right, baseRay.direction).normalize();
    const x = (Math.random() - 0.5) * spread;
    const y = (Math.random() - 0.5) * spread;
    const direction = baseRay.direction
      .add(right.scale(Math.tan(x)))
      .add(up.scale(Math.tan(y)))
      .normalize();

    return new Ray(baseRay.origin, direction, weapon.effectiveRange);
  }

  private tryReload(): void {
    if (this.isReloading() || !this.activeSlot.ammo.canReload()) {
      return;
    }

    this.reloadTimer = this.activeWeapon.reloadTime;
    this.audio.playReload();
  }

  private updateReload(dt: number): void {
    if (!this.isReloading()) {
      return;
    }

    this.reloadTimer = Math.max(0, this.reloadTimer - dt);

    if (this.reloadTimer > 0) {
      return;
    }

    this.activeSlot.ammo.reload();
  }

  private isReloading(): boolean {
    return this.reloadTimer > 0;
  }

  private dryFire(): void {
    this.dryFireTimer = weaponConfig.dryFireFeedbackDuration;
    this.audio.playDryFire();
    this.callbacks.onDryFire();
  }

  private applyRecoil(adsHeld: boolean): void {
    const weapon = this.activeWeapon;
    const adsFactor = adsHeld ? this.cameraRig.adsBlend : 0;
    const adsRecoil = weapon.hipfireRecoil * weapon.adsRecoilMultiplier;
    const vertical = this.lerp(weapon.hipfireRecoil, adsRecoil, adsFactor);
    const horizontalScale = this.lerp(1, 0.45, adsFactor);
    const horizontal = (Math.random() - 0.5) * weapon.horizontalRecoil * horizontalScale;
    const recoilMultiplier = this.activeDurabilityState.recoilMultiplier;
    this.cameraRig.addRecoil(vertical * recoilMultiplier, horizontal * recoilMultiplier);
  }

  private showMuzzleFlash(): void {
    this.muzzleFlashTimer = weaponConfig.muzzleFlashDuration;
    this.muzzleFlash.setEnabled(true);
    this.muzzleLight.intensity = 2.4;
  }

  private updateMuzzleFlash(dt: number): void {
    this.muzzleFlashTimer = Math.max(0, this.muzzleFlashTimer - dt);

    if (this.muzzleFlashTimer > 0) {
      return;
    }

    this.muzzleFlash.setEnabled(false);
    this.muzzleLight.intensity = 0;
  }

  private spawnTracer(start: Vector3, end: Vector3): void {
    const direction = end.subtract(start).normalize();
    const tracer = MeshBuilder.CreateLines(
      "bullet-tracer",
      { points: [start.add(direction.scale(0.8)), end] },
      this.scene,
    );
    tracer.color = new Color3(1, 0.78, 0.25);
    tracer.material = this.tracerMaterial;
    this.transientEffects.push({ mesh: tracer, ttl: 0.045 });
  }

  private spawnImpact(position: Vector3): void {
    const impact = MeshBuilder.CreateSphere(
      "bullet-impact",
      { diameter: 0.16, segments: 8 },
      this.scene,
    );
    impact.position.copyFrom(position);
    impact.material = this.impactMaterial;
    this.transientEffects.push({ mesh: impact, ttl: 0.16 });

    for (let i = 0; i < 3; i += 1) {
      const chip = MeshBuilder.CreateBox(
        "bullet-impact-chip",
        { size: 0.055 + Math.random() * 0.045 },
        this.scene,
      );
      chip.position.copyFrom(position.add(new Vector3((Math.random() - 0.5) * 0.22, Math.random() * 0.18, (Math.random() - 0.5) * 0.22)));
      chip.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      chip.material = this.impactMaterial;
      this.transientEffects.push({ mesh: chip, ttl: 0.22 });
    }
  }

  private updateTransientEffects(dt: number): void {
    for (let i = this.transientEffects.length - 1; i >= 0; i -= 1) {
      const effect = this.transientEffects[i];
      const nextTtl = effect.ttl - dt;

      if (nextTtl > 0) {
        this.transientEffects[i] = { ...effect, ttl: nextTtl };
        continue;
      }

      effect.mesh.dispose();
      this.transientEffects.splice(i, 1);
    }
  }

  private equipSlot(slotIndex: 1 | 2 | 3): void {
    if (slotIndex === 1 && !this.primarySlot) {
      return;
    }

    if (slotIndex === 3 && !this.meleeSlot) {
      return;
    }

    if (this.activeSlotIndex === slotIndex) {
      return;
    }

    this.reloadTimer = 0;
    this.activeSlotIndex = slotIndex;
    this.applyWeaponMesh();
  }

  private swapSlot(): void {
    if (this.activeSlotIndex === 1) {
      this.equipSlot(2);
      return;
    }

    if (this.activeSlotIndex === 2 && this.meleeSlot) {
      this.equipSlot(3);
      return;
    }

    this.equipSlot(this.primarySlot ? 1 : 2);
  }

  private createSlot(
    weaponId: WeaponId,
    attachments: RaidLoadout["attachments"],
    reserveAmmo: number,
  ): WeaponSlot {
    const weapon = buildRuntimeWeaponDefinition(weaponId, attachments);
    return {
      weaponId,
      weapon,
      ammo: new AmmoPool(weapon.magazineSize, weapon.magazineSize, reserveAmmo),
      fireRate: new FireRateGate(weapon.fireRateRpm),
      degradationMultiplier: this.calculateAttachmentDegradationMultiplier(attachments),
    };
  }

  private applyWeaponMesh(): void {
    const mesh = this.activeWeapon.mesh;
    this.weaponMesh.scaling.set(mesh.width, mesh.height, mesh.depth);
    this.rebuildWeaponVisualDetails();
    this.weaponMesh.metadata = {
      gameplayTag: "weapon",
      equippedId: this.activeWeapon.id,
    };
    this.muzzleFlash.position.z = mesh.depth / 2 + 0.08;
    this.muzzleLight.position.z = mesh.depth / 2 + 0.12;
    this.activeDurabilityState = this.durabilitySystem.getState(this.activeSlot.weaponId);
    this.syncHandlingModifiers();
  }

  private rebuildWeaponVisualDetails(): void {
    for (const mesh of this.weaponDetailMeshes) {
      mesh.dispose();
    }
    this.weaponDetailMeshes.length = 0;

    const weapon = this.activeWeapon;
    const addBox = (name: string, position: Vector3, scale: Vector3): void => {
      const detail = MeshBuilder.CreateBox(`${weapon.id}-${name}`, { size: 1 }, this.scene);
      detail.parent = this.weaponMesh;
      detail.position.copyFrom(position);
      detail.scaling.copyFrom(scale);
      detail.material = this.weaponMaterial;
      detail.isPickable = false;
      detail.metadata = { gameplayTag: "weapon-detail", equippedId: weapon.id };
      this.weaponDetailMeshes.push(detail);
    };

    if (weapon.id === "pistol") {
      addBox("slide", new Vector3(0, 0.09, 0.08), new Vector3(0.9, 0.24, 0.72));
      addBox("grip", new Vector3(0, -0.18, -0.16), new Vector3(0.48, 0.72, 0.28));
      return;
    }

    if (weapon.id === "burst-pistol") {
      addBox("burst-slide", new Vector3(0, 0.09, 0.12), new Vector3(0.92, 0.22, 0.78));
      addBox("ported-barrel", new Vector3(0, 0.1, 0.42), new Vector3(0.44, 0.16, 0.34));
      addBox("grip", new Vector3(0, -0.18, -0.16), new Vector3(0.48, 0.72, 0.28));
      return;
    }

    if (weapon.id === "revolver") {
      addBox("cylinder", new Vector3(0, 0.02, 0.1), new Vector3(0.58, 0.44, 0.34));
      addBox("barrel", new Vector3(0, 0.05, 0.48), new Vector3(0.3, 0.24, 0.48));
      addBox("grip", new Vector3(0, -0.2, -0.2), new Vector3(0.48, 0.72, 0.26));
      return;
    }

    if (weapon.id === "compact-smg") {
      addBox("wire-stock", new Vector3(0, 0.02, -0.38), new Vector3(0.74, 0.24, 0.32));
      addBox("stub-barrel", new Vector3(0, 0.02, 0.48), new Vector3(0.42, 0.32, 0.34));
      addBox("short-magazine", new Vector3(0, -0.34, 0.04), new Vector3(0.32, 0.68, 0.18));
      return;
    }

    if (weapon.id === "knife") {
      addBox("blade", new Vector3(0, 0.02, 0.32), new Vector3(0.22, 0.06, 0.72));
      addBox("handle", new Vector3(0, -0.02, -0.18), new Vector3(0.18, 0.14, 0.32));
      return;
    }

    if (weapon.id === "smg") {
      addBox("compact-stock", new Vector3(0, 0.02, -0.42), new Vector3(0.82, 0.42, 0.36));
      addBox("short-barrel", new Vector3(0, 0.02, 0.55), new Vector3(0.46, 0.38, 0.42));
      addBox("magazine", new Vector3(0, -0.38, 0.08), new Vector3(0.36, 0.82, 0.2));
      return;
    }

    if (weapon.id === "assault-rifle") {
      addBox("stock", new Vector3(0, 0, -0.58), new Vector3(0.92, 0.42, 0.34));
      addBox("tactical-barrel", new Vector3(0, 0.02, 0.72), new Vector3(0.44, 0.36, 0.64));
      addBox("curved-magazine", new Vector3(0, -0.42, 0.05), new Vector3(0.34, 0.86, 0.24));
      addBox("top-rail", new Vector3(0, 0.34, 0.12), new Vector3(0.42, 0.12, 0.78));
      return;
    }

    if (weapon.id === "shotgun") {
      addBox("heavy-stock", new Vector3(0, 0, -0.54), new Vector3(0.95, 0.5, 0.38));
      addBox("thick-barrel", new Vector3(0, 0.06, 0.7), new Vector3(0.52, 0.5, 0.74));
      addBox("pump", new Vector3(0, -0.28, 0.36), new Vector3(0.56, 0.24, 0.54));
      return;
    }

    addBox("heavy-stock", new Vector3(0, 0, -0.72), new Vector3(0.92, 0.46, 0.42));
    addBox("long-barrel", new Vector3(0, 0.03, 0.92), new Vector3(0.32, 0.32, 0.9));
    addBox("scope", new Vector3(0, 0.42, 0.1), new Vector3(0.44, 0.24, 0.58));
    addBox("bipod-lug", new Vector3(0, -0.28, 0.58), new Vector3(0.5, 0.14, 0.2));
  }

  private syncHandlingModifiers(): void {
    this.cameraRig.setHandlingModifiers({
      adsFovOffsetDegrees: this.activeWeapon.adsFovOffsetDegrees,
      adsTransitionMultiplier: this.activeWeapon.adsTransitionMultiplier *
        this.activeDurabilityState.adsTransitionMultiplier,
      adsSensitivityMultiplier: this.activeWeapon.adsSensitivityMultiplier,
    });
  }

  private calculateAttachmentDegradationMultiplier(attachments: RaidLoadout["attachments"]): number {
    const equippedCount = Object.values(attachments).filter(Boolean).length;
    return Math.max(0.82, 1 - equippedCount * 0.04);
  }

  private syncState(aimDirection: Vector3): void {
    this.state = this.createState(aimDirection, false);
  }

  private createState(aimDirection: Vector3, triggerHeld: boolean): WeaponState {
    const weapon = this.activeWeapon;
    return {
      equippedId: weapon.id,
      equippedName: weapon.name,
      aimDirection: aimDirection.clone(),
      triggerHeld,
      ammoInMagazine: this.activeSlot.ammo.magazineAmmo,
      reserveAmmo: this.activeSlot.ammo.reserveAmmo,
      reloading: this.isReloading(),
      jammed: this.activeDurabilityState.jammed,
      clearingJam: this.activeDurabilityState.clearingJam,
      jamClearProgress: this.activeDurabilityState.clearProgress,
      jamWarning: this.activeDurabilityState.jamWarning,
      durability: this.activeDurabilityState.durability,
      jamChance: this.activeDurabilityState.jamChance,
      ready: this.activeSlot.fireRate.ready && !this.isReloading() && !this.activeDurabilityState.jammed,
      scoped: weapon.scoped,
      dryFireFeedback: this.dryFireTimer > 0,
      recoilBloom: this.recoilBloomTimer / weaponConfig.recoilBloomDuration,
      noiseDetectionMultiplier: weapon.detectionNoiseMultiplier,
      lastShot: { ...this.lastShot },
    };
  }

  private get activeSlot(): WeaponSlot {
    if (this.activeSlotIndex === 1 && this.primarySlot) {
      return this.primarySlot;
    }

    if (this.activeSlotIndex === 3 && this.meleeSlot) {
      return this.meleeSlot;
    }

    return this.sidearmSlot;
  }

  private get activeWeapon(): RuntimeWeaponDefinition {
    return this.activeSlot.weapon;
  }

  private lerp(from: number, to: number, amount: number): number {
    return from + (to - from) * amount;
  }
}
