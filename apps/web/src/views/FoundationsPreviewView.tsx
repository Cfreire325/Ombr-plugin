import type { TokenBundle, TokenBundleValidationResult } from "@starter-tokens/ds-core";
import {
  getProjectRadiusScale,
  getProjectSpacingScale,
  getProjectTypographyStyles,
  type LocalProject,
  type ProjectFoundationScaleStep,
  type ProjectTypographyStyle,
} from "../domain/project";

type FoundationsPreviewViewProps = {
  project: LocalProject;
  bundle: TokenBundle | null;
  validation: TokenBundleValidationResult;
};

type PreviewMode = "light" | "dark";

type ResolvedPreviewTokens = {
  background: string | null;
  text: string | null;
  border: string | null;
  action: string | null;
};

const FALLBACK_LIGHT = {
  background: "#ffffff",
  text: "#171717",
  border: "#d9dddd",
  action: "#3f6f5f",
};

const FALLBACK_DARK = {
  background: "#171717",
  text: "#f6f7f8",
  border: "#3a413e",
  action: "#7fb39f",
};

function getStyle(styles: ProjectTypographyStyle[], id: ProjectTypographyStyle["id"], fallbackIndex: number): ProjectTypographyStyle {
  return styles.find((style) => style.id === id) ?? styles[fallbackIndex] ?? styles[0];
}

function getScaleStep(scale: ProjectFoundationScaleStep[], preferredIds: string[], fallbackIndex: number): ProjectFoundationScaleStep {
  return preferredIds.map((id) => scale.find((step) => step.id === id)).find((step): step is ProjectFoundationScaleStep => Boolean(step)) ?? scale[fallbackIndex] ?? scale[0];
}

function getFiniteValue(step: ProjectFoundationScaleStep | undefined, fallback: number, max?: number): number {
  const value = Number(step?.value);
  if (!Number.isFinite(value) || value < 0) return fallback;
  return typeof max === "number" ? Math.min(value, max) : value;
}

