# Sarrah Portfolio Manager

A friendly desktop app (Windows + macOS) for adding and managing content on
Sarrah Campbell's portfolio website — **no coding, ffmpeg, Cloudinary, GitHub, or
CDN knowledge required.**

It automatically:

- Optimizes `.mov` / `.mp4` videos for the web with **ffmpeg** (bundled).
- Uploads videos and images to **Cloudinary**.
- Lets you pick a **thumbnail frame** and add scene **time-ranges** for client work.
- Writes the correct markdown and **publishes to the website** (commits to `main`,
  which rebuilds the site automatically).
- Lets you **reorder** (drag & drop), **edit**, **delete**, and mark items
  **locked/private**.
- Always **loads the latest content when it opens**, with a manual **Refresh**.

## For Sarrah (using the app)

1. Download the Apple Silicon macOS `.dmg` or Windows 11 `.exe` from the latest
   [GitHub release](https://github.com/chortis/sarrah-portfolio/releases).
2. Install and open the app.
3. On first launch, enter the GitHub and Cloudinary credentials in **Settings**.
   They are stored encrypted on the computer.
4. Pick a section on the left (Portfolio Videos, Client Work, Drawings, …).
5. Click **Add**, choose a video/image (or paste a YouTube link for client work),
   fill in the details, and click **Publish**.
6. Your website updates automatically a few minutes later.

> The installers are not code-signed. macOS and Windows may show a warning before
> the first launch; use the operating system's option to open the downloaded app.

## For the person setting it up (one-time)

Credentials are provided **locally at setup** and baked into the built app, so
Sarrah never has to authenticate.

1. Copy the env template and fill in real values:
   ```bash
   cd app
   cp .env.desktop.example .env.desktop
   # edit .env.desktop with the Cloudinary keys and a GitHub token
   ```
   - The **GitHub token** should be a fine-grained PAT with **Contents: read &
     write** on `chortis/sarrah-portfolio` only.
   - `.env.desktop` is gitignored — never commit it.

2. For a local test build, create installers:
   ```bash
   npm ci
   npm run package:mac    # produces a .dmg in release/
   npm run package:win    # produces a .exe installer in release/ (run on Windows)
   ```

   > If you skip `.env.desktop`, the app still works — it will show a one-time
   > Settings screen asking for the credentials, stored encrypted on the machine.

## Development

```bash
cd app
npm ci
npm run dev        # launches the app with hot reload
npm run typecheck  # type-check main + renderer
npm run build      # bundle without packaging
```

## Releases

Pushing a change under `app/` to `main` automatically builds the next patch
version on native Apple Silicon macOS and Windows x64 runners, then attaches the
`.dmg` and `.exe` installers to a GitHub release. The app bundles the matching
ffmpeg executable outside Electron's app archive so video encoding works after
installation. Release builds do not use `.env.desktop`, so a person installing
the app supplies credentials through its encrypted local Settings screen when
needed.

## How it works (technical)

- **Electron** app: a Node **main process** (privileged work) + a **React/TS
  renderer** (UI), connected by a typed IPC bridge (`contextIsolation` on).
- `src/main/services/` — `ffmpeg`, `cloudinary`, `github`, `markdown`, `config`.
- `src/shared/` — collection schemas (mirrors the site's `content.config.ts`) and
  the IPC contract.
- Publishing uses the **GitHub Git Data API** for atomic, multi-file commits
  (important for reordering). Every write re-checks the latest commit SHA first to
  avoid overwriting newer changes.
- Credentials are read from baked build-time env **or** encrypted on disk via
  Electron `safeStorage`; secrets never reach the renderer.

## Security note

The GitHub Release installers contain no credentials. **Do not share locally built
installers that use `.env.desktop`**, because that file bakes its credentials into
the app.
