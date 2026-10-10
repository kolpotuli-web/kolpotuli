// Small browser-facing enhancements that are independent of the content UI.
// Window actions and wallpaper settings are owned by app.js so there is one source of truth.

const desktop = document.getElementById('desktop');

const weatherCode = code => {
  if (code === 0) return 'Clear';
  if ([1, 2, 3].includes(code)) return 'Partly cloudy';
  if ([45, 48].includes(code)) return 'Mist';
  if ([51, 53, 55, 56, 57].includes(code)) return 'Drizzle';
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return 'Rain';
  if ([71, 73, 75, 77, 85, 86].includes(code)) return 'Snow';
  if ([95, 96, 99].includes(code)) return 'Storm';
  return 'Current weather';
};

function updateClock() {
  const now = new Date();
  const time = new Intl.DateTimeFormat('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }).format(now);

  const date = new Intl.DateTimeFormat('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  }).format(now);

  document.getElementById('clockTime')?.replaceChildren(time);
  document.getElementById('menuTime')?.replaceChildren(time);
  document.getElementById('clockDate')?.replaceChildren(date);
}

async function updateWeather() {
  const temperature = document.getElementById('weatherTemp');
  const summary = document.getElementById('weatherSummary');
  if (!temperature || !summary) return;

  try {
    const url = 'https://api.open-meteo.com/v1/forecast?latitude=26.9124&longitude=75.7873&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min&timezone=Asia%2FKolkata&forecast_days=1';
    const response = await fetch(url);
    if (!response.ok) throw new Error('Weather request failed');

    const data = await response.json();
    if (!data.current || !data.daily?.temperature_2m_max?.length || !data.daily?.temperature_2m_min?.length) {
      throw new Error('Weather response is incomplete');
    }

    temperature.textContent = `${Math.round(data.current.temperature_2m)}°`;
    summary.textContent = `Jaipur · ${Math.round(data.daily.temperature_2m_max[0])}° / ${Math.round(data.daily.temperature_2m_min[0])}° · ${weatherCode(data.current.weather_code)}`;
  } catch (error) {
    console.warn('Weather unavailable:', error);
    summary.textContent = 'Jaipur · Weather unavailable';
  }
}

function updateBengaliDate() {
  const day = document.getElementById('bengaliDay');
  const date = document.getElementById('bengaliDate');
  const sub = document.getElementById('bengaliDateSub');
  if (!day || !date || !sub) return;

  const now = new Date();
  const bengali = new Intl.DateTimeFormat('bn-BD', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  }).format(now);
  const gregorian = new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(now);
  const parts = bengali.split(', ');

  day.textContent = parts[0] || bengali;
  date.textContent = parts[1] || '';
  sub.textContent = gregorian;
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
    let activePointer = null;
    let offsetX = 0;
    let offsetY = 0;

    const focus = () => {
      const zValues = Array.from(document.querySelectorAll('.app-window'))
        .map(item => Number(item.style.zIndex) || 10);
      win.style.zIndex = String(Math.max(10, ...zValues) + 1);
      document.querySelectorAll('[data-app-window]').forEach(item => {
        item.dataset.active = String(item === win);
      });
    };

    win.addEventListener('pointerdown', focus);

    // Window controls and the drag handle share the same title bar. Keep the
    // controls clickable while letting the rest of the bar move the window.
    bar.addEventListener('pointerdown', event => {
      if (event.button !== undefined && event.button !== 0) return;
      if (event.target.closest('button')) return;
      if (window.matchMedia('(max-width: 800px)').matches) return;
      if (win.classList.contains('hidden') || win.classList.contains('minimized')) return;

      event.preventDefault();
      focus();
      dragging = true;
      activePointer = event.pointerId;

      const layerRect = layer.getBoundingClientRect();
      const winRect = win.getBoundingClientRect();
      offsetX = event.clientX - winRect.left;
      offsetY = event.clientY - winRect.top;

      win.style.transition = 'none';
      win.style.right = 'auto';
      win.style.bottom = 'auto';
      win.style.transform = 'none';
      win.style.left = `${winRect.left - layerRect.left}px`;
      win.style.top = `${winRect.top - layerRect.top}px`;

      try { bar.setPointerCapture(activePointer); } catch {}
    });

    bar.addEventListener('pointermove', event => {
      if (!dragging || event.pointerId !== activePointer) return;

      const layerRect = layer.getBoundingClientRect();
      const maxX = Math.max(0, layerRect.width - win.offsetWidth);
      const maxY = Math.max(0, layerRect.height - win.offsetHeight);
      const left = Math.max(0, Math.min(maxX, event.clientX - layerRect.left - offsetX));
      const top = Math.max(0, Math.min(maxY, event.clientY - layerRect.top - offsetY));

      win.style.left = `${left}px`;
      win.style.top = `${top}px`;
    });

    const stopDragging = event => {
      if (!dragging || (event.pointerId !== undefined && event.pointerId !== activePointer)) return;
      dragging = false;
      activePointer = null;
      win.style.transition = '';
      try { bar.releasePointerCapture(event.pointerId); } catch {}
    };

    bar.addEventListener('pointerup', stopDragging);
    bar.addEventListener('pointercancel', stopDragging);
    bar.addEventListener('lostpointercapture', () => {
      dragging = false;
      activePointer = null;
      win.style.transition = '';
    });
  });
}

updateClock();
window.setInterval(updateClock, 1000);
updateWeather();
updateBengaliDate();
setupWindowDragging();
