export type WeaponId = "pistol" | "burst-pistol" | "revolver" | "compact-smg" | "smg" | "shotgun" | "assault-rifle" | "rifle" | "knife";
export type AmmoType = "light" | "shells" | "rifle" | "sniper";

export type WeaponDefinition = Readonly<{
  id: WeaponId;
  name: string;
  damage: number;
  headshotMultiplier: number;
  fireRateRpm: number;
  automatic: boolean;
  magazineSize: number;
  reloadTime: number;
  hipfireRecoil: number;
  adsRecoilMultiplier: number;
  horizontalRecoil: number;
  spreadDegrees: number;
  adsSpreadMultiplier: number;
  effectiveRange: number;
  ammoType: AmmoType;
  pellets: number;
  scoped?: boolean;
  adsFovOffsetDegrees?: number;
  adsTransitionMultiplier?: number;
  adsSensitivityMultiplier?: number;
  mesh: Readonly<{
    width: number;
    height: number;
    depth: number;
  }>;
}>;

export type RuntimeWeaponDefinition = WeaponDefinition & Readonly<{
  detectionNoiseMultiplier: number;
  adsFovOffsetDegrees: number;
  adsTransitionMultiplier: number;
  scoped: boolean;
  adsSensitivityMultiplier: number;
}>;

export const weaponDefinitions: Record<WeaponId, WeaponDefinition> = {
  pistol: {
    id: "pistol",
    name: "Pistol",
    damage: 25,
    headshotMultiplier: 2,
    fireRateRpm: 300,
    automatic: false,
    magazineSize: 12,
    reloadTime: 1.4,
    hipfireRecoil: 0.08,
    adsRecoilMultiplier: 0.44,
    horizontalRecoil: 0.018,
    spreadDegrees: 0.7,
    adsSpreadMultiplier: 0.32,
    effectiveRange: 90,
    ammoType: "light",
    pellets: 1,
    mesh: { width: 0.16, height: 0.16, depth: 0.72 },
  },
  "burst-pistol": {
    id: "burst-pistol",
    name: "Burst Pistol",
    damage: 18,
    headshotMultiplier: 1.9,
    fireRateRpm: 520,
    automatic: true,
    magazineSize: 15,
    reloadTime: 1.55,
    hipfireRecoil: 0.075,
    adsRecoilMultiplier: 0.42,
    horizontalRecoil: 0.022,
    spreadDegrees: 0.82,
    adsSpreadMultiplier: 0.34,
    effectiveRange: 78,
    ammoType: "light",
    pellets: 1,
    mesh: { width: 0.16, height: 0.16, depth: 0.78 },
  },
  revolver: {
    id: "revolver",
    name: "Revolver",
    damage: 42,
    headshotMultiplier: 2,
    fireRateRpm: 165,
    automatic: false,
    magazineSize: 6,
    reloadTime: 1.9,
    hipfireRecoil: 0.13,
    adsRecoilMultiplier: 0.48,
    horizontalRecoil: 0.026,
    spreadDegrees: 0.92,
    adsSpreadMultiplier: 0.28,
    effectiveRange: 88,
    ammoType: "light",
    pellets: 1,
    mesh: { width: 0.17, height: 0.17, depth: 0.82 },
  },
  "compact-smg": {
    id: "compact-smg",
    name: "Compact SMG",
    damage: 13,
    headshotMultiplier: 1.75,
    fireRateRpm: 830,
    automatic: true,
    magazineSize: 24,
    reloadTime: 1.55,
    hipfireRecoil: 0.06,
    adsRecoilMultiplier: 0.55,
    horizontalRecoil: 0.028,
    spreadDegrees: 1.45,
    adsSpreadMultiplier: 0.58,
    effectiveRange: 46,
    ammoType: "light",
    pellets: 1,
    mesh: { width: 0.17, height: 0.15, depth: 0.82 },
  },
  smg: {
    id: "smg",
    name: "SMG",
    damage: 16,
    headshotMultiplier: 1.8,
    fireRateRpm: 760,
    automatic: true,
    magazineSize: 28,
    reloadTime: 1.65,
    hipfireRecoil: 0.052,
    adsRecoilMultiplier: 0.52,
    horizontalRecoil: 0.026,
    spreadDegrees: 1.25,
    adsSpreadMultiplier: 0.55,
    effectiveRange: 52,
    ammoType: "light",
    pellets: 1,
    mesh: { width: 0.18, height: 0.16, depth: 0.92 },
  },
  shotgun: {
    id: "shotgun",
    name: "Shotgun",
    damage: 13,
    headshotMultiplier: 1.35,
    fireRateRpm: 85,
    automatic: false,
    magazineSize: 6,
    reloadTime: 2.15,
    hipfireRecoil: 0.18,
    adsRecoilMultiplier: 0.72,
    horizontalRecoil: 0.045,
    spreadDegrees: 5.4,
    adsSpreadMultiplier: 0.68,
    effectiveRange: 34,
    ammoType: "shells",
    pellets: 8,
    mesh: { width: 0.2, height: 0.18, depth: 1.22 },
  },
  "assault-rifle": {
    id: "assault-rifle",
    name: "Assault Rifle",
    damage: 22,
    headshotMultiplier: 2,
    fireRateRpm: 600,
    automatic: true,
    magazineSize: 30,
    reloadTime: 2.1,
    hipfireRecoil: 0.105,
    adsRecoilMultiplier: 0.5,
    horizontalRecoil: 0.027,
    spreadDegrees: 0.82,
    adsSpreadMultiplier: 0.32,
    effectiveRange: 105,
    ammoType: "rifle",
    pellets: 1,
    mesh: { width: 0.19, height: 0.16, depth: 1.18 },
  },
  rifle: {
    id: "rifle",
    name: "Sniper Rifle",
    damage: 90,
    headshotMultiplier: 2,
    fireRateRpm: 55,
    automatic: false,
    magazineSize: 5,
    reloadTime: 2.8,
    hipfireRecoil: 0.22,
    adsRecoilMultiplier: 0.42,
    horizontalRecoil: 0.038,
    spreadDegrees: 4.8,
    adsSpreadMultiplier: 0.045,
    effectiveRange: 180,
    ammoType: "sniper",
    pellets: 1,
    scoped: true,
    adsFovOffsetDegrees: -27,
    adsSensitivityMultiplier: 0.35,
    adsTransitionMultiplier: 0.72,
    mesh: { width: 0.18, height: 0.16, depth: 1.42 },
  },
  knife: {
    id: "knife",
    name: "Suit Knife",
    damage: 40,
    headshotMultiplier: 1,
    fireRateRpm: 120,
    automatic: false,
    magazineSize: 1,
    reloadTime: 0,
    hipfireRecoil: 0,
    adsRecoilMultiplier: 1,
    horizontalRecoil: 0,
    spreadDegrees: 0,
    adsSpreadMultiplier: 1,
    effectiveRange: 2.15,
    ammoType: "light",
    pellets: 1,
    mesh: { width: 0.08, height: 0.1, depth: 0.62 },
  },
};

