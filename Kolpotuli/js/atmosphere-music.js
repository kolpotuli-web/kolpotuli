/* Shared local weather and YouTube music controls for desktop + mobile.
   Search uses the YouTube Data API when configured, with public Invidious search
   fallbacks when no key is present. Selected videos play in YouTube's embedded player. */

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const WEATHER_KEY = 'kolpotuli-weather-location';
const YOUTUBE_KEY = document.querySelector('meta[name="youtube-api-key"]')?.content.trim()
  || window.KOLPOTULI_YOUTUBE_API_KEY
  || '';

const state = {
  location: null,
  weatherRequest: 0,
  songResults: [],
  activeSongIndex: -1,
  songSearchRequest: 0,
  songSearchController: null,
  songSearchTimer: null,
  songSearchQuery: '',
  player: null,
  playerReady: false,
  playerReadyPromise: null,
  playerLoadTimer: null
};

const weatherDescriptions = {
  0: 'Clear sky',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Fog',
  48: 'Depositing rime fog',
  51: 'Light drizzle',
  53: 'Drizzle',
  55: 'Heavy drizzle',
  56: 'Freezing drizzle',
  57: 'Heavy freezing drizzle',
  61: 'Light rain',
  63: 'Rain',
  65: 'Heavy rain',
  66: 'Freezing rain',
  67: 'Heavy freezing rain',
  71: 'Light snow',
  73: 'Snow',
  75: 'Heavy snow',
  77: 'Snow grains',
  80: 'Rain showers',
  81: 'Rain showers',
  82: 'Heavy rain showers',
  85: 'Snow showers',
  86: 'Heavy snow showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm with hail',
  99: 'Heavy thunderstorm with hail'
};

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function setText(selector, value) {
  $$(selector).forEach(element => {
    element.textContent = value;
  });
}

function showStatus(selector, message, kind = '') {
  $$(selector).forEach(element => {
    element.textContent = message;
    element.dataset.state = kind;
  });
}

function compactPlace(place) {
  if (!place) return 'Choose a city';
  return [place.name, place.admin1]
    .filter((value, index, list) => value && list.indexOf(value) === index)
    .join(', ') || place.country || 'Selected location';
}

function readSavedLocation() {
  try {
    const saved = JSON.parse(localStorage.getItem(WEATHER_KEY) || 'null');
    if (saved && Number.isFinite(Number(saved.latitude)) && Number.isFinite(Number(saved.longitude))) {
      return {
        name: String(saved.name || 'Selected location'),
        admin1: String(saved.admin1 || ''),
        country: String(saved.country || ''),
        latitude: Number(saved.latitude),
        longitude: Number(saved.longitude),
        timezone: String(saved.timezone || 'auto')
      };
    }
  } catch (error) {
    console.warn('Saved weather location could not be read:', error);
  }
  return null;
}

function saveLocation(place) {
  state.location = {
    name: String(place.name || 'Selected location'),
    admin1: String(place.admin1 || ''),
    country: String(place.country || ''),
    latitude: Number(place.latitude),
    longitude: Number(place.longitude),
    timezone: String(place.timezone || 'auto')
  };
  localStorage.setItem(WEATHER_KEY, JSON.stringify(state.location));
  setText('[data-weather-city]', compactPlace(state.location));
  setText('[data-mobile-temp-city]', compactPlace(state.location));
  $('.weather-picker').forEach(panel => panel.hidden = true);
  $('.weather-picker-toggle').forEach(button => button.setAttribute('aria-expanded', 'false'));
  window.dispatchEvent(new Event('kolpotuli-weather-location-selected'));
  updateWeather();
}

function weatherIcon(code, isDay = true) {
  if ([95, 96, 99].includes(code)) return '⛈';
  if ([71, 73, 75, 77, 85, 86].includes(code)) return '❄';
  if ([61, 63, 65, 66, 67, 80, 81, 82, 51, 53, 55, 56, 57].includes(code)) return '🌧';
  if ([45, 48].includes(code)) return '🌫';
  if (code === 0) return isDay ? '☀' : '☾';
  if ([1, 2].includes(code)) return isDay ? '🌤' : '☁';
  return '☁';
}

