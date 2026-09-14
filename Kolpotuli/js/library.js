import { supabase } from './supabase.js';

const esc=s=>String(s??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
let activeTab='saved';
const panel=()=>document.querySelector('[data-library-panel]');
const user=async()=>{const{data:{user}}=await supabase.auth.getUser();return user};
const open=id=>{if(id)location.href=`read.html?id=${encodeURIComponent(id)}`};

export function setupLibrary(){
 document.querySelectorAll('[data-library-tab]').forEach(b=>b.addEventListener('click',()=>{activeTab=b.dataset.libraryTab;document.querySelectorAll('[data-library-tab]').forEach(x=>x.classList.toggle('active',x===b));loadLibrary()}));
}
export async function loadLibrary(){
 const root=panel();if(!root)return;const u=await user();
 if(!u){root.innerHTML='<div class="library-empty">Sign in to use your personal Library.</div>';return}
 root.innerHTML='<div class="library-empty">Loading…</div>';
 if(activeTab==='saved')return saved(u,root);
 if(activeTab==='reading')return reading(u,root);
 if(activeTab==='recent')return recent(u,root);
 return collections(u,root);
}
function itemRows(items,actionLabel='Open',removeCollectionId=null){
 if(!items?.filter(x=>x.content_items).length)return '<div class="library-empty">Nothing here yet.</div>';
 return `<div class="library-list">${items.filter(x=>x.content_items).map(x=>{const c=x.content_items;return `<button class="library-item" data-content-id="${esc(c.id)}"><span class="mini-thumb db-thumb" ${c.cover_image_url?`style="background-image:url('${esc(c.cover_image_url)}')"`:''}></span><span><strong>${esc(c.title)}</strong><small>${esc(c.type)}${c.read_time_minutes?` · ${c.read_time_minutes} min`:''}</small></span><em>${removeCollectionId?'Remove':actionLabel}</em></button>`}).join('')}</div>`;
}
async function saved(u,root){
 const{data,error}=await supabase.from('favorites').select('content_id,content_items(id,title,type,cover_image_url,read_time_minutes)').eq('user_id',u.id).order('created_at',{ascending:false});
 if(error){root.innerHTML='<div class="library-empty">Unable to load saved items.</div>';return}
 const groups={story:[],art:[],blog:[]};(data||[]).forEach(x=>groups[x.content_items?.type]?.push(x));
 root.innerHTML=`<div class="library-filter"><button class="active" data-kind="all">All</button><button data-kind="story">Stories</button><button data-kind="art">Art</button><button data-kind="blog">Blogs</button></div><div data-saved-list>${itemRows(data,'Open')}</div>`;
 const list=root.querySelector('[data-saved-list]');root.querySelectorAll('[data-kind]').forEach(b=>b.onclick=()=>{root.querySelectorAll('[data-kind]').forEach(x=>x.classList.toggle('active',x===b));const arr=b.dataset.kind==='all'?data:(groups[b.dataset.kind]||[]);list.innerHTML=itemRows(arr,'Open');wireItems(list)});wireItems(list);
}
async function reading(u,root){
 const{data,error}=await supabase.from('reading_progress').select('content_id,progress_percent,last_opened_at,content_items(id,title,type,cover_image_url,read_time_minutes)').eq('user_id',u.id).order('last_opened_at',{ascending:false});
 if(error){root.innerHTML='<div class="library-empty">Unable to load reading progress.</div>';return}
 const rows=(data||[]).filter(x=>x.content_items&&Number(x.progress_percent)<100);
 if(!rows.length){root.innerHTML='<div class="library-empty">You have no unfinished reading. Open a story and your progress will appear here.</div>';return}
 root.innerHTML=rows.map(x=>{const c=x.content_items,p=Math.round(Number(x.progress_percent)||0);return `<button class="reading-item" data-content-id="${esc(c.id)}"><span class="mini-thumb db-thumb" ${c.cover_image_url?`style="background-image:url('${esc(c.cover_image_url)}')"`:''}></span><span class="reading-copy"><strong>${esc(c.title)}</strong><small>${esc(c.type)} · ${p}% read</small><span class="progress-track"><i style="width:${p}%"></i></span></span><em>Continue →</em></button>`}).join('');wireItems(root);
}
async function recent(u,root){
 const{data,error}=await supabase.from('recently_opened').select('content_id,opened_at,content_items(id,title,type,cover_image_url,read_time_minutes)').eq('user_id',u.id).order('opened_at',{ascending:false}).limit(30);
 if(error){root.innerHTML='<div class="library-empty">Unable to load history.</div>';return}root.innerHTML=itemRows(data,'Open');wireItems(root);
}
async function collections(u,root){
 const{data,error}=await supabase.from('collections').select('id,name,description,created_at').eq('user_id',u.id).order('created_at',{ascending:false});
 if(error){root.innerHTML='<div class="library-empty">Unable to load collections.</div>';return}
 root.innerHTML=`<form class="collection-bar"><input name="name" placeholder="New collection name" maxlength="80" required><button>Create</button></form><div class="collection-grid">${(data||[]).map(c=>`<article class="collection-card"><button class="collection-open" data-collection-id="${esc(c.id)}"><strong>${esc(c.name)}</strong><small>${esc(c.description||'Personal collection')}</small></button><div class="collection-actions"><button data-rename="${esc(c.id)}">Rename</button><button data-delete="${esc(c.id)}">Delete</button></div></article>`).join('')||'<div class="library-empty">Create your first collection.</div>'}</div>`;
 root.querySelector('form').onsubmit=async e=>{e.preventDefault();const name=new FormData(e.currentTarget).get('name')?.trim();if(!name)return;const r=await supabase.from('collections').insert({user_id:u.id,name});if(r.error)alert(r.error.message);else loadLibrary()};
 root.querySelectorAll('[data-collection-id]').forEach(b=>b.onclick=()=>collectionDetail(u,b.dataset.collectionId,root));
 root.querySelectorAll('[data-rename]').forEach(b=>b.onclick=async()=>{const name=prompt('Collection name');if(name?.trim()){await supabase.from('collections').update({name:name.trim()}).eq('id',b.dataset.rename).eq('user_id',u.id);loadLibrary()}});
 root.querySelectorAll('[data-delete]').forEach(b=>b.onclick=async()=>{if(!confirm('Delete this collection?'))return;await supabase.from('collections').delete().eq('id',b.dataset.delete).eq('user_id',u.id);loadLibrary()});
}
async function collectionDetail(u,id,root){
 const{data:c}=await supabase.from('collections').select('id,name,description').eq('id',id).eq('user_id',u.id).maybeSingle();if(!c)return;
 const{data:items,error}=await supabase.from('collection_items').select('content_id,content_items(id,title,type,cover_image_url,read_time_minutes)').eq('collection_id',id).order('created_at',{ascending:false});
 root.innerHTML=`<div class="collection-detail-head"><button data-back-collections>← Collections</button><strong>${esc(c.name)}</strong></div>${error?'<div class="library-empty">Unable to load this collection.</div>':itemRows(items,'Open',id)}`;
 root.querySelector('[data-back-collections]').onclick=()=>collections(u,root);
 root.querySelectorAll('[data-content-id]').forEach(b=>b.onclick=async e=>{if(confirm('Remove this item from the collection?')){await supabase.from('collection_items').delete().eq('collection_id',id).eq('content_id',b.dataset.contentId);collectionDetail(u,id,root)}});
}
function wireItems(root){root.querySelectorAll('[data-content-id]').forEach(b=>b.onclick=()=>open(b.dataset.contentId));}

const s=document.createElement('style');s.textContent=`.library-filter{display:flex;gap:6px;margin:0 0 12px}.library-filter button,.collection-detail-head button{border:0;border-radius:9px;padding:7px 10px;background:rgba(20,40,61,.07);color:var(--ink);cursor:pointer;font-size:10px}.library-filter button.active{background:var(--navy);color:#fff}.library-list{display:grid;gap:7px}.library-item,.reading-item{width:100%;display:flex;align-items:center;gap:10px;border:0;text-align:left;background:rgba(255,255,255,.3);color:var(--ink);padding:9px;border-radius:12px;cursor:pointer}.library-item:hover,.reading-item:hover,.collection-card:hover{background:rgba(255,255,255,.55)}.library-item>span:nth-child(2),.reading-copy{flex:1}.library-item strong,.library-item small,.reading-copy strong,.reading-copy small{display:block}.library-item small,.reading-copy small{font-size:10px;opacity:.55;margin-top:3px}.library-item em,.reading-item em{font-size:10px;font-style:normal;opacity:.55}.reading-copy{min-width:0}.progress-track{display:block;height:5px;background:rgba(20,40,61,.1);border-radius:99px;margin-top:8px;overflow:hidden}.progress-track i{display:block;height:100%;background:var(--gold,#e8b43d);border-radius:99px}.collection-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}.collection-card{position:relative;border:0;text-align:left;color:var(--ink);padding:0;border-radius:12px;background:rgba(255,255,255,.4);overflow:hidden}.collection-open{display:block;width:100%;border:0;text-align:left;color:var(--ink);padding:14px;background:transparent;cursor:pointer}.collection-card strong,.collection-card small{display:block}.collection-card small{font-size:10px;opacity:.55;margin-top:4px}.collection-actions{display:flex;gap:5px;padding:0 10px 10px}.collection-actions button{border:0;border-radius:7px;padding:5px 7px;background:rgba(20,40,61,.07);cursor:pointer;font-size:9px;color:var(--ink)}.collection-detail-head{display:flex;align-items:center;gap:10px;margin-bottom:12px}.collection-detail-head strong{font-size:15px}.db-thumb{background-size:cover;background-position:center}@media(max-width:600px){.collection-grid{grid-template-columns:1fr}}`;document.head.appendChild(s);