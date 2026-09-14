import { supabase } from './supabase.js';

const desktop=document.getElementById('desktop');
const windows=[...document.querySelectorAll('.app-window')];
let z=20;
const openWindow=id=>{const el=document.getElementById(id);if(!el)return;el.classList.remove('hidden');z++;el.style.zIndex=z;};
const closeWindow=id=>document.getElementById(id)?.classList.add('hidden');
document.addEventListener('click',e=>{const t=e.target.closest('[data-window]');if(t){e.preventDefault();openWindow(t.dataset.window)}const c=e.target.closest('[data-close]');if(c){e.preventDefault();closeWindow(c.dataset.close)}});
windows.forEach(w=>w.addEventListener('mousedown',()=>{z++;w.style.zIndex=z}));

function updateClock(){const n=new Date();const time=new Intl.DateTimeFormat('en-IN',{hour:'numeric',minute:'2-digit',hour12:true}).format(n);const date=new Intl.DateTimeFormat('en-IN',{weekday:'long',day:'numeric',month:'long'}).format(n);document.getElementById('clockTime')?.replaceChildren(time);document.getElementById('menuTime')?.replaceChildren(time);document.getElementById('clockDate')?.replaceChildren(date)}
updateClock();setInterval(updateClock,1000);

const lang=document.getElementById('languageToggle');
if(lang)lang.addEventListener('click',()=>{const bn=document.documentElement.lang!=='bn';document.documentElement.lang=bn?'bn':'en';lang.textContent=bn?'বাংলা / EN':'EN / বাংলা'});

const wallpapers={main:"url('assets/wallpapers/kolpotuli-main.png')",dusk:"url('assets/wallpapers/kolpotuli-dusk.svg')",paper:"url('assets/wallpapers/kolpotuli-paper.svg')"};
const saved=localStorage.getItem('kolpotuli-wallpaper')||'main';
if(desktop){desktop.style.setProperty('--wallpaper',wallpapers[saved]||wallpapers.main);desktop.style.setProperty('background-image',`linear-gradient(180deg,rgba(4,20,32,.08),rgba(4,20,32,.03)),${wallpapers[saved]||wallpapers.main}`,'important')}
document.querySelectorAll('[data-wallpaper]').forEach(b=>b.addEventListener('click',()=>{const k=b.dataset.wallpaper;if(!wallpapers[k]||!desktop)return;desktop.style.setProperty('--wallpaper',wallpapers[k]);desktop.style.setProperty('background-image',k==='main'?`linear-gradient(180deg,rgba(4,20,32,.08),rgba(4,20,32,.03)),${wallpapers[k]}`:wallpapers[k],'important');localStorage.setItem('kolpotuli-wallpaper',k);document.querySelectorAll('[data-wallpaper]').forEach(x=>x.classList.toggle('selected',x===b))}));
document.querySelector(`[data-wallpaper="${saved}"]`)?.classList.add('selected');

const style=document.createElement('style');style.textContent=`.settings-window{width:520px;left:50%;top:12%;transform:translateX(-50%);z-index:50}.settings-window h2{margin:0;color:var(--navy);font-size:25px}.settings-intro{margin:5px 0 22px;opacity:.65}.settings-window h3{font-size:12px;letter-spacing:.08em;text-transform:uppercase;margin:18px 0 10px;color:var(--teal)}.wallpaper-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.wallpaper-card{padding:8px;border:1px solid rgba(20,32,42,.12);border-radius:14px;background:rgba(255,255,255,.45);color:var(--ink);text-align:left;box-shadow:0 8px 20px rgba(20,32,42,.08);transition:.18s}.wallpaper-card:hover,.wallpaper-card.selected{transform:translateY(-3px);border-color:var(--gold);box-shadow:0 12px 24px rgba(20,32,42,.14)}.wallpaper-preview{display:block;height:78px;border-radius:9px;margin-bottom:8px;background-size:cover;background-position:center}.main-preview{background-image:url('../assets/wallpapers/kolpotuli-main.png')}.dusk-preview{background-image:url('../assets/wallpapers/kolpotuli-dusk.svg')}.paper-preview{background-image:url('../assets/wallpapers/kolpotuli-paper.svg')}.wallpaper-card strong,.wallpaper-card small{display:block}.wallpaper-card strong{font-size:12px}.wallpaper-card small{font-size:10px;opacity:.62;margin-top:2px}@media(max-width:800px){.settings-window{width:100%!important;left:auto;top:auto;transform:none}}`;document.head.appendChild(style);

