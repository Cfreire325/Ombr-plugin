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
assert.match(html, /id="copyJsonExportBtn"/, "UI includes a Copy JSON action");
assert.match(html, /prepareJsonExport:\s*false/, "JSON export is off by default");
assert.match(html, /const generationPayload\s*=\s*{/, "generate builds a payload object before posting");
assert.match(html, /if\s*\(state\.prepareJsonExport\s*===\s*true\)\s*{\s*generationPayload\.exportJson\s*=\s*true;\s*}/s, "generate payload sends exportJson only when explicitly enabled");
assert.doesNotMatch(html, /exportJson:\s*state\.prepareJsonExport\s*===\s*true/, "generate payload does not send exportJson false when disabled");
assert.match(html, /clearJsonExportState\(\);\s*setStatus\("Génération en cours\.\.\."\)/, "new generations clear stale JSON export metadata before starting");
assert.match(html, /if\s*\(report\.exportJson\?\.jsonReady\s*===\s*true\)\s*{\s*renderJsonExportReady\(report\.exportJson\);\s*}\s*else\s*{\s*clearJsonExportState\(\);\s*}/s, "successful generation without export metadata clears export-ready state");
assert.match(html, /type:\s*"request-last-json-export"/, "UI requests JSON through the dedicated controller message");
assert.match(html, /msg\.type\s*===\s*"json-export-result"/, "UI handles the dedicated JSON export response");
assert.match(html, /downloadJsonExportBtn\.addEventListener\("click",\s*\(\)\s*=>\s*requestLastJsonExport\("download"\)\)/, "download action requests the last JSON export");
assert.match(html, /copyJsonExportBtn\.addEventListener\("click",\s*\(\)\s*=>\s*requestLastJsonExport\("copy"\)\)/, "copy action requests the last JSON export");
assert.match(html, /jsonExportPendingAction\s*=\s*action\s*===\s*"copy"\s*\?\s*"copy"\s*:\s*"download"/, "JSON request stores the pending export action");
assert.match(html, /if\s*\(!jsonExportPendingAction\)\s*{\s*return;\s*}/s, "stale JSON export responses without a pending action are ignored");
assert.match(html, /if\s*\(jsonExportPendingAction\s*===\s*"copy"\)\s*{\s*copyJsonExportFromMessage\(msg\);\s*return;\s*}/s, "JSON export response can route to copy behavior");
assert.match(html, /if\s*\(jsonExportPendingAction\s*===\s*"download"\)\s*{\s*downloadJsonExportFromMessage\(msg\);\s*return;\s*}/s, "JSON export response can route to download behavior");
assert.match(html, /if\s*\(jsonExportRequestInFlight\)\s*return;/, "repeated clicks are ignored while a JSON export request is pending");
assert.match(html, /function setJsonExportError\(message\)[\s\S]*jsonExportPendingAction\s*=\s*"";/, "JSON export errors clear pending action state");
assert.match(html, /downloadJsonExportFromMessage\(msg\)[\s\S]*jsonExportPendingAction\s*=\s*"";/, "download success clears pending action state");
assert.match(html, /copyJsonExportFromMessage\(msg\)[\s\S]*jsonExportPendingAction\s*=\s*"";/, "copy success clears pending action state");
assert.match(html, /navigator\.clipboard\.writeText\(msg\.json\)/, "copy action writes the full JSON to clipboard in ui.html");
assert.match(html, /Clipboard unavailable/, "copy action has an unavailable-clipboard failure path");
assert.match(html, /if\s*\(!jsonExportMetadata\?\.jsonReady\)\s*{\s*setJsonExportError\("Aucun export JSON disponible/, "download action handles no export available");
assert.match(html, /if\s*\(!msg\.json\s*\|\|\s*typeof msg\.json !== "string"\)\s*{\s*setJsonExportError\("Export JSON vide ou introuvable\."\)/, "download action handles missing or empty JSON");
assert.match(html, /copyJsonExportFromMessage\(msg\)[\s\S]*Export JSON vide ou introuvable\./, "copy action handles missing or empty JSON");
assert.match(html, /jsonExportRequestTimer\s*=\s*setTimeout/, "download request has a failed-request timeout");
assert.match(html, /setJsonExportError\("Export request failed: aucun retour du plugin\."\)/, "download request timeout reports a clear failure");
assert.match(html, /new Blob\(\[msg\.json\]/, "UI downloads from a Blob created in ui.html");
assert.match(html, /URL\.createObjectURL/, "UI creates a temporary object URL for download");
assert.match(html, /URL\.revokeObjectURL/, "UI cleans up the temporary object URL");
assert.doesNotMatch(html, /tailwind\s+(config|export)/i, "UI does not add Tailwind export behavior");
assert.doesNotMatch(html, /style dictionary/i, "UI does not add Style Dictionary export behavior");

console.log("UI JSON export contract tests passed.");
