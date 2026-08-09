import { NAME } from './name.js'
import { wireUpdateAll } from './update.js'
import { injectStyle, trafficClass } from './style.js'

const escape = text => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

const expand = function (string) {
  const stashed = []
  const stash = function (text) {
    const here = stashed.length
    stashed.push(text)
    return `〖${here}〗`
  }
  const unstash = (match, digits) => stashed[+digits]
  const internal = function (match, name) {
    const slug = wiki.asSlug(name)
    const styling = name === name.trim() ? 'internal' : 'internal spaced'
    if (slug.length) {
      return stash(
        `<a class="${styling}" href="/${slug}.html" data-page-name="${slug}" title="view">${escape(name)}</a>`,
      )
    } else {
      return match
    }
  }
  const external = (match, href, protocol) =>
    stash(`"<a class="external" target="_blank" href="${href}" title="${href}" rel="nofollow">${escape(href)}</a>"`)
  string = string
    .replace(/〖(\d+)〗/g, '〖 $1 〗')
    .replace(/\[\[([^\]]+)\]\]/gi, internal)
    .replace(/"((http|https|ftp):.*?)"/gi, external)
  return escape(string).replace(/〖(\d+)〗/g, unstash)
}

const asArray = obj => (typeof obj === 'string' ? [obj] : obj || [])
const shortOf = full => full.replace(/^wiki-(?:plugin|security)-/, '')

