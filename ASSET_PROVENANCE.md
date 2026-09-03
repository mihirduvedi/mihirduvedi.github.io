# Asset provenance

The portfolio ships current project captures, the text corpus used by Mihir’s autocomplete project, and one synthetic digital-gouache clock sequence. The clock artwork is an illustration, not a photograph or documentary image.

## Agent Receipt

- `public/assets/projects/agent-receipt-trace.jpg` — trace-intake capture from Mihir’s Agent Receipt project.
- `public/assets/projects/agent-receipt-deviation.jpg` — deviation-review capture from that project.
- `public/assets/projects/agent-receipt-gap.jpg` — evidence-gap capture from that project.

## Atrium

- `public/assets/projects/atrium-today-current.png` — current full-frame Today and recovery screen.
- `public/assets/projects/atrium-workout-current.png` — current full-frame workout-logging screen.
- `public/assets/projects/atrium-progress-current.png` — current full-frame progress screen.

The portfolio adds no phone notch, bezel content, or Dynamic Island. Each black island visible inside a capture belongs to that single source image.

## Autocomplete corpus

- `public/data/pride-and-prejudice.txt` — copied from Mihir’s local `autocomplete-engine` project so its browser study can use the project’s actual corpus. The underlying novel is the Project Gutenberg edition of *Pride and Prejudice*; Project Gutenberg’s license and trademark notice remain in the file.

## Dayglass

- `public/assets/projects/dayglass-vessel.png` is the seamless digital-gouache vessel. It was created with OpenAI’s built-in image generator and refined so the indigo field resolves to black at all four edges.
- `public/assets/projects/dayglass-sand-brush.png` supplies the painted sand texture used inside the vessel.
- `src/Dayglass.tsx` computes local progress through the full 24-hour day. It clips the textured sand to hand-traced upper and lower glass cavities, moves the fill levels continuously with local time, and keeps the falling stream registered to the painted neck.
- The three `dayglass-painted-frame-*` PNG and AVIF files are retained as unused development studies. The live site does not load them.

## Type and icons

- Anybody Variable is supplied by `@fontsource-variable/anybody` under the SIL Open Font License.
- Source Sans 3 is supplied by `@fontsource-variable/source-sans-3` under the SIL Open Font License.
- Lucide supplies interface icons under the ISC License.

Retired Atrium captures, the résumé PDF, and the discarded fluid-playground experiment are not included. The six project captures and generated Dayglass artwork are the only project-specific visual assets published with the site.
