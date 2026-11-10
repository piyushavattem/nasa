import express from 'express'
import { existsSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createHash } from 'node:crypto'
import { lessonDetails } from './lesson-content.js'

const app = express()
const port = Number(process.env.PORT || 4000)
const here = path.dirname(fileURLToPath(import.meta.url))
const savedDir = path.join(process.env.DATA_DIR || path.join(here, 'data'), 'saved')
app.use(express.json({ limit: '32kb', strict: true }))
app.use((_req, res, next) => { res.setHeader('X-Content-Type-Options', 'nosniff'); res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin'); res.setHeader('X-Frame-Options', 'DENY'); res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()'); next() })
const requestCounts = new Map()
app.use('/api', (req, res, next) => { const key = req.ip || 'unknown'; const now = Date.now(); const current = requestCounts.get(key); if (!current || now - current.start > 60000) requestCounts.set(key, { start: now, count: 1 }); else if (++current.count > 180) return res.status(429).json({ error: 'Request limit reached. Please retry shortly.' }); next() })
app.use((req, res, next) => { res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || 'http://localhost:5173'); res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Explorer-Session'); res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS'); if (req.method === 'OPTIONS') return res.sendStatus(204); next() })

const sources = [
  { id: 'spherex-nasa', name: 'NASA SPHEREx', url: 'https://science.nasa.gov/universe/missions/spherex/' },
  { id: 'spherex-jpl', name: 'NASA Jet Propulsion Laboratory', url: 'https://www.jpl.nasa.gov/missions/spherex/' },
  { id: 'irsa', name: 'NASA/IPAC Infrared Science Archive', url: 'https://irsa.ipac.caltech.edu/Missions/spherex.html' },
]
const objects = [
  { id: 'andromeda', name: 'Andromeda Galaxy', type: 'Spiral galaxy', position: 'RA 00h 42m 44s · Dec +41° 16′ 09″', raDeg: 10.6847, decDeg: 41.2688, description: 'A nearby spiral galaxy and a prominent target for learning how infrared observations reveal stars, dust, and the broader history of galaxies.', status: 'curated educational record', source: { name: 'SIMBAD Astronomical Database', url: 'https://simbad.cds.unistra.fr/simbad/sim-id?Ident=M31' }, tags: ['galaxy', 'infrared', 'cosmic history'], scene: [-1.2, 0.35, -1.4], tint: '#a78bfa' },
  { id: 'orion-nebula', name: 'Orion Nebula', type: 'Star-forming nebula', position: 'RA 05h 35m 17s · Dec −05° 23′ 28″', raDeg: 83.8221, decDeg: -5.3911, description: 'A nearby star-forming region where astronomers study the ingredients and environments associated with forming stars and planetary systems.', status: 'curated educational record', source: { name: 'SIMBAD Astronomical Database', url: 'https://simbad.cds.unistra.fr/simbad/sim-id?Ident=M42' }, tags: ['nebula', 'star formation', 'cosmic ices'], scene: [1.25, -0.25, -1.1], tint: '#67e8f9' },
  { id: 'pleiades', name: 'Pleiades', type: 'Open star cluster', position: 'RA 03h 47m 24s · Dec +24° 07′ 00″', raDeg: 56.75, decDeg: 24.1167, description: 'A nearby open star cluster, useful as an introduction to stellar populations and how dust can shape astronomical observations.', status: 'curated educational record', source: { name: 'SIMBAD Astronomical Database', url: 'https://simbad.cds.unistra.fr/simbad/sim-id?Ident=M45' }, tags: ['stars', 'cluster', 'dust'], scene: [0.1, 1.05, -1.8], tint: '#f4bd73' },
  { id: 'whirlpool-galaxy', name: 'Whirlpool Galaxy', type: 'Interacting spiral galaxy', position: 'RA 13h 29m 52.7s · Dec +47° 11′ 43″', raDeg: 202.4696, decDeg: 47.1953, description: 'A face-on spiral galaxy interacting with its companion NGC 5195. Its catalog position is useful for exploring how galaxy morphology and environment are studied.', status: 'curated educational record', source: { name: 'SIMBAD Astronomical Database', url: 'https://simbad.cds.unistra.fr/simbad/sim-id?Ident=M51' }, tags: ['galaxy', 'spiral', 'interaction'], scene: [-1.4, -0.2, -1.2], tint: '#f0a67a' },
  { id: 'sombrero-galaxy', name: 'Sombrero Galaxy', type: 'Spiral galaxy', position: 'RA 12h 39m 59.4s · Dec −11° 37′ 23″', raDeg: 189.9975, decDeg: -11.62306, description: 'A nearby bright galaxy with a prominent central bulge and dust lane. This profile provides catalog coordinates and context, not a SPHEREx measurement.', status: 'curated educational record', source: { name: 'SIMBAD Astronomical Database', url: 'https://simbad.cds.unistra.fr/simbad/sim-basic?Ident=M104' }, tags: ['galaxy', 'dust', 'infrared'], scene: [1.45, 0.4, -1.5], tint: '#f4bd73' },
  { id: 'crab-nebula', name: 'Crab Nebula', type: 'Supernova remnant nebula', position: 'RA 05h 34m 31.9s · Dec +22° 00′ 52″', raDeg: 83.6331, decDeg: 22.0145, description: 'The expanding remnant of a supernova recorded in 1054 CE. Its multiwavelength emission makes it a well-studied example of a supernova remnant.', status: 'curated educational record', source: { name: 'SIMBAD Astronomical Database', url: 'https://simbad.cds.unistra.fr/simbad/sim-id?Ident=M1' }, tags: ['nebula', 'supernova remnant', 'multiwavelength'], scene: [-0.3, -0.85, -1.2], tint: '#fa8a92' },
  { id: 'sirius', name: 'Sirius', type: 'Binary star system', position: 'RA 06h 45m 08.9s · Dec −16° 42′ 58″', raDeg: 101.2872, decDeg: -16.7161, description: 'The brightest star in Earth’s night sky is a binary system. It is included as a stellar reference point; the scene placement is illustrative.', status: 'curated educational record', source: { name: 'SIMBAD Astronomical Database', url: 'https://simbad.cds.unistra.fr/simbad/sim-id?Ident=Sirius' }, tags: ['star', 'binary', 'stellar astronomy'], scene: [0.4, 1.2, -1.3], tint: '#9ad8ff' },  { id:'mercury',name:'Mercury',type:'Terrestrial planet',position:'Solar System body · no fixed RA/Dec in this catalog',description:'The innermost planet and the smallest of the eight planets. This record identifies the Solar System body; its illustrative 3D placement is not an ephemeris.',status:'NASA planetary reference',source:{name:'NASA Solar System Exploration',url:'https://science.nasa.gov/solar-system/planets/mercury/'},tags:['planet','terrestrial','solar system'],scene:[-0.4,0.1,0],tint:'#b9b1aa'},
  { id:'venus',name:'Venus',type:'Terrestrial planet',position:'Solar System body · no fixed RA/Dec in this catalog',description:'The second planet from the Sun, with a dense atmosphere and a surface hidden beneath clouds. Its 3D placement is schematic.',status:'NASA planetary reference',source:{name:'NASA Solar System Exploration',url:'https://science.nasa.gov/solar-system/planets/venus/'},tags:['planet','terrestrial','solar system'],scene:[-0.2,0.3,0],tint:'#e4b86e'},
  { id:'earth',name:'Earth',type:'Terrestrial planet',position:'Solar System body · no fixed RA/Dec in this catalog',description:'The third planet from the Sun and the only world currently known to host life. Its placement in the diagram is schematic, not its current position.',status:'NASA planetary reference',source:{name:'NASA Solar System Exploration',url:'https://science.nasa.gov/solar-system/planets/earth/'},tags:['planet','terrestrial','solar system','Earth'],scene:[0,0.5,0],tint:'#5a9cff'},
  { id:'mars',name:'Mars',type:'Terrestrial planet',position:'Solar System body · no fixed RA/Dec in this catalog',description:'The fourth planet from the Sun, a rocky world with a thin atmosphere. Its displayed orbit is diagrammatic.',status:'NASA planetary reference',source:{name:'NASA Solar System Exploration',url:'https://science.nasa.gov/solar-system/planets/mars/'},tags:['planet','terrestrial','solar system'],scene:[0.2,0.3,0],tint:'#d96b4f'},
  { id:'jupiter',name:'Jupiter',type:'Gas giant planet',position:'Solar System body · no fixed RA/Dec in this catalog',description:'The largest planet in the Solar System. This view exaggerates orbital spacing and body size for visibility.',status:'NASA planetary reference',source:{name:'NASA Solar System Exploration',url:'https://science.nasa.gov/solar-system/planets/jupiter/'},tags:['planet','gas giant','solar system'],scene:[0.4,0.1,0],tint:'#d5a875'},
  { id:'saturn',name:'Saturn',type:'Gas giant planet',position:'Solar System body · no fixed RA/Dec in this catalog',description:'A gas giant known for its extensive ring system. The planet and orbit are not shown to scale.',status:'NASA planetary reference',source:{name:'NASA Solar System Exploration',url:'https://science.nasa.gov/solar-system/planets/saturn/'},tags:['planet','gas giant','rings','solar system'],scene:[0.6,-0.1,0],tint:'#e0ca91'},
  { id:'uranus',name:'Uranus',type:'Ice giant planet',position:'Solar System body · no fixed RA/Dec in this catalog',description:'The seventh planet from the Sun and an ice giant. Its displayed orbital position is a schematic teaching aid.',status:'NASA planetary reference',source:{name:'NASA Solar System Exploration',url:'https://science.nasa.gov/solar-system/planets/uranus/'},tags:['planet','ice giant','solar system'],scene:[0.8,-0.2,0],tint:'#7bd1cd'},
  { id:'neptune',name:'Neptune',type:'Ice giant planet',position:'Solar System body · no fixed RA/Dec in this catalog',description:'The eighth and most distant planet from the Sun. Its displayed orbital position is not current or to scale.',status:'NASA planetary reference',source:{name:'NASA Solar System Exploration',url:'https://science.nasa.gov/solar-system/planets/neptune/'},tags:['planet','ice giant','solar system'],scene:[1,-0.3,0],tint:'#5477d9'},
  { id:'milky-way',name:'Milky Way',type:'Barred spiral galaxy',position:'Earth’s home galaxy · schematic view',description:'The barred spiral galaxy containing our Solar System. The map view is illustrative and does not encode a measured star catalog.',status:'NASA mission context',source:{name:'NASA Solar System Facts',url:'https://science.nasa.gov/solar-system/solar-system-facts/'},tags:['galaxy','Milky Way','solar system'],scene:[0,0,0],tint:'#b5a3ff'},  { id: 'cosmic-web', name: 'Cosmic web', type: 'Large-scale structure', position: 'Illustrative visualization', description: 'An artistic visualization of the large-scale distribution of galaxies. This scene is illustrative and does not encode a measured galaxy catalog.', status: 'illustrative visualization', source: { name: 'NASA SPHEREx mission overview', url: 'https://science.nasa.gov/universe/missions/spherex/' }, tags: ['inflation', 'galaxies', 'cosmic history'], scene: [0, 0, 0], tint: '#fb7185' },
]
const scienceGoals = [
  { id: 'inflation', title: 'Probe cosmic inflation', text: 'Map galaxy distributions to investigate the physics of the universe’s earliest moments.', icon: '01', color: 'violet' },
  { id: 'galaxies', title: 'Trace the history of galaxies', text: 'Measure the collective glow from galaxies across cosmic history.', icon: '02', color: 'amber' },
  { id: 'water', title: 'Find the ingredients of worlds', text: 'Study water and other important molecules in our own galaxy.', icon: '03', color: 'cyan' },
]
const scienceObjectives = [
  { id:'inflation', title:'Cosmic inflation & the early universe', question:'How did tiny early-universe fluctuations grow into the structures we see?', contribution:'SPHEREx galaxy distributions help test inflationary predictions statistically, in combination with cosmological models and other measurements.', wavelength:'0.75–5.0 μm · 102 infrared bands', lesson:'cosmic-inflation', tool:'/explore/map' },
  { id:'galaxy-history', title:'The history of galaxy formation', question:'How did galaxies build up stars and change across cosmic time?', contribution:'The all-sky spectral survey measures the collective light from galaxies across epochs, providing constraints on the history of galaxy growth.', wavelength:'Near- to mid-infrared spectroscopy', lesson:'galaxy-evolution', tool:'/explore/spectrum' },
  { id:'cosmic-structure', title:'Large-scale cosmic structure', question:'How is matter organized into the cosmic web?', contribution:'Galaxy positions and redshift information support statistical maps of large-scale structure; the survey does not directly map every component of matter.', wavelength:'Spectral colors across 102 bands', lesson:'galaxy-distances', tool:'/explore/map' },
  { id:'galaxy-clustering', title:'Galaxy clustering & distribution', question:'How do galaxies cluster across cosmic time?', contribution:'SPHEREx’s broad galaxy survey enables statistical studies of galaxy clustering and distribution, which can constrain models of cosmic history.', wavelength:'All-sky galaxy spectra in 102 bands', lesson:'galaxy-distances', tool:'/explore/map' },
  { id:'interstellar-ices', title:'Interstellar ices', question:'Where do water ice and other frozen molecules occur in the Milky Way?', contribution:'Infrared spectral features from cold interstellar material help trace ice-bearing environments across the galaxy.', wavelength:'Infrared absorption features', lesson:'cosmic-ices', tool:'/explore/objects/orion-nebula' },
  { id:'planetary-ingredients', title:'Molecular ingredients of planetary systems', question:'What molecular materials are present in star-forming regions?', contribution:'Surveying infrared signatures in the Milky Way helps scientists study molecular ingredients in environments where stars and planetary systems form.', wavelength:'Near- to mid-infrared molecular features', lesson:'cosmic-ices', tool:'/explore/objects/orion-nebula' },
]
const lessons = [
  { id: 'infrared-light', title: 'What is infrared light?', group: 'Light & spectra', duration: '6 min', text: 'Infrared is electromagnetic radiation beyond the red edge of visible light. Astronomers use it to study cooler objects, dust, and distant galaxies.', icon: '◉' },
  { id: 'spectroscopy', title: 'Reading a spectrum', group: 'Light & spectra', duration: '8 min', text: 'A spectrum spreads light by wavelength. Features in the spectrum can reveal the physical and chemical properties of an astronomical source.', icon: '⌁' },
  { id: 'mapping-the-sky', title: 'How astronomers map the sky', group: 'Our universe', duration: '5 min', text: 'Celestial coordinates let astronomers record and revisit positions on the sky, much like latitude and longitude on Earth.', icon: '✳' },
  { id: 'cosmic-inflation', title: 'What is cosmic inflation?', group: 'Cosmic history', duration: '7 min', text: 'Cosmic inflation is a proposed period of extremely rapid expansion in the early universe. Galaxy distributions can help test models of this era.', icon: '↗' },
  { id: 'galaxy-evolution', title: 'How galaxies evolve', group: 'Cosmic history', duration: '9 min', text: 'Galaxies change over cosmic time as stars form, gas cycles, and galaxies interact. Infrared surveys provide another way to study that history.', icon: '◎' },
  { id: 'cosmic-ices', title: 'Water and cosmic ices', group: 'Our neighborhood', duration: '6 min', text: 'Water and other molecules occur in interstellar environments. Their distribution helps scientists study the raw materials of planetary systems.', icon: '❋' },
  { id: 'galaxy-distances', title: 'How do scientists measure galaxy distances?', group: 'Cosmic history', duration: '7 min', text: 'Galaxy spectra contain clues that help astronomers estimate how far away galaxies are and how the universe has expanded.', icon: '↗' },
  { id: 'spherex-contribution', title: 'How does SPHEREx contribute to astronomy?', group: 'The mission', duration: '6 min', text: 'SPHEREx combines an all-sky survey with spectroscopy to study galaxies and molecules across the Milky Way.', icon: '✦' },
]
const journeys = [
  { id: 'infrared-journey', title: 'A journey through infrared light', description: 'Follow light from invisible wavelengths to calibrated scientific channels.', objective: 'Explain how wavelength and spectral features carry information.', estimatedMinutes: 18, steps: ['infrared-light', 'spectroscopy', 'spectrum'] },
  { id: 'galaxy-history', title: 'How galaxies reveal cosmic history', description: 'Connect galaxy evolution to the large-scale patterns mapped across the sky.', objective: 'Describe how galaxy surveys help investigate cosmic history.', estimatedMinutes: 23, steps: ['galaxy-evolution', 'cosmic-inflation', 'mapping-the-sky'] },
  { id: 'ingredients-of-worlds', title: 'Searching for ingredients of worlds', description: 'Explore cold clouds, molecular ices, and star-forming environments.', objective: 'Connect interstellar molecules with planetary-system ingredients.', estimatedMinutes: 19, steps: ['cosmic-ices', 'orion-nebula', 'mission'] },
]
const mission = { name: 'SPHEREx', subtitle: 'Spectro-Photometer for the History of the Universe, Epoch of Reionization and Ices Explorer', wavelengthRange: [0.75, 5.0], bandCount: 102, detectorAssemblies: 6, observationStrategy: 'The planned two-year mission surveys the entire sky four times in near-infrared light. The broad survey design provides repeated coverage rather than detailed narrow-field imaging.', timeline: [{ date:'March 11, 2025', label:'Launch', detail:'SPHEREx launched with NASA’s PUNCH mission from Vandenberg Space Force Base.', sourceUrl:'https://www.jpl.nasa.gov/news/nasa-launches-missions-to-study-sun-universes-beginning/' }, { date:'April 2025', label:'First images', detail:'Initial images were released after spacecraft commissioning and instrument checks.', sourceUrl:'https://www.jpl.nasa.gov/news/nasas-spherex-takes-first-images-preps-to-study-millions-of-galaxies/' }, { date:'Planned: two-year mission', label:'All-sky survey', detail:'The mission plan calls for four full-sky maps using 102 infrared spectral bands.', sourceUrl:'https://science.nasa.gov/blogs/spherex/2025/03/11/nasas-spherex-mission-2/' }], sources, scienceGoals, note: 'Band count and wavelength coverage summarize the mission brief. Public IRSA laboratory calibration summaries are included; astronomical observation products are linked from the archive but are not queried here.' }
const searchIndex = [
  ...objects.map(o => ({ id:o.id,title:o.name,type:'Object',description:o.type,path:`/explore/objects/${o.id}` })),
  ...lessons.map(l => ({ id:l.id,title:l.title,type:'Learning',description:l.text,path:`/learn/${l.id}` })),
  ...scienceObjectives.map(g => ({ id:g.id,title:g.title,type:'Science goal',description:g.question,path:'/science' })),
  ...journeys.map(j => ({ id:j.id,title:j.title,type:'Journey',description:`Guided journey with ${j.steps.length} exploration stops`,path:`/journeys/${j.id}` })),
  ...Object.entries(lessonDetails).flatMap(([lessonId,detail]) => (detail.glossary || []).map((term,index) => ({ id:`${lessonId}-term-${index}`,title:term.term,type:'Glossary',description:term.definition,path:`/learn/${lessonId}` }))),
  { id:'mission-spherex',title:'SPHEREx mission center',type:'Mission',description:mission.subtitle,path:'/mission' },
  { id:'spectrum',title:'Spectrum Explorer',type:'Tool',description:'Inspect measured channel centers and widths from laboratory calibration summaries.',path:'/explore/spectrum' },
  { id:'sky-map',title:'Cosmic Sky Map',type:'Tool',description:'Browse catalog coordinates in a schematic equatorial map.',path:'/explore/map' },
  { id:'lab',title:'Visualization Lab',type:'Tool',description:'Compare images from NASA’s Image and Video Library.',path:'/lab' },
]

