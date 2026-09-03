# CSE 340 Service Network

A server-rendered website connecting volunteers with service opportunities in their
community. Built for CSE 340 (Web Backend Development) at BYU-Idaho.

**Live site:** https://cse340-bc.onrender.com

## Tech stack

| Layer | Technology |
| --- | --- |
| Runtime | Node.js (ES modules) |
| Server | Express 5 |
| Templating | EJS 6 |
| Styling | Hand-written CSS (no framework) |
| Dev tooling | nodemon |
| Hosting | Render.com |

## Project structure

```
cse340/
├── server.js                     Express app: config, middleware, routes
├── nodemon.json                  Dev watch config, loads .env
├── public/                       Static assets served at the site root
│   ├── css/main.css              Full stylesheet
│   └── images/                   Logos
└── src/
    └── views/                    EJS templates
        ├── home.ejs
        ├── organizations.ejs
        ├── projects.ejs
        ├── categories.ejs
        └── partials/
            ├── header.ejs        Doctype through <nav>
            └── footer.ejs        <footer> through </html>
```

Files in `public/` are served from the site root, so `public/css/main.css` is
requested as `/css/main.css`.

## Routes

| Path | View | Page title |
| --- | --- | --- |
| `/` | `home.ejs` | Home |
| `/organizations` | `organizations.ejs` | Our Partner Organizations |
| `/projects` | `projects.ejs` | Service Projects |
| `/categories` | `categories.ejs` | Service Project Categories |

Each route passes a `title` variable to `res.render()`. The header partial reads it
into the `<title>` tag, so every page gets its own browser tab label from one place.

## Getting started

**Requires Node.js 20.6 or later** — `nodemon.json` uses the built-in `--env-file`
flag, which is unavailable in earlier versions.

```bash
git clone https://github.com/archserver/cse340.git
cd cse340
npm install
```

Create a `.env` file in the project root:

```
PORT=3000
NODE_ENV=development
```

`.env` is gitignored and is never committed. In production, Render supplies `PORT`
and `NODE_ENV` through its own environment settings.

Start the development server:

```bash
npm run dev
```

The site is then available at http://127.0.0.1:3000.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start with nodemon; watches `.js`, `.css`, `.ejs`, and `.env` files and reloads on change. Loads `.env`. |
| `npm start` | Start once with plain `node`. Does **not** load `.env` — this is what Render runs. |

## Environment variables

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `3000` | Port the server binds to. Render assigns this automatically. |
| `NODE_ENV` | `production` | Environment name, logged at startup. |

The names are uppercase because they are read from the operating system, not
declared in application code. The local variables holding them (`hostPort`,
`nodeEnv`) follow the project's camelCase convention.

## Deployment

Hosted on Render.com with auto-deploy from the `main` branch of
`archserver/cse340`.

| Setting | Value |
| --- | --- |
| Build command | `npm install` |
| Start command | `npm start` |
| Environment | `PORT` and `NODE_ENV` set in the Render dashboard |

Pushing to `main` triggers a rebuild. Because Render assigns the port at runtime,
`server.js` must read `process.env.PORT` rather than hardcoding a value.

## Notes on the implementation

- **ES modules.** `package.json` sets `"type": "module"`, so the project uses
  `import`/`export` rather than `require`. `__dirname` is not defined in ES modules
  and is reconstructed in `server.js` from `import.meta.url`, which keeps paths
  correct on both Windows and Render's Linux containers.
- **Partials.** `header.ejs` and `footer.ejs` are included by every page, so shared
  markup such as the navigation is edited in one file. Neither is a complete
  document on its own; each page is valid only once the three are combined.
- **EJS output tags.** `<%-` is used only for the two `include()` calls, where raw
  markup must be inserted unescaped. All data uses `<%=`, which HTML-escapes its
  output and prevents injected markup from executing.
- **Responsive CSS.** The stylesheet uses custom properties for colors and spacing,
  `clamp()` for fluid type, and CSS grid for the card lists. Two breakpoints refine
  the phone and wide-desktop ends.
- **Accessibility.** Colors meet WCAG AA contrast, `:focus-visible` provides a
  keyboard focus ring, `prefers-reduced-motion` is respected, and the uppercase
  `h1` styling is applied with `text-transform` rather than typed as capitals, so
  screen readers read the word rather than spelling it out.

## Course

CSE 340 — Web Backend Development, Brigham Young University-Idaho.
