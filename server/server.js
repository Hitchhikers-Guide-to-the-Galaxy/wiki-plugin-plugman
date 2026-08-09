/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
// plugman plugin, server-side component
// These handlers are launched with the wiki server.
// PlugMan began life as an explicit clone of wiki-plugin-plugmatic v1.5.1.

import * as fs from 'node:fs'
import * as nodePath from 'node:path'
import { fileURLToPath } from 'node:url'
import { glob } from 'glob'
import * as asyncLib from 'async'
import jsonfile from 'jsonfile'
import https from 'node:https'
import { execFile, spawn } from 'node:child_process'

const PACKAGE_RE = /^wiki-(?:plugin|security)-[\w-]+$/

// Accept either a short name (pod) or a full package (wiki-plugin-pod,
// wiki-security-hitchhiker) and return the full package name, or null if the
// input is not a valid plugin/security package reference.
const fullName = function (name) {
  if (typeof name !== 'string') return null
  const full = /^wiki-(?:plugin|security)-/.test(name) ? name : `wiki-plugin-${name}`
  return PACKAGE_RE.test(full) ? full : null
}

// The short name a package registers its client under (its seat name), or null
// for wiki-security-* modules, which ship no browser client.
const shortName = function (full) {
  const m = full.match(/^wiki-plugin-([\w-]+)$/)
  return m ? m[1] : null
}

// wiki-server serves a plugin purely by its directory name in node_modules —
// the directory is a seat, and this package may occupy either its own seat
// (plugman) or the plugmatic seat via the fedwiki plugin-upgrade path.
// Derive the seat we are actually serving from at load time.
const seatOf = function () {
  const dir = nodePath.resolve(nodePath.dirname(fileURLToPath(import.meta.url)), '..')
  const m = nodePath.basename(dir).match(/^wiki-(?:plugin|security)-([\w-]+)$/)
  return m ? m[1] : 'plugman'
}

const github = function (path, done) {
  const options = {
    host: 'raw.githubusercontent.com',
    port: 443,
    method: 'GET',
    path,
  }
  try {
    const req = https.get(options, function (res) {
      res.setEncoding('utf8')
      let data = ''
      res.on('error', () => done(null))
      res.on('timeout', () => done(null))
      res.on('data', d => (data += d))
      return res.on('end', () => done(data))
    })
    return req.on('error', () => done(null))
  } catch (e) {
    return done(null)
  }
}

// http://www.sebastianseilund.com/nodejs-async-in-practice

