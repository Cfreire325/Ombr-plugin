import type { TokenBundle, TokenBundleValidationResult } from "@starter-tokens/ds-core";
import type { LocalProject } from "../domain/project";

type FoundationsColorsViewProps = {
  project: LocalProject;
  bundle: TokenBundle;
  validation: TokenBundleValidationResult;
  onBrandColorChange: (brandColor: string) => void;
};

function formatValue(value: unknown): string {
  return typeof value === "object" && value !== null ? JSON.stringify(value) : String(value);
}

function FoundationsColorsView({ project, bundle, validation, onBrandColorChange }: FoundationsColorsViewProps) {
  const tokens = [...bundle.collections.primitives, ...bundle.collections.semantic];

  return (
    <section className="content-grid">
      <div className="panel content-panel">
        <div className="section-head">
          <div>
            <p className="eyebrow">Foundations / Colors</p>
            <h2>Base couleur minimale</h2>
          </div>
          <span className={validation.valid ? "status-pill is-valid" : "status-pill is-danger"}>{validation.valid ? "TokenBundle valide" : "Validation à corriger"}</span>
        </div>

        <div className="field">
          <label htmlFor="creator-brand-color">Brand primary</label>
          <div className="color-input-line">
            <input
              id="creator-brand-color"
              className="input"
              value={project.foundations.colors.brandPrimary}
              onChange={(event) => onBrandColorChange(event.target.value)}
            />
            <input
              className="color-swatch-input"
              type="color"
              value={project.foundations.colors.brandPrimary}
              onChange={(event) => onBrandColorChange(event.target.value)}
              aria-label="Couleur brand primaire"
            />
          </div>
          <p className="helper">Phase B génère uniquement base white, base black, brand 500, text primary et bg canvas.</p>
        </div>

        {validation.errors.length ? (
          <div className="inline-error">
            {validation.errors.map((error) => (
              <p key={error}>{error}</p>
            ))}
          </div>
        ) : null}
      </div>

      <div className="panel content-panel">
        <div className="section-head">
          <div>
            <p className="eyebrow">Token table</p>
            <h2>Primitives et semantic</h2>
          </div>
        </div>
        <div className="token-table">
          <div className="token-row token-row-head">
            <span>Token</span>
            <span>Light</span>
            <span>Dark</span>
            <span>Type</span>
          </div>
          {tokens.map((token) => (
            <div className="token-row" key={`${token.collection}/${token.name}`}>
              <strong>{token.name}</strong>
              <code>{formatValue(token.values.light)}</code>
              <code>{formatValue(token.values.dark)}</code>
              <span>{token.type}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default FoundationsColorsView;
