import type { LocalProject } from "../domain/project";

const STORAGE_KEY = "ombr.web.projects.v1";

type ProjectStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

function getBrowserStorage(): ProjectStorage | null {
  if (typeof window === "undefined") return null;
  return window.localStorage;
}

export function loadProjects(storage: ProjectStorage | null = getBrowserStorage()): LocalProject[] {
  if (!storage) return [];

  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as LocalProject[]) : [];
  } catch {
    return [];
  }
}

export function saveProjects(projects: LocalProject[], storage: ProjectStorage | null = getBrowserStorage()): void {
  if (!storage) return;
  storage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

export function upsertProject(projectsOrStorage: LocalProject[] | ProjectStorage, project: LocalProject): LocalProject[] {
  const isArrayInput = Array.isArray(projectsOrStorage);
  const projects = isArrayInput ? projectsOrStorage : loadProjects(projectsOrStorage);
  const existingIndex = projects.findIndex((item) => item.id === project.id);
  const nextProjects = existingIndex >= 0 ? projects.map((item) => (item.id === project.id ? project : item)) : [project, ...projects];

  if (!isArrayInput) {
    saveProjects(nextProjects, projectsOrStorage);
  }

  return nextProjects;
}

export function removeProject(projectId: string, storage: ProjectStorage | null = getBrowserStorage()): LocalProject[] {
  const nextProjects = loadProjects(storage).filter((project) => project.id !== projectId);
  saveProjects(nextProjects, storage);
  return nextProjects;
}
