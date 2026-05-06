import type { TokenBundleValidationResult } from "@starter-tokens/ds-core";
import { getProjectSpacingScale, type LocalProject, type ProjectFoundationScaleStep } from "../domain/project";

type FoundationsSpacingViewProps = {
  project: LocalProject;
  validation: TokenBundleValidationResult;
  onSpacingStepChange: (stepId: string, value: number) => void;
};

function parseNumberInput(value: string): number {
  return value.trim() ? Number(value) : Number.NaN;
}

function formatNumberInput(value: number): string {
  return Number.isFinite(value) ? String(value) : "";
}

function getPreviewWidth(value: number): number {
  if (!Number.isFinite(value) || value < 0) return 0;
  return Math.min(value, 180);
}

function getSpacingErrors(validation: TokenBundleValidationResult): string[] {
  return validation.errors.filter((error) => error.startsWith("Spacing step "));
}

function getEditableScale(project: LocalProject): ProjectFoundationScaleStep[] {
  const rawScale = Array.isArray(project.foundations.spacing?.scale) ? project.foundations.spacing.scale : [];
  return getProjectSpacingScale(project).map((step) => {
    const rawStep = rawScale.find((item) => item.id === step.id);
    return rawStep ? { ...step, ...rawStep, id: step.id, name: step.name } : step;
  });
}

function FoundationsSpacingView({ project, validation, onSpacingStepChange }: FoundationsSpacingViewProps) {
  const scale = getEditableScale(project);
  const spacingErrors = getSpacingErrors(validation);

  return (
    <section className="panel content-panel">
      <div className="section-head">
        <div>
          <p className="eyebrow">Foundations / Spacing</p>
          <h2>Spacing scale MVP</h2>
        </div>
        <span className={spacingErrors.length ? "status-pill is-danger" : "status-pill is-valid"}>
          {spacingErrors.length ? "Validation a corriger" : "TokenBundle valide"}
        </span>
      </div>

      <div className="scale-list">
        {scale.map((step) => {
          const valueInvalid = !Number.isFinite(Number(step.value)) || Number(step.value) < 0;

          return (
            <div className="scale-row" key={step.id}>
              <div className="scale-label">
                <strong>spacing/{step.id}</strong>
                <span>{step.name}</span>
              </div>
              <div className="field scale-value-field">
                <label htmlFor={`spacing-${step.id}`}>Value</label>
                <input
                  id={`spacing-${step.id}`}
                  className="input"
                  type="number"
                  min="0"
                  value={formatNumberInput(step.value)}
                  onChange={(event) => onSpacingStepChange(step.id, parseNumberInput(event.target.value))}
                />
                {valueInvalid ? <p className="field-error">Use a value greater than or equal to 0.</p> : null}
              </div>
              <div className="spacing-preview" aria-hidden="true">
                <span style={{ width: `${getPreviewWidth(step.value)}px` }} />
              </div>
            </div>
          );
        })}
      </div>

      {spacingErrors.length ? (
        <div className="inline-error">
          {spacingErrors.map((error) => (
            <p key={error}>{error}</p>
          ))}
        </div>
      ) : null}
    </section>
  );
}

export default FoundationsSpacingView;