const play=document.querySelector('.music-controls .play');if(play)play.addEventListener('click',()=>{play.classList.toggle('playing');play.textContent=play.classList.contains('playing')?'Ⅱ':'▶'});

const esc=s=>String(s??'').replace(/[&<>\"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[m]));
const contentByType={story:'stories',art:'art',blog:'blogs'};

async function loadContent(){
  const {data,error}=await supabase.from('content_items').select('id,type,title,excerpt,cover_image_url,language,featured,read_time_minutes,published_at').eq('status','published').order('featured',{ascending:false}).order('published_at',{ascending:false}).limit(60);
  if(error){console.warn('Kolpotuli content load:',error.message);return}
  const grouped={story:[],art:[],blog:[]};
  (data||[]).forEach(item=>grouped[item.type]?.push(item));
  renderContent('stories',grouped.story,'story');
  renderContent('art',grouped.art,'art');
  renderBlogs(grouped.blog);
  renderRecent(data||[]);
}
function renderContent(windowId,items,type){const win=document.getElementById(windowId);const grid=win?.querySelector('.card-grid');if(!grid||!items.length)return;grid.innerHTML=items.slice(0,12).map((x,i)=>`<article class="content-card" data-content-id="${esc(x.id)}"><div class="thumb db-thumb" style="${x.cover_image_url?`background-image:url('${esc(x.cover_image_url)}')`:''}"></div><h3>${esc(x.title)}</h3><p>${esc(type==='story'?'Story':'Artwork')}${x.read_time_minutes?` · ${x.read_time_minutes} min`:''}</p></article>`).join('');grid.querySelectorAll('[data-content-id]').forEach(card=>card.addEventListener('click',()=>markOpened(card.dataset.contentId)))}
function renderBlogs(items){const links=document.querySelector('.blog-links');if(!links||!items.length)return;links.innerHTML=items.slice(0,8).map(x=>`<button data-content-id="${esc(x.id)}">${esc(x.title)}</button>`).join('');links.querySelectorAll('[data-content-id]').forEach(b=>b.addEventListener('click',()=>markOpened(b.dataset.contentId)))}
function renderRecent(items){const box=document.querySelector('.recent-widget');if(!box||!items.length)return;box.innerHTML='<div class="widget-kicker">RECENTLY OPENED</div>'+items.slice(0,3).map(x=>`<button class="recent-item" data-content-id="${esc(x.id)}"><span>${x.type==='art'?'◆':x.type==='blog'?'▤':'▣'}</span><span><strong>${esc(x.title)}</strong><small>${esc(x.type)}</small></span></button>`).join('');box.querySelectorAll('[data-content-id]').forEach(b=>b.addEventListener('click',async()=>{await markOpened(b.dataset.contentId);const item=items.find(x=>x.id===b.dataset.contentId);openWindow(contentByType[item?.type]||'stories')}))}
async function markOpened(contentId){const {data:{user}}=await supabase.auth.getUser();if(!user)return;await supabase.from('recently_opened').upsert({user_id:user.id,content_id:contentId,opened_at:new Date().toISOString()})}

async function loadLibrary(){const {data:{user}}=await supabase.auth.getUser();if(!user)return;const {data,error}=await supabase.from('favorites').select('content_id,content_items(id,title,type,read_time_minutes)').eq('user_id',user.id);if(error||!data)return;const area=document.querySelector('#library .list-area');if(!area)return;area.innerHTML=data.length?data.map(x=>`<div class="library-item"><div class="mini-thumb"></div><div><strong>${esc(x.content_items?.title||'Saved item')}</strong><small>${esc(x.content_items?.type||'Content')}${x.content_items?.read_time_minutes?` · ${x.content_items.read_time_minutes} min`:''} · Saved</small></div></div>`).join(''):'<div class="library-empty">Your library is empty. Save a story, artwork or blog to see it here.</div>'}

async function boot(){
  const {data:{session}}=await supabase.auth.getSession();
  document.documentElement.dataset.auth=session?'signed-in':'signed-out';
  await loadContent();
  if(session)await loadLibrary();
  supabase.auth.onAuthStateChange(async(_event,newSession)=>{document.documentElement.dataset.auth=newSession?'signed-in':'signed-out';if(newSession)await loadLibrary()});
}
boot();
