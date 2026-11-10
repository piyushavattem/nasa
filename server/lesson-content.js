export const lessonDetails = {
  'infrared-light': {
    sections: [
      { heading: 'Beyond visible light', body: 'Visible light is only one narrow part of the electromagnetic spectrum. Infrared wavelengths are longer than visible red light and can reveal cooler objects and emission from dust.' },
      { heading: 'Why astronomers use it', body: 'Dust can absorb visible light and re-emit energy in the infrared. As the universe expands, light from distant galaxies is also stretched toward longer wavelengths.' },
    ],
    glossary: [{ term: 'Wavelength', definition: 'The distance between repeating peaks in a wave; infrared astronomy commonly uses micrometres.' }, { term: 'Infrared', definition: 'Electromagnetic radiation with wavelengths longer than visible red light.' }],
    sources: [{ name: 'NASA SPHEREx mission overview', url: 'https://science.nasa.gov/mission/spherex/' }], relatedPath: '/explore/spectrum',
  },
  spectroscopy: {
    sections: [
      { heading: 'Spread light by wavelength', body: 'A spectrograph separates incoming light into wavelengths. The resulting spectrum records how bright a source is across that range.' },
      { heading: 'Read the features', body: 'Absorption and emission features can be compared with known molecular and atomic signatures. Those interpretations require calibrated data and documented uncertainties.' },
    ],
    glossary: [{ term: 'Spectrum', definition: 'A representation or measurement of light as a function of wavelength or frequency.' }, { term: 'Spectroscopy', definition: 'The study of matter through its interaction with light distributed across wavelengths.' }],
    sources: [{ name: 'IRSA SPHEREx Archive', url: 'https://irsa.ipac.caltech.edu/Missions/spherex.html' }], relatedPath: '/explore/spectrum',
  },
  'mapping-the-sky': {
    sections: [
      { heading: 'A coordinate system for the sky', body: 'Astronomers use right ascension and declination to describe positions on the celestial sphere. These coordinates differ from latitude and longitude on Earth.' },
      { heading: 'Maps have projections', body: 'A sky map projects a curved celestial sphere onto a flat display. Every projection has trade-offs, so the projection and coordinate frame should be stated.' },
    ],
    glossary: [{ term: 'Right ascension', definition: 'A coordinate measured eastward along the celestial equator.' }, { term: 'Declination', definition: 'Angular distance north or south of the celestial equator.' }],
    sources: [{ name: 'SIMBAD Astronomical Database', url: 'https://simbad.cds.unistra.fr/simbad/' }], relatedPath: '/explore/map',
  },
  'cosmic-inflation': {
    sections: [
      { heading: 'A very early expansion', body: 'Cosmic inflation is a proposed episode of extremely rapid expansion in the early universe. It helps explain several large-scale properties of the cosmos.' },
      { heading: 'What galaxy maps can test', body: 'Inflation influenced the distribution of matter. Large galaxy surveys can measure that distribution and test predictions of inflationary models.' },
    ],
    glossary: [{ term: 'Inflation', definition: 'A proposed brief period of accelerated expansion in the very early universe.' }, { term: 'Large-scale structure', definition: 'The organization of matter into galaxy groups, filaments, and underdense regions.' }],
    sources: [{ name: 'NASA JPL SPHEREx Science', url: 'https://www.jpl.nasa.gov/press-kits/spherex/mission-overview/science/' }], relatedPath: '/mission',
  },
  'galaxy-evolution': {
    sections: [
      { heading: 'Galaxies change over time', body: 'Stars form from gas, evolve, and return material to their surroundings. Galaxies also interact and merge, changing their structure over cosmic time.' },
      { heading: 'A history written in light', body: 'Observing many galaxies at different distances lets scientists study different eras of cosmic history. Infrared spectra add information about sources and material.' },
    ],
    glossary: [{ term: 'Redshift', definition: 'A shift of light toward longer wavelengths, often used in studying distant galaxies.' }, { term: 'Cosmic history', definition: 'The sequence of changes in the universe from its early expansion to its present structure.' }],
    sources: [{ name: 'NASA JPL SPHEREx Science', url: 'https://www.jpl.nasa.gov/press-kits/spherex/mission-overview/science/' }], relatedPath: '/mission',
  },
  'cosmic-ices': {
    sections: [
      { heading: 'Molecules in cold clouds', body: 'In cold interstellar regions, molecules such as water can freeze onto dust grains. These icy materials are part of the environments where stars and planetary systems form.' },
      { heading: 'Look for molecular signatures', body: 'Molecules interact with light at characteristic wavelengths. SPHEREx is designed to survey the sky in infrared bands that help scientists study these ingredients across the Milky Way.' },
    ],
    glossary: [{ term: 'Interstellar medium', definition: 'Gas and dust between stars in a galaxy.' }, { term: 'Molecular ice', definition: 'A frozen molecule, often coating small dust grains in cold space.' }],
    sources: [{ name: 'NASA JPL SPHEREx Science', url: 'https://www.jpl.nasa.gov/press-kits/spherex/mission-overview/science/' }], relatedPath: '/explore/objects/orion-nebula',
  },
  'galaxy-distances': {
    sections: [
      { heading: 'Use spectral redshift', body: 'As the universe expands, light from distant galaxies is stretched toward longer wavelengths. Measuring that shift helps astronomers estimate cosmological distances when interpreted with an expansion model.' },
      { heading: 'Build a three-dimensional map', body: 'Combining sky positions with distance estimates lets scientists study how galaxies are distributed through space, not only across the sky.' },
    ],
    glossary: [{ term: 'Redshift', definition: 'A shift of spectral features toward longer wavelengths.' }, { term: 'Cosmological distance', definition: 'A distance measure inferred using a model of the universe’s expansion.' }],
    sources: [{ name: 'NASA JPL SPHEREx Science', url: 'https://www.jpl.nasa.gov/press-kits/spherex/mission-overview/science/' }], relatedPath: '/explore/map',
  },
  'spherex-contribution': {
    sections: [
      { heading: 'A spectral survey of the whole sky', body: 'SPHEREx observes the sky in 102 infrared spectral bands. Its survey provides a broad set of measurements for studying galaxies and materials in our own galaxy.' },
      { heading: 'Three connected science goals', body: 'The mission investigates cosmic inflation through galaxy distributions, measures the collective glow from galaxies over cosmic history, and studies water and other important molecules in the Milky Way.' },
    ],
    glossary: [{ term: 'Spectral band', definition: 'A defined range of wavelengths measured by an instrument.' }, { term: 'All-sky survey', definition: 'A systematic survey intended to cover the entire celestial sky.' }],
    sources: [{ name: 'NASA/IPAC IRSA SPHEREx', url: 'https://irsa.ipac.caltech.edu/Missions/spherex.html' }], relatedPath: '/mission',
  },
}
