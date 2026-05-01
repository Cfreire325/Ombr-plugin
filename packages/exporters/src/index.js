import { normalizeTokenBundle } from "@starter-tokens/ds-core";

function exportTokenBundleJson(input, options = {}) {
  const normalized = normalizeTokenBundle(input);
  const space = Number.isInteger(options.space) ? options.space : 2;
  const json = JSON.stringify(normalized, null, space);
  return options.finalNewline === false ? json : `${json}\n`;
}

export { exportTokenBundleJson };
