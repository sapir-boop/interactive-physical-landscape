// Static regression checks. These validate the local content and rendering helpers,
// not the accuracy or availability of the external sources.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const data = JSON.parse(read('index.html').match(/const DATA=(\[[\s\S]*?\]);<\/script>/)[1]);
const app = read('assets/app.js');
const byName = new Map(data.map(c => [c.name, c]));
// Validate announcement dates against today's date, not the original rollout day.
const reviewDate = new Date().toISOString().slice(0, 10);
assert.equal(byName.size, data.length, 'Duplicate company names');
assert(data.length >= 221, 'Existing profiles must not be removed');
const ctx = {URL,icon:()=>''};
vm.createContext(ctx);
// Evaluate only pure formatting helpers, without a browser or application state.
vm.runInContext(app.match(/^const norm = .+$/m)[0] + app.match(/^const esc = .+$/m)[0]
  + app.slice(app.indexOf('const alias ='), app.indexOf('const index ='))
  + app.slice(app.indexOf('function safeUrl('), app.indexOf('function sourceLinks('))
  + app.slice(app.indexOf('function dateLabel('), app.indexOf('// Imported Verified'))
  + app.slice(app.indexOf('function founderNames('), app.indexOf('function bindEventCarousel(')), ctx);
const http = value => {const u = new URL(value); assert(['https:', 'http:'].includes(u.protocol), value);};
const cleanName = s => s.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const missingLogos = [];
let eventCount = 0, visibleFounderLinks = 0;
for (const c of data) {
  assert(c.overview?.trim() && c.map_role?.trim(), c.name + ': missing explanation');
  assert(c.overview_sources?.length, c.name + ': missing overview evidence');
  c.overview_sources.forEach(http);
  assert(!/[\u2014]/.test(c.overview + c.map_role), c.name + ': em dash in overview');
  if(c.website)http(c.website);
  const logos = c.logo_candidates || [];
  assert(logos.every(p => /^assets\/logos\/[a-z0-9-]+\.png$/i.test(p)), c.name + ': external logo');
  if (!logos.some(p => fs.existsSync(path.join(root,p)))) missingLogos.push(c.name);
  ctx.c = c;
  const names = vm.runInContext('founderNames(c)', ctx);
  assert(names.every(n => !/founding team|to verify|details.*verify|^unknown$/i.test(n)), c.name + ': founder placeholder');
  const rendered = vm.runInContext('founderChips(c,founderNames(c))',ctx);
  const renderedLinks = (rendered.match(/class="founder-link"/g) || []).length;
  assert.equal(renderedLinks, (c.founder_profiles || []).length, c.name + ': hidden founder link');
  visibleFounderLinks += renderedLinks;
  for(const p of c.founder_profiles || []) {
    assert(names.some(n => cleanName(n) === cleanName(p.name)), c.name + ': link name mismatch');
    const u = new URL(p.url);
    assert(u.protocol === 'https:' && ['linkedin.com','www.linkedin.com'].includes(u.hostname)
      && /^\/in\/[\p{L}\p{N}_-]+\/?$/u.test(decodeURIComponent(u.pathname)), c.name + ': not a personal LinkedIn URL');
    http(p.source);assert(p.evidence, c.name + ': missing identity evidence');
  }
  const investors = vm.runInContext('investorsFor(c)',ctx);
  assert(!investors.some(s => /^additional investors|^others? historically|to verify|not disclosed/i.test(s)), c.name + ': investor placeholder');
  const sources = vm.runInContext('companySources(c)',ctx);
  assert(sources.length, c.name + ': no displayed sources');
  const events = c.major_events || [];
  assert.deepEqual(events.map(e=>e.date||''),events.map(e=>e.date||'').sort().reverse(),c.name + ': event order');
  assert.equal((vm.runInContext('majorEvents(c)',ctx).match(/class="event-item"/g)||[]).length,events.length,c.name+': hidden event');
  const keys = new Set();
  for(const e of events) {
    for(const k of ['type','title','summary','status','source']) assert(e[k]?.trim(), c.name + ': event missing ' + k);
    if(e.date===null) {
      assert.equal(e.date_status,'not_published',c.name+': undated event needs explicit provenance state');
    } else {
    assert(/^\d{4}-\d{2}(-\d{2})?$/.test(e.date), c.name + ': date precision');
    const date = e.date.length === 7 ? e.date + '-01' : e.date;
    assert(new Date(date).toISOString().startsWith(date),c.name + ': invalid calendar date');
    assert(date <= reviewDate,c.name + ': future announcement dated as completed');
    }
    assert(['Acquisition','Funding','Milestone','Partnership','Revenue','Technology'].includes(e.type));
    assert(!/[\u2014]/.test(e.title + e.summary),c.name + ': em dash in event');
    http(e.source);
    const key=e.date+' '+e.source;assert(!keys.has(key),c.name+': duplicate event');keys.add(key);
    eventCount++;
  }
}
assert.deepEqual(missingLogos.sort(),['RoboData','Tactum Labs']);

