import { supabase } from './supabase.js';

const title = document.querySelector('[data-mobile-note-title]');
const body = document.querySelector('[data-mobile-note-body]');
const list = document.querySelector('[data-mobile-notes-list]');
const status = document.querySelector('[data-mobile-note-status]');
let activeId = null;

const esc=s=>String(s??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
const user=()=>supabase.auth.getUser().then(result=>result.data.user);
const message=text=>{status.textContent=text;clearTimeout(message.t);message.t=setTimeout(()=>status.textContent='',1800)};

async function load(){
  const u=await user();
  if(!u){list.innerHTML='<div class="mobile-empty">Sign in to keep personal notes.</div>';return}
  const {data,error}=await supabase.from('notes').select('id,title,body,updated_at').eq('user_id',u.id).order('updated_at',{ascending:false});
  if(error){message(error.message);return}
  list.innerHTML=(data||[]).map(note=>`<button class="mobile-list-item" data-note-id="${esc(note.id)}"><span class="mobile-list-icon">✎</span><span class="mobile-list-copy"><strong>${esc(note.title||'Untitled Note')}</strong><small>${new Date(note.updated_at).toLocaleDateString()}</small></span>›</button>`).join('')||'<div class="mobile-empty">No notes yet.</div>';
  list.querySelectorAll('[data-note-id]').forEach(button=>button.addEventListener('click',()=>{const note=(data||[]).find(item=>item.id===button.dataset.noteId);if(note)fill(note)}));
  if(activeId){const current=(data||[]).find(note=>note.id===activeId);if(current)fill(current)}
}
function fill(note){activeId=note.id;title.value=note.title||'';body.value=note.body||''}

document.querySelector('[data-note-new]')?.addEventListener('click',async()=>{
  const u=await user();if(!u){window.dispatchEvent(new Event('kolpotuli-open-auth'));return}
  const {data,error}=await supabase.from('notes').insert({user_id:u.id,title:'Untitled Note',body:''}).select().single();
  if(error){message(error.message);return} activeId=data.id;fill(data);await load();title.focus();
});

document.querySelector('[data-note-save]')?.addEventListener('click',async()=>{
  const u=await user();if(!u){window.dispatchEvent(new Event('kolpotuli-open-auth'));return}
  if(!activeId){document.querySelector('[data-note-new]')?.click();return}
  const {error}=await supabase.from('notes').update({title:title.value.trim()||'Untitled Note',body:body.value}).eq('id',activeId).eq('user_id',u.id);
  message(error?error.message:'Saved');if(!error)load();
});

load();
