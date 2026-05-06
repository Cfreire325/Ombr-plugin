import { parseColorInput, type TokenBundle, type TokenBundleValidationResult } from "@starter-tokens/ds-core";
import { getAvailableColorPresetSummaries, getSelectedColorPreset } from "../domain/color-presets";
import { getProjectColorPrimitiveReferences } from "../domain/token-bundle";
import {
  getProjectBrands,
  getProjectColorModeAliases,
  getProjectSelectedPalettes,
  MAX_PROJECT_BRANDS,
  type LocalProject,
  type ProjectBaseColorKey,
} from "../domain/project";

type FoundationsColorsViewProps = {
  project: LocalProject;
  bundle: TokenBundle | null;
  validation: TokenBundleValidationResult;
  onAddBrand: () => void;
  onBaseColorChange: (colorKey: ProjectBaseColorKey, colorValue: string) => void;
  onColorPresetChange: (colorPresetId: string) => void;
  onColorModeAliasChange: (aliasName: string, patch: { light?: string; dark?: string }) => void;
  onNeutralChoiceChange: (neutralChoice: string) => void;
  onRemoveBrand: (brandId: string) => void;
  onSelectedPaletteChange: (paletteKey: string, selected: boolean) => void;
  onUpdateBrand: (brandId: string, patch: { name?: string; color?: string }) => void;
};

function formatValue(value: unknown): string {
  return typeof value === "object" && value !== null ? JSON.stringify(value) : String(value);
}

