import type { GameSettings, SettingsManager } from "../settings/SettingsManager";

export type ControllerDebugState = Readonly<{
  connected: boolean;
  name: string | null;
  activeButtons: number[];
  leftTrigger: number;
  rightTrigger: number;
  axes: [number, number, number, number];
  actions: {
    jump: boolean;
    fire: boolean;
    ads: boolean;
    crouch: boolean;
    sprint: boolean;
    reload: boolean;
    clearJam: boolean;
    shoulderSwap: boolean;
    interact: boolean;
    cover: boolean;
    peekLeft: boolean;
    peekRight: boolean;
    flashlight: boolean;
  };
}>;

export type ActiveInputMethod = "keyboardMouse" | "controller";
export type InputMode = "gameplay" | "ui";

export type MouseDebugState = Readonly<{
  inputMode: InputMode;
  pointerLocked: boolean;
  mouseCaptured: boolean;
  lastMouseAction: string;
  lastButtonDown: number | null;
  lastButtonUp: number | null;
  fireHeld: boolean;
  adsHeld: boolean;
  wheelDelta: number;
  elementUnderCursor: string;
  canvasPointerDownFired: boolean;
}>;

export type InputSnapshot = Readonly<{
  moveX: number;
  moveZ: number;
  lookX: number;
  lookY: number;
  zoomDelta: number;
  firePressed: boolean;
  fireHeld: boolean;
  jumpPressed: boolean;
  reloadPressed: boolean;
  takeAllPressed: boolean;
  raidBagTogglePressed: boolean;
  uiConfirmPressed: boolean;
  uiBackPressed: boolean;
  uiDropPressed: boolean;
  meleePressed: boolean;
  clearJamPressed: boolean;
  clearJamHeld: boolean;
  shoulderSwapPressed: boolean;
  interactPressed: boolean;
  interactHeld: boolean;
  coverPressed: boolean;
  peekLeftHeld: boolean;
  peekRightHeld: boolean;
  toggleFlashlightPressed: boolean;
  toggleLaserPressed: boolean;
  toggleNightVisionPressed: boolean;
  useMedkitPressed: boolean;
  weaponSlotPressed: 1 | 2 | 3 | null;
  weaponSwapPressed: boolean;
  restartPressed: boolean;
  returnToHqHeld: boolean;
  crouchHeld: boolean;
  sprintHeld: boolean;
  adsHeld: boolean;
  controllerConnected: boolean;
  controllerName: string | null;
  controllerDebug: ControllerDebugState;
  activeInputMethod: ActiveInputMethod;
}>;

type GamepadState = Readonly<{
  moveX: number;
  moveZ: number;
  lookX: number;
  lookY: number;
  firePressed: boolean;
  fireHeld: boolean;
  jumpPressed: boolean;
  reloadPressed: boolean;
  takeAllPressed: boolean;
  raidBagTogglePressed: boolean;
  uiConfirmPressed: boolean;
  uiBackPressed: boolean;
  uiDropPressed: boolean;
  meleePressed: boolean;
  clearJamPressed: boolean;
  clearJamHeld: boolean;
  shoulderSwapPressed: boolean;
  interactPressed: boolean;
  interactHeld: boolean;
  coverPressed: boolean;
  peekLeftHeld: boolean;
  peekRightHeld: boolean;
  toggleFlashlightPressed: boolean;
  useMedkitPressed: boolean;
  weaponSwapPressed: boolean;
  crouchHeld: boolean;
  sprintHeld: boolean;
  adsPressed: boolean;
  adsHeld: boolean;
  debug: ControllerDebugState;
}>;

