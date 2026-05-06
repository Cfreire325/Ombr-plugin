import { useMemo, useState } from "react";
import { exportTokenBundleJson } from "@starter-tokens/exporters";
import type { TokenBundle, TokenBundleValidationResult } from "@starter-tokens/ds-core";

type ExportJsonViewProps = {
  bundle: TokenBundle | null;
  validation: TokenBundleValidationResult;
};

function ExportJsonView({ bundle, validation }: ExportJsonViewProps) {
  const [copyStatus, setCopyStatus] = useState("Prêt à copier");
  const json = useMemo(() => (bundle ? exportTokenBundleJson(bundle) : ""), [bundle]);

  async function handleCopy() {
    if (!json) return;
    try {
      await navigator.clipboard.writeText(json);
      setCopyStatus("JSON copié");
    } catch {
      setCopyStatus("Copie indisponible dans ce navigateur");
    }
  }

  function handleDownload() {
    if (!json) return;
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "ombr-token-bundle.json";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="panel content-panel">
      <div className="section-head">
        <div>
          <p className="eyebrow">Export JSON</p>
          <h2>Export développeur MVP</h2>
        </div>
        <div className="export-actions">
          <button className="button button-secondary" type="button" onClick={handleCopy} disabled={!bundle}>
            Copier
          </button>
          <button className="button button-primary" type="button" onClick={handleDownload} disabled={!bundle}>
            Télécharger
          </button>
        </div>
      </div>
      <p className="helper">{bundle ? copyStatus : "Corrige les erreurs avant d'exporter."} CSS variables, Tailwind et sync avancée restent hors scope pour cette phase.</p>
      {bundle ? (
        <pre className="code-preview">{json}</pre>
      ) : (
        <div className="inline-error">
          {validation.errors.map((error) => (
            <p key={error}>{error}</p>
          ))}
        </div>
      )}
    </section>
  );
}

export default ExportJsonView;
