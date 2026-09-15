import { supabase } from './supabase.js';
import { t, setLanguage, initLanguage } from './i18n.js';
import { openAuth, refreshAuthUI } from './auth-ui.js';

const desktop = document.getElementById('desktop');
let z = 20;

const ICONS = {
  search: '<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/>',
  sparkle: '<path d="m12 3 1.4 5.6L19 10l-5.6 1.4L12 17l-1.4-5.6L5 10l5.6-1.4L12 3Z"/><path d="m19 16 .7 2.3L22 19l-2.3.7L19 22l-.7-2.3L16 19l2.3-.7L19 16Z"/>',
  profile: '<circle cx="12" cy="8" r="3.4"/><path d="M5.5 21c.7-3.7 3-5.7 6.5-5.7s5.8 2 6.5 5.7"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1-1.8 1.8-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5v.2h-2.6v-.2a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1-1.8-1.8.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H6.5v-2.6h.2a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1 1.8-1.8.1.1a1.6 1.6 0 0 0 1.8.3 1.6 1.6 0 0 0 1-1.5v-.2h2.6v.2a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1 1.8 1.8-.1.1a1.6 1.6 0 0 0-.3 1.8 1.6 1.6 0 0 0 1.5 1h.2V14h-.2a1.6 1.6 0 0 0-1.5 1Z"/>',
  trash: '<path d="M5 7h14M9 7V5h6v2M8 10v8M12 10v8M16 10v8"/><path d="M6.5 7.5 7.2 20h9.6l.7-12.5"/>',
  cloud: '<path d="M7.2 18.5h9.3a4.3 4.3 0 0 0 .4-8.6 5.8 5.8 0 0 0-11.1 1.6 3.6 3.6 0 0 0 1.4 7Z"/>',
  heart: '<path d="M20.4 8.8c0 5.1-8.4 9.7-8.4 9.7S3.6 13.9 3.6 8.8A4.5 4.5 0 0 1 12 6.2a4.5 4.5 0 0 1 8.4 2.6Z"/>',
  heartFilled: '<path fill="currentColor" stroke="none" d="M12 20.4S3.4 15.7 3.4 9a4.7 4.7 0 0 1 8.6-2.8A4.7 4.7 0 0 1 20.6 9c0 6.7-8.6 11.4-8.6 11.4Z"/>',
  previous: '<path d="m15 6-6 6 6 6M7 6v12"/>',
  next: '<path d="m9 6 6 6-6 6M17 6v12"/>',
  play: '<path fill="currentColor" stroke="none" d="m9 6 9 6-9 6V6Z"/>',
  pause: '<path fill="currentColor" stroke="none" d="M8 6.5h3v11H8zm5 0h3v11h-3z"/>',
  close: '<path d="m7 7 10 10M17 7 7 17"/>',
  folderStories: '<path d="M7 7h10M7 11h10M7 15h6"/>',
  folderLibrary: '<path d="M7 7h10M7 11h10M7 15h10"/><path d="M9 5v14"/>',
  folderArt: '<path d="m12 6 6 6-6 6-6-6 6-6Z"/><circle cx="12" cy="12" r="1.4"/>',
  folderBlogs: '<path d="M7 7h10M7 11h10M7 15h7"/><path d="m16 14 3 3-3 3"/>',
  note: '<path d="M7 5.5h7l3 3V19H7z"/><path d="M14 5.5V9h3M9.5 12h5M9.5 15h5"/>',
  signal: '<path d="M5 18v-3M9 18v-5M13 18v-8M17 18V7M21 18V4"/>'
};

const svgIcon = (name, size = 20, className = '') => `<svg class="ko-icon${className ? ` ${className}` : ''}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ''}</svg>`;

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

async function currentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

