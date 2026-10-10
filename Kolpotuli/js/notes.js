import { supabase } from './supabase.js';

const root = document.getElementById('notesApp');
if (!root) {
  // This module is only loaded by pages that include the Notes window.
  throw new Error('Notes window is missing.');
}

const list = root.querySelector('[data-notes-list]');
const titleInput = root.querySelector('[data-note-title]');
const bodyInput = root.querySelector('[data-note-body]');
const status = root.querySelector('[data-note-status]');
const saveButton = root.querySelector('[data-note-save]');
const newButton = root.querySelector('[data-note-new]');

let activeNoteId = null;
let savedTitle = '';
let savedBody = '';
let messageTimer;
let loadVersion = 0;

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
  if (error) {
    console.warn('Could not read note owner:', error.message);
    return null;
  }
  return data.user;
}

function showMessage(message, temporary = false) {
  status.textContent = message;
  window.clearTimeout(messageTimer);
  if (temporary) {
    messageTimer = window.setTimeout(() => {
      if (status.textContent === message) status.textContent = '';
    }, 2200);
  }
}

function isDirty() {
  return titleInput.value !== savedTitle || bodyInput.value !== savedBody;
}

function updateDirtyState() {
  if (!activeNoteId) return;
  showMessage(isDirty() ? 'Unsaved changes' : 'All changes saved');
}

function fillNote(note) {
  activeNoteId = note.id;
  savedTitle = note.title || '';
  savedBody = note.body || '';
  titleInput.value = savedTitle;
  bodyInput.value = savedBody;
  showMessage('All changes saved');
  list.querySelectorAll('[data-note-id]').forEach(button => {
    button.classList.toggle('active', button.dataset.noteId === note.id);
    button.setAttribute('aria-current', String(button.dataset.noteId === note.id));
  });
}

function renderNoteList(notes) {
  if (!notes.length) {
    list.innerHTML = '<div class="notes-empty">No notes yet. Create a note to keep an idea.</div>';
    return;
  }

  list.innerHTML = notes.map(note => {
    const label = note.title?.trim() || 'Untitled Note';
    const date = note.updated_at ? new Date(note.updated_at).toLocaleDateString() : '';
    return `<button type="button" class="note-list-item ${note.id === activeNoteId ? 'active' : ''}" data-note-id="${escapeHtml(note.id)}" aria-current="${note.id === activeNoteId}">
      <strong>${escapeHtml(label)}</strong><small>${escapeHtml(date)}</small>
    </button>`;
  }).join('');

  list.querySelectorAll('[data-note-id]').forEach(button => {
    button.addEventListener('click', async () => {
      const note = notes.find(item => item.id === button.dataset.noteId);
      if (!note) return;

      if (isDirty() && !window.confirm('Discard the unsaved changes to this note?')) return;
      fillNote(note);
    });
  });
}

async function loadNotes() {
  const version = ++loadVersion;
  const user = await currentUser();

  if (version !== loadVersion) return;
  if (!user) {
    activeNoteId = null;
    savedTitle = '';
    savedBody = '';
    titleInput.value = '';
    bodyInput.value = '';
    list.innerHTML = '<div class="notes-empty">Sign in to keep personal notes.</div>';
    showMessage('Sign in to save notes.');
    return;
  }

  list.innerHTML = '<div class="notes-empty">Loading notes…</div>';
  const { data, error } = await supabase.from('notes')
    .select('id,title,body,updated_at')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });

  if (version !== loadVersion) return;
  if (error) {
    console.warn('Could not load notes:', error.message);
    list.innerHTML = '<div class="notes-empty">Notes could not be loaded. Try again later.</div>';
    showMessage('Could not load notes.');
    return;
  }

  const notes = data || [];
  renderNoteList(notes);

  if (activeNoteId) {
    const current = notes.find(note => note.id === activeNoteId);
    if (current) return;
  }

  if (notes[0]) {
    fillNote(notes[0]);
  } else {
    activeNoteId = null;
    savedTitle = '';
    savedBody = '';
    titleInput.value = '';
    bodyInput.value = '';
    showMessage('Create a note to begin.');
  }
}

async function createNote() {
  const user = await currentUser();
  if (!user) {
    window.dispatchEvent(new Event('kolpotuli-open-auth'));
    return;
  }

  if (isDirty() && !window.confirm('Discard the unsaved changes and create a new note?')) return;

  showMessage('Creating note…');
  const { data, error } = await supabase.from('notes')
    .insert({ user_id: user.id, title: 'Untitled Note', body: '' })
    .select('id,title,body,updated_at')
    .single();

  if (error) {
    showMessage(error.message);
    return;
  }

  activeNoteId = data.id;
  savedTitle = '';
  savedBody = '';
  await loadNotes();
  fillNote(data);
  titleInput.focus();
}

async function saveNote() {
  const user = await currentUser();
  if (!user) {
    window.dispatchEvent(new Event('kolpotuli-open-auth'));
    return;
  }

  if (!activeNoteId) {
    await createNote();
    return;
  }

  const title = titleInput.value.trim() || 'Untitled Note';
  const body = bodyInput.value;
  showMessage('Saving…');
  saveButton.disabled = true;

  const { error } = await supabase.from('notes')
    .update({ title, body })
    .eq('id', activeNoteId)
    .eq('user_id', user.id);

  saveButton.disabled = false;
  if (error) {
    showMessage(error.message);
    return;
  }

  savedTitle = title;
  savedBody = body;
  titleInput.value = title;
  showMessage('Saved', true);
  await loadNotes();
}

newButton?.addEventListener('click', createNote);
saveButton?.addEventListener('click', saveNote);
titleInput.addEventListener('input', updateDirtyState);
bodyInput.addEventListener('input', updateDirtyState);
window.addEventListener('kolpotuli-notes-open', loadNotes);
window.addEventListener('kolpotuli-auth-changed', loadNotes);
supabase.auth.onAuthStateChange((_event, session) => {
  if (!session) {
    activeNoteId = null;
    titleInput.value = '';
    bodyInput.value = '';
  }
  loadNotes();
});

loadNotes();
