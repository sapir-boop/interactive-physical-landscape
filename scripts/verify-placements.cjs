const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {makeLayout,memberships,nearestLayer}=require('../assets/layout.js');
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const data=JSON.parse(html.match(/const DATA=(\[[\s\S]*?\]);<\/script>/)[1]);
const report={checkedAt:new Date().toISOString(),scopes:[]};
assert.equal(new Set(data.map(c=>c.name)).size,data.length);
for(const records of [data.filter(c=>c.status.toLowerCase()==='core'),data]){
 const l=makeLayout(records),positions=records.map(c=>({c,p:l.points.get(c.name)}));assert.equal(l.points.size,records.length);
 const invalid=positions.filter(({c,p})=>!memberships(c).includes(nearestLayer(p.x/l.width,p.y/l.height))).map(({c})=>c.name);
 assert.deepEqual(invalid,[],'Every displayed company must be inside a supported layer region');
 for(const {c,p} of positions){assert(memberships(c).includes(c.primary_gravity),c.name);assert(p.x>=37&&p.y>=41&&p.x+37<=l.width&&p.y+43<=l.height,c.name);}
 for(let i=0;i<positions.length;i++)for(let j=i+1;j<positions.length;j++){const a=positions[i].p,b=positions[j].p;assert(Math.abs(a.x-b.x)>=74||Math.abs(a.y-b.y)>=82,'Company targets must not overlap');}
 report.scopes.push({count:records.length,width:l.width,height:l.height,unrelatedRegions:invalid,records:positions.map(({c,p})=>({name:c.name,primaryLayer:c.primary_gravity,displayRegion:nearestLayer(p.x/l.width,p.y/l.height),x:p.x/l.width,y:p.y/l.height}))});
}
for(const name of ['Skild AI','World Labs','Rhoda AI']){const c=data.find(c=>c.name===name);assert.equal(c.primary_gravity,'brain');}
for(const name of ['Waymo','Zoox','Aurora','Kodiak Robotics']){const c=data.find(c=>c.name===name);assert(c.deployment&&c.brain);assert(c.x>.7);}
assert(data.find(c=>c.name==='Intrinsic').infra);
assert.equal(data.find(c=>c.name==='Wandelbots').primary_gravity,'infra');
fs.mkdirSync(path.join(root,'test-results'),{recursive:true});
fs.writeFileSync(path.join(root,'test-results/placement-verification.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({profiles:data.length,scopes:report.scopes.map(({records,...s})=>s)},null,2));
