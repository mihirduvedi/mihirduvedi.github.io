# Mihir Duvedi — portfolio

A single-page portfolio about software that has to make itself understood. The visual system pairs warm editorial pages with deep-black instrument rooms: current project captures, a corpus-backed autocomplete, and a live 24-hour dayglass built around an authored digital-gouache vessel.

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
- `src/styles.css` — typography, material system, motion, and breakpoints
- `ASSET_PROVENANCE.md` — source and publication notes for local assets
- `QA_NOTES.md` — verification ledger and remaining release boundaries

Review the project captures once more before making the repository public.
