import { normalizeTokenBundle, type TokenBundle } from "@starter-tokens/ds-core";
import type { LocalProject } from "./project";

export type TokenBundleSummary = {
  primitiveCount: number;
  semanticCount: number;
  componentCount: number;
  tokenCount: number;
};

export function buildMinimalTokenBundle(project: LocalProject): TokenBundle {
  const { baseWhite, baseBlack, brandPrimary } = project.foundations.colors;

  return normalizeTokenBundle({
    schemaVersion: "1.0.0",
    source: "web",
    generatedAt: project.updatedAt,
    collections: {
      primitives: [
        {
          name: "colors/base/white",
          type: "COLOR",
          values: { light: baseWhite, dark: baseWhite },
          scopes: ["ALL_SCOPES"],
          description: "Base white color.",
        },
        {
          name: "colors/base/black",
          type: "COLOR",
          values: { light: baseBlack, dark: baseBlack },
          scopes: ["ALL_SCOPES"],
          description: "Base black color.",
        },
        {
          name: "colors/brand/500",
          type: "COLOR",
          values: { light: brandPrimary, dark: brandPrimary },
          scopes: ["ALL_SCOPES"],
          description: "Primary brand color.",
        },
      ],
      semantic: [
        {
          name: "text/primary",
          type: "COLOR",
          values: {
            light: { alias: "primitives/colors/base/black" },
            dark: project.modeSetup === "light-dark" ? { alias: "primitives/colors/base/white" } : { alias: "primitives/colors/base/black" },
          },
          scopes: ["TEXT_FILL"],
          description: "Primary text color.",
        },
        {
          name: "bg/canvas",
          type: "COLOR",
          values: {
            light: { alias: "primitives/colors/base/white" },
            dark: project.modeSetup === "light-dark" ? { alias: "primitives/colors/base/black" } : { alias: "primitives/colors/base/white" },
          },
          scopes: ["FRAME_FILL"],
          description: "Canvas background color.",
        },
      ],
      components: [],
    },
  });
}

export function summarizeTokenBundle(bundle: TokenBundle): TokenBundleSummary {
  const primitiveCount = bundle.collections.primitives.length;
  const semanticCount = bundle.collections.semantic.length;
  const componentCount = bundle.collections.components.length;

  return {
    primitiveCount,
    semanticCount,
    componentCount,
    tokenCount: primitiveCount + semanticCount + componentCount,
  };
}
