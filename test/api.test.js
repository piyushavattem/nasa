import test, { before, after } from 'node:test'
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

const port = 4300 + Math.floor(Math.random() * 500)
const base = `http://127.0.0.1:${port}/api`
let server
let dataDirectory
before(async () => {
  dataDirectory = await mkdtemp(path.join(tmpdir(), 'spherex-api-test-'))
  server = spawn(process.execPath, ['server/index.js'], { env: { ...process.env, PORT: String(port), DATA_DIR: dataDirectory }, stdio: 'ignore' })
  for (let attempt = 0; attempt < 50; attempt++) {
    try { if ((await fetch(`${base}/health`)).ok) return } catch {}
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  throw new Error('API did not start in time')
})
after(async () => { if (server && server.exitCode === null) { server.kill(); await once(server, 'exit') }; if (dataDirectory) await rm(dataDirectory, { recursive: true, force: true }) })

test('health endpoint reports service status', async () => {
  const response = await fetch(`${base}/health`)
  assert.equal(response.status, 200)
  assert.equal((await response.json()).status, 'ok')
})
test('curated object retrieval includes catalog coordinates', async () => {
  const response = await fetch(`${base}/objects/andromeda`)
  const item = await response.json()
  assert.equal(response.status, 200)
  assert.equal(item.name, 'Andromeda Galaxy')
  assert.equal(typeof item.raDeg, 'number')
})
test('spectrum endpoint serves all 102 calibration summaries', async () => {
  const data = await (await fetch(`${base}/spectrum/bands`)).json()
  assert.equal(data.bands.length, 102)
  assert.match(data.dataStatus, /laboratory calibration/)
})
test('science endpoint includes six independent objectives', async () => {
  const payload=await (await fetch(`${base}/science`)).json()
  assert.equal(payload.objectives.length,6)
  assert.ok(payload.objectives.every(item=>item.question&&item.contribution&&item.lesson&&item.tool))
})
test('source registry and API route documentation are available', async () => {
  assert.ok((await (await fetch(`${base}/sources`)).json()).imagery.documentation)
  assert.ok((await (await fetch(`${base}/docs`)).json()).routes.includes('GET /api/images?q='))
})
test('search finds available content', async () => {
  const result = await (await fetch(`${base}/search?q=infrared`)).json()
  assert.ok(result.length > 0)
})
test('unknown journey has a proper not found response', async () => {
  const response = await fetch(`${base}/journeys/not-a-journey`)
  assert.equal(response.status, 404)
})
test('discovery creation rejects invalid input', async () => {
  const response = await fetch(`${base}/discoveries`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Explorer-Session':'11111111-1111-4111-8111-111111111111' }, body: JSON.stringify({ id: '../saved.json', kind: 'object' }) })
  assert.equal(response.status, 400)
})
test('discoveries persist privately by anonymous browser session', async () => {
  const one='11111111-1111-4111-8111-111111111111', two='22222222-2222-4222-8222-222222222222'
  const headers={ 'Content-Type':'application/json', 'X-Explorer-Session':one }
  const created=await fetch(`${base}/discoveries`,{method:'POST',headers,body:JSON.stringify({id:'infrared-journey',kind:'journey'})})
  assert.equal(created.status,201)
  assert.equal((await (await fetch(`${base}/discoveries`,{headers:{'X-Explorer-Session':one}})).json()).length,1)
  assert.equal((await (await fetch(`${base}/discoveries`,{headers:{'X-Explorer-Session':two}})).json()).length,0)
  assert.equal((await fetch(`${base}/discoveries/journey/infrared-journey`,{method:'DELETE',headers:{'X-Explorer-Session':one}})).status,200)
})
test('NASA image search validates short queries', async () => {
  assert.equal((await fetch(`${base}/images?q=x`)).status,400)
})
