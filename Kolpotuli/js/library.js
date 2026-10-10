import { supabase } from './supabase.js';

let activeTab = 'saved';

const panel = () => document.querySelector('[data-library-panel]');

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

async function currentUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user;
}

function openContent(id) {
  if (id) location.href = `read.html?id=${encodeURIComponent(id)}`;
}

function showMessage(root, message) {
  const node = document.createElement('p');
  node.className = 'library-empty';
  node.textContent = message;
  root.replaceChildren(node);
}

export function setupLibrary() {
  document.querySelectorAll('[data-library-tab]').forEach(button => {
    button.addEventListener('click', () => {
      activeTab = button.dataset.libraryTab;
      document.querySelectorAll('[data-library-tab]').forEach(tab => {
        const selected = tab === button;
        tab.classList.toggle('active', selected);
        tab.setAttribute('aria-selected', String(selected));
      });
      loadLibrary();
    });
  });
}

export async function loadLibrary() {
  const root = panel();
  if (!root) return;

  try {
    const user = await currentUser();
    if (!user) {
      showMessage(root, 'Sign in to use your personal Library.');
      return;
    }

    showMessage(root, 'Loading Library…');

    if (activeTab === 'saved') return await loadSaved(user, root);
    if (activeTab === 'reading') return await loadReading(user, root);
    if (activeTab === 'recent') return await loadRecent(user, root);
    return await loadCollections(user, root);
  } catch (error) {
    console.warn('Library load failed:', error);
    showMessage(root, 'Library could not be loaded. Check your connection and try again.');
  }
}

function renderContentRows(items, actionLabel = 'Open') {
  const content = (items || []).filter(row => row.content_items);
  if (!content.length) return '<div class="library-empty">Nothing here yet.</div>';

  return `<div class="library-list">${content.map(row => {
    const item = row.content_items;
    return `<button type="button" class="library-item" data-content-id="${escapeHtml(item.id)}">
      <span class="mini-thumb db-thumb" ${item.cover_image_url ? `style="background-image:url('${escapeHtml(item.cover_image_url)}')"` : ''}></span>
      <span><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.type)}${item.read_time_minutes ? ` · ${Number(item.read_time_minutes)} min` : ''}</small></span>
      <em>${actionLabel}</em>
    </button>`;
  }).join('')}</div>`;
}

function connectContentButtons(root) {
  root.querySelectorAll('[data-content-id]').forEach(button => {
    button.addEventListener('click', () => openContent(button.dataset.contentId));
  });
}

