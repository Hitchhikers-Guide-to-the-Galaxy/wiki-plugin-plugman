// The API-key door: does it open for the right caller and nobody else?
import { describe, it, before, after } from 'node:test'
import assert from 'node:assert/strict'
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import { authorize, scopesOf, offered, decide } from '../server/keys.js'

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'plugman-keys-'))
const status = path.join(tmp, 'status')
const file = path.join(status, 'api-keys.json')
const req = key => ({ headers: key ? { 'x-api-key': key } : {} })
let clock = Date.now()
const write = obj => {
  fs.writeFileSync(file, typeof obj === 'string' ? obj : JSON.stringify(obj))
  clock += 5000
  fs.utimesSync(file, new Date(clock), new Date(clock))
}

describe('plugman keys', () => {
  before(() => fs.mkdirSync(status))
  after(() => fs.rmSync(tmp, { recursive: true, force: true }))

  it('has no door without a file', () => {
    assert.equal(offered(status), false)
    assert.equal(authorize({ status, req: req('x'), scope: 'plugman.update' }), null)
    assert.equal(decide({ status, req: req('x'), scope: 'plugman.update', isAdmin: false }).why, 'service requires admin user')
  })

  it('opens for the right key and scope, and names the holder', () => {
    write({ '*': { 'star-secret': { id: 'laptop' } }, 'plugman.update': { 'nightly-secret': { id: 'nightly' } } })
    assert.equal(offered(status), true)
    assert.equal(authorize({ status, req: req('nightly-secret'), scope: 'plugman.update' }).id, 'nightly')
    assert.equal(authorize({ status, req: req('nightly-secret'), scope: 'plugman.restart' }), null)
    assert.equal(authorize({ status, req: req('star-secret'), scope: 'plugman.restart' }).id, 'laptop')
    assert.equal(authorize({ status, req: req('nope'), scope: 'plugman.update' }), null)
    assert.equal(authorize({ status, req: req(), scope: 'plugman.update' }), null)
    assert.equal(authorize({ status, req: req('nightly-secre'), scope: 'plugman.update' }), null)
  })

  it('lists the scopes a key is under, never the secret', () => {
    assert.deepEqual(scopesOf({ status, req: req('star-secret') }), ['*'])
    assert.deepEqual(scopesOf({ status, req: req('nightly-secret') }), ['plugman.update'])
    assert.deepEqual(scopesOf({ status, req: req('nope') }), [])
    assert.deepEqual(scopesOf({ status, req: req() }), [])
  })

  it('decides: admin first, then key, else says what would have worked', () => {
    assert.equal(decide({ status, req: req(), scope: 'plugman.update', isAdmin: true }).by, 'admin')
    const keyed = decide({ status, req: req('nightly-secret'), scope: 'plugman.update', isAdmin: false })
    assert.equal(keyed.by, 'key')
    assert.equal(keyed.holder.id, 'nightly')
    const refused = decide({ status, req: req('nightly-secret'), scope: 'plugman.restart', isAdmin: false })
    assert.equal(refused.ok, false)
    assert.match(refused.why, /plugman\.restart/)
    assert.match(refused.why, /api-keys\.json/)
  })

  it('reloads an edited file without a restart, and closes on a broken one', () => {
    write({ 'plugman.update': { 'later-secret': { id: 'later' } } })
    assert.equal(authorize({ status, req: req('nightly-secret'), scope: 'plugman.update' }), null)
    assert.equal(authorize({ status, req: req('later-secret'), scope: 'plugman.update' }).id, 'later')
    write('{ not json')
    assert.equal(authorize({ status, req: req('later-secret'), scope: 'plugman.update' }), null)
    assert.equal(offered(status), false)
  })
})
