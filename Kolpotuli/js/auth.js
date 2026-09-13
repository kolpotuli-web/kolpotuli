import { supabase } from './supabase-config.js';

const googleButton = document.getElementById('googleBtn');
const phoneButton = document.getElementById('phoneBtn');

if (googleButton) googleButton.addEventListener('click', async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin + '/Kolpotuli/pages/profile.html' }
  });
  if (error) alert(error.message);
});

if (phoneButton) phoneButton.addEventListener('click', async () => {
  const phone = prompt('Enter your phone number with country code, e.g. +919876543210');
  if (!phone) return;
  const { error } = await supabase.auth.signInWithOtp({ phone });
  if (error) alert(error.message);
  else alert('OTP sent. Enter the code sent to your phone.');
});

async function syncProfile(user) {
  if (!user) return;
  await supabase.from('profiles').upsert({
    id: user.id,
    display_name: user.user_metadata?.full_name || user.user_metadata?.name || user.email || user.phone || 'Kolpotuli reader',
    email: user.email || null,
    avatar_url: user.user_metadata?.avatar_url || null,
    updated_at: new Date().toISOString()
  }, { onConflict: 'id' });
  localStorage.setItem('userName', user.user_metadata?.full_name || user.user_metadata?.name || user.email || user.phone || 'Kolpotuli reader');
  localStorage.setItem('userEmail', user.email || user.phone || '');
}

supabase.auth.onAuthStateChange((_event, session) => syncProfile(session?.user));
