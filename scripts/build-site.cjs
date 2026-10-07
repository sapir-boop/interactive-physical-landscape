const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const destination=path.join(root,'dist');
// Only this generated deployment directory is replaced. Canonical source stays at the root.
fs.rmSync(destination,{recursive:true,force:true});fs.mkdirSync(path.join(destination,'assets','logos'),{recursive:true});
const files=['index.html','NOTICE.txt','assets/styles.css','assets/layout.js','assets/app.js','assets/analytics.js',...fs.readdirSync(path.join(root,'assets/logos')).filter(f=>f.endsWith('.png')).sort().map(f=>'assets/logos/'+f)];
const hash=crypto.createHash('sha256');
for(const file of files){const buffer=fs.readFileSync(path.join(root,file));hash.update(file);hash.update(buffer);fs.copyFileSync(path.join(root,file),path.join(destination,file));}
const release={release:hash.digest('hex'),builtAt:new Date().toISOString(),profiles:JSON.parse(fs.readFileSync(path.join(root,'index.html'),'utf8').match(/const DATA=(\[[\s\S]*?\]);<\/script>/)[1]).length};
fs.writeFileSync(path.join(destination,'release.json'),JSON.stringify(release,null,2)+'\n');
console.log(JSON.stringify({directory:destination,files:files.length,...release},null,2));
