import type { TokenBundle, TokenBundleValidationResult } from "@starter-tokens/ds-core";
import type { LocalProject, ProjectBaseColorKey, ProjectTypographyStyle, ProjectTypographyStyleId } from "../domain/project";
import type { TokenBundleSummary } from "../domain/token-bundle";
import ExportJsonView from "./ExportJsonView";
import FoundationsColorsView from "./FoundationsColorsView";
import FoundationsPreviewView from "./FoundationsPreviewView";
import FoundationsRadiusView from "./FoundationsRadiusView";
import FoundationsSpacingView from "./FoundationsSpacingView";
import FoundationsTypographyView from "./FoundationsTypographyView";

export type CreatorSection = "colors" | "preview" | "preview-json" | "export-json" | "typography" | "spacing" | "radius" | "semantic" | "figma-handoff";

type CreatorShellProps = {
  project: LocalProject;
  bundle: TokenBundle | null;
  summary: TokenBundleSummary;
  validation: TokenBundleValidationResult;
  activeSection: CreatorSection;
  onSelectSection: (section: CreatorSection) => void;
  onBackToDashboard: () => void;
  onAddBrand: () => void;
  onBaseColorChange: (colorKey: ProjectBaseColorKey, colorValue: string) => void;
  onColorModeAliasChange: (aliasName: string, patch: { light?: string; dark?: string }) => void;
  onColorPresetChange: (colorPresetId: string) => void;
  onNeutralChoiceChange: (neutralChoice: string) => void;
  onRadiusStepChange: (stepId: string, value: number) => void;
  onRemoveBrand: (brandId: string) => void;
  onSelectedPaletteChange: (paletteKey: string, selected: boolean) => void;
  onSpacingStepChange: (stepId: string, value: number) => void;
  onTypographyStyleChange: (
    styleId: ProjectTypographyStyleId,
    patch: Partial<Pick<ProjectTypographyStyle, "fontFamily" | "fontSize" | "lineHeight" | "fontWeight">>,
  ) => void;
  onUpdateBrand: (brandId: string, patch: { name?: string; color?: string }) => void;
};

const navigation: Array<{ id: CreatorSection; label: string; disabled?: boolean; note?: string }> = [
  { id: "colors", label: "Foundations / Colors" },
  { id: "typography", label: "Typography" },
  { id: "spacing", label: "Spacing" },
  { id: "radius", label: "Radius" },
  { id: "preview", label: "Preview" },
  { id: "preview-json", label: "Preview JSON" },
  { id: "export-json", label: "Export JSON" },
  { id: "semantic", label: "Component tokens", disabled: true, note: "Apres Color Modes" },
  { id: "figma-handoff", label: "Figma handoff", disabled: true, note: "Préparation seulement" },
];

function renderSection(props: CreatorShellProps) {
  if (props.activeSection === "colors") {
    return (
      <FoundationsColorsView
        project={props.project}
        bundle={props.bundle}
        validation={props.validation}
        onAddBrand={props.onAddBrand}
        onBaseColorChange={props.onBaseColorChange}
        onColorModeAliasChange={props.onColorModeAliasChange}
        onColorPresetChange={props.onColorPresetChange}
        onNeutralChoiceChange={props.onNeutralChoiceChange}
        onRemoveBrand={props.onRemoveBrand}
        onSelectedPaletteChange={props.onSelectedPaletteChange}
        onUpdateBrand={props.onUpdateBrand}
      />
    );
  }

  if (props.activeSection === "typography") {
    return <FoundationsTypographyView project={props.project} validation={props.validation} onTypographyStyleChange={props.onTypographyStyleChange} />;
  }

  if (props.activeSection === "spacing") {
    return <FoundationsSpacingView project={props.project} validation={props.validation} onSpacingStepChange={props.onSpacingStepChange} />;
  }

  if (props.activeSection === "radius") {
    return <FoundationsRadiusView project={props.project} validation={props.validation} onRadiusStepChange={props.onRadiusStepChange} />;
  }

  if (props.activeSection === "preview") {
    return <FoundationsPreviewView project={props.project} bundle={props.bundle} validation={props.validation} />;
  }

  if (props.activeSection === "export-json") {
    return <ExportJsonView bundle={props.bundle} validation={props.validation} />;
  }

  if (props.activeSection === "preview-json") {
    return (
      <section className="panel content-panel">
        <div className="section-head">
          <div>
            <p className="eyebrow">Preview JSON</p>
            <h2>TokenBundle normalisé</h2>
          </div>
          <span className={props.validation.valid ? "status-pill is-valid" : "status-pill is-danger"}>{props.validation.valid ? "Valide" : "Invalide"}</span>
        </div>
        {props.bundle ? (
          <pre className="code-preview">{JSON.stringify(props.bundle, null, 2)}</pre>
        ) : (
          <div className="inline-error">
            {props.validation.errors.map((error) => (
              <p key={error}>{error}</p>
            ))}
          </div>
        )}
      </section>
    );
  }

  return (
    <section className="panel content-panel">
      <p className="eyebrow">Hors scope Phase B</p>
      <h2>Section volontairement désactivée</h2>
      <p className="muted">Cette zone reste visible pour garder la navigation produit, mais elle ne sera pas implémentée avant le bon jalon MVP.</p>
    </section>
  );
}

function CreatorShell(props: CreatorShellProps) {
  return (
    <main className="creator-layout">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="brand-mark">O</span>
          <div>
            <strong>Ombr</strong>
            <small>Creator shell</small>
          </div>
        </div>
        <nav className="sidebar-nav" aria-label="Creator sections">
          {navigation.map((item) => (
            <button
              className={props.activeSection === item.id ? "sidebar-item is-active" : "sidebar-item"}
              disabled={item.disabled}
              key={item.id}
              type="button"
              onClick={() => props.onSelectSection(item.id)}
            >
              <span>{item.label}</span>
              {item.note ? <small>{item.note}</small> : null}
            </button>
          ))}
        </nav>
      </aside>

      <section className="creator-main">
        <header className="creator-header">
          <button className="button button-ghost" type="button" onClick={props.onBackToDashboard}>
            Dashboard
          </button>
          <div>
            <p className="eyebrow">{props.project.preset} preset</p>
            <h1>{props.project.name}</h1>
          </div>
          <div className="header-stats">
            <span>{props.summary.tokenCount} tokens</span>
            <span>{props.project.modeSetup === "light-dark" ? "2 modes" : "1 mode"}</span>
            <span>Figma: non connecté</span>
          </div>
        </header>
        {renderSection(props)}
      </section>
    </main>
  );
}

export default CreatorShell;
