export type PreviewLifecycleType = "runner" | "weapon" | "ship";

const activePreviewCounts: Record<PreviewLifecycleType, number> = {
  runner: 0,
  weapon: 0,
  ship: 0,
};

let nextPreviewLifecycleId = 0;

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
  console.info(`[PreviewLifecycle] async ignored type=${type} reason=${reason}`);
};

export const recordRunnerRemountSkipped = (reason: string): void => {
  console.info(`[PreviewLifecycle] runner remount skipped reason=${reason}`);
};

export const recordRunnerRemountCoalesced = (): void => {
  console.info("[PreviewLifecycle] runner remount coalesced");
};

export const recordRunnerModelSwapQueued = (): void => {
  console.info("[PreviewLifecycle] runner model swap queued");
};

export const recordRunnerAttach = (id: number, host: string): void => {
  console.info(`[PreviewLifecycle] attach type=runner id=${id} host=${host}`);
};

export const recordRunnerDetach = (id: number): void => {
  console.info(`[PreviewLifecycle] detach type=runner id=${id}`);
};

export const recordRunnerUpdate = (id: number, key: string): void => {
  console.info(`[PreviewLifecycle] update type=runner id=${id} key=${key}`);
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
