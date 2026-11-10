import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowDown, ArrowDownRight, ArrowRight, ArrowUpRight, ChevronLeft, ChevronRight, CircleHelp, ExternalLink, Menu, Orbit, Telescope, X } from 'lucide-react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { api } from './api'
import WebGLErrorBoundary from './WebGLErrorBoundary'
const HeroAtmosphere = lazy(() => import('./HeroAtmosphere'))
import type { SkyObject } from './types'
import './landing.css'

const skyMap = 'https://d2pn8kiwq2w21t.cloudfront.net/original_images/e1a-SPHEREx_all_sky_stars_and_gas-dust.jpg'
const spacecraft = 'https://d2pn8kiwq2w21t.cloudfront.net/images/8_Things_to_Know_-_SPHEREx_Artist_concept.width-640.jpg'
const skyVideo = 'https://svs.gsfc.nasa.gov/vis/a030000/a031300/a031376/spherex-all-sky-swipe-3.27a-1080p.mp4'
const skyVideoWebm = 'https://svs.gsfc.nasa.gov/vis/a030000/a031300/a031376/spherex-all-sky-swipe-3.27a-1080p.mp4.webm'

export default function LandingPage() {
  const page = useRef<HTMLDivElement>(null)
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [compare, setCompare] = useState(53)
  const [stage, setStage] = useState(0)
  const [objects, setObjects] = useState<SkyObject[]>([])
  const [selected, setSelected] = useState('andromeda')
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  const [heroActive, setHeroActive] = useState(true)
  const [videoFailed, setVideoFailed] = useState(false)
  const [videoReady, setVideoReady] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const selectedObject = objects.find(object => object.id === selected)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 36)
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    api.objects().then(setObjects).catch(() => setObjects([]))
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (heroActive && videoRef.current && !videoFailed && !reducedMotion) {
      videoRef.current.play().catch(() => {})
    }
  }, [heroActive, videoFailed, reducedMotion])

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
    const updatePreference = () => setReducedMotion(preference.matches)
    preference.addEventListener('change', updatePreference)
    const hero = document.querySelector('.landing-hero')
    const observer = hero ? new IntersectionObserver(entries => setHeroActive(entries.some(entry => entry.isIntersecting)), { threshold: 0 }) : undefined
    if (hero) observer?.observe(hero)
    return () => { preference.removeEventListener('change', updatePreference); observer?.disconnect() }
  }, [])

  useEffect(() => {
    const root = page.current
    if (!root || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    gsap.registerPlugin(ScrollTrigger)
    const context = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>('.landing-reveal').forEach(element => {
        gsap.fromTo(element, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: .8, ease: 'power2.out', scrollTrigger: { trigger: element, start: 'top 87%', once: true } })
      })
      gsap.to('.landing-hero-stage', { yPercent: 8, ease: 'none', scrollTrigger: { trigger: '.landing-hero', start: 'top top', end: 'bottom top', scrub: true } })
    }, root)
    const observers: IntersectionObserver[] = []
    root.querySelectorAll<HTMLElement>('[data-process-step]').forEach((element, index) => {
      const observer = new IntersectionObserver(entries => { if (entries.some(entry => entry.isIntersecting)) setStage(index) }, { threshold: .55 })
      observer.observe(element)
      observers.push(observer)
    })
    return () => { observers.forEach(observer => observer.disconnect()); context.revert() }
  }, [])

  return <div className="landing" ref={page}>
    <header className={`landing-nav ${scrolled ? 'is-scrolled' : ''}`}>
      <Link to="/" className="landing-brand" aria-label="SPHEREx Cosmic Explorer home"><span className="landing-brand-mark"><Orbit size={21}/></span><span><b>SPHEREx</b><small>COSMIC EXPLORER</small></span></Link>
      <nav className={menuOpen ? 'nav-open' : ''} aria-label="Main navigation"><a href="#top" onClick={() => setMenuOpen(false)}>Home</a><a href="#paths" onClick={() => setMenuOpen(false)}>Explore</a><a href="#science" onClick={() => setMenuOpen(false)}>Science</a><a href="#mission" onClick={() => setMenuOpen(false)}>Mission</a><a href="#about" onClick={() => setMenuOpen(false)}>About</a></nav>
      <Link to="/explore" className="landing-nav-cta">Begin exploring <ArrowUpRight size={14}/></Link>
      <button className="landing-menu-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}>{menuOpen ? <X size={20}/> : <Menu size={20}/>}</button>
    </header>

    <main>
      <section className="landing-hero" id="top">
        <div className="landing-hero-stage">
          <img className="landing-hero-poster" src={skyMap} alt="" aria-hidden="true" fetchPriority="high" />
          {!reducedMotion && !videoFailed && (
            <video
              ref={videoRef}
              className={`landing-hero-media ${videoReady ? 'is-ready' : ''}`}
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              poster={skyMap}
              aria-label="NASA animation of SPHEREx infrared all-sky maps, showing dust, gas, stars, and galaxies"
              onCanPlay={event => { setVideoReady(true); event.currentTarget.play().catch(() => {}) }}
              onPlaying={() => setVideoReady(true)}
              onError={() => setVideoFailed(true)}
            >
              <source src={skyVideo} type="video/mp4" />
              <source src={skyVideoWebm} type="video/webm" />
            </video>
          )}
          {!reducedMotion && <WebGLErrorBoundary><Suspense fallback={null}><HeroAtmosphere active={heroActive} /></Suspense></WebGLErrorBoundary>}
          <div className="landing-hero-stars" aria-hidden="true" />
          <div className="hero-scan" aria-hidden="true" />
          <div className="hero-crosshair" aria-hidden="true" />
        </div>
        <div className="landing-hero-vignette" aria-hidden="true" />
        <div className="landing-hero-copy">
          <div className="landing-eyebrow"><i /> NASA SPHEREx · LIVE INFRARED SKY</div>
          <h1>STEP INTO<br /><em>REAL SPACE.</em></h1>
          <p>A cinematic flyover of the first SPHEREx all-sky map. Infrared dust, gas, stars, and galaxies unfold as you enter the explorer.</p>
          <div className="landing-hero-actions">
            <Link to="/explore" className="landing-primary">Enter the universe <ArrowRight size={16} /></Link>
            <a href="#mission" className="landing-secondary">Discover the mission <ArrowDownRight size={15} /></a>
          </div>
          <a className="scroll-cue" href="#paths"><span><ArrowDown size={14} /></span> SCROLL TO EXPLORE</a>
        </div>
        <div className="landing-hero-caption">
          <span>{reducedMotion ? 'STATIC POSTER · MOTION REDUCED' : videoFailed ? 'VIDEO UNAVAILABLE · SHOWING POSTER' : videoReady ? 'NOW PLAYING · SPHEREx ALL-SKY ANIMATION' : 'LOADING INFRARED SKY VIDEO'}</span>
          <a href="https://svs.gsfc.nasa.gov/31376/" target="_blank" rel="noreferrer">NASA/JPL-Caltech · Scientific visualization <ExternalLink size={11} /></a>
        </div>
        <div className="landing-hero-count"><span>01</span><i /><small>THE COSMIC JOURNEY</small></div>
        <div className="hero-telemetry" aria-hidden="true">
          <span><i /> FIELD LOCKED</span>
          <b>0.75 — 5.0 μm</b>
          <small>102 INFRARED CHANNELS</small>
        </div>
      </section>

      <section className="landing-paths section-wrap" id="paths">
        <div className="landing-section-head landing-reveal"><div><span className="landing-kicker">EXPLORE THE POSSIBILITIES</span><h2>What will you <em>explore?</em></h2><p>Step into a universe of discovery. Choose your path and uncover what the cosmos has to reveal.</p></div><Link to="/explore" className="landing-inline-link">All experiences <ArrowRight size={13}/></Link></div>
        <div className="path-editorial">
          <Link to="/explore" className="path-feature path-universe landing-reveal"><img src={skyMap} loading="lazy" alt="SPHEREx infrared panorama of the full sky"/><span className="path-index">01 / EXPLORE</span><div><h3>Explore the Universe</h3><p>Navigate a cosmic landscape, discover objects, and follow the science behind them.</p></div><span className="path-arrow"><ArrowUpRight size={17}/></span></Link>
          <div className="path-side">
            <Link to="/science" className="path-feature path-science landing-reveal"><div className="path-science-art"><span className="spectrum-sweep"/><i/><i/><i/><small>WAVELENGTH · μm</small></div><span className="path-index">02 / UNDERSTAND</span><div><h3>Discover the Science</h3><p>See how infrared observations open new ways to study galaxies and cosmic history.</p></div><span className="path-arrow"><ArrowUpRight size={17}/></span></Link>
            <Link to="/explore/spectrum" className="path-feature path-spectrum landing-reveal"><div className="path-spectrum-art"><div className="spectrum-glow"/><div className="spectrum-line"/><div className="spectrum-ruler"><i/><i/><i/><i/><i/><i/><i/><i/></div><span>0.75 μm <b>INFRARED</b> 5.0 μm</span></div><span className="path-index">03 / INVESTIGATE</span><div><h3>Explore the Spectrum</h3><p>Move through infrared wavelengths and learn what they help astronomers see.</p></div><span className="path-arrow"><ArrowUpRight size={17}/></span></Link>
          </div>
        </div>
      </section>

      <section className="landing-visible" id="science"><div className="visible-copy landing-reveal"><span className="landing-kicker">SEE BEYOND THE VISIBLE</span><h2>Some of the universe<br/>is hidden <em>in plain sight.</em></h2><p>Different wavelengths reveal different aspects of cosmic objects. Infrared observations help scientists study dust, cooler objects, and light from distant galaxies.</p><a href="https://science.nasa.gov/mission/spherex/" target="_blank" rel="noreferrer" className="landing-inline-link">Why infrared light matters <ArrowUpRight size={13}/></a></div><div className="visible-comparison landing-reveal"><div className="visible-image"><img src={skyMap} loading="lazy" alt="SPHEREx all-sky map with infrared bands represented in visible colors"/><div className="visible-muted" style={{ clipPath: `inset(0 ${100 - compare}% 0 0)` }}><img src={skyMap} loading="lazy" alt="The same SPHEREx map with color suppressed for visual comparison only"/></div><div className="visible-divider" style={{ left: `${compare}%` }}><span>DRAG</span></div><div className="visible-labels"><span>INFRARED COLOR MAP <small>SPHEREx · OBSERVATION</small></span><span>COLOR-SUPPRESSED VIEW <small>ILLUSTRATIVE TRANSFORM</small></span></div></div><label className="compare-slider"><span>COLOR-SUPPRESSED</span><input aria-label="Compare infrared color map to color-suppressed version" type="range" min="8" max="92" value={compare} onChange={event => setCompare(Number(event.target.value))}/><span>SPHEREx COLOR VIEW</span></label><p className="image-credit">Image: NASA/JPL-Caltech · The comparison uses the same map; it is not a matched visible-light observation.</p></div></section>

      <section className="landing-process section-wrap"><div className="landing-section-head landing-reveal"><div><span className="landing-kicker">FROM LIGHT TO DISCOVERY</span><h2>Follow the signal.</h2><p>From photons to a new way of seeing the universe.</p></div><Link to="/mission" className="landing-inline-link">How SPHEREx works <ArrowRight size={13}/></Link></div><div className="process-layout"><div className="process-map" aria-label="Diagram showing observation becoming a sky map"><img src={skyMap} alt="SPHEREx all-sky map visualization" loading="lazy"/><div className="process-crosshair"/><div className="process-scan" style={{ transform: `translateY(${stage * 23}px)` }}/><span>ALL-SKY INFRARED MAP · NASA/JPL-CALTECH</span></div><div className="process-steps">{[
          ['01','Observe','Collect infrared light from across the sky.','Observe'],['02','Measure','Separate incoming light across spectral channels.','Measure'],['03','Map','Build a broad spectral map of the infrared sky.','Map'],['04','Investigate','Use galaxy distributions and spectra to study cosmic questions.','Investigate'],
        ].map(([number,title,copy,label], index) => <div className={`process-step ${stage === index ? 'current' : ''}`} data-process-step={index} key={number}><span className="process-number">{number}</span><div><small>{label.toUpperCase()}</small><h3>{title}</h3><p>{copy}</p></div><span className="process-bead"><i/></span></div>)}</div></div>
      </section>

      <section className="landing-mission" id="mission"><div className="mission-copy landing-reveal"><span className="landing-kicker">INSIDE THE MISSION</span><h2>A new map.<br/><em>102 colors of infrared.</em></h2><p>SPHEREx is a NASA astrophysics mission mapping the entire sky in 102 spectral bands. Its observations help scientists investigate the earliest moments of the universe, the history of galaxies, and the ingredients of planetary systems.</p><Link to="/mission" className="landing-primary">Explore the mission <ArrowRight size={15}/></Link></div><div className="mission-visual"><img src={spacecraft} loading="lazy" alt="Artist’s concept of the SPHEREx observatory in space"/><div className="mission-visual-shade"/><span className="mission-image-credit">ARTIST’S CONCEPT · NASA/JPL-CALTECH</span><div className="mission-number"><b>102</b><span>INFRARED SPECTRAL BANDS</span><i/><small>0.75 — 5.0 μm</small></div><div className="mission-spec-label">SIX DETECTOR / FILTER ASSEMBLIES <a href="https://irsa.ipac.caltech.edu/Missions/spherex.html" target="_blank" rel="noreferrer">MISSION DETAILS <ExternalLink size={11}/></a></div></div></section>

      <section className="landing-featured section-wrap"><div className="featured-art landing-reveal"><img src={skyMap} loading="lazy" alt="The first SPHEREx infrared all-sky map"/><span className="featured-annotation">102 INFRARED COLORS · FULL-SKY MOSAIC</span><div className="featured-controls"><button aria-label="Previous featured science" onClick={() => document.querySelector('#paths')?.scrollIntoView({ behavior: 'smooth' })}><ChevronLeft size={15}/></button><button aria-label="Next featured science" onClick={() => document.querySelector('#mission')?.scrollIntoView({ behavior: 'smooth' })}><ChevronRight size={15}/></button><span>01 / 01</span></div></div><div className="featured-copy landing-reveal"><span className="landing-kicker">A FIRST LOOK · DECEMBER 2025</span><h2>Our galaxy,<br/><em>in infrared.</em></h2><p>SPHEREx completed its first all-sky infrared map using observations collected between May and December 2025. The image maps infrared wavelengths into visible colors to distinguish stars, hot gas, and cosmic dust.</p><a href="https://www.jpl.nasa.gov/images/pia26600-spherexs-first-all-sky-map/" target="_blank" rel="noreferrer" className="landing-primary">See the NASA release <ExternalLink size={14}/></a><small className="image-credit">NASA/JPL-Caltech · Reduced-resolution all-sky mosaic</small></div></section>

      <section className="landing-data section-wrap" id="data"><div className="landing-section-head landing-reveal"><div><span className="landing-kicker">EXPLORE THE DATA</span><h2>Start with a <em>point of light.</em></h2><p>Browse this app’s curated object catalog, then continue to the sky map or full explorer.</p></div><Link to="/explore/map" className="landing-inline-link">Open the sky map <ArrowRight size={13}/></Link></div><div className="data-preview"><div className="data-preview-image"><img src={skyMap} loading="lazy" alt="All-sky infrared mosaic from the SPHEREx mission"/><div className="data-preview-overlay"/><div className="data-preview-top"><span><i/> SPHEREx · RELEASED SKY MAP</span><a href="https://www.jpl.nasa.gov/images/pia26600-spherexs-first-all-sky-map/" target="_blank" rel="noreferrer">SOURCE <ExternalLink size={11}/></a></div><div className="data-preview-bottom"><span>ALL-SKY MOSAIC · SELECTED INFRARED COLORS</span><b>First map complete <small>2025</small></b></div></div><div className="data-preview-panel"><span className="landing-kicker">CURATED OBJECT CATALOG</span><label htmlFor="landing-object">Choose an object</label><select id="landing-object" value={selected} onChange={event => setSelected(event.target.value)} disabled={!objects.length}><option value="" disabled>{objects.length ? 'Select a catalog object' : 'Catalog unavailable'}</option>{objects.map(object => <option key={object.id} value={object.id}>{object.name}</option>)}</select>{selectedObject ? <div className="selected-summary"><span>{selectedObject.type.toUpperCase()}</span><h3>{selectedObject.name}</h3><p>{selectedObject.description}</p><div className="summary-coordinate">{selectedObject.position}</div><Link to={`/explore/objects/${selectedObject.id}`}>Open object profile <ArrowRight size={13}/></Link></div> : <p className="catalog-empty">The object service is unavailable. You can still open the full explorer.</p>}<Link className="data-explorer-link" to="/explore"><Telescope size={15}/> Enter the full explorer <ArrowUpRight size={14}/></Link></div></div><p className="data-provenance"><InfoLine/> The map image is an official SPHEREx product from NASA/JPL-Caltech. Object records are a separate curated catalog and do not represent positions on this map.</p></section>

      <section className="landing-final" id="about"><img src={skyMap} loading="lazy" alt="Infrared sky colors from SPHEREx’s first all-sky map"/><div className="final-shade"/><div className="final-copy"><span className="landing-kicker">YOUR JOURNEY CONTINUES</span><h2>Your universe<br/><em>is waiting.</em></h2><p>Follow the light. Explore the cosmos. Discover what lies beyond the visible.</p><div><Link to="/explore" className="landing-primary">Start exploring <ArrowRight size={15}/></Link><Link to="/mission" className="landing-secondary">Learn about SPHEREx <ArrowUpRight size={14}/></Link></div></div></section>
    </main>

    <footer className="landing-footer"><div className="footer-main"><Link to="/" className="landing-brand"><span className="landing-brand-mark"><Orbit size={19}/></span><span><b>SPHEREx</b><small>COSMIC EXPLORER</small></span></Link><nav aria-label="Footer navigation"><a href="#top">Home</a><Link to="/explore">Explore</Link><Link to="/science">Science</Link><Link to="/mission">Mission</Link><a href="#about">About</a></nav><div className="footer-official"><span>OFFICIAL MISSION RESOURCES</span><a href="https://science.nasa.gov/mission/spherex/" target="_blank" rel="noreferrer">NASA Science <ExternalLink size={11}/></a><a href="https://irsa.ipac.caltech.edu/Missions/spherex.html" target="_blank" rel="noreferrer">NASA/IPAC IRSA <ExternalLink size={11}/></a></div></div><div className="footer-bottom"><span>© 2026 SPHEREx Cosmic Explorer · Educational project, not an official NASA website.</span><span>All-sky image and spacecraft concept: NASA/JPL-Caltech. <a href="https://www.jpl.nasa.gov/imagepolicy/" target="_blank" rel="noreferrer">Image policy <ExternalLink size={10}/></a></span></div></footer>
  </div>
}

function InfoLine() { return <CircleHelp size={14} aria-hidden="true"/> }
