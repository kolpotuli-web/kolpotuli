import { supabase } from './supabase.js';
import { t, setLanguage, initLanguage } from './i18n.js';
import { openAuth, refreshAuthUI } from './auth-ui.js';

const desktop = document.getElementById('desktop');
const commandPalette = document.getElementById('commandPalette');
const commandInput = document.getElementById('commandInput');
const commandResults = document.getElementById('commandResults');
const toastRegion = document.getElementById('toastRegion');

let highestWindowLevel = 20;
let commandIndex = 0;
let commandItems = [];
let contentItems = [];
const filters = { stories: 'all', art: 'all' };
const searches = { stories: '', art: '' };
const viewModes = { stories: 'grid', art: 'grid' };
const FAVORITE_ICON = 'heartFilled';

const ICONS = {
  search: '<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/>',
  sparkle: '<path d="m12 3 1.4 5.6L19 10l-5.6 1.4L12 17l-1.4-5.6L5 10l5.6-1.4L12 3Z"/>',
  profile: '<circle cx="12" cy="8" r="3.4"/><path d="M5.5 21c.7-3.7 3-5.7 6.5-5.7s5.8 2 6.5 5.7"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1-1.8 1.8-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5v.2h-2.6v-.2a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1-1.8-1.8.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H6.5v-2.6h.2a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1 1.8-1.8.1.1a1.6 1.6 0 0 0 1.8.3 1.6 1.6 0 0 0 1-1.5v-.2h2.6v.2a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1 1.8 1.8-.1.1a1.6 1.6 0 0 0-.3 1.8 1.6 1.6 0 0 0 1.5 1h.2V14h-.2a1.6 1.6 0 0 0-1.5 1Z"/>',
  cloud: '<path d="M7.2 18.5h9.3a4.3 4.3 0 0 0 .4-8.6 5.8 5.8 0 0 0-11.1 1.6 3.6 3.6 0 0 0 1.4 7Z"/>',
  heart: '<path d="M20.4 8.8c0 5.1-8.4 9.7-8.4 9.7S3.6 13.9 3.6 8.8A4.5 4.5 0 0 1 12 6.2a4.5 4.5 0 0 1 8.4 2.6Z"/>',
  heartFilled: '<path fill="currentColor" stroke="none" d="M12 20.4S3.4 15.7 3.4 9a4.7 4.7 0 0 1 8.6-2.8A4.7 4.7 0 0 1 20.6 9c0 6.7-8.6 11.4-8.6 11.4Z"/>',
  previous: '<path d="m15 6-6 6 6 6M7 6v12"/>',
  next: '<path d="m9 6 6 6-6 6M17 6v12"/>',
  play: '<path fill="currentColor" stroke="none" d="m9 6 9 6-9 6V6Z"/>',
  pause: '<path fill="currentColor" stroke="none" d="M8 6.5h3v11H8zm5 0h3v11h-3z"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  refresh: '<path d="M20 7v5h-5"/><path d="M4.7 9a7.5 7.5 0 0 1 12.4-2.7L20 12M4 17v-5h5"/><path d="M19.3 15a7.5 7.5 0 0 1-12.4 2.7L4 12"/>',
  grid: '<rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><rect x="14" y="14" width="6" height="6" rx="1"/>',
  list: '<path d="M9 6h11M9 12h11M9 18h11"/><circle cx="5" cy="6" r=".8" fill="currentColor"/><circle cx="5" cy="12" r=".8" fill="currentColor"/><circle cx="5" cy="18" r=".8" fill="currentColor"/>',
  folderStories: '<path d="M7 7h10M7 11h10M7 15h6"/>',
  folderLibrary: '<path d="M7 7h10M7 11h10M7 15h10"/><path d="M9 5v14"/>',
  folderArt: '<path d="m12 6 6 6-6 6-6-6 6-6Z"/><circle cx="12" cy="12" r="1.4"/>',
  folderBlogs: '<path d="M7 7h10M7 11h10M7 15h7"/><path d="m16 14 3 3-3 3"/>',
  note: '<path d="M7 5.5h7l3 3V19H7z"/><path d="M14 5.5V9h3M9.5 12h5M9.5 15h5"/>',
  signal: '<path d="M5 18v-3M9 18v-5M13 18v-8M17 18V7M21 18V4"/>',
  music: '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
  close: '<path d="m7 7 10 10M17 7 7 17"/>'
};

