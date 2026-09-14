import { supabase } from './supabase.js';
import { t, setLanguage, initLanguage } from './i18n.js';

const desktop = document.getElementById('desktop');
let z = 20;

const openWindow = id => {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.remove('hidden');
  z += 1;
  el.style.zIndex = z;
  if (id === 'library') loadLibrary();
};
const closeWindow = id => document.getElementById(id)?.classList.add('hidden');
const openReader = id => { if (id) location.href = `read.html?id=${encodeURIComponent(id)}`; };

document.addEventListener('click', event => {
  const link = event.target.closest('[data-link]');
  if (link) {
    event.preventDefault();
    location.href = link.dataset.link;
    return;
  }
  const win = event.target.closest('[data-window]');
  if (win) {
    event.preventDefault();
    openWindow(win.dataset.window);
  }
  const close = event.target.closest('[data-close]');
  if (close) {
    event.preventDefault();
    closeWindow(close.dataset.close);
  }
});

function addDesktopFolders() {
  const area = document.querySelector('.desktop-icons');
  if (!area || area.dataset.ready) return;
  area.dataset.ready = '1';
  const folders = [
    ['stories', 'Stories', '▦'], ['library', 'Library', '▤'], ['art', 'Art', '◆'], ['blogs', 'Blogs', '▱'],
    ['notes', 'Notes', '✎']
  ];
  area.innerHTML = folders.map(([target, label, icon, type]) => type === 'link'
    ? `<button class="desktop-icon" data-link="${target}"><span class="icon folder"><b>${icon}</b></span><span>${label}</span></button>`
    : `<button class="desktop-icon" data-window="${target}"><span class="icon folder"><b>${icon}</b></span><span>${label}</span></button>`
  ).join('');
}
addDesktopFolders();

function setupWallpaper() {
  if (!desktop) return;
  const wallpapers = {
    main: "url('assets/wallpapers/kolpotuli-main.png')",
    dusk: "url('assets/wallpapers/kolpotuli-dusk.svg')",
    paper: "url('assets/wallpapers/kolpotuli-paper.svg')"
  };
  let layer = desktop.querySelector('.desktop-wallpaper');
  if (!layer) {
    layer = document.createElement('div');
    layer.className = 'desktop-wallpaper';
    layer.setAttribute('aria-hidden', 'true');
    desktop.prepend(layer);
  }
  const apply = key => {
    const value = wallpapers[key] || wallpapers.main;
    layer.style.backgroundImage = value;
    desktop.style.setProperty('--wallpaper', value);
    desktop.style.setProperty('background-image', 'none', 'important');
    document.querySelectorAll('[data-wallpaper]').forEach(item => item.classList.toggle('selected', item.dataset.wallpaper === key));
    localStorage.setItem('kolpotuli-wallpaper', key);
  };
  apply(localStorage.getItem('kolpotuli-wallpaper') || 'main');
  document.querySelectorAll('[data-wallpaper]').forEach(button => button.addEventListener('click', () => apply(button.dataset.wallpaper)));
}
setupWallpaper();

