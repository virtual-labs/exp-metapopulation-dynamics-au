const Chart=(()=>{function draw(cv,series,opts={}){const dpr=window.devicePixelRatio||1;const cssW=cv.clientWidth||cv.width,cssH=cssW*(opts.ratio||0.52);cv.width=cssW*dpr;cv.height=cssH*dpr;const g=cv.getContext('2d');g.setTransform(dpr,0,0,dpr,0,0);const W=cssW,H=cssH,m={l:58,r:18,t:16,b:44};g.clearRect(0,0,W,H);let xs=[],ys=[];series.forEach(s=>s.data.forEach(p=>{xs.push(p[0]);ys.push(p[1]);}));if(!xs.length){g.fillStyle='#9aa3b2';g.font='15px Segoe UI';g.textAlign='center';g.fillText('Press "Run" to see results',W/2,H/2);cv._series=null;return;}let xmin=Math.min(...xs),xmax=Math.max(...xs),ymin=Math.min(0,...ys),ymax=Math.max(...ys);if(xmax===xmin)xmax=xmin+1;if(ymax===ymin)ymax=ymin+1;ymax+=(ymax-ymin)*0.08;const X=x=>m.l+(x-xmin)/(xmax-xmin)*(W-m.l-m.r);const Y=y=>H-m.b-(y-ymin)/(ymax-ymin)*(H-m.t-m.b);g.font='12px Segoe UI';const nT=6;for(let i=0;i<=nT;i++){const gy=ymin+(ymax-ymin)*i/nT;g.strokeStyle='#eef1f6';g.beginPath();g.moveTo(m.l,Y(gy));g.lineTo(W-m.r,Y(gy));g.stroke();g.fillStyle='#7b8494';g.textAlign='right';g.textBaseline='middle';g.fillText(fmt(gy),m.l-8,Y(gy));}for(let i=0;i<=nT;i++){const gx=xmin+(xmax-xmin)*i/nT;g.strokeStyle='#f4f6fa';g.beginPath();g.moveTo(X(gx),m.t);g.lineTo(X(gx),H-m.b);g.stroke();g.fillStyle='#7b8494';g.textAlign='center';g.textBaseline='top';g.fillText(fmt(gx),X(gx),H-m.b+6);}g.strokeStyle='#c7ccd6';g.beginPath();g.moveTo(m.l,m.t);g.lineTo(m.l,H-m.b);g.lineTo(W-m.r,H-m.b);g.stroke();g.fillStyle='#4a5261';g.font='13px Segoe UI';if(opts.xlabel){g.textAlign='center';g.fillText(opts.xlabel,(m.l+W-m.r)/2,H-10);}if(opts.ylabel){g.save();g.translate(15,(m.t+H-m.b)/2);g.rotate(-Math.PI/2);g.textAlign='center';g.fillText(opts.ylabel,0,0);g.restore();}series.forEach(s=>{if(!s.data.length)return;g.strokeStyle=s.color;g.lineWidth=2.4;g.beginPath();s.data.forEach((p,i)=>{const px=X(p[0]),py=Y(p[1]);i?g.lineTo(px,py):g.moveTo(px,py);});g.stroke();g.fillStyle=s.color;s.data.forEach(p=>{g.beginPath();g.arc(X(p[0]),Y(p[1]),2.3,0,7);g.fill();});});cv._series=series;cv._map={xmin,xmax,ymin,ymax,m,W,H};}
function fmt(v){const a=Math.abs(v);if(a>=1000)return(v/1000).toFixed(1)+'k';if(a>0&&a<1)return v.toFixed(2);if(!Number.isInteger(v))return v.toFixed(1);return''+v;}return{draw};})();

let model=0,sim=null,anim=null,frame=0;