const svgIcon = (name, size = 20) => `<svg class="ko-icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ''}</svg>`;

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function notify(message, kind = 'info') {
  if (!toastRegion) return;
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.dataset.kind = kind;
  toast.textContent = message;
  toastRegion.append(toast);
  window.setTimeout(() => toast.remove(), 2600);
}

function setEmptyState(target, title, detail = '') {
  if (!target) return;
  target.replaceChildren();
  const state = document.createElement('div');
  state.className = 'library-empty';
  const heading = document.createElement('strong');
  heading.textContent = title;
  state.append(heading);
  if (detail) {
    const copy = document.createElement('p');
    copy.textContent = detail;
    state.append(copy);
  }
  target.append(state);
}

async function currentUser() {
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      console.warn('Could not read current user:', error.message);
      return null;
    }
    return data.user;
  } catch (error) {
    console.warn('Authentication is not available:', error);
    return null;
  }
}

function openWindow(id) {
  const win = document.getElementById(id);
  if (!win) return;
  win.classList.remove('hidden', 'minimized');
  highestWindowLevel += 1;
  win.style.zIndex = String(highestWindowLevel);
  setActiveWindow(win);
  if (id === 'library') loadLibrary();
  if (id === 'notes') window.dispatchEvent(new Event('kolpotuli-notes-open'));
  if (['stories', 'art'].includes(id)) {
    requestAnimationFrame(() => win.querySelector('[data-search]')?.focus({ preventScroll: true }));
  }
}

function closeWindow(id) {
  const win = document.getElementById(id);
  if (!win) return;
  win.classList.add('hidden');
  win.classList.remove('minimized');
  win.removeAttribute('data-active');
}

function minimizeWindow(id) {
  const win = document.getElementById(id);
  if (!win) return;
  win.classList.add('minimized');
  win.removeAttribute('data-active');
}

function zoomWindow(id) {
  const win = document.getElementById(id);
  if (!win) return;

  const isZoomed = win.dataset.zoomed === 'true';
  win.dataset.zoomed = String(!isZoomed);
  if (isZoomed) {
    ['left', 'top', 'width', 'height', 'maxHeight', 'transform'].forEach(property => { win.style[property] = ''; });
  } else {
    win.style.left = '12px';
    win.style.top = '12px';
    win.style.width = 'calc(100% - 24px)';
    win.style.height = 'calc(100% - 24px)';
    win.style.maxHeight = 'calc(100% - 24px)';
    win.style.transform = 'none';
  }
  focusWindow(win);
}

function focusWindow(win) {
  highestWindowLevel += 1;
  win.style.zIndex = String(highestWindowLevel);
  setActiveWindow(win);
}

function setActiveWindow(activeWin) {
  document.querySelectorAll('[data-app-window]').forEach(win => {
    win.dataset.active = String(win === activeWin);
  });
}

function toggleCommandPalette(show) {
  if (!commandPalette) return;
  const shouldShow = typeof show === 'boolean' ? show : commandPalette.classList.contains('hidden');
  commandPalette.classList.toggle('hidden', !shouldShow);
  if (shouldShow) {
    commandInput.value = '';
    updateCommandResults('');
    requestAnimationFrame(() => commandInput.focus());
  } else {
    commandInput.blur();
  }
}

function searchableContent() {
  return contentItems.filter(item => item.status === 'published');
}

