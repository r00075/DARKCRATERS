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
import { playMenuMusic, playTychoStarMusic } from "../audio/darkCratersAudio";
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
import { HQManager, hqStations, type HQStationId } from "../hq/HQManager";
import type { DynamicEventState } from "../raid/DynamicEventDirector";
import { DynamicEventDirector } from "../raid/DynamicEventDirector";
import type { ExtractionState } from "../raid/ExtractionController";
import { ExtractionController } from "../raid/ExtractionController";
import { getItemDefinition, type LootType } from "../raid/ItemDefinitions";
import { Loadout, loadoutConfig, type RaidLoadout } from "../raid/Loadout";
import { InventoryManager } from "../raid/InventoryManager";
import {
  equipmentSlotLabels,
  loadoutFilters,
  LoadoutManager,
  type EquipmentSlot,
  type LoadoutFilter,
} from "../raid/LoadoutManager";
import { LootDirector } from "../raid/LootDirector";
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
import { ShipManager, type LandingQuality, type ShipDepositResult, type ShipState } from "../ship/ShipManager";
import { NoiseSystem, type NoiseSystemState } from "../stealth/NoiseSystem";
import { TacticalToolManager, type TacticalToolState } from "../tactical/TacticalToolManager";
import { colorToCss, themeConfig } from "../theme/ThemeConfig";
import { TargetDummy } from "../combat/TargetDummy";
import { TraversalController, type TraversalState } from "../traversal/TraversalController";
import { PlayerCharacter } from "../world/PlayerCharacter";
import { ThirdPersonCameraRig } from "../camera/ThirdPersonCameraRig";
import { InputController, type InputMode, type InputSnapshot } from "../input/InputController";
import { createWorld, type WorldMap } from "../world/createWorld";
import { extractionZoneDefinitions, poiDefinitions, type ExtractionZoneDefinition } from "../world/MapLayout";
import { CombatHud, type RaidOutcome, type RaidScreen } from "../ui/CombatHud";
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
import { MultiplayerClient } from "../multiplayer/MultiplayerClient";
import type { NetworkPvpEvent } from "../multiplayer/MultiplayerTypes";

type LoopProfile = Readonly<{
  xp: number;
}>;

type RaidExitReason = "dead" | "downed_abandon" | "abandoned" | "extracted" | "manual_debug" | "timer_expired";
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
  | "raidSelect";
type WeaponUpgradeCategory =
  | "damage"
  | "recoil"
  | "ads"
  | "reload"
  | "durability"
  | "magazine";
