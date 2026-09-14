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

function closeWindow(id){
  const el = document.getElementById(id);
  if(el) el.classList.add('hidden');
}

document.addEventListener('click', event => {
  const target = event.target.closest('[data-window]');
  if(target){ event.preventDefault(); openWindow(target.dataset.window); }
  const close = event.target.closest('[data-close]');
  if(close){ event.preventDefault(); closeWindow(close.dataset.close); }
});

windows.forEach(win => win.addEventListener('mousedown', () => {
  z += 1;
  win.style.zIndex = String(z);
}));

function updateClock(){
  const now = new Date();
  const time = new Intl.DateTimeFormat('en-IN',{hour:'numeric',minute:'2-digit',hour12:true}).format(now);
  const date = new Intl.DateTimeFormat('en-IN',{weekday:'long',day:'numeric',month:'long'}).format(now);
  document.getElementById('clockTime')?.replaceChildren(time);
  document.getElementById('menuTime')?.replaceChildren(time);
  document.getElementById('clockDate')?.replaceChildren(date);
}
updateClock();
setInterval(updateClock,1000);

const languageToggle = document.getElementById('languageToggle');
if(languageToggle){
  let bengali = false;
  languageToggle.addEventListener('click', () => {
    bengali = !bengali;
    languageToggle.textContent = bengali ? 'বাংলা / EN' : 'EN / বাংলা';
    document.documentElement.lang = bengali ? 'bn' : 'en';
    document.querySelectorAll('[data-en][data-bn]').forEach(el => {
      el.textContent = bengali ? el.dataset.bn : el.dataset.en;
    });
  });
}

const wallpapers = {
  main: "url('assets/wallpapers/kolpotuli-main.svg')",
  dusk: "url('assets/wallpapers/kolpotuli-dusk.svg')",
  paper: "url('assets/wallpapers/kolpotuli-paper.svg')"
};
const savedWallpaper = localStorage.getItem('kolpotuli-wallpaper') || 'main';
if(desktop && wallpapers[savedWallpaper]) desktop.style.setProperty('--wallpaper', wallpapers[savedWallpaper]);

document.querySelectorAll('[data-wallpaper]').forEach(button => {
  button.addEventListener('click', () => {
    const key = button.dataset.wallpaper;
    if(!wallpapers[key] || !desktop) return;
    desktop.style.setProperty('--wallpaper', wallpapers[key]);
    localStorage.setItem('kolpotuli-wallpaper', key);
    document.querySelectorAll('[data-wallpaper]').forEach(b => b.classList.toggle('selected', b === button));
  });
});

document.querySelector('[data-wallpaper="'+savedWallpaper+'"]')?.classList.add('selected');

const playButton = document.querySelector('.music-controls .play');
if(playButton){
  playButton.addEventListener('click', () => {
    playButton.classList.toggle('playing');
    playButton.textContent = playButton.classList.contains('playing') ? 'Ⅱ' : '▶';
  });
}
