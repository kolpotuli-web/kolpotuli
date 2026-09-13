import { SITE } from './config/site.js';

const $ = (s, r=document) => r.querySelector(s);
const safe = s => String(s).replace(/[<>&"']/g, c => ({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&#39;'}[c]));
const slugTitle = path => decodeURIComponent(path.split('/').pop().replace(/\.[^.]+$/,'')).replace(/[-_]+/g,' ').replace(/\b\w/g,m=>m.toUpperCase());

let stories=[], art=[], blogs=[], activeFilter='All';

async function manifest(){
  try { const r=await fetch('./content-manifest.json',{cache:'no-store'}); return r.ok ? await r.json() : {stories:[],art:[],blogs:[]}; }
  catch { return {stories:[],art:[],blogs:[]}; }
}
function storyData(m){
  return (m.stories||[]).map((x,i)=>({id:x.id||`story-${i}`,path:x.path,title:x.title||slugTitle(x.path),author:x.author||'Kolpotuli',language:x.language||(/bengali/i.test(x.path)?'Bengali':'English'),category:x.category||'Other',tags:x.tags||[],description:x.description||'',readingTime:x.readingTime||''}));
}
function renderStories(){
  const q=($('#storySearch')?.value||'').trim().toLowerCase();
  const list=stories.filter(s=>(activeFilter==='All'||s.language===activeFilter||s.category===activeFilter)&&(`${s.title} ${s.author} ${s.description} ${s.tags.join(' ')}`.toLowerCase().includes(q)));
  const grid=$('#storyGrid'); if(!grid)return;
  grid.innerHTML=list.map(s=>`<article class="story-card" data-id="${safe(s.id)}"><div><span class="type">${safe(s.language)} · ${safe(s.category)}</span><h3>${safe(s.title)}</h3><div class="meta">${safe(s.author)}${s.readingTime?` · ${safe(s.readingTime)}`:''}</div>${s.description?`<p>${safe(s.description)}</p>`:''}</div><div><button class="open-story" data-id="${safe(s.id)}">Open story →</button></div></article>`).join('');
  $('#storyEmpty')?.classList.toggle('hidden',!!list.length);
  grid.querySelectorAll('.open-story').forEach(b=>b.onclick=e=>openReader(stories.find(s=>s.id===e.currentTarget.dataset.id)));
  grid.querySelectorAll('.story-card').forEach(c=>c.onclick=e=>{if(!e.target.closest('button'))openReader(stories.find(s=>s.id===c.dataset.id));});
}
function renderFilters(){
  const cats=['All','English','Bengali','Fantasy','Drama','Mystery','Poetry','Other'];
  $('#storyFilters').innerHTML=cats.map(c=>`<button class="filter ${c===activeFilter?'active':''}" type="button" data-filter="${c}">${c}</button>`).join('');
  $('#storyFilters').querySelectorAll('button').forEach(b=>b.onclick=()=>{activeFilter=b.dataset.filter;renderFilters();renderStories();});
}
function renderArt(){
  const g=$('#artGrid'); if(!g)return;
  g.innerHTML=art.map((x,i)=>`<figure class="art-item" tabindex="0"><img loading="lazy" src="${safe(x.path)}" alt="${safe(x.title||slugTitle(x.path))}"><figcaption class="art-caption"><strong>${safe(x.title||slugTitle(x.path))}</strong>${x.medium?`<small>${safe(x.medium)}</small>`:''}</figcaption></figure>`).join('');
  $('#artEmpty')?.classList.toggle('hidden',!!art.length);
  g.querySelectorAll('.art-item').forEach((el,i)=>{const item=art[i];el.onclick=()=>openLightbox(item);el.onkeydown=e=>{if(e.key==='Enter')openLightbox(item);}});
}
function renderBlogs(){
  const g=$('#blogGrid'); if(!g)return;
  g.innerHTML=blogs.map(x=>`<article class="journal-card"><span class="date">${safe(x.date||'')}</span><h3>${safe(x.title||slugTitle(x.path))}</h3><p>${safe(x.excerpt||'A page from the journal.')}</p><a class="text-link" href="${safe(x.path)}" target="_blank" rel="noreferrer">Read note →</a></article>`).join('');
  $('#blogEmpty')?.classList.toggle('hidden',!!blogs.length);
}
function openReader(s){
  if(!s?.path)return; const r=$('#reader');r.classList.add('open');r.setAttribute('aria-hidden','false');$('#readerTitle').textContent=s.title;$('#pdfFrame').src=s.path+'#zoom=page-width';
  $('#readerSave').textContent=localStorage.getItem('kolpotuli-save-'+s.id)==='1'?'★':'☆';
  $('#readerSave').onclick=()=>{const k='kolpotuli-save-'+s.id;localStorage.setItem(k,localStorage.getItem(k)==='1'?'0':'1');$('#readerSave').textContent=localStorage.getItem(k)==='1'?'★':'☆';};
}
function closeReader(){const r=$('#reader');r.classList.remove('open');r.setAttribute('aria-hidden','true');$('#pdfFrame').src='about:blank';}
function openLightbox(item){$('#lightboxImg').src=item.path;$('#lightboxImg').alt=item.title||slugTitle(item.path);$('#lightbox').classList.add('open');$('#lightbox').setAttribute('aria-hidden','false');}
function lang(){return localStorage.getItem('kolpotuli-lang')||'en';}
const translations={en:{stories:'Stories',art:'My Art',blogs:'Blogs',about:'About Me',contact:'Contact',eyebrow:'A little place for imagined things',lede:'Stories, pictures, notes, and unfinished dreams — kept here like pages inside a well-loved book.',enterStories:'Enter the library',seeArt:'Wander through the art →',sectionStories:'THE LIBRARY',storiesTitle:'Stories',storiesSub:'A shelf for things meant to be read slowly.',sectionArt:'THE SKETCHBOOK',artTitle:'My Art',artSub:'Images, studies, fragments, and accidents.',sectionBlogs:'THE JOURNAL',blogsTitle:'Blogs',blogsSub:'Notes from the edges of the page.',sectionAbout:'THE PERSON BEHIND THE PAGES',aboutTitle:'About Me',aboutText:'Kolpotuli is a bilingual personal archive for stories, art, films, fragments, and the strange little things that refuse to disappear.',sectionContact:'LEAVE A NOTE',contactTitle:'Contact',contactText:'For letters, collaborations, or simply saying hello.',name:'Name',email:'Email',message:'Message',send:'Send note'},bn:{stories:'গল্প',art:'আমার আঁকা',blogs:'লেখা',about:'আমার কথা',contact:'যোগাযোগ',eyebrow:'কল্পনার জন্য ছোট্ট এক আশ্রয়',lede:'গল্প, ছবি, নোট আর অসমাপ্ত স্বপ্ন — যত্নে রাখা, যেন প্রিয় বইয়ের ভাঁজে।',enterStories:'গল্পের ঘরে যান',seeArt:'আঁকাগুলোর মধ্যে ঘুরে আসুন →',sectionStories:'বইয়ের তাক',storiesTitle:'গল্প',storiesSub:'যা ধীরে পড়ার জন্য রেখে দেওয়া।',sectionArt:'স্কেচবুক',artTitle:'আমার আঁকা',artSub:'ছবি, পড়াশোনা, টুকরো আর আকস্মিক সৃষ্টি।',sectionBlogs:'ডায়েরি',blogsTitle:'লেখা',blogsSub:'পাতার কিনারা থেকে কিছু নোট।',sectionAbout:'পাতার আড়ালের মানুষ',aboutTitle:'আমার কথা',aboutText:'কল্পতুলি গল্প, আঁকা, চলচ্চিত্র আর টুকরো স্মৃতির জন্য একটি দ্বিভাষিক ব্যক্তিগত আর্কাইভ।',sectionContact:'একটি চিঠি রেখে যান',contactTitle:'যোগাযোগ',contactText:'চিঠি, সহযোগিতা, অথবা শুধু হ্যালো বলার জন্য।',name:'নাম',email:'ইমেল',message:'বার্তা',send:'পাঠিয়ে দিন'}};
function applyLang(){const l=lang();document.documentElement.lang=l==='bn'?'bn':'en';document.querySelectorAll('[data-i18n]').forEach(el=>{const v=translations[l][el.dataset.i18n];if(v)el.textContent=v;});$('#lang').textContent=l==='bn'?'English':'বাংলা';localStorage.setItem('kolpotuli-lang',l);}
async function boot(){
  $('#year').textContent=new Date().getFullYear();
  const m=await manifest(); stories=storyData(m); art=m.art||[]; blogs=m.blogs||[];renderFilters();renderStories();renderArt();renderBlogs();applyLang();
  $('#storySearch')?.addEventListener('input',renderStories); $('#lang')?.addEventListener('click',()=>{localStorage.setItem('kolpotuli-lang',lang()==='bn'?'en':'bn');applyLang();});$('#menu')?.addEventListener('click',()=>$('.site-nav').classList.toggle('open'));$('#readerClose')?.addEventListener('click',closeReader);$('#lightboxClose')?.addEventListener('click',()=>$('#lightbox').classList.remove('open'));$('#readerSepia')?.addEventListener('click',()=>$('#pdfFrame').classList.toggle('sepia'));$('#contactForm')?.addEventListener('submit',e=>{e.preventDefault();$('#formStatus').textContent='Thanks — your note is ready to be connected to Supabase when credentials are added.';e.currentTarget.reset();});
}
boot();
