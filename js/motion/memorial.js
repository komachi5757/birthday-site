(()=>{
"use strict";
const DEFAULTS={displayName:"楊承勳",title:"楊承勳生日",eyebrow:"2008 · 9 · 12",subtitle:"今晚，為楊承勳點一盞生日的光",storyCap:"楊承勳",intro:null,photo:null,music:"assets/music.mp3",candles:18,
  footerNote:"本站為親友自發的紀念。留言會直接顯示，若有不妥可來信請我們移除。"};
const CFG=Object.assign({},DEFAULTS,window.MEMORIAL_CONFIG||{});
const q=new URLSearchParams(location.search);
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const app=$("#app");const ADMIN=q.get("admin")||"";
// 時間皆為毫秒；吹熄的四秒全黑從淡入結束起算。
const MOTION={igniteStart:700,igniteStep:400,lean:3200,inhale:4600,exhale:6400,release:10200,blackout:10500,blackFade:1500,dawn:16000,finalTitle:5000,cloud:12000,poll:5000};

/* ── 示範 API ── */
const DEMO=[["小雨","生日快樂。願你自由自在地長大。"],["一位老師","十八歲了。老師記得你。"],["阿翔","今晚這盞光，替我抱抱你。"],["同學們","我們都還記得你的笑聲。"],["台中的媽媽","謝謝你讓更多孩子被看見。"],["匿名","生日快樂，小天使。"],["小花","願你那裡有好多蛋糕。"],["一位社工","我們會繼續努力。"],["阿嬤","乖孫，生日快樂。"],["路過的人","不認識你，但想為你點一盞光。"],["高雄的爸爸","十八歲生日快樂。"],["Y.","每年這一天，我都會想起你。"],["小安","你沒有被忘記。"],["一位護理師","願你被溫柔對待。"],["基隆的朋友","生日快樂，平安。"],["小明","願你在那邊有很多朋友。"],["佳佳","謝謝你來過。"],["一位母親","抱抱你。"],["阿德","成年快樂。"],["小婷","你會一直是十八歲。"],["台南的人","生日快樂。"],["陌生人","願你安睡。"],["Z.","十八歲，生日快樂。"],["小芸","記得你。"],["老師們","你是我們的學生。"],["阿公","乖，生日快樂。"],["小豪","下次一起吃蛋糕。"],["宜蘭的媽媽","願你自由。"],["一位志工","我們會替你看著這個世界。"],["小美","生日快樂。"],["小傑","願你飛得很高。"],["朋友","想你。"],["阿姨","乖孩子，生日快樂。"],["一位爸爸","願你被愛。"],["小樂","生日快樂，我的朋友。"],["新竹的同學","我們畢業了，你也是。"],["一位鄰居","你笑起來很好看。"],["匿名","願世界對孩子溫柔一點。"],["花蓮的人","生日快樂。"],["小恩","我會記得你。"]];
function demoApi(){
  const KEY="memorial:demo:v3";let st;try{st=JSON.parse(localStorage.getItem(KEY)||"null")}catch{st=null}
  if(!st){const now=Date.now();st={wishes:DEMO.map((d,i)=>({id:"d"+i,name:d[0],message:d[1],created_at:new Date(now-(DEMO.length-i)*600000).toISOString()}))};save()}
  function save(){try{localStorage.setItem(KEY,JSON.stringify(st))}catch{}}
  return {async init(){return {mode:"mock"}},async listWishes(limit=300){return st.wishes.slice(-limit).reverse()},
    async sendWish({name,message}){await new Promise(r=>setTimeout(r,400));const w={id:"u"+Date.now(),name,message,created_at:new Date().toISOString()};st.wishes.push(w);save();return {ok:true,wish:w}},
    async deleteWish(id){st.wishes=st.wishes.filter(w=>w.id!==id);save();return {ok:true}},async getSettings(){return {}}};
}
const API=window.MemorialAPI||demoApi();

/* ══════════════ 預烤光場與燭火舞台 ══════════════ */
const cv=$("#cv"),ctx=cv.getContext("2d",{alpha:true});
let W=0,H=0,DPR=1,mobile=false;
const reduced=matchMedia("(prefers-reduced-motion: reduce)").matches;
const rng=seed=>{let a=seed>>>0;return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}};
const R=rng(1812),clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const smooth=v=>{v=clamp(v);return v*v*(3-2*v)};
const S={stars:[],candles:[],sparks:[],smoke:[],breath:[],motes:[],skyA:.16,wind:0,blowT:-1,dawnT:-1,front:-1,dt:1,stageShift:0,wishStars:[],flights:[],mineStar:-1};
const SPR={};
const optionalReady=Promise.all([['flame-sheet',2048,512],['dust-sheet',512,128],...Array.from({length:4},(_,i)=>['smoke-0'+(i+1),512,1024]),['bokeh-warm',1024,1024]].map(([name,w,h])=>new Promise(resolve=>{
 const im=new Image();im.onload=()=>{if(im.width===w&&im.height===h)SPR[name]=im;else console.warn('素材尺寸不符，改用程式畫法：'+name);resolve()};im.onerror=()=>{console.warn('素材載入失敗，改用程式畫法：'+name);resolve()};im.src='assets/motion/gemini/'+name+(name==='bokeh-warm'?'.webp':'.png');
})));
const starCanvas=document.createElement('canvas'),starCtx=starCanvas.getContext('2d');starCanvas.id='wish-star-light';starCanvas.style.width='64px';starCanvas.style.height='64px';starCanvas.setAttribute('aria-hidden','true');app.appendChild(starCanvas);
function drawLastLight(ts){
 starCtx.clearRect(0,0,64,64);const st=S.wishStars[S.mineStar];if(!st?.lit)return;starCanvas.style.left=(st.x*W-32)+'px';starCanvas.style.top=(st.y*H-32)+'px';
 const a=(.8+.12*Math.sin(ts/1100))*(1-dawnK(ts)),x=32,y=32;
 if(SPR.halo){starCtx.globalAlpha=a*.45;starCtx.drawImage(SPR.halo,x-21,y-21,42,42)}
 starCtx.globalAlpha=a;starCtx.fillStyle='#fff2d5';starCtx.beginPath();starCtx.arc(x,y,1.65,0,Math.PI*2);starCtx.fill();starCtx.globalAlpha=1;
}

// 主素材也有預烤的程式退路：只於載入失敗建立一次，不在每幀配置漸層。
function fallbackSprite(name){
 const canvas=document.createElement('canvas');canvas.width=64;canvas.height=128;const g=canvas.getContext('2d');
 if(name.startsWith('wax')){const gradient=g.createLinearGradient(0,0,64,0);gradient.addColorStop(0,'#10131a');gradient.addColorStop(.42,name==='wax-lit'?'#c9b78c':'#20232a');gradient.addColorStop(1,'#080b10');g.fillStyle=gradient;g.fillRect(0,0,64,128)}
 else if(name==='table'){const gradient=g.createLinearGradient(0,0,0,128);gradient.addColorStop(0,'#171611');gradient.addColorStop(1,'#040608');g.fillStyle=gradient;g.fillRect(0,0,64,128)}
 else if(name==='flame'){const gradient=g.createLinearGradient(0,0,0,128);gradient.addColorStop(0,'#fff5cd');gradient.addColorStop(.7,'#ffb451');gradient.addColorStop(1,'#415b9a');g.fillStyle=gradient;g.beginPath();g.moveTo(32,4);g.bezierCurveTo(17,60,1,114,32,127);g.bezierCurveTo(57,114,46,71,32,4);g.fill()}
 else {g.scale(1,2);const gradient=g.createRadialGradient(32,32,0,32,32,32);gradient.addColorStop(0,name==='smoke'||name==='breath'?'#cad0d799':'#fff2ce');gradient.addColorStop(.2,'#c69f6855');gradient.addColorStop(1,'#c69f6800');g.fillStyle=gradient;g.fillRect(0,0,64,64)}
 return canvas;
}
const assetsReady=Promise.all(['halo','warm','smoke','star','spark','breath','wax-lit','wax-dark','flame','reflection','table'].map(name=>new Promise(resolve=>{
 const im=new Image();im.onload=()=>{SPR[name]=im;resolve()};im.onerror=()=>{console.warn('素材載入失敗，改用退路：assets/motion/'+name+'.png');SPR[name]=fallbackSprite(name);resolve()};im.src=`assets/motion/${name}.png`;
})));
$('#grain').style.backgroundImage='url("assets/motion/grain.png")';
const PLATES={night:'assets/motion/gemini/plate-night.jpg',dawn:'assets/motion/gemini/plate-dawn.jpg'};
function drawSprite(name,x,y,w,h,alpha=1){if(alpha<=0||!SPR[name]||w<=0||h<=0)return;ctx.globalAlpha=clamp(alpha);ctx.drawImage(SPR[name],x,y,w,h);ctx.globalAlpha=1}
function resize(){
 W=innerWidth;H=innerHeight;mobile=W<720;DPR=Math.min(devicePixelRatio||1,1.5);
 cv.width=Math.round(W*DPR);cv.height=Math.round(H*DPR);ctx.setTransform(DPR,0,0,DPR,0,0);
 starCanvas.width=Math.round(64*DPR);starCanvas.height=Math.round(64*DPR);starCtx.setTransform(DPR,0,0,DPR,0,0);
 layoutCandles();
 // 以嘴部及第一支燭火為定位基準，手機也保留完整的吸吐氣形象。
 const size=mobile?W*1.03:Math.min(H*.82,W*.52),height=mobile?H*.45:size;
 const mouthY=H*(mobile?.55:.51);
 app.style.setProperty('--figure-size',size+'px');app.style.setProperty('--figure-height',height+'px');
 app.style.setProperty('--figure-left',(mobile?-W*.16:W*.07)+'px');
 app.style.setProperty('--figure-bottom',(H-mouthY-height*.475)+'px');
 if(app.classList.contains('cloudmode')){clearTimeout(resize.cloudTimer);resize.cloudTimer=setTimeout(()=>showCloud(mine),180)}
}
function buildStars(){
 for(let i=0;i<150;i++)S.stars.push({x:R(),y:R()*.82,r:.3+R()*.8,a:.1+R()*.3,ph:R()*6.28});
 for(let i=0;i<40;i++)S.motes.push({x:R(),y:.35+R()*.6,r:.3+R()*.7,ph:R()*6.28,vx:(R()-.5)*.00006,vy:-.000015-R()*.000025});
}
function layoutCandles(){
 const n=Math.max(1,Math.min(60,Math.round(Number(CFG.candles)||18))),rr=rng(2008),prev=S.candles;
 const span=mobile?W*.80:Math.min(W*.67,940),cx=W*(mobile?.5:.58),base=H*.71;
 S.candles=Array.from({length:n},(_,i)=>{
  const row=mobile?(i%2):0,count=mobile?Math.ceil((n-row)/2):n,col=mobile?Math.floor(i/2):i;
  const t=count===1?0:(col/(count-1)-.5)*2,old=prev[i]||{};
  return {x:cx+t*span/2+(mobile?row*W*.014:0),homeX:cx+t*span/2+(mobile?row*W*.014:0),y:base-Math.cos(t*1.4)*H*.018+(mobile?row*24:0),h:(mobile?44:77)+rr()*(mobile?12:43),w:(mobile?14:10)+rr()*3,ph:rr()*6.28,sp:.8+rr()*.4,litAt:old.litAt??-1,ready:old.ready||false,out:old.out||false,outAt:old.outAt??-1,bend:old.bend||0,order:i,dist:Math.abs(i-(n-1)/2),row,smokeUntil:old.smokeUntil||0};
 });

}
const tip=c=>[c.x,c.y-c.h];
function dawnK(ts){return S.dawnT!==-1?smooth((ts-S.dawnT)/6500):0}
function lightLevel(c,ts){if(c.litAt<0&&!c.ready)return 0;let L=smooth((ts-c.litAt-130)/1350);if(c.out)L*=1-smooth((ts-c.outAt)/500);return L}
function flick(c,t){return reduced?1:.94+.045*Math.sin(t*8*c.sp+c.ph)+.02*Math.sin(t*19+c.ph)}
/* 祝福星：每一則祝福在夜空點亮一顆常駐的星；自己那顆由燭光飛上去點亮（使用者裁定，不設門檻）。 */
function buildWishStars(n){const r=rng(1999);S.wishStars=[];for(let i=0;i<Math.min(n,400);i++)S.wishStars.push({x:.06+r()*.88,y:.05+r()*.42,r:.9+r()*1.1,ph:r()*6.28,lit:true,litAt:0})}
function nextWishStar(){if(S.wishStars.length>=400)S.wishStars.pop();const r=rng(1999+S.wishStars.length*7);S.wishStars.push({x:.14+r()*.72,y:.07+r()*.32,r:2,ph:r()*6.28,lit:false,litAt:-1});return S.wishStars.length-1}
function drawWishStars(ts,t){
 const dawn=dawnK(ts);if(dawn>=1)return;const base=Math.max(S.skyA,S.blowT>=0?.5:0)*(1-dawn);
 ctx.globalCompositeOperation='lighter';
 S.wishStars.forEach((s,i)=>{if(!s.lit)return;const mine=i===S.mineStar,tw=.75+.25*Math.sin(t*.9+s.ph);let a=(mine?1:.5)*tw*base;const x=s.x*W,y=s.y*H;
  if(s.litAt>0){const p=(ts-s.litAt)/1700;if(p<1){a=Math.min(1,a+(1-p));ctx.globalAlpha=(1-p)*.55;ctx.strokeStyle='#ffe4b0';ctx.lineWidth=1.2;ctx.beginPath();ctx.arc(x,y,4+p*54,0,6.283);ctx.stroke();ctx.globalAlpha=1}}
  const R2=s.r*(mine?13:7);drawSprite('halo',x-R2,y-R2,R2*2,R2*2,a*.85);const r=s.r*2.3;drawSprite('star',x-r,y-r,r*2,r*2,a)});
 S.flights=S.flights.filter(f=>{const p=clamp((ts-f.t0)/f.dur);const tx=S.wishStars[f.idx].x*W,ty=S.wishStars[f.idx].y*H;
  for(let k=8;k>=0;k--){const pp=clamp(p-k*.028),e=smooth(pp);const x=f.x0+(tx-f.x0)*e+Math.sin(pp*Math.PI)*70,y=f.y0+(ty-f.y0)*e-Math.sin(pp*Math.PI)*130;const r=k?3.2-k*.3:5.5;drawSprite('warm',x-r*4,y-r*4,r*8,r*8,(1-k/9)*(k?.3:.9));drawSprite('star',x-r,y-r,r*2,r*2,(1-k/9))}
  if(p>=1){const st=S.wishStars[f.idx];st.lit=true;st.litAt=ts;f.done&&f.done();return false}return true});
 ctx.globalCompositeOperation='source-over';
}
function drawSky(ts,t){
 const a=S.skyA*(1-dawnK(ts));if(a<.002)return;
 for(const s of S.stars){const r=s.r*3;drawSprite('star',s.x*W-r,s.y*H-r,r*2,r*2,a*s.a*(.85+.15*Math.sin(t*.55+s.ph)))}
}
function drawTable(ts,t){
 const dawn=dawnK(ts),base=H*.71;
 drawSprite('table',0,base-12,W,H-base+12,(1-dawn)*.5);
 ctx.globalCompositeOperation='lighter';
 for(const c of S.candles){const l=lightLevel(c,ts)*(1-dawn),r=(mobile?51:100);
  drawSprite('warm',c.x-r,c.y-r*.16,r*2,r*.32,l*.32);
  drawSprite('reflection',c.x-c.w*.6,c.y,c.w*1.2,c.h*.8,l*.18);
 }
 ctx.globalCompositeOperation='source-over';
}
function drawCandle(c,ts,t){
 const d=S.dawnT===-1?1:1-smooth((ts-S.dawnT)/2400);if(d<=0)return;const l=lightLevel(c,ts),[x,y]=tip(c),fl=flick(c,t);
 drawSprite('wax-dark',x-c.w/2,y,c.w,c.h,d*.42);
 // 旁邊燭火的漫反射，避免只有點著的蠟身才有光。
 const neighbours=S.candles.reduce((sum,k)=>sum+lightLevel(k,ts)*Math.exp(-Math.abs(k.x-c.x)/(mobile?20:40)),0);
 drawSprite('wax-lit',x-c.w/2,y,c.w,c.h,clamp(l*.82+neighbours*.065)*d);
 ctx.globalAlpha=d;ctx.strokeStyle='#171310';ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(x,y+2);ctx.lineTo(x+1,y-5);ctx.stroke();ctx.globalAlpha=1;
 if(c.litAt>=0||c.ready){const age=ts-c.litAt,ember=c.out?Math.exp(-(ts-c.outAt)/270)*(1-clamp((ts-c.outAt)/800)):clamp(age/170)*(1-l);
  drawSprite('spark',x-3,y-7,6,6,ember*.8*d);
 }
 if(l<=0)return;
 const fh=(mobile?22:37)*(.12+.88*l)*fl,fw=(mobile?11:17)*Math.sqrt(l),bend=c.bend;
 ctx.globalCompositeOperation='lighter';const halo=(mobile?62:115)*Math.sqrt(l);
 drawSprite('halo',x-halo,y-halo-fh*.3,halo*2,halo*2,l*.32*d);
 drawSprite('warm',x-halo*.42,y-halo*.42-fh*.35,halo*.84,halo*.84,l*.38*d);
 ctx.globalCompositeOperation='source-over';
 ctx.save();ctx.translate(x,y-3);ctx.transform(1,0,-bend,Math.max(.24,1-bend*.27),0,0);
 if(SPR['flame-sheet']){
  const frame=(Math.floor(t*13+c.order*.43*13)%8),im=SPR['flame-sheet'];
  ctx.globalAlpha=l*d;ctx.drawImage(im,frame*256+112,150,74,182,-fw/2,-fh,fw,fh+3);ctx.globalAlpha=1;
 }else drawSprite('flame',-fw/2,-fh,fw,fh*1.15,l*d);
 ctx.restore();
 ctx.globalCompositeOperation='lighter';drawSprite('warm',x-c.w*1.3,y-c.w*.4,c.w*2.6,c.h*.3,l*.28*d);ctx.globalCompositeOperation='source-over';
}
function drawMotes(ts,t){
 if(reduced)return;const lit=S.candles.reduce((v,c)=>v+lightLevel(c,ts),0)/S.candles.length,dawn=dawnK(ts);
 for(const [i,m] of S.motes.entries()){
  m.x+=m.vx*S.dt;m.y+=m.vy*S.dt;if(m.y<.08)m.y=.88;
  const beam=clamp(1-Math.abs(m.x-(1-m.y*.7))/.38);
  const a=(lit*.2*(1-dawn)+dawn*.65*beam)*(.55+.45*Math.sin(t*.6+m.ph)),r=m.r*(dawn?5:3);
  if(SPR['dust-sheet']){ctx.globalAlpha=a;ctx.drawImage(SPR['dust-sheet'],(i%4)*128,0,128,128,m.x*W-r,m.y*H-r,r*2,r*2);ctx.globalAlpha=1}
  else drawSprite('halo',m.x*W-r,m.y*H-r,2*r,2*r,a);
 }
}
function spawnSparks(c,n){if(reduced)return;for(let i=0;i<Math.min(n,3);i++)S.sparks.push({x:c.x,y:c.y-c.h,vx:.4+R()*1.2,vy:-.3-R(),life:450+R()*700,t0:performance.now(),r:.8+R()})}
function spawnSmoke(c){if(S.smoke.length>110)return;S.smoke.push({x:c.x,y:c.y-c.h-4,vx:.12+R()*.2,vy:-.48-R()*.16,r:5+R()*3,life:3500,t0:performance.now(),ph:R()*6.28,variant:1+Math.floor(R()*4)})}
function mouthXY(){
 // 直接取已套用吸吐氣變形的圖像矩形；座標來自實際 PNG 唇部，而非頭髮外緣。
 const el=$('#figure .pose.blow'),r=el.getBoundingClientRect();if(!r.width)return null;
 const canvasRect=cv.getBoundingClientRect();
 return [(r.left+r.width*.674-canvasRect.left)*W/canvasRect.width,(r.top+r.height*.522-canvasRect.top)*H/canvasRect.height];
}
function spawnBreath(){
 if(reduced||S.breath.length>70)return;const m=mouthXY();if(!m)return;
 const target=[...S.candles].sort((a,b)=>a.x-b.x)[Math.floor(S.candles.length*.65)];
 const angle=Math.atan2(target.y-target.h-m[1],target.x-m[0]);const speed=mobile?3.4:6;
 S.breath.push({x:m[0],y:m[1],vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed+(R()-.5)*.3,r:2+R()*3,life:1100+R()*600,t0:performance.now()});
}
function drawParticles(ts){
 S.sparks=S.sparks.filter(p=>{const k=(ts-p.t0)/p.life;if(k>=1)return false;p.x+=p.vx*S.dt;p.y+=p.vy*S.dt;p.vy+=.012*S.dt;drawSprite('spark',p.x-2,p.y-2,4,4,1-k);return true});
 S.breath=S.breath.filter(p=>{const k=(ts-p.t0)/p.life;if(k>=1)return false;p.x+=p.vx*S.dt;p.y+=p.vy*S.dt;const r=p.r*(1+k*2);drawSprite('breath',p.x-r,p.y-r,r*2,r*2,(1-k)*.5);return true});
 S.smoke=S.smoke.filter(p=>{const k=(ts-p.t0)/p.life;if(k>=1)return false;p.x+=(p.vx+Math.sin(ts/700+p.ph)*.15)*S.dt;p.y+=p.vy*S.dt;const r=p.r*(1+k*3);const name=SPR['smoke-0'+p.variant]?'smoke-0'+p.variant:'smoke';drawSprite(name,p.x-r*1.5,p.y-r*5,3*r,6*r,Math.sin(k*Math.PI)*.12);return true});
}
function updateBlow(ts){
 if(S.blowT<0)return;const e=(ts-S.blowT)/1000,ex=e-(MOTION.exhale-MOTION.inhale)/1000;
 S.wind=ex<0?0:ex<3.8?smooth(ex/.6):1-smooth((ex-3.8)/1.3);
 if(ex>0&&ex<3.8&&ts-(S.lastBreath||0)>40){spawnBreath();S.lastBreath=ts}
 const first=Math.min(...S.candles.map(c=>c.x)),last=Math.max(...S.candles.map(c=>c.x));
 S.front=first+(last-first)*clamp((ex-.3)/3.1);
 for(const c of S.candles){
  const arrival=.3+(S.candles.length===1?0:(c.x-first)/Math.max(1,last-first))*3.1,local=ex-arrival;
  // 先受到氣壓，再向右伏倒，最後才熄滅。
  const target=S.wind*smooth((local+.5)/.65)*1.85;
  c.bend+=(target-c.bend)*Math.min(1,.12*S.dt);
  if(!c.out&&(c.litAt>=0||c.ready)&&local>=.12){c.out=true;c.outAt=ts;c.smokeUntil=ts+2200;spawnSparks(c,2);if(SPR["smoke-01"])spawnSmoke(c)}
  if(!SPR["smoke-01"]&&c.out&&ts<c.smokeUntil&&ts-(c.lastSmoke||0)>150){spawnSmoke(c);c.lastSmoke=ts}
 }
 if(ex>3.7)S.skyA=.9*(1-smooth((ex-3.7)/1.8));
}
let previousFrame=0;
function frame(ts){
 S.dt=Math.min(2.5,(ts-(previousFrame||ts-16.667))/16.667);previousFrame=ts;
 if(!document.hidden){
  // 尾聲只剩 CSS 文字與照片，不再每幀清空兩張全幅透明畫布。
  if(app.classList.contains('cloudmode')){if(!S.cloudCleared){ctx.clearRect(0,0,W,H);starCtx.clearRect(0,0,64,64);S.cloudCleared=true}requestAnimationFrame(frame);return}
  S.cloudCleared=false;ctx.clearRect(0,0,W,H);
  const shiftTarget=app.classList.contains('blowing')?1:0;
  S.stageShift+=(shiftTarget-S.stageShift)*Math.min(1,S.dt*.025);
  S.candles.forEach(c=>{const compact=mobile?W*.75+(c.homeX-W*.5)*.525:W*.70+(c.homeX-W*.58)*.65;c.x=c.homeX+(compact-c.homeX)*S.stageShift});
  updateBlow(ts);drawLastLight(ts);
  if(scene==='story'&&SPR['bokeh-warm']){ctx.globalCompositeOperation='screen';drawSprite('bokeh-warm',-W*.16,H*.13,W*.6,W*.6,.14);ctx.globalCompositeOperation='source-over'}
  if(!app.classList.contains('blackout')||ts-S.blowT<MOTION.blackout+MOTION.blackFade-MOTION.inhale){const t=ts/1000;drawSky(ts,t);drawWishStars(ts,t);drawTable(ts,t);for(const c of [...S.candles].sort((a,b)=>a.row-b.row))drawCandle(c,ts,t);drawMotes(ts,t);drawParticles(ts)}
 }
 requestAnimationFrame(frame);
}

/* ══════════════ 流程 ══════════════ */
let scene="gate";const timers=[];const later=(fn,ms)=>timers.push(setTimeout(fn,ms));const clearTimers=()=>{while(timers.length)clearTimeout(timers.pop())};
function go(s){if(s==="wish")sound.prepare();scene=s;app.dataset.scene=s;$$(".scene").forEach(el=>el.classList.toggle("on",el.dataset.s===s));app.scrollTop=0; $$(".scene").forEach(el=>{el.inert=el.dataset.s!==s});}
app.addEventListener("scroll",()=>{app.scrollTop=0;app.scrollLeft=0});
let toastT;const toast=(m,ms=3600)=>{const el=$("#toast");el.textContent=m;el.classList.add("show");clearTimeout(toastT);toastT=setTimeout(()=>el.classList.remove("show"),ms)};

const sound=window.createMemorialSound(CFG,$("#music"),$("#muteBtn"));
const fadeMusic=(target,ms)=>sound.fadeMusic(target,ms),startMusic=()=>sound.unlock();
// 聲音只由真實觸碰或鍵盤啟動；送出成功後才跑疊播時鐘。
app.addEventListener("pointerdown",e=>{if(!e.target.closest("#muteBtn"))startMusic()});
app.addEventListener("keydown",e=>{if((e.key==="Enter"||e.key===" ")&&!e.target.closest("#muteBtn"))startMusic()});
window.MemorialAudioStatus=()=>sound.status();

$("#gateBtn").addEventListener("click",()=>{if(scene!=="gate")return;startMusic();if(q.get("scene")==="fly")flyThenBlow(null);else ignite()});
document.addEventListener("keydown",e=>{if(e.key==="Enter"&&scene==="gate")$("#gateBtn").click()});
function ignite(){
  go("ignite");
  const order=[...S.candles].sort((a,b)=>a.dist-b.dist||a.order-b.order);
  order.forEach((c,i)=>{later(()=>{c.litAt=performance.now();c.out=false;c.outAt=-1;spawnSparks(c,2)},MOTION.igniteStart+i*MOTION.igniteStep)});
  const total=MOTION.igniteStart+order.length*MOTION.igniteStep;
  const skyIv=setInterval(()=>{S.skyA=Math.min(1,S.skyA+0.01);if(S.skyA>=1)clearInterval(skyIv)},60);timers.push(skyIv);
  later(()=>$("#sc-ignite").classList.add("show"),2000);
  later(()=>{$("#sc-ignite").classList.remove("show")},total+2800);
  later(()=>{app.classList.add("showbg");go("story")},total+4400);
}
$("#toWish").addEventListener("click",()=>go("wish"));
$("#backStory").addEventListener("click",()=>go("story"));
$("#skipWish").addEventListener("click",()=>{sound.start();blow(null)});
$("#cloudWish").addEventListener("click",()=>{resetStage();S.candles.forEach(c=>{c.litAt=performance.now()-4000;c.ready=true});S.skyA=.9;app.classList.add("showbg");go("wish")});
$("#replay").addEventListener("click",()=>replay());

const nameEl=$("#name"),msgEl=$("#message");
nameEl.addEventListener("input",()=>$("#nameCount").textContent=`${[...nameEl.value].length} / 20`);
msgEl.addEventListener("input",()=>$("#msgCount").textContent=`${[...msgEl.value].length} / 60`);
const MINE_KEY="memorial:mine:v1";
function rememberMine(w){try{localStorage.setItem(MINE_KEY,JSON.stringify({id:w.id,name:w.name,message:w.message}))}catch{}}
function recallMine(rows){try{const saved=JSON.parse(localStorage.getItem(MINE_KEY)||"null");return saved&&rows.find(w=>String(w.id)===String(saved.id))||null}catch{return null}}
let mine=null,lastSend=0;
$("#wishForm").addEventListener("submit",async e=>{
  e.preventDefault();const err=$("#formErr");err.textContent="";
  if($(".hp").value){err.textContent="送出失敗，請重新整理後再試。";return}
  const name=nameEl.value.trim()||"一位朋友",message=msgEl.value.trim()||"生日快樂。";
  if([...name].length>20||[...message].length>60){err.textContent="字數超過上限。";return}
  if(Date.now()-lastSend<8000){err.textContent="請稍候幾秒再送。";return}
  const btn=$("#sendBtn");btn.disabled=true;btn.textContent="送出中…";
  try{const res=await API.sendWish({name,message});if(!res||!res.ok)throw new Error(res&&res.error||"送出失敗");lastSend=Date.now();mine=res.wish||{id:"tmp",name,message};rememberMine(mine);msgEl.value="";$("#msgCount").textContent="0 / 60";toast("祝福已送出並確認收到，稍後會優先顯示",4200);flyThenBlow(mine)}
  catch(ex){err.textContent="送不出去："+(ex.message||ex)+"。內容已保留，請再試一次。"}
  finally{btn.disabled=false;btn.textContent="送出生日祝福"}
});

/* 送出祝福 → 燭光從中央燭焰飛入夜空、點亮一顆星（約 3.4s）→ 再進吹熄 */
function flyThenBlow(my){
 clearTimers();sound.start();go("fly");const c=S.candles[Math.floor(S.candles.length/2)];const idx=nextWishStar();S.mineStar=idx;
 S.flights.push({idx,x0:c.x,y0:c.y-c.h-6,t0:performance.now()+500,dur:2900,done:()=>toast("你的祝福，成為夜空裡的一顆星",3400)});
 later(()=>blow(my),5200);
}
/* 吹熄：靠近 → 俯身 → 吸氣 1.5s → 吐氣 3.7s（火焰由左至右熄滅）→ 黑暗與煙 → 曙光 */
function blow(my){
 clearTimers();clearInterval(showCloud._iv);go("blow");app.classList.add("blowing","approach");
 later(()=>app.classList.add("lean"),MOTION.lean);
 later(()=>{app.classList.add("inhale");S.blowT=performance.now()},MOTION.inhale);
 later(()=>{app.classList.remove("inhale");app.classList.add("exhale")},MOTION.exhale);
 later(()=>{app.classList.add("released")},MOTION.release);
 later(()=>app.classList.add("blackout"),MOTION.blackout);
 later(()=>dawn(my),MOTION.dawn);
}
function dawn(my){
 S.dawnT=performance.now();app.dataset.scene="dawn";app.classList.add("dawn","showbg");app.classList.remove("blackout","blowing");sound.dawn();
 later(()=>{$("#sc-final").classList.add("on");$("#sc-final").inert=false},MOTION.finalTitle);
 later(()=>showCloud(my),MOTION.cloud);
}
function resetStage(){
 clearTimers();sound.reset();clearInterval(showCloud._iv);cloudGeneration++;
 const mock=app.classList.contains("mock");app.className="";if(mock)app.classList.add("mock");if(ADMIN)app.classList.add("admin");
 $("#cloud").innerHTML="";$("#sc-final").classList.remove("on");
 S.stageShift=0;layoutCandles();S.blowT=-1;S.dawnT=-1;S.wind=0;S.skyA=.16;S.sparks=[];S.smoke=[];S.breath=[];S.flights=[];S.mineStar=-1;starCtx.clearRect(0,0,W,H);
 S.candles.forEach(c=>{c.litAt=-1;c.ready=false;c.out=false;c.outAt=-1;c.bend=0;c.smokeUntil=0});
}
function replay(){resetStage();ignite()}

/* ══════════════ 文字雲 ══════════════ */
let cloudGeneration=0,cloudSlots=[],cloudRows=[],cloudMine=null;
function slots(){
 // 三層深度：near（焦點）、mid、far；中央 35–65% 留給照片與標題。
 const width=mobile?W*.42:Math.min(330,W*.24);
 const points=mobile?[[.25,.55,'near'],[.75,.55,'mid'],[.25,.69,'mid'],[.75,.69,'near'],[.25,.81,'far'],[.75,.81,'far']]
  :[[.16,.31,'near'],[.84,.31,'mid'],[.16,.49,'mid'],[.84,.49,'near'],[.16,.67,'near'],[.84,.67,'mid'],[.16,.82,'far'],[.84,.82,'far']];
 return points.map(([x,y,depth])=>({x:x*W,y:y*H,w:width,depth}));
}
// 輪流高光：每 4 秒隨機讓一句祝福亮起 3 秒，像有人正在低聲說話。
setInterval(()=>{if(!app.classList.contains('cloudmode'))return;const ws=$$('.wd.in:not(.mine)');if(!ws.length)return;$$('.wd.hi').forEach(e=>e.classList.remove('hi'));const w=ws[Math.floor(Math.random()*ws.length)];w.classList.add('hi');setTimeout(()=>w.classList.remove('hi'),3000)},4000);
function makeWord(w,slot,isMine=false,delay=0){
 const originalSlot=slot;
 if(mobile&&[...(w.message||'')].length>28)slot={...slot,x:W*.5,y:H*.63,w:W-56};
 const el=document.createElement("div");el.className="wd"+(isMine?" mine":"");el.dataset.id=String(w.id||"");el.dataset.slot=String(cloudSlots.indexOf(originalSlot));
 el.style.left=slot.x+"px";el.style.top=slot.y+"px";el.style.width=slot.w+"px";
 const length=[...(w.message||"")].length,depth=slot.depth||'mid';el.classList.add('d-'+depth);
 const base=mobile?{near:18,mid:16,far:14}[depth]:{near:25,mid:20,far:15}[depth];
 el.style.fontSize=(isMine?(mobile?20:28):(length>35?base-3:base))+"px";
 el.style.setProperty("--wo",isMine?".98":String({near:.9,mid:.72,far:.48}[depth]+R()*.06));el.style.setProperty("--wt",(15+R()*8)+"s");
 el.style.setProperty("--wc","#f6eddf");
 el.innerHTML=`${esc(w.message||"生日快樂。")}<small>${esc(w.name||"")}</small>`+(ADMIN?`<button class="del" title="刪除這則" aria-label="刪除這則" data-id="${esc(w.id)}">×</button>`:"");
 $("#cloud").appendChild(el);
 const height=el.getBoundingClientRect().height;
 const collision=$$('.wd').some(other=>other!==el&&Math.abs(parseFloat(other.style.left)-slot.x)<(parseFloat(other.style.width)+slot.w)/2+10&&Math.abs(parseFloat(other.style.top)-slot.y)<(other.getBoundingClientRect().height+height)/2+18);
 if(collision||slot.y+height/2>H*(mobile?.86:.91)){el.remove();return null}
 later(()=>el.classList.add("in"),delay);
 return el;
}
async function showCloud(my){
 const generation=++cloudGeneration;clearInterval(showCloud._iv);let rows=[];
 try{rows=await API.listWishes(400)}catch{toast("暫時讀不到大家的祝福",4000)}
 if(generation!==cloudGeneration)return;
 if(!my)my=recallMine(rows);
 const familyRank=w=>{if(Number.isFinite(Number(w.family_rank)))return Number(w.family_rank);const t=`${w.name||""} ${w.message||""}`;if(/爸爸|父親|爸比|老爸|媽媽|母親|媽咪/.test(t))return 3;if(/哥哥|弟弟|姊姊|姐姐|妹妹|兄弟|姊妹|姐妹/.test(t))return 2;if(/家人|家屬|阿公|阿嬤|祖父|祖母|外公|外婆/.test(t))return 1;return 0};
 const ordered=list=>list.slice().sort((a,b)=>{const am=my&&String(a.id)===String(my.id),bm=my&&String(b.id)===String(my.id);if(am!==bm)return am?-1:1;const rd=familyRank(b)-familyRank(a);if(rd)return rd;return String(b.created_at||"").localeCompare(String(a.created_at||""))});
 cloudRows=ordered(rows);cloudMine=my;cloudSlots=slots();app.classList.add("cloudmode");app.dataset.scene="cloud";$("#cloud").innerHTML="";
 const shown=new Set();
 const renderRound=()=>{
  let pending=cloudRows.filter(w=>!shown.has(String(w.id)));
  if(!pending.length){shown.clear();pending=cloudRows.slice()}
  const batch=pending.slice(0,cloudSlots.length);
  batch.forEach((w,i)=>{shown.add(String(w.id));makeWord(w,cloudSlots[i],my&&String(w.id)===String(my.id),160+i*120)});
 };
 renderRound();
 // 約每五秒換一輪；每則祝福都會出現一次，再開始下一輪。
 showCloud._iv=setInterval(async()=>{
  if(!app.classList.contains("cloudmode")||generation!==cloudGeneration)return;
  try{
   const latest=await API.listWishes(400);if(generation!==cloudGeneration)return;
   cloudRows=ordered(latest);const current=$$(".wd");current.forEach(el=>el.classList.remove("in"));
   later(()=>{if(generation!==cloudGeneration)return;current.forEach(el=>el.remove());renderRound()},1150);
   }catch{}
  },MOTION.poll);
}
$("#cloud").addEventListener("click",async e=>{const b=e.target.closest(".del");if(!b)return;if(!confirm("刪除這則祝福？"))return;try{const r=await API.deleteWish(b.dataset.id,ADMIN);if(r&&r.ok){b.closest(".wd").remove();cloudRows=cloudRows.filter(w=>String(w.id)!==b.dataset.id);toast("已刪除")}else toast("刪除失敗："+(r&&r.error||"密語不對"))}catch(ex){toast("刪除失敗："+(ex.message||ex))}});
function esc(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}

/* ══════════════ 啟動 ══════════════ */
function applyConfig(){
  $("#title").textContent=CFG.title;$("#eyebrow").textContent=CFG.eyebrow;$("#subtitle").textContent=CFG.subtitle;$("#storyCap").textContent=CFG.storyCap||"";document.title=CFG.title;
  if(Array.isArray(CFG.intro)&&CFG.intro.length){const box=$("#storyText");const cap=$(".cap",box),cta=$(".cta",box);box.innerHTML="";box.appendChild(cap);CFG.intro.forEach(p=>{const el=document.createElement("p");el.textContent=p;box.appendChild(el)});box.appendChild(cta)}
  $$(".story p").forEach((el,i)=>el.style.setProperty("--paragraph",i));
  app.classList.toggle("has-photo",Boolean(CFG.photo));
  if(CFG.photo){$("#bgG").src=$("#bgC").src=CFG.photo}else{$("#bgG").src=PLATES.night;$("#bgC").src=PLATES.dawn}
  $$("#bg img").forEach(im=>{im.onerror=()=>{console.warn('底圖載入失敗，改用空間底圖：'+im.src);im.onerror=()=>{console.warn('空間底圖亦不可用，保留程式光場');im.style.display='none'};im.src=im.id==='bgG'?PLATES.night:PLATES.dawn}});
  $$('#figure .pose').forEach(im=>{im.onerror=()=>{console.warn('剪影載入失敗，改用向量側影：'+im.src);im.onerror=null;im.src='assets/motion/少年側影.svg'};if(im.complete&&!im.naturalWidth)im.onerror()});
  const room=$('#room');room.onerror=()=>{console.warn('夜景載入失敗，保留程式光場');room.style.display='none'};if(room.complete&&!room.naturalWidth)room.onerror();
  $("#foot").textContent=CFG.footerNote||"";if(ADMIN)app.classList.add("admin");
}
async function boot(){
  applyConfig();buildStars();resize();await Promise.all([assetsReady,optionalReady]);requestAnimationFrame(frame);
  API.init(CFG).then(info=>{if(info.mode==="mock")app.classList.add("mock");if(info.migrated>0)toast("已找回你先前在這支裝置留下的祝福",5000)}).catch(()=>{});
  API.listWishes(400).then(rows=>{
   if(S.mineStar<0)buildWishStars(rows.length);
   else {const own=S.wishStars[S.mineStar];buildWishStars(Math.min(399,rows.filter(w=>String(w.id)!==String(mine?.id)).length));S.mineStar=S.wishStars.length;S.wishStars.push(own);S.flights.forEach(f=>f.idx=S.mineStar)}
  }).catch(()=>{console.warn('祝福星列表暫時無法載入');if(S.mineStar<0)buildWishStars(0)});
  fetch("version.json",{cache:"no-store"}).then(r=>r.ok?r.json():null).then(v=>{if(v)$("#ver").textContent=`${v.commit||""} · ${v.built||""}`}).catch(()=>{});
  go("gate");$("#gateBtn").disabled=false;const jump=q.get("scene");
  if(jump){S.candles.forEach(c=>{c.litAt=performance.now();c.litAt-=4000;c.ready=true});S.skyA=1;app.classList.add("showbg");
    if(jump==="story")go("story");else if(jump==="wish")go("wish");else if(jump==="fly"){sound.prepare();go("gate");}else if(jump==="blow")blow(null);else if(jump==="dawn"){go("blank");dawn(null)}else if(jump==="cloud"){go("blank");S.dawnT=performance.now()-20000;app.classList.add("dawn");S.candles.forEach(c=>{c.out=true;c.outAt=performance.now()-5000});$("#sc-final").classList.add("on");$("#sc-final").inert=false;showCloud(null)}}
}
addEventListener("resize",resize);
boot();
})();
