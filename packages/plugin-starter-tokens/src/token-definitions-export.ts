import { exportTokenBundleJson, type ExportTokenBundleJsonOptions } from "../../exporters/src/index.js";
import {
  tokenDefinitionsToTokenBundle,
  type TokenDefinitionForBundle,
  type TokenDefinitionsToTokenBundleOptions,
} from "./token-definitions-to-token-bundle";

export type ExportTokenDefinitionsJsonOptions = {
  mapperOptions?: TokenDefinitionsToTokenBundleOptions;
  jsonOptions?: ExportTokenBundleJsonOptions;
};

export function exportTokenDefinitionsJson(
  tokens: TokenDefinitionForBundle[],
  options: ExportTokenDefinitionsJsonOptions = {},
): string {
  const bundle = tokenDefinitionsToTokenBundle(tokens, options.mapperOptions);
  return exportTokenBundleJson(bundle, options.jsonOptions);
}