// Preserve the specific content defects that prompted this review.
for(const [name,good,bad] of [
  ['Ambarella',/chips/i,/Cerebras|Feldman|wafer.scale/i],
  ['Renesas',/chips|semiconductor/i,/Roboticore|Iversen|Danish robot/i],
  ['Texas Instruments',/motor/i,/Intrinsic|Beard|Gerkey/i],
  ['Horizon Robotics',/driving/i,/Esperanto|Ditzel/i]
]) {
  const c=byName.get(name); assert(good.test(c.overview),name);assert(!bad.test(JSON.stringify(c)),name+': wrong company data');
}
for(const [name,pattern] of [
  ['Figure AI',/Helix 2\.5/],['1X',/50,000/],['DYNA Robotics',/850.*napkins/],
  ['Skild AI',/Zero-shot/],['Generalist',/GEN-1/],['General Robotics / GRID',/automated robot engineering/]
])assert(byName.get(name).major_events.some(e=>pattern.test(e.title)),name+': requested technical milestone missing');
assert(/\$1\.2B.*closed/.test(byName.get('Wayve').funding) && /milestone/.test(byName.get('Wayve').funding));
assert(!/acquired by Siemens|Siemens.*acquisition.*10B/i.test(byName.get('Claroty').funding));
assert(!/Amazon.*owner/i.test(byName.get('Covariant / Amazon Robotics').canonical_investors.join(' ')));
assert.equal(byName.get('Human Archive').founder_names.length,4);
assert.equal(byName.get('Config').founder_names.length,4);
for(const name of ['EmbodyX','Hub.xyz','RoboData','UMA / Universal Mechanical Assistant','Tau Robotics']) {
  assert(byName.get(name).major_events?.length,name+': researched event missing');
}
ctx.sample={major_events:[
  {date:null,date_status:'not_published',title:'Undated',summary:'Confirmed announcement',type:'Milestone',source:'https://example.com/undated'},
  {date:'2026-06-03',title:'Dated',summary:'Confirmed announcement',type:'Technology',source:'https://example.com/dated'},
  {title:'Incomplete',summary:'No date provenance',source:'https://example.com/incomplete'},
  {date:null,date_status:'not_published',title:'Unsafe source',summary:'Invalid link',source:'javascript:alert(1)'}
]};
const eventMarkup=vm.runInContext('majorEvents(sample)',ctx);
assert(eventMarkup.indexOf('<h4>Dated</h4>')<eventMarkup.indexOf('<h4>Undated</h4>'));
assert(eventMarkup.includes('Date not published') && !eventMarkup.includes('datetime="null"'));
assert(!eventMarkup.includes('Incomplete') && !eventMarkup.includes('Unsafe source'));

const report={checkedAt:new Date().toISOString(),profiles:data.length,curated:data.filter(c=>c.status.toLowerCase()==='core').length,
  profilesWithEvents:data.filter(c=>c.major_events?.length).length,eventCount,visibleFounderLinks,expectedLogoFallbacks:missingLogos,
  result:'passed',limits:'Static consistency and known-content regression checks only. Not independent fact checking or a browser network test.'};
fs.mkdirSync(path.join(root,'test-results'),{recursive:true});
fs.writeFileSync(path.join(root,'test-results/profile-data-verification.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