async function updateWeather() {
  const location = state.location;
  if (!location) {
    setText('[data-weather-temp]', '—°');
    setText('[data-mobile-temp]', '—°');
    setText('[data-weather-summary]', 'Choose a city or use your location.');
    setText('[data-mobile-weather-summary]', 'Choose your city for local weather.');
    setText('[data-weather-city]', 'Choose a city');
    setText('[data-mobile-temp-city]', 'Choose a city');
    setText('[data-weather-icon]', '☁');
    setText('[data-mobile-weather-icon]', '☁');
    return;
  }

  const requestId = ++state.weatherRequest;
  setText('[data-weather-summary]', 'Updating local weather…');
  setText('[data-mobile-weather-summary]', 'Updating local weather…');

  const params = new URLSearchParams({
    latitude: String(location.latitude),
    longitude: String(location.longitude),
    current: 'temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,is_day,wind_speed_10m',
    daily: 'temperature_2m_max,temperature_2m_min',
    timezone: location.timezone || 'auto',
    forecast_days: '1'
  });

  try {
    const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
    if (!response.ok) throw new Error('Weather provider returned an error.');
    const data = await response.json();
    if (requestId !== state.weatherRequest) return;
    if (!data.current) throw new Error('Weather data is incomplete.');

    const current = data.current;
    const temperature = Math.round(current.temperature_2m);
    const feels = Math.round(current.apparent_temperature);
    const code = Number(current.weather_code);
    const description = weatherDescriptions[code] || 'Current conditions';
    const high = data.daily?.temperature_2m_max?.[0];
    const low = data.daily?.temperature_2m_min?.[0];
    const detail = `Feels like ${feels}° · ${description}`;
    const summary = Number.isFinite(high) && Number.isFinite(low)
      ? `${detail} · H ${Math.round(high)}° / L ${Math.round(low)}°`
      : detail;
    const glyph = weatherIcon(code, Number(current.is_day) === 1);

    setText('[data-weather-temp]', `${temperature}°`);
    setText('[data-mobile-temp]', `${temperature}°`);
    setText('[data-weather-summary]', summary);
    setText('[data-mobile-weather-summary]', summary);
    setText('[data-weather-icon]', glyph);
    setText('[data-mobile-weather-icon]', glyph);
    setText('[data-weather-humidity]', `${Math.round(current.relative_humidity_2m)}% humidity`);
    setText('[data-weather-wind]', `${Math.round(current.wind_speed_10m)} km/h wind`);
    setText('[data-weather-updated]', `Updated ${new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(new Date())}`);
  } catch (error) {
    if (requestId !== state.weatherRequest) return;
    console.warn('Local weather unavailable:', error);
    setText('[data-weather-summary]', 'Weather is temporarily unavailable.');
    setText('[data-mobile-weather-summary]', 'Weather is temporarily unavailable.');
  }
}

