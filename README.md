# STL Generator (v1.3)

Client-side parametric STL generator. Pick a preset, adjust dimensions with live 3D preview, export a print-ready binary STL — all in the browser, no backend.

## Stack

React + Vite, Three.js via `@react-three/fiber`/`drei` for preview, JSCAD (`@jscad/modeling` + `@jscad/stl-serializer`) for solid geometry and STL export.

## Quick try (no install)

Double-click `dist-portable/index.html` — a fully self-contained single-file build that works straight from disk (`file://`).

⚠ Don't open the root `index.html` directly — it's the dev-server entry and only works through Vite (`npm run dev`).

## Run / build / deploy

```bash
npm install
npm run dev             # local dev server
npm run verify          # geometry sanity tests for every preset (node, no browser)
npm run build           # production build → dist/ (for hosting)
npm run build:portable  # single-file build → dist-portable/index.html (double-clickable)
node scripts/render-views.mjs   # dev QA: orthographic SVG previews of each preset
```

Deploy to Netlify: drag the **`dist` folder only** (or a zip of its contents) onto the site's Deploys page. Dropping the whole project makes Netlify run a server-side build — a `netlify.toml` is included so that works too, but it's slower and unnecessary.

Note: no `package-lock.json` is shipped — the environment this was built in uses an npm mirror whose package versions don't all exist on the public registry. `npm install` generates a fresh, valid lockfile on first run; commit that one.

## Current presets (v1.3 catalog)

| Preset | Defaults | Notes |
|---|---|---|
| Box with Lid | 80 × 60 × 40, wall 2, **fit clearance 0.2/side**, lip 8 | Slip-fit lid printed beside the box; 0.2 mm is a good FDM starting fit |
| Nested Boxes | 3 boxes, largest 80 × 60 × 40, wall 2, nesting clearance 0.3/side | Each box fits through the previous one's opening; warns if a count doesn't fit |
| Phone Stand | 78 W × 84 D × 74 H wedge, 22° recline, 13 mm slot, 14 mm cable tunnel | Cable tunnel runs from the back into the slot floor for charging |
| Phone Case | fits 147 × 71 × 8.3 (recent-iPhone class), wall 1.8, clearance 0.25 | **Print in TPU** — rigid filament can't snap on; camera window + port cutout adjustable |
| Dragon (Low-Poly) | 120 mm long, wing size 1.0 | Chunky toy-block style (CSG can't sculpt organic dragons); wings 3 mm thin — print with brim |

Old v1 blanks (tie clip, pendants, keychain, box, cylinder) were removed from the registry per request; the files still exist in v1.2 zips if you ever want them back.

## Adding a preset

Create `src/presets/yourShape.js` exporting `{ id, name, category, description, params, build(params) → geom3, warnings(params) → string[] }`, then add it to `src/presets/index.js`.

## Notes

- Units are mm; parts sit on z = 0 so exported STLs land flat on the print bed.
- Printability warnings (thin walls, tight clearances) are warn-only and never block export.