async function loadSaved(user, root) {
  const { data, error } = await supabase.from('favorites')
    .select('content_id,content_items(id,title,type,cover_image_url,read_time_minutes)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;

  const items = data || [];
  const groups = {
    all: items,
    story: items.filter(row => row.content_items?.type === 'story'),
    art: items.filter(row => row.content_items?.type === 'art'),
    blog: items.filter(row => row.content_items?.type === 'blog')
  };

  root.innerHTML = `
    <div class="library-filter" role="group" aria-label="Filter saved items">
      <button type="button" class="active" data-kind="all" aria-pressed="true">All</button>
      <button type="button" data-kind="story" aria-pressed="false">Stories</button>
      <button type="button" data-kind="art" aria-pressed="false">Art</button>
      <button type="button" data-kind="blog" aria-pressed="false">Blogs</button>
    </div>
    <div data-saved-list>${renderContentRows(items)}</div>`;

  const list = root.querySelector('[data-saved-list]');
  root.querySelectorAll('[data-kind]').forEach(button => {
    button.addEventListener('click', () => {
      root.querySelectorAll('[data-kind]').forEach(tab => {
        const selected = tab === button;
        tab.classList.toggle('active', selected);
        tab.setAttribute('aria-pressed', String(selected));
      });
      list.innerHTML = renderContentRows(groups[button.dataset.kind] || []);
      connectContentButtons(list);
    });
  });
  connectContentButtons(list);
}

async function loadReading(user, root) {
  const { data, error } = await supabase.from('reading_progress')
    .select('content_id,progress_percent,last_opened_at,content_items(id,title,type,cover_image_url,read_time_minutes)')
    .eq('user_id', user.id)
    .order('last_opened_at', { ascending: false });

  if (error) throw error;

  const unfinished = (data || []).filter(row => row.content_items && Number(row.progress_percent) < 100);
  if (!unfinished.length) {
    showMessage(root, 'No unfinished reading. Open a story to keep your place here.');
    return;
  }

  root.innerHTML = unfinished.map(row => {
    const item = row.content_items;
    const progress = Math.max(0, Math.min(100, Math.round(Number(row.progress_percent) || 0)));
    return `<button type="button" class="reading-item" data-content-id="${escapeHtml(item.id)}">
      <span class="mini-thumb db-thumb" ${item.cover_image_url ? `style="background-image:url('${escapeHtml(item.cover_image_url)}')"` : ''}></span>
      <span class="reading-copy"><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.type)} · ${progress}% read</small><span class="progress-track"><i style="width:${progress}%"></i></span></span>
      <em>Continue →</em>
    </button>`;
  }).join('');
  connectContentButtons(root);
}

async function loadRecent(user, root) {
  const { data, error } = await supabase.from('recently_opened')
    .select('content_id,opened_at,content_items(id,title,type,cover_image_url,read_time_minutes)')
    .eq('user_id', user.id)
    .order('opened_at', { ascending: false })
    .limit(30);

  if (error) throw error;
  root.innerHTML = renderContentRows(data || []);
  connectContentButtons(root);
}

async function loadCollections(user, root) {
  const { data, error } = await supabase.from('collections')
    .select('id,name,description,created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;

  root.innerHTML = `
    <form class="collection-bar">
      <label class="visually-hidden" for="newCollectionName">Collection name</label>
      <input id="newCollectionName" name="name" placeholder="New collection name" maxlength="80" required>
      <button type="submit">Create</button>
    </form>
    <div class="collection-grid">${(data || []).map(collection => `
      <article class="collection-card">
        <button type="button" class="collection-open" data-collection-id="${escapeHtml(collection.id)}">
          <strong>${escapeHtml(collection.name)}</strong>
          <small>${escapeHtml(collection.description || 'Personal collection')}</small>
        </button>
        <div class="collection-actions">
          <button type="button" data-rename="${escapeHtml(collection.id)}">Rename</button>
          <button type="button" data-delete="${escapeHtml(collection.id)}">Delete</button>
        </div>
      </article>`).join('') || '<div class="library-empty">Create a collection to keep related pieces together.</div>'}</div>`;

  root.querySelector('form').addEventListener('submit', async event => {
    event.preventDefault();
    const name = new FormData(event.currentTarget).get('name')?.trim();
    if (!name) return;

    const { error: createError } = await supabase.from('collections').insert({ user_id: user.id, name });
    if (createError) {
      window.alert(createError.message);
      return;
    }
    await loadLibrary();
  });

  root.querySelectorAll('[data-collection-id]').forEach(button => {
    button.addEventListener('click', () => loadCollectionDetail(user, button.dataset.collectionId, root));
  });

  root.querySelectorAll('[data-rename]').forEach(button => {
    button.addEventListener('click', async () => {
      const name = window.prompt('Choose a new collection name');
      if (!name?.trim()) return;

      const { error: renameError } = await supabase.from('collections')
        .update({ name: name.trim() })
        .eq('id', button.dataset.rename)
        .eq('user_id', user.id);
      if (renameError) window.alert(renameError.message);
      else await loadLibrary();
    });
  });

  root.querySelectorAll('[data-delete]').forEach(button => {
    button.addEventListener('click', async () => {
      if (!window.confirm('Delete this collection? Its saved pieces will not be deleted.')) return;

      const { error: deleteError } = await supabase.from('collections')
        .delete()
        .eq('id', button.dataset.delete)
        .eq('user_id', user.id);
      if (deleteError) window.alert(deleteError.message);
      else await loadLibrary();
    });
  });
}

async function loadCollectionDetail(user, collectionId, root) {
  const { data: collection, error: collectionError } = await supabase.from('collections')
    .select('id,name,description')
    .eq('id', collectionId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (collectionError) {
    showMessage(root, 'Could not load this collection.');
    return;
  }
  if (!collection) return;

  const { data: rows, error } = await supabase.from('collection_items')
    .select('content_id,content_items(id,title,type,cover_image_url,read_time_minutes)')
    .eq('collection_id', collectionId)
    .order('created_at', { ascending: false });

  const content = (rows || []).filter(row => row.content_items);
  root.innerHTML = `
    <div class="collection-detail-head"><button type="button" data-back-collections>← Collections</button><strong>${escapeHtml(collection.name)}</strong></div>
    ${error ? '<div class="library-empty">Unable to load this collection.</div>' : content.length ? `
      <div class="library-list">${content.map(row => {
        const item = row.content_items;
        return `<div class="collection-content-row">
          <button type="button" class="library-item" data-content-id="${escapeHtml(item.id)}">
            <span class="mini-thumb db-thumb" ${item.cover_image_url ? `style="background-image:url('${escapeHtml(item.cover_image_url)}')"` : ''}></span>
            <span><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.type)}</small></span>
            <em>Open</em>
          </button>
          <button type="button" class="collection-remove" data-remove-content="${escapeHtml(item.id)}">Remove</button>
        </div>`;
      }).join('')}</div>` : '<div class="library-empty">This collection is empty. Open a story and add it from the Reader.</div>'}
  `;

  root.querySelector('[data-back-collections]').addEventListener('click', () => loadCollections(user, root));
  connectContentButtons(root);

  root.querySelectorAll('[data-remove-content]').forEach(button => {
    button.addEventListener('click', async () => {
      if (!window.confirm('Remove this piece from the collection?')) return;

      button.disabled = true;
      const { error: removeError } = await supabase.from('collection_items')
        .delete()
        .eq('collection_id', collectionId)
        .eq('content_id', button.dataset.removeContent);

      if (removeError) {
        button.disabled = false;
        window.alert(removeError.message);
        return;
      }

      await loadCollectionDetail(user, collectionId, root);
    });
  });
}