export class InputController {
  private readonly heldKeys = new Set<string>();
  private readonly heldMouseButtons = new Set<number>();
  private readonly previousGamepadButtons = new Set<number>();
  private lookX = 0;
  private lookY = 0;
  private zoomDelta = 0;
  private fireQueued = false;
  private adsQueued = false;
  private jumpQueued = false;
  private reloadQueued = false;
  private takeAllQueued = false;
  private raidBagToggleQueued = false;
  private uiConfirmQueued = false;
  private uiBackQueued = false;
  private uiDropQueued = false;
  private meleeQueued = false;
  private clearJamQueued = false;
  private shoulderSwapQueued = false;
  private interactQueued = false;
  private coverQueued = false;
  private flashlightQueued = false;
  private laserQueued = false;
  private nightVisionQueued = false;
  private useMedkitQueued = false;
  private weaponSlotQueued: 1 | 2 | 3 | null = null;
  private weaponSwapQueued = false;
  private restartQueued = false;
  private adsToggleActive = false;
  private crouchToggleActive = false;
  private previousRawCrouchHeld = false;
  private controllerConnected = false;
  private controllerName: string | null = null;
  private activeInputMethod: ActiveInputMethod = "keyboardMouse";
  private inputMode: InputMode = "gameplay";
  private lastMouseAction = "none";
  private lastMouseButtonDown: number | null = null;
  private lastMouseButtonUp: number | null = null;
  private lastWheelDelta = 0;
  private lastPointerClientX = 0;
  private lastPointerClientY = 0;
  private canvasPointerDownFired = false;
  private suppressNextMouseDownButton: number | null = null;
  private suppressNextMouseUpButton: number | null = null;
  private currentSnapshot: InputSnapshot = {
    moveX: 0,
    moveZ: 0,
    lookX: 0,
    lookY: 0,
    zoomDelta: 0,
    firePressed: false,
    fireHeld: false,
    jumpPressed: false,
    reloadPressed: false,
    takeAllPressed: false,
    raidBagTogglePressed: false,
    uiConfirmPressed: false,
    uiBackPressed: false,
    uiDropPressed: false,
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
    restartPressed: false,
    returnToHqHeld: false,
    crouchHeld: false,
    sprintHeld: false,
    adsHeld: false,
    controllerConnected: false,
    controllerName: null,
    controllerDebug: this.emptyControllerDebug,
    activeInputMethod: "keyboardMouse",
  };

