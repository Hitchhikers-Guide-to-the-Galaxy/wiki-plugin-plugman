import * as esbuild from 'esbuild'
import fs from 'node:fs/promises'
import packJSON from '../package.json' with { type: 'json' }

const version = packJSON.version
const now = new Date()

// Two bundles from one source: plugman for its own seat, plugmatic so the
// package can occupy the plugmatic seat via the fedwiki plugin-upgrade path
// (see http://plugin.fedwiki.club/view/plugin-upgrade). PLUGIN_NAME is baked
// in via define; src/client/name.js falls back to 'plugman' under node.
const metafiles = {}
for (const name of ['plugman', 'plugmatic']) {
  const results = await esbuild.build({
    entryPoints: ['src/client/plugman.js'],
    bundle: true,
    banner: {
      js: `/* wiki-plugin-plugman (as ${name}) - ${version} - ${now.toUTCString()} */`,
    },
    define: { PLUGIN_NAME: JSON.stringify(name) },
    minify: true,
    sourcemap: true,
    logLevel: 'info',
    metafile: true,
    outfile: `client/${name}.js`,
  })
  metafiles[name] = results.metafile
}

await fs.writeFile('meta-client.json', JSON.stringify(metafiles))
console.log("\n  esbuild metadata written to 'meta-client.json'.")
