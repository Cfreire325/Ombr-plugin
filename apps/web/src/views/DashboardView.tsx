import { getModeCount, type LocalProject } from "../domain/project";
import { buildTokenBundleResult } from "../domain/token-bundle";

type DashboardViewProps = {
  projects: LocalProject[];
  onCreateProject: () => void;
  onOpenProject: (projectId: string) => void;
};

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

function DashboardView({ projects, onCreateProject, onOpenProject }: DashboardViewProps) {
  return (
    <main className="app-shell dashboard-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Ombr Studio Creator</p>
          <h1>Design systems locaux</h1>
        </div>
        <button className="button button-primary" type="button" onClick={onCreateProject}>
          Nouveau projet
        </button>
      </header>

      <section className="panel hero-panel">
        <div>
          <p className="eyebrow">Phase B</p>
          <h2>Créer, prévisualiser et exporter un TokenBundle minimal.</h2>
          <p className="muted">
            Cette interface est provisoire. Elle sert à tester le flow web app avant les futures maquettes Figma.
          </p>
        </div>
        <div className="hero-metrics" aria-label="Résumé local">
          <div>
            <span>{projects.length}</span>
            <small>projets</small>
          </div>
          <div>
            <span>JSON</span>
            <small>export actif</small>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="section-head">
          <div>
            <p className="eyebrow">Dashboard</p>
            <h2>Projets locaux</h2>
          </div>
        </div>

        {projects.length === 0 ? (
          <div className="empty-state">
            <h3>Aucun projet local</h3>
            <p>Crée un premier système pour ouvrir le Creator, générer un TokenBundle et tester l’export JSON.</p>
            <button className="button button-secondary" type="button" onClick={onCreateProject}>
              Créer le premier projet
            </button>
          </div>
        ) : (
          <div className="project-table">
            <div className="project-row project-row-head">
              <span>Nom</span>
              <span>Modifié</span>
              <span>Sync Figma</span>
              <span>Tokens</span>
              <span>Modes</span>
              <span>Action</span>
            </div>
            {projects.map((project) => {
              const { summary, validation } = buildTokenBundleResult(project);
              return (
                <div className="project-row" key={project.id}>
                  <strong>{project.name}</strong>
                  <span>{formatDate(project.updatedAt)}</span>
                  <span className={validation.valid ? "status-pill" : "status-pill is-danger"}>{validation.valid ? "Non connecté" : "À corriger"}</span>
                  <span>{summary.tokenCount}</span>
                  <span>{getModeCount(project)}</span>
                  <button className="button button-ghost" type="button" onClick={() => onOpenProject(project.id)}>
                    Ouvrir
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

export default DashboardView;