export const weaponLootTypes: Record<WeaponId, "weapon-pistol" | "weapon-burst-pistol" | "weapon-revolver" | "weapon-compact-smg" | "weapon-smg" | "weapon-shotgun" | "weapon-assault-rifle" | "weapon-rifle" | "weapon-knife"> = {
  pistol: "weapon-pistol",
  "burst-pistol": "weapon-burst-pistol",
  revolver: "weapon-revolver",
  "compact-smg": "weapon-compact-smg",
  smg: "weapon-smg",
  shotgun: "weapon-shotgun",
  "assault-rifle": "weapon-assault-rifle",
  rifle: "weapon-rifle",
  knife: "weapon-knife",
};

export const weaponIdFromLootType = (type: string): WeaponId | null => {
  if (type === "weapon-pistol") {
    return "pistol";
  }

  if (type === "weapon-smg") {
    return "smg";
  }

  if (type === "weapon-burst-pistol") {
    return "burst-pistol";
  }

  if (type === "weapon-revolver") {
    return "revolver";
  }

  if (type === "weapon-compact-smg") {
    return "compact-smg";
  }

  if (type === "weapon-shotgun") {
    return "shotgun";
  }

  if (type === "weapon-assault-rifle") {
    return "assault-rifle";
  }

  if (type === "weapon-rifle") {
    return "rifle";
  }

  if (type === "weapon-knife") {
    return "knife";
  }

  return null;
};