function findContent(query, limit = 30) {
  const term = query.trim().toLocaleLowerCase();
  const list = searchableContent();
  if (!term) return list.slice(0, limit);
  return list.filter(item => [item.title, item.excerpt, item.body, item.type, item.language, item.slug]
    .some(value => String(value || '').toLocaleLowerCase().includes(term))).slice(0, limit);
}

function commandActions(query) {
  const actions = [
    { title: t('Stories'), type: 'Open folder', icon: 'folderStories', run: () => openWindow('stories') },
    { title: t('Art'), type: 'Open folder', icon: 'folderArt', run: () => openWindow('art') },
    { title: t('Library'), type: 'Open folder', icon: 'folderLibrary', run: () => openWindow('library') },
    { title: t('Notes'), type: 'Open folder', icon: 'note', run: () => openWindow('notes') },
    { title: t('Settings'), type: 'Preferences', icon: 'settings', run: () => openWindow('settings') }
  ];
  return actions.filter(item => !query || item.title.toLocaleLowerCase().includes(query.toLocaleLowerCase()));
}

function updateCommandResults(query) {
  if (!commandResults) return;

  const term = query.trim();
  const results = term
    ? findContent(term, 12).map(item => ({
        title: item.title,
        type: item.type === 'art' ? 'Art' : item.type === 'blog' ? 'Blog' : 'Story',
        icon: item.type === 'art' ? 'folderArt' : item.type === 'blog' ? 'folderBlogs' : 'folderStories',
        run: () => openReader(item.id)
      }))
    : commandActions('');

  commandItems = results;
  commandIndex = 0;

  if (!results.length) {
    setEmptyState(commandResults, 'No matches found', 'Try another title, phrase or content type.');
    return;
  }

  commandResults.innerHTML = results.map((item, index) => `
    <button type="button" class="command-result ${index === 0 ? 'active' : ''}" role="option" aria-selected="${index === 0}" data-command-index="${index}">
      ${svgIcon(item.icon, 18)}<strong>${escapeHtml(item.title)}</strong><span class="command-type">${escapeHtml(item.type)}</span>
    </button>`).join('');

  commandResults.querySelectorAll('[data-command-index]').forEach(button => {
    button.addEventListener('click', () => runCommand(Number(button.dataset.commandIndex)));
  });
}

function runCommand(index) {
  const item = commandItems[index];
  if (!item) return;
  toggleCommandPalette(false);
  item.run();
}

function moveCommandSelection(direction) {
  const buttons = Array.from(commandResults.querySelectorAll('[data-command-index]'));
  if (!buttons.length) return;

  commandIndex = (commandIndex + direction + buttons.length) % buttons.length;
  buttons.forEach((button, index) => {
    button.classList.toggle('active', index === commandIndex);
    button.setAttribute('aria-selected', String(index === commandIndex));
  });
  buttons[commandIndex].scrollIntoView({ block: 'nearest' });
}

function applyAppearance(appearance) {
  const selected = ['system', 'light', 'dark'].includes(appearance) ? appearance : 'system';
  document.documentElement.dataset.appearance = selected;
  localStorage.setItem('kolpotuli-appearance', selected);
  document.querySelectorAll('[data-appearance-choice]').forEach(button => {
    const active = button.dataset.appearanceChoice === selected;
    button.classList.toggle('selected', active);
    button.setAttribute('aria-pressed', String(active));
  });
}

function applyWallpaper(key) {
  const wallpapers = {
    main: "url('assets/wallpapers/kolpotuli-main.png')",
    dusk: "url('assets/wallpapers/kolpotuli-dusk.svg')",
    paper: "url('assets/wallpapers/kolpotuli-paper.svg')"
  };
  const selected = wallpapers[key] ? key : 'main';
  const layer = desktop.querySelector('.desktop-wallpaper');
  if (!layer) return;
  layer.style.backgroundImage = wallpapers[selected];
  document.querySelectorAll('[data-wallpaper]').forEach(button => {
    const active = button.dataset.wallpaper === selected;
    button.classList.toggle('selected', active);
    button.setAttribute('aria-pressed', String(active));
  });
  localStorage.setItem('kolpotuli-wallpaper', selected);
}

