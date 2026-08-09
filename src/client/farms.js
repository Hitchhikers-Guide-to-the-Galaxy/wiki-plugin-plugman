import { NAME } from './name.js'
import { trafficClass } from './style.js'

const short = full => full.replace(/^wiki-(?:plugin|security)-/, '')
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

const setFarmState = ($section, full, text) =>
  $section.find(`tr.plugman-farm-row[data-name="${full}"] .plugman-fstate`).text(text)

// Fetch one plugin's remote status through the local proxy.
const remoteStatus = async function (domain, full) {
  try {
    return await fetch(
      `/plugin/${NAME}/remote/status?farm=${encodeURIComponent(domain)}&pkg=${encodeURIComponent(full)}`,
    ).then(r => r.json())
  } catch (err) {
    return { installed: null, published: null }
  }
}

// Install (or update) every listed plugin on the remote farm that is missing or
// out of date, then restart the remote and wait for it to come back. Runs
// through the local server's admin-guarded proxy; each remote write needs a
// secret for the farm in ~/.wiki-plugman/secrets.json (a row shows 424 if none).
const installAll = async function (domain, farm, $section) {
  const $btn = $section.find('button.plugman-farm-install')
  const $status = $section.find('.plugman-farm-status')
  $btn.attr('disabled', 'disabled')
  let installed = 0,
    upToDate = 0,
    failed = 0

  for (const full of farm.plugins) {
    setFarmState($section, full, 'checking…')
    const st = await remoteStatus(domain, full)
    if (st.installed && st.published && st.installed === st.published) {
      setFarmState($section, full, 'up to date')
      upToDate++
      continue
    }
    if (!st.published && !st.installed) {
      setFarmState($section, full, 'not on npm')
      upToDate++
      continue
    }
    setFarmState($section, full, st.installed ? `updating → ${st.published}` : `installing ${st.published}`)
    try {
      const result = await fetch(`/plugin/${NAME}/remote/install`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ farm: domain, plugin: full }),
      }).then(r => r.json().then(j => ({ ok: r.ok, status: r.status, j })))
      if (result.ok) {
        setFarmState($section, full, 'installed ✓')
        installed++
      } else if (result.status === 424) {
        setFarmState($section, full, 'no secret — see text below')
        failed++
      } else {
        setFarmState($section, full, `failed: ${result.j.error || result.status}`)
        failed++
      }
    } catch (err) {
      setFarmState($section, full, 'failed: request')
      failed++
    }
  }

  $status.text(`Installed ${installed}, up to date ${upToDate}, failed ${failed}.`)
  if (installed > 0) {
    $status.append(' Restarting remote…')
    try {
      await fetch(`/plugin/${NAME}/remote/restart`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ farm: domain }),
      })
    } catch (err) {
      /* remote may drop the connection as it restarts */
    }
    const started = Date.now()
    while (Date.now() - started < 120000) {
      await sleep(4000)
      $status.text(
        `Installed ${installed}. Waiting for remote… ${Math.round((Date.now() - started) / 1000)}s / 120s`,
      )
      try {
        const r = await fetch(`/plugin/${NAME}/remote/ready?farm=${encodeURIComponent(domain)}`)
        if (r.ok) {
          $status.text(`Done — installed ${installed}, remote back up.`)
          break
        }
      } catch (err) {
        /* still down */
      }
    }
  }
  $btn.removeAttr('disabled')
}

// Render a status section for each FARM in the markup and wire its Install All
// button. Reads go through the local proxy; the browser cannot reach the remote
// farm directly.
export const renderFarms = async function ($item, farms) {
  for (const farm of farms) {
    const domain = farm.domain
    const $section = $(`
      <div class="plugman-farm">
        <p class="plugman-farm-head"><b>FARM</b> <span class="plugman-farm-domain">${domain}</span>
          <span class="plugman-farm-note"> — checking…</span></p>
        <table class="plugman-table"><tr class="plugman-head">
          <td>status<td>name<td>installed<td>published<td>
        </tr></table>
        <div class="plugman-buttons">
          <button class="plugman-btn plugman-btn-primary plugman-farm-install">Install / Update All on this farm</button>
        </div>
        <div class="plugman-farm-status"></div>
      </div>`)
    $item.append($section)
    const $table = $section.find('table')

    let reachable = false
    try {
      const disc = await fetch(`/plugin/${NAME}/remote/status?farm=${encodeURIComponent(domain)}`).then(r => r.json())
      reachable = disc.reachable
      $section
        .find('.plugman-farm-note')
        .text(reachable ? ` — ${disc.remoteBase}${disc.hasSecret ? ', authenticated' : ', no secret yet'}` : ' — unreachable')
    } catch (err) {
      $section.find('.plugman-farm-note').text(' — unreachable')
    }
    if (!reachable) {
      $section.find('button.plugman-farm-install').attr('disabled', 'disabled')
      continue
    }

    for (const full of farm.plugins) {
      const st = await remoteStatus(domain, full)
      $table.append(`<tr class="plugman-farm-row" data-name="${full}">
        <td class="plugman-cell-status plugman-light ${trafficClass(st.installed, st.published)}">◉
        <td>${short(full)}<td>${st.installed || ''}<td>${st.published || ''}
        <td class="plugman-fstate"></tr>`)
    }

    $section.find('button.plugman-farm-install').on('click', () => installAll(domain, farm, $section))
  }
}
