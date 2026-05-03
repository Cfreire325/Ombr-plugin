import { useMemo, useState } from "react";
import { validateTokenBundle } from "@starter-tokens/ds-core";
import { buildMinimalTokenBundle, summarizeTokenBundle } from "./domain/token-bundle";
import {
  addProjectBrand,
  createLocalProject,
  removeProjectBrand,
  updateProjectBrand,
  updateProjectBaseColor,
  updateProjectColorPreset,
  updateProjectNeutralChoice,
  updateProjectSelectedPalette,
  type CreateProjectInput,
  type LocalProject,
  type ProjectBaseColorKey,
} from "./domain/project";
import { loadProjects, saveProjects, upsertProject } from "./storage/local-projects";
import DashboardView from "./views/DashboardView";
import NewProjectView from "./views/NewProjectView";
import CreatorShell, { type CreatorSection } from "./views/CreatorShell";

type AppView = "dashboard" | "new-project" | "creator";

function App() {
  const [projects, setProjects] = useState<LocalProject[]>(() => loadProjects());
  const [activeProjectId, setActiveProjectId] = useState<string | null>(projects[0]?.id ?? null);
  const [view, setView] = useState<AppView>(projects.length ? "dashboard" : "new-project");
  const [activeSection, setActiveSection] = useState<CreatorSection>("colors");

  const activeProject = projects.find((project) => project.id === activeProjectId) ?? projects[0] ?? null;
  const activeBundle = useMemo(() => (activeProject ? buildMinimalTokenBundle(activeProject) : null), [activeProject]);
  const activeSummary = useMemo(() => (activeBundle ? summarizeTokenBundle(activeBundle) : null), [activeBundle]);
  const validation = useMemo(() => (activeBundle ? validateTokenBundle(activeBundle) : { valid: false, errors: ["No active project."] }), [activeBundle]);

  function persist(nextProjects: LocalProject[]) {
    setProjects(nextProjects);
    saveProjects(nextProjects);
  }

  function handleCreateProject(input: CreateProjectInput) {
    const project = createLocalProject(input);
    const nextProjects = [project, ...projects];
    persist(nextProjects);
    setActiveProjectId(project.id);
    setActiveSection("colors");
    setView("creator");
  }

  function handleOpenProject(projectId: string) {
    setActiveProjectId(projectId);
    setActiveSection("colors");
    setView("creator");
  }

  function handleAddBrand() {
    if (!activeProject) return;
    const updated = addProjectBrand(activeProject);
    const nextProjects = upsertProject(projects, updated);
    persist(nextProjects);
    setActiveProjectId(updated.id);
  }

  function handleUpdateBrand(brandId: string, patch: { name?: string; color?: string }) {
    if (!activeProject) return;
    const updated = updateProjectBrand(activeProject, brandId, patch);
    const nextProjects = upsertProject(projects, updated);
    persist(nextProjects);
    setActiveProjectId(updated.id);
  }

  function handleRemoveBrand(brandId: string) {
    if (!activeProject) return;
    const updated = removeProjectBrand(activeProject, brandId);
    const nextProjects = upsertProject(projects, updated);
    persist(nextProjects);
    setActiveProjectId(updated.id);
  }

  function handleColorPresetChange(colorPresetId: string) {
    if (!activeProject) return;
    const updated = updateProjectColorPreset(activeProject, colorPresetId);
    const nextProjects = upsertProject(projects, updated);
    persist(nextProjects);
    setActiveProjectId(updated.id);
  }

  function handleNeutralChoiceChange(neutralChoice: string) {
    if (!activeProject) return;
    const updated = updateProjectNeutralChoice(activeProject, neutralChoice);
    const nextProjects = upsertProject(projects, updated);
    persist(nextProjects);
    setActiveProjectId(updated.id);
  }

  function handleSelectedPaletteChange(paletteKey: string, selected: boolean) {
    if (!activeProject) return;
    const updated = updateProjectSelectedPalette(activeProject, paletteKey, selected);
    const nextProjects = upsertProject(projects, updated);
    persist(nextProjects);
    setActiveProjectId(updated.id);
  }

  function handleBaseColorChange(colorKey: ProjectBaseColorKey, colorValue: string) {
    if (!activeProject) return;
    const updated = updateProjectBaseColor(activeProject, colorKey, colorValue);
    const nextProjects = upsertProject(projects, updated);
    persist(nextProjects);
    setActiveProjectId(updated.id);
  }

  if (view === "new-project") {
    return <NewProjectView onCancel={() => setView("dashboard")} onCreateProject={handleCreateProject} hasProjects={projects.length > 0} />;
  }

  if (view === "creator" && activeProject && activeBundle && activeSummary) {
    return (
      <CreatorShell
        project={activeProject}
        bundle={activeBundle}
        summary={activeSummary}
        validation={validation}
        activeSection={activeSection}
        onSelectSection={setActiveSection}
        onBackToDashboard={() => setView("dashboard")}
        onAddBrand={handleAddBrand}
        onBaseColorChange={handleBaseColorChange}
        onColorPresetChange={handleColorPresetChange}
        onNeutralChoiceChange={handleNeutralChoiceChange}
        onRemoveBrand={handleRemoveBrand}
        onSelectedPaletteChange={handleSelectedPaletteChange}
        onUpdateBrand={handleUpdateBrand}
      />
    );
  }

  return <DashboardView projects={projects} onCreateProject={() => setView("new-project")} onOpenProject={handleOpenProject} />;
}

export default App;
