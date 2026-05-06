import type { TokenBundleValidationResult } from "@starter-tokens/ds-core";
import { getProjectRadiusScale, type LocalProject, type ProjectFoundationScaleStep } from "../domain/project";

type FoundationsRadiusViewProps = {
  project: LocalProject;
  validation: TokenBundleValidationResult;
  onRadiusStepChange: (stepId: string, value: number) => void;
};

function parseNumberInput(value: string): number {
  return value.trim() ? Number(value) : Number.NaN;
}

function formatNumberInput(value: number): string {
  return Number.isFinite(value) ? String(value) : "";
}

function getPreviewRadius(value: number): number {
  if (!Number.isFinite(value) || value < 0) return 0;
  return Math.min(value, 48);
}

function getRadiusErrors(validation: TokenBundleValidationResult): string[] {
  return validation.errors.filter((error) => error.startsWith("Radius step "));
}

function getEditableScale(project: LocalProject): ProjectFoundationScaleStep[] {
  const rawScale = Array.isArray(project.foundations.radius?.scale) ? project.foundations.radius.scale : [];
  return getProjectRadiusScale(project).map((step) => {
    const rawStep = rawScale.find((item) => item.id === step.id);
    return rawStep ? { ...step, ...rawStep, id: step.id, name: step.name } : step;
  });
}

function FoundationsRadiusView({ project, validation, onRadiusStepChange }: FoundationsRadiusViewProps) {
  const scale = getEditableScale(project);
  const radiusErrors = getRadiusErrors(validation);

  return (
    <section className="panel content-panel">
      <div className="section-head">
        <div>
          <p className="eyebrow">Foundations / Radius</p>
          <h2>Radius scale MVP</h2>
        </div>
        <span className={radiusErrors.length ? "status-pill is-danger" : "status-pill is-valid"}>
          {radiusErrors.length ? "Validation a corriger" : "TokenBundle valide"}
        </span>
      </div>

      <div className="scale-list">
        {scale.map((step) => {
          const valueInvalid = !Number.isFinite(Number(step.value)) || Number(step.value) < 0;

          return (
            <div className="scale-row" key={step.id}>
              <div className="scale-label">
                <strong>radius/{step.id}</strong>
                <span>{step.name}</span>
              </div>
              <div className="field scale-value-field">
                <label htmlFor={`radius-${step.id}`}>Value</label>
                <input
                  id={`radius-${step.id}`}
                  className="input"
                  type="number"
                  min="0"
                  value={formatNumberInput(step.value)}
                  onChange={(event) => onRadiusStepChange(step.id, parseNumberInput(event.target.value))}
                />
                {valueInvalid ? <p className="field-error">Use a value greater than or equal to 0.</p> : null}
              </div>
              <div className="radius-preview" aria-hidden="true">
                <span style={{ borderRadius: `${getPreviewRadius(step.value)}px` }} />
              </div>
            </div>
          );
        })}
      </div>

      {radiusErrors.length ? (
        <div className="inline-error">
          {radiusErrors.map((error) => (
            <p key={error}>{error}</p>
          ))}
        </div>
      ) : null}
    </section>
  );
}

export default FoundationsRadiusView;