async function searchCities(query) {
  const params = new URLSearchParams({
    name: query,
    count: '6',
    language: document.documentElement.lang === 'bn' ? 'bn' : 'en',
    format: 'json'
  });
  const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?${params}`);
  if (!response.ok) throw new Error('City search is unavailable right now.');
  const data = await response.json();
  return (data.results || []).map(item => ({
    name: item.name,
    admin1: item.admin1 || '',
    country: item.country || '',
    latitude: item.latitude,
    longitude: item.longitude,
    timezone: item.timezone || 'auto'
  }));
}

function renderCityResults(results, target) {
  if (!target) return;
  if (!results.length) {
    target.innerHTML = '<p class="picker-empty">No matching cities. Try adding a state or country.</p>';
    return;
  }

  target.innerHTML = results.map((place, index) => `
    <button type="button" class="city-result" data-city-index="${index}">
      <span class="city-result-icon" aria-hidden="true">⌖</span>
      <span><strong>${escapeHtml(compactPlace(place))}</strong><small>${escapeHtml(place.country)}</small></span>
      <span class="city-result-arrow" aria-hidden="true">↗</span>
    </button>`).join('');

  target.querySelectorAll('[data-city-index]').forEach(button => {
    button.addEventListener('click', () => {
      const place = results[Number(button.dataset.cityIndex)];
      if (place) saveLocation(place);
    });
  });
}

function setupWeatherPicker() {
  const saved = readSavedLocation();
  if (saved) state.location = saved;

  $$('.weather-picker-toggle').forEach(button => {
    button.addEventListener('click', () => {
      const panel = $(button.dataset.weatherPickerTarget || '.weather-picker');
      if (!panel) return;
      const open = panel.hidden;
      panel.hidden = !open;
      button.setAttribute('aria-expanded', String(open));
      if (open) panel.querySelector('input[type="search"]')?.focus();
    });
  });

  $$('.weather-picker-close').forEach(button => button.addEventListener('click', () => {
    $$('.weather-picker').forEach(panel => panel.hidden = true);
    $$('.weather-picker-toggle').forEach(toggle => toggle.setAttribute('aria-expanded', 'false'));
  }));

  $$('[data-weather-search-form]').forEach(form => {
    form.addEventListener('submit', async event => {
      event.preventDefault();
      const input = form.querySelector('[data-weather-city-query]');
      const target = form.closest('.weather-picker, .mobile-sheet-body')?.querySelector('[data-weather-city-results]');
      const query = input?.value.trim();
      if (!query || !target) {
        showStatus('[data-weather-status]', 'Enter a city name first.', 'error');
        return;
      }
      target.innerHTML = '<p class="picker-empty">Searching cities…</p>';
      showStatus('[data-weather-status]', '');
      try {
        const results = await searchCities(query);
        renderCityResults(results, target);
        if (!results.length) showStatus('[data-weather-status]', 'No matching city found.', 'error');
      } catch (error) {
        target.replaceChildren();
        showStatus('[data-weather-status]', error.message || 'City search failed.', 'error');
      }
    });
  });

  $$('[data-weather-use-location]').forEach(button => {
    button.addEventListener('click', () => {
      if (!navigator.geolocation) {
        showStatus('[data-weather-status]', 'This browser does not support location access. Search for your city instead.', 'error');
        return;
      }

      button.disabled = true;
      showStatus('[data-weather-status]', 'Waiting for location permission…');
      navigator.geolocation.getCurrentPosition(async position => {
        const { latitude, longitude } = position.coords;
        let place = {
          name: 'Your location',
          admin1: '',
          country: '',
          latitude,
          longitude,
          timezone: 'auto'
        };

        try {
          const reverseUrl = new URL('https://api.bigdatacloud.net/data/reverse-geocode-client');
          reverseUrl.searchParams.set('latitude', String(latitude));
          reverseUrl.searchParams.set('longitude', String(longitude));
          reverseUrl.searchParams.set('localityLanguage', document.documentElement.lang === 'bn' ? 'bn' : 'en');
          const response = await fetch(reverseUrl);
          if (response.ok) {
            const data = await response.json();
            place = {
              ...place,
              name: data.city || data.locality || data.principalSubdivision || 'Your location',
              admin1: data.principalSubdivision || '',
              country: data.countryName || '',
              latitude,
              longitude,
              timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'auto'
            };
          }
        } catch (error) {
          console.info('Could not resolve the city name for current location:', error);
        }

        saveLocation(place);
        showStatus('[data-weather-status]', 'Using your location.');
        button.disabled = false;
      }, error => {
        button.disabled = false;
        const message = error.code === 1
          ? 'Location permission was denied. You can still search for a city.'
          : error.code === 3
            ? 'Location request timed out. Try again or search for a city.'
            : 'Could not read your location. Try searching for a city.';
        showStatus('[data-weather-status]', message, 'error');
      }, { enableHighAccuracy: false, timeout: 12000, maximumAge: 300000 });
    });
  });

  updateWeather();
  window.setInterval(updateWeather, 10 * 60 * 1000);
}

/* YouTube: Data API provides search results; IFrame API keeps playback on-page. */
function getVideoId(value) {
  const input = String(value || '').trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(input)) return input;

  try {
    const url = new URL(input);
    const host = url.hostname.replace(/^www\./, '').toLowerCase();
    if (host === 'youtu.be') {
      const id = url.pathname.split('/').filter(Boolean)[0];
      return /^[a-zA-Z0-9_-]{11}$/.test(id || '') ? id : null;
    }
    if (host.endsWith('youtube.com') || host === 'youtube-nocookie.com') {
      const id = url.searchParams.get('v')
        || url.pathname.match(/\/(?:embed|shorts|live)\/([a-zA-Z0-9_-]{11})/)?.[1];
      return /^[a-zA-Z0-9_-]{11}$/.test(id || '') ? id : null;
    }
  } catch {}
  return null;
}

function setMusicMessage(message, kind = '') {
  showStatus('[data-music-status]', message, kind);
}

function renderSongResults(songs) {
  $('[data-youtube-results]').forEach(target => {
    if (!songs.length) {
      target.innerHTML = '<p class="music-empty">No songs found. Try another title or artist.</p>';
      return;
    }

    target.innerHTML = songs.map((song, index) => `
      <button type="button" class="youtube-result" data-song-index="${index}">
        <img src="${escapeHtml(song.thumbnail || `https://i.ytimg.com/vi/${encodeURIComponent(song.id)}/mqdefault.jpg`)}" alt="" loading="lazy">
        <span class="youtube-result-copy"><strong>${escapeHtml(song.title)}</strong><small>${escapeHtml(song.channel)}</small></span>
        <span class="youtube-result-play" aria-hidden="true">▶</span>
      </button>`).join('');

    target.querySelectorAll('[data-song-index]').forEach(button => {
      button.addEventListener('click', () => {
        const songIndex = Number(button.dataset.songIndex);
        state.activeSongIndex = songIndex;
        playSong(songs[songIndex]);
      });
    });
  });
}

function formatVideo(song) {
  if (!song?.id || !song?.title) return null;
  return {
    id: song.id,
    title: song.title,
    channel: song.channel || 'YouTube',
    thumbnail: song.thumbnail || ''
  };
}

async function searchYouTube(query) {
  const normalized = query.trim();
  if (normalized.length < 2) {
    $('[data-youtube-results]').forEach(target => {
      target.innerHTML = '<p class="music-empty">Type at least 2 characters to see song suggestions.</p>';
    });
    return;
  }
  if (normalized === state.songSearchQuery && (state.songResults.length || state.songSearchController)) return;

  const requestId = ++state.songSearchRequest;
  state.songSearchController?.abort();
  const controller = new AbortController();
  state.songSearchController = controller;
  state.songSearchQuery = normalized;
  state.activeSongIndex = -1;
  let hadValidResponse = false;
  let timedOut = false;
  const timeout = window.setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, 1800);

  setMusicMessage('Finding songs…');
  $('[data-youtube-results]').forEach(target => {
    target.innerHTML = '<p class="music-empty">Finding songs…</p>';
  });

  try {
    if (!YOUTUBE_KEY) {
      const endpoints = [
        'https://invidious.nerdvpn.de',
        'https://yt.chocolatemoo53.com',
        'https://invidious.tiekoetter.com',
        'https://inv.nadeko.net'
      ];
      const fastest = await Promise.any(endpoints.map(async endpoint => {
        const params = new URLSearchParams({ q: normalized, type: 'video' });
        const response = await fetch(`${endpoint}/api/v1/search?${params}`, {
          signal: controller.signal,
          cache: 'no-store'
        });
        if (!response.ok) throw new Error('Search instance unavailable.');
        const data = await response.json();
        if (!Array.isArray(data)) throw new Error('Invalid search response.');
        hadValidResponse = true;
        const songs = data
          .filter(item => item.type === 'video')
          .map(item => {
            const thumbnails = item.videoThumbnails || [];
            const thumbnail = thumbnails.find(image => /medium|high/i.test(image.quality))?.url
              || thumbnails[0]?.url
              || '';
            let imageUrl = '';
            try { imageUrl = thumbnail ? new URL(thumbnail, endpoint).href : ''; } catch {}
            return formatVideo({
              id: item.videoId,
              title: item.title,
              channel: item.author,
              thumbnail: imageUrl
            });
          })
          .filter(Boolean)
          .slice(0, 8);
        if (!songs.length) throw new Error('No matching videos on this instance.');
        return songs;
      }));

      if (requestId !== state.songSearchRequest) return;
      window.clearTimeout(timeout);
      controller.abort();
      state.songResults = fastest;
      renderSongResults(fastest);
      setMusicMessage(`Found ${fastest.length} songs. Choose one to play it here.`);
      return;
    }

    const params = new URLSearchParams({
      part: 'snippet',
      type: 'video',
      maxResults: '8',
      q: normalized,
      key: YOUTUBE_KEY,
      safeSearch: 'moderate'
    });
    const response = await fetch(`https://www.googleapis.com/youtube/v3/search?${params}`, {
      signal: controller.signal
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || 'YouTube search failed.');
    if (requestId !== state.songSearchRequest) return;

    state.songResults = (data.items || []).map(item => formatVideo({
      id: item.id?.videoId,
      title: item.snippet?.title,
      channel: item.snippet?.channelTitle,
      thumbnail: item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url
    })).filter(Boolean);

    renderSongResults(state.songResults);
    setMusicMessage(state.songResults.length ? `Found ${state.songResults.length} songs. Choose one to play it here.` : 'No songs found.');
  } catch (error) {
    if (requestId !== state.songSearchRequest) return;
    if (controller.signal.aborted && !timedOut) return;

    console.warn('Song suggestions could not load:', error);
    const message = hadValidResponse
      ? 'No songs found. Try another title or artist.'
      : timedOut
        ? 'Search is taking too long. Keep typing or try again in a moment.'
        : 'Song suggestions are temporarily unavailable. Please try again.';
    setMusicMessage(message, hadValidResponse ? '' : 'error');
    $('[data-youtube-results]').forEach(target => {
      target.innerHTML = `<p class="music-empty">${escapeHtml(message)}</p>`;
    });
  } finally {
    window.clearTimeout(timeout);
    if (requestId === state.songSearchRequest && state.songSearchController === controller) {
      state.songSearchController = null;
    }
  }
}

