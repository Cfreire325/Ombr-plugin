export type ProjectModeSetup = "light" | "light-dark";
export type ProjectPreset = "custom" | "starter";
export type ProjectSyncStatus = "not-connected" | "ready-for-handoff";

export type ProjectFoundations = {
  colors: {
    brandPrimary: string;
    baseWhite: string;
    baseBlack: string;
  };
};

export type LocalProject = {
  id: string;
  name: string;
  modeSetup: ProjectModeSetup;
  preset: ProjectPreset;
  syncStatus: ProjectSyncStatus;
  createdAt: string;
  updatedAt: string;
  foundations: ProjectFoundations;
};

export type CreateProjectInput = {
  name: string;
  modeSetup: ProjectModeSetup;
  preset: ProjectPreset;
  brandColor?: string;
};

const DEFAULT_BRAND_COLOR = "#3f6f5f";
const DEFAULT_BASE_WHITE = "#ffffff";
const DEFAULT_BASE_BLACK = "#171717";

function nowIso(): string {
  return new Date().toISOString();
}

function createProjectId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `local-${crypto.randomUUID()}`;
  }
  return `local-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createLocalProject(input: CreateProjectInput): LocalProject {
  const createdAt = nowIso();
  const name = input.name.trim() || "Untitled design system";

  return {
    id: createProjectId(),
    name,
    modeSetup: input.modeSetup,
    preset: input.preset,
    syncStatus: "not-connected",
    createdAt,
    updatedAt: createdAt,
    foundations: {
      colors: {
        brandPrimary: input.brandColor || DEFAULT_BRAND_COLOR,
        baseWhite: DEFAULT_BASE_WHITE,
        baseBlack: DEFAULT_BASE_BLACK,
      },
    },
  };
}

export function getModeCount(project: LocalProject): number {
  return project.modeSetup === "light-dark" ? 2 : 1;
}

export function updateProjectBrandColor(project: LocalProject, brandColor: string): LocalProject {
  return {
    ...project,
    updatedAt: nowIso(),
    foundations: {
      ...project.foundations,
      colors: {
        ...project.foundations.colors,
        brandPrimary: brandColor,
      },
    },
  };
}
