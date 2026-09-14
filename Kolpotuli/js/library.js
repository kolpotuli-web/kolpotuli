import { supabase } from './supabase.js';

const esc = value => String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
let activeTab = 'saved';
const panel = () => document.querySelector('[data-library-panel]');
const user = async () => { const { data: { user } } = await supabase.auth.getUser(); return user; };
const open = id => { if (id) location.href = `read.html?id=${encodeURIComponent(id)}`; };

export function setupLibrary() {
  document.querySelectorAll('[data-library-tab]').forEach(button => button.addEventListener('click', () => {
    activeTab = button.dataset.libraryTab;
    document.querySelectorAll('[data-library-tab]').forEach(item => item.classList.toggle('active', item === button));
    loadLibrary();
  }));
}

export async function loadLibrary() {
  const root = panel();
  if (!root) return;
  const currentUser = await user();
  if (!currentUser) {
    root.innerHTML = '<div class="library-empty">Sign in to use your personal Library.</div>';
    return;
  }
  root.innerHTML = '<div class="library-empty">Loading…</div>';
  if (activeTab === 'saved') return saved(currentUser, root);
  if (activeTab === 'reading') return reading(currentUser, root);
  if (activeTab === 'recent') return recent(currentUser, root);
  return collections(currentUser, root);
}

function itemRows(items, actionLabel = 'Open', removeCollectionId = null) {
  if (!items?.filter(item => item.content_items).length) return '<div class="library-empty">Nothing here yet.</div>';
  return `<div class="library-list">${items.filter(item => item.content_items).map(item => {
    const content = item.content_items;
    return `<button class="library-item" data-content-id="${esc(content.id)}"><span class="mini-thumb db-thumb" ${content.cover_image_url ? `style="background-image:url('${esc(content.cover_image_url)}')"` : ''}></span><span><strong>${esc(content.title)}</strong><small>${esc(content.type)}${content.read_time_minutes ? ` · ${content.read_time_minutes} min` : ''}</small></span><em>${removeCollectionId ? 'Remove' : actionLabel}</em></button>`;
  }).join('')}</div>`;
}

async function saved(currentUser, root) {
  const { data, error } = await supabase.from('favorites').select('content_id,content_items(id,title,type,cover_image_url,read_time_minutes)').eq('user_id', currentUser.id).order('created_at', { ascending: false });
  if (error) { root.innerHTML = '<div class="library-empty">Unable to load saved items.</div>'; return; }
  const groups = { story: [], art: [], blog: [] };
  (data || []).forEach(item => groups[item.content_items?.type]?.push(item));
  root.innerHTML = `<div class="library-filter"><button class="active" data-kind="all">All</button><button data-kind="story">Stories</button><button data-kind="art">Art</button><button data-kind="blog">Blogs</button></div><div data-saved-list>${itemRows(data, 'Open')}</div>`;
  const list = root.querySelector('[data-saved-list]');
  root.querySelectorAll('[data-kind]').forEach(button => button.onclick = () => {
    root.querySelectorAll('[data-kind]').forEach(item => item.classList.toggle('active', item === button));
    const items = button.dataset.kind === 'all' ? data : (groups[button.dataset.kind] || []);
    list.innerHTML = itemRows(items, 'Open');
    wireItems(list);
  });
  wireItems(list);
}

async function reading(currentUser, root) {
  const { data, error } = await supabase.from('reading_progress').select('content_id,progress_percent,last_opened_at,content_items(id,title,type,cover_image_url,read_time_minutes)').eq('user_id', currentUser.id).order('last_opened_at', { ascending: false });
  if (error) { root.innerHTML = '<div class="library-empty">Unable to load reading progress.</div>'; return; }
  const rows = (data || []).filter(item => item.content_items && Number(item.progress_percent) < 100);
  if (!rows.length) { root.innerHTML = '<div class="library-empty">You have no unfinished reading. Open a story and your progress will appear here.</div>'; return; }
  root.innerHTML = rows.map(item => {
    const content = item.content_items;
    const progress = Math.round(Number(item.progress_percent) || 0);
    return `<button class="reading-item" data-content-id="${esc(content.id)}"><span class="mini-thumb db-thumb" ${content.cover_image_url ? `style="background-image:url('${esc(content.cover_image_url)}')"` : ''}></span><span class="reading-copy"><strong>${esc(content.title)}</strong><small>${esc(content.type)} · ${progress}% read</small><span class="progress-track"><i style="width:${progress}%"></i></span></span><em>Continue →</em></button>`;
  }).join('');
  wireItems(root);
}

