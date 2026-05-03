import { parseColorInput, type TokenBundle, type TokenBundleValidationResult } from "@starter-tokens/ds-core";
import { getAvailableColorPresetSummaries, getSelectedColorPreset } from "../domain/color-presets";
import { getProjectBrands, getProjectSelectedPalettes, MAX_PROJECT_BRANDS, type LocalProject, type ProjectBaseColorKey } from "../domain/project";

type FoundationsColorsViewProps = {
  project: LocalProject;
  bundle: TokenBundle;
  validation: TokenBundleValidationResult;
  onAddBrand: () => void;
  onBaseColorChange: (colorKey: ProjectBaseColorKey, colorValue: string) => void;
  onColorPresetChange: (colorPresetId: string) => void;
  onNeutralChoiceChange: (neutralChoice: string) => void;
  onRemoveBrand: (brandId: string) => void;
  onSelectedPaletteChange: (paletteKey: string, selected: boolean) => void;
  onUpdateBrand: (brandId: string, patch: { name?: string; color?: string }) => void;
};

function formatValue(value: unknown): string {
  return typeof value === "object" && value !== null ? JSON.stringify(value) : String(value);
}

function isValidColor(value: string): boolean {
  try {
    parseColorInput(value);
    return true;
  } catch {
    return false;
  }
}

function isHexColorInput(value: string): boolean {
  return /^#[0-9a-f]{6}$/i.test(value);
}