type WeaponUpgradeState = Record<WeaponId, Record<WeaponUpgradeCategory, number>>;
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
  { id: "recoil", label: "Recoil Control", effect: "+6% recoil control", scrapBase: 7, partsBase: 1 },
  { id: "ads", label: "ADS Speed", effect: "+5% ready speed", scrapBase: 6, partsBase: 1 },
  { id: "reload", label: "Reload Speed", effect: "+5% reload speed", scrapBase: 7, partsBase: 1 },
  { id: "durability", label: "Durability", effect: "+8% service life", scrapBase: 9, partsBase: 2 },
  { id: "magazine", label: "Magazine Efficiency", effect: "+1 handling tier", scrapBase: 8, partsBase: 2 },
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
  private readonly contractManager = new ContractManager();
  private readonly reputation = new Reputation();
  private readonly shipManager = new ShipManager();
  private readonly landedShip: LandedShip;
  private readonly settingsManager = new SettingsManager();
  private readonly loadout = new Loadout();
  private readonly loadoutManager = new LoadoutManager();
  private readonly extractionController = new ExtractionController();
  private readonly raidTimer = new RaidTimer();
  private readonly lootDirector: LootDirector;
  private readonly dynamicEventDirector: DynamicEventDirector;
  private readonly objectiveDirector: ObjectiveDirector;
  private readonly poiObjectiveManager: POIObjectiveManager;
  private readonly hud: HTMLDivElement;
  private readonly menu: HTMLDivElement;
  private readonly menuContent: HTMLDivElement;
  private readonly debugOverlay: HTMLDivElement;
  private readonly playerSpawn = new Vector3(0, 1.05, 0);
  private raidScreen: RaidScreen = "menu";
  private loadoutTab: "gear" | "cosmetics" = "gear";
  private raidOutcome: RaidOutcome = "active";
  private activeLoadout: RaidLoadout = this.loadout.snapshot;
  private outcomeItems: LootStack[] = [];
  private lootLostItems: LootStack[] = [];
  private raidResultSummary: RaidResultSummary = emptyRaidResultSummary;
  private prepScrapSpentSinceLastRaid = 0;
  private activeRaidPrepScrapSpent = 0;
  private loopProfile: LoopProfile = this.loadLoopProfile();
  private debugOverlayVisible = false;
  private extractionState: ExtractionState = this.extractionController.state;
  private raidTimerState: RaidTimerState = this.raidTimer.state;
  private dynamicEventState: DynamicEventState;
  private objectiveState: ObjectiveState;
  private poiObjectiveState: POIObjectiveState;
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
  private multiplayerMode = false;
  private pvpKillsThisRaid = 0;
  private enemiesEliminatedThisRaid = 0;
  private poiObjectiveOutcomesThisRaid: string[] = [];
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
  private shipInRange = false;
  private raidBagOpen = false;
  private selectedRaidBagIndex = 0;
  private selectedLootIndex = 0;
  private raidUiNavigationCooldown = 0;
  private inspectedWeaponId: WeaponId | null = null;
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
    this.environmentManager = new EnvironmentManager(this.scene, skyLight);
    this.environmentState = this.environmentManager.state;

    this.worldMap = createWorld(this.scene);
    this.worldMap.setActiveExtractionZones([]);

    this.input = new InputController(canvas, this.settingsManager);
    this.gameplayInput = this.input.snapshot;
    this.player = new PlayerCharacter(this.scene, this.playerSpawn);
    this.player.applyCosmeticPalette(this.cosmeticManager.getPalette());
    this.landedShip = new LandedShip(this.scene, this.playerSpawn.add(new Vector3(0, -1.05, -7.5)));
    this.landedShip.setEnabled(false);
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
    );
    this.targetDummy = new TargetDummy(this.scene, new Vector3(0, 0, 24));
    this.lootDirector = new LootDirector(this.scene);
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
    this.loadingScreen.show("Loading HQ", 1700);
  }

  public start(): void {
    this.engine.runRenderLoop(() => {
      const dt = Math.min(this.engine.getDeltaTime() / 1000, 1 / 30);
      const cameraYaw = this.cameraRig.yaw;

      this.setInputMode(this.getInputMode(), this.getActiveInputPanel());
      this.input.update(dt);
      this.gameplayInput = this.input.snapshot;
      this.updateMenuNavigation(dt);
      this.updateRaidInventoryNavigation(dt);
      this.playerHealth.update(dt);
      this.updatePlayerStatus(dt);
      this.updateReturnToHqHold(dt);
      this.updateReturnToMenu();
      this.releasePointerLockForRaidResult();

      if (this.isRaidActive) {
        this.coverState = this.coverController.update(this.input.snapshot, this.player.state);
        this.gameplayInput = this.coverController.getAdjustedInput(this.input.snapshot);
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
            this.enemyDirector.debugStates,
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

      this.cameraRig.update(dt);
      this.player.updateAimFade(dt, this.camera);

      if (this.isRaidActive) {
        this.raidTimerState = this.raidTimer.update(dt);
        this.dynamicEventState = this.dynamicEventDirector.update(
          dt,
          this.raidTimerState,
          this.player.state.position,
          this.enemyDirector,
        );
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
        this.handleRaidInteractions(dt);
        this.enemyDirector.update(
          dt,
          this.gameplayInput,
          this.player.state,
          this.weaponController.snapshot,
          enemyVisionGameplay,
          this.noiseSystem.consumeEvents(),
          this.raidTimerState.elapsed,
        );
        for (const message of this.enemyDirector.consumeEncounterMessages()) {
          this.combatHud.showLootNotification(message);
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
      this.landedShip.update(dt);

      this.targetDummy.update(dt);
      this.combatHud.update(
        dt,
        this.gameplayInput,
        this.weaponController.snapshot,
        this.player.state,
        this.playerHealth.snapshot,
        this.enemyDirector.debugStates,
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
          shipCargoItems: this.shipManager.cargoItems,
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
    this.environmentManager.dispose();
    this.landedShip.dispose();
    this.visibilityToolManager.dispose();
    this.noiseSystem.dispose();
    this.targetDummy.dispose();
    this.enemyDirector.dispose();
    this.objectiveDirector.dispose();
    this.poiObjectiveManager.dispose();
    this.dynamicEventDirector.dispose();
    this.lootDirector.dispose();
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
      this.closeLootPanel(container.id);
      this.setInputMode("gameplay", "gameplay");
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
      this.combatHud.showLootNotification(`Enemy hitboxes ${this.enemyHitboxDebugVisible ? "shown" : "hidden"}`);
      event.preventDefault();
    } else if (event.code === "F8") {
      this.enemyLosDebugVisible = !this.enemyLosDebugVisible;
      this.enemyDirector.setLosDebugVisible(this.enemyLosDebugVisible);
      this.combatHud.showLootNotification(`Enemy LOS ${this.enemyLosDebugVisible ? "shown" : "hidden"}`);
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
    if (this.raidScreen !== "raid" || this.raidOutcome !== "active" || !this.playerHealth.snapshot.alive) {
      this.raidBagOpen = false;
      return;
    }

    this.raidUiNavigationCooldown = Math.max(0, this.raidUiNavigationCooldown - dt);

    if (this.gameplayInput.raidBagTogglePressed) {
      this.raidBagOpen = !this.raidBagOpen;
      this.clampRaidBagSelection();
      if (this.raidBagOpen) {
        this.setInputMode("ui", "raid-bag");
      } else {
        this.setInputMode("gameplay", "gameplay");
        this.input.captureGameplayPointer();
      }
      this.combatHud.showLootNotification(this.raidBagOpen ? "EVA Pack open" : "EVA Pack closed");
    }

    const activeContainer = this.inventoryManager.snapshot.activeContainer;
    const uiOpen = this.raidBagOpen || activeContainer !== null;

    if (!uiOpen) {
      return;
    }

    if (activeContainer) {
      this.raidBagOpen = true;
      this.selectedLootIndex = this.clampIndex(this.selectedLootIndex, activeContainer.items.length);

      if (this.gameplayInput.takeAllPressed) {
        this.takeAllLoot(activeContainer.id);
      } else if (this.gameplayInput.uiConfirmPressed) {
        this.takeLootItem(activeContainer.id, this.selectedLootIndex);
      } else if (this.gameplayInput.uiBackPressed) {
        this.closeLootPanel(activeContainer.id);
      } else {
        this.navigateRaidUiSelection(activeContainer.items.length, "loot");
      }
    } else {
      this.clampRaidBagSelection();

      if (this.gameplayInput.uiBackPressed) {
        this.raidBagOpen = false;
        this.setInputMode("gameplay", "gameplay");
        this.input.captureGameplayPointer();
        this.combatHud.showLootNotification("EVA Pack closed");
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
    this.combatHud.showLootNotification(`${slot.label} | ${definition.rarity} | ${definition.value * slot.quantity} credits`);
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
      this.inventoryManager.setActiveContainer(null);
      this.inventoryManager.clearWarning();
      this.raidBagOpen = false;
      this.setInputMode("gameplay", "gameplay");
      this.input.captureGameplayPointer();
      this.combatHud.showLootNotification("EVA Pack closed");
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
    }
  }

  private useRaidInventorySlot(slotId: string): void {
    const slot = this.raidInventory.inventorySlots.find((item) => item.id === slotId);

    if (!slot) {
      this.combatHud.showLootNotification("No EVA Pack item selected");
      return;
    }

    if (slot.type === "anti-toxin") {
      if (!this.playerStatus.snapshot.lunarInfection && this.playerStatus.snapshot.mentalStability >= 100) {
        this.combatHud.showLootNotification("Anti-Toxin not needed");
        return;
      }
      if (this.raidInventory.consume("anti-toxin", 1)) {
        this.playerStatus.administerAntiToxin();
        this.combatHud.showLootNotification("Anti-Toxin administered. Infection cleared.");
      }
      return;
    }

    if (slot.type === "advanced-medkit" && this.raidInventory.consume(slot.type, 1)) {
      this.playerHealth.heal(55);
      this.combatHud.showLootNotification("Advanced medkit used");
      return;
    }

    if (slot.type === "medkit" && this.raidInventory.consume(slot.type, 1)) {
      this.playerHealth.heal(35);
      this.combatHud.showLootNotification("Medkit used");
      return;
    }

    if (slot.type === "bandage" && this.raidInventory.consume(slot.type, 1)) {
      this.playerHealth.heal(16);
      this.combatHud.showLootNotification("Bandage used");
      return;
    }

    if ((slot.type === "armor-plate" || slot.type === "improved-armor-plate") && this.raidInventory.consume(slot.type, 1)) {
      this.playerHealth.setIncomingDamageMultiplier(slot.type === "improved-armor-plate"
        ? loadoutConfig.lightArmorDamageMultiplier * 0.82
        : loadoutConfig.lightArmorDamageMultiplier * 0.9);
      this.combatHud.showLootNotification(`${slot.label} fitted`);
      return;
    }

    if (slot.type === "battery" && this.raidInventory.consume(slot.type, 1)) {
      this.oxygenPercent = Math.min(100, this.oxygenPercent + 35);
      this.oxygenWarningState = this.getOxygenState(this.oxygenPercent);
      this.combatHud.showLootNotification("Oxygen Cell used");
      return;
    }

    this.combatHud.showLootNotification(`${slot.label} cannot be used yet`);
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
    const mouse = this.input.mouseDebug;
    this.debugOverlay.innerHTML = `
      <strong>DARK CRATERS DEBUG</strong>
      <span>Screen: ${this.raidScreen} | Outcome: ${this.raidOutcome}</span>
      <span>Overlay: ${this.overlayState} | Input Mode: ${this.inputMode} | Panel: ${this.activeInputPanel}</span>
      <span>Pointer Lock: ${mouse.pointerLocked ? "canvas" : "none"} | Mouse Captured: ${mouse.mouseCaptured ? "true" : "false"}</span>
      <span>Mouse: ${mouse.lastMouseAction} | down ${mouse.lastButtonDown ?? "none"} | up ${mouse.lastButtonUp ?? "none"}</span>
      <span>Mouse Held: fire ${mouse.fireHeld ? "true" : "false"} | ADS ${mouse.adsHeld ? "true" : "false"} | wheel ${Math.round(mouse.wheelDelta)}</span>
      <span>Canvas Pointerdown: ${mouse.canvasPointerDownFired ? "true" : "false"} | Under Cursor: ${mouse.elementUnderCursor}</span>
      <span>Health: ${Math.ceil(health.current)} / ${health.max} | Armor: ${this.craftingManager.snapshot.armorDurability}%</span>
      <span>O2: ${Math.ceil(this.oxygenPercent)}% | Mind: ${Math.ceil(this.playerStatus.snapshot.mentalStability)}% ${this.playerStatus.snapshot.lunarInfection ? "| Lunar Infection" : ""}</span>
      <span>Crater Run: timer ${Math.ceil(this.raidTimerState.timeRemaining)}s | extract ${this.raidTimerState.extractionUnlocked ? "active" : "locked"}</span>
      <span>EVA Pack: ${this.raidInventory.usedSlots} / ${this.raidInventory.capacity}</span>
      <span>Ship: landing ${this.shipState.landingQuality} | readiness ${this.shipState.readiness} | risk ${this.shipState.cargoRisk} | repaired ${this.shipState.repaired ? "true" : "false"}</span>
      <span>Ship Cargo: ${this.shipState.cargoUsed}/${this.shipState.cargoCapacity} | access ${this.landedShip.cargoAccessRadius.toFixed(1)}m | manifest ${this.shipManager.cargoItems.length} stack${this.shipManager.cargoItems.length === 1 ? "" : "s"}</span>
      <span>Habitat Regolith Scrap: ${this.getStashQuantity("scrap")} | Credits: ${this.vendorManager.snapshot.credits}</span>
      <span>Input: ${input.activeInputMethod}${input.controllerConnected ? ` | ${input.controllerName ?? "controller"}` : ""}</span>
      <span>Multiplayer: ${this.renderMultiplayerStatusLine()} | Mode: ${this.multiplayerMode ? "dedicated" : "solo"}</span>
      <span>Model: ${this.player.modelStatus}</span>
      <span>Traversal: ${this.traversalState.mode}${this.traversalState.active ? ` ${Math.round(this.traversalState.progress * 100)}%` : ""}</span>
      <span>Encounter: ${encounter.phase} | active ${encounter.activeEnemies}/${encounter.maxActiveEnemies}</span>
      <span>Encounter Last: ${encounter.lastEncounter}</span>
      <span>Enemy Hitboxes: ${this.enemyHitboxDebugVisible ? "visible" : "hidden"} | LOS ${this.enemyLosDebugVisible ? "visible" : "hidden"} | F7/F8 toggles</span>
      <span>POI Danger: ${encounter.poiThreats.map((poi) => `${poi.poiId} ${poi.rating}`).join(" | ")}</span>
      <span>Contract: ${this.contractManager.snapshot.active?.definition.title ?? "none"} | POI objectives ${this.poiObjectiveState.completedCount}/${this.poiObjectiveState.totalCount}</span>
      <span>Crater Run: ${this.selectedRaidDefinition.name} T${this.selectedRaidDefinition.tier} | Debug keys: F4 objective | F5 contract | F6 reward | F7 hitboxes | F8 LOS</span>
    `;
  }

  private get isRaidActive(): boolean {
    return this.raidScreen === "raid" && this.raidOutcome === "active" && this.playerHealth.snapshot.alive;
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
    if (this.raidScreen === "raid" && this.raidOutcome === "active" && this.playerHealth.snapshot.alive) {
      return this.raidBagOpen || this.inventoryManager.snapshot.activeContainer !== null ? "ui" : "gameplay";
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

    if (this.inventoryManager.snapshot.activeContainer !== null) {
      return "loot-panel";
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

    const extractionAvailable = this.raidTimerState.extractionUnlocked || this.objectiveWasCompleted;
    this.extractionState = this.extractionController.update(
      dt,
      this.gameplayInput,
      this.player.state.position,
      this.playerHealth.snapshot.recentDamage,
      extractionAvailable,
    );
    this.shipState = this.shipManager.updateExtractionReadiness(extractionAvailable);
    if (this.extractionState.extracting && !this.previousExtractionStarted) {
      this.contractManager.record({
        type: "extraction-started",
        zoneId: this.currentExtractionZoneId(),
      });
    }
    this.previousExtractionStarted = this.extractionState.extracting;

    const activeContainer = this.inventoryManager.snapshot.activeContainer;

    if (activeContainer) {
      this.handleLootPanelInput(activeContainer.id);
      return;
    }

    if (this.shipInRange && this.canRepairShip() && (this.gameplayInput.reloadPressed || this.gameplayInput.uiDropPressed)) {
      this.repairShip();
      return;
    }

    if (
      this.gameplayInput.interactPressed &&
      this.shipInRange &&
      !this.extractionState.insideZone &&
      !this.poiObjectiveManager.hasInteractTarget(this.player.state.position)
    ) {
      this.depositCargoToShip();
      return;
    }

    if (
      this.gameplayInput.interactPressed &&
      !this.extractionState.insideZone &&
      !this.poiObjectiveManager.hasInteractTarget(this.player.state.position)
    ) {
      const container = this.lootDirector.openNearbyContainer(this.player.state.position);

      if (container) {
        this.raidBagOpen = true;
        this.selectedLootIndex = 0;
        this.noiseSystem.emit("loot", this.player.state.position, this.environmentState.gameplay);
        this.inventoryManager.setActiveContainer(container);
        this.setInputMode("ui", "loot-panel");
        this.combatHud.showLootNotification(container.items.length > 0 ? "Loot cache opened" : "Cache empty");
      }
    }

    if (this.extractionState.completed) {
      this.outcomeItems = [...this.raidInventory.items, ...this.shipManager.cargoItems, ...this.survivedLoadoutItems];
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
      this.raidBagOpen = false;
      this.selectedRaidBagIndex = 0;
      this.selectedLootIndex = 0;
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
    this.raidInventory.setBonusSlots(this.calculateRaidBagBonusSlots());
    this.raidBagOpen = false;
    this.selectedRaidBagIndex = 0;
    this.selectedLootIndex = 0;
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

    if (container.items.length === 0) {
      this.closeLootPanel(containerId);
    }
  }

  private takeLootItem(containerId: string, itemIndex: number): void {
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

  private closeLootPanel(containerId: string): void {
    this.lootDirector.closeContainer(containerId);
    this.inventoryManager.setActiveContainer(null);
    this.inventoryManager.clearWarning();
    this.raidBagOpen = false;
    if (this.raidScreen === "raid" && this.raidOutcome === "active" && this.playerHealth.snapshot.alive) {
      this.setInputMode("gameplay", "gameplay");
      this.input.captureGameplayPointer();
    }
  }

  private isNearShipZone(): boolean {
    return Vector3.Distance(this.player.state.position, this.landedShip.cargoAccessPosition) <= this.landedShip.cargoAccessRadius;
  }

  private getShipPrompt(): string {
    if (!this.shipInRange) {
      return "";
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
    return this.shipInRange && this.canRepairShip() ? "R / X: Repair Ship" : "";
  }

  private getShipWarning(): string {
    if (!this.shipInRange) {
      return "";
    }

    if (this.shipState.landingQuality === "rough") {
      return "Rough landing: cargo handling degraded";
    }

    if (this.shipState.landingQuality === "damaged") {
      return "Damaged landing: cargo bay compromised";
    }

    return "Ship systems stable";
  }

  private depositCargoToShip(): void {
    const result = this.shipManager.depositFromRaidInventory(this.raidInventory);
    this.shipState = this.shipManager.state;
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

  private repairShip(): void {
    const result = this.shipManager.repair((quantity) => this.raidInventory.consume("scrap", quantity));
    this.shipState = this.shipManager.state;

    if (result.repaired) {
      this.activeRaidPrepScrapSpent += result.scrapCost;
      this.landedShip.applyShipState(this.shipState);
    }

    this.combatHud.showLootNotification(result.repaired
      ? `${result.message} | -${result.scrapCost} scrap`
      : result.message);
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
    const heavyCargo = this.shipManager.canStoreSpecialCargo() ? "Heavy cargo route stable." : "Heavy cargo route unavailable.";
    const risk = `Cargo risk ${this.formatShipCargoRisk().toLowerCase()}. Repair ${this.formatShipRepairStatus().toLowerCase()}.`;
    return cargo.length > 0
      ? `${this.shipState.statusLabel}. Ship cargo secured. ${risk} ${heavyCargo}`
      : `${this.shipState.statusLabel}. No ship cargo transferred. ${risk} ${heavyCargo}`;
  }

  private getResultContractsCompleted(contractRewardLabels: readonly string[]): string[] {
    const active = this.contractManager.snapshot.active;
    const labels = [...contractRewardLabels];

    if (active?.status === "ready-to-claim") {
      labels.push(`${active.definition.title} - Ready to submit at Faction Contracts`);
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
    this.coverController.reset();
    this.traversalController.reset();
    this.coverState = this.coverController.state;
    this.traversalState = this.traversalController.state;
    this.cameraRig.setCoverModifier({ active: false, peek: 0 });
    this.cameraRig.setTraversalLocked(false);
    this.input.releasePointerLock();
    this.loadingScreen.show("Returning to HQ", 1600);
    this.worldMap.setContractVariant(null, null);
    this.showMainMenu();
  }

  private hasRecoverableRaidLoot(): boolean {
    return this.raidInventory.items.length > 0 || this.survivedLoadoutItems.length > 0;
  }

  private startRaid(multiplayerMode = false): void {
    this.multiplayerMode = multiplayerMode;
    this.loadingScreen.show(`Preparing ${this.selectedRaidDefinition.name}`, 1600);
    this.loadoutManager.applyToLoadout(this.loadout, this.persistentStash.items);
    this.loadout.clampToStash(this.persistentStash.items);
    this.activeLoadout = this.loadout.snapshot;
    this.raidScreen = "raid";
    void playTychoStarMusic();
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
      this.showMainMenu();
      return;
    }

    this.combatHud.showLootNotification("Joined multiplayer room");
    this.startRaid(true);
  }

  private resetRaid(): void {
    this.raidOutcome = "active";
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
    this.raidBagOpen = false;
    this.selectedRaidBagIndex = 0;
    this.selectedLootIndex = 0;
    this.environmentState = this.environmentManager.randomizeForRaid(this.selectedRaidDefinition.tier);
    this.lootDirector.setRareLootChanceMultiplier(this.environmentState.gameplay.rareLootChanceMultiplier);
    this.shipState = this.shipManager.initializeForRaid();
    this.landedShip.applyShipState(this.shipState);
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
    this.targetDummy.reset(new Vector3(0, 0, 24));
    this.coverController.reset();
    this.coverState = this.coverController.state;
    this.traversalController.reset();
    this.traversalState = this.traversalController.state;
    this.visibilityToolManager.resetForRaid();
    this.tacticalToolManager.resetForRaid();
    this.tacticalToolState = this.tacticalToolManager.state;
    this.visibilityToolState = this.visibilityToolManager.state;
    this.noiseSystem.reset();
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
    this.combatHud.showLootNotification(`Landing ${this.shipState.landingQuality} | ${this.shipState.statusLabel}`);
    this.objectiveDirector.reset();
    this.objectiveState = this.objectiveDirector.state;
    this.poiObjectiveManager.reset(this.getActiveContractPoiObjectiveTarget());
    this.poiObjectiveState = this.poiObjectiveManager.state;
    this.objectiveWasCompleted = false;
    this.multiplayerExtractSent = false;
    this.multiplayerDeathSent = false;
    this.pvpKillsThisRaid = 0;
    this.enemiesEliminatedThisRaid = 0;
    this.poiObjectiveOutcomesThisRaid = [];
    this.contractObjectiveCompletedThisRaid = false;
    this.enemyDirector.dispose();
    this.enemyDirector = new EnemyDirector(this.scene, this.player.root, this.playerHealth, this.enemyDirectorOptions);
    this.enemyDirector.setHitboxDebugVisible(this.enemyHitboxDebugVisible);
    this.enemyDirector.setLosDebugVisible(this.enemyLosDebugVisible);
    this.consumePoiObjectiveSpawnRequests();
  }

  private updateActiveExtractionZones(): void {
    const extractionAvailable = this.raidTimerState.extractionUnlocked || this.objectiveWasCompleted;
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

  private getShipExtractionZone(): ExtractionZoneDefinition {
    return {
      id: "personal-ship-return",
      name: "Personal Ship Return",
      center: this.landedShip.launchAccessPosition,
      radius: this.landedShip.launchAccessRadius,
    };
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
      this.combatHud.showLootNotification("Objective complete");
    }
  }

  private updatePoiObjectives(dt: number): void {
    this.poiObjectiveState = this.poiObjectiveManager.update(
      dt,
      this.gameplayInput,
      this.player.state,
      this.enemyDirector.debugStates,
    );
    this.consumePoiObjectiveSpawnRequests();

    for (const event of this.poiObjectiveManager.consumeEvents()) {
      if (event.type === "completed") {
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

    const fullAlert = this.enemyDirector.debugStates.some((enemy) => {
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
    this.landedShip.setEnabled(false);
    void playMenuMusic();
    this.menu.classList.remove("hidden");
    const hqState = this.hqManager.snapshot;
    const credits = this.vendorManager.snapshot.credits;
    const scrap = this.getStashQuantity("scrap");
    const rareCores = this.getStashQuantity("rare-core");
    const dogTags = this.getStashQuantity("dog-tag");
    const level = this.persistentStash.raidLevel;
    const totalXp = this.loopProfile.xp;
    const stationCards = hqStations.map((station) => `
      <button
        type="button"
        class="hq-station-card ${hqState.selectedStationId === station.id ? "active" : ""}"
        data-action="${station.action}"
        data-accent="${station.accent}"
      >
        <span>${station.eyebrow}</span>
        <strong>${station.title}</strong>
        <small>${station.description}</small>
      </button>
    `).join("");
    this.menuContent.innerHTML = `
      <div class="main-menu-actions hq-quick-actions">
        <button type="button" data-action="start">Crater Runs</button>
        <button type="button" data-action="multiplayer-start">Multiplayer Crater Run</button>
        <button type="button" data-action="hq-loadout">Loadout</button>
        <button type="button" data-action="vendors">Faction Vendors</button>
        <button type="button" data-action="settings">Settings</button>
      </div>
      <div class="hq-screen">
        <header class="hq-hero">
          <div>
            <span>Lunar Habitat</span>
            <h1>${themeConfig.brand.title}</h1>
            <p>${themeConfig.brand.subtitle}</p>
            <p>${themeConfig.brand.menuFlavor.replaceAll("\n", "<br>")}</p>
          </div>
          <button type="button" data-action="settings">Settings</button>
        </header>
        <section class="hq-status-strip">
          <div><span>Credits</span><strong>${credits}</strong></div>
          <div><span>Regolith Scrap</span><strong>${scrap}</strong></div>
          <div><span>Helium-3</span><strong>${rareCores}</strong></div>
          <div><span>Faction Tags</span><strong>${dogTags}</strong></div>
          <div><span>Level</span><strong>${level}</strong></div>
          <div><span>XP</span><strong>${totalXp}</strong></div>
          <div><span>Reputation</span><strong>${this.reputation.value}</strong></div>
          <div><span>Multiplayer</span><strong>${this.multiplayerClient.snapshot.status}</strong></div>
        </section>
        <section class="hq-preview-panel">
          <h2>Current Crater Runner</h2>
          ${this.renderHQPlayerPreview()}
          <div>
            <span>Outfit</span><strong>${this.cosmeticManager.getEquippedName("outfit")}</strong>
            <span>Primary</span><strong>${this.loadout.primaryWeaponName}</strong>
            <span>Last Station</span><strong>${this.formatHQStation(hqState.selectedStationId)}</strong>
          </div>
        </section>
        <section class="hq-station-grid">
          ${stationCards}
        </section>
        <section class="hq-intel-ticker">
          <strong>Intel Feed</strong>
          <span>${this.environmentState.label} crater conditions queued. ${themeConfig.enemyCollectiveName} movement is rising below the regolith. ${this.renderMultiplayerStatusLine()}</span>
        </section>
      </div>
      <div class="main-menu-actions debug-actions">
        <button type="button" data-action="debug-grant-resources">Grant Test Resources</button>
        <button type="button" data-action="debug-reset-save">Reset Save / Debug</button>
      </div>
    `;
    this.bindMenuButtons();
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
            <p>Pick oxygen pressure, Umbra activity, lunar hazards, loot quality, and extraction risk before deployment.</p>
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

  private renderMultiplayerStatusLine(): string {
    const status = this.multiplayerClient.snapshot;
    const room = status.roomId ? `Room ${status.roomId}` : "No room";
    const ping = status.pingMs === null ? "ping --" : `ping ${Math.round(status.pingMs)}ms`;
    return `${status.status} | ${room} | ${status.playerCount}/${status.maxPlayers} runners | ${status.lifecycle} | ${ping}`;
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
      <div class="raider-preview hq-raider-preview" aria-label="HQ Crater Runner preview" style="${style}">
        <div class="preview-backpack"></div>
        <div class="preview-head"><span></span></div>
        <div class="preview-torso"><i></i></div>
        <div class="preview-arm left"></div>
        <div class="preview-arm right"></div>
        <div class="preview-leg left"></div>
        <div class="preview-leg right"></div>
        <div class="preview-weapon"></div>
      </div>
    `;
  }

  private applyCurrentCosmetics(): void {
    const palette = this.cosmeticManager.getPalette();
    this.player.applyCosmeticPalette(palette);
    this.weaponController.applyWrapColor(palette.accent);
  }

  private formatHQStation(stationId: HQStationId): string {
    return hqStations.find((station) => station.id === stationId)?.title ?? "Crater Runs";
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
            <p>Faction leads, crater hazards, extraction routes, and Umbra activity forecasts.</p>
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
          <p>${this.selectedRaidDefinition.difficultyLabel} threat. Oxygen pressure, radiation risk, Umbra presence, loot tables, and contract payout scale from the selected crater tier.</p>
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
          <button type="button" data-action="inspect">Inspect Weapon</button>
          <button type="button" data-action="workbench">Fabrication Bench</button>
          <button type="button" data-action="settings">Settings</button>
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
  }

  private renderGearLoadoutScreen(): string {
    const loadout = this.loadout.snapshot;
    const manager = this.loadoutManager.snapshot;
    const filterTabs = loadoutFilters
      .map((filter) => `
        <button type="button" class="${manager.filter === filter ? "active" : ""}" data-action="loadout-filter-${filter}">
          ${this.formatLoadoutFilter(filter)}
        </button>
      `)
      .join("");
    const stashRows = this.renderLoadoutStashRows(manager.filter);
    const selectedDetails = this.renderLoadoutItemDetails(manager.selectedType);
    const gearSlots = this.renderEquippedGearSlots(loadout);
    const raidBag = this.renderRaidBag();

    return `
      <div class="loadout-screen">
        ${this.renderLoadoutHero()}
        ${this.renderPlayerPreviewPanel()}
        <section class="equipped-gear-panel">
          <h3>Equipped Gear</h3>
          <div class="gear-slot-grid">${gearSlots}</div>
        </section>
        <section class="stash-inventory-panel">
          <h3>Habitat Stash</h3>
          <nav>${filterTabs}</nav>
          <div class="loadout-stash-grid">${stashRows}</div>
        </section>
        <section class="raid-bag-panel">
          <h3>EVA Pack</h3>
          <p>${this.loadoutManager.raidBagUsedSlots}/${this.loadoutManager.raidBagCapacity} slots at risk next Crater Run</p>
          <div class="raid-bag-grid">${raidBag}</div>
        </section>
        <section class="item-details-panel">
          <h3>Item Details</h3>
          ${selectedDetails}
        </section>
      </div>
    `;
  }

  private renderCosmeticsLoadoutScreen(): string {
    const state = this.cosmeticManager.snapshot;
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
        ${this.renderPlayerPreviewPanel(true)}
        <section class="equipped-gear-panel cosmetic-equipped-panel">
          <h3>Style Locker</h3>
          <div class="cosmetic-equipped-list">${equippedRows}</div>
        </section>
        <section class="stash-inventory-panel cosmetic-browser-panel">
          <h3>${cosmeticCategoryLabels[state.selectedCategory]}</h3>
          <nav>${categoryTabs}</nav>
          <div class="cosmetic-grid">${cosmetics}</div>
        </section>
        <section class="raid-bag-panel cosmetic-rules-panel">
          <h3>Favorites</h3>
          <button type="button" data-action="cosmetics-randomize">Randomize Loadout</button>
          <button type="button" data-action="cosmetics-favorite">Favorite Placeholder</button>
          <p>Cosmetics never affect stats, are never lost in a Crater Run, and persist through death.</p>
          <p>Armor and backpack gear still control protection and capacity.</p>
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

  private renderPlayerPreviewPanel(cosmeticMode = false): string {
    const manager = this.loadoutManager.snapshot;
    const palette = this.cosmeticManager.getPalette();
    const rotation = this.cosmeticManager.snapshot.previewRotation;
    const style = [
      `--preview-hoodie: ${colorToCss(palette.hoodie)}`,
      `--preview-dark: ${colorToCss(palette.jacketDark)}`,
      `--preview-vest: ${colorToCss(palette.vest)}`,
      `--preview-visor: ${colorToCss(palette.visor)}`,
      `--preview-glow: ${colorToCss(palette.glow)}`,
      `--preview-accent: ${colorToCss(palette.accent)}`,
      `--preview-rotation: ${rotation}deg`,
    ].join("; ");

    return `
      <section class="player-preview-panel">
        <h3>Crater Runner Preview</h3>
        <div class="raider-preview" aria-label="Stylized Crater Runner preview" style="${style}">
          <div class="preview-backpack"></div>
          <div class="preview-head"><span></span></div>
          <div class="preview-torso"><i></i></div>
          <div class="preview-arm left"></div>
          <div class="preview-arm right"></div>
          <div class="preview-leg left"></div>
          <div class="preview-leg right"></div>
          <div class="preview-weapon"></div>
        </div>
        ${cosmeticMode ? `
          <div class="preview-actions">
            <button type="button" data-action="cosmetic-preview-left">Rotate Left</button>
            <button type="button" data-action="cosmetic-preview-right">Rotate Right</button>
          </div>
        ` : ""}
        <div class="preview-meta">
          <span>Primary</span><strong>${this.loadout.primaryWeaponName}</strong>
          <span>Sidearm</span><strong>${weaponDefinitions[this.loadout.snapshot.sidearmWeaponId].name}</strong>
          <span>EVA Pack</span><strong>${manager.backpackType ? "Pack Expander" : "Starter Pack"}</strong>
          <span>Outfit</span><strong>${this.cosmeticManager.getEquippedName("outfit")}</strong>
        </div>
      </section>
    `;
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
      return `
        <div class="gear-slot" style="--rarity-color: ${color}">
          <button type="button" data-action="${type ? `loadout-select-${type}` : "noop"}">
            <span>${equipmentSlotLabels[slot]}</span>
            <strong>${label}</strong>
            ${locked ? "<small>Free starter</small>" : `<small>${definition?.rarity ?? "empty"}</small>`}
          </button>
          ${!locked ? `<button type="button" data-action="loadout-unequip-${slot}">Unequip</button>` : ""}
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

    return rows || `<span class="empty-loadout-list">Nothing in this filter yet</span>`;
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

  private renderLoadoutItemDetails(type: LootType | null): string {
    if (!type) {
      return `<p>Select stash gear to inspect, equip, pack, or discard.</p>`;
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

    return `
      <article class="loadout-details-card" style="--rarity-color: ${color}">
        <strong>${definition.label}</strong>
        <span>${definition.rarity.toUpperCase()} ${definition.category}</span>
        <p>${definition.description}</p>
        <div><span>Use</span><strong>${definition.use}</strong></div>
        <div><span>Value</span><strong>${definition.value}</strong></div>
        <div><span>Carry Size</span><strong>${definition.slots} slot${definition.slots > 1 ? "s" : ""}</strong></div>
        ${stats}
        ${attachmentStats}
        <em>Items brought into a Crater Run are lost on death unless they are free starter gear.</em>
        <footer>
          <button type="button" data-action="loadout-equip-selected">Equip</button>
          <button type="button" data-action="loadout-bag-selected">Move to EVA Pack</button>
          <button type="button" data-action="loadout-discard-selected">Discard</button>
        </footer>
      </article>
    `;
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

  private showInspectWeaponMenu(): void {
    this.raidScreen = "inspect";
    this.loadout.clampToStash(this.persistentStash.items);
    const weaponId = this.resolveInspectedWeaponId();

    if (!weaponId) {
      this.menuContent.innerHTML = `
        <div class="inspect-screen empty">
          <header class="inspect-header">
            <div>
              <span>Weapon Bench</span>
              <h2>No Weapons Available</h2>
              <p>No weapons available. Find or craft weapons from Crater Runs or the Fabrication Bench.</p>
            </div>
            <button type="button" data-action="loadout">Back</button>
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
    const selector = this.renderInspectWeaponSelector(weaponId);
    const compareWeaponId = weaponId === loadout.sidearmWeaponId
      ? loadout.primaryWeaponId
      : loadout.primaryWeaponId ?? loadout.sidearmWeaponId;

    this.menuContent.innerHTML = `
      <div class="inspect-screen" style="--rarity-color: ${rarityColor}">
        <header class="inspect-header">
          <div>
            <span>Weapon Bench</span>
            <h2>${weapon.name}</h2>
            <p><b>${this.capitalize(definition.rarity)}</b> ${definition.category} | ${equippedStatus}</p>
          </div>
          <div class="inspect-wallet">
            <span>Credits <strong>${credits}</strong></span>
            <span>Regolith Scrap <strong>${scrap}</strong></span>
            <span>Weapon Parts <strong>${weaponParts}</strong></span>
          </div>
          <button type="button" data-action="loadout">Back</button>
        </header>
        ${selector}
        <section class="inspect-layout">
          ${this.renderWeaponPreviewPanel(weapon, durability, equippedStatus)}
          ${this.renderWeaponStatPanel(weapon, durability)}
          ${this.renderWeaponAttachmentPanel()}
          ${this.renderWeaponUpgradePanel(weaponId, scrap, weaponParts)}
          ${this.renderWeaponRepairPanel(weaponId, durability, scrap)}
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

  private resolveInspectedWeaponId(): WeaponId | null {
    const selectedType = this.loadoutManager.snapshot.selectedType;
    const selectedWeapon = selectedType ? weaponIdFromLootType(selectedType) : null;
    const equipped = this.loadout.snapshot.primaryWeaponId ?? this.loadout.snapshot.sidearmWeaponId;
    const stashWeapon = this.getAvailableWeaponIds()[0] ?? null;
    const candidate = this.inspectedWeaponId ?? selectedWeapon ?? equipped ?? stashWeapon;

    if (candidate && this.weaponExistsForInspect(candidate)) {
      return candidate;
    }

    if (candidate) {
      console.warn(`InspectWeapon: invalid or unavailable weapon id "${candidate}"; falling back.`);
    }

    return stashWeapon ?? equipped ?? null;
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

  private renderWeaponUpgradePanel(weaponId: WeaponId, scrap: number, weaponParts: number): string {
    const rows = weaponUpgradeCategories.map((category) => {
      const tier = this.weaponUpgrades[weaponId][category.id] ?? 0;
      const maxed = tier >= maxWeaponUpgradeTier;
      const scrapCost = this.getWeaponUpgradeCost(category.id, tier).scrap;
      const partsCost = this.getWeaponUpgradeCost(category.id, tier).parts;
      const affordable = scrap >= scrapCost && weaponParts >= partsCost;
      return `
        <article class="upgrade-row ${maxed ? "maxed" : affordable ? "" : "locked"}">
          <div>
            <span>${category.label}</span>
            <strong>Tier ${tier}/${maxWeaponUpgradeTier}</strong>
            <small>${maxed ? "Maxed" : `Next: ${category.effect}`}</small>
          </div>
          <em>${maxed ? "Fully tuned" : `${scrapCost} scrap / ${partsCost} parts`}</em>
          <button type="button" data-action="inspect-upgrade-${category.id}" ${maxed ? "disabled" : ""}>${maxed ? "Maxed" : affordable ? "Upgrade" : "Locked"}</button>
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
    scrap: number,
  ): string {
    const repairCost = this.weaponController.getFullRepairCost(weaponId);
    const canRepair = repairCost > 0 && scrap >= repairCost;
    const nextJam = repairCost > 0 ? 0 : durability.jamChance;

    return `
      <section class="inspect-card repair-panel ${durability.jamWarning ? "warning" : ""}">
        <h3>Repair</h3>
        ${this.renderStatBar("Current Durability", durability.durability, 100, `${Math.round(durability.durability)}%`)}
        <p>${durability.jamWarning ? "Low durability is raising jam risk." : "Weapon is serviceable for the next Crater Run."}</p>
        <div class="inspect-meta-grid">
          <div><span>Repair Cost</span><strong>${repairCost} Scrap</strong></div>
          <div><span>Jam Preview</span><strong>${Math.round(durability.jamChance * 100)}% -> ${Math.round(nextJam * 100)}%</strong></div>
        </div>
        <button type="button" data-action="inspect-repair-${weaponId}" ${repairCost <= 0 ? "disabled" : ""}>${repairCost <= 0 ? "Fully Repaired" : canRepair ? "Repair Weapon" : "Need Scrap"}</button>
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

  private getWeaponUpgradeCost(category: WeaponUpgradeCategory, currentTier: number): { scrap: number; parts: number } {
    const definition = weaponUpgradeCategories.find((item) => item.id === category);

    if (!definition) {
      return { scrap: 999, parts: 999 };
    }

    const nextTier = currentTier + 1;
    return {
      scrap: definition.scrapBase * nextTier,
      parts: definition.partsBase * nextTier,
    };
  }

  private upgradeInspectedWeapon(category: WeaponUpgradeCategory): string {
    const weaponId = this.inspectedWeaponId ?? this.resolveInspectedWeaponId();

    if (!weaponId) {
      return "No weapon selected";
    }

    const currentTier = this.weaponUpgrades[weaponId][category] ?? 0;

    if (currentTier >= maxWeaponUpgradeTier) {
      return "Upgrade already maxed";
    }

    const cost = this.getWeaponUpgradeCost(category, currentTier);

    if (this.getStashQuantity("scrap") < cost.scrap) {
      return "Not enough scrap";
    }

    if (this.getStashQuantity("weapon-parts") < cost.parts) {
      return "Not enough weapon parts";
    }

    this.persistentStash.remove("scrap", cost.scrap);
    this.persistentStash.remove("weapon-parts", cost.parts);
    this.weaponUpgrades = {
      ...this.weaponUpgrades,
      [weaponId]: {
        ...this.weaponUpgrades[weaponId],
        [category]: currentTier + 1,
      },
    };
    this.saveWeaponUpgrades();
    return `${weaponDefinitions[weaponId].name} ${this.capitalize(category)} upgraded to tier ${currentTier + 1}`;
  }

  private refreshInspectWeaponMenuPreservingScroll(): void {
    const scrollTop = this.menuContent.scrollTop;
    this.showInspectWeaponMenu();
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
      const outputLabel = recipe.outputQuantity > 1
        ? `${recipe.outputQuantity} ${definition.label}`
        : definition.label;

      return `
        <article class="crafting-card ${canAfford ? "" : "unaffordable"} ${unlocked ? "" : "locked"}" style="--rarity-color: ${rarityColor}">
          <strong>${recipe.name}</strong>
          <span>${unlocked ? outputLabel : `Requires Fabrication Lv. ${recipe.requiredWorkbenchLevel}`}</span>
          <small>${recipe.description}</small>
          <footer>
            <em>${recipe.scrapCost} regolith scrap</em>
            <button type="button" data-action="craft-${recipe.id}" ${unlocked ? "" : "disabled"}>${unlocked ? canAfford ? "Craft" : "Need Scrap" : "Locked"}</button>
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

    const valueLabel = input.parentElement?.querySelector("[data-setting-value]");
    if (valueLabel) {
      valueLabel.textContent = input instanceof HTMLInputElement && input.type === "checkbox"
        ? input.checked ? "On" : "Off"
        : String(value);
    }
  };

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
        <strong data-setting-value>${value}</strong>
      </label>
    `;
  }

  private toggleSetting(label: string, path: string, value: boolean): string {
    return `
      <label class="settings-row">
        <span>${label}</span>
        <input type="checkbox" ${value ? "checked" : ""} data-setting="${path}">
        <strong data-setting-value>${value ? "On" : "Off"}</strong>
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

    if (this.isPurchaseLikeAction(action) && !this.consumePurchaseActionClick()) {
      return;
    }

    if (action === "start") {
      this.hqManager.open("raid-terminal");
      this.showRaidSelectMenu();
    } else if (action === "multiplayer-start") {
      void this.startMultiplayerRaid();
    } else if (action?.startsWith("launch-raid-")) {
      const raidId = action.replace("launch-raid-", "") as RaidTierId;
      this.selectedRaidDefinition = raidDefinitionById[raidId] ?? defaultRaidDefinition;
      this.startRaid(false);
    } else if (action === "noop") {
      return;
    } else if (action === "hq-loadout") {
      this.hqManager.open("loadout-locker");
      this.loadoutTab = "gear";
      this.showLoadoutMenu();
    } else if (action === "hq-style") {
      this.hqManager.open("style-locker");
      this.loadoutTab = "cosmetics";
      this.loadingScreen.flash("Opening Style Locker");
      this.showLoadoutMenu();
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
        );
        this.recordPrepScrapSpend(previousScrapSpent);
        this.combatHud.showLootNotification(result.ok ? "Crafted" : "Not enough Regolith Scrap");
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
        this.loadoutManager.select(this.selectedStashType);
        this.combatHud.showLootNotification(this.loadoutManager.equipSelected(this.loadout, this.persistentStash.items));
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
      this.showLoadoutMenu();
    } else if (action === "loadout-tab-cosmetics") {
      this.loadoutTab = "cosmetics";
      this.loadingScreen.flash("Opening Style Locker");
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
      this.showInspectWeaponMenu();
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
    } else if (action?.startsWith("inspect-repair-")) {
      const weaponId = action.replace("inspect-repair-", "") as WeaponId;
      this.inspectedWeaponId = weaponId;
      const previousScrapSpent = this.craftingManager.snapshot.scrapSpent;
      const result = this.weaponController.repairWeaponFully(
        weaponId,
        (quantity) => this.persistentStash.remove("scrap", quantity),
      );
      if (result.repaired) {
        this.craftingManager.recordWeaponRepair(result.scrapCost, result.message);
        this.recordPrepScrapSpend(previousScrapSpent);
      }
      this.combatHud.showLootNotification(result.repaired ? "Repaired" : result.message);
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
    } else if (action?.startsWith("loadout-select-")) {
      this.loadoutManager.select(action.replace("loadout-select-", "") as LootType);
      this.showLoadoutMenu();
    } else if (action === "loadout-equip-selected") {
      this.combatHud.showLootNotification(this.loadoutManager.equipSelected(this.loadout, this.persistentStash.items));
      this.showLoadoutMenu();
    } else if (action === "loadout-bag-selected") {
      this.combatHud.showLootNotification(this.loadoutManager.moveSelectedToRaidBag(this.persistentStash.items));
      this.loadoutManager.applyToLoadout(this.loadout, this.persistentStash.items);
      this.showLoadoutMenu();
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
    onLootDropped: (event: LootEvent) => void;
    onPlayerHit: (enemyType: EnemyType) => void;
    onEnemyKilled: (enemyType: EnemyType) => void;
  } {
    return {
      difficultyLevel: this.persistentStash.raidLevel + this.selectedRaidDefinition.difficultyLevelBonus,
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
