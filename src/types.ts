export type SkyObject = {
  id: string; name: string; type: string; position: string; raDeg?: number; decDeg?: number
  description: string; status: string; source: { name: string; url: string }
  tags: string[]; scene: [number, number, number]; tint: string
}
export type Band = { id: string; index: number; detectorBand: number; channel: number; centerMicrometers: number; widthMicrometers: number; allPixelCenterMicrometers: number; allPixelWidthMicrometers: number; sourceFile: string }
export type Lesson = {
  id: string; title: string; group: string; duration: string; text: string; icon: string
  sections?: { heading: string; body: string }[]
  glossary?: { term: string; definition: string }[]
  sources?: { name: string; url: string }[]
  relatedPath?: string
}
export type SearchResult = { id: string; title: string; type: string; description: string; path: string }
export type Saved = { id: string; kind: 'object' | 'lesson' | 'journey'; savedAt: string }
export type NasaImage = { id: string; title: string; description: string; dateCreated: string | null; center: string | null; photographer?: string | null; previewUrl: string; manifestUrl: string; source: string; illustrative?: boolean }
