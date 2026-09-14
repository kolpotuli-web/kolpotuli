import { supabase } from './supabase.js';

const esc=s=>String(s??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
const root=document.getElementById('notesApp');
if(!root) throw new Error('notesApp missing');

let activeId=null;
const list=root.querySelector('[data-notes-list]');
const title=root.querySelector('[data-note-title]');
const body=root.querySelector('[data-note-body]');
const status=root.querySelector('[data-note-status]');
const save=root.querySelector('[data-note-save]');
const create=root.querySelector('[data-note-new]');

async function user(){const{data:{user}}=await supabase.auth.getUser();return user}
function message(x){status.textContent=x;clearTimeout(message.t);message.t=setTimeout(()=>status.textContent='',1800)}

async function load(){const u=await user();if(!u){list.innerHTML='<div class="notes-empty">Sign in to keep personal notes.</div>';title.value='';body.value='';activeId=null;return}const{data,error}=await supabase.from('notes').select('id,title,body,updated_at').eq('user_id',u.id).order('updated_at',{ascending:false});if(error){message('Could not load notes.');return}list.innerHTML=(data||[]).map(n=>`<button class="note-list-item ${n.id===activeId?'active':''}" data-id="${esc(n.id)}"><strong>${esc(n.title||'Untitled Note')}</strong><small>${new Date(n.updated_at).toLocaleDateString()}</small></button>`).join('')||'<div class="notes-empty">No notes yet.</div>';list.querySelectorAll('[data-id]').forEach(b=>b.onclick=()=>select((data||[]).find(n=>n.id===b.dataset.id)));if(activeId){const found=(data||[]).find(n=>n.id===activeId);if(found)fill(found)}else if(data?.[0])select(data[0])}
function fill(n){activeId=n.id;title.value=n.title||'';body.value=n.body||'';list.querySelectorAll('[data-id]').forEach(b=>b.classList.toggle('active',b.dataset.id===n.id))}
function select(n){if(n)fill(n)}
create.onclick=async()=>{const u=await user();if(!u){window.dispatchEvent(new Event('kolpotuli-open-auth'));return}const{data,error}=await supabase.from('notes').insert({user_id:u.id,title:'Untitled Note',body:''}).select().single();if(error){message(error.message);return}activeId=data.id;await load();fill(data);title.focus()};
save.onclick=async()=>{const u=await user();if(!u){window.dispatchEvent(new Event('kolpotuli-open-auth'));return}if(!activeId){create.click();return}const{error}=await supabase.from('notes').update({title:title.value.trim()||'Untitled Note',body:body.value}).eq('id',activeId).eq('user_id',u.id);message(error?error.message:'Saved');if(!error)load()};
root.addEventListener('input',()=>{status.textContent='Unsaved changes'});
supabase.auth.onAuthStateChange(()=>load());
load();
