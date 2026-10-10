import { supabase } from './supabase.js';

// Creator Studio keeps the form, permissions, and database calls in one place.
// The public site still controls which content is shown; this page edits records.
const $ = id => document.getElementById(id);
const editor = $('editor');
const statusMessage = $('status');
const itemsList = $('items');

let selectedType = 'story';
let editingId = null;
let slugWasEdited = false;

function showStatus(message) {
  statusMessage.textContent = message;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function slugify(title) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function chooseContentType(button) {
  selectedType = button.dataset.type;

  document.querySelectorAll('[data-type]').forEach(item => {
    item.classList.toggle('active', item === button);
  });
}

function clearEditor() {
  editor.reset();
  editingId = null;
  slugWasEdited = false;
  showStatus('');
}

function showPermissionError() {
  document.body.innerHTML = `
    <main style="max-width:640px;margin:12vh auto;padding:24px;font-family:system-ui;color:white">
      <h1>Creator access required</h1>
      <p>Your account needs editor or admin permission to manage content.</p>
      <a style="color:#f4b52c" href="index.html">Return to Kolpotuli</a>
    </main>`;
}

// Check the user's role before attempting to write. Database RLS must also
// enforce this permission; this check is for a clear interface, not security.
async function getEditorUser() {
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError) {
    showStatus('Could not verify your sign-in. Check the connection and try again.');
    return null;
  }

  const user = authData.user;
  if (!user) {
    location.href = 'index.html?auth=1';
    return null;
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError) {
    showStatus('Could not verify Creator Studio permissions. Please try again later.');
    return null;
  }

  if (!profile || !['admin', 'editor'].includes(profile.role)) {
    showPermissionError();
    return null;
  }

  return user;
}

async function loadContentList() {
  itemsList.innerHTML = '<small>Loading content…</small>';

  const { data, error } = await supabase
    .from('content_items')
    .select('id,type,title,slug,status,featured,created_at')
    .order('created_at', { ascending: false });

  if (error) {
    itemsList.textContent = 'Content could not be loaded. Please try again.';
    showStatus(error.message);
    return;
  }

  if (!data?.length) {
    itemsList.innerHTML = '<small>No content yet.</small>';
    return;
  }

  itemsList.innerHTML = data.map(item => `
    <div class="item">
      <div>
        <strong>${escapeHtml(item.title)}</strong>
        <small>${escapeHtml(item.type)} · ${escapeHtml(item.status)}${item.featured ? ' · featured' : ''}</small>
      </div>
      <button type="button" data-edit="${escapeHtml(item.id)}">Edit</button>
    </div>
  `).join('');

  itemsList.querySelectorAll('[data-edit]').forEach(button => {
    button.addEventListener('click', () => loadContentForEditing(button.dataset.edit));
  });
}

async function loadContentForEditing(id) {
  const { data: item, error } = await supabase
    .from('content_items')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !item) {
    showStatus('That content item could not be opened.');
    return;
  }

  editingId = item.id;
  selectedType = item.type;
  slugWasEdited = true;

  document.querySelectorAll('[data-type]').forEach(button => {
    button.classList.toggle('active', button.dataset.type === selectedType);
  });

  $('title').value = item.title || '';
  $('slug').value = item.slug || '';
  $('language').value = item.language || 'en';
  $('excerpt').value = item.excerpt || '';
  $('cover').value = item.cover_image_url || '';
  $('readtime').value = item.read_time_minutes ?? '';
  $('featured').checked = Boolean(item.featured);
  $('body').value = item.body || '';

  showStatus(`Editing: ${item.title}`);
}

async function saveContent(publish) {
  // Publish and Save Draft should follow the same form validation rules.
  if (!editor.reportValidity()) return;

  const user = await getEditorUser();
  if (!user) return;

  const title = $('title').value.trim();
  const slug = $('slug').value.trim() || slugify(title);

  // Bengali titles may not produce an ASCII slug. Ask for one rather than
  // silently saving an empty value or inventing a misleading URL.
  if (!slug) {
    showStatus('Please enter a short English URL slug for this title.');
    $('slug').focus();
    return;
  }

  $('slug').value = slug;
  showStatus('Saving…');

  const payload = {
    type: selectedType,
    title,
    slug,
    language: $('language').value,
    excerpt: $('excerpt').value.trim() || null,
    body: $('body').value,
    cover_image_url: $('cover').value.trim() || null,
    read_time_minutes: $('readtime').value === '' ? null : Number($('readtime').value),
    featured: $('featured').checked,
    status: publish ? 'published' : 'draft',
    author_id: user.id,
    published_at: publish ? new Date().toISOString() : null
  };

  // Categories and Tags are shown in the form but are not currently linked to
  // content_categories/content_tags. Do not guess relation columns while the
  // Supabase project is unavailable; report this if the fields were filled.
  const hasUnsavedLabels = Boolean($('categories').value.trim() || $('tags').value.trim());

  const result = editingId
    ? await supabase.from('content_items').update(payload).eq('id', editingId)
    : await supabase.from('content_items').insert(payload);

  if (result.error) {
    showStatus(result.error.message);
    return;
  }

  showStatus(publish ? 'Published successfully.' : 'Draft saved.');
  if (hasUnsavedLabels) {
    showStatus(`${publish ? 'Published successfully.' : 'Draft saved.'} Categories and tags are not saved yet.`);
  }

  clearEditor();
  await loadContentList();
}

function setupForm() {
  document.querySelectorAll('[data-type]').forEach(button => {
    button.addEventListener('click', () => chooseContentType(button));
  });

  $('backDesktop').addEventListener('click', () => {
    location.href = 'index.html';
  });

  $('title').addEventListener('input', () => {
    if (!editingId && !slugWasEdited) {
      $('slug').value = slugify($('title').value);
    }
  });

  $('slug').addEventListener('input', () => {
    slugWasEdited = true;
  });

  editor.addEventListener('submit', event => {
    event.preventDefault();
    saveContent(false);
  });

  $('publish').addEventListener('click', () => saveContent(true));
}

async function start() {
  setupForm();

  const user = await getEditorUser();
  if (user) await loadContentList();
}

start();
