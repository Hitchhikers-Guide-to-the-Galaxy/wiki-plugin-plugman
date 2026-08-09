import { NAME } from './name.js'

// 16 hex chars — the fedwiki item/journal id shape. No Math.random ban here
// (this is browser code), but keep it simple.
const hexId = () => {
  let s = ''
  for (let i = 0; i < 16; i++) s += Math.floor(Math.random() * 16).toString(16)
  return s
}

const shortOf = full => full.replace(/^wiki-(?:plugin|security)-/, '')

// Build a ghost page (never stored) whose story is one PlugMan item listing the
// merged plugin names, ready to prune and fork onto the target server.
const buildGhostPage = function (names, target) {
  const header = 'STATUS NAME INSTALLED PUBLISHED'
  const intro =
    `Merged plugin list for ${target === 'localhost' ? 'this laptop' : target}. ` +
    `Prune the lines you do not want, then fork this page onto the target site to save it as its roster.`
  const story = [
    { type: 'paragraph', id: hexId(), text: intro },
    { type: 'plugman', id: hexId(), text: `${header}\n${names.join('\n')}` },
  ]
  return { title: `Plugins for ${target}`, story }
}

// The SYNC panel: pick sources (this laptop, the not-published set, each FARM in
// the item), pick a target, and merge into a forkable ghost page. Private
// plugins are dropped when the target is a public farm and kept for localhost.
export const renderSync = async function ($item, markup) {
  const farms = markup.farms.map(f => f.domain)
  const $panel = $(`
    <div class="plugman-sync">
      <p class="plugman-sync-title">Build a merged plugin list</p>
      <div class="plugman-sync-sources"></div>
      <div class="plugman-sync-target">Target:
        <select class="plugman-target"></select>
      </div>
      <div class="plugman-buttons">
        <button class="plugman-btn plugman-btn-primary plugman-build">Build merged list →</button>
      </div>
      <div class="plugman-status"></div>
    </div>`)
  $item.append($panel)
  const $sources = $panel.find('.plugman-sync-sources')
  const $target = $panel.find('.plugman-target')
  const $status = $panel.find('.plugman-status')

  // The name sets each source contributes, filled in as fetches land.
  const sets = {} // key → array of full names
  const privateSet = new Set(markup.private || [])

  const addSource = (key, label, checked) => {
    $sources.append(
      `<label class="plugman-source-row"><input type="checkbox" class="plugman-source" value="${key}"${
        checked ? ' checked' : ''
      }> ${label} <span class="plugman-source-count" data-key="${key}">…</span></label>`,
    )
  }
  const setCount = (key, n) => $sources.find(`.plugman-source-count[data-key="${key}"]`).text(n == null ? '—' : `(${n})`)

  // This Laptop + Not Published come from the admin catalog.
  addSource('laptop', 'This Laptop', true)
  addSource('notpublished', 'Not Published', false)
  for (const d of farms) addSource(`farm:${d}`, `FARM ${d}`, false)

  // Target options: localhost plus each farm (a farm target is public).
  $target.append('<option value="localhost">This Laptop (localhost)</option>')
  for (const d of farms) $target.append(`<option value="${d}">${d} (public)</option>`)
  if (markup.sync && markup.sync.target) $target.val(markup.sync.target)

  // Fetch the laptop catalog (admin). Its rows also feed the Not-Published set
  // and the private set (private.json ∪ page PRIVATE).
  try {
    const cat = await fetch(`/plugin/${NAME}/catalog`).then(r => (r.ok ? r.json() : null))
    if (cat) {
      sets.laptop = cat.plugins.map(p => p.name)
      sets.notpublished = cat.plugins.filter(p => p.unpublished).map(p => p.name)
      cat.plugins.filter(p => p.private).forEach(p => privateSet.add(p.name))
      setCount('laptop', sets.laptop.length)
      setCount('notpublished', sets.notpublished.length)
    } else {
      setCount('laptop', null)
      setCount('notpublished', null)
      $sources
        .find('.plugman-source[value="laptop"], .plugman-source[value="notpublished"]')
        .prop('disabled', true)
        .prop('checked', false)
      $status.text('Log in as the site owner to read this laptop’s plugins.')
    }
  } catch (err) {
    setCount('laptop', null)
    setCount('notpublished', null)
  }

  // Each FARM source: the remote farm's installed names (open endpoint).
  for (const d of farms) {
    try {
      const rc = await fetch(`/plugin/${NAME}/remote/catalog?farm=${encodeURIComponent(d)}`).then(r => r.json())
      sets[`farm:${d}`] = rc.reachable ? rc.plugins : []
      setCount(`farm:${d}`, rc.reachable ? rc.plugins.length : null)
    } catch (err) {
      setCount(`farm:${d}`, null)
    }
  }

  $panel.find('.plugman-build').on('click', function () {
    const chosen = $sources
      .find('.plugman-source:checked')
      .map((i, el) => el.value)
      .get()
    if (!chosen.length) {
      $status.text('Pick at least one source.')
      return
    }
    const union = new Set()
    for (const key of chosen) (sets[key] || []).forEach(n => union.add(n))

    const target = $target.val()
    const isPublic = target !== 'localhost'
    let names = [...union]
    let dropped = 0
    if (isPublic) {
      const before = names.length
      names = names.filter(n => !privateSet.has(n))
      dropped = before - names.length
    }
    names.sort()

    if (!names.length) {
      $status.text('Nothing to merge after applying the sources (and private exclusions).')
      return
    }
    // wiki.showResult needs a page OBJECT (with .getSlug()), not a plain
    // {title, story} — wrap it with wiki.newPage. It opens unsaved, marked
    // .ghost, in the lineup to the right of this page.
    const page = wiki.newPage(buildGhostPage(names, target))
    const $page = $item.parents('.page')
    $status.text(
      `Opened a list of ${names.length} plugin${names.length === 1 ? '' : 's'} for ${target}` +
        (dropped ? ` (${dropped} private excluded)` : '') +
        '. Prune it, then fork to save.',
    )
    wiki.showResult(page, { $page })
  })
}
