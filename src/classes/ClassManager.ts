import { classDefinitions, defaultClassId, type ClassDefinition, type ClassId } from "./ClassDefinitions";

export type ClassAssignmentState = Readonly<{
  selectedClassId: ClassId;
  version: 1;
}>;

const storageKey = "dark-craters.class-assignment.v1";

const isClassId = (value: unknown): value is ClassId =>
  typeof value === "string" && classDefinitions.some((definition) => definition.id === value);

export class ClassManager {
  private state: ClassAssignmentState = this.load();

  public get snapshot(): ClassAssignmentState {
    return { ...this.state };
  }

  public get selectedClass(): ClassDefinition {
    return classDefinitions.find((definition) => definition.id === this.state.selectedClassId)
      ?? classDefinitions[0];
  }

  public select(classId: ClassId): string {
    const definition = classDefinitions.find((candidate) => candidate.id === classId);
    if (!definition || !definition.unlocked) {
      return "Assignment unavailable";
    }

    this.state = { selectedClassId: classId, version: 1 };
    this.save();
    return `${definition.displayName} assignment saved`;
  }

  private load(): ClassAssignmentState {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) {
        return { selectedClassId: defaultClassId, version: 1 };
      }

      const parsed = JSON.parse(raw) as Partial<ClassAssignmentState>;
      return {
        selectedClassId: isClassId(parsed.selectedClassId) ? parsed.selectedClassId : defaultClassId,
        version: 1,
      };
    } catch (error) {
      console.warn("Class assignment state failed to load; using defaults.", error);
      return { selectedClassId: defaultClassId, version: 1 };
    }
  }

  private save(): void {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(this.state));
    } catch (error) {
      console.warn("Class assignment state could not be saved.", error);
    }
  }
}