function getTokenColorValue(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function FoundationsColorsView({
  project,
  bundle,
  validation,
  onAddBrand,
  onBaseColorChange,
  onColorPresetChange,
  onNeutralChoiceChange,
  onRemoveBrand,
  onSelectedPaletteChange,
  onUpdateBrand,
}: FoundationsColorsViewProps) {
  const tokens = [...bundle.collections.primitives, ...bundle.collections.semantic];
  const brands = getProjectBrands(project);
  const selectedPaletteKeys = getProjectSelectedPalettes(project);
  const presetSummaries = getAvailableColorPresetSummaries();
  const selectedPreset = getSelectedColorPreset(project.foundations.colors.colorPresetId);
  const previewPalettes = selectedPreset.previewPalettes.slice(0, 6);
  const baseWhiteValid = isValidColor(project.foundations.colors.baseWhite);
  const baseBlackValid = isValidColor(project.foundations.colors.baseBlack);
  const primaryBrandScale = bundle.collections.primitives
    .filter((token) => token.name.startsWith("colors/brand/"))
    .map((token) => ({ name: token.name, value: getTokenColorValue(token.values.light) }))
    .filter((token): token is { name: string; value: string } => Boolean(token.value));
  const previewByKey = new Map(selectedPreset.previewPalettes.map((palette) => [palette.key || palette.name, palette]));
  const paletteCards = Object.entries(selectedPreset.palettes).map(([paletteKey, colorsByStep]) => {
    const preview = previewByKey.get(paletteKey);
    const steps = preview?.steps ?? Object.keys(colorsByStep);
    return {
      key: paletteKey,
      label: preview?.name ?? paletteKey,
      steps,
      colorsByStep,
      selected: selectedPaletteKeys.includes(paletteKey),
      forcedNeutral: paletteKey === project.foundations.colors.neutralChoice,
    };
  });

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
          <label htmlFor="creator-color-preset">Palette library</label>
          <select
            id="creator-color-preset"
            className="input"
            value={selectedPreset.id}
            onChange={(event) => onColorPresetChange(event.target.value)}
          >
            {presetSummaries.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.label}
              </option>
            ))}
          </select>
          <p className="helper">Source partagÃ©e depuis ds-core. Les palettes complÃ¨tes et la sÃ©lection fine arriveront dans une phase suivante.</p>
        </div>

        <div className="base-color-grid">
          <div className="field">
            <label htmlFor="creator-base-white">Base white</label>
            <input
              id="creator-base-white"
              className="input"
              value={project.foundations.colors.baseWhite}
              onChange={(event) => onBaseColorChange("baseWhite", event.target.value)}
            />
            {!baseWhiteValid ? <p className="field-error">Couleur invalide. Utilise un format hex ou rgb/rgba.</p> : null}
          </div>

          <div className="field">
            <label htmlFor="creator-base-black">Base black</label>
            <input
              id="creator-base-black"
              className="input"
              value={project.foundations.colors.baseBlack}
              onChange={(event) => onBaseColorChange("baseBlack", event.target.value)}
            />
            {!baseBlackValid ? <p className="field-error">Couleur invalide. Utilise un format hex ou rgb/rgba.</p> : null}
          </div>

          <div className="field">
            <label htmlFor="creator-neutral-choice">Neutral palette</label>
            <select
              id="creator-neutral-choice"
              className="input"
              value={project.foundations.colors.neutralChoice || selectedPreset.defaultNeutral}
              onChange={(event) => onNeutralChoiceChange(event.target.value)}
            >
              {selectedPreset.neutralOptions.map((neutral) => (
                <option key={neutral} value={neutral}>
                  {neutral}
                </option>
              ))}
            </select>
            <p className="helper">Prepare les futurs aliases colors/gray/* sans generer toute la palette dans cette phase.</p>
          </div>
        </div>

        <div className="preset-summary">
          <div>
            <p className="eyebrow">Preset actif</p>
            <h3>{selectedPreset.label}</h3>
            {selectedPreset.description ? <p className="muted">{selectedPreset.description}</p> : null}
          </div>
          <dl className="preset-meta">
            <div>
              <dt>Default neutral</dt>
              <dd>{selectedPreset.defaultNeutral}</dd>
            </div>
            <div>
              <dt>Neutral options</dt>
              <dd>{selectedPreset.neutralOptions.join(", ")}</dd>
            </div>
          </dl>
          <div className="preview-palette-list" aria-label="Preview palettes">
            {previewPalettes.map((palette) => (
              <div className="preview-palette" key={palette.name}>
                <span>{palette.name}</span>
                <div className="preview-swatches">
                  {palette.steps.slice(0, 8).map((step) => (
                    <i key={step} style={{ background: palette.colorsByStep[step] || "transparent" }} title={`${palette.name} ${step}`} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="palette-selector">
          <div className="brand-editor-head">
            <div>
              <p className="eyebrow">Selected palettes</p>
              <h3>Palettes incluses</h3>
            </div>
            <span className="status-pill">{selectedPaletteKeys.length} selected</span>
          </div>
          <p className="helper">La neutral selectionnee est toujours incluse dans les primitives, meme si elle n'est pas cochee.</p>

          <div className="palette-card-grid">
            {paletteCards.map((palette) => (
              <label className={palette.selected || palette.forcedNeutral ? "palette-card is-selected" : "palette-card"} key={palette.key}>
                <span className="palette-card-head">
                  <span>
                    <strong>{palette.label}</strong>
                    <small>{palette.key}</small>
                  </span>
                  <input
                    type="checkbox"
                    checked={palette.selected}
                    onChange={(event) => onSelectedPaletteChange(palette.key, event.target.checked)}
                  />
                </span>
                <span className="preview-swatches">
                  {palette.steps.slice(0, 8).map((step) => (
                    <i key={step} style={{ background: palette.colorsByStep[step] || "transparent" }} title={`${palette.key} ${step}`} />
                  ))}
                </span>
                {palette.forcedNeutral ? <small className="neutral-note">Neutral forcee</small> : null}
              </label>
            ))}
          </div>
        </div>

        <div className="brand-editor">
          <div className="brand-editor-head">
            <div>
              <p className="eyebrow">Brand colors</p>
              <h3>Primary et brands additionnelles</h3>
            </div>
            <button className="button button-secondary" type="button" onClick={onAddBrand} disabled={brands.length >= MAX_PROJECT_BRANDS}>
              Ajouter
            </button>
          </div>

          <div className="brand-list">
            {brands.map((brand, index) => {
              const isPrimary = index === 0;
              const colorIsValid = isValidColor(brand.color);
              return (
                <div className="brand-card" key={brand.id}>
                  <div className="brand-card-title">
                    <strong>{isPrimary ? "Primary brand" : `Brand ${index + 1}`}</strong>
                    {isPrimary ? <span className="status-pill">Primary</span> : null}
                  </div>
                  <div className="brand-card-fields">
                    <div className="field">
                      <label htmlFor={`brand-name-${brand.id}`}>Name</label>
                      <input
                        id={`brand-name-${brand.id}`}
                        className="input"
                        value={brand.name}
                        onChange={(event) => onUpdateBrand(brand.id, { name: event.target.value })}
                      />
                    </div>
                    <div className="field">
                      <label htmlFor={`brand-color-${brand.id}`}>Color</label>
                      <div className="color-input-line">
                        <input
                          id={`brand-color-${brand.id}`}
                          className="input"
                          value={brand.color}
                          onChange={(event) => onUpdateBrand(brand.id, { color: event.target.value })}
                        />
                        <input
                          className="color-swatch-input"
                          type="color"
                          value={isHexColorInput(brand.color) ? brand.color : "#000000"}
                          onChange={(event) => onUpdateBrand(brand.id, { color: event.target.value })}
                          aria-label={`Color swatch for ${brand.name}`}
                        />
                      </div>
                      {!colorIsValid ? <p className="field-error">Couleur invalide. Utilise un format hex ou rgb/rgba.</p> : null}
                    </div>
                  </div>
                  <button className="button button-ghost" type="button" onClick={() => onRemoveBrand(brand.id)} disabled={brands.length <= 1}>
                    Supprimer
                  </button>
                </div>
              );
            })}
          </div>

          <p className="helper">La premiere brand genere colors/brand/*. Les brands additionnelles generent des primitives nommees de facon stable.</p>

          <div className="brand-scale-preview" aria-label="Primary brand generated scale">
            {primaryBrandScale.slice(0, 12).map((token) => (
              <span key={token.name} title={token.name} style={{ background: token.value }} />
            ))}
          </div>

          {brands.length >= MAX_PROJECT_BRANDS ? <p className="field-error">Limite atteinte: 10 brand colors maximum.</p> : null}
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