function applyWallpaperMode(mode) {
  const selected = mode === 'dynamic' ? 'dynamic' : 'still';
  desktop.dataset.wallpaperMode = selected;
  localStorage.setItem('kolpotuli-wallpaper-mode', selected);
  document.querySelectorAll('[data-wallpaper-mode]').forEach(button => {
    const active = button.dataset.wallpaperMode === selected;
    button.classList.toggle('selected', active);
    button.setAttribute('aria-pressed', String(active));
  });
}

function setupSettings() {
  applyAppearance(localStorage.getItem('kolpotuli-appearance') || 'system');
  applyWallpaper(localStorage.getItem('kolpotuli-wallpaper') || 'main');
  applyWallpaperMode(localStorage.getItem('kolpotuli-wallpaper-mode') || 'still');

  document.querySelectorAll('[data-appearance-choice]').forEach(button => {
    button.addEventListener('click', () => applyAppearance(button.dataset.appearanceChoice));
  });
  document.querySelectorAll('[data-wallpaper]').forEach(button => {
    button.addEventListener('click', () => applyWallpaper(button.dataset.wallpaper));
  });
  document.querySelectorAll('[data-wallpaper-mode]').forEach(button => {
    button.addEventListener('click', () => applyWallpaperMode(button.dataset.wallpaperMode));
  });
}

function setupIconography() {
  document.querySelectorAll('[data-icon]').forEach(element => {
    const name = element.dataset.icon;
    const size = Number(element.dataset.iconSize || 20);
    if (!ICONS[name]) return;
    const target = element.matches('button') ? element.querySelector(':scope > span') : element;
    if (target) target.innerHTML = svgIcon(name, size);
  });
}

function renderContent(section, items, type) {
  const grid = document.querySelector(`[data-grid="${section}"]`);
  const count = document.querySelector(`[data-count="${section}"]`);
  if (!grid) return;

  const query = searches[section] || '';
  const filter = filters[section] || 'all';
  // The query uses the text people can see in the shelf. "Recently Added"
  // starts with the first twelve rows from the date-sorted content query.
  const baseItems = filter === 'new' ? items.slice(0, 12) : items;
  const visible = baseItems.filter(item => {
    const matchesQuery = !query || [item.title, item.excerpt, item.language, item.slug]
      .some(value => String(value || '').toLocaleLowerCase().includes(query.toLocaleLowerCase()));
    const matchesFilter =
      filter === 'all'
      || filter === 'new'
      || (filter === 'bn' && item.language === 'bn')
      || (filter === 'en' && item.language === 'en')
      || (filter === 'featured' && Boolean(item.featured));
    return matchesQuery && matchesFilter;
  });

  if (count) count.textContent = `${visible.length} ${visible.length === 1 ? 'item' : 'items'}`;
  grid.classList.toggle('list-view', viewModes[section] === 'list');

  if (!visible.length) {
    setEmptyState(grid, query ? 'No matches found' : 'Nothing here yet', query ? 'Try another title or word.' : `Published ${type === 'story' ? 'stories' : 'artwork'} will appear here.`);
    return;
  }

  grid.innerHTML = visible.slice(0, 48).map(item => {
    const contentType = item.type === 'blog' ? 'Blog' : item.type === 'art' ? 'Art' : 'Story';
    const cover = item.cover_image_url ? `background-image:url("${escapeHtml(item.cover_image_url)}")` : '';
    const favourite = item.is_favorite ? 'true' : 'false';
    return `
      <article class="content-card" data-content-id="${escapeHtml(item.id)}" tabindex="0" role="link" aria-label="Open ${escapeHtml(item.title)}">
        <div class="thumb db-thumb" style="${cover}" aria-hidden="true"></div>
        <button class="save-content" type="button" data-save="${escapeHtml(item.id)}" aria-label="Save ${escapeHtml(item.title)}" aria-pressed="${favourite}" title="Save to Library">${svgIcon(favourite === 'true' ? FAVORITE_ICON : 'heart', 15)}</button>
        <h3>${escapeHtml(item.title)}</h3>
        <p>${escapeHtml(contentType)}${item.read_time_minutes ? ` · ${Number(item.read_time_minutes)} min` : ''}</p>
      </article>`;
  }).join('');

  grid.querySelectorAll('[data-content-id]').forEach(card => {
    const open = () => openReader(card.dataset.contentId);
    card.addEventListener('click', event => {
      if (event.target.closest('[data-save]')) return;
      open();
    });
    card.addEventListener('keydown', event => {
      if (event.target !== card) return;
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        open();
      }
    });
  });

  grid.querySelectorAll('[data-save]').forEach(button => {
    button.addEventListener('click', async event => {
      event.stopPropagation();
      await toggleFavorite(button.dataset.save, button);
    });
  });
}