function loadYouTubeAPI() {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (state.playerReadyPromise) return state.playerReadyPromise;

  state.playerReadyPromise = new Promise((resolve, reject) => {
    let script = $('script[data-youtube-iframe-api]');
    if (!script) {
      script = document.createElement('script');
      script.src = 'https://www.youtube.com/iframe_api';
      script.async = true;
      script.dataset.youtubeIframeApi = 'true';
      script.onerror = () => reject(new Error('YouTube player could not be loaded. Check your connection.'));
      document.head.append(script);
    }

    const previousReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (typeof previousReady === 'function') previousReady();
      if (window.YT?.Player) resolve(window.YT);
      else reject(new Error('YouTube player API did not initialize.'));
    };

    state.playerLoadTimer = window.setTimeout(() => {
      if (!window.YT?.Player) reject(new Error('YouTube player took too long to load.'));
    }, 15000);
  }).finally(() => {
    window.clearTimeout(state.playerLoadTimer);
    state.playerLoadTimer = null;
    if (!window.YT?.Player) state.playerReadyPromise = null;
  });

  return state.playerReadyPromise;
}

function updateNowPlaying(song) {
  setText('[data-current-track-title]', song.title);
  setText('[data-current-track-artist]', song.channel);
  setText('[data-current-track-name]', song.title);
  setText('[data-current-track-channel]', song.channel);
}