async function recent(currentUser, root) {
  const { data, error } = await supabase.from('recently_opened').select('content_id,opened_at,content_items(id,title,type,cover_image_url,read_time_minutes)').eq('user_id', currentUser.id).order('opened_at', { ascending: false }).limit(30);
  if (error) { root.innerHTML = '<div class="library-empty">Unable to load history.</div>'; return; }
  root.innerHTML = itemRows(data, 'Open');
  wireItems(root);
}

async function collections(currentUser, root) {
  const { data, error } = await supabase.from('collections').select('id,name,description,created_at').eq('user_id', currentUser.id).order('created_at', { ascending: false });
  if (error) { root.innerHTML = '<div class="library-empty">Unable to load collections.</div>'; return; }
  root.innerHTML = `<form class="collection-bar"><input name="name" placeholder="New collection name" maxlength="80" required><button>Create</button></form><div class="collection-grid">${(data || []).map(collection => `<article class="collection-card"><button class="collection-open" data-collection-id="${esc(collection.id)}"><strong>${esc(collection.name)}</strong><small>${esc(collection.description || 'Personal collection')}</small></button><div class="collection-actions"><button data-rename="${esc(collection.id)}">Rename</button><button data-delete="${esc(collection.id)}">Delete</button></div></article>`).join('') || '<div class="library-empty">Create your first collection.</div>'}</div>`;
  root.querySelector('form').onsubmit = async event => {
    event.preventDefault();
    const name = new FormData(event.currentTarget).get('name')?.trim();
    if (!name) return;
    const result = await supabase.from('collections').insert({ user_id: currentUser.id, name });
    if (result.error) alert(result.error.message); else loadLibrary();
  };
  root.querySelectorAll('[data-collection-id]').forEach(button => button.onclick = () => collectionDetail(currentUser, button.dataset.collectionId, root));
  root.querySelectorAll('[data-rename]').forEach(button => button.onclick = async () => {
    const name = prompt('Collection name');
    if (name?.trim()) {
      await supabase.from('collections').update({ name: name.trim() }).eq('id', button.dataset.rename).eq('user_id', currentUser.id);
      loadLibrary();
    }
  });
  root.querySelectorAll('[data-delete]').forEach(button => button.onclick = async () => {
    if (!confirm('Delete this collection?')) return;
    await supabase.from('collections').delete().eq('id', button.dataset.delete).eq('user_id', currentUser.id);
    loadLibrary();
  });
}

async function collectionDetail(currentUser, id, root) {
  const { data: collection } = await supabase.from('collections').select('id,name,description').eq('id', id).eq('user_id', currentUser.id).maybeSingle();
  if (!collection) return;
  const { data: items, error } = await supabase.from('collection_items').select('content_id,content_items(id,title,type,cover_image_url,read_time_minutes)').eq('collection_id', id).order('created_at', { ascending: false });
  root.innerHTML = `<div class="collection-detail-head"><button data-back-collections>← Collections</button><strong>${esc(collection.name)}</strong></div>${error ? '<div class="library-empty">Unable to load this collection.</div>' : itemRows(items, 'Open', id)}`;
  root.querySelector('[data-back-collections]').onclick = () => collections(currentUser, root);
  root.querySelectorAll('[data-content-id]').forEach(button => button.onclick = async () => {
    if (!confirm('Remove this item from the collection?')) return;
    await supabase.from('collection_items').delete().eq('collection_id', id).eq('content_id', button.dataset.contentId);
    collectionDetail(currentUser, id, root);
  });
}

function wireItems(root) {
  root.querySelectorAll('[data-content-id]').forEach(button => button.onclick = () => open(button.dataset.contentId));
}
