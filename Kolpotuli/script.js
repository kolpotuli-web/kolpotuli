/* =========================================================
   KOLPOTULI V2 — MAIN APPLICATION LOGIC
   Handles Cinematic UI, Navigation, and Library Rendering
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  // 1. Initialize Cinematic Splash Screen
  initSplashScreen();

  // 2. Set Footer Year
  document.getElementById('current-year').innerText = new Date().getFullYear();

  // 3. Initialize Content
  renderDailyQuote();
  loadLibraryContent();

  // 4. Random Read Button
  document.getElementById('random-read-btn').addEventListener('click', openRandomWork);
});

/* ==========================================
   UI: CINEMATIC SPLASH SCREEN
========================================== */
function initSplashScreen() {
  const splashScreen = document.getElementById('splash-screen');
  const mainNav = document.getElementById('main-nav');
  const appContent = document.getElementById('app-content');

  // Allow the CSS animations to play out for 4.5 seconds
  setTimeout(() => {
    // Fade out splash screen
    splashScreen.classList.add('hidden');
    
    // Fade in main app
    mainNav.classList.remove('hidden');
    appContent.classList.remove('hidden');
    
    // Remove splash screen from DOM after fade to free up memory
    setTimeout(() => {
      if (splashScreen.parentNode) {
        splashScreen.parentNode.removeChild(splashScreen);
      }
    }, 2000);
  }, 4500); 
}

/* ==========================================
   UI: DAILY QUOTE
========================================== */
function renderDailyQuote() {
  // We will eventually pull these from your Firebase database
  const quotes = [
    "A forgotten archive where stories breathe.",
    "The sky turned a deep shade of steel blue before the downpour started.",
    "I should have left when the projection stopped.",
    "Memories are just ghosts we choose to keep in our library."
  ];
  
  const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
  const quoteContainer = document.getElementById('daily-quote');
  
  if (quoteContainer) {
    quoteContainer.innerHTML = `<p>"${randomQuote}"</p>`;
  }
}

/* ==========================================
   DATA: LIBRARY RENDERING
========================================== */
async function loadLibraryContent() {
  // ---------------------------------------------------------
  // FUTURE FIREBASE INTEGRATION POINT:
  // Here we will eventually import and call your Firebase DB
  // e.g., const libraryData = await getDocs(collection(db, "content"));
  // ---------------------------------------------------------

  // For now, we use high-quality mock data so your UI works perfectly today.
  const libraryData = [
    { id: "s1", title: "The First Rain", type: "story", author: "Kolpotuli" },
    { id: "s2", title: "Echoes in the Projection Room", type: "story", author: "Kolpotuli" },
    { id: "f1", title: "The Extraordinary Man", type: "film", author: "Kolpotuli" },
    { id: "a1", title: "Midnight Sketches", type: "art", author: "Kolpotuli" },
    { id: "b1", title: "Director's Journal: Oct 2024", type: "blog", author: "Kolpotuli" }
  ];

  // Clear existing containers
  const storyContainer = document.getElementById('storyContainer');
  const filmContainer = document.getElementById('filmContainer');
  const artContainer = document.getElementById('artContainer');
  const blogContainer = document.getElementById('blogContainer');

  if (storyContainer) storyContainer.innerHTML = '';
  if (filmContainer) filmContainer.innerHTML = '';
  if (artContainer) artContainer.innerHTML = '';
  if (blogContainer) blogContainer.innerHTML = '';

  // Render each item into its specific section
  libraryData.forEach(item => {
    const card = createBookCard(item);
    
    if (item.type === 'story' && storyContainer) storyContainer.appendChild(card);
    if (item.type === 'film' && filmContainer) filmContainer.appendChild(card);
    if (item.type === 'art' && artContainer) artContainer.appendChild(card);
    if (item.type === 'blog' && blogContainer) blogContainer.appendChild(card);
  });
}

function createBookCard(item) {
  const card = document.createElement('div');
  card.className = 'book-card';
  
  card.innerHTML = `
    <h3>${item.title}</h3>
    <span class="author">${item.author}</span>
  `;
  
  // When clicked, route to the reader page (we will build this next)
  card.addEventListener('click', () => {
    window.location.href = `reader.html?id=${item.id}`;
  });
  
  return card;
}

/* ==========================================
   UTILITY: RANDOM READ
========================================== */
function openRandomWork() {
  // Mock IDs for now
  const availableWorks = ["s1", "s2", "f1", "a1", "b1"];
  const randomId = availableWorks[Math.floor(Math.random() * availableWorks.length)];
  window.location.href = `reader.html?id=${randomId}`;
}