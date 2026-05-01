import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const html = await fs.readFile(path.resolve(__dirname, "ui.html"), "utf8");

assert.match(html, /id="prepareJsonExportCheckbox"/, "UI includes an opt-in JSON export checkbox");
assert.match(html, /id="jsonExportPanel"/, "UI includes an export-ready panel");
assert.match(html, /id="downloadJsonExportBtn"/, "UI includes a Download JSON action");
assert.match(html, /exportJson:\s*state\.prepareJsonExport\s*===\s*true/, "generate payload sends exportJson only when explicitly enabled");
assert.match(html, /type:\s*"request-last-json-export"/, "UI requests JSON through the dedicated controller message");
assert.match(html, /msg\.type\s*===\s*"json-export-result"/, "UI handles the dedicated JSON export response");
assert.match(html, /new Blob\(\[msg\.json\]/, "UI downloads from a Blob created in ui.html");
assert.match(html, /URL\.createObjectURL/, "UI creates a temporary object URL for download");
assert.match(html, /URL\.revokeObjectURL/, "UI cleans up the temporary object URL");
assert.doesNotMatch(html, /clipboard/i, "UI does not add clipboard export behavior yet");
assert.doesNotMatch(html, /tailwind\s+(config|export)/i, "UI does not add Tailwind export behavior");
assert.doesNotMatch(html, /style dictionary/i, "UI does not add Style Dictionary export behavior");

console.log("UI JSON export contract tests passed.");
