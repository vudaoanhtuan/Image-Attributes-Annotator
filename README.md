# BB Attribute Labeler

Desktop tool (Tauri + React) for labeling attributes on bounding-box person crops.

## Dataset layout

```
my-dataset/
  images/   # .jpg .jpeg .png .webp .bmp
  labels/   # auto-created; one <stem>.json per image
```

A label file is a flat object, e.g.:

```json
{ "facing": "NE", "gender": "male", "accessories": ["hat", "bag"] }
```

## Develop

```bash
npm install
npm run tauri dev
```

You'll also need the Tauri prerequisites (Rust toolchain + platform deps): https://tauri.app/start/prerequisites/

Place an app icon at `src-tauri/icons/icon.png` before bundling a release.

## Extend attributes

Edit `src/config/attributes.ts` — add an entry to `ATTRIBUTES` with `type: "single"` or `"multi"`. `AttributePanel` renders it automatically. The `facing` compass control is hard-wired (special UI) and stored under the `facing` key.

## Hotkeys

- `←` / `→` — previous / next image
- Autosave fires 5s after the last edit, on image switch, and on window close.
