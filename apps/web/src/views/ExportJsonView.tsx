import { useMemo, useState } from "react";
import { exportTokenBundleJson } from "@starter-tokens/exporters";
import type { TokenBundle } from "@starter-tokens/ds-core";

type ExportJsonViewProps = {
  bundle: TokenBundle;
};

function ExportJsonView({ bundle }: ExportJsonViewProps) {
  const [copyStatus, setCopyStatus] = useState("Prêt à copier");
  const json = useMemo(() => exportTokenBundleJson(bundle), [bundle]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(json);
      setCopyStatus("JSON copié");
    } catch {
      setCopyStatus("Copie indisponible dans ce navigateur");
    }
  }

  function handleDownload() {
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
          <button className="button button-secondary" type="button" onClick={handleCopy}>
            Copier
          </button>
          <button className="button button-primary" type="button" onClick={handleDownload}>
            Télécharger
          </button>
        </div>
      </div>
      <p className="helper">{copyStatus}. CSS variables, Tailwind et sync avancée restent hors scope pour cette phase.</p>
      <pre className="code-preview">{json}</pre>
    </section>
  );
}

export default ExportJsonView;
