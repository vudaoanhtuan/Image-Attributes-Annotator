# Image Attributes Annotator

Desktop tool (Tauri + React) for annotating per-image attributes — a direction (rendered as a click/drag arrow over the image) plus configurable single- and multi-choice attributes — across a folder of images.

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

`facing` is stored as an angle in degrees in the range `[-180, 180)`: 0° points right (+x axis), angles increase **clockwise** (90° = down, -90° = up, ±180° = left).

## `config.json`

If present, defines the attributes shown when the dataset is opened. If absent (or invalid), the attribute panel and direction picker are hidden — the app shows only the image list and the current image.

> The example below is tailored for **person crops** (e.g. bounding-box images of people from security cameras): facing direction, gender, and accessories. The schema itself is generic — replace these with whatever attributes your dataset needs.

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
- `direction` — click/drag anywhere on the image to set the angle in degrees, range `[-180, 180)`. 0° = right, increasing **clockwise** (90° = down, -90° = up). The current value is shown in the attribute panel. Optional `count` snaps to `360/count` steps; optional `startDeg` offsets the snap grid. Omit `count` for fully free-form angles.
- `single` — single-choice. `options[].value` is what's stored.
- `multi` — multi-choice, stored as a string array.

The config is read **on dataset open**. Edit and reopen the dataset to apply changes.

## Develop

```bash
npm install
npm run tauri dev
```

Tauri prerequisites (Rust toolchain + platform deps): https://tauri.app/start/prerequisites/

### App icon

The source icon lives at `src-tauri/icons/icon.svg`. Regenerate the platform-specific icons from it with:

```bash
npm run tauri icon src-tauri/icons/icon.svg
```

This produces `icon.icns` / `icon.ico` / sized PNGs in `src-tauri/icons/`, which `tauri.conf.json` references for bundling.

## Hotkeys

- `←` / `↑` / `Shift+Space` — previous image
- `→` / `↓` / `Space` — next image
- `Cmd/Ctrl + O` — open dataset (File → Open Dataset). Flushes pending edits before switching.
- `Cmd/Ctrl + W` — close dataset (File → Close Dataset). Flushes pending edits and returns to the landing screen.
- **Attribute hotkeys** — the first three `single`/`multi` attributes in `config.json` (skipping direction) get keyboard shortcuts on their options. Pressing the key behaves like clicking the option. The mapped letter is shown as a small badge at the end of each option row.
  - 1st attribute: `Q W E R T Y U I O P`
  - 2nd attribute: `A S D F G H J K L`
  - 3rd attribute: `Z X C V B N M`
- Autosave fires 5s after the last edit, on image switch, and on window close.