function renderBlogs(items) {
  const list = document.querySelector('.blog-links');
  if (!list) return;
  if (!items.length) {
    setEmptyState(list, 'No blog posts yet', 'Thoughts on literature, culture and everyday life will appear here.');
    return;
  }

  list.innerHTML = items.slice(0, 30).map(item => `
    <button type="button" data-content-id="${escapeHtml(item.id)}">
      <span>${escapeHtml(item.title)}</span><span aria-hidden="true">↗</span>
    </button>`).join('');

  list.querySelectorAll('[data-content-id]').forEach(button => {
    button.addEventListener('click', () => openReader(button.dataset.contentId));
  });
}

async function loadContent() {
  document.querySelectorAll('[data-grid]').forEach(grid => setEmptyState(grid, 'Loading…', 'Opening your shelf.'));
  try {
    const { data, error } = await supabase.from('content_items')
      .select('id,type,title,excerpt,body,cover_image_url,language,featured,read_time_minutes,published_at,slug,status')
      .eq('status', 'published')
      .order('featured', { ascending: false })
      .order('published_at', { ascending: false })
      .limit(120);

    if (error) throw error;
    contentItems = data || [];
    window.kolpotuliContent = contentItems;

    renderContent('stories', contentItems.filter(item => item.type === 'story'), 'story');
    renderContent('art', contentItems.filter(item => item.type === 'art'), 'art');
    renderBlogs(contentItems.filter(item => item.type === 'blog'));
    await renderRecent();
  } catch (error) {
    console.error('Could not load Kolpotuli content:', error);
    document.querySelectorAll('[data-grid]').forEach(grid => setEmptyState(grid, 'Could not load content', 'Check your connection and try again.'));
    const blogList = document.querySelector('.blog-links');
    if (blogList) setEmptyState(blogList, 'Could not load blog posts', 'Check your connection and try again.');
    notify('Content could not be loaded.', 'error');
  }
}

async function renderRecent() {
  const box = document.querySelector('.recent-widget');
  if (!box) return;

  const user = await currentUser();
  if (!user) {
    box.innerHTML = `<div class="widget-kicker">${t('RECENTLY OPENED')}</div><div class="widget-sub">Sign in to keep your history.</div>`;
    return;
  }

  try {
    const { data, error } = await supabase.from('recently_opened')
      .select('opened_at,content_items(id,title,type)')
      .eq('user_id', user.id)
      .order('opened_at', { ascending: false })
      .limit(3);
    if (error) throw error;

    const rows = (data || []).filter(item => item.content_items);
    box.innerHTML = `<div class="widget-kicker">${t('RECENTLY OPENED')}</div>` + (
      rows.length ? rows.map(row => `
        <button type="button" class="recent-item" data-content-id="${escapeHtml(row.content_items.id)}">
          <span>${svgIcon(row.content_items.type === 'art' ? 'folderArt' : row.content_items.type === 'blog' ? 'folderBlogs' : 'folderStories', 18)}</span>
          <span><strong>${escapeHtml(row.content_items.title)}</strong><small>${escapeHtml(row.content_items.type)}</small></span>
        </button>`).join('') : '<div class="widget-sub">Nothing opened yet.</div>'
    );
    box.querySelectorAll('[data-content-id]').forEach(button => {
      button.addEventListener('click', () => openReader(button.dataset.contentId));
    });
  } catch (error) {
    console.warn('Could not load recently opened items:', error);
    box.innerHTML = '<div class="widget-kicker">RECENTLY OPENED</div><div class="widget-sub">History is unavailable.</div>';
  }
}

