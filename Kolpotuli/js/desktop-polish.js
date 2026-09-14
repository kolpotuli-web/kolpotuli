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
      document.querySelectorAll('[data-wallpaper-mode]').forEach(item => item.classList.toggle('selected', item.dataset.wallpaperMode === next));
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
    .catch(() => { summary.textContent = 'Jaipur · Weather unavailable'; });
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

    let dragging = false;
    let pointerId = null;
    let grabOffsetX = 0;
    let grabOffsetY = 0;

    const focusWindow = () => {
      const highest = Math.max(10, ...Array.from(document.querySelectorAll('.app-window')).map(item => Number(item.style.zIndex) || 10));
      win.style.zIndex = highest + 1;
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
      win.style.right = 'auto';
      win.style.bottom = 'auto';
      win.style.transform = 'none';
      win.style.left = `${winRect.left - layerRect.left}px`;
      win.style.top = `${winRect.top - layerRect.top}px`;

      try { bar.setPointerCapture(pointerId); } catch (_) {}
    });

    bar.addEventListener('pointermove', event => {
      if (!dragging || event.pointerId !== pointerId) return;
      const layerRect = layer.getBoundingClientRect();
      const maxX = Math.max(0, layerRect.width - win.offsetWidth);
      const maxY = Math.max(0, layerRect.height - win.offsetHeight);
      const nextX = Math.max(0, Math.min(maxX, event.clientX - layerRect.left - grabOffsetX));
      const nextY = Math.max(0, Math.min(maxY, event.clientY - layerRect.top - grabOffsetY));
      win.style.left = `${nextX}px`;
      win.style.top = `${nextY}px`;
    });

    const stopDragging = event => {
      if (!dragging || (event.pointerId !== undefined && event.pointerId !== pointerId)) return;
      dragging = false;
      pointerId = null;
      win.style.transition = '';
      try { bar.releasePointerCapture(event.pointerId); } catch (_) {}
    };

    bar.addEventListener('pointerup', stopDragging);
    bar.addEventListener('pointercancel', stopDragging);
    bar.addEventListener('lostpointercapture', () => {
      if (!dragging) return;
      dragging = false;
      pointerId = null;
      win.style.transition = '';
    });
  });
}

setupDynamicWallpaper();
setupWeather();
setupBengaliDate();
setupWindowDragging();
