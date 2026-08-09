/* wiki-plugin-plugman (as plugmatic) - 0.6.0 - Sun, 09 Aug 2026 20:48:28 GMT */
(()=>{var m="plugmatic";var S=function(t,n,s){t.find(`table [data-name="${n}"] .plugman-state`).text(s)},D=t=>new Promise(n=>setTimeout(n,t)),R=async function(){try{return await fetch(`/plugin/${m}/ready`,{cache:"no-store"}).then(t=>t.ok?t.json():null)}catch{return null}},B=async function(t,n=6e4){let i=(await R())?.pid;t.text("Restarting server\u2026");try{await fetch(`/plugin/${m}/restart`,{method:"POST"})}catch{}let d=Date.now();for(await D(2e3);Date.now()-d<n;){let r=Math.round((Date.now()-d)/1e3);t.text(`Waiting for server\u2026 ${r}s / ${Math.round(n/1e3)}s`);let u=await R();if(u&&(i==null||u.pid!==i))return await D(3e3),t.text("Server back up."),!0;await D(2e3)}return t.text("Server did not come back within the time budget \u2014 check the farm."),!1},J=function(t){let n=t.find("button.plugman-update-all"),s=t.find("button.plugman-restart"),i=t.find(".plugman-status");s.on("click",()=>{s.attr("disabled","disabled"),B(i)}),n.on("click",async()=>{n.attr("disabled","disabled").addClass("is-busy"),s.attr("disabled","disabled");let d=t.find(".plugman-row").map((c,l)=>$(l).data("name")).get(),r=0,u=0,p=0;for(let c of d){S(t,c,"checking\u2026");let l;try{l=await fetch(`/plugin/${m}/status/${c}`,{cache:"no-store"}).then(a=>a.json())}catch{S(t,c,"failed: status"),p++;continue}if(l.symlinked){S(t,c,"dev \u2014 skipped"),u++;continue}if(!l.published){S(t,c,"not on npm"),u++;continue}if(l.installed===l.published){S(t,c,"up to date"),u++;continue}S(t,c,`updating \u2192 ${l.published}`);try{let a=await fetch(`/plugin/${m}/update`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({plugin:c})}).then(e=>e.json().then(o=>({ok:e.ok,j:o})));a.ok?(S(t,c,`updated \u2713 ${a.j.installed||""}`),r++):(S(t,c,`failed: ${a.j.error||"update"}`),p++)}catch{S(t,c,"failed: update"),p++}}if(i.text(`Updated ${r}, unchanged ${u}, failed ${p}.`),r>0&&(s.hide(),await B(i))){for(let l of d)try{let a=await fetch(`/plugin/${m}/status/${l}`,{cache:"no-store"}).then(e=>e.json());a.installed&&S(t,l,`now ${a.installed}`)}catch{}i.append(" Done.")}n.removeAttr("disabled").removeClass("is-busy"),s.removeAttr("disabled")})};var T=function(t,n){return t!=null&&n!=null?t===n?"plugman-light-green":"plugman-light-yellow":n!=null?"plugman-light-red":"plugman-light-gray"},X=`
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

.plugman-sync { border:1px solid rgba(128,128,128,.25); border-radius:10px; padding:12px 14px; }
.plugman-sync-title { margin:0 0 8px; font-weight:600; }
.plugman-sync-sources { margin-bottom:10px; }
.plugman-source-row { display:block; padding:2px 0; }
.plugman-source-count { color:#888; font-size:85%; }
.plugman-sync-target { margin-bottom:4px; }
.plugman-sync-target select { font:inherit; margin-left:4px; padding:2px 4px; }
`;function P(){if(typeof document>"u"||document.getElementById("plugman-style"))return;let t=document.createElement("style");t.id="plugman-style",t.textContent=X,document.head.appendChild(t)}var I=t=>t.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"),U=function(t){let n=[],s=function(u){let p=n.length;return n.push(u),`\u3016${p}\u3017`},i=(u,p)=>n[+p],d=function(u,p){let c=wiki.asSlug(p),l=p===p.trim()?"internal":"internal spaced";return c.length?s(`<a class="${l}" href="/${c}.html" data-page-name="${c}" title="view">${I(p)}</a>`):u},r=(u,p,c)=>s(`"<a class="external" target="_blank" href="${p}" title="${p}" rel="nofollow">${I(p)}</a>"`);return t=t.replace(/〖(\d+)〗/g,"\u3016 $1 \u3017").replace(/\[\[([^\]]+)\]\]/gi,d).replace(/"((http|https|ftp):.*?)"/gi,r),I(t).replace(/〖(\d+)〗/g,i)},Z=t=>typeof t=="string"?[t]:t||[],F=t=>t.replace(/^wiki-(?:plugin|security)-/,""),H=function(t,n,s){P();let i="installed",d=a=>t.publish?t.publish.find(e=>e.plugin===a):void 0,r=function(a,e,o){let g=e.plugin,y=e.short||F(g),h=e.birth?((Date.now()-e.birth)/1e3/3600/24/31.5).toFixed(0):"",b=function(){let f=e.package!=null?e.package.version:void 0,v=d(g)?.npm?.version;return T(f,v)},x=[`<tr class="plugman-row" data-name="${g}">`];for(i of a.columns)x.push((()=>{switch(i){case"status":return`<td title=status class="plugman-cell-status plugman-light ${b()}">\u25C9`;case"name":{let f=[];a.private&&a.private.includes(g)&&f.push('<span class="plugman-badge plugman-badge-private">\u{1F512} private</span>');let v=d(g)?.npm?.version;return e.symlinked&&t.publish&&!v&&f.push('<span class="plugman-badge plugman-badge-unpublished">unpublished</span>'),`<td title=name> ${y}${f.join("")}`}case"menu":return`<td title=menu> ${(e.factory!=null?e.factory.category:void 0)||""}`;case"pages":return`<td title=pages class="plugman-cell-pages">${(e.pages!=null?e.pages.length:void 0)||""}`;case"service":return`<td title=service class="plugman-cell-service">${h}`;case"bundled":return`<td title=bundled> ${o[g]||""}`;case"installed":return`<td title=installed> ${(e.package!=null?e.package.version:void 0)||""}`;case"published":return`<td title=published> ${d(g)?.npm?.version||""}`}})());return x.push('<td class="plugman-state" title=state>'),x.join(`
`)},u=function(a,e,o){let g,y=function(f){for(g of e)if(g.plugin===f)return g;return{plugin:f}},h=a.plugins.length>0?a.plugins.map(y):e,b=(()=>{let f=[];for(i of a.columns)f.push(`<td>${i}`);return f.push("<td>"),f})().join(`
`),x=(()=>{let f=[];for(let v=0;v<h.length;v++)g=h[v],f.push(r(a,g,o));return f})().join(`
`);return`<center> <p><img src="/favicon.png" width=16> <span style="color:gray;">${window.location.host}</span></p> <table class="plugman-table"><tr class="plugman-head"> ${b} </tr>${x}</table> <div class="plugman-buttons"> <button class="plugman-btn plugman-btn-primary plugman-update-all">Update All Plugins</button> <button class="plugman-btn plugman-btn-secondary plugman-restart">restart</button> </div> <div class="plugman-status"></div> </center>`},p=function(a,e){n.find("dialog.plugman-dialog").remove();let o=a.short||F(a.plugin),g=a.package!=null?a.package.version:null,y;if(e==null)y=`<p>${o} is not published on <a href="//npmjs.com" target="_blank" rel="nofollow">npmjs.com</a>.</p>`;else{let w=Z(e.versions),k=e.version,j=g?w.indexOf(g):-1,L=A=>A===k?' <span class="plugman-badge plugman-badge-latest">latest</span>':"",M=A=>`<div class="plugman-version-row"><span>${A}${L(A)}</span><button class="plugman-btn plugman-btn-ghost" data-version="${A}">install</button></div>`,O=(A,N)=>N.length?`<div class="plugman-group-label">${A}</div>${N.map(M).join("")}`:"",z=g?`<div class="plugman-version-row plugman-version-current"><span>${g} <span class="plugman-badge plugman-badge-installed">installed</span>${L(g)}</span><button class="plugman-btn plugman-btn-secondary" data-action="uninstall">uninstall</button></div>`:"";if(j>=0){let A=w.slice(j+1).reverse(),N=w.slice(0,j).reverse();y=O("upgrade",A)+z+O("downgrade",N)}else y=z+O("available",w.slice().reverse())}let h=$(`<dialog class="plugman-dialog">
      <div class="plugman-dialog-head">
        <button class="plugman-dialog-close" data-action="close" title="close">\xD7</button>
        <h3>${o}</h3>
        <p class="plugman-dialog-desc">${e?I(e.description||""):""}</p>
      </div>
      <div class="plugman-dialog-body">${y}</div>
    </dialog>`);n.append(h);let b=h[0],x=n.find(`table [data-name="${a.plugin}"]`),f=e?e.version:null,v=w=>x.find("[title=status]").removeClass("plugman-light-green plugman-light-yellow plugman-light-red plugman-light-gray plugman-light-white").addClass(T(w,f)),C=async function(w){try{let k=await fetch(`/plugin/${m}/install`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({version:w,plugin:a.plugin})}).then(M=>M.json()),j=t.install.indexOf(a);j>=0&&k.row&&(t.install[j]=k.row);let L=k.installed||w;v(L),x.find("[title=installed]").text(L),n.find("button.plugman-restart").removeAttr("disabled").show(),n.find(".plugman-status").text(`${o} set to ${L} \u2014 restart to apply.`),b.close()}catch{n.find(".plugman-status").text("server error")}},Q=async function(){if(window.confirm(`Uninstall ${a.plugin}?

If this plugin is on the server's roster it will be reinstalled on the next restart. The server must be restarted for the removal to take effect.`))try{let w=await fetch(`/plugin/${m}/uninstall`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({plugin:a.plugin})}).then(k=>k.json().then(j=>({ok:k.ok,j})));w.ok?(v(null),x.find("[title=installed]").text(""),n.find("button.plugman-restart").removeAttr("disabled").show(),n.find(".plugman-status").text(`${a.plugin} removed \u2014 restart to apply.`)):n.find(".plugman-status").text(`uninstall failed: ${w.j.error||""}`),b.close()}catch{n.find(".plugman-status").text("server error")}};b.addEventListener("click",function(w){if(w.target===b)return b.close();let k=w.target.closest("[data-version]");if(k)return C(k.getAttribute("data-version"));if(w.target.closest("[data-action=uninstall]"))return Q();if(w.target.closest("[data-action=close]"))return b.close()}),b.addEventListener("close",()=>h.remove()),b.showModal()},c=function(a,e){let o=t.install.find(f=>f.plugin===a),g=function(f){return f?U(f).replace(/\n/g,"<br>"):""},y=function(f){return f?`<pre>${U(JSON.stringify(f,null,"  "))}</pre>`:""},h=f=>`<p><b><a href=#>${f.title}</a></b><br>${U(f.synopsis)}</p>`,b=function(f){return f?new Date(f).toString():"built-in"},x=f=>$.getJSON(`/plugin/${m}/view/${a}`,f);switch(i){case"status":return x(f=>p(o,f));case"name":return e(g(o.authors));case"menu":return e(y(o.factory));case"pages":return e(o.pages.map(h).join(""));case"service":return e(b(o.birth));case"bundled":return e(y(t.bundle.data.dependencies));case"installed":return e(y(o.package));case"published":return e(y(d(a)?.npm||""));default:return e("unexpected column")}},l=function(a){let o=$(a.target).closest("[data-name]").data("name");return c(o,function(g){let y=n.parents(".page").data("key"),h=wiki.lineup.atKey(y).getContext(),b=window.open(`/plugins/${m}/dialog/#`,m,"popup,height=600,width=800");return b.location.pathname!==`/plugins/${m}/dialog/`?b.addEventListener("load",x=>b.postMessage({column:i,title:`${o} plugin ${i}`,body:g||"",pageKey:y,context:h},window.origin)):b.postMessage({column:i,title:`${o} plugin ${i}`,body:g||"",pageKey:y,context:h},window.origin)})};n.find("p").html(u(s,t.install,t.bundle.data.dependencies)),n.find("p td").on("click",function(a){return i=$(a.target).closest("td").attr("title"),l(a)}),J(n)};function G(t,n){let s=t.install,i=n.get(0).querySelector("p"),d=["format","data","other","system","option"],r=["activity","changes","factory","flagmatic","journalmatic","future","image","paragraph","present","recycler","reference","register"];i.innerHTML=d.map(l=>`
    <h3>${l}</h3>
    ${s.filter(a=>{let e=a.factory?.category;return r.includes(u(a))?l=="system":l==(e||"option")}).toSorted((a,e)=>u(a).localeCompare(u(e))).map(p).join(`
`)}`);function u(l){return l.short||(l.plugin||"").replace(/^wiki-(?:plugin|security)-/,"")}function p(l){return`
      <details>
        <summary><a href=# style="text-decoration: none;">
          ${u(l)}</a> \u2014 ${l.factory?.title??'<i style="color:#888">missing</i>'}
        </summary>
        ${c(l)}
      </details>
    `}function c(l){function a(g){return g.replaceAll(/&/g,"&amp;").replaceAll(/</g,"&lt;").replaceAll(/>/g,"&gt;").replaceAll(/\[\[(.*?)\]\]/g,"$1").replaceAll(/\[.*? (.*?)\]/g,"$1")}let e=(l.pages||[]).map(g=>`
      <p><a href=# style="text-decoration: none;" data-slug=${g.slug}>
          ${g.title}</a> \u2014 ${a(g.synopsis??"")}
      </p>
    `).join(`
`),o={author:l?.package.author,contributors:l?.package.contributors,version:l?.package.version,repository:l?.package.repository};return`
      <hr>
      ${e}
      <details><summary>more ...</summary>
        <pre>${JSON.stringify(o,null,2)}</pre>
      </details>
      <hr>`}for(let l of i.querySelectorAll("a"))l.addEventListener("click",a=>{a.preventDefault();let e=a.target,o=e.innerText.trim(),g=e.dataset?.slug?e.dataset.slug:`about-${o}-plugin`,y=a.shiftKey?null:$(e.closest(".page"));wiki.doInternalLink(g,y)})}var tt=t=>t.replace(/^wiki-(?:plugin|security)-/,""),nt=t=>new Promise(n=>setTimeout(n,t)),E=(t,n,s)=>t.find(`tr.plugman-farm-row[data-name="${n}"] .plugman-fstate`).text(s),W=async function(t,n){try{return await fetch(`/plugin/${m}/remote/status?farm=${encodeURIComponent(t)}&pkg=${encodeURIComponent(n)}`).then(s=>s.json())}catch{return{installed:null,published:null}}},et=async function(t,n,s){let i=s.find("button.plugman-farm-install"),d=s.find(".plugman-farm-status");i.attr("disabled","disabled");let r=0,u=0,p=0;for(let c of n.plugins){E(s,c,"checking\u2026");let l=await W(t,c);if(l.installed&&l.published&&l.installed===l.published){E(s,c,"up to date"),u++;continue}if(!l.published&&!l.installed){E(s,c,"not on npm"),u++;continue}E(s,c,l.installed?`updating \u2192 ${l.published}`:`installing ${l.published}`);try{let a=await fetch(`/plugin/${m}/remote/install`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({farm:t,plugin:c})}).then(e=>e.json().then(o=>({ok:e.ok,status:e.status,j:o})));a.ok?(E(s,c,"installed \u2713"),r++):a.status===424?(E(s,c,"no secret \u2014 see text below"),p++):(E(s,c,`failed: ${a.j.error||a.status}`),p++)}catch{E(s,c,"failed: request"),p++}}if(d.text(`Installed ${r}, up to date ${u}, failed ${p}.`),r>0){d.append(" Restarting remote\u2026");try{await fetch(`/plugin/${m}/remote/restart`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({farm:t})})}catch{}let c=Date.now();for(;Date.now()-c<12e4;){await nt(4e3),d.text(`Installed ${r}. Waiting for remote\u2026 ${Math.round((Date.now()-c)/1e3)}s / 120s`);try{if((await fetch(`/plugin/${m}/remote/ready?farm=${encodeURIComponent(t)}`)).ok){d.text(`Done \u2014 installed ${r}, remote back up.`);break}}catch{}}}i.removeAttr("disabled")},_=async function(t,n){for(let s of n){let i=s.domain,d=$(`
      <div class="plugman-farm">
        <p class="plugman-farm-head"><b>FARM</b> <span class="plugman-farm-domain">${i}</span>
          <span class="plugman-farm-note"> \u2014 checking\u2026</span></p>
        <table class="plugman-table"><tr class="plugman-head">
          <td>status<td>name<td>installed<td>published<td>
        </tr></table>
        <div class="plugman-buttons">
          <button class="plugman-btn plugman-btn-primary plugman-farm-install">Install / Update All on this farm</button>
        </div>
        <div class="plugman-farm-status"></div>
      </div>`);t.append(d);let r=d.find("table"),u=!1;try{let p=await fetch(`/plugin/${m}/remote/status?farm=${encodeURIComponent(i)}`).then(c=>c.json());u=p.reachable,d.find(".plugman-farm-note").text(u?` \u2014 ${p.remoteBase}${p.hasSecret?", authenticated":", no secret yet"}`:" \u2014 unreachable")}catch{d.find(".plugman-farm-note").text(" \u2014 unreachable")}if(!u){d.find("button.plugman-farm-install").attr("disabled","disabled");continue}for(let p of s.plugins){let c=await W(i,p);r.append(`<tr class="plugman-farm-row" data-name="${p}">
        <td class="plugman-cell-status plugman-light ${T(c.installed,c.published)}">\u25C9
        <td>${tt(p)}<td>${c.installed||""}<td>${c.published||""}
        <td class="plugman-fstate"></tr>`)}d.find("button.plugman-farm-install").on("click",()=>et(i,s,d))}};var q=()=>{let t="";for(let n=0;n<16;n++)t+=Math.floor(Math.random()*16).toString(16);return t};var at=function(t,n){let s="STATUS NAME INSTALLED PUBLISHED",i=`Merged plugin list for ${n==="localhost"?"this laptop":n}. Prune the lines you do not want, then fork this page onto the target site to save it as its roster.`,d=[{type:"paragraph",id:q(),text:i},{type:"plugman",id:q(),text:`${s}
${t.join(`
`)}`}];return{title:`Plugins for ${n}`,story:d}},K=async function(t,n){let s=n.farms.map(e=>e.domain),i=$(`
    <div class="plugman-sync">
      <p class="plugman-sync-title">Build a merged plugin list</p>
      <div class="plugman-sync-sources"></div>
      <div class="plugman-sync-target">Target:
        <select class="plugman-target"></select>
      </div>
      <div class="plugman-buttons">
        <button class="plugman-btn plugman-btn-primary plugman-build">Build merged list \u2192</button>
      </div>
      <div class="plugman-status"></div>
    </div>`);t.append(i);let d=i.find(".plugman-sync-sources"),r=i.find(".plugman-target"),u=i.find(".plugman-status"),p={},c=new Set(n.private||[]),l=(e,o,g)=>{d.append(`<label class="plugman-source-row"><input type="checkbox" class="plugman-source" value="${e}"${g?" checked":""}> ${o} <span class="plugman-source-count" data-key="${e}">\u2026</span></label>`)},a=(e,o)=>d.find(`.plugman-source-count[data-key="${e}"]`).text(o==null?"\u2014":`(${o})`);l("laptop","This Laptop",!0),l("notpublished","Not Published",!1);for(let e of s)l(`farm:${e}`,`FARM ${e}`,!1);r.append('<option value="localhost">This Laptop (localhost)</option>');for(let e of s)r.append(`<option value="${e}">${e} (public)</option>`);n.sync&&n.sync.target&&r.val(n.sync.target);try{let e=await fetch(`/plugin/${m}/catalog`).then(o=>o.ok?o.json():null);e?(p.laptop=e.plugins.map(o=>o.name),p.notpublished=e.plugins.filter(o=>o.unpublished).map(o=>o.name),e.plugins.filter(o=>o.private).forEach(o=>c.add(o.name)),a("laptop",p.laptop.length),a("notpublished",p.notpublished.length)):(a("laptop",null),a("notpublished",null),d.find('.plugman-source[value="laptop"], .plugman-source[value="notpublished"]').prop("disabled",!0).prop("checked",!1),u.text("Log in as the site owner to read this laptop\u2019s plugins."))}catch{a("laptop",null),a("notpublished",null)}for(let e of s)try{let o=await fetch(`/plugin/${m}/remote/catalog?farm=${encodeURIComponent(e)}`).then(g=>g.json());p[`farm:${e}`]=o.reachable?o.plugins:[],a(`farm:${e}`,o.reachable?o.plugins.length:null)}catch{a(`farm:${e}`,null)}i.find(".plugman-build").on("click",function(){let e=d.find(".plugman-source:checked").map((v,C)=>C.value).get();if(!e.length){u.text("Pick at least one source.");return}let o=new Set;for(let v of e)(p[v]||[]).forEach(C=>o.add(C));let g=r.val(),y=g!=="localhost",h=[...o],b=0;if(y){let v=h.length;h=h.filter(C=>!c.has(C)),b=v-h.length}if(h.sort(),!h.length){u.text("Nothing to merge after applying the sources (and private exclusions).");return}let x=wiki.newPage(at(h,g)),f=t.parents(".page");u.text(`Opened a list of ${h.length} plugin${h.length===1?"":"s"} for ${g}`+(b?` (${b} private excluded)`:"")+". Prune it, then fork to save."),wiki.showResult(x,{$page:f})})};var Y=function(t){let n={columns:[],plugins:[],features:[],farms:[],private:[],sync:null},s=(t||"").split(/\n+/),i=null,d=!1;for(var r of s){var u;if(u=r.match(/^FARM\s+([a-z0-9.-]+)\s*$/i)){i={domain:u[1],plugins:[]},n.farms.push(i),d=!1;continue}if(r.match(/^PRIVATE\s*$/i)){i=null,d=!0;continue}if(r.match(/^(LOCAL|PUBLIC)\s*$/i)){i=null,d=!1;continue}if(u=r.match(/^SYNC(?:\s+([a-z0-9.-]+))?\s*$/i)){n.features.push("sync"),n.sync={target:u[1]||null};continue}r.match(/\bSTATUS\b/)&&n.columns.push("status"),r.match(/\bNAME\b/)&&n.columns.push("name"),r.match(/\bMENU\b/)&&n.columns.push("menu"),r.match(/\bPAGES\b/)&&n.columns.push("pages"),r.match(/\bSERVICE\b/)&&n.columns.push("service"),r.match(/\bBUNDLED\b/)&&n.columns.push("bundled"),r.match(/\bINSTALLED\b/)&&n.columns.push("installed"),r.match(/\bPUBLISHED\b/)&&n.columns.push("published"),r.match(/\bBROWSE\b/)&&n.features.push("browse"),(u=r.match(/^(wiki-(?:plugin|security)-[\w-]+)$/))&&(i?i.plugins.push(u[1]):(n.plugins.push(u[1]),d&&n.private.push(u[1])))}return n.columns.length===0&&(n.columns=n.plugins.length===0?["name","pages","menu","bundled","installed"]:["status","name","pages","bundled","installed","published"]),n},st=async function(t,n){P();let s=Y(n.text);t.append(`<p style="background-color:#eee;padding:15px;">
  loading plugin details
</p>`);let i=r=>{s.features.includes("browse")?G(r,t):H(r,t,s)};if(s.features.includes("sync")){t.find("p").remove();try{await K(t,s)}catch{t.append('<p style="color:#888;">could not load the sync panel</p>')}return}let d=s.farms.length>0&&s.plugins.length===0&&!s.features.includes("browse");try{if(d)t.find("p").remove();else if(s.plugins.length){let r={method:"POST",body:JSON.stringify(s),headers:{"Content-Type":"application/json"}};i(await fetch(`/plugin/${m}/plugins`,r).then(u=>u.json()))}else i(await fetch(`/plugin/${m}/plugins`).then(r=>r.json()))}catch{t.find("p").html("server error")}if(s.farms&&s.farms.length)try{await _(t,s.farms)}catch{t.append('<p style="color:#888;">could not load remote farms</p>')}},lt=(t,n)=>t.on("dblclick",()=>wiki.textEditor(t,n)),V=function(t){if(!t.source.opener||t.source.location.pathname!==`/plugins/${m}/dialog/`)return;console.log(`${m} listener`,t);let{data:n}=t,{action:s}=n;if(s==="doInternalLink"){var i=n.keepLineup,d=i??!1,r=n.pageKey,u=r??null,p=n.title,c=p??null,l=n.context,a=l??null,e=null;u!==null&&(e=d?null:$(".page").filter((o,g)=>$(g).data("key")===u)),wiki.pageHandler.context=a,wiki.doInternalLink(c,e)}else return console.error({where:`${m}Listener`,message:"unknown action",data:n})};if(typeof window<"u"&&window!==null){let t=`${m}Listener`;(typeof window[t]>"u"||window[t]===null)&&(console.log(`*** ${m} - Adding Message Listener`),window[t]=V,window.addEventListener("message",V))}typeof window<"u"&&(window.plugins[m]={emit:st,bind:lt});var jt=typeof window>"u"?{parse:Y}:void 0;})();
//# sourceMappingURL=plugmatic.js.map