async function playSong(song) {
  if (!song?.id) return;
  const validSong = formatVideo(song);
  if (!validSong) {
    setMusicMessage('This YouTube link could not be recognized. Use a standard video URL.', 'error');
    return;
  }

  updateNowPlaying(validSong);
  setMusicMessage('Loading YouTube player…');
  $$('[data-youtube-results]').forEach(target => {
    target.querySelectorAll('[data-song-index]').forEach(button => {
      button.classList.toggle('selected', Number(button.dataset.songIndex) === state.activeSongIndex);
    });
  });

  try {
    await loadYouTubeAPI();
    const playerNode = $('[data-youtube-player]');
    if (!playerNode) {
      setMusicMessage('The player is not available on this page.', 'error');
      return;
    }

    // Destroy the existing player before replacing its DOM target.
    if (state.player) {
      try { state.player.destroy(); } catch {}
      state.player = null;
    }
    playerNode.innerHTML = '<div id="kolpotuliYoutubeFrame"></div>';
    state.playerReady = false;

    state.player = new window.YT.Player('kolpotuliYoutubeFrame', {
      width: '100%',
      height: '100%',
      videoId: validSong.id,
      playerVars: {
        autoplay: 1,
        controls: 0,
        playsinline: 1,
        rel: 0,
        origin: location.origin
      },
      events: {
        onReady: event => {
          state.playerReady = true;
          setMusicMessage('Starting playback…');
          $('[data-youtube-play],[data-youtube-pause]').forEach(button => button.disabled = false);
          $('[data-youtube-previous]').forEach(button => button.disabled = state.activeSongIndex <= 0);
          $('[data-youtube-next]').forEach(button => button.disabled = state.activeSongIndex < 0 || state.activeSongIndex >= state.songResults.length - 1);
          event.target.setVolume(70);
          event.target.playVideo();
        },
        onStateChange: event => {
          const playing = event.data === window.YT.PlayerState.PLAYING;
          $('[data-youtube-play]').forEach(button => {
            button.disabled = false;
            button.setAttribute('aria-label', playing ? 'Playing' : 'Play');
            button.textContent = playing ? 'Playing' : 'Play';
          });
          $('[data-youtube-pause]').forEach(button => { button.disabled = !playing; });
          if (event.data === window.YT.PlayerState.ENDED) {
            setMusicMessage('Track finished. Choose another result or replay it.');
          }
        },
        onError: event => {
          const descriptions = {
            2: 'This video ID is invalid.',
            5: 'This video cannot be played in the HTML5 player.',
            100: 'This video was removed or made private.',
            101: 'The owner does not allow this video to be embedded.',
            150: 'The owner does not allow this video to be embedded.'
          };
          setMusicMessage(descriptions[event.data] || 'This YouTube video could not be played here.', 'error');
        }
      }
    });
  } catch (error) {
    console.warn('YouTube player failed:', error);
    setMusicMessage(error.message || 'The player could not be loaded.', 'error');
  }
}

