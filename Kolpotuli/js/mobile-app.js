import { supabase } from './supabase.js';
import { t, setLanguage, initLanguage } from './i18n.js';
import { openAuth, refreshAuthUI } from './auth-ui.js';

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const esc = value => String(value ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');

const ICONS = {
  search:'<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/>',
  home:'<path d="m4 11 8-7 8 7"/><path d="M6.5 10.5V20h11v-9.5M10 20v-5h4v5"/>',
  library:'<path d="M7 6h10M7 10h10M7 14h10"/><path d="M9 4v16"/>',
  sparkle:'<path d="m12 3 1.4 5.6L19 10l-5.6 1.4L12 17l-1.4-5.6L5 10l5.6-1.4L12 3Z"/><path d="m19 16 .7 2.3L22 19l-2.3.7L19 22l-.7-2.3L19 16Z"/>',
  profile:'<circle cx="12" cy="8" r="3.4"/><path d="M5.5 21c.7-3.7 3-5.7 6.5-5.7s5.8 2 6.5 5.7"/>',
  settings:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1-1.8 1.8-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5v.2h-2.6v-.2a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1-1.8-1.8.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-.3-1.8 1.6 1.6 0 0 0-1.5-1H6.5v-2.6h.2a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1 1.8-1.8.1.1a1.6 1.6 0 0 0 1.8.3 1.6 1.6 0 0 0-1-1.5v-.2h2.6v.2a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1-1.5l.1-.1 1.8 1.8-.1.1a1.6 1.6 0 0 0-.3 1.8 1.6 1.6 0 0 0 .3 1.8 1.6 1.6 0 0 0 1.5 1h.2V14h-.2a1.6 1.6 0 0 0-1.5 1Z"/>',
  heart:'<path d="M20.4 8.8c0 5.1-8.4 9.7-8.4 9.7S3.6 13.9 3.6 8.8A4.5 4.5 0 0 1 12 6.2a4.5 4.5 0 0 1 8.4 2.6Z"/>',
  heartFilled:'<path fill="currentColor" stroke="none" d="M12 20.4S3.4 15.7 3.4 9a4.7 4.7 0 0 1 8.6-2.8A4.7 4.7 0 0 1 20.6 9c0 6.7-8.6 11.4-8.6 11.4Z"/>',
  note:'<path d="M7 5.5h7l3 3V19H7z"/><path d="M14 5.5V9h3M9.5 12h5M9.5 15h5"/>',
  close:'<path d="m7 7 10 10M17 7 7 17"/>',
  chevron:'<path d="m9 6 6 6-6 6"/>'
};
const icon = (name,size=18) => `<svg class="mobile-icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]||''}</svg>`;

let content = [];
let currentFilter = 'all';
let activeView = 'home';
let activeSheet = null;
let playing = false;

function user(){ return supabase.auth.getUser().then(result => result.data.user); }
function showView(name){
  activeView = name;
  $$('.mobile-view').forEach(view => view.classList.toggle('active', view.dataset.view === name));
  $$('.mobile-nav-item').forEach(button => button.classList.toggle('active', button.dataset.view === name));
  if(name === 'home') renderHome();
  if(name === 'explore') renderExplore();
  if(name === 'library') loadLibrary();
  if(name === 'profile') loadProfile();
}
function openSheet(name){
  activeSheet = name;
  const sheet = $(`[data-sheet="${name}"]`);
  const backdrop = $('.mobile-sheet-backdrop');
  if(!sheet || !backdrop) return;
  sheet.classList.add('open'); backdrop.classList.add('open');
  sheet.setAttribute('aria-hidden','false');
}
function closeSheet(){
  activeSheet = null; $$('.mobile-sheet').forEach(sheet => sheet.classList.remove('open'));
  $('.mobile-sheet-backdrop')?.classList.remove('open'); $$('.mobile-sheet').forEach(sheet => sheet.setAttribute('aria-hidden','true'));
}

function formatMeta(item){ return `${item.type}${item.language ? ` · ${item.language}`:''}${item.read_time_minutes ? ` · ${item.read_time_minutes} min`:''}`; }
function card(item){
  const bg = item.cover_image_url ? ` style="background-image:url('${esc(item.cover_image_url)}')"` : '';
  return `<article class="mobile-card"><button class="mobile-card-media" data-open="${esc(item.id)}" aria-label="Open ${esc(item.title)}"${bg}></button><div class="mobile-card-body"><h3>${esc(item.title)}</h3><p>${esc(formatMeta(item))}</p><div class="mobile-card-actions"><button class="mobile-open" data-open="${esc(item.id)}">Read ${icon('chevron',13)}</button><button class="mobile-save" data-save="${esc(item.id)}" aria-label="Save ${esc(item.title)}">${icon('heart',16)}</button></div></div></article>`;
}
function listItem(item){
  const itemIcon = item.type === 'art' ? 'sparkle' : item.type === 'blog' ? 'note' : 'library';
  return `<button class="mobile-list-item" data-open="${esc(item.id)}"><span class="mobile-list-icon">${icon(itemIcon,18)}</span><span class="mobile-list-copy"><strong>${esc(item.title)}</strong><small>${esc(formatMeta(item))}</small></span>${icon('chevron',16)}</button>`;
}
function bindContentActions(root=document){
  root.querySelectorAll('[data-open]').forEach(button => button.addEventListener('click',()=>openReader(button.dataset.open)));
  root.querySelectorAll('[data-save]').forEach(button => button.addEventListener('click',async event=>{event.stopPropagation();await toggleFavorite(button.dataset.save,button)}));
}
function openReader(id){ if(id) location.href=`read.html?id=${encodeURIComponent(id)}`; }

async function loadContent(){
  const {data,error}=await supabase.from('content_items').select('id,type,title,excerpt,cover_image_url,language,featured,read_time_minutes,published_at').eq('status','published').order('featured',{ascending:false}).order('published_at',{ascending:false}).limit(60);
  content=data||[];
  if(error) console.warn('Mobile content load:',error.message);
  renderHome(); renderExplore();
}
function renderHome(){
  const featured = content.find(item=>item.featured) || content[0];
  const others = content.filter(item=>item.id!==featured?.id).slice(0,4);
  const hero=$('[data-mobile-featured]');
  if(hero){
    if(featured){
      hero.innerHTML=`<span class="mobile-kicker">Featured ${esc(featured.type)}</span><h1>${esc(featured.title)}</h1><p>${esc(featured.excerpt||'A new piece from Kolpotuli.')}</p><div class="mobile-hero-actions"><button class="mobile-primary" data-open="${esc(featured.id)}">Open piece</button><button class="mobile-secondary" data-sheet-open="search">Explore</button></div>`;
    } else hero.innerHTML='<span class="mobile-kicker">Kolpotuli</span><h1>Stories, art, memory.</h1><p>Explore the living archive.</p><div class="mobile-hero-actions"><button class="mobile-primary" data-view="explore">Explore</button></div>';
    bindContentActions(hero);
  }
  const recent=$('[data-mobile-home-grid]'); if(recent) recent.innerHTML=others.length?others.map(card).join(''):'<div class="mobile-empty">No published content yet.</div>';
  if(recent) bindContentActions(recent);
  updateClockWeather(); renderRecent();
}
function renderExplore(){
  const grid=$('[data-mobile-explore-grid]'); if(!grid)return;
  const items=currentFilter==='all'?content:content.filter(item=>item.type===currentFilter);
  grid.innerHTML=items.length?items.slice(0,24).map(card).join(''):'<div class="mobile-empty">No published content in this section.</div>';
  bindContentActions(grid);
}

async function renderRecent(){
  const slot=$('[data-mobile-recent]'); if(!slot)return;
  const u=await user();
  if(!u){slot.innerHTML='<div class="mobile-empty">Sign in to keep your reading history.</div>';return;}
  const {data}=await supabase.from('recently_opened').select('opened_at,content_items(id,title,type,language,read_time_minutes)').eq('user_id',u.id).order('opened_at',{ascending:false}).limit(4);
  const rows=(data||[]).filter(row=>row.content_items).map(row=>row.content_items);
  slot.innerHTML=rows.length?`<div class="mobile-list">${rows.map(listItem).join('')}</div>`:'<div class="mobile-empty">Nothing opened yet.</div>';
  bindContentActions(slot);
}

async function markOpened(id){const u=await user();if(!u)return;await supabase.from('recently_opened').upsert({user_id:u.id,content_id:id,opened_at:new Date().toISOString()},{onConflict:'user_id,content_id'});}
async function toggleFavorite(id,button){
  const u=await user(); if(!u){openAuth();return;}
  const {data}=await supabase.from('favorites').select('content_id').eq('user_id',u.id).eq('content_id',id).maybeSingle();
  if(data){await supabase.from('favorites').delete().eq('user_id',u.id).eq('content_id',id);button.innerHTML=icon('heart',16)}
  else{await supabase.from('favorites').insert({user_id:u.id,content_id:id});button.innerHTML=icon('heartFilled',16)}
}

async function loadLibrary(){
  const panel=$('[data-mobile-library]'); if(!panel)return;
  const u=await user();
  if(!u){panel.innerHTML='<div class="mobile-empty">Sign in to access Saved, Reading, Collections, and your history.</div>';return;}
  const {data}=await supabase.from('favorites').select('created_at,content_items(id,title,type,language,read_time_minutes)').eq('user_id',u.id).order('created_at',{ascending:false}).limit(20);
  const rows=(data||[]).filter(row=>row.content_items).map(row=>row.content_items);
  panel.innerHTML=`<div class="mobile-section-head"><h2>Saved</h2><button data-sheet-open="library">More</button></div>${rows.length?`<div class="mobile-list">${rows.map(listItem).join('')}</div>`:'<div class="mobile-empty">Nothing saved yet.</div>'}`;
  bindContentActions(panel);
}

async function loadProfile(){
  const u=await user(); const panel=$('[data-mobile-profile]'); if(!panel)return;
  if(!u){panel.innerHTML='<div class="mobile-hero"><span class="mobile-kicker">Profile</span><h1>Make Kolpotuli yours.</h1><p>Sign in to save pieces, keep notes, and continue reading across devices.</p><div class="mobile-hero-actions"><button class="mobile-primary" data-auth>Sign in</button></div></div>';return;}
  const {data}=await supabase.from('profiles').select('display_name,username,bio,role').eq('id',u.id).single();
  panel.innerHTML=`<div class="mobile-hero"><span class="mobile-kicker">Profile</span><h1>${esc(data?.display_name||'Kolpotuli reader')}</h1><p>${esc(data?.bio||u.email||'')}</p><div class="mobile-hero-actions"><button class="mobile-primary" data-profile>Edit profile</button><button class="mobile-secondary" data-signout>Sign out</button></div></div><div class="mobile-stat-row"><div class="mobile-stat"><small>Username</small><strong>${esc(data?.username||'—')}</strong><span>${esc(data?.role||'user')}</span></div><div class="mobile-stat"><small>Account</small><strong>${u.email?'Active':'—'}</strong><span>Kolpotuli Auth</span></div></div>`;
  panel.querySelector('[data-profile]')?.addEventListener('click',()=>location.href='profile.html');
  panel.querySelector('[data-signout]')?.addEventListener('click',async()=>{await supabase.auth.signOut();loadProfile();renderRecent()});
}

function setupSearch(){
  const input=$('[data-mobile-search]'),button=$('[data-mobile-search-btn]'),results=$('[data-mobile-search-results]');
  const run=async()=>{
    const q=input.value.trim(); if(!q){results.innerHTML='';return}
    const safe=q.replace(/[%_]/g,m=>`\\${m}`);
    const {data}=await supabase.from('content_items').select('id,type,title,language,read_time_minutes').eq('status','published').or(`title.ilike.%${safe}%,excerpt.ilike.%${safe}%`).order('published_at',{ascending:false}).limit(20);
    results.innerHTML=(data||[]).length?`<div class="mobile-list">${data.map(listItem).join('')}</div>`:'<div class="mobile-empty">No matching published content.</div>';
    bindContentActions(results);
  };
  button?.addEventListener('click',run); input?.addEventListener('keydown',e=>{if(e.key==='Enter')run()});
}

function updateClockWeather(){
  const now=new Date();
  const time=new Intl.DateTimeFormat('en-IN',{hour:'numeric',minute:'2-digit',hour12:true}).format(now);
  const date=new Intl.DateTimeFormat('en-IN',{weekday:'short',day:'numeric',month:'short'}).format(now);
  $('[data-mobile-time]')?.replaceChildren(time); $('[data-mobile-date]')?.replaceChildren(date);
  fetch('https://api.open-meteo.com/v1/forecast?latitude=26.9124&longitude=75.7873&current=temperature_2m&timezone=Asia%2FKolkata').then(r=>r.json()).then(data=>{$('[data-mobile-temp]')?.replaceChildren(`${Math.round(data.current?.temperature_2m ?? 0)}°`) }).catch(()=>{});
}
function setupSheets(){
  $$('[data-sheet-open]').forEach(button=>button.addEventListener('click',()=>{const name=button.dataset.sheetOpen;openSheet(name);if(name==='search') $('[data-mobile-search]')?.focus();}));
  $$('[data-sheet-close]').forEach(button=>button.addEventListener('click',closeSheet));
  $('.mobile-sheet-backdrop')?.addEventListener('click',closeSheet);
}
function setupNav(){
  $$('.mobile-nav-item').forEach(button=>button.addEventListener('click',()=>showView(button.dataset.view)));
  $$('[data-view]').forEach(button=>button.addEventListener('click',()=>showView(button.dataset.view)));
  $('[data-auth]')?.addEventListener('click',openAuth);
}
function setupFilters(){
  $$('.mobile-tab').forEach(button=>button.addEventListener('click',()=>{$$('.mobile-tab').forEach(x=>x.classList.remove('active'));button.classList.add('active');currentFilter=button.dataset.filter;renderExplore()}));
}
function setupSettings(){
  $$('.mobile-wallpaper-choice').forEach(button=>button.addEventListener('click',()=>{const key=button.dataset.wallpaper;const map={main:"url('assets/wallpapers/kolpotuli-main.png')",dusk:"url('assets/wallpapers/kolpotuli-dusk.svg')",paper:"url('assets/wallpapers/kolpotuli-paper.svg')"};$('.mobile-wallpaper').style.backgroundImage=map[key]||map.main;localStorage.setItem('kolpotuli-mobile-wallpaper',key)}));
  const saved=localStorage.getItem('kolpotuli-mobile-wallpaper');if(saved){const map={main:"url('assets/wallpapers/kolpotuli-main.png')",dusk:"url('assets/wallpapers/kolpotuli-dusk.svg')",paper:"url('assets/wallpapers/kolpotuli-paper.svg')"};$('.mobile-wallpaper').style.backgroundImage=map[saved]||map.main}
}
function setupMusic(){
  $('[data-play]')?.addEventListener('click',()=>{playing=!playing;const b=$('[data-play]');b.textContent=playing?'❚❚':'▶';b.setAttribute('aria-label',playing?'Pause':'Play')});
}
function setupLanguage(){
  const current=initLanguage();
  const button=$('[data-language]'); if(!button)return;
  button.textContent=current==='bn'?'বাংলা':'EN';
  button.addEventListener('click',()=>{const next=(document.documentElement.lang||current)==='bn'?'en':'bn';setLanguage(next);button.textContent=next==='bn'?'বাংলা':'EN'});
}

async function boot(){
  document.documentElement.lang=initLanguage();
  setupLanguage(); setupSheets(); setupNav(); setupFilters(); setupSearch(); setupSettings(); setupMusic(); updateClockWeather(); setInterval(updateClockWeather,60000);
  await loadContent();
  showView('home');
  await refreshAuthUI();
  supabase.auth.onAuthStateChange(()=>{renderRecent();loadProfile();loadLibrary()});
  $$('[data-create]').forEach(button=>button.addEventListener('click',async()=>{const u=await user();if(u)location.href='admin.html';else openAuth()}));
  $('[data-notes-open]')?.addEventListener('click',()=>openSheet('notes'));
  $('[data-settings-open]')?.addEventListener('click',()=>openSheet('settings'));
}

boot();
