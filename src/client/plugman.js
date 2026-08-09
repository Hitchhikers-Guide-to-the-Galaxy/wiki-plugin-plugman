/*
 * decaffeinate suggestions:

 * DS102: Remove unnecessary code created because of implicit returns
 * DS201: Simplify complex destructure assignments
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */

import { NAME } from './name.js'
import { render } from './render.js'
import { browse } from './browse.js'
import { renderFarms } from './farms.js'
import { injectStyle } from './style.js'

const parse = function (text) {
  const result = { columns: [], plugins: [], features: [], farms: [], private: [], sync: null }
  const lines = (text || '').split(/\n+/)
  // Section headers scope the plugin lines that follow them:
  //   FARM <domain>  → a remote farm (result.farms)
  //   PRIVATE        → local, but marked private/localhost-only (result.private)
  //   LOCAL / PUBLIC → back to the ordinary local scope
  // Plugin lines before any header belong to the local server (result.plugins).
  let currentFarm = null
  let privateScope = false
  for (var line of lines) {
    var m
    if ((m = line.match(/^FARM\s+([a-z0-9.-]+)\s*$/i))) {
      currentFarm = { domain: m[1], plugins: [] }
      result.farms.push(currentFarm)
      privateScope = false
      continue
    }
    if (line.match(/^PRIVATE\s*$/i)) {
      currentFarm = null
      privateScope = true
      continue
    }
    if (line.match(/^(LOCAL|PUBLIC)\s*$/i)) {
      currentFarm = null
      privateScope = false
      continue
    }
    if ((m = line.match(/^SYNC(?:\s+([a-z0-9.-]+))?\s*$/i))) {
      result.features.push('sync')
      result.sync = { target: m[1] || null }
      continue
    }
    if (line.match(/\bSTATUS\b/)) {
      result.columns.push('status')
    }
    if (line.match(/\bNAME\b/)) {
      result.columns.push('name')
    }
    if (line.match(/\bMENU\b/)) {
      result.columns.push('menu')
    }
    if (line.match(/\bPAGES\b/)) {
      result.columns.push('pages')
    }
    if (line.match(/\bSERVICE\b/)) {
      result.columns.push('service')
    }
    if (line.match(/\bBUNDLED\b/)) {
      result.columns.push('bundled')
    }
    if (line.match(/\bINSTALLED\b/)) {
      result.columns.push('installed')
    }
    if (line.match(/\bPUBLISHED\b/)) {
      result.columns.push('published')
    }

    if (line.match(/\bBROWSE\b/)) {
      result.features.push('browse')
    }

    // Widened over plugmatic: keep hyphenated names (diagram-editor) and
    // wiki-security-* packages, which the original silently dropped. Carry the
    // full package name; the renderer strips the prefix for display.
    if ((m = line.match(/^(wiki-(?:plugin|security)-[\w-]+)$/))) {
      if (currentFarm) currentFarm.plugins.push(m[1])
      else {
        result.plugins.push(m[1])
        if (privateScope) result.private.push(m[1])
      }
    }
  }
  if (result.columns.length === 0) {
    result.columns =
      result.plugins.length === 0
        ? ['name', 'pages', 'menu', 'bundled', 'installed']
        : ['status', 'name', 'pages', 'bundled', 'installed', 'published']
  }
  return result
}

const emit = async function ($item, item) {
  injectStyle()
  const markup = parse(item.text)
  $item.append(`\
<p style="background-color:#eee;padding:15px;">
  loading plugin details
</p>\
`)

  const renderproxy = data => {
    if (markup.features.includes('browse')) browse(data, $item)
    else render(data, $item, markup)
  }

  // A FARM-only item (no local plugin lines, no BROWSE) has no local table to
  // draw — clear the placeholder and render just the remote sections. Otherwise
  // draw the local table: POST when specific plugins are listed (so the server
  // also fetches published versions), GET for the full catalogue.
  const farmOnly = markup.farms.length > 0 && markup.plugins.length === 0 && !markup.features.includes('browse')
  try {
    if (farmOnly) {
      $item.find('p').remove()
    } else if (markup.plugins.length) {
      const options = {
        method: 'POST',
        body: JSON.stringify(markup),
        headers: { 'Content-Type': 'application/json' },
      }
      renderproxy(await fetch(`/plugin/${NAME}/plugins`, options).then(res => res.json()))
    } else {
      renderproxy(await fetch(`/plugin/${NAME}/plugins`).then(res => res.json()))
    }
  } catch (err) {
    $item.find('p').html('server error')
  }

  // Remote farm sections, if any FARM lines were present.
  if (markup.farms && markup.farms.length) {
    try {
      await renderFarms($item, markup.farms)
    } catch (err) {
      $item.append('<p style="color:#888;">could not load remote farms</p>')
    }
  }
}

const bind = ($item, item) => $item.on('dblclick', () => wiki.textEditor($item, item))

const plugmanListener = function (event) {
  if (!event.source.opener || event.source.location.pathname !== `/plugins/${NAME}/dialog/`) {
    return
  }
  console.log(`${NAME} listener`, event)

  const { data } = event

  const { action } = data

  switch (action) {
    case 'doInternalLink':
      var val = data.keepLineup,
        keepLineup = val != null ? val : false,
        val1 = data.pageKey,
        pageKey = val1 != null ? val1 : null,
        val2 = data.title,
        title = val2 != null ? val2 : null,
        val3 = data.context,
        context = val3 != null ? val3 : null
      var $page = null
      if (pageKey !== null) {
        $page = keepLineup ? null : $('.page').filter((i, el) => $(el).data('key') === pageKey)
      }
      wiki.pageHandler.context = context
      wiki.doInternalLink(title, $page)
      break
    default:
      return console.error({ where: `${NAME}Listener`, message: 'unknown action', data })
  }
}

if (typeof window !== 'undefined' && window !== null) {
  const key = `${NAME}Listener`
  if (typeof window[key] === 'undefined' || window[key] === null) {
    console.log(`*** ${NAME} - Adding Message Listener`)
    window[key] = plugmanListener
    window.addEventListener('message', plugmanListener)
  }
}

if (typeof window !== 'undefined') {
  window.plugins[NAME] = { emit, bind }
}

export const plugman = typeof window == 'undefined' ? { parse } : undefined