function setupMusicControls() {
  $('[data-youtube-search]').forEach(input => {
    input.addEventListener('input', () => {
      window.clearTimeout(state.songSearchTimer);
      const query = input.value.trim();
      if (query.length < 2) {
        state.songSearchRequest += 1;
        state.songSearchController?.abort();
        state.songSearchController = null;
        state.songSearchQuery = '';
        state.songResults = [];
        state.activeSongIndex = -1;
        $('[data-youtube-results]').forEach(target => {
          target.innerHTML = '<p class="music-empty">Type a song or artist to see matching videos.</p>';
        });
        setMusicMessage('Start typing a song or artist.');
        return;
      }
      state.songSearchTimer = window.setTimeout(() => searchYouTube(query), 260);
    });
  });

  $('[data-music-search-form]').forEach(form => {
    form.addEventListener('submit', event => {
      event.preventDefault();
      window.clearTimeout(state.songSearchTimer);
      searchYouTube(form.querySelector('[data-youtube-search]')?.value || '');
    });
  });

  $$('[data-youtube-url-form]').forEach(form => {
    form.addEventListener('submit', event => {
      event.preventDefault();
      const input = form.querySelector('[data-youtube-url]');
      const id = getVideoId(input?.value);
      if (!id) {
        setMusicMessage('Paste a valid YouTube video link or 11-character video ID.', 'error');
        return;
      }
      state.activeSongIndex = -1;
      playSong({ id, title: 'YouTube selection', channel: 'YouTube' });
    });
  });

  $$('[data-youtube-play]').forEach(button => button.addEventListener('click', () => {
    if (!state.player || !state.playerReady) {
      setMusicMessage('Choose a song first.', 'error');
      return;
    }
    state.player.playVideo();
  }));
  $$('[data-youtube-pause]').forEach(button => button.addEventListener('click', () => {
    if (state.player && state.playerReady) state.player.pauseVideo();
  }));
  $$('[data-youtube-next]').forEach(button => button.addEventListener('click', () => {
    const next = state.activeSongIndex + 1;
    if (state.songResults[next]) {
      state.activeSongIndex = next;
      playSong(state.songResults[next]);
    }
  }));
  $$('[data-youtube-previous]').forEach(button => button.addEventListener('click', () => {
    const previous = state.activeSongIndex - 1;
    if (state.songResults[previous]) {
      state.activeSongIndex = previous;
      playSong(state.songResults[previous]);
    }
  }));

  const initialTitle = 'Search for a song';
  setText('[data-current-track-title]', initialTitle);
  setText('[data-current-track-artist]', 'Search YouTube to start listening');
  $('[data-youtube-play],[data-youtube-pause],[data-youtube-next],[data-youtube-previous]').forEach(button => button.disabled = true);
  if (!YOUTUBE_KEY) {
    $('[data-youtube-results]').forEach(target => {
      target.innerHTML = '<p class="music-empty">Search for a song to see results here. Choose one to start playback inside Kolpotuli.</p>';
    });
  }
}

setupWeatherPicker();
setupMusicControls();
