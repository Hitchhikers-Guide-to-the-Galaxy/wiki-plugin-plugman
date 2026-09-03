// The server module must at least load: a syntax error here takes PlugMan's
// routes off every site of the farm, silently, and the client tests would
// never notice. This is the check that catches it before publish.
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

describe('plugman server', () => {
  it('imports and exports startServer', async () => {
    const mod = await import('../server/server.js')
    assert.equal(typeof mod.startServer, 'function')
  })
})
