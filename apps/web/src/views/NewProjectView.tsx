import { FormEvent, useState } from "react";
import type { CreateProjectInput, ProjectModeSetup, ProjectPreset } from "../domain/project";

type NewProjectViewProps = {
  hasProjects: boolean;
  onCancel: () => void;
  onCreateProject: (input: CreateProjectInput) => void;
};

function NewProjectView({ hasProjects, onCancel, onCreateProject }: NewProjectViewProps) {
  const [name, setName] = useState("");
  const [modeSetup, setModeSetup] = useState<ProjectModeSetup>("light-dark");
  const [preset, setPreset] = useState<ProjectPreset>("starter");
  const [brandColor, setBrandColor] = useState("#3f6f5f");
  const [error, setError] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim()) {
      setError("Donne un nom au projet pour le retrouver dans le dashboard.");
      return;
    }
    setError("");
    onCreateProject({ name, modeSetup, preset, brandColor });
  }

  return (
    <main className="app-shell form-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Nouveau projet</p>
          <h1>Créer une base locale</h1>
        </div>
        {hasProjects ? (
          <button className="button button-ghost" type="button" onClick={onCancel}>
            Retour
          </button>
        ) : null}
      </header>

      <form className="panel project-form" onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="project-name">Nom du projet</label>
          <input id="project-name" className="input" value={name} onChange={(event) => setName(event.target.value)} placeholder="Design system produit" />
          <p className="helper">Stocké localement pour cette première phase.</p>
          {error ? <p className="field-error">{error}</p> : null}
        </div>

        <div className="field">
          <label>Preset minimal</label>
          <div className="segmented-control">
            {(["starter", "custom"] as ProjectPreset[]).map((item) => (
              <button className={preset === item ? "segment is-active" : "segment"} type="button" key={item} onClick={() => setPreset(item)}>
                {item === "starter" ? "Starter" : "Custom"}
              </button>
            ))}
          </div>
          <p className="helper">Import Figma et import JSON restent hors scope pour cette phase.</p>
        </div>

        <div className="field">
          <label>Modes</label>
          <div className="segmented-control">
            {(["light", "light-dark"] as ProjectModeSetup[]).map((item) => (
              <button className={modeSetup === item ? "segment is-active" : "segment"} type="button" key={item} onClick={() => setModeSetup(item)}>
                {item === "light" ? "Light" : "Light + Dark"}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <label htmlFor="brand-color">Couleur brand primaire</label>
          <div className="color-input-line">
            <input id="brand-color" className="input" value={brandColor} onChange={(event) => setBrandColor(event.target.value)} />
            <input className="color-swatch-input" type="color" value={brandColor} onChange={(event) => setBrandColor(event.target.value)} aria-label="Couleur brand" />
          </div>
        </div>

        <div className="form-actions">
          <button className="button button-primary" type="submit">
            Créer le projet
          </button>
        </div>
      </form>
    </main>
  );
}

export default NewProjectView;
