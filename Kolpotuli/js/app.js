const desktop = document.getElementById('desktop');
const windows = [...document.querySelectorAll('.app-window')];
let z = 20;

function openWindow(id){
  const el = document.getElementById(id);
  if(!el) return;
  el.classList.remove('hidden');
  z += 1;
  el.style.zIndex = String(z);
  windows.forEach(w => w.classList.remove('active'));
  el.classList.add('active');
}
function closeWindow(id){ document.getElementById(id)?.classList.add('hidden'); }

document.addEventListener('click', event => {
  const target = event.target.closest('[data-window]');
  if(target){ event.preventDefault(); openWindow(target.dataset.window); }
  const close = event.target.closest('[data-close]');
  if(close){ event.preventDefault(); closeWindow(close.dataset.close); }
});
windows.forEach(win => win.addEventListener('mousedown', () => { z += 1; win.style.zIndex = String(z); }));

function updateClock(){
  const now = new Date();
  const time = new Intl.DateTimeFormat('en-IN',{hour:'numeric',minute:'2-digit',hour12:true}).format(now);
  const date = new Intl.DateTimeFormat('en-IN',{weekday:'long',day:'numeric',month:'long'}).format(now);
  document.getElementById('clockTime')?.replaceChildren(time);
  document.getElementById('menuTime')?.replaceChildren(time);
  document.getElementById('clockDate')?.replaceChildren(date);
}
updateClock(); setInterval(updateClock,1000);

const languageToggle = document.getElementById('languageToggle');
if(languageToggle){
  let bengali = false;
  languageToggle.addEventListener('click', () => {
    bengali = !bengali;
    languageToggle.textContent = bengali ? 'বাংলা / EN' : 'EN / বাংলা';
    document.documentElement.lang = bengali ? 'bn' : 'en';
  });
}

const wallpapers = {
  main:"url('assets/wallpapers/kolpotuli-main.svg')",
  dusk:"url('assets/wallpapers/kolpotuli-dusk.svg')",
  paper:"url('assets/wallpapers/kolpotuli-paper.svg')"
};
const savedWallpaper = localStorage.getItem('kolpotuli-wallpaper') || 'main';
if(desktop && wallpapers[savedWallpaper]) desktop.style.setProperty('--wallpaper',wallpapers[savedWallpaper]);

document.querySelectorAll('[data-wallpaper]').forEach(button => {
  button.addEventListener('click', () => {
    const key = button.dataset.wallpaper;
    if(!wallpapers[key] || !desktop) return;
    desktop.style.setProperty('--wallpaper',wallpapers[key]);
    localStorage.setItem('kolpotuli-wallpaper',key);
    document.querySelectorAll('[data-wallpaper]').forEach(b => b.classList.toggle('selected',b===button));
  });
});
document.querySelector(`[data-wallpaper="${savedWallpaper}"]`)?.classList.add('selected');

const style = document.createElement('style');
style.textContent = `.settings-window{width:520px;left:50%;top:12%;transform:translateX(-50%);z-index:50}.settings-window h2{margin:0;color:var(--navy);font-size:25px}.settings-intro{margin:5px 0 22px;opacity:.65}.settings-window h3{font-size:12px;letter-spacing:.08em;text-transform:uppercase;margin:18px 0 10px;color:var(--teal)}.wallpaper-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.wallpaper-card{padding:8px;border:1px solid rgba(20,32,42,.12);border-radius:14px;background:rgba(255,255,255,.45);color:var(--ink);text-align:left;box-shadow:0 8px 20px rgba(20,32,42,.08);transition:.18s}.wallpaper-card:hover,.wallpaper-card.selected{transform:translateY(-3px);border-color:var(--gold);box-shadow:0 12px 24px rgba(20,32,42,.14)}.wallpaper-preview{display:block;height:78px;border-radius:9px;margin-bottom:8px;background-size:cover;background-position:center}.main-preview{background-image:url('../assets/wallpapers/kolpotuli-main.svg')}.dusk-preview{background-image:url('../assets/wallpapers/kolpotuli-dusk.svg')}.paper-preview{background-image:url('../assets/wallpapers/kolpotuli-paper.svg')}.wallpaper-card strong,.wallpaper-card small{display:block}.wallpaper-card strong{font-size:12px}.wallpaper-card small{font-size:10px;opacity:.62;margin-top:2px}.setting-row{display:flex;justify-content:space-between;padding:12px 0;border-top:1px solid rgba(20,32,42,.08);font-size:12px}.setting-on{font-weight:700;color:var(--teal)}@media(max-width:800px){.settings-window{width:100%!important;left:auto;top:auto;transform:none}}`;
document.head.appendChild(style);

const playButton = document.querySelector('.music-controls .play');
if(playButton){
  playButton.addEventListener('click', () => {
    playButton.classList.toggle('playing');
    playButton.textContent = playButton.classList.contains('playing') ? 'Ⅱ' : '▶';
  });
}