async function markOpened(contentId) {
  const user = await currentUser();
  if (!user) return;
  const { error } = await supabase.from('recently_opened').upsert({
    user_id: user.id,
    content_id: contentId,
    opened_at: new Date().toISOString()
  }, { onConflict: 'user_id,content_id' });
  if (error) console.warn('Could not save reading history:', error.message);
  await renderRecent();
}

async function toggleFavorite(contentId, button) {
  const user = await currentUser();
  if (!user) {
    openAuth();
    return;
  }

  const wasSaved = button.getAttribute('aria-pressed') === 'true';
  button.disabled = true;
  button.setAttribute('aria-pressed', String(!wasSaved));
  button.innerHTML = svgIcon(!wasSaved ? FAVORITE_ICON : 'heart', 15);

  try {
    if (wasSaved) {
      const { error } = await supabase.from('favorites').delete()
        .eq('user_id', user.id).eq('content_id', contentId);
      if (error) throw error;
    } else {
      const { error } = await supabase.from('favorites').insert({
        user_id: user.id, content_id: contentId
      });
      if (error) throw error;
    }

    const item = contentItems.find(row => String(row.id) === String(contentId));
    if (item) item.is_favorite = !wasSaved;
    notify(!wasSaved ? 'Saved to your Library.' : 'Removed from your Library.', 'success');
    await loadLibrary();
  } catch (error) {
    button.setAttribute('aria-pressed', String(wasSaved));
    button.innerHTML = svgIcon(wasSaved ? FAVORITE_ICON : 'heart', 15);
    notify(error.message || 'Could not update your Library.', 'error');
  } finally {
    button.disabled = false;
  }
}

async function setupFavorites() {
  const user = await currentUser();
  if (!user) return;

  const { data, error } = await supabase.from('favorites').select('content_id').eq('user_id', user.id);
  if (error) {
    console.warn('Could not load favorite state:', error.message);
    return;
  }

  const favoriteIds = new Set((data || []).map(row => String(row.content_id)));
  contentItems.forEach(item => { item.is_favorite = favoriteIds.has(String(item.id)); });

  renderContent('stories', contentItems.filter(item => item.type === 'story'), 'story');
  renderContent('art', contentItems.filter(item => item.type === 'art'), 'art');
}

async function loadLibrary() {
  const panel = document.querySelector('[data-library-panel]');
  if (!panel) return;
  setEmptyState(panel, 'Loading Library…');
  try {
    const library = await import('./library.js');
    await library.loadLibrary();
  } catch (error) {
    console.warn('Library could not be loaded:', error);
    setEmptyState(panel, 'Library unavailable', 'Please try again when the connection is restored.');
  }
}

function applySearch(section, query) {
  searches[section] = query;
  renderContent(section, contentItems.filter(item => item.type === (section === 'stories' ? 'story' : 'art')), section === 'stories' ? 'story' : 'art');
}

