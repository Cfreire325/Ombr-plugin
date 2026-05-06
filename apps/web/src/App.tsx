import { useMemo, useState } from "react";
import { buildTokenBundleResult } from "./domain/token-bundle";
import {
  addProjectBrand,
  createLocalProject,
  removeProjectBrand,
  updateProjectBrand,
  updateProjectBaseColor,
  updateProjectColorModeAlias,
  updateProjectColorPreset,
  updateProjectNeutralChoice,
  updateProjectRadiusStep,
  updateProjectSelectedPalette,
  updateProjectSpacingStep,
  updateProjectTypographyStyle,
  type CreateProjectInput,
  type LocalProject,
  type ProjectBaseColorKey,
  type ProjectTypographyStyle,
  type ProjectTypographyStyleId,
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
  const activeBundleResult = useMemo(
    () =>
      activeProject
        ? buildTokenBundleResult(activeProject)
        : {
            bundle: null,
            summary: { primitiveCount: 0, semanticCount: 0, componentCount: 0, tokenCount: 0 },
            validation: { valid: false, errors: ["No active project."] },
          },
    [activeProject],
  );

  function persist(nextProjects: LocalProject[]) {
    setProjects(nextProjects);
    saveProjects(nextProjects);
  }

  function persistActiveProject(updatedProject: LocalProject) {
    const nextProjects = projects.some((project) => project.id === updatedProject.id)
      ? projects.map((project) => (project.id === updatedProject.id ? updatedProject : project))
      : [updatedProject, ...projects];
    persist(nextProjects);
    setActiveProjectId(updatedProject.id);
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

  function handleColorModeAliasChange(aliasName: string, patch: { light?: string; dark?: string }) {
    if (!activeProject) return;
    persistActiveProject(updateProjectColorModeAlias(activeProject, aliasName, patch));
  }

  function handleTypographyStyleChange(
    styleId: ProjectTypographyStyleId,
    patch: Partial<Pick<ProjectTypographyStyle, "fontFamily" | "fontSize" | "lineHeight" | "fontWeight">>,
  ) {
    if (!activeProject) return;
    persistActiveProject(updateProjectTypographyStyle(activeProject, styleId, patch));
  }

  function handleSpacingStepChange(stepId: string, value: number) {
    if (!activeProject) return;
    persistActiveProject(updateProjectSpacingStep(activeProject, stepId, value));
  }

  function handleRadiusStepChange(stepId: string, value: number) {
    if (!activeProject) return;
    persistActiveProject(updateProjectRadiusStep(activeProject, stepId, value));
  }

  if (view === "new-project") {
    return <NewProjectView onCancel={() => setView("dashboard")} onCreateProject={handleCreateProject} hasProjects={projects.length > 0} />;
  }

  if (view === "creator" && activeProject) {
    return (
      <CreatorShell
        project={activeProject}
        bundle={activeBundleResult.bundle}
        summary={activeBundleResult.summary}
        validation={activeBundleResult.validation}
        activeSection={activeSection}
        onSelectSection={setActiveSection}
        onBackToDashboard={() => setView("dashboard")}
        onAddBrand={handleAddBrand}
        onBaseColorChange={handleBaseColorChange}
        onColorModeAliasChange={handleColorModeAliasChange}
        onColorPresetChange={handleColorPresetChange}
        onNeutralChoiceChange={handleNeutralChoiceChange}
        onRadiusStepChange={handleRadiusStepChange}
        onRemoveBrand={handleRemoveBrand}
        onSelectedPaletteChange={handleSelectedPaletteChange}
        onSpacingStepChange={handleSpacingStepChange}
        onTypographyStyleChange={handleTypographyStyleChange}
        onUpdateBrand={handleUpdateBrand}
      />
    );
  }

  return <DashboardView projects={projects} onCreateProject={() => setView("new-project")} onOpenProject={handleOpenProject} />;
}

export default App;
