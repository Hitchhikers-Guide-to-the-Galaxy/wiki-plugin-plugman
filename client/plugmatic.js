/* wiki-plugin-plugman (as plugmatic) - 0.5.0 - Sun, 09 Aug 2026 20:41:15 GMT */
(()=>{var f="plugmatic";var S=function(t,e,s){t.find(`table [data-name="${e}"] .plugman-state`).text(s)},M=t=>new Promise(e=>setTimeout(e,t)),z=async function(){try{return await fetch(`/plugin/${f}/ready`,{cache:"no-store"}).then(t=>t.ok?t.json():null)}catch{return null}},R=async function(t,e=6e4){let i=(await z())?.pid;t.text("Restarting server\u2026");try{await fetch(`/plugin/${f}/restart`,{method:"POST"})}catch{}let p=Date.now();for(await M(2e3);Date.now()-p<e;){let o=Math.round((Date.now()-p)/1e3);t.text(`Waiting for server\u2026 ${o}s / ${Math.round(e/1e3)}s`);let u=await z();if(u&&(i==null||u.pid!==i))return await M(3e3),t.text("Server back up."),!0;await M(2e3)}return t.text("Server did not come back within the time budget \u2014 check the farm."),!1},J=function(t){let e=t.find("button.plugman-update-all"),s=t.find("button.plugman-restart"),i=t.find(".plugman-status");s.on("click",()=>{s.attr("disabled","disabled"),R(i)}),e.on("click",async()=>{e.attr("disabled","disabled").addClass("is-busy"),s.attr("disabled","disabled");let p=t.find(".plugman-row").map((r,l)=>$(l).data("name")).get(),o=0,u=0,c=0;for(let r of p){S(t,r,"checking\u2026");let l;try{l=await fetch(`/plugin/${f}/status/${r}`,{cache:"no-store"}).then(n=>n.json())}catch{S(t,r,"failed: status"),c++;continue}if(l.symlinked){S(t,r,"dev \u2014 skipped"),u++;continue}if(!l.published){S(t,r,"not on npm"),u++;continue}if(l.installed===l.published){S(t,r,"up to date"),u++;continue}S(t,r,`updating \u2192 ${l.published}`);try{let n=await fetch(`/plugin/${f}/update`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({plugin:r})}).then(a=>a.json().then(m=>({ok:a.ok,j:m})));n.ok?(S(t,r,`updated \u2713 ${n.j.installed||""}`),o++):(S(t,r,`failed: ${n.j.error||"update"}`),c++)}catch{S(t,r,"failed: update"),c++}}if(i.text(`Updated ${o}, unchanged ${u}, failed ${c}.`),o>0&&(s.hide(),await R(i))){for(let l of p)try{let n=await fetch(`/plugin/${f}/status/${l}`,{cache:"no-store"}).then(a=>a.json());n.installed&&S(t,l,`now ${n.installed}`)}catch{}i.append(" Done.")}e.removeAttr("disabled").removeClass("is-busy"),s.removeAttr("disabled")})};var L=function(t,e){return t!=null&&e!=null?t===e?"plugman-light-green":"plugman-light-yellow":e!=null?"plugman-light-red":"plugman-light-gray"},Y=`
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
`;function T(){if(typeof document>"u"||document.getElementById("plugman-style"))return;let t=document.createElement("style");t.id="plugman-style",t.textContent=Y,document.head.appendChild(t)}var O=t=>t.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"),P=function(t){let e=[],s=function(u){let c=e.length;return e.push(u),`\u3016${c}\u3017`},i=(u,c)=>e[+c],p=function(u,c){let r=wiki.asSlug(c),l=c===c.trim()?"internal":"internal spaced";return r.length?s(`<a class="${l}" href="/${r}.html" data-page-name="${r}" title="view">${O(c)}</a>`):u},o=(u,c,r)=>s(`"<a class="external" target="_blank" href="${c}" title="${c}" rel="nofollow">${O(c)}</a>"`);return t=t.replace(/〖(\d+)〗/g,"\u3016 $1 \u3017").replace(/\[\[([^\]]+)\]\]/gi,p).replace(/"((http|https|ftp):.*?)"/gi,o),O(t).replace(/〖(\d+)〗/g,i)},Q=t=>typeof t=="string"?[t]:t||[],F=t=>t.replace(/^wiki-(?:plugin|security)-/,""),B=function(t,e,s){T();let i="installed",p=n=>t.publish?t.publish.find(a=>a.plugin===n):void 0,o=function(n,a,m){let g=a.plugin,h=a.short||F(g),w=a.birth?((Date.now()-a.birth)/1e3/3600/24/31.5).toFixed(0):"",b=function(){let d=a.package!=null?a.package.version:void 0,k=p(g)?.npm?.version;return L(d,k)},v=[`<tr class="plugman-row" data-name="${g}">`];for(i of n.columns)v.push((()=>{switch(i){case"status":return`<td title=status class="plugman-cell-status plugman-light ${b()}">\u25C9`;case"name":{let d=[];n.private&&n.private.includes(g)&&d.push('<span class="plugman-badge plugman-badge-private">\u{1F512} private</span>');let k=p(g)?.npm?.version;return a.symlinked&&t.publish&&!k&&d.push('<span class="plugman-badge plugman-badge-unpublished">unpublished</span>'),`<td title=name> ${h}${d.join("")}`}case"menu":return`<td title=menu> ${(a.factory!=null?a.factory.category:void 0)||""}`;case"pages":return`<td title=pages class="plugman-cell-pages">${(a.pages!=null?a.pages.length:void 0)||""}`;case"service":return`<td title=service class="plugman-cell-service">${w}`;case"bundled":return`<td title=bundled> ${m[g]||""}`;case"installed":return`<td title=installed> ${(a.package!=null?a.package.version:void 0)||""}`;case"published":return`<td title=published> ${p(g)?.npm?.version||""}`}})());return v.push('<td class="plugman-state" title=state>'),v.join(`
`)},u=function(n,a,m){let g,h=function(d){for(g of a)if(g.plugin===d)return g;return{plugin:d}},w=n.plugins.length>0?n.plugins.map(h):a,b=(()=>{let d=[];for(i of n.columns)d.push(`<td>${i}`);return d.push("<td>"),d})().join(`
`),v=(()=>{let d=[];for(let k=0;k<w.length;k++)g=w[k],d.push(o(n,g,m));return d})().join(`
`);return`<center> <p><img src="/favicon.png" width=16> <span style="color:gray;">${window.location.host}</span></p> <table class="plugman-table"><tr class="plugman-head"> ${b} </tr>${v}</table> <div class="plugman-buttons"> <button class="plugman-btn plugman-btn-primary plugman-update-all">Update All Plugins</button> <button class="plugman-btn plugman-btn-secondary plugman-restart">restart</button> </div> <div class="plugman-status"></div> </center>`},c=function(n,a){e.find("dialog.plugman-dialog").remove();let m=n.short||F(n.plugin),g=n.package!=null?n.package.version:null,h;if(a==null)h=`<p>${m} is not published on <a href="//npmjs.com" target="_blank" rel="nofollow">npmjs.com</a>.</p>`;else{let y=Q(a.versions),x=a.version,j=g?y.indexOf(g):-1,E=A=>A===x?' <span class="plugman-badge plugman-badge-latest">latest</span>':"",I=A=>`<div class="plugman-version-row"><span>${A}${E(A)}</span><button class="plugman-btn plugman-btn-ghost" data-version="${A}">install</button></div>`,D=(A,N)=>N.length?`<div class="plugman-group-label">${A}</div>${N.map(I).join("")}`:"",U=g?`<div class="plugman-version-row plugman-version-current"><span>${g} <span class="plugman-badge plugman-badge-installed">installed</span>${E(g)}</span><button class="plugman-btn plugman-btn-secondary" data-action="uninstall">uninstall</button></div>`:"";if(j>=0){let A=y.slice(j+1).reverse(),N=y.slice(0,j).reverse();h=D("upgrade",A)+U+D("downgrade",N)}else h=U+D("available",y.slice().reverse())}let w=$(`<dialog class="plugman-dialog">
      <div class="plugman-dialog-head">
        <button class="plugman-dialog-close" data-action="close" title="close">\xD7</button>
        <h3>${m}</h3>
        <p class="plugman-dialog-desc">${a?O(a.description||""):""}</p>
      </div>
      <div class="plugman-dialog-body">${h}</div>
    </dialog>`);e.append(w);let b=w[0],v=e.find(`table [data-name="${n.plugin}"]`),d=a?a.version:null,k=y=>v.find("[title=status]").removeClass("plugman-light-green plugman-light-yellow plugman-light-red plugman-light-gray plugman-light-white").addClass(L(y,d)),K=async function(y){try{let x=await fetch(`/plugin/${f}/install`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({version:y,plugin:n.plugin})}).then(I=>I.json()),j=t.install.indexOf(n);j>=0&&x.row&&(t.install[j]=x.row);let E=x.installed||y;k(E),v.find("[title=installed]").text(E),e.find("button.plugman-restart").removeAttr("disabled").show(),e.find(".plugman-status").text(`${m} set to ${E} \u2014 restart to apply.`),b.close()}catch{e.find(".plugman-status").text("server error")}},V=async function(){if(window.confirm(`Uninstall ${n.plugin}?

If this plugin is on the server's roster it will be reinstalled on the next restart. The server must be restarted for the removal to take effect.`))try{let y=await fetch(`/plugin/${f}/uninstall`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({plugin:n.plugin})}).then(x=>x.json().then(j=>({ok:x.ok,j})));y.ok?(k(null),v.find("[title=installed]").text(""),e.find("button.plugman-restart").removeAttr("disabled").show(),e.find(".plugman-status").text(`${n.plugin} removed \u2014 restart to apply.`)):e.find(".plugman-status").text(`uninstall failed: ${y.j.error||""}`),b.close()}catch{e.find(".plugman-status").text("server error")}};b.addEventListener("click",function(y){if(y.target===b)return b.close();let x=y.target.closest("[data-version]");if(x)return K(x.getAttribute("data-version"));if(y.target.closest("[data-action=uninstall]"))return V();if(y.target.closest("[data-action=close]"))return b.close()}),b.addEventListener("close",()=>w.remove()),b.showModal()},r=function(n,a){let m=t.install.find(d=>d.plugin===n),g=function(d){return d?P(d).replace(/\n/g,"<br>"):""},h=function(d){return d?`<pre>${P(JSON.stringify(d,null,"  "))}</pre>`:""},w=d=>`<p><b><a href=#>${d.title}</a></b><br>${P(d.synopsis)}</p>`,b=function(d){return d?new Date(d).toString():"built-in"},v=d=>$.getJSON(`/plugin/${f}/view/${n}`,d);switch(i){case"status":return v(d=>c(m,d));case"name":return a(g(m.authors));case"menu":return a(h(m.factory));case"pages":return a(m.pages.map(w).join(""));case"service":return a(b(m.birth));case"bundled":return a(h(t.bundle.data.dependencies));case"installed":return a(h(m.package));case"published":return a(h(p(n)?.npm||""));default:return a("unexpected column")}},l=function(n){let m=$(n.target).closest("[data-name]").data("name");return r(m,function(g){let h=e.parents(".page").data("key"),w=wiki.lineup.atKey(h).getContext(),b=window.open(`/plugins/${f}/dialog/#`,f,"popup,height=600,width=800");return b.location.pathname!==`/plugins/${f}/dialog/`?b.addEventListener("load",v=>b.postMessage({column:i,title:`${m} plugin ${i}`,body:g||"",pageKey:h,context:w},window.origin)):b.postMessage({column:i,title:`${m} plugin ${i}`,body:g||"",pageKey:h,context:w},window.origin)})};e.find("p").html(u(s,t.install,t.bundle.data.dependencies)),e.find("p td").on("click",function(n){return i=$(n.target).closest("td").attr("title"),l(n)}),J(e)};function H(t,e){let s=t.install,i=e.get(0).querySelector("p"),p=["format","data","other","system","option"],o=["activity","changes","factory","flagmatic","journalmatic","future","image","paragraph","present","recycler","reference","register"];i.innerHTML=p.map(l=>`
    <h3>${l}</h3>
    ${s.filter(n=>{let a=n.factory?.category;return o.includes(u(n))?l=="system":l==(a||"option")}).toSorted((n,a)=>u(n).localeCompare(u(a))).map(c).join(`
`)}`);function u(l){return l.short||(l.plugin||"").replace(/^wiki-(?:plugin|security)-/,"")}function c(l){return`
      <details>
        <summary><a href=# style="text-decoration: none;">
          ${u(l)}</a> \u2014 ${l.factory?.title??'<i style="color:#888">missing</i>'}
        </summary>
        ${r(l)}
      </details>
    `}function r(l){function n(g){return g.replaceAll(/&/g,"&amp;").replaceAll(/</g,"&lt;").replaceAll(/>/g,"&gt;").replaceAll(/\[\[(.*?)\]\]/g,"$1").replaceAll(/\[.*? (.*?)\]/g,"$1")}let a=(l.pages||[]).map(g=>`
      <p><a href=# style="text-decoration: none;" data-slug=${g.slug}>
          ${g.title}</a> \u2014 ${n(g.synopsis??"")}
      </p>
    `).join(`
`),m={author:l?.package.author,contributors:l?.package.contributors,version:l?.package.version,repository:l?.package.repository};return`
      <hr>
      ${a}
      <details><summary>more ...</summary>
        <pre>${JSON.stringify(m,null,2)}</pre>
      </details>
      <hr>`}for(let l of i.querySelectorAll("a"))l.addEventListener("click",n=>{n.preventDefault();let a=n.target,m=a.innerText.trim(),g=a.dataset?.slug?a.dataset.slug:`about-${m}-plugin`,h=n.shiftKey?null:$(a.closest(".page"));wiki.doInternalLink(g,h)})}var X=t=>t.replace(/^wiki-(?:plugin|security)-/,""),Z=t=>new Promise(e=>setTimeout(e,t)),C=(t,e,s)=>t.find(`tr.plugman-farm-row[data-name="${e}"] .plugman-fstate`).text(s),W=async function(t,e){try{return await fetch(`/plugin/${f}/remote/status?farm=${encodeURIComponent(t)}&pkg=${encodeURIComponent(e)}`).then(s=>s.json())}catch{return{installed:null,published:null}}},tt=async function(t,e,s){let i=s.find("button.plugman-farm-install"),p=s.find(".plugman-farm-status");i.attr("disabled","disabled");let o=0,u=0,c=0;for(let r of e.plugins){C(s,r,"checking\u2026");let l=await W(t,r);if(l.installed&&l.published&&l.installed===l.published){C(s,r,"up to date"),u++;continue}if(!l.published&&!l.installed){C(s,r,"not on npm"),u++;continue}C(s,r,l.installed?`updating \u2192 ${l.published}`:`installing ${l.published}`);try{let n=await fetch(`/plugin/${f}/remote/install`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({farm:t,plugin:r})}).then(a=>a.json().then(m=>({ok:a.ok,status:a.status,j:m})));n.ok?(C(s,r,"installed \u2713"),o++):n.status===424?(C(s,r,"no secret \u2014 see text below"),c++):(C(s,r,`failed: ${n.j.error||n.status}`),c++)}catch{C(s,r,"failed: request"),c++}}if(p.text(`Installed ${o}, up to date ${u}, failed ${c}.`),o>0){p.append(" Restarting remote\u2026");try{await fetch(`/plugin/${f}/remote/restart`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({farm:t})})}catch{}let r=Date.now();for(;Date.now()-r<12e4;){await Z(4e3),p.text(`Installed ${o}. Waiting for remote\u2026 ${Math.round((Date.now()-r)/1e3)}s / 120s`);try{if((await fetch(`/plugin/${f}/remote/ready?farm=${encodeURIComponent(t)}`)).ok){p.text(`Done \u2014 installed ${o}, remote back up.`);break}}catch{}}}i.removeAttr("disabled")},_=async function(t,e){for(let s of e){let i=s.domain,p=$(`
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
      </div>`);t.append(p);let o=p.find("table"),u=!1;try{let c=await fetch(`/plugin/${f}/remote/status?farm=${encodeURIComponent(i)}`).then(r=>r.json());u=c.reachable,p.find(".plugman-farm-note").text(u?` \u2014 ${c.remoteBase}${c.hasSecret?", authenticated":", no secret yet"}`:" \u2014 unreachable")}catch{p.find(".plugman-farm-note").text(" \u2014 unreachable")}if(!u){p.find("button.plugman-farm-install").attr("disabled","disabled");continue}for(let c of s.plugins){let r=await W(i,c);o.append(`<tr class="plugman-farm-row" data-name="${c}">
        <td class="plugman-cell-status plugman-light ${L(r.installed,r.published)}">\u25C9
        <td>${X(c)}<td>${r.installed||""}<td>${r.published||""}
        <td class="plugman-fstate"></tr>`)}p.find("button.plugman-farm-install").on("click",()=>tt(i,s,p))}};var G=function(t){let e={columns:[],plugins:[],features:[],farms:[],private:[],sync:null},s=(t||"").split(/\n+/),i=null,p=!1;for(var o of s){var u;if(u=o.match(/^FARM\s+([a-z0-9.-]+)\s*$/i)){i={domain:u[1],plugins:[]},e.farms.push(i),p=!1;continue}if(o.match(/^PRIVATE\s*$/i)){i=null,p=!0;continue}if(o.match(/^(LOCAL|PUBLIC)\s*$/i)){i=null,p=!1;continue}if(u=o.match(/^SYNC(?:\s+([a-z0-9.-]+))?\s*$/i)){e.features.push("sync"),e.sync={target:u[1]||null};continue}o.match(/\bSTATUS\b/)&&e.columns.push("status"),o.match(/\bNAME\b/)&&e.columns.push("name"),o.match(/\bMENU\b/)&&e.columns.push("menu"),o.match(/\bPAGES\b/)&&e.columns.push("pages"),o.match(/\bSERVICE\b/)&&e.columns.push("service"),o.match(/\bBUNDLED\b/)&&e.columns.push("bundled"),o.match(/\bINSTALLED\b/)&&e.columns.push("installed"),o.match(/\bPUBLISHED\b/)&&e.columns.push("published"),o.match(/\bBROWSE\b/)&&e.features.push("browse"),(u=o.match(/^(wiki-(?:plugin|security)-[\w-]+)$/))&&(i?i.plugins.push(u[1]):(e.plugins.push(u[1]),p&&e.private.push(u[1])))}return e.columns.length===0&&(e.columns=e.plugins.length===0?["name","pages","menu","bundled","installed"]:["status","name","pages","bundled","installed","published"]),e},et=async function(t,e){T();let s=G(e.text);t.append(`<p style="background-color:#eee;padding:15px;">
  loading plugin details
</p>`);let i=o=>{s.features.includes("browse")?H(o,t):B(o,t,s)},p=s.farms.length>0&&s.plugins.length===0&&!s.features.includes("browse");try{if(p)t.find("p").remove();else if(s.plugins.length){let o={method:"POST",body:JSON.stringify(s),headers:{"Content-Type":"application/json"}};i(await fetch(`/plugin/${f}/plugins`,o).then(u=>u.json()))}else i(await fetch(`/plugin/${f}/plugins`).then(o=>o.json()))}catch{t.find("p").html("server error")}if(s.farms&&s.farms.length)try{await _(t,s.farms)}catch{t.append('<p style="color:#888;">could not load remote farms</p>')}},nt=(t,e)=>t.on("dblclick",()=>wiki.textEditor(t,e)),q=function(t){if(!t.source.opener||t.source.location.pathname!==`/plugins/${f}/dialog/`)return;console.log(`${f} listener`,t);let{data:e}=t,{action:s}=e;if(s==="doInternalLink"){var i=e.keepLineup,p=i??!1,o=e.pageKey,u=o??null,c=e.title,r=c??null,l=e.context,n=l??null,a=null;u!==null&&(a=p?null:$(".page").filter((m,g)=>$(g).data("key")===u)),wiki.pageHandler.context=n,wiki.doInternalLink(r,a)}else return console.error({where:`${f}Listener`,message:"unknown action",data:e})};if(typeof window<"u"&&window!==null){let t=`${f}Listener`;(typeof window[t]>"u"||window[t]===null)&&(console.log(`*** ${f} - Adding Message Listener`),window[t]=q,window.addEventListener("message",q))}typeof window<"u"&&(window.plugins[f]={emit:et,bind:nt});var vt=typeof window>"u"?{parse:G}:void 0;})();
//# sourceMappingURL=plugmatic.js.map
