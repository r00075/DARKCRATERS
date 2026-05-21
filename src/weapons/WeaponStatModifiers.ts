import { attachmentDefinitions, type AttachmentLoadout } from "./AttachmentDefinitions";
import { weaponDefinitions, type RuntimeWeaponDefinition, type WeaponId } from "./WeaponDefinitions";

export const buildRuntimeWeaponDefinition = (
  weaponId: WeaponId,
  attachments: AttachmentLoadout,
): RuntimeWeaponDefinition => {
  const base = weaponDefinitions[weaponId];
  let damage = base.damage;
  let magazineSize = base.magazineSize;
  let reloadTime = base.reloadTime;
  let hipfireRecoil = base.hipfireRecoil;
  let horizontalRecoil = base.horizontalRecoil;
  let spreadDegrees = base.spreadDegrees;
  let adsSpreadMultiplier = base.adsSpreadMultiplier;
  let effectiveRange = base.effectiveRange;
  let detectionNoiseMultiplier = 1;
  let adsFovOffsetDegrees = base.adsFovOffsetDegrees ?? 0;
  let adsTransitionMultiplier = base.adsTransitionMultiplier ?? 1;
  let adsSensitivityMultiplier = base.adsSensitivityMultiplier ?? 1;

  for (const attachmentId of Object.values(attachments)) {
    if (!attachmentId) {
      continue;
    }

    const modifiers = attachmentDefinitions[attachmentId].modifiers;
    damage *= modifiers.damageMultiplier ?? 1;
    magazineSize *= modifiers.magazineMultiplier ?? 1;
    reloadTime *= modifiers.reloadTimeMultiplier ?? 1;
    hipfireRecoil *= modifiers.verticalRecoilMultiplier ?? 1;
    horizontalRecoil *= modifiers.horizontalRecoilMultiplier ?? 1;
    spreadDegrees *= modifiers.spreadMultiplier ?? 1;
    adsSpreadMultiplier *= modifiers.adsSpreadMultiplier ?? 1;
    effectiveRange *= modifiers.rangeMultiplier ?? 1;
    detectionNoiseMultiplier *= modifiers.detectionNoiseMultiplier ?? 1;
    adsFovOffsetDegrees += modifiers.adsFovOffsetDegrees ?? 0;
    adsTransitionMultiplier *= modifiers.adsTransitionMultiplier ?? 1;
  }

  return {
    ...base,
    damage: Math.round(damage),
    magazineSize: Math.max(1, Math.round(magazineSize)),
    reloadTime,
    hipfireRecoil,
    horizontalRecoil,
    spreadDegrees,
    adsSpreadMultiplier,
    effectiveRange,
    detectionNoiseMultiplier,
    adsFovOffsetDegrees,
    adsTransitionMultiplier,
    scoped: base.scoped ?? false,
    adsSensitivityMultiplier,
  };
};
