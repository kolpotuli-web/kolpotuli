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

document.addEventListener('click', (event) => {
  const target = event.target.closest('[data-window]');
  if(target){
    event.preventDefault();
    openWindow(target.dataset.window);
  }

  const close = event.target.closest('[data-close]');
  if(close){
    event.preventDefault();
    closeWindow(close.dataset.close);
  }
});

windows.forEach(win => {
  win.addEventListener('mousedown', () => {
    z += 1;
    win.style.zIndex = String(z);
  });
});

function updateClock(){
  const now = new Date();
  const time = new Intl.DateTimeFormat('en-IN',{hour:'numeric',minute:'2-digit',hour12:true}).format(now);
  const date = new Intl.DateTimeFormat('en-IN',{weekday:'long',day:'numeric',month:'long'}).format(now);
  const clockTime = document.getElementById('clockTime');
  const menuTime = document.getElementById('menuTime');
  const clockDate = document.getElementById('clockDate');
  if(clockTime) clockTime.textContent = time;
  if(menuTime) menuTime.textContent = time;
  if(clockDate) clockDate.textContent = date;
}
updateClock();
setInterval(updateClock, 1000);

const languageToggle = document.getElementById('languageToggle');
if(languageToggle){
  let bengali = false;
  languageToggle.addEventListener('click', () => {
    bengali = !bengali;
    languageToggle.textContent = bengali ? 'বাংলা / EN' : 'EN / বাংলা';
    document.documentElement.lang = bengali ? 'bn' : 'en';
  });
}

const settingsButton = document.getElementById('settingsButton');
if(settingsButton){
  settingsButton.addEventListener('click', () => {
    alert('Wallpaper, appearance, language, reading, account and accessibility settings will be connected in the next frontend pass.');
  });
}
