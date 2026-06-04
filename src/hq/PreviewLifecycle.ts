export type PreviewLifecycleType = "runner" | "weapon" | "ship";

const activePreviewCounts: Record<PreviewLifecycleType, number> = {
  runner: 0,
  weapon: 0,
  ship: 0,
};

let nextPreviewLifecycleId = 0;
const onceLogKeys = new Set<string>();

export const nextPreviewId = (): number => {
  nextPreviewLifecycleId += 1;
  return nextPreviewLifecycleId;
};

export const recordPreviewCreate = (type: PreviewLifecycleType, id: number): void => {
  activePreviewCounts[type] += 1;
  console.info(`[PreviewLifecycle] create type=${type} id=${id} active=${activePreviewCounts[type]}`);
};

export const recordPreviewDispose = (type: PreviewLifecycleType, id: number): void => {
  activePreviewCounts[type] = Math.max(0, activePreviewCounts[type] - 1);
  console.info(`[PreviewLifecycle] dispose type=${type} id=${id} active=${activePreviewCounts[type]}`);
};

export const recordPreviewAsyncIgnored = (type: PreviewLifecycleType, reason: string): void => {
  recordPreviewLogOnce(`async-ignored:${type}:${reason}`, `[PreviewLifecycle] async ignored type=${type} reason=${reason}`);
};

export const recordRunnerRemountSkipped = (reason: string): void => {
  recordPreviewLogOnce(`runner-remount-skipped:${reason}`, `[PreviewLifecycle] runner remount skipped reason=${reason}`);
};

export const recordRunnerRemountCoalesced = (): void => {
  console.info("[PreviewLifecycle] runner remount coalesced");
};

export const recordRunnerModelSwapQueued = (): void => {
  console.info("[PreviewLifecycle] runner model swap queued");
};

export const recordRunnerAttach = (id: number, host: string, reason = "host-attached"): void => {
  console.info(`[PreviewLifecycle] attach type=runner id=${id} host=${host} reason=${reason}`);
};

export const recordRunnerDetach = (id: number, reason = "screen-exit"): void => {
  console.info(`[PreviewLifecycle] detach type=runner id=${id} reason=${reason}`);
};

export const recordRunnerUpdate = (id: number, key: string): void => {
  console.info(`[PreviewLifecycle] update type=runner id=${id} key=${key}`);
};

export const recordShipAttach = (id: number, host: string, reason = "host-attached"): void => {
  console.info(`[PreviewLifecycle] attach type=ship id=${id} host=${host} reason=${reason}`);
};

export const recordShipDetach = (id: number, reason = "screen-exit"): void => {
  console.info(`[PreviewLifecycle] detach type=ship id=${id} reason=${reason}`);
};

export const recordShipUpdate = (id: number, key: string): void => {
  console.info(`[PreviewLifecycle] update type=ship id=${id} key=${key}`);
};

export const recordPreviewUpdateSkipped = (type: PreviewLifecycleType, reason: string): void => {
  recordPreviewLogOnce(`update-skipped:${type}:${reason}`, `[PreviewLifecycle] update skipped type=${type} reason=${reason}`);
};

export const recordRunnerModelLoad = (token: number): void => {
  console.info(`[PreviewLifecycle] model load type=runner token=${token}`);
};

export const recordRunnerModelReplaced = (token: number): void => {
  console.info(`[PreviewLifecycle] model replaced type=runner token=${token}`);
};

export const recordPreviewContextLost = (type: PreviewLifecycleType): void => {
  console.warn(`[PreviewLifecycle] context lost type=${type}`);
};

export const recordPreviewContextRestored = (type: PreviewLifecycleType): void => {
  console.info(`[PreviewLifecycle] context restored type=${type}`);
};

const recordPreviewLogOnce = (key: string, message: string): void => {
  if (onceLogKeys.has(key)) {
    return;
  }

  onceLogKeys.add(key);
  console.info(message);
};
