'use strict';
// Pure layout code shared by the page and the placement audit. No network or DOM access.
(function(root){
 const anchors={brain:[.5,.5],data:[.5,.035],hardware:[.5,.963],infra:[.078,.5],deployment:[.916,.5]};
 function nearestLayer(x,y){return Object.keys(anchors).reduce((best,key)=>{const a=anchors[key],b=anchors[best];return (x-a[0])**2+(y-a[1])**2<(x-b[0])**2+(y-b[1])**2?key:best;},'brain');}
 function memberships(c){return Object.keys(anchors).filter(k=>c[k]||c.primary_gravity===k);}
 function assign(costs){
  const n=costs.length,m=costs[0].length,u=new Float64Array(n+1),v=new Float64Array(m+1),assignment=new Int32Array(m+1),way=new Int32Array(m+1);
  for(let i=1;i<=n;i++){
   assignment[0]=i;let j0=0;const min=new Float64Array(m+1).fill(Infinity),used=new Uint8Array(m+1);
   do{used[j0]=1;const i0=assignment[j0];let delta=Infinity,j1=0;
    for(let j=1;j<=m;j++)if(!used[j]){const cost=costs[i0-1][j-1]-u[i0]-v[j];if(cost<min[j]){min[j]=cost;way[j]=j0;}if(min[j]<delta){delta=min[j];j1=j;}}
    for(let j=0;j<=m;j++)if(used[j]){u[assignment[j]]+=delta;v[j]-=delta;}else min[j]-=delta;
    j0=j1;
   }while(assignment[j0]!==0);
   do{const j1=way[j0];assignment[j0]=assignment[j1];j0=j1;}while(j0!==0);
  }
  return assignment;
 }
 function makeLayout(records){
  const ordered=[...records].sort((a,b)=>(Number(a.display_order)||9999)-(Number(b.display_order)||9999)||a.name.localeCompare(b.name));
  for(let attempt=0;attempt<10;attempt++){
   const grow=1.1**attempt,width=Math.ceil((records.length>120?1800:1200)*grow),height=Math.ceil((records.length>120?1370:810)*grow),slots=[];
   for(let y=Math.max(100,height*.035+62);y<height*.963-62;y+=88)for(let x=85;x<width-80;x+=86){if([.078,.5,.916].some(ax=>Math.abs(x-width*ax)<95&&Math.abs(y-height/2)<64))continue;slots.push({x,y,region:nearestLayer(x/width,y/height)});}
   if(slots.length<records.length)continue;
   const costs=ordered.map(c=>{const allowed=memberships(c),tx=Math.max(0,Math.min(1,Number(c.x)||.5))*width,ty=Math.max(0,Math.min(1,Number(c.y)||.5))*height;return slots.map(slot=>{
    // A hard semantic constraint: never solve crowding by placing a company in an unrelated layer.
    if(!allowed.includes(slot.region))return 1e12;
    const primaryPenalty=slot.region===c.primary_gravity?0:width*height*.012;
    return (tx-slot.x)**2+(ty-slot.y)**2+primaryPenalty;
   });});
   const assignment=assign(costs),points=new Map();let invalid=false;
   for(let j=1;j<=slots.length;j++)if(assignment[j]){const row=assignment[j]-1;if(costs[row][j-1]>=1e12){invalid=true;break;}points.set(ordered[row].name,slots[j-1]);}
   if(!invalid)return {width,height,points};
  }
  throw new Error('No semantically valid map layout. Use list view and review placement memberships.');
 }
 const api={anchors,nearestLayer,memberships,makeLayout};root.LandscapeLayout=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
