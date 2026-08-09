import { NAME } from './name.js'

// Write a short status string into a row's state cell.
const setState = function ($item, name, text) {
  $item.find(`table [data-name="${name}"] .state`).text(text)
}

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

const readyInfo = async function () {
  try {
    return await fetch(`/plugin/${NAME}/ready`, { cache: 'no-store' }).then(r => (r.ok ? r.json() : null))
  } catch (err) {
    return null
  }
}

// Restart the server, then poll /ready until a NEW process answers or the
// budget runs out, updating a countdown line as it waits. Watching the pid
// change matters: the old process can keep answering during the restart's
// kill-wait window, so a plain 200 is not proof the restart took. The farm
// starts lazily, so we add a short grace once the new pid appears.
// budgetMs default 60s (local).
const restartAndWait = async function ($status, budgetMs = 60000) {
  const before = await readyInfo()
  const oldPid = before?.pid
  $status.text('Restarting server…')
  try {
    await fetch(`/plugin/${NAME}/restart`, { method: 'POST' })
  } catch (err) {
    // The connection dropping mid-restart is expected — the server is going down.
  }
  const started = Date.now()
  // Give the old process a moment to begin exiting before we start polling.
  await sleep(2000)
  while (Date.now() - started < budgetMs) {
    const elapsed = Math.round((Date.now() - started) / 1000)
    $status.text(`Waiting for server… ${elapsed}s / ${Math.round(budgetMs / 1000)}s`)
    const info = await readyInfo()
    // A new pid (or no known old pid) means the fresh process is serving.
    if (info && (oldPid == null || info.pid !== oldPid)) {
      await sleep(3000) // lazy-start grace before we trust it
      $status.text('Server back up.')
      return true
    }
    await sleep(2000)
  }
  $status.text('Server did not come back within the time budget — check the farm.')
  return false
}

// Wire the "Update All Plugins" button: walk the listed plugins one at a time,
// check each status, update the stale ones, then restart once at the end and
// wait for the server to return before reporting the summary.
export const wireUpdateAll = function ($item) {
  const $btn = $item.find('button.update-all')
  const $restart = $item.find('button.restart')
  const $status = $item.find('.plugman-status')

  $restart.on('click', () => {
    $restart.attr('disabled', 'disabled')
    restartAndWait($status)
  })

  $btn.on('click', async () => {
    $btn.attr('disabled', 'disabled')
    $restart.attr('disabled', 'disabled')
    const names = $item
      .find('.row')
      .map((i, el) => $(el).data('name'))
      .get()
    let updated = 0,
      unchanged = 0,
      failed = 0

    for (const name of names) {
      setState($item, name, 'checking…')
      let st
      try {
        st = await fetch(`/plugin/${NAME}/status/${name}`, { cache: 'no-store' }).then(r => r.json())
      } catch (err) {
        setState($item, name, 'failed: status')
        failed++
        continue
      }
      if (st.symlinked) {
        setState($item, name, 'dev — skipped')
        unchanged++
        continue
      }
      if (!st.published) {
        setState($item, name, 'not on npm')
        unchanged++
        continue
      }
      if (st.installed === st.published) {
        setState($item, name, 'up to date')
        unchanged++
        continue
      }
      setState($item, name, `updating → ${st.published}`)
      try {
        const result = await fetch(`/plugin/${NAME}/update`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ plugin: name }),
        }).then(r => r.json().then(j => ({ ok: r.ok, j })))
        if (result.ok) {
          setState($item, name, `updated ✓ ${result.j.installed || ''}`)
          updated++
        } else {
          setState($item, name, `failed: ${result.j.error || 'update'}`)
          failed++
        }
      } catch (err) {
        setState($item, name, 'failed: update')
        failed++
      }
    }

    $status.text(`Updated ${updated}, unchanged ${unchanged}, failed ${failed}.`)
    if (updated > 0) {
      $restart.hide()
      const ok = await restartAndWait($status)
      // After the restart the whole page component reloads on next view; refresh
      // the AFTER status for each row so the table reflects the new versions.
      if (ok) {
        for (const name of names) {
          try {
            const st = await fetch(`/plugin/${NAME}/status/${name}`, { cache: 'no-store' }).then(r => r.json())
            if (st.installed) setState($item, name, `now ${st.installed}`)
          } catch (err) {
            // leave the row as-is
          }
        }
        $status.append(' Done.')
      }
    }
    $btn.removeAttr('disabled')
    $restart.removeAttr('disabled')
  })
}
