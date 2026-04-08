import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

function parsePx(value, fallback = 0) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const text = String(value ?? "").trim().toLowerCase();
  const match = text.match(/-?\d+(?:\.\d+)?/);
  if (!match) return fallback;
  return Number(match[0]);
}

function parseLetterSpacing(value) {
  const text = String(value ?? "0").trim();
  const numeric = parseFloat(text.replace(/[^0-9.-]/g, ""));
  if (text.endsWith("%")) {
    return { unit: "PERCENT", value: Number.isFinite(numeric) ? numeric : 0 };
  }
  return { unit: "PIXELS", value: Number.isFinite(numeric) ? numeric : 0 };
}

function parseWeight(value, styleName) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const style = String(styleName || "").toLowerCase();
  if (style.includes("bold")) return 700;
  if (style.includes("semi")) return 600;
  if (style.includes("medium")) return 500;
  return 400;
}

function normalizeTokenKey(pathLike, fallback = "text-md") {
  const text = String(pathLike || "").trim();
  const parts = text.split("/").filter(Boolean);
  return parts[parts.length - 1] || fallback;
}

function toRatio(value, base, fallback) {
  if (!Number.isFinite(value) || !Number.isFinite(base) || base <= 0) return fallback;
  return Number((value / base).toFixed(4));
}

function main() {
  const root = process.cwd();
  const inputPath = resolve(root, "Styles de texte.json");
  const outPath = resolve(root, "src/presets/text-styles.generated.ts");
  if (!existsSync(inputPath)) {
    if (existsSync(outPath)) {
      console.warn(`[extract-text-styles] Missing ${inputPath}, keeping existing ${outPath}.`);
      return;
    }
    throw new Error(`Missing input file: ${inputPath}`);
  }

  const raw = JSON.parse(readFileSync(inputPath, "utf8"));
  const styles = raw?.styles?.text;
  if (!Array.isArray(styles) || !styles.length) {
    throw new Error("Invalid `Styles de texte.json`: expected `styles.text[]`.");
  }

  const templates = styles
    .map((entry) => {
      const value = entry?.value || {};
      const original = entry?.originalData || {};
      const name = String(entry?.name || "").trim();
      if (!name) return null;

      const size = parsePx(value.fontSize, 16);
      const lineHeight = parsePx(value.lineHeight, size * 1.4);
      const paragraphSpacing = parsePx(value.paragraphSpacing, size);
      const paragraphIndent = parsePx(value.paragraphIndent, 0);
      const letter = parseLetterSpacing(value.letterSpacing);

      const familyVariable = String(value.fontFamilyVariable || "").toLowerCase();
      const familyKind = familyVariable.includes("display") ? "display" : "body";
      const sizeToken = normalizeTokenKey(value.fontSizeVariable, familyKind === "display" ? "display-md" : "text-md");
      const preferredFontStyle = String(original?.fontName?.style || "").trim() || "Regular";

      return {
        name,
        familyKind,
        sizeToken,
        baseSize: size,
        lineHeightRatio: toRatio(lineHeight, size, 1.4),
        paragraphSpacingRatio: toRatio(paragraphSpacing, size, 1),
        paragraphIndent,
        letterSpacingUnit: letter.unit,
        letterSpacingValue: letter.value,
        textCase: String(original?.textCase || "ORIGINAL"),
        textDecoration: String(original?.textDecoration || "NONE"),
        preferredFontStyle,
        fallbackWeight: parseWeight(value.fontWeight, preferredFontStyle),
        italic: /italic/i.test(name) || /italic/i.test(preferredFontStyle),
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.name.localeCompare(b.name));

  const output = `/* Auto-generated from Styles de texte.json */\n\nexport type TextStyleTemplate = {\n  name: string;\n  familyKind: \"display\" | \"body\";\n  sizeToken: string;\n  baseSize: number;\n  lineHeightRatio: number;\n  paragraphSpacingRatio: number;\n  paragraphIndent: number;\n  letterSpacingUnit: \"PERCENT\" | \"PIXELS\";\n  letterSpacingValue: number;\n  textCase: string;\n  textDecoration: string;\n  preferredFontStyle: string;\n  fallbackWeight: number;\n  italic: boolean;\n};\n\nexport const TEXT_STYLE_TEMPLATES: TextStyleTemplate[] = ${JSON.stringify(templates, null, 2)};\n`;

  writeFileSync(outPath, output, "utf8");
  console.log(`[extract-text-styles] Generated ${outPath} with ${templates.length} style templates.`);
}

main();
