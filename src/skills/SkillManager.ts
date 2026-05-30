import { skillNodes, type SkillNodeId } from "./SkillDefinitions";

export type SkillMatrixState = Readonly<{
  acquiredSkillIds: readonly SkillNodeId[];
  availableSkillPoints: number;
  version: 1;
}>;

const storageKey = "dark-craters.skill-matrix.v1";
const defaultSkillPoints = 3;

const isSkillNodeId = (value: unknown): value is SkillNodeId =>
  typeof value === "string" && skillNodes.some((node) => node.id === value);

export class SkillManager {
  private state: SkillMatrixState = this.load();

  public get snapshot(): SkillMatrixState {
    return {
      acquiredSkillIds: [...this.state.acquiredSkillIds],
      availableSkillPoints: this.state.availableSkillPoints,
      version: 1,
    };
  }

  public get acquiredCount(): number {
    return this.state.acquiredSkillIds.length;
  }

  public isAcquired(nodeId: SkillNodeId): boolean {
    return this.state.acquiredSkillIds.includes(nodeId);
  }

  public canAcquire(nodeId: SkillNodeId): boolean {
    const node = skillNodes.find((candidate) => candidate.id === nodeId);
    if (!node || this.isAcquired(nodeId) || this.state.availableSkillPoints <= 0) {
      return false;
    }

    return node.prerequisites.every((prerequisite) => this.isAcquired(prerequisite));
  }

  public acquire(nodeId: SkillNodeId): string {
    const node = skillNodes.find((candidate) => candidate.id === nodeId);
    if (!node) {
      return "Skill node unavailable";
    }

    if (!this.canAcquire(nodeId)) {
      return "Node locked";
    }

    this.state = {
      acquiredSkillIds: [...this.state.acquiredSkillIds, nodeId],
      availableSkillPoints: Math.max(0, this.state.availableSkillPoints - 1),
      version: 1,
    };
    this.save();
    return `${node.label} calibrated`;
  }

  private load(): SkillMatrixState {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) {
        return { acquiredSkillIds: [], availableSkillPoints: defaultSkillPoints, version: 1 };
      }

      const parsed = JSON.parse(raw) as Partial<SkillMatrixState>;
      const acquiredSkillIds = Array.isArray(parsed.acquiredSkillIds)
        ? parsed.acquiredSkillIds.filter(isSkillNodeId)
        : [];
      const availableSkillPoints = Number.isFinite(parsed.availableSkillPoints)
        ? Math.max(0, Math.floor(parsed.availableSkillPoints ?? defaultSkillPoints))
        : defaultSkillPoints;

      return { acquiredSkillIds, availableSkillPoints, version: 1 };
    } catch (error) {
      console.warn("Skill matrix state failed to load; using defaults.", error);
      return { acquiredSkillIds: [], availableSkillPoints: defaultSkillPoints, version: 1 };
    }
  }

  private save(): void {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(this.state));
    } catch (error) {
      console.warn("Skill matrix state could not be saved.", error);
    }
  }
}
