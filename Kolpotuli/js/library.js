import { supabase } from './supabase-config.js';

window.removeFavorite = async (button, type, title) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from('favorites').delete().eq('user_id', user.id).eq('type', type).eq('title', title);
  const card = button.closest('.story-card');
  const container = card?.parentElement;
  card?.remove();
  if (container && !container.children.length) container.innerHTML = `<p>No saved ${type === 'story' ? 'stories' : type === 'art' ? 'artwork' : 'blogs'} yet</p>`;
};

async function loadData() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const { data: favorites = [] } = await supabase.from('favorites').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
  const { data: reading = [] } = await supabase.from('reading').select('*').eq('user_id', user.id).order('updated_at', { ascending: false });
  let storyHTML='', artHTML='', blogHTML='', readingHTML='';
  favorites.forEach(data => {
    const card = `<div class="story-card"><button class="favorite-btn active" onclick="removeFavorite(this,'${data.type}','${String(data.title).replace(/'/g,"\\'")}')">❤</button><h2>${data.title}</h2><p>${data.type}</p></div>`;
    if (data.type === 'story') storyHTML += card;
    if (data.type === 'art') artHTML += card;
    if (data.type === 'blog') blogHTML += card;
  });
  reading.forEach(data => readingHTML += `<div class="story-card"><h2>${data.title}</h2></div>`);
  document.getElementById('favoriteStories')?.replaceChildren();
  document.getElementById('favoriteStories') && (document.getElementById('favoriteStories').innerHTML = storyHTML || '<p>No saved stories yet</p>');
  document.getElementById('favoriteArt') && (document.getElementById('favoriteArt').innerHTML = artHTML || '<p>No saved artwork yet</p>');
  document.getElementById('savedBlogs') && (document.getElementById('savedBlogs').innerHTML = blogHTML || '<p>No saved blogs yet</p>');
  document.getElementById('continueReading') && (document.getElementById('continueReading').innerHTML = readingHTML || '<p>Nothing opened yet</p>');
}

loadData();