function getPrimitiveValue(value: unknown): string {
  return formatValue(value);
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

function normalizePrimitiveReference(reference: string): string {
  return reference.replace(/^primitives\//, "");
}

function isKnownPrimitiveReference(reference: string, primitiveReferences: string[]): boolean {
  return primitiveReferences.includes(normalizePrimitiveReference(reference));
}

function FoundationsColorsView({
  project,
  bundle,
  validation,
  onAddBrand,
  onBaseColorChange,
  onColorModeAliasChange,
  onColorPresetChange,
  onNeutralChoiceChange,
  onRemoveBrand,
  onSelectedPaletteChange,
  onUpdateBrand,
}: FoundationsColorsViewProps) {
  const colorPrimitiveTokens = bundle ? bundle.collections.primitives.filter((token) => token.type === "COLOR") : [];
  const colorModeTokens = bundle ? bundle.collections.semantic.filter((token) => token.type === "COLOR" && token.name.startsWith("color/")) : [];
  const colorModeAliases = getProjectColorModeAliases(project);
  const colorPrimitiveReferences = getProjectColorPrimitiveReferences(project);
  const colorPrimitiveNames = colorPrimitiveReferences.length ? colorPrimitiveReferences : colorPrimitiveTokens.map((token) => token.name);
  const brands = getProjectBrands(project);
  const selectedPaletteKeys = getProjectSelectedPalettes(project);
  const presetSummaries = getAvailableColorPresetSummaries();
  const selectedPreset = getSelectedColorPreset(project.foundations.colors.colorPresetId);
  const previewPalettes = selectedPreset.previewPalettes.slice(0, 6);
  const baseWhiteValid = isValidColor(project.foundations.colors.baseWhite);
  const baseBlackValid = isValidColor(project.foundations.colors.baseBlack);
  const primaryBrandScale = (bundle?.collections.primitives ?? [])
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
            <h2>Color primitives</h2>
          </div>
          <span className={validation.valid ? "status-pill is-valid" : "status-pill is-danger"}>{validation.valid ? "TokenBundle valide" : "Validation à corriger"}</span>
        </div>
        <p className="helper">Brands, palettes et neutrals sont des primitives: elles servent de matiere premiere et ne portent pas l'intention light/dark.</p>

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
          <p className="helper">Source partagée depuis ds-core. Les palettes complètes et la sélection fine arriveront dans une phase suivante.</p>
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
            <p className="helper">Prepare les primitives neutral/gray utilisees ensuite par les Color Modes.</p>
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
              <h3>Palette primitives incluses</h3>
            </div>
            <span className="status-pill">{selectedPaletteKeys.length} selected</span>
          </div>
          <p className="helper">La neutral selectionnee est toujours incluse comme primitive, meme si elle n'est pas cochee.</p>

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
              <h3>Brand primitives</h3>
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

          <p className="helper">La premiere brand genere colors/brand/*. Les brands additionnelles generent aussi des primitives stables, sans mapping light/dark direct.</p>

          <div className="brand-scale-preview" aria-label="Primary brand generated scale">
            {primaryBrandScale.slice(0, 12).map((token) => (
              <span key={token.name} title={token.name} style={{ background: token.value }} />
            ))}
          </div>

          {brands.length >= MAX_PROJECT_BRANDS ? <p className="field-error">Limite atteinte: 10 brand colors maximum.</p> : null}
        </div>

        <div className="color-mode-editor">
          <div className="brand-editor-head">
            <div>
              <p className="eyebrow">Color Modes</p>
              <h3>Semantic aliases</h3>
            </div>
            <span className="status-pill">{colorModeAliases.length} aliases</span>
          </div>
          <p className="helper">Ces aliases portent le choix light/dark. Ils pointent vers les primitives couleur generees au-dessus.</p>
          <datalist id="color-mode-primitive-options">
            {colorPrimitiveNames.map((name) => (
              <option key={name} value={name} />
            ))}
          </datalist>
          <div className="color-mode-list">
            {colorModeAliases.map((alias) => {
              const lightReferenceValid = isKnownPrimitiveReference(alias.light, colorPrimitiveNames);
              const darkReferenceValid = project.modeSetup === "light" || isKnownPrimitiveReference(alias.dark, colorPrimitiveNames);
              return (
                <div className="color-mode-row" key={alias.name}>
                  <div className="scale-label">
                    <strong>{alias.label}</strong>
                    <span>{alias.name}</span>
                  </div>
                  <div className="field">
                    <label htmlFor={`color-mode-light-${alias.name}`}>Light</label>
                    <input
                      id={`color-mode-light-${alias.name}`}
                      className={lightReferenceValid ? "input" : "input input-invalid"}
                      list="color-mode-primitive-options"
                      value={alias.light}
                      onChange={(event) => onColorModeAliasChange(alias.name, { light: event.target.value })}
                    />
                    {!lightReferenceValid ? <p className="field-error">Reference primitive inconnue.</p> : null}
                  </div>
                  <div className="field">
                    <label htmlFor={`color-mode-dark-${alias.name}`}>Dark</label>
                    <input
                      id={`color-mode-dark-${alias.name}`}
                      className={darkReferenceValid ? "input" : "input input-invalid"}
                      list="color-mode-primitive-options"
                      value={alias.dark}
                      onChange={(event) => onColorModeAliasChange(alias.name, { dark: event.target.value })}
                    />
                    {!darkReferenceValid ? <p className="field-error">Reference primitive inconnue.</p> : null}
                  </div>
                </div>
              );
            })}
          </div>
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
            <p className="eyebrow">Color primitives</p>
            <h2>Matiere premiere</h2>
          </div>
        </div>
        <p className="helper">Ces tokens ne decident pas du theme. La valeur affichee est la meme pour les modes du TokenBundle.</p>
        <div className="token-table">
          <div className="token-row token-row-head token-row-primitive">
            <span>Token</span>
            <span>Value</span>
            <span>Type</span>
          </div>
          {colorPrimitiveTokens.map((token) => (
            <div className="token-row token-row-primitive" key={`${token.collection}/${token.name}`}>
              <strong>{token.name}</strong>
              <code>{getPrimitiveValue(token.values.light)}</code>
              <span>{token.type}</span>
            </div>
          ))}
          {!colorPrimitiveTokens.length ? (
            <div className="token-row token-row-primitive">
              <strong>Aucune primitive couleur</strong>
              <code>Corrige les erreurs de couleur</code>
              <span>Erreur</span>
            </div>
          ) : null}
        </div>

        <div className="section-head token-section-head">
          <div>
            <p className="eyebrow">Color Modes</p>
            <h2>Semantic aliases</h2>
          </div>
        </div>
        <p className="helper">C'est ici que les references light/dark existent. Les futurs composants pointeront vers cette couche, pas vers les primitives.</p>
        <div className="token-table">
          <div className="token-row token-row-head">
            <span>Token</span>
            <span>Light</span>
            <span>Dark</span>
            <span>Type</span>
          </div>
          {colorModeTokens.map((token) => (
            <div className="token-row" key={`${token.collection}/${token.name}`}>
              <strong>{token.name}</strong>
              <code>{formatValue(token.values.light)}</code>
              <code>{formatValue(token.values.dark)}</code>
              <span>{token.type}</span>
            </div>
          ))}
          {!colorModeTokens.length ? (
            <div className="token-row">
              <strong>Aucun TokenBundle généré</strong>
              <code>Corrige les erreurs de couleur</code>
              <code>Corrige les erreurs de couleur</code>
              <span>Erreur</span>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

export default FoundationsColorsView;
