import type { Band, Lesson, NasaImage, Saved, SearchResult, SkyObject } from './types'

function anonymousSession() {
  const key = 'spherex-anonymous-session'
  let value = localStorage.getItem(key)
  if (!value) { value = crypto.randomUUID(); localStorage.setItem(key, value) }
  return value
}
async function get<T>(path: string): Promise<T> {
  let response: Response
  try { response = await fetch(`/api${path}`, { headers: { 'X-Explorer-Session': anonymousSession() }, signal: AbortSignal.timeout(10000) }) }
  catch (error) { throw new Error(error instanceof DOMException && error.name === 'TimeoutError' ? 'The explorer request timed out.' : 'The explorer service could not be reached.') }
  if (!response.ok) throw new Error(response.status === 404 ? 'That item is not in the available collection.' : 'The explorer service could not be reached.')
  return response.json() as Promise<T>
}
async function searchNasaImages(query: string) {
  const term = query.trim().slice(0, 120)
  if (term.length < 2) throw new Error('Enter at least two characters to search NASA images.')
  const url = new URL('https://images-api.nasa.gov/search')
  url.searchParams.set('q', term)
  url.searchParams.set('media_type', 'image')
  url.searchParams.set('page_size', '12')
  let response: Response
  try {
    response = await fetch(url, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(9000) })
  } catch {
    throw new Error('NASA image search could not connect. Check internet access and retry.')
  }
  if (!response.ok) throw new Error(`NASA image search returned HTTP ${response.status}.`)
  const payload = await response.json() as { collection?: { items?: { data?: { nasa_id?: string; title?: string; description?: string; date_created?: string; center?: string; photographer?: string }[]; links?: { rel?: string; href?: string }[]; href?: string }[] } }
  const items = (payload.collection?.items || []).flatMap(item => {
    const data = item.data?.[0]
    const previewUrl = item.links?.find(link => link.rel === 'preview')?.href
    const manifestUrl = item.href
    if (!data?.nasa_id || !data.title || !previewUrl || !manifestUrl) return []
    try {
      if (new URL(previewUrl).hostname !== 'images-assets.nasa.gov' || new URL(manifestUrl).hostname !== 'images-assets.nasa.gov') return []
    } catch { return [] }
    return [{ id: data.nasa_id, title: data.title.slice(0, 240), description: (data.description || '').slice(0, 1200), dateCreated: data.date_created || null, center: data.center || null, photographer: data.photographer || null, previewUrl, manifestUrl, source: 'NASA Image and Video Library' }]
  })
  return { query: term, source: { name: 'NASA Image and Video Library', url: 'https://images.nasa.gov/' }, items }
}
export const api = {
  objects: () => get<SkyObject[]>('/objects'),
  object: (id: string) => get<SkyObject>(`/objects/${encodeURIComponent(id)}`),
  bands: () => get<{ bands: Band[]; range: number[]; count: number; dataStatus: string; source: { name: string; url: string } }>('/spectrum/bands'),
  science: () => get<{ objectives: { id:string; title:string; question:string; contribution:string; wavelength:string; lesson:string; tool:string }[]; sources: {id:string;name:string;url:string}[] }>('/science'),
  mission: () => get<{ name: string; subtitle: string; wavelengthRange: number[]; bandCount: number; detectorAssemblies?: number; observationStrategy?: string; timeline?: { date:string; label:string; detail:string; sourceUrl:string }[]; sources: { id: string; name: string; url: string }[]; scienceGoals: { id: string; title: string; text: string; icon: string; color: string }[]; note: string }>('/mission'),
  lessons: () => get<Lesson[]>('/lessons'),
  lesson: (id: string) => get<Lesson>(`/lessons/${encodeURIComponent(id)}`),
  journeys: () => get<{ id: string; title: string; description?: string; objective?: string; estimatedMinutes?: number; steps: string[] }[]>('/journeys'),
  images: (query: string) => searchNasaImages(query) as Promise<{ query: string; source: { name: string; url: string }; items: NasaImage[] }>,
  search: (q: string) => get<SearchResult[]>(`/search?q=${encodeURIComponent(q)}`),
  saved: () => get<Saved[]>('/discoveries'),
  save: async (id: string, kind: Saved['kind']) => { const r = await fetch('/api/discoveries', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Explorer-Session': anonymousSession() }, body: JSON.stringify({ id, kind }) }); if (!r.ok) throw new Error('Could not save this discovery.') },
  remove: async (item: Saved) => { const r = await fetch(`/api/discoveries/${item.kind}/${encodeURIComponent(item.id)}`, { method: 'DELETE', headers: { 'X-Explorer-Session': anonymousSession() } }); if (!r.ok) throw new Error('Could not remove this discovery.') },
}
