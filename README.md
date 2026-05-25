# BB Attribute Labeler

Desktop tool (Tauri + React) for labeling attributes on bounding-box person crops.

## Dataset layout

```
my-dataset/
  images/         # .jpg .jpeg .png .webp .bmp
  labels/         # auto-created; one <stem>.json per image
  config.json     # optional; defines the attribute schema for this dataset
```

A label file is a flat object, e.g.:

```json
{ "facing": 45, "gender": "male", "accessories": ["hat", "bag"] }
```

`facing` is stored as an angle in degrees (0° = up, clockwise).

## `config.json`

If present, defines the attributes shown when the dataset is opened. If absent (or invalid), the attribute panel and direction picker are hidden — the app shows only the image list and the current image.

```json
{
  "attributes": [
    { "key": "facing", "label": "Facing", "type": "direction", "count": 16, "startDeg": 0 },
    { "key": "gender", "label": "Gender", "type": "single",
      "options": [
        { "value": "male", "label": "Male" },
        { "value": "female", "label": "Female" },
        { "value": "unknown", "label": "Unknown" }
      ]
    },
    { "key": "accessories", "label": "Accessories", "type": "multi",
      "options": [
        { "value": "glass", "label": "Glasses" },
        { "value": "hat", "label": "Hat" },
        { "value": "bag", "label": "Bag" },
        { "value": "mask", "label": "Mask" }
      ]
    }
  ]
}
```

Supported `type`s:
- `direction` — special compass picker rendered around the image. Optional `count` (default 16) and `startDeg` (default 0).
- `single` — single-choice. `options[].value` is what's stored.
- `multi` — multi-choice, stored as a string array.

The config is read **on dataset open**. Edit and reopen the dataset to apply changes.

## Develop

```bash
npm install
npm run tauri dev
```

Tauri prerequisites (Rust toolchain + platform deps): https://tauri.app/start/prerequisites/

Place an app icon at `src-tauri/icons/icon.png` before bundling a release.

## Hotkeys

- `←` / `→` — previous / next image
- `Cmd/Ctrl + O` — open dataset (works on landing and inside a workspace; flushes pending edits before switching)
- Autosave fires 5s after the last edit, on image switch, and on window close.