function setupSearch() {
  document.querySelectorAll('[data-search]').forEach(input => {
    input.addEventListener('input', () => applySearch(input.dataset.search, input.value));
    input.addEventListener('keydown', event => {
      if (event.key === 'Escape') {
        input.value = '';
        applySearch(input.dataset.search, '');
      }
    });
  });

  document.querySelectorAll('[data-search-clear]').forEach(button => {
    button.addEventListener('click', () => {
      const section = button.dataset.searchClear;
      const input = document.querySelector(`[data-search="${section}"]`);
      if (!input) return;
      input.value = '';
      input.focus();
      applySearch(section, '');
    });
  });

  commandInput?.addEventListener('input', () => updateCommandResults(commandInput.value));
}

function setupFilters() {
  document.querySelectorAll('[data-filter][data-target]').forEach(button => {
    button.addEventListener('click', () => {
      const section = button.dataset.target;
      filters[section] = button.dataset.filter;
      document.querySelectorAll(`[data-target="${section}"]`).forEach(item => {
        const active = item === button;
        item.classList.toggle('active', active);
        item.setAttribute('aria-pressed', String(active));
      });
      applySearch(section, searches[section]);
    });
  });

  document.querySelectorAll('[data-window-view]').forEach(button => {
    button.addEventListener('click', () => {
      const win = button.closest('[data-app-window]');
      const section = win?.id;
      if (!section || !['stories', 'art'].includes(section)) return;
      viewModes[section] = button.dataset.windowView;
      win.querySelectorAll('[data-window-view]').forEach(item => {
        const active = item === button;
        item.classList.toggle('selected', active);
        item.setAttribute('aria-pressed', String(active));
      });
      win.querySelector('[data-grid]')?.classList.toggle('list-view', viewModes[section] === 'list');
    });
  });
}

function installWindowCloseButtons() {
  document.querySelectorAll('[data-app-window] .window-bar').forEach(bar => {
    const win = bar.closest('[data-app-window]');
    if (!win || bar.querySelector('.window-close-top')) return;

    const title = win.querySelector('.window-title-group > span')?.textContent.trim() || win.id;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'window-close-top';
    button.dataset.close = win.id;
    button.setAttribute('aria-label', `Close ${title}`);
    button.title = 'Close window';
    button.textContent = '×';
    bar.append(button);
  });
}

function setupInteractions() {
  document.addEventListener('click', async event => {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;

    const creator = target.closest('[data-create]');
    if (creator) {
      event.preventDefault();
      const user = await currentUser();
      if (user) location.href = creator.dataset.create || 'admin.html';
      else openAuth();
      return;
    }

    const win = target.closest('[data-window]');
    if (win) {
      openWindow(win.dataset.window);
      return;
    }

    const close = target.closest('[data-close]');
    if (close) {
      closeWindow(close.dataset.close);
      return;
    }

    const minimize = target.closest('[data-minimize]');
    if (minimize) {
      minimizeWindow(minimize.dataset.minimize);
      return;
    }

    const zoom = target.closest('[data-zoom]');
    if (zoom) {
      zoomWindow(zoom.dataset.zoom);
      return;
    }

    const action = target.closest('[data-action]');
    if (!action) return;

    switch (action.dataset.action) {
      case 'search':
        toggleCommandPalette(true);
        return;
      case 'profile': {
        const user = await currentUser();
        if (user) location.href = 'profile.html';
        else openAuth();
        return;
      }
      case 'refresh-content':
        await loadContent();
        notify('Content refreshed.', 'success');
        return;
      case 'refresh-library':
        await loadLibrary();
        notify('Library refreshed.', 'success');
        return;
      case 'new-note':
        openWindow('notes');
        window.dispatchEvent(new Event('kolpotuli-note-new'));
        return;
    }
  });

  document.addEventListener('click', event => {
    const win = event.target.closest('[data-app-window]');
    if (win) focusWindow(win);
  });

  document.addEventListener('keydown', event => {
    const modifier = /Mac|iPhone|iPad/.test(navigator.platform) ? event.metaKey : event.ctrlKey;

    if (event.key === 'Escape') {
      if (!commandPalette.classList.contains('hidden')) {
        toggleCommandPalette(false);
        return;
      }
      const topWindow = Array.from(document.querySelectorAll('[data-app-window]:not(.hidden):not(.minimized)'))
        .sort((a, b) => Number(b.style.zIndex || 0) - Number(a.style.zIndex || 0))[0];
      if (topWindow) closeWindow(topWindow.id);
    }

    if (modifier && event.key.toLowerCase() === 'f') {
      event.preventDefault();
      toggleCommandPalette(true);
    }

    if (modifier && event.key.toLowerCase() === 'n') {
      event.preventDefault();
      currentUser().then(user => {
        if (user) location.href = 'admin.html';
        else openAuth();
      });
    }

    if (modifier && event.key === ',') {
      event.preventDefault();
      openWindow('settings');
    }

    if (!commandPalette.classList.contains('hidden')) {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        moveCommandSelection(1);
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        moveCommandSelection(-1);
      } else if (event.key === 'Enter') {
        event.preventDefault();
        runCommand(commandIndex);
      }
    } else if (modifier && event.key.toLowerCase() === 'w') {
      const topWindow = Array.from(document.querySelectorAll('[data-app-window]:not(.hidden):not(.minimized)'))
        .sort((a, b) => Number(b.style.zIndex || 0) - Number(a.style.zIndex || 0))[0];
      if (topWindow) {
        event.preventDefault();
        closeWindow(topWindow.id);
      }
    }
  });

  commandInput?.addEventListener('keydown', event => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      moveCommandSelection(1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      moveCommandSelection(-1);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      runCommand(commandIndex);
    } else if (event.key === 'Escape') {
      toggleCommandPalette(false);
    }
  });

  commandPalette?.addEventListener('click', event => {
    if (event.target === commandPalette) toggleCommandPalette(false);
  });
}

