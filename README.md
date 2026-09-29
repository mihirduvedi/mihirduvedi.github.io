# Mihir Duvedi — portfolio

A single-page portfolio about software that has to make itself understood. The visual system pairs warm editorial pages with deep-black instrument rooms: an interactive sculptural project index, current project captures, a corpus-backed autocomplete, and a live 24-hour dayglass built around an authored digital-gouache vessel.

## Run it

Requires Node.js 24 and npm.

```bash
npm install
npm run dev
```

The printed URL is the local demo. Everything on the page runs in the browser; there is no backend.

## Check it

```bash
npm run check
```

This runs Vitest, TypeScript, and a production Vite build. Static output goes to `dist/`.

## GitHub Pages

Vite uses relative asset paths, so the same build works at a user-site root or a repository subpath. The workflow in `.github/workflows/deploy-pages.yml` runs the interaction tests, creates the production build, and publishes it through GitHub Pages whenever `main` changes.

## Map of the source

- `src/App.tsx` — page structure and project interactions
- `src/autocomplete.ts` — corpus index, prefix invariant, and acceptance behavior
- `src/Dayglass.tsx` — 24-hour clock state and painted frame sequence
- `src/styles.css` — original typography and base components
- `src/exhibition.css` — sculptural index, exhibit framing, and responsive refinements
- `src/WorkingForms.tsx` — procedural line forms and their project destinations
- `src/motion.tsx` — motion preference, OS reduced-motion support, and local persistence
- `ASSET_PROVENANCE.md` — source and publication notes for local assets

## Interactive exhibits

- Select a theme in the opening index to change its form and project destination. The geometry is a visual metaphor for each project's idea, not a data visualization of project telemetry.
- Autocomplete draws branches from the actual candidate set. Arrow keys select; Enter accepts; Tab completes an unfinished word. Tab after a completion and Shift+Tab leave the field normally.
- The hourglass slider previews any minute of the day. **Return to local time** resumes the clock.
- **Motion off** pauses ambient movement and holds the clock. The preference is stored locally. OS reduced motion starts the page paused, and the canvas stops drawing offscreen or in hidden tabs.
- The exhibition navigator follows the current project while scrolling. All existing fragment links remain available.

The new renderer uses Canvas 2D and adds no dependencies or external assets.
