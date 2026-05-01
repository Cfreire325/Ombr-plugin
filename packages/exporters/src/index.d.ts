export interface ExportTokenBundleJsonOptions {
  space?: number;
  finalNewline?: boolean;
}

export function exportTokenBundleJson(input: unknown, options?: ExportTokenBundleJsonOptions): string;
