'use strict';
// DATA in index.html is the canonical research. All indexes below are derived.
const $ = id => document.getElementById(id);
const phoneMedia='(max-width:700px), (hover:none) and (max-height:500px)';
const isPhoneView=()=>matchMedia(phoneMedia).matches;
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm = value => String(value ?? '').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
const icons = {
 location:'<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0z"/><circle cx="12" cy="10" r="2.5"/>',
 search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4 4"/>',close:'<path d="m6 6 12 12M18 6 6 18"/>',
 bookmark:'<path d="M6 4h12v17l-6-4-6 4z"/>',help:'<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 4 2c-1 .6-1.5 1-1.5 2M12 16h.01"/>',
 filter:'<path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="2" fill="white"/><circle cx="15" cy="17" r="2" fill="white"/>',chevron:'<path d="m7 10 5 5 5-5"/>',reset:'<path d="M4 10a8 8 0 1 1 1 7M4 4v6h6"/>',map:'<path d="m3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2zM9 3v16M15 5v16"/>',list:'<path d="M8 5h13M8 12h13M8 19h13M3 5h.01M3 12h.01M3 19h.01"/>',minus:'<path d="M5 12h14"/>',plus:'<path d="M5 12h14M12 5v14"/>',left:'<path d="m14 6-6 6 6 6"/>',right:'<path d="m10 6 6 6-6 6"/>',external:'<path d="M14 3h7v7M21 3 11 13M10 5H4v15h15v-6"/>'
};
const icon = name => `<svg class="icon" aria-hidden="true" viewBox="0 0 24 24">${icons[name] || ''}</svg>`;
document.querySelectorAll('[data-icon]').forEach(el => {el.outerHTML=icon(el.dataset.icon);});
const layers = [{key:'infra',name:'Infrastructure',color:'#8170a3',desc:'Tools, compute and the systems that connect them.'},{key:'brain',name:'Intelligence',color:'#43886b',desc:'Models and policies that turn perception into action.'},{key:'data',name:'Data',color:'#4e77a4',desc:'Collection, simulation and learning from the world.'},{key:'hardware',name:'Hardware',color:'#ab6d64',desc:'Robots, sensors and physical embodiments.'},{key:'deployment',name:'Deployment',color:'#aa8550',desc:'Operating physical AI in real environments.'}];
const core = DATA.filter(c => norm(c.status)==='core');
const byName = new Map(DATA.map(c=>[c.name,c]));
const alias = new Map(Object.entries({'nventures':'NVIDIA','nvidia':'NVIDIA','nvidia / nventures':'NVIDIA','nvidia/nventures':'NVIDIA','qia':'Qatar Investment Authority','qatar investment authority (qia)':'Qatar Investment Authority','a16z':'Andreessen Horowitz','andreessen horowitz (a16z)':'Andreessen Horowitz','samsung next':'Samsung NEXT','sequoia':'Sequoia Capital','lightspeed':'Lightspeed Venture Partners'}));
function investorName(s){return alias.get(norm(s)) || String(s).trim();}
function validInvestor(s){return s && !/^(others?|undisclosed|not disclosed|n\/?a|unknown|none|private|public|tbd)$/i.test(s) && !/not publicly|not disclosed|undisclosed|shareholders|wholly.owned|historical investors|strategic.*partnership|see sources|not applicable|to verify|require.*follow.up|not separately|other .*backers|^additional investors\b|^others? historically\b/i.test(s) && s.length<90;}
const investorsFor = c => [...new Set((Array.isArray(c.canonical_investors)?c.canonical_investors:[]).map(investorName).filter(validInvestor))];
const index = new Map(DATA.map(c => [c.name,{company:norm(c.name),founders:norm(founderNames(c).join(' ')),investors:norm(`${c.investors} ${investorsFor(c).join(' ')}`),all:norm([c.name,founderNames(c).join(' '),c.investors,investorsFor(c).join(' '),c.primary,c.secondary,c.tagline,c.notes,c.overview,c.map_role,...(c.major_events||[]).flatMap(e=>[e.title,e.summary])].join(' '))}]));
const state = {q:'',field:'all',scope:'curated',layer:'',category:'',investor:'',geography:'',view:isPhoneView()?'list':'map',selected:null};
const categories = [...new Set(DATA.flatMap(c=>[c.primary,c.secondary]).filter(Boolean))].sort();
const saved = new Set();
try{const values=JSON.parse(localStorage.getItem('physical-ai-saved')||'[]');if(Array.isArray(values))values.forEach(n=>{if(byName.has(n))saved.add(n);});}catch{}
const initialParams=new URLSearchParams(location.hash.slice(1));
for(const key of ['q','field','scope','layer','category','investor','geography','view'])if(initialParams.has(key))state[key]=initialParams.get(key);
if(!['all','company','founders','investors'].includes(state.field))state.field='all';
if(!['curated','all'].includes(state.scope))state.scope='curated';
if(!['map','list'].includes(state.view))state.view='map';
if(!layers.some(l=>l.key===state.layer))state.layer='';
if(!categories.includes(state.category))state.category='';
if(!['','Israel','Europe','United States','China','Other','Unknown'].includes(state.geography))state.geography='';
if(state.investor && !DATA.some(c=>investorsFor(c).includes(state.investor)))state.investor='';
let matches=[],layout=null,layoutScope='',zoom=1,fitScale=1,cardInvoker=null,tooltipTimer=null,noticeTimer=null;
const layouts=new Map();
function safeUrl(value){try{const u=new URL(value);return ['http:','https:'].includes(u.protocol)?u.href:'';}catch{return '';}}
function sourceKey(value){
 const u=new URL(value);u.hash='';u.hostname=u.hostname.replace(/^www\./,'');
 for(const key of [...u.searchParams.keys()])if(/^utm_|^(gclid|fbclid)$/i.test(key))u.searchParams.delete(key);
 u.pathname=u.pathname.replace(/\/$/,'')||'/';u.searchParams.sort();return u.href;
}
function sourceTitle(value){
 const u=new URL(value);let parts=u.pathname.split('/').filter(Boolean);
 if(parts.length===1&&/^(cn|zh|zh-cn|zh-tw)$/i.test(parts[0]))return 'Company website (Chinese)';
 if(u.hostname==='www.ciie.org'&&u.pathname.endsWith('/hqf/guest/11.pdf'))return 'Michael Xu speaker biography (PDF)';
 parts=parts.filter(p=>!(/^[a-z]{2}(?:[-_][a-z]{2})?$/i.test(p)||/^index\.(html?|php)$/i.test(p)));
 if(!parts.length)return /^(investor|investors|ir)\./.test(u.hostname)?'Investor relations':'Company website';
 let slug=parts.at(-1);try{slug=decodeURIComponent(slug);}catch{}
 const known={'humanoid-robots':'Humanoid robotics','profile':'Company profile','stock-information':'Stock information','annual-report-2011':'Annual report 2011','about':'About the company','company':'About the company','contact':'Company contact details','team':'Company team','investor-relations':'Investor relations'};
 if(known[slug])return known[slug];
 if(/^[0-9a-f-]{20,}(?:\.pdf)?$/i.test(slug))return `Document · ${slug.slice(0,8)}`;
 if(/^\d+$/.test(slug))return `${parts.at(-2)==='node'?'Company announcement':'Source page'} · ${slug}`;
 const label=slug.replace(/\.(pdf|html?|aspx|php)$/i,'').replace(/[-_]+/g,' ').replace(/\s+/g,' ').trim();
 return label?label.charAt(0).toUpperCase()+label.slice(1):'Source page';
}
function companySources(c){
 const urls=[...(c.overview_sources||[]),...(c.founder_sources||[]),...(String(c.sources||'').match(/https?:\/\/[^\s<>";]+/g)||[]).map(s=>s.replace(/[),.]+$/,''))].map(safeUrl).filter(Boolean);
 const seen=new Set();return urls.filter(url=>{const key=sourceKey(url);if(seen.has(key))return false;seen.add(key);return true;});
}
function sourceLinks(sources){return sources.map(u=>`<a class="source-link" href="${esc(u)}" target="_blank" rel="noopener noreferrer"><span class="source-copy"><span class="source-title">${esc(sourceTitle(u))}</span><small>${esc(new URL(u).hostname.replace(/^www\./,''))}</small></span>${icon('external')}</a>`).join('');}
function setLogo(container,c){
 container.replaceChildren();
 const fallback=()=>{const s=document.createElement('span');s.className='namefallback';s.textContent=c.name;container.replaceChildren(s);};
 const path=(c.logo_candidates||[]).find(p=>/^assets\/logos\/[a-z0-9-]+\.png$/i.test(p));
 if(!path){fallback();return;}
 const img=new Image();img.alt=c.name;img.decoding='async';img.onerror=fallback;img.src=path;container.append(img);
}
function base(){return state.scope==='curated'?core:DATA;}
function geographyRegions(c){return c.geography?.regions?.length?c.geography.regions:[c.geography?.region||'Unknown'];}
function filtered(records){const terms=norm(state.q).split(' ').filter(Boolean);return records.filter(c=>(!state.layer||c[state.layer])&&(!state.category||c.primary===state.category||c.secondary===state.category)&&(!state.investor||investorsFor(c).includes(state.investor))&&(!state.geography||geographyRegions(c).includes(state.geography))&&terms.every(t=>index.get(c.name)[state.field].includes(t)));}
function matchReason(c){if(!norm(state.q))return '';const terms=norm(state.q).split(' ');const ci=index.get(c.name);for(const key of ['company','founders','investors'])if(terms.every(t=>ci[key].includes(t))){if(key==='company')return '';return `Matched ${key==='founders'?'founder':'investor'}: ${key==='founders'?founderNames(c).join(', '):investorsFor(c).filter(n=>terms.some(t=>norm(n).includes(t))).join(', ')||c.investors}`;}return state.field==='all'?'Matched research or category':'';}
function updateHash(){const p=new URLSearchParams();for(const key of ['q','field','scope','layer','category','investor','geography','view'])if(state[key] && !((key==='field'&&state[key]==='all')||(key==='scope'&&state[key]==='curated')||(key==='view'&&state[key]==='map')))p.set(key,state[key]);try{history.replaceState(null,'',location.pathname+(p.size?'#'+p.toString():''));}catch{}}
function change(patch){Object.assign(state,patch);hideTooltip();render();}
function clearFilters(){change({q:'',field:'all',layer:'',category:'',investor:'',geography:''});}
function showNotice(message){$('notice').textContent=message;$('notice').hidden=false;clearTimeout(noticeTimer);noticeTimer=setTimeout(()=>$('notice').hidden=true,2600);}
function render(){
 // Investor discovery always covers the complete database, including shared links.
 if(state.investor||(state.field==='investors'&&norm(state.q)))state.scope='all';
 matches=filtered(base());
 if(norm(state.q))matches.sort((a,b)=>Number(index.get(b.name).company.includes(norm(state.q)))-Number(index.get(a.name).company.includes(norm(state.q))));
 $('search').value=state.q;$('search-field').value=state.field;$('category').value=state.category;$('geography').value=state.geography;$('clear-search').hidden=!state.q;
 $('investor-label').textContent=state.investor||'All investors';
 document.querySelectorAll('[data-scope]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.scope===state.scope));
 document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.view===state.view));
 document.querySelectorAll('[data-layer]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.layer===state.layer));
 $('results-count').innerHTML=`<strong>${matches.length}</strong> of ${base().length} ${state.scope==='curated'?'curated profiles':'profiles'}${state.q?` matching “${esc(state.q)}”`:''}`;
 const outside=state.scope==='curated'?filtered(DATA).length-matches.length:0;
 $('scope-hint').hidden=outside<=0;$('scope-hint').textContent=`${outside} more in all profiles →`;
 const chips=[];
 if(state.q)chips.push(['q',`${state.field==='all'?'Search':state.field}: ${state.q}`]);
 if(state.layer)chips.push(['layer',layers.find(l=>l.key===state.layer).name]);
 if(state.category)chips.push(['category',state.category]);
 if(state.investor)chips.push(['investor',state.investor]);
 if(state.geography)chips.push(['geography',state.geography]);
 $('active-filters').hidden=!chips.length;
 $('active-filters').innerHTML=chips.map(([key,label])=>`<button class="filter-chip" data-remove-filter="${key}" aria-label="Remove ${esc(label)} filter">${esc(label)}${icon('close')}</button>`).join('');
 $('mobile-filters').classList.toggle('active',Boolean(state.category||state.investor||state.geography||state.field!=='all'));
 $('show-filter-results').textContent=`Show ${matches.length} ${matches.length===1?'profile':'profiles'}`;
 $('empty').hidden=matches.length>0;$('empty-all').hidden=state.scope==='all';
 $('empty-copy').textContent=state.scope==='curated'?'Try all profiles, a different search, or remove a filter.':'Try a different company, founder or investor name, or remove a filter.';
 $('map-frame').hidden=state.view!=='map'||!matches.length;
 const showList=state.view==='list'||chips.length>0;
 $('list-view').hidden=!showList||!matches.length;$('list-heading').hidden=state.view!=='map'||!showList||!matches.length;
 if(state.view==='map')renderMap();
 if(showList)renderList();
 document.querySelectorAll('#geography option[data-region]').forEach(o=>{const r=o.dataset.region;o.textContent=`${r} (${base().filter(c=>geographyRegions(c).includes(r)).length})`;});
 renderInvestorOptions();updateCardPosition();updateHash();updateSavedButtons();
}
const makeLayout = LandscapeLayout.makeLayout;
function renderMap(){
 if(layoutScope!==state.scope){
  layoutScope=state.scope;if(!layouts.has(state.scope))layouts.set(state.scope,makeLayout(base()));layout=layouts.get(state.scope);
  const world=$('map-world');world.replaceChildren();world.style.width=layout.width+'px';world.style.height=layout.height+'px';
  const positions={data:[.5,.035],hardware:[.5,.963],infra:[.078,.5],brain:[.5,.5],deployment:[.916,.5]};
  for(const l of layers){const b=document.createElement('button');b.className='map-anchor';b.dataset.layer=l.key;b.style.left=positions[l.key][0]*layout.width+'px';b.style.top=positions[l.key][1]*layout.height+'px';b.style.setProperty('--layer-color',l.color);b.textContent=l.name.toUpperCase();b.setAttribute('aria-label',`Filter ${l.name}`);b.addEventListener('click',()=>change({layer:state.layer===l.key?'':l.key}));world.append(b);}
  for(const c of base()){
   const p=layout.points.get(c.name),b=document.createElement('button');b.className='node';b.dataset.name=c.name;b.style.left=(p.x-37)+'px';b.style.top=(p.y-39)+'px';b.setAttribute('aria-label',`Open ${c.name}`);b.innerHTML=`<span class="node-logo"></span><span class="node-name">${esc(c.name)}</span>`;setLogo(b.firstChild,c);
   b.addEventListener('click',()=>openCard(c.name,b));b.addEventListener('mouseenter',()=>{tooltipTimer=setTimeout(()=>showTooltip(c,b),250);});b.addEventListener('mouseleave',hideTooltip);b.addEventListener('focus',()=>showTooltip(c,b));b.addEventListener('blur',hideTooltip);world.append(b);
  }
  requestAnimationFrame(()=>fitMap());
 }
 const names=new Set(matches.map(c=>c.name));
 document.querySelectorAll('.node').forEach(b=>{const hit=names.has(b.dataset.name);b.classList.toggle('dimmed',!hit);b.classList.toggle('selected',b.dataset.name===state.selected);b.tabIndex=hit?0:-1;b.setAttribute('aria-hidden',String(!hit));b.setAttribute('aria-pressed',String(b.dataset.name===state.selected));});
 document.querySelectorAll('.map-anchor').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.layer===state.layer)));
}
function fitMap(){if(!layout||$('map-frame').hidden)return;const vp=$('map-viewport'),phone=isPhoneView();fitScale=phone?1:Math.min(vp.clientWidth/layout.width,vp.clientHeight/layout.height,1);zoom=1;applyZoom();vp.scrollTo(phone?(layout.width-vp.clientWidth)/2:0,phone?(layout.height-vp.clientHeight)/2:0);}
function applyZoom(){if(!layout)return;const scale=fitScale*zoom;$('map-world').style.transform=`scale(${scale})`;$('map-sizer').style.width=layout.width*scale+'px';$('map-sizer').style.height=layout.height*scale+'px';$('zoom-level').textContent=Math.round(zoom*100)+'%';$('zoom-out').disabled=zoom<=1;$('zoom-in').disabled=zoom>=maxZoom();}
function maxZoom(){return Math.max(3,1.35/fitScale);}
function zoomBy(factor){const vp=$('map-viewport'),old=zoom;zoom=Math.max(1,Math.min(maxZoom(),zoom*factor));const x=(vp.scrollLeft+vp.clientWidth/2)*(zoom/old)-vp.clientWidth/2,y=(vp.scrollTop+vp.clientHeight/2)*(zoom/old)-vp.clientHeight/2;applyZoom();vp.scrollTo(x,y);hideTooltip();}
function renderList(){
 const frag=document.createDocumentFragment();
 for(const c of matches){const card=document.createElement('article');card.className='result-card'+(c.name===state.selected?' selected':'');const l=layers.find(l=>l.key===c.primary_gravity)||layers[1];const reason=matchReason(c);card.innerHTML=`<button class="result-open" aria-label="Open ${esc(c.name)}"><span class="result-identity"><span class="list-logo"></span><span><span class="result-title">${esc(c.name)}</span><span class="result-subtitle" style="display:block">${esc(c.primary)}</span></span></span><span class="result-description">${esc(c.tagline||c.notes||'Open profile to explore the research.')}</span><span class="result-meta"><span class="layer-dot" style="--layer-color:${l.color}">${l.name}</span><span>·</span><span>${esc(dateLabel(c.last_verified))}</span></span>${reason?`<span class="match-reason">${esc(reason)}</span>`:''}</button><button class="icon-button result-save" data-save="${esc(c.name)}" aria-label="Save ${esc(c.name)}" aria-pressed="${saved.has(c.name)}">${icon('bookmark')}</button>`;setLogo(card.querySelector('.list-logo'),c);card.querySelector('.result-open').addEventListener('click',e=>openCard(c.name,e.currentTarget));frag.append(card);}
 $('list-view').replaceChildren(frag);
}
function dateLabel(value){const m=String(value||'').match(/^\d{4}-\d{2}(?:-\d{2})?(?=$|[T ])/);if(!m)return 'Date unavailable';const monthOnly=m[0].length===7;return new Date(m[0]+(monthOnly?'-01':'')+'T12:00:00').toLocaleDateString('en-GB',monthOnly?{month:'short',year:'numeric'}:{day:'numeric',month:'short',year:'numeric'});}
// Imported Verified values are retained in the data, but are not proof that every field was checked.
function researchStatus(c){return c.placement_warning?'Needs research review':norm(c.verification)==='verified'?'Source-linked research':String(c.verification||'Review status unavailable');}
function researchScope(c){return c.verification_scope||(norm(c.verification)==='verified'?'Source links are provided. The imported profile has not been fully reverified; individual claims may need further checking.':'');}
function entityChips(values,kind){return values.filter(Boolean).map(v=>`<button class="entity-chip ${kind==='category'?'category-tag':''}" data-entity="${kind}" data-value="${esc(v)}" title="Find profiles with ${esc(v)}">${esc(v)}</button>`).join('');}
function founderNames(c){if(Array.isArray(c.founder_names))return c.founder_names;if(/^Corporate merger:/i.test(String(c.founders||'')))return [];return String(c.founders||'').split(/;|\n/).map(v=>v.trim()).filter(v=>v&&!/^(unknown|not disclosed|n\/a|undisclosed|others?)$/i.test(v)&&!/(?:founding|corporate|robotics|research) team|details? (?:to|require)|to verify|not publicly|not applicable|not a standalone|company origins|founder metric/i.test(v));}
function founderChips(c,names){const seenProfiles=new Set();return names.map(name=>{
 const profile=(c.founder_profiles||[]).find(p=>norm(p.name)===norm(name));
 let linkedin='';
 try{const url=new URL(profile?.url);if(url.protocol==='https:'&&['linkedin.com','www.linkedin.com'].includes(url.hostname)&&/^\/in\/[\p{L}\p{N}_-]+\/?$/u.test(decodeURIComponent(url.pathname)))linkedin=url.href;}catch{}
 if(linkedin&&seenProfiles.has(linkedin))return '';if(linkedin)seenProfiles.add(linkedin);
 return `<div class="founder-entry"><span class="founder-name">${esc(name)}</span>${linkedin?`<a class="founder-link" href="${esc(linkedin)}" target="_blank" rel="noopener noreferrer" aria-label="${esc(name)} on LinkedIn (opens in a new tab)" title="${esc(name)} on LinkedIn"><svg class="linkedin-mark" aria-hidden="true" viewBox="0 0 24 24"><rect x="1" y="1" width="22" height="22" rx="3" fill="currentColor"/><circle cx="6.4" cy="7" r="1.5" fill="white"/><path d="M5 10h2.8v9H5zm5 0h2.7v1.2c.6-1 1.6-1.5 2.9-1.5 2.8 0 3.4 1.8 3.4 4.1V19h-2.8v-4.6c0-1.1 0-2.4-1.5-2.4s-1.9 1.2-1.9 2.3V19H10z" fill="white"/></svg></a>`:''}</div>`;
}).join('');}
function majorEvents(c){
 const events=(c.major_events||[]).filter(e=>e.title&&e.summary&&(/^\d{4}-\d{2}(?:-\d{2})?$/.test(e.date)||(e.date===null&&e.date_status==='not_published'))&&safeUrl(e.source)).slice().sort((a,b)=>(b.date||'').localeCompare(a.date||''));
 if(!events.length)return '';
 return `<section class="card-section major-events"><div class="events-heading"><h3 id="major-events-title">Major events</h3>${events.length>1?`<div class="events-controls"><span class="events-count" aria-live="polite" aria-atomic="true">1 / ${events.length}</span><button class="icon-button" data-event-step="-1" aria-label="Previous event" aria-controls="company-events" disabled>${icon('left')}</button><button class="icon-button" data-event-step="1" aria-label="Next event" aria-controls="company-events">${icon('right')}</button></div>`:''}</div><ol id="company-events" class="event-list" tabindex="0" aria-label="Company events, use arrow keys to browse">${events.map((e,i)=>`<li class="event-item" aria-label="${i+1} of ${events.length}"><div class="event-meta"><span class="event-kind" data-event-type="${esc(norm(e.type))}">${esc(e.type)}</span>${e.date?`<time datetime="${esc(e.date)}">${esc(dateLabel(e.date))}</time>`:'<span class="event-date">Date not published</span>'}</div><h4>${esc(e.title)}</h4><p>${esc(e.summary)}</p><div class="event-footer"><span>${esc(e.status||'Reported')}</span><a href="${esc(safeUrl(e.source))}" target="_blank" rel="noopener noreferrer" aria-label="Source for ${esc(e.title)} (opens in a new tab)">Source ${icon('external')}</a></div></li>`).join('')}</ol></section>`;
}
function bindEventCarousel(){
 const track=$('company-events');if(!track)return;
 const section=track.closest('.major-events'),cards=[...track.children],previous=section.querySelector('[data-event-step="-1"]'),next=section.querySelector('[data-event-step="1"]'),count=section.querySelector('.events-count');
 if(!previous||!next)return;
 let current=0;
 const sync=()=>{
  current=cards.reduce((best,card,i)=>Math.abs(card.offsetLeft-cards[0].offsetLeft-track.scrollLeft)<Math.abs(cards[best].offsetLeft-cards[0].offsetLeft-track.scrollLeft)?i:best,0);
  previous.disabled=current===0;next.disabled=current===cards.length-1;
  const label=`${current+1} / ${cards.length}`;if(count.textContent!==label)count.textContent=label;
 };
 const go=index=>{const target=cards[Math.max(0,Math.min(cards.length-1,index))];track.scrollTo({left:target.offsetLeft-cards[0].offsetLeft,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});};
 previous.addEventListener('click',()=>go(current-1));next.addEventListener('click',()=>go(current+1));
 track.addEventListener('scroll',sync,{passive:true});
 track.addEventListener('keydown',e=>{if(e.target!==track)return;const positions={ArrowLeft:current-1,ArrowRight:current+1,Home:0,End:cards.length-1};if(e.key in positions){e.preventDefault();go(positions[e.key]);}});
 sync();
}
function companyLocation(c){
 const country=c.geography?.country||'Location unavailable';
 return `<div class="company-location" title="${esc([c.geography?.basis,c.geography?.detail].filter(Boolean).join(': '))}">${icon('location')}<span>${esc(country)}</span></div>`;
}
function openCard(name,invoker){
 const c=typeof name==='object'?name:byName.get(name);if(!c)return;state.selected=c.name;if(invoker)cardInvoker=invoker;hideTooltip();
 const website=safeUrl(c.website),founders=founderNames(c),investors=investorsFor(c),sources=companySources(c);
 const activeLayers=layers.filter(l=>c[l.key]);
 $('panel-body').innerHTML=`${c.placement_warning?`<div class="placement-warning"><strong>Research review needed</strong><p>${esc(c.placement_warning)}</p>${safeUrl(c.placement_evidence)?`<a href="${esc(safeUrl(c.placement_evidence))}" target="_blank" rel="noopener noreferrer">Placement evidence ${icon('external')}</a>`:''}</div>`:''}<div class="panel-header"><div class="panel-identity"><span class="cardlogo"></span><div><h2 id="company-name" tabindex="-1">${esc(c.name)}</h2>${website?`<a class="company-website" href="${esc(website)}" target="_blank" rel="noopener noreferrer" aria-label="Visit ${esc(c.name)} website (opens in a new tab)">Visit website ${icon('external')}</a>`:''}</div></div><div class="panel-actions"><button class="icon-button profile-bookmark" data-save="${esc(c.name)}" aria-pressed="${saved.has(c.name)}" aria-label="${saved.has(c.name)?'Unsave':'Save'} ${esc(c.name)}" title="${saved.has(c.name)?'Unsave profile':'Save profile'}">${icon('bookmark')}</button></div></div>${companyLocation(c)}${c.overview?`<section class="company-overview"><h3>What the company does</h3><p class="panel-summary">${esc(c.overview)}</p></section>`:`<p class="panel-summary">${esc(c.tagline||c.notes||'Research profile')}</p>`}<section class="card-section${c.overview?' company-map-role':''}"><h3>${c.overview?'Where it fits on the map':'Role in the ecosystem'}</h3><div class="card-tags">${entityChips([...new Set([c.primary,c.secondary])],'category')}</div><p class="why-here">${esc(c.map_role||c.placement_note||`Primary layer: ${layers.find(l=>l.key===c.primary_gravity)?.name||c.primary_gravity}. Spans ${activeLayers.map(l=>l.name.toLowerCase()).join(', ')}.`)}</p></section><section class="card-section"><h3>${esc(c.founder_heading||'Founders')}</h3>${founders.length?`<div class="founder-links">${founderChips(c,founders)}</div>`:`<p>${esc(c.founder_context||'Founder names not yet confirmed.')}</p>`}${founders.length&&c.founder_context?`<p>${esc(c.founder_context)}</p>`:''}</section><section class="card-section"><h3>Funding</h3><p class="funding-text">${esc(c.funding||'Not available in the current research.')}</p></section><section class="card-section"><h3>Investors</h3>${investors.length?`<div class="card-tags">${entityChips(investors,'investor')}</div>`:'<p>No named investors in the current research.</p>'}${c.investors?`<details class="research-details" style="margin-top:12px"><summary>Original investor notes</summary><p>${esc(c.investors)}</p></details>`:''}</section>${majorEvents(c)}${!c.overview&&norm(c.notes).replace(/\W/g,'')!==norm(c.overview||c.tagline).replace(/\W/g,'')?`<section class="card-section"><h3>Research notes</h3><p>${esc(c.notes)}</p></section>`:''}<section class="card-section"><h3>Sources</h3>${sources.length?sourceLinks(sources):'<p>No source links in the current research.</p>'}</section><section class="card-section"><h3>Explore similar profiles</h3><div class="related-list">${DATA.filter(d=>d!==c&&d.primary===c.primary).slice(0,4).map(d=>`<button data-open="${esc(d.name)}">${esc(d.name)}</button>`).join('')||'<p>No other profiles in this category.</p>'}</div></section>`;
 setLogo($('panel-body').querySelector('.cardlogo'),c);
 $('workspace').classList.add('has-selection');const panel=$('company-panel');if(!panel.open){if(innerWidth<=1100)panel.showModal();else panel.show();}
 // Reset after opening: a closed dialog has no scrollable layout yet.
 $('panel-body').scrollTop=0;bindEventCarousel();
 updateCardPosition();document.querySelectorAll('.node').forEach(b=>{b.classList.toggle('selected',b.dataset.name===c.name);b.setAttribute('aria-pressed',String(b.dataset.name===c.name));});
 document.querySelectorAll('.result-card').forEach(b=>b.classList.toggle('selected',b.querySelector('.result-save').dataset.save===c.name));
 $('company-name').focus({preventScroll:true});
 if(innerWidth>1100){const top=$('workspace').getBoundingClientRect().top;if(top>80)$('workspace').scrollIntoView({block:'start',behavior:'instant'});}
}
function updateCardPosition(){const n=matches.findIndex(c=>c.name===state.selected);$('company-position').textContent=n<0?'Outside current results':`${n+1} / ${matches.length}`;$('previous-company').disabled=n<=0;$('next-company').disabled=n<0||n>=matches.length-1;}
function closeCard(){if($('company-panel').open)$('company-panel').close();state.selected=null;$('workspace').classList.remove('has-selection');document.querySelectorAll('.selected').forEach(el=>el.classList.remove('selected'));document.querySelectorAll('.node').forEach(el=>el.setAttribute('aria-pressed','false'));const target=cardInvoker?.isConnected&&cardInvoker.getClientRects().length&&cardInvoker.getAttribute('aria-hidden')!=='true'?cardInvoker:$('search');target.focus({preventScroll:true});}
function showTooltip(c,el){if(isPhoneView()||$('company-panel').open)return;const t=$('tooltip');t.innerHTML=`<div class="tt-name">${esc(c.name)}</div><div class="tt-desc">${esc(c.tagline||c.primary)}</div><div class="tt-action">Open profile →</div>`;t.hidden=false;const rect=el.getBoundingClientRect();t.style.left=Math.max(8,Math.min(innerWidth-282,rect.left+rect.width/2-135))+'px';t.style.top=Math.max(8,Math.min(innerHeight-t.offsetHeight-8,rect.bottom+10))+'px';t.classList.add('show');el.setAttribute('aria-describedby','tooltip');}
function hideTooltip(){clearTimeout(tooltipTimer);$('tooltip').hidden=true;$('tooltip').classList.remove('show');document.querySelectorAll('[aria-describedby="tooltip"]').forEach(el=>el.removeAttribute('aria-describedby'));}
function renderInvestorOptions(){
 const counts=new Map();DATA.forEach(c=>investorsFor(c).forEach(i=>counts.set(i,(counts.get(i)||0)+1)));const q=norm($('investor-search').value);
 const entries=[...counts].filter(([n])=>norm(n).includes(q)).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]));
 $('investor-options').innerHTML=`<button class="picker-option" data-investor="" aria-pressed="${!state.investor}">All investors <small>${DATA.length}</small></button>`+entries.map(([n,count])=>`<button class="picker-option" data-investor="${esc(n)}" aria-pressed="${state.investor===n}"><span>${esc(n)}</span><small>${count}</small></button>`).join('')+(!entries.length?'<p class="picker-note">No matching investor. Try searching all fields.</p>':'');
}
function updateSavedButtons(){
 $('saved-count').textContent=saved.size;
 document.querySelectorAll('[data-save]').forEach(b=>{const active=saved.has(b.dataset.save);b.setAttribute('aria-pressed',String(active));b.setAttribute('aria-label',`${active?'Unsave':'Save'} ${b.dataset.save}`);if(b.closest('.panel-actions'))b.title=active?'Unsave profile':'Save profile';if(b.querySelector('span'))b.querySelector('span').textContent=active?'Saved':'Save profile';});
}
function toggleSave(name){if(saved.has(name))saved.delete(name);else saved.add(name);let persisted=true;try{localStorage.setItem('physical-ai-saved',JSON.stringify([...saved]));}catch{persisted=false;}updateSavedButtons();showNotice(persisted?(saved.has(name)?'Profile saved':'Profile removed from saved'):'Saved for this session. Browser storage is unavailable.');if($('saved-dialog').open)renderSaved();}
function renderSaved(){
 $('saved-list').innerHTML=saved.size?[...saved].map(n=>`<div class="collection-row"><label class="compare-check"><input type="checkbox" value="${esc(n)}" aria-label="Compare ${esc(n)}"></label><button class="open-saved" data-open="${esc(n)}">${esc(n)}<small>${esc(byName.get(n).primary)}</small></button><button class="icon-button" data-save="${esc(n)}" aria-label="Remove ${esc(n)} from saved">${icon('close')}</button></div>`).join(''):'<p>No saved profiles yet. Open a company and choose Save profile.</p>';$('compare-button').disabled=true;
}
function showComparison(){
 const selected=[...$('saved-list').querySelectorAll('input:checked')].map(i=>byName.get(i.value));if(selected.length<2||selected.length>4)return;
 const rows=[['Geography',c=>`${c.geography?.country||'Unknown'} (${c.geography?.basis||'Not established'})`],['Role',c=>c.primary],['Overview',c=>c.overview||c.tagline],['Founders',c=>founderNames(c).join(', ')||c.founder_context],['Funding',c=>c.funding],['Investors',c=>investorsFor(c).join(', ')||'No named investors in the current research.']];
 $('compare-content').innerHTML=`<table class="compare-table"><thead><tr><th scope="col">Profile</th>${selected.map(c=>`<th scope="col"><button class="compare-name" data-open="${esc(c.name)}">${esc(c.name)}</button></th>`).join('')}</tr></thead><tbody>${rows.map(([label,fn])=>`<tr><th scope="row">${label}</th>${selected.map(c=>`<td>${esc(fn(c)||'Not available')}</td>`).join('')}</tr>`).join('')}<tr><th scope="row">Website</th>${selected.map(c=>`<td>${safeUrl(c.website)?`<a href="${esc(safeUrl(c.website))}" target="_blank" rel="noopener noreferrer">Visit website ${icon('external')}</a>`:'Not available'}</td>`).join('')}</tr></tbody></table>`;
 $('compare-content').querySelector('table').style.minWidth=(110+selected.length*200)+'px';
 const mobileComparison=document.createElement('div');mobileComparison.className='mobile-comparison';
 mobileComparison.innerHTML=rows.map(([label,fn])=>`<section><h3>${esc(label)}</h3><dl>${selected.map(c=>`<div><dt><button class="compare-name" data-open="${esc(c.name)}">${esc(c.name)}</button></dt><dd>${esc(fn(c)||'Not available')}</dd></div>`).join('')}</dl></section>`).join('')+`<section><h3>Websites</h3><dl>${selected.map(c=>`<div><dt>${esc(c.name)}</dt><dd>${safeUrl(c.website)?`<a class="source-link" href="${esc(safeUrl(c.website))}" target="_blank" rel="noopener noreferrer">Visit website ${icon('external')}</a>`:'Not available'}</dd></div>`).join('')}</dl></section>`;
 $('compare-content').append(mobileComparison);
 $('compare-content').scrollLeft=0;
 $('saved-dialog').close();$('compare-dialog').showModal();
}
// Central delegation keeps every visible chip, profile and saved control actionable.
document.addEventListener('click',e=>{
 const b=e.target.closest('button');if(!b)return;
 if(b.hasAttribute('data-scope')){change({scope:b.dataset.scope});if(b.dataset.scope==='curated'&&state.scope==='all')showNotice('Investor filters search all profiles. Clear the investor filter or search to return to Curated.');}
 if(b.hasAttribute('data-view')){change({view:b.dataset.view});if(state.view==='map')requestAnimationFrame(fitMap);}
 if(b.hasAttribute('data-remove-filter'))change({[b.dataset.removeFilter]:''});
 if(b.hasAttribute('data-investor')){change({investor:b.dataset.investor});$('investor-picker').open=false;$('investor-picker').querySelector('summary').focus();}
 if(b.hasAttribute('data-entity')){const kind=b.dataset.entity,value=b.dataset.value;change(kind==='category'?{category:value,scope:'all'}:kind==='investor'?{investor:value,scope:'all'}:{q:value,field:'founders',scope:'all'});if(innerWidth<=1100)closeCard();showNotice('Showing matching profiles');}
 if(b.hasAttribute('data-geo')){change({geography:b.dataset.geo,scope:'all'});if(innerWidth<=1100)closeCard();}
 if(b.hasAttribute('data-save'))toggleSave(b.dataset.save);
 if(b.hasAttribute('data-open')){document.querySelectorAll('.modal[open]').forEach(d=>d.close());openCard(b.dataset.open,b);}
 if(b.hasAttribute('data-help')){$('help-dialog').showModal();hideTooltip();}
 if(b.hasAttribute('data-close'))$(b.dataset.close).close();
});
$('search').addEventListener('input',()=>change({q:$('search').value}));
$('search').enterKeyHint='search';
$('search').addEventListener('keydown',e=>{if(e.key==='Enter'&&isPhoneView()){e.preventDefault();$('search').blur();document.querySelector('.results-status').scrollIntoView({block:'start'});}});
$('search-field').addEventListener('change',()=>change({field:$('search-field').value}));
$('geography').addEventListener('change',()=>change({geography:$('geography').value}));
$('category').addEventListener('change',()=>change({category:$('category').value}));
$('investor-search').addEventListener('input',renderInvestorOptions);
$('investor-picker').addEventListener('toggle',()=>{if($('investor-picker').open)$('investor-search').focus();});
document.addEventListener('click',e=>{if(!$('investor-picker').contains(e.target))$('investor-picker').open=false;});
$('clear-search').onclick=()=>{change({q:''});$('search').focus();};
$('reset-filters').onclick=clearFilters;$('empty-clear').onclick=clearFilters;
$('scope-hint').onclick=$('empty-all').onclick=$('all-records').onclick=()=>change({scope:'all'});
$('show-list').onclick=()=>change({view:'list'});
$('home').onclick=()=>{closeCard();Object.assign(state,{scope:'curated',view:isPhoneView()?'list':'map'});clearFilters();fitMap();};
$('mobile-filters').onclick=()=>{const expanded=$('filter-controls').classList.toggle('expanded');$('mobile-filters').setAttribute('aria-expanded',String(expanded));$('mobile-filters').setAttribute('aria-label',expanded?'Hide filters':'Show filters');};
$('fit-map').onclick=fitMap;$('zoom-in').onclick=()=>zoomBy(1.3);$('zoom-out').onclick=()=>zoomBy(1/1.3);
$('close-company').onclick=closeCard;
$('company-panel').addEventListener('cancel',e=>{e.preventDefault();closeCard();});
$('previous-company').onclick=()=>{const n=matches.findIndex(c=>c.name===state.selected);if(n>0)openCard(matches[n-1].name);};
$('next-company').onclick=()=>{const n=matches.findIndex(c=>c.name===state.selected);if(n>=0&&n<matches.length-1)openCard(matches[n+1].name);};
$('saved-button').onclick=()=>{renderSaved();$('saved-dialog').showModal();};
$('saved-list').addEventListener('change',e=>{const count=$('saved-list').querySelectorAll('input:checked').length;if(count>4){e.target.checked=false;showNotice('Select up to four profiles to compare.');}const n=$('saved-list').querySelectorAll('input:checked').length;$('compare-button').disabled=n<2||n>4;$('compare-button').textContent=n>=2?`Compare ${n} profiles`:'Compare selected';});
$('compare-button').onclick=showComparison;
document.addEventListener('keydown',e=>{
 if(e.key==='Tab'){
  const dialog=document.querySelector('dialog:modal:last-of-type')||document.querySelector('dialog:modal');
  if(dialog){const controls=[...dialog.querySelectorAll('button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled),summary,[tabindex="0"]')].filter(el=>el.getClientRects().length);const first=controls[0],last=controls.at(-1);if(controls.length&&(e.shiftKey&&(document.activeElement===first||!dialog.contains(document.activeElement))||!e.shiftKey&&document.activeElement===last)){e.preventDefault();(e.shiftKey?last:first).focus();}}
 }
 const editing=e.target.matches('input,textarea,select');if(e.key==='/'&&!editing&&!document.querySelector('dialog:modal')){e.preventDefault();$('search').focus();}if(e.key==='Escape'){hideTooltip();$('investor-picker').open=false;if($('company-panel').open&&!document.querySelector('.modal[open]')){e.preventDefault();closeCard();}}});
