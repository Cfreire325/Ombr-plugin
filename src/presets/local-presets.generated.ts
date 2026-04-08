/* Auto-generated from local JSON preset files. */
import type { PresetDefinition } from "./types";

export const LOCAL_PRESETS: PresetDefinition[] = [
  {
    "id": "default",
    "label": "Default",
    "description": "Fallback preset when no local JSON preset is available.",
    "palettes": {
      "gray": {
        "50": "#f8fafc",
        "500": "#64748b",
        "900": "#0f172a"
      }
    },
    "neutralOptions": [
      "gray"
    ],
    "defaultNeutral": "gray",
    "steps": [
      "50",
      "500",
      "900"
    ],
    "previewPalettes": [
      {
        "name": "Gray",
        "steps": [
          "50",
          "500",
          "900"
        ],
        "colorsByStep": {
          "50": "#f8fafc",
          "500": "#64748b",
          "900": "#0f172a"
        }
      }
    ]
  }
];
