import {
  Color3,
  DirectionalLight,
  Engine,
  HemisphericLight,
  Scene,
  UniversalCamera,
  Vector3,
} from "@babylonjs/core";
import "@babylonjs/core/Collisions/collisionCoordinator";
import { EnemyDirector } from "../ai/EnemyDirector";
import type { EnemyType } from "../ai/EnemyTypes";
import { PlaceholderWeaponAudio } from "../audio/PlaceholderWeaponAudio";
import { ShipAudioManager } from "../audio/ShipAudioManager";
import {
  getCurrentMusicState,
  playMenuMusic,
  playTychoStarMusic,
  setMusicSettingsProvider,
  stopMusic,
  updateCurrentMusicVolume,
} from "../audio/darkCratersAudio";
import { classDefinitions, getClassSuitModelCandidates, type ClassId } from "../classes/ClassDefinitions";
import { ClassManager } from "../classes/ClassManager";
import { AimAssistSystem } from "../combat/AimAssistSystem";
import type { DamageResult } from "../combat/Damageable";
import { PlayerHealth } from "../combat/PlayerHealth";
import { PlayerStatus } from "../combat/PlayerStatus";
import {
  ContractManager,
  describeContractTarget,
  type ContractRewardGrant,
} from "../contracts/ContractManager";
import {
  cosmeticCategories,
  cosmeticCategoryLabels,
  CosmeticManager,
  type CosmeticCategory,
  type CosmeticId,
} from "../cosmetics/CosmeticManager";
import { CoverController, type CoverState } from "../cover/CoverController";
import {
  CraftingManager,
  craftingRecipes,
  craftingUpgrades,
  maxWorkbenchLevel,
  type CraftingRecipeId,
  type CraftingUpgradeId,
} from "../crafting/CraftingManager";
import { EnvironmentManager, type EnvironmentState } from "../environment/EnvironmentManager";
import { HQManager, type HQStationId } from "../hq/HQManager";
import { HabitatRunnerPreview } from "../hq/HabitatRunnerPreview";
import { ShipDashboardPreview } from "../hq/ShipDashboardPreview";
import { getWeaponPreviewConfig, WeaponBenchPreview } from "../hq/WeaponBenchPreview";
import type { DynamicEventState } from "../raid/DynamicEventDirector";
import { DynamicEventDirector } from "../raid/DynamicEventDirector";
import type { ExtractionState } from "../raid/ExtractionController";
import { ExtractionController } from "../raid/ExtractionController";
import { getItemDefinition, getItemUseProfile, itemDefinitions, type LootType } from "../raid/ItemDefinitions";
import { Loadout, loadoutConfig, type RaidLoadout } from "../raid/Loadout";
import { InventoryManager } from "../raid/InventoryManager";
import { HeavyCargoManager, heliumDrillCoreHeavyCargoId, type HeavyCargoViewState } from "../raid/HeavyCargoManager";
import {
  equipmentSlotLabels,
  loadoutFilters,
  LoadoutManager,
  type EquipmentSlot,
  type LoadoutFilter,
  type LoadoutManagerState,
} from "../raid/LoadoutManager";
import { LootDirector } from "../raid/LootDirector";
import { LumenRevealSystem, type LumenRevealResult, type RevealedSignal } from "../raid/LumenRevealSystem";
import type { ObjectiveState } from "../raid/ObjectiveDirector";
import { ObjectiveDirector } from "../raid/ObjectiveDirector";
import { PersistentStash } from "../raid/PersistentStash";
import {
  POIObjectiveManager,
  type ContractPOIObjectiveTarget,
  type POIObjectiveState,
} from "../raid/POIObjectiveManager";
import { RaidInventory, type LootEvent, type LootStack } from "../raid/RaidInventory";
import {
  defaultRaidDefinition,
  raidDefinitionById,
  raidDefinitions,
  type RaidDefinition,
  type RaidTierId,
} from "../raid/RaidDefinitions";
import {
  emptyRaidResultSummary,
  getRaidResultTitle,
  type RaidResultKind,
  type RaidResultSummary,
} from "../raid/RaidResultSummary";
import { RaidTimer, type RaidTimerState } from "../raid/RaidTimer";
import { Reputation } from "../raid/Reputation";
import {
  controllerButtonLabels,
  SettingsManager,
  type ControllerAction,
  type KeyboardAction,
  type SettingsTab,
} from "../settings/SettingsManager";
import { LandedShip } from "../ship/LandedShip";
import { OrbitalDeploymentScene } from "../ship/OrbitalDeploymentScene";
import { OrbitalDeploymentSequence, type OrbitalDeploymentSequenceState } from "../ship/OrbitalDeploymentSequence";
import { ShipManager, type LandingQuality, type ShipDepositResult, type ShipRepairChoice, type ShipState } from "../ship/ShipManager";
import { ShipModuleManager } from "../ship/ShipModuleManager";
import { NoiseSystem, type NoiseSystemState } from "../stealth/NoiseSystem";
import { TacticalToolManager, type TacticalToolState } from "../tactical/TacticalToolManager";
import { colorToCss, themeConfig } from "../theme/ThemeConfig";
import { TargetDummy } from "../combat/TargetDummy";
import { TraversalController, type TraversalState } from "../traversal/TraversalController";
import { PlayerCharacter } from "../world/PlayerCharacter";
import { ThirdPersonCameraRig } from "../camera/ThirdPersonCameraRig";
import { InputController, type InputMode, type InputSnapshot } from "../input/InputController";
import { clamp, yawToBasis } from "../math/angles";
import { createWorld, type WorldMap } from "../world/createWorld";
import { extractionZoneDefinitions, mapLayoutConfig, poiDefinitions, type ExtractionZoneDefinition } from "../world/MapLayout";
import { CombatHud, type HudNavigationMarker, type RaidOutcome, type RaidScreen, type RevealSignalHudState, type TacticalMapData, type TacticalNavTarget, type TacticalRouteFeedback, type TacticalRouteHint } from "../ui/CombatHud";
import { LoadingScreenManager } from "../ui/LoadingScreenManager";
import { VisibilityToolManager, type VisibilityToolState } from "../visibility/VisibilityToolManager";
import {
  VendorManager,
  vendorDefinitions,
  type VendorId,
  type VendorTab,
} from "../vendors/VendorManager";
import { attachmentDefinitions, attachmentIdFromLootType, type AttachmentId, type AttachmentSlot } from "../weapons/AttachmentDefinitions";
import { WeaponController } from "../weapons/WeaponController";
import { WeaponDurabilitySystem } from "../weapons/WeaponDurabilitySystem";
import { buildRuntimeWeaponDefinition } from "../weapons/WeaponStatModifiers";
import { weaponDefinitions, weaponIdFromLootType, weaponLootTypes, type RuntimeWeaponDefinition, type WeaponId } from "../weapons/WeaponDefinitions";
import { MultiplayerClient, type MultiplayerConnectionSnapshot } from "../multiplayer/MultiplayerClient";
import type {
  NetworkContainerClaimResult,
  NetworkContainerState,
  NetworkEnemyAttackEvent,
  NetworkEnemyEvent,
  NetworkHeavyCargoActionResult,
  NetworkHeavyCargoState,
  NetworkObjectiveState,
  NetworkPlayerState,
  NetworkPvpEvent,
  NetworkReviveResult,
} from "../multiplayer/MultiplayerTypes";
import { skillBranches, skillNodes, type SkillBranchId, type SkillNodeId } from "../skills/SkillDefinitions";
import { SkillManager } from "../skills/SkillManager";

type LoopProfile = Readonly<{
  xp: number;
}>;

type RaidExitReason = "dead" | "downed_abandon" | "abandoned" | "extracted" | "manual_debug" | "timer_expired";
type RaidWeaponEquipSlot = "primary" | "sidearm";
type UiOverlayState =
  | "gameplay"
  | "raidBag"
  | "lootPanel"
  | "contracts"
  | "stash"
  | "vendor"
  | "workbench"
  | "loadout"
  | "styleLocker"
  | "settings"
  | "keybinds"
  | "raidResult"
  | "raidSelect"
  | "tacticalMap";
type PreviewModelStatus = "fallback" | "available";
type WeaponUpgradeCategory =
  | "damage"
  | "recoil"
  | "ads"
  | "reload"
  | "durability"
  | "magazine";
type WeaponUpgradeState = Record<WeaponId, Record<WeaponUpgradeCategory, number>>;
type BenchMaterialRequirement = Readonly<{
  type: LootType;
  quantity: number;
}>;
type StashFilter =
  | "all"
  | "weapons"
  | "armor"
  | "backpacks"
  | "consumables"
  | "tactical"
  | "materials"
  | "attachments"
  | "contracts"
  | "cosmetics"
  | "junk";
type StashSort = "rarity" | "value" | "type" | "quantity" | "newest";
type ContractUiFilter = "available" | "active" | "ready" | "history" | "all" | "scavenger" | "combat" | "recovery" | "stealth" | "vendor" | "pvp";

const loopProfileStorageKey = "darc-raiders.loop-profile.v1";
const weaponUpgradeStorageKey = "darc-raiders.weapon-upgrades.v1";
const weaponUpgradeCategories: Array<{
  id: WeaponUpgradeCategory;
  label: string;
  effect: string;
  scrapBase: number;
  partsBase: number;
}> = [
  { id: "damage", label: "Damage", effect: "+4% damage tuning", scrapBase: 8, partsBase: 1 },
  { id: "recoil", label: "Recoil Control", effect: "+6% recoil control", scrapBase: 6, partsBase: 1 },
  { id: "ads", label: "ADS Speed", effect: "+5% ready speed", scrapBase: 6, partsBase: 1 },
  { id: "reload", label: "Reload Speed", effect: "+5% reload speed", scrapBase: 6, partsBase: 1 },
  { id: "durability", label: "Durability", effect: "+8% service life", scrapBase: 10, partsBase: 1 },
  { id: "magazine", label: "Magazine Efficiency", effect: "+1 handling tier", scrapBase: 10, partsBase: 1 },
];
const maxWeaponUpgradeTier = 3;

export class App {
  private readonly engine: Engine;
  private readonly scene: Scene;
  private readonly input: InputController;
  private readonly player: PlayerCharacter;
  private readonly camera: UniversalCamera;
  private readonly cameraRig: ThirdPersonCameraRig;
  private readonly coverController: CoverController;
  private readonly traversalController: TraversalController;
  private readonly environmentManager: EnvironmentManager;
  private readonly visibilityToolManager: VisibilityToolManager;
  private readonly tacticalToolManager = new TacticalToolManager();
  private readonly noiseSystem: NoiseSystem;
  private readonly weaponDurabilitySystem = new WeaponDurabilitySystem();
  private readonly aimAssistSystem: AimAssistSystem;
  private readonly weaponController: WeaponController;
  private readonly multiplayerClient: MultiplayerClient;
  private readonly combatHud: CombatHud;
  private readonly loadingScreen = new LoadingScreenManager();
  private readonly targetDummy: TargetDummy;
  private readonly worldMap: WorldMap;
  private enemyDirector: EnemyDirector;
  private readonly playerHealth = new PlayerHealth(100);
  private readonly playerStatus = new PlayerStatus();
  private readonly inventoryManager = new InventoryManager(30);
  private readonly raidInventory: RaidInventory = this.inventoryManager.raidInventory;
  private readonly persistentStash = new PersistentStash();
  private readonly cosmeticManager = new CosmeticManager();
  private readonly vendorManager = new VendorManager();
  private readonly craftingManager = new CraftingManager();
  private readonly hqManager = new HQManager();
  private readonly classManager = new ClassManager();
  private readonly skillManager = new SkillManager();
  private readonly contractManager = new ContractManager();
  private readonly reputation = new Reputation();
  private readonly shipManager = new ShipManager();
  private readonly shipModuleManager = new ShipModuleManager();
  private readonly shipAudio = new ShipAudioManager();
  private readonly sfxAudio = new PlaceholderWeaponAudio();
  private readonly habitatPreview = new HabitatRunnerPreview();
  private readonly shipDashboardPreview = new ShipDashboardPreview();
  private readonly weaponBenchPreview = new WeaponBenchPreview();
  private preDeploymentMode: "assignment" | "solo" | "multiplayer" = "assignment";
  private readonly shipLandingSequence = new OrbitalDeploymentSequence();
  private readonly orbitalDeploymentScene: OrbitalDeploymentScene;
  private readonly landedShip: LandedShip;
  private readonly settingsManager = new SettingsManager();
  private readonly loadout = new Loadout();
  private readonly loadoutManager = new LoadoutManager();
  private readonly extractionController = new ExtractionController();
  private readonly raidTimer = new RaidTimer();
  private readonly lootDirector: LootDirector;
  private readonly lumenRevealSystem: LumenRevealSystem;
  private readonly heavyCargoManager: HeavyCargoManager;
  private readonly dynamicEventDirector: DynamicEventDirector;
  private readonly objectiveDirector: ObjectiveDirector;
  private readonly poiObjectiveManager: POIObjectiveManager;
  private readonly hud: HTMLDivElement;
  private readonly menu: HTMLDivElement;
  private readonly menuContent: HTMLDivElement;
  private readonly debugOverlay: HTMLDivElement;
  private readonly playerSpawn = mapLayoutConfig.playerSpawnPosition.clone();
  private raidScreen: RaidScreen = "menu";
  private loadoutTab: "gear" | "cosmetics" = "gear";
  private raidOutcome: RaidOutcome = "active";
  private activeLoadout: RaidLoadout = this.loadout.snapshot;
  private outcomeItems: LootStack[] = [];
  private lootLostItems: LootStack[] = [];
  private raidResultSummary: RaidResultSummary = emptyRaidResultSummary;
  private prepScrapSpentSinceLastRaid = 0;
  private activeRaidPrepScrapSpent = 0;
  private raidMusicStartedForCurrentRun = false;
  private loopProfile: LoopProfile = this.loadLoopProfile();
  private debugOverlayVisible = false;
  private extractionState: ExtractionState = this.extractionController.state;
  private raidTimerState: RaidTimerState = this.raidTimer.state;
  private dynamicEventState: DynamicEventState;
  private objectiveState: ObjectiveState;
  private poiObjectiveState: POIObjectiveState;
  private heavyCargoState: HeavyCargoViewState;
  private environmentState: EnvironmentState;
  private visibilityToolState: VisibilityToolState;
  private tacticalToolState: TacticalToolState = this.tacticalToolManager.state;
  private noiseState: NoiseSystemState = {
    recentType: null,
    recentRadius: 0,
    stealthLabel: "Stealth",
    quiet: false,
  };
  private objectiveWasCompleted = false;
  private heavyCargoPressureSpawned = false;
  private heavyCargoBlockedFeedbackCooldown = 0;
  private heavyCargoInventorySuppressionSeconds = 0;
  private heavyCargoInventorySuppressionAction: "release" | "pickup" | "drop" | "secure" | null = null;
  private lastHeavyCargoSuppressionLogAt = 0;
  private pendingHeavyCargoRequest: "none" | "release" | "pickup" | "drop" | "secure" = "none";
  private activeHeavyCoreNavMarkerCount = 0;
  private lastHeavyCargoRoomId: string | null = null;
  private currentPoiName: string | null = null;
  private gameplayInput: InputSnapshot;
  private coverState: CoverState = {
    available: false,
    inCover: false,
    lowCover: false,
    peek: 0,
    prompt: "",
  };
  private traversalState: TraversalState = {
    mode: "none",
    active: false,
    prompt: "",
    progress: 0,
  };
  private multiplayerExtractSent = false;
  private multiplayerDeathSent = false;
  private multiplayerDownedSent = false;
  private multiplayerMode = false;
  private reviveTargetId: string | null = null;
  private reviveProgressSeconds = 0;
  private reviveFeedbackCooldown = 0;
  private pvpKillsThisRaid = 0;
  private enemiesEliminatedThisRaid = 0;
  private poiObjectiveOutcomesThisRaid: string[] = [];
  private networkAppliedPoiObjectiveIds = new Set<string>();
  private contractObjectiveCompletedThisRaid = false;
  private raidTimedOutHandled = false;
  private contractAlertRecorded = false;
  private previousExtractionStarted = false;
  private wasClearingJam = false;
  private returnToHqHoldSeconds = 0;
  private returnToHqConfirmShown = false;
  private menuNavigationCooldown = 0;
  private purchaseActionCooldownUntil = 0;
  private baseExtractionZoneIds: string[] = this.extractionController.activeZoneIds;
  private inputMode: InputMode = "ui";
  private overlayState: UiOverlayState = "stash";
  private activeInputPanel = "menu";
  private enemyHitboxDebugVisible = false;
  private enemyLosDebugVisible = false;
  private selectedRaidDefinition: RaidDefinition = defaultRaidDefinition;
  private oxygenPercent = 100;
  private oxygenWarningState: "normal" | "half" | "low" | "critical" | "depleted" = "normal";
  private shipState: ShipState = this.shipManager.state;
  private shipLandingState: OrbitalDeploymentSequenceState = this.shipLandingSequence.state;
  private shipLandingAudioPhase = "inactive";
  private deploymentCameraYaw = 0;
  private deploymentCameraPitch = 0.34;
  private deploymentCameraDistance = 15;
  private deploymentCameraDistanceTarget = 15;
  private deploymentCameraInitialized = false;
  private landingQualitySource: "local" | "server" | "fallback" = "local";
  private previewModelStatus: PreviewModelStatus = "fallback";
  private shipInRange = false;
  private raidBagOpen = false;
  private pendingSharedContainerOpenId: string | null = null;
  private activeSharedContainerPanelId: string | null = null;
  private lastSharedContainerPanelId: string | null = null;
  private lastSharedContainerPanelItemCount: number | null = null;
  private lastSharedContainerClaimRefresh = "none";
  private lastInteractConsumedBy = "none";
  private selectedRaidBagIndex = 0;
  private selectedLootIndex = 0;
  private raidUiNavigationCooldown = 0;
  private tacticalMapOpen = false;
  private tacticalMapSelectedPoiId: string | null = null;
  private tacticalMapSelectedTargetId: string | null = null;
  private tacticalNavTarget: TacticalNavTarget | null = null;
  private tacticalRouteFeedback: TacticalRouteFeedback | null = null;
  private lastRevealHudLogAt = 0;
  private lastRevealHudLogKey = "";
  private lastTacticalMapRevealLogKey = "";
  private lastTacticalNavLogKey = "";
  private lastTacticalNavUnavailableLogKey = "";
  private poiArrivalVisited = new Set<string>();
  private travelEventCooldown = 32;
  private lastTravelEvent = "none";
  private boundaryWarningCooldown = 0;
  private inspectedWeaponId: WeaponId | null = null;
  private lastInvalidInspectWeaponId: string | null = null;
  private inspectWeaponContext: "inspect" | "arsenal" | "habitat" = "inspect";
  private selectedLoadoutSlot: EquipmentSlot = "primary";
  private loadoutStashCompatibilityOpen = false;
  private stashFilter: StashFilter = "all";
  private stashSort: StashSort = "rarity";
  private stashSearch = "";
  private selectedStashType: LootType | null = null;
  private contractUiFilter: ContractUiFilter = "all";
  private weaponUpgrades: WeaponUpgradeState = this.loadWeaponUpgrades();

  public constructor(canvas: HTMLCanvasElement) {
    this.engine = new Engine(canvas, true, {
      preserveDrawingBuffer: false,
      stencil: true,
      antialias: true,
      adaptToDeviceRatio: true,
    });

    this.scene = new Scene(this.engine);
    this.scene.collisionsEnabled = true;
    this.scene.clearColor.set(0.02, 0.025, 0.04, 1);
    this.scene.gravity = new Vector3(0, -24, 0);

    const skyLight = new HemisphericLight("sky-light", new Vector3(0.25, 1, 0.1), this.scene);
    skyLight.diffuse = new Color3(0.56, 0.68, 0.86);
    skyLight.groundColor = new Color3(0.035, 0.045, 0.062);
    skyLight.intensity = 0.62;
    const rimLight = new DirectionalLight("stylized-rim-light", new Vector3(0.5, -0.45, -0.35), this.scene);
    rimLight.diffuse = themeConfig.colors.cyan;
    rimLight.specular = themeConfig.colors.purple;
    rimLight.intensity = 1.05;
    PlaceholderWeaponAudio.setSettingsProvider(() => this.settingsManager.snapshot.audio);
    setMusicSettingsProvider(() => this.settingsManager.snapshot.audio);
    this.shipAudio.setSettingsProvider(() => this.settingsManager.snapshot.audio);
    this.environmentManager = new EnvironmentManager(this.scene, skyLight);
    this.environmentState = this.environmentManager.state;
    this.shipState = this.shipManager.setModuleManager(this.shipModuleManager);
    this.previewModelStatus = this.detectObsidianSentinelPreview();

    this.worldMap = createWorld(this.scene);
    this.worldMap.setActiveExtractionZones([]);

    this.input = new InputController(canvas, this.settingsManager);
    this.gameplayInput = this.input.snapshot;
    this.player = new PlayerCharacter(this.scene, this.playerSpawn);
    this.player.applyCosmeticPalette(this.cosmeticManager.getPalette());
    this.landedShip = new LandedShip(this.scene, mapLayoutConfig.shipLandingSitePosition.clone());
    this.landedShip.setEnabled(false);
    this.orbitalDeploymentScene = new OrbitalDeploymentScene(this.scene);
    this.coverController = new CoverController(this.scene);
    this.traversalController = new TraversalController(this.scene);

    this.camera = new UniversalCamera("third-person-camera", new Vector3(0, 2, -6), this.scene);
    this.camera.minZ = 0.05;
    this.camera.maxZ = 120;
    this.camera.fov = (70 * Math.PI) / 180;
    this.camera.inputs.clear();
    this.scene.activeCamera = this.camera;
    this.cameraRig = new ThirdPersonCameraRig(this.camera, this.player, this.input, this.settingsManager);
    this.visibilityToolManager = new VisibilityToolManager(this.scene, this.camera, this.player);
    this.visibilityToolState = this.visibilityToolManager.state;
    this.noiseSystem = new NoiseSystem(this.scene);
    this.aimAssistSystem = new AimAssistSystem(this.scene, this.settingsManager);
    this.combatHud = new CombatHud(this.settingsManager);
    this.combatHud.setRaidActionHandler((action) => this.handleRaidHudAction(action));
    this.multiplayerClient = new MultiplayerClient(
      this.scene,
      (health) => {
        this.playerHealth.setCurrentFromServer(health);
      },
      this.handlePvpEvent,
      this.handleNetworkRaidEnded,
      this.handleNetworkEnemyEvent,
      this.handleNetworkEnemyAttack,
      this.handleNetworkContainerState,
      this.handleNetworkContainerClaimResult,
      this.handleNetworkObjectiveState,
      this.handleNetworkHeavyCargoState,
      this.handleNetworkHeavyCargoActionResult,
      this.handleNetworkReviveResult,
    );
    this.targetDummy = new TargetDummy(this.scene, new Vector3(-92, 0, -78));
    this.lootDirector = new LootDirector(this.scene);
    this.lumenRevealSystem = new LumenRevealSystem(this.scene);
    this.heavyCargoManager = new HeavyCargoManager(
      this.scene,
      (poiDefinitions.find((poi) => poi.id === "core-pit")?.center.clone() ?? Vector3.Zero()).add(new Vector3(-5, 0.35, 2)),
    );
    this.heavyCargoState = this.heavyCargoManager.state;
    this.dynamicEventDirector = new DynamicEventDirector(this.scene, this.lootDirector);
    this.dynamicEventState = this.dynamicEventDirector.state;
    this.enemyDirector = new EnemyDirector(this.scene, this.player.root, this.playerHealth, this.enemyDirectorOptions);
    this.objectiveDirector = new ObjectiveDirector(this.scene, this.player.root, this.playerHealth);
    this.objectiveState = this.objectiveDirector.state;
    this.poiObjectiveManager = new POIObjectiveManager(this.scene, this.lootDirector);
    this.poiObjectiveState = this.poiObjectiveManager.state;
    this.weaponController = new WeaponController(
      this.scene,
      this.player,
      this.camera,
      this.cameraRig,
      this.settingsManager,
      this.weaponDurabilitySystem,
      {
        onDamage: this.handleDamage,
        onDryFire: this.handleDryFire,
        onShot: (shot) => {
          this.noiseSystem.emit(
            this.weaponController.snapshot.noiseDetectionMultiplier < 0.8 ? "fire-suppressed" : "fire-unsuppressed",
            this.player.state.position,
            this.environmentState.gameplay,
            this.weaponController.snapshot.noiseDetectionMultiplier,
          );
          this.multiplayerClient.sendShot(shot);
        },
      },
    );
    this.applyCurrentCosmetics();

    this.hud = this.createHud();
    this.menu = this.createMenu();
    this.debugOverlay = this.createDebugOverlay();
    this.menuContent = this.menu.querySelector(".main-menu-content") as HTMLDivElement;
    this.loadoutManager.initialize(this.loadout, this.persistentStash.items);
    this.showMainMenu();
    this.loadingScreen.show("Loading HQ", 4700);
  }

  public start(): void {
    this.engine.runRenderLoop(() => {
      const dt = Math.min(this.engine.getDeltaTime() / 1000, 1 / 30);
      const cameraYaw = this.cameraRig.yaw;

      this.setInputMode(this.getInputMode(), this.getActiveInputPanel());
      this.input.update(dt);
      this.gameplayInput = this.input.snapshot;
    this.heavyCargoBlockedFeedbackCooldown = Math.max(0, this.heavyCargoBlockedFeedbackCooldown - dt);
    this.heavyCargoInventorySuppressionSeconds = Math.max(0, this.heavyCargoInventorySuppressionSeconds - dt);
    if (this.heavyCargoInventorySuppressionSeconds <= 0) {
      this.heavyCargoInventorySuppressionAction = null;
    }
    this.reviveFeedbackCooldown = Math.max(0, this.reviveFeedbackCooldown - dt);
      if (this.tacticalMapOpen) {
        this.gameplayInput = this.suppressGameplayControls(this.gameplayInput);
      }
      this.heavyCargoState = this.heavyCargoManager.update(this.player.state, this.landedShip.cargoAccessPosition);
      this.gameplayInput = this.applyHeavyCargoInputModifiers(this.gameplayInput);
      this.updateMenuNavigation(dt);
      this.updateRaidInventoryNavigation(dt);
      this.playerHealth.update(dt);
      this.updatePlayerStatus(dt);
      this.updateReturnToHqHold(dt);
      this.updateReturnToMenu();
      this.releasePointerLockForRaidResult();
      this.updateShipLandingSequence(dt);
      this.hud.classList.toggle("deployment-hidden", this.shipLandingState.active);

      if (this.isRaidActive && !this.shipLandingState.active) {
        this.coverState = this.coverController.update(this.gameplayInput, this.player.state);
        this.gameplayInput = this.coverController.getAdjustedInput(this.gameplayInput);
        this.traversalState = this.traversalController.update(
          dt,
          this.gameplayInput,
          this.player,
          this.coverController.getMovementYaw(cameraYaw),
        );
        this.handleTraversalEvents();
        this.gameplayInput = this.traversalController.getAdjustedInput(this.gameplayInput);

        if (!this.traversalState.active) {
          this.player.update(dt, this.gameplayInput, this.coverController.getMovementYaw(cameraYaw));
        }
        this.heavyCargoState = this.heavyCargoManager.update(this.player.state, this.landedShip.cargoAccessPosition);

        this.noiseState = this.noiseSystem.update(
          dt,
          this.gameplayInput,
          this.player.state,
          this.environmentState.gameplay,
        );
        this.cameraRig.setCoverModifier({
          active: this.coverState.inCover,
          peek: this.coverState.peek,
        });
        this.cameraRig.setAimAssistModifier(
          this.aimAssistSystem.update(
            dt,
            this.gameplayInput,
            this.camera,
            this.cameraRig.yaw,
            this.cameraRig.pitchRadians,
            this.enemyDebugStates,
          ),
        );
        this.cameraRig.setTraversalLocked(this.traversalState.active);
      } else {
        this.coverController.reset();
        this.traversalController.reset();
        this.coverState = this.coverController.state;
        this.traversalState = this.traversalController.state;
        this.cameraRig.setCoverModifier({ active: false, peek: 0 });
        this.cameraRig.setTraversalLocked(false);
      }

      if (this.shipLandingState.active) {
        this.applyShipLandingCamera(dt);
      } else {
        this.cameraRig.update(dt);
      }
      this.player.updateAimFade(dt, this.camera);

      if (this.isRaidActive && !this.shipLandingState.active) {
        this.raidTimerState = this.raidTimer.update(dt);
        if (this.multiplayerMode) {
          this.dynamicEventState = this.dynamicEventDirector.state;
        } else {
          this.dynamicEventState = this.dynamicEventDirector.update(
            dt,
            this.raidTimerState,
            this.player.state.position,
            this.enemyDirector,
          );
        }
        this.updateActiveExtractionZones();
        this.handleRaidTimeout();
        this.updateOxygen(dt);
        this.tacticalToolState = this.tacticalToolManager.update(
          dt,
          this.gameplayInput,
          this.player.state.position,
          this.visibilityToolManager,
        );
        this.visibilityToolState = this.visibilityToolManager.update(dt, this.gameplayInput);
        const weaponVisibilityState = this.traversalState.mode === "zipline"
          ? {
            ...this.visibilityToolState,
            hipfireSpreadMultiplier: this.visibilityToolState.hipfireSpreadMultiplier * 1.65,
          }
          : this.visibilityToolState;
        this.weaponController.update(dt, this.gameplayInput, this.cameraRig.aimDirection, weaponVisibilityState);
        this.updateJamNoise();
        this.environmentManager.update(dt, this.player.state.position);
        const enemyVisionGameplay = {
          ...this.environmentState.gameplay,
          enemyVisionMultiplier: this.environmentState.gameplay.enemyVisionMultiplier *
            this.visibilityToolState.enemyDetectionMultiplier *
            (this.visibilityToolState.flashlightOn ? this.environmentState.gameplay.flashlightDetectionMultiplier : 1),
        };
        this.currentPoiName = this.worldMap.getCurrentPoiName(this.player.state.position);
        this.updatePoiArrivalState();
        this.updateTravelEvents(dt);
        this.updateBoundaryFeedback(dt);
        this.handleRaidInteractions(dt);
        const noiseEvents = this.noiseSystem.consumeEvents();
        if (!this.multiplayerMode) {
          this.enemyDirector.update(
            dt,
            this.gameplayInput,
            this.player.state,
            this.weaponController.snapshot,
            enemyVisionGameplay,
            noiseEvents,
            this.raidTimerState.elapsed,
          );
          for (const message of this.enemyDirector.consumeEncounterMessages()) {
            this.combatHud.showLootNotification(message);
          }
        }
        this.updateContractAlertState();
        this.updateObjective(dt);
        this.updatePoiObjectives(dt);
        this.flushContractMessages();
      } else {
        this.currentPoiName = null;
      }

      if (this.raidScreen === "raid") {
        this.player.updateAnimation(
          dt,
          this.gameplayInput,
          this.weaponController.snapshot,
          this.playerHealth.snapshot,
        );
      }

      this.multiplayerClient.update(
        dt,
        this.player.state,
        this.playerHealth.snapshot,
        this.gameplayInput.adsHeld,
        this.craftingManager.snapshot.armorDurability,
        this.weaponController.snapshot.equippedId,
      );
      this.syncMultiplayerDownedState();
      this.landedShip.update(dt);

      this.targetDummy.update(dt);
      this.combatHud.update(
        dt,
        this.gameplayInput,
        this.weaponController.snapshot,
        this.player.state,
        this.playerHealth.snapshot,
        this.enemyDebugStates,
        {
          outcome: this.raidOutcome,
          screen: this.raidScreen,
          inventoryItems: this.raidInventory.items,
          inventorySlotsList: this.raidInventory.inventorySlots,
          outcomeItems: this.outcomeItems,
          lootLostItems: this.lootLostItems,
          resultSummary: this.raidResultSummary,
          armorDurability: this.craftingManager.snapshot.armorDurability,
          inventorySlots: this.raidInventory.usedSlots,
          inventoryCapacity: this.raidInventory.capacity,
          raidBagOpen: this.raidBagOpen,
          selectedInventorySlotId: this.getSelectedRaidBagSlotId(),
          equippedPrimaryWeaponId: this.loadout.snapshot.primaryWeaponId,
          equippedSidearmWeaponId: this.loadout.snapshot.sidearmWeaponId,
          selectedLootIndex: this.selectedLootIndex,
          lootContainer: this.inventoryManager.snapshot.activeContainer,
          inventoryWarning: this.inventoryManager.snapshot.warning,
          extraction: this.extractionState,
          raidTimer: this.raidTimerState,
          dynamicEvent: this.dynamicEventState,
          objective: this.objectiveState,
          poiObjectives: this.poiObjectiveState,
          activeContract: this.contractManager.snapshot.active,
          oxygenPercent: this.oxygenPercent,
          oxygenState: this.oxygenWarningState,
          playerStatus: this.playerStatus.snapshot,
          poiName: this.currentPoiName,
          cover: this.coverState,
          environment: this.environmentState,
          visibilityTools: this.visibilityToolState,
          tacticalTool: this.tacticalToolState,
          noise: this.noiseState,
          traversal: this.traversalState,
          shoulderSide: this.cameraRig.shoulderSide,
          returnToHqProgress: Math.min(1, this.returnToHqHoldSeconds / 2),
          ship: this.shipState,
          shipInRange: this.shipInRange,
          shipPrompt: this.getShipPrompt(),
          shipRepairPrompt: this.getShipRepairPrompt(),
          shipWarning: this.getShipWarning(),
          shipRepairChoices: this.getShipRepairChoices(),
          shipModuleSummary: this.getShipModuleSummary(),
          shipCargoItems: this.shipManager.cargoItems,
          heavyCargo: this.heavyCargoState,
          landingSequence: this.shipLandingState,
          navigationMarkers: this.getNavigationMarkers(),
          routeHint: this.getTacticalRouteHint(),
          routeFeedback: this.getTacticalRouteFeedback(),
          tacticalMap: this.getTacticalMapData(),
          revealSignal: this.getRevealSignalHudState(),
          revealAffinity: this.getRevealAffinityState(),
        },
      );
      this.updateDebugOverlay();
      this.scene.render();
    });

    window.addEventListener("resize", this.resize);
    window.addEventListener("keydown", this.handleDebugKeyDown);
    document.addEventListener("click", this.handleInventoryClick);
  }

  public dispose(): void {
    window.removeEventListener("resize", this.resize);
    window.removeEventListener("keydown", this.handleDebugKeyDown);
    document.removeEventListener("click", this.handleInventoryClick);
    this.hud.remove();
    this.menu.remove();
    this.debugOverlay.remove();
    this.combatHud.dispose();
    this.loadingScreen.dispose();
    this.habitatPreview.dispose();
    this.shipDashboardPreview.dispose();
    this.weaponBenchPreview.dispose();
    this.environmentManager.dispose();
    this.landedShip.dispose();
    this.orbitalDeploymentScene.dispose();
    this.heavyCargoManager.dispose();
    this.visibilityToolManager.dispose();
    this.noiseSystem.dispose();
    this.targetDummy.dispose();
    this.enemyDirector.dispose();
    this.objectiveDirector.dispose();
    this.poiObjectiveManager.dispose();
    this.dynamicEventDirector.dispose();
    this.lootDirector.dispose();
    this.lumenRevealSystem.dispose();
    this.weaponController.dispose();
    this.multiplayerClient.dispose();
    this.input.dispose();
    this.scene.dispose();
    this.engine.dispose();
  }

  private readonly resize = (): void => {
    this.engine.resize();
  };

  private readonly handleDebugKeyDown = (event: KeyboardEvent): void => {
    if (event.repeat) {
      return;
    }

    if (event.code === "Escape" && this.raidScreen === "raid" && this.inventoryManager.snapshot.activeContainer !== null) {
      const container = this.inventoryManager.snapshot.activeContainer;
      console.info(`[Input] escape action=close-loot reason=loot-open container=${container.id}`);
      this.closeLootPanel(container.id, "escape");
      event.preventDefault();
      return;
    }

    if (event.code === "Escape" && this.raidScreen === "raid" && this.raidBagOpen) {
      console.info("[Input] escape action=close-eva reason=eva-open");
      this.closeRaidBag("escape");
      event.preventDefault();
      return;
    }

    if (event.code === "Escape" && this.tacticalMapOpen) {
      this.closeTacticalMap();
      event.preventDefault();
      return;
    }

    if (event.code === "KeyM" && this.raidScreen === "raid" && this.raidOutcome === "active" && this.playerHealth.snapshot.alive && !this.shipLandingState.active) {
      this.toggleTacticalMap();
      event.preventDefault();
      return;
    }

    if (event.code === "F3") {
      this.debugOverlayVisible = !this.debugOverlayVisible;
      this.debugOverlay.classList.toggle("active", this.debugOverlayVisible);
      this.landedShip.setCargoAccessDebugVisible(this.debugOverlayVisible);
      event.preventDefault();
    } else if (event.code === "F4") {
      this.debugCompleteNearestPoiObjective();
      event.preventDefault();
    } else if (event.code === "F5") {
      this.debugForceContractTargetPoi();
      event.preventDefault();
    } else if (event.code === "F6") {
      this.debugSubmitContractReward();
      event.preventDefault();
    } else if (event.code === "F7") {
      this.enemyHitboxDebugVisible = !this.enemyHitboxDebugVisible;
      this.enemyDirector.setHitboxDebugVisible(this.enemyHitboxDebugVisible);
      this.multiplayerClient.setEnemyHitboxDebugVisible(this.enemyHitboxDebugVisible);
      this.combatHud.showLootNotification(`Enemy hitboxes ${this.enemyHitboxDebugVisible ? "shown" : "hidden"}`);
      event.preventDefault();
    } else if (event.code === "F8") {
      this.enemyLosDebugVisible = !this.enemyLosDebugVisible;
      this.enemyDirector.setLosDebugVisible(this.enemyLosDebugVisible);
      this.combatHud.showLootNotification(`Enemy LOS ${this.enemyLosDebugVisible ? "shown" : "hidden"}`);
      event.preventDefault();
    } else if (event.code === "F9" && this.shipLandingState.active) {
      this.shipLandingState = this.shipLandingSequence.forceQuality("clean");
      this.combatHud.showLootNotification("Debug landing: clean");
      event.preventDefault();
    } else if (event.code === "F10" && this.shipLandingState.active) {
      this.shipLandingState = this.shipLandingSequence.forceQuality("rough");
      this.combatHud.showLootNotification("Debug landing: rough");
      event.preventDefault();
    } else if (event.code === "F11" && this.shipLandingState.active) {
      this.shipLandingState = this.shipLandingSequence.forceQuality("damaged");
      this.combatHud.showLootNotification("Debug landing: damaged");
      event.preventDefault();
    } else if (event.code === "KeyK" && this.shipLandingState.active) {
      this.skipShipLandingSequence();
      event.preventDefault();
    }
  };

  private updateMenuNavigation(dt: number): void {
    if (this.menu.classList.contains("hidden")) {
      return;
    }

    this.menuNavigationCooldown = Math.max(0, this.menuNavigationCooldown - dt);
    const buttons = Array.from(this.menu.querySelectorAll<HTMLButtonElement>("button[data-action]"));

    if (buttons.length === 0) {
      return;
    }

    const activeButton = document.activeElement instanceof HTMLButtonElement &&
      buttons.includes(document.activeElement)
      ? document.activeElement
      : buttons[0];
    const currentIndex = Math.max(0, buttons.indexOf(activeButton));

    if (document.activeElement !== activeButton && this.gameplayInput.activeInputMethod === "controller") {
      activeButton.focus({ preventScroll: true });
    }

    if (this.gameplayInput.jumpPressed) {
      activeButton.click();
      this.menuNavigationCooldown = 0.2;
      return;
    }

    if (this.gameplayInput.uiBackPressed && this.raidScreen !== "menu") {
      this.showMainMenu();
      this.menuNavigationCooldown = 0.2;
      return;
    }

    if (this.gameplayInput.interactPressed && this.raidScreen !== "menu") {
      this.showMainMenu();
      this.menuNavigationCooldown = 0.2;
      return;
    }

    if (this.raidScreen === "loadout" && this.gameplayInput.weaponSwapPressed) {
      this.combatHud.showLootNotification(this.loadoutManager.equipSelected(this.loadout, this.persistentStash.items));
      this.showLoadoutMenu();
      this.menuNavigationCooldown = 0.22;
      return;
    }

    if (this.raidScreen === "loadout" && this.gameplayInput.crouchHeld) {
      this.combatHud.showLootNotification(this.loadoutManager.moveSelectedToRaidBag(this.persistentStash.items));
      this.loadoutManager.applyToLoadout(this.loadout, this.persistentStash.items);
      this.showLoadoutMenu();
      this.menuNavigationCooldown = 0.22;
      return;
    }

    if (this.menuNavigationCooldown > 0) {
      return;
    }

    const vertical = Math.abs(this.gameplayInput.moveZ) > 0.55 ? Math.sign(this.gameplayInput.moveZ) : 0;
    const horizontal = this.gameplayInput.reloadPressed
      ? 1
      : this.gameplayInput.useMedkitPressed
        ? -1
        : Math.abs(this.gameplayInput.moveX) > 0.55
          ? Math.sign(this.gameplayInput.moveX)
          : 0;
    const direction = vertical !== 0 ? vertical : horizontal;

    if (direction !== 0) {
      const nextIndex = (currentIndex + direction + buttons.length) % buttons.length;
      buttons[nextIndex]?.focus({ preventScroll: true });
      this.menuNavigationCooldown = 0.18;
      return;
    }

    if (this.raidScreen === "loadout" && (this.gameplayInput.peekLeftHeld || this.gameplayInput.peekRightHeld)) {
      const currentFilter = this.loadoutManager.snapshot.filter;
      const currentFilterIndex = loadoutFilters.indexOf(currentFilter);
      const offset = this.gameplayInput.peekRightHeld ? 1 : -1;
      const nextFilter = loadoutFilters[(currentFilterIndex + offset + loadoutFilters.length) % loadoutFilters.length];
      this.loadoutManager.setFilter(nextFilter);
      this.showLoadoutMenu();
      this.menuNavigationCooldown = 0.22;
    }
  }

  private updateRaidInventoryNavigation(dt: number): void {
    if (this.shipLandingState.active) {
      this.raidBagOpen = false;
      this.inventoryManager.setActiveContainer(null);
      return;
    }

    if (this.raidScreen !== "raid" || this.raidOutcome !== "active" || !this.playerHealth.snapshot.alive) {
      this.raidBagOpen = false;
      this.tacticalMapOpen = false;
      return;
    }

    if (this.isInventorySuppressedForHeavyCargo("inventory-navigation")) {
      this.raidBagOpen = false;
      this.inventoryManager.setActiveContainer(null);
      return;
    }

    if (this.tacticalMapOpen) {
      if (this.gameplayInput.raidBagTogglePressed) {
        if (this.isInventorySuppressedForHeavyCargo("tactical-map-toggle")) {
          return;
        }
        this.closeTacticalMap();
        this.raidBagOpen = true;
        this.setInputMode("ui", "raid-bag");
        this.combatHud.showLootNotification("EVA Pack open");
      } else if (this.gameplayInput.uiBackPressed) {
        this.closeTacticalMap();
      }
      return;
    }

    this.raidUiNavigationCooldown = Math.max(0, this.raidUiNavigationCooldown - dt);

    const pendingHeavyCargoAction = this.getPendingHeavyCargoInputAction();
    if (pendingHeavyCargoAction) {
      this.suppressInventoryOverlayForHeavyCargo(pendingHeavyCargoAction);
      console.info(`[Interaction] inventory panel suppressed reason=heavy-cargo action=${pendingHeavyCargoAction}`);
      return;
    }

    const activeContainer = this.inventoryManager.snapshot.activeContainer;

    if (this.gameplayInput.raidBagTogglePressed) {
      this.lastInteractConsumedBy = "EVA-Pack";
      if (activeContainer) {
        console.info(`[Input] tab action=close-loot reason=loot-open container=${activeContainer.id}`);
        this.closeLootPanel(activeContainer.id, "tab");
        return;
      }
      if (this.raidBagOpen) {
        console.info("[Input] tab action=close-eva reason=eva-open");
        this.closeRaidBag("tab");
        return;
      } else {
        this.raidBagOpen = true;
        this.clampRaidBagSelection();
        this.setInputMode("ui", "raid-bag");
        console.info("[Input] tab action=open-eva reason=eva-closed");
        this.combatHud.showLootNotification("EVA Pack open");
      }
    }

    const uiOpen = this.raidBagOpen || activeContainer !== null;

    if (!uiOpen) {
      return;
    }

    if (activeContainer) {
      this.selectedLootIndex = this.clampIndex(this.selectedLootIndex, activeContainer.items.length);

      if (this.gameplayInput.takeAllPressed) {
        this.takeAllLoot(activeContainer.id);
      } else if (this.gameplayInput.uiConfirmPressed || (this.gameplayInput.interactPressed && activeContainer.items.length > 0 && activeContainer.status !== "loading")) {
        this.takeLootItem(activeContainer.id, this.selectedLootIndex);
      } else if (this.gameplayInput.interactPressed) {
        const reason = activeContainer.status === "loading"
          ? "pending"
          : activeContainer.items.length > 0
            ? "has-authority-items"
            : "authority-empty";
        console.info(`[ClientLoot] repeated open blocked container=${activeContainer.id} reason=${reason}`);
        this.lastSharedContainerClaimRefresh = `repeated open blocked ${activeContainer.id} ${reason}`;
      } else if (this.gameplayInput.uiBackPressed) {
        console.info(`[Input] escape action=close-loot reason=loot-open container=${activeContainer.id}`);
        this.closeLootPanel(activeContainer.id, "escape");
      } else {
        this.navigateRaidUiSelection(activeContainer.items.length, "loot");
      }
    } else {
      this.clampRaidBagSelection();

      if (this.gameplayInput.uiBackPressed) {
        console.info("[Input] escape action=close-eva reason=eva-open");
        this.closeRaidBag("escape");
      } else if (this.gameplayInput.uiDropPressed) {
        this.dropSelectedRaidBagItem();
      } else if (this.gameplayInput.uiConfirmPressed) {
        this.showSelectedRaidBagItemDetails();
      } else {
        this.navigateRaidUiSelection(this.raidInventory.inventorySlots.length, "bag");
      }
    }

    this.gameplayInput = {
      ...this.gameplayInput,
      moveX: 0,
      moveZ: 0,
      jumpPressed: false,
      crouchHeld: false,
      sprintHeld: false,
      interactPressed: false,
      interactHeld: false,
      weaponSwapPressed: false,
      takeAllPressed: false,
      uiConfirmPressed: false,
      uiBackPressed: false,
      uiDropPressed: false,
    };
  }

  private navigateRaidUiSelection(count: number, mode: "bag" | "loot"): void {
    if (count <= 0 || this.raidUiNavigationCooldown > 0) {
      return;
    }

    const horizontal = Math.abs(this.gameplayInput.moveX) > 0.55
      ? Math.sign(this.gameplayInput.moveX)
      : this.gameplayInput.reloadPressed
        ? 1
        : this.gameplayInput.useMedkitPressed
          ? -1
          : 0;
    const vertical = Math.abs(this.gameplayInput.moveZ) > 0.55 ? Math.sign(this.gameplayInput.moveZ) : 0;

    if (horizontal === 0 && vertical === 0) {
      return;
    }

    const columns = mode === "bag" ? 4 : 1;
    const delta = vertical !== 0 ? -vertical * columns : horizontal;

    if (mode === "bag") {
      this.selectedRaidBagIndex = this.wrapIndex(this.selectedRaidBagIndex + delta, count);
    } else {
      this.selectedLootIndex = this.wrapIndex(this.selectedLootIndex + delta, count);
    }

    this.raidUiNavigationCooldown = 0.16;
  }

  private dropSelectedRaidBagItem(): void {
    const slot = this.raidInventory.inventorySlots[this.selectedRaidBagIndex];

    if (!slot) {
      this.combatHud.showLootNotification("EVA Pack empty");
      return;
    }

    if (this.requiresDropConfirmation(slot.type) && !window.confirm(`Drop ${slot.label}?`)) {
      return;
    }

    const dropped = this.inventoryManager.dropSlot(slot.id);

    if (dropped) {
      this.lootDirector.spawnDroppedLoot(dropped, this.player.state.position);
    }

    this.clampRaidBagSelection();
    this.combatHud.showLootNotification(dropped ? `Dropped ${dropped.label}` : "Nothing to drop");
  }

  private showSelectedRaidBagItemDetails(): void {
    const slot = this.raidInventory.inventorySlots[this.selectedRaidBagIndex];

    if (!slot) {
      this.combatHud.showLootNotification("EVA Pack empty");
      return;
    }

    const definition = getItemDefinition(slot.type);
    this.combatHud.showLootNotification(`${slot.label} | ${definition.rarity} | ${definition.use}`);
  }

  private getSelectedRaidBagSlotId(): string | null {
    return this.raidInventory.inventorySlots[this.selectedRaidBagIndex]?.id ?? null;
  }

  private clampRaidBagSelection(): void {
    this.selectedRaidBagIndex = this.clampIndex(this.selectedRaidBagIndex, this.raidInventory.inventorySlots.length);
  }

  private clampIndex(index: number, count: number): number {
    if (count <= 0) {
      return 0;
    }

    return Math.min(count - 1, Math.max(0, index));
  }

  private wrapIndex(index: number, count: number): number {
    if (count <= 0) {
      return 0;
    }

    return (index + count) % count;
  }

  private readonly handleInventoryClick = (event: MouseEvent): void => {
    const uiPanel = event.target instanceof HTMLElement
      ? event.target.closest<HTMLElement>(".raid-inventory")
      : null;

    if (uiPanel) {
      event.stopPropagation();
    }

    const raidTarget = event.target instanceof HTMLElement
      ? event.target.closest<HTMLElement>("[data-raid-action]")
      : null;

    if (raidTarget) {
      this.handleRaidHudAction(raidTarget.dataset.raidAction);
      return;
    }

    const target = event.target instanceof HTMLElement
      ? event.target.closest<HTMLElement>("[data-loot-action]")
      : null;

    if (!target || this.raidScreen !== "raid" || this.raidOutcome !== "active" || (!this.raidBagOpen && this.inventoryManager.snapshot.activeContainer === null)) {
      return;
    }

    const handled = this.handleLootAction(
      target.dataset.lootAction,
      target.dataset.slotId,
      target.dataset.containerId,
      target.dataset.itemIndex,
    );

    if (handled) {
      return;
    }
  };

  private handleLootAction(
    action: string | undefined,
    slotId: string | undefined,
    containerId: string | undefined,
    itemIndex: string | undefined,
  ): boolean {
    if (!action || this.raidScreen !== "raid" || this.raidOutcome !== "active" || (!this.raidBagOpen && this.inventoryManager.snapshot.activeContainer === null)) {
      return false;
    }

    if (action === "close-bag") {
      const activeContainer = this.inventoryManager.snapshot.activeContainer;
      if (activeContainer) {
        this.closeLootPanel(activeContainer.id, "close-bag-click");
      } else {
        this.closeRaidBag("button");
      }
      return true;
    }

    if (action === "drop") {
      if (!slotId) {
        return false;
      }

      const slot = this.raidInventory.inventorySlots.find((item) => item.id === slotId);

      if (slot && this.requiresDropConfirmation(slot.type) && !window.confirm(`Drop ${slot.label}?`)) {
        return false;
      }

      const dropped = this.inventoryManager.dropSlot(slotId);
      if (dropped) {
        this.lootDirector.spawnDroppedLoot(dropped, this.player.state.position);
      }
      this.combatHud.showLootNotification(dropped ? `Dropped ${dropped.label}` : "Nothing to drop");
      return true;
    }

    if (action === "equip-primary" || action === "equip-sidearm") {
      if (!slotId) {
        return false;
      }

      this.equipRaidBagWeapon(slotId, action === "equip-primary" ? "primary" : "sidearm");
      return true;
    }

    if (action === "move-equipped-primary" || action === "move-equipped-sidearm") {
      this.moveEquippedWeaponToRaidBag(action === "move-equipped-primary" ? "primary" : "sidearm");
      return true;
    }

    if (action === "select" || action === "inspect" || action === "mark" || action === "use") {
      const slotIndex = this.raidInventory.inventorySlots.findIndex((item) => item.id === slotId);

      if (slotIndex < 0) {
        return false;
      }

      this.selectedRaidBagIndex = slotIndex;
      const slot = this.raidInventory.inventorySlots[slotIndex];

      if (action === "use") {
        this.useRaidInventorySlot(slot.id);
      } else if (action === "mark") {
        this.combatHud.showLootNotification(`${slot.label} marked`);
      } else {
        this.showSelectedRaidBagItemDetails();
      }
      return true;
    }

    if (!containerId) {
      return false;
    }

    if (action === "close") {
      this.closeLootPanel(containerId);
      return true;
    }

    if (action === "take") {
      this.takeLootItem(containerId, Number(itemIndex));
      return true;
    }

    if (action === "take-all") {
      this.takeAllLoot(containerId);
      return true;
    }

    return false;
  }

  private equipRaidBagWeapon(slotId: string, equipSlot: RaidWeaponEquipSlot): void {
    const blocked = this.getRaidWeaponChangeBlockReason();

    if (blocked) {
      this.inventoryManager.setWarning(blocked);
      this.combatHud.showLootNotification(blocked);
      console.info(`[LoadoutSwap] blocked reason=${this.getLoadoutSwapBlockCode(blocked)} slot=${equipSlot}`);
      return;
    }

    const inventorySlot = this.raidInventory.inventorySlots.find((item) => item.id === slotId);

    if (!inventorySlot) {
      this.inventoryManager.setWarning("Weapon not found in EVA Pack");
      this.combatHud.showLootNotification("Weapon not found in EVA Pack");
      return;
    }

    const weaponId = weaponIdFromLootType(inventorySlot.type);

    if (!weaponId) {
      const message = "This item is not a weapon.";
      this.inventoryManager.setWarning(message);
      this.combatHud.showLootNotification(message);
      console.info(`[LoadoutSwap] blocked reason=not-weapon slot=${equipSlot} item=${inventorySlot.type}`);
      return;
    }

    if (!this.isWeaponCompatibleWithRaidSlot(weaponId, equipSlot)) {
      const message = "This weapon cannot fit that slot.";
      this.inventoryManager.setWarning(message);
      this.combatHud.showLootNotification(message);
      console.info(`[LoadoutSwap] blocked reason=incompatible-slot slot=${equipSlot} weapon=${weaponId}`);
      return;
    }

    const currentWeaponId = this.getEquippedRaidWeaponId(equipSlot);

    if (currentWeaponId === weaponId) {
      const message = `${weaponDefinitions[weaponId].name} already equipped`;
      this.inventoryManager.setWarning(message);
      this.combatHud.showLootNotification(message);
      return;
    }

    const displacedLootType = this.getDisplacedWeaponLootType(equipSlot, currentWeaponId);
    const selectedSlots = inventorySlot.slots;
    const displacedSlots = displacedLootType ? getItemDefinition(displacedLootType).slots : 0;

    if (this.raidInventory.usedSlots - selectedSlots + displacedSlots > this.raidInventory.capacity) {
      const message = "EVA Pack full — free space before swapping.";
      this.inventoryManager.setWarning(message);
      this.combatHud.showLootNotification(message);
      console.info(`[LoadoutSwap] blocked reason=pack-full slot=${equipSlot} weapon=${weaponId} used=${this.raidInventory.usedSlots}/${this.raidInventory.capacity}`);
      return;
    }

    const removed = this.raidInventory.dropSlot(slotId);

    if (!removed) {
      const message = "Weapon swap failed - selected item unavailable";
      this.inventoryManager.setWarning(message);
      this.combatHud.showLootNotification(message);
      return;
    }

    if (displacedLootType) {
      const returned = this.raidInventory.add(displacedLootType, 1);

      if (!returned) {
        this.raidInventory.add(removed.type, removed.quantity);
        const message = "Weapon swap failed - EVA Pack could not receive equipped weapon";
        this.inventoryManager.setWarning(message);
        this.combatHud.showLootNotification(message);
        return;
      }
    }

    this.setEquippedRaidWeapon(equipSlot, weaponId);
    this.refreshRaidWeaponControllerAfterSwap();
    this.clampRaidBagSelection();
    this.inventoryManager.clearWarning();
    const actionLabel = currentWeaponId ? "swap" : "equip";
    this.combatHud.showLootNotification(`${weaponDefinitions[weaponId].name} ${actionLabel === "swap" ? "swapped into" : "equipped to"} ${equipSlot}`);
    console.info(`[LoadoutSwap] action=${actionLabel} slot=${equipSlot} equipped=${weaponId} displaced=${currentWeaponId ?? "none"} packUsed=${this.raidInventory.usedSlots}/${this.raidInventory.capacity} reserve=${this.weaponController.snapshot.reserveAmmo}`);
    console.info(`[EvaPack] weapon swap slot=${equipSlot} equipped=${weaponId} displaced=${currentWeaponId ?? "none"} packUsed=${this.raidInventory.usedSlots}/${this.raidInventory.capacity}`);
  }

  private moveEquippedWeaponToRaidBag(equipSlot: RaidWeaponEquipSlot): void {
    const blocked = this.getRaidWeaponChangeBlockReason();

    if (blocked) {
      this.inventoryManager.setWarning(blocked);
      this.combatHud.showLootNotification(blocked);
      console.info(`[LoadoutSwap] blocked reason=${this.getLoadoutSwapBlockCode(blocked)} action=move-equipped slot=${equipSlot}`);
      return;
    }

    const currentWeaponId = this.getEquippedRaidWeaponId(equipSlot);

    if (!currentWeaponId) {
      const message = `No ${equipSlot} weapon equipped`;
      this.inventoryManager.setWarning(message);
      this.combatHud.showLootNotification(message);
      return;
    }

    if (equipSlot === "sidearm" && currentWeaponId === "pistol") {
      const message = "Starter sidearm cannot be moved into EVA Pack.";
      this.inventoryManager.setWarning(message);
      this.combatHud.showLootNotification(message);
      console.info("[LoadoutSwap] blocked reason=starter-sidearm");
      return;
    }

    const lootType = weaponLootTypes[currentWeaponId];

    if (!this.raidInventory.canAdd(lootType, 1)) {
      const message = "EVA Pack full — free space before swapping.";
      this.inventoryManager.setWarning(message);
      this.combatHud.showLootNotification(message);
      console.info(`[LoadoutSwap] blocked reason=pack-full action=move-equipped slot=${equipSlot} weapon=${currentWeaponId} used=${this.raidInventory.usedSlots}/${this.raidInventory.capacity}`);
      return;
    }

    const returned = this.raidInventory.add(lootType, 1);

    if (!returned) {
      const message = "Equipped weapon could not be moved to EVA Pack";
      this.inventoryManager.setWarning(message);
      this.combatHud.showLootNotification(message);
      return;
    }

    if (equipSlot === "primary") {
      this.loadout.clearPrimary();
    } else {
      this.loadout.equipSidearm("pistol");
    }

    this.refreshRaidWeaponControllerAfterSwap();
    this.inventoryManager.clearWarning();
    this.combatHud.showLootNotification(`${weaponDefinitions[currentWeaponId].name} moved to EVA Pack`);
    console.info(`[LoadoutSwap] action=move-equipped slot=${equipSlot} weapon=${currentWeaponId} packUsed=${this.raidInventory.usedSlots}/${this.raidInventory.capacity} reserve=${this.weaponController.snapshot.reserveAmmo}`);
    console.info(`[EvaPack] equipped weapon moved slot=${equipSlot} weapon=${currentWeaponId} packUsed=${this.raidInventory.usedSlots}/${this.raidInventory.capacity}`);
  }

  private getRaidWeaponChangeBlockReason(): string | null {
    if (this.raidScreen !== "raid" || this.raidOutcome !== "active") {
      return "Weapon changes are only available during an active raid";
    }

    if (!this.playerHealth.snapshot.alive) {
      return "Cannot change weapons while downed";
    }

    if (this.heavyCargoState.carriedByLocalPlayer || this.heavyCargoInventorySuppressionSeconds > 0) {
      return "Cannot change weapons while carrying heavy cargo.";
    }

    return null;
  }

  private getLoadoutSwapBlockCode(message: string): string {
    if (message.includes("heavy cargo")) return "heavy-cargo";
    if (message.includes("downed")) return "downed";
    if (message.includes("active raid")) return "not-active-raid";
    return "blocked";
  }

  private getEquippedRaidWeaponId(equipSlot: RaidWeaponEquipSlot): WeaponId | null {
    const loadout = this.loadout.snapshot;
    return equipSlot === "primary" ? loadout.primaryWeaponId : loadout.sidearmWeaponId;
  }

  private getDisplacedWeaponLootType(equipSlot: RaidWeaponEquipSlot, weaponId: WeaponId | null): LootType | null {
    if (!weaponId) {
      return null;
    }

    if (equipSlot === "sidearm" && weaponId === "pistol") {
      return null;
    }

    return weaponLootTypes[weaponId];
  }

  private setEquippedRaidWeapon(equipSlot: RaidWeaponEquipSlot, weaponId: WeaponId): void {
    if (equipSlot === "primary") {
      this.loadout.equipPrimary(weaponId);
    } else {
      this.loadout.equipSidearm(weaponId);
    }
  }

  private isWeaponCompatibleWithRaidSlot(weaponId: WeaponId, equipSlot: RaidWeaponEquipSlot): boolean {
    if (equipSlot === "primary") {
      return weaponId === "smg" || weaponId === "shotgun" || weaponId === "assault-rifle" || weaponId === "rifle";
    }

    return weaponId === "pistol" || weaponId === "burst-pistol" || weaponId === "revolver" || weaponId === "compact-smg";
  }

  private refreshRaidWeaponControllerAfterSwap(): void {
    const reserveAmmo = this.weaponController.snapshot.reserveAmmo;
    this.activeLoadout = this.loadout.snapshot;
    // Phase 11.0A preserves reserve ammo across swaps; magazine continuity remains controller-level future work.
    this.weaponController.resetForRaid(this.activeLoadout, reserveAmmo);
  }

  private getPendingHeavyCargoInputAction(): "release" | "pickup" | "drop" | "secure" | null {
    if (this.heavyCargoState.carriedByLocalPlayer && this.gameplayInput.uiDropPressed) {
      return "drop";
    }

    if (!this.gameplayInput.interactPressed || this.extractionState.insideZone) {
      return null;
    }

    if (this.heavyCargoState.carriedByLocalPlayer && this.heavyCargoState.distanceToShipCargo <= 4) {
      return "secure";
    }

    if (
      (this.heavyCargoState.status === "available" || this.heavyCargoState.status === "dropped") &&
      this.heavyCargoManager.canPickup(this.player.state.position)
    ) {
      return "pickup";
    }

    if (this.heavyCargoState.status === "locked" && this.heavyCargoManager.canRelease(this.player.state.position)) {
      return "release";
    }

    return null;
  }

  private suppressInventoryOverlayForHeavyCargo(action: "release" | "pickup" | "drop" | "secure"): void {
    this.heavyCargoInventorySuppressionSeconds = 0.45;
    this.heavyCargoInventorySuppressionAction = action;
    this.inventoryManager.setActiveContainer(null);
    this.inventoryManager.clearWarning();
    this.raidBagOpen = false;
    console.info(`[Interaction] heavy cargo route action=${action} target=${heliumDrillCoreHeavyCargoId} blockedInventoryPanel=true`);
    console.info(`[Interaction] heavyCargoConsumesInput action=${action} suppressInventory=true`);
    console.info(`[EvaPack] forced closed reason=heavy-cargo action=${action}`);
    console.info(`[HeavyCargoUI] no inventory overlay action=${action}`);
  }

  private isInventorySuppressedForHeavyCargo(source: string): boolean {
    if (this.heavyCargoInventorySuppressionSeconds <= 0 || !this.heavyCargoInventorySuppressionAction) {
      return false;
    }

    const now = performance.now();
    if (now - this.lastHeavyCargoSuppressionLogAt > 450) {
      this.lastHeavyCargoSuppressionLogAt = now;
      console.info(`[EvaPack] open blocked reason=heavy-cargo action=${this.heavyCargoInventorySuppressionAction} source=${source}`);
    }
    return true;
  }

  private logHeavyCargoUiActionComplete(action: "release" | "pickup" | "drop" | "secure"): void {
    console.info(`[HeavyCargoUI] completed action=${action} evaPackOpen=${this.raidBagOpen}`);
  }

  private handleRaidHudAction(action: string | undefined): void {
    if (action?.startsWith("loot:")) {
      const fields = action
        .slice("loot:".length)
        .split("|")
        .filter(Boolean);
      const lootAction = fields[0];
      const slotId = fields.find((field) => field.startsWith("slot:"))?.slice("slot:".length);
      const containerId = fields.find((field) => field.startsWith("container:"))?.slice("container:".length);
      const itemIndex = fields.find((field) => field.startsWith("index:"))?.slice("index:".length);
      this.handleLootAction(lootAction, slotId, containerId, itemIndex);
      return;
    }

    if (action === "return-hq") {
      const reason = this.raidOutcome === "active"
        ? this.playerHealth.snapshot.alive ? "abandoned" : "downed_abandon"
        : this.raidOutcome === "extracted" ? "extracted" : "dead";
      console.info("Return to HQ clicked", {
        resultReason: reason,
        nextScreen: "menu",
      });
      this.exitRaidToHQ(reason);
      return;
    }

    if (action === "close-tactical-map") {
      this.closeTacticalMap();
      return;
    }

    if (action === "ship-repair-quick") {
      this.repairShip("quick-patch");
      return;
    }

    if (action === "ship-repair-full") {
      this.repairShip("full-stabilize");
      return;
    }

    if (action === "map-center-player") {
      this.tacticalMapSelectedPoiId = null;
      this.tacticalMapSelectedTargetId = null;
      this.combatHud.showLootNotification("Map centered on player");
      return;
    }

    if (action?.startsWith("map-select-poi-")) {
      this.tacticalMapSelectedPoiId = action.replace("map-select-poi-", "");
      this.tacticalMapSelectedTargetId = `poi-${this.tacticalMapSelectedPoiId}`;
      console.info(`[TacticalMap] selected marker id=${this.tacticalMapSelectedTargetId} type=poi`);
      return;
    }

    if (action?.startsWith("map-select-target-")) {
      const targetId = action.replace("map-select-target-", "");
      this.selectTacticalMapTarget(targetId);
      return;
    }

    if (action?.startsWith("map-track-")) {
      const targetId = action.replace("map-track-", "");
      this.trackTacticalMapTarget(targetId);
      return;
    }

    if (action === "map-clear-tracking") {
      this.clearTacticalNavTarget("manual");
      this.combatHud.showLootNotification("Route tracking cleared");
    }
  }

  private selectTacticalMapTarget(targetId: string): void {
    const target = this.getTacticalNavTargetById(targetId);
    if (!target) {
      this.tacticalMapSelectedTargetId = null;
      console.info(`[TacticalMap] selected marker id=${targetId} type=unknown unavailable=true`);
      this.combatHud.showLootNotification("Map target unavailable");
      return;
    }

    this.tacticalMapSelectedTargetId = target.id;
    this.tacticalMapSelectedPoiId = target.id.startsWith("poi-") ? target.id.replace("poi-", "") : null;
    console.info(`[TacticalMap] selected marker id=${target.id} type=${target.type}`);
  }

  private trackTacticalMapTarget(targetId: string): void {
    const target = this.getTacticalNavTargetById(targetId);
    if (!target) {
      this.logTacticalNavUnavailable(targetId, "not-found");
      this.setTacticalRouteFeedback("Target unavailable", "target-unavailable");
      this.combatHud.showLootNotification("Route target unavailable");
      return;
    }

    const selectedAt = performance.now();
    this.tacticalNavTarget = { ...target, selectedAt };
    this.tacticalRouteFeedback = null;
    this.tacticalMapSelectedTargetId = target.id;
    this.tacticalMapSelectedPoiId = target.id.startsWith("poi-") ? target.id.replace("poi-", "") : null;
    const logKey = `${target.id}:${target.type}:${target.source}`;
    if (this.lastTacticalNavLogKey !== logKey) {
      this.lastTacticalNavLogKey = logKey;
      console.info(`[TacticalNav] track id=${target.id} type=${target.type} source=${target.source}`);
    }
    this.combatHud.showLootNotification(`Tracking ${target.label}`);
  }

  private clearTacticalNavTarget(reason: string): void {
    if (!this.tacticalNavTarget) {
      return;
    }

    const label = this.tacticalNavTarget.label;
    console.info(`[TacticalNav] clear reason=${reason}`);
    this.setTacticalRouteFeedback(label, this.getTacticalRouteFeedbackStatus(reason));
    this.tacticalNavTarget = null;
    this.lastTacticalNavLogKey = "";
  }

  private getTacticalRouteFeedback(): TacticalRouteFeedback | null {
    if (!this.tacticalRouteFeedback) {
      return null;
    }

    const remainingSeconds = this.tacticalRouteFeedback.remainingSeconds - 1 / 60;
    if (remainingSeconds <= 0 || this.raidScreen !== "raid") {
      this.tacticalRouteFeedback = null;
      return null;
    }

    this.tacticalRouteFeedback = {
      ...this.tacticalRouteFeedback,
      remainingSeconds,
    };
    return this.tacticalRouteFeedback;
  }

  private setTacticalRouteFeedback(label: string, status: TacticalRouteFeedback["status"]): void {
    this.tacticalRouteFeedback = {
      label,
      status,
      remainingSeconds: 2.2,
    };
  }

  private getTacticalRouteFeedbackStatus(reason: string): TacticalRouteFeedback["status"] {
    if (reason.includes("signal") || reason.includes("reveal")) return "signal-lost";
    if (reason.includes("objective-complete")) return "objective-complete";
    if (reason.includes("unavailable")) return "target-unavailable";
    return "route-cleared";
  }

  private logTacticalNavUnavailable(id: string, reason: string): void {
    const key = `${id}:${reason}`;
    if (this.lastTacticalNavUnavailableLogKey === key) {
      return;
    }

    this.lastTacticalNavUnavailableLogKey = key;
    console.info(`[TacticalNav] target unavailable id=${id} reason=${reason}`);
  }

  private useRaidInventorySlot(slotId: string): void {
    const slot = this.raidInventory.inventorySlots.find((item) => item.id === slotId);

    if (!slot) {
      this.combatHud.showLootNotification("No EVA Pack item selected");
      return;
    }

    if (this.raidOutcome !== "active" || this.raidScreen !== "raid") {
      this.logItemUse(slot.type, false, "not-active-raid");
      this.logFieldUtility(slot.type, "blocked", 0, "not-active-raid");
      this.combatHud.showLootNotification("This item cannot be used directly.");
      return;
    }

    if (!this.playerHealth.snapshot.alive) {
      this.logItemUse(slot.type, false, "downed");
      this.logFieldUtility(slot.type, "blocked", 0, "downed");
      this.combatHud.showLootNotification("Cannot use items while downed.");
      return;
    }

    if (this.heavyCargoState.carriedByLocalPlayer) {
      this.logItemUse(slot.type, false, "heavy-cargo");
      this.logFieldUtility(slot.type, "blocked", 0, "heavy-cargo");
      this.combatHud.showLootNotification("Cannot use field items while carrying heavy cargo.");
      return;
    }

    const useProfile = getItemUseProfile(slot.type);
    if (!useProfile.usableInRaid) {
      this.logItemUse(slot.type, false, "not-raid-usable");
      this.logFieldUtility(slot.type, "blocked", 0, "not-raid-usable");
      this.combatHud.showLootNotification(useProfile.blockedReason ?? "This item cannot be used directly.");
      return;
    }

    if (slot.type === "anti-toxin") {
      if (!this.playerStatus.snapshot.lunarInfection && this.playerStatus.snapshot.mentalStability >= 100) {
        this.logItemUse(slot.type, false, "no-toxin-effect");
        this.logFieldUtility(slot.type, "blocked", 0, "no-toxin-effect");
        this.combatHud.showLootNotification("No toxin effect active.");
        return;
      }
      if (this.raidInventory.consume("anti-toxin", 1)) {
        this.playerStatus.administerAntiToxin();
        this.logItemUse(slot.type, true, "toxins-cleared");
        this.logFieldUtility(slot.type, "cleanse", 20);
        this.combatHud.showLootNotification("Anti-Toxin administered. Infection cleared.");
      }
      return;
    }

    if (slot.type === "essence-flare") {
      if (!this.lumenRevealSystem.canActivate()) {
        this.logItemUse(slot.type, false, "reveal-guard");
        this.logFieldUtility(slot.type, "blocked", 0, "reveal-guard");
        this.combatHud.showLootNotification("Reveal pulse cycling. Try again.");
        return;
      }
      if (this.raidInventory.consume(slot.type, 1)) {
        console.info("[ItemUse] activate item=essence-flare action=reveal-pulse");
        const result = this.activateLumenRevealPulse();
        this.logItemUse(slot.type, true, `reveal-targets-${result.targets.length}`);
        this.combatHud.showLootNotification("Essence Flare released.");
        this.combatHud.showLootNotification(result.targets.length > 0
          ? `Lumen signatures revealed: ${result.targets.length}`
          : "No Lumen signatures detected.");
      }
      return;
    }

    if (slot.type === "advanced-medkit") {
      if (this.playerHealth.snapshot.current >= this.playerHealth.snapshot.max) {
        this.logItemUse(slot.type, false, "full-health");
        this.logFieldUtility(slot.type, "blocked", 0, "full-health");
        this.combatHud.showLootNotification("Already at full health.");
        return;
      }
      if (this.raidInventory.consume(slot.type, 1)) {
        const healAmount = 55;
        this.playerHealth.heal(healAmount);
        this.logItemUse(slot.type, true, "healed");
        this.logFieldUtility(slot.type, "heal", healAmount);
        this.noiseSystem.emit("heal", this.player.state.position, this.environmentState.gameplay);
        this.combatHud.showLootNotification("Advanced medkit applied.");
      }
      return;
    }

    if (slot.type === "medkit") {
      if (this.playerHealth.snapshot.current >= this.playerHealth.snapshot.max) {
        this.logItemUse(slot.type, false, "full-health");
        this.logFieldUtility(slot.type, "blocked", 0, "full-health");
        this.combatHud.showLootNotification("Already at full health.");
        return;
      }
      if (this.raidInventory.consume(slot.type, 1)) {
        const healAmount = 35;
        this.playerHealth.heal(healAmount);
        this.logItemUse(slot.type, true, "healed");
        this.logFieldUtility(slot.type, "heal", healAmount);
        this.noiseSystem.emit("heal", this.player.state.position, this.environmentState.gameplay);
        this.combatHud.showLootNotification("Medkit applied.");
      }
      return;
    }

    if (slot.type === "bandage") {
      if (this.playerHealth.snapshot.current >= this.playerHealth.snapshot.max) {
        this.logItemUse(slot.type, false, "full-health");
        this.logFieldUtility(slot.type, "blocked", 0, "full-health");
        this.combatHud.showLootNotification("Already at full health.");
        return;
      }
      if (this.raidInventory.consume(slot.type, 1)) {
        const healAmount = 16;
        this.playerHealth.heal(healAmount);
        this.logItemUse(slot.type, true, "healed");
        this.logFieldUtility(slot.type, "heal", healAmount);
        this.noiseSystem.emit("heal", this.player.state.position, this.environmentState.gameplay);
        this.combatHud.showLootNotification("Bandage applied.");
      }
      return;
    }

    if ((slot.type === "armor-plate" || slot.type === "improved-armor-plate") && this.raidInventory.consume(slot.type, 1)) {
      const armorMultiplier = slot.type === "improved-armor-plate"
        ? loadoutConfig.lightArmorDamageMultiplier * 0.82
        : loadoutConfig.lightArmorDamageMultiplier * 0.9;
      this.playerHealth.setIncomingDamageMultiplier(armorMultiplier);
      this.logItemUse(slot.type, true, "armor-fitted");
      this.logFieldUtility(slot.type, "armor", armorMultiplier);
      this.noiseSystem.emit("heal", this.player.state.position, this.environmentState.gameplay);
      this.combatHud.showLootNotification(slot.type === "improved-armor-plate"
        ? "Improved armor plate fitted."
        : "Armor plate fitted.");
      return;
    }

    if (slot.type === "battery") {
      if (this.oxygenPercent >= 100) {
        this.logItemUse(slot.type, false, "oxygen-full");
        this.logFieldUtility(slot.type, "blocked", 0, "oxygen-full");
        this.combatHud.showLootNotification("Oxygen already full.");
        return;
      }
      if (this.raidInventory.consume(slot.type, 1)) {
        const oxygenRestore = 35;
        this.oxygenPercent = Math.min(100, this.oxygenPercent + oxygenRestore);
        this.oxygenWarningState = this.getOxygenState(this.oxygenPercent);
        this.logItemUse(slot.type, true, "oxygen-restored");
        this.logFieldUtility(slot.type, "oxygen", oxygenRestore);
        this.noiseSystem.emit("heal", this.player.state.position, this.environmentState.gameplay);
        this.combatHud.showLootNotification("Oxygen cell installed.");
      }
      return;
    }

    this.logItemUse(slot.type, false, "not-directly-usable");
    this.logFieldUtility(slot.type, "blocked", 0, "not-directly-usable");
    this.combatHud.showLootNotification("This item cannot be used directly.");
  }

  private activateLumenRevealPulse(): LumenRevealResult {
    const playerPosition = this.player.state.position;
    const selectedClassId = this.classManager.snapshot.selectedClassId;
    const revealAffinity = this.getRevealAffinityState(selectedClassId);
    this.noiseSystem.emit("loot", playerPosition, this.environmentState.gameplay);
    return this.lumenRevealSystem.activateEssenceFlare(playerPosition, this.enemyDebugStates, {
      classId: selectedClassId,
      radius: revealAffinity.radius,
      durationSeconds: revealAffinity.durationSeconds,
      surveyorAffinity: revealAffinity.surveyor,
    });
  }

  private isSurveyorClass(classId: string | null | undefined = this.classManager.snapshot.selectedClassId): boolean {
    const normalized = String(classId ?? "").trim().toLowerCase();
    if (normalized === "surveyor") {
      return true;
    }
    const selectedClass = this.classManager.selectedClass;
    return selectedClass.displayName.trim().toLowerCase() === "surveyor" ||
      selectedClass.roleLabel.trim().toLowerCase().includes("signal reading");
  }

  private getRevealAffinityState(classId: string | null | undefined = this.classManager.snapshot.selectedClassId): {
    surveyor: boolean;
    radius: number;
    durationSeconds: number;
    surveyorRadius: number;
    surveyorDurationSeconds: number;
    baseRadius: number;
    baseDurationSeconds: number;
  } {
    const surveyor = this.isSurveyorClass(classId);
    const baseRadius = 45;
    const baseDurationSeconds = 18;
    const surveyorRadius = 55;
    const surveyorDurationSeconds = 24;
    return {
      surveyor,
      radius: surveyor ? surveyorRadius : baseRadius,
      durationSeconds: surveyor ? surveyorDurationSeconds : baseDurationSeconds,
      surveyorRadius,
      surveyorDurationSeconds,
      baseRadius,
      baseDurationSeconds,
    };
  }

  private logItemUse(item: LootType, ok: boolean, reason: string): void {
    if (!ok) {
      console.info(`[ItemUse] blocked item=${item} reason=${reason}`);
    }
    console.info(`[ItemUse] item=${item} action=use ok=${ok} reason=${reason}`);
  }

  private logFieldUtility(item: LootType, effect: string, value: number, reason?: string): void {
    console.info(`[FieldUtility] item=${item} effect=${effect} value=${value}${reason ? ` reason=${reason}` : ""}`);
  }

  private createHud(): HTMLDivElement {
    const hud = document.createElement("div");
    hud.className = "hud";
    hud.innerHTML = `
      <strong>${themeConfig.brand.title}</strong>
      <span>Click to capture mouse. WASD move, Shift sprint, Space jump/vault/mantle, C crouch, V shoulder swap, B clear jam, T tactical tool, L laser, N night vision, E/F interact/zipline, F cover, Q/E peek, RMB ADS, LMB fire. Controller: A jump/traverse, B interact, R3 shoulder swap, D-pad Up tactical, hold Y clear jam, LB/RB peek, LT ADS, RT fire.</span>
    `;
    document.body.append(hud);
    return hud;
  }

  private createDebugOverlay(): HTMLDivElement {
    const overlay = document.createElement("div");
    overlay.className = "debug-overlay";
    overlay.innerHTML = "<strong>DARK CRATERS DEBUG</strong><span>F3 toggles overlay</span>";
    document.body.append(overlay);
    return overlay;
  }

  private updateDebugOverlay(): void {
    if (!this.debugOverlayVisible) {
      return;
    }

    const health = this.playerHealth.snapshot;
    const input = this.gameplayInput;
    const encounter = this.enemyDirector.encounterDebug;
    const multiplayer = this.multiplayerClient.snapshot;
    const shipAudioDebug = this.shipAudio.debugState;
    const mouse = this.input.mouseDebug;
    const revealDebug = this.lumenRevealSystem.debugState;
    const nearestPoi = this.getNearestPoiDebugLabel();
    const activeContractPoi = this.contractManager.snapshot.active?.definition.targetPoi ?? "none";
    const markerCount = this.getNavigationMarkers().length;
    this.debugOverlay.innerHTML = `
      <strong>DARK CRATERS DEBUG</strong>
      <span>Screen: ${this.raidScreen} | Outcome: ${this.raidOutcome}</span>
      <span>Map: ${mapLayoutConfig.size}m x ${mapLayoutConfig.size}m | Player ${this.player.state.position.x.toFixed(1)}, ${this.player.state.position.z.toFixed(1)} | Nearest POI ${nearestPoi}</span>
      <span>Ship Distance: ${Math.round(this.distanceTo(mapLayoutConfig.shipLandingSitePosition))}m | Contract POI: ${activeContractPoi} | Nav Markers: ${markerCount}</span>
      <span>Tactical Map: ${this.tacticalMapOpen ? "open" : "closed"} | Travel Event: ${this.lastTravelEvent} | Event Cooldown ${Math.ceil(this.travelEventCooldown)}s | Boundary ${Math.round(this.distanceToBoundary())}m</span>
      <span>Deployment Active: ${this.shipLandingState.active ? "true" : "false"} | phase ${this.shipLandingState.phase} | elapsed ${this.shipLandingState.elapsedTotal.toFixed(1)}s/${this.shipLandingState.baselineDuration.toFixed(1)}s | ext ${this.shipLandingState.extensionTime.toFixed(1)}s | progress ${Math.round(this.shipLandingState.totalProgress * 100)}%</span>
      <span>Deployment Nav: alignment ${this.shipLandingState.alignmentOffset.toFixed(2)} / target ${this.shipLandingState.targetOffset.toFixed(2)} | stability ${Math.round(this.shipLandingState.stabilityScore * 100)}% | signal ${this.shipLandingState.signalInterferenceActive ? "true" : "false"} | reacquire ${this.shipLandingState.routeReacquisitionTriggered ? "true" : "false"}</span>
      <span>Deployment Camera: SHIP ORBIT | yaw ${this.deploymentCameraYaw.toFixed(2)} | pitch ${this.deploymentCameraPitch.toFixed(2)} | zoom ${this.deploymentCameraDistance.toFixed(1)}m | target bound ${this.shipLandingState.active ? "true" : "false"} | cues ship-follow</span>
      <span>Deployment Systems: station ${this.shipLandingState.stationFocus} | event ${this.shipLandingState.eventCategory} | ship audio stage ${this.shipLandingState.audioPhase} | Tycho after deployment ${this.raidMusicStartedForCurrentRun ? "true" : "false"}</span>
      <span>Landing Quality: predicted ${this.shipLandingState.predictedLandingQuality} | applied ${this.shipLandingState.finalAppliedLandingQuality ?? this.shipLandingState.resolvedLandingQuality ?? "pending"} | authority ${this.shipLandingState.landingQualityAuthority} | resources ${this.shipLandingState.resourcesActive ? "active" : "inactive"} | finalized ${this.shipLandingState.lastFinalizationReason} | K skip</span>
      <span>Audio: master ${Math.round(this.settingsManager.snapshot.audio.masterVolume * 100)}% | music ${Math.round(this.settingsManager.snapshot.audio.musicVolume * 100)}% | sfx ${Math.round(this.settingsManager.snapshot.audio.sfxVolume * 100)}% | muted ${this.settingsManager.snapshot.audio.muted ? "true" : "false"}</span>
      <span>Audio State: music ${getCurrentMusicState()} | ship ${this.shipAudio.state} | phase ${shipAudioDebug.phase} | impact build ${shipAudioDebug.impactBuildActive ? "true" : "false"} | last ${shipAudioDebug.lastEvent} | raid music ${this.raidMusicStartedForCurrentRun ? "started" : "pending"}</span>
      <span>Progression: assignment ${this.classManager.snapshot.selectedClassId} | skill matrix ${this.skillManager.snapshot.version === 1 ? "ready" : "pending"} | acquired ${this.skillManager.acquiredCount}</span>
      <span>Overlay: ${this.overlayState} | Input Mode: ${this.inputMode} | Panel: ${this.activeInputPanel}</span>
      <span>UI Panel Open: ${this.getActiveInputPanel()} | Interact consumed by: ${this.lastInteractConsumedBy} | Active shared container: ${this.activeSharedContainerPanelId ?? "none"} | Pending shared open: ${this.pendingSharedContainerOpenId ?? "none"}</span>
      <span>Pointer Lock: ${mouse.pointerLocked ? "canvas" : "none"} | Mouse Captured: ${mouse.mouseCaptured ? "true" : "false"}</span>
      <span>Mouse: ${mouse.lastMouseAction} | down ${mouse.lastButtonDown ?? "none"} | up ${mouse.lastButtonUp ?? "none"}</span>
      <span>Mouse Held: fire ${mouse.fireHeld ? "true" : "false"} | ADS ${mouse.adsHeld ? "true" : "false"} | wheel ${Math.round(mouse.wheelDelta)}</span>
      <span>Canvas Pointerdown: ${mouse.canvasPointerDownFired ? "true" : "false"} | Under Cursor: ${mouse.elementUnderCursor}</span>
      <span>Health: ${Math.ceil(health.current)} / ${health.max} | Armor: ${this.craftingManager.snapshot.armorDurability}%</span>
      <span>O2: ${Math.ceil(this.oxygenPercent)}% | Mind: ${Math.ceil(this.playerStatus.snapshot.mentalStability)}% ${this.playerStatus.snapshot.lunarInfection ? "| Lunar Infection" : ""}</span>
      <span>Crater Run: timer ${Math.ceil(this.raidTimerState.timeRemaining)}s/${this.selectedRaidDefinition.lengthSeconds}s | extract ${this.raidTimerState.extractionUnlocked ? "active" : "locked"} | Risk ${this.getDistanceRiskTier()}</span>
      <span>EVA Pack: ${this.raidInventory.usedSlots} / ${this.raidInventory.capacity}</span>
      <span>Loot Containers: ${this.lootDirector.containerCount} | Active enemies: ${this.enemyDebugStates.length}</span>
      <span>Reveal Tool: last ${revealDebug.lastItem ?? "none"} ${revealDebug.lastResult} | class ${revealDebug.lastClassId} | radius ${revealDebug.lastRadius}m/${revealDebug.lastDurationSeconds}s | targets ${revealDebug.lastTargetCount} raw ${revealDebug.lastRawTargetCount} grouped ${revealDebug.lastGroupedTargetCount} | dead skipped ${revealDebug.lastDeadTargetSkips} cleaned ${revealDebug.lastDeadSignalCleanups} | active markers ${revealDebug.activeMarkerCount} | revealed ${revealDebug.activeRevealedCount}</span>
      <span>PvE Authority: ${this.multiplayerMode ? (multiplayer.status === "connected" ? "SERVER" : "DISCONNECTED") : "LOCAL"} | Server enemies ${multiplayer.authoritativeEnemyCount} | active ${multiplayer.activeEnemyCount} | dormant ${multiplayer.dormantEnemyCount} | rendered ${multiplayer.renderedNetworkEnemyCount}</span>
      <span>Enemy Net: tick ${multiplayer.enemyServerTickRate}/s | snapshot ${multiplayer.enemySnapshotRate}/s #${multiplayer.enemySnapshotId} | last ${multiplayer.lastEnemyEvent} | affected ${multiplayer.lastEnemyAffectedId ?? "none"} | corrections ${multiplayer.enemyCorrectionCount}</span>
      <span>Network Lifecycle: connected ${multiplayer.status === "connected" ? "true" : "false"} | room ${multiplayer.roomId ?? "none"} | last ${multiplayer.lastRoomLifecycleEvent} | reset ${multiplayer.lastNetworkStateResetReason} | enemy clear ${multiplayer.lastNetworkEnemyClearReason}</span>
      <span>Local PvE: ${this.multiplayerMode ? "disabled" : "enabled"} | Enemy drops: ${this.multiplayerMode ? "server event credit only" : "local loot table"}</span>
      <span>World Authority: ${multiplayer.worldAuthority} | Containers ${multiplayer.sharedContainersDepleted}/${multiplayer.sharedContainerCount} depleted | Last container ${multiplayer.lastContainerEvent} | Duplicate claims ${multiplayer.duplicateClaimCount}</span>
      <span>Loot Routing: ${this.getLootRoutingMode(multiplayer)} v${multiplayer.sharedWorldVersion ?? "none"} | nearby ${this.lootDirector.getNearbyContainerId(this.player.state.position) ?? "none"} | active ${this.activeSharedContainerPanelId ?? "none"} | pending ${this.pendingSharedContainerOpenId ?? "none"}</span>
      <span>Loot Net: open ${multiplayer.lastContainerRequestId ?? "none"} ${multiplayer.lastContainerOpenResult} items ${multiplayer.lastContainerOpenItemCount ?? "none"} | mapping ${multiplayer.lastContainerMapping} | panel ${this.lastSharedContainerPanelId ?? "none"} items ${this.lastSharedContainerPanelItemCount ?? "none"} ${multiplayer.activeLootPanelApplied ? "applied" : "false"} | claim ${multiplayer.lastClaimRequest} ${multiplayer.lastClaimResult}</span>
      <span>Loot Panel Refresh: ${this.lastSharedContainerClaimRefresh}</span>
      <span>Loot Award: claimant ${multiplayer.lastClaimantPlayerId ?? "none"} | local ${multiplayer.lastClaimWasLocal ? "true" : "false"} | inventory add ${multiplayer.lastInventoryAddApplied ? "true" : "false"}</span>
      <span>SFX: ${PlaceholderWeaponAudio.getDebugState().event} | ${PlaceholderWeaponAudio.getDebugState().path} | ${PlaceholderWeaponAudio.getDebugState().result}</span>
      <span>Shared Objective: ${multiplayer.activeSharedObjectiveId ?? "none"} ${multiplayer.sharedObjectiveState} | Extraction Unlock Authority ${multiplayer.extractionUnlockAuthority} | Last objective ${multiplayer.lastObjectiveEvent}</span>
      <span>Heavy Cargo Authority: ${this.multiplayerMode ? multiplayer.heavyCargoAuthority : this.heavyCargoState.authority} | Core ${this.heavyCargoState.status} | carrier ${this.heavyCargoState.carrierPlayerId ?? "none"} | secured ${this.heavyCargoState.shipSecured ? "true" : "false"} | last ${this.heavyCargoState.lastEvent}</span>
      <span>Heavy Cargo Sync: room ${this.lastHeavyCargoRoomId ?? multiplayer.roomId ?? "none"} | pending ${this.pendingHeavyCargoRequest} | auth ${this.formatVector3(this.heavyCargoState.position)} | rendered ${this.formatVector3(this.heavyCargoManager.visibleCorePosition)} | nav ${this.activeHeavyCoreNavMarkerCount}</span>
      <span>Heavy Cargo Pressure Event: ${this.heavyCargoState.pressure} | source ${this.heavyCargoState.pressureTrigger} | threats ${this.multiplayerMode ? multiplayer.activeEnemyCount : this.enemyDirector.activeEnemyCount}</span>
      <span>Ship: landing ${this.shipState.landingQuality} | readiness ${this.shipState.readiness} | risk ${this.shipState.cargoRisk} | repaired ${this.shipState.repaired ? "true" : "false"}</span>
      <span>Ship Cargo: ${this.shipState.cargoUsed}/${this.shipState.cargoCapacity} | ${this.getShipModuleSummary()} | access ${this.landedShip.cargoAccessRadius.toFixed(1)}m | manifest ${this.shipManager.cargoItems.length} stack${this.shipManager.cargoItems.length === 1 ? "" : "s"}</span>
      <span>Habitat Regolith Scrap: ${this.getStashQuantity("scrap")} | Credits: ${this.vendorManager.snapshot.credits}</span>
      <span>Input: ${input.activeInputMethod}${input.controllerConnected ? ` | ${input.controllerName ?? "controller"}` : ""}</span>
      <span>Multiplayer: ${this.renderMultiplayerStatusLine()} | leave ${multiplayer.lastRoomLeaveCode ?? "none"} | Mode: ${this.multiplayerMode ? "dedicated" : "solo"}</span>
      <span>Model: ${this.player.modelStatus}</span>
      <span>Traversal: ${this.traversalState.mode}${this.traversalState.active ? ` ${Math.round(this.traversalState.progress * 100)}%` : ""}</span>
      <span>Encounter: ${encounter.phase} | active ${encounter.activeEnemies}/${encounter.maxActiveEnemies}</span>
      <span>Encounter Last: ${encounter.lastEncounter}</span>
      <span>Enemy Hitboxes: ${this.enemyHitboxDebugVisible ? "visible" : "hidden"} | LOS ${this.enemyLosDebugVisible ? "visible" : "hidden"} | F7/F8 toggles</span>
      <span>POI Danger: ${encounter.poiThreats.map((poi) => `${poi.poiId} ${poi.rating}`).join(" | ")}</span>
      <span>Contract: ${this.contractManager.snapshot.active?.definition.title ?? "none"} | POI objectives ${this.poiObjectiveState.completedCount}/${this.poiObjectiveState.totalCount} | Extracts ${this.extractionState.activeZoneIds.join(", ") || "none"}</span>
      <span>Crater Run: ${this.selectedRaidDefinition.name} T${this.selectedRaidDefinition.tier} | Debug keys: F4 objective | F5 contract | F6 reward | F7 hitboxes | F8 LOS</span>
    `;
  }

  private getNavigationMarkers(): HudNavigationMarker[] {
    if (this.raidScreen !== "raid" || this.raidOutcome !== "active" || this.shipLandingState.active) {
      return [];
    }

    const playerPosition = this.player.state.position;
    const markers: HudNavigationMarker[] = [
      {
        id: "personal-ship",
        label: "Ship",
        distance: this.horizontalDistance(playerPosition, mapLayoutConfig.shipLandingSitePosition),
        kind: "ship",
      },
    ];

    const activeContractPoi = this.contractManager.snapshot.active?.definition.targetPoi;
    const contractPoi = activeContractPoi
      ? poiDefinitions.find((poi) => poi.id === activeContractPoi || poi.name === activeContractPoi)
      : null;

    if (contractPoi) {
      markers.push({
        id: `contract-${contractPoi.id}`,
        label: `Contract: ${contractPoi.name}`,
        distance: this.horizontalDistance(playerPosition, contractPoi.center),
        kind: "contract",
      });
    }

    const heavyObjectiveActive = this.objectiveState.type === "secure-rare-core";
    if (heavyObjectiveActive && !this.heavyCargoState.shipSecured && this.heavyCargoState.status !== "extracted") {
      const remoteCarrier = this.getRemotePlayer(this.heavyCargoState.carrierPlayerId);
      const target = this.heavyCargoState.status === "carried" && !this.heavyCargoState.carriedByLocalPlayer && remoteCarrier
        ? new Vector3(remoteCarrier.x, remoteCarrier.y, remoteCarrier.z)
        : this.heavyCargoState.status === "carried"
          ? this.landedShip.cargoAccessPosition
          : this.heavyCargoState.position;
      const label = this.heavyCargoState.status === "carried"
        ? this.heavyCargoState.carriedByLocalPlayer ? "Load Core" : remoteCarrier ? `Escort ${remoteCarrier.name}` : "Ship Cargo Bay"
        : this.heavyCargoState.status === "dropped" ? "Recover Helium-3 Core" : "Helium-3 Core";
      markers.push({
        id: "heavy-core",
        label,
        distance: this.horizontalDistance(playerPosition, target),
        kind: "objective",
      });
    } else if (!this.objectiveState.completed) {
      markers.push({
        id: "primary-objective",
        label: this.heavyCargoState.shipSecured ? "Extract Core" : this.heavyCargoState.carriedByLocalPlayer ? "Load Core" : "Helium-3 Core",
        distance: this.horizontalDistance(playerPosition, this.objectiveState.targetPosition),
        kind: "objective",
      });
    }

    const nearestPoiObjective = this.poiObjectiveState.nearest;
    if (nearestPoiObjective) {
      markers.push({
        id: `poi-objective-${nearestPoiObjective.id}`,
        label: `${nearestPoiObjective.contractLinked ? "Contract " : ""}${nearestPoiObjective.poiName}`,
        distance: nearestPoiObjective.distance,
        kind: nearestPoiObjective.threatRating >= 5 ? "danger" : "poi",
      });
    }

    const downedTeammate = this.getNearestDownedTeammate(160);
    if (downedTeammate) {
      markers.push({
        id: `revive-${downedTeammate.id}`,
        label: `Revive ${downedTeammate.name}`,
        distance: this.horizontalDistance(playerPosition, new Vector3(downedTeammate.x, downedTeammate.y, downedTeammate.z)),
        kind: "danger",
      });
    }

    const extractionMarker = this.getNearestExtractionMarker(playerPosition);
    if (extractionMarker) {
      markers.push(extractionMarker);
    }

    const sortedMarkers = markers
      .sort((a, b) => this.navigationPriority(a) - this.navigationPriority(b) || a.distance - b.distance)
      .slice(0, 6);
    this.activeHeavyCoreNavMarkerCount = sortedMarkers.filter((marker) => marker.id === "heavy-core").length;
    return sortedMarkers;
  }

  private getTacticalRouteHint(playerPosition: Vector3 = this.player.state.position): TacticalRouteHint | null {
    if (!this.tacticalNavTarget || this.raidScreen !== "raid" || this.raidOutcome !== "active") {
      return null;
    }

    const target = this.getTacticalNavTargetById(this.tacticalNavTarget.id, playerPosition);
    if (!target) {
      const previousTarget = this.tacticalNavTarget;
      this.logTacticalNavUnavailable(previousTarget.id, previousTarget.type === "reveal-signal" ? "signal-lost" : "target-unavailable");
      this.clearTacticalNavTarget(previousTarget.type === "reveal-signal" ? "signal-lost" : "target-unavailable");
      return null;
    }

    const distance = this.horizontalDistance(playerPosition, new Vector3(target.worldPosition.x, target.worldPosition.y, target.worldPosition.z));
    this.tacticalNavTarget = {
      ...target,
      selectedAt: this.tacticalNavTarget.selectedAt,
    };
    return {
      id: target.id,
      label: target.label,
      type: target.type,
      source: target.source,
      status: target.status ?? "active",
      distance,
      remainingSeconds: target.remainingSeconds,
    };
  }

  private getTacticalNavTargetById(id: string, playerPosition: Vector3 = this.player.state.position): TacticalNavTarget | null {
    return this.getTacticalNavCandidates(playerPosition).find((target) => target.id === id) ?? null;
  }

  private getTacticalNavCandidates(playerPosition: Vector3 = this.player.state.position): TacticalNavTarget[] {
    const selectedAt = this.tacticalNavTarget?.selectedAt ?? 0;
    const targets: TacticalNavTarget[] = [];
    const addTarget = (
      id: string,
      label: string,
      type: TacticalNavTarget["type"],
      position: Vector3,
      source: TacticalNavTarget["source"],
      status = "active",
      remainingSeconds?: number,
    ): void => {
      targets.push({
        id,
        label,
        type,
        worldPosition: { x: position.x, y: position.y, z: position.z },
        selectedAt,
        source,
        status,
        remainingSeconds,
      });
    };

    addTarget("ship", "Ship", "extraction", mapLayoutConfig.shipLandingSitePosition, "extraction", "ship");
    addTarget("ship-cargo", "Ship Cargo Bay", "extraction", this.landedShip.cargoAccessPosition, "extraction", "cargo bay");
    if (this.isExtractionAvailable) {
      addTarget("ship-launch", "Ship Launch", "extraction", this.landedShip.launchAccessPosition, "extraction", "launch ready");
    }

    const heavyObjectiveActive = this.objectiveState.type === "secure-rare-core";
    if (heavyObjectiveActive && this.heavyCargoState.status !== "extracted" && !this.heavyCargoState.shipSecured) {
      const remoteCarrier = this.getRemotePlayer(this.heavyCargoState.carrierPlayerId);
      const heavyPointPosition = this.heavyCargoState.status === "carried" && !this.heavyCargoState.carriedByLocalPlayer && remoteCarrier
        ? new Vector3(remoteCarrier.x, remoteCarrier.y, remoteCarrier.z)
        : this.heavyCargoState.status === "carried"
          ? this.landedShip.cargoAccessPosition
          : this.heavyCargoState.position;
      addTarget(
        "heavy-core",
        this.heavyCargoState.status === "dropped" ? "Dropped Helium-3 Core" : this.heavyCargoState.status === "carried" ? "Helium-3 Carrier" : "Helium-3 Core",
        "objective",
        heavyPointPosition,
        "system",
        this.heavyCargoState.status,
      );
    } else if (!this.objectiveState.completed) {
      addTarget("primary-objective", this.objectiveState.title, "objective", this.objectiveState.targetPosition, "system", "active");
    }

    const downedTeammate = this.getNearestDownedTeammate(999);
    if (downedTeammate) {
      addTarget(`revive-${downedTeammate.id}`, `Revive ${downedTeammate.name}`, "objective", new Vector3(downedTeammate.x, downedTeammate.y, downedTeammate.z), "system", "downed");
    }

    for (const zone of extractionZoneDefinitions) {
      const active = this.extractionState.activeZoneIds.includes(zone.id);
      addTarget(zone.id, zone.name, "extraction", zone.center, "extraction", active ? "active" : "known");
    }

    const nearestPoiObjective = this.poiObjectiveState.nearest;
    if (nearestPoiObjective) {
      addTarget(nearestPoiObjective.id, `${nearestPoiObjective.title} - ${nearestPoiObjective.poiName}`, "objective", nearestPoiObjective.markerPosition, nearestPoiObjective.contractLinked ? "contract" : "map", "active");
    }

    const activeContractPoi = this.contractManager.snapshot.active?.definition.targetPoi;
    const contractPoi = activeContractPoi
      ? poiDefinitions.find((poi) => poi.id === activeContractPoi || poi.name === activeContractPoi)
      : null;
    if (contractPoi) {
      addTarget(`contract-${contractPoi.id}`, `Contract: ${contractPoi.name}`, "objective", contractPoi.center, "contract", "active contract");
    }

    for (const poi of poiDefinitions) {
      addTarget(`poi-${poi.id}`, poi.name, "poi", poi.center, "map", this.getPoiDangerLabel(poi.id));
    }

    const revealSignalState = this.lumenRevealSystem.getSignalState(this.enemyDebugStates);
    const now = performance.now();
    for (const signal of revealSignalState.signals) {
      const remainingSeconds = Math.max(0, (signal.expiresAt - now) / 1000);
      if (remainingSeconds <= 0) {
        continue;
      }
      addTarget(
        `reveal-${signal.id}`,
        signal.label || "Lumen Signal",
        "reveal-signal",
        signal.position,
        "reveal",
        "signal active",
        remainingSeconds,
      );
    }

    return targets.sort((a, b) => {
      const leftDistance = this.horizontalDistance(playerPosition, new Vector3(a.worldPosition.x, a.worldPosition.y, a.worldPosition.z));
      const rightDistance = this.horizontalDistance(playerPosition, new Vector3(b.worldPosition.x, b.worldPosition.y, b.worldPosition.z));
      return leftDistance - rightDistance;
    });
  }

  private getTacticalMapData(): TacticalMapData {
    if (this.shipLandingState.active) {
      return {
        open: false,
        mapSize: mapLayoutConfig.size,
        player: {
          x: this.player.state.position.x,
          z: this.player.state.position.z,
          yaw: this.player.state.yaw,
        },
        selectedPoiId: null,
        selectedTargetId: null,
        trackedTarget: null,
        pois: [],
        points: [],
      };
    }

    const activeContractPoi = this.contractManager.snapshot.active?.definition.targetPoi;
    const playerPosition = this.player.state.position;
    const routeHint = this.getTacticalRouteHint(playerPosition);
    const trackedTargetId = routeHint?.id ?? null;
    const points: TacticalMapData["points"] = [
      {
        id: "ship",
        label: "Ship",
        x: mapLayoutConfig.shipLandingSitePosition.x,
        z: mapLayoutConfig.shipLandingSitePosition.z,
        kind: "ship",
        active: true,
        distance: this.horizontalDistance(playerPosition, mapLayoutConfig.shipLandingSitePosition),
        selected: this.tacticalMapSelectedTargetId === "ship",
        tracked: trackedTargetId === "ship",
        trackable: true,
      },
      {
        id: "ship-cargo",
        label: "Cargo",
        x: this.landedShip.cargoAccessPosition.x,
        z: this.landedShip.cargoAccessPosition.z,
        kind: "cargo",
        distance: this.horizontalDistance(playerPosition, this.landedShip.cargoAccessPosition),
        selected: this.tacticalMapSelectedTargetId === "ship-cargo",
        tracked: trackedTargetId === "ship-cargo",
        trackable: true,
      },
      {
        id: "ship-launch",
        label: "Launch",
        x: this.landedShip.launchAccessPosition.x,
        z: this.landedShip.launchAccessPosition.z,
        kind: "launch",
        active: this.isExtractionAvailable,
        distance: this.horizontalDistance(playerPosition, this.landedShip.launchAccessPosition),
        selected: this.tacticalMapSelectedTargetId === "ship-launch",
        tracked: trackedTargetId === "ship-launch",
        trackable: this.isExtractionAvailable,
      },
    ];

    const heavyObjectiveActive = this.objectiveState.type === "secure-rare-core";
    if (heavyObjectiveActive && this.heavyCargoState.status !== "extracted") {
      const remoteCarrier = this.getRemotePlayer(this.heavyCargoState.carrierPlayerId);
      const heavyPointPosition = this.heavyCargoState.status === "carried" && !this.heavyCargoState.carriedByLocalPlayer && remoteCarrier
        ? new Vector3(remoteCarrier.x, remoteCarrier.y, remoteCarrier.z)
        : this.heavyCargoState.shipSecured || this.heavyCargoState.status === "carried"
          ? this.landedShip.cargoAccessPosition
          : this.heavyCargoState.position;
      points.push({
        id: "heavy-core",
        label: this.heavyCargoState.shipSecured
          ? "Core Secured"
          : this.heavyCargoState.status === "carried" && remoteCarrier
            ? "Core Carrier"
            : this.heavyCargoState.status === "dropped" ? "Dropped Core" : "Helium-3 Core",
        x: heavyPointPosition.x,
        z: heavyPointPosition.z,
        kind: "objective",
        active: !this.heavyCargoState.shipSecured,
        distance: this.horizontalDistance(playerPosition, heavyPointPosition),
        selected: this.tacticalMapSelectedTargetId === "heavy-core",
        tracked: trackedTargetId === "heavy-core",
        trackable: !this.heavyCargoState.shipSecured,
      });
    }

    const downedTeammate = this.getNearestDownedTeammate(999);
    if (downedTeammate) {
      points.push({
        id: `revive-${downedTeammate.id}`,
        label: "Revive",
        x: downedTeammate.x,
        z: downedTeammate.z,
        kind: "objective",
        active: true,
        distance: this.horizontalDistance(playerPosition, new Vector3(downedTeammate.x, downedTeammate.y, downedTeammate.z)),
        selected: this.tacticalMapSelectedTargetId === `revive-${downedTeammate.id}`,
        tracked: trackedTargetId === `revive-${downedTeammate.id}`,
        trackable: true,
      });
    }

    for (const zone of extractionZoneDefinitions) {
      points.push({
        id: zone.id,
        label: zone.temporary ? "Temp Extract" : "Fallback Extract",
        x: zone.center.x,
        z: zone.center.z,
        kind: "extraction",
        active: this.extractionState.activeZoneIds.includes(zone.id),
        distance: this.horizontalDistance(playerPosition, zone.center),
        selected: this.tacticalMapSelectedTargetId === zone.id,
        tracked: trackedTargetId === zone.id,
        trackable: true,
      });
    }

    if (!this.objectiveState.completed && !heavyObjectiveActive) {
      points.push({
        id: "primary-objective",
        label: "Objective",
        x: this.objectiveState.targetPosition.x,
        z: this.objectiveState.targetPosition.z,
        kind: "objective",
        active: true,
        distance: this.horizontalDistance(playerPosition, this.objectiveState.targetPosition),
        selected: this.tacticalMapSelectedTargetId === "primary-objective",
        tracked: trackedTargetId === "primary-objective",
        trackable: true,
      });
    }

    const nearestPoiObjective = this.poiObjectiveState.nearest;
    if (nearestPoiObjective) {
      points.push({
        id: nearestPoiObjective.id,
        label: "POI Objective",
        x: nearestPoiObjective.markerPosition.x,
        z: nearestPoiObjective.markerPosition.z,
        kind: "poiObjective",
        active: true,
        distance: nearestPoiObjective.distance,
        selected: this.tacticalMapSelectedTargetId === nearestPoiObjective.id,
        tracked: trackedTargetId === nearestPoiObjective.id,
        trackable: true,
      });
    }

    const contractPoi = activeContractPoi
      ? poiDefinitions.find((poi) => poi.id === activeContractPoi || poi.name === activeContractPoi)
      : null;
    if (contractPoi) {
      points.push({
        id: `contract-${contractPoi.id}`,
        label: "Contract",
        x: contractPoi.center.x,
        z: contractPoi.center.z,
        kind: "contract",
        active: true,
        distance: this.horizontalDistance(playerPosition, contractPoi.center),
        selected: this.tacticalMapSelectedTargetId === `contract-${contractPoi.id}`,
        tracked: trackedTargetId === `contract-${contractPoi.id}`,
        trackable: true,
      });
      points.push(...this.getContractBreadcrumbPoints(playerPosition, contractPoi.center));
    }

    const revealSignalState = this.lumenRevealSystem.getSignalState(this.enemyDebugStates);
    for (const signal of revealSignalState.signals) {
      points.push({
        id: `reveal-${signal.id}`,
        label: "Lumen Signal",
        x: signal.position.x,
        z: signal.position.z,
        kind: "signal",
        active: true,
        distance: signal.distance,
        remainingSeconds: Math.max(0, (signal.expiresAt - performance.now()) / 1000),
        source: signal.source,
        status: "live",
        selected: this.tacticalMapSelectedTargetId === `reveal-${signal.id}`,
        tracked: trackedTargetId === `reveal-${signal.id}`,
        trackable: true,
      });
    }

    const revealMapLogKey = `${revealSignalState.signals.length}:${revealSignalState.surveyorAffinity ? "surveyor" : "base"}:${revealSignalState.lastResult}`;
    if (this.tacticalMapOpen && revealSignalState.active && this.lastTacticalMapRevealLogKey !== revealMapLogKey) {
      this.lastTacticalMapRevealLogKey = revealMapLogKey;
      console.info(`[TacticalMap] reveal markers count=${revealSignalState.signals.length}`);
    }

    return {
      open: this.tacticalMapOpen,
      mapSize: mapLayoutConfig.size,
      player: {
        x: playerPosition.x,
        z: playerPosition.z,
        yaw: this.player.state.yaw,
      },
      selectedPoiId: this.tacticalMapSelectedPoiId,
      selectedTargetId: this.tacticalMapSelectedTargetId,
      trackedTarget: routeHint,
      pois: poiDefinitions.map((poi) => ({
        id: poi.id,
        name: poi.name,
        x: poi.center.x,
        z: poi.center.z,
        danger: this.getPoiDangerLabel(poi.id),
        lootProfile: this.getPoiLootProfile(poi.id),
        distance: this.horizontalDistance(playerPosition, poi.center),
        activeContract: contractPoi?.id === poi.id,
        highRisk: poi.id === "core-pit" || poi.id === "checkpoint",
      })),
      points,
    };
  }

  private getRevealSignalHudState(): RevealSignalHudState {
    const state = this.lumenRevealSystem.getSignalState(this.enemyDebugStates);
    const nearest = state.nearest;
    const contextHint = nearest ? this.getRevealSignalContextHint(nearest) : null;
    const now = performance.now();
    const revealHudLogKey = `${state.count}:${nearest ? Math.round(nearest.distance / 5) * 5 : "none"}:${state.surveyorAffinity ? "surveyor" : "base"}:${state.lastResult}`;
    if (state.active && this.lastRevealHudLogKey !== revealHudLogKey && now - this.lastRevealHudLogAt >= 1200) {
      this.lastRevealHudLogAt = now;
      this.lastRevealHudLogKey = revealHudLogKey;
      console.info(`[HUD] reveal signal count=${state.count} nearest=${nearest ? nearest.distance.toFixed(1) : "none"}`);
    }
    return {
      active: state.active,
      count: state.count,
      nearestDistance: nearest?.distance ?? null,
      nearestLabel: nearest?.label ?? null,
      remainingSeconds: state.remainingSeconds,
      surveyorAffinity: state.surveyorAffinity,
      contextHint,
      lastResult: state.lastResult,
    };
  }

  private getRevealSignalContextHint(signal: RevealedSignal): string | null {
    const objectiveDistance = this.horizontalDistance(signal.position, this.objectiveState.targetPosition);
    if (!this.objectiveState.completed && objectiveDistance <= 36) {
      return "Signal near primary objective zone";
    }

    const poiObjective = this.poiObjectiveState.objectives
      .filter((objective) => !objective.completed)
      .map((objective) => ({
        objective,
        distance: this.horizontalDistance(signal.position, objective.markerPosition),
      }))
      .sort((a, b) => a.distance - b.distance)[0] ?? null;
    if (poiObjective && poiObjective.distance <= 36) {
      return `Lumen activity near ${poiObjective.objective.poiName}`;
    }

    const poi = poiDefinitions
      .map((definition) => ({
        definition,
        distance: this.horizontalDistance(signal.position, definition.center),
      }))
      .sort((a, b) => a.distance - b.distance)[0] ?? null;
    if (poi && poi.distance <= 48) {
      return `Lumen activity near ${poi.definition.name}`;
    }

    return null;
  }

  private getContractBreadcrumbPoints(from: Vector3, to: Vector3): TacticalMapData["points"] {
    const distance = this.horizontalDistance(from, to);
    if (distance < 35) {
      return [];
    }

    const count = Math.min(5, Math.max(1, Math.floor(distance / 45)));
    return Array.from({ length: count }, (_, index) => {
      const t = (index + 1) / (count + 1);
      return {
        id: `contract-breadcrumb-${index}`,
        label: "Route Ping",
        x: from.x + (to.x - from.x) * t,
        z: from.z + (to.z - from.z) * t,
        kind: "breadcrumb" as const,
        active: true,
      };
    });
  }

  private getNearestExtractionMarker(playerPosition: Vector3): HudNavigationMarker | null {
    const activeZones = this.extractionState.activeZoneIds
      .map((id) => id === "personal-ship-return"
        ? this.getShipExtractionZone()
        : extractionZoneDefinitions.find((zone) => zone.id === id) ?? null)
      .filter((zone): zone is ExtractionZoneDefinition => zone !== null);

    if (activeZones.length === 0) {
      return null;
    }

    const nearest = activeZones
      .map((zone) => ({
        zone,
        distance: this.horizontalDistance(playerPosition, zone.center),
      }))
      .sort((a, b) => a.distance - b.distance)[0];

    return {
      id: `extract-${nearest.zone.id}`,
      label: nearest.zone.id === "personal-ship-return" ? "Ship Return" : nearest.zone.name,
      distance: nearest.distance,
      kind: "extraction",
    };
  }

  private getNearestPoiDebugLabel(): string {
    const playerPosition = this.player.state.position;
    const nearest = poiDefinitions
      .map((poi) => ({
        poi,
        distance: this.horizontalDistance(playerPosition, poi.center),
      }))
      .sort((a, b) => a.distance - b.distance)[0];

    return nearest ? `${nearest.poi.name} ${Math.round(nearest.distance)}m` : "none";
  }

  private getPoiDangerLabel(poiId: string): string {
    if (poiId === "core-pit") return "Danger: Extreme";
    if (poiId === "warehouse") return "Danger: High";
    if (poiId === "data-shack") return "Danger: Elevated";
    if (poiId === "checkpoint") return "Danger: High";
    if (poiId === "abandoned-camp") return "Danger: Low";
    return "Danger: Unknown";
  }

  private getPoiLootProfile(poiId: string): string {
    if (poiId === "core-pit") return "Loot: Helium-3 / rare cores";
    if (poiId === "warehouse") return "Loot: weapons / scrap / parts";
    if (poiId === "data-shack") return "Loot: electronics / batteries";
    if (poiId === "checkpoint") return "Loot: attachments / guarded crates";
    if (poiId === "abandoned-camp") return "Loot: med supplies / mining crates";
    return "Loot: unknown";
  }

  private toggleTacticalMap(): void {
    if (this.tacticalMapOpen) {
      this.closeTacticalMap();
    } else {
      this.openTacticalMap();
    }
  }

  private openTacticalMap(): void {
    this.inventoryManager.setActiveContainer(null);
    this.inventoryManager.clearWarning();
    this.raidBagOpen = false;
    this.tacticalMapOpen = true;
    this.setInputMode("ui", "tactical-map");
    this.combatHud.showLootNotification("Tactical map open");
  }

  private closeTacticalMap(): void {
    this.tacticalMapOpen = false;
    if (this.raidScreen === "raid" && this.raidOutcome === "active" && this.playerHealth.snapshot.alive) {
      this.setInputMode("gameplay", "gameplay");
    }
    this.combatHud.showLootNotification("Tactical map closed");
  }

  private suppressGameplayControls(input: InputSnapshot): InputSnapshot {
    return {
      ...input,
      moveX: 0,
      moveZ: 0,
      lookX: 0,
      lookY: 0,
      zoomDelta: 0,
      firePressed: false,
      fireHeld: false,
      jumpPressed: false,
      reloadPressed: false,
      meleePressed: false,
      clearJamPressed: false,
      clearJamHeld: false,
      shoulderSwapPressed: false,
      interactPressed: false,
      interactHeld: false,
      coverPressed: false,
      peekLeftHeld: false,
      peekRightHeld: false,
      toggleFlashlightPressed: false,
      toggleLaserPressed: false,
      toggleNightVisionPressed: false,
      useMedkitPressed: false,
      weaponSlotPressed: null,
      weaponSwapPressed: false,
      crouchHeld: false,
      sprintHeld: false,
      adsHeld: false,
    };
  }

  private applyHeavyCargoInputModifiers(input: InputSnapshot): InputSnapshot {
    if (!this.heavyCargoState.carriedByLocalPlayer || this.shipLandingState.active || this.raidOutcome !== "active") {
      return input;
    }

    if (this.heavyCargoBlockedFeedbackCooldown <= 0) {
      const weaponBlocked = input.fireHeld ||
        input.firePressed ||
        input.adsHeld ||
        input.meleePressed ||
        input.weaponSwapPressed ||
        input.weaponSlotPressed !== null;
      const movementBlocked = input.sprintHeld || input.jumpPressed;
      if (weaponBlocked || movementBlocked) {
        this.heavyCargoBlockedFeedbackCooldown = 2.2;
        this.combatHud.showLootNotification(weaponBlocked
          ? "Weapons locked while carrying heavy cargo"
          : "Movement restricted by heavy cargo");
      }
    }

    return {
      ...input,
      moveX: input.moveX * this.heavyCargoState.movementMultiplier,
      moveZ: input.moveZ * this.heavyCargoState.movementMultiplier,
      sprintHeld: false,
      jumpPressed: false,
      firePressed: false,
      fireHeld: false,
      adsHeld: false,
      meleePressed: false,
      weaponSlotPressed: null,
      weaponSwapPressed: false,
    };
  }

  private navigationPriority(marker: HudNavigationMarker): number {
    if (marker.kind === "ship") return 0;
    if (marker.kind === "contract") return 1;
    if (marker.kind === "objective") return 2;
    if (marker.kind === "extraction") return 3;
    if (marker.kind === "danger") return 4;
    return 5;
  }

  private distanceTo(position: Vector3): number {
    return this.horizontalDistance(this.player.state.position, position);
  }

  private distanceToBoundary(): number {
    const position = this.player.state.position;
    const distanceFromCenter = Math.hypot(position.x, position.z);
    return Math.max(0, mapLayoutConfig.boundaryRadius - distanceFromCenter);
  }

  private getDistanceRiskTier(): string {
    const distance = this.distanceTo(mapLayoutConfig.shipLandingSitePosition);
    if (distance < 36) return "safe";
    if (distance < 80) return "outer";
    if (distance < 125) return "deep";
    return "far-side";
  }

  private horizontalDistance(a: Vector3, b: Vector3): number {
    return Math.hypot(a.x - b.x, a.z - b.z);
  }

  private formatVector3(position: Vector3): string {
    return `${position.x.toFixed(1)},${position.y.toFixed(1)},${position.z.toFixed(1)}`;
  }

  private get isRaidActive(): boolean {
    return this.raidScreen === "raid" && this.raidOutcome === "active" && this.playerHealth.snapshot.alive;
  }

  private syncMultiplayerDownedState(): void {
    if (!this.multiplayerMode || this.raidScreen !== "raid" || this.raidOutcome !== "active") {
      this.multiplayerDownedSent = false;
      return;
    }

    if (this.playerHealth.snapshot.alive) {
      this.multiplayerDownedSent = false;
      return;
    }

    if (!this.multiplayerDownedSent) {
      this.multiplayerDownedSent = true;
      this.multiplayerClient.sendDowned();
      this.combatHud.showLootNotification("DOWNED - WAIT FOR REVIVE OR RETURN TO HABITAT");
      this.sfxAudio.playEvent("revive.downed");
    }
  }

  private get enemyDebugStates() {
    return this.multiplayerMode ? this.multiplayerClient.enemyDebugStates : this.enemyDirector.debugStates;
  }

  private updateShipLandingSequence(dt: number): void {
    if (this.raidScreen !== "raid" || this.raidOutcome !== "active" || !this.shipLandingState.active) {
      return;
    }

    const wasActive = this.shipLandingState.active;
    this.gameplayInput = this.suppressGameplayControls(this.gameplayInput);
    this.shipInRange = false;
    this.shipLandingState = this.shipLandingSequence.update(dt, this.input.snapshot);
    if (this.shipLandingAudioPhase !== this.shipLandingState.phase) {
      this.shipLandingAudioPhase = this.shipLandingState.phase;
      this.playShipDeploymentPhaseAudio(this.shipLandingState.phase);
    }

    this.orbitalDeploymentScene.update(this.shipLandingState, mapLayoutConfig.shipLandingSitePosition);
    if (!this.shipLandingState.touchdownApplied) {
      this.landedShip.setDescentPose(
        this.shipLandingState.descentProgress,
        this.shipLandingState.approachStability,
        this.shipLandingState.alignmentOffset,
      );
    }

    if (
      this.shipLandingState.phase === "touchdown" &&
      this.shipLandingState.resolvedLandingQuality &&
      !this.shipLandingState.touchdownApplied
    ) {
      this.shipState = this.shipManager.initializeForRaidWithQuality(this.shipLandingState.resolvedLandingQuality);
      this.landedShip.settleAfterDescent(this.shipState);
      this.shipLandingState = this.shipLandingSequence.markTouchdownApplied();
      this.shipAudio.playTouchdown(this.shipState.landingQuality);
      this.combatHud.showLootNotification(`Touchdown ${this.shipState.landingQuality}`);
    }

    if (wasActive && this.shipLandingState.phase === "complete") {
      this.completeShipLandingDeployment();
    }
  }

  private completeShipLandingDeployment(): void {
    this.shipLandingState = this.shipLandingSequence.state;
    this.shipLandingAudioPhase = "complete";
    this.orbitalDeploymentScene.setEnabled(false);
    this.player.reset(this.playerSpawn);
    this.input.releasePointerLock();
    this.setInputMode("gameplay", "gameplay");
    this.camera.fov = (70 * Math.PI) / 180;
    this.deploymentCameraInitialized = false;
    this.startRaidMusicAfterDeployment();
    this.combatHud.showLootNotification("Deployed");
  }

  private playShipDeploymentPhaseAudio(phase: OrbitalDeploymentSequenceState["phase"]): void {
    if (phase === "dock-release") {
      this.shipAudio.play("ship_dock_release");
    } else if (phase === "clearance-burn") {
      this.shipAudio.play("ship_clearance_burn");
    } else if (phase === "transit-corridor") {
      this.shipAudio.play("ship_transit_corridor");
    } else if (phase === "signal-interference") {
      this.shipAudio.play("ship_signal_interference");
    } else if (phase === "route-reacquisition") {
      this.shipAudio.play("ship_route_reacquisition");
    } else if (phase === "lunar-approach") {
      this.shipAudio.play("ship_lunar_approach");
    } else if (phase === "final-descent") {
      this.shipAudio.play("ship_final_approach");
    } else if (phase === "stabilization-window") {
      this.shipAudio.play("ship_impact_build");
    }
  }

  private startRaidMusicAfterDeployment(): void {
    if (this.raidMusicStartedForCurrentRun) {
      return;
    }

    this.raidMusicStartedForCurrentRun = true;
    this.shipAudio.stopAll();
    void playTychoStarMusic();
  }

  private skipShipLandingSequence(): void {
    this.shipLandingState = this.shipLandingSequence.skipToComplete("K skip");
    if (!this.shipLandingState.resolvedLandingQuality) {
      this.shipLandingState = this.shipLandingSequence.forceQuality("rough");
    }
    const quality = this.shipLandingState.resolvedLandingQuality ?? "rough";
    this.shipState = this.shipManager.initializeForRaidWithQuality(quality);
    this.landedShip.settleAfterDescent(this.shipState);
    this.shipLandingState = this.shipLandingSequence.markTouchdownApplied();
    this.shipLandingState = this.shipLandingSequence.skipToComplete("K skip");
    this.shipLandingAudioPhase = "complete";
    this.orbitalDeploymentScene.setEnabled(false);
    this.completeShipLandingDeployment();
    this.combatHud.showLootNotification(`Deployment skipped | ${quality}`);
  }

  private applyShipLandingCamera(dt: number): void {
    const input = this.input.snapshot;
    const descentProgress = this.shipLandingState.descentProgress;
    if (!this.deploymentCameraInitialized) {
      this.deploymentCameraYaw = 0;
      this.deploymentCameraPitch = 0.32;
      this.deploymentCameraDistance = 15;
      this.deploymentCameraDistanceTarget = 15;
      this.deploymentCameraInitialized = true;
    }

    this.deploymentCameraYaw += input.lookX * 0.0009;
    this.deploymentCameraPitch = clamp(this.deploymentCameraPitch + input.lookY * 0.0008, -0.42, 0.82);
    if (input.zoomDelta !== 0) {
      this.deploymentCameraDistanceTarget = clamp(this.deploymentCameraDistanceTarget + input.zoomDelta * 0.9, 9.5, 23);
    }
    const zoomBlend = 1 - Math.exp(-9 * dt);
    this.deploymentCameraDistance += (this.deploymentCameraDistanceTarget - this.deploymentCameraDistance) * zoomBlend;

    const altitude = (1 - descentProgress) * 24;
    const forwardOffset = -(1 - descentProgress) * 68;
    const lateralOffset = this.shipLandingState.alignmentOffset * 5.5 * (1 - descentProgress);
    const shipFocus = mapLayoutConfig.shipLandingSitePosition.add(new Vector3(lateralOffset, 2.2 + altitude, forwardOffset));
    const { forward, right } = yawToBasis(this.deploymentCameraYaw);
    const pitchRise = Math.sin(this.deploymentCameraPitch) * this.deploymentCameraDistance;
    const flatDistance = Math.cos(this.deploymentCameraPitch) * this.deploymentCameraDistance;
    const orbitOffset = forward.scale(-flatDistance).addInPlace(new Vector3(0, pitchRise, 0));
    const shoulderBias = right.scale(1.25);
    const desiredCamera = shipFocus.add(orbitOffset).addInPlace(shoulderBias);
    const qualityShake = this.shipState.landingQuality === "clean" ? 0.06 : this.shipState.landingQuality === "rough" ? 0.12 : 0.2;
    const shake = this.shipLandingState.phase === "touchdown"
      ? Math.sin(this.shipLandingState.phaseElapsed * 42) * (1 - this.shipLandingState.phaseProgress) * qualityShake
      : this.shipLandingState.signalInterferenceActive
        ? Math.sin(this.shipLandingState.phaseElapsed * 21) * 0.045
      : 0;
    const cameraBlend = 1 - Math.exp(-18 * dt);
    const shakenDesired = desiredCamera.add(new Vector3(shake, Math.abs(shake) * 0.35, 0));
    this.camera.position = Vector3.Lerp(this.camera.position, shakenDesired, cameraBlend);
    const lookAhead = yawToBasis(0).forward.scale(5 + descentProgress * 5);
    this.camera.setTarget(shipFocus.add(new Vector3(0, 0.4, 0)).addInPlace(lookAhead));
    this.camera.fov = ((this.shipLandingState.phase === "clearance-burn" ? 72 : 68 - descentProgress * 5) * Math.PI) / 180;
  }

  private updatePlayerStatus(dt: number): void {
    if (!this.isRaidActive) {
      return;
    }

    for (const message of this.playerStatus.update(dt)) {
      this.combatHud.showLootNotification(message);
    }
  }

  private getInputMode(): "gameplay" | "ui" {
    if (this.shipLandingState.active) {
      return "gameplay";
    }

    if (this.raidScreen === "raid" && this.raidOutcome === "active" && this.playerHealth.snapshot.alive) {
      return this.tacticalMapOpen || this.raidBagOpen || this.inventoryManager.snapshot.activeContainer !== null ? "ui" : "gameplay";
    }

    return this.getActiveInputPanel() === "gameplay" ? "gameplay" : "ui";
  }

  private getActiveInputPanel(): string {
    if (!this.menu.classList.contains("hidden")) {
      return this.raidScreen;
    }

    if (this.raidOutcome !== "active") {
      return "raid-result";
    }

    if (!this.playerHealth.snapshot.alive) {
      return "downed";
    }

    if (this.shipLandingState.active) {
      return "landing-sequence";
    }

    if (this.inventoryManager.snapshot.activeContainer !== null) {
      return "loot-panel";
    }

    if (this.tacticalMapOpen) {
      return "tactical-map";
    }

    if (this.raidBagOpen) {
      return "raid-bag";
    }

    return "gameplay";
  }

  private setInputMode(mode: InputMode, activePanel: string): void {
    this.inputMode = mode;
    this.activeInputPanel = activePanel;
    this.overlayState = this.overlayFromPanel(activePanel, mode);
    this.input.setInputMode(mode);
  }

  private overlayFromPanel(panel: string, mode: InputMode): UiOverlayState {
    if (mode === "gameplay") return "gameplay";
    if (panel === "raid-bag") return "raidBag";
    if (panel === "loot-panel") return "lootPanel";
    if (panel === "tactical-map") return "tacticalMap";
    if (panel === "landing-sequence") return "raidResult";
    if (panel === "raid-result" || panel === "downed") return "raidResult";
    if (panel === "loadout") return this.loadoutTab === "cosmetics" ? "styleLocker" : "loadout";
    if (panel === "workbench") return "workbench";
    if (panel === "settings") return "settings";
    if (panel === "raid-select") return "raidSelect";
    if (panel === "stash") return "stash";
    return panel === "menu" ? "stash" : "contracts";
  }

  private releasePointerLockForRaidResult(): void {
    if (this.raidScreen === "raid" && (this.raidOutcome !== "active" || !this.playerHealth.snapshot.alive)) {
      this.input.releasePointerLock();
    }
  }

  private handleRaidInteractions(dt: number): void {
    if (this.raidOutcome !== "active") {
      return;
    }

    this.shipInRange = this.isNearShipZone();

    if (this.gameplayInput.useMedkitPressed) {
      this.useMedkit();
    }

    const extractionAvailable = this.isExtractionAvailable;
    this.extractionState = this.extractionController.update(
      dt,
      this.gameplayInput,
      this.player.state.position,
      this.playerHealth.snapshot.recentDamage,
      extractionAvailable,
    );
    this.shipState = this.shipManager.updateExtractionReadiness(extractionAvailable);
    if (this.extractionState.extracting && !this.previousExtractionStarted) {
      if (this.extractionState.currentZoneId === "personal-ship-return") {
        this.shipAudio.play("ship_launch_sequence");
      }
      this.contractManager.record({
        type: "extraction-started",
        zoneId: this.currentExtractionZoneId(),
      });
    }
    this.previousExtractionStarted = this.extractionState.extracting;

    const pendingHeavyCargoAction = this.getPendingHeavyCargoInputAction();
    if (pendingHeavyCargoAction) {
      this.handleHeavyCargoInteractions();
      return;
    }

    const activeContainer = this.inventoryManager.snapshot.activeContainer;

    if (activeContainer) {
      if (this.gameplayInput.interactPressed) {
        const reason = activeContainer.status === "loading"
          ? "pending"
          : activeContainer.items.length > 0
            ? "already-open"
            : "depleted";
        console.info(`[ClientLoot] repeated open blocked container=${activeContainer.id} reason=${reason}`);
        this.lastSharedContainerClaimRefresh = `repeated open blocked ${activeContainer.id} ${reason}`;
      }
      this.handleLootPanelInput(activeContainer.id);
      return;
    }

    if (this.handleReviveInteraction(dt)) {
      return;
    }

    if (this.handleHeavyCargoInteractions()) {
      return;
    }

    if (this.shipInRange && this.canRepairShip() && (this.gameplayInput.reloadPressed || this.gameplayInput.uiDropPressed)) {
      this.repairShip(this.gameplayInput.uiDropPressed ? "full-stabilize" : "quick-patch");
      return;
    }

    if (
      this.gameplayInput.interactPressed &&
      this.shipInRange &&
      !this.extractionState.insideZone &&
      !this.poiObjectiveManager.hasInteractTarget(this.player.state.position)
    ) {
      this.depositCargoToShip();
      this.lastInteractConsumedBy = "ship";
      return;
    }

    if (
      this.gameplayInput.interactPressed &&
      !this.extractionState.insideZone &&
      !this.poiObjectiveManager.hasInteractTarget(this.player.state.position)
    ) {
      if (this.multiplayerMode) {
        const containerId = this.lootDirector.getNearbyContainerId(this.player.state.position);

        if (containerId) {
          const multiplayer = this.multiplayerClient.snapshot;
          this.lastInteractConsumedBy = "loot-cache";

          if (this.heavyCargoState.carriedByLocalPlayer) {
            this.combatHud.showLootNotification("Heavy cargo carrier cannot access recovery caches");
            this.lastSharedContainerClaimRefresh = `blocked carrier open ${containerId}`;
            return;
          }

          if (this.pendingSharedContainerOpenId === containerId) {
            console.info(`[ClientLoot] repeated open blocked container=${containerId} reason=pending`);
            return;
          }

          if (multiplayer.status !== "connected") {
            this.pendingSharedContainerOpenId = null;
            this.combatHud.showLootNotification("Connection lost - shared cache unavailable");
          } else if (!multiplayer.sharedWorldSupported) {
            this.pendingSharedContainerOpenId = null;
            this.combatHud.showLootNotification("Cache link unavailable");
          } else {
            this.pendingSharedContainerOpenId = containerId;
            this.setActiveSharedContainerPanel(containerId, containerId.includes("reward-chest") ? "reward-chest-interact" : "player-open");
            this.raidBagOpen = false;
            this.selectedLootIndex = 0;
            this.inventoryManager.setActiveContainer({
              id: containerId,
              title: "Recovery Cache",
              status: "loading",
              items: [],
            });
            this.setInputMode("ui", "loot-panel");
            console.info(`[ClientLoot] open allowed container=${containerId} reason=new-container`);
            console.info(`[ClientLoot] open requested container=${containerId} state=idle`);
            this.multiplayerClient.requestContainerOpen(containerId);
            this.noiseSystem.emit("loot", this.player.state.position, this.environmentState.gameplay);
            this.combatHud.showLootNotification("Opening recovery cache...");
          }
        } else {
          this.lastInteractConsumedBy = "none";
        }
        return;
      }

      const container = this.lootDirector.openNearbyContainer(this.player.state.position);

      if (container) {
        this.lastInteractConsumedBy = "loot-cache";
        this.raidBagOpen = false;
        this.selectedLootIndex = 0;
        this.noiseSystem.emit("loot", this.player.state.position, this.environmentState.gameplay);
        this.setActiveSharedContainerPanel(container.id, "player-open");
        this.inventoryManager.setActiveContainer(container);
        this.setInputMode("ui", "loot-panel");
        this.combatHud.showLootNotification(container.items.length > 0 ? "Loot cache opened" : "Cache empty");
        this.sfxAudio.playEvent(container.items.length > 0 ? "loot.open" : "loot.empty");
      }
    }

    if (this.extractionState.completed) {
      if (this.extractionState.currentZoneId === "personal-ship-return") {
        this.shipAudio.play("ship_launch_complete");
      }
      const heavyCargoReward: LootStack[] = this.heavyCargoState.shipSecured
        ? [{ type: "helium-drill-core", label: getItemDefinition("helium-drill-core").label, quantity: 1 }]
        : [];
      if (heavyCargoReward.length > 0) {
        this.heavyCargoManager.markExtracted();
        this.sfxAudio.playEvent("heavy.extracted");
        this.heavyCargoState = this.heavyCargoManager.update(this.player.state, this.landedShip.cargoAccessPosition);
      }
      this.outcomeItems = [...this.raidInventory.items, ...this.shipManager.cargoItems, ...heavyCargoReward, ...this.survivedLoadoutItems];
      this.lootLostItems = [];
      this.contractManager.handleExtraction(this.outcomeItems);
      this.flushContractMessages();
      if (this.pvpKillsThisRaid === 0) {
        const delta = this.reputation.apply("clean-extract");
        this.combatHud.showLootNotification(`Clean extract reputation ${this.formatDelta(delta)}`);
      }
      this.persistentStash.addItems(this.outcomeItems);
      this.vendorManager.recordExtraction(this.objectiveWasCompleted);
      this.finalizeRaidResult("extracted", "extracted_clean");
      this.inventoryManager.clearRaid();
      this.clearActiveSharedContainerPanel("extract");
      this.raidBagOpen = false;
      this.selectedRaidBagIndex = 0;
      this.selectedLootIndex = 0;
      this.clearTacticalNavTarget("extraction");
      this.raidOutcome = "extracted";
      if (!this.multiplayerExtractSent) {
        this.multiplayerExtractSent = true;
        this.multiplayerClient.sendExtracted();
      }
    }

    if (!this.playerHealth.snapshot.alive) {
      this.finishRaidAsLost("dead");
    }
  }

  private finishRaidAsLost(reason: Exclude<RaidExitReason, "extracted">): void {
    if (this.raidOutcome === "lost") {
      return;
    }

    this.contractManager.record({ type: "player-death" });
    this.weaponController.applyDeathWear();
    this.outcomeItems = this.shipManager.cargoItems;
    this.lootLostItems = [...this.raidInventory.items, ...this.lostLoadoutItems];
    // TODO: Future ship theft, ship damage, and alternate extraction states should decide
    // whether deposited ship cargo stays secured after a player loss.
    if (this.outcomeItems.length > 0) {
      this.persistentStash.addItems(this.outcomeItems);
    }
    this.finalizeRaidResult("lost", this.getLostRaidResultKind(reason));
    this.inventoryManager.clearRaid();
    this.clearActiveSharedContainerPanel("return-habitat");
    this.raidInventory.setBonusSlots(this.calculateRaidBagBonusSlots());
    this.raidBagOpen = false;
    this.selectedRaidBagIndex = 0;
    this.selectedLootIndex = 0;
    this.clearTacticalNavTarget(reason);
    this.raidOutcome = "lost";
    this.combatHud.showLootNotification(reason === "downed_abandon" ? "Crater Run abandoned - EVA Pack lost" : "BAG FUMBLED");

    if (!this.multiplayerDeathSent) {
      this.multiplayerDeathSent = true;
      this.multiplayerClient.sendDead();
    }
  }

  private handleLootPanelInput(containerId: string): void {
    const container = this.inventoryManager.snapshot.activeContainer;

    if (!container) {
      return;
    }

    if (container.status === "loading") {
      this.lastSharedContainerClaimRefresh = `panel empty blocked container=${containerId} reason=awaiting-authority`;
      console.info(`[ClientLoot] panel empty blocked container=${containerId} reason=awaiting-authority`);
      return;
    }

    if (container.items.length === 0) {
      this.lastSharedContainerClaimRefresh = `panel empty container=${containerId} reason=authority-empty`;
    }
  }

  private takeLootItem(containerId: string, itemIndex: number): void {
    if (this.multiplayerMode) {
      const item = this.inventoryManager.snapshot.activeContainer?.items[itemIndex];
      if (!item) {
        this.inventoryManager.setWarning("No recoverable contents");
        this.combatHud.showLootNotification("No recoverable contents");
        return;
      }
      if (item.known !== false && !this.raidInventory.canAdd(item.type, item.quantity)) {
        this.inventoryManager.setWarning("EVA Pack full - drop or use items before claiming");
        this.combatHud.showLootNotification("EVA Pack full - drop or use items before claiming");
        return;
      }
      const expectedType = item.rawType ?? item.type;
      console.info(`[ClientLoot] claim sent container=${containerId} itemId=${expectedType} rawType=${item.rawType ?? "none"}`);
      this.multiplayerClient.requestContainerClaim(containerId, itemIndex, {
        type: expectedType,
        quantity: item.quantity,
      });
      return;
    }

    const eventResult = this.lootDirector.takeItem(containerId, itemIndex, this.raidInventory);

    if (!eventResult) {
      this.inventoryManager.setWarning("Inventory Full");
      this.combatHud.showLootNotification("Inventory Full");
    } else {
      this.inventoryManager.clearWarning();
      this.applyLootRewards([eventResult]);
      this.combatHud.showLootNotification(eventResult);
    }

    this.inventoryManager.refreshActiveContainer(this.lootDirector.getContainerView(containerId));
  }

  private takeAllLoot(containerId: string): void {
    if (this.multiplayerMode) {
      const items = this.inventoryManager.snapshot.activeContainer?.items ?? [];
      if (this.inventoryManager.snapshot.activeContainer?.status === "loading") {
        this.inventoryManager.setWarning("Loading cache contents");
        this.combatHud.showLootNotification("Loading cache contents...");
        return;
      }
      if (items.length === 0) {
        this.inventoryManager.setWarning("No recoverable contents");
        this.combatHud.showLootNotification("No recoverable contents");
        return;
      }
      if (!this.raidInventory.canAddAll(items)) {
        this.inventoryManager.setWarning("EVA Pack full - drop or use items before claiming");
        this.combatHud.showLootNotification("EVA Pack full - drop or use items before claiming");
        return;
      }
      console.info(`[ClientLoot] claim sent container=${containerId} itemId=all rawType=all`);
      this.multiplayerClient.requestContainerClaim(containerId, "all");
      return;
    }

    const events = this.lootDirector.takeAll(containerId, this.raidInventory);

    if (events.length === 0) {
      this.inventoryManager.setWarning("Inventory Full");
      this.combatHud.showLootNotification("Inventory Full");
    } else {
      this.inventoryManager.clearWarning();
      this.applyLootRewards(events);
      this.combatHud.showLootNotification(`Took ${events.length} item${events.length > 1 ? "s" : ""}`);
    }

    this.inventoryManager.refreshActiveContainer(this.lootDirector.getContainerView(containerId));
  }

  private setActiveSharedContainerPanel(containerId: string, source: "player-open" | "panel-switch" | "reward-chest-interact"): void {
    if (this.activeSharedContainerPanelId !== containerId) {
      console.info(`[ClientLoot] active container set container=${containerId} source=${source}`);
    }
    this.activeSharedContainerPanelId = containerId;
  }

  private clearActiveSharedContainerPanel(reason: "close" | "depleted" | "extract" | "return-habitat" | "reset"): void {
    if (this.activeSharedContainerPanelId) {
      console.info(`[ClientLoot] active container cleared reason=${reason}`);
    }
    this.activeSharedContainerPanelId = null;
  }

  private closeRaidBag(reason: "button" | "escape" | "tab"): void {
    this.inventoryManager.clearWarning();
    this.raidBagOpen = false;
    if (this.inventoryManager.snapshot.activeContainer === null) {
      this.setInputMode("gameplay", "gameplay");
      this.input.captureGameplayPointer();
    }
    console.info(`[EvaPack] close reason=${reason}`);
    this.combatHud.showLootNotification("EVA Pack closed");
  }

  private closeLootPanel(containerId: string, reason: "close" | "close-bag-click" | "escape" | "tab" = "close"): void {
    console.info(`[ClientLoot] panel close active=${this.activeSharedContainerPanelId ?? containerId} reason=${reason}`);
    this.lootDirector.closeContainer(containerId);
    this.inventoryManager.setActiveContainer(null);
    this.inventoryManager.clearWarning();
    this.raidBagOpen = false;
    this.clearActiveSharedContainerPanel("close");
    if (this.pendingSharedContainerOpenId === containerId) {
      this.pendingSharedContainerOpenId = null;
    }
    if (this.raidScreen === "raid" && this.raidOutcome === "active" && this.playerHealth.snapshot.alive) {
      this.setInputMode("gameplay", "gameplay");
      this.input.captureGameplayPointer();
    }
  }

  private updatePoiArrivalState(): void {
    const poi = this.getCurrentPoiDefinition();

    if (!poi || this.poiArrivalVisited.has(poi.id)) {
      return;
    }

    this.poiArrivalVisited.add(poi.id);
    const contractTarget = this.contractManager.snapshot.active?.definition.targetPoi;
    const contractRelevant = contractTarget === poi.id || contractTarget === poi.name;
    this.combatHud.showLootNotification(`${poi.name} | ${this.getPoiDangerLabel(poi.id)} | ${this.getPoiLootProfile(poi.id)}${contractRelevant ? " | Contract Target" : ""}`);
  }

  private updateTravelEvents(dt: number): void {
    if (this.tacticalMapOpen || this.raidTimerState.elapsed < 60) {
      return;
    }

    this.travelEventCooldown = Math.max(0, this.travelEventCooldown - dt);
    if (this.travelEventCooldown > 0 || this.distanceTo(mapLayoutConfig.shipLandingSitePosition) < 38) {
      return;
    }

    const inPoi = this.getCurrentPoiDefinition() !== null;
    const options = inPoi
      ? ["Scanner static across the ridge", "Lumen pulse detected nearby", "Dust interference passing"]
      : ["Distant Lumen screech", "Dust gust crossing route", "Emergency supply ping weak", "Extraction beacon interference"];
    const farSide = this.distanceTo(new Vector3(118, 0, 82)) < 40;
    const message = farSide ? "Alien growth pulse ripples through comms" : options[Math.floor(Math.random() * options.length)];
    this.lastTravelEvent = message;
    this.travelEventCooldown = 34 + Math.random() * 28;
    this.combatHud.showLootNotification(message);
  }

  private updateBoundaryFeedback(dt: number): void {
    this.boundaryWarningCooldown = Math.max(0, this.boundaryWarningCooldown - dt);
    if (this.boundaryWarningCooldown > 0 || this.distanceToBoundary() > 14) {
      return;
    }

    this.boundaryWarningCooldown = 8;
    this.combatHud.showLootNotification("Signal boundary weak");
  }

  private handleReviveInteraction(dt: number): boolean {
    if (!this.multiplayerMode || !this.playerHealth.snapshot.alive || this.shipLandingState.active) {
      this.reviveTargetId = null;
      this.reviveProgressSeconds = 0;
      return false;
    }

    const target = this.getNearestDownedTeammate(4.2);
    if (!target) {
      this.reviveTargetId = null;
      this.reviveProgressSeconds = 0;
      return false;
    }

    if (this.gameplayInput.interactHeld) {
      const startingRevive = this.reviveTargetId !== target.id || this.reviveProgressSeconds === 0;
      this.reviveTargetId = target.id;
      this.reviveProgressSeconds = Math.min(3.5, this.reviveProgressSeconds + dt);
      this.lastInteractConsumedBy = "revive";
      if (startingRevive) {
        this.sfxAudio.playEvent("revive.start");
      }
      if (this.reviveFeedbackCooldown <= 0) {
        const progress = Math.round((this.reviveProgressSeconds / 3.5) * 100);
        this.combatHud.showLootNotification(`REVIVING ${target.name.toUpperCase()} ${progress}%`);
        this.reviveFeedbackCooldown = 1;
      }
      if (this.reviveProgressSeconds >= 3.5) {
        this.multiplayerClient.requestRevive(target.id);
        this.reviveProgressSeconds = 0;
        this.combatHud.showLootNotification(`REVIVE REQUEST SENT - ${target.name}`);
      }
      return true;
    }

    this.reviveTargetId = target.id;
    this.reviveProgressSeconds = 0;
    if (this.gameplayInput.interactPressed) {
      this.lastInteractConsumedBy = "revive";
      this.combatHud.showLootNotification(`HOLD E TO REVIVE - ${target.name}`);
      return true;
    }
    return false;
  }

  private getNearestDownedTeammate(range: number): NetworkPlayerState | null {
    let nearest: { player: NetworkPlayerState; distance: number } | null = null;
    for (const player of this.multiplayerClient.remotePlayerStates) {
      if (player.status !== "downed" && player.status !== "dead") {
        continue;
      }
      const distance = this.horizontalDistance(this.player.state.position, new Vector3(player.x, player.y, player.z));
      if (distance > range || (nearest && distance >= nearest.distance)) {
        continue;
      }
      nearest = { player, distance };
    }
    return nearest?.player ?? null;
  }

  private getRemotePlayer(playerId: string | null): NetworkPlayerState | null {
    if (!playerId) {
      return null;
    }
    return this.multiplayerClient.remotePlayerStates.find((player) => player.id === playerId) ?? null;
  }

  private handleHeavyCargoInteractions(): boolean {
    if (this.heavyCargoState.carriedByLocalPlayer && this.gameplayInput.uiDropPressed) {
      this.suppressInventoryOverlayForHeavyCargo("drop");
      const dropPosition = this.getHeavyCargoDropPosition();
      if (this.multiplayerMode) {
        if (!this.canSendHeavyCargoAction()) {
          return true;
        }
        this.pendingHeavyCargoRequest = "drop";
        this.multiplayerClient.requestHeavyCargoDrop(heliumDrillCoreHeavyCargoId, {
          x: dropPosition.x,
          y: dropPosition.y,
          z: dropPosition.z,
        });
      } else if (this.heavyCargoManager.tryLocalDrop(dropPosition)) {
        this.heavyCargoState = this.heavyCargoManager.update(this.player.state, this.landedShip.cargoAccessPosition);
      }
      this.lastInteractConsumedBy = "heavy-cargo-drop";
      this.combatHud.showLootNotification("CORE DROPPED - RECOVERABLE | Movement restored");
      this.sfxAudio.playEvent("heavy.drop");
      this.logHeavyCargoUiActionComplete("drop");
      return true;
    }

    if (!this.gameplayInput.interactPressed || this.extractionState.insideZone) {
      return false;
    }

    if (this.heavyCargoState.carriedByLocalPlayer && this.heavyCargoState.distanceToShipCargo <= 4) {
      this.suppressInventoryOverlayForHeavyCargo("secure");
      if (this.multiplayerMode) {
        if (!this.canSendHeavyCargoAction()) {
          return true;
        }
        this.pendingHeavyCargoRequest = "secure";
        this.multiplayerClient.requestHeavyCargoSecure(heliumDrillCoreHeavyCargoId);
      } else if (this.heavyCargoManager.tryLocalSecure(this.landedShip.cargoAccessPosition)) {
        this.heavyCargoState = this.heavyCargoManager.update(this.player.state, this.landedShip.cargoAccessPosition);
        this.onHeavyCargoSecured();
      }
      this.lastInteractConsumedBy = "heavy-cargo-secure";
      this.logHeavyCargoUiActionComplete("secure");
      return true;
    }

    if (
      (this.heavyCargoState.status === "available" || this.heavyCargoState.status === "dropped") &&
      this.heavyCargoManager.canPickup(this.player.state.position)
    ) {
      this.suppressInventoryOverlayForHeavyCargo("pickup");
      if (this.multiplayerMode) {
        if (!this.canSendHeavyCargoAction()) {
          return true;
        }
        this.pendingHeavyCargoRequest = "pickup";
        this.multiplayerClient.requestHeavyCargoPickup(heliumDrillCoreHeavyCargoId);
      } else if (this.heavyCargoManager.tryLocalPickup(this.player.state.position)) {
        this.heavyCargoState = this.heavyCargoManager.update(this.player.state, this.landedShip.cargoAccessPosition);
        this.onHeavyCargoPickedUp();
      }
      this.lastInteractConsumedBy = "heavy-cargo-pickup";
      this.logHeavyCargoUiActionComplete("pickup");
      return true;
    }

    if (this.heavyCargoState.status === "locked" && this.heavyCargoManager.canRelease(this.player.state.position)) {
      this.suppressInventoryOverlayForHeavyCargo("release");
      if (this.multiplayerMode) {
        if (!this.canSendHeavyCargoAction()) {
          return true;
        }
        this.pendingHeavyCargoRequest = "release";
        this.multiplayerClient.requestHeavyCargoRelease(heliumDrillCoreHeavyCargoId);
      } else if (this.heavyCargoManager.tryLocalRelease(this.player.state.position)) {
        this.heavyCargoState = this.heavyCargoManager.update(this.player.state, this.landedShip.cargoAccessPosition);
        this.combatHud.showLootNotification("HEAVY CORE RELEASED | E: Carry core");
        this.sfxAudio.playEvent("heavy.release");
      }
      this.lastInteractConsumedBy = "heavy-cargo-release";
      this.logHeavyCargoUiActionComplete("release");
      return true;
    }

    return false;
  }

  private getHeavyCargoDropPosition(): Vector3 {
    const { forward, right } = yawToBasis(this.player.state.yaw);
    const dropPosition = this.player.state.position
      .add(forward.scale(1.35))
      .addInPlace(right.scale(0.55));
    dropPosition.y = Math.max(0.35, dropPosition.y);
    return dropPosition;
  }

  private canSendHeavyCargoAction(): boolean {
    const snapshot = this.multiplayerClient.snapshot;
    if (snapshot.status !== "connected") {
      this.combatHud.showLootNotification("CONNECTION LOST - MULTIPLAYER ACTIONS UNAVAILABLE");
      return false;
    }

    if (snapshot.heavyCargoAuthority !== "SERVER" || !snapshot.sharedWorldSupported) {
      this.combatHud.showLootNotification("CORE RECOVERY UNAVAILABLE - SERVER NOT READY");
      return false;
    }

    return true;
  }

  private onHeavyCargoPickedUp(): void {
    this.combatHud.showLootNotification("CORE SIGNATURE EXPOSED | LUMEN RESPONSE INBOUND | RETURN CORE TO SHIP");
    this.sfxAudio.playEvent("heavy.pickup");
    this.sfxAudio.playEvent("heavy.exposed");
    this.noiseSystem.emit("loot", this.heavyCargoState.position, this.environmentState.gameplay, 1.6);
    if (!this.heavyCargoPressureSpawned && !this.multiplayerMode) {
      this.heavyCargoPressureSpawned = true;
      this.enemyDirector.spawnEventEnemy("heavy-core-pressure-rusher", "grunt", this.heavyCargoState.position.add(new Vector3(14, 0, 8)), false);
      this.enemyDirector.spawnEventEnemy("heavy-core-pressure-spitter", "spitter", this.heavyCargoState.position.add(new Vector3(-16, 0, 10)), false);
    }
  }

  private onHeavyCargoSecured(): void {
    this.objectiveWasCompleted = true;
    this.objectiveDirector.completeHeavyCargoObjective();
    this.objectiveState = this.objectiveDirector.state;
    this.shipState = this.shipManager.secureHeavyCargo("Helium-3 Drill Core");
    this.landedShip.applyShipState(this.shipState);
    this.updateActiveExtractionZones();
    this.combatHud.showLootNotification("HEAVY CARGO LOADED | EXTRACTION SIGNAL AVAILABLE");
    this.sfxAudio.playEvent("heavy.secure");
  }

  private getCurrentPoiDefinition() {
    return poiDefinitions.find((poi) => {
      return this.horizontalDistance(this.player.state.position, poi.center) <= poi.radius;
    }) ?? null;
  }

  private isNearShipZone(): boolean {
    return Vector3.Distance(this.player.state.position, this.landedShip.cargoAccessPosition) <= this.landedShip.cargoAccessRadius;
  }

  private getShipPrompt(): string {
    const reviveTarget = this.multiplayerMode ? this.getNearestDownedTeammate(4.2) : null;
    if (reviveTarget) {
      const progress = this.reviveTargetId === reviveTarget.id && this.reviveProgressSeconds > 0
        ? ` ${Math.round((this.reviveProgressSeconds / 3.5) * 100)}%`
        : "";
      return `Hold E: Revive ${reviveTarget.name}${progress}`;
    }

    if (!this.shipInRange) {
      return "";
    }

    if (this.heavyCargoState.carriedByLocalPlayer) {
      return "E: Secure Helium-3 Core in ship hold | X: Drop Core";
    }

    if (this.heavyCargoState.shipSecured && this.raidInventory.usedSlots <= 0) {
      return "Heavy cargo secured";
    }

    if (this.raidInventory.usedSlots <= 0) {
      return "Cargo hold available";
    }

    if (this.shipState.cargoUsed >= this.shipState.cargoCapacity) {
      return "Cargo capacity reached";
    }

    return "E: Transfer Cargo";
  }

  private getShipRepairPrompt(): string {
    if (!this.shipInRange || !this.canRepairShip()) {
      return "";
    }

    return "R: Quick Patch | X: Full Stabilize";
  }

  private getShipWarning(): string {
    if (!this.shipInRange) {
      return "";
    }

    if (this.heavyCargoState.shipSecured) {
      return "Heavy Cargo Secured: Helium-3 Drill Core | Extract to retain core";
    }

    if (this.heavyCargoState.carriedByLocalPlayer) {
      return "Heavy core at cargo bay | Load before extraction";
    }

    if (this.isExtractionAvailable && this.shipManager.cargoItems.length > 0) {
      return "Cargo secured in hold | Return available";
    }

    if (this.isExtractionAvailable && this.raidInventory.usedSlots >= 4) {
      return "Return available";
    }

    if (!this.heavyCargoState.shipSecured) {
      return "Extraction locked: secure Helium-3 core in ship hold";
    }

    if (this.shipState.landingQuality === "rough") {
      return "Rough landing: cargo handling degraded";
    }

    if (this.shipState.landingQuality === "damaged") {
      return "Damaged landing: cargo bay compromised";
    }

    return "Ship systems stable";
  }

  private getShipRepairChoices(): string {
    if (!this.shipInRange || !this.canRepairShip()) {
      return "";
    }

    return `
      <button type="button" data-raid-action="ship-repair-quick">Quick Patch: ${this.formatMaterialCost(this.shipManager.repairCost("quick-patch"))}</button>
      <button type="button" data-raid-action="ship-repair-full">Full Stabilize: ${this.formatMaterialCost(this.shipManager.repairCost("full-stabilize"))}</button>
    `;
  }

  private getShipModuleSummary(): string {
    const cargo = this.shipModuleManager.cargoModule;
    return `${cargo.name} T${cargo.tier} | Heavy ${this.shipModuleManager.heavyCargoEnabled ? "enabled" : "locked"}`;
  }

  private depositCargoToShip(): void {
    const result = this.shipManager.depositFromRaidInventory(this.raidInventory);
    this.shipState = this.shipManager.state;
    if (result.deposited.length > 0) {
      this.shipAudio.play("ship_cargo_transfer");
    }
    this.combatHud.showLootNotification(this.formatShipDepositMessage(result));
  }

  private formatShipDepositMessage(result: ShipDepositResult): string {
    const hold = `Cargo Hold: ${this.shipState.cargoUsed} / ${this.shipState.cargoCapacity}`;

    if (result.deposited.length === 0) {
      return `${result.message} | ${hold}`;
    }

    if (result.deposited.length === 1) {
      const item = result.deposited[0];
      const slots = result.transferredSlots === 1 ? "1 slot" : `${result.transferredSlots} slots`;
      return `Cargo transferred: ${item.label} x${item.quantity} (${slots}) | ${hold}`;
    }

    const itemCount = result.deposited.reduce((total, item) => total + item.quantity, 0);
    return `Cargo transferred: ${itemCount} items | ${hold}`;
  }

  private canRepairShip(): boolean {
    return this.shipState.landingQuality !== "clean" && this.shipState.repairStatus !== "repaired";
  }

  private repairShip(choice: ShipRepairChoice): void {
    const result = this.shipManager.repair(choice, (cost) => this.spendRaidMaterials(cost));
    this.shipState = this.shipManager.state;

    if (result.repaired) {
      this.activeRaidPrepScrapSpent += result.scrapCost;
      this.landedShip.applyShipState(this.shipState);
    }

    this.combatHud.showLootNotification(result.repaired
      ? `${result.message} | ${this.formatMaterialCost(result.spent)}`
      : result.message);
  }

  private spendRaidMaterials(cost: Partial<Record<LootType, number>>): boolean {
    const entries = Object.entries(cost).filter((entry): entry is [LootType, number] => {
      return Number.isFinite(entry[1]) && entry[1] > 0;
    });

    if (entries.some(([type, quantity]) => (this.raidInventory.items.find((item) => item.type === type)?.quantity ?? 0) < quantity)) {
      return false;
    }

    for (const [type, quantity] of entries) {
      this.raidInventory.consume(type, quantity);
    }

    return true;
  }

  private spendPersistentMaterials(cost: Partial<Record<LootType, number>>): boolean {
    const entries = Object.entries(cost).filter((entry): entry is [LootType, number] => {
      return Number.isFinite(entry[1]) && entry[1] > 0;
    });

    if (entries.some(([type, quantity]) => (this.persistentStash.items.find((item) => item.type === type)?.quantity ?? 0) < quantity)) {
      return false;
    }

    for (const [type, quantity] of entries) {
      this.persistentStash.remove(type, quantity);
    }

    return true;
  }

  private formatMaterialCost(cost: Partial<Record<LootType, number>>): string {
    const parts = Object.entries(cost)
      .filter(([, quantity]) => Number.isFinite(quantity) && (quantity ?? 0) > 0)
      .map(([type, quantity]) => `-${quantity} ${getItemDefinition(type as LootType).label}`);

    return parts.length > 0 ? parts.join(", ") : "No materials spent";
  }

  private applyLootRewards(events: ReadonlyArray<{ type: LootType; quantity: number }>): void {
    for (const event of events) {
      this.contractManager.record({ type: "item-looted", lootType: event.type, quantity: event.quantity });

      if (event.type === "ammo") {
        this.weaponController.addReserveAmmo(event.quantity);
      } else if (event.type === "battery") {
        this.visibilityToolManager.addBatteryCharge(event.quantity);
        this.visibilityToolState = this.visibilityToolManager.state;
      }
    }
  }

  private useMedkit(): void {
    const status = this.playerStatus.snapshot;
    if ((status.lunarInfection || status.mentalStability < 100) && this.raidInventory.consume("anti-toxin", 1)) {
      this.playerStatus.administerAntiToxin();
      this.noiseSystem.emit("heal", this.player.state.position, this.environmentState.gameplay);
      this.combatHud.showLootNotification("Anti-Toxin administered. Infection cleared.");
      return;
    }

    if (this.raidInventory.consume("advanced-medkit", 1)) {
      this.playerHealth.heal(55);
      this.noiseSystem.emit("heal", this.player.state.position, this.environmentState.gameplay);
      this.combatHud.showLootNotification("Advanced medkit used");
      return;
    }

    if (this.raidInventory.consume("medkit", 1)) {
      this.playerHealth.heal(35);
      this.noiseSystem.emit("heal", this.player.state.position, this.environmentState.gameplay);
      this.combatHud.showLootNotification("Medkit used");
      return;
    }

    if (this.raidInventory.consume("bandage", 1)) {
      this.playerHealth.heal(16);
      this.noiseSystem.emit("heal", this.player.state.position, this.environmentState.gameplay);
      this.combatHud.showLootNotification("Bandage used");
      return;
    }

    if (this.raidInventory.consume("armor-plate", 1)) {
      this.playerHealth.setIncomingDamageMultiplier(loadoutConfig.lightArmorDamageMultiplier * 0.9);
      this.noiseSystem.emit("heal", this.player.state.position, this.environmentState.gameplay);
      this.combatHud.showLootNotification("Armor plate fitted");
      return;
    }

    if (this.raidInventory.consume("improved-armor-plate", 1)) {
      this.playerHealth.setIncomingDamageMultiplier(loadoutConfig.lightArmorDamageMultiplier * 0.82);
      this.noiseSystem.emit("heal", this.player.state.position, this.environmentState.gameplay);
      this.combatHud.showLootNotification("Improved armor plate fitted");
      return;
    }

    if (this.raidInventory.consume("battery", 1)) {
      this.oxygenPercent = Math.min(100, this.oxygenPercent + 35);
      this.oxygenWarningState = this.getOxygenState(this.oxygenPercent);
      this.noiseSystem.emit("heal", this.player.state.position, this.environmentState.gameplay);
      this.combatHud.showLootNotification("Oxygen Cell used");
      return;
    }

    this.combatHud.showLootNotification("No quick-use item");
  }

  private getLostRaidResultKind(reason: Exclude<RaidExitReason, "extracted">): RaidResultKind {
    if (reason === "timer_expired") {
      return "lost_to_zone";
    }

    if (reason === "downed_abandon") {
      return "left_downed";
    }

    if (reason === "abandoned" || reason === "manual_debug") {
      return "raid_abandoned";
    }

    return "bag_fumbled";
  }

  private finalizeRaidResult(outcome: Exclude<RaidOutcome, "active">, resultKind: RaidResultKind): void {
    const securedItems = outcome === "extracted" ? this.outcomeItems : [];
    const shipCargoSecured = this.shipManager.cargoItems;
    const lostItems = outcome === "lost" ? this.lootLostItems : [];
    const valueSource = securedItems.length > 0 ? securedItems : lostItems;
    const lootValue = this.calculateLootValue(valueSource);
    const objectiveBonus = this.objectiveWasCompleted ? 35 : 0;
    const extractionBonus = outcome === "extracted" ? 20 : 0;
    const contractRewards: ContractRewardGrant[] = [];
    const contractXp = contractRewards.reduce((total, grant) => total + grant.reward.xp, 0);
    const contractCredits = contractRewards.reduce((total, grant) => total + grant.reward.credits, 0);
    const contractScrap = contractRewards.reduce((total, grant) => total + grant.reward.scrap, 0);
    const contractWeaponParts = contractRewards.reduce((total, grant) => total + grant.reward.weaponParts, 0);
    const contractRewardLabels = contractRewards.map((grant) => grant.title);
    const xpGained = outcome === "extracted"
      ? Math.max(25, Math.round(lootValue * 3 + objectiveBonus + extractionBonus + contractXp))
      : Math.max(5, Math.round(lootValue * 0.4));
    const creditsGained = outcome === "extracted"
      ? Math.max(10, Math.round(lootValue * 1.8 + (this.objectiveWasCompleted ? 25 : 0) + contractCredits))
      : 0;

    if (creditsGained > 0) {
      this.vendorManager.awardCredits(creditsGained);
    }

    if (outcome === "extracted" && contractRewards.length > 0) {
      const rewardItems: LootStack[] = [];

      if (contractScrap > 0) {
        rewardItems.push({ type: "scrap", label: getItemDefinition("scrap").label, quantity: contractScrap });
      }

      if (contractWeaponParts > 0) {
        rewardItems.push({ type: "weapon-parts", label: getItemDefinition("weapon-parts").label, quantity: contractWeaponParts });
      }

      for (const grant of contractRewards) {
        if (Math.random() <= grant.reward.rareCoreChance) {
          rewardItems.push({ type: "rare-core", label: getItemDefinition("rare-core").label, quantity: 1 });
        }

        for (const [vendorId, amount] of Object.entries(grant.reward.vendorReputation)) {
          this.vendorManager.awardReputation(vendorId as VendorId, amount ?? 0);
        }
      }

      if (rewardItems.length > 0) {
        this.persistentStash.addItems(rewardItems);
      }
    }

    this.loopProfile = {
      xp: this.loopProfile.xp + xpGained,
    };
    this.saveLoopProfile();
    this.raidResultSummary = {
      kind: resultKind,
      title: getRaidResultTitle(resultKind),
      survivalStatus: this.getRaidSurvivalStatus(resultKind),
      raidDurationSeconds: Math.round(this.raidTimerState.elapsed),
      enemiesEliminated: this.enemiesEliminatedThisRaid,
      lootExtracted: securedItems,
      lootLost: lostItems,
      shipCargoSecured,
      shipStatus: this.getShipResultStatus(),
      shipCargoUsed: this.shipState.cargoUsed,
      shipCargoCapacity: this.shipState.cargoCapacity,
      shipLandingQuality: this.formatLandingQuality(this.shipState.landingQuality),
      shipCargoRisk: this.formatShipCargoRisk(),
      shipRepairStatus: this.formatShipRepairStatus(),
      evaPackItemsLeft: this.countLootItems(this.raidInventory.items),
      xpGained,
      creditsGained,
      scrapGained: outcome === "extracted" ? this.countLootQuantity(securedItems, "scrap") + contractScrap : 0,
      scrapSpent: this.activeRaidPrepScrapSpent,
      contractsCompleted: this.getResultContractsCompleted(contractRewardLabels),
      contractsFailed: this.getResultContractsFailed(),
      contractsUnclaimed: this.getResultContractsUnclaimed(),
      poiObjectivesCompleted: this.poiObjectiveOutcomesThisRaid,
      poiObjectiveOutcome: this.getPoiObjectiveOutcome(outcome),
      vendorReputationGained: this.getVendorReputationSummary(outcome),
    };
  }

  private getRaidSurvivalStatus(kind: RaidResultKind): string {
    switch (kind) {
      case "extracted_clean":
        return "Extracted safely. Habitat Stash updated.";
      case "raid_abandoned":
        return "Abandoned Crater Run. Carried EVA Pack lost.";
      case "left_downed":
        return "Downed and left. Revive chance forfeited.";
      case "lost_to_zone":
        return "MIA when the crater timer expired.";
      case "bag_fumbled":
      default:
        return "Eliminated. Carried EVA Pack lost.";
    }
  }

  private getShipResultStatus(): string {
    const cargo = this.shipManager.cargoItems;
    const heavyCargo = this.heavyCargoState.shipSecured ? "Heavy Cargo secured: Helium-3 Drill Core." : "Heavy Cargo not secured.";
    const route = this.shipManager.canStoreSpecialCargo() ? "Heavy cargo route stable." : "Heavy cargo route unavailable.";
    const risk = `Cargo risk ${this.formatShipCargoRisk().toLowerCase()}. Repair ${this.formatShipRepairStatus().toLowerCase()}.`;
    return cargo.length > 0
      ? `${this.shipState.statusLabel}. Ship cargo secured. ${risk} ${route} ${heavyCargo}`
      : `${this.shipState.statusLabel}. No ordinary ship cargo transferred. ${risk} ${route} ${heavyCargo}`;
  }

  private getResultContractsCompleted(contractRewardLabels: readonly string[]): string[] {
    const active = this.contractManager.snapshot.active;
    const labels = [...contractRewardLabels];

    if (active?.status === "ready-to-claim") {
      labels.push(`${active.definition.title} - Ready to submit at Faction Contracts`);
    }

    if (this.heavyCargoState.shipSecured) {
      labels.push("Extract Helium-3 Drill Core - Heavy cargo secured");
    }

    return labels;
  }

  private getResultContractsFailed(): string[] {
    const active = this.contractManager.snapshot.active;

    if (active?.status !== "failed") {
      return [];
    }

    return [`${active.definition.title} - ${active.failedReason ?? "Failed"}`];
  }

  private getResultContractsUnclaimed(): string[] {
    const active = this.contractManager.snapshot.active;

    if (!active) {
      return [];
    }

    if (active.status === "ready-to-claim") {
      return [`${active.definition.title} - Claim rewards from Faction Contracts`];
    }

    if (active.status === "failed" && this.contractObjectiveCompletedThisRaid) {
      return [`${active.definition.title} - Objective complete, reward lost because extraction failed`];
    }

    if (active.extractToClaim) {
      return [`${active.definition.title} - Objective complete, extract required`];
    }

    return [];
  }

  private getPoiObjectiveOutcome(outcome: Exclude<RaidOutcome, "active">): string {
    if (this.poiObjectiveOutcomesThisRaid.length === 0) {
      return "No POI objective completed";
    }

    if (outcome === "extracted") {
      return "POI reward chest unlocked; extracted loot was secured.";
    }

    return "POI objective complete, but EVA Pack rewards were lost because extraction failed.";
  }

  private getVendorReputationSummary(outcome: Exclude<RaidOutcome, "active">): string[] {
    if (outcome !== "extracted") {
      return [];
    }

    return this.objectiveWasCompleted
      ? ["Broker +16", "Mechanic +4", "Scrapper +4", "Medic +2"]
      : ["Scrapper +4", "Medic +2"];
  }

  private calculateLootValue(items: readonly LootStack[]): number {
    return items.reduce((total, item) => {
      const definition = getItemDefinition(item.type);
      return total + definition.value * item.quantity;
    }, 0);
  }

  private countLootItems(items: readonly LootStack[]): number {
    return items.reduce((total, item) => total + item.quantity, 0);
  }

  private formatLandingQuality(quality: LandingQuality): string {
    return quality.charAt(0).toUpperCase() + quality.slice(1);
  }

  private formatShipCargoRisk(): string {
    if (this.shipState.cargoRisk === "secure") {
      return "Secure";
    }

    return this.shipState.cargoRisk === "unstable" ? "Unstable" : "Compromised";
  }

  private formatShipRepairStatus(): string {
    if (this.shipState.repairStatus === "stable") {
      return "Stable";
    }

    return this.shipState.repairStatus === "repaired" ? "Repaired" : "Unrepaired";
  }

  private countLootQuantity(items: readonly LootStack[], type: LootType): number {
    return items
      .filter((item) => item.type === type)
      .reduce((total, item) => total + item.quantity, 0);
  }

  private formatContractReward(reward: ContractRewardGrant["reward"]): string {
    const reputation = Object.entries(reward.vendorReputation)
      .map(([vendorId, amount]) => `${vendorId} +${amount}`)
      .join(", ");
    const parts = [
      `${reward.credits} credits`,
      `${reward.xp} XP`,
      reward.scrap > 0 ? `${reward.scrap} scrap` : "",
      reward.weaponParts > 0 ? `${reward.weaponParts} weapon parts` : "",
      reputation ? `Rep: ${reputation}` : "",
      reward.rareCoreChance > 0 ? `${Math.round(reward.rareCoreChance * 100)}% core chance` : "",
      reward.contractPoints ? `${reward.contractPoints} contract points` : "",
      reward.reputationTokens ? `${reward.reputationTokens} rep token${reward.reputationTokens === 1 ? "" : "s"}` : "",
      reward.rareCrateChance ? `${Math.round(reward.rareCrateChance * 100)}% rare crate` : "",
      reward.recipeUnlock ? `Unlock: ${reward.recipeUnlock}` : "",
    ].filter(Boolean);

    return `Reward: ${parts.join(" | ")}`;
  }

  private grantContractRewardImmediately(grant: ContractRewardGrant): void {
    const multiplier = this.selectedRaidDefinition.contractRewardMultiplier;
    const credits = Math.max(0, Math.round(grant.reward.credits * multiplier));
    const xp = Math.max(0, Math.round(grant.reward.xp * multiplier));
    const scrap = Math.max(0, Math.round(grant.reward.scrap * multiplier));
    const weaponParts = Math.max(0, Math.round(grant.reward.weaponParts * multiplier));
    const vendorReputation = Object.fromEntries(
      Object.entries(grant.reward.vendorReputation)
        .map(([vendorId, amount]) => [vendorId, Math.max(0, Math.round((amount ?? 0) * multiplier))]),
    ) as Partial<Record<VendorId, number>>;

    this.vendorManager.awardCredits(credits);
    this.loopProfile = {
      xp: this.loopProfile.xp + xp,
    };
    this.saveLoopProfile();

    const rewardItems: LootStack[] = [];

    if (scrap > 0) {
      rewardItems.push({ type: "scrap", label: getItemDefinition("scrap").label, quantity: scrap });
    }

    if (weaponParts > 0) {
      rewardItems.push({ type: "weapon-parts", label: getItemDefinition("weapon-parts").label, quantity: weaponParts });
    }

    if (Math.random() <= grant.reward.rareCoreChance) {
      rewardItems.push({ type: "rare-core", label: getItemDefinition("rare-core").label, quantity: 1 });
    }

    if (Math.random() <= (grant.reward.rareCrateChance ?? 0)) {
      rewardItems.push({ type: "rare-upgrade-kit", label: getItemDefinition("rare-upgrade-kit").label, quantity: 1 });
    }

    if (rewardItems.length > 0) {
      this.persistentStash.addItems(rewardItems);
    }

    for (const [vendorId, amount] of Object.entries(vendorReputation)) {
      this.vendorManager.awardReputation(vendorId as VendorId, amount ?? 0);
      this.vendorManager.recordContractClaim(grant.contractId, vendorId as VendorId);
    }

    console.info("[ContractManager] Contract reward granted", {
      contractId: grant.contractId,
      credits,
      xp,
      vendorReputation,
      contractPoints: grant.reward.contractPoints ?? "tier-default",
      reputationTokens: grant.reward.reputationTokens ?? "tier-default",
      raidTier: this.selectedRaidDefinition.name,
      multiplier,
      status: "granted",
    });
    this.combatHud.showLootNotification(`${grant.title} payout claimed`);
  }

  private currentExtractionZoneId(): string | null {
    return extractionZoneDefinitions
      .filter((zone) => this.extractionState.activeZoneIds.includes(zone.id))
      .find((zone) => {
        const distance = Math.hypot(
          this.player.state.position.x - zone.center.x,
          this.player.state.position.z - zone.center.z,
        );
        return distance <= zone.radius;
      })?.id ?? this.extractionState.currentZoneId;
  }

  private recordPrepScrapSpend(previousScrapSpent: number): void {
    const delta = Math.max(0, this.craftingManager.snapshot.scrapSpent - previousScrapSpent);
    this.prepScrapSpentSinceLastRaid += delta;
  }

  private updateJamNoise(): void {
    const clearingJam = this.weaponController.snapshot.clearingJam;

    if (clearingJam && !this.wasClearingJam) {
      this.noiseSystem.emit("clear-jam", this.player.state.position, this.environmentState.gameplay);
    }

    this.wasClearingJam = clearingJam;
  }

  private handleTraversalEvents(): void {
    for (const event of this.traversalController.consumeEvents()) {
      if (event.type === "jump-pad") {
        this.noiseSystem.emit("jump-pad", event.position, this.environmentState.gameplay);
        this.combatHud.showLootNotification("Launch pad fired - loud rotation");
      } else if (event.type === "fall-damage") {
        const damage = Math.round(event.amount ?? 0);
        this.playerHealth.applyDamage(damage);
        this.combatHud.showLootNotification(`Hard landing -${damage} HP`);
      } else if (event.type === "land-impact") {
        this.combatHud.showLootNotification("Heavy landing");
      }
    }
  }

  private updateReturnToMenu(): void {
    const input = this.input.snapshot;
    const confirmPressed = input.restartPressed || input.jumpPressed || input.uiConfirmPressed;

    if (this.raidOutcome === "active" || !confirmPressed) {
      return;
    }

    console.info("Return to HQ clicked", {
      resultReason: this.raidOutcome === "extracted" ? "extracted" : "dead",
      nextScreen: "menu",
    });
    this.exitRaidToHQ(this.raidOutcome === "extracted" ? "extracted" : "dead");
  }

  private updateReturnToHqHold(dt: number): void {
    const canHoldToExit = this.raidScreen === "raid" &&
      (this.raidOutcome !== "active" || !this.playerHealth.snapshot.alive);

    if (!canHoldToExit || !this.input.snapshot.returnToHqHeld) {
      this.returnToHqHoldSeconds = 0;
      this.returnToHqConfirmShown = false;
      return;
    }

    this.returnToHqHoldSeconds = Math.min(2, this.returnToHqHoldSeconds + dt);

    if (this.returnToHqHoldSeconds < 2 || this.returnToHqConfirmShown) {
      return;
    }

    this.returnToHqConfirmShown = true;
    const reason = this.raidOutcome === "active"
      ? this.playerHealth.snapshot.alive ? "abandoned" : "downed_abandon"
      : this.raidOutcome === "extracted" ? "extracted" : "dead";
    this.exitRaidToHQ(reason);
  }

  private exitRaidToHQ(reason: RaidExitReason): void {
    if (reason !== "extracted" && this.raidOutcome === "active") {
      if (this.playerHealth.snapshot.alive && this.hasRecoverableRaidLoot() && !window.confirm("Return to habitat and lose carried EVA Pack loot?")) {
        this.returnToHqHoldSeconds = 0;
        this.returnToHqConfirmShown = false;
        return;
      }

      this.finishRaidAsLost(reason);
      this.returnToHqHoldSeconds = 0;
      this.returnToHqConfirmShown = false;
      return;
    }

    this.returnToHqHoldSeconds = 0;
    this.returnToHqConfirmShown = false;
    this.inventoryManager.setActiveContainer(null);
    this.inventoryManager.clearWarning();
    this.raidBagOpen = false;
    this.selectedRaidBagIndex = 0;
    this.selectedLootIndex = 0;
    this.tacticalMapOpen = false;
    this.tacticalMapSelectedPoiId = null;
    this.tacticalMapSelectedTargetId = null;
    this.clearTacticalNavTarget(`return-hq-${reason}`);
    this.coverController.reset();
    this.traversalController.reset();
    this.coverState = this.coverController.state;
    this.traversalState = this.traversalController.state;
    this.cameraRig.setCoverModifier({ active: false, peek: 0 });
    this.cameraRig.setTraversalLocked(false);
    this.input.releasePointerLock();
    if (this.multiplayerMode) {
      this.multiplayerClient.leaveRoom(`return to HQ after ${reason}`);
      this.multiplayerMode = false;
      this.heavyCargoManager.reset();
      this.heavyCargoState = this.heavyCargoManager.update(this.player.state, this.landedShip.cargoAccessPosition);
      this.pendingHeavyCargoRequest = "none";
      this.lastHeavyCargoRoomId = null;
    }
    this.loadingScreen.show("Returning to HQ", 1600);
    this.worldMap.setContractVariant(null, null);
    this.showMainMenu();
  }

  private hasRecoverableRaidLoot(): boolean {
    return this.raidInventory.items.length > 0 || this.survivedLoadoutItems.length > 0;
  }

  private startRaid(multiplayerMode = false): void {
    this.multiplayerMode = multiplayerMode;
    this.loadingScreen.show(`Loading Into Crater Run | ${this.selectedRaidDefinition.name}`, 2400);
    this.loadoutManager.applyToLoadout(this.loadout, this.persistentStash.items);
    this.loadout.clampToStash(this.persistentStash.items);
    this.activeLoadout = this.loadout.snapshot;
    this.raidScreen = "raid";
    stopMusic();
    this.raidMusicStartedForCurrentRun = false;
    this.menu.classList.add("hidden");
    this.activeRaidPrepScrapSpent = this.prepScrapSpentSinceLastRaid;
    this.prepScrapSpentSinceLastRaid = 0;
    this.consumeLoadout();
    this.resetRaid();
  }

  private async startMultiplayerRaid(): Promise<void> {
    this.loadingScreen.show("Connecting to Multiplayer Crater Run", 1400);
    this.combatHud.showLootNotification("Connecting to dedicated server...");
    const connected = await this.multiplayerClient.connect();

    if (!connected) {
      this.combatHud.showLootNotification("Multiplayer server unavailable");
      this.showMultiplayerConnectionFailure();
      return;
    }

    this.combatHud.showLootNotification("Joined multiplayer room");
    this.startRaid(true);
  }

  private showMultiplayerConnectionFailure(): void {
    this.raidScreen = "menu";
    this.menu.classList.remove("hidden");
    this.menuContent.classList.remove("hq-command-content", "class-deploy-content", "ship-dashboard-content", "arsenal-workbench-content");
    const snapshot = this.multiplayerClient.snapshot;
    const diagnostics = [
      "DARK CRATERS multiplayer connection failure",
      `Server endpoint: ${this.multiplayerClient.serverEndpoint}`,
      `Matchmaking endpoint: ${this.multiplayerClient.matchmakingEndpoint}`,
      `Status: ${snapshot.status}`,
      `Room: ${snapshot.roomId ?? "none"}`,
      `Last lifecycle: ${snapshot.lastRoomLifecycleEvent}`,
      `Last event: ${snapshot.lastEvent}`,
      `Last error: ${this.multiplayerClient.lastConnectError}`,
    ].join("\n");

    this.menuContent.innerHTML = `
      <div class="multiplayer-failure-screen">
        <section class="multiplayer-failure-panel">
          <span>Multiplayer Diagnostics</span>
          <h2>Connection Failed</h2>
          <p>The Crater Run server did not accept a room connection. Stay here to retry or copy diagnostics instead of silently returning to Habitat.</p>
          <div class="multiplayer-diagnostic-grid">
            <span>Server URL</span><strong>${this.escapeHtml(this.multiplayerClient.serverEndpoint)}</strong>
            <span>Matchmaking</span><strong>${this.escapeHtml(this.multiplayerClient.matchmakingEndpoint)}</strong>
            <span>Status</span><strong>${snapshot.status}</strong>
            <span>Error</span><strong>${this.escapeHtml(this.multiplayerClient.lastConnectError)}</strong>
          </div>
          <textarea readonly aria-label="Multiplayer connection diagnostics">${this.escapeHtml(diagnostics)}</textarea>
          <footer>
            <button type="button" class="class-primary-action" data-action="multiplayer-retry">Retry Multiplayer</button>
            <button type="button" data-action="menu">Return to Habitat</button>
            <button type="button" data-action="multiplayer-copy-diagnostics">Copy Diagnostics</button>
          </footer>
        </section>
      </div>
    `;
    this.bindMenuButtons();
  }

  private copyMultiplayerDiagnostics(): void {
    const snapshot = this.multiplayerClient.snapshot;
    const diagnostics = [
      "DARK CRATERS multiplayer connection failure",
      `Server endpoint: ${this.multiplayerClient.serverEndpoint}`,
      `Matchmaking endpoint: ${this.multiplayerClient.matchmakingEndpoint}`,
      `Status: ${snapshot.status}`,
      `Room: ${snapshot.roomId ?? "none"}`,
      `Last lifecycle: ${snapshot.lastRoomLifecycleEvent}`,
      `Last event: ${snapshot.lastEvent}`,
      `Last error: ${this.multiplayerClient.lastConnectError}`,
    ].join("\n");
    void navigator.clipboard?.writeText(diagnostics)
      .then(() => this.combatHud.showLootNotification("Multiplayer diagnostics copied"))
      .catch(() => this.combatHud.showLootNotification("Copy failed - diagnostics remain on screen"));
  }

  private resetRaid(): void {
    this.raidOutcome = "active";
    this.raidMusicStartedForCurrentRun = false;
    this.outcomeItems = [];
    this.lootLostItems = [];
    this.raidResultSummary = {
      ...emptyRaidResultSummary,
      scrapSpent: this.activeRaidPrepScrapSpent,
    };
    this.contractAlertRecorded = false;
    this.previousExtractionStarted = false;
    this.contractManager.beginRaid();
    this.worldMap.setContractVariant(
      this.contractManager.snapshot.active?.definition.type ?? null,
      this.contractManager.snapshot.active?.definition.targetPoi ?? null,
    );
    this.inventoryManager.clearRaid();
    this.clearActiveSharedContainerPanel("reset");
    this.raidBagOpen = false;
    this.selectedRaidBagIndex = 0;
    this.selectedLootIndex = 0;
    this.tacticalMapOpen = false;
    this.tacticalMapSelectedPoiId = null;
    this.tacticalMapSelectedTargetId = null;
    this.clearTacticalNavTarget("reset");
    this.lastRevealHudLogAt = 0;
    this.lastRevealHudLogKey = "";
    this.lastTacticalMapRevealLogKey = "";
    this.poiArrivalVisited = new Set<string>();
    this.travelEventCooldown = 34;
    this.lastTravelEvent = "none";
    this.boundaryWarningCooldown = 0;
    this.environmentState = this.environmentManager.randomizeForRaid(this.selectedRaidDefinition.tier);
    this.lootDirector.setRareLootChanceMultiplier(this.environmentState.gameplay.rareLootChanceMultiplier);
    const serverLandingQuality = this.multiplayerMode ? this.multiplayerClient.snapshot.landingQuality : null;
    this.landingQualitySource = this.multiplayerMode
      ? serverLandingQuality ? "server" : "fallback"
      : "local";
    this.shipState = this.shipManager.initializeForRaidWithQuality("clean");
    this.shipLandingState = this.shipLandingSequence.start(serverLandingQuality, this.landingQualitySource);
    this.shipLandingAudioPhase = this.shipLandingState.phase;
    this.deploymentCameraInitialized = false;
    this.shipAudio.play("ship_dock_release");
    this.orbitalDeploymentScene.update(this.shipLandingState, mapLayoutConfig.shipLandingSitePosition);
    this.landedShip.applyShipState(this.shipState);
    this.landedShip.setDescentPose(0, this.shipLandingState.approachStability, this.shipLandingState.alignmentOffset);
    this.landedShip.setEnabled(true);
    this.shipInRange = true;
    this.raidTimer.reset(this.selectedRaidDefinition.lengthSeconds);
    this.raidTimerState = this.raidTimer.state;
    this.oxygenPercent = 100;
    this.oxygenWarningState = "normal";
    this.dynamicEventDirector.reset();
    this.dynamicEventState = this.dynamicEventDirector.state;
    this.raidTimedOutHandled = false;
    this.extractionController.reset();
    this.baseExtractionZoneIds = this.extractionController.activeZoneIds;
    this.updateActiveExtractionZones();
    this.extractionState = this.extractionController.state;
    this.playerHealth.reset();
    this.playerStatus.resetForRun();
    this.playerHealth.setIncomingDamageMultiplier(loadoutConfig.lightArmorDamageMultiplier);
    this.player.reset(this.playerSpawn);
    this.targetDummy.reset(new Vector3(-92, 0, -78));
    this.coverController.reset();
    this.coverState = this.coverController.state;
    this.traversalController.reset();
    this.traversalState = this.traversalController.state;
    this.visibilityToolManager.resetForRaid();
    this.tacticalToolManager.resetForRaid();
    this.tacticalToolState = this.tacticalToolManager.state;
    this.visibilityToolState = this.visibilityToolManager.state;
    this.noiseSystem.reset();
    this.lumenRevealSystem.reset();
    this.noiseState = {
      recentType: null,
      recentRadius: 0,
      stealthLabel: "Stealth",
      quiet: false,
    };
    this.wasClearingJam = false;
    this.weaponController.resetForRaid(this.activeLoadout, this.startingReserveAmmo);
    this.addLoadoutSupplies();
    this.lootDirector.reset();
    this.lootDirector.setRareLootChanceMultiplier(
      this.environmentState.gameplay.rareLootChanceMultiplier * this.selectedRaidDefinition.rareLootMultiplier,
    );
    this.heavyCargoManager.reset();
    if (this.multiplayerMode && this.multiplayerClient.snapshot.status !== "connected") {
      this.heavyCargoManager.setDisconnected();
    }
    this.heavyCargoState = this.heavyCargoManager.update(this.player.state, this.landedShip.cargoAccessPosition);
    this.heavyCargoPressureSpawned = false;
    this.pendingHeavyCargoRequest = "none";
    this.activeHeavyCoreNavMarkerCount = 0;
    this.lastHeavyCargoRoomId = this.multiplayerMode ? this.multiplayerClient.snapshot.roomId : null;
    this.combatHud.showLootNotification("Deployment corridor active | K: Skip Deployment");
    this.objectiveDirector.reset("secure-rare-core");
    this.objectiveState = this.objectiveDirector.state;
    this.poiObjectiveManager.reset(
      this.multiplayerMode ? null : this.getActiveContractPoiObjectiveTarget(),
      this.multiplayerMode,
    );
    this.poiObjectiveState = this.poiObjectiveManager.state;
    this.objectiveWasCompleted = false;
    this.multiplayerExtractSent = false;
    this.multiplayerDeathSent = false;
    this.multiplayerDownedSent = false;
    this.pvpKillsThisRaid = 0;
    this.enemiesEliminatedThisRaid = 0;
    this.poiObjectiveOutcomesThisRaid = [];
    this.networkAppliedPoiObjectiveIds.clear();
    this.contractObjectiveCompletedThisRaid = false;
    this.reviveTargetId = null;
    this.reviveProgressSeconds = 0;
    this.reviveFeedbackCooldown = 0;
    this.enemyDirector.dispose();
    this.enemyDirector = new EnemyDirector(this.scene, this.player.root, this.playerHealth, this.enemyDirectorOptions);
    this.enemyDirector.setHitboxDebugVisible(this.enemyHitboxDebugVisible);
    this.enemyDirector.setLosDebugVisible(this.enemyLosDebugVisible);
    this.multiplayerClient.setEnemyHitboxDebugVisible(this.enemyHitboxDebugVisible);
    this.consumePoiObjectiveSpawnRequests();
  }

  private updateActiveExtractionZones(): void {
    const extractionAvailable = this.isExtractionAvailable;
    const activeZoneIds = extractionAvailable
      ? [...this.baseExtractionZoneIds, ...this.dynamicEventDirector.activeTemporaryExtractionZoneIds]
      : [];
    const fallbackZones = activeZoneIds
      .map((id) => extractionZoneDefinitions.find((zone) => zone.id === id))
      .filter((zone): zone is ExtractionZoneDefinition => zone !== undefined);
    const shipZones = extractionAvailable ? [this.getShipExtractionZone()] : [];

    this.extractionController.setActiveZones([...fallbackZones, ...shipZones]);
    this.worldMap.setActiveExtractionZones(activeZoneIds);
  }

  private get isExtractionAvailable(): boolean {
    if (this.objectiveState.type === "secure-rare-core") {
      return this.objectiveWasCompleted;
    }

    return this.raidTimerState.extractionUnlocked || this.objectiveWasCompleted;
  }

  private getShipExtractionZone(): ExtractionZoneDefinition {
    const durationSeconds = this.shipLaunchPrepSeconds();
    return {
      id: "personal-ship-return",
      name: "Personal Ship Return",
      center: this.landedShip.launchAccessPosition,
      radius: this.landedShip.launchAccessRadius,
      durationSeconds,
    };
  }

  private shipLaunchPrepSeconds(): number {
    const landingDelay = this.shipState.landingQuality === "clean" || this.shipState.repairStatus === "repaired"
      ? 0
      : this.shipState.landingQuality === "rough"
        ? 1
        : 2;
    return 5 + landingDelay;
  }

  private getActiveContractPoiObjectiveTarget(): ContractPOIObjectiveTarget | null {
    const active = this.contractManager.snapshot.active;

    if (!active || (active.definition.type !== "poi-objective" && active.definition.type !== "stealth")) {
      return null;
    }

    const objectiveType = active.definition.target.poiObjectiveType;

    if (!objectiveType) {
      return null;
    }

    return {
      poiName: active.definition.targetPoi,
      objectiveType,
    };
  }

  private handleRaidTimeout(): void {
    if (!this.raidTimerState.expired || this.raidTimedOutHandled || this.raidOutcome !== "active") {
      return;
    }

    this.raidTimedOutHandled = true;
    this.playerHealth.setCurrentFromServer(0);
    this.finishRaidAsLost("timer_expired");
    this.combatHud.showLootNotification("MIA - crater timer expired");
  }

  private updateOxygen(dt: number): void {
    if (this.raidOutcome !== "active" || !this.playerHealth.snapshot.alive) {
      return;
    }

    const baseDrainPerSecond = 100 / (12 * 60);
    this.oxygenPercent = Math.max(
      0,
      this.oxygenPercent - baseDrainPerSecond * this.selectedRaidDefinition.oxygenDrainMultiplier * dt,
    );

    if (this.oxygenPercent <= 0) {
      this.playerHealth.applyDamage(6 * dt);
    }

    const nextState = this.getOxygenState(this.oxygenPercent);
    if (nextState !== this.oxygenWarningState) {
      this.oxygenWarningState = nextState;
      this.combatHud.showLootNotification(this.formatOxygenWarning(nextState));
    }
  }

  private getOxygenState(percent: number): "normal" | "half" | "low" | "critical" | "depleted" {
    if (percent <= 0) {
      return "depleted";
    }

    if (percent <= 10) {
      return "critical";
    }

    if (percent <= 25) {
      return "low";
    }

    if (percent <= 50) {
      return "half";
    }

    return "normal";
  }

  private formatOxygenWarning(state: "normal" | "half" | "low" | "critical" | "depleted"): string {
    if (state === "half") return "Oxygen reserves at half.";
    if (state === "low") return "Warning: oxygen low.";
    if (state === "critical") return "Critical oxygen.";
    if (state === "depleted") return "Suit oxygen depleted.";
    return "Oxygen stable.";
  }

  private updateObjective(dt: number): void {
    const previousCompleted = this.objectiveState.completed;
    this.objectiveState = this.objectiveDirector.update(
      dt,
      this.gameplayInput,
      this.player.state,
      this.raidInventory,
    );

    if (!previousCompleted && this.objectiveState.completed && !this.objectiveWasCompleted) {
      this.objectiveWasCompleted = true;
      if (this.tacticalNavTarget?.id === "primary-objective") {
        this.clearTacticalNavTarget("objective-complete");
      }
      this.combatHud.showLootNotification("Objective complete");
    }
  }

  private updatePoiObjectives(dt: number): void {
    this.poiObjectiveState = this.poiObjectiveManager.update(
      dt,
      this.gameplayInput,
      this.player.state,
      this.enemyDebugStates,
    );
    this.consumePoiObjectiveSpawnRequests();

    for (const event of this.poiObjectiveManager.consumeEvents()) {
      if (event.type === "completed") {
        if (this.tacticalNavTarget?.id === event.objectiveId) {
          this.clearTacticalNavTarget("poi-objective-complete");
        }
        const completedObjective = this.poiObjectiveState.objectives.find((objective) => objective.id === event.objectiveId);
        const label = completedObjective
          ? `${completedObjective.title} - ${completedObjective.poiName}`
          : event.message;
        this.poiObjectiveOutcomesThisRaid = [...new Set([...this.poiObjectiveOutcomesThisRaid, label])];
        this.contractObjectiveCompletedThisRaid ||= this.isActiveContractPoiObjectiveEvent(event);
        this.contractManager.record({
          type: "poi-objective-completed",
          event,
          objectiveType: event.objectiveType,
          poiId: event.poiId,
        });
        if (this.multiplayerMode && !this.networkAppliedPoiObjectiveIds.delete(event.objectiveId)) {
          this.multiplayerClient.sendObjectiveComplete(event.objectiveId, event.objectiveType, event.poiId);
        }
      }
      this.combatHud.showLootNotification(event.message);
    }
  }

  private isActiveContractPoiObjectiveEvent(event: { objectiveType: string; poiId: string }): boolean {
    const active = this.contractManager.snapshot.active;

    if (!active || (active.definition.type !== "poi-objective" && active.definition.type !== "stealth")) {
      return false;
    }

    const targetPoi = poiDefinitions.find((poi) => poi.name === active.definition.targetPoi);
    return active.definition.target.poiObjectiveType === event.objectiveType && targetPoi?.id === event.poiId;
  }

  private updateContractAlertState(): void {
    if (this.contractAlertRecorded) {
      return;
    }

    const fullAlert = this.enemyDebugStates.some((enemy) => {
      return enemy.state === "attack" || enemy.state === "chase";
    });

    if (!fullAlert) {
      return;
    }

    this.contractAlertRecorded = true;
    this.contractManager.record({ type: "alert-triggered" });
  }

  private flushContractMessages(): void {
    for (const message of this.contractManager.consumeMessages()) {
      this.combatHud.showLootNotification(message);
    }
  }

  private consumePoiObjectiveSpawnRequests(): void {
    for (const request of this.poiObjectiveManager.consumeSpawnRequests()) {
      if (this.multiplayerMode) {
        console.info(`[Multiplayer PvE] Local POI spawn suppressed pending server encounter routing: ${request.id}`);
        continue;
      }

      this.enemyDirector.spawnEventEnemy(
        request.id,
        request.type,
        request.spawn,
        request.highValueLoot,
      );
    }
  }

  private showMainMenu(): void {
    this.raidScreen = "menu";
    this.shipDashboardPreview.detach("screen-exit");
    this.menuContent.classList.remove("class-deploy-content", "ship-dashboard-content", "arsenal-workbench-content");
    this.menuContent.classList.add("hq-command-content");
    this.cosmeticManager.setActiveClass(this.classManager.snapshot.selectedClassId);
    this.landedShip.setEnabled(false);
    this.orbitalDeploymentScene.setEnabled(false);
    this.shipLandingState = this.shipLandingSequence.reset();
    this.shipAudio.stopAll();
    this.raidMusicStartedForCurrentRun = false;
    void playMenuMusic();
    this.menu.classList.remove("hidden");
    const hqState = this.hqManager.snapshot;
    const credits = this.vendorManager.snapshot.credits;
    const scrap = this.getStashQuantity("scrap");
    const rareCores = this.getStashQuantity("rare-core");
    const dogTags = this.getStashQuantity("dog-tag");
    const level = this.persistentStash.raidLevel;
    const totalXp = this.loopProfile.xp;
    const commandNav: Array<{ label: string; action: string; station: HQStationId }> = [
      { label: "PLAY", action: "start", station: "raid-terminal" },
      { label: "LOADOUT", action: "hq-loadout", station: "loadout-locker" },
      { label: "ARSENAL", action: "arsenal", station: "arsenal" },
      { label: "SHIP", action: "ship-systems", station: "ship-systems" },
      { label: "CLASS", action: "class-assignment", station: "class-assignment" },
      { label: "SKILLS", action: "skill-matrix", station: "skill-matrix" },
      { label: "STASH", action: "stash", station: "stash" },
      { label: "VENDORS", action: "vendors", station: "vendor-row" },
      { label: "STYLE", action: "hq-style", station: "style-locker" },
      { label: "CONTRACTS", action: "intel", station: "intel-board" },
    ];
    const navTabs = commandNav.map((item) => `
      <button
        type="button"
        class="hq-nav-button ${hqState.selectedStationId === item.station ? "active" : ""}"
        data-action="${item.action}"
      >
        ${item.label}
      </button>
    `).join("");
    const loadoutReady = this.getGearScore() >= this.selectedRaidDefinition.recommendedGearScore ? "Run ready" : "Under-geared";
    const gearScore = this.getGearScore();
    const sidearmName = weaponDefinitions[this.loadout.snapshot.sidearmWeaponId].name;
    const primaryWeapon = this.loadout.snapshot.primaryWeaponId;
    const primaryWeaponMarkup = primaryWeapon
      ? `<button type="button" class="hq-inline-link" data-action="hq-inspect-primary">${this.loadout.primaryWeaponName}</button>`
      : `<strong>None</strong>`;
    const activeContract = this.contractManager.snapshot.active?.definition;
    const activeContractLabel = activeContract ? activeContract.title : "No active contract";
    this.menuContent.innerHTML = `
      <div class="hq-screen hq-command-deck">
        <header class="hq-command-topbar">
          <div class="hq-brand-lockup">
            <span>Lunar Habitat</span>
            <strong>${themeConfig.brand.title}</strong>
          </div>
          <nav class="hq-primary-nav" aria-label="Habitat navigation">
            ${navTabs}
          </nav>
          <div class="hq-utility-cluster">
            <span>Cr ${credits}</span>
            <span>Scrap ${scrap}</span>
            <span>He-3 ${rareCores}</span>
            <span>Lv ${level}</span>
            <span>Rep ${this.reputation.value}</span>
            <span>${this.multiplayerClient.snapshot.status}</span>
            <button type="button" data-action="settings">Settings</button>
          </div>
        </header>
        <section class="hq-context-panel">
          <span>Command Feed</span>
          <strong>${activeContractLabel}</strong>
          <p>${this.environmentState.label} conditions queued. ${themeConfig.enemyCollectiveName} signatures rising below the regolith.</p>
          <div>
            <span>XP</span><strong>${totalXp}</strong>
            <span>Faction Tags</span><strong>${dogTags}</strong>
            <span>Multiplayer</span><strong>${this.renderMultiplayerStatusLine()}</strong>
          </div>
        </section>
        <section class="hq-runner-stage">
          <div class="hq-stage-ring"></div>
          ${this.renderHQPlayerPreview()}
          <div class="hq-runner-summary">
            <span>Current Runner</span>
            <strong>${this.classManager.selectedClass.displayName}</strong>
            <div>
              <span>Outfit</span><strong>${this.cosmeticManager.getEquippedName("outfit")}</strong>
              <span>Primary</span>${primaryWeaponMarkup}
              <span>Sidearm</span><button type="button" class="hq-inline-link" data-action="hq-inspect-sidearm">${sidearmName}</button>
              <span>EVA Pack</span><strong>${this.loadoutManager.raidBagUsedSlots}/${this.loadoutManager.raidBagCapacity} ready</strong>
            </div>
          </div>
        </section>
        <section class="hq-deploy-panel">
          <span>Selected Operation</span>
          <strong>${this.selectedRaidDefinition.name}</strong>
          <p>${this.selectedRaidDefinition.description}</p>
          <div>
            <span>Mode</span><strong>Solo / Co-op Ready</strong>
            <span>Gear</span><strong>${gearScore} / ${this.selectedRaidDefinition.recommendedGearScore} ${loadoutReady}</strong>
            <span>Ship</span><strong>${this.shipState.statusLabel}</strong>
            <span>Objective</span><strong>${activeContractLabel}</strong>
          </div>
          <button type="button" class="hq-deploy-button" data-action="start">DEPLOY</button>
          <button type="button" class="hq-secondary-deploy" data-action="multiplayer-start">Deploy Multiplayer</button>
        </section>
      </div>
      <details class="debug-tools">
        <summary>Debug / Development Tools</summary>
        <div class="main-menu-actions debug-actions">
          <button type="button" data-action="debug-grant-resources">Grant Test Resources</button>
          <button type="button" data-action="debug-reset-save">Reset Save / Debug</button>
        </div>
      </details>
    `;
    this.bindMenuButtons();
    this.habitatPreview.mount(this.menuContent.querySelector<HTMLElement>(".hq-runner-preview-host"), {
      variant: "habitat",
      framingMode: "fullBody",
      modelPaths: getClassSuitModelCandidates(this.classManager.snapshot.selectedClassId),
      classId: this.classManager.snapshot.selectedClassId,
      targetHeight: 1.36,
      verticalLift: 0.02,
      cameraRadius: 5.35,
      cameraTargetY: 0.7,
    });
  }

  private showRaidSelectMenu(): void {
    this.raidScreen = "raid-select";
    const gearScore = this.getGearScore();
    const activeContract = this.contractManager.snapshot.active?.definition;
    const cards = raidDefinitions.map((raid) => {
      const weak = gearScore < raid.recommendedGearScore;
      const active = raid.id === this.selectedRaidDefinition.id;
      return `
        <article class="raid-select-card ${active ? "active" : ""} ${weak ? "weak" : ""}" style="--raid-accent: ${raid.accentColor}">
          <span>Tier ${raid.tier} | ${raid.difficultyLabel}</span>
          <strong>${raid.name}</strong>
          <p>${raid.description}</p>
          <div>
            <small>Time</small><b>${Math.round(raid.lengthSeconds / 60)}m</b>
            <small>Loot</small><b>${raid.lootQuality} (${raid.lootMultiplier.toFixed(2)}x)</b>
            <small>Threat</small><b>${raid.enemyDensityLabel}</b>
            <small>Extract</small><b>${raid.extractionRisk}</b>
            <small>O2</small><b>${raid.oxygenPressure} (${raid.oxygenDrainMultiplier.toFixed(2)}x)</b>
            <small>Radiation</small><b>${raid.radiationRisk}</b>
          </div>
          <small>Zone: ${raid.craterZone}</small>
          <small>Best for: ${raid.bestFor}</small>
          <small>Hazards: ${raid.environmentalHazards.join(" / ")}</small>
          <em>${raid.modifiers.join(" / ")}</em>
          <small>${activeContract ? `Active contract: ${activeContract.title}` : "No active contract selected"}</small>
          ${weak ? `<small class="raid-warning">Weak loadout: gear score ${gearScore}, recommended ${raid.recommendedGearScore}</small>` : ""}
          <button type="button" data-action="launch-raid-${raid.id}">Launch Crater Run</button>
        </article>
      `;
    }).join("");

    this.menuContent.innerHTML = `
      <div class="raid-select-screen inspect-screen">
        <header class="inspect-header">
          <div>
            <span>Crater Run Terminal</span>
            <h2>Crater Runs</h2>
            <p>Pick oxygen pressure, Lumen activity, lunar hazards, loot quality, and extraction risk before deployment.</p>
          </div>
          <div class="inspect-currency">
            <span>Gear Score</span><strong>${gearScore}</strong>
            <span>Selected</span><strong>T${this.selectedRaidDefinition.tier}</strong>
            <span>Contract</span><strong>${activeContract ? "Active" : "None"}</strong>
          </div>
          <button type="button" data-action="menu">Back</button>
        </header>
        <section class="raid-select-grid">${cards}</section>
      </div>
      <div class="main-menu-actions">
        <button type="button" data-action="loadout">Loadout</button>
        <button type="button" data-action="intel">Faction Contracts</button>
        <button type="button" data-action="menu">Back to Habitat</button>
      </div>
    `;
    this.bindMenuButtons();
  }

  private showShipSystemsMenu(): void {
    this.raidScreen = "ship-systems";
    const cargo = this.shipModuleManager.cargoModule;
    const next = this.shipModuleManager.nextCargoModule;
    this.menuContent.classList.add("ship-dashboard-content");
    const credits = this.vendorManager.snapshot.credits;
    const scrap = this.getStashQuantity("scrap");
    const rareCores = this.getStashQuantity("rare-core");
    const integrityPercent = Math.max(0, Math.min(100, Math.round(this.shipState.integrity)));
    const conditionLabel = integrityPercent >= 80 ? "GOOD" : integrityPercent >= 55 ? "SERVICEABLE" : "COMPROMISED";
    const upgradeSlotsUsed = this.shipModuleManager.installedModules.filter((module) => module.tier > 0).length;
    const navTabs = [
      ["PLAY", "menu"],
      ["LOADOUT", "hq-loadout"],
      ["ARSENAL", "arsenal"],
      ["SHIP", "ship-systems"],
      ["CLASS", "class-assignment"],
      ["SKILLS", "skill-matrix"],
      ["STASH", "stash"],
      ["VENDORS", "vendors"],
      ["STYLE", "hq-style"],
      ["CONTRACTS", "intel"],
    ].map(([label, action]) => `<button type="button" class="${action === "ship-systems" ? "active" : ""}" data-action="${action}">${label}</button>`).join("");
    const moduleRows = [
      { label: cargo.name, level: `Level ${cargo.tier}`, effect: cargo.effect || "Cargo Capacity +10%", state: "installed" },
      { label: "Standard Extraction Beacon", level: "Level 1", effect: "Extraction Speed +5%", state: "installed" },
      { label: "Empty Slot", level: "Available", effect: "Available for installation", state: "empty" },
      { label: "Empty Slot", level: "Available", effect: "Available for installation", state: "empty" },
    ].map((module) => `
      <article class="ship-dashboard-module ${module.state}">
        <span>${module.level}</span>
        <strong>${module.label}</strong>
        <p>${module.effect}</p>
      </article>
    `).join("");
    const nextCost = next?.installCost ? this.formatMaterialCost(next.installCost) : "";
    const statRows = [
      ["Hull Integrity", `${integrityPercent * 10} / 1000`],
      ["Cargo Capacity", `${this.shipState.cargoUsed} / ${this.shipState.cargoCapacity}`],
      ["Fuel Efficiency", "1.00x"],
      ["Extraction Speed", "1.05x"],
      ["Signal Strength", "1.10x"],
      ["Heat Signature", this.shipState.cargoRisk === "secure" ? "Medium" : "Elevated"],
      ["Upgrade Slots", `${Math.min(upgradeSlotsUsed, 4)} / 4`],
      ["Drone Capacity", "0 / 2"],
    ].map(([label, value]) => `<div><span>${label}</span><strong>${value}</strong></div>`).join("");
    const resourceRows = [
      ["H3", rareCores],
      ["Scrap Alloy", scrap],
      ["Circuit Fragments", this.getStashQuantity("electronics")],
      ["Lumen Essence", this.getStashQuantity("lumen-essence")],
      ["Old Earth Components", this.getStashQuantity("encrypted-data")],
      ["Crater Glass", this.getStashQuantity("crater-tissue")],
      ["Credits", credits],
    ].map(([label, value]) => `<div><span>${label}</span><strong>${typeof value === "number" ? value.toLocaleString() : value}</strong></div>`).join("");
    const activeEffects = [
      ["Cargo Capacity", `+${Math.max(0, cargo.cargoCapacityBonus ?? 0) || 10}%`],
      ["Extraction Speed", "+5%"],
      ["Fuel Efficiency", "+5%"],
    ].map(([label, value]) => `<div><span>${label}</span><strong>${value}</strong></div>`).join("");
    this.menuContent.innerHTML = `
      <div class="ship-dashboard-screen">
        <header class="ship-dashboard-topbar">
          <div class="ship-dashboard-brand">
            <span>Lunar Habitat</span>
            <strong>${themeConfig.brand.title}</strong>
          </div>
          <nav aria-label="Ship systems navigation">${navTabs}</nav>
          <div class="ship-dashboard-resources">
            <span>Cr ${credits}</span>
            <span>Scrap ${scrap}</span>
            <span>H3 ${rareCores}</span>
            <button type="button" data-action="settings">Settings</button>
          </div>
        </header>
        <aside class="ship-identity-panel">
          <span>Ship Identity</span>
          <strong>KESTREL-9</strong>
          <b>PROSPECTOR CLASS</b>
          <p>A refurbished extraction craft built for survival in the most inhospitable places. The past of this ship is unknown.</p>
          <div class="ship-condition-meter">
            <span>Ship Condition</span>
            <strong>${integrityPercent}%</strong>
            <i><em style="width: ${integrityPercent}%"></em></i>
            <b>${conditionLabel}</b>
          </div>
          <div class="ship-live-state">
            <span>Landing</span><strong>${this.formatLandingQuality(this.shipState.landingQuality)}</strong>
            <span>Readiness</span><strong>${this.capitalize(this.shipState.readiness)}</strong>
            <span>Heavy Cargo</span><strong>${this.shipManager.canStoreSpecialCargo() ? "Eligible" : "Unavailable"}</strong>
          </div>
        </aside>
        <main class="ship-overview-panel">
          <header>
            <span>Ship Overview</span>
            <strong>KESTREL-9 // EXTRACTION READY</strong>
          </header>
          <div class="ship-preview-stage">
            <div class="kestrel-silhouette ship-dashboard-preview-host">
              <i></i><b></b><em></em>
              <span class="ship-schematic-label ship-schematic-name">KESTREL-9</span>
              <span class="ship-schematic-label ship-schematic-cargo">CARGO SPINE</span>
              <span class="ship-schematic-label ship-schematic-engine">TWIN BURN</span>
              <span class="ship-schematic-label ship-schematic-nose">SURVEY NOSE</span>
            </div>
            <div>
              <span>Kestrel-9</span>
              <strong>Prospector Extraction Craft</strong>
              <p>${this.shipState.statusLabel}. Cargo risk ${this.capitalize(this.shipState.cargoRisk)}. Heavy recovery ${this.shipModuleManager.heavyCargoEnabled ? "frame online" : "frame pending"}.</p>
            </div>
          </div>
          <section class="ship-dashboard-modules">${moduleRows}</section>
          ${next ? `<button type="button" class="ship-upgrade-button" data-action="ship-upgrade-cargo">Upgrade Cargo: ${next.name} (${nextCost})</button>` : `<button type="button" class="ship-upgrade-button" disabled>Cargo Module Max Tier</button>`}
        </main>
        <aside class="ship-stat-panel">
          <section>
            <span>Ship Statistics</span>
            ${statRows}
          </section>
          <section>
            <span>Resources</span>
            ${resourceRows}
          </section>
          <section>
            <span>Active Effects</span>
            ${activeEffects}
          </section>
        </aside>
        <section class="ship-alert-rail">
          <span>System Alerts</span>
          <b>Minor Hull Damage Detected</b>
          <b>Signal Interference Increases Extraction Risk</b>
        </section>
        <section class="ship-mission-panel">
          <span>Next Mission</span>
          <strong>Crater Exploration</strong>
          <div><span>Risk</span><b>Moderate</b></div>
          <div><span>Travel Cost</span><b>120 H3</b></div>
          <button type="button" data-action="start">Launch Mission</button>
        </section>
      </div>
    `;
    this.bindMenuButtons();
    this.shipDashboardPreview.mount(this.menuContent.querySelector<HTMLElement>(".ship-dashboard-preview-host"));
  }

  private showClassAssignmentMenu(): void {
    this.showPreDeploymentClassMenu("assignment");
  }

  private showPreDeploymentClassMenu(mode: "assignment" | "solo" | "multiplayer" = "assignment"): void {
    this.raidScreen = "class-assignment";
    this.preDeploymentMode = mode;
    this.menuContent.classList.remove("hq-command-content");
    this.menuContent.classList.add("class-deploy-content");
    const selectedClassId = this.classManager.snapshot.selectedClassId;
    const selectedClass = this.classManager.selectedClass;
    const gearScore = this.getGearScore();
    const primaryWeapon = this.loadout.snapshot.primaryWeaponId;
    const primaryLabel = primaryWeapon ? weaponDefinitions[primaryWeapon].name : "None";
    const sidearmLabel = weaponDefinitions[this.loadout.snapshot.sidearmWeaponId].name;
    const modeLabel = mode === "multiplayer" ? "Multiplayer Crater Run" : mode === "solo" ? "Solo Crater Run" : "Assignment Review";
    const deployAction = mode === "multiplayer" ? "class-deploy-multiplayer" : "class-deploy-solo";
    const deployLabel = mode === "multiplayer" ? "Deploy Multiplayer" : "Deploy";
    const cards = classDefinitions.map((definition) => `
      <button
        type="button"
        class="class-choice ${definition.id === selectedClassId ? "active" : ""}"
        data-action="class-select-${definition.id}"
        ${definition.unlocked ? "" : "disabled"}
      >
        <span>${definition.roleLabel}</span>
        <strong>${definition.displayName}</strong>
        <small>${definition.id === selectedClassId ? "Selected" : "Available"}</small>
      </button>
    `).join("");

    this.menuContent.innerHTML = `
      <div class="class-deploy-screen">
        <header class="class-deploy-topbar">
          <div>
            <span>${themeConfig.brand.title}</span>
            <strong>Deployment Assignment</strong>
          </div>
          <div>
            <span>${modeLabel}</span>
            <span>${this.selectedRaidDefinition.name}</span>
          </div>
          <button type="button" data-action="menu">Back</button>
        </header>
        <section class="class-deploy-brief">
          <span>Operation</span>
          <strong>${this.selectedRaidDefinition.name}</strong>
          <p>${this.selectedRaidDefinition.description}</p>
          <div>
            <span>Mode</span><b>${modeLabel}</b>
            <span>Gear</span><b>${gearScore} / ${this.selectedRaidDefinition.recommendedGearScore}</b>
            <span>Ship</span><b>${this.shipState.statusLabel}</b>
          </div>
        </section>
        <section class="class-deploy-stage">
          <div class="class-stage-light"></div>
          <div class="class-runner-preview-host" aria-label="Class assignment runner preview">
            ${this.renderHQPlayerPreview()}
          </div>
          <div class="class-selected-copy">
            <span>Selected Class</span>
            <strong>${selectedClass.displayName}</strong>
            <p>${selectedClass.shortDescription}</p>
            <small>${selectedClass.startingTendency}</small>
          </div>
        </section>
        <section class="class-deploy-detail">
          <span>Readiness</span>
          <strong>${selectedClass.roleLabel}</strong>
          <p>${this.escapeHtml(selectedClass.shortDescription)}</p>
          <div class="class-readiness-grid">
            <span>Primary</span><b>${primaryLabel}</b>
            <span>Sidearm</span><b>${sidearmLabel}</b>
            <span>EVA Pack</span><b>${this.loadoutManager.raidBagUsedSlots}/${this.loadoutManager.raidBagCapacity}</b>
            <span>Route</span><b>${this.selectedRaidDefinition.craterZone}</b>
          </div>
        </section>
        <nav class="class-choice-rail" aria-label="Class choices">
          ${cards}
        </nav>
        <section class="class-action-rail">
          <button type="button" data-action="menu">Return to Habitat</button>
          <button type="button" data-action="raid-select">Change Operation</button>
          <button type="button" data-action="hq-style">Customize Suit</button>
          <button type="button" data-action="class-review-loadout">Review Loadout</button>
          ${mode === "assignment"
            ? `<button type="button" class="class-primary-action" data-action="class-confirm-assignment">Confirm Assignment</button>`
            : `<button type="button" class="class-primary-action" data-action="${deployAction}">${deployLabel}</button>`}
        </section>
        <section class="class-progression-strip" aria-label="Deployment steps">
          <b>Class</b><b>Loadout</b><b>Ship Prep</b><b>Deploy</b>
        </section>
      </div>
    `;
    this.bindMenuButtons();
    this.habitatPreview.mount(this.menuContent.querySelector<HTMLElement>(".class-runner-preview-host .hq-runner-preview-host"), {
      variant: "class-selection",
      framingMode: "fullBody",
      modelPaths: getClassSuitModelCandidates(this.classManager.snapshot.selectedClassId),
      classId: this.classManager.snapshot.selectedClassId,
    });
  }

  private showSkillMatrixMenu(): void {
    this.raidScreen = "skill-matrix";
    const selectedClassId = this.classManager.snapshot.selectedClassId;
    const branchCards = skillBranches.map((branch) => this.renderSkillBranch(branch.id, selectedClassId)).join("");

    this.menuContent.innerHTML = `
      <div class="inspect-screen progression-screen">
        <header class="inspect-header">
          <div>
            <span>Progression Matrix</span>
            <h2>Skill Matrix</h2>
            <p>Prototype calibration only. Acquired nodes do not alter combat, oxygen, ship values, loot, or multiplayer yet.</p>
          </div>
          <div class="inspect-currency">
            <span>Assignment</span><strong>${this.classManager.selectedClass.displayName}</strong>
            <span>Points</span><strong>${this.skillManager.snapshot.availableSkillPoints}</strong>
            <span>Acquired</span><strong>${this.skillManager.acquiredCount}</strong>
          </div>
          <button type="button" data-action="menu">Back</button>
        </header>
        <section class="skill-branch-grid">${branchCards}</section>
      </div>
      <div class="main-menu-actions">
        <button type="button" data-action="class-assignment">Class Assignment</button>
        <button type="button" data-action="ship-systems">Ship Systems</button>
        <button type="button" data-action="menu">Back to Habitat</button>
      </div>
    `;
    this.bindMenuButtons();
  }

  private renderSkillBranch(branchId: SkillBranchId, selectedClassId: ClassId): string {
    const branch = skillBranches.find((candidate) => candidate.id === branchId);
    if (!branch) {
      return "";
    }

    const nodes = skillNodes
      .filter((node) => node.branchId === branchId)
      .sort((left, right) => left.tier - right.tier)
      .map((node) => {
        const acquired = this.skillManager.isAcquired(node.id);
        const available = this.skillManager.canAcquire(node.id);
        const affinity = node.classAffinity === selectedClassId;
        return `
          <article class="skill-node ${acquired ? "acquired" : available ? "available" : "locked"} ${affinity ? "affinity" : ""}">
            <span>Tier ${node.tier}${affinity ? " | assignment affinity" : ""}</span>
            <strong>${node.label}</strong>
            <p>${node.description}</p>
            <button type="button" data-action="skill-acquire-${node.id}" ${available ? "" : "disabled"}>
              ${acquired ? "Calibrated" : available ? "Calibrate" : "Locked"}
            </button>
          </article>
        `;
      }).join("");

    return `
      <article class="skill-branch-card" data-accent="${branch.accent}">
        <span>${branch.label}</span>
        <p>${branch.description}</p>
        <div class="skill-node-list">${nodes}</div>
      </article>
    `;
  }

  private renderMultiplayerStatusLine(): string {
    const status = this.multiplayerClient.snapshot;
    const room = status.roomId ? `Room ${status.roomId}` : "No room";
    const ping = status.pingMs === null ? "ping --" : `ping ${Math.round(status.pingMs)}ms`;
    return `${status.status} | ${room} | ${status.playerCount}/${status.maxPlayers} runners | ${status.lifecycle} | ${ping}`;
  }

  private getLootRoutingMode(status: MultiplayerConnectionSnapshot): string {
    if (!this.multiplayerMode) return "LOCAL";
    if (status.status !== "connected") return "DISCONNECTED";
    return status.sharedWorldSupported ? "SERVER" : "UNSUPPORTED";
  }

  private detectObsidianSentinelPreview(): PreviewModelStatus {
    const path = "/models/player/obsidianSentinelPlayer.glb";
    void fetch(path, { method: "HEAD" })
      .then((response) => {
        this.previewModelStatus = response.ok ? "available" : "fallback";
      })
      .catch((error) => {
        this.previewModelStatus = "fallback";
        console.warn("Obsidian Sentinel preview model unavailable; using primitive preview.", error);
      });
    return "fallback";
  }

  private renderHQPlayerPreview(): string {
    const palette = this.cosmeticManager.getPalette();
    const style = [
      `--preview-hoodie: ${colorToCss(palette.hoodie)}`,
      `--preview-dark: ${colorToCss(palette.jacketDark)}`,
      `--preview-vest: ${colorToCss(palette.vest)}`,
      `--preview-visor: ${colorToCss(palette.visor)}`,
      `--preview-glow: ${colorToCss(palette.glow)}`,
      `--preview-accent: ${colorToCss(palette.accent)}`,
      "--preview-rotation: -8deg",
    ].join("; ");

    return `
      <div class="hq-runner-preview-host" aria-label="HQ Crater Runner preview">
        <div class="raider-preview hq-raider-preview" style="${style}">
          <div class="preview-backpack"></div>
          <div class="preview-head"><span></span></div>
          <div class="preview-torso"><i></i></div>
          <div class="preview-arm left"></div>
          <div class="preview-arm right"></div>
          <div class="preview-leg left"></div>
          <div class="preview-leg right"></div>
          <div class="preview-weapon"></div>
        </div>
      </div>
      <small class="preview-model-status">Preview Model: ${this.previewModelStatus === "available" ? "Obsidian Sentinel available" : "fallback primitive"}</small>
    `;
  }

  private applyCurrentCosmetics(): void {
    const palette = this.cosmeticManager.getPalette();
    this.player.applyCosmeticPalette(palette);
    this.weaponController.applyWrapColor(palette.accent);
  }

  private getGearScore(): number {
    const loadout = this.loadout.snapshot;
    const weaponScore = (loadout.primaryWeaponId ? 28 : 0) + (loadout.sidearmWeaponId ? 12 : 0);
    const armorScore = loadout.armorId ? 16 : 0;
    const backpackScore = this.getStashQuantity("elite-backpack") > 0 || this.getStashQuantity("backpack-upgrade") > 0 ? 10 : 0;
    const medScore = loadout.medkits * 5;
    const ammoScore = loadout.extraAmmoMags * 4;
    return weaponScore + armorScore + backpackScore + medScore + ammoScore;
  }

  private showStashMenu(): void {
    this.raidScreen = "stash";
    const filters: StashFilter[] = ["all", "weapons", "armor", "backpacks", "consumables", "tactical", "attachments", "materials", "contracts", "cosmetics", "junk"];
    const sorts: StashSort[] = ["rarity", "value", "type", "quantity", "newest"];
    const rows = this.getFilteredStashItems()
      .map((item) => {
        const definition = getItemDefinition(item.type);
        const color = colorToCss(themeConfig.rarityColors[definition.rarity]);
        const selected = this.selectedStashType === item.type ? " selected" : "";
        const equipped = this.isEquippedItemType(item.type);
        return `
          <button type="button" class="stash-card${selected}" data-action="stash-select-${item.type}" style="--rarity-color: ${color}">
            <strong>${definition.label}</strong>
            <span>${definition.rarity} | ${definition.category}${equipped ? " | equipped" : ""}</span>
            <small>x${item.quantity} | value ${Math.round(definition.value * item.quantity)}</small>
          </button>
        `;
      })
      .join("");
    const filterTabs = filters
      .map((filter) => `<button type="button" class="${this.stashFilter === filter ? "active" : ""}" data-action="stash-filter-${filter}">${this.formatStashFilter(filter)}</button>`)
      .join("");
    const sortTabs = sorts
      .map((sort) => `<button type="button" class="${this.stashSort === sort ? "active" : ""}" data-action="stash-sort-${sort}">${this.capitalize(sort)}</button>`)
      .join("");
    this.menuContent.innerHTML = `
      <div class="stash-screen inspect-screen">
        <header class="inspect-header">
          <div>
            <span>Persistent Habitat Vault</span>
            <h2>HABITAT STASH</h2>
            <p>Extracted lunar loot, fabrication materials, weapons, and faction contract items stay safe here.</p>
          </div>
          <div class="inspect-currency">
            <span>Credits</span><strong>${this.vendorManager.snapshot.credits}</strong>
            <span>Regolith Scrap</span><strong>${this.getStashQuantity("scrap")}</strong>
            <span>Reputation</span><strong>${this.reputation.value}</strong>
          </div>
          <button type="button" data-action="menu">Back</button>
        </header>
        <aside class="stash-tabs">${filterTabs}</aside>
        <nav class="stash-sort-tabs">
          <input type="search" data-stash-search placeholder="Search stash..." value="${this.escapeHtml(this.stashSearch)}" />
          ${sortTabs}
        </nav>
        <section class="stash-card-grid">
          ${rows || `<span class="empty-loadout-list">No stash items in this filter yet.</span>`}
        </section>
        <section class="stash-detail-panel">
          ${this.renderStashItemDetails()}
        </section>
      </div>
      <div class="main-menu-actions">
        <button type="button" data-action="start">Crater Runs</button>
        <button type="button" data-action="loadout">Loadout</button>
        <button type="button" data-action="inspect">Inspect Weapon</button>
        <button type="button" data-action="workbench">Fabrication Bench</button>
        <button type="button" data-action="settings">Settings</button>
        <button type="button" data-action="menu">Back</button>
      </div>
    `;
    this.bindMenuButtons();
  }

  private getFilteredStashItems(): LootStack[] {
    const rarityOrder = ["core", "legendary", "epic", "rare", "uncommon", "common"];
    const filtered = this.persistentStash.items.filter((item) => {
      const definition = getItemDefinition(item.type);
      const search = this.stashSearch.trim().toLowerCase();
      if (search && !`${definition.label} ${definition.category} ${definition.rarity} ${definition.description}`.toLowerCase().includes(search)) {
        return false;
      }
      if (this.stashFilter === "all") {
        return item.quantity > 0;
      }
      if (this.stashFilter === "weapons") {
        return item.type.startsWith("weapon-");
      }
      if (this.stashFilter === "armor") {
        return item.type.includes("armor") && definition.category === "gear";
      }
      if (this.stashFilter === "backpacks") {
        return item.type.includes("backpack");
      }
      if (this.stashFilter === "consumables") {
        return definition.category === "consumable";
      }
      if (this.stashFilter === "tactical") {
        return item.type.startsWith("tool-");
      }
      if (this.stashFilter === "materials") {
        return definition.category === "material";
      }
      if (this.stashFilter === "attachments") {
        return item.type.startsWith("attachment-") || item.type === "high-tier-suppressor";
      }
      if (this.stashFilter === "contracts") {
        return definition.category === "objective";
      }
      if (this.stashFilter === "cosmetics") {
        return item.type.includes("wrap") || item.type.includes("cosmetic");
      }
      return definition.rarity === "common" && (definition.category === "material" || definition.category === "objective");
    });

    return [...filtered].sort((left, right) => {
      const leftDefinition = getItemDefinition(left.type);
      const rightDefinition = getItemDefinition(right.type);
      if (this.stashSort === "value") {
        return rightDefinition.value * right.quantity - leftDefinition.value * left.quantity;
      }
      if (this.stashSort === "type") {
        return leftDefinition.category.localeCompare(rightDefinition.category) || leftDefinition.label.localeCompare(rightDefinition.label);
      }
      if (this.stashSort === "quantity") {
        return right.quantity - left.quantity;
      }
      if (this.stashSort === "newest") {
        return this.persistentStash.items.indexOf(right) - this.persistentStash.items.indexOf(left);
      }
      return rarityOrder.indexOf(leftDefinition.rarity) - rarityOrder.indexOf(rightDefinition.rarity);
    });
  }

  private renderStashItemDetails(): string {
    const item = this.selectedStashType
      ? this.persistentStash.items.find((candidate) => candidate.type === this.selectedStashType)
      : this.getFilteredStashItems()[0];

    if (!item) {
      return `<article class="loadout-details-card"><strong>No item selected</strong><p>Pick an item to inspect value, slotting, and actions.</p></article>`;
    }

    this.selectedStashType = item.type;
    const definition = getItemDefinition(item.type);
    const color = colorToCss(themeConfig.rarityColors[definition.rarity]);
    const equipped = this.isEquippedItemType(item.type);
    const vendorBuys = vendorDefinitions[this.vendorManager.snapshot.selectedVendorId].buys.includes(item.type);
    const bestVendor = this.bestVendorForItem(item.type);
    return `
      <article class="loadout-details-card stash-detail-card" style="--rarity-color: ${color}">
        <strong>${definition.label}</strong>
        <span>${definition.rarity.toUpperCase()} ${definition.category}</span>
        <p>${definition.description}</p>
        <div><span>Stack</span><strong>${item.quantity}</strong></div>
        <div><span>Value</span><strong>${Math.round(definition.value * item.quantity)}</strong></div>
        <div><span>Status</span><strong>${equipped ? "Equipped / loadout" : "In stash"}</strong></div>
        <div><span>Best Vendor</span><strong>${bestVendor ? vendorDefinitions[bestVendor].name : "No preferred buyer"}</strong></div>
        <div><span>Current Vendor</span><strong>${vendorBuys ? `${vendorDefinitions[this.vendorManager.snapshot.selectedVendorId].name} buys this` : "Switch vendor to sell"}</strong></div>
        <footer>
          <button type="button" data-action="stash-inspect-selected">Inspect</button>
          <button type="button" data-action="stash-loadout-selected">Move to Loadout</button>
          <button type="button" data-action="stash-sell-selected" ${vendorBuys ? "" : "disabled"}>Sell</button>
          <button type="button" data-action="stash-favorite-selected">Favorite</button>
          <button type="button" data-action="stash-discard-selected">Discard</button>
        </footer>
      </article>
    `;
  }

  private formatStashFilter(filter: StashFilter): string {
    if (filter === "all") return "All";
    if (filter === "contracts") return "Contract Items";
    if (filter === "tactical") return "Tactical Tools";
    return this.capitalize(filter);
  }

  private bestVendorForItem(type: LootType): VendorId | null {
    const definition = getItemDefinition(type);
    const preferred = Object.values(vendorDefinitions).find((vendor) => vendor.buys.includes(type));

    if (preferred) {
      return preferred.id;
    }

    if (type.startsWith("weapon-") || type.startsWith("attachment-") || type === "high-tier-suppressor") return "mechanic";
    if (definition.category === "consumable" || type.includes("cloth")) return "medic";
    if (definition.category === "objective" || type === "rare-core" || type === "dog-tag") return "broker";
    if (definition.category === "material") return "scrapper";
    return null;
  }

  private escapeHtml(value: string): string {
    return value
      .replaceAll("&", "&amp;")
      .replaceAll("\"", "&quot;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  }

  private showVendorMenu(): void {
    this.raidScreen = "stash";
    const state = this.vendorManager.snapshot;
    const vendor = this.vendorManager.selectedVendor;
    const vendorButtons = Object.values(vendorDefinitions)
      .map((item) => `
        <button type="button" class="vendor-select-card ${item.id === vendor.id ? "active" : ""}" data-action="vendor-select-${item.id}" style="--vendor-accent: ${item.accentPrimary}; --vendor-accent-secondary: ${item.accentSecondary}">
          <i>${this.vendorIcon(item.id)}</i>
          <strong>${item.name}</strong>
          <span>${item.tagline}</span>
          <small>${item.faction} | Rep ${this.vendorManager.reputationLevel(item.id)}</small>
          <small>${item.specialty}</small>
        </button>
      `)
      .join("");
    const tabs: VendorTab[] = ["buy", "sell", "repair"];
    const tabButtons = tabs
      .map((tab) => `<button type="button" class="${state.selectedTab === tab ? "active" : ""}" data-action="vendor-tab-${tab}">${this.capitalize(tab)}</button>`)
      .join("");
    const level = this.vendorManager.reputationLevel(vendor.id);
    const progress = Math.round(this.vendorManager.reputationProgress(vendor.id) * 100);

    this.menuContent.innerHTML = `
      <div class="vendor-screen inspect-screen" style="--vendor-accent: ${vendor.accentPrimary}; --vendor-accent-secondary: ${vendor.accentSecondary}">
        <header class="inspect-header vendor-hero">
          <div>
            <span>Faction Vendor Economy</span>
            <h2>${vendor.name}</h2>
            <strong>${vendor.tagline}</strong>
            <p>${vendor.specialty}</p>
          </div>
          <div class="vendor-portrait">${this.vendorIcon(vendor.id)}</div>
          <strong>${state.credits} Credits</strong>
        </header>
        <aside class="vendor-list">${vendorButtons}</aside>
        <section class="vendor-panel">
          <div class="vendor-reputation">
            <span>Reputation Level ${level}</span>
            <div><i style="width: ${progress}%"></i></div>
            <small>${progress}% to next unlock</small>
          </div>
          <nav class="vendor-tabs">${tabButtons}</nav>
          ${this.renderVendorTab(state.selectedTab, vendor.id)}
        </section>
      </div>
      <div class="main-menu-actions">
        <button type="button" data-action="loadout">Loadout</button>
        <button type="button" data-action="stash">Habitat Stash</button>
        <button type="button" data-action="start">Crater Runs</button>
        <button type="button" data-action="menu">Back</button>
      </div>
    `;
    this.bindMenuButtons();
  }

  private renderVendorTab(tab: VendorTab, vendorId: VendorId): string {
    if (tab === "sell") {
      const vendor = vendorDefinitions[vendorId];
      const rows = this.persistentStash.items
        .filter((item) => item.quantity > 0 && vendor.buys.includes(item.type))
        .map((item) => {
          const definition = getItemDefinition(item.type);
          const color = colorToCss(themeConfig.rarityColors[definition.rarity]);
          return `
            <button type="button" class="vendor-item" data-action="vendor-sell-${item.type}" style="--rarity-color: ${color}">
              <strong>${definition.label}</strong>
              <span>${item.quantity} in stash</span>
              <small>Sell ${this.vendorManager.sellValue(item.type)} credits</small>
            </button>
          `;
        })
        .join("");
      const sellAll = vendor.id === "scrapper"
        ? `<button type="button" class="vendor-item convert" data-action="vendor-sell-all-junk" style="--rarity-color: ${colorToCss(themeConfig.rarityColors.common)}">
            <strong>Sell All Junk</strong>
            <span>Quick-sells common and uncommon materials this trader buys</span>
            <small>No confirmation for low-tier junk</small>
          </button>`
        : "";
      return `<div class="vendor-item-grid">${sellAll}${rows || `<span class="empty-loadout-list">${vendor.name} is not buying anything you have.</span>`}</div>`;
    }

    if (tab === "repair") {
      if (vendorId !== "mechanic") {
        return `<p class="vendor-note">Only L.E.A. handles standard weapon repairs. Higher faction reputation lowers repair prices.</p>`;
      }

      const loadout = this.loadout.snapshot;
      const weapons = [
        ...(loadout.primaryWeaponId ? [{ label: "Primary", id: loadout.primaryWeaponId }] : []),
        { label: "Sidearm", id: loadout.sidearmWeaponId },
      ] as const;
      const rows = weapons.map((weapon) => {
        const durability = this.weaponController.getDurabilityState(weapon.id).durability;
        const cost = this.vendorManager.repairCost(durability);
        return `
          <button type="button" class="vendor-item" data-action="vendor-repair-${weapon.id}" style="--rarity-color: ${colorToCss(themeConfig.rarityColors.uncommon)}">
            <strong>${weapon.label} ${this.capitalize(weapon.id)}</strong>
            <span>Durability ${Math.round(durability)}%</span>
            <small>${cost > 0 ? `${cost} credits` : "Already serviceable"}</small>
          </button>
        `;
      }).join("");
      return `<div class="vendor-item-grid">${rows}</div>`;
    }

    const availableRows = this.vendorManager.availableInventory(vendorId)
      .map((item) => {
        const definition = getItemDefinition(item.type);
        const color = colorToCss(themeConfig.rarityColors[definition.rarity]);
        return `
          <button type="button" class="vendor-item" data-action="vendor-buy-${item.type}" style="--rarity-color: ${color}">
            <strong>${definition.label}</strong>
            <span>${definition.rarity} ${definition.category}</span>
            <small>${item.price} credits</small>
          </button>
        `;
      })
      .join("");
    const lockedRows = this.vendorManager.lockedInventory(vendorId)
      .map((item) => {
        const definition = getItemDefinition(item.type);
        return `
          <div class="vendor-item locked" style="--rarity-color: ${colorToCss(themeConfig.rarityColors[definition.rarity])}">
            <strong>${definition.label}</strong>
            <span>Unlocks at reputation ${item.minReputationLevel}</span>
            <small>${item.price} credits</small>
          </div>
        `;
      })
      .join("");
    const scrapperConvert = vendorId === "scrapper"
      ? `<button type="button" class="vendor-item convert" data-action="vendor-convert-common" style="--rarity-color: ${colorToCss(themeConfig.rarityColors.common)}">
          <strong>Convert Common Loot</strong>
          <span>Turns cloth, ammo, or battery into scrap</span>
          <small>2 scrap output</small>
        </button>`
      : "";

    return `<div class="vendor-item-grid">${availableRows}${scrapperConvert}${lockedRows}</div>`;
  }

  private vendorIcon(vendorId: VendorId): string {
    if (vendorId === "mechanic") return "L.E.A.";
    if (vendorId === "medic") return "FOS";
    if (vendorId === "broker") return "HEL";
    if (vendorId === "scrapper") return "RATS";
    return "ORDER";
  }

  private formatContractVendorRep(reputation: Partial<Record<VendorId, number>>): string {
    const entries = Object.entries(reputation)
      .filter(([, value]) => (value ?? 0) > 0)
      .map(([vendorId, value]) => `${vendorDefinitions[vendorId as VendorId].name} +${value}`);

    return entries.length > 0 ? entries.join(", ") : "None";
  }

  private getContractFactionMeta(contract: { factionId?: string; reward: { vendorReputation: Partial<Record<VendorId, number>> } }): {
    name: string;
    accent: string;
    motto: string;
  } {
    if (contract.factionId === "lea") {
      return {
        name: themeConfig.factions.lea.name,
        accent: themeConfig.factions.lea.primary,
        motto: themeConfig.factions.lea.motto,
      };
    }
    if (contract.factionId === "helios") {
      return {
        name: themeConfig.factions.helios.name,
        accent: themeConfig.factions.helios.primary,
        motto: themeConfig.factions.helios.motto,
      };
    }
    if (contract.factionId === "craterRats") {
      return {
        name: themeConfig.factions.craterRats.name,
        accent: themeConfig.factions.craterRats.primary,
        motto: themeConfig.factions.craterRats.motto,
      };
    }
    if (contract.factionId === "quietOrder") {
      return {
        name: themeConfig.factions.quietOrder.name,
        accent: themeConfig.factions.quietOrder.primary,
        motto: themeConfig.factions.quietOrder.motto,
      };
    }
    if (contract.factionId === "freeOrbit") {
      return {
        name: themeConfig.factions.freeOrbit.name,
        accent: themeConfig.factions.freeOrbit.primary,
        motto: themeConfig.factions.freeOrbit.motto,
      };
    }

    const [vendorId] = Object.keys(contract.reward.vendorReputation) as VendorId[];
    const vendor = vendorId ? vendorDefinitions[vendorId] : vendorDefinitions.mechanic;
    return {
      name: vendor.name,
      accent: vendor.accentPrimary,
      motto: vendor.tagline,
    };
  }

  private showIntelMenu(): void {
    this.raidScreen = "stash";
    const objective = this.objectiveState;
    const environment = this.environmentState;
    const activeExtracts = this.extractionController.activeZoneIds.length || this.baseExtractionZoneIds.length;
    const contractState = this.contractManager.snapshot;
    const activeContract = contractState.active;
    const contractFilters: ContractUiFilter[] = ["available", "active", "ready", "history", "all", "scavenger", "combat", "recovery", "stealth", "vendor", "pvp"];
    const filteredContracts = contractState.available.filter((contract) => {
      if (["available", "active", "ready", "history"].includes(this.contractUiFilter)) return this.contractUiFilter === "available";
      if (this.contractUiFilter === "all") return true;
      if (this.contractUiFilter === "recovery") return contract.type === "poi-objective" || contract.type === "extraction";
      if (this.contractUiFilter === "pvp") return contract.target.lootType === "dog-tag";
      return contract.type === this.contractUiFilter;
    });
    const filterTabs = contractFilters
      .map((filter) => `<button type="button" class="${this.contractUiFilter === filter ? "active" : ""}" data-action="contract-filter-${filter}">${this.capitalize(filter)}</button>`)
      .join("");
    const historyRows = contractState.history.length > 0
      ? contractState.history
        .map((entry) => `<small>${entry.title} | ${entry.tier.replace("-", " ")} | claimed</small>`)
        .join("")
      : "<small>No submitted contracts yet.</small>";
    const contractCards = filteredContracts.map((contract) => {
      const active = activeContract?.definition.id === contract.id;
      const faction = this.getContractFactionMeta(contract);
      return `
        <section class="intel-card contract-card ${active ? "active" : ""}" data-contract-type="${contract.type}" style="--faction-accent: ${faction.accent}">
          <span>${faction.name}</span>
          <strong>${contract.title}</strong>
          <p>${contract.description}</p>
          <small>${faction.motto}</small>
          <small>Zone: ${contract.targetPoi} | Tier: ${contract.recommendedTier ?? "Any"} | Risk: ${contract.risk}</small>
          <small>Objective: ${describeContractTarget(contract)} | ${contract.requiresExtraction ? "Extraction required" : "Field complete"}</small>
          <small>Rewards: ${this.formatContractReward(contract.reward)}</small>
          <small>Rep: ${this.formatContractVendorRep(contract.reward.vendorReputation)} | Tokens: ${contract.reward.contractPoints ?? 0}/${contract.reward.reputationTokens ?? 0}</small>
          <button type="button" data-action="contract-activate-${contract.id}" ${active ? "disabled" : ""}>${active ? "Active" : "Activate Contract"}</button>
        </section>
      `;
    }).join("");
    const activeContractPanel = activeContract
      ? `<section class="intel-card primary contract-active-card ${activeContract.status === "ready-to-claim" ? "ready" : ""}" style="--faction-accent: ${this.getContractFactionMeta(activeContract.definition).accent}">
          <span>${this.getContractFactionMeta(activeContract.definition).name}</span>
          <strong>${activeContract.definition.title}</strong>
          <p>${activeContract.status === "failed" ? activeContract.failedReason ?? "Failed" : activeContract.definition.description}</p>
          <small>Zone ${activeContract.definition.targetPoi} | Tier ${activeContract.definition.recommendedTier ?? "Any"} | Risk ${activeContract.definition.risk}</small>
          <small>${activeContract.status === "ready-to-claim" ? "READY TO SUBMIT" : `Progress ${activeContract.progress}/${activeContract.goal}${activeContract.extractToClaim ? " | Extract to submit" : ""}`}</small>
          <small>${this.formatContractReward(activeContract.definition.reward)}</small>
          ${activeContract.status === "ready-to-claim" ? `<button type="button" data-action="contract-submit">Submit / Claim Reward</button>` : ""}
          <button type="button" data-action="contract-abandon">Abandon Contract</button>
        </section>`
      : `<section class="intel-card primary contract-active-card">
          <span>Active Contract</span>
          <strong>No contract selected</strong>
          <p>Pick one mission before launching a Crater Run. One active contract is supported for now.</p>
          <small>Contracts refresh after Crater Runs or manual refresh.</small>
        </section>`;

    this.menuContent.innerHTML = `
      <div class="intel-board-screen inspect-screen">
        <header class="inspect-header">
          <div>
            <span>Lunar Terminal</span>
            <h2>Faction Contracts</h2>
            <p>Faction leads, crater hazards, extraction routes, and Lumen activity forecasts.</p>
          </div>
          <div class="inspect-currency">
            <span>Extracts</span><strong>${activeExtracts}</strong>
            <span>Contract Points</span><strong>${contractState.contractPoints}</strong>
            <span>Rep Tokens</span><strong>${contractState.reputationTokens}</strong>
          </div>
        </header>
        <nav class="contract-filter-tabs">${filterTabs}</nav>
        <section class="intel-card primary">
          <span>Current Objective Pool</span>
          <strong>${objective.title}</strong>
          <p>${objective.description}</p>
          <small>${objective.completed ? "Completed in last Crater Run state" : "Optional objective generated when a Crater Run starts"}</small>
        </section>
        <section class="intel-card">
          <span>Crater Conditions</span>
          <strong>${environment.label}</strong>
          <p>Visibility multiplier ${environment.gameplay.enemyVisionMultiplier.toFixed(2)}. Rare loot multiplier ${environment.gameplay.rareLootChanceMultiplier.toFixed(2)}.</p>
        </section>
        <section class="intel-card">
          <span>Crater Pressure</span>
          <strong>${Math.round(this.selectedRaidDefinition.lengthSeconds / 60)} Minute ${this.selectedRaidDefinition.name}</strong>
          <p>${this.selectedRaidDefinition.difficultyLabel} threat. Oxygen pressure, radiation risk, Lumen presence, loot tables, and contract payout scale from the selected crater tier.</p>
        </section>
        ${(this.contractUiFilter === "active" || this.contractUiFilter === "ready" || this.contractUiFilter === "all") ? activeContractPanel : ""}
        ${this.contractUiFilter === "history" ? "" : contractCards}
        <section class="intel-card">
          <span>${this.contractUiFilter === "history" ? "Completed History" : "Contract Bank"}</span>
          <strong>${contractState.contractPoints} Contract Points | ${contractState.reputationTokens} Rep Tokens</strong>
          <p>Higher-tier submitted contracts build long-term trader leverage and unlock future recipe/vendor tracks.</p>
          ${historyRows}
        </section>
        <section class="intel-card">
          <span>Manual Refresh</span>
          <strong>New Intel Leads</strong>
          <p>Refresh available contracts if the board is offering the wrong kind of trouble.</p>
          <button type="button" data-action="contract-refresh">Refresh Contracts</button>
        </section>
      </div>
      <div class="main-menu-actions">
        <button type="button" data-action="start">Crater Runs</button>
        <button type="button" data-action="vendors">Faction Vendors</button>
        <button type="button" data-action="menu">Back to Habitat</button>
      </div>
    `;
    this.bindMenuButtons();
  }

  private showLoadoutMenu(): void {
    this.raidScreen = "loadout";
    try {
      this.loadoutManager.initialize(this.loadout, this.persistentStash.items);
      this.loadout.clampToStash(this.persistentStash.items);

      const body = this.loadoutTab === "cosmetics"
        ? this.renderCosmeticsLoadoutScreen()
        : this.renderGearLoadoutScreen();

      this.menuContent.innerHTML = `
        ${body}
        <div class="main-menu-actions">
          <button type="button" data-action="start">Crater Runs</button>
          <button type="button" data-action="workbench">Fabrication Bench</button>
          <button type="button" data-action="menu">Back</button>
        </div>
      `;
    } catch (error) {
      console.warn("Loadout screen failed to render; showing safe fallback menu.", error);
      this.menuContent.innerHTML = `
        <div class="main-menu-panel">
          <h1>${themeConfig.brand.title}</h1>
          <p>Loadout data could not render. Your Crater Run systems are still available.</p>
          <button type="button" data-action="start">Crater Runs</button>
          <button type="button" data-action="menu">Back</button>
          <button type="button" data-action="cosmetics-reset">Reset Cosmetics</button>
        </div>
      `;
    }
    this.bindMenuButtons();
    if (this.raidScreen === "loadout" && (this.loadoutTab === "gear" || this.loadoutTab === "cosmetics")) {
      this.habitatPreview.mount(this.menuContent.querySelector<HTMLElement>(".loadout-runner-preview-host, .cosmetic-runner-preview-host"), {
        variant: "habitat",
        framingMode: "fullBody",
        modelPaths: getClassSuitModelCandidates(this.classManager.snapshot.selectedClassId),
        classId: this.classManager.snapshot.selectedClassId,
        targetHeight: this.loadoutTab === "cosmetics" ? 1.36 : 1.4,
        verticalLift: 0.02,
        cameraRadius: this.loadoutTab === "cosmetics" ? 5.3 : 5.4,
        cameraTargetY: 0.7,
      });
    }
  }

  private renderGearLoadoutScreen(): string {
    const loadout = this.loadout.snapshot;
    const manager = this.loadoutManager.snapshot;
    const selectedSlotType = this.getLoadoutSlotLootType(this.selectedLoadoutSlot, loadout, manager);
    const selectedType = manager.selectedType ?? selectedSlotType;
    const selectedHeaderLabel = manager.selectedType && manager.selectedType !== selectedSlotType
      ? "Compatibility Item"
      : equipmentSlotLabels[this.selectedLoadoutSlot];
    const selectedDetails = this.renderLoadoutItemDetails(selectedType, this.selectedLoadoutSlot);
    const gearSlots = this.renderEquippedGearSlots(loadout);
    const raidBag = this.renderRaidBag();
    const warnings = this.renderLoadoutReadinessWarnings(loadout, manager);
    const filterTabs = loadoutFilters
      .map((filter) => `
        <button type="button" class="${manager.filter === filter ? "active" : ""}" data-action="loadout-filter-${filter}">
          ${this.formatLoadoutFilter(filter)}
        </button>
      `)
      .join("");
    const stashRows = this.renderLoadoutStashRows(manager.filter);

    return `
      <div class="loadout-locker-screen hq-dashboard-shell">
        <header class="loadout-locker-top hq-panel-header">
          <div>
            <span>Loadout Locker</span>
            <h2>LOADOUT</h2>
            <p>Active EVA kit / crater deployment readiness</p>
          </div>
          <nav class="loadout-mode-tabs">
            <button type="button" class="${this.loadoutTab === "gear" ? "active" : ""}" data-action="loadout-tab-gear">Gear</button>
            <button type="button" class="${this.loadoutTab === "cosmetics" ? "active" : ""}" data-action="loadout-tab-cosmetics">Cosmetics</button>
          </nav>
          <div class="hq-resource-strip loadout-readiness-strip">
            <span>Class <strong>${this.classManager.selectedClass.displayName}</strong></span>
            <span>Gear <strong>${this.getGearScore()} / ${this.selectedRaidDefinition.recommendedGearScore}</strong></span>
            <span>EVA <strong>${this.loadoutManager.raidBagUsedSlots}/${this.loadoutManager.raidBagCapacity}</strong></span>
          </div>
        </header>
        ${this.renderLoadoutRunnerPanel()}
        <section class="loadout-equipped-panel hq-panel">
          <div class="hq-panel-header compact">
            <div>
              <span>Equipped Gear</span>
              <h3>Deployment Slots</h3>
            </div>
            <small>Heavy cargo is mission state, not an EVA Pack slot.</small>
          </div>
          <div class="gear-slot-grid loadout-slot-grid">${gearSlots}</div>
        </section>
        <section class="loadout-detail-panel hq-panel hq-detail-panel">
          <div class="hq-panel-header compact">
            <div>
              <span>Selected Slot</span>
              <h3>${selectedHeaderLabel}</h3>
            </div>
          </div>
          ${selectedDetails}
        </section>
        <section class="loadout-eva-panel hq-panel">
          <div class="hq-panel-header compact">
            <div>
              <span>EVA Pack</span>
              <h3>Carried Supplies</h3>
            </div>
            <small>${this.loadoutManager.raidBagUsedSlots}/${this.loadoutManager.raidBagCapacity} slots at risk next run</small>
          </div>
          <div class="raid-bag-grid">${raidBag}</div>
          <div class="loadout-stash-access">
            <div>
              <span>Habitat Stash</span>
              <strong>Compatibility Browser</strong>
              <p>Review compatible stash gear without changing the active deployment layout.</p>
            </div>
            <button type="button" class="loadout-stash-open-button" data-action="loadout-stash-compat-open">Open Compatibility Browser</button>
          </div>
        </section>
        <section class="loadout-action-rail hq-panel">
          <div>
            <span>Readiness</span>
            <strong>${warnings.length > 0 ? "Review Kit" : "Deployment Ready"}</strong>
            <p>${warnings.length > 0 ? warnings.join(" | ") : "Primary kit is staged. EVA Pack field utilities and supported risk items are ready for deployment."}</p>
          </div>
          <footer class="hq-action-bar">
            <button type="button" data-action="arsenal">Arsenal</button>
            <button type="button" data-action="stash">Stash</button>
            <button type="button" data-action="loadout-stash-compat-open">Compatibility</button>
            <button type="button" data-action="class-assignment">Class</button>
            <button type="button" class="class-primary-action" data-action="start">Deploy</button>
          </footer>
        </section>
      </div>
      ${this.loadoutStashCompatibilityOpen ? this.renderLoadoutStashCompatibilityPanel(filterTabs, stashRows, manager.filter, selectedType) : ""}
    `;
  }

  private renderCosmeticsLoadoutScreen(): string {
    const state = this.cosmeticManager.snapshot;
    const activeClass = this.classManager.selectedClass;
    const selectedDefinition = this.cosmeticManager.definitions.find((definition) => definition.id === state.equipped[state.selectedCategory])
      ?? this.cosmeticManager.definitions.find((definition) => definition.category === state.selectedCategory);
    const categoryTabs = cosmeticCategories
      .map((category) => `
        <button type="button" class="${state.selectedCategory === category ? "active" : ""}" data-action="cosmetic-category-${category}">
          ${cosmeticCategoryLabels[category]}
        </button>
      `)
      .join("");
    const cosmetics = this.cosmeticManager.definitions
      .filter((definition) => definition.category === state.selectedCategory)
      .map((definition) => {
        const equipped = state.equipped[definition.category] === definition.id;
        const color = colorToCss(themeConfig.rarityColors[definition.rarity]);
        const previewPalette = this.cosmeticManager.getPalette({
          ...state.equipped,
          [definition.category]: definition.id,
        });
        return `
          <button
            type="button"
            class="cosmetic-card${equipped ? " selected" : ""}${definition.unlocked ? "" : " locked"}"
            data-action="cosmetic-equip-${definition.id}"
            style="--rarity-color: ${color}; --cosmetic-a: ${colorToCss(previewPalette.hoodie)}; --cosmetic-b: ${colorToCss(previewPalette.accent)}; --cosmetic-c: ${colorToCss(previewPalette.glow)}"
            title="${definition.unlocked ? definition.description : `Locked: ${definition.source}`}"
          >
            <i></i>
            <strong>${definition.name}</strong>
            <span>${definition.rarity} ${cosmeticCategoryLabels[definition.category]}</span>
            <small>${equipped ? "Equipped" : definition.unlocked ? `Unlocked | ${definition.source}` : `Locked | ${definition.source}`}</small>
          </button>
        `;
      })
      .join("");
    const equippedRows = cosmeticCategories
      .map((category) => `
        <div>
          <span>${cosmeticCategoryLabels[category]}</span>
          <strong>${this.cosmeticManager.getEquippedName(category)}</strong>
        </div>
      `)
      .join("");

    return `
      <div class="loadout-screen cosmetics-loadout-screen">
        ${this.renderLoadoutHero()}
        ${this.renderCosmeticRunnerPanel()}
        <section class="equipped-gear-panel cosmetic-equipped-panel">
          <h3>Class Suit Cosmetics</h3>
          <p>${activeClass.displayName} suit identity is class-bound. These are minor cosmetic overlays for the current assignment.</p>
          <div class="cosmetic-equipped-list">${equippedRows}</div>
        </section>
        <section class="stash-inventory-panel cosmetic-browser-panel">
          <h3>${cosmeticCategoryLabels[state.selectedCategory]}</h3>
          <nav>${categoryTabs}</nav>
          <div class="cosmetic-grid">${cosmetics}</div>
        </section>
        <section class="raid-bag-panel cosmetic-rules-panel">
          <h3>Minor Enhancements</h3>
          <button type="button" data-action="cosmetics-randomize">Randomize Loadout</button>
          <button type="button" data-action="cosmetics-favorite">Favorite Placeholder</button>
          <p>Class selection controls the major Obsidian Sentinel suit silhouette. Cosmetics are per-class finishes, trims, helmet variants, visor/mask choices, EVA pack skins, emotes, and banners.</p>
          <p>Cosmetics never affect stats, are never lost in a Crater Run, and persist through death. Armor and gear still control protection and capacity.</p>
        </section>
        <section class="item-details-panel">
          <h3>Selected Style</h3>
          <article class="loadout-details-card" style="--rarity-color: ${colorToCss(themeConfig.rarityColors[selectedDefinition?.rarity ?? "rare"])}">
            <strong>${selectedDefinition?.name ?? `${themeConfig.brand.title} Runner`}</strong>
            <span>${(selectedDefinition?.rarity ?? "rare").toUpperCase()} | ${selectedDefinition?.source ?? "starter"}</span>
          <p>${selectedDefinition?.description ?? "Customize the Crater Runner silhouette while keeping extraction risk tied to gear, loot, and survival."}</p>
            <div><span>Status</span><strong>${selectedDefinition?.unlocked ? "Unlocked" : "Locked"}</strong></div>
            <div><span>Category</span><strong>${cosmeticCategoryLabels[state.selectedCategory]}</strong></div>
            <footer>
              <button type="button" data-action="cosmetics-apply">Apply Preview</button>
              <button type="button" data-action="cosmetics-reset">Reset to Default</button>
            </footer>
          </article>
        </section>
      </div>
    `;
  }

  private renderCosmeticRunnerPanel(): string {
    return `
      <section class="player-preview-panel cosmetic-runner-panel hq-panel hq-preview-panel">
        <div class="hq-panel-header compact">
          <div>
            <span>Class Suit Preview</span>
            <h3>${this.classManager.selectedClass.displayName}</h3>
          </div>
          <small>${this.previewModelStatus === "available" ? "Obsidian Sentinel class suit" : "Fallback preview ready"}</small>
        </div>
        <div class="cosmetic-runner-preview-host hq-runner-preview-host" aria-label="Cosmetic class suit preview">
          <div class="hq-runner-fallback">
            <i></i><b></b><em></em>
          </div>
        </div>
        <div class="preview-actions">
          <button type="button" data-action="cosmetic-preview-left">Rotate Left</button>
          <button type="button" data-action="cosmetic-preview-right">Rotate Right</button>
        </div>
        <div class="preview-meta">
          <span>Outfit</span><strong>${this.cosmeticManager.getEquippedName("outfit")}</strong>
          <span>Helmet</span><strong>${this.cosmeticManager.getEquippedName("headgear")}</strong>
          <span>Visor</span><strong>${this.cosmeticManager.getEquippedName("mask")}</strong>
          <span>Assignment</span><strong>${this.classManager.selectedClass.roleLabel}</strong>
        </div>
        <small class="cosmetic-preview-note">Visual overlay preview pending</small>
      </section>
    `;
  }

  private renderLoadoutHero(): string {
    const gearScore = this.getGearScore();
    const recommended = this.selectedRaidDefinition.recommendedGearScore;
    const weak = gearScore < recommended;
    return `
      <header class="loadout-hero">
        <div>
          <span>Between-Run Gear</span>
          <h2>${themeConfig.brand.title} Loadout</h2>
          <p>${this.selectedRaidDefinition.name}: gear score ${gearScore} / recommended ${recommended}</p>
        </div>
        <nav class="loadout-mode-tabs">
          <button type="button" class="${this.loadoutTab === "gear" ? "active" : ""}" data-action="loadout-tab-gear">Gear</button>
          <button type="button" class="${this.loadoutTab === "cosmetics" ? "active" : ""}" data-action="loadout-tab-cosmetics">Cosmetics</button>
        </nav>
        <strong class="${weak ? "loadout-warning" : ""}">${weak ? "Under-geared" : "Run ready"}</strong>
      </header>
    `;
  }

  private renderLoadoutRunnerPanel(): string {
    const manager = this.loadoutManager.snapshot;
    return `
      <section class="loadout-runner-panel hq-panel hq-preview-panel">
        <div class="hq-panel-header compact">
          <div>
            <span>Runner Identity</span>
            <h3>${this.classManager.selectedClass.displayName}</h3>
          </div>
          <small>${this.previewModelStatus === "available" ? "Obsidian Sentinel preview" : "Fallback preview ready"}</small>
        </div>
        <div class="loadout-runner-preview-host hq-runner-preview-host" aria-label="Loadout runner preview">
          <div class="hq-runner-fallback">
            <i></i><b></b><em></em>
          </div>
        </div>
        <div class="preview-meta loadout-runner-meta">
          <span>Primary</span><strong>${this.loadout.primaryWeaponName}</strong>
          <span>Sidearm</span><strong>${weaponDefinitions[this.loadout.snapshot.sidearmWeaponId].name}</strong>
          <span>EVA Pack</span><strong>${manager.backpackType ? getItemDefinition(manager.backpackType).label : "Starter Pack"}</strong>
          <span>Suit</span><strong>${this.cosmeticManager.getEquippedName("outfit")}</strong>
        </div>
      </section>
    `;
  }

  private getLoadoutSlotLootType(slot: EquipmentSlot, loadout: RaidLoadout, manager: LoadoutManagerState): LootType | null {
    if (slot === "primary") return loadout.primaryWeaponId ? weaponLootTypes[loadout.primaryWeaponId] : null;
    if (slot === "sidearm") return weaponLootTypes[loadout.sidearmWeaponId];
    if (slot === "melee") return loadout.meleeWeaponId ? weaponLootTypes[loadout.meleeWeaponId] : null;
    if (slot === "armor") return manager.armorType;
    if (slot === "backpack") return manager.backpackType;
    if (slot === "tactical") return manager.tacticalToolType;
    if (slot === "consumable1") return manager.consumable1Type;
    return manager.consumable2Type;
  }

  private renderLoadoutReadinessWarnings(loadout: RaidLoadout, manager: LoadoutManagerState): string[] {
    const warnings: string[] = [];
    if (!loadout.primaryWeaponId) warnings.push("No primary equipped");
    if (!manager.armorType) warnings.push("Armor slot empty");
    if (this.loadoutManager.raidBagUsedSlots >= this.loadoutManager.raidBagCapacity) warnings.push("EVA Pack full");
    const weapons = [loadout.primaryWeaponId, loadout.sidearmWeaponId, loadout.meleeWeaponId].filter((id): id is WeaponId => Boolean(id));
    if (weapons.some((weaponId) => this.weaponController.getDurabilityState(weaponId).durability < 35)) warnings.push("Damaged weapon");
    if (loadout.extraAmmoMags === 0) warnings.push("Field ammo minimal");
    return warnings;
  }

  private renderEquippedGearSlots(loadout: RaidLoadout): string {
    const manager = this.loadoutManager.snapshot;
    const slots: Array<{ slot: EquipmentSlot; type: LootType | null; label: string; locked?: boolean }> = [
      { slot: "primary", type: loadout.primaryWeaponId ? weaponLootTypes[loadout.primaryWeaponId] : null, label: this.loadout.primaryWeaponName },
      { slot: "sidearm", type: weaponLootTypes[loadout.sidearmWeaponId], label: weaponDefinitions[loadout.sidearmWeaponId].name, locked: loadout.sidearmWeaponId === "pistol" },
      { slot: "melee", type: loadout.meleeWeaponId ? weaponLootTypes[loadout.meleeWeaponId] : null, label: loadout.meleeWeaponId ? weaponDefinitions[loadout.meleeWeaponId].name : "Empty" },
      { slot: "armor", type: manager.armorType, label: manager.armorType ? getItemDefinition(manager.armorType).label : "Empty" },
      { slot: "backpack", type: manager.backpackType, label: manager.backpackType ? getItemDefinition(manager.backpackType).label : "Starter Pack" },
      { slot: "tactical", type: manager.tacticalToolType, label: manager.tacticalToolType ? getItemDefinition(manager.tacticalToolType).label : "Empty" },
      { slot: "consumable1", type: manager.consumable1Type, label: manager.consumable1Type ? getItemDefinition(manager.consumable1Type).label : "Empty" },
      { slot: "consumable2", type: manager.consumable2Type, label: manager.consumable2Type ? getItemDefinition(manager.consumable2Type).label : "Empty" },
    ];

    return slots.map(({ slot, type, label, locked }) => {
      const definition = type ? getItemDefinition(type) : null;
      const color = definition ? colorToCss(themeConfig.rarityColors[definition.rarity]) : "rgba(255,255,255,0.32)";
      const selected = this.selectedLoadoutSlot === slot ? " selected" : "";
      const weaponId = type ? weaponIdFromLootType(type) : null;
      const durability = weaponId ? `${Math.round(this.weaponController.getDurabilityState(weaponId).durability)}% condition` : definition ? definition.rarity : "Prototype";
      return `
        <div class="gear-slot hq-slot-card${selected}" style="--rarity-color: ${color}">
          <button type="button" data-action="loadout-slot-${slot}">
            <span>${equipmentSlotLabels[slot]}</span>
            <strong>${label}</strong>
            ${locked ? "<small>Equipped | Free starter</small>" : `<small>${type ? `Equipped | ${durability}` : "Empty | Future compatible slot"}</small>`}
          </button>
        </div>
      `;
    }).join("");
  }

  private renderLoadoutStashRows(filter: LoadoutFilter): string {
    const rows = this.persistentStash.items
      .filter((item) => this.loadoutManager.matchesFilter(item.type, filter))
      .filter((item) => item.quantity > 0 || item.type === "weapon-pistol")
      .map((item) => {
        const definition = getItemDefinition(item.type);
        const available = item.type === "weapon-pistol"
          ? Math.max(1, this.loadoutManager.availableQuantity(this.persistentStash.items, item.type))
          : this.loadoutManager.availableQuantity(this.persistentStash.items, item.type);
        const color = colorToCss(themeConfig.rarityColors[definition.rarity]);
        const selected = this.loadoutManager.snapshot.selectedType === item.type ? " selected" : "";

        return `
          <button type="button" class="stash-item${selected}" data-action="loadout-select-${item.type}" style="--rarity-color: ${color}">
            <strong>${definition.label}</strong>
            <span>${definition.rarity} | ${definition.category}</span>
            <small>${available} available | ${definition.value} value</small>
          </button>
        `;
      })
      .join("");

    return rows || `<span class="empty-loadout-list">No compatible stash items for this filter.</span>`;
  }

  private renderLoadoutStashCompatibilityPanel(filterTabs: string, stashRows: string, filter: LoadoutFilter, selectedType: LootType | null): string {
    const selectedDefinition = selectedType ? getItemDefinition(selectedType) : null;
    const selectedAvailability = selectedType
      ? this.loadoutManager.availableQuantity(this.persistentStash.items, selectedType)
      : 0;
    const selectedColor = selectedDefinition
      ? colorToCss(themeConfig.rarityColors[selectedDefinition.rarity])
      : "rgba(103, 232, 249, 0.32)";
    const selectedWeaponId = selectedType ? weaponIdFromLootType(selectedType) : null;

    return `
      <div class="loadout-compat-backdrop" aria-hidden="true"></div>
      <section class="loadout-compat-modal" role="dialog" aria-modal="true" aria-label="Habitat stash compatibility">
        <header class="hq-panel-header compact">
          <div>
            <span>Habitat Stash Compatibility</span>
            <h3>${this.formatLoadoutFilter(filter)}</h3>
            <p>Pack field utilities into the EVA Pack, equip supported gear, or inspect weapons before deployment.</p>
          </div>
          <button type="button" class="loadout-compat-close" data-action="loadout-stash-compat-close">Close</button>
        </header>
        <nav class="loadout-compat-filters">${filterTabs}</nav>
        <div class="loadout-compat-body">
          <div class="loadout-stash-grid loadout-compat-list">${stashRows}</div>
          <aside class="loadout-compat-detail">
            ${selectedDefinition
              ? `<article class="loadout-details-card" style="--rarity-color: ${selectedColor}">
                  <strong>${selectedDefinition.label}</strong>
                  <span>${selectedDefinition.rarity.toUpperCase()} | ${selectedDefinition.category}</span>
                  <p>${selectedDefinition.description}</p>
                  <div><span>Available</span><strong>${selectedAvailability}</strong></div>
                  <div><span>Category</span><strong>${selectedDefinition.category}</strong></div>
                  <div><span>Use</span><strong>${selectedDefinition.use}</strong></div>
                  ${this.renderRevealAffinityDetail(selectedType)}
                  <footer>${selectedType ? this.renderLoadoutCompatibilityActions(selectedType, selectedAvailability, selectedWeaponId) : ""}</footer>
                </article>`
              : `<article class="loadout-details-card hq-muted-card">
                  <strong>No Compatible Item Selected</strong>
                  <span>FILTER | ${this.formatLoadoutFilter(filter)}</span>
                  <p>Select an item from the stash list to review compatibility, inspect safe weapon entries, or open the full Stash screen.</p>
                  <footer>
                    <button type="button" data-action="stash">Open Stash</button>
                    <button type="button" disabled>No compatible slot</button>
                  </footer>
                </article>`}
          </aside>
        </div>
      </section>
    `;
  }

  private renderLoadoutCompatibilityActions(type: LootType, availability: number, weaponId: WeaponId | null): string {
    const equippedSlot = this.getEquippedSlotForLootType(type);
    const packedQuantity = this.loadoutManager.snapshot.raidBag.find((item) => item.type === type)?.quantity ?? 0;
    const canInspect = weaponId !== null;
    const equipBlockReason = this.getCompatibilityEquipBlockReason(type, equippedSlot, packedQuantity, availability);
    const canEquip = this.canEquipFromCompatibility(type) && equipBlockReason === null;
    const packBlockReason = this.getCompatibilityPackBlockReason(type, availability);
    const equipLabel = this.getCompatibilityEquipLabel(type);
    const packButton = packBlockReason === null
      ? `<button type="button" data-action="loadout-compat-pack-selected">Pack to EVA</button>`
      : `<button type="button" disabled>${packBlockReason}</button>`;
    const equipButton = canEquip
      ? `<button type="button" data-action="loadout-compat-equip-selected">${equipLabel}</button>`
      : `<button type="button" disabled>${equipBlockReason ?? "No compatible slot"}</button>`;
    const inspectButton = canInspect
      ? `<button type="button" data-action="loadout-inspect-selected">Inspect in Arsenal</button>`
      : `<button type="button" disabled>Inspect - weapons only</button>`;

    return `
      ${inspectButton}
      ${equipButton}
      ${packButton}
      <button type="button" data-action="stash">Open Stash</button>
    `;
  }

  private renderRevealAffinityDetail(type: LootType | null): string {
    if (type !== "essence-flare") {
      return "";
    }
    const affinity = this.getRevealAffinityState();
    const copy = affinity.surveyor
      ? `Surveyor affinity active: ${affinity.surveyorRadius}m scan / ${affinity.surveyorDurationSeconds}s signal.`
      : `Surveyor class extends this scan to ${affinity.surveyorRadius}m / ${affinity.surveyorDurationSeconds}s.`;
    return `
      <div class="loadout-reveal-affinity">
        <span>Lumen Reveal</span>
        <strong>${copy}</strong>
      </div>
    `;
  }

  private canEquipFromCompatibility(type: LootType): boolean {
    if (weaponIdFromLootType(type) || attachmentIdFromLootType(type)) {
      return true;
    }
    return type === "armor-light" ||
      type === "backpack-upgrade" ||
      type === "elite-backpack" ||
      type === "tool-flashlight" ||
      type === "medkit" ||
      type === "advanced-medkit" ||
      type === "bandage" ||
      type === "armor-plate" ||
      type === "improved-armor-plate";
  }

  private getCompatibilityEquipLabel(type: LootType): string {
    if (weaponIdFromLootType(type)) return "Equip to Loadout";
    if (attachmentIdFromLootType(type)) return "Equip Attachment";
    if (type === "armor-light") return "Equip Armor";
    if (type === "backpack-upgrade" || type === "elite-backpack") return "Equip Backpack";
    if (type === "tool-flashlight") return "Equip Tactical Tool";
    if (type === "medkit" || type === "advanced-medkit" || type === "bandage" || type === "armor-plate" || type === "improved-armor-plate") {
      return "Equip to Consumable Slot";
    }
    return "No compatible slot";
  }

  private getCompatibilityEquipBlockReason(type: LootType, equippedSlot: EquipmentSlot | null, packedQuantity: number, availability = 1): string | null {
    if (equippedSlot) return "Already equipped";
    if (packedQuantity > 0) return "Already packed";
    if (availability <= 0 && type !== "weapon-pistol") return "None available";
    if (getItemDefinition(type).category === "material") return "Material only";
    if (!this.canEquipFromCompatibility(type)) return "No compatible slot";
    return null;
  }

  private getCompatibilityPackBlockReason(type: LootType, availability: number): string | null {
    const definition = getItemDefinition(type);
    const profile = getItemUseProfile(type);

    if (availability <= 0) {
      const packedQuantity = this.loadoutManager.snapshot.raidBag.find((item) => item.type === type)?.quantity ?? 0;
      return packedQuantity > 0 ? "Already packed" : "Already equipped";
    }

    if (weaponIdFromLootType(type) || attachmentIdFromLootType(type)) {
      return "Use loadout slot";
    }

    if (!profile.usableInRaid) {
      if (type === "scanner-battery") return "Utility material only";
      return definition.category === "material" ? "Material only" : "No compatible slot";
    }

    const used = this.loadoutManager.raidBagUsedSlots;
    const needs = definition.stackable && this.loadoutManager.snapshot.raidBag.some((item) => item.type === type)
      ? 0
      : definition.slots;
    if (used + needs > this.loadoutManager.raidBagCapacity) {
      return "EVA Pack full";
    }

    return null;
  }

  private handleLoadoutCompatibilityEquip(): void {
    const selectedType = this.loadoutManager.snapshot.selectedType;
    if (!selectedType) {
      console.info("[LoadoutCompatibility] blocked item=none reason=no-selection");
      this.combatHud.showLootNotification("Select an item first");
      this.showLoadoutMenu();
      return;
    }

    const reason = this.getCompatibilityEquipBlockReason(
      selectedType,
      this.getEquippedSlotForLootType(selectedType),
      this.loadoutManager.snapshot.raidBag.find((item) => item.type === selectedType)?.quantity ?? 0,
      this.loadoutManager.availableQuantity(this.persistentStash.items, selectedType),
    );
    if (reason !== null) {
      const message = reason ?? "No compatible slot";
      console.info(`[LoadoutCompatibility] action=blocked item=${selectedType} reason=${this.toLogToken(message)}`);
      this.combatHud.showLootNotification(message);
      this.showLoadoutMenu();
      return;
    }

    const message = this.loadoutManager.equipSelected(this.loadout, this.persistentStash.items);
    this.loadoutManager.applyToLoadout(this.loadout, this.persistentStash.items);
    const destination = this.getCompatibilityEquipDestination(selectedType);
    console.info(`[LoadoutCompatibility] action=equip item=${selectedType} reason=accepted`);
    console.info(`[LoadoutCompatibility] moved item=${selectedType} from=stash to=${destination} quantity=1`);
    this.combatHud.showLootNotification(message);
    this.showLoadoutMenu();
  }

  private handleLoadoutCompatibilityPack(): void {
    const selectedType = this.loadoutManager.snapshot.selectedType;
    if (!selectedType) {
      console.info("[LoadoutCompatibility] blocked item=none reason=no-selection");
      this.combatHud.showLootNotification("Select an item first");
      this.showLoadoutMenu();
      return;
    }

    const availability = this.loadoutManager.availableQuantity(this.persistentStash.items, selectedType);
    const blockReason = this.getCompatibilityPackBlockReason(selectedType, availability);
    if (blockReason) {
      console.info(`[LoadoutCompatibility] blocked item=${selectedType} reason=${this.toLogToken(blockReason)}`);
      this.combatHud.showLootNotification(blockReason);
      this.showLoadoutMenu();
      return;
    }

    const message = this.loadoutManager.moveToRaidBag(selectedType, this.persistentStash.items);
    this.loadoutManager.applyToLoadout(this.loadout, this.persistentStash.items);
    console.info(`[LoadoutCompatibility] action=pack item=${selectedType} result=accepted to=eva`);
    console.info(`[LoadoutCompatibility] moved item=${selectedType} from=stash to=eva quantity=1`);
    this.combatHud.showLootNotification(message);
    this.showLoadoutMenu();
  }

  private handleStashMoveToLoadout(type: LootType): void {
    this.loadoutManager.select(type);
    console.info(`[LoadoutCompatibility] selected item=${type} category=${getItemDefinition(type).category} role=${getItemUseProfile(type).roles.join("/")}`);
    const equippedSlot = this.getEquippedSlotForLootType(type);
    const packedQuantity = this.loadoutManager.snapshot.raidBag.find((item) => item.type === type)?.quantity ?? 0;
    const availability = this.loadoutManager.availableQuantity(this.persistentStash.items, type);
    const equipBlock = this.getCompatibilityEquipBlockReason(type, equippedSlot, packedQuantity, availability);

    if (equipBlock === null) {
      const message = this.loadoutManager.equipType(type, this.loadout, this.persistentStash.items);
      this.loadoutManager.applyToLoadout(this.loadout, this.persistentStash.items);
      console.info(`[LoadoutCompatibility] action=equip item=${type} reason=accepted`);
      console.info(`[LoadoutCompatibility] moved item=${type} from=stash to=${this.getCompatibilityEquipDestination(type)} quantity=1`);
      this.combatHud.showLootNotification(message);
      return;
    }

    const packBlock = this.getCompatibilityPackBlockReason(type, availability);
    if (packBlock === null) {
      const message = this.loadoutManager.moveToRaidBag(type, this.persistentStash.items);
      this.loadoutManager.applyToLoadout(this.loadout, this.persistentStash.items);
      console.info(`[LoadoutCompatibility] action=pack item=${type} result=accepted to=eva`);
      console.info(`[LoadoutCompatibility] moved item=${type} from=stash to=eva quantity=1`);
      this.combatHud.showLootNotification(message);
      return;
    }

    console.info(`[LoadoutCompatibility] blocked item=${type} reason=${this.toLogToken(packBlock)}`);
    this.combatHud.showLootNotification(packBlock);
  }

  private getCompatibilityEquipDestination(type: LootType): string {
    const weaponId = weaponIdFromLootType(type);
    if (weaponId) {
      if (weaponId === "pistol" || weaponId === "burst-pistol" || weaponId === "revolver" || weaponId === "compact-smg") {
        return "sidearm";
      }
      if (weaponId === "knife") {
        return "melee";
      }
      return "primary";
    }
    const attachmentId = attachmentIdFromLootType(type);
    if (attachmentId) {
      return `attachment-${attachmentDefinitions[attachmentId].slot}`;
    }
    if (type === "armor-light") return "armor";
    if (type === "backpack-upgrade" || type === "elite-backpack") return "backpack";
    if (type === "tool-flashlight") return "tactical";
    if (type === "medkit" || type === "advanced-medkit" || type === "bandage" || type === "armor-plate" || type === "improved-armor-plate") {
      return this.loadoutManager.snapshot.consumable1Type === null ? "consumable1" : "consumable2";
    }
    return "unknown";
  }

  private toLogToken(label: string): string {
    return label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "unknown";
  }

  private renderRaidBag(): string {
    const bag = this.loadoutManager.snapshot.raidBag;

    if (bag.length === 0) {
      return `<span class="empty-loadout-list">No extra risk items packed</span>`;
    }

    return bag.map((item) => {
      const definition = getItemDefinition(item.type);
      const color = colorToCss(themeConfig.rarityColors[definition.rarity]);
      return `
        <button type="button" class="raid-bag-item" data-action="loadout-remove-bag-${item.type}" style="--rarity-color: ${color}">
          <strong>${definition.label}</strong>
          <span>${item.quantity > 1 ? `x${item.quantity}` : `${definition.slots} slot${definition.slots > 1 ? "s" : ""}`}</span>
        </button>
      `;
    }).join("");
  }

  private renderLoadoutItemDetails(type: LootType | null, slot: EquipmentSlot = this.selectedLoadoutSlot): string {
    if (!type) {
      return `
        <article class="loadout-details-card hq-muted-card">
          <strong>${equipmentSlotLabels[slot]}</strong>
          <span>EMPTY | PROTOTYPE READY</span>
          <p>No item is currently assigned to this slot. Use the Compatibility Browser to equip supported stash gear or pack field utilities into the EVA Pack.</p>
          <div><span>Status</span><strong>${slot === "primary" ? "No primary equipped" : "Empty"}</strong></div>
          <div><span>Field Movement</span><strong>HQ-only changes safe</strong></div>
          <footer>
            <button type="button" data-action="arsenal">Open Arsenal</button>
            <button type="button" data-action="loadout-stash-compat-open">Open Compatibility Browser</button>
            <button type="button" disabled>No compatible item selected</button>
          </footer>
        </article>
      `;
    }

    const definition = getItemDefinition(type);
    const color = colorToCss(themeConfig.rarityColors[definition.rarity]);
    const weaponId = weaponIdFromLootType(type);
    const attachmentId = attachmentIdFromLootType(type);
    const stats = weaponId ? this.renderWeaponDetails(weaponId) : "";
    const attachment = attachmentId ? attachmentDefinitions[attachmentId] : null;
    const attachmentStats = attachment
      ? `<div><span>Attachment Slot</span><strong>${this.formatSlotName(attachment.slot)}</strong></div><div><span>Effect</span><strong>${attachment.description}</strong></div>`
      : "";
    const equippedSlot = this.getEquippedSlotForLootType(type);
    const weaponInspectAction = weaponId
      ? `<button type="button" data-action="loadout-inspect-selected">Inspect Weapon</button>`
      : "";
    const repairAction = weaponId
      ? `<button type="button" data-action="inspect-repair-${weaponId}">Repair</button>`
      : `<button type="button" disabled>Repair - weapons only</button>`;
    const unequipAction = equippedSlot
      ? `<button type="button" data-action="loadout-unequip-${equippedSlot}">Unequip</button>`
      : "";
    const availability = this.loadoutManager.availableQuantity(this.persistentStash.items, type);
    const equipBlockReason = this.getCompatibilityEquipBlockReason(
      type,
      equippedSlot,
      this.loadoutManager.snapshot.raidBag.find((item) => item.type === type)?.quantity ?? 0,
      availability,
    );
    const equipAction = this.canEquipFromCompatibility(type) && equipBlockReason === null
      ? `<button type="button" data-action="loadout-equip-selected">Equip</button>`
      : `<button type="button" disabled>${equipBlockReason ?? "No compatible slot"}</button>`;
    const packBlockReason = this.getCompatibilityPackBlockReason(type, availability);
    const packAction = packBlockReason === null
      ? `<button type="button" data-action="loadout-bag-selected">Pack to EVA</button>`
      : `<button type="button" disabled>${packBlockReason}</button>`;

    return `
      <article class="loadout-details-card" style="--rarity-color: ${color}">
        <strong>${definition.label}</strong>
        <span>${definition.rarity.toUpperCase()} ${definition.category}${equippedSlot ? ` | Equipped ${equipmentSlotLabels[equippedSlot]}` : ""}</span>
        <p>${definition.description}</p>
        <div><span>Use</span><strong>${definition.use}</strong></div>
        <div><span>Value</span><strong>${definition.value}</strong></div>
        <div><span>Carry Size</span><strong>${definition.slots} slot${definition.slots > 1 ? "s" : ""}</strong></div>
        ${this.renderRevealAffinityDetail(type)}
        ${stats}
        ${attachmentStats}
        <em>Items brought into a Crater Run are lost on death unless they are free starter gear.</em>
        <footer>
          ${weaponInspectAction}
          ${equipAction}
          ${unequipAction}
          ${repairAction}
          ${packAction}
          <button type="button" disabled>Compare - open Arsenal</button>
        </footer>
      </article>
    `;
  }

  private getEquippedSlotForLootType(type: LootType): EquipmentSlot | null {
    const manager = this.loadoutManager.snapshot;
    const loadout = this.loadout.snapshot;

    if (loadout.primaryWeaponId && weaponLootTypes[loadout.primaryWeaponId] === type) {
      return "primary";
    }

    if (weaponLootTypes[loadout.sidearmWeaponId] === type) {
      return "sidearm";
    }

    if (loadout.meleeWeaponId && weaponLootTypes[loadout.meleeWeaponId] === type) {
      return "melee";
    }

    if (manager.armorType === type) {
      return "armor";
    }

    if (manager.backpackType === type) {
      return "backpack";
    }

    if (manager.tacticalToolType === type) {
      return "tactical";
    }

    if (manager.consumable1Type === type) {
      return "consumable1";
    }

    if (manager.consumable2Type === type) {
      return "consumable2";
    }

    return null;
  }

  private renderWeaponDetails(weaponId: WeaponId): string {
    const loadout = this.loadout.snapshot;
    const runtime = buildRuntimeWeaponDefinition(weaponId, loadout.attachments);
    const durability = this.weaponController.getDurabilityState(weaponId);
    const attachmentRows = this.loadout.attachmentSlots
      .map((slot) => `<div><span>${this.formatSlotName(slot)} Slot</span><strong>${this.loadout.getAttachmentName(slot)}</strong></div>`)
      .join("");

    return `
      <div><span>Damage</span><strong>${runtime.damage}</strong></div>
      <div><span>Fire Rate</span><strong>${runtime.fireRateRpm} RPM</strong></div>
      <div><span>Recoil</span><strong>${Math.round(runtime.hipfireRecoil * 100)}</strong></div>
      <div><span>Magazine</span><strong>${runtime.magazineSize}</strong></div>
      <div><span>Reload</span><strong>${runtime.reloadTime.toFixed(1)}s</strong></div>
      <div><span>Durability</span><strong>${Math.round(durability.durability)}%</strong></div>
      <div><span>Jam Chance</span><strong>${Math.round(durability.jamChance * 100)}%</strong></div>
      ${attachmentRows}
    `;
  }

  private formatLoadoutFilter(filter: LoadoutFilter): string {
    return filter.charAt(0).toUpperCase() + filter.slice(1);
  }

  private showInspectWeaponMenu(context: "inspect" | "arsenal" | "habitat" = "inspect"): void {
    if (context === "arsenal") {
      this.showArsenalWorkbenchMenu();
      return;
    }

    this.inspectWeaponContext = context;
    this.raidScreen = "inspect";
    this.loadout.clampToStash(this.persistentStash.items);
    const weaponId = this.resolveInspectedWeaponId();
    const headerEyebrow = context === "habitat"
        ? "Equipped Weapon"
        : "Weapon Bench";
    const headerBackAction = context === "habitat" ? "menu" : "loadout";

    if (!weaponId) {
      this.menuContent.innerHTML = `
        <div class="inspect-screen empty">
          <header class="inspect-header">
            <div>
              <span>${headerEyebrow}</span>
              <h2>No Weapons Available</h2>
              <p>No weapons available. Find or craft weapons from Crater Runs or the Fabrication Bench.</p>
            </div>
            <button type="button" data-action="${headerBackAction}">Back</button>
          </header>
        </div>
        <div class="main-menu-actions">
          <button type="button" data-action="loadout">Loadout</button>
          <button type="button" data-action="workbench">Fabrication Bench</button>
        <button type="button" data-action="menu">Back to Habitat</button>
        </div>
      `;
      this.bindMenuButtons();
      return;
    }

    this.inspectedWeaponId = weaponId;
    const loadout = this.loadout.snapshot;
    const weapon = this.getUpgradedWeapon(weaponId);
    const weaponLoot = weaponLootTypes[weaponId];
    const definition = getItemDefinition(weaponLoot);
    const rarityColor = colorToCss(themeConfig.rarityColors[definition.rarity]);
    const durability = this.weaponController.getDurabilityState(weaponId);
    const equippedSlot = this.getEquippedWeaponSlot(weaponId);
    const equippedStatus = equippedSlot === "primary"
      ? "Primary equipped"
      : equippedSlot === "sidearm"
        ? "Sidearm equipped"
        : "In stash";
    const credits = this.vendorManager.snapshot.credits;
    const scrap = this.getStashQuantity("scrap");
    const weaponParts = this.getStashQuantity("weapon-parts");
    const electronics = this.getStashQuantity("electronics");
    const repairKits = this.getStashQuantity("weapon-repair-kit");
    const rareUpgradeKits = this.getStashQuantity("rare-upgrade-kit");
    const selector = this.renderInspectWeaponSelector(weaponId);
    const compareWeaponId = weaponId === loadout.sidearmWeaponId
      ? loadout.primaryWeaponId
      : loadout.primaryWeaponId ?? loadout.sidearmWeaponId;

    this.menuContent.innerHTML = `
      <div class="inspect-screen" style="--rarity-color: ${rarityColor}">
        <header class="inspect-header">
          <div>
            <span>${headerEyebrow}</span>
            <h2>${weapon.name}</h2>
            <p><b>${this.capitalize(definition.rarity)}</b> ${definition.category} | ${equippedStatus} | Related branch: Response Discipline</p>
          </div>
          <div class="inspect-wallet">
            <span>Credits <strong>${credits}</strong></span>
            <span>Regolith Scrap <strong>${scrap}</strong></span>
            <span>Weapon Parts <strong>${weaponParts}</strong></span>
            <span>Suit Cores <strong>${electronics}</strong></span>
            <span>Repair Kits <strong>${repairKits}</strong></span>
            <span>Upgrade Kits <strong>${rareUpgradeKits}</strong></span>
          </div>
          <button type="button" data-action="${headerBackAction}">Back</button>
        </header>
        ${selector}
        <section class="inspect-layout">
          ${this.renderWeaponPreviewPanel(weapon, durability, equippedStatus)}
          ${this.renderWeaponStatPanel(weapon, durability)}
          ${this.renderWeaponAttachmentPanel()}
          ${this.renderWeaponUpgradePanel(weaponId)}
          ${this.renderWeaponRepairPanel(weaponId, durability)}
          ${this.renderWeaponComparePanel(weaponId, compareWeaponId)}
        </section>
      </div>
      <div class="main-menu-actions">
        <button type="button" data-action="loadout">Loadout</button>
        <button type="button" data-action="inspect-equip-primary-${weaponId}">Equip Primary</button>
        <button type="button" data-action="inspect-unequip-${weaponId}">Unequip</button>
        <button type="button" data-action="start">Crater Runs</button>
        <button type="button" data-action="workbench">Fabrication Bench</button>
        <button type="button" data-action="menu">Back</button>
      </div>
    `;
    this.bindMenuButtons();
  }

  private showArsenalMenu(): void {
    this.hqManager.open("arsenal");
    this.showArsenalWorkbenchMenu();
  }

  private showArsenalWorkbenchMenu(): void {
    this.inspectWeaponContext = "arsenal";
    this.raidScreen = "arsenal";
    this.hqManager.open("arsenal");
    this.menuContent.classList.add("arsenal-workbench-content");
    this.loadout.clampToStash(this.persistentStash.items);
    const weaponId = this.resolveInspectedWeaponId() ?? "pistol";
    this.inspectedWeaponId = weaponId;
    const weapon = this.getUpgradedWeapon(weaponId);
    const durability = this.weaponController.getDurabilityState(weaponId);
    const weaponLoot = weaponLootTypes[weaponId];
    const definition = getItemDefinition(weaponLoot);
    const rarityColor = colorToCss(themeConfig.rarityColors[definition.rarity]);
    const equippedSlot = this.getEquippedWeaponSlot(weaponId);
    const equippedStatus = equippedSlot ? `${this.capitalize(equippedSlot)} equipped` : this.weaponExistsForInspect(weaponId) ? "Owned in stash" : "Prototype reference";
    const compareWeaponId = weaponId === this.loadout.snapshot.sidearmWeaponId
      ? this.loadout.snapshot.primaryWeaponId
      : this.loadout.snapshot.primaryWeaponId ?? this.loadout.snapshot.sidearmWeaponId;
    const credits = this.vendorManager.snapshot.credits;
    const resourceRows = [
      ["Credits", credits],
      ["Scrap Alloy", this.getStashQuantity("scrap")],
      ["Weapon Parts", this.getStashQuantity("weapon-parts")],
      ["Circuit Fragments", this.getStashQuantity("electronics")],
      ["Repair Kits", this.getStashQuantity("weapon-repair-kit")],
      ["Upgrade Kits", this.getStashQuantity("rare-upgrade-kit")],
      ["Crater Glass", this.getStashQuantity("rare-core")],
      ["H3", this.getStashQuantity("helium-drill-core") + this.getStashQuantity("rare-core")],
    ].map(([label, value]) => `<span>${label}<strong>${Number(value).toLocaleString()}</strong></span>`).join("");

    this.menuContent.innerHTML = `
      <div class="arsenal-workbench-screen hq-dashboard-shell" style="--rarity-color: ${rarityColor}">
        <header class="arsenal-workbench-top hq-panel-header">
          <div>
            <span>Weapon Workbench</span>
            <h2>ARSENAL</h2>
            <p>Weapon inspection / repair / upgrade bench</p>
          </div>
          <div class="hq-resource-strip arsenal-resource-strip">${resourceRows}</div>
          <button type="button" data-action="loadout">Back to Loadout</button>
        </header>
        <section class="arsenal-list-panel hq-panel">
          <div class="hq-panel-header compact">
            <div>
              <span>Owned Weapons</span>
              <h3>Collection</h3>
            </div>
            <small>Prototype entries are inspect-only references.</small>
          </div>
          <div class="arsenal-weapon-list">${this.renderArsenalWeaponRows(weaponId)}</div>
        </section>
        <section class="arsenal-preview-panel hq-panel hq-preview-panel">
          <div class="hq-panel-header compact">
            <div>
              <span>${this.getWeaponManufacturer(weaponId)}</span>
              <h3>${this.getWeaponDisplayName(weaponId)}</h3>
            </div>
            <small>${equippedStatus}</small>
          </div>
          <div class="weapon-bench-preview-host" aria-label="Weapon workbench preview">
            ${this.renderWeaponSchematicFallback(weapon)}
          </div>
          <div class="inspect-meta-grid">
            <div><span>Class</span><strong>${this.getWeaponRoleLabel(weaponId)}</strong></div>
            <div><span>Ammo</span><strong>${this.capitalize(weapon.ammoType)}</strong></div>
            <div><span>Condition</span><strong>${Math.round(durability.durability)}%</strong></div>
            <div><span>Preview Asset</span><strong>${getWeaponPreviewConfig(weaponId) ? "GLB / schematic fallback" : "Schematic fallback"}</strong></div>
          </div>
        </section>
        <section class="arsenal-details-panel hq-panel hq-detail-panel">
          <div class="hq-panel-header compact">
            <div>
              <span>Weapon Details</span>
              <h3>${definition.rarity.toUpperCase()} FIELD TOOL</h3>
            </div>
          </div>
          <p>${definition.description}</p>
          ${this.renderWeaponStatPanel(weapon, durability)}
        </section>
        <section class="arsenal-mod-panel hq-panel">
          ${this.renderWeaponAttachmentPanel()}
        </section>
        <section class="arsenal-service-panel hq-panel">
          ${this.renderWeaponUpgradePanel(weaponId)}
          ${this.renderWeaponRepairPanel(weaponId, durability)}
          ${this.renderWeaponComparePanel(weaponId, compareWeaponId)}
        </section>
        <section class="arsenal-action-rail hq-panel">
          <div>
            <span>Bench Actions</span>
            <strong>${this.getWeaponDisplayName(weaponId)}</strong>
            <p>HQ equip, repair, upgrade, and attachment actions use current systems. In-raid weapon swapping remains reserved for Phase 11.0.</p>
          </div>
          <footer class="hq-action-bar">
            <button type="button" data-action="inspect-equip-primary-${weaponId}">Equip to ${weaponId === "pistol" || weaponId === "burst-pistol" || weaponId === "revolver" || weaponId === "compact-smg" ? "Sidearm" : weaponId === "knife" ? "Tool" : "Primary"}</button>
            <button type="button" data-action="inspect-repair-${weaponId}">Repair</button>
            <button type="button" disabled>Compare Overlay - Bench Locked</button>
            <button type="button" disabled>Skin / Wrap - Coming Soon</button>
            <button type="button" data-action="loadout">Back to Loadout</button>
          </footer>
        </section>
      </div>
    `;
    this.bindMenuButtons();
    this.weaponBenchPreview.mount(this.menuContent.querySelector<HTMLElement>(".weapon-bench-preview-host"), weaponId);
  }

  private resolveInspectedWeaponId(): WeaponId | null {
    const selectedType = this.loadoutManager.snapshot.selectedType;
    const selectedWeapon = selectedType ? weaponIdFromLootType(selectedType) : null;
    const equipped = this.loadout.snapshot.primaryWeaponId ?? this.loadout.snapshot.sidearmWeaponId;
    const stashWeapon = this.getAvailableWeaponIds()[0] ?? null;
    const candidate = this.inspectedWeaponId ?? selectedWeapon ?? equipped ?? stashWeapon;

    if (candidate && this.weaponExistsForInspect(candidate)) {
      this.lastInvalidInspectWeaponId = null;
      return candidate;
    }

    const fallback = stashWeapon ?? equipped ?? null;
    if (candidate) {
      if (this.lastInvalidInspectWeaponId !== candidate) {
        console.warn(`InspectWeapon: invalid or unavailable weapon id "${candidate}"; falling back.`);
        this.lastInvalidInspectWeaponId = candidate;
      }
      if (fallback && fallback !== candidate) {
        this.inspectedWeaponId = fallback;
      }
    }

    return fallback;
  }

  private getAvailableWeaponIds(): WeaponId[] {
    const ids = Object.keys(weaponDefinitions) as WeaponId[];
    return ids.filter((weaponId) => this.weaponExistsForInspect(weaponId));
  }

  private weaponExistsForInspect(weaponId: WeaponId): boolean {
    if (weaponId === this.loadout.snapshot.sidearmWeaponId || weaponId === this.loadout.snapshot.primaryWeaponId) {
      return true;
    }

    return this.getStashQuantity(weaponLootTypes[weaponId]) > 0;
  }

  private getEquippedWeaponSlot(weaponId: WeaponId): "primary" | "sidearm" | null {
    const loadout = this.loadout.snapshot;

    if (loadout.primaryWeaponId === weaponId) {
      return "primary";
    }

    if (loadout.sidearmWeaponId === weaponId) {
      return "sidearm";
    }

    return null;
  }

  private getWeaponDisplayName(weaponId: WeaponId): string {
    const names: Partial<Record<WeaponId, string>> = {
      pistol: "MK-3 Survey Pistol",
      "burst-pistol": "MK-3 Survey Pistol Alt",
      revolver: "Flare Spike Launcher",
      "compact-smg": "TY-7 Crater Carbine",
      smg: "TY-7 Crater Carbine",
      shotgun: "Breach-12 Scattergun",
      "assault-rifle": "PR4 Pulse Rifle",
      rifle: "Longline Marksman Rifle",
      knife: "Industrial Mining Laser",
    };
    return names[weaponId] ?? weaponDefinitions[weaponId].name;
  }

  private getWeaponRoleLabel(weaponId: WeaponId): string {
    const roles: Partial<Record<WeaponId, string>> = {
      pistol: "Survey sidearm",
      "burst-pistol": "Burst sidearm variant",
      revolver: "Signal spike launcher",
      "compact-smg": "Compact crater carbine",
      smg: "Close-range carbine",
      shotgun: "Breach scattergun",
      "assault-rifle": "Pulse rifle",
      rifle: "Marksman rifle",
      knife: "Industrial field tool",
    };
    return roles[weaponId] ?? "Extraction weapon";
  }

  private getWeaponManufacturer(weaponId: WeaponId): string {
    const makers: Partial<Record<WeaponId, string>> = {
      pistol: "MK Survey Arms",
      "burst-pistol": "MK Survey Arms",
      revolver: "Flareline Works",
      "compact-smg": "Tycho Yard",
      smg: "Tycho Yard",
      shotgun: "Breach Industrial",
      "assault-rifle": "PR4 Helios Pattern",
      rifle: "Longline Survey",
      knife: "Mining Cutter Retrofit",
    };
    return makers[weaponId] ?? "Lunar Field Pattern";
  }

  private renderArsenalWeaponRows(selectedWeaponId: WeaponId): string {
    const weaponIds = Object.keys(weaponDefinitions) as WeaponId[];
    return weaponIds.map((weaponId) => {
      const definition = getItemDefinition(weaponLootTypes[weaponId]);
      const color = colorToCss(themeConfig.rarityColors[definition.rarity]);
      const equipped = this.getEquippedWeaponSlot(weaponId);
      const owned = this.weaponExistsForInspect(weaponId);
      const durability = this.weaponController.getDurabilityState(weaponId);
      return `
        <button type="button" class="arsenal-weapon-row hq-list-row ${weaponId === selectedWeaponId ? "selected" : ""} ${owned ? "" : "prototype"}" data-action="inspect-select-${weaponId}" style="--rarity-color: ${color}">
          <strong>${this.getWeaponDisplayName(weaponId)}</strong>
          <span>${this.getWeaponRoleLabel(weaponId)}</span>
          <small>${equipped ? `${this.capitalize(equipped)} equipped` : owned ? `${this.getStashQuantity(weaponLootTypes[weaponId])} in stash` : "Prototype reference"} | ${Math.round(durability.durability)}%</small>
        </button>
      `;
    }).join("");
  }

  private renderWeaponSchematicFallback(weapon: RuntimeWeaponDefinition): string {
    return `
      <div class="weapon-silhouette weapon-schematic-fallback" style="--weapon-length: ${Math.max(72, weapon.mesh.depth * 86)}px">
        <span></span><i></i><b></b>
        <em>Diagnostic schematic</em>
      </div>
    `;
  }

  private renderInspectWeaponSelector(selectedWeaponId: WeaponId): string {
    const weaponIds = this.getAvailableWeaponIds();

    return `
      <nav class="inspect-weapon-tabs">
        ${weaponIds.map((weaponId) => {
          const definition = getItemDefinition(weaponLootTypes[weaponId]);
          const color = colorToCss(themeConfig.rarityColors[definition.rarity]);
          const equipped = this.getEquippedWeaponSlot(weaponId);
          return `
            <button type="button" class="${weaponId === selectedWeaponId ? "active" : ""}" data-action="inspect-select-${weaponId}" style="--rarity-color: ${color}">
              <strong>${weaponDefinitions[weaponId].name}</strong>
              <span>${equipped ? this.capitalize(equipped) : `${this.getStashQuantity(weaponLootTypes[weaponId])} in stash`}</span>
            </button>
          `;
        }).join("")}
      </nav>
    `;
  }

  private renderWeaponPreviewPanel(
    weapon: RuntimeWeaponDefinition,
    durability: ReturnType<WeaponController["getDurabilityState"]>,
    equippedStatus: string,
  ): string {
    return `
      <section class="inspect-card weapon-preview-card">
        <h3>Preview</h3>
        <div class="weapon-silhouette" style="--weapon-length: ${Math.max(46, weapon.mesh.depth * 72)}px">
          <span></span><i></i><b></b>
        </div>
        <div class="inspect-meta-grid">
          <div><span>Type</span><strong>${weapon.automatic ? "Automatic" : "Semi-auto"}</strong></div>
          <div><span>Ammo</span><strong>${this.capitalize(weapon.ammoType)}</strong></div>
          <div><span>Durability</span><strong>${Math.round(durability.durability)}%</strong></div>
          <div><span>Jam Chance</span><strong>${Math.round(durability.jamChance * 100)}%</strong></div>
          <div><span>Equipped Slot</span><strong>${equippedStatus}</strong></div>
          <div><span>Effective Range</span><strong>${Math.round(weapon.effectiveRange)}m</strong></div>
        </div>
      </section>
    `;
  }

  private renderWeaponStatPanel(
    weapon: RuntimeWeaponDefinition,
    durability: ReturnType<WeaponController["getDurabilityState"]>,
  ): string {
    const stats = [
      { label: "Damage", value: weapon.damage, max: 50, text: `${weapon.damage}` },
      { label: "Fire Rate", value: weapon.fireRateRpm, max: 800, text: `${weapon.fireRateRpm} RPM` },
      { label: "Accuracy", value: 100 - weapon.spreadDegrees * 12 * durability.accuracyMultiplier, max: 100, text: `${Math.max(0, weapon.spreadDegrees * durability.accuracyMultiplier).toFixed(2)} spread` },
      { label: "Recoil Control", value: 100 - weapon.hipfireRecoil * 480 * durability.recoilMultiplier, max: 100, text: `${Math.round((1 / Math.max(0.01, weapon.hipfireRecoil * durability.recoilMultiplier)) * 10)}` },
      { label: "Magazine Size", value: weapon.magazineSize, max: 40, text: `${weapon.magazineSize}` },
      { label: "Reload Speed", value: 100 - weapon.reloadTime * 24, max: 100, text: `${weapon.reloadTime.toFixed(2)}s` },
      { label: "ADS Speed", value: weapon.adsTransitionMultiplier * durability.adsTransitionMultiplier * 100, max: 140, text: `${Math.round(weapon.adsTransitionMultiplier * durability.adsTransitionMultiplier * 100)}%` },
      { label: "Range", value: weapon.effectiveRange, max: 130, text: `${Math.round(weapon.effectiveRange)}m` },
      { label: "Durability", value: durability.durability, max: 100, text: `${Math.round(durability.durability)}%` },
      { label: "Handling", value: 110 - weapon.reloadTime * 15 - weapon.hipfireRecoil * 160, max: 100, text: `${Math.round(Math.max(10, 110 - weapon.reloadTime * 15 - weapon.hipfireRecoil * 160))}` },
    ];

    return `
      <section class="inspect-card stat-panel">
        <h3>Stats</h3>
        ${stats.map((stat) => this.renderStatBar(stat.label, stat.value, stat.max, stat.text)).join("")}
      </section>
    `;
  }

  private renderWeaponAttachmentPanel(): string {
    const rows = this.loadout.attachmentSlots.map((slot) => {
      const attachmentId = this.loadout.snapshot.attachments[slot];
      const attachment = attachmentId ? attachmentDefinitions[attachmentId] : null;
      const available = Object.values(attachmentDefinitions)
        .filter((candidate) => candidate.slot === slot && this.getStashQuantity(candidate.lootType) > 0);
      const description = attachment?.description ?? (available.length > 0 ? "Ready to equip from stash." : "No compatible attachment in stash.");
      const effect = attachment ? this.formatAttachmentEffects(attachment.id) : "Empty slot";

      return `
        <article class="attachment-slot-card">
          <span>${this.formatSlotName(slot)}</span>
          <strong>${attachment?.name ?? "Empty"}</strong>
          <small>${description}</small>
          <em>${effect}</em>
          <footer>
            <button type="button" data-action="inspect-attachment-cycle-${slot}">${available.length > 0 ? "Attach" : "No Stash Item"}</button>
            <button type="button" data-action="inspect-attachment-clear-${slot}" ${attachment ? "" : "disabled"}>Remove</button>
          </footer>
        </article>
      `;
    }).join("");

    return `
      <section class="inspect-card attachment-panel">
        <h3>Attachments</h3>
        <div class="attachment-grid">${rows}</div>
      </section>
    `;
  }

  private renderWeaponUpgradePanel(weaponId: WeaponId): string {
    const rows = weaponUpgradeCategories.map((category) => {
      const tier = this.weaponUpgrades[weaponId][category.id] ?? 0;
      const maxed = tier >= maxWeaponUpgradeTier;
      const requirements = this.getWeaponUpgradeRequirements(category.id, tier);
      const affordable = requirements.every((requirement) => this.getStashQuantity(requirement.type) >= requirement.quantity);
      const missing = this.getMissingBenchRequirements(requirements);
      const buttonLabel = maxed
        ? "Max Tier"
        : affordable
          ? `Upgrade to Tier ${tier + 1}`
          : this.getBenchRequirementButtonLabel(missing, "Need Materials");
      return `
        <article class="upgrade-row ${maxed ? "maxed" : affordable ? "" : "locked"}">
          <div>
            <span>${category.label}</span>
            <strong>Tier ${tier}/${maxWeaponUpgradeTier}${maxed ? " - Max tier reached" : ` -> ${tier + 1}`}</strong>
            <small>${maxed ? "Max tier reached" : `Next Tier ${tier + 1}: ${category.effect}`}</small>
          </div>
          <div class="bench-materials">${maxed ? `<em>Fully tuned</em>` : this.renderBenchMaterialRequirements(requirements)}</div>
          <button type="button" data-action="inspect-upgrade-${category.id}" ${maxed || !affordable ? "disabled" : ""}>${buttonLabel}</button>
        </article>
      `;
    }).join("");

    return `
      <section class="inspect-card upgrade-panel">
        <h3>Upgrade Tree</h3>
        ${rows}
      </section>
    `;
  }

  private renderWeaponRepairPanel(
    weaponId: WeaponId,
    durability: ReturnType<WeaponController["getDurabilityState"]>,
  ): string {
    const repairCost = this.weaponController.getFullRepairCost(weaponId);
    const scrapRequirements: BenchMaterialRequirement[] = repairCost > 0
      ? [{ type: "scrap", quantity: repairCost }]
      : [];
    const kitRequirements: BenchMaterialRequirement[] = repairCost > 0
      ? [{ type: "weapon-repair-kit", quantity: 1 }]
      : [];
    const canRepairWithScrap = repairCost > 0 && scrapRequirements.every((requirement) => this.getStashQuantity(requirement.type) >= requirement.quantity);
    const canRepairWithKit = repairCost > 0 && kitRequirements.every((requirement) => this.getStashQuantity(requirement.type) >= requirement.quantity);
    const scrapButtonLabel = repairCost <= 0
      ? "Full Condition"
      : canRepairWithScrap
        ? "Full Repair With Scrap"
        : this.getBenchRequirementButtonLabel(this.getMissingBenchRequirements(scrapRequirements), "Need Scrap");
    const kitButtonLabel = repairCost <= 0
      ? "Kit Not Needed"
      : canRepairWithKit
        ? "Restore to 100% With Kit"
        : this.getBenchRequirementButtonLabel(this.getMissingBenchRequirements(kitRequirements), "Need Repair Kit");
    const nextJam = repairCost > 0 ? 0 : durability.jamChance;

    return `
      <section class="inspect-card repair-panel ${durability.jamWarning ? "warning" : ""}">
        <h3>Repair</h3>
        ${this.renderStatBar("Current Durability", durability.durability, 100, `${Math.round(durability.durability)}%`)}
        <p>${repairCost <= 0 ? "Weapon already at full condition." : durability.jamWarning ? "Low durability is raising jam risk. Scrap service and repair kits both restore this weapon to full condition." : "Scrap service restores full condition; repair kits are the premium one-click option."}</p>
        <div class="inspect-meta-grid">
          <div><span>Scrap Service</span><strong>${repairCost <= 0 ? "No service needed" : "Full repair"}</strong></div>
          <div><span>Repair Kit</span><strong>${repairCost <= 0 ? "Not needed" : "Restores to 100%"}</strong></div>
          <div><span>Jam Preview</span><strong>${Math.round(durability.jamChance * 100)}% -> ${Math.round(nextJam * 100)}%</strong></div>
        </div>
        <div class="bench-materials repair-cost">
          ${repairCost <= 0 ? `<em>Fully Repaired</em>` : this.renderBenchMaterialRequirements(scrapRequirements)}
        </div>
        <div class="bench-action-row">
          <button type="button" data-action="inspect-repair-${weaponId}" ${repairCost <= 0 || !canRepairWithScrap ? "disabled" : ""}>${scrapButtonLabel}</button>
          <button type="button" data-action="inspect-repair-kit-${weaponId}" ${repairCost <= 0 || !canRepairWithKit ? "disabled" : ""}>${kitButtonLabel}</button>
        </div>
        <div class="bench-materials kit-cost">${repairCost <= 0 ? "" : this.renderBenchMaterialRequirements(kitRequirements)}</div>
      </section>
    `;
  }

  private renderWeaponComparePanel(weaponId: WeaponId, compareWeaponId: WeaponId | null): string {
    if (!compareWeaponId || compareWeaponId === weaponId) {
      return `
        <section class="inspect-card compare-panel">
          <h3>Compare</h3>
          <p>No alternate equipped weapon to compare yet.</p>
        </section>
      `;
    }

    const current = this.getUpgradedWeapon(weaponId);
    const compare = this.getUpgradedWeapon(compareWeaponId);
    const currentDurability = this.weaponController.getDurabilityState(weaponId);
    const compareDurability = this.weaponController.getDurabilityState(compareWeaponId);
    const rows = [
      ["Damage", current.damage - compare.damage],
      ["Recoil", Math.round((compare.hipfireRecoil - current.hipfireRecoil) * 1000) / 10],
      ["Mag Size", current.magazineSize - compare.magazineSize],
      ["Durability", Math.round(currentDurability.durability - compareDurability.durability)],
    ] as const;

    return `
      <section class="inspect-card compare-panel">
        <h3>Compare vs ${compare.name}</h3>
        ${rows.map(([label, delta]) => `
          <div class="compare-row ${delta >= 0 ? "positive" : "negative"}">
            <span>${label}</span>
            <strong>${delta >= 0 ? "+" : ""}${delta}</strong>
          </div>
        `).join("")}
      </section>
    `;
  }

  private renderStatBar(label: string, value: number, max: number, text: string): string {
    const percent = Math.max(0, Math.min(100, (value / max) * 100));
    return `
      <div class="inspect-stat">
        <label><span>${label}</span><strong>${text}</strong></label>
        <i><b style="width: ${percent}%"></b></i>
      </div>
    `;
  }

  private formatAttachmentEffects(attachmentId: AttachmentId): string {
    const modifiers = attachmentDefinitions[attachmentId].modifiers;
    const effects = [
      modifiers.damageMultiplier ? `Damage x${modifiers.damageMultiplier}` : "",
      modifiers.rangeMultiplier ? `Range x${modifiers.rangeMultiplier}` : "",
      modifiers.magazineMultiplier ? `Mag x${modifiers.magazineMultiplier}` : "",
      modifiers.reloadTimeMultiplier ? `Reload x${modifiers.reloadTimeMultiplier}` : "",
      modifiers.verticalRecoilMultiplier ? `Vert recoil x${modifiers.verticalRecoilMultiplier}` : "",
      modifiers.horizontalRecoilMultiplier ? `Horiz recoil x${modifiers.horizontalRecoilMultiplier}` : "",
      modifiers.adsTransitionMultiplier ? `ADS x${modifiers.adsTransitionMultiplier}` : "",
      modifiers.detectionNoiseMultiplier ? `Noise x${modifiers.detectionNoiseMultiplier}` : "",
    ].filter(Boolean);

    return effects.join(" | ") || "Cosmetic handling pass";
  }

  private getUpgradedWeapon(weaponId: WeaponId): RuntimeWeaponDefinition {
    const weapon = buildRuntimeWeaponDefinition(weaponId, this.loadout.snapshot.attachments);
    const upgrades = this.weaponUpgrades[weaponId];
    return {
      ...weapon,
      damage: Math.round(weapon.damage * (1 + upgrades.damage * 0.04)),
      reloadTime: weapon.reloadTime * (1 - upgrades.reload * 0.05),
      hipfireRecoil: weapon.hipfireRecoil * (1 - upgrades.recoil * 0.06),
      horizontalRecoil: weapon.horizontalRecoil * (1 - upgrades.recoil * 0.05),
      magazineSize: weapon.magazineSize + upgrades.magazine,
      adsTransitionMultiplier: weapon.adsTransitionMultiplier * (1 + upgrades.ads * 0.05),
      effectiveRange: weapon.effectiveRange * (1 + upgrades.damage * 0.015),
    };
  }

  private getWeaponUpgradeCost(category: WeaponUpgradeCategory, currentTier: number): { scrap: number; parts: number; rareKits: number } {
    const definition = weaponUpgradeCategories.find((item) => item.id === category);

    if (!definition) {
      return { scrap: 999, parts: 999, rareKits: 999 };
    }

    const nextTier = currentTier + 1;
    return {
      scrap: definition.scrapBase * nextTier,
      parts: definition.partsBase * nextTier,
      rareKits: nextTier >= maxWeaponUpgradeTier ? 1 : 0,
    };
  }

  private getWeaponUpgradeRequirements(category: WeaponUpgradeCategory, currentTier: number): BenchMaterialRequirement[] {
    const cost = this.getWeaponUpgradeCost(category, currentTier);
    const requirements: BenchMaterialRequirement[] = [
      { type: "scrap", quantity: cost.scrap },
      { type: "weapon-parts", quantity: cost.parts },
    ];

    if (cost.rareKits > 0) {
      requirements.push({ type: "rare-upgrade-kit", quantity: cost.rareKits });
    }

    return requirements.filter((requirement) => requirement.quantity > 0);
  }

  private renderBenchMaterialRequirements(requirements: readonly BenchMaterialRequirement[]): string {
    if (requirements.length === 0) {
      return `<em>No materials required</em>`;
    }

    return requirements.map((requirement) => {
      const definition = getItemDefinition(requirement.type);
      const owned = this.getStashQuantity(requirement.type);
      const status = owned >= requirement.quantity ? "ok" : "missing";
      return `
        <span class="${status}">
          <b>${definition.label}</b>
          <strong>${owned} / ${requirement.quantity}</strong>
        </span>
      `;
    }).join("");
  }

  private getMissingBenchRequirements(requirements: readonly BenchMaterialRequirement[]): BenchMaterialRequirement[] {
    return requirements
      .map((requirement) => ({
        ...requirement,
        quantity: Math.max(0, requirement.quantity - this.getStashQuantity(requirement.type)),
      }))
      .filter((requirement) => requirement.quantity > 0);
  }

  private getBenchRequirementButtonLabel(
    missingRequirements: readonly BenchMaterialRequirement[],
    fallback: string,
  ): string {
    if (missingRequirements.length === 0) {
      return fallback;
    }

    const primary = getItemDefinition(missingRequirements[0].type).label;
    return missingRequirements.length === 1 ? `Need ${primary}` : "Need Materials";
  }

  private formatBenchRequirements(requirements: readonly BenchMaterialRequirement[]): string {
    return requirements
      .map((requirement) => `${requirement.type}:${this.getStashQuantity(requirement.type)}/${requirement.quantity}`)
      .join(",");
  }

  private consumeBenchMaterials(requirements: readonly BenchMaterialRequirement[]): boolean {
    if (!requirements.every((requirement) => this.getStashQuantity(requirement.type) >= requirement.quantity)) {
      return false;
    }

    const consumed: LootStack[] = [];

    for (const requirement of requirements) {
      if (requirement.quantity <= 0) {
        continue;
      }

      if (!this.persistentStash.remove(requirement.type, requirement.quantity)) {
        if (consumed.length > 0) {
          this.persistentStash.addItems(consumed);
        }
        return false;
      }

      consumed.push({
        type: requirement.type,
        label: getItemDefinition(requirement.type).label,
        quantity: requirement.quantity,
      });
    }

    if (consumed.length > 0) {
      console.info(`[Workbench] consumed materials=${consumed.map((item) => `${item.type}:${item.quantity}`).join(",")}`);
    }

    return true;
  }

  private getWeaponUpgradeCategoryLabel(category: WeaponUpgradeCategory): string {
    return weaponUpgradeCategories.find((item) => item.id === category)?.label ?? this.capitalize(category);
  }

  private upgradeInspectedWeapon(category: WeaponUpgradeCategory): string {
    const weaponId = this.inspectedWeaponId ?? this.resolveInspectedWeaponId();

    if (!weaponId) {
      return "No weapon selected";
    }

    const currentTier = this.weaponUpgrades[weaponId][category] ?? 0;

    if (currentTier >= maxWeaponUpgradeTier) {
      console.info(`[Workbench] upgrade weapon=${weaponId} category=${category} ok=false reason=max-tier tier=${currentTier}`);
      return "Max tier reached";
    }

    const requirements = this.getWeaponUpgradeRequirements(category, currentTier);
    const cost = this.getWeaponUpgradeCost(category, currentTier);

    if (this.getStashQuantity("scrap") < cost.scrap) {
      console.info(`[Workbench] upgrade weapon=${weaponId} category=${category} ok=false reason=missing-scrap materials=scrap:${this.getStashQuantity("scrap")}/${cost.scrap}`);
      return "Not enough Regolith Scrap.";
    }

    if (this.getStashQuantity("weapon-parts") < cost.parts) {
      console.info(`[Workbench] upgrade weapon=${weaponId} category=${category} ok=false reason=missing-weapon-parts materials=weapon-parts:${this.getStashQuantity("weapon-parts")}/${cost.parts}`);
      return "Not enough Mining Weapon Parts.";
    }

    if (cost.rareKits > 0 && this.getStashQuantity("rare-upgrade-kit") < cost.rareKits) {
      console.info(`[Workbench] upgrade weapon=${weaponId} category=${category} ok=false reason=missing-rare-upgrade-kit materials=rare-upgrade-kit:${this.getStashQuantity("rare-upgrade-kit")}/${cost.rareKits}`);
      return "Rare Upgrade Kit required";
    }

    if (!this.consumeBenchMaterials(requirements)) {
      console.info(`[Workbench] upgrade weapon=${weaponId} category=${category} ok=false reason=consume-failed materials=${this.formatBenchRequirements(requirements)}`);
      return "Upgrade materials changed. Try again.";
    }

    this.weaponUpgrades = {
      ...this.weaponUpgrades,
      [weaponId]: {
        ...this.weaponUpgrades[weaponId],
        [category]: currentTier + 1,
      },
    };
    this.saveWeaponUpgrades();
    console.info(`[Workbench] upgrade weapon=${weaponId} category=${category} ok=true tier=${currentTier + 1} materials=scrap:${cost.scrap},weapon-parts:${cost.parts},rare-upgrade-kit:${cost.rareKits}`);
    return `${this.getWeaponUpgradeCategoryLabel(category)} tuning upgraded to tier ${currentTier + 1}.`;
  }

  private refreshInspectWeaponMenuPreservingScroll(): void {
    const scrollTop = this.menuContent.scrollTop;
    if (this.inspectWeaponContext === "arsenal" || this.raidScreen === "arsenal") {
      this.showArsenalWorkbenchMenu();
    } else {
      this.showInspectWeaponMenu(this.inspectWeaponContext);
    }
    window.requestAnimationFrame(() => {
      this.menuContent.scrollTop = scrollTop;
    });
  }

  private showWorkbenchMenu(): void {
    this.raidScreen = "workbench";
    this.loadout.clampToStash(this.persistentStash.items);
    const scrap = this.getStashQuantity("scrap");
    const craftingState = this.craftingManager.snapshot;
    const warning = craftingState.warning
      ? `<div class="crafting-warning">${craftingState.warning}</div>`
      : "";
    const success = craftingState.lastMessage && !craftingState.warning
      ? `<div class="crafting-success">${craftingState.lastMessage}</div>`
      : "";
    const nextWorkbenchLevel = this.craftingManager.nextWorkbenchLevel;
    const workbenchUpgradeCost = this.craftingManager.getWorkbenchUpgradeCost();
    const canUpgradeWorkbench = nextWorkbenchLevel !== null && scrap >= workbenchUpgradeCost;
    const unlockPreview = nextWorkbenchLevel
      ? craftingRecipes
        .filter((recipe) => recipe.requiredWorkbenchLevel === nextWorkbenchLevel)
        .map((recipe) => recipe.name)
        .join(", ")
      : "All recipe tiers unlocked";

    this.menuContent.innerHTML = `
      <div class="crafting-screen inspect-screen">
        <section class="crafting-hero">
          <div>
            <span>Fabrication Bench</span>
            <h2>DARK CRATERS Fabrication</h2>
            <p>Spend extracted Regolith Scrap on Crater Run prep, field repairs, and early habitat upgrades.</p>
          </div>
          <div class="workbench-scrap-stack">
            <strong>Regolith Scrap ${scrap}</strong>
            <span>Fabrication Lv. ${craftingState.workbenchLevel}</span>
          </div>
        </section>
        ${warning || success}
        <section class="workbench-level-panel">
          <div>
            <span>Fabrication Level</span>
            <strong>${craftingState.workbenchLevel} / ${maxWorkbenchLevel}</strong>
            <small>${nextWorkbenchLevel ? `Next unlocks: ${unlockPreview}` : unlockPreview}</small>
          </div>
          <div class="workbench-level-track" aria-hidden="true">
            ${Array.from({ length: maxWorkbenchLevel }, (_, index) => `<i class="${index < craftingState.workbenchLevel ? "active" : ""}"></i>`).join("")}
          </div>
          ${nextWorkbenchLevel
            ? `<button type="button" data-action="workbench-upgrade">${canUpgradeWorkbench ? `Upgrade to Lv. ${nextWorkbenchLevel}` : `Need ${workbenchUpgradeCost} Regolith Scrap`}</button>`
            : "<button type=\"button\" disabled>Max Level</button>"
          }
        </section>
        <section class="crafting-section">
          <div class="crafting-section-heading">
            <h3>Recipe Tree</h3>
            <span>Crafted items go straight to Habitat Stash</span>
          </div>
          <div class="crafting-grid">${this.renderCraftingRecipeCards(scrap)}</div>
        </section>
        <section class="crafting-section">
          <div class="crafting-section-heading">
            <h3>Repair Bench</h3>
            <span>Repair costs scale with missing durability</span>
          </div>
          <div class="crafting-repair-grid">
            ${this.renderCraftingRepairRows(scrap)}
          </div>
        </section>
        <section class="crafting-section">
          <div class="crafting-section-heading">
            <h3>Scrap Upgrades</h3>
            <span>Persistent Layer 1 upgrade hooks for future tuning</span>
          </div>
          <div class="crafting-grid">${this.renderCraftingUpgradeCards(scrap)}</div>
        </section>
      </div>
      <div class="main-menu-actions">
        <button type="button" data-action="loadout">Loadout</button>
        <button type="button" data-action="inspect">Inspect Weapon</button>
        <button type="button" data-action="start">Crater Runs</button>
        <button type="button" data-action="menu">Back</button>
      </div>
    `;
    this.bindMenuButtons();
  }

  private refreshWorkbenchMenuPreservingState(): void {
    const scrollTop = this.menuContent.scrollTop;
    this.showWorkbenchMenu();
    window.requestAnimationFrame(() => {
      this.menuContent.scrollTop = scrollTop;
    });
  }

  private renderCraftingRecipeCards(scrap: number): string {
    const workbenchLevel = this.craftingManager.snapshot.workbenchLevel;

    return craftingRecipes.map((recipe) => {
      const definition = getItemDefinition(recipe.outputType);
      const rarityColor = colorToCss(themeConfig.rarityColors[definition.rarity]);
      const unlocked = workbenchLevel >= recipe.requiredWorkbenchLevel;
      const canAfford = scrap >= recipe.scrapCost;
      const ingredientStatus = this.craftingManager.recipeIngredientStatus(recipe, (type) => this.getStashQuantity(type));
      const hasIngredients = ingredientStatus.every((ingredient) => ingredient.ok);
      const outputLabel = recipe.outputQuantity > 1
        ? `${recipe.outputQuantity} ${definition.label}`
        : definition.label;
      const ingredientRows = ingredientStatus.length > 0
        ? `<div class="crafting-ingredients">${ingredientStatus.map((ingredient) => {
          const label = getItemDefinition(ingredient.type).label;
          return `<span class="${ingredient.ok ? "ok" : "missing"}">${label} ${ingredient.available}/${ingredient.quantity}</span>`;
        }).join("")}</div>`
        : "";
      const buttonLabel = !unlocked
        ? "Locked"
        : !canAfford
          ? "Need Scrap"
          : !hasIngredients
            ? "Need Items"
            : "Craft";

      return `
        <article class="crafting-card ${canAfford && hasIngredients ? "" : "unaffordable"} ${unlocked ? "" : "locked"}" style="--rarity-color: ${rarityColor}">
          <strong>${recipe.name}</strong>
          <span>${unlocked ? outputLabel : `Requires Fabrication Lv. ${recipe.requiredWorkbenchLevel}`}</span>
          <small>${recipe.description}</small>
          ${ingredientRows}
          <footer>
            <em>${recipe.scrapCost} regolith scrap</em>
            <button type="button" data-action="craft-${recipe.id}" ${unlocked && canAfford && hasIngredients ? "" : "disabled"}>${buttonLabel}</button>
          </footer>
        </article>
      `;
    }).join("");
  }

  private renderCraftingRepairRows(scrap: number): string {
    const loadout = this.loadout.snapshot;
    const weapons: { label: string; weaponId: WeaponId }[] = [
      ...(loadout.primaryWeaponId ? [{ label: "Primary", weaponId: loadout.primaryWeaponId }] : []),
      { label: "Sidearm", weaponId: loadout.sidearmWeaponId },
    ];
    const weaponRows = weapons.map(({ label, weaponId }) => {
      const durability = this.weaponController.getDurabilityState(weaponId);
      const percent = Math.round(durability.durability);
      const cost = this.weaponController.getFullRepairCost(weaponId);
      const canRepair = cost > 0 && scrap >= cost;
      const note = durability.jamWarning ? "Jam risk" : cost > 0 ? "Damaged" : "Ready";

      return `
        <article class="crafting-repair-row">
          <div>
            <strong>${label}: ${this.capitalize(weaponId)}</strong>
            <span>${percent}% durability | ${note}</span>
          </div>
          <em>${cost > 0 ? `${cost} regolith scrap` : "Full"}</em>
          ${cost > 0
            ? `<button type="button" data-action="craft-repair-weapon-${weaponId}">${canRepair ? "Repair" : "Need Scrap"}</button>`
            : "<span>Fully repaired</span>"
          }
        </article>
      `;
    }).join("");
    const armorDurability = Math.round(this.craftingManager.snapshot.armorDurability);
    const armorCost = this.craftingManager.getArmorRepairCost();
    const canRepairArmor = armorCost > 0 && scrap >= armorCost;
    const armorRow = `
      <article class="crafting-repair-row">
        <div>
          <strong>Armor Rig</strong>
          <span>${armorDurability}% durability | Layer 1 armor repair state</span>
        </div>
        <em>${armorCost > 0 ? `${armorCost} regolith scrap` : "Full"}</em>
        ${armorCost > 0
          ? `<button type="button" data-action="craft-repair-armor">${canRepairArmor ? "Repair" : "Need Scrap"}</button>`
          : "<span>Fully repaired</span>"
        }
      </article>
    `;

    return `${weaponRows}${armorRow}`;
  }

  private renderCraftingUpgradeCards(scrap: number): string {
    const state = this.craftingManager.snapshot;

    return craftingUpgrades.map((upgrade) => {
      const unlocked = state.upgrades[upgrade.id];
      const canAfford = scrap >= upgrade.scrapCost;
      const rarityColor = unlocked
        ? colorToCss(themeConfig.rarityColors.uncommon)
        : colorToCss(themeConfig.rarityColors.rare);

      return `
        <article class="crafting-card upgrade ${unlocked ? "unlocked" : ""} ${canAfford ? "" : "unaffordable"}" style="--rarity-color: ${rarityColor}">
          <strong>${upgrade.name}</strong>
          <span>${unlocked ? "Unlocked" : "Available"}</span>
          <small>${upgrade.description}</small>
          <footer>
            <em>${upgrade.scrapCost} regolith scrap</em>
            <button type="button" data-action="craft-upgrade-${upgrade.id}" ${unlocked ? "disabled" : ""}>${unlocked ? "Owned" : canAfford ? "Unlock" : "Need Scrap"}</button>
          </footer>
        </article>
      `;
    }).join("");
  }

  private showSettingsMenu(tab: SettingsTab = "graphics"): void {
    this.raidScreen = "settings";
    const settings = this.settingsManager.snapshot;
    const tabs: SettingsTab[] = ["graphics", "audio", "controls", "gameplay"];
    const tabButtons = tabs
      .map((item) => `<button type="button" data-action="settings-tab-${item}" class="${item === tab ? "active" : ""}">${this.capitalize(item)}</button>`)
      .join("");

    this.menuContent.innerHTML = `
      <div class="settings-panel">
        <h2>Settings</h2>
        <div class="settings-tabs">${tabButtons}</div>
        <div class="settings-body">${this.renderSettingsTab(tab, settings)}</div>
      </div>
      <div class="main-menu-actions">
        <button type="button" data-action="settings-reset">Reset to Defaults</button>
        <button type="button" data-action="debug-grant-resources">Grant Test Resources</button>
        <button type="button" data-action="debug-reset-save">Reset Save / Debug</button>
        <button type="button" data-action="menu">Back</button>
      </div>
    `;
    this.bindMenuButtons();
    this.bindSettingsInputs(tab);
  }

  private renderSettingsTab(tab: SettingsTab, settings = this.settingsManager.snapshot): string {
    if (tab === "graphics") {
      return `
        ${this.rangeSetting("FOV", "graphics.fovDegrees", settings.graphics.fovDegrees, 60, 100, 1)}
        ${this.rangeSetting("Camera Sensitivity", "graphics.cameraSensitivity", settings.graphics.cameraSensitivity, 0.25, 2.5, 0.05)}
        ${this.rangeSetting("ADS Sensitivity", "graphics.adsSensitivityMultiplier", settings.graphics.adsSensitivityMultiplier, 0.25, 1, 0.05)}
        ${this.selectSetting("Graphics Quality", "graphics.quality", settings.graphics.quality, ["low", "medium", "high"])}
        ${this.toggleSetting("Fullscreen", "graphics.fullscreen", settings.graphics.fullscreen)}
        ${this.toggleSetting("Motion Blur Placeholder", "graphics.motionBlur", settings.graphics.motionBlur)}
        ${this.toggleSetting("Camera Shake", "graphics.cameraShake", settings.graphics.cameraShake)}
      `;
    }

    if (tab === "audio") {
      return `
        ${this.rangeSetting("Master Volume", "audio.masterVolume", settings.audio.masterVolume, 0, 1, 0.05)}
        ${this.rangeSetting("SFX Volume", "audio.sfxVolume", settings.audio.sfxVolume, 0, 1, 0.05)}
        ${this.rangeSetting("Music Volume", "audio.musicVolume", settings.audio.musicVolume, 0, 1, 0.05)}
        ${this.toggleSetting("Mute", "audio.muted", settings.audio.muted)}
      `;
    }

    if (tab === "controls") {
      return `
        <section>
          <h3>Keyboard</h3>
          ${this.keyboardRebind("Forward", "forward")}
          ${this.keyboardRebind("Backward", "backward")}
          ${this.keyboardRebind("Left", "left")}
          ${this.keyboardRebind("Right", "right")}
          ${this.keyboardRebind("Sprint", "sprint")}
          ${this.keyboardRebind("Jump", "jump")}
          ${this.keyboardRebind("Crouch", "crouch")}
          ${this.keyboardRebind("Cover", "cover")}
          ${this.keyboardRebind("Peek Left", "peekLeft")}
          ${this.keyboardRebind("Peek Right", "peekRight")}
          ${this.keyboardRebind("Flashlight", "flashlight")}
          ${this.keyboardRebind("Laser", "laser")}
          ${this.keyboardRebind("Night Vision", "nightVision")}
          ${this.keyboardRebind("Interact", "interact")}
          ${this.keyboardRebind("Reload", "reload")}
          ${this.keyboardRebind("Clear Jam", "clearJam")}
          ${this.keyboardRebind("Shoulder Swap", "shoulderSwap")}
          ${this.keyboardRebind("Medkit", "useMedkit")}
        </section>
        <section>
          <h3>Controller</h3>
          ${this.controllerRebind("Jump", "jump")}
          ${this.controllerRebind("Crouch", "crouch")}
          ${this.controllerRebind("Interact / Extract", "interact")}
          ${this.controllerRebind("ADS", "ads")}
          ${this.controllerRebind("Fire", "fire")}
          ${this.controllerRebind("Peek Left", "peekLeft")}
          ${this.controllerRebind("Peek Right", "peekRight")}
          ${this.controllerRebind("Flashlight", "flashlight")}
          ${this.controllerRebind("Reload", "reload")}
          ${this.controllerRebind("Clear Jam", "clearJam")}
          ${this.controllerRebind("Shoulder Swap", "shoulderSwap")}
          ${this.controllerRebind("Medkit", "useMedkit")}
          ${this.controllerRebind("Swap Weapon", "weaponSwap")}
          ${this.controllerRebind("Sprint", "sprint")}
        </section>
        ${this.toggleSetting("Invert Mouse X", "controls.invertMouseX", settings.controls.invertMouseX)}
        ${this.toggleSetting("Invert Mouse Y", "controls.invertMouseY", settings.controls.invertMouseY)}
        ${this.rangeSetting("Controller Sensitivity", "controls.controllerSensitivity", settings.controls.controllerSensitivity, 0.5, 5, 0.1)}
        ${this.rangeSetting("ADS Controller Multiplier", "controls.adsControllerSensitivityMultiplier", settings.controls.adsControllerSensitivityMultiplier, 0.25, 1, 0.05)}
        ${this.rangeSetting("Left Stick Deadzone", "controls.leftStickDeadzone", settings.controls.leftStickDeadzone, 0, 0.4, 0.01)}
        ${this.rangeSetting("Right Stick Deadzone", "controls.rightStickDeadzone", settings.controls.rightStickDeadzone, 0, 0.4, 0.01)}
        ${this.rangeSetting("Trigger Threshold", "controls.triggerThreshold", settings.controls.triggerThreshold, 0.05, 0.8, 0.01)}
      `;
    }

    return `
      ${this.toggleSetting("Hold ADS", "gameplay.holdAds", settings.gameplay.holdAds)}
      ${this.toggleSetting("Hold Crouch", "gameplay.holdCrouch", settings.gameplay.holdCrouch)}
      ${this.rangeSetting("Crosshair Opacity", "gameplay.crosshairOpacity", settings.gameplay.crosshairOpacity, 0.15, 1, 0.05)}
      ${this.toggleSetting("Hit Markers", "gameplay.hitMarkers", settings.gameplay.hitMarkers)}
      ${this.toggleSetting("Controller Aim Assist", "gameplay.aimAssistEnabled", settings.gameplay.aimAssistEnabled)}
      ${this.rangeSetting("Aim Assist Strength", "gameplay.aimAssistStrength", settings.gameplay.aimAssistStrength, 0, 1, 0.05)}
      ${this.rangeSetting("ADS Aim Assist", "gameplay.adsAimAssistMultiplier", settings.gameplay.adsAimAssistMultiplier, 0, 1, 0.05)}
      ${this.rangeSetting("Hipfire Aim Assist", "gameplay.hipfireAimAssistMultiplier", settings.gameplay.hipfireAimAssistMultiplier, 0, 1, 0.05)}
    `;
  }

  private bindSettingsInputs(tab: SettingsTab): void {
    for (const input of Array.from(this.menu.querySelectorAll<HTMLInputElement | HTMLSelectElement>("[data-setting]"))) {
      input.addEventListener("input", this.handleSettingInput);
      input.addEventListener("change", this.handleSettingInput);
    }

    for (const button of Array.from(this.menu.querySelectorAll<HTMLButtonElement>("[data-key-rebind]"))) {
      button.addEventListener("click", () => {
        const action = button.dataset.keyRebind as KeyboardAction;
        button.textContent = "Press a key... Esc cancels";
        this.input.setInputMode("ui");
        const listener = (event: KeyboardEvent): void => {
          event.preventDefault();
          event.stopPropagation();

          if (event.code === "Escape") {
            window.removeEventListener("keydown", listener, true);
            this.showSettingsMenu(tab);
            return;
          }

          const duplicate = Object.entries(this.settingsManager.snapshot.controls.keyboardBindings)
            .find(([otherAction, codes]) => otherAction !== action && codes.includes(event.code));

          if (duplicate && !window.confirm(`${this.formatKeyCode(event.code)} is already bound to ${this.capitalize(duplicate[0])}. Overwrite anyway?`)) {
            window.removeEventListener("keydown", listener, true);
            this.showSettingsMenu(tab);
            return;
          }

          this.settingsManager.setKeyboardBinding(action, event.code);
          window.removeEventListener("keydown", listener, true);
          this.showSettingsMenu(tab);
        };
        window.addEventListener("keydown", listener, true);
      });
    }

    for (const select of Array.from(this.menu.querySelectorAll<HTMLSelectElement>("[data-controller-rebind]"))) {
      select.addEventListener("change", () => {
        this.settingsManager.setControllerBinding(
          select.dataset.controllerRebind as ControllerAction,
          Number(select.value),
        );
        this.showSettingsMenu(tab);
      });
    }
  }

  private readonly handleSettingInput = (event: Event): void => {
    const input = event.currentTarget as HTMLInputElement | HTMLSelectElement;
    const path = input.dataset.setting;

    if (!path) {
      return;
    }

    const value = input instanceof HTMLInputElement && input.type === "checkbox"
      ? input.checked
      : input instanceof HTMLInputElement && input.type === "range"
        ? Number(input.value)
        : input.value;

    this.settingsManager.setValue(path, value);

    if (path === "graphics.fullscreen") {
      this.applyFullscreen(Boolean(value));
    }

    if (path.startsWith("audio.")) {
      this.applyAudioSettings();
    }

    const valueLabel = input.parentElement?.querySelector("[data-setting-value]");
    if (valueLabel) {
      valueLabel.textContent = this.formatSettingValue(
        path,
        input instanceof HTMLInputElement && input.type === "checkbox"
          ? input.checked
          : value,
      );
    }
  };

  private applyAudioSettings(): void {
    updateCurrentMusicVolume();
    this.shipAudio.applySettings();
  }

  private rangeSetting(
    label: string,
    path: string,
    value: number,
    min: number,
    max: number,
    step: number,
  ): string {
    return `
      <label class="settings-row">
        <span>${label}</span>
        <input type="range" min="${min}" max="${max}" step="${step}" value="${value}" data-setting="${path}">
        <strong data-setting-value>${this.formatSettingValue(path, value)}</strong>
      </label>
    `;
  }

  private toggleSetting(label: string, path: string, value: boolean): string {
    return `
      <label class="settings-row">
        <span>${label}</span>
        <input type="checkbox" ${value ? "checked" : ""} data-setting="${path}">
        <strong data-setting-value>${this.formatSettingValue(path, value)}</strong>
      </label>
    `;
  }

  private selectSetting(label: string, path: string, value: string, options: string[]): string {
    const optionHtml = options
      .map((option) => `<option value="${option}" ${option === value ? "selected" : ""}>${this.capitalize(option)}</option>`)
      .join("");

    return `
      <label class="settings-row">
        <span>${label}</span>
        <select data-setting="${path}">${optionHtml}</select>
        <strong data-setting-value>${this.capitalize(value)}</strong>
      </label>
    `;
  }

  private formatSettingValue(path: string, value: string | number | boolean): string {
    if (typeof value === "boolean") {
      return value ? "On" : "Off";
    }

    if (path.startsWith("audio.") && typeof value === "number") {
      return `${Math.round(value * 100)}%`;
    }

    return typeof value === "number" ? String(Number(value.toFixed(2))) : this.capitalize(value);
  }

  private keyboardRebind(label: string, action: KeyboardAction): string {
    const binding = this.settingsManager.snapshot.controls.keyboardBindings[action][0] ?? "Unbound";

    return `
      <div class="settings-row">
        <span>${label}</span>
        <button type="button" data-key-rebind="${action}">${this.formatKeyCode(binding)}</button>
      </div>
    `;
  }

  private controllerRebind(label: string, action: ControllerAction): string {
    const current = this.settingsManager.snapshot.controls.controllerBindings[action];
    const options = Object.entries(controllerButtonLabels)
      .map(([button, name]) => `<option value="${button}" ${Number(button) === current ? "selected" : ""}>${name}</option>`)
      .join("");

    return `
      <label class="settings-row">
        <span>${label}</span>
        <select data-controller-rebind="${action}">${options}</select>
      </label>
    `;
  }

  private applyFullscreen(enabled: boolean): void {
    if (enabled && !document.fullscreenElement) {
      void document.documentElement.requestFullscreen();
    } else if (!enabled && document.fullscreenElement) {
      void document.exitFullscreen();
    }
  }

  private formatKeyCode(code: string): string {
    return code
      .replace(/^Key/, "")
      .replace(/^Digit/, "")
      .replace("Space", "Space")
      .replace("ShiftLeft", "Left Shift")
      .replace("ShiftRight", "Right Shift")
      .replace("Arrow", "");
  }

  private capitalize(value: string): string {
    return value.charAt(0).toUpperCase() + value.slice(1);
  }

  private isPurchaseLikeAction(action: string | undefined): boolean {
    return action === "workbench-upgrade" ||
      action === "craft-repair-armor" ||
      action === "vendor-convert-common" ||
      action === "vendor-sell-all-junk" ||
      action?.startsWith("inspect-repair-") === true ||
      action?.startsWith("inspect-upgrade-") === true ||
      action?.startsWith("craft-") === true ||
      action?.startsWith("vendor-buy-") === true ||
      action?.startsWith("vendor-sell-") === true ||
      action?.startsWith("vendor-repair-") === true;
  }

  private shouldKeepRunnerPreviewForMenuAction(action: string | undefined): boolean {
    return action === "menu" ||
      action === "start" ||
      action === "multiplayer-start" ||
      action === "hq-loadout" ||
      action === "loadout" ||
      action === "hq-style" ||
      action === "class-assignment" ||
      action === "class-confirm-assignment" ||
      action === "class-review-loadout" ||
      action?.startsWith("launch-raid-") === true ||
      action?.startsWith("class-select-") === true ||
      action?.startsWith("loadout-tab-") === true ||
      action?.startsWith("cosmetic-category-") === true ||
      action?.startsWith("cosmetic-equip-") === true ||
      action === "cosmetic-preview-left" ||
      action === "cosmetic-preview-right" ||
      action === "cosmetics-apply" ||
      action === "cosmetics-randomize" ||
      action === "cosmetics-favorite" ||
      action === "cosmetics-reset";
  }

  private consumePurchaseActionClick(): boolean {
    const now = performance.now();

    if (now < this.purchaseActionCooldownUntil) {
      return false;
    }

    this.purchaseActionCooldownUntil = now + 350;
    return true;
  }

  private requiresRareSellConfirmation(type: LootType): boolean {
    const rarity = getItemDefinition(type).rarity;
    return rarity === "rare" || rarity === "epic" || rarity === "legendary" || rarity === "core";
  }

  private requiresDropConfirmation(type: LootType): boolean {
    return this.requiresRareSellConfirmation(type) || this.isContractCriticalLoot(type);
  }

  private isContractCriticalLoot(type: LootType): boolean {
    const active = this.contractManager.snapshot.active;

    if (!active) {
      return type === "encrypted-data" || type === "target-token";
    }

    return active.definition.target.lootType === type ||
      type === "encrypted-data" ||
      type === "target-token" ||
      type === "rare-core" ||
      type === "dog-tag";
  }

  private isEquippedItemType(type: LootType): boolean {
    const manager = this.loadoutManager.snapshot;
    const loadout = this.loadout.snapshot;
    const primaryType = loadout.primaryWeaponId ? weaponLootTypes[loadout.primaryWeaponId] : null;
    const attachmentId = attachmentIdFromLootType(type);

    return type === manager.armorType ||
      type === manager.backpackType ||
      type === manager.tacticalToolType ||
      type === manager.consumable1Type ||
      type === manager.consumable2Type ||
      type === primaryType ||
      type === weaponLootTypes[loadout.sidearmWeaponId] ||
      (attachmentId !== null && Object.values(loadout.attachments).includes(attachmentId));
  }

  private sellAllJunkToCurrentVendor(): number {
    const vendor = this.vendorManager.selectedVendor;
    const sellable = this.persistentStash.items
      .filter((item) => item.quantity > 0 && vendor.buys.includes(item.type))
      .filter((item) => !this.isEquippedItemType(item.type))
      .filter((item) => {
        const definition = getItemDefinition(item.type);
        return definition.category === "material" && (definition.rarity === "common" || definition.rarity === "uncommon");
      });
    let sold = 0;

    for (const item of sellable) {
      for (let i = 0; i < item.quantity; i += 1) {
        const result = this.vendorManager.sell(item.type, (lootType, quantity) => this.persistentStash.remove(lootType, quantity));

        if (!result.ok) {
          break;
        }

        sold += 1;
      }
    }

    return sold;
  }

  private createMenu(): HTMLDivElement {
    const menu = document.createElement("div");
    menu.className = "main-menu";
    menu.innerHTML = `<div class="main-menu-content"></div>`;
    document.body.append(menu);
    return menu;
  }

  private bindMenuButtons(): void {
    this.animateMenuTransition();
    for (const button of Array.from(this.menu.querySelectorAll("button[data-action]"))) {
      button.addEventListener("click", this.handleMenuClick);
    }

    const stashSearch = this.menu.querySelector<HTMLInputElement>("[data-stash-search]");
    stashSearch?.addEventListener("input", () => {
      this.stashSearch = stashSearch.value;
      this.showStashMenu();
    });
  }

  private animateMenuTransition(): void {
    if (this.menu.classList.contains("hidden")) {
      return;
    }

    this.menuContent.classList.remove("screen-transition-in");
    void this.menuContent.offsetWidth;
    this.menuContent.classList.add("screen-transition-in");
    window.setTimeout(() => this.menuContent.classList.remove("screen-transition-in"), 260);
  }

  private readonly handleMenuClick = (event: Event): void => {
    const button = event.currentTarget as HTMLButtonElement;
    const action = button.dataset.action;
    if (action !== "debug-grant-resources" && action !== "debug-reset-save") {
      if (!this.shouldKeepRunnerPreviewForMenuAction(action)) {
        this.habitatPreview.detach("menu-action");
      }
      this.shipDashboardPreview.detach("menu-action");
      if (!this.shouldKeepWeaponPreviewForMenuAction(action)) {
        this.weaponBenchPreview.dispose();
      }
    }
    this.sfxAudio.playEvent(action === "start" || action === "multiplayer-start" || action?.startsWith("launch-raid-") || action?.startsWith("class-deploy-")
      ? "ui.deploy"
      : action === "settings" ? "ui.play" : "ui.nav");
    this.menuContent.classList.remove("hq-command-content", "class-deploy-content", "ship-dashboard-content", "arsenal-workbench-content");

    if (this.isPurchaseLikeAction(action) && !this.consumePurchaseActionClick()) {
      return;
    }

    if (action === "start") {
      this.hqManager.open("raid-terminal");
      this.showPreDeploymentClassMenu("solo");
    } else if (action === "multiplayer-start") {
      this.hqManager.open("raid-terminal");
      this.showPreDeploymentClassMenu("multiplayer");
    } else if (action?.startsWith("launch-raid-")) {
      const raidId = action.replace("launch-raid-", "") as RaidTierId;
      this.selectedRaidDefinition = raidDefinitionById[raidId] ?? defaultRaidDefinition;
      this.showPreDeploymentClassMenu("solo");
    } else if (action === "class-deploy-solo") {
      this.startRaid(false);
    } else if (action === "class-deploy-multiplayer") {
      void this.startMultiplayerRaid();
    } else if (action === "multiplayer-retry") {
      void this.startMultiplayerRaid();
    } else if (action === "multiplayer-copy-diagnostics") {
      this.copyMultiplayerDiagnostics();
    } else if (action === "raid-select") {
      this.hqManager.open("raid-terminal");
      this.showRaidSelectMenu();
    } else if (action === "noop") {
      return;
    } else if (action === "hq-loadout") {
      this.hqManager.open("loadout-locker");
      this.loadoutTab = "gear";
      this.showLoadoutMenu();
    } else if (action === "hq-inspect-primary") {
      const weaponId = this.loadout.snapshot.primaryWeaponId;
      if (weaponId) {
        this.inspectedWeaponId = weaponId;
        this.loadoutManager.select(weaponLootTypes[weaponId]);
        this.showInspectWeaponMenu("habitat");
      } else {
        this.combatHud.showLootNotification("No primary weapon equipped");
      }
    } else if (action === "hq-inspect-sidearm") {
      const weaponId = this.loadout.snapshot.sidearmWeaponId;
      this.inspectedWeaponId = weaponId;
      this.loadoutManager.select(weaponLootTypes[weaponId]);
      this.showInspectWeaponMenu("habitat");
    } else if (action === "hq-style") {
      this.hqManager.open("style-locker");
      this.loadoutTab = "cosmetics";
      this.loadingScreen.flash("Opening Class Cosmetics");
      this.showLoadoutMenu();
    } else if (action === "ship-systems") {
      this.hqManager.open("ship-systems");
      this.showShipSystemsMenu();
    } else if (action === "arsenal") {
      this.showArsenalMenu();
    } else if (action === "class-assignment") {
      this.hqManager.open("class-assignment");
      this.showClassAssignmentMenu();
    } else if (action?.startsWith("class-select-")) {
      const classId = action.replace("class-select-", "") as ClassId;
      this.combatHud.showLootNotification(this.classManager.select(classId));
      this.cosmeticManager.setActiveClass(classId);
      this.applyCurrentCosmetics();
      this.showPreDeploymentClassMenu(this.preDeploymentMode);
    } else if (action === "class-confirm-assignment") {
      this.combatHud.showLootNotification(`${this.classManager.selectedClass.displayName} assignment confirmed`);
      this.showMainMenu();
    } else if (action === "class-review-loadout") {
      this.hqManager.open("loadout-locker");
      this.loadoutTab = "gear";
      this.showLoadoutMenu();
    } else if (action === "skill-matrix") {
      this.hqManager.open("skill-matrix");
      this.showSkillMatrixMenu();
    } else if (action?.startsWith("skill-acquire-")) {
      const nodeId = action.replace("skill-acquire-", "") as SkillNodeId;
      this.combatHud.showLootNotification(this.skillManager.acquire(nodeId));
      this.showSkillMatrixMenu();
    } else if (action === "ship-upgrade-cargo") {
      const result = this.shipModuleManager.upgradeCargoModule((cost) => this.spendPersistentMaterials(cost));
      this.shipState = this.shipManager.setModuleManager(this.shipModuleManager);
      this.combatHud.showLootNotification(result.message);
      this.showShipSystemsMenu();
    } else if (action === "intel") {
      this.hqManager.open("intel-board");
      this.showIntelMenu();
    } else if (action?.startsWith("contract-activate-")) {
      this.combatHud.showLootNotification(this.contractManager.activate(action.replace("contract-activate-", "")));
      this.showIntelMenu();
    } else if (action?.startsWith("contract-filter-")) {
      this.contractUiFilter = action.replace("contract-filter-", "") as ContractUiFilter;
      this.showIntelMenu();
    } else if (action === "contract-abandon") {
      if (window.confirm("Abandon active contract?")) {
        this.combatHud.showLootNotification(this.contractManager.abandonActive());
      }
      this.showIntelMenu();
    } else if (action === "contract-refresh") {
      this.contractManager.refreshContracts();
      this.combatHud.showLootNotification("Contracts refreshed");
      this.showIntelMenu();
    } else if (action === "contract-submit") {
      const message = this.contractManager.submitActiveContract();
      const rewards = this.contractManager.consumeRewards();

      for (const grant of rewards) {
        this.grantContractRewardImmediately(grant);
      }

      this.flushContractMessages();
      this.combatHud.showLootNotification(rewards.length > 0 ? "Reward claimed" : message);
      this.showIntelMenu();
    } else if (action === "loadout") {
      this.showLoadoutMenu();
    } else if (action === "vendors") {
      this.hqManager.open("vendor-row");
      this.showVendorMenu();
    } else if (action === "inspect") {
      this.showInspectWeaponMenu();
    } else if (action === "workbench") {
      this.hqManager.open("workshop");
      this.refreshWorkbenchMenuPreservingState();
    } else if (action === "workbench-upgrade") {
      const nextLevel = this.craftingManager.nextWorkbenchLevel;

      if (!nextLevel) {
        this.combatHud.showLootNotification("Fabrication Bench is already max level");
      } else {
        const previousScrapSpent = this.craftingManager.snapshot.scrapSpent;
        const result = this.craftingManager.upgradeWorkbench(
          (quantity) => this.persistentStash.remove("scrap", quantity),
        );
        this.recordPrepScrapSpend(previousScrapSpent);
        this.combatHud.showLootNotification(result.ok ? "Fabrication Bench upgraded" : "Not enough Regolith Scrap");
      }
      this.refreshWorkbenchMenuPreservingState();
    } else if (action?.startsWith("craft-repair-weapon-")) {
      const weaponId = action.replace("craft-repair-weapon-", "") as WeaponId;
      const cost = this.weaponController.getFullRepairCost(weaponId);

      if (cost <= 0) {
        this.combatHud.showLootNotification(`${this.capitalize(weaponId)} is already fully repaired`);
      } else {
        const previousScrapSpent = this.craftingManager.snapshot.scrapSpent;
        const result = this.weaponController.repairWeaponFully(
          weaponId,
          (quantity) => this.persistentStash.remove("scrap", quantity),
        );
        if (result.repaired) {
          this.craftingManager.recordWeaponRepair(result.scrapCost, result.message);
          this.recordPrepScrapSpend(previousScrapSpent);
        }
        this.combatHud.showLootNotification(result.repaired ? "Repaired" : "Not enough Regolith Scrap");
      }
      this.refreshWorkbenchMenuPreservingState();
    } else if (action === "craft-repair-armor") {
      const cost = this.craftingManager.getArmorRepairCost();

      if (cost <= 0) {
        this.combatHud.showLootNotification("Armor is already fully repaired");
      } else {
        const previousScrapSpent = this.craftingManager.snapshot.scrapSpent;
        const result = this.craftingManager.repairArmor((quantity) => this.persistentStash.remove("scrap", quantity));
        this.recordPrepScrapSpend(previousScrapSpent);
        this.combatHud.showLootNotification(result.ok ? "Repaired" : "Not enough Regolith Scrap");
      }
      this.refreshWorkbenchMenuPreservingState();
    } else if (action?.startsWith("craft-upgrade-")) {
      const upgradeId = action.replace("craft-upgrade-", "") as CraftingUpgradeId;
      const upgrade = this.craftingManager.getUpgrade(upgradeId);

      if (upgrade) {
        const previousScrapSpent = this.craftingManager.snapshot.scrapSpent;
        const result = this.craftingManager.unlockUpgrade(
          upgradeId,
          (quantity) => this.persistentStash.remove("scrap", quantity),
        );
        this.recordPrepScrapSpend(previousScrapSpent);
        this.combatHud.showLootNotification(result.ok ? "Upgrade unlocked" : "Not enough Regolith Scrap");
      }
      this.refreshWorkbenchMenuPreservingState();
    } else if (action?.startsWith("craft-")) {
      const recipeId = action.replace("craft-", "") as CraftingRecipeId;
      const recipe = this.craftingManager.getRecipe(recipeId);

      if (recipe) {
        const previousScrapSpent = this.craftingManager.snapshot.scrapSpent;
        const result = this.craftingManager.craft(
          recipeId,
          (quantity) => this.persistentStash.remove("scrap", quantity),
          (items) => this.persistentStash.addItems(items),
          (type, quantity) => this.persistentStash.remove(type, quantity),
          (type) => this.getStashQuantity(type),
        );
        this.recordPrepScrapSpend(previousScrapSpent);
        this.combatHud.showLootNotification(result.message);
        console.info(`[Crafting] recipe=${recipeId} ok=${result.ok} reason=${result.message}`);
      }
      this.refreshWorkbenchMenuPreservingState();
    } else if (action === "stash") {
      this.hqManager.open("stash");
      this.showStashMenu();
    } else if (action?.startsWith("stash-filter-")) {
      this.stashFilter = action.replace("stash-filter-", "") as StashFilter;
      this.selectedStashType = null;
      this.showStashMenu();
    } else if (action?.startsWith("stash-sort-")) {
      this.stashSort = action.replace("stash-sort-", "") as StashSort;
      this.showStashMenu();
    } else if (action?.startsWith("stash-select-")) {
      this.selectedStashType = action.replace("stash-select-", "") as LootType;
      this.showStashMenu();
    } else if (action === "stash-inspect-selected") {
      const weaponId = this.selectedStashType ? weaponIdFromLootType(this.selectedStashType) : null;
      if (weaponId) {
        this.inspectedWeaponId = weaponId;
        this.showInspectWeaponMenu();
      } else {
        this.combatHud.showLootNotification("Only weapons open in Inspect for now");
        this.showStashMenu();
      }
    } else if (action === "stash-loadout-selected") {
      if (this.selectedStashType) {
        this.handleStashMoveToLoadout(this.selectedStashType);
      }
      this.showStashMenu();
    } else if (action === "stash-sell-selected") {
      const type = this.selectedStashType;
      if (type && this.isEquippedItemType(type)) {
        this.combatHud.showLootNotification("Cannot sell equipped item");
      } else if (type && (!this.requiresRareSellConfirmation(type) || window.confirm(`Sell one ${getItemDefinition(type).label}?`))) {
        const result = this.vendorManager.sell(type, (lootType, quantity) => this.persistentStash.remove(lootType, quantity));
        this.combatHud.showLootNotification(result.ok ? "Sold" : result.message);
      }
      this.showStashMenu();
    } else if (action === "stash-favorite-selected") {
      this.combatHud.showLootNotification("Favorite saved placeholder");
      this.showStashMenu();
    } else if (action === "stash-discard-selected") {
      const type = this.selectedStashType;
      if (type && (!this.requiresDropConfirmation(type) || window.confirm(`Discard one ${getItemDefinition(type).label}?`))) {
        this.combatHud.showLootNotification(this.persistentStash.remove(type, 1) ? "Discarded" : "Nothing to discard");
      }
      this.showStashMenu();
    } else if (action === "settings") {
      this.showSettingsMenu();
    } else if (action?.startsWith("settings-tab-")) {
      this.showSettingsMenu(action.replace("settings-tab-", "") as SettingsTab);
    } else if (action === "settings-reset") {
      this.settingsManager.resetToDefaults();
      this.applyAudioSettings();
      this.showSettingsMenu();
    } else if (action === "debug-reset-save") {
      if (window.confirm("Reset all local DARK CRATERS prototype save data and reload?")) {
        this.resetPrototypeSaveData();
      }
    } else if (action === "debug-grant-resources") {
      this.grantDebugResources();
      this.combatHud.showLootNotification("Debug resources granted");
      this.showMainMenu();
    } else if (action?.startsWith("vendor-select-")) {
      this.vendorManager.setVendor(action.replace("vendor-select-", "") as VendorId);
      this.showVendorMenu();
    } else if (action?.startsWith("vendor-tab-")) {
      this.vendorManager.setTab(action.replace("vendor-tab-", "") as VendorTab);
      this.showVendorMenu();
    } else if (action?.startsWith("vendor-buy-")) {
      const type = action.replace("vendor-buy-", "") as LootType;
      const result = this.vendorManager.buy(type, (items) => this.persistentStash.addItems(items));
      this.combatHud.showLootNotification(result.ok ? "Purchased" : result.message);
      this.showVendorMenu();
    } else if (action === "vendor-sell-all-junk") {
      const soldCount = this.sellAllJunkToCurrentVendor();
      this.combatHud.showLootNotification(soldCount > 0 ? `Sold ${soldCount} junk item${soldCount === 1 ? "" : "s"}` : "No junk to sell");
      this.showVendorMenu();
    } else if (action?.startsWith("vendor-sell-")) {
      const type = action.replace("vendor-sell-", "") as LootType;
      if (this.isEquippedItemType(type)) {
        this.combatHud.showLootNotification("Cannot sell equipped item");
      } else if (!this.requiresRareSellConfirmation(type) || window.confirm(`Sell one ${getItemDefinition(type).label}?`)) {
        const result = this.vendorManager.sell(type, (lootType, quantity) => this.persistentStash.remove(lootType, quantity));
        if (result.ok) {
          this.contractManager.record({
            type: "vendor-turn-in",
            vendorId: this.vendorManager.snapshot.selectedVendorId,
            lootType: type,
            quantity: 1,
          });
          this.flushContractMessages();
        }
        this.combatHud.showLootNotification(result.ok ? "Sold" : result.message);
      }
      this.showVendorMenu();
    } else if (action?.startsWith("vendor-repair-")) {
      const weaponId = action.replace("vendor-repair-", "") as WeaponId;
      const cost = this.vendorManager.repairCost(this.weaponController.getDurabilityState(weaponId).durability);
      if (cost <= 0) {
        this.combatHud.showLootNotification("Weapon is already serviceable");
      } else {
        if (this.vendorManager.spendCredits(cost)) {
          this.weaponController.repairWeapon(weaponId, () => true);
          this.combatHud.showLootNotification("Repaired");
        } else {
          this.combatHud.showLootNotification("Not enough credits");
        }
      }
      this.showVendorMenu();
    } else if (action === "vendor-convert-common") {
      const result = this.vendorManager.convertCommonToScrap(
        this.persistentStash.items,
        (type, quantity) => this.persistentStash.remove(type, quantity),
        (items) => this.persistentStash.addItems(items),
      );
      this.combatHud.showLootNotification(result.message);
      this.showVendorMenu();
    } else if (action === "loadout-tab-gear") {
      this.loadoutTab = "gear";
      this.loadoutStashCompatibilityOpen = false;
      this.showLoadoutMenu();
    } else if (action === "loadout-tab-cosmetics") {
      this.loadoutTab = "cosmetics";
      this.loadoutStashCompatibilityOpen = false;
      this.loadingScreen.flash("Opening Class Cosmetics");
      this.showLoadoutMenu();
    } else if (action?.startsWith("cosmetic-category-")) {
      this.cosmeticManager.setCategory(action.replace("cosmetic-category-", "") as CosmeticCategory);
      this.showLoadoutMenu();
    } else if (action?.startsWith("cosmetic-equip-")) {
      const message = this.cosmeticManager.equip(action.replace("cosmetic-equip-", "") as CosmeticId);
      this.applyCurrentCosmetics();
      this.combatHud.showLootNotification(message);
      this.showLoadoutMenu();
    } else if (action === "cosmetic-preview-left") {
      this.cosmeticManager.rotatePreview(-30);
      this.showLoadoutMenu();
    } else if (action === "cosmetic-preview-right") {
      this.cosmeticManager.rotatePreview(30);
      this.showLoadoutMenu();
    } else if (action === "cosmetics-apply") {
      this.applyCurrentCosmetics();
      this.combatHud.showLootNotification("Cosmetics saved");
      this.showLoadoutMenu();
    } else if (action === "cosmetics-randomize") {
      this.combatHud.showLootNotification(this.cosmeticManager.randomizeUnlocked());
      this.applyCurrentCosmetics();
      this.showLoadoutMenu();
    } else if (action === "cosmetics-favorite") {
      this.combatHud.showLootNotification("Favorite saved placeholder");
      this.showLoadoutMenu();
    } else if (action === "cosmetics-reset") {
      this.cosmeticManager.resetToDefault();
      this.applyCurrentCosmetics();
      this.combatHud.showLootNotification("Cosmetics reset");
      this.showLoadoutMenu();
    } else if (action?.startsWith("inspect-select-")) {
      this.inspectedWeaponId = action.replace("inspect-select-", "") as WeaponId;
      this.showInspectWeaponMenu(this.inspectWeaponContext);
    } else if (action?.startsWith("inspect-equip-primary-")) {
      const weaponId = action.replace("inspect-equip-primary-", "") as WeaponId;
      this.inspectedWeaponId = weaponId;
      if (weaponId === "pistol" || weaponId === "burst-pistol" || weaponId === "revolver" || weaponId === "compact-smg") {
        this.loadout.equipSidearm(weaponId);
        this.loadoutManager.captureFromLoadout(this.loadout);
        this.combatHud.showLootNotification(`${weaponDefinitions[weaponId].name} equipped as sidearm`);
      } else if (weaponId === "knife") {
        this.loadout.equipMelee(weaponId);
        this.loadoutManager.captureFromLoadout(this.loadout);
        this.combatHud.showLootNotification("Suit Knife equipped");
      } else if (!this.weaponExistsForInspect(weaponId)) {
        console.warn(`InspectWeapon: cannot equip missing weapon "${weaponId}".`);
        this.combatHud.showLootNotification("Weapon unavailable");
      } else {
        this.loadout.equipPrimary(weaponId);
        this.loadoutManager.captureFromLoadout(this.loadout);
        this.combatHud.showLootNotification(`${weaponDefinitions[weaponId].name} equipped`);
      }
      this.showInspectWeaponMenu();
    } else if (action?.startsWith("inspect-unequip-")) {
      const weaponId = action.replace("inspect-unequip-", "") as WeaponId;
      this.inspectedWeaponId = weaponId;
      if (this.loadout.snapshot.primaryWeaponId === weaponId) {
        this.loadout.clearPrimary();
        this.loadoutManager.captureFromLoadout(this.loadout);
        this.combatHud.showLootNotification(`${weaponDefinitions[weaponId].name} unequipped`);
      } else if (this.loadout.snapshot.meleeWeaponId === weaponId) {
        this.loadout.equipMelee(null);
        this.loadoutManager.captureFromLoadout(this.loadout);
        this.combatHud.showLootNotification("Melee slot cleared");
      } else if (this.loadout.snapshot.sidearmWeaponId === weaponId && weaponId !== "pistol") {
        this.loadout.equipSidearm("pistol");
        this.loadoutManager.captureFromLoadout(this.loadout);
        this.combatHud.showLootNotification("Sidearm reset to starter pistol");
      } else {
        this.combatHud.showLootNotification("Starter sidearm cannot be unequipped");
      }
      this.showInspectWeaponMenu();
    } else if (action?.startsWith("inspect-repair-kit-")) {
      const weaponId = action.replace("inspect-repair-kit-", "") as WeaponId;
      this.inspectedWeaponId = weaponId;
      const currentCondition = this.weaponController.getDurabilityState(weaponId).durability;
      if (this.weaponController.getFullRepairCost(weaponId) <= 0) {
        console.info(`[Workbench] repair weapon=${weaponId} ok=false reason=full-condition condition=${Math.round(currentCondition)} materials=weapon-repair-kit:not-needed`);
        this.combatHud.showLootNotification("Weapon already at full condition.");
        this.refreshInspectWeaponMenuPreservingScroll();
        return;
      }

      if (this.getStashQuantity("weapon-repair-kit") <= 0) {
        console.info(`[Workbench] repair weapon=${weaponId} ok=false reason=missing-weapon-repair-kit condition=${Math.round(currentCondition)} materials=weapon-repair-kit:0/1`);
        this.combatHud.showLootNotification("Repair kit required.");
        this.refreshInspectWeaponMenuPreservingScroll();
        return;
      }

      if (!this.consumeBenchMaterials([{ type: "weapon-repair-kit", quantity: 1 }])) {
        console.info(`[Workbench] repair weapon=${weaponId} ok=false reason=consume-failed condition=${Math.round(currentCondition)} materials=weapon-repair-kit:0/1`);
        this.combatHud.showLootNotification("Repair kit required.");
        this.refreshInspectWeaponMenuPreservingScroll();
        return;
      }

      const result = this.weaponController.repairWeaponFullyWithKit(weaponId);
      if (result.repaired) {
        this.craftingManager.recordWeaponRepair(0, result.message);
        console.info(`[Workbench] repair weapon=${weaponId} ok=true reason=kit condition=${Math.round(currentCondition)}->100 materials=weapon-repair-kit:1`);
      } else {
        this.persistentStash.addItems([{ type: "weapon-repair-kit", label: getItemDefinition("weapon-repair-kit").label, quantity: 1 }]);
        console.info(`[Workbench] repair weapon=${weaponId} ok=false reason=not-needed condition=${Math.round(currentCondition)} materials=weapon-repair-kit:refunded`);
      }
      this.combatHud.showLootNotification(result.repaired ? "Repair complete: condition restored to 100%." : result.message);
      this.refreshInspectWeaponMenuPreservingScroll();
    } else if (action?.startsWith("inspect-repair-")) {
      const weaponId = action.replace("inspect-repair-", "") as WeaponId;
      this.inspectedWeaponId = weaponId;
      const previousScrapSpent = this.craftingManager.snapshot.scrapSpent;
      const currentCondition = this.weaponController.getDurabilityState(weaponId).durability;
      const repairCost = this.weaponController.getFullRepairCost(weaponId);
      if (repairCost <= 0) {
        console.info(`[Workbench] repair weapon=${weaponId} ok=false reason=full-condition condition=${Math.round(currentCondition)} materials=scrap:not-needed`);
        this.combatHud.showLootNotification("Weapon already at full condition.");
        this.refreshInspectWeaponMenuPreservingScroll();
        return;
      }
      const result = this.weaponController.repairWeaponFully(
        weaponId,
        (quantity) => this.persistentStash.remove("scrap", quantity),
      );
      if (result.repaired) {
        this.craftingManager.recordWeaponRepair(result.scrapCost, result.message);
        this.recordPrepScrapSpend(previousScrapSpent);
      }
      console.info(`[Workbench] repair weapon=${weaponId} ok=${result.repaired} reason=${result.repaired ? "scrap" : result.message.replace(/\s+/g, "-").toLowerCase()} condition=${Math.round(currentCondition)} materials=scrap:${result.scrapCost}/${repairCost}`);
      this.combatHud.showLootNotification(result.repaired ? "Repair complete: condition restored to 100%." : "Not enough scrap for repair.");
      this.refreshInspectWeaponMenuPreservingScroll();
    } else if (action?.startsWith("inspect-upgrade-")) {
      const category = action.replace("inspect-upgrade-", "") as WeaponUpgradeCategory;
      this.combatHud.showLootNotification(this.upgradeInspectedWeapon(category));
      this.refreshInspectWeaponMenuPreservingScroll();
    } else if (action?.startsWith("inspect-attachment-cycle-")) {
      const slot = action.replace("inspect-attachment-cycle-", "") as AttachmentSlot;
      this.loadout.cycleAttachment(slot, this.persistentStash.items);
      this.loadoutManager.captureFromLoadout(this.loadout);
      this.combatHud.showLootNotification(`${this.formatSlotName(slot)} attachment updated`);
      this.refreshInspectWeaponMenuPreservingScroll();
    } else if (action?.startsWith("inspect-attachment-clear-")) {
      const slot = action.replace("inspect-attachment-clear-", "") as AttachmentSlot;
      this.loadout.clearAttachment(slot);
      this.loadoutManager.captureFromLoadout(this.loadout);
      this.combatHud.showLootNotification(`${this.formatSlotName(slot)} cleared`);
      this.refreshInspectWeaponMenuPreservingScroll();
    } else if (action?.startsWith("loadout-filter-")) {
      this.loadoutManager.setFilter(action.replace("loadout-filter-", "") as LoadoutFilter);
      this.showLoadoutMenu();
    } else if (action === "loadout-stash-compat-open") {
      this.loadoutStashCompatibilityOpen = true;
      this.showLoadoutMenu();
    } else if (action === "loadout-stash-compat-close") {
      this.loadoutStashCompatibilityOpen = false;
      this.showLoadoutMenu();
    } else if (action?.startsWith("loadout-slot-")) {
      const slot = action.replace("loadout-slot-", "") as EquipmentSlot;
      this.selectedLoadoutSlot = slot;
      const type = this.getLoadoutSlotLootType(slot, this.loadout.snapshot, this.loadoutManager.snapshot);
      if (type) {
        this.loadoutManager.select(type);
      }
      this.showLoadoutMenu();
    } else if (action?.startsWith("loadout-select-")) {
      const type = action.replace("loadout-select-", "") as LootType;
      this.loadoutManager.select(type);
      console.info(`[LoadoutCompatibility] selected item=${type} category=${getItemDefinition(type).category} role=${getItemUseProfile(type).roles.join("/")}`);
      this.showLoadoutMenu();
    } else if (action === "loadout-equip-selected") {
      this.combatHud.showLootNotification(this.loadoutManager.equipSelected(this.loadout, this.persistentStash.items));
      this.showLoadoutMenu();
    } else if (action === "loadout-compat-equip-selected") {
      this.handleLoadoutCompatibilityEquip();
    } else if (action === "loadout-inspect-selected") {
      const selectedType = this.loadoutManager.snapshot.selectedType;
      const weaponId = selectedType ? weaponIdFromLootType(selectedType) : null;
      if (weaponId && this.weaponExistsForInspect(weaponId)) {
        console.info(`[LoadoutCompatibility] action=inspect item=${selectedType} reason=accepted`);
        this.inspectedWeaponId = weaponId;
        this.showInspectWeaponMenu("inspect");
      } else {
        if (selectedType) {
          console.info(`[LoadoutCompatibility] action=blocked item=${selectedType} reason=inspect-weapons-only`);
        }
        this.combatHud.showLootNotification("Select an equipped weapon to inspect");
        this.showLoadoutMenu();
      }
    } else if (action === "loadout-bag-selected") {
      const selectedType = this.loadoutManager.snapshot.selectedType;
      if (!selectedType) {
        this.combatHud.showLootNotification("Select an item first");
        this.showLoadoutMenu();
        return;
      }
      const packBlock = this.getCompatibilityPackBlockReason(
        selectedType,
        this.loadoutManager.availableQuantity(this.persistentStash.items, selectedType),
      );
      if (packBlock) {
        console.info(`[LoadoutCompatibility] blocked item=${selectedType} reason=${this.toLogToken(packBlock)}`);
        this.combatHud.showLootNotification(packBlock);
        this.showLoadoutMenu();
        return;
      }
      this.combatHud.showLootNotification(this.loadoutManager.moveSelectedToRaidBag(this.persistentStash.items));
      this.loadoutManager.applyToLoadout(this.loadout, this.persistentStash.items);
      console.info(`[LoadoutCompatibility] action=pack item=${selectedType} result=accepted to=eva`);
      console.info(`[LoadoutCompatibility] moved item=${selectedType} from=stash to=eva quantity=1`);
      this.showLoadoutMenu();
    } else if (action === "loadout-compat-pack-selected") {
      this.handleLoadoutCompatibilityPack();
    } else if (action === "loadout-discard-selected") {
      const selectedType = this.loadoutManager.snapshot.selectedType;
      if (selectedType && window.confirm(`Discard one ${getItemDefinition(selectedType).label}?`)) {
        this.combatHud.showLootNotification(this.persistentStash.remove(selectedType, 1) ? "Item discarded" : "Nothing to discard");
      }
      this.showLoadoutMenu();
    } else if (action?.startsWith("loadout-remove-bag-")) {
      this.combatHud.showLootNotification(this.loadoutManager.removeFromRaidBag(action.replace("loadout-remove-bag-", "") as LootType));
      this.loadoutManager.applyToLoadout(this.loadout, this.persistentStash.items);
      this.showLoadoutMenu();
    } else if (action?.startsWith("loadout-unequip-")) {
      this.combatHud.showLootNotification(this.loadoutManager.unequip(
        action.replace("loadout-unequip-", "") as EquipmentSlot,
        this.loadout,
        this.persistentStash.items,
      ));
      this.showLoadoutMenu();
    } else if (action === "medkit-plus") {
      this.loadout.addMedkit(this.persistentStash.items);
      this.showLoadoutMenu();
    } else if (action === "medkit-minus") {
      this.loadout.removeMedkit();
      this.showLoadoutMenu();
    } else if (action === "ammo-plus") {
      this.loadout.addAmmoMag(this.persistentStash.items);
      this.showLoadoutMenu();
    } else if (action === "ammo-minus") {
      this.loadout.removeAmmoMag();
      this.showLoadoutMenu();
    } else if (action === "primary-cycle") {
      this.loadout.cyclePrimary(this.persistentStash.items);
      this.loadoutManager.captureFromLoadout(this.loadout);
      this.showLoadoutMenu();
    } else if (action === "primary-clear") {
      this.loadout.clearPrimary();
      this.loadoutManager.captureFromLoadout(this.loadout);
      this.showLoadoutMenu();
    } else if (action?.startsWith("attachment-cycle-")) {
      this.loadout.cycleAttachment(action.replace("attachment-cycle-", "") as AttachmentSlot, this.persistentStash.items);
      this.loadoutManager.captureFromLoadout(this.loadout);
      this.showInspectWeaponMenu();
    } else if (action?.startsWith("attachment-clear-")) {
      this.loadout.clearAttachment(action.replace("attachment-clear-", "") as AttachmentSlot);
      this.loadoutManager.captureFromLoadout(this.loadout);
      this.showInspectWeaponMenu();
    } else if (action === "repair-primary") {
      const weaponId = this.loadout.snapshot.primaryWeaponId;
      if (weaponId) {
        this.combatHud.showLootNotification(this.weaponController.repairWeapon(
          weaponId,
          (quantity) => this.persistentStash.remove("scrap", quantity),
        ));
      }
      this.showWorkbenchMenu();
    } else if (action === "repair-sidearm") {
      this.combatHud.showLootNotification(this.weaponController.repairWeapon(
        this.loadout.snapshot.sidearmWeaponId,
        (quantity) => this.persistentStash.remove("scrap", quantity),
      ));
      this.showWorkbenchMenu();
    } else {
      this.showMainMenu();
    }
  };

  private shouldKeepWeaponPreviewForMenuAction(action: string | undefined): boolean {
    if (!action) {
      return false;
    }

    if (action === "arsenal") {
      return true;
    }

    return action.startsWith("inspect-select-") ||
      action.startsWith("inspect-equip-") ||
      action.startsWith("inspect-repair-") ||
      action.startsWith("inspect-upgrade-") ||
      action.startsWith("inspect-attachment-");
  }

  private get startingReserveAmmo(): number {
    const loadout = this.activeLoadout;
    return (loadoutConfig.freeStarterMags + loadout.extraAmmoMags) * loadoutConfig.roundsPerMagazine;
  }

  private consumeLoadout(): void {
    const loadout = this.activeLoadout;
    const ammoRounds = loadout.extraAmmoMags * loadoutConfig.roundsPerMagazine;

    if (ammoRounds > 0) {
      this.persistentStash.remove("ammo", ammoRounds);
    }

    if (loadout.medkits > 0) {
      this.persistentStash.remove("medkit", loadout.medkits);
    }

    for (const weaponType of this.loadout.equippedWeaponLootTypes()) {
      this.persistentStash.remove(weaponType, 1);
    }

    for (const attachmentType of this.loadout.equippedAttachmentLootTypes()) {
      this.persistentStash.remove(attachmentType, 1);
    }

    for (const item of this.loadoutManager.raidBagItems()) {
      this.persistentStash.remove(item.type, item.quantity);
    }
  }

  private addLoadoutSupplies(): void {
    const loadout = this.activeLoadout;

    if (loadout.medkits > 0) {
      this.raidInventory.add("medkit", loadout.medkits);
    }

    if (loadout.extraAmmoMags > 0) {
      this.raidInventory.add(
        "ammo",
        loadout.extraAmmoMags * loadoutConfig.roundsPerMagazine,
      );
    }

    const bagEvents: LootEvent[] = [];

    for (const item of this.loadoutManager.raidBagItems()) {
      const event = this.raidInventory.add(item.type, item.quantity);

      if (event) {
        bagEvents.push(event);
      }
    }

    this.applyLootRewards(bagEvents);
  }

  private calculateRaidBagBonusSlots(): number {
    const backpackType = this.loadoutManager.snapshot.backpackType;
    const backpackBonus = backpackType === "elite-backpack"
      ? 12
      : backpackType === "backpack-upgrade"
        ? 4
        : 0;
    const upgradeBonus = this.craftingManager.getUpgradeTier("raid-bag-capacity") * 2;
    return backpackBonus + upgradeBonus;
  }

  private readonly handleDamage = (result: DamageResult): void => {
    if (result.appliedDamage === 0) {
      return;
    }

    const headshot = result.hitZone === "head";
    this.combatHud.showHitMarker(headshot);
    this.combatHud.showDamageNumber({
      amount: result.appliedDamage,
      headshot,
      hitZone: result.hitZone,
    });
  };

  private readonly handleDryFire = (): void => {
    this.combatHud.showLootNotification("Out of ammo - melee or reload");
  };

  private readonly handleNetworkRaidEnded = (): void => {
    if (!this.multiplayerMode || this.raidScreen !== "raid" || this.raidOutcome !== "active") {
      return;
    }

    this.combatHud.showLootNotification("Multiplayer Crater Run ended");
    this.finishRaidAsLost("abandoned");
  };

  private readonly handlePvpEvent = (event: NetworkPvpEvent): void => {
    if (event.type !== "kill") {
      return;
    }

    const localId = this.multiplayerClient.localPlayerId;
    const hostile = event.victimWasHostile;
    this.combatHud.showKillFeed(
      `${event.attackerName} eliminated ${event.victimName}`,
      !hostile,
    );

    if (event.attackerId !== localId) {
      return;
    }

    this.pvpKillsThisRaid += 1;
    const reputationEvent = hostile ? "hostile-kill" : "neutral-kill";
    const delta = this.reputation.apply(reputationEvent);
    const dogTag = this.raidInventory.add("dog-tag", 1);

    if (dogTag) {
      this.contractManager.record({ type: "item-looted", lootType: "dog-tag", quantity: 1 });
      this.combatHud.showLootNotification(`Faction tag secured | Reputation ${this.formatDelta(delta)}`);
    } else {
      this.combatHud.showLootNotification(`Faction tag dropped - EVA Pack full | Reputation ${this.formatDelta(delta)}`);
    }
  };

  private readonly handleNetworkEnemyEvent = (event: NetworkEnemyEvent): void => {
    if (!this.multiplayerMode) {
      return;
    }

    const localId = this.multiplayerClient.localPlayerId;
    if (event.attackerId === localId) {
      const headshot = event.hitZone === "head";
      this.combatHud.showHitMarker(headshot);
      this.combatHud.showDamageNumber({
        amount: event.damage,
        headshot,
        hitZone: event.hitZone,
      });
    }

    if (!event.killed) {
      return;
    }

    if (event.attackerId === localId) {
      this.enemiesEliminatedThisRaid += 1;
      this.contractManager.record({ type: "enemy-killed", enemyType: event.type });
      this.combatHud.showKillFeed(`Lumen target neutralized`, true);
    }
  };

  private readonly handleNetworkEnemyAttack = (event: NetworkEnemyAttackEvent): void => {
    if (!this.multiplayerMode || event.targetPlayerId !== this.multiplayerClient.localPlayerId) {
      return;
    }

    if (event.enemyType === "spitter") {
      this.combatHud.showLootNotification("Acid exposure - suit integrity warning");
    }

    if (event.enemyType === "elite") {
      this.playerStatus.tryApplyLunarInfection(0.35);
      this.combatHud.showLootNotification("Crater Horror presence destabilizing cognition");
    }

    if (event.enemyType === "grunt" && this.playerStatus.tryApplyLunarInfection(0.2)) {
      this.combatHud.showLootNotification("Lunar Infection detected. Mental stability compromised.");
    }
  };

  private readonly handleNetworkContainerState = (state: NetworkContainerState | null): void => {
    if (!this.multiplayerMode) {
      return;
    }

    if (!state) {
      this.pendingSharedContainerOpenId = null;
      this.raidBagOpen = false;
      this.clearActiveSharedContainerPanel("close");
      this.inventoryManager.setWarning("Recovery cache unavailable");
      this.combatHud.showLootNotification("Recovery cache unavailable");
      return;
    }

    const view = this.lootDirector.applyNetworkContainerState(state);
    this.multiplayerClient.markContainerMapping(view !== null, false);
    const activeContainer = this.inventoryManager.snapshot.activeContainer;
    const isPendingOpenResponse = this.pendingSharedContainerOpenId === state.id;
    const serverItemCount = state.items.filter((item) => item.quantity > 0).length;
    const renderedItemCount = view?.items.length ?? 0;
    const activePanelId = activeContainer?.id ?? this.activeSharedContainerPanelId;
    const activeMatchesState = activePanelId === state.id;
    const stateCanRenderPanel = state.opened || state.depleted || serverItemCount > 0;

    if (!stateCanRenderPanel) {
      const reason = state.id.includes("reward-chest") ? "objective-unlock" : activePanelId ? "non-active" : "no-panel";
      console.info(`[ClientLoot] visible empty ignored container=${state.id} active=${activePanelId ?? "none"} reason=non-active-empty`);
      console.info(`[ClientLoot] background container update ignored container=${state.id} active=${activePanelId ?? "none"} reason=${reason} serverItems=${serverItemCount} renderedItems=${renderedItemCount}`);
      return;
    }

    if ((activeMatchesState || isPendingOpenResponse) && view) {
      const reason = isPendingOpenResponse ? "pending-match" : "active-match";
      if (isPendingOpenResponse) {
        this.pendingSharedContainerOpenId = null;
        this.raidBagOpen = false;
        this.selectedLootIndex = 0;
        this.setInputMode("ui", "loot-panel");
        this.combatHud.showLootNotification(view.items.length > 0 ? "Recovery cache opened" : "Cache empty");
        this.sfxAudio.playEvent(view.items.length > 0 ? "loot.open" : "loot.empty");
      }
      this.setActiveSharedContainerPanel(state.id, isPendingOpenResponse ? "player-open" : "panel-switch");
      this.inventoryManager.refreshActiveContainer(view);
      if (!activeContainer || activeContainer.id !== state.id) {
        this.inventoryManager.setActiveContainer(view);
      }
      this.multiplayerClient.markContainerMapping(true, true);
      this.lastSharedContainerPanelId = state.id;
      this.lastSharedContainerPanelItemCount = state.items.length;
      this.lastSharedContainerClaimRefresh = `state refresh ${state.id} items=${state.items.length} reason=${reason}`;
      console.info(`[ClientLoot] visible panel update accepted container=${state.id} reason=${reason}`);
      if (state.depleted) {
        this.inventoryManager.setWarning("Recovery cache depleted");
        this.combatHud.showLootNotification("Recovery cache depleted");
      }
      return;
    }

    if (this.pendingSharedContainerOpenId === state.id) {
      this.pendingSharedContainerOpenId = null;
      this.lastSharedContainerClaimRefresh = `pending open cleared ${state.id}`;
    }
    const ignoredReason = activePanelId ? "non-active" : "no-panel";
    if (serverItemCount === 0) {
      console.info(`[ClientLoot] visible empty ignored container=${state.id} active=${activePanelId ?? "none"} reason=non-active-empty`);
    }
    console.info(`[ClientLoot] background container update ignored container=${state.id} active=${activePanelId ?? "none"} reason=${ignoredReason} serverItems=${serverItemCount} renderedItems=${renderedItemCount}`);
  };

  private readonly handleNetworkContainerClaimResult = (result: NetworkContainerClaimResult): void => {
    if (!this.multiplayerMode) {
      return;
    }

    if (result.container) {
      const view = this.lootDirector.applyNetworkContainerState(result.container);
      const activeContainer = this.inventoryManager.snapshot.activeContainer;
      const activePanelId = activeContainer?.id ?? this.activeSharedContainerPanelId;
      if (activePanelId === result.container.id) {
        this.setActiveSharedContainerPanel(result.container.id, "panel-switch");
        this.inventoryManager.refreshActiveContainer(view);
        if (!activeContainer || activeContainer.id !== result.container.id) {
          this.inventoryManager.setActiveContainer(view);
        }
        this.lastSharedContainerPanelId = result.container.id;
        this.lastSharedContainerPanelItemCount = result.container.items.length;
        this.lastSharedContainerClaimRefresh = `claim result refresh ${result.container.id} items=${result.container.items.length} ok=${result.ok}`;
        console.info(`[ClientLoot] visible panel update accepted container=${result.container.id} reason=claim-result`);
      } else {
        const serverItemCount = result.container.items.filter((item) => item.quantity > 0).length;
        console.info(`[ClientLoot] background container update ignored container=${result.container.id} active=${activePanelId ?? "none"} reason=non-active serverItems=${serverItemCount} renderedItems=${view?.items.length ?? 0}`);
      }
    }
    const remaining = result.container?.items.filter((item) => item.quantity > 0).length ?? 0;
    console.info(`[ClientLoot] claim result container=${result.containerId} ok=${result.ok} reason=${result.reason} remaining=${remaining}`);

    if (!result.ok) {
      const message = result.reason === "depleted" ? "Item no longer available" : "Recovery claim failed";
      this.inventoryManager.setWarning(message);
      this.combatHud.showLootNotification(message);
      this.multiplayerClient.markInventoryAddApplied(false);
      return;
    }

    if (result.claimantPlayerId !== this.multiplayerClient.localPlayerId) {
      this.multiplayerClient.markInventoryAddApplied(false);
      return;
    }

    const events: LootEvent[] = [];
    for (const item of result.claimedItems) {
      if (!this.isLootType(item.type)) {
        console.warn(`[Multiplayer Loot] Unknown approved loot type: ${item.type}`);
        continue;
      }
      const type = item.type as LootType;
      const event = this.inventoryManager.add(type, item.quantity);
      if (event) {
        events.push(event);
      }
    }

    if (events.length === 0) {
      this.inventoryManager.setWarning("Inventory Full");
      this.combatHud.showLootNotification("Inventory Full");
      this.multiplayerClient.markInventoryAddApplied(false);
      return;
    }

    this.inventoryManager.clearWarning();
    this.applyLootRewards(events);
    this.multiplayerClient.markInventoryAddApplied(true);
    this.combatHud.showLootNotification(events.length === 1 ? `Recovered: ${events[0]!.label}` : `Recovered: ${events.length} items`);
    this.sfxAudio.playEvent(events.some((event) => getItemDefinition(event.type).rarity === "rare" || getItemDefinition(event.type).rarity === "epic" || getItemDefinition(event.type).rarity === "legendary" || getItemDefinition(event.type).rarity === "core")
      ? "loot.rare"
      : "loot.claim");
  };

  private readonly handleNetworkObjectiveState = (state: NetworkObjectiveState): void => {
    if (!this.multiplayerMode || !state.completed) {
      return;
    }

    const changed = this.poiObjectiveManager.completeFromNetwork(state.id);
    if (changed) {
      this.networkAppliedPoiObjectiveIds.add(state.id);
      console.info(`[ClientLoot] objective reward unlock notification chest=${state.id}-reward-chest autoOpen=false`);
    }
    if (
      state.extractionUnlocked &&
      !this.objectiveWasCompleted &&
      (this.objectiveState.type !== "secure-rare-core" || this.heavyCargoState.shipSecured)
    ) {
      this.objectiveWasCompleted = true;
      this.updateActiveExtractionZones();
      this.shipState = this.shipManager.updateExtractionReadiness(true);
      this.combatHud.showLootNotification("Return route available");
    }

    if (!changed) {
      return;
    }

    this.poiObjectiveState = this.poiObjectiveManager.state;
  };

  private readonly handleNetworkHeavyCargoState = (state: NetworkHeavyCargoState): void => {
    if (this.heavyCargoInventorySuppressionSeconds > 0 && this.heavyCargoInventorySuppressionAction) {
      this.suppressInventoryOverlayForHeavyCargo(this.heavyCargoInventorySuppressionAction);
    }
    this.heavyCargoManager.applyNetworkState(state, this.multiplayerClient.localPlayerId);
    this.lastHeavyCargoRoomId = this.multiplayerClient.snapshot.roomId;
    this.pendingHeavyCargoRequest = "none";
    const previousSecured = this.heavyCargoState.shipSecured;
    const previousCarried = this.heavyCargoState.carriedByLocalPlayer;
    const previousStatus = this.heavyCargoState.status;
    this.heavyCargoState = this.heavyCargoManager.update(this.player.state, this.landedShip.cargoAccessPosition);

    if (!previousCarried && this.heavyCargoState.carriedByLocalPlayer) {
      this.onHeavyCargoPickedUp();
    } else if (previousStatus !== "carried" && this.heavyCargoState.status === "carried") {
      this.combatHud.showLootNotification("CORE SIGNATURE EXPOSED | ESCORT CARRIER TO SHIP");
    }

    if (!previousSecured && this.heavyCargoState.shipSecured) {
      this.onHeavyCargoSecured();
    }
  };

  private readonly handleNetworkHeavyCargoActionResult = (result: NetworkHeavyCargoActionResult): void => {
    if (!this.multiplayerMode) {
      return;
    }
    if (this.heavyCargoInventorySuppressionSeconds > 0 && this.heavyCargoInventorySuppressionAction) {
      this.suppressInventoryOverlayForHeavyCargo(this.heavyCargoInventorySuppressionAction);
    }
    if (result.cargo) {
      this.heavyCargoManager.applyNetworkState(result.cargo, this.multiplayerClient.localPlayerId);
      this.heavyCargoState = this.heavyCargoManager.update(this.player.state, this.landedShip.cargoAccessPosition);
      this.lastHeavyCargoRoomId = this.multiplayerClient.snapshot.roomId;
    }
    this.pendingHeavyCargoRequest = "none";

    if (result.ok) {
      if (result.reason === "released") {
        this.combatHud.showLootNotification("HEAVY CORE RELEASED | E: Carry core");
        this.sfxAudio.playEvent("heavy.release");
      } else if (result.reason === "dropped") {
        this.combatHud.showLootNotification("CORE DROPPED - RECOVERABLE");
        this.sfxAudio.playEvent("heavy.drop");
      } else if (result.reason === "secured") {
        this.combatHud.showLootNotification("HEAVY CARGO SECURED | HELIUM-3 DRILL CORE | EXTRACTION AVAILABLE");
        this.sfxAudio.playEvent("heavy.secure");
      }
      return;
    }

    const message = this.formatHeavyCargoRejection(result.reason);
    this.inventoryManager.setWarning(message);
    this.combatHud.showLootNotification(message);
    this.sfxAudio.playEvent("ui.error");
  };

  private formatHeavyCargoRejection(reason: NetworkHeavyCargoActionResult["reason"]): string {
    if (reason === "busy" || reason === "already-carried") return "CORE ALREADY CARRIED BY TEAMMATE";
    if (reason === "locked") return "CORE NOT RELEASED";
    if (reason === "not-carrier") return "CORE TRANSFER REJECTED";
    if (reason === "already-secured") return "CORE ALREADY SECURED";
    if (reason === "out-of-range") return "CORE ACTION OUT OF RANGE";
    if (reason === "missing") return "CORE RECOVERY UNAVAILABLE - SERVER NOT READY";
    if (reason === "dropped") return "CORE DROP REJECTED";
    if (reason === "secured") return "CORE TRANSFER REJECTED";
    return "CORE PICKUP REJECTED";
  }

  private readonly handleNetworkReviveResult = (result: NetworkReviveResult): void => {
    const localId = this.multiplayerClient.localPlayerId;
    if (result.ok) {
      if (result.targetPlayerId === localId) {
        this.playerHealth.setCurrentFromServer(result.targetHealth);
        this.multiplayerDownedSent = false;
        this.combatHud.showLootNotification("REVIVED - SUIT STABILITY LIMITED");
        this.sfxAudio.playEvent("revive.complete");
      } else {
        this.combatHud.showLootNotification("TEAMMATE REVIVED");
        this.sfxAudio.playEvent("revive.complete");
      }
      this.reviveTargetId = null;
      this.reviveProgressSeconds = 0;
      return;
    }

    const message = this.formatReviveRejection(result.reason);
    this.reviveProgressSeconds = 0;
    this.combatHud.showLootNotification(message);
    this.sfxAudio.playEvent("ui.error");
  };

  private formatReviveRejection(reason: NetworkReviveResult["reason"]): string {
    if (reason === "out-of-range") return "REVIVE CANCELLED - OUT OF RANGE";
    if (reason === "not-downed") return "REVIVE CANCELLED - TARGET ACTIVE";
    if (reason === "reviver-not-active") return "REVIVE CANCELLED - REVIVER DOWN";
    if (reason === "self") return "CANNOT REVIVE SELF";
    if (reason === "target-missing") return "REVIVE CANCELLED - TARGET LEFT";
    return "REVIVE FAILED";
  }

  private isLootType(type: string): type is LootType {
    return type in itemDefinitions;
  }

  private formatDelta(delta: number): string {
    return delta >= 0 ? `+${delta}` : String(delta);
  }

  private get survivedLoadoutItems(): LootStack[] {
    const weapons = this.loadout.equippedWeaponLootTypes().map((type) => ({
      type,
      label: this.loadout.getWeaponNameForLoot(type) ?? "Weapon",
      quantity: 1,
    }));
    const attachments = this.loadout.equippedAttachmentLootTypes().map((type) => ({
      type,
      label: this.loadout.getAttachmentNameForLoot(type) ?? "Attachment",
      quantity: 1,
    }));

    return [...weapons, ...attachments];
  }

  private get lostLoadoutItems(): LootStack[] {
    return [
      ...this.survivedLoadoutItems,
      ...this.loadoutManager.raidBagItems(),
    ];
  }

  private loadLoopProfile(): LoopProfile {
    try {
      const raw = window.localStorage.getItem(loopProfileStorageKey);

      if (!raw) {
        return { xp: 0 };
      }

      const parsed = JSON.parse(raw) as Partial<LoopProfile>;
      return {
        xp: Number.isFinite(parsed.xp) ? Math.max(0, Math.floor(parsed.xp ?? 0)) : 0,
      };
    } catch (error) {
      console.warn("Loop profile failed to load; using defaults.", error);
      return { xp: 0 };
    }
  }

  private saveLoopProfile(): void {
    try {
      window.localStorage.setItem(loopProfileStorageKey, JSON.stringify(this.loopProfile));
    } catch (error) {
      console.warn("Loop profile could not be saved.", error);
    }
  }

  private loadWeaponUpgrades(): WeaponUpgradeState {
    const defaults = this.createDefaultWeaponUpgrades();

    try {
      const raw = window.localStorage.getItem(weaponUpgradeStorageKey);

      if (!raw) {
        return defaults;
      }

      const parsed = JSON.parse(raw) as Partial<Record<WeaponId, Partial<Record<WeaponUpgradeCategory, number>>>>;
      const next = this.createDefaultWeaponUpgrades();

      for (const weaponId of Object.keys(weaponDefinitions) as WeaponId[]) {
        for (const category of weaponUpgradeCategories) {
          const value = parsed[weaponId]?.[category.id] ?? 0;
          next[weaponId][category.id] = Number.isFinite(value)
            ? Math.max(0, Math.min(maxWeaponUpgradeTier, Math.floor(value)))
            : 0;
        }
      }

      return next;
    } catch (error) {
      console.warn("InspectWeapon: weapon upgrades failed to load; using defaults.", error);
      return defaults;
    }
  }

  private saveWeaponUpgrades(): void {
    try {
      window.localStorage.setItem(weaponUpgradeStorageKey, JSON.stringify(this.weaponUpgrades));
    } catch (error) {
      console.warn("InspectWeapon: weapon upgrades could not be saved.", error);
    }
  }

  private createDefaultWeaponUpgrades(): WeaponUpgradeState {
    const createCategories = (): Record<WeaponUpgradeCategory, number> => ({
      damage: 0,
      recoil: 0,
      ads: 0,
      reload: 0,
      durability: 0,
      magazine: 0,
    });

    return {
      pistol: createCategories(),
      "burst-pistol": createCategories(),
      revolver: createCategories(),
      "compact-smg": createCategories(),
      smg: createCategories(),
      shotgun: createCategories(),
      "assault-rifle": createCategories(),
      rifle: createCategories(),
      knife: createCategories(),
    };
  }

  private resetPrototypeSaveData(): void {
    const prefixes = [
      "darc-raiders.",
      "extraction-shooter.prototype.",
      "babylon-extraction-shooter",
    ];

    for (const key of Object.keys(window.localStorage)) {
      if (prefixes.some((prefix) => key.startsWith(prefix))) {
        window.localStorage.removeItem(key);
      }
    }

    window.location.reload();
  }

  private grantDebugResources(): void {
    this.persistentStash.addItems([
      { type: "scrap", label: getItemDefinition("scrap").label, quantity: 100 },
      { type: "medkit", label: getItemDefinition("medkit").label, quantity: 5 },
      { type: "anti-toxin", label: getItemDefinition("anti-toxin").label, quantity: 3 },
      { type: "ammo", label: getItemDefinition("ammo").label, quantity: 120 },
      { type: "weapon-burst-pistol", label: getItemDefinition("weapon-burst-pistol").label, quantity: 1 },
      { type: "weapon-revolver", label: getItemDefinition("weapon-revolver").label, quantity: 1 },
      { type: "weapon-compact-smg", label: getItemDefinition("weapon-compact-smg").label, quantity: 1 },
      { type: "weapon-knife", label: getItemDefinition("weapon-knife").label, quantity: 1 },
      { type: "weapon-assault-rifle", label: getItemDefinition("weapon-assault-rifle").label, quantity: 1 },
      { type: "weapon-rifle", label: getItemDefinition("weapon-rifle").label, quantity: 1 },
    ]);
    this.vendorManager.awardCredits(1000);
  }

  private debugForceContractTargetPoi(): void {
    const message = this.contractManager.activate("poi-cache-drop-yard");
    this.combatHud.showLootNotification(`Debug: ${message}`);
    console.info("[ContractManager] Debug forced contract target POI: Tycho Scar / Secure Cache");
    if (this.raidScreen !== "raid") {
      this.showMainMenu();
    }
  }

  private debugCompleteNearestPoiObjective(): void {
    if (this.raidScreen !== "raid") {
      this.combatHud.showLootNotification("Debug objective complete only works in a Crater Run");
      return;
    }

    const completed = this.poiObjectiveManager.completeNearestForDebug(this.player.state.position);
    this.combatHud.showLootNotification(completed ? "Debug: POI objective completed" : "Debug: no POI objective available");
    console.info(`[POIObjectiveManager] Debug complete nearest objective: ${completed}`);
  }

  private debugSubmitContractReward(): void {
    const message = this.contractManager.submitActiveContract();
    const rewards = this.contractManager.consumeRewards();
    for (const grant of rewards) {
      this.vendorManager.awardCredits(grant.reward.credits);
      this.loopProfile = { xp: this.loopProfile.xp + grant.reward.xp };
      for (const [vendorId, amount] of Object.entries(grant.reward.vendorReputation)) {
        this.vendorManager.awardReputation(vendorId as VendorId, amount ?? 0);
      }
    }
    this.saveLoopProfile();
    this.combatHud.showLootNotification(`Debug: ${message}`);
    console.info(`[ContractManager] Debug submit reward: ${message}`);
    if (this.raidScreen !== "raid") {
      this.showMainMenu();
    }
  }

  private formatSlotName(slot: AttachmentSlot): string {
    return slot.charAt(0).toUpperCase() + slot.slice(1);
  }

  private getStashQuantity(type: LootStack["type"]): number {
    return this.persistentStash.items.find((item) => item.type === type)?.quantity ?? 0;
  }

  private get enemyDirectorOptions(): {
    difficultyLevel: number;
    disabled?: boolean;
    onLootDropped: (event: LootEvent) => void;
    onPlayerHit: (enemyType: EnemyType) => void;
    onEnemyKilled: (enemyType: EnemyType) => void;
  } {
    return {
      difficultyLevel: this.persistentStash.raidLevel + this.selectedRaidDefinition.difficultyLevelBonus,
      disabled: this.multiplayerMode,
      onEnemyKilled: (enemyType) => {
        this.enemiesEliminatedThisRaid += 1;
        this.contractManager.record({ type: "enemy-killed", enemyType });
      },
      onPlayerHit: (enemyType) => {
        if (enemyType === "spitter") {
          this.combatHud.showLootNotification("Acid exposure - suit integrity warning");
        }

        if (enemyType === "elite") {
          this.playerStatus.tryApplyLunarInfection(0.35);
          this.combatHud.showLootNotification("Crater Horror presence destabilizing cognition");
        }

        if (enemyType !== "grunt") {
          return;
        }

        if (this.playerStatus.tryApplyLunarInfection(0.2)) {
          this.combatHud.showLootNotification("Lunar Infection detected. Mental stability compromised.");
        }
      },
      onLootDropped: (event) => {
        const lootEvent = this.raidInventory.add(event.type, event.quantity);

        if (!lootEvent) {
          this.combatHud.showLootNotification("Enemy loot dropped - inventory full");
          return;
        }

        this.applyLootRewards([lootEvent]);
        this.combatHud.showLootNotification(lootEvent);
      },
    };
  }
}