let drag=null;const viewport=$('map-viewport');
viewport.addEventListener('pointerdown',e=>{if(e.pointerType!=='mouse'||e.button!==0||e.target.closest('button'))return;drag={x:e.clientX,y:e.clientY,left:viewport.scrollLeft,top:viewport.scrollTop};viewport.setPointerCapture(e.pointerId);viewport.classList.add('dragging');});
viewport.addEventListener('pointermove',e=>{if(drag){viewport.scrollLeft=drag.left+drag.x-e.clientX;viewport.scrollTop=drag.top+drag.y-e.clientY;hideTooltip();}});
for(const event of ['pointerup','pointercancel'])viewport.addEventListener(event,()=>{drag=null;viewport.classList.remove('dragging');});
viewport.addEventListener('scroll',hideTooltip,{passive:true});
let resizeTimer;new ResizeObserver(()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>{if(zoom===1)fitMap();},100);}).observe(viewport);
const mobileDialog=matchMedia('(max-width:1100px)');mobileDialog.addEventListener('change',()=>{const p=$('company-panel');if(p.open){p.close();if(mobileDialog.matches)p.showModal();else p.show();$('company-name').focus({preventScroll:true});}});
// Keep the phone search field wide; advanced search mode remains available in Filters.
const phoneQuery=matchMedia(phoneMedia);
$('mobile-filters').insertAdjacentHTML('beforeend','<span class="phone-filter-label">Filters</span>');
const searchMode=document.createElement('div');searchMode.className='mobile-search-mode';
searchMode.innerHTML='<label for="search-field">Search in</label>';$('filter-controls').prepend(searchMode);
const phoneLayers=document.createElement('div');phoneLayers.className='phone-layer-filters';phoneLayers.innerHTML='<span class="phone-layer-label">Ecosystem layer</span>';$('filter-controls').append(phoneLayers);
const showResults=document.createElement('button');showResults.id='show-filter-results';showResults.className='button primary phone-results-button';
showResults.onclick=()=>{$('filter-controls').classList.remove('expanded');$('mobile-filters').setAttribute('aria-expanded','false');$('mobile-filters').setAttribute('aria-label','Show filters');$('investor-picker').open=false;showResults.blur();document.querySelector('.results-status').scrollIntoView({block:'start'});};
$('filter-controls').append(showResults);
const mapHint=document.createElement('p');mapHint.className='phone-map-hint';mapHint.textContent='Swipe to explore the map. Tap a company for details.';$('map-frame').prepend(mapHint);
function syncPhoneControls(){
 (phoneQuery.matches?searchMode:document.querySelector('.search-box')).append($('search-field'));
 if(phoneQuery.matches)phoneLayers.append($('layers'));else document.querySelector('.browse-bar').insertBefore($('layers'),document.querySelector('.view-controls'));
 $('fit-map').textContent=phoneQuery.matches?'Reset map':'Fit map';
 if(layout)fitMap();
}
phoneQuery.addEventListener('change',syncPhoneControls);syncPhoneControls();
$('category').insertAdjacentHTML('beforeend',categories.map(c=>`<option value="${esc(c)}">${esc(c)}</option>`).join(''));
$('layers').innerHTML=layers.map(l=>`<button class="layer-chip" style="--layer-color:${l.color}" data-layer="${l.key}" aria-pressed="false">${l.name}</button>`).join('');
$('layers').addEventListener('click',e=>{const b=e.target.closest('[data-layer]');if(b)change({layer:state.layer===b.dataset.layer?'':b.dataset.layer});});
$('help-layers').innerHTML=layers.map(l=>`<button data-help-layer="${l.key}" title="${esc(l.desc)}"><span class="layer-dot" style="--layer-color:${l.color}">${l.name}</span> →</button>`).join('');
$('help-layers').addEventListener('click',e=>{const b=e.target.closest('[data-help-layer]');if(b){$('help-dialog').close();change({layer:b.dataset.helpLayer});}});
$('core-count').textContent=core.length;$('all-count').textContent=$('total-records').textContent=DATA.length;
const latest=DATA.map(c=>String(c.last_verified||'').slice(0,10)).filter(d=>/^\d{4}-\d{2}-\d{2}$/.test(d)).sort().at(-1);
$('freshness').textContent=`${DATA.length} profiles · Latest research ${dateLabel(latest)}`;
render();
