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
    const plugin = file.slice(12)
    const site = { plugin }

    const birth = cb =>
      fs.stat(path(`${file}/client/${plugin}.js`), function (err, stat) {
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
    glob('wiki-plugin-*', { cwd: argv.packageDir })
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

  const view = function (plugin, done) {
    if (/^[\w-]+$/.test(plugin)) {
      const pkg = `wiki-plugin-${plugin}`
      return execFile('npm', ['view', `${pkg}`, '--json'], function (err, stdout, stderr) {
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
    glob('wiki-plugin-*', { cwd: argv.packageDir })
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

    const installed = function (cb) {
      const files = Array.from(req.body.plugins || []).map(plugin => `wiki-plugin-${plugin}`)
      return asyncLib.map(files || [], info, function (err, install) {
        payload.install = install
        return cb()
      })
    }

    const published = cb =>
      asyncLib.map(req.body.plugins || [], view, function (err, results) {
        payload.publish = results
        return cb()
      })

    return asyncLib.parallel([installed, published], err => res.json(payload))
  })

  // Fix over plugmatic v1.5.1: invalid names got no response at all, and the
  // raw stdout pipe had no error handler.
  app.get(route('view/:pkg'), function (req, res) {
    if (!/^[\w-]+$/.test(req.params.pkg)) {
      return res.status(400).json({ error: 'invalid plugin name' })
    }
    const pkg = `wiki-plugin-${req.params.pkg}`
    return execFile('npm', ['view', `${pkg}`, '--json'], function (err, stdout, stderr) {
      res.setHeader('Content-Type', 'application/json')
      return res.send(stdout || '{}')
    })
  })

  // Fix over plugmatic v1.5.1: requests failing validation now get a 400
  // instead of no response (the original left the request hanging forever).
  app.post(route('install'), admin, function (req, res) {
    if (/^[\w-]+$/.test(req.body.plugin) && /^[\w.-]+$/.test(req.body.version)) {
      const pkg = `wiki-plugin-${req.body.plugin}@${req.body.version}`
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
            return info(`wiki-plugin-${req.body.plugin}`, (err, row) =>
              res.json({ installed: req.body.version, npm, stderr, row }),
            )
          }
        },
      )
    } else {
      return res.status(400).json({ error: 'invalid plugin name or version' })
    }
  })

  // Cheap liveness probe — used by the client to know the server is back after
  // a restart, and by remote farms for discovery.
  // pid lets a client tell the freshly-restarted process apart from the old
  // one, which can keep answering during the kill-wait window of a restart.
  app.get(route('ready'), (req, res) => res.json({ name: 'plugman', seat, version: ownVersion, pid: process.pid }))

  // Per-plugin status, driving the Update All progress loop. installed comes
  // from the module's own package.json; published from npm (slow); symlinked
  // and clientOk from the filesystem.
  app.get(route('status/:pkg'), function (req, res) {
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