function normalizeAliasPath(path: string): string {
  return path.replace(/^primitives\//, "");
}

function resolveTokenColor(bundle: TokenBundle, tokenName: string, mode: PreviewMode, visited = new Set<string>()): string | null {
  if (visited.has(tokenName)) return null;
  visited.add(tokenName);

  const token = [...bundle.collections.semantic, ...bundle.collections.primitives].find((item) => item.name === tokenName);
  if (!token || token.type !== "COLOR") return null;

  const modeValue = token.values[mode] ?? token.values.light;
  if (typeof modeValue === "string") return modeValue;

  if (modeValue && typeof modeValue === "object" && "alias" in modeValue && typeof modeValue.alias === "string") {
    return resolveTokenColor(bundle, normalizeAliasPath(modeValue.alias), mode, visited);
  }

  return null;
}

function resolveFirstColor(bundle: TokenBundle, names: string[], mode: PreviewMode): string | null {
  for (const name of names) {
    const color = resolveTokenColor(bundle, name, mode);
    if (color) return color;
  }

  return null;
}

function getPreviewTokens(bundle: TokenBundle, mode: PreviewMode): ResolvedPreviewTokens {
  return {
    background: resolveFirstColor(bundle, ["color/background/primary", "colors/base/white"], mode),
    text: resolveFirstColor(bundle, ["color/text/primary", "colors/gray/900"], mode),
    border: resolveFirstColor(bundle, ["color/border/primary", "colors/gray/200", "colors/gray/700"], mode),
    action: resolveFirstColor(bundle, ["colors/brand/600", "colors/brand/500", "colors/brand/700"], mode),
  };
}

function getReadableFallback(mode: PreviewMode) {
  return mode === "dark" ? FALLBACK_DARK : FALLBACK_LIGHT;
}

function makeTypeStyle(style: ProjectTypographyStyle | undefined) {
  if (!style) return {};
  return {
    fontFamily: style.fontFamily.trim() || undefined,
    fontSize: `${style.fontSize}px`,
    lineHeight: `${style.lineHeight}px`,
    fontWeight: style.fontWeight,
  };
}

function PreviewSurface({
  mode,
  tokens,
  headingStyle,
  bodyStyle,
  captionStyle,
  labelStyle,
  spacing,
  radius,
}: {
  mode: PreviewMode;
  tokens: ResolvedPreviewTokens;
  headingStyle: ProjectTypographyStyle | undefined;
  bodyStyle: ProjectTypographyStyle | undefined;
  captionStyle: ProjectTypographyStyle | undefined;
  labelStyle: ProjectTypographyStyle | undefined;
  spacing: number;
  radius: number;
}) {
  const fallback = getReadableFallback(mode);
  const background = tokens.background ?? fallback.background;
  const text = tokens.text ?? fallback.text;
  const border = tokens.border ?? fallback.border;
  const action = tokens.action ?? fallback.action;
  const softSurface = mode === "dark" ? "rgba(255, 255, 255, 0.07)" : "rgba(255, 255, 255, 0.72)";
  const mutedText = mode === "dark" ? "rgba(246, 247, 248, 0.72)" : "rgba(23, 23, 23, 0.64)";

  return (
    <article
      className={`foundation-preview-surface is-${mode}`}
      style={{
        background,
        color: text,
        borderColor: border,
        borderRadius: `${radius}px`,
        padding: `${spacing}px`,
      }}
    >
      <div className="foundation-preview-mode-head">
        <span>{mode === "dark" ? "Dark mode" : "Light mode"}</span>
        <i style={{ background: action }} aria-hidden="true" />
      </div>

      <div
        className="foundation-preview-card"
        style={{
          background: softSurface,
          borderColor: border,
          borderRadius: `${Math.max(radius - 2, 0)}px`,
          padding: `${Math.max(spacing * 0.75, 12)}px`,
          gap: `${Math.max(spacing * 0.5, 10)}px`,
        }}
      >
        <div className="foundation-preview-copy">
          <h3 style={makeTypeStyle(headingStyle)}>Launch-ready foundations</h3>
          <p style={{ ...makeTypeStyle(bodyStyle), color: mutedText }}>
            Semantic color aliases, type scale, spacing, and radius are rendered together before components exist.
          </p>
          <small style={{ ...makeTypeStyle(captionStyle), color: mutedText }}>TokenBundle preview, no component tokens generated.</small>
        </div>

        <button
          className="foundation-preview-button"
          type="button"
          style={{
            background: action,
            borderRadius: `${Math.max(radius * 0.75, 4)}px`,
            padding: `${Math.max(spacing * 0.35, 8)}px ${Math.max(spacing * 0.7, 14)}px`,
            ...makeTypeStyle(labelStyle),
          }}
        >
          Apply foundations
        </button>
      </div>
    </article>
  );
}

function FoundationsPreviewView({ project, bundle, validation }: FoundationsPreviewViewProps) {
  const typographyStyles = getProjectTypographyStyles(project);
  const spacingScale = getProjectSpacingScale(project);
  const radiusScale = getProjectRadiusScale(project);
  const headingStyle = getStyle(typographyStyles, "display-sm", 4);
  const bodyStyle = getStyle(typographyStyles, "text-md", 8);
  const captionStyle = getStyle(typographyStyles, "text-xs", 10);
  const labelStyle = getStyle(typographyStyles, "label", 11);
  const spacing = getFiniteValue(getScaleStep(spacingScale, ["3xl", "xl"], 8), 24, 56);
  const radius = getFiniteValue(getScaleStep(radiusScale, ["lg", "md"], 4), 12, 32);
  const lightTokens = bundle ? getPreviewTokens(bundle, "light") : null;
  const darkTokens = bundle ? getPreviewTokens(bundle, "dark") : null;

  return (
    <section className="panel content-panel">
      <div className="section-head">
        <div>
          <p className="eyebrow">Foundations / Preview</p>
          <h2>Light and dark preview</h2>
        </div>
        <span className={validation.valid ? "status-pill is-valid" : "status-pill is-danger"}>{validation.valid ? "Preview active" : "Preview partielle"}</span>
      </div>
      <p className="helper">Apercu MVP des foundations ensemble: Color Modes, typography, spacing et radius. Aucun component token n'est genere ici.</p>

      {!bundle || !lightTokens || !darkTokens ? (
        <div className="inline-error">
          {validation.errors.length ? validation.errors.map((error) => <p key={error}>{error}</p>) : <p>Preview indisponible tant que le TokenBundle n'est pas valide.</p>}
        </div>
      ) : (
        <div className="foundation-preview-grid">
          <PreviewSurface
            mode="light"
            tokens={lightTokens}
            headingStyle={headingStyle}
            bodyStyle={bodyStyle}
            captionStyle={captionStyle}
            labelStyle={labelStyle}
            spacing={spacing}
            radius={radius}
          />
          <PreviewSurface
            mode="dark"
            tokens={darkTokens}
            headingStyle={headingStyle}
            bodyStyle={bodyStyle}
            captionStyle={captionStyle}
            labelStyle={labelStyle}
            spacing={spacing}
            radius={radius}
          />
        </div>
      )}
    </section>
  );
}

export default FoundationsPreviewView;