export const render = function (data, $item, markup) {
  injectStyle()
  let column = 'installed'
  const pub = name => (data.publish ? data.publish.find(obj => obj.plugin === name) : undefined)
  const format = function (markup, plugin, dependencies) {
    const name = plugin.plugin // full package name — the row key
    const short = plugin.short || shortOf(name) // display
    const months = plugin.birth ? ((Date.now() - plugin.birth) / 1000 / 3600 / 24 / 31.5).toFixed(0) : ''
    const lightClass = function () {
      const installed = plugin.package != null ? plugin.package.version : undefined
      const published = pub(name)?.npm?.version
      return trafficClass(installed, published)
    }

    const result = [`<tr class="plugman-row" data-name="${name}">`]
    for (column of markup.columns) {
      result.push(
        (() => {
          switch (column) {
            case 'status':
              return `<td title=status class="plugman-cell-status plugman-light ${lightClass()}">◉`
            case 'name': {
              // Only the noteworthy states get a badge — on a dev laptop almost
              // every row is a symlink, so a bare "dev" badge is pure noise. What
              // matters is 🔒 private and "unpublished" (a dev build with no npm
              // release — the Not-Published set).
              const badges = []
              if (markup.private && markup.private.includes(name)) {
                badges.push('<span class="plugman-badge plugman-badge-private">🔒 private</span>')
              }
              const published = pub(name)?.npm?.version
              if (plugin.symlinked && data.publish && !published) {
                badges.push('<span class="plugman-badge plugman-badge-unpublished">unpublished</span>')
              }
              return `<td title=name> ${short}${badges.join('')}`
            }
            case 'menu':
              return `<td title=menu> ${(plugin.factory != null ? plugin.factory.category : undefined) || ''}`
            case 'pages':
              return `<td title=pages class="plugman-cell-pages">${(plugin.pages != null ? plugin.pages.length : undefined) || ''}`
            case 'service':
              return `<td title=service class="plugman-cell-service">${months}`
            case 'bundled':
              return `<td title=bundled> ${dependencies[name] || ''}`
            case 'installed':
              return `<td title=installed> ${(plugin.package != null ? plugin.package.version : undefined) || ''}`
            case 'published':
              return `<td title=published> ${pub(name)?.npm?.version || ''}`
          }
        })(),
      )
    }
    // trailing cell the Update All loop writes per-row progress into
    result.push(`<td class="plugman-state" title=state>`)
    return result.join('\n')
  }

  const report = function (markup, plugins, dependencies) {
    let plugin
    const retrieve = function (name) {
      for (plugin of plugins) {
        if (plugin.plugin === name) {
          return plugin
        }
      }
      return { plugin: name }
    }
    const inventory = markup.plugins.length > 0 ? markup.plugins.map(retrieve) : plugins
    const head = (() => {
      const result1 = []
      for (column of markup.columns) {
        result1.push(`<td>${column}`)
      }
      result1.push(`<td>`)
      return result1
    })().join('\n')
    const result = (() => {
      const result2 = []
      for (let index = 0; index < inventory.length; index++) {
        plugin = inventory[index]
        result2.push(format(markup, plugin, dependencies))
      }
      return result2
    })().join('\n')
    return `<center> \
<p><img src="/favicon.png" width=16> <span style="color:gray;">${window.location.host}</span></p> \
<table class="plugman-table"><tr class="plugman-head"> ${head} </tr>${result}</table> \
<div class="plugman-buttons"> \
<button class="plugman-btn plugman-btn-primary plugman-update-all">Update All Plugins</button> \
<button class="plugman-btn plugman-btn-secondary plugman-restart">restart</button> \
</div> \
<div class="plugman-status"></div> \
</center>`
  }

  // The styled version dialog: click a traffic light to upgrade OR downgrade to
  // any published version. One <dialog> instance per open, one delegated click
  // listener closed over this row — so opening a second row can never clobber
  // the first (the old inline-onclick + global-rebind design could only keep one
  // row live at a time).
  const openInstallDialog = function (row, npm) {
    $item.find('dialog.plugman-dialog').remove()
    const short = row.short || shortOf(row.plugin)
    const installedVer = row.package != null ? row.package.version : null

    let bodyHtml
    if (npm == null) {
      bodyHtml = `<p>${short} is not published on <a href="//npmjs.com" target="_blank" rel="nofollow">npmjs.com</a>.</p>`
    } else {
      const versions = asArray(npm.versions) // npm returns publish order, oldest → newest
      const latest = npm.version
      const idx = installedVer ? versions.indexOf(installedVer) : -1
      const badge = v => (v === latest ? ' <span class="plugman-badge plugman-badge-latest">latest</span>' : '')
      const vrow = v =>
        `<div class="plugman-version-row"><span>${v}${badge(v)}</span>` +
        `<button class="plugman-btn plugman-btn-ghost" data-version="${v}">install</button></div>`
      const group = (label, list) =>
        list.length ? `<div class="plugman-group-label">${label}</div>${list.map(vrow).join('')}` : ''
      const currentRow = installedVer
        ? `<div class="plugman-version-row plugman-version-current">` +
          `<span>${installedVer} <span class="plugman-badge plugman-badge-installed">installed</span>${badge(installedVer)}</span>` +
          `<button class="plugman-btn plugman-btn-secondary" data-action="uninstall">uninstall</button></div>`
        : ''
      if (idx >= 0) {
        // Installed version is among the published set — split cleanly into
        // versions above (upgrade) and below (downgrade), newest first.
        const upgrades = versions.slice(idx + 1).reverse()
        const downgrades = versions.slice(0, idx).reverse()
        bodyHtml = group('upgrade', upgrades) + currentRow + group('downgrade', downgrades)
      } else {
        // Nothing installed, or the installed version is not published (e.g. a
        // dev build ahead of npm) — one neutral list, newest first.
        bodyHtml = currentRow + group('available', versions.slice().reverse())
      }
    }

    const $dialog = $(`<dialog class="plugman-dialog">
      <div class="plugman-dialog-head">
        <button class="plugman-dialog-close" data-action="close" title="close">×</button>
        <h3>${short}</h3>
        <p class="plugman-dialog-desc">${npm ? escape(npm.description || '') : ''}</p>
      </div>
      <div class="plugman-dialog-body">${bodyHtml}</div>
    </dialog>`)
    $item.append($dialog)
    const dialogEl = $dialog[0]
    const $row = $item.find(`table [data-name="${row.plugin}"]`)
    const published = npm ? npm.version : null

    const paintLight = installed =>
      $row
        .find('[title=status]')
        .removeClass(
          'plugman-light-green plugman-light-yellow plugman-light-red plugman-light-gray plugman-light-white',
        )
        .addClass(trafficClass(installed, published))

    const install = async function (version) {
      try {
        const update = await fetch(`/plugin/${NAME}/install`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ version, plugin: row.plugin }),
        }).then(res => res.json())
        const i = data.install.indexOf(row)
        if (i >= 0 && update.row) data.install[i] = update.row
        const now = update.installed || version
        paintLight(now)
        $row.find('[title=installed]').text(now)
        $item.find('button.plugman-restart').removeAttr('disabled').show()
        $item.find('.plugman-status').text(`${short} set to ${now} — restart to apply.`)
        dialogEl.close()
      } catch (err) {
        $item.find('.plugman-status').text('server error')
      }
    }

    const uninstall = async function () {
      if (
        !window.confirm(
          `Uninstall ${row.plugin}?\n\nIf this plugin is on the server's roster it will be ` +
            `reinstalled on the next restart. The server must be restarted for the removal to take effect.`,
        )
      ) {
        return
      }
      try {
        const res = await fetch(`/plugin/${NAME}/uninstall`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ plugin: row.plugin }),
        }).then(r => r.json().then(j => ({ ok: r.ok, j })))
        if (res.ok) {
          paintLight(null)
          $row.find('[title=installed]').text('')
          $item.find('button.plugman-restart').removeAttr('disabled').show()
          $item.find('.plugman-status').text(`${row.plugin} removed — restart to apply.`)
        } else {
          $item.find('.plugman-status').text(`uninstall failed: ${res.j.error || ''}`)
        }
        dialogEl.close()
      } catch (err) {
        $item.find('.plugman-status').text('server error')
      }
    }

    dialogEl.addEventListener('click', function (e) {
      if (e.target === dialogEl) return dialogEl.close() // click on the backdrop
      const v = e.target.closest('[data-version]')
      if (v) return install(v.getAttribute('data-version'))
      if (e.target.closest('[data-action=uninstall]')) return uninstall()
      if (e.target.closest('[data-action=close]')) return dialogEl.close()
    })
    dialogEl.addEventListener('close', () => $dialog.remove())
    dialogEl.showModal()
  }

  const detail = function (name, done) {
    const row = data.install.find(obj => obj.plugin === name)
    const text = function (obj) {
      if (!obj) {
        return ''
      }
      return expand(obj).replace(/\n/g, '<br>')
    }
    const struct = function (obj) {
      if (!obj) {
        return ''
      }
      return `<pre>${expand(JSON.stringify(obj, null, '  '))}</pre>`
    }
    const pages = obj => `<p><b><a href=#>${obj.title}</a></b><br>${expand(obj.synopsis)}</p>`
    const birth = function (obj) {
      if (obj) {
        return new Date(obj).toString()
      } else {
        return 'built-in'
      }
    }
    const npmjs = more => $.getJSON(`/plugin/${NAME}/view/${name}`, more)
    switch (column) {
      case 'status':
        // The status column owns the styled install dialog; it does not use the
        // generic popup `done` path.
        return npmjs(npm => openInstallDialog(row, npm))
      case 'name':
        return done(text(row.authors))
      case 'menu':
        return done(struct(row.factory))
      case 'pages':
        return done(row.pages.map(pages).join(''))
      case 'service':
        return done(birth(row.birth))
      case 'bundled':
        return done(struct(data.bundle.data.dependencies))
      case 'installed':
        return done(struct(row.package))
      case 'published':
        return done(struct(pub(name)?.npm || ''))
      default:
        return done('unexpected column')
    }
  }

  // Non-status columns open a detail popup window (unchanged). The status column
  // is handled inside detail() by openInstallDialog and never reaches here.
  const showdetail = function (e) {
    const $parent = $(e.target).closest('[data-name]')
    const name = $parent.data('name')
    return detail(name, function (html) {
      const pageKey = $item.parents('.page').data('key')
      const context = wiki.lineup.atKey(pageKey).getContext()
      const plugmanDialog = window.open(`/plugins/${NAME}/dialog/#`, NAME, 'popup,height=600,width=800')
      if (plugmanDialog.location.pathname !== `/plugins/${NAME}/dialog/`) {
        return plugmanDialog.addEventListener('load', event =>
          plugmanDialog.postMessage(
            { column, title: `${name} plugin ${column}`, body: html || '', pageKey, context },
            window.origin,
          ),
        )
      } else {
        return plugmanDialog.postMessage(
          { column, title: `${name} plugin ${column}`, body: html || '', pageKey, context },
          window.origin,
        )
      }
    })
  }

  $item.find('p').html(report(markup, data.install, data.bundle.data.dependencies))
  $item.find('p td').on('click', function (e) {
    column = $(e.target).closest('td').attr('title')
    return showdetail(e)
  })
  // The Update All / Restart buttons and their readiness polling live in
  // update.js; it owns both button click handlers (with a countdown).
  wireUpdateAll($item)
}
