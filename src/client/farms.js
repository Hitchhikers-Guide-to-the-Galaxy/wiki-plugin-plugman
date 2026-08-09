import { NAME } from './name.js'

const trafficColor = function (installed, published) {
  if (installed != null && published != null) return installed === published ? '#0e0' : '#fb0'
  if (published != null) return '#f55'
  return '#ccc'
}

const short = full => full.replace(/^wiki-(?:plugin|security)-/, '')

// Render a read-only status section for each FARM in the markup. Each row is
// fetched through the local server's remote/status proxy (the browser cannot
// reach the remote farm directly). Admin actions (install/update/restart) are
// available through the same proxy but are deliberately not wired to buttons
// here until a secret is configured for the farm.
export const renderFarms = async function ($item, farms) {
  for (const farm of farms) {
    const $section = $(`
      <div class="plugman-farm" style="margin-top:14px;">
        <p style="margin:4px 0;"><b>FARM</b> <span class="farm-domain" style="color:gray;">${farm.domain}</span>
          <span class="farm-note" style="font-size:85%; color:#888;"> — checking…</span></p>
        <table style="width:100%;"><tr>
          <td style='font-size:75%;color:gray;'>status<td style='font-size:75%;color:gray;'>name
          <td style='font-size:75%;color:gray;'>installed<td style='font-size:75%;color:gray;'>published
        </tr></table>
      </div>`)
    $item.append($section)
    const $table = $section.find('table')

    let base = null
    let reachable = false
    try {
      const disc = await fetch(`/plugin/${NAME}/remote/status?farm=${encodeURIComponent(farm.domain)}`).then(r => r.json())
      base = disc.remoteBase
      reachable = disc.reachable
      $section
        .find('.farm-note')
        .text(reachable ? ` — ${base}${disc.hasSecret ? ', authenticated' : ', read-only'}` : ' — unreachable')
    } catch (err) {
      $section.find('.farm-note').text(' — unreachable')
    }
    if (!reachable) continue

    for (const full of farm.plugins) {
      let st = { installed: null, published: null }
      try {
        st = await fetch(
          `/plugin/${NAME}/remote/status?farm=${encodeURIComponent(farm.domain)}&pkg=${encodeURIComponent(full)}`,
        ).then(r => r.json())
      } catch (err) {
        /* leave blank */
      }
      $table.append(`<tr class="farm-row" data-name="${full}">
        <td style="text-align:center; color:${trafficColor(st.installed, st.published)}">◉
        <td>${short(full)}<td>${st.installed || ''}<td>${st.published || ''}</tr>`)
    }
  }
}
