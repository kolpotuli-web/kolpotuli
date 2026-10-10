import { supabase } from './supabase.js';

const modal = document.createElement('div');
modal.className = 'auth-modal hidden';
modal.innerHTML = `
  <div class="auth-backdrop" data-auth-close></div>
  <section class="auth-card">
    <button class="auth-x" type="button" data-auth-close aria-label="Close sign in">×</button>
    <div class="auth-mark" aria-hidden="true">ক</div>
    <h2 id="auth-title">Welcome back</h2>
    <p id="auth-copy">Sign in to save stories, build your Library and keep your reading history.</p>
    <form id="auth-form">
      <label class="visually-hidden" for="auth-email">Email</label>
      <input id="auth-email" type="email" autocomplete="email" required placeholder="Email">
      <label class="visually-hidden" for="auth-password">Password</label>
      <input id="auth-password" type="password" autocomplete="current-password" required minlength="6" placeholder="Password">
      <button class="auth-primary" type="submit" id="auth-submit">Sign in</button>
    </form>
    <button class="auth-secondary" type="button" id="auth-switch">Create an account</button>
    <div class="auth-divider"><span>or</span></div>
    <button class="auth-secondary" type="button" id="auth-guest">Continue as guest</button>
    <div id="auth-status" role="status" aria-live="polite"></div>
  </section>`;
document.body.append(modal);

const style = document.createElement('style');
style.textContent = `
  .auth-modal { position: fixed; inset: 0; z-index: 9999; display: grid; place-items: center; padding: 18px; }
  .auth-modal.hidden { display: none; }
  .auth-backdrop { position: absolute; inset: 0; background: rgba(3,15,24,.48); backdrop-filter: blur(5px); -webkit-backdrop-filter: blur(5px); }
  .auth-card { position: relative; width: min(420px,100%); padding: 26px; border-radius: 13px; color: var(--mac-ink, #1d252b); background: var(--mac-content, rgba(255,253,247,.98)); border: .5px solid var(--mac-line-strong, rgba(23,40,52,.2)); box-shadow: var(--mac-shadow-lg, 0 20px 70px rgba(0,0,0,.25)); }
  .auth-x { position: absolute; right: 11px; top: 9px; width: 28px; height: 28px; border-radius: 6px; color: var(--mac-secondary, #67727b); font-size: 20px; }
  .auth-x:hover { background: rgba(128,138,142,.12); }
  .auth-mark { width: 42px; height: 42px; border-radius: 11px; display: grid; place-items: center; background: var(--mac-gold, #e8ae26); color: #10283d; font: 700 23px "Noto Serif Bengali", serif; margin-bottom: 15px; }
  .auth-card h2 { margin: 0 0 7px; font-size: 22px; letter-spacing: -.02em; }
  .auth-card p { margin: 0 0 18px; color: var(--mac-secondary, #67727b); line-height: 1.5; font-size: 12px; }
  .auth-card form { display: grid; gap: 9px; }
  .auth-card input { width: 100%; padding: 10px 12px; border-radius: 7px; border: .5px solid var(--mac-line-strong, rgba(23,40,52,.2)); background: var(--mac-panel, #f7f6f2); color: var(--mac-ink, #1d252b); outline: 0; font-size: 13px; }
  .auth-card input:focus-visible { outline: 2px solid var(--mac-blue, #315e78); outline-offset: 2px; }
  .auth-primary,.auth-secondary { width: 100%; padding: 10px 12px; border-radius: 7px; font-size: 12px; font-weight: 600; cursor: pointer; }
  .auth-primary { background: var(--mac-blue, #315e78); color: white; }
  .auth-primary:hover { filter: brightness(1.08); }
  .auth-secondary { margin-top: 9px; background: rgba(128,138,142,.08); color: var(--mac-ink, #1d252b); border: .5px solid var(--mac-line, rgba(23,40,52,.12)); }
  .auth-divider { display: flex; align-items: center; gap: 10px; margin: 15px 0 0; color: var(--mac-muted, #8b9499); }
  .auth-divider:before,.auth-divider:after { content: ""; height: .5px; background: var(--mac-line, rgba(23,40,52,.12)); flex: 1; }
  .auth-divider span { font-size: 10px; }
  #auth-status { min-height: 18px; margin-top: 12px; color: var(--mac-secondary, #67727b); font-size: 12px; }
  @media (prefers-reduced-motion: reduce) { .auth-card, .auth-backdrop { transition: none; } }
`;
document.head.append(style);

let signupMode = false;

const title = document.getElementById('auth-title');
const copy = document.getElementById('auth-copy');
const submit = document.getElementById('auth-submit');
const switchButton = document.getElementById('auth-switch');
const status = document.getElementById('auth-status');
const emailInput = document.getElementById('auth-email');
const passwordInput = document.getElementById('auth-password');

function renderAuthForm() {
  title.textContent = signupMode ? 'Create your Kolpotuli account' : 'Welcome back';
  copy.textContent = signupMode
    ? 'Join Kolpotuli to keep your Library, favorites and reading progress with you.'
    : 'Sign in to save stories, build your Library and keep your reading history.';
  submit.textContent = signupMode ? 'Create account' : 'Sign in';
  switchButton.textContent = signupMode ? 'Already have an account? Sign in' : 'Create an account';
  passwordInput.autocomplete = signupMode ? 'new-password' : 'current-password';
}

export function openAuth() {
  modal.classList.remove('hidden');
  status.textContent = '';
  renderAuthForm();
  window.setTimeout(() => emailInput.focus(), 0);
}

export function closeAuth() {
  modal.classList.add('hidden');
}

modal.addEventListener('click', event => {
  if (event.target.matches('[data-auth-close]')) closeAuth();
});
switchButton.addEventListener('click', () => {
  signupMode = !signupMode;
  status.textContent = '';
  renderAuthForm();
});
document.getElementById('auth-guest').addEventListener('click', closeAuth);

document.getElementById('auth-form').addEventListener('submit', async event => {
  event.preventDefault();
  status.textContent = signupMode ? 'Creating your account…' : 'Signing in…';
  submit.disabled = true;

  const email = emailInput.value.trim();
  const password = passwordInput.value;
  const result = signupMode
    ? await supabase.auth.signUp({ email, password })
    : await supabase.auth.signInWithPassword({ email, password });

  submit.disabled = false;
  if (result.error) {
    status.textContent = result.error.message;
    return;
  }

  if (signupMode) {
    status.textContent = result.data.session
      ? 'Account created.'
      : 'Check your email to confirm your account.';
    return;
  }

  closeAuth();
  window.dispatchEvent(new CustomEvent('kolpotuli-auth-changed', { detail: result.data.user }));
});

export async function refreshAuthUI() {
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    console.warn('Could not refresh authentication status:', error.message);
    return null;
  }

  document.querySelectorAll('[data-auth-action]').forEach(button => {
    button.textContent = data.user ? 'Profile' : 'Sign in';
    button.dataset.window = data.user ? 'profile' : 'auth';
  });

  return data.user;
}

supabase.auth.onAuthStateChange((_event, session) => {
  window.dispatchEvent(new CustomEvent('kolpotuli-auth-changed', { detail: session?.user || null }));
});