app.get('/api/health', (_req, res) => res.json({ status: 'ok', service: 'spherex-explorer-api' }))
app.get('/api/sources', (_req, res) => res.json({ sources, calibration: { name:'NASA/IPAC IRSA SPHEREx Spectral Calibrations', url:'https://irsa.ipac.caltech.edu/data/SPHEREx/docs/spherex_spectral_calibrations.html' }, imagery: { name:'NASA Image and Video Library API', documentation:'https://images.nasa.gov/docs/images.nasa.gov_api_docs.pdf' } }))
app.get('/api/docs', (_req, res) => res.json({ title:'SPHEREx Cosmic Explorer API', version:'1.0', note:'Local educational catalog API; image search queries NASA Image and Video Library.', routes:['GET /api/health','GET /api/objects','GET /api/objects/:id','GET /api/spectrum/bands','GET /api/mission','GET /api/science','GET /api/sources','GET /api/lessons','GET /api/lessons/:id','GET /api/journeys','GET /api/journeys/:id','GET /api/search?q=','GET /api/images?q=','GET /api/discoveries','POST /api/discoveries','DELETE /api/discoveries/:kind/:id'] }))
app.get('/api/objects', (req, res) => { const q = String(req.query.q || '').trim().toLowerCase(); res.json(objects.filter(o => !q || [o.name, o.type, o.description, ...o.tags].join(' ').toLowerCase().includes(q))) })
app.get('/api/objects/:id', (req, res) => { const item = objects.find(o => o.id === req.params.id); item ? res.json(item) : res.status(404).json({ error: 'Object not found in the curated collection.' }) })
const imageCache = new Map()
app.get('/api/images', async (req, res) => {
  const query = String(req.query.q || '').trim().slice(0, 120)
  if (query.length < 2) return res.status(400).json({ error: 'Search with at least two characters.' })
  const key = query.toLowerCase()
  const cached = imageCache.get(key)
  if (cached && cached.expires > Date.now()) return res.json({ ...cached.value, cached: true })
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 7000)
  try {
    const url = new URL('https://images-api.nasa.gov/search')
    url.searchParams.set('q', query)
    url.searchParams.set('media_type', 'image')
    url.searchParams.set('page_size', '12')
    const response = await fetch(url, { signal: controller.signal, headers: { Accept: 'application/json' } })
    if (!response.ok) return res.status(502).json({ error: 'NASA Image and Video Library is temporarily unavailable.' })
    const payload = await response.json()
    const items = (payload?.collection?.items || []).flatMap(item => {
      const data = item?.data?.[0]
      const preview = item?.links?.find(link => link?.rel === 'preview')?.href
      const manifest = item?.href
      if (!data?.nasa_id || !data?.title || !preview || !manifest) return []
      try {
        if (new URL(preview).hostname !== 'images-assets.nasa.gov' || new URL(manifest).hostname !== 'images-assets.nasa.gov') return []
      } catch { return [] }
      return [{ id: String(data.nasa_id), title: String(data.title).slice(0, 240), description: String(data.description || '').slice(0, 1200), dateCreated: data.date_created || null, center: data.center || null, photographer: data.photographer || null, previewUrl: preview, manifestUrl: manifest, source: 'NASA Image and Video Library' }]
    })
    const value = { query, retrievedAt: new Date().toISOString(), source: { name: 'NASA Image and Video Library', url: 'https://images.nasa.gov/' }, items }
    if (imageCache.size > 80) imageCache.delete(imageCache.keys().next().value)
    imageCache.set(key, { expires: Date.now() + 15 * 60 * 1000, value })
    return res.json(value)
  } catch {
    return res.status(502).json({ error: 'NASA Image and Video Library could not be reached. Try again later.' })
  } finally { clearTimeout(timeout) }
})
let spectralChannels
async function loadSpectralChannels() {
  if (spectralChannels) return spectralChannels
  const root = path.resolve(here, '../public/data/calibrations/FidSpecSummary/SubChannel17')
  const channels = []
  for (let detectorBand = 1; detectorBand <= 6; detectorBand++) {
    const csvPath = path.join(root, `Band${detectorBand}`, `FidSpecSummary_Band${detectorBand}_SpecCh17.csv`)
    const rows = (await readFile(csvPath, 'utf8')).trim().split(/\r?\n/).slice(1)
    for (const row of rows) {
      const [channel, center, width, allPixelCenter, allPixelWidth] = row.split(',').map(Number)
      channels.push({ id: `channel-${String(channels.length + 1).padStart(3, '0')}`, index: channels.length + 1, detectorBand, channel, centerMicrometers: center, widthMicrometers: width, allPixelCenterMicrometers: allPixelCenter, allPixelWidthMicrometers: allPixelWidth, sourceFile: `FidSpecSummary_Band${detectorBand}_SpecCh17.csv` })
    }
  }
  if (channels.length !== mission.bandCount) throw new Error(`Expected ${mission.bandCount} calibrated spectral channels; found ${channels.length}.`)
  spectralChannels = channels
  return spectralChannels
}
app.get('/api/spectrum/bands', async (_req, res) => {
  try { res.json({ range: mission.wavelengthRange, count: mission.bandCount, dataStatus: 'IRSA laboratory calibration channel summaries', source: { name: 'NASA/IPAC IRSA SPHEREx Spectral Calibrations', url: 'https://irsa.ipac.caltech.edu/data/SPHEREx/docs/spherex_spectral_calibrations.html' }, bands: await loadSpectralChannels() }) }
  catch (error) { res.status(503).json({ error: 'IRSA spectral calibration files are unavailable.', detail: error.message }) }
})
app.get('/api/mission', (_req, res) => res.json(mission))
app.get('/api/science', (_req, res) => res.json({ objectives: scienceObjectives, sources }))
app.get('/api/lessons', (_req, res) => res.json(lessons))
app.get('/api/lessons/:id', (req, res) => { const item = lessons.find(l => l.id === req.params.id); item ? res.json({ ...item, ...lessonDetails[item.id] }) : res.status(404).json({ error: 'Lesson not found.' }) })
app.get('/api/journeys', (_req, res) => res.json(journeys))
app.get('/api/journeys/:id', (req, res) => { const item = journeys.find(j => j.id === req.params.id); item ? res.json(item) : res.status(404).json({ error: 'Journey not found.' }) })
app.get('/api/search', (req, res) => { const q = String(req.query.q || '').trim().toLowerCase(); if (!q) return res.json([]); res.json(searchIndex.filter(item => `${item.title} ${item.type} ${item.description}`.toLowerCase().includes(q)).slice(0, 12)) })
function getSavedPath(req) { const session = String(req.get('X-Explorer-Session') || ''); if (!/^[a-f0-9-]{36}$/i.test(session)) return null; const digest = createHash('sha256').update(session).digest('hex'); return path.join(savedDir, `${digest}.json`) }
async function getSaved(file) { try { return JSON.parse(await readFile(file, 'utf8')) } catch { return [] } }
await mkdir(savedDir, { recursive: true })
app.get('/api/discoveries', async (req, res) => { const file=getSavedPath(req); if(!file)return res.status(400).json({error:'Anonymous session identifier is required.'}); res.json(await getSaved(file)) })
app.post('/api/discoveries', async (req, res) => { const file=getSavedPath(req); if(!file)return res.status(400).json({error:'Anonymous session identifier is required.'}); const { id, kind } = req.body || {}; if (typeof id !== 'string' || id.length > 80 || !/^[a-z0-9-]+$/.test(id) || !['object', 'lesson', 'journey'].includes(kind)) return res.status(400).json({ error: 'Provide a valid id and kind.' }); const found = kind === 'object' ? objects.some(o => o.id === id) : kind === 'lesson' ? lessons.some(l => l.id === id) : journeys.some(j => j.id === id); if (!found) return res.status(404).json({ error: 'Item not found in the available collection.' }); const saved = await getSaved(file); const item = { id, kind, savedAt: new Date().toISOString() }; if (!saved.some(x => x.id === id && x.kind === kind)) saved.push(item); await writeFile(file, JSON.stringify(saved, null, 2)); res.status(201).json(item) })
app.delete('/api/discoveries/:kind/:id', async (req, res) => { const file=getSavedPath(req); if(!file)return res.status(400).json({error:'Anonymous session identifier is required.'}); if (!['object', 'lesson', 'journey'].includes(req.params.kind)) return res.status(400).json({ error: 'Invalid discovery kind.' }); const saved = await getSaved(file); const next = saved.filter(x => !(x.kind === req.params.kind && x.id === req.params.id)); await writeFile(file, JSON.stringify(next, null, 2)); res.json({ ok: true }) })
app.use((error, _req, res, _next) => { console.error('API request failed:', error?.message || error); res.status(500).json({ error:'The server could not complete this request.' }) })
app.use('/api', (_req, res) => res.status(404).json({ error: 'API route not found.' }))
const distPath = path.resolve(here, '../dist')
if (existsSync(distPath)) {
  app.use(express.static(distPath))
  app.use((req, res, next) => { if (req.method === 'GET' && !req.path.startsWith('/api')) return res.sendFile(path.join(distPath, 'index.html'), error => { if (error) next() }); next() })
}
app.listen(port, () => console.log(`SPHEREx API listening on http://localhost:${port}`))