document.addEventListener('click', async event => {
  const creator = event.target.closest('[data-create]');
  if (creator) {
    event.preventDefault();
    const user = await currentUser();
    if (user) location.href = creator.dataset.create || 'admin.html';
    else openAuth();
    return;
  }

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
    ['stories', 'Stories', 'folderStories'], ['library', 'Library', 'folderLibrary'], ['art', 'Art', 'folderArt'], ['blogs', 'Blogs', 'folderBlogs'],
    ['notes', 'Notes', 'note']
  ];
  area.innerHTML = folders.map(([target, label, icon]) => `<button class="desktop-icon" data-window="${target}"><span class="icon folder"><span class="ko-folder-mark">${svgIcon(icon, 20)}</span></span><span>${label}</span></button>`).join('');
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

function setupIconography() {
  const menuIcons = document.querySelectorAll('.menu-right > span:not(#menuTime)');
  if (menuIcons[0]) menuIcons[0].innerHTML = svgIcon('signal', 16);
  if (menuIcons[1]) menuIcons[1].innerHTML = svgIcon('search', 16);

  document.querySelector('.weather-widget .widget-main > span')?.replaceChildren();
  const weatherIcon = document.querySelector('.weather-widget .widget-main > span');
  if (weatherIcon) weatherIcon.innerHTML = svgIcon('cloud', 27);

  const favorite = document.querySelector('.music-widget .widget-row > span:last-child');
  if (favorite) favorite.innerHTML = svgIcon('heart', 18);

  document.querySelector('.music-controls button:nth-child(1)')?.replaceChildren();
  document.querySelector('.music-controls button:nth-child(1)')?.insertAdjacentHTML('afterbegin', svgIcon('previous', 17));
  document.querySelector('.music-controls button:nth-child(3)')?.replaceChildren();
  document.querySelector('.music-controls button:nth-child(3)')?.insertAdjacentHTML('afterbegin', svgIcon('next', 17));

  document.querySelectorAll('.search-row button').forEach(button => { button.innerHTML = svgIcon('search', 18); });
  document.querySelectorAll('.window-close').forEach(button => { button.innerHTML = svgIcon('close', 18); });
  document.querySelectorAll('.dock button').forEach(button => {
    const label = button.querySelector('small')?.textContent.trim();
    const name = label === 'Search' ? 'search' : label === 'Create' ? 'sparkle' : label === 'Profile' ? 'profile' : label === 'Settings' ? 'settings' : 'trash';
    const span = button.querySelector('span');
    if (span) span.innerHTML = svgIcon(name, 24);
  });
  document.querySelectorAll('.playlist-button').forEach(button => {
    if (!button.dataset.iconReady) {
      button.dataset.iconReady = '1';
      button.innerHTML = `${svgIcon('sparkle', 14)} <span>${t('Add to playlist')}</span>`;
    }
  });

  document.querySelectorAll('.desktop-icon').forEach(button => {
    const mark = button.querySelector('.ko-folder-mark');
    if (!mark) return;
    const target = button.dataset.window;
    const icon = target === 'stories' ? 'folderStories' : target === 'library' ? 'folderLibrary' : target === 'art' ? 'folderArt' : target === 'blogs' ? 'folderBlogs' : 'note';
    mark.innerHTML = svgIcon(icon, 20);
  });
}

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
if (play) {
  play.innerHTML = svgIcon('play', 18);
  play.addEventListener('click', () => {
    play.classList.toggle('playing');
    play.innerHTML = svgIcon(play.classList.contains('playing') ? 'pause' : 'play', 18);
  });
}

const esc = value => String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');

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
  grid.innerHTML = items.slice(0, 12).map(item => `<article class="content-card" data-content-id="${esc(item.id)}"><div class="thumb db-thumb" style="${item.cover_image_url ? `background-image:url('${esc(item.cover_image_url)}')` : ''}"></div><h3>${esc(item.title)}</h3><p>${esc(type === 'story' ? t('Stories') : t('Art'))}${item.read_time_minutes ? ` · ${item.read_time_minutes} min` : ''}</p><button class="save-content" data-save="${esc(item.id)}" aria-label="${t('Save')}">${svgIcon('heart', 16)}</button></article>`).join('');
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
  box.innerHTML = `<div class="widget-kicker">${t('RECENTLY OPENED')}</div>` + ((data || []).filter(item => item.content_items).map(item => `<button class="recent-item" data-content-id="${esc(item.content_items.id)}"><span>${svgIcon(item.content_items.type === 'art' ? 'folderArt' : item.content_items.type === 'blog' ? 'folderBlogs' : 'folderStories', 18)}</span><span><strong>${esc(item.content_items.title)}</strong><small>${esc(item.content_items.type)}</small></span></button>`).join('') || `<div class="widget-sub">${t('Nothing opened yet.')}</div>`);
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
    button.innerHTML = svgIcon('heart', 16);
  } else {
    await supabase.from('favorites').insert({ user_id: user.id, content_id: contentId });
    button.innerHTML = svgIcon('heartFilled', 16);
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
  box.innerHTML = items.length ? items.map(item => `<button class="search-result" data-content-id="${esc(item.id)}"><span>${svgIcon(item.type === 'art' ? 'folderArt' : item.type === 'blog' ? 'folderBlogs' : 'folderStories', 18)}</span><span><strong>${esc(item.title)}</strong><small>${esc(item.type)}${item.read_time_minutes ? ` · ${item.read_time_minutes} min` : ''}</small></span></button>`).join('') : `<div class="widget-sub" style="padding:10px">${t('No matching published content.')}</div>`;
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
  setupIconography();
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

  await refreshAuthUI();
  window.addEventListener('kolpotuli-open-auth', openAuth);

  document.querySelectorAll('.dock button').forEach(button => {
    const label = button.querySelector('small')?.textContent;
    if (label === 'Profile' || label === 'প্রোফাইল') {
      button.onclick = async () => {
        const user = await refreshAuthUI();
        if (user) location.href = 'profile.html';
        else openAuth();
      };
    }
    if (label === 'Search' || label === 'খোঁজ') {
      button.onclick = () => {
        openWindow('stories');
        document.querySelector('#stories .search-row input')?.focus();
      };
    }
  });

  window.addEventListener('kolpotuli-auth-changed', async () => {
    await refreshAuthUI();
    try {
      const lib = await import('./library.js');
      await lib.loadLibrary();
    } catch {}
    await renderRecent();
  });

  const params = new URLSearchParams(location.search);
  if (params.get('auth') === '1') openAuth();
}

boot();
