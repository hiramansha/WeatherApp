const $=id=>document.getElementById(id);
const WMO={0:['Clear sky','☀️','🌙','clear'],1:['Mainly clear','🌤️','🌙','clear'],2:['Partly cloudy','⛅','☁️','cloudy'],3:['Overcast','☁️','☁️','cloudy'],45:['Fog','🌫️','🌫️','fog'],48:['Rime fog','🌫️','🌫️','fog'],51:['Light drizzle','🌦️','🌧️','rain'],53:['Drizzle','🌦️','🌧️','rain'],55:['Heavy drizzle','🌧️','🌧️','rain'],56:['Freezing drizzle','🌧️','🌧️','rain'],57:['Freezing drizzle','🌧️','🌧️','rain'],61:['Light rain','🌦️','🌧️','rain'],63:['Rain','🌧️','🌧️','rain'],65:['Heavy rain','🌧️','🌧️','rain'],66:['Freezing rain','🌧️','🌧️','rain'],67:['Freezing rain','🌧️','🌧️','rain'],71:['Light snow','🌨️','🌨️','snow'],73:['Snow','❄️','❄️','snow'],75:['Heavy snow','❄️','❄️','snow'],77:['Snow grains','❄️','❄️','snow'],80:['Showers','🌦️','🌧️','rain'],81:['Showers','🌧️','🌧️','rain'],82:['Violent showers','🌧️','🌧️','rain'],85:['Snow showers','🌨️','🌨️','snow'],86:['Snow showers','🌨️','🌨️','snow'],95:['Thunderstorm','⛈️','⛈️','storm'],96:['Thunderstorm, hail','⛈️','⛈️','storm'],99:['Thunderstorm, hail','⛈️','⛈️','storm']};
const info=(c,d)=>{const w=WMO[c]||WMO[0];return{t:w[0],i:d?w[1]:w[2],k:w[3]}};
const store={get(k,f){try{return JSON.parse(localStorage.getItem(k))??f}catch(e){return f}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};
let F=store.get('f',false),favs=store.get('favs',[]),cur=store.get('cur',{name:'Lahore',country:'Pakistan',lat:31.5497,lon:74.3436}),data=null,aqi=null;
const T=c=>Math.round(F?c*9/5+32:c);
const fmtH=s=>{const h=+s.slice(11,13);return h===0?'12 AM':h<12?h+' AM':h===12?'12 PM':(h-12)+' PM'};
const DAYS=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const dirName=d=>['N','NE','E','SE','S','SW','W','NW'][Math.round(d/45)%8];

async function load(p){
  cur=p;selDay=0;store.set('cur',p);$('app').innerHTML='<div class="ld"><div class="spin"></div>Loading...</div>';
  try{
    const [w,a]=await Promise.all([
      fetch(`https://api.open-meteo.com/v1/forecast?latitude=${p.lat}&longitude=${p.lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,pressure_msl,wind_speed_10m,wind_direction_10m,visibility,cloud_cover&hourly=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code,precipitation_probability,is_day&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_probability_max&timezone=auto&forecast_days=7`).then(r=>r.json()),
      fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${p.lat}&longitude=${p.lon}&current=us_aqi,pm2_5`).then(r=>r.json()).catch(()=>null)]);
    data=w;aqi=a&&a.current?a.current:null;render();
  }catch(e){$('app').innerHTML='<div class="ld">⚠️ Data load nahi hua. Internet check karein aur dobara try karein.<br><br><button onclick="load(cur)">Retry</button></div>'}
}
function aqiTxt(v){return v<=50?'Good':v<=100?'Moderate':v<=150?'Unhealthy for sensitive':v<=200?'Unhealthy':v<=300?'Very unhealthy':'Hazardous'}
function uvTxt(v){return v<3?'Low':v<6?'Moderate':v<8?'High':v<11?'Very high':'Extreme'}
function render(){
  const c=data.current,d=data.daily,h=data.hourly,day=!!c.is_day,w=info(c.weather_code,day);
  document.body.className=(w.k==='clear'?(day?'clear-day':'clear-night'):w.k);
  document.querySelector('meta[name=theme-color]').content=getComputedStyle(document.body).getPropertyValue('--g1');
  setFx(w.k,day,c.wind_speed_10m);
  const start=Math.max(0,h.time.findIndex(t=>t>=c.time.slice(0,13)));
  let hrs='';for(let i=start;i<start+24&&i<h.time.length;i++){const x=info(h.weather_code[i],h.is_day[i]);hrs+=`<div class="h">${i===start?'Now':fmtH(h.time[i])}<b>${x.i}</b>${T(h.temperature_2m[i])}°<br><small>💧${h.precipitation_probability[i]||0}%</small></div>`}
  const mn=Math.min(...d.temperature_2m_min),mx=Math.max(...d.temperature_2m_max);
  let days='';d.time.forEach((t,i)=>{const x=info(d.weather_code[i],1),l=(d.temperature_2m_min[i]-mn)/(mx-mn)*100,r=(d.temperature_2m_max[i]-mn)/(mx-mn)*100;
    days+=`<div class="day"><span>${i?DAYS[new Date(t+'T12:00').getDay()]:'Today'}</span><span>${x.i}</span><div class="bar2"><i style="left:${l}%;right:${100-r}%"></i></div><span>${T(d.temperature_2m_min[i])}° / ${T(d.temperature_2m_max[i])}°</span></div>`});
  const sr=d.sunrise[0].slice(11),ss=d.sunset[0].slice(11),now=c.time.slice(11);
  const m=s=>+s.slice(0,2)*60+ +s.slice(3),pr=Math.min(1,Math.max(0,(m(now)-m(sr))/(m(ss)-m(sr))));
  const sx=10+pr*180,sy=55-Math.sin(pr*Math.PI)*45;
  const dl=m(ss)-m(sr);
  const uv=d.uv_index_max[0],a=aqi?aqi.us_aqi:null;
  const vis=c.visibility!=null?(c.visibility/1000).toFixed(1)+' km':'--';
  const feel=c.apparent_temperature,tip=c.temperature_2m>=38?'Bohat garmi hai — pani piyein aur dhoop se bachein.':c.temperature_2m<=5?'Thand hai — garam kapray pehnein.':w.k==='rain'||w.k==='storm'?'Chhatri saath rakhein ☔':w.k==='snow'?'Barf hai — ehtiyat se chalein.':uv>=6?'UV zyada hai — sunscreen lagayein.':'Mausam acha hai, enjoy karein!';
  $('unit').textContent=F?'°F':'°C';
  $('fav').textContent=favs.some(f=>f.name===cur.name)?'★ Saved':'☆ Save';
  $('app').innerHTML=`
  <section class="hero"><div class="city">${cur.name}</div><div class="sub">${cur.country||''} • ${new Date(c.time).toLocaleString('en-GB',{weekday:'long',hour:'2-digit',minute:'2-digit'})}</div>
  <div class="ico">${w.i}</div><div class="temp">${T(c.temperature_2m)}°</div><div class="cond">${w.t}</div>
  <div class="hl">H: ${T(d.temperature_2m_max[0])}° &nbsp; L: ${T(d.temperature_2m_min[0])}°</div>
  <div class="card" style="text-align:left;margin-top:16px">💡 ${tip}</div></section>
  <div class="card"><h3>📈 POORE DIN KA GRAPH</h3><div class="tabs" id="dchips"></div><div class="tabs" id="dtabs"></div><div id="dgraph"></div>
   <div class="note" id="tip" style="min-height:36px">Graph par touch / drag karke har ghante ka mausam dekhein</div><div id="dsum"></div></div>
  <div class="card"><h3>🕒 HOURLY FORECAST (24h)</h3><div class="hours">${hrs}</div></div>
  <div class="card"><h3>📅 7-DAY FORECAST</h3>${days}</div>
  <div class="card"><h3>📊 HAFTE KA GRAPH</h3><div id="wgraph"></div><div class="note">Orange = max, Neela = min, Bars = baarish chance</div></div>
  <div class="grid" style="margin-top:14px">
   <div class="card"><h3>🌡️ FEELS LIKE</h3><div class="big">${T(feel)}°</div><div class="note">${feel>c.temperature_2m+1?'Humidity ki wajah se garam':feel<c.temperature_2m-1?'Hawa ki wajah se thanda':'Actual temp jaisa'}</div></div>
   <div class="card"><h3>💧 HUMIDITY</h3><div class="big">${c.relative_humidity_2m}%</div><div class="note">${c.relative_humidity_2m>70?'Umas / humid':c.relative_humidity_2m<30?'Khushk':'Comfortable'}</div></div>
   <div class="card"><h3>💨 WIND</h3><div class="compass"><i style="transform:rotate(${c.wind_direction_10m}deg)"></i></div><div class="big">${Math.round(c.wind_speed_10m)}</div><div class="note">km/h ${dirName(c.wind_direction_10m)}</div></div>
   <div class="card"><h3>☀️ UV INDEX</h3><div class="big">${Math.round(uv)}</div><div class="note">${uvTxt(uv)}</div><div class="meter"><i style="left:${Math.min(100,uv/11*100)}%"></i></div></div>
   <div class="card"><h3>🍃 AIR QUALITY</h3><div class="big">${a??'--'}</div><div class="note">${a!=null?aqiTxt(a)+' • PM2.5 '+Math.round(aqi.pm2_5):'Data unavailable'}</div><div class="meter"><i style="left:${a!=null?Math.min(100,a/300*100):0}%"></i></div></div>
   <div class="card"><h3>👁️ VISIBILITY</h3><div class="big">${vis}</div><div class="note">Clouds: ${c.cloud_cover}%</div></div>
   <div class="card"><h3>⏲️ PRESSURE</h3><div class="big">${Math.round(c.pressure_msl)}</div><div class="note">hPa</div></div>
   <div class="card"><h3>🌧️ RAIN CHANCE</h3><div class="big">${d.precipitation_probability_max[0]||0}%</div><div class="note">Aaj ka maximum</div></div>
  </div>
  <div class="card"><h3>🌅 SUNRISE &amp; SUNSET</h3>
   <div class="sun"><svg viewBox="0 0 200 60"><path d="M10 55 Q100 -35 190 55" fill="none" stroke="rgba(255,255,255,.4)" stroke-dasharray="4 4"/><line x1="0" y1="55" x2="200" y2="55" stroke="rgba(255,255,255,.3)"/><circle cx="${sx}" cy="${sy}" r="6" fill="#ffd166"/></svg></div>
   <div style="display:flex;justify-content:space-between;font-size:14px"><span>🌅 ${sr}</span><span>☀️ ${Math.floor(dl/60)}h ${dl%60}m din</span><span>🌇 ${ss}</span></div>
   <table class="sw">${d.time.map((t,i)=>`<tr><td>${i?DAYS[new Date(t+'T12:00').getDay()]:'Today'}</td><td>🌅 ${d.sunrise[i].slice(11)}</td><td>🌇 ${d.sunset[i].slice(11)}</td></tr>`).join('')}</table></div>`;
  renderChips();drawDay();drawWeek();
}
function renderChips(){$('chips').innerHTML=favs.map((f,i)=>`<button data-i="${i}">${f.name}</button>`).join('');
  $('chips').querySelectorAll('button').forEach(b=>{b.onclick=()=>load(favs[b.dataset.i]);b.oncontextmenu=e=>{e.preventDefault();favs.splice(b.dataset.i,1);store.set('favs',favs);render()}})}
$('unit').onclick=()=>{F=!F;store.set('f',F);render()};
$('fav').onclick=()=>{const i=favs.findIndex(f=>f.name===cur.name);i>=0?favs.splice(i,1):favs.push(cur);store.set('favs',favs);render()};
$('loc').onclick=()=>{if(!navigator.geolocation)return alert('Location support nahi hai');navigator.geolocation.getCurrentPosition(p=>load({name:'My location',country:'',lat:p.coords.latitude,lon:p.coords.longitude}),()=>alert('Location permission nahi mili. Shehar ka naam search karein.'),{timeout:10000})};
let tm;$('q').oninput=e=>{clearTimeout(tm);const v=e.target.value.trim();if(v.length<2){$('sug').style.display='none';return}
  tm=setTimeout(async()=>{try{const r=await(await fetch(`${API_BASE}/api/search?name=${encodeURIComponent(v)}`)).json();
   const s=$('sug');s.innerHTML=(r.results||[]).map((x,i)=>`<div data-i="${i}">${x.name}${x.admin1?', '+x.admin1:''}, ${x.country||''}</div>`).join('')||'<div>Koi shehar nahi mila</div>';s.style.display='block';
   s.querySelectorAll('[data-i]').forEach(el=>el.onclick=()=>{const x=r.results[el.dataset.i];s.style.display='none';$('q').value='';load({name:x.name,country:x.country||'',lat:x.latitude,lon:x.longitude})})}catch(e){}},350)};

/* ---------- Graphs ---------- */
let selDay=0,metric='all';
const hr12=h=>h===0?'12a':h<12?h+'a':h===12?'12p':(h-12)+'p';
const smooth=(a,X,Y)=>a.map((v,i)=>{if(!i)return`M${X(0)} ${Y(v)}`;const dx=(X(i)-X(i-1))/2;return`C${X(i-1)+dx} ${Y(a[i-1])} ${X(i)-dx} ${Y(v)} ${X(i)} ${Y(v)}`}).join('');
function drawDay(){
  const h=data.hourly,s=selDay*24,g=k=>h[k].slice(s,s+24),d=data.daily;
  const t=g('temperature_2m').map(T),f=g('apparent_temperature').map(T),r=g('precipitation_probability').map(v=>v||0),w=g('wind_speed_10m').map(Math.round),hm=g('relative_humidity_2m');
  const S={t:[t,'°','#ffd166'],f:[f,'°','#ff9f6b'],r:[r,'%','#7dd3fc'],w:[w,' km/h','#b8f2c4'],hm:[hm,'%','#c4b5fd']};
  $('dchips').innerHTML=d.time.map((x,i)=>`<button class="${i===selDay?'on':''}" data-i="${i}">${i?DAYS[new Date(x+'T12:00').getDay()]+' '+x.slice(8):'Today'}</button>`).join('');
  $('dchips').querySelectorAll('button').forEach(b=>b.onclick=()=>{selDay=+b.dataset.i;drawDay()});
  const TB=[['all','All'],['t','Temp'],['f','Feels'],['r','Rain'],['w','Wind'],['hm','Humidity']];
  $('dtabs').innerHTML=TB.map(x=>`<button class="${x[0]===metric?'on':''}" data-m="${x[0]}">${x[1]}</button>`).join('');
  $('dtabs').querySelectorAll('button').forEach(b=>b.onclick=()=>{metric=b.dataset.m;drawDay()});
  const VW=340,VH=220,L=34,R=10,Tp=18,B=26,cw=VW-L-R,ch=VH-Tp-B,X=i=>L+i*cw/23;
  const ser=metric==='all'?[t,f]:[S[metric][0]],all=ser.flat();
  let mn=Math.min(...all),mx=Math.max(...all);
  if(metric==='r'||metric==='hm'){mn=0;mx=100}else{const p=(mx-mn)*.15||2;mn-=p;mx+=p}
  const Y=v=>Tp+ch-(v-mn)/(mx-mn)*ch,base=Tp+ch,col=metric==='all'?'#ffd166':S[metric][2];
  let o=`<svg id="dsvg" viewBox="0 0 ${VW} ${VH}" style="width:100%;touch-action:pan-y;display:block">`;
  for(let k=0;k<=4;k++){const v=mn+(mx-mn)*k/4,y=Y(v);o+=`<line x1="${L}" x2="${VW-R}" y1="${y}" y2="${y}" stroke="rgba(255,255,255,.15)"/><text x="${L-4}" y="${y+3}" font-size="9" fill="#fff" opacity=".7" text-anchor="end">${Math.round(v)}</text>`}
  for(let i=0;i<24;i+=3)o+=`<text x="${X(i)}" y="${VH-8}" font-size="9" fill="#fff" opacity=".75" text-anchor="middle">${hr12(i)}</text>`;
  if(metric==='all'||metric==='r')r.forEach((v,i)=>{const bh=metric==='r'?base-Y(v):v/100*ch*.35;o+=`<rect x="${X(i)-4}" y="${base-bh}" width="8" height="${bh}" rx="2" fill="rgba(125,211,252,.5)"/>`});
  if(metric!=='r'){o+=`<path d="${smooth(ser[0],X,Y)}L${X(23)} ${base}L${X(0)} ${base}Z" fill="${col}" opacity=".16"/>`;
    ser.forEach((a,j)=>o+=`<path d="${smooth(a,X,Y)}" fill="none" stroke="${j?'#ff7a59':col}" stroke-width="2.6" stroke-linecap="round" ${j?'stroke-dasharray="5 4"':''}/>`)}
  const p0=ser[0],iM=p0.indexOf(Math.max(...p0)),im=p0.indexOf(Math.min(...p0)),u=S[metric==='all'?'t':metric][1];
  o+=`<circle cx="${X(iM)}" cy="${Y(p0[iM])}" r="3.5" fill="#fff"/><text x="${X(iM)}" y="${Y(p0[iM])-8}" font-size="10" fill="#fff" text-anchor="middle" font-weight="700">${p0[iM]}${u}</text>`;
  if(im!==iM)o+=`<circle cx="${X(im)}" cy="${Y(p0[im])}" r="3.5" fill="#fff"/><text x="${X(im)}" y="${Y(p0[im])+16}" font-size="10" fill="#fff" text-anchor="middle" font-weight="700">${p0[im]}${u}</text>`;
  if(selDay===0){const nh=+data.current.time.slice(11,13);o+=`<line x1="${X(nh)}" x2="${X(nh)}" y1="${Tp}" y2="${base}" stroke="#fff" stroke-dasharray="3 3" opacity=".7"/><text x="${X(nh)}" y="${Tp-5}" font-size="9" fill="#fff" text-anchor="middle">Now</text>`}
  o+=`<line id="tl" y1="${Tp}" y2="${base}" stroke="#fff" opacity="0"/><circle id="tc" r="5" fill="#fff" opacity="0"/></svg>`;
  if(metric==='all')o+=`<div class="note">🟡 Temp &nbsp; 🟠 Feels like (dashed) &nbsp; 🔵 Baarish chance</div>`;
  $('dgraph').innerHTML=o;
  const svg=$('dsvg'),show=e=>{const b=svg.getBoundingClientRect();let i=Math.round(((e.clientX-b.left)/b.width*VW-L)/cw*23);i=Math.max(0,Math.min(23,i));
    const x=X(i);$('tl').setAttribute('x1',x);$('tl').setAttribute('x2',x);$('tl').setAttribute('opacity',.8);$('tc').setAttribute('cx',x);$('tc').setAttribute('cy',Y(p0[i]));$('tc').setAttribute('opacity',1);
    const q=info(h.weather_code[s+i],h.is_day[s+i]);
    $('tip').innerHTML=`<b>${hr12(i)}</b> ${q.i} ${q.t} • 🌡️ ${t[i]}° (feels ${f[i]}°) • 💧 ${r[i]}% • 💨 ${w[i]} km/h • 💦 ${hm[i]}%`};
  svg.onpointermove=show;svg.onpointerdown=show;
  const parts=[['🌅 Subah',6,12],['☀️ Dopahar',12,18],['🌇 Sham',18,24],['🌙 Raat',0,6]];
  const dd=d.time[selDay],ic=info(d.weather_code[selDay],1);
  $('dsum').innerHTML=`<div class="parts">${parts.map(p=>{const a=t.slice(p[1],p[2]),c=h.weather_code[s+p[1]+3],q=info(c,p[1]>=6&&p[1]<18||p[1]===18&&0),ra=Math.max(...r.slice(p[1],p[2]));
    return`<div>${p[0]}<b>${info(c,p[0].includes('Raat')||p[0].includes('Sham')?(p[1]===18?0:0):1).i}</b>${Math.round(a.reduce((x,y)=>x+y,0)/a.length)}°<br>💧${ra}%</div>`}).join('')}</div>
   <div class="stat"><span>${ic.i} ${ic.t}</span><span>⬆️ ${T(d.temperature_2m_max[selDay])}° ⬇️ ${T(d.temperature_2m_min[selDay])}°</span><span>💨 avg ${Math.round(w.reduce((x,y)=>x+y,0)/24)} km/h</span><span>💦 avg ${Math.round(hm.reduce((x,y)=>x+y,0)/24)}%</span></div>`;
  if(!$('tip').dataset.set){$('tip').dataset.set=1}
}
function drawWeek(){
  const d=data.daily,VW=340,VH=250,L=30,R=14,Tp=40,B=54,cw=VW-L-R,ch=VH-Tp-B,X=i=>L+i*cw/6,base=Tp+ch;
  const hi=d.temperature_2m_max.map(T),lo=d.temperature_2m_min.map(T),rp=d.precipitation_probability_max.map(v=>v||0);
  const mn=Math.min(...lo)-3,mx=Math.max(...hi)+3,Y=v=>Tp+ch-(v-mn)/(mx-mn)*ch;
  let o=`<svg viewBox="0 0 ${VW} ${VH}" style="width:100%;display:block">`;
  for(let k=0;k<=4;k++){const v=mn+(mx-mn)*k/4,y=Y(v);o+=`<line x1="${L}" x2="${VW-R}" y1="${y}" y2="${y}" stroke="rgba(255,255,255,.15)"/><text x="${L-4}" y="${y+3}" font-size="9" fill="#fff" opacity=".7" text-anchor="end">${Math.round(v)}</text>`}
  rp.forEach((v,i)=>{const bh=v/100*ch*.4;o+=`<rect x="${X(i)-9}" y="${base-bh}" width="18" height="${bh}" rx="3" fill="rgba(125,211,252,.45)"/><text x="${X(i)}" y="${VH-24}" font-size="9" fill="#bfe9ff" text-anchor="middle">💧${v}%</text>`});
  o+=`<path d="${smooth(hi,X,Y)}L${X(6)} ${base}L${X(0)} ${base}Z" fill="#ff9f6b" opacity=".14"/><path d="${smooth(hi,X,Y)}" fill="none" stroke="#ffb27a" stroke-width="2.6"/><path d="${smooth(lo,X,Y)}" fill="none" stroke="#8fd3ff" stroke-width="2.6"/>`;
  d.time.forEach((t,i)=>{o+=`<circle cx="${X(i)}" cy="${Y(hi[i])}" r="3.5" fill="#fff"/><text x="${X(i)}" y="${Y(hi[i])-8}" font-size="10" fill="#fff" text-anchor="middle" font-weight="700">${hi[i]}°</text><circle cx="${X(i)}" cy="${Y(lo[i])}" r="3.5" fill="#fff"/><text x="${X(i)}" y="${Y(lo[i])+15}" font-size="10" fill="#fff" text-anchor="middle">${lo[i]}°</text>
   <text x="${X(i)}" y="16" font-size="14" text-anchor="middle">${info(d.weather_code[i],1).i}</text><text x="${X(i)}" y="${VH-8}" font-size="10" fill="#fff" text-anchor="middle">${i?DAYS[new Date(t+'T12:00').getDay()]:'Today'}</text>`});
  $('wgraph').innerHTML=o+'</svg>';
}
/* ---------- Weather animations ---------- */
const cv=$('fx'),g=cv.getContext('2d');let W,H,P=[],mode='clear',isDay=1,wind=0,ang=0,flashT=0;
function size(){W=cv.width=innerWidth;H=cv.height=innerHeight}addEventListener('resize',size);size();
function setFx(k,day,wsp){mode=k;isDay=day;wind=Math.min(6,wsp/8);P=[];
  const n=k==='rain'?160:k==='storm'?230:k==='snow'?110:k==='cloudy'?7:k==='fog'?6:k==='clear'&&!day?90:5;
  for(let i=0;i<n;i++)P.push({x:Math.random()*W,y:Math.random()*H,r:Math.random(),s:Math.random(),z:Math.random()})}
function frame(){g.clearRect(0,0,W,H);ang+=.004;
  if(mode==='clear'&&isDay){const x=W*.82,y=H*.14,gr=g.createRadialGradient(x,y,0,x,y,W*.7);gr.addColorStop(0,'rgba(255,240,180,.85)');gr.addColorStop(.15,'rgba(255,220,120,.35)');gr.addColorStop(1,'rgba(255,220,120,0)');g.fillStyle=gr;g.fillRect(0,0,W,H);
    g.save();g.translate(x,y);g.rotate(ang);g.fillStyle='rgba(255,255,220,.09)';for(let i=0;i<12;i++){g.rotate(Math.PI/6);g.beginPath();g.moveTo(0,0);g.lineTo(W,-30);g.lineTo(W,30);g.fill()}g.restore();
    g.fillStyle='#fff8d6';g.beginPath();g.arc(x,y,34,0,7);g.fill();drawClouds(3,.35)}
  else if(mode==='clear'){P.forEach(p=>{g.fillStyle=`rgba(255,255,255,${.3+.7*Math.abs(Math.sin(ang*8*p.s+p.r*9))})`;g.beginPath();g.arc(p.x,p.y*.8,p.r*1.6+.3,0,7);g.fill()});
    g.fillStyle='#f4f1de';g.beginPath();g.arc(W*.8,H*.13,28,0,7);g.fill();g.fillStyle='rgba(20,30,70,.9)';g.beginPath();g.arc(W*.8+12,H*.13-6,26,0,7);g.fill()}
  else if(mode==='cloudy'||mode==='fog')drawClouds(P.length,mode==='fog'?.28:.4,mode==='fog');
  else if(mode==='rain'||mode==='storm'){if(mode==='storm')drawClouds(6,.45);
    g.strokeStyle='rgba(190,215,255,.55)';g.lineWidth=1.3;g.beginPath();
    P.forEach(p=>{const l=10+p.z*14,v=13+p.z*12;g.moveTo(p.x,p.y);g.lineTo(p.x-wind*1.5-2,p.y+l);p.y+=v;p.x-=wind+1;if(p.y>H){p.y=-20;p.x=Math.random()*W+40}if(p.x<0)p.x=W});g.stroke();
    if(mode==='storm'){if(!flashT&&Math.random()<.006){flashT=1}if(flashT>0){$('flash').style.opacity=Math.random()>.4?flashT*.7:.1;flashT-=.06;if(flashT<=0){flashT=0;$('flash').style.opacity=0}}}}
  else if(mode==='snow'){g.fillStyle='#fff';P.forEach(p=>{g.globalAlpha=.5+p.z*.5;g.beginPath();g.arc(p.x,p.y,1.2+p.z*2.6,0,7);g.fill();p.y+=.6+p.z*1.6;p.x+=Math.sin(ang*30+p.s*9)*.6+wind*.2;if(p.y>H){p.y=-6;p.x=Math.random()*W}});g.globalAlpha=1}
  if(mode!=='storm')$('flash').style.opacity=0;
  requestAnimationFrame(frame)}
function drawClouds(n,a,fog){for(let i=0;i<n;i++){const p=P[i%P.length]||{x:0,y:0,r:.5,s:.5,z:.5};
  const sp=.15+p.s*.35,x=((p.x+ang*sp*1200)%(W+400))-200,y=fog?H*(.15+.7*p.r):H*(.05+.32*p.r),s=(fog?260:110)+p.z*130;
  g.fillStyle=`rgba(${fog?215:255},${fog?220:255},${fog?225:255},${a})`;
  [[0,0,1],[.7,.15,.7],[-.7,.2,.65],[.3,-.3,.6],[-.3,-.25,.55]].forEach(c=>{g.beginPath();g.ellipse(x+c[0]*s,y+c[1]*s*.6,s*.6*c[2],s*.4*c[2],0,0,7);g.fill()})}}
frame();
load(cur);
