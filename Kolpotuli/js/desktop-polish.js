const desktop = document.getElementById('desktop');

const weatherCode = code => {
  if (code === 0) return 'Clear';
  if ([1, 2, 3].includes(code)) return 'Cloudy';
  if ([45, 48].includes(code)) return 'Misty';
  if ([51, 53, 55, 56, 57].includes(code)) return 'Drizzle';
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return 'Rain';
  if ([71, 73, 75, 77, 85, 86].includes(code)) return 'Snow';
  if ([95, 96, 99].includes(code)) return 'Storm';
  return 'Weather';
};

function setupDynamicWallpaper() {
  if (!desktop) return;
  const mode = localStorage.getItem('kolpotuli-wallpaper-mode') || 'still';
  desktop.dataset.wallpaperMode = mode;
  document.querySelectorAll('[data-wallpaper-mode]').forEach(button => {
    button.classList.toggle('selected', button.dataset.wallpaperMode === mode);
    button.addEventListener('click', () => {
      const next = button.dataset.wallpaperMode;
      localStorage.setItem('kolpotuli-wallpaper-mode', next);
      desktop.dataset.wallpaperMode = next;
      document.querySelectorAll('[data-wallpaper-mode]').forEach(item => {
        item.classList.toggle('selected', item.dataset.wallpaperMode === next);
      });
    });
  });
}

function setupWeather() {
  const temp = document.getElementById('weatherTemp');
  const summary = document.getElementById('weatherSummary');
  const icon = document.querySelector('.weather-widget .widget-main span');
  if (!temp || !summary) return;

  fetch('https://api.open-meteo.com/v1/forecast?latitude=26.9124&longitude=75.7873&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min&timezone=Asia%2FKolkata&forecast_days=1')
    .then(response => response.ok ? response.json() : Promise.reject(new Error('Weather request failed')))
    .then(data => {
      const current = data.current;
      const daily = data.daily;
      temp.textContent = `${Math.round(current.temperature_2m)}°`;
      summary.textContent = `Jaipur · ${Math.round(daily.temperature_2m_max[0])}° / ${Math.round(daily.temperature_2m_min[0])}° · ${weatherCode(current.weather_code)}`;
      if (icon) icon.textContent = [61, 63, 65, 80, 81, 82].includes(current.weather_code) ? '☂' : [1, 2, 3].includes(current.weather_code) ? '☁' : '☀';
    })
    .catch(() => {
      summary.textContent = 'Jaipur · Weather unavailable';
    });
}

function setupBengaliDate() {
  const day = document.getElementById('bengaliDay');
  const date = document.getElementById('bengaliDate');
  const sub = document.getElementById('bengaliDateSub');
  if (!day || !date || !sub) return;

  const now = new Date();
  const bn = new Intl.DateTimeFormat('bn-BD', { weekday: 'long', day: 'numeric', month: 'long' }).format(now);
  const greg = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }).format(now);
  const parts = bn.split(', ');
  day.textContent = parts[0] || bn;
  date.textContent = parts[1] || '';
  sub.textContent = greg;
}

