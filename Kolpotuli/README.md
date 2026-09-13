# Kolpotuli — কল্পতুলি

A small bilingual literary and art archive built around the supplied Kolpotuli identity. The homepage uses the supplied logo and the brand palette already present in the repository: paper yellow, midnight ink, and gold. fileciteturn4file0L1-L2

## Add stories
Put PDFs in:

- `stories/english/`
- `stories/bengali/`

A GitHub Action rebuilds `content-manifest.json` after story/art/blog changes, so you do not edit JavaScript just to add a file.

## Add art
Put `.jpg`, `.jpeg`, `.png`, or `.webp` files in `art/`.

## Add blogs
Put `.md`, `.html`, or `.txt` files in `blogs/`.

## Change Instagram
Edit `config/site.js`. The current Instagram identity is `https://www.instagram.com/kolpotuli/`.

## Site structure
The public site lives in `Kolpotuli/`. The supplied repository already had folders for admin, art, assets, blogs, pages, stories and JavaScript, plus an existing logo at `assets/logo.png`. fileciteturn3file0L2-L2

## Deployment
Enable GitHub Pages for the `Kolpotuli` directory with your preferred Pages configuration. The repository is public and uses `main` as its default branch.

## Backend note
The current public build is deliberately static-first so it works on GitHub Pages. Supabase can be connected later for authenticated admin editing, comments, bookmarks, reading progress and contact storage; this requires adding the project's Supabase URL and anon key as site configuration/secrets and creating the database policies. The old repository currently contains Firebase configuration files, so those are not silently repurposed.
