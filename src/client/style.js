// One place for PlugMan's look. The plugin ships no .css file — instead it
// injects a single <style id="plugman-style"> into the document once, so the
// same client bundle carries its own styling in either seat (plugman/plugmatic)
// and across however many items are on the page. Theme-agnostic: neutral greys,
// status hues, currentColor for text, thin borders — no fonts, no dark-mode
// assumptions.

// The one true traffic-light classifier (was duplicated as traffic() in
// render.js and trafficColor() in farms.js). Returns a CSS class, not a hex.
export const trafficClass = function (installed, published) {
  if (installed != null && published != null) {
    return installed === published ? 'plugman-light-green' : 'plugman-light-yellow'
  }
  return published != null ? 'plugman-light-red' : 'plugman-light-gray'
}

const CSS = `
.plugman-table { width:100%; border-collapse:collapse; }
.plugman-head td { font-size:75%; color:gray; padding:2px 6px; border-bottom:1px solid rgba(128,128,128,.25); }
.plugman-row td { padding:3px 6px; border-bottom:1px solid rgba(128,128,128,.12); }
.plugman-row:hover { background:rgba(128,128,128,.08); }
.plugman-cell-status { text-align:center; }
.plugman-cell-pages, .plugman-cell-service { text-align:center; }
.plugman-state { font-size:85%; color:#888; }
.plugman-status, .plugman-farm-status { font-size:85%; color:#888; margin-top:6px; min-height:1.2em; }

.plugman-light { font-size:1.05em; cursor:pointer; }
.plugman-light-green  { color:#12b312; }
.plugman-light-yellow { color:#e8a400; }
.plugman-light-red    { color:#e53935; }
.plugman-light-gray   { color:#bbb; }
.plugman-light-white  { color:transparent; }

.plugman-badge { display:inline-block; font-size:70%; line-height:1.5; padding:0 6px; border-radius:9px;
  border:1px solid rgba(128,128,128,.35); color:#666; vertical-align:middle; margin-left:4px; white-space:nowrap; }
.plugman-badge-installed { border-color:#12b312; color:#12b312; }
.plugman-badge-latest    { border-color:#3b82f6; color:#3b82f6; }
.plugman-badge-private   { border-color:#8b5cf6; color:#8b5cf6; }
.plugman-badge-dev       { border-color:#e8a400; color:#e8a400; }
.plugman-badge-unpublished { border-color:#999; color:#999; }

.plugman-btn { font:inherit; font-size:90%; padding:5px 12px; margin:6px 6px 0 0; border-radius:6px;
  border:1px solid rgba(128,128,128,.4); background:transparent; color:inherit; cursor:pointer; }
.plugman-btn:hover { background:rgba(128,128,128,.1); }
.plugman-btn-primary { border-color:#3b82f6; background:#3b82f6; color:#fff; font-weight:600; }
.plugman-btn-primary:hover { background:#2f6fd8; }
.plugman-btn-secondary { border-color:rgba(128,128,128,.5); }
.plugman-btn-ghost { padding:2px 10px; font-size:85%; margin:0; }
.plugman-btn.is-busy { opacity:.7; cursor:progress; }
.plugman-btn.is-disabled, .plugman-btn:disabled { opacity:.45; cursor:default; background:transparent; }
.plugman-btn.is-done { border-color:#12b312; color:#12b312; }

.plugman-buttons { text-align:center; margin-top:10px; }

.plugman-dialog { border:none; border-radius:12px; padding:0; max-width:440px; width:90%;
  box-shadow:0 10px 40px rgba(0,0,0,.25); color:inherit; background:Canvas; }
.plugman-dialog::backdrop { background:rgba(0,0,0,.35); }
.plugman-dialog-head { padding:16px 18px 10px; border-bottom:1px solid rgba(128,128,128,.2); position:relative; }
.plugman-dialog-head h3 { margin:0 0 4px; font-size:1.1em; }
.plugman-dialog-desc { font-size:85%; color:#888; margin:0; }
.plugman-dialog-close { position:absolute; top:10px; right:12px; border:none; background:transparent;
  font-size:1.3em; line-height:1; color:#999; cursor:pointer; }
.plugman-dialog-close:hover { color:inherit; }
.plugman-dialog-body { padding:10px 18px 18px; max-height:60vh; overflow:auto; }
.plugman-group-label { font-size:72%; letter-spacing:.06em; text-transform:uppercase; color:#999;
  margin:12px 0 4px; }
.plugman-version-row { display:flex; align-items:center; justify-content:space-between;
  padding:4px 0; border-bottom:1px solid rgba(128,128,128,.12); }
.plugman-version-row.plugman-version-current { font-weight:600; }
.plugman-version-tag { color:#12b312; font-size:85%; }

.plugman-farm { margin-top:14px; }
.plugman-farm-head { margin:4px 0; }
.plugman-farm-domain { color:gray; }
.plugman-farm-note { font-size:85%; color:#888; }
`

export function injectStyle() {
  if (typeof document === 'undefined' || document.getElementById('plugman-style')) return
  const el = document.createElement('style')
  el.id = 'plugman-style'
  el.textContent = CSS
  document.head.appendChild(el)
}
