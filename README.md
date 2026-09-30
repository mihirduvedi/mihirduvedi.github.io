# Mihir Duvedi — portfolio

Mihir’s personal site for projects and experiments. The visual system pairs warm editorial pages with deep-black instrument rooms: an interactive sculptural project index, recorded project captures, a corpus-backed autocomplete, and a live 24-hour dayglass built around an authored digital-gouache vessel.

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
- `src/WorkingForms.tsx` — sculptural project index, explanations, and destinations
- `src/GlassSculpture.tsx` — lazy renderer lifecycle and theme-specific SVG fallback
- `src/glassRenderer.ts` — GPU-deformed glass, environment lighting, and frame scheduling
- `src/ScrollScenes.tsx` — GSAP ScrollTrigger timelines and the woven meaning diagram
- `src/choreography.css` — numbered chapter entrances, threadwork, and closing signature
- `src/motion.tsx` — motion preference, OS reduced-motion support, and local persistence
- `ASSET_PROVENANCE.md` — source and publication notes for local assets

## Interactive exhibits

Five projects are grouped under four ideas. Agent Receipt and Counterstep share the Trust chapter: reviewing an agent’s actions, then repairing what remains reversible. Each has its own anchor and source link. The site copy uses a personal, conversational voice and preserves the technical scope of each demo.

- Select a theme in the opening index to change its glass form and project destination. Prediction is a closed trefoil knot; Time is a nested orbital assembly with independent rhythms. Trust retains its glass boundary and Recovery its returning infinity loop. Traveling waves and a gently shifting orientation keep the closed contours in motion. The transparent surface continuously deforms and refracts a quiet grid, with soft studio reflections and pointer-responsive orientation. Each caption explains the metaphor and names the associated project. The geometry represents project ideas, not telemetry.
- Autocomplete draws branches from the actual candidate set. Arrow keys select; Enter accepts; Tab completes an unfinished word. Tab after a completion and Shift+Tab leave the field normally.
- The hourglass slider previews any minute of the day. **Return to local time** resumes the clock.
- **Motion off** pauses ambient movement and holds the clock. The preference is stored locally. OS reduced motion starts the page paused, and the canvas stops drawing offscreen or in hidden tabs.
- Native scrolling untangles four silver connections between system concepts and human meaning on larger screens, reveals project titles word by word, draws chapter rules, and brings exhibit media forward with depth. GSAP's numeric scrub eases the timelines; scroll input is never replaced. Permissions connect to trust, possible words to your choice, passing hours to time left, and saved workouts to picking up again. Systems and People are hollow word silhouettes above the drawing, so paths and overlapping glyphs cannot leave lines inside the letters. Smaller screens use shorter travel and a normal-flow diagram. Motion off restores complete titles and static artwork without changing the section heights.
- The exhibition navigator follows the current project while scrolling. All existing fragment links remain available.

The glass renderer uses Three.js `MeshPhysicalMaterial`, procedural vertex deformation, and a generated `RoomEnvironment`. Geometry and normals run on the GPU; one animation loop uses elapsed-time damping without a frame cap. Resolution is capped at 1.5 device pixels per CSS pixel, and rendering stops offscreen, in hidden tabs, or when motion is paused. Explicit theme selection still redraws while paused. If WebGL 2 fails, a selected-theme SVG remains usable.

Three.js is loaded in a separate dynamic chunk (about 136 kB gzip in the current build). It exceeds Vite's default 500 kB minified-chunk advisory; that warning is retained. GSAP and Three.js add no remote asset requests or backend services.

For local profiling, add `?motion-debug=1`. The sculpture canvas exposes rendered-frame count and median/p95 animation callback intervals as `data-*` attributes, without adding a diagnostics UI. These are callback timing samples, not a guarantee of GPU throughput or physical-device performance.

Motion implementation references: [GSAP ScrollTrigger](https://gsap.com/docs/v3/Plugins/ScrollTrigger/), [GSAP common mistakes](https://gsap.com/resources/mistakes/), [Lenis](https://github.com/darkroomengineering/lenis), [drei transmission material](https://github.com/pmndrs/drei/blob/master/src/core/MeshTransmissionMaterial.tsx), and [Three.js physical material](https://threejs.org/docs/pages/MeshPhysicalMaterial.html). Lenis and drei were studied but are not dependencies.
