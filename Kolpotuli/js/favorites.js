import { supabase } from './supabase-config.js';

window.toggleFavorite = async (button, type, title) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) { window.location.href = 'login.html'; return; }
  const { data: existing } = await supabase.from('favorites').select('id').eq('user_id', user.id).eq('type', type).eq('title', title).maybeSingle();
  if (existing) {
    button.classList.remove('active'); button.innerHTML = '♡';
    await supabase.from('favorites').delete().eq('id', existing.id);
  } else {
    button.classList.add('active'); button.innerHTML = '❤';
    await supabase.from('favorites').insert({ user_id: user.id, type, title });
  }
};