const startServer = function (params) {
  const { app } = params
  const { argv } = params
  let bundle = null

  github(
    '/fedwiki/wiki/master/package.json',
    data =>
      (bundle = {
        date: Date.now(),
        data: JSON.parse(data || '{"dependencies":{}}'),
      }),
  )

  const ownVersion = (() => {
    try {
      const dir = nodePath.resolve(nodePath.dirname(fileURLToPath(import.meta.url)), '..')
      return JSON.parse(fs.readFileSync(`${dir}/package.json`, 'utf8')).version
    } catch (e) {
      return null
    }
  })()

  const seat = seatOf()
  // The package dir this server runs from — refuse to uninstall ourselves.
  const ownPackage = nodePath.basename(nodePath.resolve(nodePath.dirname(fileURLToPath(import.meta.url)), '..'))
  // Answer on the sibling prefix too, but only when that plugin is not itself
  // installed — never shadow a real plugmatic (or a real plugman).
  const sibling = { plugman: 'plugmatic', plugmatic: 'plugman' }[seat]
  const bases = [seat]
  if (sibling && !fs.existsSync(`${argv.packageDir}/wiki-plugin-${sibling}`)) {
    bases.push(sibling)
  }

  const route = endpoint => bases.map(base => `/plugin/${base}/${endpoint}`)
  const path = file => `${argv.packageDir}/${file}`

  const info = function (file, done) {
    // `file` is the full package dir name. Carry the full name as the identity
    // (the only unambiguous key across wiki-plugin-* and wiki-security-*), and
    // a short name for display and the client-file check.
    const plugin = file
    const short = file.replace(/^wiki-(?:plugin|security)-/, '')
    const site = { plugin, short }

    const birth = cb =>
      fs.stat(path(`${file}/client/${short}.js`), function (err, stat) {
        site.birth = stat?.birthtime?.getTime()
        return cb()
      })
    const pages = function (cb) {
      var synopsis = (slug, cb2) =>
        jsonfile.readFile(path(`${file}/pages/${slug}`), { throws: false }, function (err, page) {
          const title = page.title || slug
          synopsis = page.story?.[0]?.text || page.story?.[1]?.text || 'empty'
          return cb2(null, { file, slug, title, synopsis })
        })
      return fs.readdir(path(`${file}/pages`), (err, slugs) =>
        asyncLib.map(slugs || [], synopsis, function (err, pages) {
          site.pages = pages
          return cb()
        }),
      )
    }
    const packagejson = cb =>
      jsonfile.readFile(path(`${file}/package.json`), { throws: false }, function (err, packagejson) {
        site.package = packagejson
        return cb()
      })
    const factory = cb =>
      jsonfile.readFile(path(`${file}/factory.json`), { throws: false }, function (err, factory) {
        site.factory = factory
        return cb()
      })
    const authors = cb =>
      fs.readFile(path(`${file}/AUTHORS.txt`), 'utf-8', function (err, authors) {
        site.authors = authors
        return cb()
      })
    return asyncLib.series([birth, authors, packagejson, factory, pages], err => done(null, site))
  }

  const plugmap = done =>
    glob('wiki-{plugin,security}-*', { cwd: argv.packageDir })
      .then(files => {
        return asyncLib.map(files || [], info, function (err, install) {
          if (err) {
            return done(err, null)
          }
          return done(null, install)
        })
      })
      .catch(err => {
        return done(err, null)
      })

  // Accept a full package name or a short name; key the result by whatever was
  // passed in (the client keys `publish` lookups by the same value).
  const view = function (plugin, done) {
    if (/^[\w-]+$/.test(plugin)) {
      const pkg = /^wiki-(?:plugin|security)-/.test(plugin) ? plugin : `wiki-plugin-${plugin}`
      // Bounded so a hung/slow npm cannot pin a subprocess indefinitely.
      return execFile('npm', ['view', `${pkg}`, '--json'], { timeout: 30000 }, function (err, stdout, stderr) {
        let npm
        try {
          npm = JSON.parse(stdout)
        } catch (error) {
          // ignore parse errors
        }
        return done(null, { plugin, pkg, npm })
      })
    } else {
      return done(null, { plugin, error: 'invalid plugin name' })
    }
  }

  // Fix over plugmatic v1.5.1: the original reassigned its own function
  // binding to a string on the failure path, destroying the middleware for
  // every later request in the process.
  const admin = function (req, res, next) {
    if (app.securityhandler.isAdmin(req)) {
      return next()
    } else {
      const adminNote = argv.admin ? undefined : 'none specified'
      const user =
        !req.session?.passport?.user && !req.session?.email && !req.session?.friend ? 'not logged in' : undefined
      return res.status(403).send({ error: 'service requires admin user', admin: adminNote, user })
    }
  }

  app.get(route('page/:slug.json'), (req, res) =>
    plugmap(function (err, install) {
      for (var i of Array.from(install)) {
        for (var p of Array.from(i.pages)) {
          if (p.slug === req.params.slug) {
            return jsonfile.readFile(path(`${p.file}/pages/${p.slug}`), { throws: false }, (err, page) =>
              res.json(page),
            )
          }
        }
      }
      return res.sendStatus(404)
    }),
  )

  // Fix over plugmatic v1.5.1: both params interpolated into a filesystem
  // path unsanitised — a path-traversal hole.
  app.get(route('file/:file/slug/:slug'), (req, res) => {
    const file = nodePath.basename(req.params.file)
    const slug = nodePath.basename(req.params.slug)
    if (!PACKAGE_RE.test(file) || !/^[\w-]+$/.test(slug)) {
      return res.sendStatus(400)
    }
    return jsonfile.readFile(path(`${file}/pages/${slug}`), { throws: false }, function (err, page) {
      if (err || page == null) {
        return res.sendStatus(404)
      } else {
        return res.json(page)
      }
    })
  })

  app.get(route('sitemap.json'), (req, res) =>
    plugmap(
      (
        err,
        install, // http://stackoverflow.com/a/4631593
      ) => res.json([].concat(...Array.from(Array.from(install).map(i => i.pages) || []))),
    ),
  )

  app.get(route('plugins'), (req, res) =>
    glob('wiki-{plugin,security}-*', { cwd: argv.packageDir })
      .then(files => {
        return asyncLib.map(files || [], info, function (err, install) {
          if (err) {
            return res.e(err)
          }
          return res.json({ install, bundle })
        })
      })
      .catch(err => {
        return res.e(err)
      }),
  )

  app.post(route('plugins'), function (req, res) {
    const payload = { bundle }

    // Validate every name to a canonical package name BEFORE it reaches the
    // filesystem in info(). Without this a name like "wiki-plugin-x/../.." is
    // interpolated into a path and escapes the plugin directory — an
    // unauthenticated file-read/traversal. Cap the list so one request cannot
    // fan out into an unbounded number of npm subprocesses.
    const names = Array.from(req.body.plugins || [])
      .slice(0, 100)
      .map(fullName)
      .filter(Boolean)

    const installed = function (cb) {
      return asyncLib.map(names, info, function (err, install) {
        payload.install = install
        return cb()
      })
    }

    const published = cb =>
      asyncLib.map(names, view, function (err, results) {
        payload.publish = results
        return cb()
      })

    return asyncLib.parallel([installed, published], err => res.json(payload))
  })

  // Fix over plugmatic v1.5.1: invalid names got no response at all, and the
  // raw stdout pipe had no error handler. Admin-gated and timeout-bounded so
  // this npm-spawning route cannot be used as an unauthenticated DoS amplifier
  // — only admins need version lists (to install).
  app.get(route('view/:pkg'), admin, function (req, res) {
    if (!/^[\w-]+$/.test(req.params.pkg)) {
      return res.status(400).json({ error: 'invalid plugin name' })
    }
    const pkg = /^wiki-(?:plugin|security)-/.test(req.params.pkg) ? req.params.pkg : `wiki-plugin-${req.params.pkg}`
    return execFile('npm', ['view', `${pkg}`, '--json'], { timeout: 30000 }, function (err, stdout, stderr) {
      res.setHeader('Content-Type', 'application/json')
      return res.send(stdout || '{}')
    })
  })

  // Fix over plugmatic v1.5.1: requests failing validation now get a 400
  // instead of no response (the original left the request hanging forever).
  app.post(route('install'), admin, function (req, res) {
    const full = fullName(req.body.plugin)
    if (full && /^[\w.-]+$/.test(req.body.version)) {
      const pkg = `${full}@${req.body.version}`
      console.log(`${seat} installing ${pkg}`)
      return execFile(
        'npm',
        ['install', `${pkg}`, '--json'],
        { cwd: argv.packageDir + '/..' },
        function (err, stdout, stderr) {
          let npm
          try {
            npm = JSON.parse(stdout)
          } catch (error) {
            // ignore parse errors
          }
          if (err) {
            return res.status(400).json({ error: 'server unable to install plugin', npm, stderr })
          } else {
            return info(full, (err, row) => res.json({ installed: req.body.version, npm, stderr, row }))
          }
        },
      )
    } else {
      return res.status(400).json({ error: 'invalid plugin name or version' })
    }
  })

  // Uninstall a plugin via npm. Guards keep us from breaking the farm or the
  // dev workflow; the post-condition check catches the dependency-without-module
  // state that crashes wiki-server >= 0.40 and restores the module if it happens.
  app.post(route('uninstall'), admin, function (req, res) {
    const full = fullName(req.body.plugin)
    if (!full) return res.status(400).json({ error: 'invalid plugin name' })
    const dir = `${argv.packageDir}/${full}`
    // 409 guards
    if (full === ownPackage) return res.status(409).json({ error: 'refusing to uninstall the running plugin', name: full })
    // argv.security_type may be a bare type ("hitchhiker") or a full package
    // name ("wiki-security-hitchhiker") depending on how the farm was configured.
    const activeSecurity = /^wiki-security-/.test(argv.security_type || '')
      ? argv.security_type
      : argv.security_type
        ? `wiki-security-${argv.security_type}`
        : null
    if (activeSecurity && full === activeSecurity) {
      return res.status(409).json({ error: 'refusing to uninstall the active security module', name: full })
    }
    try {
      if (fs.lstatSync(dir).isSymbolicLink()) {
        return res.status(409).json({ error: 'plugin is a dev symlink; uninstall skipped', name: full })
      }
    } catch (e) {
      return res.status(404).json({ error: 'plugin is not installed', name: full })
    }
    const pkgRoot = argv.packageDir + '/..'
    console.log(`${seat} uninstalling ${full}`)
    return execFile('npm', ['remove', full, '--json'], { cwd: pkgRoot, timeout: 120000 }, function (err, stdout, stderr) {
      // Post-condition: the dependency AND the module directory must both be
      // gone. If the dep lingers while the module is gone (the farm-crash
      // state), reinstall to restore consistency and report 500.
      let depGone = true
      try {
        const pj = JSON.parse(fs.readFileSync(`${pkgRoot}/package.json`, 'utf8'))
        depGone = !(pj.dependencies && pj.dependencies[full])
      } catch (e) {
        /* can't read — treat as unknown */
      }
      const moduleGone = !fs.existsSync(dir)
      if (!depGone && moduleGone) {
        return execFile('npm', ['install', full, '--json'], { cwd: pkgRoot, timeout: 120000 }, () =>
          res.status(500).json({ error: 'uninstall left an inconsistent state; module restored', name: full, stderr }),
        )
      }
      if (err && !moduleGone) {
        return res.status(400).json({ error: 'server unable to uninstall plugin', name: full, stderr })
      }
      return res.json({ name: full, removed: true, packageJsonClean: depGone })
    })
  })

  // Cheap liveness probe — used by the client to know the server is back after
  // a restart, and by remote farms for discovery.
  // pid lets a client tell the freshly-restarted process apart from the old
  // one, which can keep answering during the kill-wait window of a restart.
  app.get(route('ready'), (req, res) => res.json({ name: 'plugman', seat, version: ownVersion, pid: process.pid }))

  // Per-plugin status, driving the Update All progress loop. installed comes
  // from the module's own package.json; published from npm (slow); symlinked
  // and clientOk from the filesystem. Admin-gated: it spawns npm (a DoS
  // amplifier if left open) and only the admin-driven update loop consumes it.
  app.get(route('status/:pkg'), admin, function (req, res) {
    const full = fullName(req.params.pkg)
    if (!full) {
      return res.status(400).json({ error: 'invalid plugin name' })
    }
    const dir = `${argv.packageDir}/${full}`
    const short = shortName(full)
    const payload = { name: full, installed: null, published: null, symlinked: false }
    try {
      payload.symlinked = fs.lstatSync(dir).isSymbolicLink()
    } catch (e) {
      /* not installed */
    }
    try {
      payload.installed = JSON.parse(fs.readFileSync(`${dir}/package.json`, 'utf8')).version
    } catch (e) {
      /* not installed */
    }
    // clientOk: only meaningful for wiki-plugin-* (security modules ship no client)
    payload.clientOk = short == null ? 'n/a' : fs.existsSync(`${dir}/client/${short}.js`)
    return execFile('npm', ['view', full, 'version', '--json'], { timeout: 30000 }, function (err, stdout) {
      try {
        const parsed = JSON.parse(stdout)
        // `npm view` on an unpublished package returns an {error:{code:E404}}
        // object rather than a version string — treat that as "not published".
        payload.published = parsed && typeof parsed === 'object' && parsed.error ? null : parsed
      } catch (e) {
        payload.published = null
      }
      return res.json(payload)
    })
  })

  // Update (or install) one plugin to a version, latest by default. Unlike
  // plugmatic's install this validates and ALWAYS responds, refuses to clobber
  // a dev symlink, and bounds npm with a timeout.
  app.post(route('update'), admin, function (req, res) {
    const full = fullName(req.body.plugin)
    const version = req.body.version || 'latest'
    if (!full || !/^[\w.-]+$/.test(version)) {
      return res.status(400).json({ error: 'invalid plugin name or version' })
    }
    const dir = `${argv.packageDir}/${full}`
    try {
      if (fs.lstatSync(dir).isSymbolicLink()) {
        return res.status(409).json({ error: 'plugin is a dev symlink; update skipped', name: full })
      }
    } catch (e) {
      /* not yet installed — install is fine */
    }
    const pkg = `${full}@${version}`
    console.log(`${seat} updating ${pkg}`)
    return execFile(
      'npm',
      ['install', pkg, '--json'],
      { cwd: argv.packageDir + '/..', timeout: 180000 },
      function (err, stdout, stderr) {
        let npm
        try {
          npm = JSON.parse(stdout)
        } catch (error) {
          /* ignore parse errors */
        }
        if (err) {
          const code = err.killed || err.signal === 'SIGTERM' ? 504 : 400
          return res.status(code).json({ error: 'server unable to update plugin', name: full, npm, stderr })
        }
        return info(full, (err, row) => res.json({ name: full, installed: version, npm, stderr, row }))
      },
    )
  })

  // ── Remote farms (FARM <domain>) ──────────────────────────────────────────
  // PlugMan's own server proxies to a remote farm's plugmatic/plugman endpoints:
  // a browser cannot reach them cross-origin (CORS) nor carry the remote admin
  // cookie. Secrets (per-domain owner secret, optional SSH restart fallback)
  // live in a mode-600 file, never in a route response.
  const DOMAIN_RE = /^[a-z0-9.-]+$/i
  // A farm target is bad if it is malformed, or an IP literal in the loopback
  // or link-local range. This blocks the worst SSRF targets (localhost and the
  // 169.254.169.254 cloud-metadata endpoint) while still allowing LAN farms
  // (pi5.local, 10./172./192.168 ranges) that this feature legitimately drives.
  const badFarm = farm =>
    !farm || !DOMAIN_RE.test(farm) || /^(localhost|127\.|169\.254\.|0\.0\.0\.0|::1)/i.test(farm)
  const loadSecrets = function () {
    const file = argv.plugman_secrets || process.env.PLUGMAN_SECRETS || `${process.env.HOME}/.wiki-plugman/secrets.json`
    try {
      return JSON.parse(fs.readFileSync(file, 'utf8'))
    } catch (e) {
      return {}
    }
  }
  const remoteCache = {} // domain → { base, cookie }

  const remoteFetch = (url, opts, ms = 15000) =>
    fetch(url, { ...opts, signal: AbortSignal.timeout(ms) })

  // Discover whether a farm speaks plugman or plugmatic, cached per domain.
  const discover = async function (farm) {
    if (remoteCache[farm]?.base) return remoteCache[farm].base
    try {
      const r = await remoteFetch(`https://${farm}/plugin/plugman/ready`, {}, 12000)
      if (r.ok) return (remoteCache[farm] = { ...remoteCache[farm], base: 'plugman' }).base
    } catch (e) {
      /* try plugmatic */
    }
    const r2 = await remoteFetch(`https://${farm}/plugin/plugmatic/plugins`, {}, 12000)
    if (r2.ok) return (remoteCache[farm] = { ...remoteCache[farm], base: 'plugmatic' }).base
    throw new Error('no plugman or plugmatic endpoint on farm')
  }

  // Log in to the remote as the site owner (friends/hitchhiker reclaim: the raw
  // secret as a text/plain body), returning the session cookie to replay.
  const remoteLogin = async function (farm) {
    if (remoteCache[farm]?.cookie) return remoteCache[farm].cookie
    const secret = loadSecrets()[farm]?.secret
    if (!secret) return null
    const r = await remoteFetch(`https://${farm}/auth/reclaim/`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: secret,
    })
    if (!r.ok) return null
    const set = r.headers.getSetCookie ? r.headers.getSetCookie() : [r.headers.get('set-cookie')].filter(Boolean)
    const cookie = set.map(c => c.split(';')[0]).join('; ')
    remoteCache[farm] = { ...remoteCache[farm], cookie }
    return cookie
  }

  // Installed + published version of one plugin on a remote farm (read-only,
  // no auth needed). Shape is normalised across the two remote bases.
  const remotePkgStatus = async function (farm, base, pkg) {
    const short = shortName(pkg) || pkg.replace(/^wiki-(?:plugin|security)-/, '')
    if (base === 'plugman') {
      const r = await remoteFetch(`https://${farm}/plugin/plugman/status/${pkg}`)
      return r.ok ? await r.json() : { name: pkg, installed: null, published: null }
    }
    // plugmatic: POST plugins with the short name; read install[0].package + publish[0].npm
    const r = await remoteFetch(`https://${farm}/plugin/plugmatic/plugins`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plugins: [short] }),
    })
    if (!r.ok) return { name: pkg, installed: null, published: null }
    const data = await r.json()
    return {
      name: pkg,
      installed: data.install?.[0]?.package?.version || null,
      published: data.publish?.[0]?.npm?.version || null,
    }
  }

  // Read-only: proxies information the remote already serves publicly, so it
  // is open (bounded by badFarm + timeout). The write actions below stay admin.
  app.get(route('remote/status'), async function (req, res) {
    const farm = req.query.farm
    if (badFarm(farm)) return res.status(400).json({ error: 'invalid or blocked farm' })
    try {
      const base = await discover(farm)
      const hasSecret = !!loadSecrets()[farm]?.secret
      const payload = { farm, remoteBase: base, reachable: true, hasSecret }
      if (req.query.pkg) {
        const full = fullName(req.query.pkg)
        if (!full) return res.status(400).json({ error: 'invalid plugin name' })
        Object.assign(payload, await remotePkgStatus(farm, base, full))
      }
      return res.json(payload)
    } catch (e) {
      return res.status(502).json({ farm, reachable: false, error: String(e.message || e) })
    }
  })

  app.post(route('remote/install'), admin, async function (req, res) {
    const { farm } = req.body
    const full = fullName(req.body.plugin)
    const version = req.body.version || 'latest'
    if (badFarm(farm) || !full) return res.status(400).json({ error: 'invalid/blocked farm or plugin' })
    try {
      const base = await discover(farm)
      const cookie = await remoteLogin(farm)
      if (!cookie) return res.status(424).json({ error: `no secret for ${farm}` })
      // plugmatic's install takes {plugin: <short>, version}; plugman's update
      // takes {plugin: <full>, version}. Send the shape each understands.
      const short = shortName(full) || full.replace(/^wiki-(?:plugin|security)-/, '')
      const endpoint = base === 'plugman' ? 'update' : 'install'
      const body = base === 'plugman' ? { plugin: full, version } : { plugin: short, version }
      const r = await remoteFetch(
        `https://${farm}/plugin/${base}/${endpoint}`,
        { method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: cookie }, body: JSON.stringify(body) },
        180000,
      )
      const text = await r.text()
      return res.status(r.ok ? 200 : 502).json({ farm, remoteBase: base, remoteStatus: r.status, remoteBody: text })
    } catch (e) {
      return res.status(502).json({ farm, error: String(e.message || e) })
    }
  })

  app.post(route('remote/uninstall'), admin, async function (req, res) {
    const { farm } = req.body
    const full = fullName(req.body.plugin)
    if (badFarm(farm) || !full) return res.status(400).json({ error: 'invalid/blocked farm or plugin' })
    try {
      const base = await discover(farm)
      if (base !== 'plugman') return res.status(501).json({ error: 'remote farm runs plugmatic, which cannot uninstall' })
      const cookie = await remoteLogin(farm)
      if (!cookie) return res.status(424).json({ error: `no secret for ${farm}` })
      const r = await remoteFetch(
        `https://${farm}/plugin/plugman/uninstall`,
        { method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: cookie }, body: JSON.stringify({ plugin: full }) },
        180000,
      )
      const text = await r.text()
      return res.status(r.ok ? 200 : 502).json({ farm, remoteStatus: r.status, remoteBody: text })
    } catch (e) {
      return res.status(502).json({ farm, error: String(e.message || e) })
    }
  })

  app.post(route('remote/restart'), admin, async function (req, res) {
    const { farm } = req.body
    if (badFarm(farm)) return res.status(400).json({ error: 'invalid or blocked farm' })
    try {
      const base = await discover(farm)
      const cookie = await remoteLogin(farm)
      // Endpoint first: the remote's own restart (works on Docker via auto-restart).
      if (cookie) {
        try {
          const r = await remoteFetch(`https://${farm}/plugin/${base}/restart`, { method: 'POST', headers: { Cookie: cookie } })
          if (r.ok) return res.json({ farm, via: 'endpoint', remoteBase: base })
        } catch (e) {
          /* fall through to SSH */
        }
      }
      // SSH fallback: a per-farm restart command in the secrets file.
      const ssh = loadSecrets()[farm]?.restart_ssh
      if (ssh) {
        const child = spawn('sh', ['-c', ssh], { detached: true, stdio: 'ignore' })
        child.unref()
        return res.json({ farm, via: 'ssh' })
      }
      return res.status(424).json({ farm, error: 'restart failed via endpoint and no restart_ssh configured' })
    } catch (e) {
      return res.status(502).json({ farm, error: String(e.message || e) })
    }
  })

  app.get(route('remote/ready'), async function (req, res) {
    const farm = req.query.farm
    if (badFarm(farm)) return res.status(400).json({ error: 'invalid or blocked farm' })
    try {
      const r = await remoteFetch(`https://${farm}/system/factories.json`, {}, 8000)
      return res.status(r.ok ? 200 : 503).json({ farm, ready: r.ok })
    } catch (e) {
      return res.status(504).json({ farm, ready: false, error: String(e.message || e) })
    }
  })

  // Restart. plugmatic's process.exit(0) relies on a supervisor to bring the
  // process back — true on Docker (cafe) and systemd (pi5) but NOT on a bare
  // laptop farm, where it would just kill the farm. So prefer a configured
  // restart command (argv.plugman_restart / PLUGMAN_RESTART) that relaunches
  // the farm itself, and fall back to exit(0) where a supervisor exists.
  return app.post(route('restart'), admin, function (req, res) {
    const cmd = argv.plugman_restart || process.env.PLUGMAN_RESTART
    if (cmd) {
      console.log(`${seat} restart via configured command: ${cmd}`)
      res.sendStatus(200)
      // Detached so it outlives the process it is about to restart.
      const child = spawn('sh', ['-c', cmd], { detached: true, stdio: 'ignore' })
      child.unref()
      return
    }
    console.log(`${seat} exit to restart (relying on supervisor)`)
    res.sendStatus(200)
    return process.exit(0)
  })
}

export { startServer }