function updateClock() {
  const now = new Date();
  const time = new Intl.DateTimeFormat('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true }).format(now);
  const date = new Intl.DateTimeFormat('en-IN', { weekday: 'long', day: 'numeric', month: 'long' }).format(now);
  document.getElementById('clockTime')?.replaceChildren(time);
  document.getElementById('menuTime')?.replaceChildren(time);
  document.getElementById('clockDate')?.replaceChildren(date);
}
updateClock();
setInterval(updateClock, 1000);

const play = document.querySelector('.music-controls .play');
if (play) play.addEventListener('click', () => {
  play.classList.toggle('playing');
  play.textContent = play.classList.contains('playing') ? 'Ⅱ' : '▶';
});

const esc = value => String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');

async function currentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

async function loadContent() {
  const { data, error } = await supabase.from('content_items')
    .select('id,type,title,excerpt,cover_image_url,language,featured,read_time_minutes,published_at')
    .eq('status', 'published')
    .order('featured', { ascending: false })
    .order('published_at', { ascending: false })
    .limit(60);
  if (error) {
    console.warn('Kolpotuli content load:', error.message);
    return;
  }
  window.kolpotuliContent = data || [];
  const grouped = { story: [], art: [], blog: [] };
  (data || []).forEach(item => grouped[item.type]?.push(item));
  renderContent('stories', grouped.story, 'story');
  renderContent('art', grouped.art, 'art');
  renderBlogs(grouped.blog);
  await renderRecent();
}

function renderContent(windowId, items, type) {
  const win = document.getElementById(windowId);
  const grid = win?.querySelector('.card-grid');
  if (!grid) return;
  if (!items.length) {
    grid.innerHTML = `<div class="library-empty">${t('No published content yet.')}</div>`;
    return;
  }
  grid.innerHTML = items.slice(0, 12).map(item => `<article class="content-card" data-content-id="${esc(item.id)}"><div class="thumb db-thumb" style="${item.cover_image_url ? `background-image:url('${esc(item.cover_image_url)}')` : ''}"></div><h3>${esc(item.title)}</h3><p>${esc(type === 'story' ? t('Stories') : t('Art'))}${item.read_time_minutes ? ` · ${item.read_time_minutes} min` : ''}</p><button class="save-content" data-save="${esc(item.id)}" aria-label="${t('Save')}">♡</button></article>`).join('');
  grid.querySelectorAll('[data-content-id]').forEach(card => card.addEventListener('click', event => {
    if (event.target.closest('[data-save]')) return;
    markOpened(card.dataset.contentId);
    openReader(card.dataset.contentId);
  }));
  grid.querySelectorAll('[data-save]').forEach(button => button.addEventListener('click', async event => {
    event.stopPropagation();
    await toggleFavorite(button.dataset.save, button);
  }));
}

function renderBlogs(items) {
  const links = document.querySelector('.blog-links');
  if (!links) return;
  if (!items.length) {
    links.innerHTML = `<span style="opacity:.55">${t('No published content yet.')}</span>`;
    return;
  }
  links.innerHTML = items.slice(0, 8).map(item => `<button data-content-id="${esc(item.id)}">${esc(item.title)}</button>`).join('');
  links.querySelectorAll('[data-content-id]').forEach(button => button.addEventListener('click', () => {
    markOpened(button.dataset.contentId);
    openReader(button.dataset.contentId);
  }));
}

async function renderRecent() {
  const box = document.querySelector('.recent-widget');
  if (!box) return;
  const user = await currentUser();
  if (!user) {
    box.innerHTML = `<div class="widget-kicker">${t('RECENTLY OPENED')}</div><div class="widget-sub">${t('Sign in to keep your history.')}</div>`;
    return;
  }
  const { data } = await supabase.from('recently_opened').select('opened_at,content_items(id,title,type)').eq('user_id', user.id).order('opened_at', { ascending: false }).limit(3);
  box.innerHTML = `<div class="widget-kicker">${t('RECENTLY OPENED')}</div>` + ((data || []).filter(item => item.content_items).map(item => `<button class="recent-item" data-content-id="${esc(item.content_items.id)}"><span>${item.content_items.type === 'art' ? '◆' : item.content_items.type === 'blog' ? '▤' : '▣'}</span><span><strong>${esc(item.content_items.title)}</strong><small>${esc(item.content_items.type)}</small></span></button>`).join('') || `<div class="widget-sub">${t('Nothing opened yet.')}</div>`);
  box.querySelectorAll('[data-content-id]').forEach(button => button.addEventListener('click', () => openReader(button.dataset.contentId)));
}

async function markOpened(contentId) {
  const user = await currentUser();
  if (!user) return;
  await supabase.from('recently_opened').upsert({ user_id: user.id, content_id: contentId, opened_at: new Date().toISOString() }, { onConflict: 'user_id,content_id' });
  renderRecent();
}

async function toggleFavorite(contentId, button) {
  const user = await currentUser();
  if (!user) {
    window.dispatchEvent(new Event('kolpotuli-open-auth'));
    return;
  }
  const { data } = await supabase.from('favorites').select('content_id').eq('user_id', user.id).eq('content_id', contentId).maybeSingle();
  if (data) {
    await supabase.from('favorites').delete().eq('user_id', user.id).eq('content_id', contentId);
    button.textContent = '♡';
  } else {
    await supabase.from('favorites').insert({ user_id: user.id, content_id: contentId });
    button.textContent = '♥';
  }
  loadLibrary();
}

async function loadLibrary() {
  const panel = document.querySelector('[data-library-panel]');
  if (!panel) return;
  panel.innerHTML = `<div class="library-empty">${t('Loading…')}</div>`;
  try {
    const lib = await import('./library.js');
    await lib.loadLibrary();
  } catch (error) {
    console.warn('Library unavailable:', error);
    panel.innerHTML = `<div class="library-empty">${t('Unable to load Library.')}</div>`;
  }
}

function setupSearch() {
  document.querySelectorAll('.search-row').forEach(row => {
    const input = row.querySelector('input');
    const button = row.querySelector('button');
    if (!input) return;
    const run = async () => {
      const query = input.value.trim();
      if (!query) return;
      const safe = query.replace(/[%_]/g, match => `\\${match}`);
      const { data } = await supabase.from('content_items').select('id,type,title,excerpt,cover_image_url,language,read_time_minutes').eq('status', 'published').or(`title.ilike.%${safe}%,excerpt.ilike.%${safe}%`).order('published_at', { ascending: false }).limit(30);
      renderSearchResults(data || [], row.parentElement);
    };
    button?.addEventListener('click', run);
    input.addEventListener('keydown', event => { if (event.key === 'Enter') run(); });
  });
}

function renderSearchResults(items, area) {
  let box = area.querySelector('.search-results');
  if (!box) {
    box = document.createElement('div');
    box.className = 'search-results';
    area.appendChild(box);
  }
  box.innerHTML = items.length ? items.map(item => `<button class="search-result" data-content-id="${esc(item.id)}"><span>${item.type === 'art' ? '◆' : item.type === 'blog' ? '▤' : '▣'}</span><span><strong>${esc(item.title)}</strong><small>${esc(item.type)}${item.read_time_minutes ? ` · ${item.read_time_minutes} min` : ''}</small></span></button>`).join('') : `<div class="widget-sub" style="padding:10px">${t('No matching published content.')}</div>`;
  box.classList.add('show');
  box.querySelectorAll('[data-content-id]').forEach(button => { button.onclick = () => openReader(button.dataset.contentId); });
}

function translateStatic() {
  const elements = document.querySelectorAll('.menu-left button,.desktop-icon>span:last-child,.dock small,.widget-kicker,.sidebar button,.playlist-button,.blog-hero .tag,.settings-window h2,.settings-intro,.settings-window h3,.wallpaper-card strong,.wallpaper-card small,.note-toolbar button');
  elements.forEach(element => {
    const key = element.dataset.i18n || element.textContent.trim();
    if (key) element.dataset.i18n = key;
    element.textContent = t(key);
  });
  document.querySelectorAll('.search-row input').forEach(element => {
    const key = element.dataset.i18nPlaceholder || element.placeholder;
    element.dataset.i18nPlaceholder = key;
    element.placeholder = t(key);
  });
  document.querySelectorAll('.library-tabs button').forEach(button => {
    const key = button.dataset.i18n || ({ saved: 'Saved', reading: 'Reading', collections: 'Collections', recent: 'Recently Opened' }[button.dataset.libraryTab]);
    button.dataset.i18n = key;
    button.textContent = t(key);
  });
}

function setupLanguage() {
  const current = initLanguage();
  translateStatic();
  const button = document.getElementById('languageToggle');
  if (!button) return;
  button.textContent = current === 'bn' ? 'বাংলা / EN' : 'EN / বাংলা';
  button.onclick = () => {
    const next = (document.documentElement.lang || current) === 'bn' ? 'en' : 'bn';
    setLanguage(next);
    translateStatic();
    button.textContent = next === 'bn' ? 'বাংলা / EN' : 'EN / বাংলা';
    loadContent();
  };
}

async function boot() {
  const { data: { session } } = await supabase.auth.getSession();
  document.documentElement.dataset.auth = session ? 'signed-in' : 'signed-out';
  setupLanguage();
  await loadContent();
  setupSearch();
  try {
    const lib = await import('./library.js');
    lib.setupLibrary();
    if (session) await lib.loadLibrary();
  } catch (error) {
    console.warn('Library setup unavailable:', error);
  }
  supabase.auth.onAuthStateChange(async (_event, newSession) => {
    document.documentElement.dataset.auth = newSession ? 'signed-in' : 'signed-out';
    try {
      const lib = await import('./library.js');
      await lib.loadLibrary();
    } catch {}
    await renderRecent();
  });
  try {
    const auth = await import('./auth-ui.js');
    window.addEventListener('kolpotuli-open-auth', auth.openAuth);
    await auth.refreshAuthUI();
    document.querySelectorAll('.dock button').forEach(button => {
      const label = button.querySelector('small')?.textContent;
      if (label === 'Profile' || label === 'প্রোফাইল') button.onclick = async () => {
        const user = await auth.refreshAuthUI();
        if (user) location.href = 'profile.html';
        else auth.openAuth();
      };
      if (label === 'Search' || label === 'খোঁজ') button.onclick = () => {
        openWindow('stories');
        document.querySelector('#stories .search-row input')?.focus();
      };
    });
    window.addEventListener('kolpotuli-auth-changed', async () => {
      await auth.refreshAuthUI();
      try {
        const lib = await import('./library.js');
        await lib.loadLibrary();
      } catch {}
      await renderRecent();
    });
    const params = new URLSearchParams(location.search);
    if (params.get('auth') === '1') auth.openAuth();
  } catch (error) {
    console.warn('Auth UI unavailable:', error);
  }
}

boot();
