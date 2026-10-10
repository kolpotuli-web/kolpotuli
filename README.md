# Kolpotuli

Kolpotuli is a static website built with plain HTML, CSS, and JavaScript modules. The desktop homepage, Creator Studio, profile page, and reader are in `Kolpotuli/`. Content, accounts, saved items, notes, and reading progress use Supabase.

## Run it locally

You do not need React, a bundler, or a dependency install to run the site. Use a local web server because the pages load JavaScript modules.

From the repository root, run:

```sh
python -m http.server 8000 --directory Kolpotuli
```

Then open [http://localhost:8000](http://localhost:8000).

You can also open the `Kolpotuli/` folder in VS Code and use its Live Server extension.

## Check the code

Install Node.js 20 or newer, then run this from the repository root:

```sh
npm run check
```

The checker uses Node's built-in tools only. It checks JavaScript syntax, local page/resource links, local module imports, repeated HTML IDs, and basic CSS delimiter balance. GitHub Actions runs the same command for pushes and pull requests.

These checks catch common build mistakes, but they do not replace browser testing or a live Supabase integration test.

## Build and deployment

There is no compile/bundle step right now: the browser runs the source files directly. The deploy workflow publishes the contents of `Kolpotuli/` to GitHub Pages. After changes, run `npm run check`, test the relevant page in a browser, and push the intended changes to `main` to deploy.

## Main files

- `Kolpotuli/index.html` — desktop shell and its widgets/windows.
- `Kolpotuli/css/base.css` — shared design tokens and foundations.
- `Kolpotuli/css/desktop.css` — desktop layout and component styles.
- `Kolpotuli/css/desktop-reference.css` — screenshot calibration styles.
- `Kolpotuli/js/app.js` — desktop interactions and content loading.
- `Kolpotuli/js/library.js` — saved items, reading progress, recent items, and collections.
- `Kolpotuli/js/notes.js` — personal notes.
- `Kolpotuli/js/auth-ui.js` — sign-in/sign-up interface.
- `Kolpotuli/js/supabase.js` — public Supabase client configuration.
- `Kolpotuli/admin.html` — Creator Studio.
- `Kolpotuli/read.html` — reader and reading progress.
- `Kolpotuli/profile.html` — profile editing.

## Configuration and safety

The Supabase publishable key is meant for browser use. Database Row Level Security (RLS) policies must remain enabled and must enforce permissions; front-end role checks alone are not security. Never put a Supabase service-role key or any other server secret in this repository.
