import type { AbstractMesh, Vector3 } from "@babylonjs/core";

export type HitZone = "body" | "head" | "legs";

export type DamageEvent = Readonly<{
  amount: number;
  hitZone: HitZone;
  point: Vector3;
  sourceEntityId: string;
}>;

export type DamageResult = Readonly<{
  appliedDamage: number;
  killed: boolean;
  hitZone: HitZone;
  point: Vector3;
}>;

export type Damageable = {
  applyDamage(event: DamageEvent): DamageResult;
};

export type DamageableMetadata = Readonly<{
  gameplayTag: "damageable";
  hitZone: HitZone;
  target: Damageable;
}>;

export const getDamageableMetadata = (mesh: AbstractMesh): DamageableMetadata | null => {
  const metadata = mesh.metadata as Partial<DamageableMetadata> | null | undefined;

  if (metadata?.gameplayTag !== "damageable" || !metadata.target || !metadata.hitZone) {
    return null;
  }

  return metadata as DamageableMetadata;
};
