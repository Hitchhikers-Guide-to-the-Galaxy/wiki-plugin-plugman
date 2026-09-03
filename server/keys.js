// keys.js — the API-key door, read on PlugMan's own behalf.
//
// PlugMan's admin routes install packages and restart the farm, so they answer
// only to the wiki's admin — and the wiki knows its admin from a session
// cookie. A script, a cron job or an agent on another machine has no cookie
// and never will. So a site may opt in by holding a key file in its status
// directory, which the wiki never serves:
//
//   {status}/api-keys.json
//   {
//     "*":               { "<secret>": { "id": "laptop", "note": "David's agent" } },
//     "plugman.update":  { "<secret>": { "id": "nightly", "note": "keeps plugins current" } }
//   }
//
// The same file, in the same shape, is read by wiki-plugin-farm for its mounted
// writes. The sharing is the format and not the code: neither plugin needs the
// other installed to open its own door. No file means no door.

import * as fs from 'node:fs'
import * as path from 'node:path'

const cache = new Map() // statusDir -> { mtimeMs, keys }

/** Read the site's key file, cached by mtime so an edit needs no restart. */
export const load = statusDir => {
  if (!statusDir) return null
  const file = path.join(statusDir, 'api-keys.json')
  let stat
  try {
    stat = fs.statSync(file)
  } catch {
    cache.delete(statusDir)
    return null
  }
  const hit = cache.get(statusDir)
  if (hit && hit.mtimeMs === stat.mtimeMs) return hit.keys
  let keys = null
  try {
    keys = JSON.parse(fs.readFileSync(file, 'utf8'))
    if (!keys || typeof keys !== 'object' || Array.isArray(keys)) keys = null
  } catch (e) {
    console.log(`caution: ${file}: ${e.message}`)
    keys = null
  }
  cache.set(statusDir, { mtimeMs: stat.mtimeMs, keys })
  return keys
}

/** Constant-time-ish compare, so a wrong key cannot be found a character at a time. */
const same = (a, b) => {
  const x = String(a || '')
  const y = String(b || '')
  if (x.length !== y.length) return false
  let diff = 0
  for (let i = 0; i < x.length; i++) diff |= x.charCodeAt(i) ^ y.charCodeAt(i)
  return diff === 0
}

const findIn = (bucket, presented) => {
  if (!bucket || typeof bucket !== 'object') return null
  for (const [secret, holder] of Object.entries(bucket)) {
    if (same(secret, presented)) return holder && typeof holder === 'object' ? holder : { id: 'unnamed' }
  }
  return null
}

const presentedBy = req => req && req.headers && req.headers['x-api-key']

/**
 * Who is asking, if they hold a key good for this operation — or null.
 * `scope` is `plugman.<route>`; a key under "*" is good for every route.
 */
export const authorize = ({ status, req, scope } = {}) => {
  const presented = presentedBy(req)
  if (!presented) return null
  const keys = load(status)
  if (!keys) return null
  return (scope ? findIn(keys[scope], presented) : null) || findIn(keys['*'], presented)
}

/** Every scope the presented key is listed under — for key.json, never the secret. */
export const scopesOf = ({ status, req } = {}) => {
  const presented = presentedBy(req)
  const keys = presented ? load(status) : null
  if (!keys) return []
  return Object.keys(keys).filter(scope => findIn(keys[scope], presented))
}

/** Whether this site has opted in at all. */
export const offered = status => !!load(status)

/**
 * The one decision the admin middleware makes, as a plain function so it can
 * be tested without a server: the wiki's admin passes, a key holder for this
 * scope passes and is named, anyone else is told what would have worked.
 */
export const decide = ({ status, req, scope, isAdmin }) => {
  if (isAdmin) return { ok: true, by: 'admin' }
  const holder = authorize({ status, req, scope })
  if (holder) return { ok: true, by: 'key', holder, scope }
  const door = offered(status)
  return {
    ok: false,
    by: null,
    why: door
      ? `service requires admin user, or an X-Api-Key listed under "${scope}" or "*" in this site's status/api-keys.json`
      : 'service requires admin user',
  }
}