  public constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly settingsManager: SettingsManager,
  ) {
    canvas.tabIndex = 0;
    canvas.addEventListener("click", this.requestPointerLock);
    canvas.addEventListener("pointerdown", this.handleCanvasPointerDown);
    canvas.addEventListener("pointerup", this.handleCanvasPointerUp);
    canvas.addEventListener("wheel", this.handleCanvasWheel, { passive: false });
    canvas.addEventListener("contextmenu", this.preventContextMenu);
    window.addEventListener("keydown", this.handleKeyDown);
    window.addEventListener("keyup", this.handleKeyUp);
    window.addEventListener("mousemove", this.handleMouseMove);
    window.addEventListener("mousedown", this.handleMouseDown);
    window.addEventListener("mouseup", this.handleMouseUp);
    window.addEventListener("wheel", this.handleWheel, { passive: false });
    window.addEventListener("gamepadconnected", this.handleGamepadConnection);
    window.addEventListener("gamepaddisconnected", this.handleGamepadConnection);
  }

  public get snapshot(): InputSnapshot {
    return this.currentSnapshot;
  }

  public update(dt: number): void {
    const settings = this.settingsManager.snapshot;
    const bindings = settings.controls.keyboardBindings;
    const gamepad = this.getActiveGamepad();
    const gamepadState = this.readGamepadState(gamepad, dt, settings);
    const keyboardX = Number(this.isHeld(bindings.right)) - Number(this.isHeld(bindings.left));
    const keyboardZ = Number(this.isHeld(bindings.forward)) - Number(this.isHeld(bindings.backward));
    const move = this.clampMove(keyboardX + gamepadState.moveX, keyboardZ + gamepadState.moveZ);
    const keyboardAdsHeld = this.isHeldMouseButton(2);
    const rawAdsHeld = keyboardAdsHeld || gamepadState.adsHeld;
    const rawAdsPressed = this.wasMouseButtonPressed(2) || gamepadState.adsPressed;
    const rawCrouchHeld = this.isHeld(bindings.crouch) || gamepadState.crouchHeld;
    const controllerActive = this.isGamepadStateActive(gamepadState);

    if (controllerActive) {
      this.activeInputMethod = "controller";
    }

    if (!settings.gameplay.holdAds && rawAdsPressed) {
      this.adsToggleActive = !this.adsToggleActive;
    }

    if (!settings.gameplay.holdCrouch && rawCrouchHeld && !this.previousRawCrouchHeld) {
      this.crouchToggleActive = !this.crouchToggleActive;
    }
    this.previousRawCrouchHeld = rawCrouchHeld;

    this.currentSnapshot = {
      moveX: move.x,
      moveZ: move.z,
      lookX: this.lookX + gamepadState.lookX,
      lookY: this.lookY + gamepadState.lookY,
      zoomDelta: this.zoomDelta,
      firePressed: this.fireQueued || gamepadState.firePressed,
      fireHeld: this.isHeldMouseButton(0) || gamepadState.fireHeld,
      jumpPressed: this.jumpQueued || gamepadState.jumpPressed,
      reloadPressed: this.reloadQueued || gamepadState.reloadPressed,
      takeAllPressed: this.takeAllQueued || gamepadState.takeAllPressed,
      raidBagTogglePressed: this.raidBagToggleQueued || gamepadState.raidBagTogglePressed,
      uiConfirmPressed: this.uiConfirmQueued || gamepadState.uiConfirmPressed,
      uiBackPressed: this.uiBackQueued || gamepadState.uiBackPressed,
      uiDropPressed: this.uiDropQueued || gamepadState.uiDropPressed,
      meleePressed: this.meleeQueued || gamepadState.meleePressed,
      clearJamPressed: this.clearJamQueued || gamepadState.clearJamPressed,
      clearJamHeld: this.isHeld(bindings.clearJam) || gamepadState.clearJamHeld,
      shoulderSwapPressed: this.shoulderSwapQueued || gamepadState.shoulderSwapPressed,
      interactPressed: this.interactQueued || gamepadState.interactPressed,
      interactHeld: this.isHeld(bindings.interact) || gamepadState.interactHeld,
      coverPressed: this.coverQueued || gamepadState.coverPressed,
      peekLeftHeld: this.isHeld(bindings.peekLeft) || gamepadState.peekLeftHeld,
      peekRightHeld: this.isHeld(bindings.peekRight) || gamepadState.peekRightHeld,
      toggleFlashlightPressed: this.flashlightQueued || gamepadState.toggleFlashlightPressed,
      toggleLaserPressed: this.laserQueued,
      toggleNightVisionPressed: this.nightVisionQueued,
      useMedkitPressed: this.useMedkitQueued || gamepadState.useMedkitPressed,
      weaponSlotPressed: this.weaponSlotQueued,
      weaponSwapPressed: this.weaponSwapQueued || gamepadState.weaponSwapPressed,
      restartPressed: this.restartQueued,
      returnToHqHeld: this.isHeld(bindings.restart) || gamepadState.interactHeld,
      crouchHeld: settings.gameplay.holdCrouch ? rawCrouchHeld : this.crouchToggleActive,
      sprintHeld: this.isHeld(bindings.sprint) || gamepadState.sprintHeld,
      adsHeld: settings.gameplay.holdAds ? rawAdsHeld : this.adsToggleActive,
      controllerConnected: this.controllerConnected,
      controllerName: this.controllerName,
      controllerDebug: gamepadState.debug,
      activeInputMethod: this.activeInputMethod,
    };

    this.lookX = 0;
    this.lookY = 0;
    this.zoomDelta = 0;
    this.fireQueued = false;
    this.adsQueued = false;
    this.jumpQueued = false;
    this.reloadQueued = false;
    this.takeAllQueued = false;
    this.raidBagToggleQueued = false;
    this.uiConfirmQueued = false;
    this.uiBackQueued = false;
    this.uiDropQueued = false;
    this.meleeQueued = false;
    this.clearJamQueued = false;
    this.shoulderSwapQueued = false;
    this.interactQueued = false;
    this.coverQueued = false;
    this.flashlightQueued = false;
    this.laserQueued = false;
    this.nightVisionQueued = false;
    this.useMedkitQueued = false;
    this.weaponSlotQueued = null;
    this.weaponSwapQueued = false;
    this.restartQueued = false;
  }

  public dispose(): void {
    this.canvas.removeEventListener("click", this.requestPointerLock);
    this.canvas.removeEventListener("pointerdown", this.handleCanvasPointerDown);
    this.canvas.removeEventListener("pointerup", this.handleCanvasPointerUp);
    this.canvas.removeEventListener("wheel", this.handleCanvasWheel);
    this.canvas.removeEventListener("contextmenu", this.preventContextMenu);
    window.removeEventListener("keydown", this.handleKeyDown);
    window.removeEventListener("keyup", this.handleKeyUp);
    window.removeEventListener("mousemove", this.handleMouseMove);
    window.removeEventListener("mousedown", this.handleMouseDown);
    window.removeEventListener("mouseup", this.handleMouseUp);
    window.removeEventListener("wheel", this.handleWheel);
    window.removeEventListener("gamepadconnected", this.handleGamepadConnection);
    window.removeEventListener("gamepaddisconnected", this.handleGamepadConnection);
  }

  public releasePointerLock(): void {
    if (document.pointerLockElement === this.canvas) {
      void document.exitPointerLock();
    }
  }

  public setInputMode(mode: "gameplay" | "ui"): void {
    this.inputMode = mode;
    document.body.classList.toggle("input-mode-ui", mode === "ui");
    if (mode === "ui") {
      this.heldMouseButtons.clear();
      this.releasePointerLock();
    }
  }

  public get mouseDebug(): MouseDebugState {
    return {
      inputMode: this.inputMode,
      pointerLocked: document.pointerLockElement === this.canvas,
      mouseCaptured: this.inputMode === "gameplay" && document.pointerLockElement === this.canvas,
      lastMouseAction: this.lastMouseAction,
      lastButtonDown: this.lastMouseButtonDown,
      lastButtonUp: this.lastMouseButtonUp,
      fireHeld: this.isHeldMouseButton(0),
      adsHeld: this.isHeldMouseButton(2),
      wheelDelta: this.lastWheelDelta,
      elementUnderCursor: this.describeElementUnderCursor(),
      canvasPointerDownFired: this.canvasPointerDownFired,
    };
  }

  private isHeld(keys: ReadonlyArray<string>): boolean {
    for (const key of keys) {
      if (this.heldKeys.has(key)) {
        return true;
      }
    }

    return false;
  }

  private isHeldMouseButton(button: number): boolean {
    return this.heldMouseButtons.has(button);
  }

  private wasMouseButtonPressed(button: number): boolean {
    if (button === 0) {
      return this.fireQueued;
    }

    if (button === 2) {
      return this.adsQueued;
    }

    return false;
  }

  private getActiveGamepad(): Gamepad | null {
    const gamepads = navigator.getGamepads?.() ?? [];
    const gamepad = gamepads.find((candidate): candidate is Gamepad => candidate !== null) ?? null;
    this.controllerConnected = gamepad !== null;
    this.controllerName = gamepad?.id ?? null;
    return gamepad;
  }

  private readGamepadState(gamepad: Gamepad | null, dt: number, settings: GameSettings): GamepadState {
    if (!gamepad) {
      this.previousGamepadButtons.clear();
      return this.emptyGamepadState;
    }

    const controls = settings.controls;
    const buttons = controls.controllerBindings;
    const axes: [number, number, number, number] = [
      gamepad.axes[0] ?? 0,
      gamepad.axes[1] ?? 0,
      gamepad.axes[2] ?? 0,
      gamepad.axes[3] ?? 0,
    ];
    const leftStick = this.applyRadialDeadzone(
      axes[0],
      -axes[1],
      controls.leftStickDeadzone,
    );
    const rightStick = this.applyRadialDeadzone(
      axes[2],
      axes[3],
      controls.rightStickDeadzone,
    );
    const heldButtons = this.readHeldGamepadButtons(gamepad, controls.triggerThreshold);
    const pressed = (button: number): boolean => heldButtons.has(button) && !this.previousGamepadButtons.has(button);
    const triggerHeld = (button: number): boolean => this.getButtonValue(gamepad, button) > controls.triggerThreshold;
    const adsHeld = triggerHeld(buttons.ads);
    const fireHeld = triggerHeld(buttons.fire);
    const firePressed = fireHeld && !this.previousGamepadButtons.has(buttons.fire);
    const lookMultiplier = controls.controllerSensitivity * (adsHeld ? controls.adsControllerSensitivityMultiplier : 1);
    const jumpPressed = pressed(buttons.jump);
    const crouchPressed = pressed(buttons.crouch);
    const reloadPressed = pressed(buttons.reload);
    const takeAllPressed = pressed(buttons.weaponSwap);
    const raidBagTogglePressed = pressed(buttons.menu);
    const interactPressed = pressed(buttons.interact);
    const uiConfirmPressed = jumpPressed;
    const uiBackPressed = interactPressed;
    const uiDropPressed = crouchPressed;
    const clearJamPressed = pressed(buttons.clearJam);
    const shoulderSwapPressed = pressed(buttons.shoulderSwap);
    const meleePressed = shoulderSwapPressed;
    const coverPressed = interactPressed;
    const useMedkitPressed = pressed(buttons.useMedkit);
    const weaponSwapPressed = pressed(buttons.weaponSwap);
    const clearJamHeld = heldButtons.has(buttons.clearJam);
    const crouchHeld = heldButtons.has(buttons.crouch);
    const peekLeftHeld = heldButtons.has(buttons.peekLeft);
    const peekRightHeld = heldButtons.has(buttons.peekRight);
    const toggleFlashlightPressed = pressed(buttons.flashlight);
    const sprintHeld = heldButtons.has(buttons.sprint);

    this.previousGamepadButtons.clear();
    for (const button of heldButtons) {
      this.previousGamepadButtons.add(button);
    }

    return {
      moveX: leftStick.x,
      moveZ: leftStick.y,
      lookX: (rightStick.x * lookMultiplier * dt) / 0.0009,
      lookY: (rightStick.y * lookMultiplier * dt) / 0.0008,
      firePressed,
      fireHeld,
      jumpPressed,
      reloadPressed,
      takeAllPressed,
      raidBagTogglePressed,
      uiConfirmPressed,
      uiBackPressed,
      uiDropPressed,
      meleePressed,
      clearJamPressed,
      clearJamHeld,
      shoulderSwapPressed,
      interactPressed,
      interactHeld: heldButtons.has(buttons.interact),
      coverPressed,
      peekLeftHeld,
      peekRightHeld,
      toggleFlashlightPressed,
      useMedkitPressed,
      weaponSwapPressed,
      crouchHeld,
      sprintHeld,
      adsPressed: pressed(buttons.ads),
      adsHeld,
      debug: {
        connected: true,
        name: gamepad.id,
        activeButtons: [...heldButtons].sort((a, b) => a - b),
        leftTrigger: this.getButtonValue(gamepad, 6),
        rightTrigger: this.getButtonValue(gamepad, 7),
        axes,
        actions: {
          jump: jumpPressed,
          fire: fireHeld,
          ads: adsHeld,
          crouch: crouchHeld,
          sprint: sprintHeld,
          reload: reloadPressed,
          clearJam: clearJamHeld,
          shoulderSwap: shoulderSwapPressed,
          interact: interactPressed || heldButtons.has(buttons.interact),
          cover: coverPressed,
          peekLeft: peekLeftHeld,
          peekRight: peekRightHeld,
          flashlight: toggleFlashlightPressed,
        },
      },
    };
  }

  private get emptyGamepadState(): GamepadState {
    return {
      moveX: 0,
      moveZ: 0,
      lookX: 0,
      lookY: 0,
      firePressed: false,
      fireHeld: false,
      jumpPressed: false,
      reloadPressed: false,
      takeAllPressed: false,
      raidBagTogglePressed: false,
      uiConfirmPressed: false,
      uiBackPressed: false,
      uiDropPressed: false,
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
      useMedkitPressed: false,
      weaponSwapPressed: false,
      crouchHeld: false,
      sprintHeld: false,
      adsPressed: false,
      adsHeld: false,
      debug: this.emptyControllerDebug,
    };
  }

  private get emptyControllerDebug(): ControllerDebugState {
    return {
      connected: false,
      name: null,
      activeButtons: [],
      leftTrigger: 0,
      rightTrigger: 0,
      axes: [0, 0, 0, 0],
      actions: {
        jump: false,
        fire: false,
        ads: false,
        crouch: false,
        sprint: false,
        reload: false,
        clearJam: false,
        shoulderSwap: false,
        interact: false,
        cover: false,
        peekLeft: false,
        peekRight: false,
        flashlight: false,
      },
    };
  }

  private readHeldGamepadButtons(gamepad: Gamepad, triggerThreshold: number): Set<number> {
    const heldButtons = new Set<number>();

    gamepad.buttons.forEach((button, index) => {
      if (button.pressed || button.value > triggerThreshold) {
        heldButtons.add(index);
      }
    });

    return heldButtons;
  }

  private getButtonValue(gamepad: Gamepad, index: number): number {
    return gamepad.buttons[index]?.value ?? 0;
  }

  private applyRadialDeadzone(x: number, y: number, deadzone: number): { x: number; y: number } {
    const magnitude = Math.hypot(x, y);

    if (magnitude <= deadzone) {
      return { x: 0, y: 0 };
    }

    const normalized = Math.min(1, (magnitude - deadzone) / (1 - deadzone));
    return {
      x: (x / magnitude) * normalized,
      y: (y / magnitude) * normalized,
    };
  }

  private clampMove(x: number, z: number): { x: number; z: number } {
    const length = Math.hypot(x, z);

    if (length <= 1) {
      return { x, z };
    }

    return {
      x: x / length,
      z: z / length,
    };
  }

  private readonly requestPointerLock = (): void => {
    if (this.inputMode === "ui") {
      return;
    }

    this.canvas.focus();
    void this.canvas.requestPointerLock();
    this.lastMouseAction = "request pointer lock";
  };

  private readonly handleCanvasPointerDown = (event: PointerEvent): void => {
    if (this.inputMode === "ui") {
      this.lastMouseAction = "ui blocked canvas";
      return;
    }

    this.lastPointerClientX = event.clientX;
    this.lastPointerClientY = event.clientY;
    this.canvasPointerDownFired = true;
    this.applyMouseDown(event.button);
    this.suppressNextMouseDownButton = event.button;
    this.requestPointerLock();

    if (event.button === 1 || event.button === 2) {
      event.preventDefault();
    }
  };

  private readonly handleCanvasPointerUp = (event: PointerEvent): void => {
    if (this.inputMode === "ui") {
      return;
    }

    this.lastPointerClientX = event.clientX;
    this.lastPointerClientY = event.clientY;
    this.applyMouseUp(event.button);
    this.suppressNextMouseUpButton = event.button;
  };

  private readonly handleCanvasWheel = (event: WheelEvent): void => {
    if (this.inputMode === "ui") {
      return;
    }

    this.lastPointerClientX = event.clientX;
    this.lastPointerClientY = event.clientY;
    this.applyWheel(event.deltaY);
    event.preventDefault();
  };

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    if (event.repeat) {
      return;
    }

    if (this.isEditableTarget(event.target)) {
      return;
    }

    const bindings = this.settingsManager.snapshot.controls.keyboardBindings;
    this.activeInputMethod = "keyboardMouse";
    this.heldKeys.add(event.code);

    if (bindings.jump.includes(event.code)) {
      this.jumpQueued = true;
      event.preventDefault();
    }

    if (bindings.crouch.includes(event.code)) {
      event.preventDefault();
    }

    if (bindings.cover.includes(event.code)) {
      this.coverQueued = true;
    }

    if (bindings.flashlight.includes(event.code)) {
      this.flashlightQueued = true;
    }

    if (bindings.laser.includes(event.code)) {
      this.laserQueued = true;
    }

    if (bindings.nightVision.includes(event.code)) {
      this.nightVisionQueued = true;
    }

    if (bindings.reload.includes(event.code)) {
      this.reloadQueued = true;
    }

    if (event.code === "KeyF") {
      this.takeAllQueued = true;
    }

    if (event.code === "Tab") {
      this.raidBagToggleQueued = true;
      event.preventDefault();
    }

    if (event.code === "Enter" || event.code === "KeyE") {
      this.uiConfirmQueued = true;
    }

    if (event.code === "Escape") {
      this.uiBackQueued = true;
    }

    if (event.code === "KeyX") {
      this.uiDropQueued = true;
    }

    if (event.code === "KeyV") {
      this.meleeQueued = true;
    }

    if (bindings.clearJam.includes(event.code)) {
      this.clearJamQueued = true;
    }

    if (bindings.shoulderSwap.includes(event.code)) {
      this.shoulderSwapQueued = true;
    }

    if (bindings.interact.includes(event.code)) {
      this.interactQueued = true;
    }

    if (bindings.useMedkit.includes(event.code)) {
      this.useMedkitQueued = true;
    }

    if (event.code === "Digit1") {
      this.weaponSlotQueued = 1;
    }

    if (event.code === "Digit2") {
      this.weaponSlotQueued = 2;
    }

    if (event.code === "Digit3") {
      this.weaponSlotQueued = 3;
    }

    if (bindings.restart.includes(event.code)) {
      this.restartQueued = true;
    }
  };

  private readonly handleKeyUp = (event: KeyboardEvent): void => {
    this.heldKeys.delete(event.code);
  };

  private readonly handleMouseMove = (event: MouseEvent): void => {
    if (document.pointerLockElement !== this.canvas) {
      return;
    }

    const settings = this.settingsManager.snapshot;
    const xSign = settings.controls.invertMouseX ? -1 : 1;
    const ySign = settings.controls.invertMouseY ? -1 : 1;
    this.lookX += event.movementX * settings.graphics.cameraSensitivity * xSign;
    this.lookY += event.movementY * settings.graphics.cameraSensitivity * ySign;
    this.activeInputMethod = "keyboardMouse";
    this.lastMouseAction = "camera look";
  };

  private readonly handleMouseDown = (event: MouseEvent): void => {
    if (this.inputMode === "ui") {
      this.lastMouseAction = "ui click";
      return;
    }

    if (this.isUiTarget(event.target)) {
      this.lastMouseAction = "ui click";
      return;
    }

    this.lastPointerClientX = event.clientX;
    this.lastPointerClientY = event.clientY;

    if (this.suppressNextMouseDownButton === event.button) {
      this.suppressNextMouseDownButton = null;
      return;
    }

    this.applyMouseDown(event.button);

    if (event.button === 1 || event.button === 2) {
      event.preventDefault();
    }
  };

  private readonly handleMouseUp = (event: MouseEvent): void => {
    this.lastPointerClientX = event.clientX;
    this.lastPointerClientY = event.clientY;

    if (this.suppressNextMouseUpButton === event.button) {
      this.suppressNextMouseUpButton = null;
      return;
    }

    this.applyMouseUp(event.button);
  };

  private readonly handleWheel = (event: WheelEvent): void => {
    if (this.inputMode === "ui") {
      return;
    }

    if (this.isUiTarget(event.target)) {
      return;
    }

    if (document.pointerLockElement !== this.canvas) {
      return;
    }

    this.lastPointerClientX = event.clientX;
    this.lastPointerClientY = event.clientY;
    this.applyWheel(event.deltaY);
    event.preventDefault();
  };

  private readonly preventContextMenu = (event: MouseEvent): void => {
    event.preventDefault();
  };

  private isUiTarget(target: EventTarget | null): boolean {
    return target instanceof Element && target.closest(".raid-inventory, .loot-container-panel, .raid-outcome, .main-menu") !== null;
  }

  private isEditableTarget(target: EventTarget | null): boolean {
    if (!(target instanceof HTMLElement)) {
      return false;
    }

    return target.matches("input, textarea, select") || target.isContentEditable;
  }

  private applyMouseDown(button: number): void {
    this.heldMouseButtons.add(button);
    this.activeInputMethod = "keyboardMouse";
    this.lastMouseButtonDown = button;

    if (button === 0) {
      this.fireQueued = true;
      this.lastMouseAction = "fire";
    } else if (button === 1) {
      this.meleeQueued = true;
      this.lastMouseAction = "melee";
    } else if (button === 2) {
      this.adsQueued = true;
      this.lastMouseAction = "ADS";
      if (!this.settingsManager.snapshot.gameplay.holdAds) {
        this.adsToggleActive = !this.adsToggleActive;
      }
    } else {
      this.lastMouseAction = `button ${button}`;
    }
  }

  private applyMouseUp(button: number): void {
    this.heldMouseButtons.delete(button);
    this.lastMouseButtonUp = button;
    this.lastMouseAction = `button ${button} up`;
  }

  private applyWheel(deltaY: number): void {
    this.zoomDelta += Math.sign(deltaY);
    this.lastWheelDelta = deltaY;
    this.activeInputMethod = "keyboardMouse";
    this.lastMouseAction = "wheel zoom";
  }

  private describeElementUnderCursor(): string {
    const element = document.elementFromPoint(this.lastPointerClientX, this.lastPointerClientY);

    if (!element) {
      return "none";
    }

    const id = element.id ? `#${element.id}` : "";
    const className = typeof element.className === "string" && element.className.trim().length > 0
      ? `.${element.className.trim().split(/\s+/).join(".")}`
      : "";
    return `${element.tagName.toLowerCase()}${id}${className}`;
  }

  private readonly handleGamepadConnection = (): void => {
    const gamepad = this.getActiveGamepad();
    this.controllerConnected = gamepad !== null;
    this.controllerName = gamepad?.id ?? null;
  };

  private isGamepadStateActive(state: GamepadState): boolean {
    return Math.hypot(state.moveX, state.moveZ) > 0.05 ||
      Math.hypot(state.lookX, state.lookY) > 0.01 ||
      state.fireHeld ||
      state.adsHeld ||
      state.jumpPressed ||
      state.reloadPressed ||
      state.clearJamHeld ||
      state.clearJamPressed ||
      state.shoulderSwapPressed ||
      state.interactHeld ||
      state.coverPressed ||
      state.peekLeftHeld ||
      state.peekRightHeld ||
      state.toggleFlashlightPressed ||
      state.useMedkitPressed ||
      state.weaponSwapPressed ||
      state.crouchHeld ||
      state.sprintHeld;
  }
}
