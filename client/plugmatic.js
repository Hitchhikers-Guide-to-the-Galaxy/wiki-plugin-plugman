/* wiki-plugin-plugman (as plugmatic) - 0.4.0 - Sun, 09 Aug 2026 20:24:50 GMT */
(()=>{var f="plugmatic";var k=function(t,e,s){t.find(`table [data-name="${e}"] .plugman-state`).text(s)},M=t=>new Promise(e=>setTimeout(e,t)),z=async function(){try{return await fetch(`/plugin/${f}/ready`,{cache:"no-store"}).then(t=>t.ok?t.json():null)}catch{return null}},R=async function(t,e=6e4){let r=(await z())?.pid;t.text("Restarting server\u2026");try{await fetch(`/plugin/${f}/restart`,{method:"POST"})}catch{}let i=Date.now();for(await M(2e3);Date.now()-i<e;){let c=Math.round((Date.now()-i)/1e3);t.text(`Waiting for server\u2026 ${c}s / ${Math.round(e/1e3)}s`);let p=await z();if(p&&(r==null||p.pid!==r))return await M(3e3),t.text("Server back up."),!0;await M(2e3)}return t.text("Server did not come back within the time budget \u2014 check the farm."),!1},J=function(t){let e=t.find("button.plugman-update-all"),s=t.find("button.plugman-restart"),r=t.find(".plugman-status");s.on("click",()=>{s.attr("disabled","disabled"),R(r)}),e.on("click",async()=>{e.attr("disabled","disabled").addClass("is-busy"),s.attr("disabled","disabled");let i=t.find(".plugman-row").map((o,l)=>$(l).data("name")).get(),c=0,p=0,u=0;for(let o of i){k(t,o,"checking\u2026");let l;try{l=await fetch(`/plugin/${f}/status/${o}`,{cache:"no-store"}).then(n=>n.json())}catch{k(t,o,"failed: status"),u++;continue}if(l.symlinked){k(t,o,"dev \u2014 skipped"),p++;continue}if(!l.published){k(t,o,"not on npm"),p++;continue}if(l.installed===l.published){k(t,o,"up to date"),p++;continue}k(t,o,`updating \u2192 ${l.published}`);try{let n=await fetch(`/plugin/${f}/update`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({plugin:o})}).then(a=>a.json().then(m=>({ok:a.ok,j:m})));n.ok?(k(t,o,`updated \u2713 ${n.j.installed||""}`),c++):(k(t,o,`failed: ${n.j.error||"update"}`),u++)}catch{k(t,o,"failed: update"),u++}}if(r.text(`Updated ${c}, unchanged ${p}, failed ${u}.`),c>0&&(s.hide(),await R(r))){for(let l of i)try{let n=await fetch(`/plugin/${f}/status/${l}`,{cache:"no-store"}).then(a=>a.json());n.installed&&k(t,l,`now ${n.installed}`)}catch{}r.append(" Done.")}e.removeAttr("disabled").removeClass("is-busy"),s.removeAttr("disabled")})};var N=function(t,e){return t!=null&&e!=null?t===e?"plugman-light-green":"plugman-light-yellow":e!=null?"plugman-light-red":"plugman-light-gray"},Q=`
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
`;function L(){if(typeof document>"u"||document.getElementById("plugman-style"))return;let t=document.createElement("style");t.id="plugman-style",t.textContent=Q,document.head.appendChild(t)}var O=t=>t.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"),U=function(t){let e=[],s=function(p){let u=e.length;return e.push(p),`\u3016${u}\u3017`},r=(p,u)=>e[+u],i=function(p,u){let o=wiki.asSlug(u),l=u===u.trim()?"internal":"internal spaced";return o.length?s(`<a class="${l}" href="/${o}.html" data-page-name="${o}" title="view">${O(u)}</a>`):p},c=(p,u,o)=>s(`"<a class="external" target="_blank" href="${u}" title="${u}" rel="nofollow">${O(u)}</a>"`);return t=t.replace(/〖(\d+)〗/g,"\u3016 $1 \u3017").replace(/\[\[([^\]]+)\]\]/gi,i).replace(/"((http|https|ftp):.*?)"/gi,c),O(t).replace(/〖(\d+)〗/g,r)},X=t=>typeof t=="string"?[t]:t||[],F=t=>t.replace(/^wiki-(?:plugin|security)-/,""),B=function(t,e,s){L();let r="installed",i=n=>t.publish?t.publish.find(a=>a.plugin===n):void 0,c=function(n,a,m){let d=a.plugin,h=a.short||F(d),w=a.birth?((Date.now()-a.birth)/1e3/3600/24/31.5).toFixed(0):"",b=function(){let g=a.package!=null?a.package.version:void 0,A=i(d)?.npm?.version;return N(g,A)},x=[`<tr class="plugman-row" data-name="${d}">`];for(r of n.columns)x.push((()=>{switch(r){case"status":return`<td title=status class="plugman-cell-status plugman-light ${b()}">\u25C9`;case"name":return`<td title=name> ${h}`;case"menu":return`<td title=menu> ${(a.factory!=null?a.factory.category:void 0)||""}`;case"pages":return`<td title=pages class="plugman-cell-pages">${(a.pages!=null?a.pages.length:void 0)||""}`;case"service":return`<td title=service class="plugman-cell-service">${w}`;case"bundled":return`<td title=bundled> ${m[d]||""}`;case"installed":return`<td title=installed> ${(a.package!=null?a.package.version:void 0)||""}`;case"published":return`<td title=published> ${i(d)?.npm?.version||""}`}})());return x.push('<td class="plugman-state" title=state>'),x.join(`
`)},p=function(n,a,m){let d,h=function(g){for(d of a)if(d.plugin===g)return d;return{plugin:g}},w=n.plugins.length>0?n.plugins.map(h):a,b=(()=>{let g=[];for(r of n.columns)g.push(`<td>${r}`);return g.push("<td>"),g})().join(`
`),x=(()=>{let g=[];for(let A=0;A<w.length;A++)d=w[A],g.push(c(n,d,m));return g})().join(`
`);return`<center> <p><img src="/favicon.png" width=16> <span style="color:gray;">${window.location.host}</span></p> <table class="plugman-table"><tr class="plugman-head"> ${b} </tr>${x}</table> <div class="plugman-buttons"> <button class="plugman-btn plugman-btn-primary plugman-update-all">Update All Plugins</button> <button class="plugman-btn plugman-btn-secondary plugman-restart">restart</button> </div> <div class="plugman-status"></div> </center>`},u=function(n,a){e.find("dialog.plugman-dialog").remove();let m=n.short||F(n.plugin),d=n.package!=null?n.package.version:null,h;if(a==null)h=`<p>${m} is not published on <a href="//npmjs.com" target="_blank" rel="nofollow">npmjs.com</a>.</p>`;else{let y=X(a.versions),v=a.version,j=d?y.indexOf(d):-1,E=S=>S===v?' <span class="plugman-badge plugman-badge-latest">latest</span>':"",I=S=>`<div class="plugman-version-row"><span>${S}${E(S)}</span><button class="plugman-btn plugman-btn-ghost" data-version="${S}">install</button></div>`,D=(S,T)=>T.length?`<div class="plugman-group-label">${S}</div>${T.map(I).join("")}`:"",P=d?`<div class="plugman-version-row plugman-version-current"><span>${d} <span class="plugman-badge plugman-badge-installed">installed</span>${E(d)}</span><button class="plugman-btn plugman-btn-secondary" data-action="uninstall">uninstall</button></div>`:"";if(j>=0){let S=y.slice(j+1).reverse(),T=y.slice(0,j).reverse();h=D("upgrade",S)+P+D("downgrade",T)}else h=P+D("available",y.slice().reverse())}let w=$(`<dialog class="plugman-dialog">
      <div class="plugman-dialog-head">
        <button class="plugman-dialog-close" data-action="close" title="close">\xD7</button>
        <h3>${m}</h3>
        <p class="plugman-dialog-desc">${a?O(a.description||""):""}</p>
      </div>
      <div class="plugman-dialog-body">${h}</div>
    </dialog>`);e.append(w);let b=w[0],x=e.find(`table [data-name="${n.plugin}"]`),g=a?a.version:null,A=y=>x.find("[title=status]").removeClass("plugman-light-green plugman-light-yellow plugman-light-red plugman-light-gray plugman-light-white").addClass(N(y,g)),K=async function(y){try{let v=await fetch(`/plugin/${f}/install`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({version:y,plugin:n.plugin})}).then(I=>I.json()),j=t.install.indexOf(n);j>=0&&v.row&&(t.install[j]=v.row);let E=v.installed||y;A(E),x.find("[title=installed]").text(E),e.find("button.plugman-restart").removeAttr("disabled").show(),e.find(".plugman-status").text(`${m} set to ${E} \u2014 restart to apply.`),b.close()}catch{e.find(".plugman-status").text("server error")}},V=async function(){if(window.confirm(`Uninstall ${n.plugin}?

If this plugin is on the server's roster it will be reinstalled on the next restart. The server must be restarted for the removal to take effect.`))try{let y=await fetch(`/plugin/${f}/uninstall`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({plugin:n.plugin})}).then(v=>v.json().then(j=>({ok:v.ok,j})));y.ok?(A(null),x.find("[title=installed]").text(""),e.find("button.plugman-restart").removeAttr("disabled").show(),e.find(".plugman-status").text(`${n.plugin} removed \u2014 restart to apply.`)):e.find(".plugman-status").text(`uninstall failed: ${y.j.error||""}`),b.close()}catch{e.find(".plugman-status").text("server error")}};b.addEventListener("click",function(y){if(y.target===b)return b.close();let v=y.target.closest("[data-version]");if(v)return K(v.getAttribute("data-version"));if(y.target.closest("[data-action=uninstall]"))return V();if(y.target.closest("[data-action=close]"))return b.close()}),b.addEventListener("close",()=>w.remove()),b.showModal()},o=function(n,a){let m=t.install.find(g=>g.plugin===n),d=function(g){return g?U(g).replace(/\n/g,"<br>"):""},h=function(g){return g?`<pre>${U(JSON.stringify(g,null,"  "))}</pre>`:""},w=g=>`<p><b><a href=#>${g.title}</a></b><br>${U(g.synopsis)}</p>`,b=function(g){return g?new Date(g).toString():"built-in"},x=g=>$.getJSON(`/plugin/${f}/view/${n}`,g);switch(r){case"status":return x(g=>u(m,g));case"name":return a(d(m.authors));case"menu":return a(h(m.factory));case"pages":return a(m.pages.map(w).join(""));case"service":return a(b(m.birth));case"bundled":return a(h(t.bundle.data.dependencies));case"installed":return a(h(m.package));case"published":return a(h(i(n)?.npm||""));default:return a("unexpected column")}},l=function(n){let m=$(n.target).closest("[data-name]").data("name");return o(m,function(d){let h=e.parents(".page").data("key"),w=wiki.lineup.atKey(h).getContext(),b=window.open(`/plugins/${f}/dialog/#`,f,"popup,height=600,width=800");return b.location.pathname!==`/plugins/${f}/dialog/`?b.addEventListener("load",x=>b.postMessage({column:r,title:`${m} plugin ${r}`,body:d||"",pageKey:h,context:w},window.origin)):b.postMessage({column:r,title:`${m} plugin ${r}`,body:d||"",pageKey:h,context:w},window.origin)})};e.find("p").html(p(s,t.install,t.bundle.data.dependencies)),e.find("p td").on("click",function(n){return r=$(n.target).closest("td").attr("title"),l(n)}),J(e)};function H(t,e){let s=t.install,r=e.get(0).querySelector("p"),i=["format","data","other","system","option"],c=["activity","changes","factory","flagmatic","journalmatic","future","image","paragraph","present","recycler","reference","register"];r.innerHTML=i.map(l=>`
    <h3>${l}</h3>
    ${s.filter(n=>{let a=n.factory?.category;return c.includes(p(n))?l=="system":l==(a||"option")}).toSorted((n,a)=>p(n).localeCompare(p(a))).map(u).join(`
`)}`);function p(l){return l.short||(l.plugin||"").replace(/^wiki-(?:plugin|security)-/,"")}function u(l){return`
      <details>
        <summary><a href=# style="text-decoration: none;">
          ${p(l)}</a> \u2014 ${l.factory?.title??'<i style="color:#888">missing</i>'}
        </summary>
        ${o(l)}
      </details>
    `}function o(l){function n(d){return d.replaceAll(/&/g,"&amp;").replaceAll(/</g,"&lt;").replaceAll(/>/g,"&gt;").replaceAll(/\[\[(.*?)\]\]/g,"$1").replaceAll(/\[.*? (.*?)\]/g,"$1")}let a=(l.pages||[]).map(d=>`
      <p><a href=# style="text-decoration: none;" data-slug=${d.slug}>
          ${d.title}</a> \u2014 ${n(d.synopsis??"")}
      </p>
    `).join(`
`),m={author:l?.package.author,contributors:l?.package.contributors,version:l?.package.version,repository:l?.package.repository};return`
      <hr>
      ${a}
      <details><summary>more ...</summary>
        <pre>${JSON.stringify(m,null,2)}</pre>
      </details>
      <hr>`}for(let l of r.querySelectorAll("a"))l.addEventListener("click",n=>{n.preventDefault();let a=n.target,m=a.innerText.trim(),d=a.dataset?.slug?a.dataset.slug:`about-${m}-plugin`,h=n.shiftKey?null:$(a.closest(".page"));wiki.doInternalLink(d,h)})}var Y=t=>t.replace(/^wiki-(?:plugin|security)-/,""),Z=t=>new Promise(e=>setTimeout(e,t)),C=(t,e,s)=>t.find(`tr.plugman-farm-row[data-name="${e}"] .plugman-fstate`).text(s),W=async function(t,e){try{return await fetch(`/plugin/${f}/remote/status?farm=${encodeURIComponent(t)}&pkg=${encodeURIComponent(e)}`).then(s=>s.json())}catch{return{installed:null,published:null}}},tt=async function(t,e,s){let r=s.find("button.plugman-farm-install"),i=s.find(".plugman-farm-status");r.attr("disabled","disabled");let c=0,p=0,u=0;for(let o of e.plugins){C(s,o,"checking\u2026");let l=await W(t,o);if(l.installed&&l.published&&l.installed===l.published){C(s,o,"up to date"),p++;continue}if(!l.published&&!l.installed){C(s,o,"not on npm"),p++;continue}C(s,o,l.installed?`updating \u2192 ${l.published}`:`installing ${l.published}`);try{let n=await fetch(`/plugin/${f}/remote/install`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({farm:t,plugin:o})}).then(a=>a.json().then(m=>({ok:a.ok,status:a.status,j:m})));n.ok?(C(s,o,"installed \u2713"),c++):n.status===424?(C(s,o,"no secret \u2014 see text below"),u++):(C(s,o,`failed: ${n.j.error||n.status}`),u++)}catch{C(s,o,"failed: request"),u++}}if(i.text(`Installed ${c}, up to date ${p}, failed ${u}.`),c>0){i.append(" Restarting remote\u2026");try{await fetch(`/plugin/${f}/remote/restart`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({farm:t})})}catch{}let o=Date.now();for(;Date.now()-o<12e4;){await Z(4e3),i.text(`Installed ${c}. Waiting for remote\u2026 ${Math.round((Date.now()-o)/1e3)}s / 120s`);try{if((await fetch(`/plugin/${f}/remote/ready?farm=${encodeURIComponent(t)}`)).ok){i.text(`Done \u2014 installed ${c}, remote back up.`);break}}catch{}}}r.removeAttr("disabled")},_=async function(t,e){for(let s of e){let r=s.domain,i=$(`
      <div class="plugman-farm">
        <p class="plugman-farm-head"><b>FARM</b> <span class="plugman-farm-domain">${r}</span>
          <span class="plugman-farm-note"> \u2014 checking\u2026</span></p>
        <table class="plugman-table"><tr class="plugman-head">
          <td>status<td>name<td>installed<td>published<td>
        </tr></table>
        <div class="plugman-buttons">
          <button class="plugman-btn plugman-btn-primary plugman-farm-install">Install / Update All on this farm</button>
        </div>
        <div class="plugman-farm-status"></div>
      </div>`);t.append(i);let c=i.find("table"),p=!1;try{let u=await fetch(`/plugin/${f}/remote/status?farm=${encodeURIComponent(r)}`).then(o=>o.json());p=u.reachable,i.find(".plugman-farm-note").text(p?` \u2014 ${u.remoteBase}${u.hasSecret?", authenticated":", no secret yet"}`:" \u2014 unreachable")}catch{i.find(".plugman-farm-note").text(" \u2014 unreachable")}if(!p){i.find("button.plugman-farm-install").attr("disabled","disabled");continue}for(let u of s.plugins){let o=await W(r,u);c.append(`<tr class="plugman-farm-row" data-name="${u}">
        <td class="plugman-cell-status plugman-light ${N(o.installed,o.published)}">\u25C9
        <td>${Y(u)}<td>${o.installed||""}<td>${o.published||""}
        <td class="plugman-fstate"></tr>`)}i.find("button.plugman-farm-install").on("click",()=>tt(r,s,i))}};var G=function(t){let e={columns:[],plugins:[],features:[],farms:[]},s=(t||"").split(/\n+/),r=null;for(var i of s){var c;if(c=i.match(/^FARM\s+([a-z0-9.-]+)\s*$/i)){r={domain:c[1],plugins:[]},e.farms.push(r);continue}i.match(/\bSTATUS\b/)&&e.columns.push("status"),i.match(/\bNAME\b/)&&e.columns.push("name"),i.match(/\bMENU\b/)&&e.columns.push("menu"),i.match(/\bPAGES\b/)&&e.columns.push("pages"),i.match(/\bSERVICE\b/)&&e.columns.push("service"),i.match(/\bBUNDLED\b/)&&e.columns.push("bundled"),i.match(/\bINSTALLED\b/)&&e.columns.push("installed"),i.match(/\bPUBLISHED\b/)&&e.columns.push("published"),i.match(/\bBROWSE\b/)&&e.features.push("browse"),(c=i.match(/^(wiki-(?:plugin|security)-[\w-]+)$/))&&(r?r.plugins.push(c[1]):e.plugins.push(c[1]))}return e.columns.length===0&&(e.columns=e.plugins.length===0?["name","pages","menu","bundled","installed"]:["status","name","pages","bundled","installed","published"]),e},et=async function(t,e){L();let s=G(e.text);t.append(`<p style="background-color:#eee;padding:15px;">
  loading plugin details
</p>`);let r=c=>{s.features.includes("browse")?H(c,t):B(c,t,s)},i=s.farms.length>0&&s.plugins.length===0&&!s.features.includes("browse");try{if(i)t.find("p").remove();else if(s.plugins.length){let c={method:"POST",body:JSON.stringify(s),headers:{"Content-Type":"application/json"}};r(await fetch(`/plugin/${f}/plugins`,c).then(p=>p.json()))}else r(await fetch(`/plugin/${f}/plugins`).then(c=>c.json()))}catch{t.find("p").html("server error")}if(s.farms&&s.farms.length)try{await _(t,s.farms)}catch{t.append('<p style="color:#888;">could not load remote farms</p>')}},nt=(t,e)=>t.on("dblclick",()=>wiki.textEditor(t,e)),q=function(t){if(!t.source.opener||t.source.location.pathname!==`/plugins/${f}/dialog/`)return;console.log(`${f} listener`,t);let{data:e}=t,{action:s}=e;if(s==="doInternalLink"){var r=e.keepLineup,i=r??!1,c=e.pageKey,p=c??null,u=e.title,o=u??null,l=e.context,n=l??null,a=null;p!==null&&(a=i?null:$(".page").filter((m,d)=>$(d).data("key")===p)),wiki.pageHandler.context=n,wiki.doInternalLink(o,a)}else return console.error({where:`${f}Listener`,message:"unknown action",data:e})};if(typeof window<"u"&&window!==null){let t=`${f}Listener`;(typeof window[t]>"u"||window[t]===null)&&(console.log(`*** ${f} - Adding Message Listener`),window[t]=q,window.addEventListener("message",q))}typeof window<"u"&&(window.plugins[f]={emit:et,bind:nt});var xt=typeof window>"u"?{parse:G}:void 0;})();
//# sourceMappingURL=plugmatic.js.map
