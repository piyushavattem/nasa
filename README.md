# SPHEREx Cosmic Explorer

An interactive astronomy learning app with a React/TypeScript frontend and an Express API. The project intentionally identifies demonstration visuals and values; it does not present fabricated observations as SPHEREx measurements.

## Run locally

Requires Node.js 20.19+ or 22.12+ and npm.

```sh
npm install
npm run dev
```

The Vite frontend runs at `http://localhost:5173`; the Express API runs at `http://localhost:4000`. To run a production build, use 
pm run build` followed by 
pm start`. Express serves `dist/` when it exists.

## What is implemented

- Interactive 3D universe scene with selectable curated objects, camera controls, and responsive layout.
- Object profiles, illustrative infrared band selector, curated sky map, mission and science pages, learning guides, global search, image comparison, journeys, and saved discoveries.
- REST API for object records, mission summaries, lessons, band interface data, search, journeys, and saved items.
- Saved discoveries are separated by an anonymous browser session. The browser keeps a UUID; the server hashes it before choosing a per-session JSON file.

## Data integrity and limits

- The included object collection is a small curated educational set. Object source links identify SIMBAD catalog records; mission summaries link to NASA/JPL.
- The spectrum explorer selects among 102 channel center/width summaries measured in IRSA laboratory calibration files. It does not display a measured object spectrum or the full normalized response curve.
- 3D scene positions and comparison art are illustrative. The coordinate map plots the curated object coordinates on a schematic RA/Dec grid; it is not a complete survey. The landing page uses the official first SPHEREx all-sky map and an official spacecraft artist concept, with NASA/JPL-Caltech credit.
- The spectrum explorer uses IRSA laboratory-measured channel center/width summaries for 102 channels; it does not plot object observations or full response curves. Public observation products are available from the linked IRSA archive but are not queried by this app. Authentication and cloud sync are not integrated.
- Saved discoveries are separated by a browser-generated anonymous session ID and are not account-backed. Lesson and journey progress stay in browser local storage. Set `PORT`, `ALLOWED_ORIGIN`, and optional `DATA_DIR` to configure the API.

## Main routes

`/`, `/explore`, `/explore/spectrum`, `/explore/map`, `/explore/objects/:id`, `/mission`, `/science`, `/learn`, `/learn/:id`, `/lab`, `/search`, `/discoveries`, `/journeys`, and `/journeys/:id`.

## Sources

- [NASA SPHEREx](https://science.nasa.gov/universe/missions/spherex/)
- [NASA JPL SPHEREx](https://www.jpl.nasa.gov/missions/spherex/)
- [NASA/IPAC Infrared Science Archive](https://irsa.ipac.caltech.edu/Missions/spherex.html)
- [SIMBAD Astronomical Database](https://simbad.cds.unistra.fr/)`r
- [NASA Image and Video Library API documentation](https://images.nasa.gov/docs/images.nasa.gov_api_docs.pdf)

## Implemented enhancements

- `/science` is an independent objectives page with six objective-specific sections, related lessons/tools, and NASA/JPL and IRSA source links. It distinguishes the mission's contribution from measurements that require other data or analysis.
- The sky map search now filters plotted coordinate markers as well as the catalog list. Records without valid RA/Dec are not plotted. The map is explicitly labeled a schematic J2000 sample rather than a complete survey.
- The spectrum explorer plots calibration channel centers versus channel number and exports all available channel center/width summaries as CSV. This is not an object spectrum or a detector response curve.
- Each existing lesson now has a topic-specific knowledge check. A lesson can be marked complete after the correct answer; completion is stored in browser local storage.
- Lessons include knowledge checks; journeys track marked stops and completion. Learning and journey lists support search, categories, estimated duration, and local completion indicators. Saved objects, lessons, and journeys can be removed; the API isolates saves by hashed anonymous session IDs.
- The map includes category filters, zoom, directional pan, reset, and fullscreen controls.
- The Visualization Lab searches the documented NASA Image and Video Library API, caches results briefly, validates returned asset hosts, and supports image selection, side-by-side, split, and overlay modes, pan, zoom, and opacity. Individual NASA asset records should be checked for credits and reuse conditions.
- The API exposes `/api/sources` and `/api/docs`, validates discovery IDs against the available catalog, and uses request timeouts for the NASA image service.
- 
pm test` runs the built-in Node test suite against a temporary local API instance.

## Verification

```sh
npm install
npm run dev
npm test
npm run build
npm start
```

The production build currently succeeds with a Vite warning that the main JavaScript chunk exceeds 500 kB; the 3D scene itself is lazy-loaded, but additional route-level chunking could reduce initial download size.

The object catalog remains a curated educational set with SIMBAD record links; it is not a live SIMBAD query. The app does not query live NASA/IPAC observation products. NASA image search uses the documented Images API, but the API returned HTTP 502 in this development environment; the lab therefore shows a transparent error/retry state here. Calibration summaries are sourced from the included IRSA CSV files. Anonymous saves are scoped by a browser-generated session identifier, not a login, and should not be treated as account-grade authentication. Learning and journey progress are browser-local.
# nasa
# nasa