function switchModel(){model=+document.getElementById('model').value;document.querySelectorAll('.cset').forEach(c=>c.classList.toggle('active',+c.dataset.c===model));stopAnim();sim=null;frame=0;Chart.draw(document.getElementById('chart'),[]);clearField();document.getElementById('legend').innerHTML='';document.getElementById('counts').textContent='';document.getElementById('readout').textContent='';}
function g(id){return +document.getElementById(id).value;}
function levins(P,c,e,h){return c*(h-P)*(P-e);}
function integrate(){
  if(model===0){
    const h=g('h'),c=g('c'),e=g('e'),years=Math.round(g('t'));let P=[g('ip')];const T=[0];const hh=1;
    for(let i=0;i<years;i++){
      const k1=levins(P[i],c,e,h),k2=levins(P[i]+.5*hh*k1,c,e,h),k3=levins(P[i]+.5*hh*k2,c,e,h),k4=levins(P[i]+hh*k3,c,e,h);
      P[i+1]=Math.max(0,Math.min(h,P[i]+(hh/6)*(k1+2*k2+2*k3+k4)));T[i+1]=i+1;
    }
    return {P,T,years,h};
  }else{
    const n0=g('n'),d=g('disp'),rg=g('rgood'),rb=g('rbad'),indep=g('idp')>=1,years=Math.round(g('runlen'));
    const n1=[n0],n2=[n0],T=[0];
    for(let i=0;i<years;i++){
      const r1=Math.random()<0.5?rb:rg;
      let r2;if(indep)r2=Math.random()<0.5?rb:rg;else r2=(r1===rg)?rb:rg;
      n1[i+1]=r1*((1-d)*n1[i]+d*n2[i]);
      n2[i+1]=r2*((1-d)*n2[i]+d*n1[i]);
      T[i+1]=i+1;
    }
    return {n1,n2,T,years};
  }
}
function run(){stopAnim();sim=integrate();frame=sim.years;drawChart();drawField(frame);info(frame);toast('Model integrated');}
function drawChart(){
  if(!sim){Chart.draw(document.getElementById('chart'),[]);return;}
  if(model===0){
    Chart.draw(document.getElementById('chart'),[{color:'#1B9EB3',data:sim.T.map((t,i)=>[t,sim.P[i]])}],{xlabel:'Number of years',ylabel:'Occupied patches (P)',ratio:0.5});
    document.getElementById('plotTitle').textContent='Levins model — occupied patches over time';
    document.getElementById('legend').innerHTML='<span><i style="background:#1B9EB3"></i>Occupied patches</span>';
  }else{
    Chart.draw(document.getElementById('chart'),[
      {color:'#b50246',data:sim.T.map((t,i)=>[t,sim.n1[i]])},
      {color:'#0e7c86',data:sim.T.map((t,i)=>[t,sim.n2[i]])}
    ],{xlabel:'Number of years',ylabel:'Population size',ratio:0.5});
    document.getElementById('plotTitle').textContent='Metapopulation stability — two patches';
    document.getElementById('legend').innerHTML='<span><i style="background:#b50246"></i>Patch 1</span><span><i style="background:#0e7c86"></i>Patch 2</span>';
  }
}
function clearField(){const cv=document.getElementById('field');const c=cv.getContext('2d');c.clearRect(0,0,cv.width,cv.height);}
function drawField(i){
  const cv=document.getElementById('field');const dpr=window.devicePixelRatio||1;const W=cv.clientWidth,H=W*0.36;
  cv.width=W*dpr;cv.height=H*dpr;const c=cv.getContext('2d');c.setTransform(dpr,0,0,dpr,0,0);c.clearRect(0,0,W,H);
  if(!sim)return;
  if(model===0){
    const h=sim.h,occ=Math.round(sim.P[i]);const cols=Math.ceil(Math.sqrt(h*W/H)),rows=Math.ceil(h/cols);
    const cw=(W-20)/cols,ch=(H-20)/rows,pad=6;let k=0;
    for(let r=0;r<rows;r++)for(let cI=0;cI<cols;cI++){if(k>=h)break;const x=10+cI*cw,y=10+r*ch;
      c.fillStyle=k<occ?'#1f9d55':'#d7ded8';c.strokeStyle='#b9c3bc';
      roundRect(c,x+pad/2,y+pad/2,cw-pad,ch-pad,6);c.fill();c.stroke();
      if(k<occ){c.fillStyle='#0d5c31';c.font='14px serif';c.textAlign='center';c.textBaseline='middle';c.fillText('🌿',x+cw/2,y+ch/2);}
      k++;}
  }else{
    const maxN=Math.max(10,...sim.n1,...sim.n2);const scale=90/maxN;
    const p1=Math.min(120,Math.round(sim.n1[i]*scale)),p2=Math.min(120,Math.round(sim.n2[i]*scale));
    c.strokeStyle='#c7ccd6';c.strokeRect(8,8,W/2-12,H-16);c.strokeRect(W/2+4,8,W/2-12,H-16);
    c.fillStyle='#7b8494';c.font='12px Segoe UI';c.textAlign='center';c.fillText('Patch 1',W/4,H-4);c.fillText('Patch 2',3*W/4,H-4);
    c.font='15px serif';c.textBaseline='middle';
    for(let k=0;k<p1;k++)c.fillText('🐀',16+Math.random()*(W/2-32),16+Math.random()*(H-40));
    for(let k=0;k<p2;k++)c.fillText('🐍',W/2+12+Math.random()*(W/2-32),16+Math.random()*(H-40));
  }
}
function roundRect(c,x,y,w,h,r){c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath();}
function info(i){
  if(!sim)return;
  if(model===0){document.getElementById('counts').innerHTML=`Occupied patches: <b>${Math.round(sim.P[i])}</b> / ${sim.h}`;
    document.getElementById('readout').textContent=`Year ${sim.T[i]} · equilibrium occupancy approaches h when colonization exceeds extinction.`;}
  else{document.getElementById('counts').innerHTML=`Patch 1: <b>${Math.round(sim.n1[i])}</b> &nbsp; Patch 2: <b>${Math.round(sim.n2[i])}</b> &nbsp; Total: <b>${Math.round(sim.n1[i]+sim.n2[i])}</b>`;
    document.getElementById('readout').textContent=`Year ${sim.T[i]} of ${sim.years}.`;}
}
function play(){if(!sim)run();if(anim){stopAnim();return;}document.getElementById('playBtn').textContent='Pause ⏸';let i=(frame>=sim.years)?0:frame;anim=setInterval(()=>{if(i>sim.years){stopAnim();return;}frame=i;drawField(i);info(i);i++;},220);}
function stopAnim(){if(anim){clearInterval(anim);anim=null;}document.getElementById('playBtn').textContent='Play ▶';}
function step(){if(!sim)run();stopAnim();frame=(frame>=sim.years)?0:frame+1;drawField(frame);info(frame);}
function sync(){document.querySelectorAll('.controls .val').forEach(v=>{const id=v.id.slice(2);const el=document.getElementById(id);if(!el)return;if(id==='idp')v.textContent=el.value>=1?'Yes':'No';else v.textContent=el.value;});}
const D={h:10,c:0.1,ip:1,e:0.04,t:20,n:50,disp:0.25,rgood:1.25,rbad:0.75,idp:1,runlen:30};
function resetSim(){stopAnim();for(const k in D)document.getElementById(k).value=D[k];sync();sim=null;frame=0;Chart.draw(document.getElementById('chart'),[]);clearField();document.getElementById('legend').innerHTML='';document.getElementById('counts').textContent='';document.getElementById('readout').textContent='';toast('Simulator reset');}
function downloadPNG(){const cv=document.getElementById('chart');if(!cv._series){toast('Run first');return;}const o=document.createElement('canvas');o.width=cv.width;o.height=cv.height;const c=o.getContext('2d');c.fillStyle='#fff';c.fillRect(0,0,o.width,o.height);c.drawImage(cv,0,0);const a=document.createElement('a');a.download='metapopulation.png';a.href=o.toDataURL();a.click();toast('PNG downloaded');}
function downloadCSV(){if(!sim){toast('Run first');return;}let csv;if(model===0){csv='year,occupied_patches\n';for(let i=0;i<=sim.years;i++)csv+=sim.T[i]+','+sim.P[i]+'\n';}else{csv='year,patch1,patch2\n';for(let i=0;i<=sim.years;i++)csv+=sim.T[i]+','+sim.n1[i]+','+sim.n2[i]+'\n';}dl(csv,'metapopulation.csv','text/csv');toast('CSV downloaded');}
function saveRun(){const o={model};document.querySelectorAll('.controls input,.controls select').forEach(i=>o[i.id]=i.value);localStorage.setItem('metapop',JSON.stringify(o));toast('Run saved');}
function loadRun(){const s=localStorage.getItem('metapop');if(!s){toast('No saved run');return;}const o=JSON.parse(s);for(const k in o){const el=document.getElementById(k);if(el)el.value=o[k];}switchModel();sync();run();toast('Run loaded');}
function dl(t,n,ty){const b=new Blob([t],{type:ty});const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=n;a.click();URL.revokeObjectURL(a.href);}
function toast(m){const t=document.getElementById('toast');t.textContent=m;t.classList.add('show');clearTimeout(t._t);t._t=setTimeout(()=>t.classList.remove('show'),2200);}


sync();window.addEventListener('resize',()=>{if(sim){drawChart();drawField(frame);}});

/* ---- fullscreen (whole simulation box) ---- */
function toggleFS(){var el=document.getElementById('simbox');var fsEl=document.fullscreenElement||document.webkitFullscreenElement;if(!fsEl){var rq=el.requestFullscreen||el.webkitRequestFullscreen;if(rq)rq.call(el);}else{var ex=document.exitFullscreen||document.webkitExitFullscreen;if(ex)ex.call(document);}}
function _fsSync(){var b=document.getElementById('fsBtn');var on=document.fullscreenElement||document.webkitFullscreenElement;if(b)b.textContent=on?'✕':'⛶';setTimeout(function(){window.dispatchEvent(new Event('resize'));},70);}
document.addEventListener('fullscreenchange',_fsSync);
document.addEventListener('webkitfullscreenchange',_fsSync);