function setupLanguage() {
  const current = initLanguage();
  const button = document.getElementById('languageToggle');
  button.textContent = current === 'bn' ? 'বাংলা / EN' : 'EN / বাংলা';
  button.addEventListener('click', () => {
    const next = document.documentElement.lang === 'bn' ? 'en' : 'bn';
    setLanguage(next);
    button.textContent = next === 'bn' ? 'বাংলা / EN' : 'EN / বাংলা';
  });
}

async function loadReadingState() {
  const user = await currentUser();
  if (!user) return;

  const { data, error } = await supabase.from('favorites').select('content_id').eq('user_id', user.id);
  if (error) {
    console.warn('Could not load saved-state flags:', error.message);
    return;
  }

  const ids = new Set((data || []).map(row => String(row.content_id)));
  contentItems.forEach(item => { item.is_favorite = ids.has(String(item.id)); });
  renderContent('stories', contentItems.filter(item => item.type === 'story'), 'story');
  renderContent('art', contentItems.filter(item => item.type === 'art'), 'art');
}

async function openReader(id) {
  if (!id) return;
  await markOpened(id);
  location.href = `read.html?id=${encodeURIComponent(id)}`;
}

async function boot() {
  setupIconography();
  installWindowCloseButtons();
  setupInteractions();
  setupSearch();
  setupFilters();
  setupSettings();
  setupLanguage();

  window.addEventListener('kolpotuli-open-auth', openAuth);
  window.addEventListener('kolpotuli-auth-changed', async () => {
    const user = await currentUser();
    document.documentElement.dataset.auth = user ? 'signed-in' : 'signed-out';
    await loadReadingState();
    await renderRecent();
    await loadLibrary();
  });

  supabase.auth.onAuthStateChange(async (_event, session) => {
    document.documentElement.dataset.auth = session ? 'signed-in' : 'signed-out';
    if (session) await loadReadingState();
    await renderRecent();
  });

  try {
    const lib = await import('./library.js');
    lib.setupLibrary();
  } catch (error) {
    console.warn('Library setup failed:', error);
  }

  await refreshAuthUI();
  await loadContent();
  await loadReadingState();

  if (new URLSearchParams(location.search).get('auth') === '1') openAuth();
}

boot();
