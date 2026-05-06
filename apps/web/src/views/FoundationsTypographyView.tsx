import type { TokenBundleValidationResult } from "@starter-tokens/ds-core";
import {
  getProjectTypographyStyles,
  type LocalProject,
  type ProjectTypographyStyle,
  type ProjectTypographyStyleId,
} from "../domain/project";

type FoundationsTypographyViewProps = {
  project: LocalProject;
  validation: TokenBundleValidationResult;
  onTypographyStyleChange: (
    styleId: ProjectTypographyStyleId,
    patch: Partial<Pick<ProjectTypographyStyle, "fontFamily" | "fontSize" | "lineHeight" | "fontWeight">>,
  ) => void;
};

function parseNumberInput(value: string): number {
  return value.trim() ? Number(value) : Number.NaN;
}

function formatNumberInput(value: number): string {
  return Number.isFinite(value) ? String(value) : "";
}

function getPreviewNumber(value: number, fallback: number, max: number): number {
  if (!Number.isFinite(value) || value <= 0) return fallback;
  return Math.min(value, max);
}

function getTypographyErrors(validation: TokenBundleValidationResult): string[] {
  return validation.errors.filter((error) => error.startsWith("Typography style "));
}

function getEditableStyles(project: LocalProject): ProjectTypographyStyle[] {
  const rawStyles = Array.isArray(project.foundations.typography?.styles) ? project.foundations.typography.styles : [];
  return getProjectTypographyStyles(project).map((style) => {
    const rawStyle = rawStyles.find((item) => item.id === style.id);
    return rawStyle ? { ...style, ...rawStyle, id: style.id, name: style.name } : style;
  });
}

function FoundationsTypographyView({ project, validation, onTypographyStyleChange }: FoundationsTypographyViewProps) {
  const styles = getEditableStyles(project);
  const typographyErrors = getTypographyErrors(validation);

  return (
    <section className="panel content-panel">
      <div className="section-head">
        <div>
          <p className="eyebrow">Foundations / Typography</p>
          <h2>Type styles MVP</h2>
        </div>
        <span className={typographyErrors.length ? "status-pill is-danger" : "status-pill is-valid"}>
          {typographyErrors.length ? "Validation a corriger" : "TokenBundle valide"}
        </span>
      </div>

      <div className="foundation-list">
        {styles.map((style) => {
          const fontSizeInvalid = !Number.isFinite(Number(style.fontSize)) || Number(style.fontSize) <= 0;
          const lineHeightInvalid = !Number.isFinite(Number(style.lineHeight)) || Number(style.lineHeight) <= 0;
          const fontWeightInvalid = !Number.isFinite(Number(style.fontWeight)) || Number(style.fontWeight) < 1 || Number(style.fontWeight) > 1000;

          return (
            <article className="foundation-card" key={style.id}>
              <div className="foundation-card-head">
                <div>
                  <p className="eyebrow">{style.id}</p>
                  <h3>{style.name}</h3>
                </div>
                <span className="status-pill">{style.fontSize}px</span>
              </div>

              <div className="foundation-form-grid">
                <div className="field">
                  <label htmlFor={`typography-${style.id}-font-family`}>Font family</label>
                  <input
                    id={`typography-${style.id}-font-family`}
                    className="input"
                    value={style.fontFamily}
                    onChange={(event) => onTypographyStyleChange(style.id, { fontFamily: event.target.value })}
                  />
                  {!style.fontFamily.trim() ? <p className="field-error">Font family is required.</p> : null}
                </div>

                <div className="field">
                  <label htmlFor={`typography-${style.id}-font-size`}>Font size</label>
                  <input
                    id={`typography-${style.id}-font-size`}
                    className="input"
                    type="number"
                    min="1"
                    value={formatNumberInput(style.fontSize)}
                    onChange={(event) => onTypographyStyleChange(style.id, { fontSize: parseNumberInput(event.target.value) })}
                  />
                  {fontSizeInvalid ? <p className="field-error">Use a positive number.</p> : null}
                </div>

                <div className="field">
                  <label htmlFor={`typography-${style.id}-line-height`}>Line height</label>
                  <input
                    id={`typography-${style.id}-line-height`}
                    className="input"
                    type="number"
                    min="1"
                    value={formatNumberInput(style.lineHeight)}
                    onChange={(event) => onTypographyStyleChange(style.id, { lineHeight: parseNumberInput(event.target.value) })}
                  />
                  {lineHeightInvalid ? <p className="field-error">Use a positive number.</p> : null}
                </div>

                <div className="field">
                  <label htmlFor={`typography-${style.id}-font-weight`}>Font weight</label>
                  <input
                    id={`typography-${style.id}-font-weight`}
                    className="input"
                    type="number"
                    min="1"
                    max="1000"
                    step="1"
                    value={formatNumberInput(style.fontWeight)}
                    onChange={(event) => onTypographyStyleChange(style.id, { fontWeight: parseNumberInput(event.target.value) })}
                  />
                  {fontWeightInvalid ? <p className="field-error">Use a number between 1 and 1000.</p> : null}
                </div>
              </div>

              <div
                className="typography-preview"
                style={{
                  fontFamily: style.fontFamily.trim() || undefined,
                  fontSize: `${getPreviewNumber(style.fontSize, 16, 42)}px`,
                  lineHeight: `${getPreviewNumber(style.lineHeight, 24, 52)}px`,
                  fontWeight: Number.isFinite(style.fontWeight) ? style.fontWeight : 400,
                }}
              >
                The quick brown fox builds a design system.
              </div>
            </article>
          );
        })}
      </div>

      {typographyErrors.length ? (
        <div className="inline-error">
          {typographyErrors.map((error) => (
            <p key={error}>{error}</p>
          ))}
        </div>
      ) : null}
    </section>
  );
}

export default FoundationsTypographyView;