function setupWindowDragging() {
  if (!window.PointerEvent) return;

  const layer = document.querySelector('.window-layer');
  if (!layer) return;

  document.querySelectorAll('.app-window').forEach(win => {
    const bar = win.querySelector('.window-bar');
    if (!bar || win.dataset.dragReady) return;

    win.dataset.dragReady = '1';
    bar.style.touchAction = 'none';

    let dragging = false;
    let pointerId = null;
    let grabOffsetX = 0;
    let grabOffsetY = 0;

    const focusWindow = () => {
      document.querySelectorAll('.app-window').forEach(other => {
        if (other !== win) other.classList.remove('window-focused');
      });
      const highest = Math.max(10, ...Array.from(document.querySelectorAll('.app-window')).map(item => Number(item.style.zIndex) || 10));
      win.style.zIndex = highest + 1;
      win.classList.add('window-focused');
    };

    win.addEventListener('pointerdown', focusWindow);

    bar.addEventListener('pointerdown', event => {
      if (event.button !== undefined && event.button !== 0) return;
      if (event.target.closest('button')) return;
      if (window.matchMedia('(max-width: 800px)').matches) return;

      event.preventDefault();
      focusWindow();
      dragging = true;
      pointerId = event.pointerId;

      const layerRect = layer.getBoundingClientRect();
      const winRect = win.getBoundingClientRect();
      grabOffsetX = event.clientX - winRect.left;
      grabOffsetY = event.clientY - winRect.top;

      win.style.transition = 'none';
      win.classList.add('is-dragging');
      win.style.right = 'auto';
      win.style.bottom = 'auto';
      win.style.left = `${winRect.left - layerRect.left}px`;
      win.style.top = `${winRect.top - layerRect.top}px`;
      win.style.setProperty('--drag-x', `${winRect.left - layerRect.left}px`);
      win.style.setProperty('--drag-y', `${winRect.top - layerRect.top}px`);

      bar.setPointerCapture(pointerId);
    });

    bar.addEventListener('pointermove', event => {
      if (!dragging || event.pointerId !== pointerId) return;

      const layerRect = layer.getBoundingClientRect();
      const maxX = Math.max(0, layerRect.width - win.offsetWidth);
      const maxY = Math.max(0, layerRect.height - win.offsetHeight);
      const nextX = Math.max(0, Math.min(maxX, event.clientX - layerRect.left - grabOffsetX));
      const nextY = Math.max(0, Math.min(maxY, event.clientY - layerRect.top - grabOffsetY));

      win.style.setProperty('--drag-x', `${nextX}px`);
      win.style.setProperty('--drag-y', `${nextY}px`);
      win.style.left = `${nextX}px`;
      win.style.top = `${nextY}px`;
    });

    const stopDragging = event => {
      if (!dragging || (event.pointerId !== undefined && event.pointerId !== pointerId)) return;
      dragging = false;
      pointerId = null;
      win.classList.remove('is-dragging');
      win.style.transition = '';
      try { bar.releasePointerCapture(event.pointerId); } catch (_) {}
    };

    bar.addEventListener('pointerup', stopDragging);
    bar.addEventListener('pointercancel', stopDragging);
    bar.addEventListener('lostpointercapture', () => {
      dragging = false;
      pointerId = null;
      win.classList.remove('is-dragging');
      win.style.transition = '';
    });
  });
}

const style = document.createElement('style');
style.textContent = `
.desktop[data-wallpaper-mode="dynamic"] .desktop-wallpaper { animation: kolpotuli-drift 22s ease-in-out infinite alternate; background-size: 110% 110% !important; }
.desktop[data-wallpaper-mode="dynamic"]::after { content: ''; position: absolute; inset: 0; pointer-events: none; background: radial-gradient(circle at 72% 18%, rgba(255,232,164,.14), transparent 32%), linear-gradient(180deg, transparent 55%, rgba(5,25,39,.12)); animation: kolpotuli-glow 10s ease-in-out infinite alternate; }
.wallpaper-mode-row { display: flex; gap: 8px; margin-top: 14px; }
.wallpaper-mode-row button { flex: 1; border: 1px solid rgba(20,32,42,.12); border-radius: 10px; padding: 9px 11px; background: rgba(255,255,255,.45); color: var(--ink); cursor: pointer; font-weight: 700; }
.wallpaper-mode-row button.selected { background: var(--navy); color: #fff; border-color: var(--navy); }
.window-bar { cursor: grab; user-select: none; }
.window-bar:active { cursor: grabbing; }
.app-window.window-focused { box-shadow: 0 42px 105px rgba(0,0,0,.42), 0 10px 28px rgba(4,18,29,.25), inset 0 1px rgba(255,255,255,.7); }
.window-layer .app-window.is-dragging { left: var(--drag-x) !important; top: var(--drag-y) !important; right: auto !important; bottom: auto !important; transform: none !important; }
@keyframes kolpotuli-drift { from { background-position: 48% 48%; } to { background-position: 54% 52%; } }
@keyframes kolpotuli-glow { from { opacity: .55; transform: scale(1); } to { opacity: 1; transform: scale(1.04); } }
@media (prefers-reduced-motion: reduce) { .desktop[data-wallpaper-mode="dynamic"] .desktop-wallpaper, .desktop[data-wallpaper-mode="dynamic"]::after { animation: none; } }
`;
document.head.appendChild(style);

setupDynamicWallpaper();
setupWeather();
setupBengaliDate();
setupWindowDragging();
